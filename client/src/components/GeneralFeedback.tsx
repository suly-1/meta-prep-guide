/**
 * General Feedback Component
 * Collects site-wide improvement suggestions from users.
 * Feedback is stored in DB and notifies the site owner.
 * Appears as a compact floating button + modal.
 */
import { useState } from "react";
import {
  MessageSquarePlus,
  X,
  Send,
  CheckCircle2,
  Lightbulb,
  Bug,
  Star,
  ThumbsUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type FeedbackCategory = "bug" | "content" | "ux" | "feature_request" | "other";

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "feature_request",
    label: "Feature Request",
    icon: <Star size={12} />,
    color: "text-blue-400",
  },
  {
    id: "content",
    label: "Content Issue",
    icon: <ThumbsUp size={12} />,
    color: "text-purple-400",
  },
  {
    id: "bug",
    label: "Bug Report",
    icon: <Bug size={12} />,
    color: "text-red-400",
  },
  {
    id: "ux",
    label: "UX Feedback",
    icon: <MessageSquarePlus size={12} />,
    color: "text-emerald-400",
  },
  {
    id: "other",
    label: "Other",
    icon: <Lightbulb size={12} />,
    color: "text-amber-400",
  },
];

interface Props {
  /** If true, renders as an inline card instead of a floating button */
  inline?: boolean;
}

export function GeneralFeedback({ inline = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("feature_request");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.feedback.submitGeneral.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage("");
        setRating(0);
        setCategory("feature_request");
      }, 2500);
    },
    onError: () => toast.error("Failed to submit feedback. Please try again."),
  });

  const handleSubmit = () => {
    if (message.trim().length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }
    submitMutation.mutate({
      category,
      message: message.trim(),
      page: window.location.pathname,
    });
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="prep-card w-full max-w-md p-5 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">
              Thank you for your feedback!
            </p>
            <p className="text-xs text-muted-foreground">
              Your suggestion helps improve this guide for all candidates.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquarePlus size={16} className="text-blue-400" />
              <div>
                <h3
                  className="text-sm font-bold text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Share Your Feedback
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Help improve this guide for all Meta candidates
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                    category === cat.id
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-border text-muted-foreground hover:border-blue-500/40"
                  }`}
                >
                  <span className={cat.color}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Overall rating */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1.5">
                Overall rating (optional)
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setRating(s === rating ? 0 : s)}
                    className={`text-xl transition-all ${
                      s <= rating
                        ? "text-amber-400"
                        : "text-muted-foreground/30 hover:text-muted-foreground/60"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={
                category === "bug"
                  ? "Describe the bug: what happened, what you expected, and steps to reproduce..."
                  : category === "feature_request"
                    ? "What feature would you like to see? How would it help your prep?"
                    : category === "content"
                      ? "What content is incorrect, outdated, or missing?"
                      : "What would make this guide more useful for your Meta interview prep?"
              }
              className="w-full h-28 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <div className="flex items-center justify-between mt-1 mb-3">
              <span
                className={`text-[10px] ${message.length < 10 ? "text-muted-foreground/40" : "text-muted-foreground"}`}
              >
                {message.length} chars {message.length < 10 && `(min 10)`}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitMutation.isPending || message.trim().length < 10
                }
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={12} /> Send Feedback
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <>
        <div className="prep-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquarePlus size={15} className="text-blue-400" />
            <div>
              <h3
                className="text-sm font-bold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Improve This Guide
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Your feedback shapes future updates
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold transition-all"
          >
            <MessageSquarePlus size={14} /> Share Feedback or Suggestion
          </button>
        </div>
        {isOpen && modal}
      </>
    );
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
        title="Share feedback or suggestions"
      >
        <MessageSquarePlus size={14} />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      {isOpen && modal}
    </>
  );
}
