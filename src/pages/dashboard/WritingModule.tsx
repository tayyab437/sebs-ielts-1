import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Send, FileText, BarChart3, AlertCircle, CheckCircle2, 
  ChevronLeft, Brain, PenTool, Bold, Italic, Heading, List, 
  Link as LinkIcon, Quote, Code, Eye, Edit3, Mic, MicOff, 
  Play, Square, Volume2, RefreshCw, Check, Loader2, Award, 
  Flame, MessageSquare, AlertTriangle, Clock, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "../../lib/supabaseClient";

interface CriterionDetail {
  band: number;
  comment: string;
}

interface Evaluation {
  overallBand: number;
  criteria?: {
    taskResponse: CriterionDetail;
    coherenceCohesion: CriterionDetail;
    lexicalResource: CriterionDetail;
    grammaticalRange: CriterionDetail;
  };
  taskResponse?: string;
  coherenceCohesion?: string;
  lexicalResource?: string;
  grammaticalRange?: string;
  corrections: string[];
  suggestions: string;
}

interface SpeakingCriterionDetail {
  band: number;
  comment: string;
}

interface SpeakingEvaluation {
  overallBand: number;
  criteria?: {
    fluencyCoherence: SpeakingCriterionDetail;
    lexicalResource: SpeakingCriterionDetail;
    grammaticalRange: SpeakingCriterionDetail;
    pronunciation: SpeakingCriterionDetail;
  };
  fluencyFeedback: string;
  lexicalHighlights: string[];
  grammaticalFixes: string[];
  suggestions: string;
}

