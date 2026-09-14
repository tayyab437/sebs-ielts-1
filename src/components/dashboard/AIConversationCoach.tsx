import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Mic, Square, Send, RefreshCw, Volume2, VolumeX,
  AlertCircle, ShieldAlert, CheckCircle2, Award, BookOpen, Clock, Bot, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

const TOPICS = [
  { id: "free-chat", label: "General Conversation", desc: "A casual chat about your day, hobbies, and interests.", prompt: "Hello! Let's have a casual, friendly chat. Tell me about your week so far!" },
  { id: "ielts-p1", label: "IELTS Part 1 Intro", desc: "Short answers to familiar topics like school, work, and hometown.", prompt: "Welcome to Part 1 of the speaking assessment. Let's talk about where you live. Do you live in a house or an apartment?" },
  { id: "ielts-p2", label: "IELTS Part 2 Cue Card", desc: "Simulated monologue preparation on a chosen descriptive prompt.", prompt: "Here is your cue card: 'Describe a beautiful place you visited in your childhood'. Please tell me when you visited it, where it was, and what you did there." },
  { id: "ielts-p3", label: "IELTS Part 3 Discussion", desc: "Abstract questioning on sociological, economic, or education issues.", prompt: "Let's discuss tourism and local culture. In what ways can massive international tourism benefit or harm local historical heritage sites?" }
];

