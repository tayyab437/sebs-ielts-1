import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Film,
  Headphones,
  Award,
  Download,
  Share2,
  Bookmark,
  MessageSquare,
  FileText,
  Paperclip,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  User,
  ShieldCheck,
  Zap,
  GraduationCap,
  Lightbulb,
  Trash2,
  Subtitles,
  Maximize2,
  PictureInPicture2,
  Lock,
  Layers,
  Tv,
  CheckCircle,
  Flame,
  Send,
  ExternalLink,
  LayoutDashboard,
  Plus,
  Search,
  ThumbsUp,
  FileDown,
  FileCheck,
  Eye,
  Edit2,
  Save,
  Filter,
  Tag,
  Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MediaCourse, MediaEpisode, MediaQuestion } from "@/src/types/mediaCourse";
import { safeSetItem, safeGetItemAndParse } from "@/src/lib/safeStorage";
import { SecureVideoPlayer, getStoredResolution } from "@/src/components/common/SecureVideoPlayer";

interface MediaCoursePlayerProps {
  course: any; // MediaCourse or adapted Course
  onExit: () => void;
  initialModuleIdx?: number;
  initialEpisodeIdx?: number;
}

interface PersonalNote {
  id: string;
  timestamp: number;
  timestampFormatted: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  tag?: string;
}

interface DiscussionReply {
  id: string;
  author: string;
  role: string;
  avatarText: string;
  content: string;
  timeAgo: string;
  likes?: number;
  hasLiked?: boolean;
}

interface DiscussionPost {
  id: string;
  author: string;
  role: "Student" | "Tutor" | "Instructor";
  avatarText: string;
  timeAgo: string;
  content: string;
  timestampMarker?: string;
  timestampSeconds?: number;
  likes?: number;
  hasLiked?: boolean;
  replies?: DiscussionReply[];
}

interface CustomResourceItem {
  id: string;
  title: string;
  type: "doc" | "audio" | "link" | "pdf";
  size?: string;
  url?: string;
  description?: string;
  addedAt?: string;
}

