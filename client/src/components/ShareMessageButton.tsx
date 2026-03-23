import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

const SHARE_MESSAGE = `Found this independent community study resource online — it's not affiliated with Meta and covers general SWE interview patterns for L4–L7 levels at FAANG companies. Totally optional, always refer to the official prep materials your recruiter sent. Sharing just as a supplement.

🔗 https://www.metaguide.blog`;

export default function ShareMessageButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = SHARE_MESSAGE;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="prep-card p-3 flex flex-col sm:flex-row sm:items-center gap-3 border-blue-500/20 bg-blue-500/5">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <Share2 size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-400 mb-0.5">
            Sharing this guide?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use this ready-made message to make clear it&apos;s an independent
            community resource — not affiliated with any company.
          </p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
          copied
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
        }`}
      >
        {copied ? (
          <>
            <Check size={12} />
            Copied!
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy share message
          </>
        )}
      </button>
    </div>
  );
}