export default function AIConversationCoach() {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: TOPICS[0].prompt, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Avatar states: "idle" | "listening" | "thinking" | "speaking"
  const [coachState, setCoachState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [englishConfidence, setEnglishConfidence] = useState(100);
  const [wordCount, setWordCount] = useState(0);

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Auto scroll
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Setup standard Web Speech API Transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        if (final) {
          setInputText(prev => prev ? prev + " " + final : final);
          setLiveTranscript("");
        } else if (interim) {
          setLiveTranscript(interim);
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleTopicChange = (topic: typeof TOPICS[0]) => {
    setActiveTopic(topic);
    setMessages([
      { role: "model", text: topic.prompt, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setCorrections([]);
    setLiveTranscript("");
    setInputText("");
    setCoachState("idle");
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const startMic = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported in this browser. Please use Chrome, Safari or Edge, or type in your answers.");
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      setLiveTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
      setCoachState("listening");
    } catch (e) {
      console.error(e);
    }
  };

  const stopMic = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setCoachState("idle");
    }
  };

  // Decode standard base64 audio and play in browser
  const playBase64Audio = (base64String: string) => {
    if (!isAudioEnabled || !base64String) {
      setCoachState("idle");
      return;
    }

    try {
      const binary = atob(base64String);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: "audio/wav" });
      const blobUrl = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new window.Audio(blobUrl);
      audioRef.current = audio;
      
      setCoachState("speaking");
      
      audio.onended = () => {
        setCoachState("idle");
      };
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setCoachState("idle");
      };
      
      audio.play().catch(err => {
        console.warn("Audio autoplay blocked or failed:", err);
        setCoachState("idle");
      });
    } catch (err) {
      console.error("Failed to decode audio, skipping audio playback:", err);
      setCoachState("idle");
    }
  };

  // Send message to Express API endpoint
  const sendMessage = async (textToSend?: string) => {
    const finalMsg = (textToSend || inputText).trim();
    if (!finalMsg) return;

    // Check for non-English words using basic character detection or warning message
    const isEnglishOnly = /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(finalMsg);
    if (!isEnglishOnly) {
      setEnglishConfidence(prev => Math.max(0, prev - 15));
    }

    const newUserMessage: Message = {
      role: "user",
      text: finalMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setLiveTranscript("");
    setIsLoading(true);
    setCoachState("thinking");

    // Track total words written to dashboard metric
    const words = finalMsg.split(/\s+/).length;
    setWordCount(prev => prev + words);

    try {
      // Map history beautifully for API payload
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/gemini/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalMsg,
          history: historyPayload
        })
      });

      if (!res.ok) throw new Error("Connection with SEBS Speaking Coach failed.");
      
      const data = await res.json();
      
      const assistantMessage: Message = {
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-extract dynamic grammatical corrections to display in the feedback panel
      // Try to parse bullet points or advice from the AI text
      const potentialCorrections = data.text.match(/\* (.*?)(\n|$)/g);
      if (potentialCorrections) {
        const cleaned = potentialCorrections.map((c: string) => c.replace(/^\* /, "").trim());
        setCorrections(prev => [...cleaned, ...prev].slice(0, 5));
      }

      // Check user confidence rating
      if (!data.text.toLowerCase().includes("please try to speak in english")) {
        setEnglishConfidence(prev => Math.min(100, prev + 5));
      }

      // Trigger Avatar to speak
      if (data.audio) {
        playBase64Audio(data.audio);
      } else {
        setCoachState("idle");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to retrieve speech response.");
      setCoachState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner introducing Coach Clara */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0F1E36] rounded-[2.5rem] p-6 sm:p-8 text-white border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge className="bg-indigo-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Conversational AI</Badge>
              <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Fluency Curation</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Learn English with Clara</h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium italic max-w-xl">
              An animated, voice-to-voice speaking coach who evaluates your English vocabulary, corrects grammatical slips in real-time, and forces you to speak only English.
            </p>
          </div>

          <div className="flex gap-4">
            <Card className="bg-white/5 border-white/10 text-white p-4 text-center rounded-[1.5rem] shrink-0 min-w-[90px]">
              <span className="block text-[8px] font-bold text-slate-400 tracking-wider uppercase mb-1">ENGLISH EFFORT</span>
              <span className={`text-xl sm:text-2xl font-black ${englishConfidence >= 80 ? 'text-emerald-400' : englishConfidence >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{englishConfidence}%</span>
            </Card>
            <Card className="bg-white/5 border-white/10 text-white p-4 text-center rounded-[1.5rem] shrink-0 min-w-[90px]">
              <span className="block text-[8px] font-bold text-slate-400 tracking-wider uppercase mb-1">SPEECH WORDS</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-400">{wordCount}</span>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Avatar & Interactive Wave (5 cols on large) */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-xl flex flex-col p-6 sm:p-8 items-center justify-center text-center relative h-[450px]">
            
            {/* Audio Voice Control Toggle */}
            <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="absolute top-6 right-6 w-11 h-11 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-all shadow-inner border border-slate-100 dark:border-white/5"
              title={isAudioEnabled ? "Mute Voice Feed" : "Unmute Voice Feed"}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-500" />}
            </button>

            {/* Glowing Soundwave Aura rings behind avatar */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              
              <AnimatePresence>
                {coachState === "listening" && (
                  <>
                    <motion.div 
                      key="l1"
                      initial={{ scale: 0.9, opacity: 0.1 }}
                      animate={{ scale: [1, 1.45, 1], opacity: [0.15, 0.45, 0.15] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-red-400/20 dark:bg-red-500/10 rounded-full"
                    />
                    <motion.div 
                      key="l2"
                      initial={{ scale: 0.85, opacity: 0.1 }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
                      className="absolute inset-2 bg-rose-300/30 dark:bg-rose-500/10 rounded-full"
                    />
                  </>
                )}

                {coachState === "speaking" && (
                  <>
                    <motion.div 
                      key="s1"
                      initial={{ scale: 0.9, opacity: 0.1 }}
                      animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0.6, 0.2] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full h-full w-full"
                    />
                    <motion.div 
                      key="s2"
                      initial={{ scale: 0.85, opacity: 0.1 }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: 0.25 }}
                      className="absolute inset-2 bg-indigo-400/30 dark:bg-indigo-400/10 rounded-full"
                    />
                  </>
                )}

                {coachState === "thinking" && (
                  <motion.div 
                    key="t"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400/30"
                  />
                )}
              </AnimatePresence>

              {/* Base Ring for Avatar Face */}
              <div className="absolute inset-6 bg-slate-50 dark:bg-indigo-950/20 rounded-full border border-slate-100 dark:border-indigo-400/10 shadow-inner flex items-center justify-center overflow-hidden">
                
                {/* Visual Speaking SVG Avatar Clara */}
                <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] select-none">
                  <defs>
                    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffeedd" />
                      <stop offset="100%" stopColor="#ffd8c8" />
                    </linearGradient>
                    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#312e81" />
                      <stop offset="100%" stopColor="#1e1b4b" />
                    </linearGradient>
                    <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <filter id="blushing" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                    </filter>
                  </defs>

                  {/* Shirt / Neck area */}
                  <path d="M25,95 C25,80 35,70 50,70 C65,70 75,80 75,95 Z" fill="url(#shirtGrad)" />
                  <path d="M43,70 L57,70 L57,78 L43,78 Z" fill="#ffd8c8" opacity="0.9" />

                  {/* Friendly Round Face */}
                  <circle cx="50" cy="46" r="24" fill="url(#skinGrad)" />

                  {/* Blonde/Indio Hair back piece */}
                  <path d="M22,40 C18,20 30,5 50,5 C70,5 82,20 78,40 C76,46 75,54 77,60 C73,42 75,32 50,22 C25,32 27,42 23,60 C25,54 24,46 22,40 Z" fill="url(#hairGrad)" />

                  {/* Blush Cheeks */}
                  <circle cx="36" cy="51" r="3.5" fill="#f43f5e" opacity={coachState === "thinking" ? 0.15 : coachState === "speaking" ? 0.35 : 0.25} filter="url(#blushing)" />
                  <circle cx="64" cy="51" r="3.5" fill="#f43f5e" opacity={coachState === "thinking" ? 0.15 : coachState === "speaking" ? 0.35 : 0.25} filter="url(#blushing)" />

                  {/* Dynamic Blinking Eyes */}
                  <g className="transition-all duration-300">
                    {/* Blinking Animation or looking around */}
                    <path
                      d={coachState === "thinking" ? "M31,43 Q35,46 39,43" : "M32,44 C32,44 32,41 35,41 C38,41 38,44 38,44 C38,44 38,47 35,47 C32,47 32,44 32,44 Z"}
                      fill={coachState === "thinking" ? "none" : "#1e1b4b"}
                      stroke="#1e1b4b"
                      strokeWidth={coachState === "thinking" ? 1.5 : 0}
                      strokeLinecap="round"
                    />
                    <path
                      d={coachState === "thinking" ? "M61,43 Q65,46 69,43" : "M62,44 C62,44 62,41 65,41 C68,41 68,44 68,44 C68,44 68,47 65,47 C62,47 62,44 62,44 Z"}
                      fill={coachState === "thinking" ? "none" : "#1e1b4b"}
                      stroke="#1e1b4b"
                      strokeWidth={coachState === "thinking" ? 1.5 : 0}
                      strokeLinecap="round"
                    />

                    {/* Happy squint details */}
                    {coachState === "speaking" && (
                      <>
                        <path d="M33,39 Q35,37 37,39" fill="none" stroke="#1e1b4b" strokeWidth="1" strokeLinecap="round" />
                        <path d="M63,39 Q65,37 67,39" fill="none" stroke="#1e1b4b" strokeWidth="1" strokeLinecap="round" />
                      </>
                    )}
                  </g>

                  {/* Responsive Mouth */}
                  <g>
                    {coachState === "idle" && (
                      // Gentle happy curve
                      <path d="M43,55 Q50,60 57,55" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
                    )}

                    {coachState === "listening" && (
                      // Concentrating slightly open horizontal oval
                      <ellipse cx="50" cy="56" rx="3.5" ry="1.5" fill="#4a044e" stroke="#1e1b4b" strokeWidth="1" />
                    )}

                    {coachState === "thinking" && (
                      // Playful side thinking line
                      <path d="M46,55 Q50,53 54,55" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
                    )}

                    {coachState === "speaking" && (
                      // Dynamic lip sync simulation loop
                      <motion.ellipse 
                        cx="50" 
                        cy="56" 
                        animate={{ rx: [2.5, 5, 3.5, 4.5, 2.5], ry: [1, 4, 1.5, 3.5, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                        fill="#9d174d" 
                        stroke="#1e1b4b" 
                        strokeWidth="1.5" 
                      />
                    )}
                  </g>

                  {/* Tech Headset Accent */}
                  <path d="M22,38 C22,25 31,18 50,18 C69,18 78,25 78,38" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                  <rect x="19" y="35" width="4" height="10" rx="1.5" fill="#6366f1" />
                  <rect x="77" y="35" width="4" height="10" rx="1.5" fill="#6366f1" />
                  <path d="M21,43 Q35,53 44,53" fill="none" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="44" cy="53" r="1.5" fill="#10b981" />
                </svg>
              </div>
            </div>

            {/* Coach Title text below Avatar */}
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-2">
                Clara
                {coachState === "listening" && (
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full animate-pulse border border-rose-200 dark:border-rose-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    LISTENING
                  </span>
                )}
                {coachState === "speaking" && (
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full animate-pulse border border-indigo-200 dark:border-indigo-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    SPOKEN FEED
                  </span>
                )}
                {coachState === "thinking" && (
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-500" />
                    REFRACTURING
                  </span>
                )}
                {coachState === "idle" && (
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    GENTLE READY
                  </span>
                )}
              </h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">SEBS AI ENGLISH COACH</p>
            </div>
          </Card>

          {/* Grammar Check / Corrections Real-time Advice box */}
          <Card className="rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
             <CardHeader className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/2">
                <div className="flex items-center gap-2">
                   <Award className="w-5 h-5 text-indigo-500" />
                   <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-white">Active Coaching Notes</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                {corrections.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs font-medium italic">
                    Great vocabulary and syntax detected. Continue speech to populate correction highlights!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                     {corrections.map((c, idx) => (
                       <div key={idx} className="flex gap-2.5 items-start bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-700 dark:text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold leading-relaxed leading-normal">{c}</p>
                       </div>
                     ))}
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Dialogue & Input Frame (7 cols on large) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Topic Selector Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
             {TOPICS.map(topic => (
               <Button
                 key={topic.id}
                 variant={activeTopic.id === topic.id ? "default" : "outline"}
                 onClick={() => handleTopicChange(topic)}
                 className={`rounded-full px-5 py-2.5 text-xs font-extrabold whitespace-nowrap grow sm:grow-0 transition-all ${
                   activeTopic.id === topic.id 
                     ? "bg-indigo-650 hover:bg-indigo-750 text-white shadow-md" 
                     : "text-slate-600 border-slate-200 dark:border-white/10"
                 }`}
               >
                 {topic.label}
               </Button>
             ))}
          </div>

          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-xl flex flex-col h-[520px]">
            
            {/* Conversation Headers */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-55 dark:bg-white/2 shrink-0 flex items-center justify-between">
              <div>
                <span className="block text-[8px] font-black uppercase text-indigo-500 tracking-wider">Currently Practicing</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{activeTopic.label}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleTopicChange(activeTopic)} 
                className="text-slate-400 hover:text-indigo-500 rounded-full h-9 w-9"
                title="Restart Conversation Feed"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Conversation Messages Thread Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/45 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className={`p-4 rounded-3xl text-sm leading-normal font-medium ${
                        m.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'
                      }`}>
                        {m.text}
                      </div>
                      <span className={`block text-[10px] text-slate-400 dark:text-slate-500 font-medium ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Processing/Thinking indicator */}
                {isLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 shrink-0 border border-slate-100 dark:border-white/5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-3xl rounded-tl-none border border-slate-100 dark:border-white/5">
                      <div className="flex space-x-1.5 items-center justify-center py-1">
                        <div className="w-2 h-2 bg-slate-400 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* User's Audio Live Speaking transcription display block */}
                {isRecording && liveTranscript && (
                  <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-650 shrink-0 border border-white/5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="bg-rose-50 text-rose-850 dark:bg-rose-950/20 dark:text-rose-300 p-4 rounded-3xl rounded-tr-none border border-rose-500/20 italic text-xs flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                       "{liveTranscript}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Speaking mic trigger & Input console bar */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-55 dark:bg-white/2 shrink-0 space-y-4">
              
              {/* Voice recognition helper suggestion strip */}
              {isRecording && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/5 rounded-2xl border border-rose-500/20 text-rose-500 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <p className="font-bold uppercase tracking-wider text-[9px]">English forced: Speaking mode is active. Click red square to pause.</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Voice capture Microphone trigger button */}
                <Button 
                  onClick={isRecording ? stopMic : startMic}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    isRecording 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
                      : 'bg-primary/10 hover:bg-primary/20 text-primary dark:text-indigo-400'
                  }`}
                  title={isRecording ? "Stop Recording Response" : "Click to Speak"}
                >
                  {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Fallback typing text container */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isRecording ? "Transcribing voice..." : "Acknowledge Clara here in English..."}
                    disabled={isRecording || isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputText.trim()) {
                        sendMessage();
                      }
                    }}
                    className="w-full h-14 pl-5 pr-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white placeholder-slate-400"
                  />
                  
                  <Button 
                    onClick={() => sendMessage()}
                    disabled={!inputText.trim() || isRecording || isLoading}
                    size="icon" 
                    className="absolute right-2.5 top-2.5 w-9 h-9 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