export default function MediaCoursePlayer({
  course,
  onExit,
  initialModuleIdx = 0,
  initialEpisodeIdx = 0
}: MediaCoursePlayerProps) {
  const rawCourse: MediaCourse = course?.rawMediaCourse || course || {};

  type FlatEpisode = MediaEpisode & {
    moduleTitle?: string;
    moduleId?: string;
    moduleIndex: number;
    episodeIndex: number;
  };

  const allModules = rawCourse.modules || [];
  const flattenedEpisodes: FlatEpisode[] = allModules.flatMap((mod: any, modIdx: number) => {
    const rawList = (mod.episodes && mod.episodes.length > 0)
      ? mod.episodes
      : (mod.lessons || []);
    return rawList.map((ep: any, epIdx: number) => ({
      ...ep,
      mediaUrl: ep.mediaUrl || ep.video_url || ep.audio_url || ep.media_url || (rawCourse as any).trailer_url || (rawCourse as any).trailerUrl || "",
      mediaType: ep.mediaType || ep.media_type || (rawCourse as any).mediaType || (rawCourse as any).media_type || "video",
      moduleTitle: mod.title,
      moduleId: mod.id,
      moduleIndex: modIdx,
      episodeIndex: epIdx
    }));
  });

  const [currentFlatIndex, setCurrentFlatIndex] = useState(() => {
    let count = 0;
    for (let m = 0; m < allModules.length; m++) {
      const epCount = ((allModules[m] as any).episodes || (allModules[m] as any).lessons || []).length;
      for (let e = 0; e < epCount; e++) {
        if (m === initialModuleIdx && e === initialEpisodeIdx) {
          return count;
        }
        count++;
      }
    }
    return 0;
  });

  const defaultEpisode: FlatEpisode = {
    id: "ep-default",
    title: "Lesson Introduction",
    duration: "12:00",
    order: 1,
    description: "Welcome to this lesson.",
    moduleIndex: 0,
    episodeIndex: 0,
    mediaType: "video",
    mediaUrl: "",
    transcript: "",
    posterUrl: "",
    questions: [],
    resources: []
  };

  const currentEpisode: FlatEpisode = flattenedEpisodes[currentFlatIndex] || flattenedEpisodes[0] || defaultEpisode;

  // Playback & UI States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("sebs_course_playback_speed") || sessionStorage.getItem("sebs_course_playback_speed");
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.25 && val <= 3) return val;
      }
    } catch (e) {}
    return 1;
  });
  const [resolution, setResolution] = useState<string>(() => {
    return getStoredResolution();
  });
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "unfinished">("all");

  // Active Tab: Overview, Resources, Notes, Discussion, Checkpoints
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes" | "discussion" | "checkpoints">("overview");

  // Accordion open modules state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allModules.forEach((m, idx) => {
      initial[m.id || `mod-${idx}`] = idx === initialModuleIdx;
    });
    return initial;
  });

  // Bookmarking
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMobileCurriculumOpen, setIsMobileCurriculumOpen] = useState(false);

  // Checkpoint Quiz States
  const [activeQuestion, setActiveQuestion] = useState<MediaQuestion | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [questionFeedback, setQuestionFeedback] = useState<{ [qId: string]: { isCorrect: boolean; message: string } }>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [studentScore, setStudentScore] = useState(0);
  const [completedEpisodeIds, setCompletedEpisodeIds] = useState<string[]>(() => {
    return safeGetItemAndParse<string[]>("completed_media_episodes", []);
  });

  // Personal Notes for current episode
  const [notes, setNotes] = useState<PersonalNote[]>(() => {
    return safeGetItemAndParse<PersonalNote[]>(`media_notes_${currentEpisode?.id}`, [
      {
        id: "note-1",
        timestamp: 134,
        timestampFormatted: "02:14",
        text: "In open Wh-questions, tone descends on the last content noun.",
        tag: "Phonetics",
        createdAt: "2 days ago"
      },
      {
        id: "note-2",
        timestamp: 225,
        timestampFormatted: "03:45",
        text: "Use 'Frankly speaking...' as a soft disagreement buffer instead of flat 'No, you are wrong'.",
        tag: "Grammar",
        createdAt: "Yesterday"
      }
    ]);
  });
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("Key Concept");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingNoteTag, setEditingNoteTag] = useState("Key Concept");
  const [noteSearchQuery, setNoteSearchQuery] = useState("");

  // Discussion Q&A
  const defaultDiscussions: DiscussionPost[] = [
    {
      id: "disc-1",
      author: "Mohsin Khan",
      role: "Student",
      avatarText: "MK",
      timeAgo: "3 hours ago at 05:10",
      content: "Is it grammatically acceptable in formal British English to reply with 'As far as I know' to an executive inquiry, or is it too casual?",
      timestampMarker: "05:10",
      timestampSeconds: 310,
      likes: 4,
      hasLiked: false,
      replies: [
        {
          id: "rep-1",
          author: "Syed Ejaz Bukhari",
          role: "Instructor",
          avatarText: "SE",
          content: "Excellent question, Mohsin. It is perfectly standard in corporate environments. For hyper-formal board contexts, you can swap it with: 'To the best of my knowledge...'.",
          timeAgo: "2 hours ago",
          likes: 6,
          hasLiked: true
        }
      ]
    },
    {
      id: "disc-2",
      author: "Zainab Fatima",
      role: "Student",
      avatarText: "ZF",
      timeAgo: "Yesterday at 11:20",
      content: "The audio worksheet for intonation drilling is incredible! Where do we submit our 60-second voice recording for feedback?",
      timestampMarker: "11:20",
      timestampSeconds: 680,
      likes: 2,
      hasLiked: false,
      replies: [
        {
          id: "rep-2",
          author: "Academic Mentor",
          role: "Tutor",
          avatarText: "AM",
          content: "You can submit your voice memo in the Speaking Practice tab or during the weekly live mentorship review session!",
          timeAgo: "Yesterday",
          likes: 3,
          hasLiked: false
        }
      ]
    }
  ];

  const [discussionList, setDiscussionList] = useState<DiscussionPost[]>(() => {
    return safeGetItemAndParse<DiscussionPost[]>(`media_discussions_${currentEpisode?.id}`, defaultDiscussions);
  });
  const [newQuestionText, setNewQuestionText] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [discussionFilter, setDiscussionFilter] = useState<"all" | "answered" | "my">("all");
  const [discussionSearch, setDiscussionSearch] = useState("");

  // Resources state
  const [downloadedResourceIds, setDownloadedResourceIds] = useState<string[]>(() => {
    return safeGetItemAndParse<string[]>(`downloaded_resources_${currentEpisode?.id}`, []);
  });
  const [customResources, setCustomResources] = useState<CustomResourceItem[]>(() => {
    return safeGetItemAndParse<CustomResourceItem[]>(`custom_resources_${currentEpisode?.id}`, []);
  });
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [customResTitle, setCustomResTitle] = useState("");
  const [customResUrl, setCustomResUrl] = useState("");
  const [customResType, setCustomResType] = useState<"doc" | "audio" | "link" | "pdf">("doc");
  const [previewResource, setPreviewResource] = useState<any | null>(null);

  // Video seeking target
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineTriggerRef = useRef<{ [timeKey: number]: boolean }>({});

  // Auto expand module when current episode changes & sync storage
  useEffect(() => {
    timelineTriggerRef.current = {};
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveQuestion(null);
    setReplyingToId(null);
    setEditingNoteId(null);
    setIsAskingQuestion(false);
    setIsAddingResource(false);

    if (currentEpisode?.moduleId) {
      setExpandedModules((prev) => ({ ...prev, [currentEpisode.moduleId]: true }));
    }

    // Load saved notes for this episode
    const loadedNotes = safeGetItemAndParse<PersonalNote[]>(`media_notes_${currentEpisode?.id}`, []);
    if (loadedNotes && loadedNotes.length > 0) {
      setNotes(loadedNotes);
    } else {
      setNotes([
        {
          id: `note-${currentEpisode?.id}-1`,
          timestamp: 65,
          timestampFormatted: "01:05",
          text: `Key rule in "${currentEpisode?.title}": Pay special attention to cadence and word stress.`,
          tag: "Key Concept",
          createdAt: "Initial lesson note"
        }
      ]);
    }

    // Load saved discussions for this episode
    const loadedDisc = safeGetItemAndParse<DiscussionPost[]>(`media_discussions_${currentEpisode?.id}`, []);
    if (loadedDisc && loadedDisc.length > 0) {
      setDiscussionList(loadedDisc);
    } else {
      setDiscussionList(defaultDiscussions);
    }

    // Load downloaded resources
    const loadedDl = safeGetItemAndParse<string[]>(`downloaded_resources_${currentEpisode?.id}`, []);
    setDownloadedResourceIds(loadedDl || []);

    // Load custom resources
    const loadedCustom = safeGetItemAndParse<CustomResourceItem[]>(`custom_resources_${currentEpisode?.id}`, []);
    setCustomResources(loadedCustom || []);
  }, [currentEpisode?.id]);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleJumpToTimestamp = (sec: number) => {
    if (isNaN(sec) || sec < 0) return;
    setSeekTarget(sec);
    setCurrentTime(sec);
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = sec;
      } catch (e) {}
    }
    setTimeout(() => setSeekTarget(null), 300);
    toast.info(`Jumped to lecture timestamp ${formatSeconds(sec)}`);
  };

  // Question Checkpoint Trigger Checker during playback
  const handleTimeUpdate = (timeInSeconds: number) => {
    setCurrentTime(timeInSeconds);

    if (!currentEpisode?.questions || currentEpisode.questions.length === 0) return;

    const roundedSec = Math.floor(timeInSeconds);

    currentEpisode.questions.forEach((q) => {
      if (q.gateType === "in_video" && q.timestamp !== undefined) {
        const diff = Math.abs(roundedSec - q.timestamp);
        if (diff <= 1 && !timelineTriggerRef.current[q.timestamp] && !answeredQuestionIds.has(q.id)) {
          // Pause and trigger checkpoint question
          timelineTriggerRef.current[q.timestamp] = true;
          setIsPlaying(false);
          if (videoRef.current) videoRef.current.pause();
          if (audioRef.current) audioRef.current.pause();
          setActiveQuestion(q);
          setActiveTab("checkpoints");
          toast.info("Checkpoint Assessment", {
            description: `Concept check at ${q.timestampFormatted || formatSeconds(q.timestamp)}`
          });
        }
      }
    });
  };

  // Submit Answer for Question
  const handleAnswerSubmit = (question: MediaQuestion) => {
    const ans = userAnswers[question.id];
    if (ans === undefined || ans === "") {
      toast.error("Please provide an answer before submitting.");
      return;
    }

    let isCorrect = false;
    let feedbackMsg = "";

    if (question.type === "mcq" || question.type === "tfng") {
      isCorrect = Number(ans) === question.correctIndex;
      feedbackMsg = isCorrect
        ? "Correct! Brilliant comprehension of the concept."
        : `Incorrect. The correct answer is: ${question.options?.[question.correctIndex || 0]}`;
    } else if (question.type === "fib") {
      const normalizedUser = String(ans).trim().toLowerCase();
      const acceptable = (question.acceptedAnswers || [question.correctAnswer || ""]).map((a) =>
        a.trim().toLowerCase()
      );
      isCorrect = acceptable.includes(normalizedUser);
      feedbackMsg = isCorrect
        ? "Exact Match! Outstanding vocabulary precision."
        : `Close! Accepted answer: "${question.correctAnswer || question.acceptedAnswers?.[0]}"`;
    } else if (question.type === "qa") {
      isCorrect = String(ans).trim().length > 10;
      feedbackMsg = "Response Recorded! Compare your answer with the Band 8.5 Examiner Model.";
    }

    setQuestionFeedback((prev) => ({
      ...prev,
      [question.id]: { isCorrect, message: feedbackMsg }
    }));

    setAnsweredQuestionIds((prev) => new Set([...prev, question.id]));

    if (isCorrect) {
      setStudentScore((prev) => prev + (question.points || 10));
      try {
        const prof = safeGetItemAndParse<any>("student_profile", {});
        prof.xp = (prof.xp || 2450) + (question.points || 10);
        safeSetItem("student_profile", JSON.stringify(prof));
        window.dispatchEvent(new CustomEvent("profile_updated"));
      } catch (e) {}
    }
  };

  // Mark Episode Complete
  const handleCompleteEpisode = () => {
    if (!completedEpisodeIds.includes(currentEpisode.id)) {
      const updated = [...completedEpisodeIds, currentEpisode.id];
      setCompletedEpisodeIds(updated);
      safeSetItem("completed_media_episodes", JSON.stringify(updated));

      const existingLessons = safeGetItemAndParse<string[]>("completed_lessons", []);
      if (!existingLessons.includes(currentEpisode.id)) {
        safeSetItem("completed_lessons", JSON.stringify([...existingLessons, currentEpisode.id]));
      }

      toast.success("Episode Completed!", {
        description: `Great job! You earned +50 XP for completing "${currentEpisode.title}"`
      });
    }

    if (autoPlayNext && currentFlatIndex < flattenedEpisodes.length - 1) {
      setCurrentFlatIndex((prev) => prev + 1);
    }
  };

  // Save Note
  const handleSaveNote = () => {
    if (!newNoteText.trim()) {
      toast.error("Please enter some note content");
      return;
    }
    const time = Math.floor(currentTime);
    const noteObj: PersonalNote = {
      id: `note-${Date.now()}`,
      timestamp: time,
      timestampFormatted: formatSeconds(time),
      text: newNoteText.trim(),
      tag: newNoteTag || "Key Concept",
      createdAt: "Just now"
    };
    const updated = [noteObj, ...notes];
    setNotes(updated);
    safeSetItem(`media_notes_${currentEpisode.id}`, JSON.stringify(updated));

    // Also persist to global all_student_notes store
    try {
      const globalNotes = safeGetItemAndParse<any[]>("all_student_notes", []);
      const entry = {
        ...noteObj,
        courseId: rawCourse.id,
        courseTitle: rawCourse.title,
        episodeId: currentEpisode.id,
        episodeTitle: currentEpisode.title,
        savedAt: new Date().toISOString()
      };
      safeSetItem("all_student_notes", JSON.stringify([entry, ...globalNotes.filter((n: any) => n.id !== noteObj.id)]));
    } catch (e) {}

    setNewNoteText("");
    toast.success(`Note saved at ${noteObj.timestampFormatted}!`);
  };

  const handleUpdateNote = (id: string) => {
    if (!editingNoteText.trim()) return;
    const updated = notes.map((n) =>
      n.id === id
        ? { ...n, text: editingNoteText.trim(), tag: editingNoteTag, updatedAt: "Edited just now" }
        : n
    );
    setNotes(updated);
    safeSetItem(`media_notes_${currentEpisode.id}`, JSON.stringify(updated));
    setEditingNoteId(null);
    setEditingNoteText("");
    toast.success("Note updated successfully");
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    safeSetItem(`media_notes_${currentEpisode.id}`, JSON.stringify(updated));
    toast.info("Note removed");
  };

  const handleExportNotes = () => {
    if (notes.length === 0) {
      toast.error("No notes to export for this lesson.");
      return;
    }
    const header = `=====================================================\n` +
      `SEBS INSTITUTE - PERSONAL STUDY NOTES\n` +
      `Course: ${rawCourse.title || "Spoken English"}\n` +
      `Lesson: 0${currentLessonNum} - ${currentEpisode.title}\n` +
      `Instructor: ${rawCourse.instructor || "Syed Ejaz Bukhari"}\n` +
      `Exported: ${new Date().toLocaleString()}\n` +
      `=====================================================\n\n`;

    const body = notes.map((n, idx) =>
      `[${idx + 1}] [${n.timestampFormatted}] ${n.tag ? `[${n.tag.toUpperCase()}] ` : ""}\n` +
      `${n.text}\n` +
      `(Saved: ${n.createdAt}${n.updatedAt ? ` • ${n.updatedAt}` : ""})\n\n`
    ).join("");

    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lesson_0${currentLessonNum}_Notes_${currentEpisode.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded as text file!");
  };

  // Add Discussion Question
  const handlePostQuestion = () => {
    if (!newQuestionText.trim()) {
      toast.error("Please enter your question.");
      return;
    }
    const time = Math.floor(currentTime);
    const newPost: DiscussionPost = {
      id: `disc-${Date.now()}`,
      author: "Tayyab (You)",
      role: "Student",
      avatarText: "TY",
      timeAgo: "Just now",
      content: newQuestionText.trim(),
      timestampMarker: formatSeconds(time),
      timestampSeconds: time,
      likes: 1,
      hasLiked: true,
      replies: []
    };
    const updated = [newPost, ...discussionList];
    setDiscussionList(updated);
    safeSetItem(`media_discussions_${currentEpisode.id}`, JSON.stringify(updated));
    setNewQuestionText("");
    setIsAskingQuestion(false);
    toast.success("Question submitted to Syed Ejaz Bukhari & academic fellows!");
  };

  const handlePostReply = (postId: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter your reply.");
      return;
    }
    const replyObj: DiscussionReply = {
      id: `rep-${Date.now()}`,
      author: "Tayyab (You)",
      role: "Student",
      avatarText: "TY",
      content: replyText.trim(),
      timeAgo: "Just now",
      likes: 0,
      hasLiked: false
    };
    const updated = discussionList.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          replies: [...(post.replies || []), replyObj]
        };
      }
      return post;
    });
    setDiscussionList(updated);
    safeSetItem(`media_discussions_${currentEpisode.id}`, JSON.stringify(updated));
    setReplyingToId(null);
    setReplyText("");
    toast.success("Reply posted to discussion thread!");
  };

  const handleTogglePostLike = (postId: string) => {
    const updated = discussionList.map((post) => {
      if (post.id === postId) {
        const hasLiked = !post.hasLiked;
        return {
          ...post,
          hasLiked,
          likes: Math.max(0, (post.likes || 0) + (hasLiked ? 1 : -1))
        };
      }
      return post;
    });
    setDiscussionList(updated);
    safeSetItem(`media_discussions_${currentEpisode.id}`, JSON.stringify(updated));
  };

  const handleToggleReplyLike = (postId: string, replyId: string) => {
    const updated = discussionList.map((post) => {
      if (post.id === postId && post.replies) {
        return {
          ...post,
          replies: post.replies.map((rep) => {
            if (rep.id === replyId) {
              const hasLiked = !rep.hasLiked;
              return {
                ...rep,
                hasLiked,
                likes: Math.max(0, (rep.likes || 0) + (hasLiked ? 1 : -1))
              };
            }
            return rep;
          })
        };
      }
      return post;
    });
    setDiscussionList(updated);
    safeSetItem(`media_discussions_${currentEpisode.id}`, JSON.stringify(updated));
  };

  // Resources Handlers
  const handleDownloadFile = (res: any) => {
    if (!downloadedResourceIds.includes(res.id)) {
      const updated = [...downloadedResourceIds, res.id];
      setDownloadedResourceIds(updated);
      safeSetItem(`downloaded_resources_${currentEpisode.id}`, JSON.stringify(updated));
    }

    if (res.url && (res.url.startsWith("http://") || res.url.startsWith("https://"))) {
      window.open(res.url, "_blank");
      toast.success(`Opening resource: ${res.title}`);
      return;
    }

    const content = `=========================================================================\n` +
      `SEBS INSTITUTE OF SPOKEN ENGLISH & LINGUISTICS\n` +
      `CERTIFIED ACADEMIC RESOURCE: ${res.title.toUpperCase()}\n` +
      `Course: ${rawCourse.title || "Spoken English Course"}\n` +
      `Section: 0${currentSectionNum} (${currentModuleTitle})\n` +
      `Lesson: 0${currentLessonNum} - ${currentEpisode.title}\n` +
      `Instructor: ${rawCourse.instructor || "Syed Ejaz Bukhari"}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `=========================================================================\n\n` +
      `[1] PEDAGOGICAL SUMMARY & CORE RULES:\n` +
      `-------------------------------------------------------------------------\n` +
      `${currentEpisode.pedagogicalRule?.title || "Key Conversational Syntax & Intonation"}\n` +
      `${currentEpisode.pedagogicalRule?.description || "Master natural flow, rhythm, and sentence inversion without phonetic hesitation."}\n\n` +
      `[2] TARGET LEARNING OBJECTIVES:\n` +
      `-------------------------------------------------------------------------\n` +
      (currentEpisode.learningObjectives?.map((o, i) => `${i + 1}. ${o.title}: ${o.description}`).join("\n") ||
        "1. Question Intonation Mastery\n2. 8 Natural Conversational Fillers\n3. Hesitation Overhaul Drills\n4. Syntactical Transfer Elimination") +
      `\n\n` +
      `[3] PRACTICE DRILLS & HIGH-YIELD SENTENCES:\n` +
      `-------------------------------------------------------------------------\n` +
      `* "To be completely candid, I haven't looked into that matter yet." (Rising -> Falling)\n` +
      `* "Could you perhaps clarify the timeframe for this initiative?" (Polite Inversion)\n` +
      `* "As far as I can tell, the preliminary statistics look promising." (Hedge Buffer)\n` +
      `* "You're attending tomorrow's symposium, aren't you?" (Tag Question Intonation)\n\n` +
      `[4] INSTRUCTOR ADVICE:\n` +
      `-------------------------------------------------------------------------\n` +
      `Practice reading these aloud with a 2-second diaphragmatic pause before responding.\n` +
      `Record yourself and review pitch changes using the SEBS Phonetics Matrix.\n\n` +
      `© SEBS Institute. All rights reserved for enrolled students.\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SEBS_${res.title.replace(/[^a-zA-Z0-9]/g, "_")}_Lesson0${currentLessonNum}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${res.title}`);
  };

  const handleDownloadAllResources = () => {
    const allIds = [
      ...(currentEpisode.resources || []).map(r => r.id || r.title),
      ...customResources.map(c => c.id),
      "res-def-1", "res-def-2", "res-def-3"
    ];
    const newDownloaded = Array.from(new Set([...downloadedResourceIds, ...allIds]));
    setDownloadedResourceIds(newDownloaded);
    safeSetItem(`downloaded_resources_${currentEpisode.id}`, JSON.stringify(newDownloaded));

    const masterPackage = `=========================================================================\n` +
      `SEBS INSTITUTE - COMPLETE ALL-IN-ONE LESSON STUDY PACK\n` +
      `Course: ${rawCourse.title || "Spoken English"}\n` +
      `Lesson 0${currentLessonNum}: ${currentEpisode.title}\n` +
      `Instructor: ${rawCourse.instructor || "Syed Ejaz Bukhari"} (Cambridge CELTA)\n` +
      `=========================================================================\n\n` +
      `SECTION A: LECTURE OUTLINE & OBJECTIVES\n` +
      `${currentEpisode.description || "Core fluency lecture."}\n\n` +
      `SECTION B: PEDAGOGICAL RULEBOOK\n` +
      `Rule: ${currentEpisode.pedagogicalRule?.title || "Conversational Intonation"}\n` +
      `Detail: ${currentEpisode.pedagogicalRule?.description || "Maintain vocal melody and natural word stress."}\n\n` +
      `SECTION C: VOCABULARY & COLLOCATIONS BANK\n` +
      `1. Frankly speaking (Buffer Hedge)\n` +
      `2. In my humble estimation (Executive Opinion)\n` +
      `3. With all due respect (Polite Disagreement)\n` +
      `4. To cut a long story short (Discourse Marker)\n\n` +
      `SECTION D: YOUR LESSON NOTES\n` +
      (notes.map((n, i) => `[${i + 1}] [${n.timestampFormatted}] ${n.text}`).join("\n") || "No personal notes recorded yet.") +
      `\n\n` +
      `© SEBS Institute. Student License Authorized.\n`;

    const blob = new Blob([masterPackage], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SEBS_Lesson_0${currentLessonNum}_Complete_Study_Kit.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Complete Lesson 0" + currentLessonNum + " Study Package downloaded!");
  };

  const handleAddCustomResource = () => {
    if (!customResTitle.trim()) {
      toast.error("Please enter a title for the resource");
      return;
    }
    const newRes: CustomResourceItem = {
      id: `custom-res-${Date.now()}`,
      title: customResTitle.trim(),
      url: customResUrl.trim() || undefined,
      type: customResType,
      size: "Custom Doc",
      addedAt: "Just now"
    };
    const updated = [newRes, ...customResources];
    setCustomResources(updated);
    safeSetItem(`custom_resources_${currentEpisode.id}`, JSON.stringify(updated));
    setCustomResTitle("");
    setCustomResUrl("");
    setIsAddingResource(false);
    toast.success("Custom resource saved to this lesson!");
  };

  const handleDeleteCustomResource = (id: string) => {
    const updated = customResources.filter((r) => r.id !== id);
    setCustomResources(updated);
    safeSetItem(`custom_resources_${currentEpisode.id}`, JSON.stringify(updated));
    toast.info("Resource removed");
  };

  // Progress Calculations
  const completedCount = completedEpisodeIds.filter((id) =>
    flattenedEpisodes.some((ep) => ep.id === id)
  ).length;
  const totalCount = flattenedEpisodes.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const prevEpisode = currentFlatIndex > 0 ? flattenedEpisodes[currentFlatIndex - 1] : null;
  const nextEpisode = currentFlatIndex < flattenedEpisodes.length - 1 ? flattenedEpisodes[currentFlatIndex + 1] : null;

  // Filtered episodes based on unfinished tab
  const getVisibleEpisodes = (episodes: any[]) => {
    if (filterMode === "unfinished") {
      return episodes.filter((ep) => !completedEpisodeIds.includes(ep.id));
    }
    return episodes;
  };

  const currentModuleTitle = currentEpisode.moduleTitle || (allModules[currentEpisode.moduleIndex]?.title) || "Spoken English Core";
  const currentSectionNum = (currentEpisode.moduleIndex || 0) + 1;
  const currentLessonNum = (currentEpisode.episodeIndex || 0) + 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-slate-900 flex flex-col overflow-y-auto font-sans">
      
      {/* 1. THEATER MODE VIDEO SECTION */}
      <section className="w-full bg-white text-slate-900 relative border-b border-slate-200/80 shadow-xs shrink-0">
        <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-10 py-2 sm:py-3">
          
          {/* Header Bar: Course Title only & Profile Icon to access Dashboard */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
            {/* Left: Exit/Back button & Course Title only */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <button
                onClick={onExit}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all shrink-0 cursor-pointer group active:scale-95 shadow-xs"
                title="Back to Course Overview"
                aria-label="Back to Course Overview"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight truncate min-w-0">
                {rawCourse.title || "Spoken English Course"}
              </h1>
            </div>

            {/* Right: Profile Icon to access Dashboard */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 hover:text-slate-900 transition-all group cursor-pointer active:scale-95 shadow-xs"
                title="Access Student Dashboard"
                aria-label="Access Dashboard"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline text-xs font-semibold tracking-wide text-slate-700 group-hover:text-slate-900">
                  Dashboard
                </span>
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 hidden md:inline transition-colors" />
              </Link>
            </div>
          </div>

          {/* Video Player Canvas: 16:9 on mobile for zero distortion, widescreen theater on desktop */}
          <div className="relative w-full aspect-video sm:aspect-[21/9] sm:min-h-[340px] sm:max-h-[560px] sm:rounded-2xl overflow-hidden bg-black shadow-xl group select-none flex items-center justify-center sm:border sm:border-slate-200">
            
            {currentEpisode?.mediaType === "audio" ? (
              /* Audio Theater Canvas */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 p-4 sm:p-12 text-center relative border border-slate-200">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-600 mb-3 sm:mb-4 shadow-xl shadow-rose-500/10">
                  <Headphones className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600 animate-pulse" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-slate-900 max-w-xl line-clamp-2 mb-1">
                  {currentEpisode.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium mb-3 sm:mb-4">
                  Speaker: {currentEpisode.speaker || rawCourse.instructor || "Syed Ejaz Bukhari"}
                </p>
                {currentEpisode.mediaUrl ? (
                  <audio
                    ref={audioRef}
                    src={currentEpisode.mediaUrl}
                    onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={handleCompleteEpisode}
                    controls
                    className="w-full max-w-xl rounded-xl bg-white border border-slate-300 shadow-sm"
                  />
                ) : (
                  <p className="text-xs text-slate-500 italic">No audio track configured.</p>
                )}
              </div>
            ) : (
              /* High-Def Secure Video Stream */
              <SecureVideoPlayer
                url={currentEpisode.mediaUrl}
                title={currentEpisode.title}
                poster={currentEpisode.posterUrl || rawCourse.featuredImage}
                initialDuration={currentEpisode.duration}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                resolution={resolution}
                onResolutionChange={setResolution}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={setDuration}
                onEnded={handleCompleteEpisode}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                checkpointMarkers={(currentEpisode.questions || []).map((q) => ({
                  timestamp: q.timestamp || 0,
                  label: q.prompt
                }))}
                seekToTime={seekTarget}
                className="w-full h-full rounded-none border-none shadow-none"
              />
            )}

            {/* Video Overlay Top Badge */}
            <div className="absolute top-0 left-0 right-0 p-2.5 sm:p-4 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full text-slate-100 text-[10px] sm:text-xs border border-white/10 shadow-lg">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-bold tracking-wide">
                  SEBS {resolution === "Auto" ? "HD 1080p (Auto)" : `${resolution} HD`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 sm:px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md text-slate-200 font-mono text-[10px] sm:text-xs tracking-wider border border-white/10 shadow-lg">
                  SEC 0{currentSectionNum} • LESSON 0{currentLessonNum}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BALANCED LAYOUT */}
      <div className="max-w-[1720px] mx-auto w-full px-3.5 sm:px-6 lg:px-10 py-3 sm:py-6 pb-28 sm:pb-32 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        
        {/* LEFT COLUMN (60% WIDTH ON DESKTOP, FULL WIDTH ON MOBILE) */}
        <div className="w-full lg:w-[60%] flex flex-col gap-3.5 sm:gap-6 min-w-0">
          
          {/* MOBILE COURSE PROGRESSION STATUS (sm:hidden) */}
          <div className="sm:hidden flex flex-col gap-1.5 bg-white dark:bg-[#161b22] p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">
                {rawCourse.title || "Spoken English"} • Section 0{currentSectionNum}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{progressPercent}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-right text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {completedCount} of {totalCount} Lessons Cleared
            </span>
          </div>

          {/* LESSON TITLE & ACTION BAR CARD */}
          <section className="bg-white dark:bg-[#161b22] rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold">
                Lesson 0{currentLessonNum}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold">
                CEFR {currentEpisode.cefrBand || rawCourse.targetBand || "6.5+"}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-normal ml-1">
                <Clock className="w-4 h-4 text-slate-400" /> {currentEpisode.duration || "05:35"}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                Section 0{currentSectionNum}: {currentModuleTitle}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentEpisode.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                  {currentEpisode.description || "High-yield video lecture covering fundamental rules."}
                </p>
              </div>

              {/* Top-Right Circular Actions */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pt-0.5">
                <button
                  onClick={() => {
                    setIsBookmarked(!isBookmarked);
                    toast.success(isBookmarked ? "Lesson removed from bookmarks" : "Lesson bookmarked for quick revision!");
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all shadow-sm hover:shadow cursor-pointer shrink-0 ${
                    isBookmarked
                      ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                      : "bg-white dark:bg-slate-800 border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                  title="Bookmark lesson"
                  type="button"
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success("Lesson link copied to clipboard!");
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm hover:shadow cursor-pointer shrink-0 flex items-center justify-center"
                  title="Share lesson"
                  type="button"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 dark:border-white/5 pt-2" />
          </section>

          {/* MOBILE CURRICULUM DRAWER / QUICK-PEEK (lg:hidden) */}
          <div className="lg:hidden bg-white dark:bg-[#161b22] rounded-2xl p-3.5 border border-slate-200/80 dark:border-white/5 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Course Curriculum</span>
              </div>
              <button
                onClick={() => setIsMobileCurriculumOpen(!isMobileCurriculumOpen)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span>{isMobileCurriculumOpen ? "Hide" : `View All (${completedCount}/${totalCount})`}</span>
                {isMobileCurriculumOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Next Lesson Teaser Card */}
            {nextEpisode && (
              <div
                onClick={() => setCurrentFlatIndex(currentFlatIndex + 1)}
                className="flex items-center justify-between bg-slate-50 dark:bg-white/5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Up Next
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      Lesson 0{nextEpisode.episodeIndex + 1} — {nextEpisode.title}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0 pl-2">
                  {nextEpisode.duration || "16:45"}
                </span>
              </div>
            )}

            {/* Expandable Module/Episode List */}
            {isMobileCurriculumOpen && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5 max-h-72 overflow-y-auto custom-scrollbar">
                {flattenedEpisodes.map((ep, idx) => {
                  const isCurrent = idx === currentFlatIndex;
                  const isDone = completedEpisodeIds.includes(ep.id);
                  return (
                    <div
                      key={ep.id || idx}
                      onClick={() => {
                        setCurrentFlatIndex(idx);
                        setIsMobileCurriculumOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/40"
                          : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isCurrent ? (
                          <Play className="w-4 h-4 text-rose-600 fill-current shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20 shrink-0" />
                        )}
                        <span className="truncate">
                          0{ep.episodeIndex + 1} {ep.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                        {isCurrent ? "Playing" : ep.duration || "12:00"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INTERACTIVE MULTI-TAB SYSTEM */}
          <section className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/5 overflow-hidden flex flex-col">
            
            {/* Pill-Style Navigation Tab Headers */}
            <div className="p-2.5 sm:p-3 bg-slate-50/75 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/5">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-white/15"
                  }`}
                  type="button"
                >
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "resources"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-white/15"
                  }`}
                  type="button"
                >
                  <span>Resources</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "resources" ? "bg-white/20 text-white" : "bg-slate-300 dark:bg-white/20 text-slate-700 dark:text-slate-300"}`}>
                    {currentEpisode.resources?.length || 3}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "notes"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-white/15"
                  }`}
                  type="button"
                >
                  <span>Notes</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "notes" ? "bg-white/20 text-white" : "bg-slate-300 dark:bg-white/20 text-slate-700 dark:text-slate-300"}`}>
                    {notes.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("discussion")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "discussion"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-white/15"
                  }`}
                  type="button"
                >
                  <span>Discussion</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "discussion" ? "bg-white/20 text-white" : "bg-slate-300 dark:bg-white/20 text-slate-700 dark:text-slate-300"}`}>
                    {discussionList.length}
                  </span>
                </button>

                {currentEpisode.questions && currentEpisode.questions.length > 0 && (
                  <button
                    onClick={() => setActiveTab("checkpoints")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "checkpoints"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-white/15"
                    }`}
                    type="button"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Checkpoints ({currentEpisode.questions.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6">
              
              {/* 1. OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="flex flex-col gap-4 sm:gap-6">
                  
                  {/* Pedagogical Highlight Rule Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-l-4 border-rose-600 dark:border-rose-500 shadow-sm flex flex-col gap-1.5 sm:gap-2 relative">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      <span className="uppercase tracking-wider">
                        {currentEpisode.pedagogicalRule?.title || "Key Phonetic Syntax: Tag Question Intonation"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentEpisode.pedagogicalRule?.description || (
                        <>
                          If expecting confirmation, drop your pitch:{" "}
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            “It’s a productive session, isn’t it? ↘”
                          </span>
                          . When expressing genuine uncertainty, elevate pitch:{" "}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            “You haven’t seen the report yet, have you? ↗”
                          </span>
                          .
                        </>
                      )}
                    </p>
                    {currentEpisode.pedagogicalRule?.formula && (
                      <div className="mt-1 font-mono text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 font-semibold">
                        {currentEpisode.pedagogicalRule.formula}
                      </div>
                    )}
                    {currentEpisode.pedagogicalRule?.trap && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium mt-0.5">
                        <span className="font-bold">⚠️ Exam Trap:</span> {currentEpisode.pedagogicalRule.trap}
                      </div>
                    )}
                  </div>

                  {/* Learning Objectives Grid */}
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        What You'll Learn in This Lesson
                      </h2>
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {currentEpisode.learningObjectives && currentEpisode.learningObjectives.length > 0 
                          ? `${currentEpisode.learningObjectives.length} Core Competencies` 
                          : "4 Core Competencies"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                      {currentEpisode.learningObjectives && currentEpisode.learningObjectives.length > 0 ? (
                        currentEpisode.learningObjectives.map((obj, idx) => (
                          <div key={obj.id || idx} className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                              0{idx + 1}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{obj.title}</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                                {obj.description}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          {/* Item 1 */}
                          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                              01
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Question Intonation Mastery</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                                Clearly distinguish rising pitch (yes/no inquiries) from falling pitch (wh- information queries).
                              </p>
                            </div>
                          </div>

                          {/* Item 2 */}
                          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                              02
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">8 Natural Conversational Fillers</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                                Apply organic hedges like <span className="font-semibold text-slate-900 dark:text-white">“To be frank...”</span> and <span className="font-semibold text-slate-900 dark:text-white">“As far as I can tell...”</span> seamlessly.
                              </p>
                            </div>
                          </div>

                          {/* Item 3 */}
                          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                              03
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Hesitation Overhaul Drills</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                                Transform awkward “uhm / err” pauses into controlled verbal bridges and natural breathing checkpoints.
                              </p>
                            </div>
                          </div>

                          {/* Item 4 */}
                          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                              04
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Eliminate Literal Translation Traps</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                                Deconstruct common Hindi/Urdu syntactical transfer habits that cause grammatical anomalies in inversion.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Instructor Credentials Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center gap-3.5 shadow-sm">
                    <img
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-sm shrink-0 border border-slate-200 dark:border-white/10"
                      alt={rawCourse.instructor || "Syed Ejaz Bukhari"}
                      src={rawCourse.instructorAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBrUNjx4MUvkvX8EstG9v7Rg9mZ8SSSs5IPgle3Wf2Jpgos3o7dQXj3qqvehJHJg_4rvbZEtIf4JPz8hTm9HMloWgo388sspUM27He2WRYxkdd7L95d3XgL6ZnSHgoN6GeiVE6hk1nMkZ02yzB2ENwPXmij3yl6woy1te691NsQjDdy9NIV0P0gYuFqGQbXIGINZGNV5e4Xn53TowpkAPsR4RtILD894R2Li6IJ-COwLx8ycaJs4sbX0w"}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                        Course Instructor
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {rawCourse.instructor || "Syed Ejaz Bukhari"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Senior Linguistics Fellow • Cambridge CELTA
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. RESOURCES TAB */}
              {activeTab === "resources" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-rose-600" />
                        Lesson Handouts & Certified Material
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Download certified institute handouts, phonetics audio tracks, and personal notes for offline review.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingResource(!isAddingResource)}
                        className="text-xs font-semibold gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-rose-600" /> Add Resource / Link
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDownloadAllResources}
                        className="text-xs font-semibold gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download All (.ZIP / Pack)
                      </Button>
                    </div>
                  </div>

                  {/* Add Custom Resource Form */}
                  {isAddingResource && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Add Personal Study Resource</span>
                        <button
                          onClick={() => setIsAddingResource(false)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <Input
                          value={customResTitle}
                          onChange={(e) => setCustomResTitle(e.target.value)}
                          placeholder="Resource title (e.g. My Vocabulary Cheat Sheet)..."
                          className="text-xs bg-white border-slate-200"
                        />
                        <Input
                          value={customResUrl}
                          onChange={(e) => setCustomResUrl(e.target.value)}
                          placeholder="URL / Web link (optional)..."
                          className="text-xs bg-white border-slate-200"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={customResType}
                            onChange={(e: any) => setCustomResType(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 flex-1 outline-none"
                          >
                            <option value="doc">Document (.DOC)</option>
                            <option value="pdf">PDF Worksheet (.PDF)</option>
                            <option value="audio">Audio Track (.MP3)</option>
                            <option value="link">Web Link (.URL)</option>
                          </select>
                          <Button
                            size="sm"
                            onClick={handleAddCustomResource}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 rounded-lg"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Resources Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Default Official Handouts */}
                    {[
                      {
                        id: "res-def-1",
                        title: `${currentEpisode.title} - Speaking Worksheet`,
                        type: "doc" as const,
                        size: "2.4 MB • Certified PDF",
                        description: "Full question inversion drills, speech templates, and answer models."
                      },
                      {
                        id: "res-def-2",
                        title: "High-Band Fillers & Collocations Guide",
                        type: "pdf" as const,
                        size: "1.1 MB • Cambridge Model",
                        description: "Buffer hedges, discourse markers, and formal conversational openers."
                      },
                      {
                        id: "res-def-3",
                        title: "Diaphragmatic Intonation Drill Audio",
                        type: "audio" as const,
                        size: "8.5 MB • High-Res Audio",
                        description: "Listen & repeat voice pitch modulations recorded by Syed Ejaz Bukhari."
                      },
                      ...(currentEpisode.resources || []),
                      ...customResources.map((c) => ({
                        ...c,
                        isCustom: true
                      }))
                    ].map((res: any, rIdx: number) => {
                      const isAudio = res.type === "audio";
                      const isDoc = res.type === "doc" || res.type === "pdf";
                      const isLink = res.type === "link";
                      const isDownloaded = downloadedResourceIds.includes(res.id || `res-${rIdx}`);

                      return (
                        <div
                          key={res.id || rIdx}
                          className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between gap-3.5 shadow-xs hover:border-slate-300 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isAudio
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                                  : isLink
                                  ? "bg-purple-50 text-purple-600 border border-purple-200/60"
                                  : "bg-rose-50 text-rose-600 border border-rose-200/60"
                              }`}
                            >
                              {isAudio ? (
                                <Headphones className="w-5 h-5" />
                              ) : isLink ? (
                                <ExternalLink className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="text-xs font-bold text-slate-900 truncate" title={res.title}>
                                  {res.title}
                                </h3>
                                {res.isCustom && (
                                  <button
                                    onClick={() => handleDeleteCustomResource(res.id)}
                                    className="text-slate-400 hover:text-rose-600 p-0.5"
                                    title="Delete custom resource"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">
                                {res.type.toUpperCase()} • {res.size || "Certified Resource"}
                              </p>
                              {res.description && (
                                <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                                  {res.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            {isDownloaded && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                <FileCheck className="w-3 h-3" /> Ready
                              </span>
                            )}
                            {isAudio ? (
                              <Button
                                size="sm"
                                onClick={() => handleDownloadFile(res)}
                                className="w-full text-xs h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Play className="w-3.5 h-3.5" /> Practice Audio Drill
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewResource(res)}
                                  className="flex-1 text-xs h-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 mr-1 text-slate-500" /> Preview
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadFile(res)}
                                  className="flex-1 text-xs h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white gap-1 cursor-pointer shadow-xs"
                                >
                                  <Download className="w-3 h-3" /> Get File
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resource Preview Dialog */}
                  {previewResource && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mt-2 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-rose-600" />
                          <span className="text-xs font-bold text-slate-900">
                            Resource Preview: {previewResource.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDownloadFile(previewResource)}
                            className="text-xs h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white gap-1"
                          >
                            <Download className="w-3 h-3" /> Download Document
                          </Button>
                          <button
                            onClick={() => setPreviewResource(null)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-2 max-h-56 overflow-y-auto leading-relaxed">
                        <div className="font-bold text-rose-600">SEBS Certified Study Sheet - Lesson 0{currentLessonNum}</div>
                        <div>Target Topic: {currentEpisode.title}</div>
                        <div>Instructor: {rawCourse.instructor || "Syed Ejaz Bukhari"}</div>
                        <div className="border-t border-slate-100 pt-2 text-slate-600">
                          {currentEpisode.pedagogicalRule?.description || "In spoken discourse, remember to elevate tone on key contrastive words and relax vowels during transition markers."}
                        </div>
                        <div className="text-slate-600">
                          Recommended Practice: Read all dialogue items with voice projection and record your speech memo for mentor review.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. PERSONAL NOTES TAB */}
              {activeTab === "notes" && (
                <div className="flex flex-col gap-4">
                  {/* Top Header & Export */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-600" />
                        Timestamped Study Notes ({notes.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Capture lecture keypoints, phonetic patterns, or questions linked directly to video timestamps.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportNotes}
                        className="text-xs font-semibold gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-600" /> Export Notes (.TXT)
                      </Button>
                    </div>
                  </div>

                  {/* Official Instructor Key Takeaways */}
                  {currentEpisode.instructorNotes && currentEpisode.instructorNotes.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/80 flex flex-col gap-2 shadow-xs">
                      <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Instructor Core Rules & Takeaways</span>
                      </div>
                      <ul className="space-y-1 pl-1">
                        {currentEpisode.instructorNotes.map((note, nIdx) => (
                          <li key={nIdx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add Note Input Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-600" />
                        <span>Add note at timestamp:</span>
                        <button
                          onClick={() => handleJumpToTimestamp(Math.floor(currentTime))}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-mono text-xs font-bold rounded-md cursor-pointer transition-colors"
                          title="Click to seek"
                        >
                          {formatSeconds(currentTime)}
                        </button>
                      </label>

                      {/* Tag Selector */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        {["Key Concept", "Grammar", "Phonetics", "Vocabulary", "Question"].map((t) => (
                          <button
                            key={t}
                            onClick={() => setNewNoteTag(t)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all cursor-pointer ${
                              newNoteTag === t
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        rows={3}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Jot down a syntax pattern, phonetic cue, hesitation buffer, or rule..."
                        className="bg-white text-xs text-slate-900 rounded-xl resize-none pr-28 pb-10 border-slate-200 focus:border-rose-500 shadow-xs"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        className="absolute bottom-2.5 right-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 rounded-lg shadow-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" /> Save Note
                      </Button>
                    </div>
                  </div>

                  {/* Search and Filter Notes */}
                  {notes.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={noteSearchQuery}
                          onChange={(e) => setNoteSearchQuery(e.target.value)}
                          placeholder="Filter saved notes by keyword..."
                          className="text-xs pl-8 bg-white border-slate-200 h-8 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Saved Notes List */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {notes.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium">No notes recorded yet for this lesson.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Type in the box above to save notes linked directly to lecture timestamps.</p>
                      </div>
                    ) : (
                      notes
                        .filter((n) =>
                          !noteSearchQuery ||
                          n.text.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
                          (n.tag && n.tag.toLowerCase().includes(noteSearchQuery.toLowerCase()))
                        )
                        .map((note) => {
                          const isEditing = editingNoteId === note.id;

                          return (
                            <div
                              key={note.id}
                              className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex flex-col gap-2 shadow-xs hover:border-slate-300 transition-all group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleJumpToTimestamp(note.timestamp)}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-mono text-xs font-bold shrink-0 cursor-pointer transition-colors"
                                    title="Click to jump video to this moment"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-rose-600" />
                                    {note.timestampFormatted}
                                  </button>
                                  {note.tag && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                      #{note.tag}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(note.text);
                                      toast.success("Note copied to clipboard");
                                    }}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
                                    title="Copy note"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(note.id);
                                      setEditingNoteText(note.text);
                                      setEditingNoteTag(note.tag || "Key Concept");
                                    }}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
                                    title="Edit note"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50"
                                    title="Delete note"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="space-y-2 pt-1">
                                  <Textarea
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    className="text-xs bg-slate-50 border-slate-200"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingNoteId(null)}
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateNote(note.id)}
                                      className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-800 leading-relaxed font-normal">
                                  {note.text}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                <span>{note.createdAt}</span>
                                {note.updatedAt && <span className="italic">{note.updatedAt}</span>}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* 4. DISCUSSION TAB */}
              {activeTab === "discussion" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-rose-600" />
                        Peer & Mentor Academic Q&A
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ask questions about grammar, cadence, and discourse. Instructors and fellows answer continuously.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsAskingQuestion(!isAskingQuestion)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ask Question
                    </Button>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={discussionSearch}
                        onChange={(e) => setDiscussionSearch(e.target.value)}
                        placeholder="Search questions by topic, rule, or student..."
                        className="text-xs pl-8 bg-white border-slate-200 h-8 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {(["all", "answered", "my"] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          onClick={() => setDiscussionFilter(filterKey)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                            discussionFilter === filterKey
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {filterKey === "all" ? "All Questions" : filterKey === "answered" ? "Tutor Answered" : "My Questions"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ask Question Box */}
                  {isAskingQuestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-rose-600" />
                          Submit Question for Lesson 0{currentLessonNum}
                        </span>
                        <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
                          At {formatSeconds(currentTime)}
                        </span>
                      </div>
                      <Textarea
                        rows={3}
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Type your grammar query, British vs American idiom question, or pronunciation doubt..."
                        className="bg-white text-xs rounded-xl border-slate-200"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAskingQuestion(false)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handlePostQuestion}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg gap-1 shadow-xs"
                        >
                          <Send className="w-3 h-3" /> Post Question
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Questions List */}
                  <div className="flex flex-col gap-3.5 pt-1">
                    {discussionList
                      .filter((post) => {
                        if (discussionFilter === "answered") {
                          return (post.replies || []).some((r) => r.role === "Instructor" || r.role === "Tutor");
                        }
                        if (discussionFilter === "my") {
                          return post.author.includes("Tayyab") || post.author.includes("You");
                        }
                        return true;
                      })
                      .filter((post) => {
                        if (!discussionSearch) return true;
                        const q = discussionSearch.toLowerCase();
                        return (
                          post.content.toLowerCase().includes(q) ||
                          post.author.toLowerCase().includes(q) ||
                          (post.replies || []).some((r) => r.content.toLowerCase().includes(q))
                        );
                      })
                      .map((post) => (
                        <div
                          key={post.id}
                          className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col gap-3 shadow-xs hover:border-slate-300 transition-all"
                        >
                          {/* Post Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800">
                                {post.avatarText}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">{post.author}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      post.role === "Instructor"
                                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                                        : post.role === "Tutor"
                                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {post.role}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">{post.timeAgo}</span>
                              </div>
                            </div>

                            {post.timestampMarker && (
                              <button
                                onClick={() =>
                                  handleJumpToTimestamp(
                                    post.timestampSeconds ||
                                      (post.timestampMarker
                                        ? parseInt(post.timestampMarker.split(":")[0]) * 60 +
                                          parseInt(post.timestampMarker.split(":")[1])
                                        : 0)
                                  )
                                }
                                className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors cursor-pointer"
                                title="Click to seek"
                              >
                                <Play className="w-2.5 h-2.5 fill-rose-600" />
                                {post.timestampMarker}
                              </button>
                            )}
                          </div>

                          {/* Post Content */}
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-0.5">
                            {post.content}
                          </p>

                          {/* Post Action Bar */}
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                            <button
                              onClick={() => handleTogglePostLike(post.id)}
                              className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                post.hasLiked
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{post.likes || 0} Upvotes</span>
                            </button>

                            <button
                              onClick={() => {
                                setReplyingToId(replyingToId === post.id ? null : post.id);
                                setReplyText("");
                              }}
                              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              Reply ({post.replies?.length || 0})
                            </button>
                          </div>

                          {/* Nested Replies Thread */}
                          {post.replies && post.replies.length > 0 && (
                            <div className="space-y-2.5 pl-3 sm:pl-4 border-l-2 border-slate-200 mt-1">
                              {post.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                                          reply.role === "Instructor"
                                            ? "bg-rose-600"
                                            : reply.role === "Tutor"
                                            ? "bg-purple-600"
                                            : "bg-slate-600"
                                        }`}
                                      >
                                        {reply.avatarText}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900">{reply.author}</span>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                            reply.role === "Instructor"
                                              ? "bg-rose-100 text-rose-700"
                                              : reply.role === "Tutor"
                                              ? "bg-purple-100 text-purple-700"
                                              : "bg-slate-200 text-slate-700"
                                          }`}
                                        >
                                          {reply.role}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{reply.timeAgo}</span>
                                  </div>

                                  <p className="text-xs text-slate-700 leading-relaxed pl-8">
                                    {reply.content}
                                  </p>

                                  <div className="flex items-center justify-end gap-2 pl-8 pt-1">
                                    <button
                                      onClick={() => handleToggleReplyLike(post.id, reply.id)}
                                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                                        reply.hasLiked
                                          ? "text-rose-600 bg-rose-50"
                                          : "text-slate-400 hover:text-slate-600"
                                      }`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      <span>{reply.likes || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Reply Form */}
                          {replyingToId === post.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="pl-3 sm:pl-4 border-l-2 border-rose-500 pt-1 space-y-2"
                            >
                              <Textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${post.author}...`}
                                className="text-xs bg-slate-50 border-slate-200 rounded-lg"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingToId(null)}
                                  className="text-xs h-7"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePostReply(post.id)}
                                  className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                                >
                                  Post Reply
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 6. CHECKPOINTS TAB */}
              {activeTab === "checkpoints" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Checkpoint Concept Assessments</h2>
                      <p className="text-xs text-slate-500">Solve in-video checkpoints to calibrate your IELTS readiness score.</p>
                    </div>
                    <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-none font-bold text-xs">
                      {answeredQuestionIds.size} / {currentEpisode.questions?.length || 0} Solved
                    </Badge>
                  </div>

                  {activeQuestion ? (
                    /* Active Checkpoint Question Box */
                    <div className="p-5 rounded-2xl bg-slate-900 text-white border-2 border-rose-500/40 shadow-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                            Assessment at {activeQuestion.timestampFormatted || formatSeconds(activeQuestion.timestamp || 0)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveQuestion(null)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-sm font-bold leading-relaxed">{activeQuestion.prompt}</p>

                      {/* Options */}
                      {activeQuestion.type === "mcq" || activeQuestion.type === "tfng" ? (
                        <div className="grid grid-cols-1 gap-2">
                          {(activeQuestion.options || (activeQuestion.type === "tfng" ? ["TRUE", "FALSE", "NOT GIVEN"] : [])).map(
                            (opt, oIdx) => {
                              const isSelected = userAnswers[activeQuestion.id] === oIdx;
                              const feedback = questionFeedback[activeQuestion.id];
                              let optStyle = "bg-slate-800 border-slate-700 text-slate-200 hover:border-rose-500";
                              if (isSelected) {
                                optStyle = "bg-rose-600 border-rose-500 text-white font-bold";
                              }
                              if (feedback) {
                                if (oIdx === activeQuestion.correctIndex) {
                                  optStyle = "bg-emerald-600 border-emerald-500 text-white font-bold";
                                } else if (isSelected && !feedback.isCorrect) {
                                  optStyle = "bg-rose-700 border-rose-500 text-white";
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => {
                                    if (!answeredQuestionIds.has(activeQuestion.id)) {
                                      setUserAnswers((prev) => ({ ...prev, [activeQuestion.id]: oIdx }));
                                    }
                                  }}
                                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                                >
                                  <span>{opt}</span>
                                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                                </button>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="Type your answer here..."
                          value={userAnswers[activeQuestion.id] || ""}
                          onChange={(e) =>
                            setUserAnswers((prev) => ({ ...prev, [activeQuestion.id]: e.target.value }))
                          }
                          disabled={answeredQuestionIds.has(activeQuestion.id)}
                          className="bg-slate-800 border-slate-700 text-white text-xs h-10 rounded-xl"
                        />
                      )}

                      {/* Feedback message */}
                      {questionFeedback[activeQuestion.id] && (
                        <div
                          className={`p-3 rounded-xl text-xs font-semibold ${
                            questionFeedback[activeQuestion.id].isCorrect
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {questionFeedback[activeQuestion.id].message}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        {activeQuestion.hint && (
                          <button
                            onClick={() =>
                              setShowHint((prev) => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }))
                            }
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{showHint[activeQuestion.id] ? activeQuestion.hint : "Hint"}</span>
                          </button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleAnswerSubmit(activeQuestion)}
                          disabled={answeredQuestionIds.has(activeQuestion.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 rounded-lg ml-auto cursor-pointer"
                        >
                          Submit Answer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Checkpoint Cards List */
                    <div className="space-y-3">
                      {(currentEpisode.questions || []).map((q, qIdx) => (
                        <div
                          key={q.id || qIdx}
                          onClick={() => setActiveQuestion(q)}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:border-rose-400 cursor-pointer transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 shrink-0">
                              {q.timestampFormatted || `0${qIdx + 1}:00`}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{q.prompt}</p>
                              <span className="text-[10px] text-slate-500">{q.points || 10} Points • {q.type.toUpperCase()}</span>
                            </div>
                          </div>
                          {answeredQuestionIds.has(q.id) ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px]">
                              Passed
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg">
                              Solve
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (40% WIDTH ON DESKTOP): DEDICATED STICKY COURSE CURRICULUM PANEL */}
        <aside className="hidden lg:flex lg:w-[40%] flex-col gap-4 sticky top-6 shrink-0">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/5 overflow-hidden flex flex-col">
            
            {/* Sidebar Header */}
            <div className="p-4 sm:p-5 bg-white dark:bg-[#161b22] border-b border-slate-200/80 dark:border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Course Curriculum</h2>
                  <p className="text-xs text-slate-500">Spoken English • {flattenedEpisodes.length} Lessons</p>
                </div>

                {/* Circular Progress Badge */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-white/10"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-rose-600 transition-all duration-500"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${progressPercent}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-semibold">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                    filterMode === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  All ({flattenedEpisodes.length})
                </button>
                <button
                  onClick={() => setFilterMode("unfinished")}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                    filterMode === "unfinished"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  Unfinished ({flattenedEpisodes.length - completedCount})
                </button>
              </div>
            </div>

            {/* Curriculum Scrollable Sections Accordion */}
            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 flex flex-col custom-scrollbar">
              {allModules.map((mod, mIdx) => {
                const modEpisodes = mod.episodes || [];
                const visibleEpisodes = getVisibleEpisodes(modEpisodes);
                const isModCompleted = modEpisodes.every((ep) => completedEpisodeIds.includes(ep.id));
                const completedInMod = modEpisodes.filter((ep) => completedEpisodeIds.includes(ep.id)).length;
                const isCurrentMod = mIdx === currentEpisode.moduleIndex;
                const isExpanded = expandedModules[mod.id || `mod-${mIdx}`] ?? isCurrentMod;

                return (
                  <div key={mod.id || mIdx} className="flex flex-col">
                    <button
                      onClick={() =>
                        setExpandedModules((prev) => ({
                          ...prev,
                          [mod.id || `mod-${mIdx}`]: !isExpanded
                        }))
                      }
                      className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer ${
                        isCurrentMod ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isModCompleted ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : isCurrentMod ? (
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                            0{mIdx + 1}
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                            0{mIdx + 1}
                          </span>
                        )}

                        <div className="min-w-0">
                          <span
                            className={`text-[11px] uppercase tracking-wider font-bold block leading-tight ${
                              isModCompleted
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isCurrentMod
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-400"
                            }`}
                          >
                            {isModCompleted
                              ? `Section 0${mIdx + 1} • Complete`
                              : isCurrentMod
                              ? "Current Section"
                              : `Section 0${mIdx + 1}`}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {mod.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 font-medium">
                          {completedInMod}/{modEpisodes.length}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Section Episodes List */}
                    {isExpanded && (
                      <div className="flex flex-col bg-slate-50/50 dark:bg-white/[0.02]">
                        {visibleEpisodes.map((ep, eIdx) => {
                          const isCurrent = currentEpisode?.id === ep.id;
                          const isEpCompleted = completedEpisodeIds.includes(ep.id);
                          const epFlatIdx = flattenedEpisodes.findIndex((item) => item.id === ep.id);

                          return (
                            <div
                              key={ep.id || eIdx}
                              onClick={() => {
                                if (epFlatIdx !== -1) setCurrentFlatIndex(epFlatIdx);
                              }}
                              className={`px-4 py-3 flex items-center justify-between transition-all cursor-pointer relative ${
                                isCurrent
                                  ? "bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold"
                                  : isEpCompleted
                                  ? "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                  : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {/* Left red highlight indicator bar */}
                              {isCurrent && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600 dark:bg-rose-500" />
                              )}

                              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                                {isCurrent ? (
                                  /* Live Equalizer Animation Indicator */
                                  <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0 mr-1">
                                    <span className="w-1 bg-rose-600 rounded-full animate-bounce h-full" />
                                    <span className="w-1 bg-rose-600 rounded-full animate-pulse h-2" />
                                    <span className="w-1 bg-rose-600 rounded-full animate-bounce h-3" />
                                  </div>
                                ) : isEpCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
                                    {eIdx + 1}
                                  </span>
                                )}

                                <span
                                  className={`text-xs truncate ${
                                    isCurrent ? "font-bold text-rose-700 dark:text-rose-300" : "font-medium"
                                  }`}
                                >
                                  0{eIdx + 1} {ep.title}
                                </span>
                              </div>

                              <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                                {ep.duration || "12:00"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Footer in Curriculum Panel */}
            <div className="p-3 bg-slate-50 dark:bg-white/5 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-center">
              <button
                onClick={() => {
                  setFocusMode(!focusMode);
                  toast.info(focusMode ? "Exited Focus Learning Mode" : "Entered Focus Learning Mode");
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                type="button"
              >
                <Tv className="w-4 h-4" />
                <span>{focusMode ? "Show Standard Layout" : "Focus Learning Mode"}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. DEDICATED MOBILE BOTTOM ACTION BAR (sm:hidden) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Previous Lesson Button */}
          <button
            onClick={() => prevEpisode && setCurrentFlatIndex(currentFlatIndex - 1)}
            disabled={!prevEpisode}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              prevEpisode
                ? "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 hover:bg-slate-200 active:scale-95"
                : "bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
            }`}
            title={prevEpisode ? `Previous: Lesson 0${prevEpisode.episodeIndex + 1}` : "First lesson"}
            aria-label="Previous lesson"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Quick Curriculum Drawer Toggle */}
          <button
            onClick={() => setIsMobileCurriculumOpen(!isMobileCurriculumOpen)}
            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer"
            title="Toggle Curriculum Drawer"
            aria-label="Toggle curriculum list"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Next Lesson or Complete Button */}
          {nextEpisode ? (
            <button
              onClick={() => setCurrentFlatIndex(currentFlatIndex + 1)}
              className="flex-1 h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between transition-all shadow-sm active:scale-98 cursor-pointer min-w-0"
            >
              <div className="flex flex-col text-left min-w-0 pr-2">
                <span className="text-[9px] uppercase font-bold text-rose-200 tracking-wider">
                  Next Up
                </span>
                <span className="text-xs font-bold text-white truncate">
                  0{nextEpisode.episodeIndex + 1} {nextEpisode.title}
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ) : (
            <button
              onClick={handleCompleteEpisode}
              className="flex-1 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Course</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. DESKTOP BOTTOM FLOATING/STICKY DOCKED NAVIGATION BAR (hidden sm:block) */}
      <div className="hidden sm:block fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 sm:px-6 lg:px-10 py-3">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
          
          {/* Previous Lesson CTA */}
          {prevEpisode ? (
            <button
              onClick={() => setCurrentFlatIndex(currentFlatIndex - 1)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:-translate-x-1 transition-transform shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  Previous Lesson <Check className="w-3.5 h-3.5" /> Completed
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors truncate max-w-xs sm:max-w-md">
                  Lesson 0{prevEpisode.episodeIndex + 1} — {prevEpisode.title} ({prevEpisode.duration})
                </p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-2 text-slate-400 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold">First Lesson in Course</span>
                <p className="text-xs font-medium">No previous lessons</p>
              </div>
            </div>
          )}

          {/* Next Lesson CTA */}
          {nextEpisode ? (
            <button
              onClick={() => setCurrentFlatIndex(currentFlatIndex + 1)}
              className="flex items-center justify-between sm:justify-end gap-3 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm group shrink-0 cursor-pointer"
            >
              <div className="text-left sm:text-right min-w-0">
                <span className="text-[10px] text-rose-200 font-semibold uppercase tracking-wider block">Next Lesson</span>
                <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  Lesson 0{nextEpisode.episodeIndex + 1} — {nextEpisode.title} ({nextEpisode.duration})
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ) : (
            <button
              onClick={handleCompleteEpisode}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Course</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
