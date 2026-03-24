/**
 * FavoriteQuestions — shows all saved favorites grouped by type.
 * Includes a quick-practice mode that cycles through favorites one by one.
 */
import { useState } from "react";
import {
  Heart,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Trash2,
  StickyNote,
  X,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type QuestionType = "coding" | "behavioral" | "design" | "ctci";

const TYPE_LABELS: Record<
  QuestionType,
  { label: string; color: string; emoji: string }
> = {
  coding: { label: "Coding Patterns", color: "text-blue-400", emoji: "💻" },
  behavioral: {
    label: "Behavioral Questions",
    color: "text-emerald-400",
    emoji: "🎯",
  },
  design: { label: "System Design", color: "text-purple-400", emoji: "🏗️" },
  ctci: { label: "CTCI Problems", color: "text-amber-400", emoji: "📖" },
};

export function FavoriteQuestions() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: favorites = [], isLoading } = trpc.favorites.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const removeMutation = trpc.favorites.remove.useMutation({
    onMutate: async ({ questionId }) => {
      await utils.favorites.list.cancel();
      const prev = utils.favorites.list.getData();
      utils.favorites.list.setData(undefined, old =>
        old ? old.filter(f => f.questionId !== questionId) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.favorites.list.setData(undefined, ctx.prev);
      toast.error("Could not remove favorite");
    },
    onSuccess: () => toast.success("Removed from favorites"),
    onSettled: () => utils.favorites.list.invalidate(),
  });

  const updateNotesMutation = trpc.favorites.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Note saved");
      utils.favorites.list.invalidate();
    },
  });

  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");

  const filtered =
    filterType === "all"
      ? favorites
      : favorites.filter(f => f.questionType === filterType);

  // Group by type
  const grouped = filtered.reduce(
    (acc, fav) => {
      const type = fav.questionType as QuestionType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(fav);
      return acc;
    },
    {} as Record<QuestionType, typeof favorites>
  );

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
        <Heart size={32} className="text-rose-400 mx-auto" />
        <p className="font-semibold text-foreground">
          Sign in to save favorites
        </p>
        <p className="text-sm text-muted-foreground">
          Bookmark coding patterns, behavioral questions, and system design
          topics for focused practice.
        </p>
        <a
          href={getLoginUrl()}
          className="inline-block mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-3 bg-muted rounded w-2/3 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
        <Heart size={32} className="text-muted-foreground mx-auto" />
        <p className="font-semibold text-foreground">No favorites yet</p>
        <p className="text-sm text-muted-foreground">
          Click the ♥ icon on any coding pattern, behavioral question, or
          system design topic to save it here.
        </p>
      </div>
    );
  }

  // Practice mode
  if (practiceMode && filtered.length > 0) {
    const current = filtered[practiceIndex % filtered.length];
    const meta = TYPE_LABELS[current.questionType as QuestionType];
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-blue-400" />
            <span className="text-sm font-semibold text-foreground">
              Practice Mode — {practiceIndex + 1} / {filtered.length}
            </span>
          </div>
          <button
            onClick={() => setPracticeMode(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Card */}
        <div className="p-6 space-y-4 min-h-[200px] flex flex-col justify-between">
          <div className="space-y-2">
            <div
              className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}
            >
              {meta.emoji} {meta.label}
            </div>
            <p className="text-lg font-medium text-foreground leading-relaxed">
              {current.questionText}
            </p>
            {current.notes && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <span className="font-semibold">Your note:</span>{" "}
                {current.notes}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() =>
                setPracticeIndex(
                  i => (i - 1 + filtered.length) % filtered.length
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <div className="flex gap-1">
              {filtered.slice(0, Math.min(filtered.length, 10)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPracticeIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === practiceIndex % filtered.length
                      ? "bg-blue-400"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
              {filtered.length > 10 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{filtered.length - 10}
                </span>
              )}
            </div>
            <button
              onClick={() => setPracticeIndex(i => (i + 1) % filtered.length)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Heart size={15} className="text-rose-400 fill-rose-400" />
          <span className="text-sm font-semibold text-foreground">
            Saved Favorites ({favorites.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={e =>
              setFilterType(e.target.value as QuestionType | "all")
            }
            className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground"
          >
            <option value="all">All types</option>
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map(t => (
              <option key={t} value={t}>
                {TYPE_LABELS[t].emoji} {TYPE_LABELS[t].label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setPracticeMode(true);
              setPracticeIndex(0);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            <BookOpen size={12} /> Practice All
          </button>
        </div>
      </div>

      {/* Grouped list */}
      <div className="divide-y divide-border">
        {(Object.keys(grouped) as QuestionType[]).map(type => {
          const meta = TYPE_LABELS[type];
          const items = grouped[type];
          return (
            <div key={type} className="p-4 space-y-2">
              <div
                className={`text-xs font-bold uppercase tracking-wider ${meta.color} mb-3`}
              >
                {meta.emoji} {meta.label} ({items.length})
              </div>
              {items.map(fav => (
                <div
                  key={fav.id}
                  className="group flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-foreground leading-snug">
                      {fav.questionText}
                    </p>
                    {fav.notes && editingNoteId !== fav.questionId && (
                      <p className="text-xs text-amber-300/80 italic">
                        "{fav.notes}"
                      </p>
                    )}
                    {editingNoteId === fav.questionId && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          autoFocus
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add a personal note…"
                          className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              updateNotesMutation.mutate({
                                questionId: fav.questionId,
                                notes: noteText,
                              });
                              setEditingNoteId(null);
                            }
                            if (e.key === "Escape") setEditingNoteId(null);
                          }}
                        />
                        <button
                          onClick={() => {
                            updateNotesMutation.mutate({
                              questionId: fav.questionId,
                              notes: noteText,
                            });
                            setEditingNoteId(null);
                          }}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => {
                        setEditingNoteId(fav.questionId);
                        setNoteText(fav.notes ?? "");
                      }}
                      title="Add note"
                      className="p-1 rounded text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      <StickyNote size={13} />
                    </button>
                    <button
                      onClick={() =>
                        removeMutation.mutate({ questionId: fav.questionId })
                      }
                      title="Remove"
                      className="p-1 rounded text-muted-foreground hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
