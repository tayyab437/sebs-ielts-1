import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Mic, Play, Pause, RotateCcw, Volume2, Clock, FileText, 
  Sparkles, CheckCircle2, Trash2, AlertCircle, Square, Save, 
  Loader2, Lightbulb, Award, BarChart3, HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface SpeakingQuestion {
  id: string;
  part: number; // 1, 2, or 3
  text: string;
  passageText?: string; // For Cue Card details / bullet points
  sectionHeading?: string;
  sectionInstruction?: string;
}

interface SpeakingTestModuleProps {
  section: any;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  supabase?: any;
}

export function SpeakingTestModule({
  section,
  answers,
  setAnswers,
  supabase,
}: SpeakingTestModuleProps) {
  const answerKey = `speaking-${section?.id}`;
  const existingAnswerStr = answers[answerKey];

  // Active Part Filter Tab ("all" | 1 | 2 | 3)
  const [activePartTab, setActivePartTab] = useState<"all" | 1 | 2 | 3>("all");

  // Part 2 (Cue Card) 1-Minute Preparation Timer State
  const [prepTimeLeft, setPrepTimeLeft] = useState(60); // 60 seconds
  const [isPrepActive, setIsPrepActive] = useState(false);
  const [prepNotes, setPrepNotes] = useState("");
  const prepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentlySpeakingQId, setCurrentlySpeakingQId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1-Minute Prep Timer Effect
  useEffect(() => {
    if (isPrepActive && prepTimeLeft > 0) {
      prepIntervalRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepIntervalRef.current!);
            setIsPrepActive(false);
            toast.success("1-Minute Preparation Time Complete! You may start recording your response.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    }

    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    };
  }, [isPrepActive, prepTimeLeft]);

  // Speech Recognition Setup for Live Transcription
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              text += event.results[i][0].transcript;
            }
          }
          if (text) {
            setLiveTranscript((prev) => (prev ? prev + " " + text : text));
          }
        };
      } catch (e) {
        console.warn("SpeechRecognition init error:", e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch(e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
    };
  }, []);

  // Parse Speaking Questions cleanly
  const questions: SpeakingQuestion[] = React.useMemo(() => {
    if (!section) return [];

    // 1. If questions array exists and is populated
    if (Array.isArray(section.questions) && section.questions.length > 0) {
      return section.questions.map((q: any, idx: number) => {
        let textVal = q.text || q.questionText || q.title || "";
        if (typeof textVal !== "string") {
          if (textVal?.name) textVal = textVal.name;
          else if (Array.isArray(textVal)) textVal = textVal.join("\n");
          else textVal = JSON.stringify(textVal);
        }

        let passageVal = q.passageText || q.cueCard || q.details || "";
        if (typeof passageVal !== "string") {
          if (passageVal?.name) passageVal = passageVal.name;
          else if (Array.isArray(passageVal)) passageVal = passageVal.join("\n");
          else passageVal = JSON.stringify(passageVal);
        }

        let partNum = q.part || q.partNumber;
        if (!partNum) {
          const idLower = String(q.id || "").toLowerCase();
          const tLower = textVal.toLowerCase();
          if (idLower.includes("part-1") || idLower.includes("part1") || tLower.includes("part 1")) partNum = 1;
          else if (idLower.includes("part-2") || idLower.includes("part2") || tLower.includes("part 2") || tLower.includes("cue card")) partNum = 2;
          else if (idLower.includes("part-3") || idLower.includes("part3") || tLower.includes("part 3")) partNum = 3;
          else partNum = idx === 0 ? 1 : idx === 1 ? 2 : 3;
        }

        return {
          id: q.id || `spk-q-${idx}`,
          part: partNum,
          text: textVal || `Speaking Prompt ${idx + 1}`,
          passageText: passageVal,
          sectionHeading: q.sectionHeading,
          sectionInstruction: q.sectionInstruction,
        };
      });
    }

    // 2. Parse from section.content if available
    const contentStr = String(section.content || "").trim();
    if (contentStr) {
      const blocks = contentStr.split(/(?=Part\s*[123]|Cue\s*Card)/i);
      const parsed: SpeakingQuestion[] = [];

      blocks.forEach((block, bIdx) => {
        const clean = block.trim();
        if (!clean) return;

        let partNum = bIdx + 1;
        if (/Part\s*1/i.test(clean)) partNum = 1;
        else if (/Part\s*2|Cue\s*Card/i.test(clean)) partNum = 2;
        else if (/Part\s*3/i.test(clean)) partNum = 3;

        const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
        const headingLine = lines[0] || `Part ${partNum}`;
        const bodyLines = lines.slice(1);

        if (partNum === 2) {
          parsed.push({
            id: `spk-parsed-p2`,
            part: 2,
            text: headingLine.replace(/#+|Part\s*2:?/gi, "").trim() || "Describe a memorable topic or experience",
            passageText: bodyLines.join("\n"),
          });
        } else {
          const qLines = bodyLines.filter((l) => /^\d+[\.\)]|^\-|\?$/i.test(l) || l.includes("?"));
          if (qLines.length > 0) {
            qLines.forEach((ql, qlIdx) => {
              parsed.push({
                id: `spk-parsed-p${partNum}-${qlIdx}`,
                part: partNum,
                text: ql.replace(/^\d+[\.\)]\s*|^\-\s*/, ""),
              });
            });
          } else {
            parsed.push({
              id: `spk-parsed-p${partNum}`,
              part: partNum,
              text: bodyLines.join("\n") || headingLine,
            });
          }
        }
      });

      if (parsed.length > 0) return parsed;
    }

    // 3. Fallback Standard IELTS 3-Part Speaking Test
    return [
      {
        id: "spk-def-p1-1",
        part: 1,
        text: "Where do you currently live, and what do you like most about your hometown?",
        sectionHeading: "Part 1: Introduction & General Warm-Up",
        sectionInstruction: "The examiner will ask you general questions about familiar topics such as home, studies, hobbies, or routine.",
      },
      {
        id: "spk-def-p1-2",
        part: 1,
        text: "Do you work or are you a student? What is the most interesting aspect of your daily routine?",
      },
      {
        id: "spk-def-p1-3",
        part: 1,
        text: "How do you usually spend your leisure time during weekends?",
      },
      {
        id: "spk-def-p2-1",
        part: 2,
        text: "Describe a memorable trip or journey you took that left a lasting impression on you.",
        passageText: "You should say:\n• Where you went and who accompanied you\n• What mode of transport you used\n• What key activities you engaged in during the trip\n• And explain why this particular journey was so special and memorable for you.",
        sectionHeading: "Part 2: Individual Long Turn (Cue Card)",
        sectionInstruction: "You have 1 minute to prepare your notes using the scratchpad below. Speak continuously for 1 to 2 minutes addressing all bullet points.",
      },
      {
        id: "spk-def-p3-1",
        part: 3,
        text: "How has the way people travel changed over the past few decades in your country?",
        sectionHeading: "Part 3: Two-Way Analytical Discussion",
        sectionInstruction: "Discuss abstract ideas and express analytical perspectives related to travel, culture, and society.",
      },
      {
        id: "spk-def-p3-2",
        part: 3,
        text: "What are the environmental and social impacts of modern international tourism on local communities?",
      },
      {
        id: "spk-def-p3-3",
        part: 3,
        text: "Do you think government regulations should limit tourism in fragile ecological or historical heritage sites?",
      },
    ];
  }, [section]);

  // Filtered Questions by active Part tab
  const filteredQuestions = React.useMemo(() => {
    if (activePartTab === "all") return questions;
    return questions.filter((q) => q.part === activePartTab);
  }, [questions, activePartTab]);

  // TTS Examiner Voice Playback
  const playExaminerVoice = (text: string, qId: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (currentlySpeakingQId === qId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingQId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setCurrentlySpeakingQId(qId);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB"; // Standard British Examiner Voice
    utterance.rate = 0.92; // Natural clear pace

    utterance.onend = () => setCurrentlySpeakingQId(null);
    utterance.onerror = () => setCurrentlySpeakingQId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Start Recording
  const startRecording = async () => {
    try {
      setErrorMsg("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      if (recognitionRef.current) {
        setLiveTranscript("");
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      setIsRecording(true);
      setIsPaused(false);
      setRecordingTimer(0);

      recIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Mic error:", err);
      if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
        setErrorMsg("Microphone access was denied. Please allow microphone permission in browser settings.");
      } else {
        setErrorMsg(err.message || "Could not start audio recorder.");
      }
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Pause Recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsPaused(true);
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
    }
  };

  // Resume Recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
      setIsPaused(false);
      recIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  // Reset Recorder
  const resetRecorder = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setLiveTranscript("");
    setRecordingTimer(0);
    setIsPaused(false);
  };

  // Submit and Analyze Spoken Response
  const handleSubmitAndAnalyze = async () => {
    if (!audioBlob) {
      toast.error("Please record your spoken response first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Compile question text prompt for evaluation
        const promptSummary = questions
          .map((q, idx) => `[Part ${q.part}] Q${idx + 1}: ${q.text} ${q.passageText ? "\nCue Details: " + q.passageText : ""}`)
          .join("\n\n");

        let userObj = null;
        if (supabase) {
          try {
            const { data } = await supabase.auth.getUser();
            userObj = data?.user;
          } catch (e) {}
        }

        const res = await fetch("/api/gemini/analyze-speaking-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64Audio,
            questionText: promptSummary,
            duration: recordingTimer,
            userId: userObj?.id || "guest",
          }),
        });

        const analysisData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(analysisData.error || "Failed to analyze audio response.");
        }

        const finalResultPayload = {
          audioUrl: audioUrl || "",
          transcript: analysisData.transcript || liveTranscript,
          analysis: analysisData,
          notes: prepNotes,
          recordedAt: new Date().toISOString(),
        };

        // Update local answers state
        setAnswers((prev) => ({
          ...prev,
          [answerKey]: JSON.stringify(finalResultPayload),
        }));

        toast.success("IELTS Speaking response successfully evaluated by AI!");

        // Sync to student_submissions table in Supabase
        if (supabase) {
          try {
            const studentProfile = JSON.parse(localStorage.getItem("student_profile") || "{}");
            await supabase.from("student_submissions").insert([
              {
                student_id: userObj?.id,
                student_name: studentProfile.name || "Anonymous Candidate",
                course_title: "IELTS Speaking Practice (Mock Test)",
                lesson_title: section?.title || "Speaking Section",
                lesson_type: "SPEAKING_PRACTICE",
                content: JSON.stringify({
                  sections: [
                    {
                      section: section?.title || "Speaking Section",
                      type: "Speaking",
                      results: [{ type: "speaking", data: finalResultPayload }],
                    },
                  ],
                }),
                created_at: new Date().toISOString(),
              },
            ]);
          } catch (syncErr) {
            console.warn("Supabase speaking submission sync failed:", syncErr);
          }
        }
      };
    } catch (err: any) {
      console.error("Speaking analysis error:", err);
      toast.error(err.message || "Failed to complete AI Speaking evaluation.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTimerStr = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If candidate already has an evaluated response
  if (existingAnswerStr) {
    let resultData: any = {};
    try {
      resultData = JSON.parse(existingAnswerStr);
    } catch (e) {}

    const analysis = resultData.analysis || {};
    const criteria = analysis.criteria || {};

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 text-left">
        {/* Completed Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-emerald-500/20 shadow-xl p-8 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 mb-1">
                  Evaluation Complete
                </Badge>
                <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white tracking-tight">
                  Official IELTS Speaking Evaluation
                </h3>
                <p className="text-xs font-semibold text-slate-400 italic">
                  Graded by AI Examiner engine calibrated to British Council & IDP standards
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setAnswers((prev) => {
                  const copy = { ...prev };
                  delete copy[answerKey];
                  return copy;
                });
                resetRecorder();
              }}
              className="rounded-2xl h-12 px-6 font-black uppercase italic text-xs border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" /> Re-Take Speaking Test
            </Button>
          </div>

          {/* Audio Player */}
          {resultData.audioUrl && (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 italic flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Your Recorded Response Audio
              </p>
              <audio src={resultData.audioUrl} controls className="w-full h-11" />
            </div>
          )}

          {/* IELTS Scorecard Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 italic flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> IELTS Band Scores Criteria
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Overall Band Card */}
              <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/30 rounded-3xl p-5 text-center flex flex-col items-center justify-center shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                  Overall Band
                </p>
                <p className="text-4xl font-black italic text-amber-500 tracking-tight">
                  {analysis.overallBand ? Number(analysis.overallBand).toFixed(1) : "7.0"}
                </p>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">out of 9.0</span>
              </div>

              {/* 4 Criteria Cards */}
              {[
                {
                  label: "Fluency & Coherence",
                  code: "FC",
                  band: criteria.fluencyCoherence?.band || analysis.fluencyScore || "7.0",
                  comment: criteria.fluencyCoherence?.comment,
                  color: "text-blue-500 border-blue-500/20 bg-blue-500/5",
                },
                {
                  label: "Lexical Resource",
                  code: "LR",
                  band: criteria.lexicalResource?.band || analysis.correctnessScore || "7.0",
                  comment: criteria.lexicalResource?.comment,
                  color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                },
                {
                  label: "Grammar Range",
                  code: "GRA",
                  band: criteria.grammaticalRange?.band || analysis.pronunciationScore || "7.0",
                  comment: criteria.grammaticalRange?.comment,
                  color: "text-indigo-500 border-indigo-500/20 bg-indigo-500/5",
                },
                {
                  label: "Pronunciation",
                  code: "PR",
                  band: criteria.pronunciation?.band || "7.0",
                  comment: criteria.pronunciation?.comment,
                  color: "text-rose-500 border-rose-500/20 bg-rose-500/5",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-3xl border ${item.color} shadow-sm space-y-1 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {item.code}
                      </span>
                      <span className={`text-xl font-black italic ${item.color.split(" ")[0]}`}>
                        {item.band}
                      </span>
                    </div>
                    <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">
                      {item.label}
                    </p>
                  </div>
                  {item.comment && (
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 italic mt-2">
                      {item.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transcript & AI Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2 italic">
                <FileText className="w-4 h-4" /> Spoken Audio Transcript
              </h5>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                {analysis.transcript || resultData.transcript || "Speech audio processed successfully."}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl border border-indigo-500/20 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2 italic">
                <Sparkles className="w-4 h-4" /> Examiner Feedback & Recommendations
              </h5>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed italic whitespace-pre-wrap">
                {analysis.suggestions || "Focus on expanding answers in Part 3 with formal cohesive devices and complex sentence structures to target Band 8.0+."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Practice View
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-6 relative overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] px-3 py-0.5 rounded-full">
                Official Exam Simulator
              </Badge>
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> 11–14 Minutes Duration
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              IELTS Speaking Examination
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Listen to the examiner's prompts, prepare using the 1-minute cue card scratchpad, and record your spoken audio response for instant AI band evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400">Audio Format</p>
              <p className="text-xs font-semibold text-white">Full Voice Evaluation</p>
            </div>
          </div>
        </div>

        {/* Part Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-white/10">
          {[
            { id: "all", label: "Full Exam View (All Parts)" },
            { id: 1, label: "Part 1: Interview" },
            { id: 2, label: "Part 2: Cue Card" },
            { id: 3, label: "Part 3: Discussion" },
          ].map((tab) => (
            <button
              key={String(tab.id)}
              onClick={() => setActivePartTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activePartTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "bg-white/10 hover:bg-white/20 text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Questions & Recorder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Questions & Cue Card */}
        <div className="lg:col-span-7 space-y-6">
          {filteredQuestions.map((q, idx) => {
            const isCueCard = q.part === 2;

            return (
              <Card
                key={q.id || idx}
                className={`rounded-3xl p-6 md:p-8 space-y-6 border transition-all ${
                  isCueCard
                    ? "bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800/40 shadow-md"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 shadow-sm"
                }`}
              >
                {/* Section Heading & Instructions if present */}
                {q.sectionHeading && (
                  <div className="pb-4 border-b border-slate-100 dark:border-white/5 space-y-1">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> {q.sectionHeading}
                    </h4>
                    {q.sectionInstruction && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        {q.sectionInstruction}
                      </p>
                    )}
                  </div>
                )}

                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                      {idx + 1}
                    </div>
                    <div>
                      <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-none font-semibold text-[10px] px-2.5 py-0.5 mb-1 rounded-full">
                        Part {q.part} {isCueCard ? "Cue Card Topic" : "Question"}
                      </Badge>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {q.text}
                      </h3>
                    </div>
                  </div>

                  {/* Examiner Voice TTS Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playExaminerVoice(q.text + (q.passageText ? ". " + q.passageText : ""), q.id)}
                    className={`rounded-xl h-9 px-3 text-xs font-medium gap-1.5 shrink-0 ${
                      currentlySpeakingQId === q.id
                        ? "bg-amber-500 text-white border-amber-500 animate-pulse font-semibold"
                        : "text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-indigo-500 hover:text-indigo-600"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {currentlySpeakingQId === q.id ? "Speaking..." : "Listen Voice"}
                  </Button>
                </div>

                {/* Cue Card Details & 1-Minute Prep Timer */}
                {isCueCard && (
                  <div className="space-y-6 pt-4 border-t border-indigo-100 dark:border-indigo-900/30">
                    {/* Prompt Box */}
                    {q.passageText && (
                      <div className="p-5 bg-white dark:bg-slate-950/60 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Required Bullet Points To Cover:
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {q.passageText}
                        </p>
                      </div>
                    )}

                    {/* 1-Minute Preparation Timer Controls */}
                    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 border border-slate-800 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <h5 className="text-xs font-semibold tracking-wide text-amber-300">
                            1-Minute Cue Card Preparation Timer
                          </h5>
                        </div>
                        <span className="text-xl font-bold tracking-wider text-amber-400 font-mono">
                          00:{prepTimeLeft.toString().padStart(2, "0")}
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-1000"
                          style={{ width: `${(prepTimeLeft / 60) * 100}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setIsPrepActive(!isPrepActive)}
                          disabled={prepTimeLeft === 0}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs h-9 px-4 rounded-xl gap-1.5"
                        >
                          {isPrepActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          {isPrepActive ? "Pause Prep" : "Start 1-Min Prep"}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsPrepActive(false);
                            setPrepTimeLeft(60);
                          }}
                          className="text-slate-300 hover:text-white font-medium text-xs h-9 gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset Timer
                        </Button>
                      </div>

                      {/* Prep Scratchpad Notes */}
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[11px] font-medium text-slate-300">
                          Candidate Scratchpad (Notes during 1-min prep):
                        </label>
                        <textarea
                          rows={3}
                          value={prepNotes}
                          onChange={(e) => setPrepNotes(e.target.value)}
                          placeholder="Type quick bullet points or keywords here to organize your thoughts..."
                          className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-normal"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Right Side: Audio Voice Recorder & Submission */}
        <div className="lg:col-span-5 sticky top-6 space-y-6">
          <Card className="rounded-3xl p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Audio Recorder Desk
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400">
                    Record Spoken Answer
                  </p>
                </div>
              </div>

              {audioUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetRecorder}
                  className="text-slate-400 hover:text-red-500 text-xs font-medium gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
            </div>

            {/* Recording Controls */}
            {!audioUrl ? (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 space-y-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                    isRecording
                      ? isPaused
                        ? "bg-amber-500 shadow-amber-500/20"
                        : "bg-red-500 animate-pulse shadow-red-500/30"
                      : "bg-indigo-600 shadow-indigo-600/30"
                  }`}
                >
                  {isRecording ? (
                    isPaused ? (
                      <Pause className="w-8 h-8 text-white fill-current" />
                    ) : (
                      <Square className="w-8 h-8 text-white fill-current" />
                    )
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">
                    {isRecording ? (isPaused ? "Recording Paused" : "Recording Your Speech...") : "Ready to Record"}
                  </h4>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {isRecording ? `Timer: ${formatTimerStr(recordingTimer)}` : "Click below to start speaking"}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl text-center">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-11 px-6 rounded-xl shadow-sm gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" /> Start Recording
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-11 px-4 rounded-xl gap-1.5"
                      >
                        {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                        {isPaused ? "Resume" : "Pause"}
                      </Button>

                      <Button
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-11 px-4 rounded-xl gap-1.5"
                      >
                        <Square className="w-4 h-4 fill-current" /> Stop & Review
                      </Button>
                    </>
                  )}
                </div>

                {/* Live Transcript Box */}
                {isRecording && (
                  <div className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-xs font-semibold text-indigo-500 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 animate-ping" /> Transcribing Live:
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      {liveTranscript || "Speak clearly into your microphone..."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Review Captured Audio */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Captured Audio Clip
                    </span>
                    <span className="text-xs font-medium text-slate-500 font-mono">
                      {formatTimerStr(recordingTimer)}
                    </span>
                  </div>
                  {audioUrl ? <audio src={audioUrl} controls className="w-full h-11" /> : <p className="text-xs text-slate-400 italic">No audio recorded</p>}
                </div>

                {/* Live Speech Transcript */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Speech-To-Text Draft</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {liveTranscript || "[Audio captured and ready for AI band analysis]"}
                  </p>
                </div>

                {/* Submit & Get AI Analysis Button */}
                <Button
                  onClick={handleSubmitAndAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm h-12 rounded-xl shadow-sm gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Evaluating Audio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Submit Response for Evaluation
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
