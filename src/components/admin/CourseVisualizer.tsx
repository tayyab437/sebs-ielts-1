import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  BookOpen,
  Eye,
  Sliders,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  Plus,
  Trash2,
  Edit3,
  Save,
  Check,
  RefreshCw,
  Search,
  FileText,
  HelpCircle,
  Sparkles,
  Layers,
  List,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

interface NormalizedQuestion {
  id: string;
  type: string; // mcq, true-false-not-given, fill-in-blanks, matching, short-answer, speaking
  question?: string;
  text?: string;
  instruction?: string;
  sectionInstruction?: string;
  sectionHeading?: string;
  options?: string[];
  correctAnswer?: string | any;
  explanation?: string;
  statements?: any[];
  paragraphs?: any[];
  headings?: any[];
  qNum?: number;
  _origQNum?: number;
  _sectionIndex: number; // 0, 1, or 2
  sectionNumber: number; // 1, 2, or 3
  [key: string]: any;
}

interface NormalizedSection {
  sectionIndex: number; // 0, 1, 2
  sectionNumber: number; // 1, 2, 3
  title: string;
  content: string; // passage or transcript text
  questions: NormalizedQuestion[];
}

export default function CourseVisualizer() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active section tab in visualizer (0 = Section 1, 1 = Section 2, 2 = Section 3)
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);

  // Normalized Sections data for selected course
  const [sections, setSections] = useState<NormalizedSection[]>([]);
  const [courseMeta, setCourseMeta] = useState<any>({});

  // Editing UI states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isEditingPassage, setIsEditingPassage] = useState<boolean>(false);
  const [previewMarkdown, setPreviewMarkdown] = useState<boolean>(false);

  // Fetch all courses from database / localStorage
  const loadCourses = async () => {
    setLoading(true);
    try {
      let remoteCourses: any[] = [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        remoteCourses = data;
      }

      // Merge local courses
      const localStr = localStorage.getItem("mock_courses");
      let localCourses: any[] = [];
      if (localStr) {
        try {
          localCourses = JSON.parse(localStr);
        } catch (e) {}
      }

      const mergedMap = new Map<string, any>();
      [...remoteCourses, ...localCourses].forEach((c) => {
        if (c && c.id) {
          mergedMap.set(c.id, c);
        }
      });

      const combined = Array.from(mergedMap.values());
      setCourses(combined);

      if (combined.length > 0) {
        if (!selectedCourseId || !mergedMap.has(selectedCourseId)) {
          setSelectedCourseId(combined[0].id);
        }
      }
    } catch (e: any) {
      console.error("Error fetching courses:", e);
      toast.error("Failed to load courses list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // When selectedCourseId changes, extract and normalize sections & questions
  useEffect(() => {
    if (!selectedCourseId || courses.length === 0) return;
    const currentCourse = courses.find((c) => c.id === selectedCourseId);
    if (!currentCourse) return;

    setCourseMeta({
      id: currentCourse.id,
      title: currentCourse.title || "Untitled Course",
      description: currentCourse.description || "",
      category: currentCourse.category || "IELTS",
      type: currentCourse.type || "Reading",
      difficulty: currentCourse.difficulty || "Intermediate",
      timeLimit: currentCourse.time_limit || currentCourse.timeLimit || 60,
      test_number: currentCourse.test_number || "1",
      rawCourse: currentCourse,
    });

    parseCourseToSections(currentCourse);
    setHasUnsavedChanges(false);
  }, [selectedCourseId, courses]);

  // Helper to normalize course blocks / modules into 3 structured sections
  const parseCourseToSections = (course: any) => {
    const rawModules = course.modules || [];
    const rawBlocks = course.blocks || { left: [], right: [] };

    const leftBlocks = rawBlocks.left || [];
    const rightBlocks = rawBlocks.right || [];

    // Helper to check if a block is a divider
    const isDividerBlock = (b: any) => {
      if (!b) return false;
      const t = String(b.type || "").toLowerCase();
      return (
        t === "divider" ||
        t === "divider-line" ||
        t === "divider_line" ||
        t === "section-divider" ||
        t === "section_divider" ||
        t === "hr" ||
        t.includes("divider")
      );
    };

    // Extract all questions from blocks.right OR modules.lessons
    let extractedQuestions: NormalizedQuestion[] = [];
    let sec1Passage = "";
    let sec2Passage = "";
    let sec3Passage = "";
    let sec1Title = "Section 1: Passage 1";
    let sec2Title = "Section 2: Passage 2";
    let sec3Title = "Section 3: Passage 3";

    // 1. Try extracting from blocks if present
    if (rightBlocks.length > 0) {
      let currentSecIdx = 0;
      let hasExplicitDivider = false;
      let globalQNum = 1;

      rightBlocks.forEach((q: any, idx: number) => {
        if (!q) return;
        if (isDividerBlock(q)) {
          currentSecIdx = Math.min(2, currentSecIdx + 1);
          hasExplicitDivider = true;
          return;
        }

        const blockTxt = String(
          q.data?.range ||
            q.data?.text ||
            q.data?.title ||
            q.data?.sectionHeading ||
            q.data?.heading ||
            q.section ||
            ""
        ).toLowerCase();

        if (!hasExplicitDivider) {
          if (
            q.data?.section === 1 ||
            q.section === 1 ||
            q.data?.sectionNumber === 1 ||
            blockTxt.includes("section 1") ||
            blockTxt.includes("passage 1") ||
            blockTxt.includes("part 1")
          ) {
            currentSecIdx = 0;
          } else if (
            q.data?.section === 2 ||
            q.section === 2 ||
            q.data?.sectionNumber === 2 ||
            blockTxt.includes("section 2") ||
            blockTxt.includes("passage 2") ||
            blockTxt.includes("part 2")
          ) {
            currentSecIdx = 1;
          } else if (
            q.data?.section === 3 ||
            q.section === 3 ||
            q.data?.sectionNumber === 3 ||
            blockTxt.includes("section 3") ||
            blockTxt.includes("passage 3") ||
            blockTxt.includes("part 3")
          ) {
            currentSecIdx = 2;
          }
        }

        const qMatch = blockTxt.match(/(?:questions|qs?\.?)\s*(\d+)\s*[-–—to\s]+\s*(\d+)/i);
        if (qMatch) {
          const startQ = parseInt(qMatch[1], 10);
          if (startQ >= 28 && !hasExplicitDivider) {
            currentSecIdx = 2;
          } else if (startQ >= 14 && startQ <= 27 && !hasExplicitDivider) {
            currentSecIdx = Math.max(currentSecIdx, 1);
          } else if (startQ >= 1 && !hasExplicitDivider && currentSecIdx === 0) {
            currentSecIdx = 0;
          }
        }

        const qType = (q.type || "").toLowerCase();
        if (!qType || qType === "question-range" || qType === "instruction" || qType === "instructions") {
          return;
        }

        let explicitSec = q._sectionIndex !== undefined
          ? q._sectionIndex
          : (q.sectionNumber !== undefined
              ? q.sectionNumber - 1
              : (q.data?.sectionNumber !== undefined
                  ? q.data.sectionNumber - 1
                  : currentSecIdx));

        explicitSec = Math.max(0, Math.min(2, explicitSec));

        extractedQuestions.push({
          ...q,
          id: q.id || `q-${idx}-${Date.now()}`,
          type: qType,
          question: q.data?.question || q.data?.text || q.question || q.text || `Question ${globalQNum}`,
          options: q.data?.options || q.options || ["A", "B", "C", "D"],
          correctAnswer: q.data?.correctAnswer || q.correctAnswer || "A",
          explanation: q.data?.explanation || q.explanation || "",
          qNum: globalQNum++,
          _origQNum: globalQNum,
          _sectionIndex: explicitSec,
          sectionNumber: explicitSec + 1,
        });
      });

      // Extract left blocks passages
      let leftSecSlices: any[][] = [[], [], []];
      let dividerIndices: number[] = [];
      leftBlocks.forEach((b: any, bIdx: number) => {
        if (isDividerBlock(b)) dividerIndices.push(bIdx);
      });

      if (dividerIndices.length >= 2) {
        leftSecSlices = [
          leftBlocks.slice(0, dividerIndices[0]),
          leftBlocks.slice(dividerIndices[0] + 1, dividerIndices[1]),
          leftBlocks.slice(dividerIndices[1] + 1),
        ];
      } else {
        const passageBlocks = leftBlocks.filter((b: any) => b.type === "reading-passage");
        if (passageBlocks.length === 3) {
          const p1Idx = leftBlocks.indexOf(passageBlocks[0]);
          const p2Idx = leftBlocks.indexOf(passageBlocks[1]);
          const p3Idx = leftBlocks.indexOf(passageBlocks[2]);
          leftSecSlices = [
            leftBlocks.slice(p1Idx, p2Idx),
            leftBlocks.slice(p2Idx, p3Idx),
            leftBlocks.slice(p3Idx),
          ];
        } else {
          const chunk = Math.ceil(leftBlocks.length / 3) || 1;
          leftSecSlices = [
            leftBlocks.slice(0, chunk),
            leftBlocks.slice(chunk, chunk * 2),
            leftBlocks.slice(chunk * 2),
          ];
        }
      }

      const mapBlocksToText = (blocks: any[]) => {
        return blocks
          .map((b) => b.data?.text || b.data?.content || b.text || "")
          .filter(Boolean)
          .join("\n\n");
      };

      sec1Passage = mapBlocksToText(leftSecSlices[0]);
      sec2Passage = mapBlocksToText(leftSecSlices[1]);
      sec3Passage = mapBlocksToText(leftSecSlices[2]);
    } else if (rawModules.length > 0 && rawModules[0].lessons) {
      // 2. Extract from modules.lessons
      const lessons = rawModules[0].lessons || [];
      lessons.forEach((les: any, lIdx: number) => {
        const secIdx = Math.min(2, lIdx);
        if (secIdx === 0) {
          sec1Title = les.title || "Section 1: Passage 1";
          sec1Passage = les.content?.text || les.content || "";
        } else if (secIdx === 1) {
          sec2Title = les.title || "Section 2: Passage 2";
          sec2Passage = les.content?.text || les.content || "";
        } else if (secIdx === 2) {
          sec3Title = les.title || "Section 3: Passage 3";
          sec3Passage = les.content?.text || les.content || "";
        }

        const lesQs = les.questions || les.content?.questions || [];
        lesQs.forEach((q: any, qIdx: number) => {
          extractedQuestions.push({
            ...q,
            id: q.id || `m-q-${lIdx}-${qIdx}`,
            type: q.type || "mcq",
            question: q.question || q.text || `Question ${qIdx + 1}`,
            options: q.options || ["A", "B", "C", "D"],
            correctAnswer: q.correctAnswer || "A",
            explanation: q.explanation || "",
            _sectionIndex: secIdx,
            sectionNumber: secIdx + 1,
          });
        });
      });
    }

    // Default passage placeholders if empty
    if (!sec1Passage) sec1Passage = "### Passage 1\nInsert passage text for Section 1 here.";
    if (!sec2Passage) sec2Passage = "### Passage 2\nInsert passage text for Section 2 here.";
    if (!sec3Passage) sec3Passage = "### Passage 3\nInsert passage text for Section 3 here.";

    // Split extracted questions into the 3 section arrays
    const sec1Qs = extractedQuestions.filter((q) => q._sectionIndex === 0);
    const sec2Qs = extractedQuestions.filter((q) => q._sectionIndex === 1);
    const sec3Qs = extractedQuestions.filter((q) => q._sectionIndex === 2);

    setSections([
      {
        sectionIndex: 0,
        sectionNumber: 1,
        title: sec1Title,
        content: sec1Passage,
        questions: sec1Qs,
      },
      {
        sectionIndex: 1,
        sectionNumber: 2,
        title: sec2Title,
        content: sec2Passage,
        questions: sec2Qs,
      },
      {
        sectionIndex: 2,
        sectionNumber: 3,
        title: sec3Title,
        content: sec3Passage,
        questions: sec3Qs,
      },
    ]);
  };

  // MOVE QUESTION TO NEXT / PREVIOUS SECTION
  const moveQuestionSection = (questionId: string, currentSecIdx: number, targetSecIdx: number) => {
    if (targetSecIdx < 0 || targetSecIdx > 2 || targetSecIdx === currentSecIdx) return;

    setSections((prevSections) => {
      const newSections = prevSections.map((sec) => ({
        ...sec,
        questions: [...sec.questions],
      }));

      const sourceSec = newSections[currentSecIdx];
      const targetSec = newSections[targetSecIdx];

      const qIndex = sourceSec.questions.findIndex((q) => q.id === questionId);
      if (qIndex === -1) return prevSections;

      const [movingQ] = sourceSec.questions.splice(qIndex, 1);
      const updatedQ = {
        ...movingQ,
        _sectionIndex: targetSecIdx,
        sectionNumber: targetSecIdx + 1,
      };

      targetSec.questions.push(updatedQ);

      return newSections;
    });

    setHasUnsavedChanges(true);
    toast.success(`Question moved to Section ${targetSecIdx + 1}!`);
  };

  // REORDER QUESTION WITHIN SECTION
  const reorderQuestion = (secIdx: number, qIndex: number, direction: "up" | "down") => {
    setSections((prevSections) => {
      const newSections = prevSections.map((sec) => ({
        ...sec,
        questions: [...sec.questions],
      }));

      const targetQs = newSections[secIdx].questions;
      if (direction === "up" && qIndex > 0) {
        const temp = targetQs[qIndex];
        targetQs[qIndex] = targetQs[qIndex - 1];
        targetQs[qIndex - 1] = temp;
      } else if (direction === "down" && qIndex < targetQs.length - 1) {
        const temp = targetQs[qIndex];
        targetQs[qIndex] = targetQs[qIndex + 1];
        targetQs[qIndex + 1] = temp;
      }

      return newSections;
    });

    setHasUnsavedChanges(true);
  };

  // UPDATE QUESTION FIELDS
  const updateQuestionField = (secIdx: number, questionId: string, field: string, value: any) => {
    setSections((prevSections) => {
      const newSections = prevSections.map((sec) => ({
        ...sec,
        questions: [...sec.questions],
      }));

      const targetSec = newSections[secIdx];
      const qIdx = targetSec.questions.findIndex((q) => q.id === questionId);
      if (qIdx !== -1) {
        targetSec.questions[qIdx] = {
          ...targetSec.questions[qIdx],
          [field]: value,
        };
      }

      return newSections;
    });

    setHasUnsavedChanges(true);
  };

  // ADD NEW QUESTION TO CURRENT SECTION
  const addQuestionToSection = (secIdx: number) => {
    const newId = `new-q-${Date.now()}`;
    const newQ: NormalizedQuestion = {
      id: newId,
      type: "mcq",
      question: "New Multiple Choice Question",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "A",
      explanation: "",
      _sectionIndex: secIdx,
      sectionNumber: secIdx + 1,
    };

    setSections((prev) => {
      const copy = prev.map((sec) => ({ ...sec, questions: [...sec.questions] }));
      copy[secIdx].questions.push(newQ);
      return copy;
    });

    setEditingQuestionId(newId);
    setHasUnsavedChanges(true);
    toast.success(`New question added to Section ${secIdx + 1}!`);
  };

  // DELETE QUESTION
  const deleteQuestion = (secIdx: number, questionId: string) => {
    setSections((prev) => {
      const copy = prev.map((sec) => ({ ...sec, questions: [...sec.questions] }));
      copy[secIdx].questions = copy[secIdx].questions.filter((q) => q.id !== questionId);
      return copy;
    });

    setHasUnsavedChanges(true);
    toast.info("Question deleted.");
  };

  // UPDATE SECTION PASSAGE CONTENT
  const updateSectionContent = (secIdx: number, text: string) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[secIdx] = { ...copy[secIdx], content: text };
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // SAVE AND SYNC TO DATABASE
  const syncChangesToDatabase = async () => {
    if (!selectedCourseId) return;
    setIsSyncing(true);

    try {
      const currentCourse = courses.find((c) => c.id === selectedCourseId) || {};

      // 1. Build compiled modules
      const compiledLessons = sections.map((sec, sIdx) => ({
        id: `les-${selectedCourseId}-${sIdx + 1}`,
        title: sec.title || `Section ${sIdx + 1}`,
        type: "READING",
        content: sec.content || "",
        questions: sec.questions.map((q, qIdx) => ({
          ...q,
          _sectionIndex: sIdx,
          sectionNumber: sIdx + 1,
        })),
        hasTimer: true,
        timeLimit: courseMeta.timeLimit || 60,
      }));

      const compiledModules = [
        {
          id: `mod-${selectedCourseId}`,
          title: "Syllabus Curriculum Module",
          skillType: "reading",
          lessons: compiledLessons,
          access_tier: "Free Trial",
          test_number: courseMeta.test_number || "1",
        },
      ];

      // 2. Build blocks representation
      const leftBlocks = sections.map((sec, sIdx) => ({
        id: `passage-block-${sIdx + 1}`,
        type: "reading-passage",
        data: {
          title: sec.title,
          text: sec.content,
        },
      }));

      const rightBlocks: any[] = [];
      sections.forEach((sec, sIdx) => {
        if (sIdx > 0) {
          rightBlocks.push({ id: `divider-${sIdx}`, type: "divider" });
        }
        sec.questions.forEach((q) => {
          rightBlocks.push({
            ...q,
            type: q.type || "mcq",
            _sectionIndex: sIdx,
            sectionNumber: sIdx + 1,
            data: {
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              sectionNumber: sIdx + 1,
            },
          });
        });
      });

      const updatedPayload = {
        ...currentCourse,
        id: selectedCourseId,
        title: courseMeta.title || currentCourse.title,
        description: courseMeta.description || currentCourse.description,
        category: courseMeta.category || currentCourse.category,
        type: courseMeta.type || currentCourse.type,
        difficulty: courseMeta.difficulty || currentCourse.difficulty,
        time_limit: courseMeta.timeLimit || 60,
        modules: compiledModules,
        blocks: {
          left: leftBlocks,
          right: rightBlocks,
        },
        status: "Published",
        updated_at: new Date().toISOString(),
      };

      // 3. Upsert to Supabase
      const { error } = await supabase.from("courses").upsert([updatedPayload]);
      if (error) {
        throw error;
      }

      // 4. Update localStorage
      try {
        const existingLocal = JSON.parse(localStorage.getItem("mock_courses") || "[]");
        const updatedLocal = [
          updatedPayload,
          ...existingLocal.filter((c: any) => c.id !== selectedCourseId),
        ];
        localStorage.setItem("mock_courses", JSON.stringify(updatedLocal));
        localStorage.setItem("designer_courses", JSON.stringify(updatedLocal));
      } catch (e) {}

      // Update state
      setCourses((prev) =>
        prev.map((c) => (c.id === selectedCourseId ? updatedPayload : c))
      );

      setHasUnsavedChanges(false);
      toast.success("Database synced successfully! Changes are live across all student views.");
    } catch (err: any) {
      console.error("Database sync error:", err);
      toast.error(`Database Sync Failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalQuestionsCount = sections.reduce(
    (acc, sec) => acc + sec.questions.length,
    0
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 animate-fade-in" id="course-visualizer-root">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 font-mono text-xs tracking-wider uppercase">
                Curriculum Visualizer & Editor
              </Badge>
              {hasUnsavedChanges && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 animate-pulse flex items-center gap-1.5 font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5" /> Unsaved Changes
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Eye className="w-8 h-8 text-emerald-400" /> Course Visualizer Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Inspect full curriculum structure, edit reading passages, move questions seamlessly between sections, reorder items, and sync directly with the live database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCourses}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>

            <Button
              size="sm"
              onClick={syncChangesToDatabase}
              disabled={isSyncing || !selectedCourseId}
              className={`rounded-xl h-10 px-5 font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                hasUnsavedChanges
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-pulse"
                  : "bg-primary hover:bg-primary/90 text-white shadow-primary/25"
              }`}
            >
              <Save className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing Database..." : "Sync Changes to Database"}
            </Button>
          </div>
        </div>
      </div>

      {/* Course Selector & Metadata Strip */}
      <Card className="rounded-2xl border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Course Selector */}
            <div className="md:col-span-6 space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Course to Visualize</Label>
              <div className="relative">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-10"
                >
                  {filteredCourses.length === 0 ? (
                    <option value="">No courses found</option>
                  ) : (
                    filteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || "Untitled"} ({c.type || "Course"} • ID: {c.id.substring(0, 8)})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Filter Input */}
            <div className="md:col-span-6 space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Courses List</Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Filter by title, category, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Active Course Overview Stats */}
          {courseMeta.id && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1 font-bold text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  Category: {courseMeta.category}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 font-bold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Type: {courseMeta.type}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 font-bold text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Time Limit: {courseMeta.timeLimit} mins
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 font-bold text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  Total Questions: {totalQuestionsCount}
                </Badge>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Course ID: <span className="font-bold text-slate-600 dark:text-slate-200">{courseMeta.id}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Visualizer Workspace */}
      <div className="space-y-6">
        {/* Section Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSectionIdx(idx)}
                className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeSectionIdx === idx
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-white/10"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Section {sec.sectionNumber}</span>
                <Badge className={`ml-1 text-[10px] px-2 py-0.5 font-bold ${
                  activeSectionIdx === idx ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {sec.questions.length} Qs
                </Badge>
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => addQuestionToSection(activeSectionIdx)}
            className="rounded-xl border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs h-10 px-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Question to Section {activeSectionIdx + 1}
          </Button>
        </div>

        {/* Section Content & Questions Grid */}
        {sections[activeSectionIdx] && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Reading Passage / Section Content */}
            <Card className="lg:col-span-5 rounded-2xl border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5 p-4 sm:p-5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Section {sections[activeSectionIdx].sectionNumber} Reading Passage
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Content assigned to Section {sections[activeSectionIdx].sectionNumber}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewMarkdown(!previewMarkdown)}
                    className="h-8 text-xs font-bold rounded-lg"
                  >
                    {previewMarkdown ? "Edit Raw" : "Preview"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingPassage(!isEditingPassage)}
                    className="h-8 text-xs font-bold rounded-lg border-slate-200 dark:border-white/10"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    {isEditingPassage ? "Done" : "Edit Passage"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Passage Title Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passage Title</Label>
                  <Input
                    value={sections[activeSectionIdx].title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) => {
                        const copy = [...prev];
                        copy[activeSectionIdx].title = val;
                        return copy;
                      });
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="e.g., Passage 1: The Secret Life of Bees"
                    className="rounded-xl font-bold text-sm bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10"
                  />
                </div>

                {/* Passage Body Text / Markdown */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passage Content</Label>
                  {isEditingPassage || !previewMarkdown ? (
                    <textarea
                      rows={18}
                      value={sections[activeSectionIdx].content}
                      onChange={(e) => updateSectionContent(activeSectionIdx, e.target.value)}
                      placeholder="Type or paste reading passage text here..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-y"
                    />
                  ) : (
                    <div className="prose dark:prose-invert max-w-none max-h-[500px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm leading-relaxed">
                      <ReactMarkdown>{sections[activeSectionIdx].content || "*No passage content provided.*"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Questions List & Section Mapping Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <List className="w-4 h-4 text-emerald-500" />
                    Section {sections[activeSectionIdx].sectionNumber} Questions ({sections[activeSectionIdx].questions.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Easily shift questions to previous or next sections using the action controls.
                  </p>
                </div>
              </div>

              {sections[activeSectionIdx].questions.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-slate-300 dark:border-white/10 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Questions in Section {activeSectionIdx + 1}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    You can move questions from other sections into Section {activeSectionIdx + 1}, or click below to add a new question.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => addQuestionToSection(activeSectionIdx)}
                    className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add First Question
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sections[activeSectionIdx].questions.map((q, qIdx) => {
                    const isEditing = editingQuestionId === q.id;

                    return (
                      <motion.div
                        key={q.id || qIdx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border transition-all ${
                          isEditing
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-900 shadow-md"
                            : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 shadow-sm"
                        }`}
                      >
                        {/* Question Card Header */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs px-2.5 py-1">
                              Q{qIdx + 1}
                            </Badge>
                            <Badge variant="outline" className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50">
                              {q.type || "mcq"}
                            </Badge>
                            <span className="text-xs font-bold text-slate-500">
                              Section {activeSectionIdx + 1}
                            </span>
                          </div>

                          {/* Action Controls Toolbar */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Move to Previous Section */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={activeSectionIdx === 0}
                              onClick={() => moveQuestionSection(q.id, activeSectionIdx, activeSectionIdx - 1)}
                              title="Move to Previous Section"
                              className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-200 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                              To Sec {activeSectionIdx}
                            </Button>

                            {/* Section Direct Dropdown */}
                            <select
                              value={activeSectionIdx}
                              onChange={(e) => moveQuestionSection(q.id, activeSectionIdx, Number(e.target.value))}
                              className="h-8 px-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <option value={0}>Section 1</option>
                              <option value={1}>Section 2</option>
                              <option value={2}>Section 3</option>
                            </select>

                            {/* Move to Next Section */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={activeSectionIdx === 2}
                              onClick={() => moveQuestionSection(q.id, activeSectionIdx, activeSectionIdx + 1)}
                              title="Move to Next Section"
                              className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-200 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300"
                            >
                              To Sec {activeSectionIdx + 2}
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>

                            {/* Reorder Up/Down */}
                            <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                              <button
                                disabled={qIdx === 0}
                                onClick={() => reorderQuestion(activeSectionIdx, qIdx, "up")}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                                title="Move Up"
                              >
                                <MoveUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              </button>
                              <button
                                disabled={qIdx === sections[activeSectionIdx].questions.length - 1}
                                onClick={() => reorderQuestion(activeSectionIdx, qIdx, "down")}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                                title="Move Down"
                              >
                                <MoveDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              </button>
                            </div>

                            {/* Toggle Edit Form */}
                            <Button
                              size="sm"
                              variant={isEditing ? "default" : "outline"}
                              onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                              className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                                isEditing
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "border-slate-200 dark:border-white/10"
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              {isEditing ? "Close" : "Edit"}
                            </Button>

                            {/* Delete Question */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteQuestion(activeSectionIdx, q.id)}
                              className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Question Preview Body */}
                        <div className="p-4 sm:p-5 space-y-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {q.question || q.text || "Untitled Question"}
                          </p>

                          {/* Show Options if available */}
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isCorrect =
                                  String(q.correctAnswer).toUpperCase() === String(optIdx) ||
                                  String(q.correctAnswer).toUpperCase() === opt.substring(0, 1).toUpperCase() ||
                                  String(q.correctAnswer).trim() === String(opt).trim();

                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                      isCorrect
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Correct Answer Display */}
                          <div className="flex items-center gap-2 pt-1 text-xs">
                            <span className="font-bold text-slate-500 uppercase tracking-wider">Correct Answer:</span>
                            <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold text-xs px-2.5 py-0.5">
                              {String(q.correctAnswer || "A")}
                            </Badge>
                          </div>

                          {/* Expanded Edit Form */}
                          {isEditing && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-4 bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-xl">
                              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Edit3 className="w-3 h-3 text-emerald-500" /> Edit Question Details
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[11px] font-bold text-slate-500">Question Type</Label>
                                  <select
                                    value={q.type || "mcq"}
                                    onChange={(e) => updateQuestionField(activeSectionIdx, q.id, "type", e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs font-semibold"
                                  >
                                    <option value="mcq">Multiple Choice (MCQ)</option>
                                    <option value="true-false-not-given">True / False / Not Given</option>
                                    <option value="fill-in-blanks">Fill in the Blanks</option>
                                    <option value="matching">Matching</option>
                                    <option value="short-answer">Short Answer</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-bold text-slate-500">Correct Answer</Label>
                                  <Input
                                    value={q.correctAnswer || ""}
                                    onChange={(e) => updateQuestionField(activeSectionIdx, q.id, "correctAnswer", e.target.value)}
                                    placeholder="e.g. A or True or answer string"
                                    className="bg-white dark:bg-slate-900 text-xs font-bold border-slate-200 dark:border-white/10"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-slate-500">Question Text / Prompt</Label>
                                <textarea
                                  rows={2}
                                  value={q.question || q.text || ""}
                                  onChange={(e) => updateQuestionField(activeSectionIdx, q.id, "question", e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* MCQ Options editing */}
                              {q.type === "mcq" && (
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-bold text-slate-500">MCQ Options</Label>
                                  {(q.options || []).map((opt: string, oIdx: number) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-400 w-5">{String.fromCharCode(65 + oIdx)}.</span>
                                      <Input
                                        value={opt}
                                        onChange={(e) => {
                                          const newOpts = [...(q.options || [])];
                                          newOpts[oIdx] = e.target.value;
                                          updateQuestionField(activeSectionIdx, q.id, "options", newOpts);
                                        }}
                                        className="bg-white dark:bg-slate-900 text-xs font-medium border-slate-200 dark:border-white/10"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-slate-500">Explanation / Answer Tip (Optional)</Label>
                                <Input
                                  value={q.explanation || ""}
                                  onChange={(e) => updateQuestionField(activeSectionIdx, q.id, "explanation", e.target.value)}
                                  placeholder="Explain why this answer is correct..."
                                  className="bg-white dark:bg-slate-900 text-xs font-medium border-slate-200 dark:border-white/10"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
