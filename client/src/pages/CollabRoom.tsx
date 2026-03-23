// CollabRoom — Real-time collaborative mock system design interview
// Features: shared whiteboard, live chat, AI Interviewer Mode, Session Replay, Interviewer Scorecard
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { io, Socket } from "socket.io-client";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Send,
  Play,
  Pause,
  RotateCcw,
  Download,
  Bot,
  ClipboardList,
  Users,
  MessageSquare,
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  ChevronRight,
  X,
  Loader2,
  Star,
  SkipForward,
  Volume2,
  Clock,
} from "lucide-react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";

// ── Types ──────────────────────────────────────────────────────────────────
type DrawEvent = {
  type: "draw" | "erase" | "clear";
  x?: number;
  y?: number;
  px?: number;
  py?: number;
  color?: string;
  size?: number;
};
type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  ts: number;
  isAI?: boolean;
};
type ReplayEvent = { ts: number; type: string; data: unknown };
type ScorecardData = {
  requirements: number;
  architecture: number;
  scalability: number;
  communication: number;
  notes: string;
};

// ── Lobby ──────────────────────────────────────────────────────────────────
function Lobby({
  onJoin,
}: {
  onJoin: (
    roomId: string,
    name: string,
    role: "candidate" | "interviewer" | "solo"
  ) => void;
}) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState<"candidate" | "interviewer" | "solo">(
    "candidate"
  );
  const [creating, setCreating] = useState(false);
  const createRoom = trpc.collab.createRoom.useMutation();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Enter your name");
      return;
    }
    setCreating(true);
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const res = await createRoom.mutateAsync({
        roomCode,
        questionTitle: SYSTEM_DESIGN_QUESTIONS[0].title,
        mode: role === "solo" ? "ai" : "human",
      });
      onJoin(res.roomCode, name, role);
    } catch {
      toast.error("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    if (!name.trim()) {
      toast.error("Enter your name");
      return;
    }
    if (!roomId.trim()) {
      toast.error("Enter a room code");
      return;
    }
    onJoin(roomId.trim().toUpperCase(), name, role);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Collaborative Mock Interview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time system design practice with a peer or AI
          </p>
        </div>

        <div className="prep-card p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Your Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["candidate", "interviewer", "solo"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all capitalize ${role === r ? "bg-blue-600 border-blue-500 text-white" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {r === "solo" ? "⚡ Solo (AI)" : r}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Create New Room
            </button>
            <div className="flex gap-2">
              <input
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                placeholder="Room code (e.g. ABC123)"
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={handleJoin}
                className="px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Solo mode uses AI as your interviewer — no peer needed.
        </p>
      </div>
    </div>
  );
}

