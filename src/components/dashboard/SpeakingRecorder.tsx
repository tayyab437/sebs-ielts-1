import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Mic, Square, Play, Trash, Save, 
  Loader2, Volume2, AlertCircle, CheckCircle2, Pause 
} from "lucide-react";
import { supabase } from "@/src/lib/supabaseClient";
import { motion, AnimatePresence } from "motion/react";

interface SpeakingRecorderProps {
  onComplete: (data: { audioUrl: string; transcript: string; analysis?: any }) => void;
  prompt: string;
}

export function SpeakingRecorder({ onComplete, prompt }: SpeakingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };
    }

    return () => {
      // Cleanup: Stop all recording and tracks when component unmounts
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const startRecording = async () => {
    setAnalysisResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // IMPORTANT: Stop the stream tracks when recording stops
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      if (recognitionRef.current) {
        setTranscript("");
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Speech recognition already started or failed:", e);
        }
      }
      
      setIsRecording(true);
      setIsPaused(false);
      setErrorMsg("");
      setTimer(0);
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      // Give a more descriptive error if it's permission denied
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message.includes('Permission denied')) {
          setErrorMsg("Microphone access was denied. Please allow microphone access in your browser settings to record your response.");
      } else {
          setErrorMsg(err.message || "Could not access the microphone. Please check your system settings.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (recognitionRef.current) {
         try { recognitionRef.current.stop(); } catch(e) {}
      }
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    if (!supabase) {
        alert("Supabase is not configured.");
        return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileName = `speaking/${user.id}/${Date.now()}.webm`;
      
      // Upload to Supabase Storage
      let finalPublicUrl = "";
      const { data, error } = await supabase.storage
        .from('speaking-responses')
        .upload(fileName, audioBlob);

      if (error) {
        if (error.message && error.message.toLowerCase().includes("bucket not found")) {
          console.warn("Supabase Storage bucket 'speaking-responses' not found. Falling back to local URL.");
          finalPublicUrl = URL.createObjectURL(audioBlob);
        } else {
          throw error;
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('speaking-responses')
          .getPublicUrl(fileName);
        finalPublicUrl = publicUrl;
      }

      // AI Analysis
      setIsProcessing(true);
      
      // Convert blob to base64 for multimodal analysis
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        try {
          const response = await fetch('/api/gemini/analyze-speaking-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Audio,
              questionText: prompt,
              duration: timer,
              userId: user.id
            }),
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.status}`);
          }

          setAnalysisResult(result);

          onComplete({
            audioUrl: finalPublicUrl,
            transcript: result.transcript || transcript,
            analysis: result
          });
        } catch (err: any) {
          console.error("Analysis error:", err);
          alert(err.message || "Failed to analyze speaking response.");
        } finally {
          setIsUploading(false);
          setIsProcessing(false);
        }
      };
      
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to process speaking response.");
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetRecorder = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscript("");
    setTimer(0);
    setIsPaused(false);
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6">
      {!audioUrl ? (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 p-6">
          <div className="flex flex-col items-center gap-6">
            <div 
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${isRecording ? (isPaused ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 animate-pulse shadow-red-500/20') : 'bg-primary shadow-primary/20'}`}
            >
              {isRecording ? (isPaused ? <Pause className="w-8 h-8 text-white fill-current" /> : <Square className="w-8 h-8 text-white fill-current" />) : <Mic className="w-8 h-8 text-white" />}
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-black italic uppercase text-slate-800 dark:text-white">{isRecording ? (isPaused ? "Recording Paused" : "Recording Audio...") : "Ready to Speak?"}</h3>
              <p className="text-slate-400 font-bold italic uppercase text-[10px] tracking-widest mt-1">
                {isRecording ? `Recording in progress: ${formatTime(timer)}` : "Click the button below to begin"}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-4 py-3 rounded-xl max-w-sm text-center">
                 <p className="text-xs text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
                 <Button variant="link" size="sm" onClick={() => setErrorMsg("")} className="text-[10px] text-red-500 mt-1 h-auto p-0 hover:text-red-700">Dismiss</Button>
              </div>
            )}

            <div className="flex items-center gap-4">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black italic uppercase text-xs h-12 px-8 rounded-xl shadow-lg shadow-emerald-900/10 gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Recording
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black italic uppercase text-xs h-12 px-6 rounded-xl shadow-lg shadow-amber-900/10 gap-2"
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button 
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white font-black italic uppercase text-xs h-12 px-6 rounded-xl shadow-lg shadow-red-900/10 gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" /> Stop Recording
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {isRecording && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 px-4 w-full">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 min-h-[100px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Transcribing live:</p>
                <p className="text-slate-600 dark:text-slate-300 italic text-sm">{transcript || "Waiting for speech..."}</p>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-black italic uppercase text-slate-800 dark:text-white">Review Your Response</h3>
                </div>
                {!analysisResult && !isUploading && (
                  <Button variant="ghost" size="sm" onClick={resetRecorder} className="text-slate-400 hover:text-red-500 gap-2 font-black uppercase italic text-[10px]">
                    <Trash className="w-4 h-4" /> Re-record
                  </Button>
                )}
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 mb-6">
                <audio src={audioUrl} controls className="w-full h-10" />
              </div>
              
              {!analysisResult ? (
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Speech-to-Text Transcript</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic">
                    {transcript || "[Audio captured, ready for analysis]"}
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Overall Band", value: analysisResult.overallBand, color: "text-amber-500" },
                      { label: "Fluency", value: analysisResult.criteria?.fluencyCoherence?.band, color: "text-blue-500" },
                      { label: "Vocabulary", value: analysisResult.criteria?.lexicalResource?.band, color: "text-emerald-500" },
                      { label: "Grammar", value: analysisResult.criteria?.grammaticalRange?.band, color: "text-rose-500" },
                    ].map((card, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-center shadow-sm">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</p>
                        <p className={`text-xl font-black italic ${card.color}`}>{card.value || "N/A"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">AI Examiner Feedback</h4>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Transcript</p>
                          <p className="text-xs italic text-slate-600 dark:text-slate-300">{analysisResult.transcript}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Improvement Suggestions</p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">{analysisResult.suggestions}</p>
                       </div>
                    </div>
                  </div>

                  <Button onClick={resetRecorder} variant="outline" className="w-full h-12 rounded-xl font-black italic uppercase text-[10px] tracking-widest">
                    Try Again / Practice More
                  </Button>
                </motion.div>
              )}

              {!analysisResult && (
                <div className="mt-8">
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black italic shadow-xl shadow-emerald-900/10 text-white"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> AI is Analyzing Audio...</>
                    ) : (
                      <><Save className="w-5 h-5 mr-2" /> Submit & Get AI Analysis</>
                    )}
                  </Button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
