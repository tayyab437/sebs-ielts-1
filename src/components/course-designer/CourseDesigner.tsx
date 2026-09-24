import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { CourseData, BlockData, LayoutType } from "./types";
import { EditorCanvas } from "./EditorCanvas";
import { BlockRenderer } from "./BlockRenderer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Eye, Layout, Columns, RefreshCw, Layers, Plus, Search, BookOpen, Trash2, ChevronRight, FileCode, Upload, Play, Pause, Volume2, VolumeX, FileText, Music, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CourseAccessTierPicker } from "@/src/components/admin/CourseAccessTierPicker";
import { syncCourseTierAccess } from "@/src/lib/membershipService";

const safeUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "uuid-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
};

// AudioWaveformPreview Component: Decodes peaks from loaded HTML5 audio or falls back to stylized pseudo-random wave
interface AudioWaveformPreviewProps {
  audioUrl: string;
}

export function AudioWaveformPreview({ audioUrl }: AudioWaveformPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const numberOfBars = 55;
    
    const extractPeaks = async () => {
      try {
        if (!audioUrl) {
          throw new Error("No audio URL provided");
        }
        
        // Skip decoding base64 audio or extremely long URL strings to avoid main-thread freeze
        if (audioUrl.startsWith("data:") || audioUrl.length > 2000) {
          throw new Error("Skipping decoding for base64 or long data URL to prevent UI hang");
        }

        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Skip decoding if file size is larger than 10MB (keeps UI snappy)
        if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
          throw new Error("Skipping decoding for large audio file to prevent UI hang");
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const rawData = audioBuffer.getChannelData(0);
        const samplesPerBin = Math.floor(rawData.length / numberOfBars);
        const list: number[] = [];
        for (let i = 0; i < numberOfBars; i++) {
          let max = 0;
          for (let j = 0; j < samplesPerBin; j++) {
            const val = Math.abs(rawData[i * samplesPerBin + j] || 0);
            if (val > max) max = val;
          }
          list.push(max);
        }
        const maxPeak = Math.max(...list) || 1;
        setPeaks(list.map(p => Math.max(0.18, p / maxPeak)));
      } catch (e) {
        // Fallback to high-end pseudo-random wave graphics
        const list: number[] = [];
        for (let i = 0; i < numberOfBars; i++) {
          const angle = (i / numberOfBars) * Math.PI;
          const base = Math.sin(angle);
          const val = Math.abs(base * 0.75 + Math.sin(angle * 6) * 0.15 + Math.cos(angle * 12) * 0.1);
          list.push(Math.max(0.15, Math.min(0.95, val)));
        }
        setPeaks(list);
      } finally {
        setIsLoading(false);
      }
    };

    extractPeaks();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback error:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current || !duration) return;
    const targetTime = (index / peaks.length) * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const changePlaybackSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const activeBarIndex = duration > 0 ? Math.floor((currentTime / duration) * peaks.length) : -1;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in duration-300 mt-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        className="hidden"
      />
      
      {/* Waveform Bars */}
      <div className="relative h-16 w-full flex items-end justify-between px-2 bg-slate-950/60 rounded-2xl border border-slate-850 overflow-hidden group">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            Analyzing Audio Waves...
          </div>
        )}
        
        {peaks.map((height, idx) => {
          const isActive = idx <= activeBarIndex;
          return (
            <button
              key={idx}
              type="button"
              className="flex-1 max-w-[4px] transition-all focus:outline-none hover:scale-y-110"
              style={{
                height: `${height * 85}%`,
                marginLeft: "1px",
                marginRight: "1px"
              }}
              onClick={() => handleSeek(idx)}
              title={`Seek to ${formatTime((idx / peaks.length) * duration)}`}
            >
              <div 
                className={`w-full h-full rounded-full transition-colors duration-150 ${
                  isActive 
                    ? "bg-indigo-400 dark:bg-indigo-300" 
                    : "bg-slate-700 dark:bg-slate-800 hover:bg-slate-600"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Controllers */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handlePlayPause}
            className={`w-9 h-9 p-0 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? "bg-red-500 hover:bg-red-650 text-white" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white translate-x-[1px]" />}
          </Button>

          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <span className="text-indigo-400 font-extrabold">{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleMute}
            className="w-8 h-8 p-0 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={changePlaybackSpeed}
            className="px-2.5 h-8 text-[9px] font-black tracking-wider uppercase border border-slate-800 hover:bg-slate-850 hover:text-indigo-400 rounded-xl flex items-center justify-center"
            title="Speed Modifier"
          >
            {playbackSpeed}x SPEED
          </Button>
        </div>
      </div>
    </div>
  );
}

const MOCK_DB: Record<string, any> = {};

export function CourseDesignerComponent({ initialId }: { initialId?: string }) {
  const [course, setCourse] = useState<CourseData>({
    title: "",
    description: "",
    thumbnail_url: "",
    thumbnail_type: "image",
    course_type: "Reading Test",
    type: "Academic (AC)",
    category: "Reading Mastery",
    content: "",
    layout_type: "single",
    status: "draft",
    blocks: {
      single: [],
      left: [],
      right: []
    },
    timeLimit: 20,
    access_tier: "Free Trial"
  });

  const [isPreview, setIsPreview] = useState(false);
  const [isTranscriptPreviewOpen, setIsTranscriptPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [existingCourses, setExistingCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const activeIdRef = React.useRef<string | null>(null);

  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [draftValues, setDraftValues] = useState<Record<string, any>>({});

  const startEditing = (field: string, initialValue: any) => {
    setEditingFields(prev => ({ ...prev, [field]: true }));
    setDraftValues(prev => ({ ...prev, [field]: initialValue }));
  };

  const cancelEditing = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setDraftValues(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const updateCourseField = async (fieldName: string, value: any, extraFields?: Record<string, any>) => {
    let courseId = course.id || activeIdRef.current;
    
    // Auto initialize if missing
    if (!courseId) {
      courseId = safeUUID();
      activeIdRef.current = courseId;
      setCourse(prev => ({ ...prev, id: courseId }));
      localStorage.setItem('active_course_designer_id', courseId);
      if (supabase) {
        try {
          await supabase.from('courses').upsert([{ id: courseId, title: "Untitled" }]);
        } catch (e) {
          console.error("Failed to initialize course in db during quick update:", e);
        }
      }
    }

    // Map state fields to DB columns
    let updatePayload: Record<string, any> = {};
    
    if (fieldName === 'title') {
      updatePayload = { title: value };
    } else if (fieldName === 'description') {
      updatePayload = { description: value };
    } else if (fieldName === 'audio_url') {
      updatePayload = { audio_url: value };
    } else if (fieldName === 'transcript') {
      updatePayload = { 
        transcript_name: value.name || "", 
        transcript_url: value.url || "" 
      };
    } else if (fieldName === 'access_tier') {
      updatePayload = { access_tier: value };
      if (courseId) {
        syncCourseTierAccess(courseId, [value]).catch(console.warn);
      }
    } else if (fieldName === 'content') {
      updatePayload = { content: value };
    } else if (fieldName === 'type') {
      const dbType = value === "General Training (GT)" ? "General" : value === "Diagnostic" ? "Diagnostic" : "Academic";
      updatePayload = { 
        type: dbType,
        exam_category: value === "General Training (GT)" ? "General Training" : "Academic"
      };
    } else if (fieldName === 'course_type') {
      updatePayload = { 
        course_type: value,
        is_mock_test: value === "Mock Test"
      };
    } else if (fieldName === 'category') {
      updatePayload = { category: value };
    } else if (fieldName === 'test_number') {
      updatePayload = { test_number: value };
    } else if (fieldName === 'timeLimit') {
      updatePayload = { time_limit: value };
    } else if (fieldName === 'layout_type') {
      updatePayload = { 
        layout_type: value,
        course_format: course.course_type === "Mock Test" ? undefined : value
      };
    } else if (fieldName === 'visibility') {
      updatePayload = { 
        show_in_catalog: value.show_in_catalog !== false,
        show_in_syllabus: value.show_in_syllabus !== false,
        show_in_practice: value.show_in_practice !== false
      };
    } else if (fieldName === 'thumbnail') {
      updatePayload = { 
        thumbnail_url: value.url || "",
        featured_image: value.url || "",
        thumbnail_type: value.type || "image"
      };
    }

    if (extraFields) {
      updatePayload = { ...updatePayload, ...extraFields };
    }

    updatePayload.updated_at = new Date().toISOString();

    if (supabase) {
      try {
        const { error } = await supabase
          .from('courses')
          .update(updatePayload)
          .eq('id', courseId);
          
        if (error) {
          console.error(`Failed to update field ${fieldName} in Supabase:`, error);
          toast.error(`Failed to update ${fieldName}: ${error.message}`);
          return false;
        }
        
        toast.success(`Updated ${fieldName.replace('_', ' ').toUpperCase()} in database!`);
        return true;
      } catch (err: any) {
        console.error(`Failed to update field ${fieldName} in Supabase:`, err);
        toast.error(`Error: ${err.message || err}`);
        return false;
      }
    } else {
      toast.error("Database connection unavailable.");
      return false;
    }
  };

  const saveField = async (field: string) => {
    const value = draftValues[field];
    const success = await updateCourseField(field, value);
    if (success) {
      setCourse(prev => {
        const updated = { ...prev };
        if (field === 'title') updated.title = value;
        else if (field === 'description') updated.description = value;
        else if (field === 'audio_url') updated.audio_url = value;
        else if (field === 'transcript') {
          updated.transcript_name = value.name;
          updated.transcript_url = value.url;
        }
        else if (field === 'access_tier') updated.access_tier = value;
        else if (field === 'content') updated.content = value;
        else if (field === 'type') updated.type = value;
        else if (field === 'course_type') updated.course_type = value;
        else if (field === 'category') updated.category = value;
        else if (field === 'test_number') updated.test_number = value;
        else if (field === 'timeLimit') updated.timeLimit = value;
        else if (field === 'layout_type') updated.layout_type = value;
        else if (field === 'visibility') {
          updated.show_in_catalog = value.show_in_catalog;
          updated.show_in_syllabus = value.show_in_syllabus;
          updated.show_in_practice = value.show_in_practice;
        }
        else if (field === 'thumbnail') {
          updated.thumbnail_url = value.url;
          updated.thumbnail_type = value.type;
        }
        return updated;
      });
      setEditingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const renderFieldHeader = (label: string, fieldKey: string, initialValue: any) => {
    const isEditing = !!editingFields[fieldKey];
    return (
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
          {label}
        </label>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => startEditing(fieldKey, initialValue)}
            className="p-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800"
            title={`Edit ${label}`}
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => saveField(fieldKey)}
              className="p-1 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              title="Save cell in database"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => cancelEditing(fieldKey)}
              className="p-1 px-2.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/25 transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              title="Cancel"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (initialId && initialId !== activeIdRef.current) {
      loadCourseIntoDesigner(initialId);
    }
  }, [initialId]);

  const courseRef = React.useRef(course);
  useEffect(() => {
    courseRef.current = course;
  }, [course]);

  // Fetch all existing tracks
  const fetchExistingCourses = async () => {
    try {
      if (!supabase) {
        const localCoursesStr = localStorage.getItem('mock_courses');
        const localCourses = localCoursesStr ? JSON.parse(localCoursesStr) : [];
        setExistingCourses(localCourses);
        return;
      }
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExistingCourses(data || []);
    } catch (err) {
      console.warn("Failed to fetch existing courses:", err);
    }
  };

  useEffect(() => {
    const initLoad = async () => {
      await fetchExistingCourses();
      
      // 1. Try restoring the exact full detailed draft first (unsaved canvas state)
      const savedDraftStr = localStorage.getItem('in_progress_course_designer_draft');
      const lastId = localStorage.getItem('active_course_designer_id');
      if (savedDraftStr) {
        try {
          const draft = JSON.parse(savedDraftStr);
          if (draft && draft.id === lastId && (draft.title || draft.description || (draft.blocks && (draft.blocks.single?.length > 0 || draft.blocks.left?.length > 0 || draft.blocks.right?.length > 0)))) {
            setCourse(draft);
            if (draft.id) {
              activeIdRef.current = draft.id;
            }
            return;
          }
        } catch (e) {
          console.warn("Failed to parse in_progress_course_designer_draft", e);
        }
      }
      
      // 2. Secondary fallback: load the last active course ID details
      if (lastId) {
        loadCourseIntoDesigner(lastId);
      }
    };
    initLoad();
  }, []);

  // Keep the in-progress draft synchronized in localStorage so we never lose current canvas inputs on page reload
  useEffect(() => {
    if (course.title || course.description || (course.blocks && (course.blocks.single?.length > 0 || course.blocks.left?.length > 0 || course.blocks.right?.length > 0))) {
      localStorage.setItem('in_progress_course_designer_draft', JSON.stringify(course));
    }
  }, [course]);

  // Auto-save removed as per user instruction. Course is now saved completely manually.

  const compileModulesJSON = (data: CourseData) => {
    const lessons: any[] = [];
    const cType = (data.course_type || "").toLowerCase();
    const skillType = cType.includes("reading") ? "reading"
                    : cType.includes("listening") ? "listening"
                    : cType.includes("writing") ? "writing"
                    : cType.includes("speaking") ? "speaking"
                    : "reading";
                    
    const mapBlockToMarkdown = (b: any) => {
      if (!b || !b.data) return "";
      const bType = (b.type || "").toLowerCase();
      const text = b.data.content || b.data.text || b.data.statement || b.data.question || b.data.title || "";
      if (bType === "heading") {
        return `\n\n## ${text}\n\n`;
      } else if (bType === "text" || bType === "reading-passage") {
        return `${text}\n\n`;
      } else if (bType === "note") {
        return `> **Note:** ${text}\n\n`;
      } else if (bType === "tip") {
        return `> **Tip:** ${text}\n\n`;
      } else if (bType === "band-descriptor") {
        return `> **Band Descriptor Advice:** ${text}\n\n`;
      } else if (bType === "divider") {
        return `\n\n---\n\n`;
      } else if (bType === "image") {
        return `![image](${b.data.url || ""})\n*${b.data.caption || ""}*\n\n`;
      } else if (bType === "audio") {
        return `*[Audio Track Embedded: ${b.data.url || ""}]*\n\n`;
      } else if (bType === "video") {
        return `*[Video Embedded: ${b.data.url || ""}]*\n\n`;
      } else if (bType === "pdf") {
        return `*[PDF Reference File: ${b.data.url || ""}]*\n\n`;
      } else if (bType === "table-completion") {
        const headers = b.data.headers || [];
        const rows = b.data.rows || [];
        if (headers.length === 0) return "";
        let md = "\n\n";
        md += "| " + headers.join(" | ") + " |\n";
        md += "| " + headers.map(() => "---").join(" | ") + " |\n";
        rows.forEach((row: any) => {
          md += "| " + row.map((cell: any) => cell || "").join(" | ") + " |\n";
        });
        md += "\n";
        if (b.data.text) {
          md += `${b.data.text}\n\n`;
        }
        return md;
      } else if (b.type === "matching-headings") {
        let md = "\n\n### List of Headings\n";
        if (Array.isArray(b.data.headings)) {
          b.data.headings.forEach((h: string) => {
            md += `* ${h}\n`;
          });
        } else {
          const headings = (b.data.headings || "").split("\n").filter(Boolean);
          headings.forEach(h => {
            md += `* ${h}\n`;
          });
        }
        md += "\n";
        return md;
      }
      return "";
    };

    const parseQuestionsFromBlock = (b: any, idx: number, currentStartQNum: number, lastRangeStart?: number | null, lastRangeCount?: number | null): any[] => {
      const questions: any[] = [];
      if (!b || !b.type || !b.data) return questions;
      const bType = (b.type || "").toLowerCase();
      const blockSecNum = b.sectionNumber || b.data?.sectionNumber || b.section || b.data?.section;

      if (bType === "mcq" || bType === "listening-mcq") {
        let derivedCorrectIndex = b.data.correctIndex !== undefined ? b.data.correctIndex : 0;
        const cleanCorrect = b.data.correct !== undefined ? b.data.correct : (b.data.correctAnswer !== undefined ? b.data.correctAnswer : "");
        if (cleanCorrect !== "") {
          const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 };
          const trimmed = String(cleanCorrect).trim();
          if (letterToIdx[trimmed] !== undefined) {
            derivedCorrectIndex = letterToIdx[trimmed];
          }
        }
        const qNum = b.data.questionNumber || b.data.qNum || b.data.correctIndex || currentStartQNum;
        questions.push({
          id: b.id || `mcq-${idx}-${qNum}`,
          type: "MCQ",
          text: b.data.question || b.data.text || b.data.content || "",
          sectionHeading: b.data.sectionHeading || "",
          sectionInstruction: b.data.sectionInstruction || b.data.instruction || "",
          options: b.data.options || b.data.choices || ["A", "B", "C", "D"],
          correctIndex: derivedCorrectIndex,
          sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
          _origQNum: qNum
        });
      } else if (bType === "true-false-not-given" || bType === "tf" || bType === "yes-no-not-given" || bType === "yn" || bType === "ynng" || bType === "true-false" || bType === "yes-no") {
        const isYN = bType.includes("yes") || bType.includes("yn");
        const optionsList = isYN ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];
        
        if (Array.isArray(b.data.statements)) {
          b.data.statements.forEach((st: any, sIdx: number) => {
            const qNum = st.qNum || (currentStartQNum + sIdx);
            let derivedCorrectIndex = 0;
            const tfToIdx: Record<string, number> = { "TRUE": 0, "FALSE": 1, "NOT GIVEN": 2, "YES": 0, "NO": 1, "NOT_GIVEN": 2 };
            const cleanAns = String(st.answer || st.correct || st.correctAnswer || "TRUE").toUpperCase().trim();
            if (tfToIdx[cleanAns] !== undefined) {
              derivedCorrectIndex = tfToIdx[cleanAns];
            }
            questions.push({
              id: st.id || `${b.id}-tf-${qNum}`,
              type: "TF",
              text: st.text || st.statement || st.content || "",
              sectionHeading: sIdx === 0 ? (b.data.sectionHeading || "") : "",
              sectionInstruction: sIdx === 0 ? (b.data.sectionInstruction || b.data.instruction || "") : "",
              options: optionsList,
              correctIndex: derivedCorrectIndex,
              sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
              _origQNum: qNum
            });
          });
        } else {
          let derivedCorrectIndex = b.data.correctIndex !== undefined ? b.data.correctIndex : 0;
          const cleanCorrect = b.data.correct !== undefined ? b.data.correct : (b.data.correctAnswer !== undefined ? b.data.correctAnswer : "");
          if (cleanCorrect !== "") {
            const tfToIdx: Record<string, number> = { "TRUE": 0, "FALSE": 1, "NOT GIVEN": 2, "YES": 0, "NO": 1, "NOT_GIVEN": 2 };
            const trimmed = String(cleanCorrect).toUpperCase().trim();
            if (tfToIdx[trimmed] !== undefined) {
              derivedCorrectIndex = tfToIdx[trimmed];
            }
          }
          const qNum = b.data.qNum || b.data.questionNumber || currentStartQNum;
          questions.push({
            id: b.id || `tf-${idx}-${qNum}`,
            type: "TF",
            text: b.data.statement || b.data.text || b.data.content || "",
            sectionHeading: b.data.sectionHeading || "",
            sectionInstruction: b.data.sectionInstruction || b.data.instruction || "",
            options: optionsList,
            correctIndex: derivedCorrectIndex,
            sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
            _origQNum: qNum
          });
        }
      } else if (bType === "fill-blanks" || bType === "listening-fill-blanks" || bType === "sentence-completion" || bType === "summary-completion" || bType === "table-completion" || bType === "blank" || bType === "inline_blanks") {
        if (Array.isArray(b.data.sentences)) {
          b.data.sentences.forEach((st: any, sIdx: number) => {
            const qNum = st.qNum || (currentStartQNum + sIdx);
            let textCleaned = st.text || st.statement || st.content || "";
            let cleanAns = st.answer || st.correct || st.correctAnswer || "";
            if (textCleaned.includes("[") && textCleaned.includes("]")) {
              const match = textCleaned.match(/\[([^\]]+)\]/);
              if (match && !cleanAns) {
                cleanAns = match[1];
              }
              textCleaned = textCleaned.replace(/\[[^\]]+\]/g, "_____");
            }
            questions.push({
              id: st.id || `${b.id}-sc-${qNum}`,
              type: "INLINE_BLANKS",
              text: textCleaned,
              sectionHeading: sIdx === 0 ? (b.data.sectionHeading || "") : "",
              sectionInstruction: sIdx === 0 ? (b.data.sectionInstruction || b.data.instruction || "") : "",
              correctAnswer: cleanAns,
              options: [],
              correctIndex: 0,
              sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
              _origQNum: qNum
            });
          });
        } else {
          let rawText = b.data.text || b.data.statement || b.data.content || "";
          if (bType === "table-completion") {
            rawText = rawText || "Complete the table with correct values.";
          }
          
          let blockAnswers = "";
          if (Array.isArray(b.data.answers)) {
            blockAnswers = b.data.answers.join("|");
          } else {
            blockAnswers = b.data.answers || "";
          }

          if (rawText.includes("[") && rawText.includes("]")) {
            if (!blockAnswers) {
              const extractedList: string[] = [];
              const regex = /\[([^\]]+)\]/g;
              let match;
              while ((match = regex.exec(rawText)) !== null) {
                extractedList.push(match[1]);
              }
              blockAnswers = extractedList.join("|");
            }
            rawText = rawText.replace(/\[[^\]]+\]/g, "_____");
          }

          const containsUnderline = /____|\[BLANK\]/i.test(rawText);
          const isInline = containsUnderline;
          const qNum = b.data.startQNum || b.data.qNum || currentStartQNum;
          const answersStr = blockAnswers || "";
          const blankCount = answersStr.includes("|") ? answersStr.split("|").filter(Boolean).length : 1;

          questions.push({
            id: b.id || `fib-${idx}-${qNum}`,
            type: isInline ? "INLINE_BLANKS" : "BLANK",
            text: rawText,
            sectionHeading: b.data.sectionHeading || "",
            sectionInstruction: b.data.sectionInstruction || b.data.instruction || "",
            correctAnswer: blockAnswers.includes("|") ? blockAnswers : (isInline ? blockAnswers.replace(/,/g, "|") : blockAnswers),
            options: b.data.options || [],
            correctIndex: 0,
            sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
            _origQNum: qNum,
            _maxQNum: qNum + blankCount - 1
          });
        }
      } else if (bType === "matching-headings" || bType === "matching-information" || bType === "matching-features" || bType === "matching") {
        let textContent = "";
        let passageVal = "";
        let correctVal = "";
        let startNum = b.data.qNum || b.data.startQNum || b.data.questionNumber || currentStartQNum;

        if (Array.isArray(b.data.paragraphs)) {
          textContent = b.data.paragraphs.map((p: any) => p.name || p.text || "").join("\n");
          correctVal = b.data.paragraphs.map((p: any) => p.answer || "").join("\n");
          const firstP = b.data.paragraphs[0];
          if (firstP && firstP.qNum) {
            startNum = firstP.qNum;
          }
        } else {
          textContent = b.data.paragraphs || b.data.statements || b.data.text || b.data.content || "";
        }

        if (Array.isArray(b.data.statements)) {
          textContent = b.data.statements.map((st: any) => st.text || "").join("\n");
          correctVal = b.data.statements.map((st: any) => st.answer || "").join("\n");
          const firstSt = b.data.statements[0];
          if (firstSt && firstSt.qNum) {
            startNum = firstSt.qNum;
          }
        }

        if (Array.isArray(b.data.headings)) {
          passageVal = b.data.headings.join("\n");
        } else if (Array.isArray(b.data.options)) {
          passageVal = b.data.options.join("\n");
        } else {
          passageVal = b.data.headings || b.data.features || b.data.options || b.data.passageText || "";
        }

        if (!correctVal) {
          correctVal = b.data.answers || b.data.correctAnswer || b.data.correct || "";
        }

        let numMatchItems = 1;
        if (Array.isArray(b.data.paragraphs)) {
          numMatchItems = b.data.paragraphs.length;
        } else if (Array.isArray(b.data.statements)) {
          numMatchItems = b.data.statements.length;
        } else {
          const rawP = b.data.paragraphs || b.data.statements || b.data.text || b.data.content || "";
          if (typeof rawP === 'string') {
            const count = rawP.split('\n').filter(Boolean).length;
            numMatchItems = Math.max(1, count);
          }
        }

        // AUTO-EXTENSION OF MATCHING HEADINGS COHESION (FIX FOR 15-QUESTION LIMITATION IN SECTION 1)
        if (lastRangeCount && lastRangeCount > numMatchItems && lastRangeStart === startNum) {
          const textLines = textContent.split('\n').filter(Boolean);
          const hasLetters = textLines.some(line => /[A-Z]/.test(line));
          while (textLines.length < lastRangeCount) {
            if (hasLetters) {
              textLines.push(`Paragraph ${String.fromCharCode(65 + textLines.length)}`);
            } else {
              textLines.push(`Paragraph ${textLines.length + 1}`);
            }
          }
          textContent = textLines.join('\n');

          const correctLines = correctVal.split('\n').filter(Boolean);
          const lastAns = correctLines[correctLines.length - 1] || "A";
          while (correctLines.length < lastRangeCount) {
            correctLines.push(lastAns);
          }
          correctVal = correctLines.join('\n');
          numMatchItems = lastRangeCount;
        }

        questions.push({
          id: b.id || `matching-${idx}-${startNum}`,
          type: "MATCHING",
          text: textContent,
          sectionHeading: b.data.sectionHeading || "",
          sectionInstruction: b.data.sectionInstruction || b.data.instruction || "",
          passageText: passageVal,
          correctAnswer: correctVal,
          options: [],
          correctIndex: 0,
          sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
          _origQNum: startNum,
          _maxQNum: startNum + numMatchItems - 1
        });
      } else if (bType === "short-answer" || bType === "sa") {
        if (Array.isArray(b.data.questions)) {
          b.data.questions.forEach((st: any, sIdx: number) => {
            const qNum = st.qNum || (currentStartQNum + sIdx);
            questions.push({
              id: st.id || `${b.id}-sa-${qNum}`,
              type: "BLANK",
              text: st.text || st.question || "",
              sectionHeading: sIdx === 0 ? (b.data.sectionHeading || "") : "",
              sectionInstruction: sIdx === 0 ? (b.data.sectionInstruction || b.data.instruction || "") : "",
              correctAnswer: st.answer || st.correct || st.correctAnswer || "",
              options: [],
              correctIndex: 0,
              sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
              _origQNum: qNum
            });
          });
        } else {
          const qNum = b.data.questionNumber || b.data.qNum || currentStartQNum;
          questions.push({
            id: b.id || `sa-${idx}-${qNum}`,
            type: "BLANK",
            text: b.data.question || b.data.text || b.data.content || "",
            sectionHeading: b.data.sectionHeading || "",
            sectionInstruction: b.data.sectionInstruction || b.data.instruction || "",
            correctAnswer: b.data.correctAnswer || b.data.answer || b.data.correct || "",
            options: [],
            correctIndex: 0,
            sectionNumber: blockSecNum ? Number(blockSecNum) : undefined,
            _origQNum: qNum
          });
        }
      } else if (bType === "part1" || bType === "part3") {
        const topic = b.data.topic || b.data.title || "Speaking Task";
        const qs: string[] = Array.isArray(b.data.questions) ? b.data.questions : [b.data.text || b.data.content || ""];
        qs.forEach((qText: string, i: number) => {
           questions.push({
             id: `${b.id || bType}-${idx}-${i}`,
             type: "SPEAKING_QUESTION",
             text: qText,
             sectionHeading: i === 0 ? topic : "",
             sectionInstruction: b.data.instruction || "",
             options: [],
             correctIndex: 0,
             _origQNum: currentStartQNum + i
           });
        });
      } else if (bType === "cue-card") {
        const topic = b.data.topic || b.data.title || "Describe the topic";
        const bullets: string[] = Array.isArray(b.data.bullets) ? b.data.bullets : [];
        const combinedText = `${topic}\n\nYou should say:\n${bullets.map(bu => "- " + bu).join("\n")}`;
        questions.push({
          id: `${b.id || bType}-${idx}-0`,
          type: "SPEAKING_QUESTION",
          text: combinedText,
          sectionHeading: "Cue Card",
          sectionInstruction: b.data.instruction || "Preparation Time: 1 minute | Speaking Time: 1-2 minutes",
          options: [],
          correctIndex: 0,
          _origQNum: currentStartQNum
        });
      }
      return questions;
    };

    if (data.layout_type === "single") {
      let contentMarkdown = "";
      const questions: any[] = [];
      let lastAudioUrl = "";
      let globalQNum = 1;

      let currentHeading = "";
      let currentInstruction = "";

      data.blocks.single.forEach((b: any, bIdx: number) => {
        if (b.type === "audio") {
          lastAudioUrl = b.data.url || "";
        }
        
        const bType = (b.type || "").toLowerCase();
        if (bType === "question-range" || bType === "instruction" || bType === "instructions") {
          const heading = b.data.range || b.data.sectionHeading || b.data.heading || "";
          const instruction = b.data.instruction || b.data.instructions || b.data.text || "";
          
          if (heading) {
            currentHeading = currentHeading ? (currentHeading + "\n" + heading) : heading;
          }
          if (instruction) {
            currentInstruction = currentInstruction ? (currentInstruction + "\n\n" + instruction) : instruction;
          }
        }

        contentMarkdown += mapBlockToMarkdown(b);
        const parsed = parseQuestionsFromBlock(b, bIdx, globalQNum);
        if (parsed && parsed.length > 0) {
          if (currentHeading) {
            if (!parsed[0].sectionHeading) {
              parsed[0].sectionHeading = currentHeading;
            } else {
              // Deduplicate heading if exact match
              if (parsed[0].sectionHeading.trim() !== currentHeading.trim()) {
                parsed[0].sectionHeading = currentHeading + "\n" + parsed[0].sectionHeading;
              }
            }
            currentHeading = "";
          }
          if (currentInstruction) {
             // Deduplicate: If the block's own instruction is already contained in currentInstruction, don't repeat it
             const existing = (parsed[0].sectionInstruction || "").trim();
             const group = currentInstruction.trim();
             
             if (!existing) {
               parsed[0].sectionInstruction = group;
             } else if (group === existing || group.includes(existing)) {
               parsed[0].sectionInstruction = group;
             } else {
               parsed[0].sectionInstruction = group + "\n\n" + existing;
             }
             currentInstruction = ""; // Reset after attaching
          }
          questions.push(...parsed);
          let maxNumInBlock = globalQNum;
          parsed.forEach((pq: any) => {
            const itemMax = pq._maxQNum || pq._origQNum || globalQNum;
            maxNumInBlock = Math.max(maxNumInBlock, itemMax);
          });
          globalQNum = maxNumInBlock + 1;
        }
      });
      
      const sanitizedQuestions = questions.map(({ _origQNum, ...q }) => q);
      lessons.push({
        id: `les-single-${data.id || "1"}`,
        title: "1. Core Lesson Materials",
        type: sanitizedQuestions.length > 0 ? (skillType === "listening" ? "LISTENING" : "PRACTICE") : (skillType === "listening" ? "LISTENING" : "TEXT"),
        content: contentMarkdown.trim() || `# ${data.title}\nInteractive lesson materials.`,
        audioUrl: data.audio_url || lastAudioUrl,
        transcriptUrl: data.transcript_url,
        transcriptName: data.transcript_name,
        questions: sanitizedQuestions,
        hasTimer: !!data.timeLimit,
        timeLimit: data.timeLimit
      });
    } else {
      const isDividerBlock = (b: any) => {
        if (!b) return false;
        const t = String(b.type || "").toLowerCase();
        return t === "divider" || t === "divider-line" || t === "divider_line" || t === "section-divider" || t === "section_divider" || t === "hr" || t.includes("divider");
      };

      const passageBlocks = data.blocks.left.filter((b: any) => b.type === "reading-passage");
      const hasDividers = (data.blocks?.left || []).some(isDividerBlock) || (data.blocks?.right || []).some(isDividerBlock);
      
      if (passageBlocks.length > 1 || hasDividers || (data.blocks?.left || []).length >= 3) {
        const allQuestions: any[] = [];
        let globalQNum = 1;
        let currentHeading = "";
        let currentInstruction = "";
        let lastRangeCount: number | null = null;
        let lastRangeStart: number | null = null;
        
        let currentRightSectionIdx = 0;
        let hasExplicitDivider = false;

        data.blocks.right.forEach((b: any, bIdx: number) => {
          if (isDividerBlock(b)) {
            currentRightSectionIdx = Math.min(2, currentRightSectionIdx + 1);
            hasExplicitDivider = true;
            currentHeading = "";
            currentInstruction = "";
            return;
          }

          const blockTxt = String(
            b.data?.range || b.data?.sectionHeading || b.data?.heading || b.data?.title || b.data?.text || b.data?.instruction || b.section || ""
          ).toLowerCase();

          if (!hasExplicitDivider) {
            if (b.data?.section === 1 || b.section === 1 || b.data?.sectionNumber === 1 || blockTxt.includes("section 1") || blockTxt.includes("passage 1") || blockTxt.includes("part 1")) {
              currentRightSectionIdx = 0;
            } else if (b.data?.section === 2 || b.section === 2 || b.data?.sectionNumber === 2 || blockTxt.includes("section 2") || blockTxt.includes("passage 2") || blockTxt.includes("part 2")) {
              currentRightSectionIdx = 1;
            } else if (b.data?.section === 3 || b.section === 3 || b.data?.sectionNumber === 3 || blockTxt.includes("section 3") || blockTxt.includes("passage 3") || blockTxt.includes("part 3")) {
              currentRightSectionIdx = 2;
            }
          }

          const rangeMatch = blockTxt.match(/(?:questions|qs?\.?)\s*(\d+)\s*[-–—to\s]+\s*(\d+)/i) || blockTxt.match(/(\d+)\s*[-–—to\s]+\s*(\d+)/i);
          if (rangeMatch) {
            const rStart = parseInt(rangeMatch[1], 10);
            const rEnd = parseInt(rangeMatch[2], 10);
            if (!isNaN(rStart) && !isNaN(rEnd) && rEnd >= rStart) {
              lastRangeCount = rEnd - rStart + 1;
              lastRangeStart = rStart;
              if (rStart >= 28 && !hasExplicitDivider) {
                currentRightSectionIdx = 2;
              } else if (rStart >= 14 && rStart <= 27 && !hasExplicitDivider) {
                currentRightSectionIdx = Math.max(currentRightSectionIdx, 1);
              } else if (rStart >= 1) {
                if (!hasExplicitDivider && currentRightSectionIdx === 0) {
                  currentRightSectionIdx = 0;
                }
              }
            }
          }

          const bType = (b.type || "").toLowerCase();
          if (bType === "question-range" || bType === "instruction" || bType === "instructions") {
            const heading = b.data?.range || b.data?.sectionHeading || b.data?.heading || "";
            const instruction = b.data?.instruction || b.data?.instructions || b.data?.text || "";
            
            if (heading) {
              currentHeading = currentHeading ? (currentHeading + "\n" + heading) : heading;
            }
            if (instruction) {
              currentInstruction = currentInstruction ? (currentInstruction + "\n\n" + instruction) : instruction;
            }
          }

          const parsed = parseQuestionsFromBlock(b, bIdx, globalQNum, lastRangeStart, lastRangeCount);
          if (parsed && parsed.length > 0) {
            parsed.forEach((pq: any) => {
              const qNum = pq._origQNum || globalQNum;
              let qSec = currentRightSectionIdx;
              if (qNum >= 28 && !hasExplicitDivider) qSec = 2;
              else if (qNum >= 14 && qNum <= 27 && qSec === 0 && !hasExplicitDivider) qSec = 1;
              pq._sectionIndex = qSec;
              pq.sectionNumber = qSec + 1;
            });

            if (currentHeading) {
              if (!parsed[0].sectionHeading) {
                parsed[0].sectionHeading = currentHeading;
              } else {
                // Deduplicate heading if exact match
                if (parsed[0].sectionHeading.trim() !== currentHeading.trim()) {
                  parsed[0].sectionHeading = currentHeading + "\n" + parsed[0].sectionHeading;
                }
              }
              currentHeading = "";
            }
            if (currentInstruction) {
              // Deduplicate: If the block's own instruction is already contained in currentInstruction, don't repeat it
              const existing = (parsed[0].sectionInstruction || "").trim();
              const group = currentInstruction.trim();
              
              if (!existing) {
                parsed[0].sectionInstruction = group;
              } else if (group === existing || group.includes(existing)) {
                parsed[0].sectionInstruction = group;
              } else {
                parsed[0].sectionInstruction = group + "\n\n" + existing;
              }
              currentInstruction = "";
            }
            allQuestions.push(...parsed);
            let maxNumInBlock = globalQNum;
            parsed.forEach((pq: any) => {
              const itemMax = pq._maxQNum || pq._origQNum || globalQNum;
              maxNumInBlock = Math.max(maxNumInBlock, itemMax);
            });
            globalQNum = maxNumInBlock + 1;
          }
        });
        
        let lastAudioUrl = "";
        
        // Split data.blocks.left into 3 Sections (Section 1 / Passage 1, Section 2 / Passage 2, Section 3 / Passage 3)
        const leftBlocks = data.blocks.left || [];
        leftBlocks.forEach((b: any) => {
          if (b.type === "audio") {
            lastAudioUrl = b.data?.url || lastAudioUrl;
          }
        });

        // 1. Check for divider blocks
        const dividerIndices: number[] = [];
        leftBlocks.forEach((b: any, idx: number) => {
          if (isDividerBlock(b)) dividerIndices.push(idx);
        });

        // 2. Check for explicit Section/Passage headings
        let sec2Idx = -1;
        let sec3Idx = -1;
        leftBlocks.forEach((b: any, idx: number) => {
          const txt = String(b.data?.title || b.data?.text || b.data?.content || "").toLowerCase();
          const bType = String(b.type || "").toLowerCase();
          if (bType === "heading" || bType === "reading-passage" || bType === "text") {
            if (sec2Idx === -1 && (txt.includes("section 2") || txt.includes("passage 2") || txt.includes("reading passage 2") || txt.includes("text d") || txt.includes("part 2"))) {
              sec2Idx = idx;
            } else if (sec3Idx === -1 && (txt.includes("section 3") || txt.includes("passage 3") || txt.includes("reading passage 3") || txt.includes("part 3"))) {
              sec3Idx = idx;
            }
          }
        });

        // 3. Check reading-passage block indices
        const rpIndices: number[] = [];
        leftBlocks.forEach((b: any, idx: number) => {
          if (b.type === "reading-passage") rpIndices.push(idx);
        });

        let sectionSlices: any[][] = [];

        if (dividerIndices.length >= 2) {
          sectionSlices = [
            leftBlocks.slice(0, dividerIndices[0]),
            leftBlocks.slice(dividerIndices[0] + 1, dividerIndices[1]),
            leftBlocks.slice(dividerIndices[1] + 1)
          ];
        } else if (dividerIndices.length === 1) {
          const dIdx = dividerIndices[0];
          const rem = leftBlocks.slice(dIdx + 1);
          const secondRpInRem = rem.findIndex((b: any, idx: number) => idx > 0 && (b.type === "reading-passage" || String(b.data?.title || b.data?.text || "").toLowerCase().includes("section 3") || String(b.data?.title || b.data?.text || "").toLowerCase().includes("passage 3")));
          if (secondRpInRem !== -1) {
            sectionSlices = [
              leftBlocks.slice(0, dIdx),
              rem.slice(0, secondRpInRem),
              rem.slice(secondRpInRem)
            ];
          } else {
            const half = Math.ceil(rem.length / 2);
            sectionSlices = [
              leftBlocks.slice(0, dIdx),
              rem.slice(0, half),
              rem.slice(half)
            ];
          }
        } else if (sec2Idx !== -1 && sec3Idx !== -1 && sec3Idx > sec2Idx) {
          sectionSlices = [
            leftBlocks.slice(0, sec2Idx),
            leftBlocks.slice(sec2Idx, sec3Idx),
            leftBlocks.slice(sec3Idx)
          ];
        } else if (rpIndices.length === 3) {
          // Standard Academic 3 passages
          // Scan backwards for headings above rpIndices[1] and rpIndices[2]
          let p2Start = rpIndices[1];
          if (p2Start > 0 && (leftBlocks[p2Start - 1].type === "heading" || leftBlocks[p2Start - 1].type === "divider")) {
            p2Start--;
          }
          let p3Start = rpIndices[2];
          if (p3Start > 0 && (leftBlocks[p3Start - 1].type === "heading" || leftBlocks[p3Start - 1].type === "divider")) {
            p3Start--;
          }
          sectionSlices = [
            leftBlocks.slice(0, p2Start),
            leftBlocks.slice(p2Start, p3Start),
            leftBlocks.slice(p3Start)
          ];
        } else if (rpIndices.length > 3) {
          // General Training (GT) with multiple text blocks (e.g. 7 texts)
          // Find boundary for Section 2 (e.g. Text D) and Section 3 (e.g. Section 3 / Passage 3)
          let g2 = leftBlocks.findIndex((b: any) => {
            const t = String(b.data?.title || b.data?.text || "").toLowerCase();
            return t.includes("text d") || t.includes("section 2") || t.includes("passage 2");
          });
          let g3 = leftBlocks.findIndex((b: any) => {
            const t = String(b.data?.title || b.data?.text || "").toLowerCase();
            return t.includes("section 3") || t.includes("passage 3") || t.includes("digital dependency");
          });

          if (g2 !== -1 && g3 !== -1 && g3 > g2) {
            sectionSlices = [
              leftBlocks.slice(0, g2),
              leftBlocks.slice(g2, g3),
              leftBlocks.slice(g3)
            ];
          } else {
            // Divide rpIndices proportionally (e.g. 3 blocks for Sec 1, 3 for Sec 2, rest for Sec 3)
            const rp1 = rpIndices[3] || Math.floor(leftBlocks.length / 3);
            const rp2 = rpIndices[6] || Math.floor((leftBlocks.length * 2) / 3);
            sectionSlices = [
              leftBlocks.slice(0, rp1),
              leftBlocks.slice(rp1, rp2),
              leftBlocks.slice(rp2)
            ];
          }
        } else {
          // Fallback: 3 equal slices
          const s1 = Math.ceil(leftBlocks.length / 3);
          const s2 = Math.ceil((leftBlocks.length * 2) / 3);
          sectionSlices = [
            leftBlocks.slice(0, s1),
            leftBlocks.slice(s1, s2),
            leftBlocks.slice(s2)
          ];
        }

        // Build 3 passage lessons
        const passageLessons: any[] = [];
        sectionSlices.forEach((secBlocksRaw, sIdx) => {
          let secBlocks = secBlocksRaw;
          if ((!secBlocks || secBlocks.length === 0) && leftBlocks.length > 0) {
            secBlocks = sectionSlices[0]?.length > 0 ? sectionSlices[0] : leftBlocks;
          }

          let contentLeftMd = "";
          let sectionTitle = "";
          let pbId = "";

          secBlocks.forEach((b: any) => {
            if (b.type === "reading-passage") {
              if (!pbId) pbId = b.id;
              if (!sectionTitle && b.data && b.data.title) {
                sectionTitle = b.data.title;
              }
            } else if (b.type === "heading" && !sectionTitle && b.data && b.data.text) {
              sectionTitle = b.data.text;
            }
            contentLeftMd += mapBlockToMarkdown(b);
          });

          if (!sectionTitle) {
            sectionTitle = `Section ${sIdx + 1}`;
          }

          passageLessons.push({
            id: pbId || `section-${sIdx + 1}`,
            index: sIdx,
            title: sectionTitle,
            content: contentLeftMd.trim(),
            audioUrl: lastAudioUrl
          });
        });
        
        const getQuestionsForSection = (questionsList: any[], targetSection: number) => {
          return questionsList.filter(q => {
            // 1. Explicit _sectionIndex or sectionNumber property if set
            const secNum = q._sectionIndex !== undefined
              ? q._sectionIndex + 1
              : (q.sectionNumber !== undefined
                  ? q.sectionNumber
                  : (q.data?.sectionNumber !== undefined
                      ? q.data.sectionNumber
                      : (q.section !== undefined
                          ? q.section
                          : undefined)));
            if (secNum !== undefined && secNum !== null && Number(secNum) > 0) {
              return Number(secNum) === targetSection;
            }

            // 2. Heading or instruction check
            const heading = String(q.sectionHeading || q.sectionInstruction || q.text || "").toLowerCase();
            
            const hasSec1 = heading.includes("passage 1") || heading.includes("section 1") || heading.includes("text a") || heading.includes("text b") || heading.includes("text c");
            const hasSec2 = heading.includes("passage 2") || heading.includes("section 2") || heading.includes("text d") || heading.includes("text e") || heading.includes("text f");
            const hasSec3 = heading.includes("passage 3") || heading.includes("section 3") || heading.includes("digital dependency") || heading.includes("household energy") || heading.includes("responsible tourism");

            if (hasSec1 && !hasSec2 && !hasSec3) return targetSection === 1;
            if (hasSec2 && !hasSec1 && !hasSec3) return targetSection === 2;
            if (hasSec3 && !hasSec1 && !hasSec2) return targetSection === 3;

            // 3. Question Number Range Boundaries
            const startQ = q._origQNum || q.qNum || q.questionNumber || 1;
            const isGT = heading.includes("text a") || heading.includes("text b") || heading.includes("text d") || (startQ <= 14 && heading.includes("section 1"));

            if (targetSection === 1) {
              return isGT ? startQ <= 14 : startQ <= 13;
            }
            if (targetSection === 2) {
              return isGT ? (startQ >= 15 && startQ <= 27) : (startQ >= 14 && startQ <= 23);
            }
            if (targetSection === 3) {
              return isGT ? startQ >= 28 : startQ >= 24;
            }

            return false;
          });
        };

        passageLessons.forEach((pl, plIdx) => {
          const targetSection = plIdx + 1;
          const filteredQuestions = getQuestionsForSection(allQuestions, targetSection);
          const sanitizedQuestions = filteredQuestions.map(({ _origQNum, _maxQNum, _sectionIndex, sectionNumber, ...q }) => q);
          
          lessons.push({
            id: `les-split-${data.id || "1"}-${plIdx + 1}`,
            title: `${plIdx + 1}. ${pl.title}`,
            type: sanitizedQuestions.length > 0 ? "READING" : "TEXT",
            content: pl.content || `### ${pl.title}\nSyllabus test reading material.`,
            audioUrl: data.audio_url || pl.audioUrl,
            transcriptUrl: data.transcript_url,
            transcriptName: data.transcript_name,
            questions: sanitizedQuestions,
            hasTimer: !!data.timeLimit,
            timeLimit: data.timeLimit
          });
        });
        
      } else {
        let leftPassageMarkdown = "";
        let lastAudioUrl = "";
        
        data.blocks.left.forEach((b: any) => {
          if (b.type === "audio") {
            lastAudioUrl = b.data.url || "";
          }
          leftPassageMarkdown += mapBlockToMarkdown(b);
        });

        const rightQuestions: any[] = [];
        let globalQNum = 1;
        let currentHeading = "";
        let currentInstruction = "";
        data.blocks.right.forEach((b: any, bIdx: number) => {
           const bType = (b.type || "").toLowerCase();
           if (bType === "question-range" || bType === "instruction" || bType === "instructions") {
             const heading = b.data.range || b.data.sectionHeading || b.data.heading || "";
             const instruction = b.data.instruction || b.data.instructions || b.data.text || "";
             
             if (heading) {
               currentHeading = currentHeading ? (currentHeading + "\n" + heading) : heading;
             }
             if (instruction) {
                currentInstruction = currentInstruction ? (currentInstruction + "\n\n" + instruction) : instruction;
             }
           }

           const parsed = parseQuestionsFromBlock(b, bIdx, globalQNum);
           if (parsed && parsed.length > 0) {
             if (currentHeading) {
               if (!parsed[0].sectionHeading) {
                 parsed[0].sectionHeading = currentHeading;
               } else {
                 parsed[0].sectionHeading = currentHeading + "\n" + parsed[0].sectionHeading;
               }
               currentHeading = "";
             }
             if (currentInstruction) {
               if (!parsed[0].sectionInstruction) {
                 parsed[0].sectionInstruction = currentInstruction;
               } else {
                 parsed[0].sectionInstruction = currentInstruction + "\n\n" + parsed[0].sectionInstruction;
               }
               currentInstruction = "";
             }
             rightQuestions.push(...parsed.map(({ _origQNum, _maxQNum, ...q }) => q));
             let maxNumInBlock = globalQNum;
             parsed.forEach((pq: any) => {
               const itemMax = pq._maxQNum || pq._origQNum || globalQNum;
               maxNumInBlock = Math.max(maxNumInBlock, itemMax);
             });
             globalQNum = maxNumInBlock + 1;
           }
        });

        lessons.push({
          id: `les-split-${data.id || "1"}`,
          title: "1. Core Materials & Question Sheet",
          type: skillType === "listening" ? "LISTENING" : "READING",
          content: leftPassageMarkdown.trim() || `# ${data.title}\nRead the materials on the left and input your draft submissions on the right.`,
          audioUrl: data.audio_url || lastAudioUrl,
          transcriptUrl: data.transcript_url,
          transcriptName: data.transcript_name,
          questions: rightQuestions,
          hasTimer: !!data.timeLimit,
          timeLimit: data.timeLimit
        });
      }
    }

    // Ensure all exported question IDs are deterministically 100% unique to prevent duplicate key crashes
    const seenIds = new Set<string>();
    lessons.forEach((l, lIdx) => {
      if (l.questions && Array.isArray(l.questions)) {
        l.questions.forEach((q: any, qIdx: number) => {
          if (!q.id || seenIds.has(q.id)) {
            q.id = `${q.id || 'question'}-u-${lIdx}-${qIdx}`;
          }
          seenIds.add(q.id);
        });
      }
    });

    return [
      {
        id: `mod-${data.id || "1"}`,
        title: "Syllabus Curriculum Module",
        skillType: skillType,
        lessons: lessons,
        designer_blocks: data.blocks,
        access_tier: data.access_tier || "Free Trial",
        test_number: data.test_number
      }
    ];
  };

  const handleSave = async (silent = false, dataToSave = course) => {
    if (isSaving) return;
    setIsSaving(true);
    let courseId = dataToSave.id || activeIdRef.current;
    
    if (!courseId) {
       courseId = safeUUID();
       activeIdRef.current = courseId;
       setCourse(c => ({ ...c, id: courseId }));
    } else if (!activeIdRef.current) {
       activeIdRef.current = courseId;
    }
    
    // Persist active ID and save full structure in background draft
    localStorage.setItem('active_course_designer_id', courseId);
    try {
      localStorage.setItem('in_progress_course_designer_draft', JSON.stringify({ ...dataToSave, id: courseId }));
    } catch (e) {}
    
    if (supabase) {
      try {
        const compiledModules = compileModulesJSON(dataToSave);
        const compiledModulesStr = JSON.stringify(compiledModules);

        // Auto compile content if blank
        const autoCompiledContent = dataToSave.content && dataToSave.content.trim() !== "" 
          ? dataToSave.content 
          : (
              dataToSave.blocks.single && dataToSave.blocks.single.length > 0
                ? dataToSave.blocks.single.map(b => b.data?.text || b.data?.statement || b.data?.question || "").filter(Boolean).join("\n\n")
                : dataToSave.blocks.left && dataToSave.blocks.left.length > 0
                  ? dataToSave.blocks.left.map(b => b.data?.text || b.data?.statement || b.data?.question || "").filter(Boolean).join("\n\n")
                  : dataToSave.description || "Interactive syllabus study material and assignments."
            );

        const dbType = dataToSave.type === "General Training (GT)"
          ? "General"
          : dataToSave.type === "Diagnostic"
            ? "Diagnostic"
            : "Academic";

        const customCategory = dataToSave.category || dataToSave.course_type || "General Training";

        let detectedFormat = "four_skills";
        if (dataToSave.course_type === "Mock Test") {
          const allBlocks = [
            ...(dataToSave.blocks?.single || []),
            ...(dataToSave.blocks?.left || []),
            ...(dataToSave.blocks?.right || [])
          ];
          const hasReading = allBlocks.some(b => b.type.startsWith('reading-') || ['mcq', 'fill-blanks', 'true-false-not-given'].includes(b.type));
          const hasListening = allBlocks.some(b => b.type.startsWith('listening-'));
          const hasWriting = allBlocks.some(b => ['academic-task1', 'general-task1', 'task2'].includes(b.type));
          const hasSpeaking = allBlocks.some(b => ['part1', 'cue-card', 'part3'].includes(b.type));

          const formats = [];
          if (hasReading) formats.push("reading");
          if (hasListening) formats.push("listening");
          if (hasWriting) formats.push("writing");
          if (hasSpeaking) formats.push("speaking");

          if (formats.length === 1) {
            detectedFormat = formats[0];
          } else if (formats.length > 1) {
            detectedFormat = "four_skills";
          } else {
            detectedFormat = "four_skills";
          }
        }

        // Define multiple candidate payloads depending on which schema is active
        const payloadFull = {
          id: courseId,
          title: dataToSave.title || "Untitled",
          description: dataToSave.description || "",
          content: autoCompiledContent,
          category: customCategory,
          level: "7.0",
          type: dbType,
          difficulty: "Intermediate",
          course_format: dataToSave.course_type === "Mock Test" ? detectedFormat : (dataToSave.layout_type || "single"),
          tags: ["Draft"],
          status: dataToSave.status || "Draft",
          modules: compiledModules,
          featured_image: dataToSave.thumbnail_url || "",
          thumbnail_url: dataToSave.thumbnail_url || "",
          thumbnail_type: dataToSave.thumbnail_type || "image",
          course_type: dataToSave.course_type || "Reading Test",
          layout_type: dataToSave.layout_type || "single",
          show_in_catalog: dataToSave.show_in_catalog !== false,
          show_in_syllabus: dataToSave.show_in_syllabus !== false,
          show_in_practice: dataToSave.show_in_practice !== false,
          time_limit: dataToSave.timeLimit,
          test_number: dataToSave.test_number,
          updated_at: new Date().toISOString(),
          is_mock_test: dataToSave.course_type === "Mock Test",
          exam_category: dataToSave.type === "General Training (GT)" ? "General Training" : "Academic",
          access_tier: dataToSave.access_tier || "Free Trial"
        };

        const payloadSchemaA = {
          id: courseId,
          title: dataToSave.title || "Untitled",
          description: dataToSave.description || "",
          content: autoCompiledContent,
          category: customCategory,
          level: "7.0",
          type: dbType,
          difficulty: "Intermediate",
          status: dataToSave.status || "Draft",
          modules: compiledModules,
          featured_image: dataToSave.thumbnail_url || "",
          thumbnail_url: dataToSave.thumbnail_url || "",
          thumbnail_type: dataToSave.thumbnail_type || "image",
          show_in_catalog: dataToSave.show_in_catalog !== false,
          show_in_syllabus: dataToSave.show_in_syllabus !== false,
          show_in_practice: dataToSave.show_in_practice !== false,
          time_limit: dataToSave.timeLimit,
          test_number: dataToSave.test_number,
          is_mock_test: dataToSave.course_type === "Mock Test",
          exam_category: dataToSave.type === "General Training (GT)" ? "General Training" : "Academic",
          access_tier: dataToSave.access_tier || "Free Trial"
        };

        const payloadSchemaB = {
          id: courseId,
          title: dataToSave.title || "Untitled",
          description: dataToSave.description || "",
          content: autoCompiledContent,
          category: customCategory,
          modules: compiledModules,
          featured_image: dataToSave.thumbnail_url || "",
          thumbnail_url: dataToSave.thumbnail_url || "",
          thumbnail_type: dataToSave.thumbnail_type || "image",
          course_type: dataToSave.course_type || "Reading Test",
          layout_type: dataToSave.layout_type || "single",
          course_format: dataToSave.course_type === "Mock Test" ? detectedFormat : (dataToSave.layout_type || "single"),
          status: dataToSave.status || "Draft",
          show_in_catalog: dataToSave.show_in_catalog !== false,
          show_in_syllabus: dataToSave.show_in_syllabus !== false,
          show_in_practice: dataToSave.show_in_practice !== false,
          time_limit: dataToSave.timeLimit,
          test_number: dataToSave.test_number,
          updated_at: new Date().toISOString(),
          is_mock_test: dataToSave.course_type === "Mock Test",
          exam_category: dataToSave.type === "General Training (GT)" ? "General Training" : "Academic",
          access_tier: dataToSave.access_tier || "Free Trial"
        };

        const payloadMinimal = {
          id: courseId,
          title: dataToSave.title || "Untitled",
          description: dataToSave.description || "",
          content: autoCompiledContent,
          category: customCategory,
          modules: compiledModules,
          featured_image: dataToSave.thumbnail_url || "",
          thumbnail_url: dataToSave.thumbnail_url || "",
          status: dataToSave.status || "Draft",
          show_in_catalog: dataToSave.show_in_catalog !== false,
          show_in_syllabus: dataToSave.show_in_syllabus !== false,
          show_in_practice: dataToSave.show_in_practice !== false,
          time_limit: dataToSave.timeLimit,
          test_number: dataToSave.test_number,
          is_mock_test: dataToSave.course_type === "Mock Test",
          exam_category: dataToSave.type === "General Training (GT)" ? "General Training" : "Academic",
          access_tier: dataToSave.access_tier || "Free Trial"
        };

        // Attempt upsert with Schema A combined with any common elements
        let saveErr: any = null;
        
        console.log("Attempting Course upsert with payload:", payloadFull);
        // 1st Attempt: Payload with standard modules schema (preferred)
        const { error: errA } = await supabase.from('courses').upsert([payloadSchemaA]);
        if (errA) {
          console.warn("Attempt A (Schema A modules) failed. Retrying with full...", errA);
          // 2nd Attempt: Payload with merged schemas
          const { error: errFull } = await supabase.from('courses').upsert([payloadFull]);
          if (errFull) {
            console.warn("Attempt B (Payload Full) failed. Retrying with Schema B...", errFull);
            // 3rd Attempt: Payload with Schema B
            const { error: errB } = await supabase.from('courses').upsert([payloadSchemaB]);
            if (errB) {
              console.warn("Attempt C (Schema B) failed. Retrying with Minimal...", errB);
              // 4th Attempt: Minimal Payload fallback
              const { error: errMin } = await supabase.from('courses').upsert([payloadMinimal]);
              if (errMin) {
                saveErr = errMin;
              }
            }
          }
        }

        if (saveErr) {
          console.error("All candidates for upserting course failed.", saveErr);
          throw saveErr;
        }

        // Handle sub-tables independently so a failure here doesn't abort course saving
        try {
          // Ensure a section exists
          const { data: sectionData } = await supabase.from('course_sections').select('id').eq('course_id', courseId).maybeSingle();
          let sectionId = sectionData?.id;
          if (!sectionId) {
             const { data: newSection, error: secErr } = await supabase.from('course_sections').insert([{ course_id: courseId, title: 'Main Module', order_index: 0, sort_order: 0 }]).select().maybeSingle();
             let finalSection = newSection;
             if (secErr || !newSection) {
               const { data: backupSection } = await supabase.from('course_sections').insert([{ course_id: courseId, title: 'Main Module' }]).select().maybeSingle();
               finalSection = backupSection;
             }
             sectionId = finalSection?.id;
          }

          if (sectionId) {
            // Ensure a page exists
            const { data: pageData } = await supabase.from('course_pages').select('id').eq('section_id', sectionId).maybeSingle();
            let pageId = pageData?.id;
            if (!pageId) {
               // Try inserting combined/comprehensive columns first
               const { data: newPage, error: pageErr } = await supabase.from('course_pages').insert([{ 
                 course_id: courseId,
                 section_id: sectionId, 
                 title: 'Main Page', 
                 page_name: 'Main Page',
                 page_type: 'learning',
                 layout_type: 'single'
               }]).select().maybeSingle();
               
               let finalPage = newPage;
               if (pageErr || !newPage) {
                 // Try inserting with supabase.sql columns (course_id, section_id, page_name)
                 const { data: pageB, error: errB } = await supabase.from('course_pages').insert([{ 
                   course_id: courseId, 
                   section_id: sectionId, 
                   page_name: 'Main Page' 
                 }]).select().maybeSingle();
                 
                 if (errB || !pageB) {
                   // Try inserting with migrations columns (section_id, title, page_type)
                   const { data: pageC } = await supabase.from('course_pages').insert([{ 
                     section_id: sectionId, 
                     title: 'Main Page', 
                     page_type: 'learning' 
                   }]).select().maybeSingle();
                   finalPage = pageC;
                 } else {
                   finalPage = pageB;
                 }
               }
               pageId = finalPage?.id;
            }

            // Wipe old blocks for this page and insert new ones
            if (pageId) {
               await supabase.from('page_blocks').delete().eq('page_id', pageId);
               
               // Schema option 1: zone + order_index (migrations)
               const payloadA: any[] = [];
               dataToSave.blocks.single.forEach((b: any, idx: number) => {
                   payloadA.push({ course_id: courseId, page_id: pageId, block_type: b.type, zone: 'single', order_index: idx, data_json: b.data });
               });
               dataToSave.blocks.left.forEach((b: any, idx: number) => {
                   payloadA.push({ course_id: courseId, page_id: pageId, block_type: b.type, zone: 'left', order_index: idx, data_json: b.data });
               });
               dataToSave.blocks.right.forEach((b: any, idx: number) => {
                   payloadA.push({ course_id: courseId, page_id: pageId, block_type: b.type, zone: 'right', order_index: idx, data_json: b.data });
               });

               // Schema option 2: panel + position (supabase.sql)
               const payloadB: any[] = [];
               dataToSave.blocks.single.forEach((b: any, idx: number) => {
                   payloadB.push({ course_id: courseId, page_id: pageId, block_type: b.type, panel: 'single', position: idx, data_json: b.data });
               });
               dataToSave.blocks.left.forEach((b: any, idx: number) => {
                   payloadB.push({ course_id: courseId, page_id: pageId, block_type: b.type, panel: 'left', position: idx, data_json: b.data });
               });
               dataToSave.blocks.right.forEach((b: any, idx: number) => {
                   payloadB.push({ course_id: courseId, page_id: pageId, block_type: b.type, panel: 'right', position: idx, data_json: b.data });
               });

               // Schema option 3: fully unified (both fields)
               const payloadCombined: any[] = [];
               dataToSave.blocks.single.forEach((b: any, idx: number) => {
                   payloadCombined.push({ course_id: courseId, page_id: pageId, block_type: b.type, zone: 'single', panel: 'single', order_index: idx, position: idx, data_json: b.data });
               });
               dataToSave.blocks.left.forEach((b: any, idx: number) => {
                   payloadCombined.push({ course_id: courseId, page_id: pageId, block_type: b.type, zone: 'left', panel: 'left', order_index: idx, position: idx, data_json: b.data });
               });
               dataToSave.blocks.right.forEach((b: any, idx: number) => {
                   payloadCombined.push({ course_id: courseId, page_id: pageId, block_type: b.type, zone: 'right', panel: 'right', order_index: idx, position: idx, data_json: b.data });
               });

               if (payloadCombined.length > 0) {
                 const { error: combinedErr } = await supabase.from('page_blocks').insert(payloadCombined);
                 if (combinedErr) {
                   console.log("Combined blocks payload failed, trying Payload A (zone/order_index)...", combinedErr);
                   const { error: errA } = await supabase.from('page_blocks').insert(payloadA);
                   if (errA) {
                     console.log("Payload A failed, trying Payload B (panel/position)...", errA);
                     const { error: errB } = await supabase.from('page_blocks').insert(payloadB);
                     if (errB) {
                       console.error("All block insert attempts failed!", errB);
                     }
                   }
                 }
               }
            }
          }
        } catch (subErr) {
          console.warn("Inserting section/page/blocks failed or has unconfigured sub-tables. Continuing.", subErr);
        }
        
      } catch (err: any) {
        console.error("Autosave to supabase failed.", err);
        toast.error(`Database synchronization error: ${err.message || err}`);
        setIsSaving(false);
        return; // Don't proceed to successful toast if actually failed to save on both local & cloud
      }
    }
    
    // Write back to local storage mock tracks as fallback / parallel sync
    try {
      const autoCompiledContent = dataToSave.content && dataToSave.content.trim() !== "" 
        ? dataToSave.content 
        : (
            dataToSave.blocks.single && dataToSave.blocks.single.length > 0
              ? dataToSave.blocks.single.map(b => b.data?.text || b.data?.statement || b.data?.question || "").filter(Boolean).join("\n\n")
              : dataToSave.blocks.left && dataToSave.blocks.left.length > 0
                ? dataToSave.blocks.left.map(b => b.data?.text || b.data?.statement || b.data?.question || "").filter(Boolean).join("\n\n")
                : dataToSave.description || "Interactive syllabus study material and assignments."
          );

      const customCategory = dataToSave.category || dataToSave.course_type || "General Training";

      let localDetectedFormat = "four_skills";
      if (dataToSave.course_type === "Mock Test") {
        const allBlocks = [
          ...(dataToSave.blocks?.single || []),
          ...(dataToSave.blocks?.left || []),
          ...(dataToSave.blocks?.right || [])
        ];
        const hasReading = allBlocks.some(b => b.type.startsWith('reading-') || ['mcq', 'fill-blanks', 'true-false-not-given'].includes(b.type));
        const hasListening = allBlocks.some(b => b.type.startsWith('listening-'));
        const hasWriting = allBlocks.some(b => ['academic-task1', 'general-task1', 'task2'].includes(b.type));
        const hasSpeaking = allBlocks.some(b => ['part1', 'cue-card', 'part3'].includes(b.type));

        const formats = [];
        if (hasReading) formats.push("reading");
        if (hasListening) formats.push("listening");
        if (hasWriting) formats.push("writing");
        if (hasSpeaking) formats.push("speaking");

        if (formats.length === 1) {
          localDetectedFormat = formats[0];
        } else if (formats.length > 1) {
          localDetectedFormat = "four_skills";
        } else {
          localDetectedFormat = "four_skills";
        }
      }

      const draftCourse = {
        id: courseId,
        title: dataToSave.title || "Untitled",
        description: dataToSave.description || "",
        content: autoCompiledContent,
        category: customCategory,
        level: "7.0",
        type: dataToSave.type === "General Training (GT)"
          ? "General"
          : dataToSave.type === "Diagnostic"
            ? "Diagnostic"
            : "Academic",
        difficulty: "Intermediate",
        course_format: dataToSave.course_type === "Mock Test" ? localDetectedFormat : (dataToSave.layout_type || "single"),
        status: dataToSave.status || "Draft",
        blocks: dataToSave.blocks,
        featured_image: dataToSave.thumbnail_url || "",
        thumbnail_url: dataToSave.thumbnail_url || "",
        thumbnail_type: dataToSave.thumbnail_type || "image",
        course_type: dataToSave.course_type || "Reading Test",
        created_at: new Date().toISOString(),
        modules: compileModulesJSON(dataToSave),
        test_number: dataToSave.test_number,
        is_mock_test: dataToSave.course_type === "Mock Test",
        exam_category: dataToSave.type === "General Training (GT)" ? "General Training" : "Academic",
        access_tier: dataToSave.access_tier || "Free Trial"
      };
      
      const localCoursesStr = localStorage.getItem('mock_courses');
      let localC = localCoursesStr ? JSON.parse(localCoursesStr) : [];
      if (!Array.isArray(localC)) localC = [];
      const existingIdx = localC.findIndex((c: any) => c.id === courseId);
      if (existingIdx !== -1) {
        localC[existingIdx] = draftCourse;
      } else {
        localC.unshift(draftCourse);
      }
      localStorage.setItem('mock_courses', JSON.stringify(localC));
    } catch (err) {}

    // Fully synchronize membership tiers with course access level
    if (courseId) {
      try {
        await syncCourseTierAccess(courseId, [dataToSave.access_tier || "Free Trial"]);
      } catch (e) {
        console.warn("Could not sync membership tier in saveCourse:", e);
      }
    }

    MOCK_DB['draft'] = dataToSave; 
    setLastSaved(new Date());
    setIsSaving(false);
    fetchExistingCourses();
    if (!silent) toast.success("Course successfully saved to database.");
  };

  const loadCourseIntoDesigner = async (courseId: string) => {
    setIsSaving(true);
    setIsPreview(false);
    activeIdRef.current = courseId;
    localStorage.setItem('active_course_designer_id', courseId);
    try {
      if (!supabase) {
        const localCoursesStr = localStorage.getItem('mock_courses');
        const localCourses = localCoursesStr ? JSON.parse(localCoursesStr) : [];
        const found = localCourses.find((c: any) => c.id === courseId);
        if (found) {
          let examType = "Academic (AC)";
          let classification = found.course_type || "Reading Test";

          if (classification === "Academic Course") {
            examType = "Academic (AC)";
            classification = "Mock Test";
          } else if (classification === "General Training Course") {
            examType = "General Training (GT)";
            classification = "Mock Test";
          } else if (classification === "Diagnostic Test") {
            examType = "Diagnostic";
            classification = "Mock Test";
          } else {
            const dbType = found.type || "";
            if (dbType.toLowerCase() === "academic" || dbType === "Academic (AC)") {
              examType = "Academic (AC)";
            } else if (dbType.toLowerCase() === "general" || dbType.toLowerCase() === "general training" || dbType === "General Training (GT)") {
              examType = "General Training (GT)";
            } else if (dbType.toLowerCase() === "diagnostic" || dbType === "Diagnostic") {
              examType = "Diagnostic";
            }
          }

          const thumbUrl = found.featured_image || found.thumbnail_url || "";
          const parsedThumbnailType = found.thumbnail_type || 
            (thumbUrl.match(/\.(mp4|webm|ogg|mov|mkv)/i) ? "video" : "image");
            
          let extractedAudioUrl = "";
          let extractedTranscriptUrl = "";
          let extractedTranscriptName = "";
          if (found.modules && found.modules[0] && found.modules[0].lessons && found.modules[0].lessons[0]) {
             extractedAudioUrl = found.modules[0].lessons[0].audioUrl || "";
             extractedTranscriptUrl = found.modules[0].lessons[0].transcriptUrl || "";
             extractedTranscriptName = found.modules[0].lessons[0].transcriptName || "";
          }

          setCourse({
            id: found.id,
            title: found.title || "",
            description: found.description || "",
            thumbnail_url: thumbUrl,
            thumbnail_type: parsedThumbnailType as "image" | "video",
            audio_url: found.audio_url || extractedAudioUrl,
            transcript_url: found.transcript_url || extractedTranscriptUrl,
            transcript_name: found.transcript_name || extractedTranscriptName,
            course_type: classification,
            type: examType,
            category: found.category || found.type || "Reading Mastery",
            content: found.content || "",
            layout_type: (found.course_format || found.layout_type || "single") as LayoutType,
            status: found.status || "Draft",
            blocks: found.blocks || { single: [], left: [], right: [] }
          });
          toast.success("Course loaded from local store!");
        }
        setIsSaving(false);
        return;
      }

      // Fetch from Supabase
      const { data: dbCourse, error: errC } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (errC) throw errC;

      let singleBlocks: BlockData[] = [];
      let leftBlocks: BlockData[] = [];
      let rightBlocks: BlockData[] = [];

      let parsedModules: any[] = [];
      if (dbCourse.modules) {
        try {
          const parsed = typeof dbCourse.modules === 'string' ? JSON.parse(dbCourse.modules) : dbCourse.modules;
          if (Array.isArray(parsed)) {
            parsedModules = parsed;
          }
        } catch (e) {
          console.warn("Failed to parse dbCourse.modules", e);
        }
      }

      const inlineBlocks = parsedModules?.[0]?.designer_blocks;
      if (inlineBlocks && (inlineBlocks.single || inlineBlocks.left || inlineBlocks.right)) {
        singleBlocks = (inlineBlocks.single || []).map((b: any) => ({ ...b, id: b.id || safeUUID() }));
        leftBlocks = (inlineBlocks.left || []).map((b: any) => ({ ...b, id: b.id || safeUUID() }));
        rightBlocks = (inlineBlocks.right || []).map((b: any) => ({ ...b, id: b.id || safeUUID() }));
        console.log("Loaded designer blocks directly from course.modules metadata!");
      } else {
        const { data: sectionData } = await supabase
          .from('course_sections')
          .select('id')
          .eq('course_id', courseId)
          .maybeSingle();

        if (sectionData) {
          const { data: pageData } = await supabase
            .from('course_pages')
            .select('id, layout_type')
            .eq('section_id', sectionData.id)
            .maybeSingle();

          if (pageData) {
            let { data: blocksData, error: loadBlocksErr } = await supabase
              .from('page_blocks')
              .select('*')
              .eq('page_id', pageData.id);

            if (loadBlocksErr) {
              console.warn("Failed fetching blocks with default query, trying without order:", loadBlocksErr);
            }

            if (blocksData) {
              // Sort in-memory to support both schemas (order_index or position column)
              blocksData = [...blocksData].sort((a: any, b: any) => {
                const valA = a.order_index !== undefined && a.order_index !== null ? a.order_index : (a.position !== undefined && a.position !== null ? a.position : 0);
                const valB = b.order_index !== undefined && b.order_index !== null ? b.order_index : (b.position !== undefined && b.position !== null ? b.position : 0);
                return valA - valB;
              });

              blocksData.forEach((b: any) => {
                const blockObj: BlockData = {
                  id: b.id,
                  type: b.block_type,
                  data: b.data_json || {}
                };
                const zoneVal = b.zone || b.panel || 'single';
                if (zoneVal === 'left') {
                  leftBlocks.push(blockObj);
                } else if (zoneVal === 'right') {
                  rightBlocks.push(blockObj);
                } else {
                  singleBlocks.push(blockObj);
                }
              });
            }
          }
        }
      }

      let examType = "Academic (AC)";
      let classification = dbCourse.course_type || "Reading Test";

      if (classification === "Academic Course") {
        examType = "Academic (AC)";
        classification = "Mock Test";
      } else if (classification === "General Training Course") {
        examType = "General Training (GT)";
        classification = "Mock Test";
      } else if (classification === "Diagnostic Test") {
        examType = "Diagnostic";
        classification = "Mock Test";
      } else {
        const dbType = dbCourse.type || "";
        if (dbType.toLowerCase() === "academic" || dbType === "Academic (AC)") {
          examType = "Academic (AC)";
        } else if (dbType.toLowerCase() === "general" || dbType.toLowerCase() === "general training" || dbType === "General Training (GT)") {
          examType = "General Training (GT)";
        } else if (dbType.toLowerCase() === "diagnostic" || dbType === "Diagnostic") {
          examType = "Diagnostic";
        }
      }

      const thumbUrl = dbCourse.featured_image || dbCourse.thumbnail_url || "";
      const parsedThumbnailType = dbCourse.thumbnail_type || 
        (thumbUrl.match(/\.(mp4|webm|ogg|mov|mkv)/i) ? "video" : "image");

      let extractedAudioUrl = "";
      let extractedTranscriptUrl = "";
      let extractedTranscriptName = "";
      if (parsedModules && parsedModules[0] && parsedModules[0].lessons && parsedModules[0].lessons[0]) {
         extractedAudioUrl = parsedModules[0].lessons[0].audioUrl || "";
         extractedTranscriptUrl = parsedModules[0].lessons[0].transcriptUrl || "";
         extractedTranscriptName = parsedModules[0].lessons[0].transcriptName || "";
      }

      const loadedTestNum = dbCourse.test_number || (parsedModules && parsedModules[0] ? parsedModules[0].test_number : undefined);

      setCourse({
        id: dbCourse.id,
        title: dbCourse.title || "",
        description: dbCourse.description || "",
        thumbnail_url: thumbUrl,
        thumbnail_type: parsedThumbnailType as "image" | "video",
        audio_url: dbCourse.audio_url || extractedAudioUrl,
        transcript_url: dbCourse.transcript_url || extractedTranscriptUrl,
        transcript_name: dbCourse.transcript_name || extractedTranscriptName,
        course_type: classification,
        type: examType,
        category: dbCourse.category || dbCourse.type || "Reading Mastery",
        content: dbCourse.content || "",
        layout_type: (dbCourse.course_format || dbCourse.layout_type || "single") as LayoutType,
        status: dbCourse.status || "Draft",
        blocks: {
          single: singleBlocks,
          left: leftBlocks,
          right: rightBlocks
        },
        timeLimit: dbCourse.time_limit || (parsedModules && parsedModules[0] && parsedModules[0].lessons && parsedModules[0].lessons[0] ? parsedModules[0].lessons[0].timeLimit : undefined),
        test_number: loadedTestNum,
        show_in_catalog: dbCourse.show_in_catalog !== false,
        show_in_syllabus: dbCourse.show_in_syllabus !== false,
        show_in_practice: dbCourse.show_in_practice !== false,
        access_tier: dbCourse.access_tier || (parsedModules && parsedModules[0] && parsedModules[0].access_tier) || "Free Trial"
      });
      toast.success("Loaded Course successfully!");
    } catch (e: any) {
      console.error("Error loading course details from database:", e);
      toast.error("Failed to load course details from database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewCourse = () => {
    activeIdRef.current = null;
    localStorage.removeItem('active_course_designer_id');
    localStorage.removeItem('in_progress_course_designer_draft');
    setCourse({
      title: "",
      description: "",
      thumbnail_url: "",
      thumbnail_type: "image",
      audio_url: "",
      course_type: "Reading Test",
      type: "Academic (AC)",
      layout_type: "single",
      status: "draft",
      blocks: {
        single: [],
        left: [],
        right: []
      },
      timeLimit: 20,
      test_number: undefined,
      access_tier: "Free Trial"
    });
    setLastSaved(null);
    toast.info("Cleared designer canvas. Ready to craft new track.");
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this course tracker? This action cannot be undone.")) return;
    
    setIsSaving(true);
    try {
      if (supabase) {
        await supabase.from('courses').delete().eq('id', courseId);
      }
      
      // Remove from local storage
      const localCoursesStr = localStorage.getItem('mock_courses');
      if (localCoursesStr) {
        const localCourses = JSON.parse(localCoursesStr);
        const filtered = localCourses.filter((c: any) => c.id !== courseId);
        localStorage.setItem('mock_courses', JSON.stringify(filtered));
      }

      if (localStorage.getItem("active_course_id") === courseId) {
        localStorage.removeItem("active_course_id");
        localStorage.removeItem("active_course_timestamp");
      }

      toast.success("Course deleted successfully.");
      if (course.id === courseId) {
        handleCreateNewCourse();
      } else {
        fetchExistingCourses();
      }
    } catch (err: any) {
      toast.error("Failed to delete course.");
    } finally {
      setIsSaving(false);
    }
  };

  const setSingleBlocks = (blocks: BlockData[] | ((b: BlockData[]) => BlockData[])) => {
    setCourse(prev => {
      const nextCourse = {
        ...prev,
        blocks: {
          ...prev.blocks,
          single: typeof blocks === 'function' ? blocks(prev.blocks.single) : blocks
        }
      };
      return nextCourse;
    });
  };

  const setLeftBlocks = (blocks: BlockData[] | ((b: BlockData[]) => BlockData[])) => {
    setCourse(prev => {
      const nextCourse = {
        ...prev,
        blocks: {
          ...prev.blocks,
          left: typeof blocks === 'function' ? blocks(prev.blocks.left) : blocks
        }
      };
      return nextCourse;
    });
  };

  const setRightBlocks = (blocks: BlockData[] | ((b: BlockData[]) => BlockData[])) => {
    setCourse(prev => {
      const nextCourse = {
        ...prev,
        blocks: {
          ...prev.blocks,
          right: typeof blocks === 'function' ? blocks(prev.blocks.right) : blocks
        }
      };
      return nextCourse;
    });
  };

  const filteredCourses = existingCourses.filter(c => 
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col xl:flex-row gap-6 p-2 md:p-6 pb-24">
      
      {/* LEFT COLUMN: COURSE TRACK EXPLORER */}
      <div className="w-full xl:w-96 shrink-0 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-6 shadow-sm flex flex-col h-fit xl:sticky xl:top-4 max-h-[85vh] space-y-5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Syllabus Database
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold italic mt-1">Select Track to Edit</p>
          </div>
          <Button 
            onClick={handleCreateNewCourse}
            size="icon"
            className="rounded-xl w-9 h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-950 transition-all border-none"
            title="Create New Syllabus"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search tracks..." 
            className="pl-9 h-11 rounded-xl text-xs border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List of Tracks */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[45vh] pr-1.5 custom-scrollbar">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileCode className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs italic">No matching tracks found</p>
            </div>
          ) : (
            filteredCourses.map((c) => {
              const active = course.id === c.id;
              const isPublished = c.status === "Published" || c.status === "published";
              return (
                <div 
                  key={c.id}
                  onClick={() => loadCourseIntoDesigner(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group gap-2 text-left relative ${
                    active 
                      ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900/30 shadow-none' 
                      : 'bg-slate-50/55 hover:bg-slate-50 border-transparent dark:bg-white/2 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate group-hover:text-indigo-600 transition-colors">{c.title || "Untitled Track"}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate italic">
                        {c.course_format || c.layout_type || "single"} screen • {c.type || "Academic"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 pointer-events-none rounded ${isPublished ? 'bg-emerald-500/15 text-emerald-600 border-none' : 'bg-amber-500/15 text-amber-600 border-none'}`}>
                      {isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <button
                      onClick={(e) => handleDeleteCourse(c.id, e)}
                      className="p-1 rounded bg-transparent opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50 transition-all text-slate-400"
                      title="Discard track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-500 italic space-y-1">
          <p>💡 Saved courses automatically update across the campus public syllabus or admin panel lists.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: EDITOR DESK */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Top Action Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:px-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 animate-pulse" />
             </div>
             <div>
               <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                 {course.id ? `Editing: ${course.title || "Untitled"}` : "Create New Track"}
               </h1>
               <p className="text-[10px] text-slate-400 font-medium">
                 {isSaving ? "Saving changes..." : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : "Unsaved changes"}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-none font-bold text-xs bg-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
              <Upload className="w-4 h-4" />
              Import JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const jsonString = event.target?.result as string;
                      const importedData = JSON.parse(jsonString) as any;

                      let importedBlocks = importedData.blocks;
                      if (!importedBlocks && importedData.modules && importedData.modules.length > 0 && importedData.modules[0].designer_blocks) {
                        importedBlocks = importedData.modules[0].designer_blocks;
                      }

                      // Ensure required fields like title and blocks exist
                      if (!importedData.title || !importedBlocks) {
                        toast.error("Invalid JSON format: missing title or blocks");
                        return;
                      }

                      // Ensure sub-arrays exist in blocks
                      const importId = importedData.id || safeUUID();

                      const normalizeBlocks = (blocksArr: any[]) => {
                        if (!Array.isArray(blocksArr)) return [];

                        const extractHeadingsFromText = (text: string): string[] => {
                          if (!text) return [];
                          const lines = text.split('\n');
                          const headings: string[] = [];
                          
                          for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed) continue;
                            
                            // Check if line indicates start of headings list
                            if (trimmed.toLowerCase().includes("list of headings") || trimmed.toLowerCase().includes("list of statements") || trimmed.toLowerCase().includes("options list")) {
                              continue;
                            }
                            
                            // Check line prefix: Capital letters (A-Z) or roman numerals (i, ii, iii, iv, v, vi, vii, viii, ix, x) followed by dot, closing parenthesis, or space
                            const matchesPrefix = /^(?:[A-Z]|[ivxlcdm]+)\s*[\.\)]\s*(.+)$/i.test(trimmed);
                            if (matchesPrefix) {
                              headings.push(trimmed);
                            }
                          }
                          
                          return headings;
                        };

                        return blocksArr.map((b, bIdx) => {
                          const normalized = { ...b, data: { ...(b.data || {}) } };
                          // Normalize type to lowercase
                          if (typeof normalized.type === 'string') {
                            normalized.type = normalized.type.toLowerCase();
                          }
                          if (!normalized.id) {
                            normalized.id = safeUUID();
                          }
                          
                          // Generic field mapping for common IELTS fields
                          const textFields = ['text', 'content', 'passage', 'prompt', 'statement', 'question', 'title'];
                          const instructionFields = ['instruction', 'instructions', 'directions', 'description'];
                          const qNumFields = ['qNum', 'questionNumber', 'id', 'number', 'qNumber'];
                          const qRangeFields = ['qRange', 'questionRange', 'range'];
                          const sectionHeadingFields = ['sectionHeading', 'heading', 'title', 'passageTitle', 'groupTitle'];
                          const sectionInstructionFields = ['sectionInstruction', 'instruction', 'instructions', 'directions', 'description', 'groupInstruction'];

                          // Try to populate missing basic fields from alternatives
                          if (!normalized.data.text) {
                            for (const f of textFields) {
                              if (normalized.data[f]) {
                                normalized.data.text = normalized.data[f];
                                break;
                              }
                            }
                          }

                          if (!normalized.data.instruction) {
                            for (const f of instructionFields) {
                              if (normalized.data[f]) {
                                normalized.data.instruction = normalized.data[f];
                                break;
                              }
                            }
                          }
                          
                          if (!normalized.data.sectionHeading) {
                            for (const f of sectionHeadingFields) {
                              if (normalized.data[f]) {
                                normalized.data.sectionHeading = normalized.data[f];
                                break;
                              }
                            }
                          }

                          if (!normalized.data.sectionInstruction) {
                            for (const f of sectionInstructionFields) {
                              if (normalized.data[f]) {
                                normalized.data.sectionInstruction = normalized.data[f];
                                break;
                              }
                            }
                          }

                          if (!normalized.data.qNum) {
                            for (const f of qNumFields) {
                              if (normalized.data[f] && typeof normalized.data[f] !== 'object') {
                                normalized.data.qNum = normalized.data[f];
                                break;
                              }
                            }
                          }

                          if (normalized.type === 'question-range' && !normalized.data.range) {
                            for (const f of qRangeFields) {
                              if (normalized.data[f]) {
                                normalized.data.range = normalized.data[f];
                                break;
                              }
                            }
                          }

                          // Type specific mapping overrides
                          if (normalized.type === 'mcq' || normalized.type === 'listening-mcq') {
                            if (!normalized.data.question) normalized.data.question = normalized.data.text;
                            if (!normalized.data.options && normalized.data.choices) {
                               normalized.data.options = normalized.data.choices;
                            }
                            if (!normalized.data.correct && normalized.data.correctAnswer) {
                              normalized.data.correct = normalized.data.correctAnswer;
                            }
                          }
                                         if (normalized.type === 'true-false-not-given' || normalized.type === 'tf' || normalized.type === 'true_false' || normalized.type === 'tfng' || normalized.type === 'yes-no-not-given' || normalized.type === 'yn' || normalized.type === 'ynng' || normalized.type === 'yes_no_not_given' || normalized.type === 'yes-no') {
                            const isYN = normalized.type.includes('yes') || normalized.type.includes('yn');
                            normalized.type = 'true-false-not-given';
                            if (!normalized.data.statement) normalized.data.statement = normalized.data.text;
                            if (!normalized.data.correct && normalized.data.correctAnswer) {
                              normalized.data.correct = normalized.data.correctAnswer;
                            }
                            if (normalized.data.statements && Array.isArray(normalized.data.statements)) {
                              normalized.data.statements = normalized.data.statements.map((st: any) => ({
                                ...st,
                                text: st.text || st.statement || st.content || "",
                                qNum: st.qNum || st.number || st.id || "",
                                correct: st.correct || st.correctAnswer || st.answer || (isYN ? "YES" : "TRUE")
                              }));
                            }
                          }

                          if (normalized.type === 'short-answer' || normalized.type === 'sa' || normalized.type === 'short_answer') {
                            normalized.type = 'short-answer';
                            if (!normalized.data.question) normalized.data.question = normalized.data.text || normalized.data.content || "";
                            if (!normalized.data.correctAnswer && normalized.data.correct) normalized.data.correctAnswer = normalized.data.correct;
                            if (!normalized.data.correctAnswer && normalized.data.answer) normalized.data.correctAnswer = normalized.data.answer;
                            if (normalized.data.questions && Array.isArray(normalized.data.questions)) {
                              normalized.data.questions = normalized.data.questions.map((st: any) => ({
                                ...st,
                                text: st.text || st.question || st.content || "",
                                qNum: st.qNum || st.number || st.id || "",
                                correctAnswer: st.correctAnswer || st.answer || st.correct || ""
                              }));
                            }
                          }

                          if (normalized.type === 'fill-blanks' || normalized.type === 'inline_blanks' || normalized.type === 'blank' || normalized.type === 'fill_blanks') {
                            normalized.type = 'fill-blanks';
                            if (!normalized.data.text) normalized.data.text = normalized.data.content;
                            if (normalized.data.sentences && Array.isArray(normalized.data.sentences)) {
                               normalized.data.sentences = normalized.data.sentences.map((s: any) => ({
                                 ...s,
                                 text: s.text || s.content || "",
                                 qNum: s.qNum || s.number || s.id || ""
                               }));
                            }
                            if (!normalized.data.answers && normalized.data.correctAnswer) {
                              normalized.data.answers = normalized.data.correctAnswer;
                            }
                          }

                          if (normalized.type === 'matching-headings' || normalized.type === 'matching' || normalized.type === 'matching_headings') {
                            normalized.type = 'matching-headings';
                            if (!normalized.data.headings && normalized.data.options) normalized.data.headings = normalized.data.options;
                            if (!normalized.data.paragraphs && normalized.data.statements) normalized.data.paragraphs = normalized.data.statements;
                            if (!normalized.data.paragraphs && normalized.data.text) normalized.data.paragraphs = normalized.data.text;
                            if (!normalized.data.answers && normalized.data.correctAnswer) {
                              normalized.data.answers = normalized.data.correctAnswer;
                            }

                            // Robust extraction of options/headings if missing
                            if (!normalized.data.headings) {
                              let extractedHeadings: string[] = [];
                              for (let j = bIdx - 1; j >= 0; j--) {
                                const prevBlock = blocksArr[j];
                                if (!prevBlock || !prevBlock.data) continue;
                                const srcText = (prevBlock.data.instruction || "") + "\n" + (prevBlock.data.text || "") + "\n" + (prevBlock.data.content || "");
                                const found = extractHeadingsFromText(srcText);
                                if (found.length > 0) {
                                  extractedHeadings = found;
                                  break;
                                }
                              }
                              if (extractedHeadings.length > 0) {
                                normalized.data.headings = extractedHeadings.join("\n");
                              } else {
                                // Fallback option generation from answers
                                const ansStr = normalized.data.answers || "";
                                if (typeof ansStr === 'string' && ansStr.trim()) {
                                  const keys = ansStr.split(/[\n|,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
                                  const uniqueKeys = Array.from(new Set(keys)).sort();
                                  if (uniqueKeys.length > 0 && uniqueKeys.every(k => /^[A-Z]$/.test(k))) {
                                    const maxChar = uniqueKeys[uniqueKeys.length - 1];
                                    const maxVal = maxChar.charCodeAt(0);
                                    const fallbackHeadings: string[] = [];
                                    for (let code = 65; code <= Math.max(maxVal, 68); code++) {
                                      const char = String.fromCharCode(code);
                                      fallbackHeadings.push(`${char}. Option ${char}`);
                                    }
                                    normalized.data.headings = fallbackHeadings.join("\n");
                                  } else {
                                    const fallbackHeadings = ["i. Heading i", "ii. Heading ii", "iii. Heading iii", "iv. Heading iv", "v. Heading v", "vi. Heading vi", "vii. Heading vii", "viii. Heading viii"];
                                    normalized.data.headings = fallbackHeadings.join("\n");
                                  }
                                }
                              }
                            }
                          }

                          if (normalized.type === 'academic-task1' || normalized.type === 'general-task1' || normalized.type === 'task2' || normalized.type === 'writing_task') {
                            if (normalized.type === 'writing_task') {
                              normalized.type = normalized.data.taskType === 'Task 2' ? 'task2' : 'academic-task1';
                            }
                            if (!normalized.data.prompt) normalized.data.prompt = normalized.data.text || normalized.data.content || normalized.data.task_prompt;
                          }

                          if (normalized.type === 'part1' || normalized.type === 'part3' || normalized.type === 'cue-card' || normalized.type === 'speaking_part') {
                            if (normalized.type === 'speaking_part') {
                               if (normalized.data.part === '1') normalized.type = 'part1';
                               else if (normalized.data.part === '3') normalized.type = 'part3';
                               else normalized.type = 'cue-card';
                            }
                            if (!normalized.data.prompt) {
                              normalized.data.prompt = normalized.data.text || normalized.data.content || (Array.isArray(normalized.data.questions) ? normalized.data.questions.join("\n") : "");
                            }
                          }

                          if (normalized.type === 'question-range' || normalized.type === 'q-range' || normalized.type === 'header' || normalized.type === 'instruction' || normalized.type === 'instructions') {
                             if (normalized.type === 'instruction' || normalized.type === 'instructions') {
                               normalized.type = 'text'; // Render instructions as text blocks for editor compatibility
                               if (!normalized.data.text) normalized.data.text = normalized.data.instruction || normalized.data.instructions || normalized.data.content || "";
                             } else {
                               normalized.type = 'question-range';
                               if (!normalized.data.range && normalized.data.text) {
                                 normalized.data.range = normalized.data.text;
                               }
                               if (!normalized.data.text && normalized.data.range) {
                                 normalized.data.text = normalized.data.range;
                               }
                               if (!normalized.data.range) {
                                 for (const f of qRangeFields) {
                                   if (normalized.data[f]) {
                                     normalized.data.range = normalized.data[f];
                                     normalized.data.text = normalized.data[f];
                                     break;
                                   }
                                 }
                               }
                             }
                          }
                          
                          return normalized;
                        });
                      };

                      const sanitizedData: CourseData = {
                        ...importedData,
                        id: importId,
                        blocks: {
                          single: normalizeBlocks(importedBlocks.single),
                          left: normalizeBlocks(importedBlocks.left),
                          right: normalizeBlocks(importedBlocks.right)
                        },
                      };
                      
                      // Update session identifiers to match the newly imported content
                      activeIdRef.current = importId;
                      localStorage.setItem('active_course_designer_id', importId);
                      localStorage.setItem('in_progress_course_designer_draft', JSON.stringify(sanitizedData));
                      
                      setCourse(sanitizedData);
                      // Force an immediate persistent save to DB after successful import so it doesn't get lost
                      handleSave(true, sanitizedData);
                      toast.success("JSON imported successfully and session updated!");
                    } catch (error) {
                      toast.error("Failed to parse JSON file");
                      console.error(error);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = ''; // reset input
                }}
              />
            </label>

            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-none font-bold text-xs bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors gap-2"
              onClick={() => {
                const dataStr = JSON.stringify(course, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `course_designer_${course.title.replace(/\s+/g, '_') || 'export'}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success("Current track exported to JSON file!");
              }}
            >
              <FileCode className="w-4 h-4" />
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 shadow-none font-bold text-xs bg-transparent"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? <RefreshCw className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreview ? "Exit Preview" : "Preview Mode"}
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 shadow-none font-bold text-xs bg-transparent"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button 
              className="rounded-xl h-10 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
              disabled={isSaving}
              onClick={() => {
                const publishedCourse: CourseData = {...course, status: 'Published' as const};
                setCourse(publishedCourse);
                handleSave(false, publishedCourse);
              }}
            >
              Publish Content
            </Button>
          </div>
        </div>

        {isPreview ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-6 md:p-10 min-h-[600px] shadow-sm">
             <div className="max-w-5xl mx-auto space-y-8">
               <div className="border-b border-slate-100 dark:border-white/5 pb-8 mb-8 text-center">
                 <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-none text-[9px] font-black uppercase tracking-wider mb-4">
                   Student Preview Mode
                 </Badge>
                 <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{course.title || 'Untitled Course'}</h1>
                 {course.description && <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-sm">{course.description}</p>}
               </div>
               
               {course.layout_type === 'single' ? (
                  <div className="max-w-3xl mx-auto space-y-2">
                    {course.blocks.single.length === 0 ? (
                      <p className="text-center text-slate-400 italic py-12">No content blocks added yet.</p>
                    ) : (
                      course.blocks.single.map(block => (
                        <BlockRenderer key={block.id} block={block} />
                      ))
                    )}
                  </div>
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
                     <div className="space-y-4 pr-4 border-r border-slate-100 dark:border-white/5">
                       {course.blocks.left.length === 0 ? (
                         <p className="text-center text-slate-400 italic py-12">Left panel is empty.</p>
                       ) : (
                         course.blocks.left.map(block => (
                           <BlockRenderer key={block.id} block={block} />
                         ))
                       )}
                     </div>
                     <div className="space-y-4 pl-4">
                       {course.blocks.right.length === 0 ? (
                         <p className="text-center text-slate-400 italic py-12">Right panel is empty.</p>
                       ) : (
                         course.blocks.right.map(block => (
                           <BlockRenderer key={block.id} block={block} />
                         ))
                       )}
                     </div>
                  </div>
               )}
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metadata Section */}
            <Card className="rounded-[2.5rem] border-none bg-white dark:bg-slate-900 p-8 shadow-sm">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                      {renderFieldHeader("Course / Test Title", "title", course.title)}
                      <Input 
                        placeholder="e.g. Test 1 Reading Passage 1" 
                        className="h-14 rounded-2xl text-lg font-bold border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500"
                        value={editingFields['title'] ? (draftValues['title'] ?? "") : course.title}
                        onChange={e => setDraftValues(prev => ({ ...prev, title: e.target.value }))}
                        disabled={!editingFields['title']}
                      />
                    </div>
                    <div className="space-y-2">
                      {renderFieldHeader("Description", "description", course.description || "")}
                      <Textarea 
                        placeholder="Short description..." 
                        className="min-h-[100px] rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500 font-semibold"
                        value={editingFields['description'] ? (draftValues['description'] ?? "") : (course.description || "")}
                        onChange={e => setDraftValues(prev => ({ ...prev, description: e.target.value }))}
                        disabled={!editingFields['description']}
                      />
                    </div>

                    {course.course_type && (course.course_type === "Listening Test" || course.course_type.toLowerCase().includes("listening")) && (
                      <div className="space-y-4">
                        {/* Audio track panel */}
                        <div className="space-y-3 p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/40 rounded-3xl animate-in fade-in slide-in-from-top-3 duration-300">
                          <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Listening Practice Audio Track</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium leading-normal">
                            Provide a remote audio stream URL or upload a custom local audio track for candidate listening modules.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input 
                              placeholder="https://example.com/audio-stream.mp3" 
                              className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-indigo-500 text-sm font-semibold"
                              value={course.audio_url || ""}
                              onChange={e => setCourse(c => ({...c, audio_url: e.target.value}))}
                            />
                            <label className="cursor-pointer h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center shrink-0">
                              Upload Audio File
                              <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 60 * 1024 * 1024) {
                                    toast.error("Audio file is too large. Choose a file under 60MB.");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCourse(c => ({ ...c, audio_url: reader.result as string }));
                                    toast.success("Listening audio loaded successfully!");
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                          
                          {course.audio_url && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                                <span>Audio Track Preview & Waveform</span>
                                <button 
                                  type="button"
                                  className="text-red-500 hover:text-red-650 shrink-0 text-[10px] uppercase font-black tracking-wider flex items-center gap-1"
                                  onClick={() => setCourse(c => ({...c, audio_url: ""}))}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove Audio
                                </button>
                              </div>
                              <AudioWaveformPreview audioUrl={course.audio_url} />
                            </div>
                          )}
                        </div>

                        {/* Transcript track panel */}
                        <div className="space-y-3 p-6 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-3xl animate-in fade-in slide-in-from-top-3 duration-300">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Transcript Subtitles (VTT / SRT)</label>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">CC Subtitles</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium leading-normal">
                             Attach WebVTT (.vtt) or SubRip (.srt) caption texts for accessibility cues and playback alignment.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input 
                              placeholder="No transcript file selected (.vtt or .srt)" 
                              className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-indigo-500 text-sm font-semibold pointer-events-none"
                              value={course.transcript_name || ""}
                              readOnly
                            />
                            <label className="cursor-pointer h-12 px-6 bg-slate-800 hover:bg-slate-755 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-750 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center shrink-0">
                              Choose SRT / VTT File
                              <input 
                                type="file" 
                                accept=".vtt,.srt" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCourse(c => ({ 
                                      ...c, 
                                      transcript_name: file.name,
                                      transcript_url: reader.result as string
                                    }));
                                    toast.success(`${file.name} uploaded successfully!`);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>

                          {course.transcript_url && (
                            <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-950/35 rounded-2xl flex flex-col gap-2 mt-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                  <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white leading-none">{course.transcript_name || "Transcript File"}</p>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">Ready to embed in modules context</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    type="button"
                                    size="sm"
                                    className="h-8 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                                    onClick={() => {
                                      setIsTranscriptPreviewOpen(!isTranscriptPreviewOpen);
                                    }}
                                  >
                                    {isTranscriptPreviewOpen ? "Close Preview" : "Preview Transcript Content"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    type="button"
                                    className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                                    onClick={() => setCourse(c => ({...c, transcript_url: "", transcript_name: ""}))}
                                    title="Remove CC File"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {isTranscriptPreviewOpen && (
                                <div className="p-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-mono max-h-40 overflow-y-auto leading-relaxed mt-2 select-text animate-in fade-in duration-200">
                                  {course.transcript_url.startsWith("data:") ? (
                                    (() => {
                                      try {
                                        const base64Part = course.transcript_url.split(",")[1];
                                        const decoded = atob(base64Part);
                                        return decoded;
                                      } catch (err) {
                                        return "Decoding error: Invalid raw stream.";
                                      }
                                    })()
                                  ) : (
                                    "Ready remote/offline transcript content."
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {renderFieldHeader("Required Membership Access Tier", "access_tier", course.access_tier || "Free Trial")}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <CourseAccessTierPicker
                          value={editingFields['access_tier'] ? (draftValues['access_tier'] ?? "Free Trial") : (course.access_tier || "Free Trial")}
                          courseId={course.id}
                          disabled={!editingFields['access_tier']}
                          onChange={(tierName) => {
                            setDraftValues(prev => ({ ...prev, access_tier: tierName }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderFieldHeader("Course Syllabus Content (Markdown / Optional)", "content", course.content || "")}
                      <Textarea 
                        placeholder="Leave empty for auto-compilation from canvas, or write explicit study material/syllabus intro..." 
                        className="min-h-[100px] rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500 text-sm font-semibold"
                        value={editingFields['content'] ? (draftValues['content'] ?? "") : (course.content || "")}
                        onChange={e => setDraftValues(prev => ({ ...prev, content: e.target.value }))}
                        disabled={!editingFields['content']}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    {/* 1. Target Stream / Exam type (AC, GT, Diagnostic) */}
                    <div className="space-y-2">
                      {renderFieldHeader("Target Stream / Exam Track", "type", course.type || "Academic (AC)")}
                      <select 
                        className="flex h-14 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editingFields['type'] ? (draftValues['type'] ?? "Academic (AC)") : (course.type || "Academic (AC)")}
                        onChange={e => setDraftValues(prev => ({ ...prev, type: e.target.value }))}
                        disabled={!editingFields['type']}
                      >
                        <option value="Academic (AC)">Academic (AC)</option>
                        <option value="General Training (GT)">General Training (GT)</option>
                        <option value="Diagnostic">Diagnostic</option>
                      </select>
                    </div>

                    {/* 2. Classification */}
                    <div className="space-y-2">
                      {renderFieldHeader("Classification / Format", "course_type", course.course_type || "Reading Test")}
                      <select 
                        className="flex h-14 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editingFields['course_type'] ? (draftValues['course_type'] ?? "Reading Test") : (course.course_type || "Reading Test")}
                        onChange={e => setDraftValues(prev => ({ ...prev, course_type: e.target.value }))}
                        disabled={!editingFields['course_type']}
                      >
                        <option value="Reading Test">Reading Test</option>
                        <option value="Listening Test">Listening Test</option>
                        <option value="Writing Task">Writing Task</option>
                        <option value="Speaking Task">Speaking Task</option>
                        <option value="Mock Test">Mock Test</option>
                        <option value="Vocabulary Lesson">Vocabulary Lesson</option>
                        <option value="Grammar Lesson">Grammar Lesson</option>
                      </select>
                    </div>

                    {/* 3. Category */}
                    <div className="space-y-2">
                       {renderFieldHeader("Category", "category", course.category || "")}
                       <Input 
                         placeholder="e.g. Reading, Writing, Vocabulary"
                         className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500 text-sm font-semibold"
                         value={editingFields['category'] ? (draftValues['category'] ?? "") : (course.category || "")}
                         onChange={e => setDraftValues(prev => ({ ...prev, category: e.target.value }))}
                         disabled={!editingFields['category']}
                       />
                    </div>

                    {/* Test Number Field */}
                    <div className="space-y-2">
                       {renderFieldHeader("Test Number", "test_number", course.test_number || "")}
                       <Input 
                         placeholder="e.g. 1, 2, 3A"
                         className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500 text-sm font-semibold"
                         value={editingFields['test_number'] ? (draftValues['test_number'] ?? "") : (course.test_number || "")}
                         onChange={e => setDraftValues(prev => ({ ...prev, test_number: e.target.value }))}
                         disabled={!editingFields['test_number']}
                       />
                    </div>

                    {/* New Time Limit Field */}
                    <div className="space-y-2">
                       {renderFieldHeader("Lesson Time Limit (Minutes)", "timeLimit", course.timeLimit !== undefined ? course.timeLimit : 20)}
                       <Input 
                         type="number"
                         placeholder="e.g. 20"
                         className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500 text-sm font-semibold"
                         value={editingFields['timeLimit'] ? (draftValues['timeLimit'] ?? 20) : (course.timeLimit !== undefined ? course.timeLimit : 20)}
                         onChange={e => setDraftValues(prev => ({ ...prev, timeLimit: e.target.value !== "" ? parseInt(e.target.value) : 20 }))}
                         disabled={!editingFields['timeLimit']}
                       />
                    </div>

                    {/* Interface Layout Selector */}
                    <div className="space-y-2">
                      {renderFieldHeader("Interface Layout", "layout_type", course.layout_type || "single")}
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl">
                        <button 
                          type="button"
                          disabled={!editingFields['layout_type']}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                            (editingFields['layout_type'] ? draftValues['layout_type'] : course.layout_type) === 'single' 
                              ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600' 
                              : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'
                          }`}
                          onClick={() => setDraftValues(prev => ({ ...prev, layout_type: 'single' }))}
                        >
                          <Layout className="w-4 h-4" /> Single Screen
                        </button>
                        <button 
                          type="button"
                          disabled={!editingFields['layout_type']}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                            (editingFields['layout_type'] ? draftValues['layout_type'] : course.layout_type) === 'split' 
                              ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600' 
                              : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'
                          }`}
                          onClick={() => setDraftValues(prev => ({ ...prev, layout_type: 'split' }))}
                        >
                          <Columns className="w-4 h-4" /> Split Screen
                        </button>
                      </div>
                    </div>

                    {/* Visibility Settings Section */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                      {renderFieldHeader("Visibility Controls", "visibility", {
                        show_in_catalog: course.show_in_catalog !== false,
                        show_in_syllabus: course.show_in_syllabus !== false,
                        show_in_practice: course.show_in_practice !== false
                      })}
                      <div className="grid grid-cols-1 gap-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <label className="flex items-center justify-between group cursor-pointer">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Show in Catalog</span>
                          <input 
                            type="checkbox" 
                            disabled={!editingFields['visibility']}
                            checked={editingFields['visibility'] ? (draftValues['visibility']?.show_in_catalog !== false) : (course.show_in_catalog !== false)} 
                            onChange={(e) => setDraftValues(prev => ({
                              ...prev,
                              visibility: {
                                ...prev.visibility,
                                show_in_catalog: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary disabled:opacity-50"
                          />
                        </label>
                        <label className="flex items-center justify-between group cursor-pointer">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Show in Syllabus</span>
                          <input 
                            type="checkbox" 
                            disabled={!editingFields['visibility']}
                            checked={editingFields['visibility'] ? (draftValues['visibility']?.show_in_syllabus !== false) : (course.show_in_syllabus !== false)} 
                            onChange={(e) => setDraftValues(prev => ({
                              ...prev,
                              visibility: {
                                ...prev.visibility,
                                show_in_syllabus: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary disabled:opacity-50"
                          />
                        </label>
                        <label className="flex items-center justify-between group cursor-pointer">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Show in Practice</span>
                          <input 
                            type="checkbox" 
                            disabled={!editingFields['visibility']}
                            checked={editingFields['visibility'] ? (draftValues['visibility']?.show_in_practice !== false) : (course.show_in_practice !== false)} 
                            onChange={(e) => setDraftValues(prev => ({
                              ...prev,
                              visibility: {
                                ...prev.visibility,
                                show_in_practice: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary disabled:opacity-50"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400 italic font-medium px-1">Control where this track appears for students across the academy.</p>
                    </div>

                    {/* 5. Thumbnail URL & Upload Media Panel */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider block">Featured Thumbnail Media</label>
                      
                      {/* Media selector select tabs */}
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs">
                        <button
                          type="button"
                          className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${course.thumbnail_type !== 'video' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                          onClick={() => setCourse(c => ({ ...c, thumbnail_type: 'image' }))}
                        >
                          Image Thumbnail
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${course.thumbnail_type === 'video' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                          onClick={() => setCourse(c => ({ ...c, thumbnail_type: 'video' }))}
                        >
                          Video Thumbnail
                        </button>
                      </div>

                      {/* Display active file uploads */}
                      <div className="space-y-2">
                        {course.thumbnail_url ? (
                          <div className="relative group rounded-xl overflow-hidden aspect-video bg-black border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                            {course.thumbnail_type === 'video' ? (
                              <video 
                                src={course.thumbnail_url} 
                                className="w-full h-full object-cover" 
                                controls 
                                playsInline 
                                muted
                              />
                            ) : (
                              <img 
                                src={course.thumbnail_url} 
                                alt="Thumbnail Preview" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="absolute inset-0 bg-black text-white hover:text-white flex items-center justify-center gap-2">
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                                onClick={() => setCourse(c => ({ ...c, thumbnail_url: "" }))}
                              >
                                Remove Media
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-950/20 animate-fade-in">
                            <span className="text-[10px] text-slate-400 block font-semibold mb-2">
                              {course.thumbnail_type === 'video' ? 'No video selected (MP4, WEBM)' : 'No image selected (PEG, PNG, WEBP)'}
                            </span>
                            <div className="flex gap-2 justify-center">
                              <label className="cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all">
                                Upload File
                                <input 
                                  type="file" 
                                  accept={course.thumbnail_type === 'video' ? "video/*" : "image/*"} 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 10 * 1024 * 1024) {
                                      toast.error("File is too large. Choose a file under 10MB.");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCourse(c => ({ ...c, thumbnail_url: reader.result as string }));
                                      toast.success("File thumbnail loaded!");
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                              <span className="text-slate-300 dark:text-slate-700 self-center text-xs font-medium">or</span>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-slate-200 bg-transparent"
                                onClick={() => {
                                  const url = window.prompt(`Enter direct ${course.thumbnail_type || 'image'} URL:`);
                                  if (url) {
                                    setCourse(c => ({ ...c, thumbnail_url: url }));
                                  }
                                }}
                              >
                                Link URL
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* 6. Listening Audio Stream config */}
                    {course.course_type.toLowerCase().includes("listening") && (
                      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                        <label className="text-[11px] font-black uppercase text-indigo-500 tracking-wider block">Global Audio Stream / Voice Upload</label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-snug">
                          Set the default voice track that will stream continuously for this Listening Test. Candidates can upload custom voices during test taking if needed.
                        </p>
                        
                        <div className="flex gap-2">
                            <Input 
                              placeholder="https://example.com/audio-stream.mp3" 
                              className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs font-medium h-10"
                              value={course.audio_url || ""}
                              onChange={e => setCourse(c => ({...c, audio_url: e.target.value}))}
                            />
                            <label className="cursor-pointer px-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center shrink-0">
                                Upload Voice
                                <input 
                                  type="file" 
                                  accept="audio/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 60 * 1024 * 1024) {
                                      toast.error("Audio file is too large. Choose a file under 60MB.");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCourse(c => ({ ...c, audio_url: reader.result as string }));
                                      toast.success("Voice stream file loaded!");
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                            </label>
                        </div>
                        {course.audio_url && (
                           <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl relative group">
                             <audio src={course.audio_url} controls className="w-full h-8" />
                             <button
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-600 w-6 h-6 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                onClick={() => setCourse(c => ({...c, audio_url: ""}))}
                                title="Remove Audio"
                             >
                                <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
               </div>
            </Card>

            {/* Editor Canvas Area */}
            <div className="min-h-[600px]">
               {course.layout_type === 'single' ? (
                  <EditorCanvas 
                    panelId="single"
                    title="Main Content Canvas"
                    blocks={course.blocks.single}
                    setBlocks={setSingleBlocks}
                  />
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                     <div className="h-full border-r border-slate-150 dark:border-white/5 pr-4">
                       <EditorCanvas 
                         panelId="left"
                         title="Left Panel (e.g. Reading Passage, Media)"
                         blocks={course.blocks.left}
                         setBlocks={setLeftBlocks}
                       />
                     </div>
                     <div className="h-full pl-4">
                       <EditorCanvas 
                         panelId="right"
                         title="Right Panel (e.g. Question Blocks)"
                         blocks={course.blocks.right}
                         setBlocks={setRightBlocks}
                       />
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