// ── Whiteboard ─────────────────────────────────────────────────────────────
function Whiteboard({
  socket,
  roomId,
  onEvent,
}: {
  socket: Socket | null;
  roomId: string;
  onEvent: (e: ReplayEvent) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#60a5fa");
  const [size, setSize] = useState(3);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      c: string,
      s: number,
      erase: boolean
    ) => {
      ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
      ctx.strokeStyle = c;
      ctx.lineWidth = erase ? s * 4 : s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    },
    []
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("draw", (e: DrawEvent) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (e.type === "clear") {
        ctx.clearRect(
          0,
          0,
          canvasRef.current!.width,
          canvasRef.current!.height
        );
        return;
      }
      if (
        e.x !== undefined &&
        e.y !== undefined &&
        e.px !== undefined &&
        e.py !== undefined
      ) {
        drawLine(
          ctx,
          e.px,
          e.py,
          e.x,
          e.y,
          e.color ?? "#60a5fa",
          e.size ?? 3,
          e.type === "erase"
        );
      }
    });
    return () => {
      socket.off("draw");
    };
  }, [socket, drawLine]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !lastPos.current) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawLine(
      ctx,
      lastPos.current.x,
      lastPos.current.y,
      pos.x,
      pos.y,
      color,
      size,
      tool === "eraser"
    );
    const event: DrawEvent = {
      type: tool === "eraser" ? "erase" : "draw",
      x: pos.x,
      y: pos.y,
      px: lastPos.current.x,
      py: lastPos.current.y,
      color,
      size,
    };
    socket?.emit("draw", { roomId, event });
    onEvent({ ts: Date.now(), type: "draw", data: event });
    lastPos.current = pos;
  };

  const handleMouseUp = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx)
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    socket?.emit("draw", { roomId, event: { type: "clear" } });
    onEvent({ ts: Date.now(), type: "draw", data: { type: "clear" } });
  };

  const colors = [
    "#60a5fa",
    "#34d399",
    "#f59e0b",
    "#f87171",
    "#a78bfa",
    "#ffffff",
    "#94a3b8",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-secondary/30 flex-wrap">
        <button
          onClick={() => setTool("pen")}
          className={`p-1.5 rounded ${tool === "pen" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`p-1.5 rounded ${tool === "eraser" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Eraser size={14} />
        </button>
        <div className="w-px h-4 bg-border" />
        {colors.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
            style={{ background: c }}
          />
        ))}
        <div className="w-px h-4 bg-border" />
        {[2, 4, 8].map(s => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`p-1 rounded text-xs font-mono ${size === s ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            {s}px
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-red-500/10 transition-all"
          >
            <RotateCcw size={12} /> Clear
          </button>
        </div>
      </div>
      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#0f1117]">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}

// ── Chat Panel ─────────────────────────────────────────────────────────────
function ChatPanel({
  messages,
  onSend,
  myName,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  myName: string;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-xs text-muted-foreground pt-8">
            Chat will appear here
          </div>
        )}
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === myName ? "items-end" : "items-start"}`}
          >
            <div
              className={`text-xs text-muted-foreground mb-0.5 ${m.isAI ? "text-blue-400" : ""}`}
            >
              {m.isAI ? "🤖 AI Interviewer" : m.sender}
            </div>
            <div
              className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                m.isAI
                  ? "bg-blue-500/15 border border-blue-500/20 text-blue-100"
                  : m.sender === myName
                    ? "bg-blue-600 text-white"
                    : "bg-secondary text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ── AI Interviewer Panel ───────────────────────────────────────────────────
function AIInterviewerPanel({
  questionTitle,
  onAIMessage,
  transcript,
}: {
  questionTitle: string;
  onAIMessage: (msg: string) => void;
  transcript: { role: "interviewer" | "candidate"; text: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const askFollowUp = trpc.collab.aiFollowUp.useMutation();
  const getFeedback = trpc.collab.aiFinalFeedback.useMutation();

  const handleFollowUp = async () => {
    setLoading(true);
    try {
      const res = await askFollowUp.mutateAsync({
        questionTitle,
        transcript,
        weakAreas,
      });
      onAIMessage(
        typeof res.question === "string"
          ? res.question
          : "Can you elaborate on your approach to handling failures in this system?"
      );
    } catch {
      toast.error("AI unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    setLoading(true);
    try {
      const res = await getFeedback.mutateAsync({
        questionTitle,
        transcript,
        durationMinutes: Math.round(transcript.length * 0.5),
      });
      onAIMessage(
        `📋 **Feedback (${res.level}):** ${res.summary} Strengths: ${res.strengths.join(", ")}. Improve: ${res.improvements.join(", ")}.`
      );
    } catch {
      toast.error("AI unavailable");
    } finally {
      setLoading(false);
    }
  };

  const areas = [
    "Requirements",
    "Scalability",
    "Data Model",
    "API Design",
    "Trade-offs",
    "Failure Modes",
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
        <Bot size={13} /> AI Interviewer Controls
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">
          Mark weak areas to probe:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {areas.map(a => (
            <button
              key={a}
              onClick={() =>
                setWeakAreas(prev =>
                  prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
                )
              }
              className={`px-2 py-0.5 rounded text-xs border transition-all ${weakAreas.includes(a) ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleFollowUp}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ChevronRight size={12} />
          )}
          Ask Follow-up
        </button>
        <button
          onClick={handleFeedback}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Volume2 size={12} />
          )}
          Get Feedback
        </button>
      </div>
    </div>
  );
}

// ── Scorecard Panel ────────────────────────────────────────────────────────
function ScorecardPanel({
  roomCode,
  scorerName,
  candidateName,
  onSubmit,
}: {
  roomCode: string;
  scorerName: string;
  candidateName: string;
  onSubmit: (report: string) => void;
}) {
  const [scores, setScores] = useState<ScorecardData>({
    requirements: 3,
    architecture: 3,
    scalability: 3,
    communication: 3,
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState("");
  const saveScorecard = trpc.collab.saveScorecard.useMutation();

  const dims: { key: keyof ScorecardData; label: string; desc: string }[] = [
    {
      key: "requirements",
      label: "Requirements Clarity",
      desc: "Did they clarify scope, users, scale, and constraints?",
    },
    {
      key: "architecture",
      label: "Architecture Quality",
      desc: "Was the high-level design sound and well-reasoned?",
    },
    {
      key: "scalability",
      label: "Scalability Thinking",
      desc: "Did they address bottlenecks, sharding, caching, replication?",
    },
    {
      key: "communication",
      label: "Communication",
      desc: "Clear narration, structured thinking, responded well to probes?",
    },
  ];

  const avg =
    Math.round(
      ((scores.requirements +
        scores.architecture +
        scores.scalability +
        scores.communication) /
        4) *
        10
    ) / 10;

  const handleSubmit = async () => {
    try {
      const res = await saveScorecard.mutateAsync({
        roomCode,
        scorerName,
        candidateName,
        requirementsScore: scores.requirements,
        architectureScore: scores.architecture,
        scalabilityScore: scores.scalability,
        communicationScore: scores.communication,
        overallFeedback: scores.notes,
      });
      const rpt = `Overall: ${res.avg}/5\n\n${res.aiCoachingNote}`;
      setReport(rpt);
      setSubmitted(true);
      onSubmit(rpt);
      toast.success("Scorecard submitted!");
    } catch {
      toast.error("Failed to submit scorecard");
    }
  };

  if (submitted) {
    return (
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <ClipboardList size={13} /> Scorecard Submitted
        </div>
        <div className="p-3 rounded-lg bg-secondary border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed">
          {report}
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            setReport("");
          }}
          className="w-full py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
        >
          Edit Scorecard
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <ClipboardList size={13} /> Interviewer Scorecard
      </div>
      <div className="text-xs text-muted-foreground">
        Evaluating:{" "}
        <span className="text-foreground font-semibold">
          {candidateName || "Candidate"}
        </span>
      </div>

      {dims.map(d => (
        <div key={d.key} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {d.label}
            </span>
            <span className="text-xs font-bold text-blue-400">
              {scores[d.key as keyof Omit<ScorecardData, "notes">]}/5
            </span>
          </div>
          <div className="text-xs text-muted-foreground mb-1">{d.desc}</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                onClick={() => setScores(prev => ({ ...prev, [d.key]: v }))}
                className={`flex-1 py-1.5 rounded text-xs font-bold border transition-all ${
                  (scores[
                    d.key as keyof Omit<ScorecardData, "notes">
                  ] as number) >= v
                    ? v <= 2
                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                      : v <= 3
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                        : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <div className="text-xs font-semibold text-foreground mb-1">
          Overall Notes
        </div>
        <textarea
          value={scores.notes}
          onChange={e =>
            setScores(prev => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Key observations, specific examples, coaching notes..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-muted-foreground">
          Overall avg:{" "}
          <span
            className={`font-bold ${avg >= 4 ? "text-emerald-400" : avg >= 3 ? "text-amber-400" : "text-red-400"}`}
          >
            {avg}/5
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saveScorecard.isPending}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {saveScorecard.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Star size={12} />
          )}
          Submit Report
        </button>
      </div>
    </div>
  );
}

// ── Session Replay ─────────────────────────────────────────────────────────
function SessionReplay({
  events,
  onClose,
}: {
  events: ReplayEvent[];
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawEvents = useCallback(
    (upToIdx: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, 1200, 800);
      const drawEvts = events
        .slice(0, upToIdx + 1)
        .filter(e => e.type === "draw");
      drawEvts.forEach(e => {
        const d = e.data as DrawEvent;
        if (d.type === "clear") {
          ctx.clearRect(0, 0, 1200, 800);
          return;
        }
        if (
          d.x !== undefined &&
          d.y !== undefined &&
          d.px !== undefined &&
          d.py !== undefined
        ) {
          ctx.globalCompositeOperation =
            d.type === "erase" ? "destination-out" : "source-over";
          ctx.strokeStyle = d.color ?? "#60a5fa";
          ctx.lineWidth =
            d.type === "erase" ? (d.size ?? 3) * 4 : (d.size ?? 3);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(d.px, d.py);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
      });
    },
    [events]
  );

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIdx(i => {
          if (i >= events.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, events.length]);

  useEffect(() => {
    drawEvents(idx);
  }, [idx, drawEvents]);

  const duration =
    events.length > 0 ? events[events.length - 1].ts - events[0].ts : 0;
  const currentTs = events[idx]?.ts ?? 0;
  const elapsed = events.length > 0 ? currentTs - events[0].ts : 0;
  const fmt = (ms: number) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current?.toDataURL() ?? "";
    a.download = "whiteboard-snapshot.png";
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-background rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">
            Session Replay
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-secondary transition-all"
            >
              <Download size={12} /> Save snapshot
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="bg-[#0f1117] aspect-video relative">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full"
          />
          {events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No events recorded yet
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border space-y-2">
          <input
            type="range"
            min={0}
            max={Math.max(events.length - 1, 0)}
            value={idx}
            onChange={e => {
              setPlaying(false);
              setIdx(Number(e.target.value));
            }}
            className="w-full accent-blue-500"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIdx(0)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setPlaying(p => !p)}
              className="p-1.5 rounded-lg bg-blue-600 text-white"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => setIdx(events.length - 1)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <SkipForward size={14} />
            </button>
            <span className="text-xs text-muted-foreground font-mono">
              {fmt(elapsed)} / {fmt(duration)}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {events.length} events
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main CollabRoom ────────────────────────────────────────────────────────
export default function CollabRoom() {
  const params = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();

  const [joined, setJoined] = useState(false);
  const [myName, setMyName] = useState("");
  const [myRole, setMyRole] = useState<"candidate" | "interviewer" | "solo">(
    "candidate"
  );
  const [roomId, setRoomId] = useState(params.roomId ?? "");
  const [peers, setPeers] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiTranscript, setAiTranscript] = useState<
    { role: "interviewer" | "candidate"; text: string }[]
  >([]);
  const [replayEvents, setReplayEvents] = useState<ReplayEvent[]>([]);
  const [showReplay, setShowReplay] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "ai" | "scorecard">(
    "chat"
  );
  const [questionTitle, setQuestionTitle] = useState(
    SYSTEM_DESIGN_QUESTIONS[0].title
  );
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const fmtTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleJoin = (
    rid: string,
    name: string,
    role: "candidate" | "interviewer" | "solo"
  ) => {
    setMyName(name);
    setMyRole(role);
    setRoomId(rid);
    navigate(`/room/${rid}`);

    // Connect socket
    const socket = io({ path: "/api/socket.io", transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { roomId: rid, name, role });
      toast.success(`Joined room ${rid}`);
    });

    socket.on("peers", (p: string[]) => setPeers(p));

    socket.on("chat", (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("disconnect", () => toast.error("Disconnected from room"));

    setJoined(true);
    setTimerRunning(true);

    // Solo mode: AI sends opening question
    if (role === "solo") {
      setTimeout(() => {
        const opening: ChatMessage = {
          id: crypto.randomUUID(),
          sender: "AI",
          text: `Let's begin. The question is: **${SYSTEM_DESIGN_QUESTIONS[0].title}**. Please start by clarifying the requirements — what are the key use cases and scale constraints you'd like to design for?`,
          ts: Date.now(),
          isAI: true,
        };
        setMessages(prev => [...prev, opening]);
        setAiTranscript([{ role: "interviewer" as const, text: opening.text }]);
      }, 1000);
    }
  };

  const handleSendChat = (text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: myName,
      text,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    socketRef.current?.emit("chat", { roomId, message: msg });
    setAiTranscript(prev => [
      ...prev,
      {
        role:
          myRole === "interviewer"
            ? ("interviewer" as const)
            : ("candidate" as const),
        text,
      },
    ]);
    setReplayEvents(prev => [
      ...prev,
      { ts: Date.now(), type: "chat", data: msg },
    ]);
  };

  const handleAIMessage = (text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "AI",
      text,
      ts: Date.now(),
      isAI: true,
    };
    setMessages(prev => [...prev, msg]);
    setAiTranscript(prev => [...prev, { role: "interviewer" as const, text }]);
  };

  const handleDrawEvent = (e: ReplayEvent) => {
    setReplayEvents(prev => [...prev, e]);
  };

  const handleScorecardSubmit = (report: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "AI",
      text: `📋 Scorecard submitted!\n\n${report}`,
      ts: Date.now(),
      isAI: true,
    };
    setMessages(prev => [...prev, msg]);
  };

  if (!joined) {
    return <Lobby onJoin={handleJoin} />;
  }

  const candidateName =
    myRole === "interviewer" ? (peers[0] ?? "Candidate") : myName;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={16} />
          </button>
          <div>
            <div className="text-sm font-bold text-foreground">
              Room: <span className="font-mono text-blue-400">{roomId}</span>
            </div>
            <div className="text-xs text-muted-foreground">{questionTitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Question selector */}
          <select
            value={questionTitle}
            onChange={e => setQuestionTitle(e.target.value)}
            className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground focus:outline-none max-w-[200px]"
          >
            {SYSTEM_DESIGN_QUESTIONS.map(q => (
              <option key={q.title} value={q.title}>
                {q.title}
              </option>
            ))}
          </select>
          {/* Timer */}
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-muted-foreground" />
            <span
              className={`font-mono text-sm font-bold ${timer > 2700 ? "text-red-400" : "text-foreground"}`}
            >
              {fmtTimer(timer)}
            </span>
            <button
              onClick={() => setTimerRunning(r => !r)}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              {timerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={() => {
                setTimer(0);
                setTimerRunning(false);
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          {/* Peers */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={12} />
            <span>{peers.length + 1}</span>
          </div>
          {/* Replay */}
          <button
            onClick={() => setShowReplay(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <Play size={11} /> Replay
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Whiteboard */}
        <div className="flex-1 min-w-0 border-r border-border">
          <Whiteboard
            socket={socketRef.current}
            roomId={roomId}
            onEvent={handleDrawEvent}
          />
        </div>

        {/* Right panel */}
        <div className="w-80 flex flex-col shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-border shrink-0">
            {(
              [
                { id: "chat", icon: MessageSquare, label: "Chat" },
                { id: "ai", icon: Bot, label: "AI" },
                { id: "scorecard", icon: ClipboardList, label: "Score" },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activePanel === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === "chat" && (
              <ChatPanel
                messages={messages}
                onSend={handleSendChat}
                myName={myName}
              />
            )}
            {activePanel === "ai" && (
              <div className="overflow-y-auto h-full">
                <AIInterviewerPanel
                  questionTitle={questionTitle}
                  onAIMessage={handleAIMessage}
                  transcript={aiTranscript}
                />
              </div>
            )}
            {activePanel === "scorecard" && (
              <div className="overflow-y-auto h-full">
                <ScorecardPanel
                  roomCode={roomId}
                  scorerName={myName}
                  candidateName={candidateName}
                  onSubmit={handleScorecardSubmit}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Replay modal */}
      {showReplay && (
        <SessionReplay
          events={replayEvents}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
}
