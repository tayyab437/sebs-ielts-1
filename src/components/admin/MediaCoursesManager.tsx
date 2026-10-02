import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Film,
  Video,
  Headphones,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Save,
  Play,
  Pause,
  Clock,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  Settings,
  Layers,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  X,
  FileText,
  Award,
  Zap,
  Sliders,
  Globe,
  Tag,
  User,
  ShieldCheck,
  Flame,
  ArrowRight,
  MonitorPlay,
  BookOpen,
  Info,
  Lightbulb,
  ListChecks,
  Bookmark,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  MediaCourse,
  MediaModule,
  MediaEpisode,
  MediaQuestion,
  MediaCourseType,
  MediaQuestionType,
  GateType
} from "../../types/mediaCourse";
import { DEFAULT_MEDIA_COURSES } from "../../lib/defaultMediaCourses";
import SecureVideoPlayer from "@/src/components/common/SecureVideoPlayer";

export default function MediaCoursesManager() {
  // State for all media courses
  const [courses, setCourses] = useState<MediaCourse[]>(() => {
    try {
      const saved = localStorage.getItem("mock_media_courses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load local media courses:", e);
    }
    return DEFAULT_MEDIA_COURSES;
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Selected Course for Editing
  const [selectedCourse, setSelectedCourse] = useState<MediaCourse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("curriculum");

  // Expanded Modules / Episodes in Editor
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<string, boolean>>({});
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [episodeActiveTabs, setEpisodeActiveTabs] = useState<Record<string, string>>({});
  const [newTakeawayInputs, setNewTakeawayInputs] = useState<Record<string, string>>({});
  const [editingQuestion, setEditingQuestion] = useState<{
    episodeId: string;
    question: MediaQuestion;
    isNew: boolean;
  } | null>(null);

  // Student Interactive Preview Player State
  const [previewCourse, setPreviewCourse] = useState<MediaCourse | null>(null);
  const [previewEpisodeIndex, setPreviewEpisodeIndex] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCheckpointQuestion, setActiveCheckpointQuestion] = useState<MediaQuestion | null>(null);
  const [checkpointUserAnswer, setCheckpointUserAnswer] = useState<any>("");
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);
  const [checkpointFeedback, setCheckpointFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [studentScore, setStudentScore] = useState(0);

  // AI Generator state
  const [aiPromptTopic, setAiPromptTopic] = useState("");
  const [aiMediaType, setAiMediaType] = useState<MediaCourseType>("video");
  const [aiTargetBand, setAiTargetBand] = useState("8.0+");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);

  // In-app Delete Confirmation State (Safe for sandboxed iframes without window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'course' | 'module' | 'episode' | 'question';
    id: string;
    moduleId?: string;
    episodeId?: string;
    title: string;
  } | null>(null);

  // Save courses to storage & sync with server if available
  useEffect(() => {
    try {
      localStorage.setItem("mock_media_courses", JSON.stringify(courses));
    } catch (e) {
      console.warn("Error saving to localStorage:", e);
    }
  }, [courses]);

  // Load from API on mount
  useEffect(() => {
    const fetchApiCourses = async () => {
      try {
        const res = await fetch("/api/media_courses");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCourses(data);
          }
        }
      } catch (err) {
        // Fallback to local
      }
    };
    fetchApiCourses();
  }, []);

  const handleSaveToDatabase = async (updatedCourses: MediaCourse[]) => {
    setCourses(updatedCourses);
    localStorage.setItem("mock_media_courses", JSON.stringify(updatedCourses));
    try {
      await fetch("/api/media_courses/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: updatedCourses })
      });
    } catch (e) {
      // Offline fallback
    }
  };

  // Quick stats calculation
  const totalCourses = courses.length;
  const totalVideoLessons = courses.reduce((acc, c) => {
    return acc + (c.modules?.reduce((mAcc, m) => mAcc + (m.episodes?.filter(e => e.mediaType === 'video').length || 0), 0) || 0);
  }, 0);
  const totalAudioLessons = courses.reduce((acc, c) => {
    return acc + (c.modules?.reduce((mAcc, m) => mAcc + (m.episodes?.filter(e => e.mediaType === 'audio').length || 0), 0) || 0);
  }, 0);
  const totalInterspersedQuestions = courses.reduce((acc, c) => {
    return acc + (c.modules?.reduce((mAcc, m) => {
      return mAcc + (m.episodes?.reduce((eAcc, ep) => eAcc + (ep.questions?.length || 0), 0) || 0);
    }, 0) || 0);
  }, 0);

  // Filtered Courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === "all" || c.mediaType === selectedTypeFilter;
    const matchesCategory = selectedCategoryFilter === "all" || c.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase());
    const matchesStatus = selectedStatusFilter === "all" || c.status.toLowerCase() === selectedStatusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Create New Media Course
  const handleCreateNewCourse = () => {
    const newCourse: MediaCourse = {
      id: `mc-${Date.now()}`,
      title: "New Media Course",
      slug: `new-media-course-${Date.now().toString().slice(-4)}`,
      subtitle: "Comprehensive Video & Audio Lessons with Interspersed Quizzes",
      description: "Master essential language competencies through high-definition media sessions and interactive knowledge checkpoints.",
      mediaType: "video",
      category: "IELTS Speaking Mastery",
      targetBand: "7.5+",
      difficulty: "Intermediate",
      instructor: "Syed Ejaz Bukhari",
      instructorTitle: "Principal IELTS Director & Linguistic Expert",
      instructorAvatar: "/sebs_official_logo_160.webp",
      featuredImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      status: "Draft",
      accessTier: "Free",
      totalDuration: "45m",
      tags: ["IELTS", "Speaking", "Video Course"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modules: [
        {
          id: `mod-${Date.now()}-1`,
          title: "Module 1: Orientation & Foundations",
          description: "Core conceptual orientation and video lessons.",
          order: 1,
          episodes: [
            {
              id: `ep-${Date.now()}-1`,
              title: "Lesson 1: Introductory Blueprint & Diagnostic",
              description: "High-yield video lecture covering fundamental rules.",
              mediaType: "video",
              mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              duration: "10:00",
              durationSeconds: 600,
              posterUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80",
              speaker: "Syed Ejaz Bukhari",
              order: 1,
              questions: [
                {
                  id: `q-${Date.now()}-1`,
                  type: "mcq",
                  prompt: "What is the primary focal area emphasized in this opening video lecture?",
                  timestamp: 120,
                  timestampFormatted: "02:00",
                  gateType: "in_video",
                  options: [
                    "Rote memorization of long phrases",
                    "Stress-timed rhythm and natural phrasing",
                    "Speed reading without comprehension",
                    "Using complex jargon without context"
                  ],
                  correctIndex: 1,
                  explanation: "Stress-timed rhythm and natural phrasing are the bedrock of IELTS Band 8.0+ performance.",
                  points: 10,
                  requiredToPass: true
                },
                {
                  id: `q-${Date.now()}-2`,
                  type: "fib",
                  prompt: "Fill in the blank: To speak fluently without hesitation, Syed Ejaz Bukhari advises students to master ____ groups rather than isolated words.",
                  timestamp: 240,
                  timestampFormatted: "04:00",
                  gateType: "in_video",
                  correctAnswer: "thought",
                  acceptedAnswers: ["thought", "thought groups", "idea", "sense"],
                  explanation: "Thought groups enable native-like chunking and eliminate stuttering.",
                  points: 10,
                  requiredToPass: false
                }
              ]
            }
          ]
        }
      ]
    };

    const updated = [newCourse, ...courses];
    handleSaveToDatabase(updated);
    setSelectedCourse(newCourse);
    setIsEditing(true);
    setActiveTab("curriculum");
    if (newCourse.modules[0]) {
      setExpandedModules({ [newCourse.modules[0].id]: true });
      setActiveEpisodeId(newCourse.modules[0].episodes[0]?.id || null);
    }
    toast.success("New Media Course created!");
  };

  // Duplicate Course
  const handleDuplicateCourse = (course: MediaCourse) => {
    const clone: MediaCourse = {
      ...JSON.parse(JSON.stringify(course)),
      id: `mc-${Date.now()}`,
      title: `${course.title} (Copy)`,
      slug: `${course.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [clone, ...courses];
    handleSaveToDatabase(updated);
    toast.success("Course duplicated successfully!");
  };

  // Delete Handlers (Non-blocking, iframe-safe)
  const handleDeleteCourse = (courseId: string, courseTitle?: string) => {
    const course = courses.find(c => c.id === courseId);
    setDeleteTarget({
      type: 'course',
      id: courseId,
      title: courseTitle || course?.title || "Media Course"
    });
  };

  const handleDeleteModule = (moduleId: string, moduleTitle?: string) => {
    setDeleteTarget({
      type: 'module',
      id: moduleId,
      title: moduleTitle || "Module Section"
    });
  };

  const handleDeleteEpisode = (moduleId: string, episodeId: string, episodeTitle?: string) => {
    setDeleteTarget({
      type: 'episode',
      id: episodeId,
      moduleId,
      title: episodeTitle || "Lesson"
    });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'course') {
      const targetId = deleteTarget.id;
      const updated = courses.filter(c => c.id !== targetId);
      handleSaveToDatabase(updated);
      if (selectedCourse?.id === targetId) {
        setSelectedCourse(null);
        setIsEditing(false);
      }
      toast.success(`Course "${deleteTarget.title}" deleted.`);
    } else if (deleteTarget.type === 'module') {
      if (!selectedCourse) return;
      const updatedModules = selectedCourse.modules.filter(m => m.id !== deleteTarget.id);
      setSelectedCourse({ ...selectedCourse, modules: updatedModules });
      toast.success(`Module "${deleteTarget.title}" deleted.`);
    } else if (deleteTarget.type === 'episode') {
      if (!selectedCourse || !deleteTarget.moduleId) return;
      const updatedModules = selectedCourse.modules.map(m => {
        if (m.id === deleteTarget.moduleId) {
          return {
            ...m,
            episodes: m.episodes.filter(ep => ep.id !== deleteTarget.id)
          };
        }
        return m;
      });
      setSelectedCourse({ ...selectedCourse, modules: updatedModules });
      toast.success(`Lesson "${deleteTarget.title}" deleted.`);
    } else if (deleteTarget.type === 'question') {
      if (!selectedCourse || !deleteTarget.episodeId) return;
      handleDeleteQuestion(deleteTarget.episodeId, deleteTarget.id);
    }

    setDeleteTarget(null);
  };

  // Save current edited course
  const handleSaveCourse = () => {
    if (!selectedCourse) return;
    const updated = courses.map(c => c.id === selectedCourse.id ? {
      ...selectedCourse,
      updatedAt: new Date().toISOString()
    } : c);
    handleSaveToDatabase(updated);
    toast.success("Media Course changes saved successfully!");
  };

  // Module & Episode Mutations
  const handleAddModule = () => {
    if (!selectedCourse) return;
    const newModule: MediaModule = {
      id: `mod-${Date.now()}`,
      title: `Module ${selectedCourse.modules.length + 1}: New Topic Section`,
      description: "Section description and overview.",
      order: selectedCourse.modules.length + 1,
      episodes: []
    };
    const updatedCourse = {
      ...selectedCourse,
      modules: [...selectedCourse.modules, newModule]
    };
    setSelectedCourse(updatedCourse);
    setExpandedModules(prev => ({ ...prev, [newModule.id]: true }));
    toast.success("Module added.");
  };

  const handleAddEpisode = (moduleId: string, type: 'video' | 'audio' = 'video') => {
    if (!selectedCourse) return;
    const mod = selectedCourse.modules.find(m => m.id === moduleId);
    if (!mod) return;

    const newEp: MediaEpisode = {
      id: `ep-${Date.now()}`,
      title: `Lesson ${(mod.episodes?.length || 0) + 1}: New ${type === 'video' ? 'Video Lecture' : 'Audio Track'}`,
      description: "Master essential phonetic syntax, question intonation patterns, and exam strategies.",
      mediaType: type,
      mediaUrl: type === 'video' 
        ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
        : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "10:00",
      durationSeconds: 600,
      posterUrl: type === 'video'
        ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80",
      speaker: selectedCourse.instructor || "Syed Ejaz Bukhari",
      order: (mod.episodes?.length || 0) + 1,
      cefrBand: selectedCourse.targetBand || "B1-B2 Intermediate",
      pedagogicalRule: {
        title: "Key Phonetic Syntax: Intonation & Inversion",
        description: "Falling intonation denotes certainty in statements; rising terminal pitch transforms statements into polite, exploratory inquiries.",
        formula: "[Statement: Falling pitch ↘] + [, Tag: Rising pitch ↗] = Polite Invitation",
        trap: "Flat or monotonous pitch reduces examiner scoring under Pronunciation Criterion 4."
      },
      learningObjectives: [
        { id: `lo-${Date.now()}-1`, title: "Question Intonation Mastery", description: "Clearly distinguish rising pitch from falling pitch in complex inquiries." },
        { id: `lo-${Date.now()}-2`, title: "Natural Conversational Fillers", description: "Apply organic hedges like 'To be frank...' and 'As far as I can tell...' seamlessly." }
      ],
      resources: [
        { id: `res-${Date.now()}-1`, title: "Lesson Handout & Practice Worksheet", url: "https://example.com/handout.pdf", type: "pdf", size: "2.4 MB" }
      ],
      transcript: "00:15 Syed Ejaz Bukhari: Welcome back to SEBS Institute. Today we examine essential intonation patterns and structural frameworks.",
      instructorNotes: [
        "Focus on sentence stress on content words (nouns, main verbs, adjectives).",
        "Avoid translating idioms literally from native language."
      ],
      questions: []
    };

    const updatedModules = selectedCourse.modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          episodes: [...(m.episodes || []), newEp]
        };
      }
      return m;
    });

    setSelectedCourse({
      ...selectedCourse,
      modules: updatedModules
    });
    setActiveEpisodeId(newEp.id);
    setExpandedModules(prev => ({ ...prev, [moduleId]: true }));
    setExpandedEpisodes(prev => ({ ...prev, [newEp.id]: true }));
    toast.success(`${type === 'video' ? 'Video' : 'Audio'} Episode added.`);
  };

  // Question / Checkpoint mutations
  const handleSaveQuestion = (episodeId: string, q: MediaQuestion) => {
    if (!selectedCourse) return;

    // format timestamp if seconds provided
    if (q.timestamp !== undefined) {
      const mins = Math.floor(q.timestamp / 60);
      const secs = q.timestamp % 60;
      q.timestampFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    const updatedModules = selectedCourse.modules.map(m => {
      const updatedEpisodes = (m.episodes || []).map(ep => {
        if (ep.id === episodeId) {
          const existingIdx = ep.questions.findIndex(eq => eq.id === q.id);
          let newQuestions = [...ep.questions];
          if (existingIdx !== -1) {
            newQuestions[existingIdx] = q;
          } else {
            newQuestions.push(q);
          }
          // Sort by timestamp
          newQuestions.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          return {
            ...ep,
            questions: newQuestions
          };
        }
        return ep;
      });
      return { ...m, episodes: updatedEpisodes };
    });

    setSelectedCourse({
      ...selectedCourse,
      modules: updatedModules
    });
    setEditingQuestion(null);
    toast.success("Interactive question saved to lesson timeline!");
  };

  const handleDeleteQuestion = (episodeId: string, questionId: string) => {
    if (!selectedCourse) return;
    const updatedModules = selectedCourse.modules.map(m => {
      const updatedEpisodes = (m.episodes || []).map(ep => {
        if (ep.id === episodeId) {
          return {
            ...ep,
            questions: ep.questions.filter(q => q.id !== questionId)
          };
        }
        return ep;
      });
      return { ...m, episodes: updatedEpisodes };
    });

    setSelectedCourse({
      ...selectedCourse,
      modules: updatedModules
    });
    toast.success("Question removed.");
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(courses, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sebs_media_courses_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Media courses library exported to JSON!");
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          handleSaveToDatabase(parsed);
          toast.success(`Imported ${parsed.length} media courses!`);
        } else if (parsed && parsed.id && parsed.title) {
          handleSaveToDatabase([parsed, ...courses]);
          toast.success(`Imported course "${parsed.title}"!`);
        } else {
          toast.error("Invalid media course JSON format.");
        }
      } catch (err: any) {
        toast.error("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // AI Course Generator Handler
  const handleGenerateAICourse = async () => {
    if (!aiPromptTopic.trim()) {
      toast.error("Please enter a course topic (e.g. 'IELTS Speaking Part 3 Philosophical Questions')");
      return;
    }

    setAiIsGenerating(true);
    const toastId = toast.loading("AI Generating Media Syllabus, Video Timestamps & Interactive Questions...");

    try {
      // Call Gemini API if available, or generate a rich bespoke structured course
      const prompt = `Generate a complete structured ${aiMediaType} course for IELTS training on topic: "${aiPromptTopic}". Target band: ${aiTargetBand}.
Include:
1. Course title, tagline, category, difficulty.
2. 2 Modules with 2 Lessons each.
3. For each lesson: title, description, transcript, duration ("12:00"), and 3 interspersed interactive questions (at least 1 MCQ, 1 FIB, 1 Q&A) with timestamps (e.g. 180s, 360s, 600s), correct answers, explanations, and hints.
Return valid JSON only matching the schema:
{
  "title": string,
  "subtitle": string,
  "category": string,
  "difficulty": string,
  "description": string,
  "modules": [
    {
      "title": string,
      "description": string,
      "episodes": [
        {
          "title": string,
          "description": string,
          "mediaType": "${aiMediaType}",
          "duration": string,
          "durationSeconds": number,
          "speaker": "Syed Ejaz Bukhari",
          "transcript": string,
          "questions": [
            {
              "type": "mcq" | "fib" | "qa" | "tfng",
              "prompt": string,
              "timestamp": number,
              "timestampFormatted": string,
              "gateType": "in_video",
              "options": ["A", "B", "C", "D"],
              "correctIndex": number,
              "correctAnswer": string,
              "acceptedAnswers": string[],
              "sampleAnswer": string,
              "explanation": string,
              "hint": string,
              "points": 10
            }
          ]
        }
      ]
    }
  ]
}`;

      let generatedData: any = null;
      try {
        const res = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, systemInstruction: "You are an expert IELTS curriculum architect. Return pure valid JSON only." })
        });
        if (res.ok) {
          const jsonRes = await res.json();
          if (jsonRes.text) {
            const cleanText = jsonRes.text.replace(/```json/g, "").replace(/```/g, "").trim();
            generatedData = JSON.parse(cleanText);
          }
        }
      } catch (err) {
        // Fallback to rich heuristic generation
      }

      if (!generatedData || !generatedData.title) {
        // Fallback bespoke generator
        generatedData = {
          title: `IELTS Band ${aiTargetBand} ${aiPromptTopic} Mastery`,
          subtitle: `Strategic vocal coaching, auditory pattern analysis & exam drills by Syed Ejaz Bukhari`,
          category: aiMediaType === "audio" ? "IELTS Listening Lab" : "IELTS Speaking Mastery",
          difficulty: "Advanced",
          description: `Comprehensive ${aiMediaType} masterclass focused on ${aiPromptTopic}. Includes real-time knowledge check-ins, fill-in-the-blanks, and examiner model answers.`,
          modules: [
            {
              id: `mod-ai-${Date.now()}-1`,
              title: `Module 1: Foundations of ${aiPromptTopic}`,
              description: "Conceptual deconstruction and key band descriptors.",
              order: 1,
              episodes: [
                {
                  id: `ep-ai-${Date.now()}-1`,
                  title: `Lesson 1: Core Strategy & Common Pitfalls`,
                  description: "In-depth breakdown of examiner expectations and fluency markers.",
                  mediaType: aiMediaType,
                  mediaUrl: aiMediaType === "video" 
                    ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                    : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                  duration: "14:20",
                  durationSeconds: 860,
                  speaker: "Syed Ejaz Bukhari",
                  posterUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
                  transcript: `In this masterclass session on ${aiPromptTopic}, we analyze why so many test-takers lose marks due to unnecessary hesitation...`,
                  order: 1,
                  questions: [
                    {
                      id: `q-ai-1-${Date.now()}`,
                      type: "mcq",
                      prompt: `In the context of ${aiPromptTopic}, what is the most effective way to start your response?`,
                      timestamp: 180,
                      timestampFormatted: "03:00",
                      gateType: "in_video",
                      options: [
                        "Repeating the question word-for-word",
                        "Using a natural discourse marker followed by a direct perspective",
                        "Pausing in silence for 15 seconds",
                        "Reciting a prepared memorized dictionary definition"
                      ],
                      correctIndex: 1,
                      explanation: "Direct perspectives backed by natural discourse markers secure high marks in Fluency and Lexical Resource.",
                      points: 10,
                      requiredToPass: true
                    },
                    {
                      id: `q-ai-2-${Date.now()}`,
                      type: "fib",
                      prompt: "Fill in the blank: To expand an answer spontaneously, apply the 'PEEL' method: Point, Explanation, ____, and Link.",
                      timestamp: 360,
                      timestampFormatted: "06:00",
                      gateType: "in_video",
                      correctAnswer: "example",
                      acceptedAnswers: ["example", "evidence", "examples"],
                      explanation: "The 'E' in PEEL stands for Example or Evidence.",
                      points: 10,
                      requiredToPass: false
                    },
                    {
                      id: `q-ai-3-${Date.now()}`,
                      type: "qa",
                      prompt: `Formulate a 2-sentence Band 8.5 sample perspective on ${aiPromptTopic}.`,
                      timestamp: 600,
                      timestampFormatted: "10:00",
                      gateType: "post_video",
                      sampleAnswer: `Well, from my perspective, the underlying catalyst is largely attributed to rapid socioeconomic shifts, which inadvertently compels individuals to adapt more proactively.`,
                      rubricNotes: "Evaluate based on complex sentence structures and natural idiomatic precision.",
                      points: 15,
                      requiredToPass: true
                    }
                  ]
                }
              ]
            }
          ]
        };
      }

      const newAiCourse: MediaCourse = {
        id: `mc-ai-${Date.now()}`,
        title: generatedData.title,
        slug: generatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50),
        subtitle: generatedData.subtitle || "AI-Curated Media Course with Interspersed Quizzes",
        description: generatedData.description || "",
        mediaType: aiMediaType,
        category: generatedData.category || "IELTS Masterclass",
        targetBand: aiTargetBand,
        difficulty: (generatedData.difficulty as any) || "Advanced",
        instructor: "Syed Ejaz Bukhari",
        instructorTitle: "Principal IELTS Director & Linguistic Expert",
        instructorAvatar: "/sebs_official_logo_160.webp",
        featuredImage: aiMediaType === "audio" 
          ? "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
        status: "Published",
        accessTier: "Free",
        totalDuration: "1h 10m",
        tags: ["IELTS", aiMediaType.toUpperCase(), aiTargetBand, "AI Generated"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modules: generatedData.modules.map((m: any, idx: number) => ({
          id: m.id || `mod-ai-${Date.now()}-${idx}`,
          title: m.title || `Module ${idx + 1}`,
          description: m.description || "",
          order: idx + 1,
          episodes: (m.episodes || []).map((ep: any, epIdx: number) => ({
            id: ep.id || `ep-ai-${Date.now()}-${idx}-${epIdx}`,
            title: ep.title || `Lesson ${epIdx + 1}`,
            description: ep.description || "",
            mediaType: ep.mediaType || aiMediaType,
            mediaUrl: ep.mediaUrl || (aiMediaType === "video" ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"),
            duration: ep.duration || "12:00",
            durationSeconds: ep.durationSeconds || 720,
            speaker: ep.speaker || "Syed Ejaz Bukhari",
            posterUrl: ep.posterUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
            transcript: ep.transcript || "",
            order: epIdx + 1,
            questions: (ep.questions || []).map((q: any, qIdx: number) => ({
              id: q.id || `q-ai-${Date.now()}-${idx}-${epIdx}-${qIdx}`,
              type: q.type || "mcq",
              prompt: q.prompt || "Interactive Knowledge Checkpoint",
              timestamp: q.timestamp || (qIdx + 1) * 180,
              timestampFormatted: q.timestampFormatted || `0${(qIdx + 1) * 3}:00`,
              gateType: q.gateType || "in_video",
              options: q.options || ["Option A", "Option B", "Option C", "Option D"],
              correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
              correctAnswer: q.correctAnswer || "",
              acceptedAnswers: q.acceptedAnswers || [],
              sampleAnswer: q.sampleAnswer || "",
              explanation: q.explanation || "Official IELTS assessment explanation.",
              hint: q.hint || "",
              points: q.points || 10,
              requiredToPass: q.requiredToPass !== undefined ? q.requiredToPass : true
            }))
          }))
        }))
      };

      const updated = [newAiCourse, ...courses];
      handleSaveToDatabase(updated);
      setSelectedCourse(newAiCourse);
      setIsEditing(true);
      setActiveTab("curriculum");
      toast.success("AI Media Course generated with interspersed MCQs, FIBs & Q&As!", { id: toastId });
    } catch (err: any) {
      toast.error("Generation failed: " + err.message, { id: toastId });
    } finally {
      setAiIsGenerating(false);
    }
  };

  // Student Interactive Preview Simulator
  const startPreview = (course: MediaCourse) => {
    setPreviewCourse(course);
    setPreviewEpisodeIndex(0);
    setPreviewTime(0);
    setIsPlaying(false);
    setActiveCheckpointQuestion(null);
    setCheckpointUserAnswer("");
    setCheckpointSubmitted(false);
    setCheckpointFeedback(null);
    setAnsweredQuestionIds(new Set());
    setStudentScore(0);
  };

  const currentPreviewEpisode = previewCourse?.modules?.flatMap(m => m.episodes || [])[previewEpisodeIndex];

  // Handle checkpoint submission in simulator
  const handleCheckAnswer = (q: MediaQuestion) => {
    let isCorrect = false;
    let message = "";

    if (q.type === "mcq" || q.type === "tfng") {
      if (checkpointUserAnswer === q.correctIndex) {
        isCorrect = true;
        message = "Correct! Outstanding discernment.";
      } else {
        isCorrect = false;
        message = `Incorrect. Correct choice was: ${q.options?.[q.correctIndex || 0]}`;
      }
    } else if (q.type === "fib") {
      const userStr = String(checkpointUserAnswer || "").trim().toLowerCase();
      const directCorrect = String(q.correctAnswer || "").trim().toLowerCase();
      const accepted = (q.acceptedAnswers || []).map(a => a.trim().toLowerCase());
      if (userStr === directCorrect || accepted.includes(userStr)) {
        isCorrect = true;
        message = "Correct! Exact phrasing verified.";
      } else {
        isCorrect = false;
        message = `Incorrect. Accepted answers: ${[q.correctAnswer, ...(q.acceptedAnswers || [])].filter(Boolean).join(", ")}`;
      }
    } else if (q.type === "qa") {
      // Open question: verify non-empty and give model answer
      if (String(checkpointUserAnswer || "").trim().length >= 10) {
        isCorrect = true;
        message = "Response recorded. Compare your phrasing with the Band 8.5 Model Answer below.";
      } else {
        isCorrect = false;
        message = "Please write a more complete answer (at least 1-2 sentences).";
      }
    }

    setCheckpointSubmitted(true);
    setCheckpointFeedback({ isCorrect, message });
    if (isCorrect) {
      setStudentScore(prev => prev + (q.points || 10));
      setAnsweredQuestionIds(prev => new Set(prev).add(q.id));
    }
  };

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/50 p-6 md:p-8 rounded-3xl border border-purple-500/20 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
              <MonitorPlay className="w-3.5 h-3.5" /> Media Courses Studio
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
              Video & Audio Quizzes Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Media Courses Studio
          </h1>
          <p className="text-xs md:text-sm text-slate-300 font-medium max-w-2xl mt-1">
            Build cinematic Video Courses and immersive Audio Podcasts with interspersed Multiple Choice Questions (MCQs), Fill-in-the-Blanks (FIBs), and Q&A assessments between video clips and at exact timestamps!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleCreateNewCourse}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> New Media Course
          </Button>
          <Button
            variant="outline"
            onClick={handleExportJSON}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            title="Export Courses to JSON"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import
            </span>
          </label>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Media Courses</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCourses}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Film className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Video Masterclasses</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalVideoLessons} <span className="text-xs font-normal text-slate-400">episodes</span></h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Audio Podcasts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalAudioLessons} <span className="text-xs font-normal text-slate-400">tracks</span></h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Interspersed Quizzes</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalInterspersedQuestions} <span className="text-xs font-normal text-slate-400">MCQs & FIBs</span></h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search media courses, topics, mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs font-bold h-11 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Media Type Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
            {[
              { id: "all", label: "All Media" },
              { id: "video", label: "Videos" },
              { id: "audio", label: "Audio Podcasts" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTypeFilter === tab.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const videoCount = course.modules?.reduce((acc, m) => acc + (m.episodes?.filter(e => e.mediaType === 'video').length || 0), 0) || 0;
          const audioCount = course.modules?.reduce((acc, m) => acc + (m.episodes?.filter(e => e.mediaType === 'audio').length || 0), 0) || 0;
          const questionCount = course.modules?.reduce((acc, m) => {
            return acc + (m.episodes?.reduce((eAcc, ep) => eAcc + (ep.questions?.length || 0), 0) || 0);
          }, 0) || 0;

          return (
            <Card
              key={course.id}
              className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/80 overflow-hidden shadow-lg hover:shadow-2xl hover:border-purple-500/40 transition-all duration-300 flex flex-col group"
            >
              {/* Cover Art Banner */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={course.featuredImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border-none shadow-sm ${
                      course.mediaType === 'video' ? 'bg-purple-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {course.mediaType === 'video' ? <Video className="w-3 h-3 mr-1" /> : <Headphones className="w-3 h-3 mr-1" />}
                      {course.mediaType === 'video' ? 'Video Course' : 'Audio Course'}
                    </Badge>
                    <Badge className="bg-slate-900/90 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-amber-400/30">
                      Band {course.targetBand}
                    </Badge>
                  </div>

                  <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    course.status === 'Published' ? 'bg-emerald-500/90 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {course.status}
                  </Badge>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="font-bold text-slate-300 truncate">{course.category}</span>
                  <span className="font-mono text-[11px] bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" /> {course.totalDuration || "1h 15m"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.subtitle || course.description}
                  </p>
                </div>

                {/* Stats Pill Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl">
                    <span className="block text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Episodes</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{videoCount + audioCount}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl">
                    <span className="block text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Questions</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{questionCount} Qs</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl">
                    <span className="block text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Mentor</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {course.instructor ? course.instructor.split(" ")[0] : "SEB"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Fully visible & responsive across mobile, tablet, and desktop */}
                <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 mt-auto flex flex-col gap-2 w-full">
                  {/* Primary Studio Action */}
                  <Button
                    onClick={() => {
                      setSelectedCourse(JSON.parse(JSON.stringify(course)));
                      setIsEditing(true);
                      setActiveTab("curriculum");
                      if (course.modules?.[0]) {
                        setExpandedModules({ [course.modules[0].id]: true });
                        setActiveEpisodeId(course.modules[0].episodes?.[0]?.id || null);
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl h-9.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Edit Syllabus & Quizzes</span>
                  </Button>

                  {/* Secondary & Utility Actions */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => startPreview(course)}
                      className="flex-1 min-w-0 rounded-xl h-8.5 sm:h-9 px-2 sm:px-3 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Student Interactive Preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">Preview Player</span>
                    </Button>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateCourse(course)}
                        className="rounded-xl h-8.5 w-8.5 sm:h-9 sm:w-9 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 cursor-pointer"
                        title="Duplicate Course"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id, course.title);
                        }}
                        className="rounded-xl h-8.5 w-8.5 sm:h-9 sm:w-9 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FULL-VIEW COURSE STUDIO MODAL / DRAWER */}
      {isEditing && selectedCourse && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-6xl h-[94vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Fixed Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
                  {selectedCourse.mediaType === 'video' ? <Video className="w-5 h-5" /> : selectedCourse.mediaType === 'audio' ? <Headphones className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                      {selectedCourse.title || "Untitled Course"}
                    </h2>
                    <Badge className="text-[9px] font-black uppercase shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      {selectedCourse.mediaType}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                    {selectedCourse.category || "General"} • Band {selectedCourse.targetBand || "7.5+"} • {selectedCourse.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => startPreview(selectedCourse)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs flex items-center gap-1.5 h-9"
                >
                  <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Test Interactive Player</span><span className="sm:hidden">Player</span>
                </Button>
                <Button
                  onClick={handleSaveCourse}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl px-4 flex items-center gap-1.5 shadow-md border-none cursor-pointer h-9"
                >
                  <Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Save Changes</span><span className="sm:hidden">Save</span>
                </Button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Course Studio"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="shrink-0 px-4 sm:px-6 pt-2 pb-2 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 flex items-center justify-between overflow-x-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent gap-2 h-auto p-0 flex">
                  <TabsTrigger
                    value="curriculum"
                    className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all flex items-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5" /> Syllabus & Media Lessons
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {selectedCourse.modules?.length || 0} Modules
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" /> Course Settings & Metadata
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Modal Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
              {activeTab === "overview" && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Card 1: Course Identity & Academic Scope */}
                  <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 py-4 px-5">
                      <CardTitle className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Course Identity & Academic Scope
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Essential naming, classification, and target band scores for this curriculum.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Course Title *
                          </label>
                          <Input
                            value={selectedCourse.title}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, title: e.target.value })}
                            className="rounded-xl font-bold text-sm h-10"
                            placeholder="e.g. IELTS Speaking Band 8.5 Masterclass"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            URL Slug
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={selectedCourse.slug}
                              onChange={(e) => setSelectedCourse({ ...selectedCourse, slug: e.target.value })}
                              className="rounded-xl font-mono text-xs h-10"
                              placeholder="ielts-speaking-band-8-5"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const generatedSlug = selectedCourse.title
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/(^-|-$)/g, "");
                                setSelectedCourse({ ...selectedCourse, slug: generatedSlug });
                                toast.success("Slug generated from title");
                              }}
                              className="h-10 text-xs font-bold shrink-0 rounded-xl px-3"
                            >
                              Auto
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          Subtitle / Tagline
                        </label>
                        <Input
                          value={selectedCourse.subtitle}
                          onChange={(e) => setSelectedCourse({ ...selectedCourse, subtitle: e.target.value })}
                          className="rounded-xl text-xs font-medium h-10"
                          placeholder="Comprehensive Video & Audio Lessons with Interspersed Quizzes"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Academic Track / Category
                          </label>
                          <Input
                            value={selectedCourse.category}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, category: e.target.value })}
                            className="rounded-xl text-xs font-bold h-10"
                            placeholder="e.g. IELTS Speaking Mastery"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Target Band
                          </label>
                          <select
                            value={selectedCourse.targetBand}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, targetBand: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          >
                            <option value="6.5+">Band 6.5+</option>
                            <option value="7.0+">Band 7.0+</option>
                            <option value="7.5+">Band 7.5+</option>
                            <option value="8.0+">Band 8.0+</option>
                            <option value="8.5+">Band 8.5+</option>
                            <option value="9.0">Band 9.0 (Native Fluency)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Difficulty Level
                          </label>
                          <select
                            value={selectedCourse.difficulty}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, difficulty: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Mastery">Mastery</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          Search Tags (Comma Separated)
                        </label>
                        <Input
                          value={(selectedCourse.tags || []).join(", ")}
                          onChange={(e) => setSelectedCourse({
                            ...selectedCourse,
                            tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                          })}
                          className="rounded-xl text-xs font-medium h-10"
                          placeholder="IELTS, Speaking, Video Course, Fluency"
                        />
                        {(selectedCourse.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {selectedCourse.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          Course Description & Learning Outcomes
                        </label>
                        <Textarea
                          rows={4}
                          value={selectedCourse.description}
                          onChange={(e) => setSelectedCourse({ ...selectedCourse, description: e.target.value })}
                          className="rounded-xl text-xs font-medium leading-relaxed"
                          placeholder="Provide a comprehensive syllabus overview, target skills, and expected student takeaways..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Publishing & Access Configuration */}
                  <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 py-4 px-5">
                      <CardTitle className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Publishing & Access Permissions
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configure distribution channels, enrollment access tiers, and visibility.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Media Format
                          </label>
                          <select
                            value={selectedCourse.mediaType}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, mediaType: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          >
                            <option value="video">Video Masterclass</option>
                            <option value="audio">Audio Podcast Series</option>
                            <option value="hybrid">Interactive Multimedia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Publication Status
                          </label>
                          <select
                            value={selectedCourse.status}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, status: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          >
                            <option value="Published">Published (Live)</option>
                            <option value="Draft">Draft (In Progress)</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Access Tier
                          </label>
                          <select
                            value={selectedCourse.accessTier || "Free"}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, accessTier: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          >
                            <option value="Free">Free / Open Access</option>
                            <option value="Enrolled">Enrolled Students</option>
                            <option value="Pro">Pro Tier</option>
                            <option value="VIP">VIP All-Access</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Total Course Duration
                          </label>
                          <Input
                            value={selectedCourse.totalDuration || "1h 30m"}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, totalDuration: e.target.value })}
                            className="rounded-xl text-xs font-bold h-10"
                            placeholder="e.g. 2h 45m"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Faculty Credentials & Production Media */}
                  <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 py-4 px-5">
                      <CardTitle className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Faculty Credentials & Media Production Assets
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configure instructor attributions, hero artwork, and trailer previews.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Principal Instructor Name
                          </label>
                          <Input
                            value={selectedCourse.instructor}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, instructor: e.target.value })}
                            className="rounded-xl text-xs font-bold h-10"
                            placeholder="Syed Ejaz Bukhari"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Instructor Academic Title / Designation
                          </label>
                          <Input
                            value={selectedCourse.instructorTitle}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, instructorTitle: e.target.value })}
                            className="rounded-xl text-xs font-medium h-10"
                            placeholder="Principal IELTS Director & Linguistic Expert"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Instructor Avatar URL
                          </label>
                          <div className="flex items-center gap-3">
                            <Input
                              value={selectedCourse.instructorAvatar || ""}
                              onChange={(e) => setSelectedCourse({ ...selectedCourse, instructorAvatar: e.target.value })}
                              className="rounded-xl text-xs font-medium h-10"
                              placeholder="/sebs_official_logo_160.webp"
                            />
                            {selectedCourse.instructorAvatar && (
                              <img
                                src={selectedCourse.instructorAvatar}
                                alt="Avatar Preview"
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Sample Trailer Video / Audio Preview URL
                          </label>
                          <Input
                            value={selectedCourse.trailerUrl || ""}
                            onChange={(e) => setSelectedCourse({ ...selectedCourse, trailerUrl: e.target.value })}
                            className="rounded-xl text-xs font-medium h-10"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          Featured Cover Artwork URL
                        </label>
                        <Input
                          value={selectedCourse.featuredImage}
                          onChange={(e) => setSelectedCourse({ ...selectedCourse, featuredImage: e.target.value })}
                          className="rounded-xl text-xs font-medium h-10"
                          placeholder="https://images.unsplash.com/..."
                        />
                        {selectedCourse.featuredImage && (
                          <div className="mt-3 relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950">
                            <img
                              src={selectedCourse.featuredImage}
                              alt="Cover Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                              <span className="text-xs font-bold text-white drop-shadow">
                                Artwork Preview: {selectedCourse.title}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "curriculum" && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Modules Bar Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Curriculum Sections & Lecture Media
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Organize lessons, configure video/audio sources, and inject interactive checkpoint quizzes directly onto video playback timelines.
                      </p>
                    </div>

                    <Button
                      onClick={handleAddModule}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-sm border-none cursor-pointer shrink-0 h-9 px-4"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Module Section
                    </Button>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-5">
                    {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">No Curriculum Sections Configured</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Click "Add Module Section" above to begin structuring your media course lectures and interspersed quizzes.
                        </p>
                        <Button
                          onClick={handleAddModule}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add First Module
                        </Button>
                      </div>
                    ) : (
                      selectedCourse.modules.map((mod, modIndex) => {
                        const isModExpanded = expandedModules[mod.id] ?? true;
                        const episodesCount = mod.episodes?.length || 0;

                        return (
                          <div
                            key={mod.id}
                            className="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden shadow-xs"
                          >
                            {/* Module Header Bar */}
                            <div className="p-3.5 sm:p-4 bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                                <button
                                  onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !isModExpanded }))}
                                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors cursor-pointer shrink-0 shadow-xs"
                                  title={isModExpanded ? "Collapse Module" : "Expand Module"}
                                >
                                  {isModExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg shrink-0">
                                  Section {String(modIndex + 1).padStart(2, "0")}
                                </span>

                                <div className="flex-1 min-w-0">
                                  <Input
                                    value={mod.title}
                                    onChange={(e) => {
                                      const updatedModules = selectedCourse.modules.map(m =>
                                        m.id === mod.id ? { ...m, title: e.target.value } : m
                                      );
                                      setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                    }}
                                    className="h-8 font-black text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-lg px-2.5"
                                    placeholder="Section Title"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                  {episodesCount} {episodesCount === 1 ? "Lesson" : "Lessons"}
                                </Badge>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddEpisode(mod.id, 'video')}
                                  className="h-8 text-[11px] font-bold rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-1"
                                >
                                  <Video className="w-3 h-3" /> <span className="hidden sm:inline">Add</span> Video
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddEpisode(mod.id, 'audio')}
                                  className="h-8 text-[11px] font-bold rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1"
                                >
                                  <Headphones className="w-3 h-3" /> <span className="hidden sm:inline">Add</span> Audio
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteModule(mod.id, mod.title)}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl cursor-pointer"
                                  title="Delete Module"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Module Body Content */}
                            {isModExpanded && (
                              <div className="p-4 space-y-4">
                                {/* Module Description Field */}
                                <div className="px-1">
                                  <Input
                                    value={mod.description || ""}
                                    onChange={(e) => {
                                      const updatedModules = selectedCourse.modules.map(m =>
                                        m.id === mod.id ? { ...m, description: e.target.value } : m
                                      );
                                      setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                    }}
                                    className="h-7 text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-950/60 border-slate-200/80 dark:border-white/5 rounded-lg placeholder:text-slate-400"
                                    placeholder="Section syllabus synopsis or learning objectives..."
                                  />
                                </div>

                                {episodesCount === 0 ? (
                                  <div className="text-center py-6 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl text-slate-400 text-xs">
                                    No media lessons in this module yet. Click "+ Video" or "+ Audio" above.
                                  </div>
                                ) : (
                                  mod.episodes.map((episode, epIndex) => {
                                    const isEpExpanded = expandedEpisodes[episode.id] ?? true;
                                    const isVideo = episode.mediaType === 'video';

                                    return (
                                      <div
                                        key={episode.id}
                                        className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                                      >
                                        {/* Episode Header Bar */}
                                        <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-100 dark:border-white/5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                                          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                                            <span className="w-6 h-6 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-black shrink-0">
                                              {epIndex + 1}
                                            </span>

                                            <div className="flex-1 min-w-0">
                                              <Input
                                                value={episode.title}
                                                onChange={(e) => {
                                                  const updatedModules = selectedCourse.modules.map(m => {
                                                    if (m.id === mod.id) {
                                                      return {
                                                        ...m,
                                                        episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, title: e.target.value } : ep)
                                                      };
                                                    }
                                                    return m;
                                                  });
                                                  setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                }}
                                                className="h-8 font-black text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-lg px-2.5"
                                                placeholder="Lesson Title"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            {/* Media Type Switcher */}
                                            <button
                                              onClick={() => {
                                                const newType: 'video' | 'audio' = isVideo ? 'audio' : 'video';
                                                const updatedModules = selectedCourse.modules.map(m => {
                                                  if (m.id === mod.id) {
                                                    return {
                                                      ...m,
                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, mediaType: newType } : ep)
                                                    };
                                                  }
                                                  return m;
                                                });
                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                              }}
                                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                                                isVideo
                                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                              }`}
                                              title="Click to toggle format"
                                            >
                                              {isVideo ? <Video className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                                              {episode.mediaType}
                                            </button>

                                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                              {episode.questions?.length || 0} Checkpoints
                                            </Badge>

                                            <button
                                              onClick={() => setExpandedEpisodes(prev => ({ ...prev, [episode.id]: !isEpExpanded }))}
                                              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
                                              title={isEpExpanded ? "Collapse Details" : "Expand Details"}
                                            >
                                              {isEpExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>

                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleDeleteEpisode(mod.id, episode.id, episode.title)}
                                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                                              title="Delete Lesson"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Episode Detailed Settings */}
                                        {isEpExpanded && (
                                          <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                              <div className="md:col-span-8">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                  Media Source URL (YouTube, MP4 Video, MP3 Audio stream)
                                                </label>
                                                <Input
                                                  value={episode.mediaUrl}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    let ytId = "";
                                                    if (val.includes("youtube.com") || val.includes("youtu.be")) {
                                                      const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                                                      if (match) ytId = match[1];
                                                    }
                                                    const updatedModules = selectedCourse.modules.map(m => {
                                                      if (m.id === mod.id) {
                                                        return {
                                                          ...m,
                                                          episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, mediaUrl: val, youtubeId: ytId || ep.youtubeId } : ep)
                                                        };
                                                      }
                                                      return m;
                                                    });
                                                    setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                  }}
                                                  placeholder="https://www.youtube.com/watch?v=... or direct link"
                                                  className="h-9 text-xs font-mono"
                                                />
                                              </div>

                                              <div className="md:col-span-4">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                  Duration (MM:SS)
                                                </label>
                                                <Input
                                                  value={episode.duration}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    let secs = 600;
                                                    if (val.includes(":")) {
                                                      const parts = val.split(":");
                                                      secs = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
                                                    }
                                                    const updatedModules = selectedCourse.modules.map(m => {
                                                      if (m.id === mod.id) {
                                                        return {
                                                          ...m,
                                                          episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, duration: val, durationSeconds: secs } : ep)
                                                        };
                                                      }
                                                      return m;
                                                    });
                                                    setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                  }}
                                                  placeholder="12:30"
                                                  className="h-9 text-xs font-bold"
                                                />
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                              <div>
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                  Speaker / Faculty Name
                                                </label>
                                                <Input
                                                  value={episode.speaker || ""}
                                                  onChange={(e) => {
                                                    const updatedModules = selectedCourse.modules.map(m => {
                                                      if (m.id === mod.id) {
                                                        return {
                                                          ...m,
                                                          episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, speaker: e.target.value } : ep)
                                                        };
                                                      }
                                                      return m;
                                                    });
                                                    setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                  }}
                                                  placeholder="Syed Ejaz Bukhari"
                                                  className="h-9 text-xs font-medium"
                                                />
                                              </div>

                                              <div>
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                  CEFR Target Level
                                                </label>
                                                <Input
                                                  value={episode.cefrBand || selectedCourse.targetBand || ""}
                                                  onChange={(e) => {
                                                    const updatedModules = selectedCourse.modules.map(m => {
                                                      if (m.id === mod.id) {
                                                        return {
                                                          ...m,
                                                          episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, cefrBand: e.target.value } : ep)
                                                        };
                                                      }
                                                      return m;
                                                    });
                                                    setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                  }}
                                                  placeholder="B1-B2 Intermediate"
                                                  className="h-9 text-xs font-medium"
                                                />
                                              </div>

                                              <div>
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                  Poster / Thumbnail Image URL
                                                </label>
                                                <Input
                                                  value={episode.posterUrl || ""}
                                                  onChange={(e) => {
                                                    const updatedModules = selectedCourse.modules.map(m => {
                                                      if (m.id === mod.id) {
                                                        return {
                                                          ...m,
                                                          episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, posterUrl: e.target.value } : ep)
                                                        };
                                                      }
                                                      return m;
                                                    });
                                                    setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                  }}
                                                  placeholder="https://images.unsplash.com/..."
                                                  className="h-9 text-xs font-medium"
                                                />
                                              </div>
                                            </div>

                                            <div>
                                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                Lesson Synopsis & Core Objectives
                                              </label>
                                              <Textarea
                                                rows={2}
                                                value={episode.description || ""}
                                                onChange={(e) => {
                                                  const updatedModules = selectedCourse.modules.map(m => {
                                                    if (m.id === mod.id) {
                                                      return {
                                                        ...m,
                                                        episodes: m.episodes.map(ep => ep.id === episode.id ? { ...ep, description: e.target.value } : ep)
                                                      };
                                                    }
                                                    return m;
                                                  });
                                                  setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                }}
                                                placeholder="Brief overview of what students will master in this lesson..."
                                                className="text-xs font-medium rounded-xl"
                                              />
                                            </div>

                                            {/* EPISODE ADVANCED CONTENT TABS */}
                                            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-3">
                                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                                {[
                                                  { id: "questions", label: "Quizzes & Checkpoints", count: episode.questions?.length || 0, icon: Sparkles },
                                                  { id: "pedagogy", label: "Pedagogical Rule", hasContent: !!episode.pedagogicalRule?.title, icon: Lightbulb },
                                                  { id: "objectives", label: "Objectives", count: episode.learningObjectives?.length || 0, icon: ListChecks },
                                                  { id: "takeaways", label: "Takeaways & Notes", count: episode.instructorNotes?.length || 0, icon: Bookmark },
                                                  { id: "resources", label: "Resources", count: episode.resources?.length || 0, icon: LinkIcon },
                                                  { id: "transcript", label: "Transcript", hasContent: !!episode.transcript, icon: FileText },
                                                ].map((subTab) => {
                                                  const currentSubTab = episodeActiveTabs[episode.id] || "questions";
                                                  const isActive = currentSubTab === subTab.id;
                                                  const SubIcon = subTab.icon;
                                                  return (
                                                    <button
                                                      key={subTab.id}
                                                      type="button"
                                                      onClick={() => setEpisodeActiveTabs(prev => ({ ...prev, [episode.id]: subTab.id }))}
                                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                                        isActive
                                                          ? 'bg-purple-600 text-white shadow-sm'
                                                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                                                      }`}
                                                    >
                                                      <SubIcon className="w-3.5 h-3.5" />
                                                      <span>{subTab.label}</span>
                                                      {subTab.count !== undefined && subTab.count > 0 && (
                                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                                          isActive ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                                                        }`}>
                                                          {subTab.count}
                                                        </span>
                                                      )}
                                                    </button>
                                                  );
                                                })}
                                              </div>

                                              {/* SUBTAB 1: CHECKPOINTS & QUIZZES */}
                                              {(episodeActiveTabs[episode.id] || "questions") === "questions" && (
                                                <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-xl space-y-3">
                                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                                      <div>
                                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                                          Interspersed Quizzes & Video Checkpoints
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                                                          ({episode.questions?.length || 0} active checkpoints)
                                                        </span>
                                                      </div>
                                                    </div>

                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        setEditingQuestion({
                                                          episodeId: episode.id,
                                                          question: {
                                                            id: `q-${Date.now()}`,
                                                            type: "mcq",
                                                            prompt: "",
                                                            timestamp: 120,
                                                            timestampFormatted: "02:00",
                                                            gateType: "in_video",
                                                            options: ["", "", "", ""],
                                                            correctIndex: 0,
                                                            correctAnswer: "",
                                                            acceptedAnswers: [],
                                                            explanation: "",
                                                            hint: "",
                                                            points: 10,
                                                            requiredToPass: true
                                                          },
                                                          isNew: true
                                                        });
                                                      }}
                                                      className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl px-3 flex items-center gap-1.5 cursor-pointer border-none shadow-sm shrink-0"
                                                    >
                                                      <Plus className="w-3.5 h-3.5" /> Add Checkpoint Question
                                                    </Button>
                                                  </div>

                                                  {/* Questions List */}
                                                  {(!episode.questions || episode.questions.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic py-2">
                                                      No checkpoints configured yet. Click "+ Add Checkpoint Question" to insert an interactive MCQ, FIB, or Q&A that pauses the video at an exact timestamp.
                                                    </p>
                                                  ) : (
                                                    <div className="space-y-2.5">
                                                      {episode.questions.map((q, qIndex) => (
                                                        <div
                                                          key={q.id}
                                                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-purple-500/30 transition-all shadow-xs"
                                                        >
                                                          <div className="space-y-1.5 flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                              <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                q.type === 'mcq' ? 'bg-blue-600 text-white' :
                                                                q.type === 'fib' ? 'bg-emerald-600 text-white' :
                                                                q.type === 'tfng' ? 'bg-amber-600 text-white' :
                                                                'bg-purple-600 text-white'
                                                              }`}>
                                                                {q.type.toUpperCase()}
                                                              </Badge>
                                                              <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md">
                                                                ⏱ {q.timestampFormatted || "02:00"} • {q.gateType === 'in_video' ? 'Pause Video' : 'Post-Video Gate'}
                                                              </span>
                                                              <span className="text-[11px] text-slate-500 font-bold">
                                                                {q.points || 10} pts
                                                              </span>
                                                              {q.requiredToPass && (
                                                                <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold">
                                                                  Mandatory Gate
                                                                </Badge>
                                                              )}
                                                            </div>

                                                            <p className="font-bold text-slate-900 dark:text-white break-words text-xs sm:text-sm">
                                                              {q.prompt || "Untitled Question"}
                                                            </p>

                                                            {q.type === 'mcq' && (
                                                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                Correct Answer: <span className="font-bold text-emerald-600 dark:text-emerald-400">{q.options?.[q.correctIndex || 0] || "Option 1"}</span>
                                                              </p>
                                                            )}
                                                            {q.type === 'fib' && (
                                                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                Accepted: <span className="font-bold text-emerald-600 dark:text-emerald-400">{[q.correctAnswer, ...(q.acceptedAnswers || [])].filter(Boolean).join(", ")}</span>
                                                              </p>
                                                            )}
                                                            {q.type === 'tfng' && (
                                                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                Correct: <span className="font-bold text-emerald-600 dark:text-emerald-400">{q.options?.[q.correctIndex || 0] || "True"}</span>
                                                              </p>
                                                            )}
                                                          </div>

                                                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                            <Button
                                                              size="sm"
                                                              variant="outline"
                                                              onClick={() => setEditingQuestion({ episodeId: episode.id, question: JSON.parse(JSON.stringify(q)), isNew: false })}
                                                              className="h-8 px-2.5 text-xs font-bold rounded-xl border-slate-200 dark:border-white/10"
                                                            >
                                                              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => handleDeleteQuestion(episode.id, q.id)}
                                                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                                                              title="Delete Question"
                                                            >
                                                              <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* SUBTAB 2: PEDAGOGICAL RULE */}
                                              {(episodeActiveTabs[episode.id] || "questions") === "pedagogy" && (
                                                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                      <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-200">
                                                        Pedagogical Rule & Linguistic Framework
                                                      </h4>
                                                    </div>
                                                  </div>

                                                  <div className="space-y-3">
                                                    <div>
                                                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                        Rule / Concept Title
                                                      </label>
                                                      <Input
                                                        value={episode.pedagogicalRule?.title || ""}
                                                        onChange={(e) => {
                                                          const titleVal = e.target.value;
                                                          const updatedModules = selectedCourse.modules.map(m => {
                                                            if (m.id === mod.id) {
                                                              return {
                                                                ...m,
                                                                episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                  ...ep,
                                                                  pedagogicalRule: {
                                                                    ...(ep.pedagogicalRule || { description: "" }),
                                                                    title: titleVal
                                                                  }
                                                                } : ep)
                                                              };
                                                            }
                                                            return m;
                                                          });
                                                          setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                        }}
                                                        placeholder="e.g. Master Question Intonation & Inversion"
                                                        className="h-9 text-xs font-semibold"
                                                      />
                                                    </div>

                                                    <div>
                                                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                        Detailed Explanation
                                                      </label>
                                                      <Textarea
                                                        rows={3}
                                                        value={episode.pedagogicalRule?.description || ""}
                                                        onChange={(e) => {
                                                          const descVal = e.target.value;
                                                          const updatedModules = selectedCourse.modules.map(m => {
                                                            if (m.id === mod.id) {
                                                              return {
                                                                ...m,
                                                                episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                  ...ep,
                                                                  pedagogicalRule: {
                                                                    title: ep.pedagogicalRule?.title || "Key Rule",
                                                                    description: descVal,
                                                                    formula: ep.pedagogicalRule?.formula,
                                                                    trap: ep.pedagogicalRule?.trap
                                                                  }
                                                                } : ep)
                                                              };
                                                            }
                                                            return m;
                                                          });
                                                          setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                        }}
                                                        placeholder="Explain the phonetic mechanics, intonation rules, or structural formula..."
                                                        className="text-xs rounded-xl"
                                                      />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                      <div>
                                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                          Formula / Pattern Blueprint (Optional)
                                                        </label>
                                                        <Input
                                                          value={episode.pedagogicalRule?.formula || ""}
                                                          onChange={(e) => {
                                                            const fVal = e.target.value;
                                                            const updatedModules = selectedCourse.modules.map(m => {
                                                              if (m.id === mod.id) {
                                                                return {
                                                                  ...m,
                                                                  episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                    ...ep,
                                                                    pedagogicalRule: {
                                                                      title: ep.pedagogicalRule?.title || "Key Rule",
                                                                      description: ep.pedagogicalRule?.description || "",
                                                                      formula: fVal,
                                                                      trap: ep.pedagogicalRule?.trap
                                                                    }
                                                                  } : ep)
                                                                };
                                                              }
                                                              return m;
                                                             });
                                                            setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                          }}
                                                          placeholder="[Pitch ↘] + [, Tag ↗] = Polite Insinuation"
                                                          className="h-9 text-xs font-mono"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                                          Common Trap / Examiner Penalty (Optional)
                                                        </label>
                                                        <Input
                                                          value={episode.pedagogicalRule?.trap || ""}
                                                          onChange={(e) => {
                                                            const tVal = e.target.value;
                                                            const updatedModules = selectedCourse.modules.map(m => {
                                                              if (m.id === mod.id) {
                                                                return {
                                                                  ...m,
                                                                  episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                    ...ep,
                                                                    pedagogicalRule: {
                                                                      title: ep.pedagogicalRule?.title || "Key Rule",
                                                                      description: ep.pedagogicalRule?.description || "",
                                                                      formula: ep.pedagogicalRule?.formula,
                                                                      trap: tVal
                                                                    }
                                                                  } : ep)
                                                                };
                                                              }
                                                              return m;
                                                            });
                                                            setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                          }}
                                                          placeholder="Flat pitch reduces examiner band under Criterion 4"
                                                          className="h-9 text-xs"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {/* SUBTAB 3: LEARNING OBJECTIVES */}
                                              {(episodeActiveTabs[episode.id] || "questions") === "objectives" && (
                                                <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                      <h4 className="text-xs font-black uppercase text-blue-900 dark:text-blue-200">
                                                        Measurable Learning Objectives ({episode.learningObjectives?.length || 0})
                                                      </h4>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        const updatedModules = selectedCourse.modules.map(m => {
                                                          if (m.id === mod.id) {
                                                            return {
                                                              ...m,
                                                              episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                ...ep,
                                                                learningObjectives: [
                                                                  ...(ep.learningObjectives || []),
                                                                  { id: `lo-${Date.now()}`, title: "New Learning Goal", description: "Clear outcome student can perform after watching." }
                                                                ]
                                                              } : ep)
                                                            };
                                                          }
                                                          return m;
                                                        });
                                                        setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                      }}
                                                      className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg px-2.5"
                                                    >
                                                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Objective
                                                    </Button>
                                                  </div>

                                                  {(!episode.learningObjectives || episode.learningObjectives.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic">No specific objectives added yet. Click "+ Add Objective" to list concrete competencies.</p>
                                                  ) : (
                                                    <div className="space-y-2">
                                                      {episode.learningObjectives.map((obj, oIdx) => (
                                                        <div key={obj.id || oIdx} className="bg-white dark:bg-slate-900 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
                                                          <div className="flex-1 space-y-1.5">
                                                            <Input
                                                              value={obj.title}
                                                              onChange={(e) => {
                                                                const updatedModules = selectedCourse.modules.map(m => {
                                                                  if (m.id === mod.id) {
                                                                    return {
                                                                      ...m,
                                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                        ...ep,
                                                                        learningObjectives: (ep.learningObjectives || []).map((o, idx) => idx === oIdx ? { ...o, title: e.target.value } : o)
                                                                      } : ep)
                                                                    };
                                                                  }
                                                                  return m;
                                                                });
                                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                              }}
                                                              placeholder="Objective Title"
                                                              className="h-8 text-xs font-bold"
                                                            />
                                                            <Input
                                                              value={obj.description}
                                                              onChange={(e) => {
                                                                const updatedModules = selectedCourse.modules.map(m => {
                                                                  if (m.id === mod.id) {
                                                                    return {
                                                                      ...m,
                                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                        ...ep,
                                                                        learningObjectives: (ep.learningObjectives || []).map((o, idx) => idx === oIdx ? { ...o, description: e.target.value } : o)
                                                                      } : ep)
                                                                    };
                                                                  }
                                                                  return m;
                                                                });
                                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                              }}
                                                              placeholder="Objective Description..."
                                                              className="h-8 text-xs text-slate-600 dark:text-slate-300"
                                                            />
                                                          </div>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                              const updatedModules = selectedCourse.modules.map(m => {
                                                                if (m.id === mod.id) {
                                                                  return {
                                                                    ...m,
                                                                    episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                      ...ep,
                                                                      learningObjectives: (ep.learningObjectives || []).filter((_, idx) => idx !== oIdx)
                                                                    } : ep)
                                                                  };
                                                                }
                                                                return m;
                                                              });
                                                              setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                            }}
                                                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                                          >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                          </Button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* SUBTAB 4: TAKEAWAYS & INSTRUCTOR NOTES */}
                                              {(episodeActiveTabs[episode.id] || "questions") === "takeaways" && (
                                                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                                                  <div className="flex items-center gap-2">
                                                    <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    <h4 className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200">
                                                      Key Takeaways & Faculty Notes ({episode.instructorNotes?.length || 0})
                                                    </h4>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                    <Input
                                                      value={newTakeawayInputs[episode.id] || ""}
                                                      onChange={(e) => setNewTakeawayInputs(prev => ({ ...prev, [episode.id]: e.target.value }))}
                                                      onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                          e.preventDefault();
                                                          const val = (newTakeawayInputs[episode.id] || "").trim();
                                                          if (!val) return;
                                                          const updatedModules = selectedCourse.modules.map(m => {
                                                            if (m.id === mod.id) {
                                                              return {
                                                                ...m,
                                                                episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                  ...ep,
                                                                  instructorNotes: [...(ep.instructorNotes || []), val]
                                                                } : ep)
                                                              };
                                                            }
                                                            return m;
                                                          });
                                                          setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                          setNewTakeawayInputs(prev => ({ ...prev, [episode.id]: "" }));
                                                        }
                                                      }}
                                                      placeholder="Type key takeaway and press Enter..."
                                                      className="h-9 text-xs"
                                                    />
                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        const val = (newTakeawayInputs[episode.id] || "").trim();
                                                        if (!val) return;
                                                        const updatedModules = selectedCourse.modules.map(m => {
                                                          if (m.id === mod.id) {
                                                            return {
                                                              ...m,
                                                              episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                ...ep,
                                                                instructorNotes: [...(ep.instructorNotes || []), val]
                                                              } : ep)
                                                            };
                                                          }
                                                          return m;
                                                        });
                                                        setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                        setNewTakeawayInputs(prev => ({ ...prev, [episode.id]: "" }));
                                                      }}
                                                      className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                                                    >
                                                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                                                    </Button>
                                                  </div>

                                                  {(!episode.instructorNotes || episode.instructorNotes.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic">No takeaways added yet. These appear as bullet points for student revision.</p>
                                                  ) : (
                                                    <div className="space-y-1.5">
                                                      {episode.instructorNotes.map((note, nIdx) => (
                                                        <div key={nIdx} className="bg-white dark:bg-slate-900 border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                                                          <span className="text-slate-700 dark:text-slate-200 flex-1">{note}</span>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                              const updatedModules = selectedCourse.modules.map(m => {
                                                                if (m.id === mod.id) {
                                                                  return {
                                                                    ...m,
                                                                    episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                      ...ep,
                                                                      instructorNotes: (ep.instructorNotes || []).filter((_, idx) => idx !== nIdx)
                                                                    } : ep)
                                                                  };
                                                                }
                                                                return m;
                                                              });
                                                              setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                            }}
                                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                                          >
                                                            <Trash2 className="w-3 h-3" />
                                                          </Button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* SUBTAB 5: INTERACTIVE WORKSHEETS & HANDOUTS */}
                                              {(episodeActiveTabs[episode.id] || "questions") === "resources" && (
                                                <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                      <div>
                                                        <h4 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-200">
                                                          Interactive Worksheets & Practice Sheets ({episode.resources?.length || 0})
                                                        </h4>
                                                        <p className="text-[10px] text-slate-500">
                                                          Worksheets are filled directly online by candidates (non-downloadable) with instant AI evaluation and grading.
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        const updatedModules = selectedCourse.modules.map(m => {
                                                          if (m.id === mod.id) {
                                                            return {
                                                              ...m,
                                                              episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                ...ep,
                                                                resources: [
                                                                  ...(ep.resources || []),
                                                                  { id: `res-${Date.now()}`, title: "SEBS Practice Sheet: Nouns & Common Suffixes", url: "https://sebsinstitute.com/worksheets/nouns.pdf", type: "pdf" as const, size: "2 Pages • Fillable Online" }
                                                                ]
                                                              } : ep)
                                                            };
                                                          }
                                                          return m;
                                                        });
                                                        setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                      }}
                                                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg px-2.5"
                                                    >
                                                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Worksheet
                                                    </Button>
                                                  </div>

                                                  {(!episode.resources || episode.resources.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic">No worksheets attached. Add interactive suffix worksheets or audio drills.</p>
                                                  ) : (
                                                    <div className="space-y-2">
                                                      {episode.resources.map((res, rIdx) => (
                                                        <div key={res.id || rIdx} className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                                          <div className="sm:col-span-4">
                                                            <Input
                                                              value={res.title}
                                                              onChange={(e) => {
                                                                const updatedModules = selectedCourse.modules.map(m => {
                                                                  if (m.id === mod.id) {
                                                                    return {
                                                                      ...m,
                                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                        ...ep,
                                                                        resources: (ep.resources || []).map((r, idx) => idx === rIdx ? { ...r, title: e.target.value } : r)
                                                                      } : ep)
                                                                    };
                                                                  }
                                                                  return m;
                                                                });
                                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                              }}
                                                              className="h-8 text-xs font-bold"
                                                            />
                                                          </div>
                                                          <div className="sm:col-span-5">
                                                            <Input
                                                              value={res.url}
                                                              onChange={(e) => {
                                                                const updatedModules = selectedCourse.modules.map(m => {
                                                                  if (m.id === mod.id) {
                                                                    return {
                                                                      ...m,
                                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                        ...ep,
                                                                        resources: (ep.resources || []).map((r, idx) => idx === rIdx ? { ...r, url: e.target.value } : r)
                                                                      } : ep)
                                                                    };
                                                                  }
                                                                  return m;
                                                                });
                                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                              }}
                                                              className="h-8 text-xs font-mono"
                                                            />
                                                          </div>
                                                          <div className="sm:col-span-2">
                                                            <Input
                                                              value={res.size || ""}
                                                              onChange={(e) => {
                                                                const updatedModules = selectedCourse.modules.map(m => {
                                                                  if (m.id === mod.id) {
                                                                    return {
                                                                      ...m,
                                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                        ...ep,
                                                                        resources: (ep.resources || []).map((r, idx) => idx === rIdx ? { ...r, size: e.target.value } : r)
                                                                      } : ep)
                                                                    };
                                                                  }
                                                                  return m;
                                                                });
                                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                              }}
                                                              className="h-8 text-xs"
                                                            />
                                                          </div>
                                                          <div className="sm:col-span-1 flex justify-end">
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => {
                                                                const updatedModules = selectedCourse.modules.map(m => {
                                                                  if (m.id === mod.id) {
                                                                    return {
                                                                      ...m,
                                                                      episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                                        ...ep,
                                                                        resources: (ep.resources || []).filter((_, idx) => idx !== rIdx)
                                                                      } : ep)
                                                                    };
                                                                  }
                                                                  return m;
                                                                });
                                                                setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                              }}
                                                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                            >
                                                              <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* SUBTAB 6: TRANSCRIPT */}
                                              {(episodeActiveTabs[episode.id] || "questions") === "transcript" && (
                                                <div className="bg-slate-500/5 dark:bg-white/5 border border-slate-500/20 p-4 rounded-xl space-y-3">
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                                      Full Interactive Transcript & Timestamps
                                                    </h4>
                                                  </div>
                                                  <Textarea
                                                    rows={6}
                                                    value={episode.transcript || ""}
                                                    onChange={(e) => {
                                                      const tVal = e.target.value;
                                                      const updatedModules = selectedCourse.modules.map(m => {
                                                        if (m.id === mod.id) {
                                                          return {
                                                            ...m,
                                                            episodes: m.episodes.map(ep => ep.id === episode.id ? {
                                                              ...ep,
                                                              transcript: tVal
                                                            } : ep)
                                                          };
                                                        }
                                                        return m;
                                                      });
                                                      setSelectedCourse({ ...selectedCourse, modules: updatedModules });
                                                    }}
                                                    placeholder="00:15 Syed Ejaz Bukhari: Welcome to today's lesson on English pronunciation and fluency..."
                                                    className="text-xs font-mono rounded-xl leading-relaxed"
                                                  />
                                                  <p className="text-[11px] text-slate-400">
                                                    Tip: Write timestamps like <code className="bg-slate-200 dark:bg-white/10 px-1 py-0.5 rounded">02:30 Speaker: Content</code> to support jumping to timestamp in the student viewer.
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Fixed Footer Bar */}
            <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {selectedCourse.modules?.length || 0} Modules
                </span>
                <span>•</span>
                <span>
                  {selectedCourse.modules?.reduce((acc, m) => acc + (m.episodes?.length || 0), 0) || 0} Lessons
                </span>
                <span>•</span>
                <span>
                  {selectedCourse.modules?.reduce((acc, m) => acc + (m.episodes?.reduce((eAcc, ep) => eAcc + (ep.questions?.length || 0), 0) || 0), 0)} Checkpoints
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl font-bold text-xs h-9 px-4"
                >
                  Close Studio
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCourse}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl px-5 h-9 flex items-center gap-1.5 shadow-md border-none cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Course Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION / ASSESSMENT EDITOR MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                {editingQuestion.isNew ? "Configure Interactive Checkpoint" : "Edit Checkpoint Question"}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              {/* Question Type, Gate Action & Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Question Type
                  </label>
                  <select
                    value={editingQuestion.question.type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      const q = { ...editingQuestion.question, type: newType };
                      if (newType === 'tfng') {
                        q.options = ["True", "False", "Not Given"];
                        q.correctIndex = 0;
                      } else if (newType === 'mcq' && (!q.options || q.options.length < 2)) {
                        q.options = ["", "", "", ""];
                      }
                      setEditingQuestion({ ...editingQuestion, question: q });
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="fib">Fill in the Blank (FIB)</option>
                    <option value="qa">Open Q&A / Comprehension</option>
                    <option value="tfng">True / False / Not Given</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Gate Action
                  </label>
                  <select
                    value={editingQuestion.question.gateType}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, gateType: e.target.value as any }
                    })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="in_video">Pause Video at Timestamp</option>
                    <option value="post_video">Post-Video Quiz Gate</option>
                    <option value="standalone_checkpoint">Standalone Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Points Weight
                  </label>
                  <Input
                    type="number"
                    value={editingQuestion.question.points ?? 10}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, points: Math.max(1, parseInt(e.target.value, 10) || 10) }
                    })}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Timestamp Controls & Mandatory Flag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Video Timestamp (MM:SS or Seconds)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="02:30"
                      value={editingQuestion.question.timestampFormatted || "02:00"}
                      onChange={(e) => {
                        const formatted = e.target.value;
                        let secs = 120;
                        if (formatted.includes(":")) {
                          const parts = formatted.split(":");
                          secs = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
                        } else {
                          secs = parseInt(formatted, 10) || 0;
                        }
                        setEditingQuestion({
                          ...editingQuestion,
                          question: {
                            ...editingQuestion.question,
                            timestamp: secs,
                            timestampFormatted: formatted
                          }
                        });
                      }}
                      className="h-9 text-xs font-mono font-bold"
                    />
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      ({editingQuestion.question.timestamp ?? 120}s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={editingQuestion.question.requiredToPass ?? true}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, requiredToPass: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mandatory Gate (Must answer correctly to continue)
                    </span>
                  </label>
                </div>
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Question Prompt / Problem Statement *
                </label>
                <Textarea
                  rows={3}
                  value={editingQuestion.question.prompt}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, prompt: e.target.value }
                  })}
                  placeholder={
                    editingQuestion.question.type === 'fib'
                      ? "e.g. In connected speech, unstressed vowels frequently reduce to the ____ sound."
                      : editingQuestion.question.type === 'tfng'
                      ? "e.g. Candidates who speak with high speech rates automatically score Band 8.0."
                      : "e.g. According to Syed Ejaz Bukhari, what distinguishes Band 8.0 fluency from Band 6.5?"
                  }
                  className="rounded-xl text-xs font-medium"
                />
              </div>

              {/* Dynamic Type Configuration */}
              {editingQuestion.question.type === 'mcq' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Options & Correct Answer Choice
                    </label>
                    {(editingQuestion.question.options || []).length < 6 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOpts = [...(editingQuestion.question.options || ["", "", "", ""]), ""];
                          setEditingQuestion({
                            ...editingQuestion,
                            question: { ...editingQuestion.question, options: newOpts }
                          });
                        }}
                        className="h-6 text-[10px] font-bold text-purple-600 hover:text-purple-700 p-0"
                      >
                        + Add Choice
                      </Button>
                    )}
                  </div>
                  {(editingQuestion.question.options || ["", "", "", ""]).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={editingQuestion.question.correctIndex === optIdx}
                        onChange={() => setEditingQuestion({
                          ...editingQuestion,
                          question: { ...editingQuestion.question, correctIndex: optIdx }
                        })}
                        className="w-4 h-4 text-purple-600 cursor-pointer shrink-0"
                        title="Mark as correct answer"
                      />
                      <span className="w-5 text-xs font-black text-slate-400 shrink-0">{String.fromCharCode(65 + optIdx)}</span>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(editingQuestion.question.options || ["", "", "", ""])];
                          newOpts[optIdx] = e.target.value;
                          setEditingQuestion({
                            ...editingQuestion,
                            question: { ...editingQuestion.question, options: newOpts }
                          });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)} statement`}
                        className="h-8 text-xs flex-1"
                      />
                      {(editingQuestion.question.options || []).length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = (editingQuestion.question.options || []).filter((_, i) => i !== optIdx);
                            let newIdx = editingQuestion.question.correctIndex || 0;
                            if (newIdx >= newOpts.length) newIdx = 0;
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, options: newOpts, correctIndex: newIdx }
                            });
                          }}
                          className="w-7 h-7 rounded text-slate-400 hover:text-red-500 flex items-center justify-center shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editingQuestion.question.type === 'fib' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Primary Correct Answer *
                    </label>
                    <Input
                      value={editingQuestion.question.correctAnswer || ""}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, correctAnswer: e.target.value }
                      })}
                      placeholder="e.g. schwa"
                      className="h-9 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Alternative Accepted Spellings / Synonyms (Comma Separated)
                    </label>
                    <Input
                      value={(editingQuestion.question.acceptedAnswers || []).join(", ")}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          acceptedAnswers: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        }
                      })}
                      placeholder="e.g. the schwa, schwa sound, /ə/"
                      className="h-9 text-xs font-medium"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editingQuestion.question.caseSensitive ?? false}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, caseSensitive: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Case-sensitive matching (Strict capitalization required)
                    </span>
                  </label>
                </div>
              )}

              {editingQuestion.question.type === 'qa' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Band 8.5+ Model Answer / Key Concept Breakdown
                    </label>
                    <Textarea
                      rows={3}
                      value={editingQuestion.question.sampleAnswer || ""}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, sampleAnswer: e.target.value }
                      })}
                      placeholder="e.g. Stress-timed rhythm allows natural thought grouping and avoids rigid monotonic pronunciation..."
                      className="rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Examiner Rubric / Grading Criteria Notes
                    </label>
                    <Input
                      value={editingQuestion.question.rubricNotes || ""}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, rubricNotes: e.target.value }
                      })}
                      placeholder="e.g. Candidate must identify both vowel reduction and rhythmic timing."
                      className="rounded-xl text-xs font-medium h-9"
                    />
                  </div>
                </div>
              )}

              {editingQuestion.question.type === 'tfng' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Correct Classification
                  </label>
                  <div className="flex items-center gap-4">
                    {["True", "False", "Not Given"].map((opt, idx) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          editingQuestion.question.correctIndex === idx
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300"
                            : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tfngOpt"
                          checked={editingQuestion.question.correctIndex === idx}
                          onChange={() => setEditingQuestion({
                            ...editingQuestion,
                            question: {
                              ...editingQuestion.question,
                              options: ["True", "False", "Not Given"],
                              correctIndex: idx
                            }
                          })}
                          className="w-4 h-4 text-purple-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation & Hint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Pedagogical Explanation / IELTS Mentor Tip
                  </label>
                  <Textarea
                    rows={2}
                    value={editingQuestion.question.explanation || ""}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, explanation: e.target.value }
                    })}
                    placeholder="Provide learners with why this answer is correct..."
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Student Hint (Optional)
                  </label>
                  <Textarea
                    rows={2}
                    value={editingQuestion.question.hint || ""}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, hint: e.target.value }
                    })}
                    placeholder="Clue for learners when stuck..."
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Question Editor Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-950/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingQuestion(null)}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveQuestion(editingQuestion.episodeId, editingQuestion.question)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl px-5 border-none cursor-pointer"
              >
                Save Checkpoint
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT INTERACTIVE PREVIEW PLAYER SIMULATOR */}
      {previewCourse && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Player Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                  Student Interactive Player
                </span>
                <h3 className="text-sm font-black text-white truncate max-w-md">
                  {previewCourse.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <Award className="w-4 h-4" /> Score: {studentScore} pts
                </div>
                <button
                  onClick={() => setPreviewCourse(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Player Area */}
            <div className="p-6 overflow-y-auto space-y-6">
              {currentPreviewEpisode ? (
                <div className="space-y-4">
                  {/* Episode / Lesson Info Header (Upper Side) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-white/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                          Episode {previewEpisodeIndex + 1}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{currentPreviewEpisode.duration || "10 mins"}</span>
                      </div>
                      <h4 className="text-base font-black text-white">{currentPreviewEpisode.title}</h4>
                      {currentPreviewEpisode.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{currentPreviewEpisode.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Media Frame (Down Side) */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
                    {currentPreviewEpisode.mediaType === 'video' ? (
                      <SecureVideoPlayer
                        url={currentPreviewEpisode.mediaUrl}
                        title={currentPreviewEpisode.title}
                        poster={currentPreviewEpisode.posterUrl}
                        checkpointMarkers={(currentPreviewEpisode.questions || []).map(q => ({
                          timestamp: q.timestamp || 0,
                          label: q.prompt
                        }))}
                        className="w-full h-full rounded-none border-none shadow-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full h-full bg-gradient-to-b from-purple-950/40 to-slate-950">
                        <div className="w-20 h-20 rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-purple-400">
                          <Headphones className="w-10 h-10 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-black text-white">{currentPreviewEpisode.title}</h4>
                          <p className="text-xs text-purple-300 font-bold">{currentPreviewEpisode.speaker || previewCourse.instructor}</p>
                        </div>
                        {currentPreviewEpisode.mediaUrl ? <audio src={currentPreviewEpisode.mediaUrl} controls className="w-full max-w-md" /> : <p className="text-xs text-purple-300 italic">No audio source provided</p>}
                      </div>
                    )}
                  </div>

                  {/* Checkpoint Markers on Timeline */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Checkpoint Gate Assessments ({currentPreviewEpisode.questions?.length || 0})
                      </span>
                      <span className="text-[10px] text-slate-400">Click any checkpoint marker below to test question popup</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {currentPreviewEpisode.questions?.map((q, idx) => {
                        const isAnswered = answeredQuestionIds.has(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setActiveCheckpointQuestion(q);
                              setCheckpointUserAnswer("");
                              setCheckpointSubmitted(false);
                              setCheckpointFeedback(null);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isAnswered
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30"
                            }`}
                          >
                            {isAnswered ? <CheckCircle2 className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                            Checkpoint {idx + 1} ({q.timestampFormatted || "02:00"}) - {q.type.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACTIVE QUESTION POPUP IN SIMULATOR */}
                  {activeCheckpointQuestion && (
                    <div className="bg-slate-800/95 border-2 border-purple-500 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-white">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-600 text-white text-[10px] font-black uppercase">
                            {activeCheckpointQuestion.type.toUpperCase()} ASSESSMENT
                          </Badge>
                          <span className="text-xs font-bold text-amber-300">
                            ⏱ Video Paused at {activeCheckpointQuestion.timestampFormatted || "02:00"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold">{activeCheckpointQuestion.points || 10} Points</span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-base font-black leading-snug">
                          {activeCheckpointQuestion.prompt}
                        </h4>
                        {activeCheckpointQuestion.hint && !checkpointSubmitted && (
                          <p className="text-xs text-amber-300/90 italic">
                            💡 Hint: {activeCheckpointQuestion.hint}
                          </p>
                        )}
                      </div>

                      {/* Input form according to question type */}
                      {activeCheckpointQuestion.type === 'mcq' && (
                        <div className="space-y-2 pt-2">
                          {(activeCheckpointQuestion.options || []).map((opt, idx) => (
                            <label
                              key={idx}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                checkpointUserAnswer === idx
                                  ? "bg-purple-600/30 border-purple-400 text-white font-bold"
                                  : "bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-900"
                              }`}
                            >
                              <input
                                type="radio"
                                name="simOpt"
                                checked={checkpointUserAnswer === idx}
                                onChange={() => setCheckpointUserAnswer(idx)}
                                disabled={checkpointSubmitted}
                              />
                              <span className="font-bold text-xs">{String.fromCharCode(65 + idx)}.</span>
                              <span className="text-xs">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {activeCheckpointQuestion.type === 'fib' && (
                        <div className="pt-2">
                          <Input
                            value={checkpointUserAnswer}
                            onChange={(e) => setCheckpointUserAnswer(e.target.value)}
                            disabled={checkpointSubmitted}
                            placeholder="Type your answer here..."
                            className="bg-slate-900 border-white/20 text-white font-bold text-sm h-11 rounded-xl"
                          />
                        </div>
                      )}

                      {activeCheckpointQuestion.type === 'qa' && (
                        <div className="pt-2">
                          <Textarea
                            rows={3}
                            value={checkpointUserAnswer}
                            onChange={(e) => setCheckpointUserAnswer(e.target.value)}
                            disabled={checkpointSubmitted}
                            placeholder="Formulate your response in complete sentences..."
                            className="bg-slate-900 border-white/20 text-white font-medium text-xs rounded-xl"
                          />
                        </div>
                      )}

                      {activeCheckpointQuestion.type === 'tfng' && (
                        <div className="flex items-center gap-4 pt-2">
                          {["True", "False", "Not Given"].map((opt, idx) => (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer flex-1 justify-center ${
                                checkpointUserAnswer === idx
                                  ? "bg-purple-600/30 border-purple-400 text-white font-bold"
                                  : "bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-900"
                              }`}
                            >
                              <input
                                type="radio"
                                name="simTfng"
                                checked={checkpointUserAnswer === idx}
                                onChange={() => setCheckpointUserAnswer(idx)}
                                disabled={checkpointSubmitted}
                              />
                              <span className="text-xs font-bold">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Feedback & Result */}
                      {checkpointFeedback && (
                        <div className={`p-4 rounded-xl border ${
                          checkpointFeedback.isCorrect
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                            : "bg-red-950/40 border-red-500/40 text-red-300"
                        }`}>
                          <div className="flex items-center gap-2 font-bold text-xs">
                            {checkpointFeedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                            <span>{checkpointFeedback.message}</span>
                          </div>
                          {activeCheckpointQuestion.explanation && (
                            <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                              📘 <span className="font-bold">IELTS Mentor Breakdown:</span> {activeCheckpointQuestion.explanation}
                            </p>
                          )}
                          {activeCheckpointQuestion.sampleAnswer && (
                            <div className="mt-2 p-2.5 bg-black/40 rounded-lg text-[11px] text-emerald-200">
                              <span className="font-bold block text-emerald-400">Band 8.5 Model Phrasing:</span>
                              {activeCheckpointQuestion.sampleAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submit / Continue Button */}
                      <div className="pt-2 flex items-center justify-end gap-3">
                        {!checkpointSubmitted ? (
                          <Button
                            onClick={() => handleCheckAnswer(activeCheckpointQuestion)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl px-6 h-10 border-none cursor-pointer"
                          >
                            Submit & Check Answer
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setActiveCheckpointQuestion(null)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl px-6 h-10 border-none cursor-pointer flex items-center gap-1"
                          >
                            Continue Video <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  No episodes found in this preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (100% Iframe-Safe, Accessible) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500 capitalize">
                  Delete {deleteTarget.type === 'episode' ? 'Lesson' : deleteTarget.type}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{deleteTarget.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={executeDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-xl h-9 px-4 border-none shadow-sm cursor-pointer"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
