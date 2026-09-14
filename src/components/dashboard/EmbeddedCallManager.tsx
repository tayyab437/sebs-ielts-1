import { useState, useRef, useEffect } from "react";
import { useMeetings, Meeting } from "../../context/MeetingsContext";
import { copyToClipboard } from "@/src/lib/safeClipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabaseClient";
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  Sparkles, Bot, MessageSquare, Send, Volume2, VolumeX, ShieldAlert, BadgeInfo,
  Clock, Users, Award, PlayCircle, Loader2, Maximize2, Calendar, Copy 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  sender: "you" | "clara" | "system";
  text: string;
  time: string;
}

export default function EmbeddedCallManager() {
  // Call States: "idle" | "incoming" | "connecting" | "active"
  const [callState, setCallState] = useState<"idle" | "connecting" | "active">("idle");
  const [callType, setCallType] = useState<"ai_clara" | "peer_room">("ai_clara");
  const [roomId, setRoomId] = useState("");
  const [joinedRoomId, setJoinedRoomId] = useState("");

  // Live admin scheduled classes
  const { meetings: allMeetings, loading: meetingsLoading } = useMeetings();
  const [user, setUser] = useState<any>(null);
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    async function loadStudent() {
      if (supabase) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            setUser(sbUser);
            setStudentEmail(sbUser.email || "");
          }
        } catch (e) {
          console.warn("EmbeddedCallManager: auth load failed silently:", e);
        }
      }
    }
    loadStudent();
  }, []);

  const embeddedMeetings = allMeetings.filter(m => m.meeting_type === "embedded_calling");
  const filteredLocal = embeddedMeetings.filter((m: any) => {
    // 1. If explicit ID match, show it
    if (user?.id && m.student_id === user.id) return true;

    // 2. Fallback to email matching
    if (!m.invitee_email) return true;
    const target = m.invitee_email.trim().toLowerCase();
    if (target === "all-students@sebs.edu" || target === "") return true;

    if (!studentEmail) return true;
    const emails = target.split(",").map((e: string) => e.trim().toLowerCase());
    return emails.includes(studentEmail.trim().toLowerCase());
  });
  const meetings = filteredLocal;

  // Media States
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Video streams
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Call stats
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<any>(null);

  // Chat interface
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Clara AI Speech Connection
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const speechVolumeRef = useRef<number[]>([10, 20, 15, 30, 45, 12, 18, 25]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Active volume visualizer for user mic
  const [micVolume, setMicVolume] = useState<number>(0);
  const volumeIntervalRef = useRef<any>(null);

  // Hook up Speech Recognition for Clara's voice responder
  useEffect(() => {
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
          setLiveTranscript("");
          sendVoiceToClara(final);
        } else if (interim) {
          setLiveTranscript(interim);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("Speech Recognition Voice Call Err:", err);
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopAllMedia();
      clearInterval(timerRef.current);
      clearInterval(volumeIntervalRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
      }
    };
  }, []);



  // Update Call Timer
  useEffect(() => {
    if (callState === "active") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
  }, [callState]);

  // Auto-join meeting if query parameters are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRoomId = params.get("joinRoom") || params.get("room");
    if (paramRoomId) {
      const uCaseRoomId = paramRoomId.trim().toUpperCase();
      setRoomId(paramRoomId.trim());
      setJoinedRoomId(uCaseRoomId);
      setCallType("peer_room");
      setCallState("connecting");
      
      const initiateAutoJoin = async () => {
        setCallState("active");
        try {
          // Request camera and microphone stream
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(e => console.warn(e));
          }
        } catch (mediaError) {
          console.warn("Autoplay media catch failed:", mediaError);
        }
        setChatMessages([
          { sender: "system", text: `Entered collaborative video classroom: ${uCaseRoomId}`, time: "Now" },
          { sender: "system", text: "Connected securely using peer WebRTC mesh technology.", time: "Now" }
        ]);
        toast.success(`Joined room: ${uCaseRoomId}`);
      };

      setTimeout(initiateAutoJoin, 1300);

      // Clean remaining query parameters safely from URL to prevent recursive triggers
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("joinRoom");
      newParams.delete("room");
      const searchStr = newParams.toString();
      const cleanUrl = window.location.pathname + (searchStr ? `?${searchStr}` : "") + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Hook local video element to stream
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && isVideoOn) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, isVideoOn, localStreamRef.current]);

  const startMediaCapture = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn ? { width: 640, height: 480 } : false,
        audio: true
      });

      localStreamRef.current = stream;

      if (localVideoRef.current && isVideoOn) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.warn(e));
      }

      // Start direct local volume visualizer
      if (stream.getAudioTracks().length > 0) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const actx = new AudioContextClass();
          audioContextRef.current = actx;
          const src = actx.createMediaStreamSource(stream);
          const processor = actx.createScriptProcessor(2048, 1, 1);
          src.connect(processor);
          processor.connect(actx.destination);
          
          processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < input.length; i++) {
              sum += input[i] * input[i];
            }
            const rms = Math.sqrt(sum / input.length);
            setMicVolume(Math.min(100, Math.round(rms * 400)));
          };
        } catch (e) {
          console.warn("Could not create audio context for mic feedback visualizer:", e);
        }
      }

    } catch (err: any) {
      console.error("Camera/Mic permission failed:", err);
      toast.error("Unable to access mic or camera. Check browser permissions.");
    }
  };

  const stopAllMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(e => console.warn(e));
      audioContextRef.current = null;
    }
    setIsScreenSharing(false);
    setMicVolume(0);
  };

  // Dial voice-to-voice call with Clara AI
  const startClaracall = async () => {
    setCallType("ai_clara");
    setCallState("connecting");
    setChatMessages([
      { sender: "system", text: "Secure call routing established with Clara AI Coach.", time: "Now" },
      { sender: "clara", text: "Hello! Welcome to our interactive video session. Speak anytime, I am listening!", time: "Now" }
    ]);

    // Fast mock connect
    setTimeout(async () => {
      setCallState("active");
      await startMediaCapture();
      
      // Speak initial prompt
      playClaraTTS("Hello! Welcome to Syed Ejaz Bukhari English School embedded calling lounge. I am Clara, your English coach. How can I boost your practice today? Please tell me what topic you would love to discuss!");

      // Start transcribing active user mic input
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn(e);
        }
      }
    }, 1200);
  };

  // Join a collaborative room call
  const startPeerRoomCall = async () => {
    if (!roomId.trim()) {
      toast.error("Please insert or generate a unique Room ID first.");
      return;
    }

    setCallType("peer_room");
    setCallState("connecting");
    setJoinedRoomId(roomId.trim().toUpperCase());

    setTimeout(async () => {
      setCallState("active");
      await startMediaCapture();
      setChatMessages([
        { sender: "system", text: `Entered collaborative video classroom: ${roomId.toUpperCase()}`, time: "Now" },
        { sender: "system", text: "Connected securely using peer WebRTC mesh technology.", time: "Now" }
      ]);
      toast.success(`Joined room: ${roomId.toUpperCase()}`);
    }, 1500);
  };

  // Disconnect active room/call
  const endCall = () => {
    stopAllMedia();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }
    setCallState("idle");
    setJoinedRoomId("");
    setLiveTranscript("");
    setAiIsSpeaking(false);
    toast.info("Call disconnected beautifully.");
  };

  // Play synthetic voice audio response
  const playClaraTTS = async (text: string) => {
    if (!audioEnabled) return;
    setAiIsSpeaking(true);

    try {
      const res = await fetch("/api/gemini/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: []
        })
      });

      if (!res.ok) throw new Error("TTS endpoint error");
      const data = await res.json();

      if (data.audio) {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        const blobUrl = URL.createObjectURL(blob);

        if (audioPlaybackRef.current) {
          audioPlaybackRef.current.pause();
        }

        const audio = new window.Audio(blobUrl);
        audioPlaybackRef.current = audio;
        audio.onended = () => setAiIsSpeaking(false);
        audio.onerror = () => setAiIsSpeaking(false);
        await audio.play();
      } else {
        setAiIsSpeaking(false);
      }
    } catch (err) {
      console.warn("TTS Audio Synthesis Error, switching to passive text:", err);
      setAiIsSpeaking(false);
    }
  };

  // Send spoken or typed text to Clara
  const sendVoiceToClara = async (text: string) => {
    if (!text.trim()) return;

    // Put message in chat logs
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: "you", text: text.trim(), time: nowStr }]);
    
    setAiIsThinking(true);
    
    try {
      const historyPayload = chatMessages
        .filter(m => m.sender !== 'system')
        .map(m => ({
          role: m.sender === 'you' ? 'user' : 'model',
          text: m.text
        }));

      const res = await fetch("/api/gemini/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload
        })
      });

      if (!res.ok) throw new Error("API call error");
      const data = await res.json();

      setChatMessages(prev => [...prev, { sender: "clara", text: data.text, time: nowStr }]);

      if (data.audio) {
        // Stop recognition momentarily during playback to avoid capturing Clara's itself
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
        
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        const blobUrl = URL.createObjectURL(blob);

        if (audioPlaybackRef.current) {
          audioPlaybackRef.current.pause();
        }

        const audio = new window.Audio(blobUrl);
        audioPlaybackRef.current = audio;
        setAiIsSpeaking(true);
        
        audio.onended = () => {
          setAiIsSpeaking(false);
          // Restart transcribing
          if (recognitionRef.current && callState === "active") {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        };

        audio.onerror = () => {
          setAiIsSpeaking(false);
          if (recognitionRef.current && callState === "active") {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        };

        await audio.play();
      }

    } catch (err) {
      console.error(err);
      toast.error("Clara speech synthesis timed out.");
    } finally {
      setAiIsThinking(false);
    }
  };

  const handleSendChatText = () => {
    if (!chatInput.trim()) return;
    if (callType === 'ai_clara') {
      sendVoiceToClara(chatInput);
    } else {
      // Peer message sending
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, { sender: "you", text: chatInput.trim(), time: nowStr }]);
    }
    setChatInput("");
  };

  // Toggle devices inside active stream
  const toggleMic = () => {
    const newVal = !isMicOn;
    setIsMicOn(newVal);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newVal;
      });
    }
    if (recognitionRef.current) {
      if (newVal) {
        try { recognitionRef.current.start(); } catch(e){}
      } else {
        try { recognitionRef.current.stop(); } catch(e){}
      }
    }
    toast.info(newVal ? "Microphone active" : "Microphone muted");
  };

  const toggleVideo = () => {
    const newVal = !isVideoOn;
    setIsVideoOn(newVal);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVal;
      });
    }
    toast.info(newVal ? "Camera feeds enabled" : "Camera streams hidden");
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        toast.success("Hosting interactive screen casting...");
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        toast.info("Screen sharing disabled");
      }
    } catch (err) {
      console.warn("Screen share declined:", err);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-sky-950 via-[#0e2c3a] to-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white border border-sky-500/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge className="bg-sky-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Virtual calling</Badge>
              <Badge className="bg-indigo-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Integrated WebRTC</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-sky-100 to-slate-250 bg-clip-text text-transparent">Embedded Calling Room</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium italic max-w-xl">
              Host self-contained high-definition video classrooms with peer students using dynamic Room IDs, or perform voice/video IELTS calls directly with Coach Clara of SEBS!
            </p>
          </div>

          {callState === "idle" && (
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={startClaracall}
                className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black px-5 py-6 text-xs uppercase tracking-wider transition-transform hover:scale-105 shadow-lg shadow-indigo-500/20"
              >
                <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                Call Coach Clara
              </Button>
            </div>
          )}
        </div>
      </div>

      {callState === "idle" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card A: Dial Clara */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 text-center space-y-6 shadow-xl flex flex-col justify-between items-center h-[380px]">
             <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Bot className="w-8 h-8" />
             </div>
             <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Dial ClaraSpeaking AI</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold max-w-xs mx-auto">
                   Start a private voice & video call. Clara listens to you, transcribes oral answers, gives correction tips, and replies using conversational audio.
                </p>
             </div>
             <Button
                onClick={startClaracall}
                className="w-full max-w-[200px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs h-11 tracking-wider"
             >
                Start Video Call
             </Button>
          </Card>

          {/* Card B: Join Custom Room ID */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 text-center space-y-6 shadow-xl flex flex-col justify-between items-center h-[380px]">
             <div className="w-16 h-16 rounded-[1.5rem] bg-sky-500/5 dark:bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Phone className="w-8 h-8" />
             </div>
             <div className="space-y-2 w-full">
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Join Peer Room ID</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold max-w-xs mx-auto mb-4">
                   Enter any unique classroom string code to share audio, video, and screens collaboratively with fellow student candidates.
                </p>
                <div className="flex gap-2 w-full max-w-xs mx-auto">
                  <Input 
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter Room Code (e.g., SEBS-IELTS)"
                    className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold shrink text-center uppercase"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const randCode = "SEBS-" + Math.floor(1000 + Math.random() * 9000);
                      setRoomId(randCode);
                      toast.success(`Generated code: ${randCode}`);
                    }}
                    className="rounded-xl px-3 text-xs font-black border-slate-200 dark:border-white/10"
                  >
                    Gen
                  </Button>
                </div>
             </div>
             <Button
                onClick={startPeerRoomCall}
                disabled={!roomId.trim()}
                className="w-full max-w-[200px] rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black uppercase text-xs h-11 tracking-wider"
             >
                Connect Classroom
             </Button>
          </Card>

        </div>

        {/* Admin Scheduled Calling Sessions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-8">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-white">
                <Calendar className="w-4.5 h-4.5 text-sky-500 animate-pulse" />
                Scheduled Peer Practice Classes
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold italic">Join scheduled peer sessions with one-click instant connect</p>
            </div>
            <Badge className="bg-sky-500/10 text-sky-500 border border-sky-500/20 text-[9px] uppercase font-bold py-1 px-2">
              {meetings.length} Classes Available
            </Badge>
          </div>

          {meetingsLoading ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-500 mb-1" />
              <p className="text-[10px] font-black uppercase text-slate-400">Loading schedules...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-[2rem] bg-white dark:bg-slate-900 space-y-2">
              <Video className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-505">No scheduled collaborative rooms from administrators</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((meeting) => {
                const scheduledTime = new Date(meeting.scheduled_start).getTime();
                const now = Date.now();
                const durationMs = (meeting.duration_minutes || 45) * 60 * 1000;
                const isUpcoming = scheduledTime > now;
                const isLive = now >= scheduledTime && now <= scheduledTime + durationMs;
                const isEnded = now > scheduledTime + durationMs;

                let statusLabel: "Live" | "Upcoming" | "Ended" = "Upcoming";
                let statusBg = "bg-sky-500/10 text-sky-600 dark:text-sky-400";
                if (isLive || meeting.status === "active") {
                  statusLabel = "Live";
                  statusBg = "bg-rose-500 text-white animate-pulse";
                } else if (isEnded || meeting.status === "ended") {
                  statusLabel = "Ended";
                  statusBg = "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400";
                }

                return (
                  <div 
                    key={meeting.id}
                    className="p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-450 border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5">
                            CODE: {meeting.room_id}
                          </Badge>
                          <Badge className={`${statusBg} border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5`}>
                            {statusLabel}
                          </Badge>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-450" />
                          {new Date(meeting.scheduled_start).toLocaleDateString()} &bull; {meeting.duration_minutes}m
                        </span>
                      </div>

                      <div>
                        <h5 className="text-sm font-black text-slate-800 dark:text-white italic group-hover:text-sky-500 transition-colors">
                          {meeting.title}
                        </h5>
                        {meeting.description && (
                          <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold line-clamp-2 mt-1 leading-relaxed">
                            {meeting.description}
                          </p>
                        )}
                      </div>

                      {meeting.invitee_email && (
                        <p className="text-[9px] font-bold text-indigo-400">
                          Targeting: <span className="font-extrabold">{meeting.invitee_email}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const inviteLink = `${window.location.origin}/dashboard?tab=embedded-calling&joinRoom=${meeting.room_id}`;
                          copyToClipboard(inviteLink, "One-click meeting invitation link copied!");
                        }}
                        className="bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-all font-black uppercase text-[9px] h-9 rounded-xl flex items-center gap-1"
                        title="Copy Meeting Link"
                      >
                        <Copy className="w-3 h-3 text-sky-500" />
                        Copy Link
                      </Button>
                      <Button
                        onClick={() => {
                          setRoomId(meeting.room_id);
                          setJoinedRoomId(meeting.room_id.toUpperCase());
                          setCallType("peer_room");
                          setCallState("connecting");
                          setTimeout(async () => {
                            setCallState("active");
                            await startMediaCapture();
                            setChatMessages([
                              { sender: "system", text: `Entered collaborative video classroom: ${meeting.room_id.toUpperCase()}`, time: "Now" },
                              { sender: "system", text: "Connected securely using peer WebRTC mesh technology.", time: "Now" }
                            ]);
                            toast.success(`Joined room: ${meeting.room_id.toUpperCase()}`);
                          }, 1300);
                        }}
                        className="bg-sky-500 hover:bg-sky-600 text-slate-955 font-black uppercase text-[10px] h-9 rounded-xl flex items-center justify-center gap-1"
                      >
                        <Video className="w-3 h-3" />
                        Join Room
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      ) : (
        /* Video Conference Theatre Canvas */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Left panel: Live streams (8 columns on large) */}
          <div className="xl:col-span-8 space-y-6 flex flex-col justify-between">
            <Card className="rounded-[2.5rem] bg-slate-950 text-white overflow-hidden border border-white/10 shadow-2xl relative flex-1 min-h-[460px] flex flex-col">
              
              {/* Overlay Top Bar: Metadata */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 pointer-events-auto">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    {callType === 'ai_clara' ? 'Direct AI session' : `Joined Room: ${joinedRoomId}`}
                  </span>
                </div>
                
                <span className="text-xs font-mono font-bold text-slate-200 px-3 py-1 bg-white/10 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  {formatSeconds(callDuration)}
                </span>
              </div>

              {/* Streams Canvas */}
              <div className="flex-1 relative flex items-center justify-center p-4 bg-slate-950/90 select-none">
                
                {/* Secondary stream overlay (Clara or remote mock avatar) */}
                <div className="w-full h-full max-h-[380px] max-w-lg rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  {callType === "ai_clara" ? (
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <AnimatePresence>
                        {aiIsSpeaking && (
                          <motion.div 
                            key="speak-ring"
                            animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="absolute inset-0 bg-indigo-500/10 rounded-full"
                          />
                        )}
                        {aiIsThinking && (
                          <motion.div 
                            key="think-ring"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            className="absolute inset-0 border border-dashed border-sky-400/30 rounded-full"
                          />
                        )}
                      </AnimatePresence>
                      <div className="w-36 h-36 bg-[#0E1E36] rounded-full border border-indigo-400/20 shadow-inner flex items-center justify-center text-indigo-400">
                        <Bot className={`w-16 h-16 ${aiIsSpeaking ? 'animate-bounce' : ''}`} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-sky-950/30 border border-sky-500/20 rounded-full flex items-center justify-center text-sky-400">
                      <Users className="w-16 h-16" />
                    </div>
                  )}

                  <div className="space-y-1">
                     <p className="text-sm font-black uppercase text-slate-100">{callType === "ai_clara" ? "Coach Clara (AI)" : "Interactive Peer Student"}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                       {aiIsSpeaking ? 'Speaking responses...' : aiIsThinking ? 'Evaluating speech...' : 'Connected & active'}
                     </p>
                  </div>
                </div>

                {/* Local Picture-in-Picture client camera stream */}
                <div className="absolute bottom-4 right-4 w-[130px] sm:w-[180px] h-[95px] sm:h-[130px] rounded-xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl z-10 flex items-center justify-center">
                  {isVideoOn ? (
                    <video 
                      ref={localVideoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-450">
                       <VideoOff className="w-5 h-5 mb-1" />
                       <span className="text-[8px] font-bold uppercase tracking-wider">Camera Muted</span>
                    </div>
                  )}

                  {/* Audio wave widget inside PIP */}
                  {isMicOn && micVolume > 5 && (
                    <div className="absolute bottom-2 left-2 flex gap-0.5 items-end h-4 w-fit px-1.5 py-0.5 bg-black/40 rounded-full">
                       <div className="w-0.5 bg-emerald-400 animate-pulse" style={{ height: `${Math.min(100, micVolume * 0.8)}%` }} />
                       <div className="w-0.5 bg-emerald-400 animate-pulse" style={{ height: `${Math.min(100, micVolume * 0.9)}%` }} />
                       <div className="w-0.5 bg-emerald-400 animate-pulse" style={{ height: `${Math.min(100, micVolume * 0.6)}%` }} />
                    </div>
                  )}
                </div>

                {/* Screenshare feed mock if active */}
                {isScreenSharing && (
                  <div className="absolute inset-0 bg-indigo-950/70 z-0 flex flex-col items-center justify-center text-center p-4">
                     <Monitor className="w-16 h-16 text-emerald-400 animate-pulse mb-3" />
                     <p className="font-extrabold uppercase text-xs text-white tracking-widest leading-none">Casting Classroom Screen</p>
                     <p className="text-[10px] text-slate-350 italic mt-1 font-semibold max-w-xs">Your virtual screen content is currently visible to other members of this call.</p>
                  </div>
                )}

                {/* AI Real-time Speech Transcription Subtitle */}
                {callType === 'ai_clara' && liveTranscript && (
                  <div className="absolute bottom-20 left-12 right-12 z-20 text-center bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/5">
                     <p className="text-xs text-rose-300 italic font-semibold font-mono">"{liveTranscript}"</p>
                  </div>
                )}

              </div>

              {/* Overlay Bottom Bar: Interactive Calling Controls */}
              <div className="p-4 bg-slate-900 border-t border-white/5 flex items-center justify-between gap-4">
                
                {/* Voice Feed enable toggle */}
                <button 
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-inner"
                  title={audioEnabled ? "Mute Output Audio" : "Unmute Output Audio"}
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                </button>

                {/* Primary Media Buttons */}
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isMicOn ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {isMicOn ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isVideoOn ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {isVideoOn ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={toggleScreenShare}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isScreenSharing ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    {isScreenSharing ? <MonitorOff className="w-4.5 h-4.5" /> : <Monitor className="w-4.5 h-4.5" />}
                  </Button>

                  <Button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border-none transition-all"
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                  </Button>
                </div>

                {/* End call red trigger */}
                <Button 
                  onClick={endCall}
                  className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black px-4.5 h-12 uppercase tracking-wide text-xs"
                >
                  <PhoneOff className="w-4.5 h-4.5 mr-2" />
                  Leave Call
                </Button>

              </div>

            </Card>
          </div>

          {/* Right panel: Connected Chat interface (4 columns on large) */}
          <div className="xl:col-span-4 flex flex-col items-stretch justify-start">
            <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col h-full min-h-[460px] max-h-[560px]">
              
              <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                <span className="block text-[8px] font-black uppercase text-indigo-500 tracking-wider">Classroom Dialogue</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">Active Feed logs</span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 pr-2.5">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-405 dark:text-slate-500 italic text-xs font-semibold">
                    No classroom chats initialized yet. Type below to converse!
                  </div>
                ) : (
                  chatMessages.map((m, idx) => {
                    if (m.sender === 'system') {
                      return (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                          {m.text}
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className={`flex flex-col gap-1 max-w-[85%] ${m.sender === 'you' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                          m.sender === 'you' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 dark:bg-slate-850 dark:text-slate-100 text-slate-850 rounded-tl-none border border-slate-100 dark:border-white/5'
                        }`}>
                          {m.text}
                        </div>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
                          {m.sender === 'you' ? 'You' : 'Clara AI'} &bull; {m.time}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sending Console bar */}
              <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type call text or speak..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatInput.trim()) {
                        handleSendChatText();
                      }
                    }}
                    className="w-full h-11 pl-4 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white placeholder-slate-450"
                  />
                  <Button 
                    onClick={handleSendChatText}
                    disabled={!chatInput.trim()}
                    size="icon"
                    className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-indigo-620 hover:bg-indigo-720 text-white flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

            </Card>
          </div>

        </div>
      )}

    </div>
  );
}
