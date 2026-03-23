/**
 * Voice Answer Mode for Behavioral Tab
 * - Mic button to record a STAR answer
 * - Uploads audio to S3 via collab.uploadAudio
 * - Transcribes via Whisper and scores against L6/L7 rubric via ai.transcribeAndScoreVoice
 */
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Star,
  Volume2,
  RotateCcw,
} from "lucide-react";

interface VoiceAnswerModeProps {
  questionText: string;
  icMode?: "L6" | "L7";
}

type RecordingState =
  | "idle"
  | "recording"
  | "uploading"
  | "scoring"
  | "done"
  | "error";

function ScoreBar({
  label,
  value,
  max = 5,
  color = "bg-blue-500",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-foreground w-8 text-right">
        {value}/{max}
      </span>
    </div>
  );
}

function ICBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    L5: "bg-slate-500/20 border-slate-500/40 text-slate-300",
    L6: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    L7: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-xs font-bold ${colors[level] ?? colors.L6}`}
    >
      {level}
    </span>
  );
}

export function VoiceAnswerMode({
  questionText,
  icMode = "L6",
}: VoiceAnswerModeProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore] = useState<{
    situation: number;
    task: number;
    action: number;
    result: number;
    overallScore: number;
    level: string;
    verdict: string;
    strengths: string[];
    gaps: string[];
    coaching: string;
    starStructure: string;
  } | null>(null);

  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadAudio = trpc.collab.uploadAudio.useMutation();
  const transcribeAndScore = trpc.ai.transcribeAndScoreVoice.useMutation({
    onSuccess: data => {
      setTranscript(data.transcript);
      setScore({
        situation: data.situation,
        task: data.task,
        action: data.action,
        result: data.result,
        overallScore: data.overallScore,
        level: data.level,
        verdict: data.verdict,
        strengths: data.strengths,
        gaps: data.gaps,
        coaching: data.coaching,
        starStructure: data.starStructure,
      });
      setState("done");
    },
    onError: err => {
      toast.error(`Scoring failed: ${err.message}`);
      setState("error");
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Size check (16MB limit)
        if (blob.size > 16 * 1024 * 1024) {
          toast.error(
            "Recording is too long (16MB limit). Please keep answers under 5 minutes."
          );
          setState("idle");
          return;
        }

        // Store local blob URL for replay before uploading
        const localUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(localUrl);
        setState("uploading");

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const { url } = await uploadAudio.mutateAsync({
              audioBase64: base64,
              mimeType,
            });
            setState("scoring");
            transcribeAndScore.mutate({ audioUrl: url, questionText, icMode });
          } catch {
            toast.error("Upload failed. Please try again.");
            setState("error");
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      toast.error(
        "Microphone access denied. Please allow microphone access in your browser settings."
      );
    }
  }, [questionText, icMode, uploadAudio, transcribeAndScore]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTranscript(null);
    setScore(null);
    setDuration(0);
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlobUrl(null);
    chunksRef.current = [];
  }, [audioBlobUrl]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const scoreColor = (s: number) =>
    s >= 4
      ? "bg-emerald-500"
      : s >= 3
        ? "bg-blue-500"
        : s >= 2
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mic size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            Voice Answer Mode
          </span>
          <span className="text-xs text-muted-foreground">
            Record your STAR answer — AI scores it
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-blue-500/10">
          {/* Question reminder */}
          <div className="rounded-lg bg-background border border-border p-3 mt-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Question
            </div>
            <p className="text-xs text-foreground">{questionText}</p>
          </div>

          {/* Recording controls */}
          {state === "idle" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-xs text-muted-foreground text-center">
                Click the mic to start recording your answer. Aim for 2–3
                minutes covering all 4 STAR components.
              </p>
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30"
              >
                <Mic size={16} />
                Start Recording
              </button>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Volume2 size={10} />
                  Speak clearly
                </span>
                <span>·</span>
                <span>Max 5 min</span>
                <span>·</span>
                <span>IC{icMode === "L7" ? "7" : "6"} rubric</span>
              </div>
            </div>
          )}

          {state === "recording" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-red-400 font-bold">
                  {formatDuration(duration)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Recording…
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Cover: <span className="text-blue-300">Situation</span> →{" "}
                <span className="text-blue-300">Task</span> →{" "}
                <span className="text-blue-300">Action</span> →{" "}
                <span className="text-blue-300">Result</span>
              </p>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all"
              >
                <Square size={14} />
                Stop & Score
              </button>
            </div>
          )}

          {(state === "uploading" || state === "scoring") && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
              <p className="text-xs text-muted-foreground">
                {state === "uploading"
                  ? "Uploading audio…"
                  : "Transcribing and scoring your answer…"}
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <AlertTriangle size={20} className="text-red-400" />
              <p className="text-xs text-red-400">
                Something went wrong. Please try again.
              </p>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={12} /> Try again
              </button>
            </div>
          )}

          {state === "done" && score && transcript && (
            <div className="space-y-3">
              {/* Voice Replay Player */}
              {audioBlobUrl && (
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Replay Your Answer
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioBlobUrl}
                    controls
                    className="w-full"
                    style={{ colorScheme: "dark", height: 32 }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Listen for filler words, pacing issues, and missing STAR
                    components before reviewing your score below.
                  </p>
                </div>
              )}
              {/* Transcript */}
              <div className="rounded-lg bg-background border border-border p-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Transcript
                </div>
                <p className="text-xs text-foreground leading-relaxed max-h-32 overflow-y-auto">
                  {transcript}
                </p>
              </div>

              {/* Scorecard */}
              <div className="rounded-lg bg-background border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={13} className="text-amber-400" />
                    <span className="text-xs font-bold text-foreground">
                      STAR Scorecard
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ICBadge level={score.level} />
                    <span
                      className={`text-lg font-black ${score.overallScore >= 4 ? "text-emerald-400" : score.overallScore >= 3 ? "text-blue-400" : score.overallScore >= 2 ? "text-amber-400" : "text-red-400"}`}
                    >
                      {score.overallScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">/5</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  "{score.verdict}"
                </p>

                <div className="space-y-1.5">
                  <ScoreBar
                    label="Situation"
                    value={score.situation}
                    color={scoreColor(score.situation)}
                  />
                  <ScoreBar
                    label="Task"
                    value={score.task}
                    color={scoreColor(score.task)}
                  />
                  <ScoreBar
                    label="Action"
                    value={score.action}
                    color={scoreColor(score.action)}
                  />
                  <ScoreBar
                    label="Result"
                    value={score.result}
                    color={scoreColor(score.result)}
                  />
                </div>

                <div className="text-[10px] text-muted-foreground bg-secondary/30 rounded p-2">
                  <span className="font-semibold text-foreground">
                    STAR Structure:{" "}
                  </span>
                  {score.starStructure}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Strengths
                  </div>
                  {score.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <CheckCircle
                        size={9}
                        className="text-emerald-400 shrink-0 mt-0.5"
                      />
                      <span className="text-[10px] text-foreground">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Gaps
                  </div>
                  {score.gaps.map((g, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <AlertTriangle
                        size={9}
                        className="text-red-400 shrink-0 mt-0.5"
                      />
                      <span className="text-[10px] text-foreground">{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaching note */}
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                  Coaching Note
                </div>
                <p className="text-xs text-foreground">{score.coaching}</p>
              </div>

              {/* Try again */}
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={12} /> Record another attempt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
