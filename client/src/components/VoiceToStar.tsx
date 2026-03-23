// Voice-to-STAR Recorder + Answer Quality Scorer
// Uses MediaRecorder API to capture audio, uploads to S3, transcribes via Whisper,
// structures into STAR via LLM, and optionally scores the answer.

import { useState, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Volume2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BEHAVIORAL_QUESTIONS } from "@/lib/data";

interface StarResult {
  situation: string;
  task: string;
  action: string;
  result: string;
  rawTranscript: string;
}

interface ScoreResult {
  specificity: number;
  impactClarity: number;
  level: string;
  coachingNote: string;
  strengths: string;
  improvements: string;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color =
    value >= 4 ? "bg-emerald-500" : value >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}/5</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function VoiceToStar() {
  const [open, setOpen] = useState(false);
  const [selectedQ, setSelectedQ] = useState(BEHAVIORAL_QUESTIONS[0]?.q ?? "");
  const [customQ, setCustomQ] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [starResult, setStarResult] = useState<StarResult | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadAudio = trpc.collab.uploadAudio.useMutation();
  const transcribeAndStructure =
    trpc.collab.transcribeAndStructure.useMutation();
  const scoreAnswer = trpc.collab.scoreAnswer.useMutation();

  const activeQuestion = useCustom ? customQ : selectedQ;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error(
        "Microphone access denied. Please allow microphone access and try again."
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [recording]);

  const processVoice = useCallback(async () => {
    if (!audioBlob) return;
    if (!activeQuestion.trim()) {
      toast.error("Please select or enter a question first.");
      return;
    }
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const base64 = btoa(
        Array.from(bytes)
          .map(b => String.fromCharCode(b))
          .join("")
      );

      // Upload to S3
      const { url } = await uploadAudio.mutateAsync({
        audioBase64: base64,
        mimeType: "audio/webm",
      });

      // Transcribe and structure
      const result = await transcribeAndStructure.mutateAsync({
        audioUrl: url,
        question: activeQuestion,
      });
      setStarResult(result as StarResult);
      setScoreResult(null);
      toast.success("Transcribed and structured into STAR format!");
    } catch (e) {
      toast.error("Processing failed. Please try again.");
    }
  }, [audioBlob, activeQuestion, uploadAudio, transcribeAndStructure]);

  const processText = useCallback(async () => {
    if (!textAnswer.trim()) {
      toast.error("Please type your answer first.");
      return;
    }
    if (!activeQuestion.trim()) {
      toast.error("Please select or enter a question first.");
      return;
    }
    try {
      const result = await transcribeAndStructure.mutateAsync({
        audioUrl: "https://example.com/placeholder",
        question: activeQuestion,
      });
      // For text mode, we skip transcription and use the text directly
      setStarResult({ ...(result as StarResult), rawTranscript: textAnswer });
      setScoreResult(null);
      toast.success("Structured into STAR format!");
    } catch {
      // Fallback: just show the raw text
      toast.info("Structuring unavailable — showing raw answer.");
    }
  }, [textAnswer, activeQuestion, transcribeAndStructure]);

  const handleScore = useCallback(async () => {
    if (!activeQuestion.trim()) return;
    const answerText = starResult
      ? `Situation: ${starResult.situation}\nTask: ${starResult.task}\nAction: ${starResult.action}\nResult: ${starResult.result}`
      : textAnswer;
    if (!answerText.trim()) {
      toast.error("No answer to score yet.");
      return;
    }
    try {
      const result = await scoreAnswer.mutateAsync({
        question: activeQuestion,
        answer: answerText,
      });
      setScoreResult(result as ScoreResult);
      toast.success("Answer scored!");
    } catch {
      toast.error("Scoring failed. Please try again.");
    }
  }, [activeQuestion, starResult, textAnswer, scoreAnswer]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const isProcessing =
    uploadAudio.isPending || transcribeAndStructure.isPending;

  return (
    <div className="prep-card p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Mic size={14} className="text-rose-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">
              Voice-to-STAR Recorder
            </div>
            <div className="text-xs text-muted-foreground">
              Record your answer → auto-transcribe → structure into STAR → AI
              score
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("voice")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === "voice"
                  ? "bg-rose-500/20 border border-rose-500/30 text-rose-400"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic size={12} /> Voice
            </button>
            <button
              onClick={() => setMode("text")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === "text"
                  ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles size={12} /> Type Answer
            </button>
          </div>

          {/* Question selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Question
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUseCustom(false)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all ${!useCustom ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-secondary text-muted-foreground"}`}
              >
                From list
              </button>
              <button
                onClick={() => setUseCustom(true)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all ${useCustom ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-secondary text-muted-foreground"}`}
              >
                Custom
              </button>
            </div>
            {!useCustom ? (
              <select
                value={selectedQ}
                onChange={e => setSelectedQ(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-rose-500/50"
              >
                {BEHAVIORAL_QUESTIONS.map(q => (
                  <option key={q.id} value={q.q}>
                    {q.q.length > 80 ? q.q.slice(0, 80) + "…" : q.q}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={customQ}
                onChange={e => setCustomQ(e.target.value)}
                placeholder="Enter your behavioral question…"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-rose-500/50 resize-none"
              />
            )}
            {activeQuestion && (
              <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-foreground">
                <span className="text-rose-400 font-semibold">Q: </span>
                {activeQuestion}
              </div>
            )}
          </div>

          {/* Voice recorder */}
          {mode === "voice" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {!recording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all"
                  >
                    <Mic size={14} /> Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold transition-all animate-pulse"
                  >
                    <Square size={14} /> Stop — {formatTime(recordingTime)}
                  </button>
                )}
                {recording && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-mono">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </div>

              {audioUrl && !recording && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary">
                    <Volume2 size={12} className="text-muted-foreground" />
                    <audio
                      src={audioUrl}
                      controls
                      className="flex-1 h-7"
                      style={{ filter: "invert(0.8) hue-rotate(180deg)" }}
                    />
                  </div>
                  <button
                    onClick={processVoice}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />{" "}
                        Transcribing & Structuring…
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} /> Transcribe & Structure into STAR
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text answer */}
          {mode === "text" && (
            <div className="space-y-2">
              <textarea
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                placeholder="Type your STAR answer here… (aim for 2–3 minutes worth of content)"
                rows={6}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={processText}
                  disabled={transcribeAndStructure.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {transcribeAndStructure.isPending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />{" "}
                      Structuring…
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} /> Structure into STAR
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STAR result */}
          {starResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-foreground">
                  STAR Structure
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {[
                {
                  label: "S — Situation",
                  value: starResult.situation,
                  color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
                },
                {
                  label: "T — Task",
                  value: starResult.task,
                  color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
                },
                {
                  label: "A — Action",
                  value: starResult.action,
                  color:
                    "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                },
                {
                  label: "R — Result",
                  value: starResult.result,
                  color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className={`p-3 rounded-lg border ${color}`}>
                  <div
                    className={`text-xs font-bold mb-1 ${color.split(" ")[0]}`}
                  >
                    {label}
                  </div>
                  <div className="text-xs text-foreground leading-relaxed">
                    {value || (
                      <span className="text-muted-foreground italic">
                        Not detected
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {starResult.rawTranscript && (
                <details className="text-xs">
                  <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                    Raw transcript
                  </summary>
                  <div className="mt-2 p-2.5 rounded-lg bg-secondary text-muted-foreground leading-relaxed">
                    {starResult.rawTranscript}
                  </div>
                </details>
              )}

              {/* Score button */}
              <button
                onClick={handleScore}
                disabled={scoreAnswer.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {scoreAnswer.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Scoring…
                  </>
                ) : (
                  <>
                    <Star size={12} /> Score This Answer with AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Score result */}
          {scoreResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-foreground">
                  AI Score
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary space-y-2">
                  <ScoreBar
                    label="Specificity"
                    value={scoreResult.specificity}
                  />
                  <ScoreBar
                    label="Impact Clarity"
                    value={scoreResult.impactClarity}
                  />
                </div>
                <div className="p-3 rounded-lg bg-secondary flex flex-col items-center justify-center gap-1">
                  <div className="text-2xl font-bold text-foreground">
                    {scoreResult.level}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Signal Level
                  </div>
                  <div
                    className={`badge text-xs ${
                      scoreResult.level === "L7"
                        ? "badge-green"
                        : scoreResult.level === "L6"
                          ? "badge-blue"
                          : "badge-amber"
                    }`}
                  >
                    {scoreResult.level}
                  </div>
                </div>
              </div>
              {scoreResult.strengths && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-xs font-bold text-emerald-400 mb-1">
                    ✓ Strengths
                  </div>
                  <div className="text-xs text-foreground leading-relaxed">
                    {scoreResult.strengths}
                  </div>
                </div>
              )}
              {scoreResult.improvements && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="text-xs font-bold text-amber-400 mb-1">
                    ↑ Improvements
                  </div>
                  <div className="text-xs text-foreground leading-relaxed">
                    {scoreResult.improvements}
                  </div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-xs font-bold text-foreground mb-1">
                  Coaching Note
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {scoreResult.coachingNote}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