export default function WritingModule({ initialType }: { initialType?: 'writing' | 'speaking' }) {
  const location = useLocation();
  const [practiceType, setPracticeType] = useState<'writing' | 'speaking'>(() => {
    if (initialType) return initialType;
    // Check if state was passed via Link
    const state = location.state as { activeType?: string };
    if (state?.activeType === 'speaking') return 'speaking';
    return 'writing';
  });

  // Use effect to sync if initialType changes
  useEffect(() => {
     if (initialType) {
       setPracticeType(initialType);
     }
  }, [initialType]);
  
  // ================= WRITING MODULE STATES =================
  const [essay, setEssay] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("sb-user") || localStorage.getItem("authenticated_user") || localStorage.getItem("student_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [userId, setUserId] = useState<string | null>(() => user?.id || null);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [isDictating, setIsDictating] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  // ================= SPEAKING MODULE STATES =================
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeakingEvaluating, setIsSpeakingEvaluating] = useState(false);
  const [speakingEvaluation, setSpeakingEvaluation] = useState<SpeakingEvaluation | null>(null);

  // Core microphone structures
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const SPEAKING_TOPICS = [
    {
      id: "travel",
      title: "IELTS Core: A Beautiful City Visited",
      prompt: `Describe a beautiful city you have visited.
You should say:
- Where it is and when you went there
- Who you went with
- What you did there
- And explain why you recommend it as a beautiful destination to tourists.`
    },
    {
      id: "challenge",
      title: "IELTS Core: A Difficult Challenge Overcome",
      prompt: `Describe a difficult challenge you overcame.
You should say:
- What the challenge was
- How you handled it
- Who helped you solve it
- And explain what you learned from overcoming it.`
    },
    {
      id: "technology",
      title: "IELTS Core: Indispensable Daily Tech Item",
      prompt: `Describe a piece of technology you find indispensable.
You should say:
- What it is and how often you use it
- How you learned to use it
- What purpose it serves in your daily life
- And explain why it is crucial to your productivity or lifestyle.`
    },
    {
      id: "influential",
      title: "IELTS Core: Adored Inspirational Person",
      prompt: `Describe an influential person you admire.
You should say:
- Who this person is and how you know them
- In what ways they have influenced you
- What qualities make them special
- And explain why they are a significant role model to you.`
    }
  ];

  // Formatting Text Editor handler
  const handleFormatText = (style: string) => {
    const textarea = document.getElementById("essay-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = "";
    switch (style) {
      case 'bold': replacement = `**${selected || 'bold text'}**`; break;
      case 'italic': replacement = `*${selected || 'italic text'}*`; break;
      case 'header': replacement = `### ${selected || 'Section Title'}\n`; break;
      case 'list': replacement = `\n- ${selected || 'List item'}`; break;
      case 'code': replacement = `\`${selected || 'code snippet'}\``; break;
      case 'link': replacement = `[${selected || 'link text'}](https://example.com)`; break;
      case 'quote': replacement = `\n> ${selected || 'blockquote'}\n`; break;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setEssay(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
      }
    });
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          setUserId(user.id);
        }
      })
      .catch(err => {
        console.warn("Bypassed initialization check inside WritingModule:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Evaluation trigger: Writing Model
  const handleEvaluate = async () => {
    if (!essay.trim()) return;
    
    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/gemini/evaluate-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay, taskType: "Task 2", userId }),
      });
      
      const data = await response.json();
      setEvaluation(data);

      // Trigger a notification
      window.dispatchEvent(
        new CustomEvent("new_notification", {
          detail: {
            message: "Your AI Essay Evaluation is ready!",
            time: new Date().toISOString(),
            read: false,
          },
        })
      );
    } catch (error) {
      console.error("Evaluation failed:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Recording triggers: Speaking Model
  const startRecording = async () => {
    setAudioUrl(null);
    setTranscript("");
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          if (currentTranscript.trim()) {
            setTranscript(currentTranscript.trim());
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
        };

        rec.start();
        recognitionRef.current = rec;
      }
    } catch (err) {
      console.error("Failed to access microphone:", err);
      alert("Microphone access was denied or is not supported. You can still type, dictate or copy your IELTS monologue text response into the transcript area to receive simulated AI analysis.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const handleEvaluateSpeaking = async () => {
    if (!transcript.trim()) return;
    
    setIsSpeakingEvaluating(true);
    setSpeakingEvaluation(null);

    try {
      const response = await fetch("/api/gemini/evaluate-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript, 
          duration: recordingDuration || 45, 
          topicPrompt: SPEAKING_TOPICS[selectedTopicIdx].prompt,
          userId 
        }),
      });
      
      const data = await response.json();
      setSpeakingEvaluation(data);

      // Trigger a notification
      window.dispatchEvent(
        new CustomEvent("new_notification", {
          detail: {
            message: "Your AI Speaking Evaluation is ready!",
            time: new Date().toISOString(),
            read: false,
          },
        })
      );
    } catch (error) {
      console.error("Speaking evaluation failed:", error);
    } finally {
      setIsSpeakingEvaluating(false);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Dictation Logic
  const handleDictationToggle = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
    } else {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
          alert("Speech recognition is not supported in this browser. Please try Chrome.");
          return;
        }
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        
        rec.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
             setEssay(prev => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + finalTranscript);
          }
        };

        rec.onerror = (e: any) => console.error("Dictation error", e);
        rec.onend = () => setIsDictating(false);
        
        recognitionRef.current = rec;
        rec.start();
        setIsDictating(true);
      } catch (err) {
        console.error("Failed to start dictation", err);
      }
    }
  };

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  // Loading handling
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black italic text-[10px] uppercase tracking-widest animate-pulse">Initializing Practice Module...</p>
      </div>
    );
  }

  // Registration gate
  const isSupabaseDev = !supabase;
  if (!user && !isSupabaseDev) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter uppercase italic leading-none">
          Writing & Speaking <span className="text-primary">Locked</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-12 text-sm font-semibold leading-relaxed">
          Access to our high-precision evaluation engines for Writing and Speaking is reserved for registered candidates of SEB's Institute to ensure accurate feedback calibration.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-sm">
          <Link to="/signup" className="flex-1">
            <Button className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl border-none">
              Register Now
            </Button>
          </Link>
          <Link to="/login" className="flex-1">
            <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 dark:border-white/10 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              Candidate Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 bg-background min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>

          {/* Practice selection switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-2xl w-fit shadow-xs">
            <button
              onClick={() => setPracticeType('writing')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                practiceType === "writing"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200/50 dark:border-white/5"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-amber-500" />
              Writing Task 2
            </button>
            <button
              onClick={() => setPracticeType('speaking')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                practiceType === "speaking"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200/50 dark:border-white/5"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Speaking Practice
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ======================= IELTS WRITING TASK PRACTICE ==================== */}
        {/* ========================================================================= */}
        {practiceType === 'writing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Editor Area */}
            <div className="lg:col-span-2 space-y-6">
              <header className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <PenTool className="w-8 h-8 text-amber-500" />
                    IELTS Academic Writing Task 2
                  </h1>
                  <p className="text-muted-foreground font-medium text-sm mt-0.5">Formulate high-impact structured essays to earn top band ratings</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-2 text-right shrink-0">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-border p-2 px-3.5 rounded-2xl shadow-xs flex items-center justify-between min-w-[140px]">
                     <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Timer</span>
                     <button onClick={toggleTimer} className={`text-xs font-black uppercase font-mono px-2 py-0.5 rounded-xl transition-all ${isTimerRunning ? 'bg-primary/10 text-primary' : 'hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
                        {formatTimer(timerSeconds)}
                     </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-border p-2 px-3.5 rounded-2xl shadow-xs min-w-[140px]">
                    <span className={`text-xs font-black uppercase ${wordCount < 250 ? 'text-amber-500' : 'text-green-500'}`}>
                      {wordCount} / 250 Words
                    </span>
                  </div>
                </div>
              </header>

              <Card className="border border-border/60 shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <FileText className="w-4 h-4 text-primary" />
                    Interactive IELTS Essay Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed italic bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-dashed border-amber-500/20">
                    "Some people believe that the best way to control crime is to provide longer prison sentences. Others, however, believe that there are better alternative ways of reducing crime. Discuss both views and give your own opinion."
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-2.5 rounded-2xl border border-border/50">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-xl transition-all ${isDictating ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-sm ring-2 ring-red-500/30' : 'text-muted-foreground hover:text-emerald-500 hover:bg-muted'}`}
                      title={isDictating ? "Stop Dictation" : "Start Voice Dictation"}
                      onClick={handleDictationToggle}
                      disabled={editorMode === "preview"}
                    >
                      {isDictating ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <div className="w-[1px] h-6 bg-border mx-1" />
                    {[
                      { style: 'bold', icon: <Bold className="w-4 h-4" />, title: 'Bold' },
                      { style: 'italic', icon: <Italic className="w-4 h-4" />, title: 'Italic' },
                      { style: 'header', icon: <Heading className="w-4 h-4" />, title: 'Heading' },
                      { style: 'list', icon: <List className="w-4 h-4" />, title: 'Bullet List' },
                      { style: 'code', icon: <Code className="w-4 h-4" />, title: 'Code Block' },
                      { style: 'quote', icon: <Quote className="w-4 h-4" />, title: 'Quote' },
                      { style: 'link', icon: <LinkIcon className="w-4 h-4" />, title: 'Insert Link' },
                    ].map((tool) => (
                      <Button
                        key={tool.style}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted"
                        title={tool.title}
                        onClick={() => handleFormatText(tool.style)}
                        disabled={editorMode === "preview"}
                      >
                        {tool.icon}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className={`h-8 px-4 rounded-lg text-xs font-bold ${editorMode === 'edit' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                      onClick={() => setEditorMode('edit')}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-primary" /> Editor
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className={`h-8 px-4 rounded-lg text-xs font-bold ${editorMode === 'preview' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                      onClick={() => setEditorMode('preview')}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-primary" /> Live Preview
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute top-6 right-6 z-10 hidden sm:block">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl shadow-xl flex items-center gap-1">
                      <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Word Count</span>
                        <p className="text-sm font-black text-primary leading-none mt-0.5">{wordCount}</p>
                      </div>
                      <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Char Count</span>
                        <p className="text-sm font-black text-primary leading-none mt-0.5">{essay.length}</p>
                      </div>
                    </div>
                  </div>

                  {editorMode === 'edit' ? (
                    <div className="relative group">
                      <textarea
                        id="essay-textarea"
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Pristine syntax workspace. Craft your 250-word Academic Essay..."
                        className="w-full h-[520px] p-8 text-base font-sans leading-relaxed rounded-3xl border border-shadow focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-xs dark:bg-slate-900"
                      />
                      
                      {/* Floating Toolbar */}
                      <AnimatePresence>
                        {essay.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-white/90 backdrop-blur-sm border border-white/10 dark:border-slate-200/50 p-2 rounded-2xl shadow-2xl flex items-center gap-2 z-20"
                          >
                            <div className="flex items-center gap-1 px-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-slate-200"
                                onClick={() => handleFormatText('bold')}
                              >
                                <Bold className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-slate-200"
                                onClick={() => handleFormatText('italic')}
                              >
                                <Italic className="w-3.5 h-3.5" />
                              </Button>
                              <div className="w-[1px] h-4 bg-white/20 dark:bg-slate-300 mx-1" />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-slate-200"
                                onClick={() => handleFormatText('header')}
                              >
                                <Heading className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-slate-200"
                                onClick={() => handleFormatText('list')}
                              >
                                <List className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 pl-2 border-l border-white/20 dark:border-slate-300 ml-1">
                               <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-2 shadow-inner">Autosave Active</Badge>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="w-full h-[520px] p-8 overflow-y-auto rounded-3xl border border-shadow bg-background shadow-xs prose dark:prose-invert max-w-none text-left leading-relaxed">
                      {essay.trim() ? (
                        <div className="markdown-body">
                          <ReactMarkdown>{essay}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm italic">Workspace is empty. Compose text using formatting controls above to observe structured rendering here.</p>
                      )}
                    </div>
                  )}
                  
                  <div className="absolute bottom-6 right-6">
                    <Button 
                      onClick={handleEvaluate} 
                      disabled={isEvaluating || wordCount < 20}
                      className="rounded-full px-8 py-6 shadow-lg shadow-primary/25 group font-black uppercase text-xs tracking-wider"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                          Analyzing Draft...
                        </>
                      ) : (
                        <>
                          Evaluate with AI
                          <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Area */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {!evaluation && !isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="bg-gradient-to-br from-indigo-50/20 to-transparent dark:from-indigo-950/25 border bg-white/70 backdrop-blur-md rounded-3xl border-dashed py-14 shadow-md">
                      <CardContent className="text-center flex flex-col items-center justify-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-5 shadow-xs">
                          <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black text-slate-950 dark:text-white mb-2">Awaiting AI Evaluation</h3>
                        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
                          Draft your academic essay in the workspace. Our cognitive grader checks coherence, argument completeness, spelling, grammar correctness, and displays score band rubrics instantly.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="p-8 bg-muted/20 rounded-3xl border border-border/50 animate-pulse space-y-4">
                      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      </div>
                    </div>
                    <div className="p-8 bg-muted/20 rounded-3xl border border-border/50 animate-pulse flex flex-col items-center justify-center space-y-4">
                      <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    </div>
                  </motion.div>
                )}

                {evaluation && (
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Overall predicted score */}
                    <Card className="border-primary border-2 shadow-xl ring-4 ring-primary/5 rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                      <CardHeader className="pb-3 text-center bg-primary/5">
                        <div className="inline-flex items-center justify-center mb-1">
                          <Badge variant="default" className="bg-primary hover:bg-primary font-black italic tracking-widest text-[9px] px-3.5 py-0.5 rounded-full shadow-xs">IELTS ESTIMATED PROFILE</Badge>
                        </div>
                        <div className="text-6xl font-black text-primary mb-1 italic tracking-tighter">{evaluation.overallBand}</div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Academic Graded
                        </p>
                      </CardHeader>
                    </Card>

                    {/* Detailed Criteria Scores Breakdowns Section */}
                    <Card className="border border-border/50 shadow-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
                      <CardHeader className="bg-muted/10 border-b border-border/50">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          Detailed Performance Criteria
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        {[
                          { 
                            name: "Task Response", 
                            desc: "Addresses all parts of the prompt, presents a fully developed position, and supports arguments with clear logic.",
                            data: evaluation.criteria?.taskResponse, 
                            fallback: evaluation.taskResponse,
                            color: "bg-amber-500",
                            bgGrad: "from-amber-500/10 to-transparent",
                            stroke: "border-amber-500/25 text-amber-600"
                          },
                          { 
                            name: "Coherence & Cohesion", 
                            desc: "Logically organizes thoughts, establishes paragraph progression, and uses a natural variety of cohesive devices.",
                            data: evaluation.criteria?.coherenceCohesion, 
                            fallback: evaluation.coherenceCohesion,
                            color: "bg-blue-500",
                            bgGrad: "from-blue-500/10 to-transparent",
                            stroke: "border-blue-500/25 text-blue-600"
                          },
                          { 
                            name: "Lexical Resource", 
                            desc: "Demonstrates a broad range of vocabulary with precision, uses academic level collocations, and avoids word repetition.",
                            data: evaluation.criteria?.lexicalResource, 
                            fallback: evaluation.lexicalResource,
                            color: "bg-purple-500",
                            bgGrad: "from-purple-500/10 to-transparent",
                            stroke: "border-purple-500/25 text-purple-600"
                          },
                          { 
                            name: "Grammatical Range", 
                            desc: "Applies simple and complex structures accurately, maintains strong tense coherence, and avoids systematic core errors.",
                            data: evaluation.criteria?.grammaticalRange, 
                            fallback: evaluation.grammaticalRange,
                            color: "bg-emerald-500",
                            bgGrad: "from-emerald-500/10 to-transparent",
                            stroke: "border-emerald-500/25 text-emerald-600"
                          }
                        ].map((crit, index) => {
                          const val = crit.data?.band ?? (typeof crit.fallback === "number" ? crit.fallback : parseFloat(crit.fallback || "0") || "—");
                          const comment = crit.data?.comment ?? (typeof crit.fallback === "string" ? crit.fallback : "Core performance indicators evaluated for this essay rubric.");
                          const scoreNum = typeof val === "number" ? val : parseFloat(val as string) || 0;
                          
                          // IELTS has max band 9.0. Let's make the progress bar width based on band out of 9
                          const percent = Math.min(100, Math.max(10, (scoreNum / 9.0) * 100));

                          return (
                            <div key={index} className={`p-5 rounded-2xl bg-gradient-to-br ${crit.bgGrad} border ${crit.stroke.split(" ")[0]} space-y-3`}>
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 block">{crit.name}</span>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold mr-4">{crit.desc}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <Badge className="bg-primary hover:bg-primary text-white italic font-black text-[10px] px-2.5 py-0.5 rounded-full">
                                    Band {val}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* progress trail */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                  <span>Grader Score Tracker</span>
                                  <span>{val || "—"} / 9.0</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div className={`h-full ${crit.color} transition-all duration-700`} style={{ width: `${percent}%` }} />
                                </div>
                              </div>

                              <div className="pt-2 border-t border-border/20">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">AI Critique:</span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                  "{comment}"
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* AI Feedback & Strategy card */}
                    <Card className="rounded-3xl border border-border bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                      <CardHeader className="bg-muted/10 border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                          <Brain className="w-5 h-5 text-primary" />
                          Suggestions & Corrections
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ScrollArea className="h-[320px] pr-4">
                          <div className="space-y-6">
                            <section>
                              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 italic">Syntax & Spelling Flags</h4>
                              <div className="space-y-3">
                                {evaluation.corrections && evaluation.corrections.length > 0 ? (
                                  evaluation.corrections.map((corr, i) => (
                                    <div key={i} className="flex gap-3 text-xs border-l-2 border-primary/20 pl-4 py-1 bg-primary/5 rounded-r-xl">
                                      <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                      <span className="text-primary/95 font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{corr}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic pl-4">No critical syntactic / grammatical mistakes flagged.</p>
                                )}
                              </div>
                            </section>
                            
                            <section className="pt-6 border-t border-border/50">
                              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 italic">Strategy & Improvement</h4>
                              <div className="prose prose-xs prose-slate dark:prose-invert prose-p:italic prose-p:text-primary/80 prose-p:text-xs text-xs">
                                <ReactMarkdown>{evaluation.suggestions ?? "Analyze essay structure to formulate practice routines."}</ReactMarkdown>
                              </div>
                            </section>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= IELTS SPEAKING TASK PRACTICE ==================== */}
        {/* ========================================================================= */}
        {practiceType === 'speaking' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Editor Console Area */}
            <div className="lg:col-span-2 space-y-6 animate-in fade-in duration-300">
              <header className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <Mic className="w-8 h-8 text-emerald-500 animate-pulse" />
                    IELTS Interactive Speaking Practice
                  </h1>
                  <p className="text-muted-foreground font-medium text-sm mt-0.5">Dictate or record a monologue to receive detailed diagnostic score breakdowns</p>
                </div>
              </header>

              {/* Topics Select Wheel */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Select IELTS Cue Card Module</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {SPEAKING_TOPICS.map((topic, i) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        setSelectedTopicIdx(i);
                        setTranscript("");
                        setAudioUrl(null);
                        setSpeakingEvaluation(null);
                      }}
                      className={`p-3.5 rounded-2xl text-left border transition-all relative ${
                        selectedTopicIdx === i
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-2 ring-emerald-500/20"
                          : "border-border/60 bg-white dark:bg-slate-900 hover:border-border shadow-xs"
                      }`}
                    >
                      <h4 className={`text-xs font-black truncate ${selectedTopicIdx === i ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {topic.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 truncate mt-1 italic font-medium">IELTS Standard Cue</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Prompt Card */}
              <Card className="border border-border/60 shadow-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 relative">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase font-black text-[9px] tracking-widest rounded-full py-0.5 px-2.5">Part 2 Cue Card</Badge>
                </div>
                <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Active Prompt Card Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {SPEAKING_TOPICS[selectedTopicIdx].title}
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-dashed border-border text-xs leading-relaxed font-bold text-slate-600 dark:text-slate-350 whitespace-pre-line">
                    {SPEAKING_TOPICS[selectedTopicIdx].prompt}
                  </div>
                  <p className="text-[10px] text-rose-500 font-bold italic mt-3 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Speak clearly for 1 to 2 minutes. The countdown tracks your progress path.
                  </p>
                </CardContent>
              </Card>

              {/* Speech recorder console */}
              <Card className="border border-border/50 shadow-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between border-b pb-4 border-border/50">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Acoustic Signal Processor</span>
                    {isRecording ? (
                      <Badge variant="destructive" className="animate-pulse bg-rose-600 font-black uppercase text-[9px] tracking-widest rounded-full px-2.5 py-0.5">
                        Recording Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-black uppercase text-[9px] tracking-widest rounded-full px-2.5 py-0.5">Off Air</Badge>
                    )}
                  </div>

                  {/* Equalizer Wave / Core Recorder Trigger Area */}
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-border">
                    {isRecording ? (
                      <div className="flex items-end gap-1.5 h-16 mb-5 select-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
                          const animationStyles = [
                            "animate-[bounce_0.8s_infinite_100ms]",
                            "animate-[bounce_0.6s_infinite_200ms]",
                            "animate-[bounce_0.7s_infinite_300ms]",
                            "animate-[bounce_0.9s_infinite_400ms]",
                            "animate-[bounce_1.1s_infinite_250ms]"
                          ];
                          return (
                            <div 
                              key={bar} 
                              className={`w-1 bg-[#10b981] rounded-full transition-all duration-300 ${animationStyles[bar % animationStyles.length]}`} 
                              style={{ height: `${20 + (bar % 3) * 16}px` }} 
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-5 hover:scale-105 transition-all shadow-xs shrink-0 select-none">
                        <Mic className="w-8 h-8 text-emerald-500" />
                      </div>
                    )}

                    <div className="text-4xl font-black font-mono tracking-tight text-slate-800 dark:text-slate-100 select-none">
                      {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                      {(recordingDuration % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 select-none">Suggested Target length: 60 - 120 seconds</p>

                    <div className="flex gap-4 mt-6">
                      {!isRecording ? (
                        <Button
                          onClick={startRecording}
                          className="rounded-full px-7 py-6 font-black uppercase text-xs tracking-wider shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10"
                        >
                          <Play className="w-4 h-4 mr-2 text-white" /> Start Recording Voice
                        </Button>
                      ) : (
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          className="rounded-full px-7 py-6 font-black uppercase text-xs tracking-wider shadow-lg bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                        >
                          <Square className="w-4 h-4 mr-2 fill-white text-white" /> Stop & Finalize Monologue
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Playback Voice controls */}
                  {audioUrl && (
                    <div className="space-y-2 bg-[#10b981]/5 p-4 rounded-2xl border border-dashed border-[#10b981]/25">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981] flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 shrink-0" /> Auditory Output Playback
                      </span>
                      <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
                    </div>
                  )}

                  {/* Transcript textarea block editing */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs border-t pt-4 border-border/50">
                      <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dictated monologue text</span>
                      <span className="text-[10px] text-slate-400 font-bold">Editable transcript sandbox</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic font-medium">If speech recognition fails or is disabled in your sandbox, you can manually type or polish your speech transcript details below before grading.</p>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Start recording and speak. Your voice is typed dynamically inside this transcript container. Or manual copy-paste IELTS transcript strings here to grade..."
                      className="w-full h-44 p-4 text-xs font-sans leading-relaxed rounded-2xl border border-border focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all resize-none shadow-xs dark:bg-slate-900 bg-white"
                    />
                  </div>

                  {/* Evaluating Submit action */}
                  <div className="flex justify-end pt-2 border-t border-border/50">
                    <Button
                      onClick={handleEvaluateSpeaking}
                      disabled={isSpeakingEvaluating || !transcript.trim()}
                      className="rounded-full px-8 py-6 shadow-lg shadow-emerald-500/10 select-none font-black uppercase text-xs tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {isSpeakingEvaluating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                          Grading Acoustics...
                        </>
                      ) : (
                        <>
                          Compute Speech Evaluation
                          <Sparkles className="w-4 h-4 ml-2 text-white animate-pulse" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Output Area (Right Panel) */}
            <div className="space-y-6 animate-in fade-in duration-300">
              <AnimatePresence mode="wait">
                {!speakingEvaluation && !isSpeakingEvaluating && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-gradient-to-br from-emerald-50/20 to-transparent dark:from-emerald-950/25 border bg-white/70 backdrop-blur-md rounded-3xl border-dashed py-14 shadow-md text-center">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-5 shadow-xs">
                          <Mic className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black text-slate-950 dark:text-white mb-2">Awaiting Vocal Grader</h3>
                        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
                          Record your 1-2 minute cue challenge or paste your speak details inside the acoustic workspace. Our cognitive listener assesses pronunciation, hesitations, grammatic complexity, and yields detailed IELTS band metrics instantly.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {isSpeakingEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 animate-in fade-in duration-300"
                  >
                    <div className="p-8 bg-muted/20 rounded-3xl border border-border/50 animate-pulse space-y-4 bg-white dark:bg-slate-900">
                      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      </div>
                    </div>
                    <div className="p-8 bg-muted/20 rounded-3xl border border-border/50 animate-pulse flex flex-col items-center justify-center space-y-4 bg-white dark:bg-slate-900">
                      <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    </div>
                  </motion.div>
                )}

                {speakingEvaluation && (
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Overall spoken estimated score */}
                    <Card className="border-emerald-500 border-2 shadow-xl ring-4 ring-emerald-500/5 rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                      <CardHeader className="pb-3 text-center bg-emerald-500/5">
                        <div className="inline-flex items-center justify-center mb-1">
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-black italic tracking-widest text-[9px] px-3.5 py-0.5 rounded-full shadow-xs">IELTS ESTIMATED PROFILE</Badge>
                        </div>
                        <div className="text-6xl font-black text-emerald-500 mb-1 italic tracking-tighter">{speakingEvaluation.overallBand}</div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Speak Graded
                        </p>
                      </CardHeader>
                    </Card>

                    {/* Speaking Criteria Breakdown Grid */}
                    <Card className="border border-border/50 shadow-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
                      <CardHeader className="bg-muted/10 border-b border-border/50">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <BarChart3 className="w-4 h-4 text-emerald-500" />
                          Acoustic Performance Criteria
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        {[
                          { 
                            name: "Fluency & Coherence", 
                            desc: "Speaks smoothly without awkward pauses, organizes topic answers progressively, and links sentences naturally.",
                            data: speakingEvaluation.criteria?.fluencyCoherence,
                            color: "bg-teal-500",
                            bgGrad: "from-teal-500/10 to-transparent",
                            stroke: "border-teal-500/25 text-teal-600"
                          },
                          { 
                            name: "Lexical Resource", 
                            desc: "Demonstrates high-level vocabulary, uses topic-specific collocations, and applies correct context phrasing.",
                            data: speakingEvaluation.criteria?.lexicalResource,
                            color: "bg-purple-500",
                            bgGrad: "from-purple-500/10 to-transparent",
                            stroke: "border-purple-500/25 text-purple-600"
                          },
                          { 
                            name: "Grammatical Range", 
                            desc: "Employs varied complex sentence structures with few standard verb, prepositional, or plural errors.",
                            data: speakingEvaluation.criteria?.grammaticalRange,
                            color: "bg-blue-500",
                            bgGrad: "from-blue-500/10 to-transparent",
                            stroke: "border-blue-500/25 text-blue-600"
                          },
                          { 
                            name: "Pronunciation & Clarity", 
                            desc: "Speaks with clear sound articulation, suitable word and sentence stress patterns, and natural rate of speech.",
                            data: speakingEvaluation.criteria?.pronunciation,
                            color: "bg-emerald-500",
                            bgGrad: "from-emerald-500/10 to-transparent",
                            stroke: "border-emerald-500/25 text-emerald-600"
                          }
                        ].map((crit, index) => {
                          const val = crit.data?.band ?? "—";
                          const comment = crit.data?.comment ?? "Vocal performance markers processed for this IELTS grading card.";
                          const scoreNum = typeof val === "number" ? val : parseFloat(val as string) || 0;
                          const percent = Math.min(100, Math.max(10, (scoreNum / 9.0) * 100));

                          return (
                            <div key={index} className={`p-5 rounded-2xl bg-gradient-to-br ${crit.bgGrad} border ${crit.stroke.split(" ")[0]} space-y-3`}>
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-black uppercase tracking-tight text-slate-850 dark:text-slate-100 block">{crit.name}</span>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold mr-4">{crit.desc}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white italic font-black text-[10px] px-2.5 py-0.5 rounded-full">
                                    Band {val}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-extrabold text-slate-405 uppercase tracking-widest">
                                  <span>Audio Track Meter</span>
                                  <span>{val || "—"} / 9.0</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div className={`h-full ${crit.color} transition-all duration-700`} style={{ width: `${percent}%` }} />
                                </div>
                              </div>

                              <div className="pt-2 border-t border-border/20">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981] block mb-1">AI Voice Critique:</span>
                                <p className="text-[11px] text-slate-650 dark:text-slate-300 font-medium leading-relaxed italic">
                                  "{comment}"
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Spoken advanced suggestions lists */}
                    <Card className="rounded-3xl border border-border bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                      <CardHeader className="bg-muted/10 border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <Brain className="w-5 h-5 text-emerald-500" />
                          Synonyms, Grammars & Pacing Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ScrollArea className="h-[320px] pr-4">
                          <div className="space-y-6">
                            
                            {/* Pacing Flow Section */}
                            <section>
                              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-emerald-500" /> Monologue Pacing & Hesitations
                              </h4>
                              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic border-l-2 border-emerald-500/20 pl-4 py-1">
                                {speakingEvaluation.fluencyFeedback || "Speak dynamically in the sandbox. Pacing, fillers and repeat phrases analyzed dynamically."}
                              </p>
                            </section>

                            {/* Synonym Vocabulary Booster Section */}
                            <section className="pt-6 border-t border-border/50">
                              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-500" /> Custom Vocabulary Booster
                              </h4>
                              <div className="space-y-2">
                                {speakingEvaluation.lexicalHighlights && speakingEvaluation.lexicalHighlights.length > 0 ? (
                                  speakingEvaluation.lexicalHighlights.map((word, i) => (
                                    <div key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold items-center">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>{word}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic pl-2">No specialized phrase recommendations listed.</p>
                                )}
                              </div>
                            </section>

                            {/* Grammatical corrections Section */}
                            <section className="pt-6 border-t border-border/50">
                              <h4 className="text-xs font-black uppercase tracking-widest text-[#10b981] mb-3 flex items-center gap-1.5 font-black">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Structuring Corrections
                              </h4>
                              <div className="space-y-2.5">
                                {speakingEvaluation.grammaticalFixes && speakingEvaluation.grammaticalFixes.length > 0 ? (
                                  speakingEvaluation.grammaticalFixes.map((fix, i) => (
                                    <div key={i} className="flex gap-3 text-xs border-l-2 border-[#10b981]/20 pl-4 py-1.5 bg-[#10b981]/5 rounded-r-xl">
                                      <AlertCircle className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                                      <span className="text-[#10b981] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{fix}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic pl-4">No critical grammar patterns flagged in monologue.</p>
                                )}
                              </div>
                            </section>

                            {/* Summary Tips Section */}
                            <section className="pt-6 border-t border-border/50">
                              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-purple-500" /> AI Speaking Blueprint
                              </h4>
                              <div className="prose prose-xs prose-slate dark:prose-invert text-xs italic leading-relaxed text-slate-650 dark:text-slate-350">
                                <ReactMarkdown>{speakingEvaluation.suggestions || "Speak clearly in the sandbox to process blueprints."}</ReactMarkdown>
                              </div>
                            </section>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
