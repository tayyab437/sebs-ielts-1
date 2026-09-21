import { useState, useEffect, useRef, Fragment, Component, ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabaseClient";
import { flattenQuestionsToIndividual, getQuestionCorrectIndex, normalizeCourseToSections } from "@/src/utils/questionFlattener";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpeakingRecorder } from "@/src/components/dashboard/SpeakingRecorder";
import { 
  BookOpen, 
  Video, 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Check,
  Star,
  Award,
  GraduationCap,
  X,
  Mic,
  Volume2,
  Trash2,
  Play,
  Sliders,
  Eye,
  PenTool,
  Clock,
  Upload,
  RotateCcw,
  Lock,
  Crown,
  ShieldAlert,
  Gem,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { safeSetItem, safeGetItemAndParse, safeJsonParse } from "@/src/lib/safeStorage";
import IeltsTestView from "@/src/components/IeltsTestView";
import { mergeCoursesWithMedia, fetchAllMediaCourses } from "@/src/lib/mediaCourseAdapter";
import MediaCoursePlayer from "@/src/components/courses/MediaCoursePlayer";
import SecureVideoPlayer from "@/src/components/common/SecureVideoPlayer";

export const slugifyCourse = (str: string): string => {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const getCourseUrlMeta = (course: any) => {
  if (!course) {
    return {
      examType: "ac",
      testType: "reading",
      testNumber: "1",
    };
  }

  // Detect Media Courses (Video / Audio Masterclasses created in Media Studio or with media attributes)
  const isMedia = Boolean(
    course.isMediaCourse ||
    course.rawMediaCourse ||
    course.mediaType ||
    course.media_type ||
    course.course_format === "video_masterclass" ||
    course.course_format === "audio_series" ||
    course.course_format === "media" ||
    String(course.id || "").startsWith("media-")
  );

  if (isMedia) {
    return {
      examType: "ac" as const,
      testType: "media",
      testNumber: String(course.id || "1"),
      isMedia: true,
    };
  }

  // 1. Detect AC vs GT (Academic vs General Training)
  const title = String(course.title || "").toLowerCase();
  const cat = String(course.category || "").toLowerCase();
  const cType = String(course.course_type || "").toLowerCase();
  const format = String(course.course_format || "").toLowerCase();
  const tagsStr = (course.tags || []).map((t: string) => t.toLowerCase()).join(" ");

  const isGt =
    title.includes("gt") ||
    title.includes("general") ||
    cat.includes("gt") ||
    cat.includes("general") ||
    cType.includes("gt") ||
    cType.includes("general") ||
    tagsStr.includes("gt") ||
    tagsStr.includes("general");

  const examType: "ac" | "gt" = isGt ? "gt" : "ac";

  // 2. Detect Skill / Test Type: reading, listening, writing, speaking
  let testType = "reading";
  if (format.includes("listening") || title.includes("listening") || cat.includes("listening") || cType.includes("listening")) {
    testType = "listening";
  } else if (format.includes("writing") || title.includes("writing") || cat.includes("writing") || cType.includes("writing")) {
    testType = "writing";
  } else if (format.includes("speaking") || title.includes("speaking") || cat.includes("speaking") || cType.includes("speaking")) {
    testType = "speaking";
  } else if (format.includes("reading") || title.includes("reading") || cat.includes("reading") || cType.includes("reading")) {
    testType = "reading";
  }

  // 3. Detect Test Number
  let testNumber = "1";
  const rawNum = course.test_number || (course.modules?.[0]?.test_number);
  if (rawNum !== undefined && rawNum !== null && String(rawNum).trim() !== "") {
    const rawStr = String(rawNum).trim();
    const numMatch = rawStr.match(/\d+/);
    if (numMatch) {
      testNumber = numMatch[0];
    } else {
      testNumber = slugifyCourse(rawStr);
    }
  } else {
    const titleMatch = title.match(/(?:test|practice|task|mock|vol|volume|book|set)\s*#?\s*(\d+)/i) || title.match(/\b(\d+)\b/);
    if (titleMatch) {
      testNumber = titleMatch[1];
    }
  }

  return {
    examType,
    testType,
    testNumber,
  };
};

export const isUserLoggedIn = (): boolean => {
  try {
    const sbUser = localStorage.getItem("sb-user");
    const authUser = localStorage.getItem("authenticated_user");
    const studentProf = localStorage.getItem("student_profile");
    const teacherProf = localStorage.getItem("teacher_profile");
    const userRole = localStorage.getItem("user_role");
    const mockLoggedIn = localStorage.getItem("mock_user_logged_in") === "true";

    let hasSupabaseSession = false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase")) && key.endsWith("-auth-token")) {
        const val = localStorage.getItem(key);
        if (val && val.includes("access_token")) {
          hasSupabaseSession = true;
          break;
        }
      }
    }

    return !!(sbUser || authUser || studentProf || teacherProf || userRole || mockLoggedIn || hasSupabaseSession);
  } catch {
    return false;
  }
};

export const parseCoursePath = (pathname: string) => {
  const cleanPath = pathname.replace(/^\/dashboard/, "");
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments[0] === "courses") {
    // Check if format is /courses/:examType/:testType/:testNumber
    if (segments.length >= 4) {
      const rawExam = segments[1].toLowerCase().trim();
      const examType = rawExam.includes("gt") || rawExam.includes("gen") ? "gt" : "ac";
      const testType = segments[2].toLowerCase().trim();
      const testNumber = decodeURIComponent(segments[3]).toLowerCase().trim();
      return {
        isCourseSkillRoute: true,
        examType,
        testType,
        testNumber,
      };
    } else if (segments.length === 2) {
      return {
        isCourseIdRoute: true,
        courseId: segments[1],
      };
    }
  }
  return null;
};

const sortCoursesList = (list: any[]) => {
  const getTestNumberValue = (testNum: any): number => {
    if (testNum === undefined || testNum === null) return Infinity;
    const str = String(testNum).trim();
    if (str === "") return Infinity;
    const parsedDirect = parseInt(str, 10);
    if (!isNaN(parsedDirect)) return parsedDirect;
    const match = str.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return Infinity;
  };
  return [...list].sort((a, b) => {
    const aVal = getTestNumberValue(a.test_number);
    const bVal = getTestNumberValue(b.test_number);
    if (aVal !== bVal) {
      return aVal - bVal;
    }
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
};

class CoursesErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("StudentCourses caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/30 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Course Session Error</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            An issue occurred while attempting to display this course session.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-md"
              onClick={() => {
                localStorage.removeItem("active_course_id");
                localStorage.removeItem("active_course_timestamp");
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Return to Catalog
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function StudentCoursesInner({ 
  isDashboardMode = false, 
  initialFilter,
  userPlan: propUserPlan,
  onTriggerUpgrade
}: { 
  isDashboardMode?: boolean; 
  initialFilter?: string; 
  userPlan?: string;
  onTriggerUpgrade?: (planName: string, price: number) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId: routeCourseId, examType: routeExamType, testType: routeTestType, testNumber: routeTestNumber } = useParams<{
    courseId?: string;
    examType?: string;
    testType?: string;
    testNumber?: string;
  }>();
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("sb-user") || localStorage.getItem("authenticated_user") || localStorage.getItem("student_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [userPlan, setUserPlan] = useState<string>(() => {
    return propUserPlan || localStorage.getItem('override_student_plan') || "Free Trial";
  });

  useEffect(() => {
    if (propUserPlan) {
      setUserPlan(propUserPlan);
    }
  }, [propUserPlan]);

  const checkCourseAccess = (plan: string, pathTier?: string) => {
    const tier = pathTier || "Free Trial";
    if (tier === "Free Trial") return true;
    if (tier === "Pro Premium") {
      return plan === "Pro Premium" || plan === "Mastery Ultimate";
    }
    if (tier === "Mastery Ultimate") {
      return plan === "Mastery Ultimate";
    }
    return true;
  };

  // Get filter type from prop or navigation state if any
  const filterType = initialFilter || (location.state as { activeType?: string })?.activeType;
  
  // Visibility & Category Filtering Logic
  const catalogCourses = (courses || []).filter(c => c.show_in_catalog !== false);
  const mediaCourses = (courses || []).filter(c => c.isMediaCourse || c.course_format?.includes('video') || c.course_format?.includes('audio') || c.mediaType);
  const syllabusCourses = (courses || []).filter(c => {
    if (c.isMediaCourse) {
      if (filterType === "media") return true;
      if (filterType && filterType !== "courses") {
        return c.type?.toLowerCase() === filterType.toLowerCase() || c.category?.toLowerCase().includes(filterType.toLowerCase());
      }
      return c.show_in_syllabus !== false;
    }
    const isPracticeView = c.show_in_practice !== false;
    const format = c.course_format?.toLowerCase() || "";
    const type = c.type?.toLowerCase() || "";
    const cType = c.course_type?.toLowerCase() || "";
    const cat = c.category?.toLowerCase() || "";
    const title = c.title?.toLowerCase() || "";
    
    // Determine if this course is categorized as practice content
    const isPracticeContent = isPracticeView || 
                             ["reading test", "listening test", "writing task", "speaking task", "mock test"].includes(cType) ||
                             ["reading", "writing", "listening", "speaking", "mock_test"].includes(format) ||
                             cat.includes("reading") || cat.includes("listening") || cat.includes("writing") || cat.includes("speaking") ||
                             title.includes("test") || title.includes("practice");
    
    // If a filterType is provided (e.g. "reading"), only show those syllabus courses
    if (filterType && filterType !== "courses") {
      if (filterType === "media") return false;
      if (isPracticeContent) return false;
      return type === filterType.toLowerCase() && c.show_in_syllabus !== false;
    }
    
    return !isPracticeContent && c.show_in_syllabus !== false;
  });
  const practiceCourses = (courses || []).filter(c => {
    if (c.isMediaCourse) {
      if (filterType === "media") return true;
      if (filterType && filterType !== "courses") {
        const tf = filterType.toLowerCase();
        const cat = (c.category || "").toLowerCase();
        const cType = (c.course_type || "").toLowerCase();
        return cat.includes(tf) || cType.includes(tf) || (c.mediaType === "audio" && tf === "listening") || (c.mediaType === "video" && (tf === "speaking" || tf === "listening"));
      }
      return c.show_in_practice !== false;
    }
    const isPracticeView = c.show_in_practice !== false;
    const cType = c.course_type?.toLowerCase() || "";
    const format = c.course_format?.toLowerCase() || "";
    const cat = c.category?.toLowerCase() || "";
    const title = c.title?.toLowerCase() || "";
    const tagsStr = (c.tags || []).map((t: string) => t.toLowerCase()).join(" ");
    
    // Strict Opt-in matching: when show in practice is permitted (not explicitly false)
    if (!isPracticeView) {
      return false;
    }
    
    // Determine the primary course category with prioritized precision
    let detectedCategory = "";
    if (cType.includes("reading") || format === "reading" || cat.includes("reading")) {
      detectedCategory = "reading";
    } else if (cType.includes("listening") || format === "listening" || cat.includes("listening")) {
      detectedCategory = "listening";
    } else if (cType.includes("writing") || format === "writing" || cat.includes("writing")) {
      detectedCategory = "writing";
    } else if (cType.includes("speaking") || format === "speaking" || cat.includes("speaking")) {
      detectedCategory = "speaking";
    }

    // Secondary fallback: only query the title/tags if no explicit categorization/format was found
    if (!detectedCategory) {
      if (title.includes("reading") || tagsStr.includes("reading")) {
        detectedCategory = "reading";
      } else if (title.includes("listening") || tagsStr.includes("listening")) {
        detectedCategory = "listening";
      } else if (title.includes("writing") || tagsStr.includes("writing")) {
        detectedCategory = "writing";
      } else if (title.includes("speaking") || tagsStr.includes("speaking")) {
        detectedCategory = "speaking";
      }
    }
    
    if (filterType && filterType !== "courses") {
      const targetFilter = filterType.toLowerCase();
      return detectedCategory === targetFilter;
    }
    
    return true;
  });

  // What to show in the main grid
  const currentViewCourses = isDashboardMode 
    ? (filterType && ["reading", "listening", "writing", "speaking"].includes(filterType) 
        ? practiceCourses // If specifically filtering for a practice type, only show those
        : [...syllabusCourses, ...practiceCourses]) 
    : catalogCourses;

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subExamMode, setSubExamMode] = useState<"ac" | "gt">("ac");
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  const [activeCourseId, setActiveCourseId] = useState<string | null>(() => {
    // Only initialize active course from URL if a specific course route was requested
    if (routeCourseId) return routeCourseId;
    const parsed = parseCoursePath(window.location.pathname);
    if (parsed) {
      if (parsed.isCourseIdRoute && parsed.courseId) return parsed.courseId;
    }
    // Never auto-launch a course from stale localStorage when browsing the root courses catalog
    return null;
  });
  const [activeCourse, setActiveCourse] = useState<any | null>(null);

  const updateCourseUrl = (course: any) => {
    if (!course) return;
    const isMedia = Boolean(
      course.isMediaCourse ||
      course.rawMediaCourse ||
      course.mediaType ||
      course.media_type ||
      course.course_format === "video_masterclass" ||
      course.course_format === "audio_series" ||
      course.course_format === "media" ||
      String(course.id || "").startsWith("media-")
    );

    if (isMedia) {
      const targetUrl = isDashboardMode
        ? `/dashboard/courses/${course.id}`
        : `/courses/${course.id}`;

      if (location.pathname !== targetUrl) {
        navigate(targetUrl);
      }
      return;
    }

    const { examType, testType, testNumber } = getCourseUrlMeta(course);
    const targetUrl = isDashboardMode
      ? `/dashboard/courses/${examType}/${testType}/${testNumber}`
      : `/courses/${examType}/${testType}/${testNumber}`;

    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  };

  useEffect(() => {
    const parsed = parseCoursePath(location.pathname);

    if ((parsed || routeCourseId) && !isUserLoggedIn()) {
      toast.error("Sign In Required", {
        description: "Please sign in to take courses and access full practice modules."
      });
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (parsed && courses.length > 0) {
      if (parsed.isCourseSkillRoute && parsed.examType && parsed.testType && parsed.testNumber) {
        if (parsed.testType === "media") {
          const foundMedia = courses.find((c) => 
            String(c.id).toLowerCase() === String(parsed.testNumber).toLowerCase() ||
            (c.slug && String(c.slug).toLowerCase() === String(parsed.testNumber).toLowerCase()) ||
            (c.rawMediaCourse?.id && String(c.rawMediaCourse.id).toLowerCase() === String(parsed.testNumber).toLowerCase())
          );
          if (foundMedia) {
            if (activeCourseId !== foundMedia.id) {
              setActiveCourseId(foundMedia.id);
              setActiveCourse(foundMedia);
              safeSetItem("active_course_id", foundMedia.id);
              safeSetItem("active_course_timestamp", Date.now().toString());
            }
          }
          return;
        }

        const found = courses.find((c) => {
          // Never match a media course as an IELTS practice test
          if (c.isMediaCourse || c.rawMediaCourse || c.mediaType || String(c.id || "").startsWith("media-")) {
            return false;
          }
          const meta = getCourseUrlMeta(c);
          const metaNum = String(meta.testNumber).toLowerCase();
          const targetNum = String(parsed.testNumber).toLowerCase();
          const metaId = String(c.id || "").toLowerCase();

          const matchesExam = meta.examType === parsed.examType;
          const matchesSkill = meta.testType === parsed.testType;
          const matchesNum = metaNum === targetNum || metaId === targetNum || metaNum.replace(/^0+/, "") === targetNum.replace(/^0+/, "");

          return matchesExam && matchesSkill && matchesNum;
        }) || courses.find((c) => {
          if (c.isMediaCourse || c.rawMediaCourse || c.mediaType || String(c.id || "").startsWith("media-")) {
            return false;
          }
          // Fallback: match skill and number even if exam classification was ambiguous
          const meta = getCourseUrlMeta(c);
          const metaNum = String(meta.testNumber).toLowerCase();
          const targetNum = String(parsed.testNumber).toLowerCase();
          return meta.testType === parsed.testType && (metaNum === targetNum || metaNum.replace(/^0+/, "") === targetNum.replace(/^0+/, ""));
        });

        if (found) {
          if (activeCourseId !== found.id) {
            setActiveCourseId(found.id);
            setActiveCourse(found);
            safeSetItem("active_course_id", found.id);
            safeSetItem("active_course_timestamp", Date.now().toString());
          }
        }
      } else if (parsed.isCourseIdRoute && parsed.courseId) {
        const found = courses.find((c) => 
          String(c.id).toLowerCase() === String(parsed.courseId).toLowerCase() ||
          (c.slug && String(c.slug).toLowerCase() === String(parsed.courseId).toLowerCase()) ||
          (c.rawMediaCourse?.id && String(c.rawMediaCourse.id).toLowerCase() === String(parsed.courseId).toLowerCase()) ||
          (c.rawMediaCourse?.slug && String(c.rawMediaCourse.slug).toLowerCase() === String(parsed.courseId).toLowerCase())
        );
        if (found) {
          if (activeCourseId !== found.id) {
            setActiveCourseId(found.id);
            setActiveCourse(found);
            safeSetItem("active_course_id", found.id);
            safeSetItem("active_course_timestamp", Date.now().toString());
          }
        }
      }
    } else if (!parsed && routeCourseId && courses.length > 0) {
      const found = courses.find((c) => 
        String(c.id).toLowerCase() === String(routeCourseId).toLowerCase() ||
        (c.slug && String(c.slug).toLowerCase() === String(routeCourseId).toLowerCase()) ||
        (c.rawMediaCourse?.id && String(c.rawMediaCourse.id).toLowerCase() === String(routeCourseId).toLowerCase())
      );
      if (found && activeCourseId !== found.id) {
        setActiveCourseId(found.id);
        setActiveCourse(found);
        safeSetItem("active_course_id", found.id);
        safeSetItem("active_course_timestamp", Date.now().toString());
      }
    } else if (!parsed && !routeCourseId && (location.pathname === "/courses" || location.pathname === "/dashboard/courses")) {
      if (activeCourseId) {
        setActiveCourseId(null);
        setActiveCourse(null);
      }
      localStorage.removeItem("active_course_id");
      localStorage.removeItem("active_course_timestamp");
    }
  }, [location.pathname, routeCourseId, routeExamType, routeTestType, routeTestNumber, courses]);
  
  useEffect(() => {
    if (!activeCourseId) {
      setActiveCourse(null);
      return;
    }

    // Check 5-minute timeout rule
    const savedTime = localStorage.getItem("active_course_timestamp");
    const timestamp = savedTime ? Number(savedTime) : 0;
    const elapsed = Date.now() - timestamp;

    if (timestamp > 0 && elapsed > FIVE_MINUTES_MS) {
      // 5-minute timeout expired -> auto-close specific course and open all courses
      setActiveCourseId(null);
      setActiveCourse(null);
      localStorage.removeItem("active_course_id");
      localStorage.removeItem("active_course_timestamp");
      return;
    } else if (!timestamp && activeCourseId) {
      safeSetItem("active_course_timestamp", Date.now().toString());
    }

    if (courses.length > 0) {
      const found = courses.find(c => c.id === activeCourseId);
      if (found) {
        setActiveCourse(found);
      } else {
        // Course was deleted or missing -> reset to open all courses view
        setActiveCourse(null);
        setActiveCourseId(null);
        localStorage.removeItem("active_course_id");
        localStorage.removeItem("active_course_timestamp");
      }
    } else if (!loading) {
      // Courses finished loading and course not found
      setActiveCourse(null);
      setActiveCourseId(null);
      localStorage.removeItem("active_course_id");
      localStorage.removeItem("active_course_timestamp");
    }
  }, [activeCourseId, courses, loading]);

  useEffect(() => {
    if (activeCourseId) {
      safeSetItem("active_course_id", activeCourseId);
      if (!localStorage.getItem("active_course_timestamp")) {
        safeSetItem("active_course_timestamp", Date.now().toString());
      }
    } else {
      localStorage.removeItem("active_course_id");
      localStorage.removeItem("active_course_timestamp");
    }
  }, [activeCourseId]);

  const [showMobileSyllabus, setShowMobileSyllabus] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [courseToStart, setCourseToStart] = useState<any | null>(null);
  
  // Voice Upload States for Listening Tests
  const [uploadedVoiceUrl, setUploadedVoiceUrl] = useState<string | null>(null);
  const [uploadedVoiceName, setUploadedVoiceName] = useState<string | null>(null);
  const stickyAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleCustomVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVoiceUrl(url);
      setUploadedVoiceName(file.name);
    }
  };

  const handleResetToDefaultVoice = () => {
    setUploadedVoiceUrl(null);
    setUploadedVoiceName(null);
    if (stickyAudioRef.current) {
      stickyAudioRef.current.load();
    }
  };
  
  // Lecture Interface State
  const [activeModuleIdx, setActiveModuleIdx] = useState<number>(() => Number(localStorage.getItem("active_module_idx") || 0));
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(() => Number(localStorage.getItem("active_lesson_idx") || 0));
  const [activePartIdx, setActivePartIdx] = useState<number>(() => Number(localStorage.getItem("active_part_idx") || 0));
  const [activeCourseSectionIdx, setActiveCourseSectionIdx] = useState<number>(0);

  useEffect(() => {
    setActiveCourseSectionIdx(0);
  }, [activeCourseId]);

  useEffect(() => {
    // Reset custom uploaded voice when transitioning lectures/parts
    setUploadedVoiceUrl(null);
    setUploadedVoiceName(null);
  }, [activeCourseId, activeModuleIdx, activeLessonIdx, activePartIdx]);

  useEffect(() => {
    safeSetItem("active_module_idx", activeModuleIdx.toString());
  }, [activeModuleIdx]);

  useEffect(() => {
    safeSetItem("active_lesson_idx", activeLessonIdx.toString());
  }, [activeLessonIdx]);

  useEffect(() => {
    safeSetItem("active_part_idx", activePartIdx.toString());
  }, [activePartIdx]);

  // Ensure module and lesson indices stay within valid bounds for activeCourse
  useEffect(() => {
    if (activeCourse) {
      if (activeCourse.course_format === "four_skills") {
        if (activePartIdx > 3 || activePartIdx < 0) {
          setActivePartIdx(0);
        }
        return;
      }

      const mods = activeCourse.modules;
      if (!mods || !Array.isArray(mods) || mods.length === 0) {
        if (activeModuleIdx !== 0) setActiveModuleIdx(0);
        if (activeLessonIdx !== 0) setActiveLessonIdx(0);
        return;
      }
      
      const maxMod = mods.length - 1;
      let validMod = activeModuleIdx;
      if (validMod > maxMod || validMod < 0) {
        validMod = 0;
        setActiveModuleIdx(0);
      }

      const mod = mods[validMod];
      const lessons = mod?.lessons || [];
      const maxLes = Math.max(0, lessons.length - 1);
      let validLes = activeLessonIdx;
      if (validLes > maxLes || validLes < 0) {
        validLes = 0;
        setActiveLessonIdx(0);
      }

      const les = lessons[validLes];
      const parts = les?.parts || [];
      if (parts.length > 0) {
        const maxPart = parts.length - 1;
        if (activePartIdx > maxPart || activePartIdx < 0) {
          setActivePartIdx(0);
        }
      }
    }
  }, [activeCourse, activeModuleIdx, activeLessonIdx, activePartIdx]);
  
  // Interactive Quiz Engine State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem("quiz_answers_state");
    return saved ? JSON.parse(saved) : {};
  });
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(() => {
    return localStorage.getItem("quiz_submitted_state") === "true";
  });
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number; percent: number } | null>(() => {
    const saved = localStorage.getItem("quiz_score_state");
    return saved ? JSON.parse(saved) : null;
  });

  // Interactive Voice Recording & Practice State
  const [isRecordingMap, setIsRecordingMap] = useState<Record<string, boolean>>({});
  const [recordingDurationMap, setRecordingDurationMap] = useState<Record<string, number>>({});
  const [voiceAudioUrlMap, setVoiceAudioUrlMap] = useState<Record<string, string | null>>(() => {
    const saved = localStorage.getItem("voice_audio_urls");
    return saved ? JSON.parse(saved) : {};
  });
  const [voiceTranscriptMap, setVoiceTranscriptMap] = useState<Record<string, string>>({});

  // Speaking Analysis State
  const [speakingAnalysisMap, setSpeakingAnalysisMap] = useState<Record<string, any>>({});
  const [analyzingMap, setAnalyzingMap] = useState<Record<string, boolean>>({});

  const handleAnalyzeSpeakingResponse = async (qId: string, questionText: string, expectedAnswer?: string) => {
    const audio64 = voiceAudioUrlMap[qId];
    if (!audio64) return;

    setAnalyzingMap(prev => ({ ...prev, [qId]: true }));
    try {
      const response = await fetch("/api/gemini/analyze-speaking-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: audio64,
          questionText: questionText,
          questionAnswer: expectedAnswer || "",
          duration: recordingDurationMap[qId] || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();
      setSpeakingAnalysisMap(prev => ({ ...prev, [qId]: result }));
      
      if (result.transcript) {
        setVoiceTranscriptMap(prev => ({ ...prev, [qId]: result.transcript }));
      }
    } catch (err: any) {
      console.error("Failed to analyze speaking response:", err);
    } finally {
      setAnalyzingMap(prev => ({ ...prev, [qId]: false }));
    }
  };

  const renderSpeakingAnalysis = (qId: string, questionText: string, expectedAnswer?: string) => {
    const isAnalyzing = analyzingMap[qId];
    const analysis = speakingAnalysisMap[qId];
    const hasAudio = !!voiceAudioUrlMap[qId];

    if (!hasAudio) return null;

    return (
      <div className="mt-3 space-y-3 w-full max-w-xl">
        {!analysis && !isAnalyzing && (
          <Button
            size="sm"
            onClick={() => handleAnalyzeSpeakingResponse(qId, questionText, expectedAnswer)}
            className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-black uppercase text-[10px] tracking-widest h-9 shadow-md flex items-center gap-1.5 transition-all hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Analyze Spoken Response (AI)
          </Button>
        )}

        {isAnalyzing && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 italic">Gemini is listening & grading...</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-3/4 animate-pulse"></div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        )}

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Header with overall band */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Gemini AI Expert Evaluation</span>
              </div>
              {analysis.overallBand && (
                <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs font-black flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  BAND {analysis.overallBand}
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Transcript */}
              {analysis.transcript && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider block">AI Spoken Transcript</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    "{analysis.transcript}"
                  </p>
                </div>
              )}

              {/* Grid of criteria scores & comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Fluency & Coherence", res: analysis.criteria?.fluencyCoherence },
                  { label: "Lexical Resource", res: analysis.criteria?.lexicalResource },
                  { label: "Grammar Range", res: analysis.criteria?.grammaticalRange },
                  { label: "Pronunciation", res: analysis.criteria?.pronunciation }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="text-[10px] font-black text-indigo-500">BAND {item.res?.band || "N/A"}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug italic">
                      {item.res?.comment || "No detailed feedback provided."}
                    </p>
                  </div>
                ))}
              </div>

              {/* Overall Suggestions */}
              {analysis.suggestions && (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" /> Coaching Suggestions
                  </span>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
                    {analysis.suggestions}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Writing Assessment State
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("writing_answers_state");
    return saved ? JSON.parse(saved) : {};
  });
  const [writingSubmitted, setWritingSubmitted] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("writing_submitted_state");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (activeCourse) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeCourse]);

  useEffect(() => {
    safeSetItem("quiz_answers_state", JSON.stringify(quizAnswers));
  }, [quizAnswers]);

  useEffect(() => {
    safeSetItem("quiz_submitted_state", quizSubmitted.toString());
  }, [quizSubmitted]);

  useEffect(() => {
    if (quizScore) safeSetItem("quiz_score_state", JSON.stringify(quizScore));
    else localStorage.removeItem("quiz_score_state");
  }, [quizScore]);

  useEffect(() => {
    safeSetItem("writing_answers_state", JSON.stringify(writingAnswers));
  }, [writingAnswers]);

  useEffect(() => {
    safeSetItem("voice_audio_urls", JSON.stringify(voiceAudioUrlMap));
  }, [voiceAudioUrlMap]);

  // Internal Course Card component for reuse and cleaner code
  const CourseCard = ({ course, isCompact = false }: { course: any, isCompact?: boolean }) => {
    // Calculate progress for dashboard cards
    const lessons = course.modules?.flatMap((m: any) => m.lessons || []) || [];
    const completedCount = lessons.filter((l: any) => completedLessons.includes(l.id)).length;
    const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
    
    const courseScores = safeGetItemAndParse<Record<string, any>>("course_scores", {});
    const highestScore = courseScores[course.id];

    return (
      <Card 
        key={course.id} 
        onClick={() => setCourseToStart(course)}
        className={`group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:border-primary/30 transition-all duration-500 flex flex-col h-full shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 card-border-effect cursor-pointer ${isCompact ? 'p-1' : ''}`}
      >
        {/* Thumbnail Area */}
        <div className={`relative overflow-hidden shrink-0 ${isCompact ? 'aspect-[2/1] rounded-[2rem]' : 'aspect-video'}`}>
          <img 
            src={course.featured_image || course.thumbnail_url || "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format,compress&fm=webp&w=800&q=75"} 
            alt={course.title} 
            loading="lazy"
            decoding="async"
            width={800}
            height={450}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
          
          {/* Skill Badge */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            {course.isMediaCourse ? (
              <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 border-none text-white font-black text-[9px] uppercase tracking-wider px-3 py-1 shadow-lg flex items-center gap-1.5">
                {course.mediaType === "audio" ? <Volume2 className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                {course.mediaType === "audio" ? "Audio Podcast" : "Video Masterclass"}
              </Badge>
            ) : (
              <Badge className="bg-white/20 backdrop-blur-md border-white/30 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1">
                {course.course_type || "Reading"}
              </Badge>
            )}
            {course.test_number && (
              <Badge className="bg-indigo-600 border-none text-white font-black text-[9px] uppercase tracking-wider px-3 py-1 shadow-md">
                Test #{course.test_number}
              </Badge>
            )}
            {course.isMediaCourse && (course.total_episodes || lessons.length > 0) && (
              <Badge className="bg-black/60 backdrop-blur-md border border-white/20 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1">
                {course.total_episodes || lessons.length} Lessons
              </Badge>
            )}
          </div>

          {/* Tier Badge */}
          <div className="absolute top-4 right-4 flex gap-2">
            {(course.access_tier === "Pro Premium" || course.modules?.[0]?.access_tier === "Pro Premium") && (
              <Badge className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-none font-black text-[9px] uppercase tracking-wider px-3 py-1 shadow-md">
                ✨ Pro Premium
              </Badge>
            )}
            {(course.access_tier === "Mastery Ultimate" || course.modules?.[0]?.access_tier === "Mastery Ultimate") && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-none font-black text-[9px] uppercase tracking-wider px-3 py-1 shadow-md">
                💎 Mastery Ultimate
              </Badge>
            )}
            {course.access_tier === "Free Trial" && (
              <Badge className="bg-emerald-500/80 backdrop-blur-md text-white border-none font-black text-[9px] uppercase tracking-wider px-3 py-1 shadow-md">
                🌿 Free Access
              </Badge>
            )}
          </div>

          {/* Locked overlay */}
          {!checkCourseAccess(userPlan, course.access_tier || "Free Trial") && (
            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          )}

          {/* Play/Lock Hover Overlay */}
          {checkCourseAccess(userPlan, course.access_tier || "Free Trial") ? (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
               <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 ring-4 ring-white/20">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
               <div className="w-16 h-16 rounded-full bg-slate-950/80 text-white flex items-center justify-center shadow-xl ring-4 ring-white/20">
                  <Lock className="w-6 h-6 text-white" />
               </div>
            </div>
          )}

          {/* Highest Score Overlay */}
          {highestScore !== undefined && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 shadow-xl">
              <Award className={`w-3.5 h-3.5 ${highestScore >= 90 ? 'text-amber-400' : highestScore >= 70 ? 'text-slate-300' : 'text-amber-700'}`} />
              <span className={`text-[10px] font-black tracking-wider uppercase ${highestScore >= 90 ? 'text-amber-400' : 'text-white'}`}>
                {highestScore}% Score
              </span>
            </div>
          )}
        </div>

        <CardContent className={`${isCompact ? 'p-5' : 'p-7'} flex-1 flex flex-col space-y-5`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
               <span className="text-[10px] font-black tracking-widest text-primary uppercase">{course.type || "Academic"}</span>
               <span className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                 {course.isMediaCourse && course.instructor ? `Instructor: ${course.instructor}` : "Target 7.5+"}
               </span>
               {course.isMediaCourse && course.total_duration && (
                 <>
                   <span className="w-1 h-1 rounded-full bg-slate-300" />
                   <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase flex items-center gap-1">
                     <Clock className="w-3 h-3 inline" /> {course.total_duration}
                   </span>
                 </>
               )}
            </div>
            <h4 className={`${isCompact ? 'text-lg' : 'text-xl'} font-bold text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-primary transition-colors`}>{course.title}</h4>
            {!isCompact && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">{course.description}</p>}
          </div>

          {isDashboardMode && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                <span>Progress</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            {checkCourseAccess(userPlan, course.access_tier || "Free Trial") ? (
              <Button 
                className={`w-full rounded-2xl ${isCompact ? 'h-10' : 'h-12'} font-black uppercase text-xs tracking-widest gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-primary hover:text-white transition-all shadow-md group-hover:shadow-primary/20`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUserLoggedIn()) {
                    toast.error("Sign In Required", {
                      description: "Please sign in to take courses and access full practice modules."
                    });
                    navigate("/login", { state: { from: location.pathname } });
                    return;
                  }
                  setCourseToStart(course);
                }}
              >
                {course.isMediaCourse ? (
                  <>
                    {course.mediaType === "audio" ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    {isDashboardMode && progress > 0 ? "Resume Episode" : course.mediaType === "audio" ? "Listen Series" : "Watch Masterclass"}
                  </>
                ) : (
                  <>
                    {isDashboardMode && progress > 0 ? "Continue" : "Start Track"}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button 
                className={`w-full rounded-2xl ${isCompact ? 'h-10' : 'h-12'} font-black uppercase text-xs tracking-widest gap-2 bg-gradient-to-r from-indigo-650 to-violet-750 text-white hover:opacity-90 transition-all shadow-md`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUserLoggedIn()) {
                    toast.error("Sign In Required", {
                      description: "Please sign in to take courses and access full practice modules."
                    });
                    navigate("/login", { state: { from: location.pathname } });
                    return;
                  }
                  setCourseToStart(course);
                }}
              >
                <Lock className="w-3.5 h-3.5 mr-1" /> Unlock {course.access_tier || "Premium"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    const syncState = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('profiles')
        .select('current_state')
        .eq('id', user.id)
        .single();

      const currentState = {
        ...(existing?.current_state || {}),
        activeCourseId,
        activeCourseTimestamp: activeCourseId ? (localStorage.getItem("active_course_timestamp") || Date.now().toString()) : null,
        activeModuleIdx,
        activeLessonIdx,
        activePartIdx,
        quizAnswers,
        writingAnswers
      };

      await supabase
        .from('profiles')
        .update({ current_state: currentState })
        .eq('id', user.id);
    };

    const timer = setTimeout(syncState, 2000); // Debounce sync
    return () => clearTimeout(timer);
  }, [activeCourseId, activeModuleIdx, activeLessonIdx, activePartIdx, quizAnswers, writingAnswers]);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem("completed_lessons");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeSetItem("completed_lessons", JSON.stringify(completedLessons));
  }, [completedLessons]);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const durationIntervalRef = useRef<any>(null);
  const activeRecordIdRef = useRef<string | null>(null);

  const pendingModule = activeCourse?.modules?.[activeModuleIdx];
  const pendingLesson = pendingModule?.lessons?.[activeLessonIdx];
  const currentLessonKey = pendingLesson?.id || `${activeModuleIdx}_${activeLessonIdx}`;

  const [lessonTimers, setLessonTimers] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("course_lesson_timers");
    return saved ? JSON.parse(saved) : {};
  });
  const [lessonTimeUp, setLessonTimeUp] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("course_lesson_timeup");
    return saved ? JSON.parse(saved) : {};
  });

  // Persistent Timer Savings
  useEffect(() => {
    if (Object.keys(lessonTimers).length > 0) {
      safeSetItem("course_lesson_timers", JSON.stringify(lessonTimers));
    }
    if (Object.keys(lessonTimeUp).length > 0) {
      safeSetItem("course_lesson_timeup", JSON.stringify(lessonTimeUp));
    }
  }, [lessonTimers, lessonTimeUp]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleExitAttempt = () => {
    if (activeCourse) {
      setShowExitConfirm(true);
    } else {
      setActiveCourseId(null);
      navigate(isDashboardMode ? "/dashboard/courses" : "/courses");
    }
  };

  const confirmExit = () => {
    navigate(isDashboardMode ? "/dashboard/courses" : "/courses");
    setActiveCourseId(null);
    setActiveCourse(null);
    setShowExitConfirm(false);
    
    // Reset session timers and their persistent storage
    setLessonTimers({});
    setLessonTimeUp({});
    localStorage.removeItem("course_lesson_timers");
    localStorage.removeItem("course_lesson_timeup");
    localStorage.removeItem("active_course_id");
    localStorage.removeItem("active_course_timestamp");
    
    // Reset course progress indices
    setActiveModuleIdx(0);
    setActiveLessonIdx(0);
    setActivePartIdx(0);
    
    // Reset quiz states
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    localStorage.removeItem("quiz_answers_state");
    localStorage.removeItem("quiz_submitted_state");
    localStorage.removeItem("quiz_score_state");
    
    // Clear quiz and progress indices from storage
    localStorage.removeItem("active_course_id");
    localStorage.removeItem("active_course_timestamp");
    localStorage.removeItem("active_module_idx");
    localStorage.removeItem("active_lesson_idx");
    localStorage.removeItem("active_part_idx");
    
    // Ensure body scroll is restored immediately
    document.body.style.overflow = '';
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find the resume course among filtered ones
  const activeStoredId = localStorage.getItem("active_course_id");
  const resumeCourse = isDashboardMode && currentViewCourses.length > 0 
    ? (currentViewCourses.find(c => c.id === activeStoredId) || currentViewCourses[0])
    : null;

  useEffect(() => {
    if (!pendingLesson) return;
    if (pendingLesson.hasTimer && pendingLesson.timeLimit) {
      setLessonTimers(prev => {
        if (prev[currentLessonKey] === undefined) {
          return { ...prev, [currentLessonKey]: pendingLesson.timeLimit * 60 };
        }
        return prev;
      });
      setLessonTimeUp(prev => {
        if (prev[currentLessonKey] === undefined) {
          return { ...prev, [currentLessonKey]: false };
        }
        return prev;
      });
    }
  }, [currentLessonKey, pendingLesson?.hasTimer, pendingLesson?.timeLimit]);

  useEffect(() => {
    if (!pendingLesson || !pendingLesson.hasTimer) return;
    
    // Using a ref to track if we need to update state to prevent dependency cycles
    const timerId = setInterval(() => {
      let shouldClearInterval = false;
      let shouldSetTimeUp = false;

      setLessonTimers(prev => {
        const current = prev[currentLessonKey];
        if (current === undefined || current <= 0) {
          if (current <= 0 && !lessonTimeUp[currentLessonKey]) {
            shouldSetTimeUp = true;
          }
          return prev;
        }
        
        if (current <= 1) {
          shouldClearInterval = true;
          shouldSetTimeUp = true;
          return { ...prev, [currentLessonKey]: 0 };
        }
        return { ...prev, [currentLessonKey]: current - 1 };
      });

      if (shouldClearInterval) clearInterval(timerId);
      if (shouldSetTimeUp) setLessonTimeUp(prev => ({ ...prev, [currentLessonKey]: true }));
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [currentLessonKey, pendingLesson?.hasTimer, lessonTimeUp]);

  const startVoiceRecording = async (qId: string = 'global') => {
    setVoiceAudioUrlMap(prev => ({ ...prev, [qId]: null }));
    setVoiceTranscriptMap(prev => ({ ...prev, [qId]: "" }));
    setRecordingDurationMap(prev => ({ ...prev, [qId]: 0 }));
    audioChunksRef.current = [];
    activeRecordIdRef.current = qId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && activeRecordIdRef.current === qId) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (activeRecordIdRef.current === qId) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
             const base64data = reader.result as string;
             setVoiceAudioUrlMap(prev => ({ ...prev, [qId]: base64data }));
             setQuizAnswers(prev => ({ ...prev, [qId]: base64data }));
          };
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecordingMap(prev => ({ ...prev, [qId]: true }));

      durationIntervalRef.current = setInterval(() => {
        setRecordingDurationMap(prev => ({ ...prev, [qId]: (prev[qId] || 0) + 1 }));
      }, 1000);

      // Web Speech API configuration
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
          if (currentTranscript.trim() && activeRecordIdRef.current === qId) {
            setVoiceTranscriptMap(prev => ({ ...prev, [qId]: currentTranscript.trim() }));
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition mistake in COURSE voice stage:", e);
        };

        rec.start();
        (mediaRecorder as any).speechRec = rec;
      }
    } catch (err) {
      console.error("Failed to access system inputs for voice analysis:", err);
    }
  };

  const stopVoiceRecording = (qId: string = 'global') => {
    if (mediaRecorderRef.current && isRecordingMap[qId]) {
      if (mediaRecorderRef.current.speechRec) {
        try {
          mediaRecorderRef.current.speechRec.stop();
        } catch (e) {
          console.warn(e);
        }
      }
      mediaRecorderRef.current.stop();
      activeRecordIdRef.current = null;
      setIsRecordingMap(prev => ({ ...prev, [qId]: false }));
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const formatRecordTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Sync course scores from Supabase
    if (supabase) {
      const syncScores = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('student_course_scores').select('course_id, score').eq('student_id', user.id);
          if (data && data.length > 0) {
             const localScores = safeGetItemAndParse<Record<string, any>>('course_scores', {});
             let updated = false;
             data.forEach((r: any) => {
                if (!localScores[r.course_id] || r.score > localScores[r.course_id]) {
                   localScores[r.course_id] = r.score;
                   updated = true;
                }
             });
             if (updated) {
               safeSetItem('course_scores', JSON.stringify(localScores));
               // Trigger a re-render of course cards by refreshing completed lessons slightly
               setCompletedLessons(prev => [...prev]);
             }
          }
        }
      };
      syncScores();
    }
    loadLearningData();

    const handleDataUpdate = () => {
      loadLearningData();
    };

    window.addEventListener("mock_media_courses_updated", handleDataUpdate);
    window.addEventListener("media_courses_changed", handleDataUpdate);
    window.addEventListener("mock_courses_updated", handleDataUpdate);
    window.addEventListener("storage", handleDataUpdate);

    return () => {
      window.removeEventListener("mock_media_courses_updated", handleDataUpdate);
      window.removeEventListener("media_courses_changed", handleDataUpdate);
      window.removeEventListener("mock_courses_updated", handleDataUpdate);
      window.removeEventListener("storage", handleDataUpdate);

      // Cleanup any active recordings in Courses on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch(e) {}
      }
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  const loadLearningData = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        // Safe developer mode local load
        let localC = safeGetItemAndParse<any[] | null>('mock_courses', null);
        let localQ = safeGetItemAndParse<any[] | null>('mock_quizzes', null);
        
        if (!localC || localC.length === 0) {
          localC = [
            {
              id: "course-writing-band9",
              title: "IELTS Writing Task 2 Masterclass",
              type: "Writing",
              difficulty: "Advanced",
              level: "8.0+",
              description: "Achieve stellar marks with our complete formulaic paragraph guides, argument blueprint models, and premium vocab grids compiled by senior exam supervisors.",
              featured_image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=60",
              modules: [
                {
                  id: "m1-intro",
                  title: "Introduction Formulas",
                  lessons: [
                    { 
                      id: "m1-l1", 
                      title: "1. The Paraphrasing Hack", 
                      type: "TEXT",
                      content: "# The Paraphrasing Hack\nTo achieve band 8.0+ in Task 2, you must demonstrate lexical resource from the first sentence.\n\n## The Three-Step Process:\n1. **Identify Key Synonyms**: Substitute nouns with academic alternatives.\n2. **Invert the Syntax**: If the prompt is Active, make it Passive.\n3. **Add a Concession Line**: Introduce a balanced sub-clause outlining the opponent's view.\n\n### Exemplary Model Prompts:\n> *Prompt: Some people believe that history is a crucial school subject.*\n> *Paraphrase: It is frequently argued by some circles that historical education holds paramount importance in academic curricula.*"
                    },
                    {
                      id: "m1-l2",
                      title: "2. Structuring Thesis Statements",
                      type: "VIDEO",
                      content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    }
                  ]
                },
                {
                  id: "m2-body",
                  title: "Body Paragraph Architecture",
                  lessons: [
                    {
                      id: "m2-l1",
                      title: "1. PEEL Paragraph Builder",
                      type: "TEXT",
                      content: "# The PEEL Paragraph Framework\n\nEvery high-scoring body paragraph must satisfy the **PEEL** system:\n\n- **P**oint: Introduce the primary analytical claim.\n- **E**xplanation: Elaborate on structural mechanisms or logical reasons.\n- **E**xample: Give a concrete factual or statistical example.\n- **L**ink: Connect the reason back to your custom thesis position.\n\n### Exemplary Practice:\nAlways maintain one core claim per block to maximize Coherence and Cohesion."
                    },
                    {
                      id: "m2-l2",
                      title: "2. Argumentative Practice Quiz",
                      type: "QUIZ",
                      linkedQuizId: "quiz-writing-1",
                      quizType: "MASTER_QUIZ"
                    }
                  ]
                }
              ],
              status: "Published",
              created_at: new Date().toISOString()
            },
            {
              id: "course-speaking-band9",
              title: "IELTS Speaking Band 9.0 Strategy",
              type: "Speaking",
              difficulty: "All Levels",
              level: "7.5 - 9.0",
              description: "Learn fluency markers, native idiom pairings, and structural speech templates allowing you to articulate without strategic pausing in Part 1, 2, and 3.",
              featured_image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60",
              modules: [
                {
                  id: "sp-m1",
                  title: "Fluency & Coherence Secrets",
                  lessons: [
                    {
                      id: "sp-m1-l1",
                      title: "1. Eliminating Pause Fillers",
                      type: "TEXT",
                      content: "# Fluency & Coherence Strategy\nStop using paused fillers like 'uh' or 'um'. Replace them with advanced conversational stalling markers to hold the floor.\n\n## Elite Stalling Templates:\n- *'That is a highly intriguing question, and to be quite frank,...'*\n- *'I have never given that a great deal of thought previously, but off the top of my head...'*\n\n### Speaking Part 2 Tip:\nWrite chronological mind-maps during your 1-minute planning time to structure your speech."
                    }
                  ]
                }
              ],
              status: "Published",
              created_at: new Date().toISOString()
            },
            {
              id: "course-reading-band9",
              title: "IELTS Reading Academic Secrets",
              type: "Reading",
              difficulty: "Advanced",
              level: "7.5+",
              description: "Master paragraph headings matching, keyword scanning logic, and True/False/Not Given strategies using our genuine exam split-screen interface.",
              featured_image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&auto=format&fit=crop&q=60",
              modules: [
                {
                  id: "rm1-skills",
                  title: "Core Reading Operations",
                  lessons: [
                    {
                      id: "rm1-l1",
                      title: "1. Mobile Money Transfers by Safaricom",
                      type: "READING",
                      content: "# Reading Passage: Money Transfers by Mobile\n\n**Paragraph A**\nThe rise of mobile telephony in East Africa has driven substantial economic transformations, most notably exemplified by Safaricom's M-Pesa utility in Kenya. Launched in 2007, M-Pesa enables users to deposit, withdraw, and transfer funds through a simple system of SMS text messages. Over a decade later, the mobile banking network processes transactions representing a massive proportion of Kenya's gross domestic product, bridging the financial divide for millions of previously unbanked citizens.\n\n**Paragraph B**\nPrior to M-Pesa's inception, sending cash safely across distances was an arduous task. Kenyans working in urban capitals like Nairobi who wanted to support their families in remote farming regions had to rely on buses, courier agents, or informal networks—methods that carried high risks of theft, delay, and extreme commission rates. By leveraging Safaricom's network, customers could visit a local registered shop or telecom kiosk, and convert paper currency into electronic credit balances almost instantly.\n\n**Paragraph C**\nSafaricom, Kenya's largest telecommunications firm, acts as the primary operator of this system, working in technological alliance with Vodafone. Transactions do not require high-end smartphones or expensive internet connections; simple mobile telephony devices with basic cellular capability are fully adequate. This technology's lightweight infrastructure has allowed microscopic retail agents, corner grocers, gas stations, and even roadside pharmacies to act as physical banking outposts, bypassing traditional commercial brick-and-mortar networks entirely.\n\n**Paragraph D**\nSome critics initially wondered if the service would charge high commissions on micro-transfers. However, Safaricom's transaction rates remained surprisingly reasonable for micro-transfers, though they increment relative to larger transfer volumes. To prevent illegal laundering, stringent rules limit transaction ceilings. International development organizations have studied this digital economic ecosystem in order to design replication solutions in other neighboring emerging markets.",
                      questions: [
                        {
                          id: "rq-1",
                          type: "TF",
                          text: "Most Kenyans working in urban areas have family members living in country sides.",
                          options: ["TRUE", "FALSE", "NOT GIVEN"],
                          correctIndex: 0
                        },
                        {
                          id: "rq-2",
                          type: "TF",
                          text: "Safaricom charge more with high-value transactions than smaller ones.",
                          options: ["TRUE", "FALSE", "NOT GIVEN"],
                          correctIndex: 0
                        },
                        {
                          id: "rq-3",
                          type: "TF",
                          text: "M-Pesa was originally developed by an international foundation.",
                          options: ["TRUE", "FALSE", "NOT GIVEN"],
                          correctIndex: 1
                        },
                        {
                          id: "rq-4",
                          type: "MCQ",
                          text: "What did Kenyans rely on to send money before M-Pesa's launch?",
                          options: ["National credit unions", "Buses, courier agents, or informal networks", "Automated teller machines (ATMs)", "Direct bank-to-bank wire transfers"],
                          correctIndex: 1
                        },
                        {
                          id: "rq-5",
                          type: "MCQ",
                          text: "Which global carrier is Safaricom's primary technological partner?",
                          options: ["AT&T Corporation", "Safaricom plc", "Vodafone Group plc", "Deutsche Telekom"],
                          correctIndex: 2
                        },
                        {
                          id: "rq-6",
                          type: "BLANK",
                          text: "M-Pesa converts standard paper currency into credit ________.",
                          correctAnswer: "balances"
                        },
                        {
                          id: "rq-7",
                          type: "BLANK",
                          text: "Lightweight cellular technology enables registered gas stations and roadside shops to serve as banking ________.",
                          correctAnswer: "outposts"
                        }
                      ]
                    }
                  ]
                }
              ],
              status: "Published",
              created_at: new Date().toISOString()
            }
          ];
          safeSetItem('mock_courses', JSON.stringify(localC));
        }

        if (!localQ || localQ.length === 0) {
          localQ = [
            {
              id: "quiz-writing-1",
              title: "Argumentative Cohesion Quiz",
              description: "Assess your ability to link sentences cleanly.",
              course_id: "course-writing-band9",
              questions: [
                {
                  id: "q-write-1",
                  text: "Which cohesive device is most appropriate for introducing an opposing viewpoint in a high-band essay?",
                  options: ["On the other hand", "Conversely", "That being said", "While it could be argued that"],
                  correctIndex: 3
                },
                {
                  id: "q-write-2",
                  text: "What does the 'L' in the PEEL paragraph framework represent?",
                  options: ["Lecture", "Logical explanation", "Link back to thesis", "Lexical resource"],
                  correctIndex: 2
                }
              ],
              created_at: new Date().toISOString()
            }
          ];
          safeSetItem('mock_quizzes', JSON.stringify(localQ));
        }

        let finalLocalCourses = localC || [];
        try {
          const mediaCourses = await fetchAllMediaCourses();
          finalLocalCourses = mergeCoursesWithMedia(finalLocalCourses, mediaCourses);
        } catch (mErr) {
          console.warn("Could not fetch media courses for local dev catalog:", mErr);
        }

        setCourses(sortCoursesList(finalLocalCourses));
        setQuizzes(localQ);
        
        const savedCompleted = localStorage.getItem("completed_lessons");
        if (savedCompleted) setCompletedLessons(JSON.parse(savedCompleted));
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
        }
        let userId = authUser?.id || session?.user?.id;

        const { data: profileData } = userId ? await supabase
          .from('profiles')
          .select('completed_lessons, current_state, plan')
          .eq('id', userId)
          .single() : { data: null };
        
        if (profileData) {
          if (profileData.completed_lessons) {
            setCompletedLessons(profileData.completed_lessons);
          }
          if (profileData.plan) {
            setUserPlan(profileData.plan);
          }
          if (profileData.current_state) {
            const state = profileData.current_state;
            const stateId = state.activeCourseId;
            const stateTime = state.activeCourseTimestamp || localStorage.getItem("active_course_timestamp");
            
            const parsedOnLoad = parseCoursePath(window.location.pathname);
            const isCatalogRoot = !parsedOnLoad && !routeCourseId && (window.location.pathname === "/courses" || window.location.pathname === "/dashboard/courses");

            if (stateId && stateTime && !isCatalogRoot) {
              const elapsed = Date.now() - Number(stateTime);
              if (elapsed <= FIVE_MINUTES_MS) {
                setActiveCourseId(stateId);
                safeSetItem("active_course_id", stateId);
                safeSetItem("active_course_timestamp", stateTime.toString());
              } else {
                setActiveCourseId(null);
                localStorage.removeItem("active_course_id");
                localStorage.removeItem("active_course_timestamp");
              }
            } else if (isCatalogRoot) {
              setActiveCourseId(null);
              localStorage.removeItem("active_course_id");
              localStorage.removeItem("active_course_timestamp");
            }
            if (state.activeModuleIdx !== undefined) setActiveModuleIdx(state.activeModuleIdx);
            if (state.activeLessonIdx !== undefined) setActiveLessonIdx(state.activeLessonIdx);
            if (state.activePartIdx !== undefined) setActivePartIdx(state.activePartIdx);
            if (state.quizAnswers) setQuizAnswers(state.quizAnswers);
            if (state.writingAnswers) setWritingAnswers(state.writingAnswers);
          }
        }

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*');
        
        if (coursesError) throw coursesError;

        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*');

        if (quizzesError) throw quizzesError;

        // Parse JSON columns in Supabase mode
        let parsedCourses = (coursesData || []).map(course => {
          let mods = course.modules;
          if (typeof mods === 'string') {
            try { mods = JSON.parse(mods); } catch { mods = []; }
          }
          return { ...course, modules: mods || [] };
        });

        try {
          const mediaCourses = await fetchAllMediaCourses();
          parsedCourses = mergeCoursesWithMedia(parsedCourses, mediaCourses);
        } catch (mErr) {
          console.warn("Could not fetch media courses for remote catalog:", mErr);
        }

        const parsedQuizzes = (quizzesData || []).map(qz => {
          let qs = qz.questions;
          if (typeof qs === 'string') {
            try { qs = JSON.parse(qs); } catch { qs = []; }
          }
          return { ...qz, questions: qs || [] };
        });

        setCourses(sortCoursesList(parsedCourses));
        setQuizzes(parsedQuizzes);
      }
    } catch (e) {
      console.error("Failed loading student workspace datasets:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // YouTube / Vimeo Embed url normalizer
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
    }
    match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return url;
  };

  // Parse custom styled text rows
  const renderRichBody = (content: string) => {
    if (!content) return <p className="text-slate-400 text-xs italic">No formatted notes written for this lecture.</p>;

    interface RichBlock {
      type: 'heading' | 'paragraph' | 'image' | 'audio' | 'video' | 'pdf' | 'table' | 'note' | 'tip' | 'band-descriptor' | 'divider';
      content: string;
      level?: number;
      url?: string;
      caption?: string;
      headers?: string[];
      rows?: string[][];
    }

    const parseRichContent = (text: string): RichBlock[] => {
      const lines = text.split(/\r?\n/);
      const blocks: RichBlock[] = [];
      let currentTableRows: string[] = [];
      let isInsideTable = false;

      const flushTable = () => {
        if (currentTableRows.length > 0) {
          const parsedRows = currentTableRows.map(line => {
            return line.split("|")
              .map(x => x.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          });
          const rowsFiltered = parsedRows.filter(r => r.length > 0 && !r.every(c => c.startsWith("---") || c === ""));
          if (rowsFiltered.length > 0) {
            const headers = rowsFiltered[0];
            const dataRows = rowsFiltered.slice(1);
            blocks.push({
              type: "table",
              content: "",
              headers: headers,
              rows: dataRows
            });
          }
          currentTableRows = [];
          isInsideTable = false;
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("|")) {
          isInsideTable = true;
          currentTableRows.push(lines[i]);
          continue;
        } else if (isInsideTable) {
          flushTable();
        }

        if (line === "") continue;

        // Audio Match
        const audioMatch = line.match(/\*\[Audio Track Embedded:\s*(.*?)\s*\]\*/i);
        if (audioMatch) {
          blocks.push({ type: "audio", content: "Audio", url: audioMatch[1] });
          continue;
        }

        // Video Match
        const videoMatch = line.match(/\*\[Video Embedded:\s*(.*?)\s*\]\*/i);
        if (videoMatch) {
          blocks.push({ type: "video", content: "Video", url: videoMatch[1] });
          continue;
        }

        // PDF Match
        const pdfMatch = line.match(/\*\[PDF Reference File:\s*(.*?)\s*\]\*/i);
        if (pdfMatch) {
          blocks.push({ type: "pdf", content: "PDF Document", url: pdfMatch[1] });
          continue;
        }

        // Image Match
        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/i);
        if (imgMatch) {
          let caption = "";
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith("*") && lines[i + 1].trim().endsWith("*")) {
            caption = lines[i + 1].trim().replace(/^\*|\*$/g, "");
            i++;
          }
          blocks.push({ type: "image", content: imgMatch[1], url: imgMatch[2], caption: caption });
          continue;
        }

        // Divider
        if (line === "---" || line === "***" || line === "--- ") {
          blocks.push({ type: "divider", content: "" });
          continue;
        }

        // Notes and Tips callouts
        if (line.startsWith(">")) {
          const textContent = line.replace(/^>\s*/, "").replace(/^\*\*(Note|Tip|Band Descriptor Advice):\*\*/i, "").trim();
          if (line.toLowerCase().includes("note:")) {
            blocks.push({ type: "note", content: textContent });
          } else if (line.toLowerCase().includes("tip:")) {
            blocks.push({ type: "tip", content: textContent });
          } else {
            blocks.push({ type: "band-descriptor", content: textContent });
          }
          continue;
        }

        // Headings
        if (line.startsWith("#")) {
          const level = line.match(/^#+/)?.[0].length || 1;
          const textContent = line.replace(/^#+\s*/, "");
          blocks.push({ type: "heading", content: textContent, level: level });
          continue;
        }

        // Bullet Items Replacement
        if (line.startsWith("*") || line.startsWith("-")) {
          const textContent = line.replace(/^[\*\-]\s*/, "");
          blocks.push({ type: "paragraph", content: `• ${textContent}` });
          continue;
        }

        // Default Paragraph
        blocks.push({ type: "paragraph", content: lines[i] });
      }

      flushTable();
      return blocks;
    };

    const getEmbedUrl = (url: string) => {
      if (!url) return "";
      if (url.includes("youtube.com/watch?v=")) {
        return url.replace("youtube.com/watch?v=", "youtube.com/embed/");
      }
      if (url.includes("youtu.be/")) {
        return url.replace("youtu.be/", "youtube.com/embed/");
      }
      return url;
    };

    const parsedBlocks = parseRichContent(content);

    return (
      <div className="space-y-4 text-slate-800 dark:text-slate-200 p-2">
        {parsedBlocks.map((b, idx) => {
          if (b.type === "heading") {
            const sizeClass = b.level === 1 ? "text-3xl font-black mb-4 mt-2" : b.level === 2 ? "text-2xl font-black mt-6 mb-3" : "text-xl font-black mt-5 mb-2";
            const hasHtml = /<[a-z][\s\S]*>/i.test(b.content);
            if (hasHtml) {
              return (
                <div 
                  key={idx} 
                  className={`${sizeClass} text-slate-900 dark:text-white tracking-tight leading-tight border-b border-slate-100 dark:border-white/5 pb-1 text-left`}
                  dangerouslySetInnerHTML={{ __html: b.content }}
                />
              );
            }
            return (
              <h3 key={idx} className={`${sizeClass} text-slate-900 dark:text-white tracking-tight leading-tight border-b border-slate-100 dark:border-white/5 pb-1`}>
                {b.content}
              </h3>
            );
          }

          if (b.type === "paragraph") {
            const hasHtml = /<[a-z][\s\S]*>/i.test(b.content);
            if (hasHtml) {
              return (
                <div 
                  key={idx} 
                  className="text-slate-755 dark:text-slate-300 leading-relaxed text-sm sm:text-base md:text-[1.025rem] my-2 text-left prose dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_video]:max-w-full [&_video]:rounded-xl [&_video]:my-3" 
                  dangerouslySetInnerHTML={{ __html: b.content }}
                />
              );
            }
            return (
              <p key={idx} className="text-slate-755 dark:text-slate-300 leading-relaxed text-sm sm:text-base md:text-[1.025rem] my-3.5 whitespace-pre-line font-medium text-left">
                {b.content}
              </p>
            );
          }

          if (b.type === "divider") {
            return <hr key={idx} className="my-6 border-slate-200 dark:border-white/10" />;
          }

          if (b.type === "image") {
            return (
              <div key={idx} className="my-6 p-2 bg-slate-100/50 dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-sm max-w-2xl mx-auto overflow-hidden">
                <img 
                  src={b.url} 
                  alt={b.content || "Course media"} 
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto rounded-2xl object-cover hover:scale-[1.005] transition-transform duration-300 shadow-sm" 
                />
                {b.caption && <p className="text-center text-xs text-slate-505 dark:text-slate-400 mt-2 font-black tracking-tight">{b.caption}</p>}
              </div>
            );
          }

          if (b.type === "audio") {
            return (
              <div key={idx} className="my-5 p-4 sm:p-5 bg-gradient-to-r from-blue-50/75 to-indigo-50/75 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-500/15 flex items-center gap-4 shadow-sm max-w-xl mx-auto font-sans text-left">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Audio Playback Channel</p>
                  {b.url ? (
                    <audio controls src={b.url} className="w-full mt-2 rounded-lg" controlsList="nodownload" />
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-2">No audio stream available</p>
                  )}
                </div>
              </div>
            );
          }

          if (b.type === "video") {
            return (
              <div key={idx} className="my-6 max-w-3xl mx-auto">
                <SecureVideoPlayer
                  url={b.url || ""}
                  title="IELTS Video Tutorial"
                  className="rounded-3xl"
                />
              </div>
            );
          }

          if (b.type === "pdf") {
            return (
              <div key={idx} className="my-5 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-4 max-w-xl mx-auto font-sans text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">{b.url?.split("/").pop() || "Reference Document.pdf"}</p>
                    <p className="text-[10px] text-slate-400 font-bold">PDF Reader Document</p>
                  </div>
                </div>
                <a 
                  href={b.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-sm"
                >
                  View File
                </a>
              </div>
            );
          }

          if (b.type === "table") {
            const hasHeaders = b.headers && b.headers.length > 0;
            return (
              <div key={idx} className="my-6 overflow-x-auto rounded-2xl border border-slate-150 dark:border-white/5 bg-white/50 dark:bg-slate-950/30 shadow-sm max-w-full font-sans">
                <table className="w-full text-left border-collapse">
                  {hasHeaders && (
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                        {b.headers?.map((h, hIdx) => (
                          <th key={hIdx} className="p-4 text-xs font-black uppercase text-slate-505 tracking-wider border-r border-slate-200/60 dark:border-white/5 last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 dark:border-white/5 last:border-b-0 hover:bg-slate-50/20 dark:hover:bg-slate-900/15">
                        {row.map((cell, cIdx) => {
                          const isBlank = cell.trim() === "____";
                          return (
                            <td key={cIdx} className={`p-4 text-xs font-bold border-r border-slate-100 dark:border-white/5 last:border-r-0 ${isBlank ? "text-primary italic animate-pulse font-black font-mono bg-primary/5 rounded" : "text-slate-700 dark:text-slate-300"}`}>
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          if (b.type === "note" || b.type === "tip" || b.type === "band-descriptor") {
            const isTip = b.type === "tip";
            const isBand = b.type === "band-descriptor";
            const bgClass = isTip ? "from-yellow-50/50 to-amber-50/50 dark:from-amber-950/10 dark:to-yellow-950/10 border-amber-200/50 dark:border-amber-500/10" : isBand ? "from-purple-50/50 to-indigo-50/50 dark:from-purple-950/10 dark:to-indigo-950/10 border-purple-200/50 dark:border-purple-500/10" : "from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20 border-slate-200 dark:border-white/5";
            const badgeText = isTip ? "Exam Tip" : isBand ? "IELTS Band Descriptor Advice" : "Lecture Note";
            const badgeBg = isTip ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" : isBand ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300";
            
            const hasHtml = /<[a-z][\s\S]*>/i.test(b.content);

            return (
              <div key={idx} className={`my-5 p-5 bg-gradient-to-r ${bgClass} rounded-2xl border flex flex-col gap-2 relative shadow-inner max-w-2xl mx-auto font-sans text-left`}>
                <div className="flex items-center">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>
                {hasHtml ? (
                  <div 
                    className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none text-left" 
                    dangerouslySetInnerHTML={{ __html: b.content }}
                  />
                ) : (
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-left">
                    {b.content}
                  </p>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  // Retrieve current active lesson schema
  const currentModule = activeCourse?.modules?.[activeModuleIdx];
  const currentLesson = currentModule?.lessons?.[activeLessonIdx];

  // Pick linked quiz schema if lesson relies on linked master quiz
  let currentQuizQuestions: any[] = [];
  let currentQuizTitle = "Interactive Evaluation";
  let currentQuizDesc = "Demonstrate comprehension rules configured by academic curators.";

  if (currentLesson) {
    if (currentLesson.parts && currentLesson.parts.length > 0) {
      const activePart = currentLesson.parts[activePartIdx];
      if (activePart) {
        let rawPartQs = activePart.questions || activePart.content?.questions || activePart.quiz?.questions || [];
        if ((!rawPartQs || rawPartQs.length === 0) && activePart.designer_blocks?.right) {
          rawPartQs = activePart.designer_blocks.right;
        }
        if ((!rawPartQs || rawPartQs.length === 0) && activePart.linkedQuizId) {
          const linked = quizzes.find(q => q.id === activePart.linkedQuizId);
          if (linked) rawPartQs = linked.questions || [];
        }
        if ((!rawPartQs || rawPartQs.length === 0) && currentLesson.linkedQuizId) {
          const linked = quizzes.find(q => q.id === currentLesson.linkedQuizId);
          if (linked) rawPartQs = linked.questions || [];
        }
        currentQuizQuestions = rawPartQs;
        currentQuizTitle = activePart.title || "Interactive Practice Block";
        currentQuizDesc = "Analyze reference paragraphs and select correct answers.";
      }
    } else {
      let rawLesQs = currentLesson.questions || currentLesson.content?.questions || currentLesson.quiz?.questions || [];
      if ((!rawLesQs || rawLesQs.length === 0) && currentLesson.designer_blocks?.right) {
        rawLesQs = currentLesson.designer_blocks.right;
      }
      if ((!rawLesQs || rawLesQs.length === 0) && currentLesson.linkedQuizId) {
        const linked = quizzes.find(q => q.id === currentLesson.linkedQuizId);
        if (linked) {
          rawLesQs = linked.questions || [];
          currentQuizTitle = linked.title || currentLesson.title;
          currentQuizDesc = linked.description || "Demonstrate comprehension rules configured by academic curators.";
        }
      } else {
        currentQuizTitle = String(currentLesson.type || "").toUpperCase().includes('READING') ? `Questions: ${currentLesson.title}` : `Practice: ${currentLesson.title}`;
        currentQuizDesc = "Analyze the reference text on the left and respond to the questions carefully.";
      }
      currentQuizQuestions = rawLesQs;
    }
  }

  currentQuizQuestions = flattenQuestionsToIndividual(currentQuizQuestions);

  const displayType = (currentLesson?.parts && currentLesson.parts.length > 0)
    ? (currentLesson.parts[activePartIdx]?.type || "TEXT")
    : (currentLesson?.type || "TEXT");

  const getCourseTestLabel = () => {
    const tNum = activeCourse?.test_number || (activeCourse?.modules?.[0]?.test_number) || "";
    if (!tNum) {
      return `Module ${activeModuleIdx + 1} • Lecture ${activeLessonIdx + 1} (${displayType})`;
    }
    
    // Detect if Reading, Writing, Listening, Speaking
    const format = (activeCourse?.course_format || "").toLowerCase();
    const titleLower = (activeCourse?.title || "").toLowerCase();
    const categoryLower = (activeCourse?.category || "").toLowerCase();
    
    let skill = "Reading"; // Default
    if (format.includes("listening") || titleLower.includes("listening") || categoryLower.includes("listening")) {
      skill = "Listening";
    } else if (format.includes("writing") || titleLower.includes("writing") || categoryLower.includes("writing")) {
      skill = "Writing";
    } else if (format.includes("speaking") || titleLower.includes("speaking") || categoryLower.includes("speaking")) {
      skill = "Speaking";
    } else if (format.includes("reading") || titleLower.includes("reading") || categoryLower.includes("reading")) {
      skill = "Reading";
    } else {
      // try to determine from current displayType or activePartIdx
      const dt = (displayType || "").toLowerCase();
      if (dt.includes("listening")) {
        skill = "Listening";
      } else if (dt.includes("writing")) {
        skill = "Writing";
      } else if (dt.includes("speaking")) {
        skill = "Speaking";
      } else if (dt.includes("reading")) {
        skill = "Reading";
      }
    }
    
    return `IELTS ${skill} Test ${tNum}`;
  };

  const isQuestionAnswered = (q: any, answers: any) => {
    const qType = q.type || 'MCQ';
    if (qType === 'MULTI_MCQ') {
      const ansArr = answers[q.id];
      return Array.isArray(ansArr) && ansArr.length > 0;
    }
    if (qType === 'INLINE_BLANKS') {
      const parts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i);
      const blanksCount = Math.max(0, parts.length - 1);
      if (blanksCount === 0) return true;
      for (let index = 0; index < blanksCount; index++) {
        if (answers[`${q.id}_${index}`] === undefined || answers[`${q.id}_${index}`]?.toString().trim() === "") {
          return false;
        }
      }
      return true;
    }
    if (qType === 'MATCHING') {
      const prompts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/\n/).filter(Boolean);
      if (prompts.length === 0) return true;
      for (let pIdx = 0; pIdx < prompts.length; pIdx++) {
        if (answers[`${q.id}_${pIdx}`] === undefined || answers[`${q.id}_${pIdx}`]?.toString().trim() === "") {
          return false;
        }
      }
      return true;
    }
    return answers[q.id] !== undefined && answers[q.id]?.toString().trim() !== "";
  };

  const checkIsCorrect = (q: any, answers: any) => {
    const qType = String(q.type || 'MCQ').toUpperCase();
    if (qType === 'MULTI_MCQ') {
      const studentAns = Array.isArray(answers[q.id]) ? answers[q.id] : [];
      const correctAns = Array.isArray(q.correctIndexes) ? q.correctIndexes : [getQuestionCorrectIndex(q)];
      if (studentAns.length !== correctAns.length) return false;
      return studentAns.every((idx: number) => correctAns.includes(idx)) && correctAns.every((idx: number) => studentAns.includes(idx));
    }
    if (qType === 'BLANK' || qType === 'PASSAGE') {
      const studentAns = (answers[q.id]?.toString() || "").trim().toLowerCase();
      const correctOptions = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(",").map((x: string) => x.trim().toLowerCase());
      return correctOptions.some((opt: string) => studentAns === opt && opt);
    } else if (qType === 'INLINE_BLANKS') {
      const parts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i);
      const blanksCount = Math.max(0, parts.length - 1);
      if (blanksCount === 0) return false;
      let allCorrect = true;
      for (let index = 0; index < blanksCount; index++) {
        const studentAns = (answers[`${q.id}_${index}`]?.toString() || "").trim().toLowerCase();
        const ansGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[index] || "";
        const correctOptions = ansGroup.split(",").map((x: string) => x.trim().toLowerCase());
        if (!correctOptions.some((opt: string) => studentAns === opt && opt)) {
          allCorrect = false;
        }
      }
      return allCorrect;
    } else if (qType === 'MATCHING') {
      const prompts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/\n/).filter(Boolean);
      if (prompts.length === 0) return false;
      let allCorrect = true;
      for (let pIdx = 0; pIdx < prompts.length; pIdx++) {
        const studentAns = (answers[`${q.id}_${pIdx}`]?.toString() || "").trim().toLowerCase();
        const correctAns = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(/\n/).filter(Boolean)[pIdx] || "";
        const correctOptions = correctAns.split(",").map((x: string) => x.trim().toLowerCase());
        if (!correctOptions.some((opt: string) => studentAns === opt && opt)) {
          allCorrect = false;
        }
      }
      return allCorrect;
    } else {
      const expectedIdx = getQuestionCorrectIndex(q);
      const userVal = answers[q.id];
      if (userVal === undefined || userVal === null || userVal === "") return false;
      if (typeof userVal === "number") {
        return userVal === expectedIdx;
      }
      if (typeof userVal === "string") {
        const numVal = parseInt(userVal.trim(), 10);
        if (!isNaN(numVal)) return numVal === expectedIdx;
        const userIdx = getQuestionCorrectIndex({ ...q, correctAnswer: userVal });
        return userIdx === expectedIdx;
      }
      return false;
    }
  };

  const getSubQuestionsForBlock = (q: any) => {
    const qType = q.type || 'MCQ';
    if (qType === 'INLINE_BLANKS') {
      const parts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i);
      const blanksCount = Math.max(0, parts.length - 1);
      return blanksCount || 1;
    }
    if (qType === 'MATCHING') {
      const prompts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/\n/).filter(Boolean);
      return prompts.length || 1;
    }
    return 1;
  };

  const getQuestionsForLessonAndPart = (mIdx: number, lIdx: number, pIdx?: number) => {
    const mod = activeCourse?.modules?.[mIdx];
    const lesson = mod?.lessons?.[lIdx];
    if (!lesson) return [];

    const getPartQuestions = (part: any) => {
      let qs = part.questions || part.content?.questions || part.quiz?.questions || [];
      if ((!qs || qs.length === 0) && part.designer_blocks?.right) {
        qs = part.designer_blocks.right;
      }
      if ((!qs || qs.length === 0) && part.linkedQuizId) {
        const linked = quizzes?.find(q => q.id === part.linkedQuizId);
        if (linked) qs = linked.questions || [];
      }
      if ((!qs || qs.length === 0) && lesson.linkedQuizId) {
        const linked = quizzes?.find(q => q.id === lesson.linkedQuizId);
        if (linked) qs = linked.questions || [];
      }
      return qs;
    };

    if (lesson.parts && lesson.parts.length > 0) {
      if (pIdx === undefined) {
        let allQs: any[] = [];
        lesson.parts.forEach((part: any) => {
          allQs = [...allQs, ...getPartQuestions(part)];
        });
        return allQs;
      } else {
        const part = lesson.parts[pIdx];
        if (part) return getPartQuestions(part);
      }
    } else {
      let qs = lesson.questions || lesson.content?.questions || lesson.quiz?.questions || [];
      if ((!qs || qs.length === 0) && lesson.designer_blocks?.right) {
        qs = lesson.designer_blocks.right;
      }
      if ((!qs || qs.length === 0) && lesson.linkedQuizId) {
        const linked = quizzes?.find(q => q.id === lesson.linkedQuizId);
        if (linked) qs = linked.questions || [];
      }
      return qs;
    }
    return [];
  };

  const getQuestionOffset = () => {
    if (!activeCourse?.modules) return 0;
    let offset = 0;

    // Loop through all previous modules
    for (let m = 0; m < activeModuleIdx; m++) {
      const mod = activeCourse.modules[m];
      if (mod && mod.lessons) {
        for (let l = 0; l < mod.lessons.length; l++) {
          const qs = getQuestionsForLessonAndPart(m, l);
          qs.forEach((q: any) => {
            offset += getSubQuestionsForBlock(q);
          });
        }
      }
    }

    // For the current module, loop through all previous lessons
    const currentMod = activeCourse.modules?.[activeModuleIdx];
    if (currentMod && currentMod.lessons) {
      for (let l = 0; l < activeLessonIdx; l++) {
        const qs = getQuestionsForLessonAndPart(activeModuleIdx, l);
        qs.forEach((q: any) => {
          offset += getSubQuestionsForBlock(q);
        });
      }
    }

    // For the current lesson, if it has parts, loop through all previous parts
    const currentLesson2 = currentMod?.lessons?.[activeLessonIdx];
    if (currentLesson2 && currentLesson2.parts && currentLesson2.parts.length > 0) {
      for (let p = 0; p < activePartIdx; p++) {
        const qs = getQuestionsForLessonAndPart(activeModuleIdx, activeLessonIdx, p);
        qs.forEach((q: any) => {
          offset += getSubQuestionsForBlock(q);
        });
      }
    }

    return offset;
  };

  const getFlatSubQuestions = (questions: any[], answers: any, isSubmitted: boolean) => {
    const flat: any[] = [];
    let qNumNum = getQuestionOffset() + 1;
    questions.forEach((q, blockIdx) => {
      const qType = q.type || 'MCQ';
      if (qType === 'INLINE_BLANKS') {
        const parts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i);
        const blanksCount = Math.max(0, parts.length - 1);
        for (let index = 0; index < blanksCount; index++) {
          const subId = `${q.id}_${index}`;
          const isAns = answers[subId] !== undefined && answers[subId]?.toString().trim() !== "";
          
          let subCorrect = false;
          if (isSubmitted) {
            const studentAns = (answers[subId]?.toString() || "").trim().toLowerCase();
            const ansGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[index] || "";
            const correctOptions = ansGroup.split(",").map((x: string) => x.trim().toLowerCase());
            subCorrect = correctOptions.some((opt: string) => studentAns === opt && opt);
          }

          flat.push({
            id: subId,
            blockId: q.id,
            qNum: qNumNum++,
            isAnswered: isAns,
            isCorrect: subCorrect,
            blockIdx,
            subIdx: index,
            type: qType
          });
        }
      } else if (qType === 'MATCHING') {
        const prompts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/\n/).filter(Boolean);
        prompts.forEach((_, pIdx) => {
          const subId = `${q.id}_${pIdx}`;
          const isAns = answers[subId] !== undefined && answers[subId]?.toString().trim() !== "";
          
          let subCorrect = false;
          if (isSubmitted) {
            const studentAns = (answers[subId]?.toString() || "").trim().toLowerCase();
            const correctAns = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(/\n/).filter(Boolean)[pIdx] || "";
            const correctOptions = correctAns.split(",").map((x: string) => x.trim().toLowerCase());
            subCorrect = correctOptions.some((opt: string) => studentAns === opt && opt);
          }

          flat.push({
            id: subId,
            blockId: q.id,
            qNum: qNumNum++,
            isAnswered: isAns,
            isCorrect: subCorrect,
            blockIdx,
            subIdx: pIdx,
            type: qType
          });
        });
      } else {
        const isAns = answers[q.id] !== undefined && answers[q.id]?.toString().trim() !== "";
        let subCorrect = false;
        if (isSubmitted) {
          subCorrect = checkIsCorrect(q, answers);
        }

        flat.push({
          id: q.id,
          blockId: q.id,
          qNum: qNumNum++,
          isAnswered: isAns,
          isCorrect: subCorrect,
          blockIdx,
          subIdx: 0,
          type: qType
        });
      }
    });
    return flat;
  };

  const displayContent = (currentLesson?.parts && currentLesson.parts.length > 0)
    ? (currentLesson.parts[activePartIdx]?.content || "")
    : (currentLesson?.content || "");

  const displayAudioUrl = (currentLesson?.parts && currentLesson.parts.length > 0)
    ? (currentLesson.parts[activePartIdx]?.audioUrl || "")
    : (currentLesson?.audioUrl || "");

  const isListeningTestSelected = !!(activeCourse && (
    displayType === 'LISTENING' || 
    (activeCourse.course_format === 'listening') ||
    (activeCourse.course_format === 'four_skills' && activePartIdx === 2)
  ));

  const activeAudioSourceUrl = uploadedVoiceUrl || displayAudioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto text-center" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Formatting Candidate Study Roadmaps...</p>
        </div>
      </div>
    );
  }

  const displayEnableRecording = (currentLesson?.parts && currentLesson.parts.length > 0)
    ? (currentLesson.parts[activePartIdx]?.enableRecording !== false)
    : (currentLesson?.enableRecording !== false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    
    // Find the question type to see if it's multi-select
    const question = currentQuizQuestions.find(q => q.id === questionId);
    if (question?.type === 'MULTI_MCQ') {
      setQuizAnswers(prev => {
        const currentAns = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
        if (currentAns.includes(optionIndex)) {
          return { ...prev, [questionId]: currentAns.filter(idx => idx !== optionIndex) };
        } else {
          return { ...prev, [questionId]: [...currentAns, optionIndex] };
        }
      });
      return;
    }

    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    // Collect all questions from the entire module
    const allModuleQuestions = (currentModule?.lessons || []).flatMap((lesson: any) => {
        if (lesson.parts && lesson.parts.length > 0) {
            return lesson.parts.flatMap((p: any) => {
              let qs = p.questions || p.content?.questions || p.quiz?.questions || [];
              if ((!qs || qs.length === 0) && p.designer_blocks?.right) qs = p.designer_blocks.right;
              if ((!qs || qs.length === 0) && p.linkedQuizId) {
                const linked = quizzes?.find(q => q.id === p.linkedQuizId);
                if (linked) qs = linked.questions || [];
              }
              if ((!qs || qs.length === 0) && lesson.linkedQuizId) {
                const linked = quizzes?.find(q => q.id === lesson.linkedQuizId);
                if (linked) qs = linked.questions || [];
              }
              return qs;
            });
        }
        let qs = lesson.questions || lesson.content?.questions || lesson.quiz?.questions || [];
        if ((!qs || qs.length === 0) && lesson.designer_blocks?.right) qs = lesson.designer_blocks.right;
        if ((!qs || qs.length === 0) && lesson.linkedQuizId) {
          const linked = quizzes?.find(q => q.id === lesson.linkedQuizId);
          if (linked) qs = linked.questions || [];
        }
        return qs;
    });

    if (allModuleQuestions.length === 0) return;
    
    let correctCount = 0;
    let totalQuestions = 0;
    
    allModuleQuestions.forEach((q: any) => {
      const qType = q.type || 'MCQ';
      if (qType === 'MULTI_MCQ') {
        totalQuestions += 1;
        const studentAns = Array.isArray(quizAnswers[q.id]) ? quizAnswers[q.id] : [];
        const correctAns = Array.isArray(q.correctIndexes) ? q.correctIndexes : [];
        const isMatch = studentAns.length === correctAns.length && studentAns.every((val: any) => correctAns.includes(val));
        if (isMatch) correctCount++;
      } else if (qType === 'INLINE_BLANKS') {
        const parts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i);
        const blanksCount = Math.max(0, parts.length - 1);
        totalQuestions += blanksCount || 1; 
        for (let index = 0; index < blanksCount; index++) {
          const studentAns = (quizAnswers[`${q.id}_${index}`]?.toString() || "").trim().toLowerCase();
          const ansGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[index] || "";
          const correctOptions = ansGroup.split(",").map((x: string) => x.trim().toLowerCase());
          if (correctOptions.some((opt: string) => studentAns === opt && opt)) correctCount++;
        }
      } else if (qType === 'MATCHING') {
        const prompts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/\n/).filter(Boolean);
        const promptsCount = prompts.length;
        totalQuestions += promptsCount || 1;
        for (let pIdx = 0; pIdx < promptsCount; pIdx++) {
          const studentAns = (quizAnswers[`${q.id}_${pIdx}`]?.toString() || "").trim().toLowerCase();
          const correctAns = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(/\n/).filter(Boolean)[pIdx] || "";
          const correctOptions = correctAns.split(",").map((x: string) => x.trim().toLowerCase());
          if (correctOptions.some((opt: string) => studentAns === opt && opt)) correctCount++;
        }
      } else if (qType === 'BLANK' || qType === 'PASSAGE') {
        totalQuestions += 1;
        const studentAns = (quizAnswers[q.id]?.toString() || "").trim().toLowerCase();
        const correctOptions = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(",").map((x: string) => x.trim().toLowerCase());
        if (correctOptions.some((opt: string) => studentAns === opt && opt)) correctCount++;
      } else if (qType === 'SPEAKING_QUESTION') {
        totalQuestions += 1;
        if (quizAnswers[q.id] || voiceAudioUrlMap[q.id]) correctCount++;
      } else {
        totalQuestions += 1;
        if (checkIsCorrect(q, quizAnswers)) correctCount++;
      }
    });

    const percent = Math.round((correctCount / totalQuestions) * 100);
    setQuizScore({ correct: correctCount, total: totalQuestions, percent });
    setQuizSubmitted(true);

    // Save to local history for dashboard
    try {
      const historyStr = localStorage.getItem("quiz_history") || "[]";
      const history = JSON.parse(historyStr);
      history.unshift({
        course: activeCourse?.title || "Unknown Course",
        module: currentModule?.title || "Unknown Module",
        quiz: "Module " + (activeModuleIdx + 1) + " Test",
        percent: percent,
        date: new Date().toISOString()
      });
      safeSetItem("quiz_history", JSON.stringify(history.slice(0, 50)));
      window.dispatchEvent(new Event("quiz_submitted"));
      window.dispatchEvent(new Event("sebs_test_completed"));
      window.dispatchEvent(new Event("profile_updated"));

      if (activeCourse?.id) {
         const courseScores = safeGetItemAndParse<Record<string, any>>("course_scores", {});
         if (!courseScores[activeCourse.id] || percent > courseScores[activeCourse.id]) {
            courseScores[activeCourse.id] = percent;
            safeSetItem("course_scores", JSON.stringify(courseScores));
            
            // Sync to Supabase
            if (supabase) {
              supabase.auth.getUser().then(({ data: { user }}) => {
                if (user) {
                  supabase.from("student_course_scores").upsert({
                    student_id: user.id,
                    course_id: activeCourse.id,
                    score: percent,
                    updated_at: new Date().toISOString()
                  }, { onConflict: "student_id, course_id" }).then();
                }
              });
            }
         }
      }

      // Mock update to profile xp/streak if they scored well
      if (percent >= 50) {
         let p = safeGetItemAndParse<any>("student_profile", {});
         if (!p.xp) p.xp = 2450;
         p.xp += 150;
         safeSetItem("student_profile", JSON.stringify(p));
         window.dispatchEvent(new CustomEvent("profile_updated"));
      }

      window.dispatchEvent(new CustomEvent("new_notification", {
        detail: {
          message: `You scored ${percent}% on Module ${activeModuleIdx + 1}!`,
          time: new Date().toISOString(),
          read: false
        }
      }));
    } catch (err) {}

    // Save submission data locally and sync to Supabase if online
    (() => {
      const studentProfile = safeGetItemAndParse<any>('student_profile', {});
      const studentName = studentProfile.name || studentProfile.first_name || 'Anonymous Student';
      
      const details = {
        score: { correct: correctCount, total: totalQuestions, percent },
        results: allModuleQuestions.map((q: any) => {
          const qType = q.type || 'MCQ';
          let studentAnswerStr = "";
          let correctAnswerStr = "";
          let isCorrect = false;
          let speakingData = null;

          if (qType === 'INLINE_BLANKS') {
            const parts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i);
            const blanksCount = Math.max(0, parts.length - 1);
            const studAnsArr: string[] = [];
            const corrAnsArr: string[] = [];
            let allCorrect = true;
            for (let index = 0; index < blanksCount; index++) {
              const studentAns = (quizAnswers[`${q.id}_${index}`]?.toString() || "").trim();
              const ansGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[index] || "";
              const correctOptions = ansGroup.split(",").map((x: string) => x.trim());
              studAnsArr.push(studentAns);
              corrAnsArr.push(correctOptions.join(" / "));
              if (!correctOptions.map(x => x.toLowerCase()).includes(studentAns.toLowerCase())) {
                allCorrect = false;
              }
            }
            studentAnswerStr = studAnsArr.join(" | ") || "[Unanswered]";
            correctAnswerStr = corrAnsArr.join(" | ");
            isCorrect = allCorrect;
          } else if (qType === 'MATCHING') {
            const prompts = (typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/\n/).filter(Boolean);
            const promptsCount = prompts.length;
            const studAnsArr: string[] = [];
            const corrAnsArr: string[] = [];
            let allCorrect = true;
            for (let pIdx = 0; pIdx < promptsCount; pIdx++) {
              const studentAns = (quizAnswers[`${q.id}_${pIdx}`]?.toString() || "").trim();
              const correctAns = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(/\n/).filter(Boolean)[pIdx] || "";
              const correctOptions = correctAns.split(",").map((x: string) => x.trim());
              studAnsArr.push(studentAns);
              corrAnsArr.push(correctOptions.join(" / "));
              if (!correctOptions.map(x => x.toLowerCase()).includes(studentAns.toLowerCase())) {
                 allCorrect = false;
              }
            }
            studentAnswerStr = studAnsArr.join(" | ") || "[Unanswered]";
            correctAnswerStr = corrAnsArr.join(" | ");
            isCorrect = allCorrect;
          } else if (qType === 'MULTI_MCQ') {
            const studentAnsArr = Array.isArray(quizAnswers[q.id]) ? quizAnswers[q.id] : [];
            const correctAnsArr = Array.isArray(q.correctIndexes) ? q.correctIndexes : [];
            const opts = q.options || [];
            studentAnswerStr = studentAnsArr.map(idx => opts[idx]).join(", ") || "[Unanswered]";
            correctAnswerStr = correctAnsArr.map(idx => opts[idx]).join(", ");
            isCorrect = studentAnsArr.length === correctAnsArr.length && studentAnsArr.every(idx => correctAnsArr.includes(idx));
          } else if (qType === 'BLANK' || qType === 'PASSAGE') {
            const studentAns = (quizAnswers[q.id]?.toString() || "").trim();
            const correctOptions = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(",").map((x: string) => x.trim());
            studentAnswerStr = studentAns || "[Unanswered]";
            correctAnswerStr = correctOptions.join(" / ");
            isCorrect = correctOptions.map(x => x.toLowerCase()).includes(studentAns.toLowerCase());
          } else if (qType === 'TF' || qType === 'YN') {
            const studentAnsIdx = quizAnswers[q.id];
            const opts = qType === 'TF' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN'];
            const studentAns = studentAnsIdx !== undefined ? opts[studentAnsIdx] : "[Unanswered]";
            const correctIdx = getQuestionCorrectIndex(q);
            const correctAns = opts[correctIdx] || "";
            studentAnswerStr = studentAns;
            correctAnswerStr = correctAns;
            isCorrect = checkIsCorrect(q, quizAnswers);
          } else if (qType === 'SPEAKING_QUESTION') {
            const hasAudio = voiceAudioUrlMap[q.id] || quizAnswers[q.id];
            studentAnswerStr = hasAudio ? "[Voice Recording Saved]" : "[Unanswered]";
            correctAnswerStr = "[Vocal Assessment]";
            isCorrect = !!hasAudio;
            if (hasAudio) {
              speakingData = {
                audioUrl: voiceAudioUrlMap[q.id],
                transcript: voiceTranscriptMap[q.id],
                analysis: speakingAnalysisMap[q.id]
              };
            }
          } else {
            const studentAnsIdx = quizAnswers[q.id];
            const studentAns = (studentAnsIdx !== undefined && q.options) ? q.options[studentAnsIdx] : "[Unanswered]";
            const correctIdx = getQuestionCorrectIndex(q);
            const correctAns = (q.options) ? q.options[correctIdx] : "";
            studentAnswerStr = studentAns;
            correctAnswerStr = correctAns;
            isCorrect = checkIsCorrect(q, quizAnswers);
          }

          return {
            id: q.id,
            type: (qType === 'SPEAKING_QUESTION' || q.id.includes('part') || q.id.includes('question-card')) ? 'speaking' : qType,
            question: q.text || "Question",
            studentAnswer: studentAnswerStr,
            correctAnswer: correctAnswerStr,
            isCorrect,
            data: speakingData
          };
        })
      };

      // Save to local storage mock list
      try {
        const existingSubmissions = safeGetItemAndParse<any[]>('admin_writing_submissions', []);
        const newSubmission = {
          id: "q-" + Date.now().toString() + "-" + Math.random().toString(36).substr(2, 4),
          studentId: null,
          studentName: studentName,
          courseTitle: activeCourse?.title || "Unknown Course",
          lessonTitle: currentQuizTitle,
          lessonType: currentLesson?.type || "READING",
          content: JSON.stringify(details),
          submittedAt: new Date().toISOString()
        };
        
        // Quota safeguard: limit list size and try-catch with progressive trimming to fit in local storage limit
        const combined = [newSubmission, ...existingSubmissions];
        let itemsToKeep = 10;
        let success = false;
        while (itemsToKeep > 0) {
          try {
            safeSetItem('admin_writing_submissions', JSON.stringify(combined.slice(0, itemsToKeep)));
            success = true;
            break;
          } catch (e) {
            itemsToKeep--;
          }
        }
        if (!success) {
          console.warn("Could not save to admin_writing_submissions local storage - fully out of space.");
        }
      } catch (storageErr) {
        console.error("Failed to write quiz to local submissions:", storageErr);
      }

      // Live Supabase Sync
      if (supabase) {
        (async () => {
          try {
            let userId = null;
            try {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              userId = authUser?.id || null;
            } catch (e) {}

            await supabase.from("student_submissions").insert([{
              student_id: userId,
              student_name: studentName,
              course_id: activeCourse?.id || null,
              course_title: activeCourse?.title || "Unknown Course",
              module_idx: activeModuleIdx,
              lesson_title: currentQuizTitle,
              lesson_type: currentLesson?.type || "READING",
              content: JSON.stringify(details),
              created_at: new Date().toISOString()
            }]);
          } catch (dbErr) {
            console.error("Error saving reading quiz result to Supabase:", dbErr);
          }
        })();
      }
    })();
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleLessonChange = (mIdx: number, lIdx: number) => {
    if (mIdx !== activeModuleIdx) {
      handleResetQuiz();
    }
    setActiveModuleIdx(mIdx);
    setActiveLessonIdx(lIdx);
    setActivePartIdx(0);
    stopVoiceRecording('global');
    setVoiceAudioUrlMap(p => ({...p, global: null}));
    setVoiceTranscriptMap(p => ({...p, global: ""}));
    setRecordingDurationMap(p => ({...p, global: 0}));
  };

  const handleNextLesson = () => {
    if (!activeCourse) return;
    const currentModLessons = currentModule?.lessons || [];
    
    if (activeLessonIdx < currentModLessons.length - 1) {
      handleLessonChange(activeModuleIdx, activeLessonIdx + 1);
    } else if (activeCourse.modules && activeModuleIdx < activeCourse.modules.length - 1) {
      handleLessonChange(activeModuleIdx + 1, 0);
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIdx > 0) {
      handleLessonChange(activeModuleIdx, activeLessonIdx - 1);
    } else if (activeModuleIdx > 0 && activeCourse?.modules) {
      const prevMod = activeCourse.modules[activeModuleIdx - 1];
      handleLessonChange(activeModuleIdx - 1, (prevMod?.lessons?.length || 1) - 1);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || completedLessons.includes(currentLesson.id)) return;
    
    const newCompleted = [...completedLessons, currentLesson.id];
    setCompletedLessons(newCompleted);

    // Reward XP
    let p = safeGetItemAndParse<any>("student_profile", {});
    p.xp = (p.xp || 0) + 100;
    p.last_lesson = currentLesson.title;
    safeSetItem("student_profile", JSON.stringify(p));
    window.dispatchEvent(new CustomEvent("profile_updated"));

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              completed_lessons: newCompleted,
              xp: p.xp,
              last_lesson: currentLesson.title
            })
            .eq('id', user.id);
        }
      } catch (e) {}
    }

    window.dispatchEvent(new CustomEvent("new_notification", {
      detail: {
        message: `Lesson "${currentLesson.title}" completed! +100 XP`,
        time: new Date().toISOString(),
        read: false
      }
    }));
  };

  // Determine lesson icon representation
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="w-3.5 h-3.5 text-rose-500" />;
      case 'QUIZ':
      case 'PRACTICE': return <Brain className="w-3.5 h-3.5 text-teal-500" />;
      case 'VOICE': return <Volume2 className="w-3.5 h-3.5 text-purple-500 animate-pulse" />;
      case 'LISTENING': return <Volume2 className="w-3.5 h-3.5 text-indigo-500" />;
      case 'READING': return <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
      case 'WRITING': return <PenTool className="w-3.5 h-3.5 text-indigo-500" />;
      default: return <FileText className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isSupabaseDev = !supabase;
  if (!user && !isSupabaseDev) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 rounded-[2rem] bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter uppercase italic leading-none">
          Courses <span className="text-emerald-600 dark:text-emerald-400">Locked</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-12 text-sm font-semibold leading-relaxed">
          Access to our elite academic tracks, verified IELTS syllabus, and premium spoken English courses is strictly reserved for registered students of Syed Ejaz Bukhari's Global Language Institute.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-sm">
          <Link to="/signup" className="flex-1">
            <Button className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-[0_10px_20px_-10px_rgba(5,150,105,0.4)] border-none">
              Create My Account
            </Button>
          </Link>
          <Link to="/login" className="flex-1">
            <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 dark:border-white/10 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (activeCourse && activeCourseId && checkCourseAccess(userPlan, activeCourse.access_tier || "Free Trial")) {
    const isMedia = Boolean(
      activeCourse.isMediaCourse ||
      activeCourse.rawMediaCourse ||
      activeCourse.mediaType ||
      activeCourse.media_type ||
      activeCourse.course_format === "video_masterclass" ||
      activeCourse.course_format === "audio_series" ||
      activeCourse.course_format === "media" ||
      String(activeCourse.id || "").startsWith("media-")
    );

    // Specialized rich player for Video & Audio Media Courses
    if (isMedia) {
      return (
        <MediaCoursePlayer
          course={activeCourse}
          onExit={confirmExit}
        />
      );
    }

    // Build comprehensive normalized sections with full questions extracted across all structures
    const courseSections = normalizeCourseToSections(activeCourse, quizzes || []);

    const calculatedIdx = courseSections.findIndex(
      (s) => s.moduleIdx === activeModuleIdx && s.lessonIdx === activeLessonIdx && s.partIdx === activePartIdx
    );
    const activeSectionIndex =
      activeCourseSectionIdx >= 0 && activeCourseSectionIdx < courseSections.length
        ? activeCourseSectionIdx
        : calculatedIdx >= 0
        ? calculatedIdx
        : 0;

    const ieltsTestObject = {
      id: activeCourse.id,
      title: activeCourse.title || "IELTS Practice Exam",
      name: activeCourse.title || "IELTS Practice Exam",
      type: (displayType || activeCourse.course_format || "reading").toLowerCase(),
      sections: courseSections
    };

    return (
      <div id="full-screen-course" className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 overflow-y-auto">
        <IeltsTestView
          test={ieltsTestObject}
          currentSectionIdx={activeSectionIndex}
          setCurrentSectionIdx={(idx) => {
            setActiveCourseSectionIdx(idx);
            const targetSec = courseSections[idx];
            if (targetSec) {
              if (targetSec.moduleIdx !== undefined) setActiveModuleIdx(targetSec.moduleIdx);
              if (targetSec.lessonIdx !== undefined) setActiveLessonIdx(targetSec.lessonIdx);
              if (targetSec.partIdx !== undefined) setActivePartIdx(targetSec.partIdx);
            }
          }}
          answers={quizAnswers}
          setAnswers={setQuizAnswers}
          timeLeft={lessonTimers[currentLessonKey] !== undefined ? lessonTimers[currentLessonKey] : 3600}
          handleFinishTest={handleSubmitQuiz}
          handleQuitSession={confirmExit}
          formatTime={formatTime}
        />
      </div>
    );
  }

  const mainContent = (
    <div 
      id="full-screen-course" 
      className={(activeCourse && activeCourseId) ? "fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 overflow-y-auto pb-12" : "min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-12 overflow-x-hidden"}
      style={!(activeCourse && activeCourseId) ? { zIndex: 0 } : {}}
    >
      {/* 
        IMPORTANT: The timer header must ONLY be visible when activeCourse is active.
        It uses z-[70] to stay above the content.
      */}

      {(activeCourse && activeCourseId && checkCourseAccess(userPlan, activeCourse.access_tier || "Free Trial")) && (
        <>
          <div className="sticky top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-[70] flex items-center justify-center">
            <div className="absolute left-4">
              <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleExitAttempt}
                  className="text-slate-500 hover:text-primary transition-colors font-bold text-xs gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            {lessonTimers[currentLessonKey] !== undefined && pendingLesson?.hasTimer ? (
               <div className={`text-2xl font-black tabular-nums tracking-tighter ${lessonTimers[currentLessonKey] < 60 ? 'text-red-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                 {formatTime(lessonTimers[currentLessonKey])}
               </div>
            ) : (
               <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Active Session Mode</div>
            )}
          </div>

          {/* Sticky Audio Player */}
          {displayAudioUrl && (
            <div className="sticky top-16 left-0 right-0 z-[65] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 p-3 sm:px-8 flex justify-center items-center w-full shadow-sm">
              <audio src={displayAudioUrl} controls className="w-full max-w-4xl rounded-2xl bg-slate-100 dark:bg-slate-800" controlsList="nodownload" />
            </div>
          )}
        </>
      )}

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-white/5 space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Exit Course?</h3>
                <p className="text-sm text-slate-500 font-medium italic">Your current progress and active timer will be cleared. Do you really want to leave this session?</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={confirmExit}
                  className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold h-11"
                >
                  Yes, Exit Course
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full rounded-xl font-bold text-slate-500 hover:text-slate-800 h-11"
                >
                  Continue Learning
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Start Preview Modal */}
      <AnimatePresence>
        {courseToStart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToStart(null)}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col"
            >
              <div className="relative h-56 w-full overflow-hidden shrink-0">
                <img 
                  src={courseToStart.featured_image || courseToStart.thumbnail_url || "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format,compress&fm=webp&w=800&q=75"} 
                  alt={courseToStart.title}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={224}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                
                <Button 
                  variant="ghost" 
                  onClick={() => setCourseToStart(null)}
                  className="absolute top-4 right-4 w-10 h-10 p-0 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border border-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="absolute bottom-6 left-8 right-8">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest text-primary uppercase bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-indigo-300">
                    <Sparkles className="w-3 h-3 text-indigo-300 fill-indigo-300/30" />
                    {courseToStart.course_type || "Skill Practice"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-3 leading-tight tracking-tight drop-shadow-sm">{courseToStart.title}</h3>
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1">
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">COURSE DESCRIPTION</span>
                  <p className="text-sm text-slate-650 dark:text-slate-350 font-medium leading-relaxed italic">
                    {courseToStart.description || "Engage in targeted exercises designed by IELTS experts to target bands 7.5 to 9.0 automatically."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 text-center">
                    <span className="block text-[8px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">TIER</span>
                    <span className="block text-xs font-black text-primary dark:text-indigo-400 uppercase mt-1">
                      {courseToStart.access_tier || "Free Trial"}
                    </span>
                  </div>
                  <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 text-center">
                    <span className="block text-[8px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">STRUCTURE</span>
                    <span className="block text-xs font-black text-slate-800 dark:text-white uppercase mt-1">
                      {courseToStart.modules?.length || 1} Modules
                    </span>
                  </div>
                  <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 text-center">
                    <span className="block text-[8px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">CURRICULUM</span>
                    <span className="block text-xs font-black text-slate-800 dark:text-white uppercase mt-1">
                      Target 8.0+
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button 
                    onClick={() => {
                      if (!isUserLoggedIn()) {
                        toast.error("Sign In Required", {
                          description: "Please sign in to take courses and access full practice modules."
                        });
                        setCourseToStart(null);
                        navigate("/login", { state: { from: location.pathname } });
                        return;
                      }
                      updateCourseUrl(courseToStart);
                      setActiveCourseId(courseToStart.id);
                      setActiveCourse(courseToStart);
                      safeSetItem("active_course_id", courseToStart.id);
                      safeSetItem("active_course_timestamp", Date.now().toString());
                      setSidebarCollapsed(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setCourseToStart(null);
                    }}
                    className="flex-1 rounded-[1.3rem] h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 transition-all"
                  >
                    <span>START</span>
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setCourseToStart(null)}
                    className="rounded-[1.3rem] h-14 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs tracking-wider px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className={(activeCourse && activeCourseId) ? 'max-w-full px-0 sm:px-2 lg:px-4 xl:px-6 pt-6 sm:pt-10' : 'max-w-[1600px] px-4 mx-auto'}>
        <AnimatePresence mode="wait">
          {(!activeCourseId || !activeCourse) ? (
            /* ================= VIEW 1: EXPLORE AVAILABLE COURSES ================= */
            <motion.div 
              key="explore"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              {/* Cover Banner / Personal Header */}
              {!isDashboardMode ? (
                <div className="relative rounded-[2.5rem] bg-gradient-to-br from-primary via-indigo-950 to-slate-950 text-white p-8 sm:p-12 overflow-hidden shadow-2xl mb-8">
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent opacity-80" />
                  <div className="relative max-w-2xl space-y-4">
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight font-sans">
                      Break Through Your <span className="underline decoration-indigo-400 decoration-4">IELTS Band Score</span> With Specialized IELTS Courses
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg italic font-semibold">
                      Access official IELTS preparation modules and expert-guided training curriculum.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-primary transition-colors shadow-sm">
                      <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <Badge className="bg-primary/10 text-primary border-none font-black italic px-4 py-1">Syllabus Excellence</Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-2">
                       <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Your <span className="text-primary italic">Learning Hub</span></h1>
                       <p className="text-sm font-semibold text-slate-500 max-w-md">Continue your preparation with personalized training tracks designed for your target band score.</p>
                    </div>
                    <div className="flex items-center lg:justify-end gap-3">
                     <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enrollment Status</p>
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Student</p>
                     </div>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Section for Dashboard Mode */}
              {isDashboardMode && currentViewCourses.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Resume Learning</h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider block italic">Continue where you left off</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    if (!resumeCourse) return null;

                    const lessons = resumeCourse.modules?.flatMap((m: any) => m.lessons || []) || [];
                    const completedInThisCourse = lessons.filter((l: any) => completedLessons.includes(l.id)).length;
                    const progressPercent = lessons.length > 0 ? Math.round((completedInThisCourse / lessons.length) * 100) : 0;

                    return (
                      <Card 
                        className="rounded-[2.5rem] p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row gap-8 items-center cursor-pointer hover:border-primary/30 transition-all group"
                        onClick={() => {
                          setCourseToStart(resumeCourse);
                        }}
                      >
                        <div className="w-full md:w-48 aspect-video rounded-2xl overflow-hidden shrink-0 shadow-lg relative">
                          <img 
                            src={resumeCourse.featured_image || "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60"} 
                            alt={resumeCourse.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <PlayCircle className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <div className="space-y-1">
                            <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] tracking-wider mb-2 px-3 py-1">Recommended next step</Badge>
                            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{resumeCourse.title}</h4>
                            <p className="text-sm text-slate-500 font-medium line-clamp-2">{resumeCourse.description}</p>
                          </div>
                          
                          <div className="space-y-2">
                             <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                               <span>Curriculum Progress</span>
                               <span className="text-primary">{progressPercent}%</span>
                             </div>
                             <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${progressPercent}%` }}
                                 className="h-full bg-primary rounded-full"
                               />
                             </div>
                             <div className="flex items-center justify-between pt-1">
                               <p className="text-[10px] font-bold text-slate-400 italic">{completedInThisCourse} of {lessons.length} units completed</p>
                               <span className="text-xs font-black text-primary flex items-center gap-1 group-hover:underline">Continue Unit <ArrowRight className="w-3.5 h-3.5" /></span>
                             </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </section>
              )}

              {/* Grid of Courses */}
              <section className="space-y-12" id="main-courses-grid">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      {isDashboardMode ? "Your Learning Universe" : `Published Training Tracks (${catalogCourses.length})`}
                    </h3>
                  </div>
                </div>

                {!isDashboardMode && catalogCourses.length === 0 && (
                  <Card className="rounded-[2rem] border-dashed border-2 p-12 text-center text-slate-400 space-y-4 bg-white dark:bg-slate-900 shadow-sm">
                    <BookOpen className="w-12 h-12 mx-auto" />
                    <h4 className="font-black text-lg">Catalog Empty</h4>
                    <p className="text-xs italic">Adjust visibility settings in the admin panel.</p>
                  </Card>
                )}

                {isDashboardMode ? (
                  <div className="space-y-16">
                    {/* Media Masterclasses & Podcasts */}
                    {mediaCourses.length > 0 && (!filterType || filterType === "courses" || filterType === "media") && (
                      <div className="space-y-8">
                         <div className="flex items-center justify-between">
                           <div>
                             <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                               <Video className="w-5 h-5 text-indigo-500" />
                               Media Masterclasses & Podcasts
                             </h3>
                             <p className="text-slate-500 text-xs font-semibold mt-0.5">Interactive video tracks and audio lessons with checkpoint quizzes</p>
                           </div>
                           <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                             {mediaCourses.length} Tracks
                           </Badge>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {mediaCourses.map(c => <CourseCard key={c.id} course={c} isCompact />)}
                         </div>
                      </div>
                    )}

                    {/* Academic Syllabus */}
                    {syllabusCourses.length > 0 && (
                      <div className="space-y-8">
                         <h3 className="text-xl font-black text-slate-900 dark:text-white">Your Study Syllabus</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {syllabusCourses.map(c => <CourseCard key={c.id} course={c} isCompact />)}
                         </div>
                      </div>
                    )}
                    {/* Practice Modules */}
                    {(["reading", "listening", "writing", "speaking"].includes(filterType || "") || practiceCourses.length > 0) ? (() => {
                      const isCourseGt = (c: any) => {
                        const title = String(c.title || "").toLowerCase();
                        const cat = String(c.category || "").toLowerCase();
                        const cType = String(c.course_type || "").toLowerCase();
                        const format = String(c.course_format || "").toLowerCase();
                        const tagsStr = (c.tags || []).map((t: string) => t.toLowerCase()).join(" ");

                        return (
                          title.includes("gt") || 
                          title.includes("general") || 
                          cat.includes("gt") || 
                          cat.includes("general") || 
                          cType.includes("gt") || 
                          cType.includes("general") || 
                          tagsStr.includes("gt") || 
                          tagsStr.includes("general")
                        );
                      };

                      const acPracticeCourses = practiceCourses.filter(c => !isCourseGt(c));
                      const gtPracticeCourses = practiceCourses.filter(c => isCourseGt(c));
                      const activePracticeModeCourses = subExamMode === "ac" ? acPracticeCourses : gtPracticeCourses;

                      const freePractice = activePracticeModeCourses.filter(c => !c.access_tier || c.access_tier === "Free Trial");
                      const proPractice = activePracticeModeCourses.filter(c => c.access_tier === "Pro Premium");
                      const masteryPractice = activePracticeModeCourses.filter(c => c.access_tier === "Mastery Ultimate");

                      return (
                        <div className="space-y-8 animate-in fade-in duration-300 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-primary" />
                                Skill Practice Modules
                              </h3>
                              <p className="text-slate-500 text-xs font-semibold mt-1">Curated training assignments for IELTS preparation</p>
                            </div>
                            
                            {/* Side-by-side Academic / General tab switcher */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-[1.2rem] border border-slate-205 dark:border-white/5 w-full sm:w-64 self-end sm:self-center shadow-inner">
                              <button
                                onClick={() => setSubExamMode("ac")}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-[1rem] transition-all duration-300 ${
                                  subExamMode === "ac"
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                Academic (AC)
                              </button>
                              <button
                                onClick={() => setSubExamMode("gt")}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-[1rem] transition-all duration-300 ${
                                  subExamMode === "gt"
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                General Training (GT)
                              </button>
                            </div>
                          </div>

                          {/* 3 Sections in current tab view: Free, Pro, Mastery */}
                          <div className="space-y-12">
                            {/* Section 1: Free Practice Modules */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 px-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">Tier 1</span>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Free Practice Modules</h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{freePractice.length} active tracks</span>
                              </div>
                              {freePractice.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {freePractice.map(c => <CourseCard key={c.id} course={c} isCompact />)}
                                </div>
                              ) : (
                                <div className="p-10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl text-center text-slate-405 dark:text-slate-500 text-xs italic bg-slate-50/20 dark:bg-slate-900/10">
                                  No Free practice modules uploaded for this training track yet.
                                </div>
                              )}
                            </div>

                            {/* Section 2: Pro Practice Modules */}
                            <div className="space-y-4 border-t border-slate-100 dark:border-white/5 pt-8">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 px-2.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider">Tier 2</span>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Pro Practice Modules</h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{proPractice.length} active tracks</span>
                              </div>
                              {proPractice.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {proPractice.map(c => <CourseCard key={c.id} course={c} isCompact />)}
                                </div>
                              ) : (
                                <div className="p-10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl text-center text-slate-405 dark:text-slate-500 text-xs italic bg-slate-50/20 dark:bg-slate-900/10">
                                  No Pro premium practice modules uploaded for this training track yet.
                                </div>
                              )}
                            </div>

                            {/* Section 3: Mastery Practice Modules */}
                            <div className="space-y-4 border-t border-slate-100 dark:border-white/5 pt-8">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 px-2.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider">Tier 3</span>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Mastery Practice Modules</h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{masteryPractice.length} active tracks</span>
                              </div>
                              {masteryPractice.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {masteryPractice.map(c => <CourseCard key={c.id} course={c} isCompact />)}
                                </div>
                              ) : (
                                <div className="p-10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl text-center text-slate-405 dark:text-slate-500 text-xs italic bg-slate-50/20 dark:bg-slate-900/10">
                                  No Mastery ultimate practice modules uploaded for this training track yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      practiceCourses.length > 0 && (
                        <div className="space-y-8">
                           <h3 className="text-xl font-black text-slate-900 dark:text-white">Skill Practice Modules</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {practiceCourses.map(c => <CourseCard key={c.id} course={c} isCompact />)}
                           </div>
                        </div>
                      )
                    )}
                    {syllabusCourses.length === 0 && practiceCourses.length === 0 && (
                      <div className="py-20 text-center animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10">
                          <BookOpen className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic">Module under construction</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Our AI Study Curator is currently preparing specialized content for this category based on your target band score.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {catalogCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
                {/* OLD GRID REMOVED */}
              </section>
            </motion.div>
          
          ) : !checkCourseAccess(userPlan, activeCourse.access_tier || "Free Trial") ? (
            /* ================= VIEW 1.5: GORGEOUS PREMIUM GATE LOCK SCREEN ================= */
            <motion.div
              key="premium-gate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="min-h-[70vh] flex items-center justify-center py-12 px-4"
            >
              <Card className="w-full max-w-3xl rounded-[3rem] border-none bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
                {/* Background ambient glowing spheres */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[110px] -z-10" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-650/15 rounded-full blur-[110px] -z-15" />

                <div className="space-y-8 relative z-10">
                  {/* Luxury Crown Anim Icon */}
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center shadow-2xl shadow-indigo-500/20 ring-4 ring-white/10 border border-indigo-400">
                    <Crown className="w-10 h-10 text-white animate-bounce duration-1000" />
                  </div>

                  <div className="space-y-3">
                    <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                      ✨ Premium Training Track ✨
                    </Badge>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                      Unlock & Study <span className="text-indigo-400 underline decoration-indigo-400/30">{activeCourse?.title || "Untitled Course"}</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                      This curriculum track contains premium structures, IELTS supervisor grading grids, vocabulary banks, and real-time interactive simulator tools reserved for premium workspace members.
                    </p>
                  </div>

                  {/* Level Highlight Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Gem className="w-5 h-5" />
                        <h4 className="font-bold text-sm">Pro Premium level</h4>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-2 font-medium">
                        <li className="flex items-center gap-2">✓ IELTS Academic & General Blueprint models</li>
                        <li className="flex items-center gap-2">✓ All Listening & Reading Simulator Rooms</li>
                        <li className="flex items-center gap-2">✓ Full interactive modules curriculum</li>
                      </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-amber-500/20 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Crown className="w-5 h-5" />
                        <h4 className="font-bold text-sm">Mastery Ultimate level</h4>
                      </div>
                      <ul className="text-xs text-slate-350 space-y-2 font-medium font-semibold">
                        <li className="flex items-center gap-2">✓ Everything in Pro Premium plus:</li>
                        <li className="flex items-center gap-1.5 font-bold text-amber-300">🔥 Unlimited Live IELTS AI Grading</li>
                        <li className="flex items-center gap-2">✓ 1-on-1 Personalized advisor guidance</li>
                      </ul>
                    </div>
                  </div>

                  {/* Pricing stats banner */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-400 max-w-md mx-auto">
                    Required License Tier: <span className="font-bold text-indigo-400 underline uppercase">{activeCourse?.access_tier || "Pro Premium"}</span> 
                    <br />
                    Your Current Workspace Level: <span className="font-extrabold text-slate-105 uppercase text-slate-300">{userPlan}</span>
                  </div>

                  {/* Form Call to Actions */}
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 max-w-md mx-auto">
                    <Button
                      className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-indigo-600/30"
                      onClick={() => {
                        const requiredTier = activeCourse?.access_tier || "Pro Premium";
                        const priceToTrigger = requiredTier === "Mastery Ultimate" ? 99 : 49;
                        if (onTriggerUpgrade) {
                          onTriggerUpgrade(requiredTier, priceToTrigger);
                        } else {
                          alert(`Please upgrade to ${requiredTier} from the Account Billing & Settings section.`);
                        }
                      }}
                    >
                      <CreditCard className="w-4 h-4" /> Secure Checkout Upgrade
                    </Button>

                    <Button
                      className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black uppercase text-xs tracking-widest gap-2 border border-white/10"
                      onClick={async () => {
                        const requiredTier = activeCourse?.access_tier || "Pro Premium";
                        safeSetItem("override_student_plan", requiredTier);
                        setUserPlan(requiredTier);
                        if (supabase) {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (user?.id) {
                            await supabase.from("profiles").update({ plan: requiredTier }).eq("id", user.id);
                          }
                        }
                        // Refresh page to take effect smoothly
                        window.location.reload();
                      }}
                    >
                      ⚡ Test Pay Bypass
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={confirmExit}
                    className="text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-wider transition-colors pt-4 block mx-auto underline"
                  >
                    Return to Course Directory
                  </button>
                </div>
              </Card>
            </motion.div>

          ) : ["four_skills", "reading", "writing", "listening", "speaking"].includes(activeCourse?.course_format || "") ? (
             /* ================= VIEW 2.5: FOUR SKILLS SIMPLE CLASSROOM ================= */
            <motion.div 
              key="four-skills-classroom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`min-h-[600px] flex flex-col pb-24 ${isListeningTestSelected ? 'pt-20 sm:pt-24' : ''}`}
            >
              <div className="w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 mx-auto space-y-6">
                <Card className="rounded-[2.5rem] border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 p-6 sm:p-10">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-none text-[9px] font-black uppercase tracking-wider mb-2">
                        {activeCourse?.course_format === "four_skills" ? "Four Skills Focus Series" : activeCourse?.course_format ? `${String(activeCourse.course_format).charAt(0).toUpperCase()}${String(activeCourse.course_format).slice(1)} Focus Series` : "Focus Series"}
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeCourse?.title || "Untitled Course"}</h2>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-200 dark:border-white/10 shrink-0"
                      onClick={handleExitAttempt}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back to Catalog
                    </Button>
                  </div>
                  
                  {/* Skill Navigation */}
                  <div className="flex flex-wrap items-center gap-2 mb-8">
                     {(activeCourse?.course_format === 'four_skills' ? ["reading", "writing", "listening", "speaking"] : [activeCourse?.course_format || "reading"]).map(skill => (
                        <button
                          key={skill}
                          onClick={() => setActivePartIdx(
                            skill === 'reading' ? 0 : 
                            skill === 'writing' ? 1 : 
                            skill === 'listening' ? 2 : 3
                          )}
                          className={`h-10 px-4 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all flex items-center gap-2 border select-none ${
                            (activeCourse?.course_format !== 'four_skills' || activePartIdx === (skill === 'reading' ? 0 : skill === 'writing' ? 1 : skill === 'listening' ? 2 : 3)) 
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          }`}
                        >
                          {skill === 'reading' && <BookOpen className="w-4 h-4" />}
                          {skill === 'writing' && <PenTool className="w-4 h-4" />}
                          {skill === 'listening' && <Volume2 className="w-4 h-4" />}
                          {skill === 'speaking' && <Mic className="w-4 h-4" />}
                          <span>{skill}</span>
                        </button>
                     ))}
                  </div>

                  {/* Skill Content Area */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 sm:p-10 rounded-[2rem] border border-slate-100 dark:border-white/5 min-h-[400px]">
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Start Practice</h3>
                      <p className="text-slate-500 max-w-sm">This is a shell course. You can construct specific lessons in the comprehensive course curriculum builder or examinations desk.</p>
                      <Button className="mt-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 h-10 w-40" onClick={confirmExit}>Close</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : (
             /* ================= VIEW 2: SPLIT SCREEN INTERACTIVE CLASSROOM READER ================= */
            <motion.div 
              key="classroom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`min-h-[600px] flex flex-col pb-24 ${isListeningTestSelected ? 'pt-20 sm:pt-24' : ''}`}
            >
              {/* Main Stage: Document, Player or Quiz Engine */}
              <div className="w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 mx-auto space-y-6 transition-all duration-300">
                <Card className="rounded-[2.5rem] border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 p-6 sm:p-10 min-h-[500px] flex flex-col justify-between">
                  {currentLesson ? (
                    <div className="space-y-6">
                      {/* Breadcrumbs / Headers */}
                      <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <Button 
                            variant="outline"
                            className="rounded-xl border-slate-200 dark:border-white/10 h-9 text-xs font-bold gap-1 px-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all shadow-none"
                            onClick={handleExitAttempt}
                          >
                            <ChevronLeft className="w-4 h-4" /> Back to Catalog
                          </Button>
                          <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">
                              {getCourseTestLabel()}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{currentLesson.title}</h2>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10"
                            onClick={handlePrevLesson}
                            disabled={activeModuleIdx === 0 && activeLessonIdx === 0}
                            title="Previous Lesson"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          {pendingLesson?.hasTimer && lessonTimers[currentLessonKey] !== undefined && (
                            <Badge className={`border-none uppercase font-black text-[10px] tracking-widest px-2.5 py-1 ${lessonTimers[currentLessonKey] < 60 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                              <Clock className="w-3.5 h-3.5 inline mr-1" />
                              {formatTime(lessonTimers[currentLessonKey])}
                            </Badge>
                          )}
                          <Badge className="bg-primary/5 text-primary border-primary/15 uppercase font-bold text-[9px] tracking-wide select-none py-1 px-2.5">
                            {displayType}
                          </Badge>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10"
                            onClick={handleNextLesson}
                            disabled={
                              activeModuleIdx === (activeCourse?.modules?.length || 1) - 1 &&
                              activeLessonIdx === (currentModule?.lessons?.length || 1) - 1
                            }
                            title="Next Lesson"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* ================= SECTION / LESSON DIRECT ACCESS TABS ================= */}
                      {currentModule?.lessons && currentModule.lessons.length > 1 && (
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-3xl flex flex-wrap gap-2 border border-slate-150 dark:border-white/5 shadow-sm mb-6">
                          {currentModule.lessons.map((lesson: any, lIdx: number) => {
                            const isSelected = activeLessonIdx === lIdx;
                            return (
                              <button
                                type="button"
                                key={lesson.id || `tab-les-${lIdx}`}
                                onClick={() => handleLessonChange(activeModuleIdx, lIdx)}
                                className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 select-none ${
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
                                <span className="truncate">{lesson.title.replace(/^\d+\.\s*/, "") || `Section ${lIdx + 1}`}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* ================= MULTI-PART SEQUENCED STEPPER BANNER ================= */}
                      {currentLesson.parts && currentLesson.parts.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-100 dark:border-white/5 space-y-3 shadow-none">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                              Lesson Part Sequence Roadmap
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              Block {activePartIdx + 1} of {currentLesson.parts.length} ({currentLesson.parts[activePartIdx]?.type})
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {currentLesson.parts.map((p: any, idxOfPart: number) => {
                              const active = idxOfPart === activePartIdx;
                              let iconEl = <BookOpen className="w-3.5 h-3.5" />;
                              if (p.type === "VIDEO") iconEl = <Play className="w-3.5 h-3.5" />;
                              if (p.type === "QUIZ") iconEl = <Sliders className="w-3.5 h-3.5" />;
                              if (p.type === "VOICE") iconEl = <Mic className="w-3.5 h-3.5" />;
                              if (p.type === "READING") iconEl = <Eye className="w-3.5 h-3.5" />;

                              return (
                                <button
                                  type="button"
                                  key={p.id || idxOfPart}
                                  onClick={() => {
                                    setActivePartIdx(idxOfPart);
                                    handleResetQuiz();
                                  }}
                                  className={`h-9 px-3.5 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all flex items-center gap-2 border select-none ${active ? "bg-primary text-white border-primary shadow-sm" : "bg-white dark:bg-slate-900 border-slate-150 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
                                >
                                  {iconEl}
                                  <span className="max-w-[120px] truncate">{p.title || `Part ${idxOfPart + 1}`}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ================= STAGE RENDER: LISTENING ATOM ================= */}
                      {displayType === 'LISTENING' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          {/* Top-Level Audio Command Center handled globally by Sticky Listening Audioscape Bar */}

                          {/* Full-Width Workspace (Rich Text + Tables/Paragraphs) */}
                          <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                            <div className="flex items-center gap-2 mb-8 border-b border-slate-50 dark:border-white/5 pb-5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                              </div>
                              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Task Environment & Supporting Data</h3>
                            </div>
                            <div className="prose dark:prose-invert max-w-none prose-table:border prose-table:border-slate-100 dark:prose-table:border-white/10 prose-th:bg-slate-50/50 dark:prose-th:bg-white/5 prose-th:p-4 prose-td:p-4 text-slate-800 dark:text-slate-200">
                              {renderRichBody(displayContent)}
                            </div>
                          </div>

                          {/* Evaluate Interactive Module */}
                          {currentQuizQuestions.length > 0 && (
                            <div className="space-y-6 pt-4">
                              <div className="flex items-center justify-between px-2">
                                <div className="space-y-1">
                                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-emerald-500" /> 
                                    Synchronous Assessment
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-bold italic">Capture your responses as you listen to the stream.</p>
                                </div>
                                
                                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                                  <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Progress</span>
                                  {getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).map((subQ) => {
                                    return (
                                      <div 
                                        key={subQ.id} 
                                        title={`Question ${subQ.qNum}`}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${subQ.isAnswered ? 'bg-emerald-500 scale-125' : 'bg-slate-200 dark:bg-white/10'}`} 
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-6 pb-20">
                                {currentQuizQuestions.map((q, qIdx) => {
                                  const qType = q.type || 'MCQ';
                                  const isCorrect = checkIsCorrect(q, quizAnswers);
                                  const hasInlineBlank = (qType === 'BLANK' || qType === 'PASSAGE') && 
                                    typeof q.text === "string" && 
                                    (/_{2,}/.test(q.text) || q.text.toLowerCase().includes("[blank]"));

                                  // MATCHING group detection
                                  const getHeadingsStr = (item: any) => {
                                    if (!item) return "";
                                    const p = item.passageText ?? item.headings ?? item.options ?? "";
                                    return typeof p === "string" ? p.trim() : (Array.isArray(p) ? p.join("\n").trim() : String(p).trim());
                                  };
                                  const isMatching = qType === 'MATCHING';
                                  const prevQ = qIdx > 0 ? currentQuizQuestions[qIdx - 1] : null;
                                  const prevH = getHeadingsStr(prevQ);
                                  const currH = getHeadingsStr(q);
                                  const isFirstInMatchingGroup = !prevQ || 
                                    (prevQ.type || '').toUpperCase() !== 'MATCHING' || 
                                    (currH && prevH !== currH) || 
                                    !!q.sectionHeading || 
                                    !!q.sectionInstruction;

                                  if (isMatching && !isFirstInMatchingGroup) {
                                    return null;
                                  }

                                  const matchingGroupQuestions = [];
                                  if (isMatching) {
                                    let tempIdx = qIdx;
                                    while (tempIdx < currentQuizQuestions.length) {
                                      const tempQ = currentQuizQuestions[tempIdx];
                                      if (tempQ && (tempQ.type || '').toUpperCase() === 'MATCHING') {
                                        if (tempIdx > qIdx && (tempQ.sectionHeading || tempQ.sectionInstruction)) {
                                          break;
                                        }
                                        const tempH = getHeadingsStr(tempQ);
                                        if (!currH || !tempH || currH === tempH) {
                                          matchingGroupQuestions.push({ q: tempQ, originalIdx: tempIdx });
                                          tempIdx++;
                                        } else {
                                          break;
                                        }
                                      } else {
                                        break;
                                      }
                                    }
                                  }

                                  return (
                                    <Fragment key={`frag-listening-${q.id || qIdx}-${qIdx}`}>
                                      {(() => {
                                        if (!q.sectionHeading && !q.sectionInstruction) return null;
                                        if (prevQ) {
                                          const sameHeading = (prevQ.sectionHeading || "") === (q.sectionHeading || "");
                                          const sameInstruction = (prevQ.sectionInstruction || "") === (q.sectionInstruction || "");
                                          if (sameHeading && sameInstruction) return null;
                                        }
                                        return (
                                          <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border border-dashed border-indigo-200 dark:border-indigo-900/30 rounded-3xl space-y-2 mt-4 mb-4 select-none">
                                            {q.sectionHeading && (
                                              <h5 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                {q.sectionHeading}
                                              </h5>
                                            )}
                                            {q.sectionInstruction && (
                                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                                                {q.sectionInstruction}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div id={`question-card-${q.id}`} className="p-6 sm:p-8 bg-slate-50/30 dark:bg-white/2 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-6 transition-all hover:bg-slate-50/50 dark:hover:bg-white/5 relative scroll-mt-6">
                                      <div className="flex items-start gap-5">
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm text-primary flex items-center justify-center font-black italic text-sm">
                                          {(() => {
                                            if (isMatching && matchingGroupQuestions.length > 0) {
                                              const flatQuestions = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                              const firstSub = flatQuestions.find(s => s.blockIdx === matchingGroupQuestions[0].originalIdx);
                                              const lastSub = flatQuestions.find(s => s.blockIdx === matchingGroupQuestions[matchingGroupQuestions.length - 1].originalIdx);
                                              const startNum = firstSub ? firstSub.qNum : (matchingGroupQuestions[0].q.qNum || qIdx + 1);
                                              const endNum = lastSub ? lastSub.qNum : (matchingGroupQuestions[matchingGroupQuestions.length - 1].q.qNum || startNum);
                                              if (startNum !== endNum) return `${startNum}-${endNum}`;
                                              return startNum;
                                            }
                                            const subs = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).filter(s => s.blockIdx === qIdx);
                                            if (subs.length > 1) {
                                              return `${subs[0].qNum}-${subs[subs.length - 1].qNum}`;
                                            }
                                            return subs[0]?.qNum || (qIdx + 1);
                                          })()}
                                        </div>
                                        <div className="space-y-2.5">
                                          <Badge className="bg-white/80 dark:bg-slate-900/80 text-slate-500 border-slate-100 dark:border-white/10 font-black text-[9px] uppercase tracking-widest px-2.5 shadow-sm">
                                            {qType === 'MULTI_MCQ' ? 'Multiple Selection' : qType === 'TF' ? 'Direct Verification' : qType === 'YN' ? 'Affirmative Analysis' : qType === 'BLANK' ? 'Fill Terminal' : qType === 'INLINE_BLANKS' ? 'Paragraph Analysis' : 'Single Selection'}
                                          </Badge>
                                          <h4 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl leading-snug tracking-tight">
                                               {hasInlineBlank ? (
                                                 q.text.split(/_{2,}|\[BLANK\]/i).map((part: string, index: number, array: string[]) => {
                                                   if (index === array.length - 1) return <span key={index}>{part}</span>;
                                                   if (index === 0) {
                                                     return (
                                                       <Fragment key={index}>
                                                         <span>{part}</span>
                                                         <input
                                                           type="text"
                                                           disabled={quizSubmitted}
                                                           value={quizAnswers[q.id] || ""}
                                                           onChange={e => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                           className={`inline-block w-48 border-b-4 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-0.5 mx-2 focus:ring-0 focus:border-indigo-500 text-center font-black outline-none transition-all ${quizSubmitted ? (isCorrect ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : "border-red-500 text-red-600 bg-red-500/10") : ""}`}
                                                         />
                                                       </Fragment>
                                                     );
                                                   }
                                                   return (
                                                     <Fragment key={index}>
                                                       <span>{part}</span>
                                                       <span className="font-bold text-slate-400">_____</span>
                                                     </Fragment>
                                                   );
                                                 })
                                               ) : (
                                                 !['INLINE_BLANKS', 'MATCHING'].includes(qType) ? (typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))) : ""
                                               )}
                                             </h4>
                                        </div>
                                      </div>

                                      {/* MULTI_MCQ Implementation */}
                                      {qType === 'MULTI_MCQ' && (
                                        <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-14">
                                          {q.options?.map((opt: string, optIdx: number) => {
                                            const studentAns = Array.isArray(quizAnswers[q.id]) ? quizAnswers[q.id] : [];
                                            const isSelected = studentAns.includes(optIdx);
                                            const correctAnsArr = Array.isArray(q.correctIndexes) ? q.correctIndexes : [];
                                            const isOptionCorrect = correctAnsArr.includes(optIdx);

                                            let borderClass = "border-slate-150 dark:border-white/10 bg-white/70 dark:bg-slate-900/70";
                                            let iconEl = <div className="w-5 h-5 rounded-md border-2 border-slate-200 shrink-0" />;

                                            if (isSelected) {
                                              borderClass = "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20";
                                              iconEl = <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center text-white shrink-0"><Check className="w-3 h-3 stroke-[4]" /></div>;
                                            }

                                            if (quizSubmitted) {
                                              if (isSelected) {
                                                if (isOptionCorrect) {
                                                  borderClass = "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30";
                                                  iconEl = <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white shrink-0"><Check className="w-3 h-3 stroke-[4]" /></div>;
                                                } else {
                                                  borderClass = "border-red-500 bg-red-500/5 ring-1 ring-red-500/30";
                                                  iconEl = <div className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center text-white shrink-0"><X className="w-3 h-3 stroke-[4]" /></div>;
                                                }
                                              } else if (isOptionCorrect) {
                                                borderClass = "border-emerald-400 bg-emerald-400/5 border-dashed";
                                              }
                                            }

                                            return (
                                              <div 
                                                key={optIdx}
                                                onClick={() => handleSelectOption(q.id, optIdx)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${borderClass} ${quizSubmitted ? 'pointer-events-none' : ''}`}
                                              >
                                                {iconEl}
                                                <span className="text-base font-bold text-slate-700 dark:text-slate-300">{opt}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* MCQ Logic (Re-use existing pattern but cleaner) */}
                                      {qType === 'MCQ' && (
                                        <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-14">
                                          {q.options?.map((opt: string, optIdx: number) => {
                                            const isSelected = quizAnswers[q.id] === optIdx;
                                            let borderClass = "border-slate-150 dark:border-white/10 bg-white/70 dark:bg-slate-900/70";
                                            if (isSelected) borderClass = "border-primary bg-primary/5 ring-1 ring-primary/20";
                                            if (quizSubmitted) {
                                              if (isSelected) {
                                                borderClass = isCorrect ? "border-emerald-500 bg-emerald-500/5" : "border-red-500 bg-red-500/5";
                                              } else if (optIdx === getQuestionCorrectIndex(q)) {
                                                borderClass = "border-emerald-400 bg-emerald-400/5 border-dashed";
                                              }
                                            }
                                            return (
                                               <div key={optIdx} onClick={() => handleSelectOption(q.id, optIdx)} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${borderClass} ${quizSubmitted ? 'pointer-events-none' : ''}`}>
                                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary' : 'border-slate-200'}`}>
                                                     {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                  </div>
                                                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">{opt}</span>
                                               </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Shared Logic for other types */}
                                      {(qType === 'TF' || qType === 'YN') && (
                                         <div className="grid grid-cols-3 gap-3 pl-0 sm:pl-14">
                                            {(qType === 'TF' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map((opt, optIdx) => {
                                               const isSelected = quizAnswers[q.id] === optIdx;
                                               let borderClass = "border-slate-150 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-500";
                                               if (isSelected) borderClass = "border-primary bg-primary/10 text-primary font-black";
                                               if (quizSubmitted) {
                                                  if (isSelected) borderClass = isCorrect ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-red-500 bg-red-500/10 text-red-600";
                                                  else if (optIdx === getQuestionCorrectIndex(q)) borderClass = "border-emerald-400 bg-emerald-400/5 text-emerald-500";
                                               }
                                               return (
                                                  <button key={optIdx} type="button" onClick={() => !quizSubmitted && setQuizAnswers(p => ({ ...p, [q.id]: optIdx }))} className={`p-4 rounded-2xl text-center border font-black text-xs tracking-widest uppercase transition-all ${borderClass}`}>{opt}</button>
                                               );
                                            })}
                                         </div>
                                      )}

                                      {qType === 'BLANK' && !hasInlineBlank && (
                                         <div className="pl-0 sm:pl-14">
                                            <input type="text" placeholder="Entry analysis..." disabled={quizSubmitted} value={quizAnswers[q.id] || ""} onChange={e => setQuizAnswers(p => ({ ...p, [q.id]: e.target.value }))} className={`h-14 w-full px-6 rounded-2xl border bg-white dark:bg-slate-900 text-lg font-black focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${quizSubmitted ? (isCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600" : "border-red-500 bg-red-500/5 text-red-600") : "border-slate-150 dark:border-white/10 shadow-inner"}`} />
                                         </div>
                                      )}

                                      {qType === 'INLINE_BLANKS' && (
                                         <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap pl-0 sm:pl-14">
                                            {(typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i).map((part: string, idx: number, arr: string[]) => {
                                               if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
                                               const studAns = (quizAnswers[`${q.id}_${idx}`] || "").trim().toLowerCase();
                                               const corrGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[idx] || "";
                                               const isPartCorrect = corrGroup.split(",").map((x: string) => x.trim().toLowerCase()).includes(studAns);
                                               const subQ = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).find(s => s.blockIdx === qIdx && s.subIdx === idx);
                                               const subQuestionNumber = subQ ? subQ.qNum : "";
                                               return (
                                                  <Fragment key={idx}>
                                                     <span>{part}</span>
                                                     <span className="inline-flex items-center gap-1 mx-1 select-none">
                                                        <span className="text-xs font-black text-primary bg-primary/10 rounded px-2 py-0.5 italic">{subQuestionNumber}</span>
                                                        <input type="text" disabled={quizSubmitted} value={quizAnswers[`${q.id}_${idx}`] || ""} onChange={e => setQuizAnswers(p => ({ ...p, [`${q.id}_${idx}`]: e.target.value }))} className={`inline-block w-48 border-b-4 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-1 mx-2 focus:ring-0 focus:border-indigo-500 text-center font-black outline-none transition-all ${quizSubmitted ? (isPartCorrect ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600") : ""}`} />
                                                     </span>
                                                  </Fragment>
                                               );
                                            })}
                                         </div>
                                      )}

                                      {/* Matching Headings */}
                                       {qType === 'MATCHING' && (
                                          <div className="pl-0 sm:pl-14 space-y-4 text-left">
                                             <div className="bg-slate-100/50 dark:bg-white/5 p-4 sm:p-5 rounded-2xl border border-slate-150 dark:border-white/10 space-y-3 shadow-inner">
                                                <h5 className="text-[10px] sm:text-xs font-black uppercase text-indigo-500 tracking-wider">List of Headings</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                   {(typeof q.passageText === "string" ? q.passageText : (Array.isArray(q.passageText) ? q.passageText.join("\n") : String(q.passageText || ""))).split("\n").filter(Boolean).map((opt: string, oIdx: number) => (
                                                      <div key={oIdx} className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{opt}</div>
                                                   ))}
                                                </div>
                                             </div>
                                             
                                             <div className="space-y-3">
                                                {matchingGroupQuestions.map(({ q: groupQ, originalIdx }) => {
                                                   const prompts = (typeof groupQ.text === "string" ? groupQ.text : (Array.isArray(groupQ.text) ? groupQ.text.join("\n") : String(groupQ.text || ""))).split("\n").filter(Boolean);
                                                   return prompts.map((prompt: string, pIdx: number) => {
                                                      const options = (typeof groupQ.passageText === "string" ? groupQ.passageText : (Array.isArray(groupQ.passageText) ? groupQ.passageText.join("\n") : String(groupQ.passageText || ""))).split("\n").filter(Boolean);
                                                      
                                                      const isSelectedCorrect = quizSubmitted ? (() => {
                                                          const studentAns = (quizAnswers[groupQ.id]?.toString() || quizAnswers[`${groupQ.id}_${pIdx}`]?.toString() || "").trim().toLowerCase();
                                                          const correctAns = (typeof groupQ.correctAnswer === "string" ? groupQ.correctAnswer : (Array.isArray(groupQ.correctAnswer) ? groupQ.correctAnswer.join("\n") : String(groupQ.correctAnswer || ""))).split("\n").filter(Boolean)[pIdx] || (typeof groupQ.correctAnswer === "string" ? groupQ.correctAnswer : "");
                                                          const correctAlternatives = correctAns.split(",").map((x: string) => x.trim().toLowerCase());
                                                          return correctAlternatives.some((opt: string) => studentAns === opt && opt);
                                                      })() : null;
                                                      
                                                      return (
                                                          <div key={`${groupQ.id}-${pIdx}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm max-w-full overflow-hidden">
                                                              {(() => {
                                                                  const subQ = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).find(s => s.blockIdx === originalIdx && s.subIdx === pIdx);
                                                                  const subQuestionNumber = subQ ? subQ.qNum : (groupQ.qNum || originalIdx + 1);
                                                                  return (
                                                                      <span className="text-sm font-bold text-slate-900 dark:text-white flex-1 flex items-start gap-2.5 min-w-0 pr-2">
                                                                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-black italic flex items-center justify-center shrink-0 mt-0.5">{subQuestionNumber}</span>
                                                                          <span className="break-words self-center leading-relaxed">{prompt}</span>
                                                                      </span>
                                                                  );
                                                              })()}
                                                              <div className="relative w-full md:w-64 shrink-0 text-left">
                                                                  <select
                                                                      disabled={quizSubmitted}
                                                                      value={quizAnswers[groupQ.id] || quizAnswers[`${groupQ.id}_${pIdx}`] || ""}
                                                                      onChange={e => setQuizAnswers(prev => ({ ...prev, [groupQ.id]: e.target.value, [`${groupQ.id}_${pIdx}`]: e.target.value }))}
                                                                      className={`w-full h-11 rounded-xl border bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-1 focus:ring-primary focus-visible:outline-none pl-4 pr-10 appearance-none font-sans cursor-pointer truncate ${quizSubmitted ? (isSelectedCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold" : "border-red-500 bg-red-500/5 text-red-600 font-bold") : "border-slate-200 dark:border-white/10"}`}
                                                                  >
                                                                     <option value="" disabled>Select heading...</option>
                                                                     {options.map((opt: string, oIdx: number) => (
                                                                         <option key={oIdx} value={opt}>{opt}</option>
                                                                     ))}
                                                                  </select>
                                                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 dark:text-white/40">
                                                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                     </svg>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      );
                                                   });
                                                })}
                                             </div>\n                                          </div>
                                       )}

                                       {/* SPEAKING QUESTION / Voice Recorder per question */}
                                       {qType === 'SPEAKING_QUESTION' && (
                                         <div className="pl-0 sm:pl-14 mt-4 max-w-xs space-y-4">
                                            {isRecordingMap[q.id] ? (
                                               <div className="space-y-4">
                                                 <div className="flex items-center gap-1 h-8 px-4">
                                                   <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full animate-pulse mr-2">
                                                     REC {formatRecordTime(recordingDurationMap[q.id] || 0)}
                                                   </span>
                                                   {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                                     <motion.div
                                                       key={i}
                                                       animate={{ height: ["8px", "24px", "8px"] }}
                                                       transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                       className="w-1 rounded bg-red-500"
                                                     />
                                                   ))}
                                                 </div>
                                                 <Button
                                                   onClick={() => stopVoiceRecording(q.id)}
                                                   className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-wider h-10 shadow-lg shadow-red-500/20"
                                                 >
                                                   Stop & Save
                                                 </Button>
                                                </div>
                                            ) : (
                                               <div className="space-y-3">
                                                 {!voiceAudioUrlMap[q.id] && (
                                                   <Button
                                                     onClick={() => startVoiceRecording(q.id)}
                                                     className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] tracking-widest h-10 shadow-lg"
                                                   >
                                                     <Mic className="w-3.5 h-3.5 mr-1" /> Record Answer
                                                   </Button>
                                                 )}
                                                 {voiceAudioUrlMap[q.id] && (
                                                   <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-[2rem] flex flex-col gap-4 shadow-sm">
                                                     <div className="flex justify-between items-center px-1">
                                                        <div className="flex items-center gap-2">
                                                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Review Recording</span>
                                                        </div>
                                                        <Button 
                                                          variant="ghost" 
                                                          size="sm" 
                                                          className="h-8 px-3 text-[10px] font-black uppercase italic text-slate-400 hover:text-red-500 hover:bg-red-50 gap-1.5 rounded-xl" 
                                                          onClick={() => {
                                                            setVoiceAudioUrlMap(p => ({...p, [q.id]: null}));
                                                            setSpeakingAnalysisMap(p => ({...p, [q.id]: null}));
                                                          }}
                                                        >
                                                           <Trash2 className="w-3.5 h-3.5" /> Re-record Answer
                                                        </Button>
                                                     </div>
                                                     <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                                                        {voiceAudioUrlMap[q.id] && <audio controls src={voiceAudioUrlMap[q.id]} className="w-full h-8" />}
                                                     </div>
                                                   </div>
                                                 )}
                                                 {renderSpeakingAnalysis(q.id, q.text || "", q.correctAnswer || "")}
                                               </div>
                                            )}
                                         </div>
                                       )}

                                       {/* Feedback Footer */}
                                      {quizSubmitted && (
                                         <div className="pl-0 sm:pl-14 flex items-center gap-2 mt-2 w-full">
                                            {qType === 'SPEAKING_QUESTION' ? (
                                               <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 w-full flex items-center gap-3">
                                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                  <div>
                                                     <p className="text-[9px] font-black uppercase text-emerald-500 leading-none">Response Status</p>
                                                     <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Response recorded successfully</p>
                                                  </div>
                                               </div>
                                            ) : isCorrect ? (
                                               <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> High Precision Correct</Badge>
                                            ) : (
                                               <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 w-full flex items-center justify-between gap-4">
                                                  <div className="flex items-center gap-3">
                                                     <AlertCircle className="w-5 h-5 text-red-500" />
                                                     <div>
                                                        <p className="text-[10px] font-black uppercase text-red-400 leading-none">Correct Criteria</p>
                                                        <p className="text-sm font-bold text-red-700 dark:text-red-300 mt-1">
                                                           {qType === 'MULTI_MCQ' ? (Array.isArray(q.correctIndexes) ? q.correctIndexes.map((idx: number) => q.options?.[idx]).join(", ") : "") : (qType === 'MATCHING' ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("\n").join(" | ") : (qType === 'INLINE_BLANKS' ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|").join(" | ") : (q.options ? (q.options[getQuestionCorrectIndex(q)] || q.options[q.correctIndex] || "") : q.correctAnswer)))}
                                                        </p>
                                                     </div>
                                                  </div>
                                               </div>
                                            )}
                                         </div>
                                      )}
                                    </div>
                                  </Fragment>
                                );
                              })}
                              </div>

                              {/* Submission Grade Card */}
                              {!quizSubmitted ? (
                                activeLessonIdx === (currentModule?.lessons?.length || 1) - 1 ? (
                                  <div className="p-4 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-6">
                                    <Button 
                                      className="rounded-xl font-bold px-8 h-11 shadow-lg shadow-primary/20"
                                      onClick={handleSubmitQuiz}
                                    >
                                      Submit Module Test
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="p-5 mt-6 text-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Complete all units in this module to submit your test.</p>
                                  </div>
                                )
                              ) : (
                                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 rounded-[2rem] border-none shadow-inner flex flex-col sm:flex-row items-center justify-between gap-6 mt-6">
                                  <div className="space-y-1.5 text-center sm:text-left">
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase font-black tracking-widest text-[9px]">
                                      Grade Locked
                                    </Badge>
                                    <h4 className="text-lg font-black tracking-tight">Module Score: {quizScore?.correct} / {quizScore?.total} Correct</h4>
                                    <p className="text-xs text-slate-400 font-semibold italic">Accuracy: {quizScore?.percent}%</p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <Button 
                                      variant="outline" 
                                      className="rounded-xl font-bold h-11 border-slate-200"
                                      onClick={handleResetQuiz}
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" /> Re-attempt Review
                                    </Button>
                                  </div>
                                </Card>
                              )}

                            </div>
                          )}
                        </div>
                      )}

                      {/* ================= STAGE RENDER: READING ATOM (SPLIT SCREEN PASSAGE + QUIZ) ================= */}
                      {displayType === 'READING' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                          {/* Left Panel: Passage Panel */}
                          <div className="lg:col-span-6 flex flex-col space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                              <span className="text-[11px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-amber-500" /> Reading Passage {activeLessonIdx + 1}
                              </span>
                            </div>
                            
                            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-3xl border border-slate-100 dark:border-white/5 min-h-[600px] max-h-[850px] overflow-y-auto scrollbar-thin">
                              <div className="prose prose-lg dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-4 text-base sm:text-lg lg:text-[1.125rem] leading-relaxed whitespace-pre-wrap">
                                {renderRichBody(displayContent || "")}
                              </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 italic font-semibold pl-1.5">
                              * Scroll the passage independently to study details. Key keywords can be cross-examined with evaluation items.
                            </p>
                          </div>

                          {/* Right Panel: Interactive Quiz Questions */}
                          <div className="lg:col-span-6 flex flex-col space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                              <span className="text-[11px] font-black uppercase text-teal-500 tracking-widest flex items-center gap-1.5">
                                <Brain className="w-4 h-4 text-teal-500" /> Comprehension Questions
                              </span>
                            </div>

                            {/* Candidate Navigation Index Ribbon */}
                            {currentQuizQuestions.length > 0 && (
                              <div className="space-y-3">
                                {/* Visual Progress Indicator */}
                                <div className="space-y-1.5 px-1 w-full max-w-sm">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Progress</span>
                                    {(() => {
                                      const flat = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                      const ansCount = flat.filter(s => s.isAnswered).length;
                                      return (
                                        <span className="text-primary">{ansCount} / {flat.length}</span>
                                      );
                                    })()}
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                                    <div 
                                      className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                                      style={{ 
                                        width: `${(() => {
                                          const flat = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                          const ansCount = flat.filter(s => s.isAnswered).length;
                                          return flat.length > 0 ? Math.round((ansCount / flat.length) * 100) : 0;
                                        })()}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 select-none shadow-sm">
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-1.5">Go To:</span>
                                  {(() => {
                                    const flat = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                    return flat.map((subQ, idx) => {
                                      let indicatorClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary";
                                      if (subQ.isAnswered) {
                                        indicatorClass = "bg-primary text-primary-foreground border-primary hover:opacity-90";
                                      }

                                      if (quizSubmitted) {
                                        if (subQ.isCorrect) {
                                          indicatorClass = "bg-emerald-500 text-white border-emerald-500 hover:opacity-95";
                                        } else {
                                          indicatorClass = "bg-red-500 text-white border-red-500 hover:opacity-95";
                                        }
                                      }

                                      return (
                                        <button
                                          key={`btn-${subQ.id}-${idx}`}
                                          type="button"
                                          onClick={() => {
                                            const el = document.getElementById(`question-card-${subQ.blockId}`);
                                            if (el) {
                                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                          }}
                                          className={`w-6 h-6 rounded-lg border text-[10px] font-black flex items-center justify-center transition-all cursor-pointer ${indicatorClass}`}
                                          title={`Scroll to Question ${subQ.qNum}`}
                                        >
                                          {subQ.qNum}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}

                            <ScrollArea className="min-h-[600px] max-h-[850px] pr-2">
                              <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-2">
                                  <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-800 dark:text-white italic tracking-tight">{currentQuizTitle}</h4>
                                  <p className="text-xs text-slate-500 font-bold italic leading-relaxed">{currentQuizDesc || "Respond to each question option based on the text on the left."}</p>
                                </div>

                                {currentQuizQuestions.length > 0 ? (
                                  <div className="space-y-4 pb-2">
                                                                        {currentQuizQuestions.map((q, qIdx) => {
                                      const qType = q.type || 'MCQ';
                                      const isCorrect = checkIsCorrect(q, quizAnswers);
                                      const hasAnswered = isQuestionAnswered(q, quizAnswers);
                                      const hasInlineBlank = (qType === 'BLANK' || qType === 'PASSAGE') && 
                                        typeof q.text === "string" && 
                                        (/_{2,}/.test(q.text) || q.text.toLowerCase().includes("[blank]"));

                                      // MATCHING group detection
                                      const getHeadingsStr = (item: any) => {
                                        if (!item) return "";
                                        const p = item.passageText ?? item.headings ?? item.options ?? "";
                                        return typeof p === "string" ? p.trim() : (Array.isArray(p) ? p.join("\n").trim() : String(p).trim());
                                      };
                                      const isMatching = qType === 'MATCHING';
                                      const prevQ = qIdx > 0 ? currentQuizQuestions[qIdx - 1] : null;
                                      const prevH = getHeadingsStr(prevQ);
                                      const currH = getHeadingsStr(q);
                                      const isFirstInMatchingGroup = !prevQ || 
                                        (prevQ.type || '').toUpperCase() !== 'MATCHING' || 
                                        (currH && prevH !== currH) || 
                                        !!q.sectionHeading || 
                                        !!q.sectionInstruction;

                                      if (isMatching && !isFirstInMatchingGroup) {
                                        return null;
                                      }

                                      const matchingGroupQuestions = [];
                                      if (isMatching) {
                                        let tempIdx = qIdx;
                                        while (tempIdx < currentQuizQuestions.length) {
                                          const tempQ = currentQuizQuestions[tempIdx];
                                          if (tempQ && (tempQ.type || '').toUpperCase() === 'MATCHING') {
                                            if (tempIdx > qIdx && (tempQ.sectionHeading || tempQ.sectionInstruction)) {
                                              break;
                                            }
                                            const tempH = getHeadingsStr(tempQ);
                                            if (!currH || !tempH || currH === tempH) {
                                              matchingGroupQuestions.push({ q: tempQ, originalIdx: tempIdx });
                                              tempIdx++;
                                            } else {
                                              break;
                                            }
                                          } else {
                                            break;
                                          }
                                        }
                                      }

                                      return (
                                        <Fragment key={`frag-${q.id || qIdx}-${qIdx}`}>
                                          {(() => {
                                            if (!q.sectionHeading && !q.sectionInstruction) return null;
                                            if (prevQ) {
                                              const sameHeading = (prevQ.sectionHeading || "") === (q.sectionHeading || "");
                                              const sameInstruction = (prevQ.sectionInstruction || "") === (q.sectionInstruction || "");
                                              if (sameHeading && sameInstruction) return null;
                                            }
                                            return (
                                              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 border border-dashed border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-2 mt-6 mb-2 scroll-mt-4 select-none">
                                                {q.sectionHeading && (
                                                  <h5 className="text-sm sm:text-base font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                    {q.sectionHeading}
                                                  </h5>
                                                )}
                                                {q.sectionInstruction && (
                                                  <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                                    {q.sectionInstruction}
                                                  </p>
                                                )}
                                              </div>
                                            );
                                          })()}
                                          <div 
                                            id={`question-card-${q.id}`}
                                            className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-white/5 rounded-2xl space-y-4 relative scroll-mt-4"
                                          >
                                            <div className="flex items-start gap-4">
                                                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-black italic shrink-0">
                                                {(() => {
                                                  if (isMatching && matchingGroupQuestions.length > 0) {
                                                    const flatQuestions = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                                    const firstSub = flatQuestions.find(s => s.blockIdx === matchingGroupQuestions[0].originalIdx);
                                                    const lastSub = flatQuestions.find(s => s.blockIdx === matchingGroupQuestions[matchingGroupQuestions.length - 1].originalIdx);
                                                    const startNum = firstSub ? firstSub.qNum : (matchingGroupQuestions[0].q.qNum || qIdx + 1);
                                                    const endNum = lastSub ? lastSub.qNum : (matchingGroupQuestions[matchingGroupQuestions.length - 1].q.qNum || startNum);
                                                    if (startNum !== endNum) return `${startNum}-${endNum}`;
                                                    return startNum;
                                                  }
                                                  const subs = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).filter(s => s.blockIdx === qIdx);
                                                  if (subs.length > 1) {
                                                    return `${subs[0].qNum}-${subs[subs.length - 1].qNum}`;
                                                  }
                                                  return subs[0]?.qNum || (qIdx + 1);
                                                })()}
                                              </div>
                                              <div className="space-y-2">
                                                <Badge className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-none font-bold text-[10px] uppercase tracking-wider py-1 select-none mb-1">
                                                  {qType === 'TF' ? 'True / False / Not Given' : qType === 'YN' ? 'Yes / No / Not Given' : qType === 'BLANK' ? 'Fill in the Blank' : qType === 'INLINE_BLANKS' ? 'Paragraph with Blanks' : qType === 'MATCHING' ? 'Matching Headings' : 'Multiple Choice'}
                                                </Badge>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-relaxed">
                                               {hasInlineBlank ? (
                                                 q.text.split(/_{2,}|\[BLANK\]/i).map((part: string, index: number, array: string[]) => {
                                                   if (index === array.length - 1) return <span key={index}>{part}</span>;
                                                   if (index === 0) {
                                                     return (
                                                       <Fragment key={index}>
                                                         <span>{part}</span>
                                                         <input
                                                           type="text"
                                                           disabled={quizSubmitted}
                                                           value={quizAnswers[q.id] || ""}
                                                           onChange={e => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                           className={`inline-block w-48 border-b-4 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-0.5 mx-2 focus:ring-0 focus:border-indigo-500 text-center font-black outline-none transition-all ${quizSubmitted ? (isCorrect ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : "border-red-500 text-red-600 bg-red-500/10") : ""}`}
                                                         />
                                                       </Fragment>
                                                     );
                                                   }
                                                   return (
                                                     <Fragment key={index}>
                                                       <span>{part}</span>
                                                       <span className="font-bold text-slate-400">_____</span>
                                                     </Fragment>
                                                   );
                                                 })
                                               ) : (
                                                 !['INLINE_BLANKS', 'MATCHING'].includes(qType) ? (typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))) : ""
                                               )}
                                             </h4>
                                              </div>
                                            </div>

                                            {/* MCQ Option Grid */}
                                            {(qType === 'MCQ') && (
                                              <div className="grid grid-cols-1 gap-2 pl-0 sm:pl-12">
                                                {q.options?.map((opt: string, optIdx: number) => {
                                                  const isSelected = quizAnswers[q.id] === optIdx;

                                                  // Visual parameters depending on submission
                                                  let borderClass = "border-slate-150 dark:border-white/5 bg-white dark:bg-slate-900";
                                                  let textClass = "text-slate-700 dark:text-slate-300";
                                                  let circleBg = "border-slate-200";

                                                  if (isSelected) {
                                                    borderClass = "border-primary bg-primary/5 dark:bg-primary/5 ring-1 ring-primary/30";
                                                  }

                                                  if (quizSubmitted) {
                                                    if (isSelected) {
                                                      if (isCorrect) {
                                                        borderClass = "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30";
                                                        circleBg = "border-emerald-500 bg-emerald-500 text-white";
                                                      } else {
                                                        borderClass = "border-red-500 bg-red-500/5 ring-1 ring-red-500/30";
                                                        circleBg = "border-red-500 bg-red-500 text-white";
                                                      }
                                                    } else if (optIdx === getQuestionCorrectIndex(q)) {
                                                      // Highlight correct one anyway
                                                      borderClass = "border-emerald-400 bg-emerald-400/5";
                                                    }
                                                  }

                                                  return (
                                                    <div 
                                                      key={optIdx} 
                                                      onClick={() => handleSelectOption(q.id, optIdx)}
                                                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${borderClass} ${quizSubmitted ? 'pointer-events-none' : ''}`}
                                                    >
                                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black ${circleBg}`}>
                                                        {isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
                                                      </div>
                                                      <span className={`text-base sm:text-lg font-medium leading-relaxed ${textClass}`}>{opt}</span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* True / False / Not Given Option Row */}
                                            {(qType === 'TF' || qType === 'YN') && (
                                              <div className="grid grid-cols-3 gap-2 pl-0 sm:pl-12">
                                                {(qType === 'TF' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map((opt, optIdx) => {
                                                  const isSelected = quizAnswers[q.id] === optIdx;

                                                  let borderClass = "border-slate-150 dark:border-white/5 bg-white dark:bg-slate-900 text-slate-500";
                                                  if (isSelected) {
                                                    borderClass = "border-primary bg-primary/10 text-primary font-black ring-1 ring-primary/30";
                                                  }

                                                  if (quizSubmitted) {
                                                    if (isSelected) {
                                                      if (isCorrect) {
                                                        borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-black";
                                                      } else {
                                                        borderClass = "border-red-500 bg-red-500/10 text-red-500 font-black";
                                                      }
                                                    } else if (optIdx === getQuestionCorrectIndex(q)) {
                                                      borderClass = "border-emerald-400 bg-emerald-400/5 text-emerald-500";
                                                    }
                                                  }

                                                  return (
                                                    <button
                                                      type="button"
                                                      key={optIdx}
                                                      onClick={() => {
                                                        if (quizSubmitted) return;
                                                        setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }));
                                                      }}
                                                      className={`p-3 sm:p-4 rounded-xl text-center border font-bold text-sm sm:text-base tracking-wider cursor-pointer transition-all uppercase leading-none ${borderClass} ${quizSubmitted ? 'pointer-events-none' : ''}`}
                                                    >
                                                      {opt}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* Fill are the Blanks Input */}
                                            {(qType === 'BLANK') && !hasInlineBlank && (
                                              <div className="pl-0 sm:pl-12 space-y-1.5">
                                                <input
                                                  type="text"
                                                  placeholder="Type your completion word or short term..."
                                                  disabled={quizSubmitted}
                                                  value={quizAnswers[q.id] || ""}
                                                  onChange={(e) => {
                                                    setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                                                  }}
                                                  className={`h-12 w-full px-5 rounded-xl border bg-white dark:bg-slate-900 text-base font-semibold focus:ring-1 focus:ring-primary focus-visible:outline-none ${quizSubmitted ? (isCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600" : "border-red-500 bg-red-500/5 text-red-600") : "border-slate-200 dark:border-white/10"}`}
                                                />
                                              </div>
                                            )}

                                            {/* Inline Blanks Input */}
                                            {qType === 'INLINE_BLANKS' && (
                                              <div className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap pl-0 sm:pl-12 mt-2">
                                                {(typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i).map((part: string, index: number, array: string[]) => {
                                                  if (index === array.length - 1) return <span key={index}>{part}</span>;
                                                  
                                                  const isSelectedCorrect = quizSubmitted ? (() => {
                                                      const studentAns = (quizAnswers[`${q.id}_${index}`]?.toString() || "").trim().toLowerCase();
                                                      const ansGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[index] || "";
                                                      const correctOptions = ansGroup.split(",").map((x: string) => x.trim().toLowerCase());
                                                      return correctOptions.some((opt: string) => studentAns === opt && opt);
                                                  })() : null;

                                                  const subQ = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).find(s => s.blockIdx === qIdx && s.subIdx === index);
                                                  const subQuestionNumber = subQ ? subQ.qNum : "";

                                                  return (
                                                    <Fragment key={index}>
                                                      <span>{part}</span>
                                                      <span className="inline-flex items-center gap-1 mx-1 select-none">
                                                        <span className="text-xs font-black text-primary bg-primary/10 rounded px-2 py-0.5 italic">{subQuestionNumber}</span>
                                                        <input
                                                          type="text"
                                                          disabled={quizSubmitted}
                                                          value={quizAnswers[`${q.id}_${index}`] || ""}
                                                          onChange={e => setQuizAnswers(prev => ({ ...prev, [`${q.id}_${index}`]: e.target.value }))}
                                                          className={`inline-block w-40 border-b-2 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 mx-2 focus:ring-0 focus:border-primary text-center font-bold outline-none ring-0 ${quizSubmitted ? (isSelectedCorrect ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : "border-red-500 text-red-600 bg-red-500/10") : ""}`}
                                                        />
                                                      </span>
                                                    </Fragment>
                                                  );
                                                })}
                                              </div>
                                            )}

                                                                                        {/* Matching Headings */}
                                            {qType === 'MATCHING' && (
                                              <div className="pl-0 sm:pl-12 space-y-5 mt-2">
                                                  <div className="bg-slate-100/50 dark:bg-white/5 p-5 py-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
                                                     <h5 className="text-[10px] sm:text-xs font-black uppercase text-indigo-500 tracking-wider">List of Headings</h5>
                                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                         {(typeof q.passageText === "string" ? q.passageText : (Array.isArray(q.passageText) ? q.passageText.join("\n") : String(q.passageText || ""))).split("\n").filter(Boolean).map((opt: string, oIdx: number) => (
                                                             <div key={oIdx} className="text-sm font-semibold text-slate-700 dark:text-slate-300">{opt}</div>
                                                         ))}
                                                     </div>
                                                  </div>
                                                  
                                                  <div className="space-y-3">
                                                      {matchingGroupQuestions.map(({ q: groupQ, originalIdx }) => {
                                                         const prompts = (typeof groupQ.text === "string" ? groupQ.text : (Array.isArray(groupQ.text) ? groupQ.text.join("\n") : String(groupQ.text || ""))).split("\n").filter(Boolean);
                                                         return prompts.map((prompt: string, pIdx: number) => {
                                                            const options = (typeof groupQ.passageText === "string" ? groupQ.passageText : (Array.isArray(groupQ.passageText) ? groupQ.passageText.join("\n") : String(groupQ.passageText || ""))).split("\n").filter(Boolean);
                                                            
                                                            const isSelectedCorrect = quizSubmitted ? (() => {
                                                                const studentAns = (quizAnswers[`${groupQ.id}_${pIdx}`]?.toString() || "").trim().toLowerCase();
                                                                const correctAns = (typeof groupQ.correctAnswer === "string" ? groupQ.correctAnswer : (Array.isArray(groupQ.correctAnswer) ? groupQ.correctAnswer.join("\n") : String(groupQ.correctAnswer || ""))).split("\n").filter(Boolean)[pIdx] || "";
                                                                const correctAlternatives = correctAns.split(",").map((x: string) => x.trim().toLowerCase());
                                                                return correctAlternatives.some((opt: string) => studentAns === opt && opt);
                                                            })() : null;
                                                            
                                                            return (
                                                                <div key={`${groupQ.id}-${pIdx}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm max-w-full overflow-hidden">
                                                                    {(() => {
                                                                        const subQ = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).find(s => s.blockIdx === originalIdx && s.subIdx === pIdx);
                                                                        const subQuestionNumber = subQ ? subQ.qNum : "";
                                                                        return (
                                                                            <span className="text-sm font-bold text-slate-900 dark:text-white flex-1 flex items-start gap-2.5 min-w-0 pr-2">
                                                                                <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-black italic flex items-center justify-center shrink-0 mt-0.5">{subQuestionNumber}</span>
                                                                                <span className="break-words self-center leading-relaxed">{prompt}</span>
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                    <div className="relative w-full md:w-64 shrink-0 text-left">
                                                                        <select
                                                                            disabled={quizSubmitted}
                                                                        value={quizAnswers[`${groupQ.id}_${pIdx}`] || ""}
                                                                        onChange={e => setQuizAnswers(prev => ({ ...prev, [`${groupQ.id}_${pIdx}`]: e.target.value }))}
                                                                        className={`w-full h-11 rounded-xl border bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-1 focus:ring-primary focus-visible:outline-none pl-4 pr-10 appearance-none font-sans cursor-pointer truncate ${quizSubmitted ? (isSelectedCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold" : "border-red-500 bg-red-500/5 text-red-600 font-bold") : "border-slate-200 dark:border-white/10"}`}
                                                                        >
                                                                           <option value="" disabled>Select heading...</option>
                                                                           {options.map((opt: string, oIdx: number) => (
                                                                               <option key={oIdx} value={opt}>{opt}</option>
                                                                           ))}
                                                                        </select>
                                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 dark:text-white/40">
                                                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                           </svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                         });
                                                      })}
                                                  </div>
                                              </div>
                                            )}

                                            {/* SPEAKING QUESTION / Voice Recorder per question */}
                                            {qType === 'SPEAKING_QUESTION' && (
                                              <div className="pl-0 sm:pl-12 mt-4 max-w-xs space-y-4">
                                                 {isRecordingMap[q.id] ? (
                                                    <div className="space-y-4">
                                                      <div className="flex items-center gap-1 h-8 px-4">
                                                        <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full animate-pulse mr-2">
                                                          REC {formatRecordTime(recordingDurationMap[q.id] || 0)}
                                                        </span>
                                                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                                          <motion.div
                                                            key={i}
                                                            animate={{ height: ["8px", "24px", "8px"] }}
                                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                            className="w-1 rounded bg-red-500"
                                                          />
                                                        ))}
                                                      </div>
                                                      <Button
                                                        onClick={() => stopVoiceRecording(q.id)}
                                                        className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-wider h-10 shadow-lg shadow-red-500/20"
                                                      >
                                                        Stop & Save
                                                      </Button>
                                                    </div>
                                                 ) : (
                                                    <div className="space-y-3">
                                                      {!voiceAudioUrlMap[q.id] && (
                                                        <Button
                                                          onClick={() => startVoiceRecording(q.id)}
                                                          className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] tracking-widest h-10 shadow-lg"
                                                        >
                                                          <Mic className="w-3.5 h-3.5 mr-1" /> Record Answer
                                                        </Button>
                                                      )}
                                                      {voiceAudioUrlMap[q.id] && (
                                                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-[2rem] flex flex-col gap-4 shadow-sm">
                                                          <div className="flex justify-between items-center px-1">
                                                             <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Review Recording</span>
                                                             </div>
                                                             <Button 
                                                               variant="ghost" 
                                                               size="sm" 
                                                               className="h-8 px-3 text-[10px] font-black uppercase italic text-slate-400 hover:text-red-500 hover:bg-red-50 gap-1.5 rounded-xl" 
                                                               onClick={() => {
                                                                 setVoiceAudioUrlMap(p => ({...p, [q.id]: null}));
                                                                 setSpeakingAnalysisMap(p => ({...p, [q.id]: null}));
                                                               }}
                                                             >
                                                                <Trash2 className="w-3.5 h-3.5" /> Re-record Answer
                                                             </Button>
                                                          </div>
                                                          <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                                                             {voiceAudioUrlMap[q.id] && <audio controls src={voiceAudioUrlMap[q.id]} className="w-full h-8" />}
                                                          </div>
                                                        </div>
                                                      )}
                                                      {renderSpeakingAnalysis(q.id, q.text || "", q.correctAnswer || "")}
                                                    </div>
                                                 )}
                                                 {false && voiceTranscriptMap[q.id] && (
                                                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl space-y-1 shadow-sm mt-2">
                                                     <span className="text-[9px] font-black uppercase text-blue-500 italic tracking-wider block">Transcription Check</span>
                                                     <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg font-mono">
                                                       "{voiceTranscriptMap[q.id]}"
                                                     </p>
                                                   </div>
                                                 )}
                                              </div>
                                            )}

                                            {/* Feedback Indicator */}
                                            {quizSubmitted && (
                                              <div className="pl-0 sm:pl-8 flex items-center gap-1 mt-1">
                                                {qType === 'SPEAKING_QUESTION' ? (
                                                   <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Response recorded successfully
                                                   </span>
                                                 ) : isCorrect ? (
                                                  <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                                                  </span>
                                                ) : (
                                                  <span className="text-[10px] font-black text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Correct Answer: <span className="underline italic ml-1">
                                                      {qType === 'BLANK' || qType === 'PASSAGE' 
                                                        ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(",")[0] 
                                                        : qType === 'TF' 
                                                          ? ['TRUE', 'FALSE', 'NOT GIVEN'][getQuestionCorrectIndex(q)] || 'TRUE' 
                                                          : qType === 'YN'
                                                            ? ['YES', 'NO', 'NOT GIVEN'][getQuestionCorrectIndex(q)] || 'YES'
                                                            : qType === 'INLINE_BLANKS'
                                                              ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|").map((x: string) => x.split(",")[0]).join(" | ")
                                                              : qType === 'MATCHING'
                                                                ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("\n").join(" | ")
                                                                : q.options?.[getQuestionCorrectIndex(q)] || q.options?.[q.correctIndex] || ""}
                                                    </span>
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </Fragment>
                                      );
                                    })}

                                    {/* Submission Grade Card */}
                                    {!quizSubmitted ? (
                                      activeLessonIdx === (currentModule?.lessons?.length || 1) - 1 ? (
                                        <div className="p-2 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4">
                                          <Button 
                                            className="rounded-xl font-bold text-xs px-6 h-10 shadow-lg shadow-primary/20"
                                            onClick={handleSubmitQuiz}
                                          >
                                            Submit Module Test
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="p-4 mt-4 text-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Complete all units in this module to submit.</p>
                                        </div>
                                      )
                                    ) : (
                                      <Card className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 rounded-[2rem] border-none shadow-inner flex flex-col items-center justify-between gap-4">
                                        <div className="space-y-1 text-center">
                                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase font-black tracking-widest text-[8px]">
                                            Grade Locked
                                          </Badge>
                                          <h4 className="text-sm font-black tracking-tight">Module Score: {quizScore?.correct} / {quizScore?.total} Correct</h4>
                                          <p className="text-[10px] text-slate-400 font-semibold italic">Accuracy: {quizScore?.percent}%</p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <Button 
                                            variant="outline" 
                                            className="rounded-xl font-bold text-xs h-9 border-slate-200"
                                            onClick={handleResetQuiz}
                                          >
                                            <RefreshCw className="w-3 h-3 mr-1" /> Re-attempt
                                          </Button>
                                        </div>
                                      </Card>
                                    )}
                                  </div>
                                ) : (
                                  <div className="min-h-[200px] rounded-2xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed">
                                    <Brain className="w-8 h-8 text-slate-300" />
                                    <h5 className="font-bold text-xs text-slate-500 mt-2">No active questionnaire found</h5>
                                    <p className="text-[10px] text-slate-400">Content developers have not linked dynamic questions to this interactive lesson block yet.</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      )}

                      {/* ================= STAGE RENDER: WRITING ATOM ================= */}
                      {displayType === 'WRITING' && (() => {
                        const writingKey = `${activeModuleIdx}_${activeLessonIdx}_${activePartIdx}`;
                        const currentWritingAnswer = writingAnswers[writingKey] || "";
                        const isCurrentWritingSubmitted = writingSubmitted[writingKey] || false;
                        
                        const handleWritingSubmit = async () => {
                          setWritingSubmitted(prev => ({ ...prev, [writingKey]: true }));
                          const existingSubmissions = safeGetItemAndParse<any[]>('admin_writing_submissions', []);
                          
                          // Look up current student profile from local storage if available
                          const studentProfile = safeGetItemAndParse<any>('student_profile', {});
                          const studentName = studentProfile.name || studentProfile.first_name || 'Anonymous Student';
                          
                          const newSubmission = {
                              id: Date.now().toString(),
                              studentName: studentName,
                              courseTitle: courses[0]?.title || "Course",
                              lessonTitle: currentLesson?.title || "Lesson",
                              moduleIdx: activeModuleIdx,
                              lessonIdx: activeLessonIdx,
                              partIdx: activePartIdx,
                              content: currentWritingAnswer,
                              wordCount: currentWritingAnswer.split(" ").filter(w => w.length > 0).length,
                              submittedAt: new Date().toISOString()
                          };
                          
                          // Quota safeguard: limit list size and try-catch with progressive trimming to fit in local storage limit
                          const combined = [newSubmission, ...existingSubmissions];
                          let itemsToKeep = 10;
                          let success = false;
                          while (itemsToKeep > 0) {
                            try {
                              safeSetItem('admin_writing_submissions', JSON.stringify(combined.slice(0, itemsToKeep)));
                              success = true;
                              break;
                            } catch (e) {
                              itemsToKeep--;
                            }
                          }
                          if (!success) {
                            console.warn("Could not save to admin_writing_submissions local storage - fully out of space.");
                          }

                          if (supabase) {
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              await supabase.from("student_submissions").insert([{
                                student_id: user?.id || null,
                                student_name: studentName,
                                course_id: courses[0]?.id || null,
                                course_title: newSubmission.courseTitle,
                                module_idx: activeModuleIdx,
                                lesson_title: newSubmission.lessonTitle,
                                lesson_type: "WRITING",
                                content: currentWritingAnswer,
                                created_at: newSubmission.submittedAt
                              }]);
                            } catch (error) {
                              console.error("Supabase submissions sync err, reverting to local", error);
                            }
                          }
                        };

                        return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[70vh] min-h-[500px]">
                          {/* Left Panel: Writing Task details */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                            <div className="bg-primary px-4 py-3 shrink-0 flex items-center justify-between">
                               <h5 className="font-black text-white text-xs uppercase tracking-widest italic flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Writing Task Prompt</h5>
                            </div>
                            <ScrollArea className="flex-1 p-5 md:p-8 relative">
                               <div className="prose prose-slate dark:prose-invert prose-sm max-w-none pb-12 leading-loose">
                                  {renderRichBody(displayContent || "No prompt details provided.")}
                               </div>
                            </ScrollArea>
                          </div>

                          {/* Right Panel: Text Input area */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                             <div className="bg-indigo-500 px-4 py-3 shrink-0 flex items-center justify-between">
                               <h5 className="font-black text-white text-xs uppercase tracking-widest italic flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5" /> Candidate Response Draft</h5>
                               <span className="text-[10px] text-white/80 font-bold uppercase block tracking-wider text-right">{currentWritingAnswer.split(" ").filter(w => w.length > 0).length} Words</span>
                             </div>
                             <div className="flex-1 p-4 md:p-6 bg-slate-50 dark:bg-slate-950 relative flex flex-col">
                                <textarea
                                  placeholder="Type your essay or report response here..."
                                  className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-sm resize-none shadow-inner"
                                  value={currentWritingAnswer}
                                  onChange={(e) => setWritingAnswers(prev => ({ ...prev, [writingKey]: e.target.value }))}
                                  disabled={isCurrentWritingSubmitted}
                                />
                                <div className="pt-4 flex items-center justify-end shrink-0">
                                   {!isCurrentWritingSubmitted ? (
                                      <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 dark:shadow-none text-[10px] uppercase h-9 rounded-xl px-4" onClick={handleWritingSubmit}>
                                         Submit Essay
                                      </Button>
                                   ) : (
                                      <Button variant="outline" className="font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] uppercase h-9 rounded-xl px-4" onClick={() => setWritingSubmitted(prev => ({ ...prev, [writingKey]: false }))}>
                                         <RefreshCw className="w-3 h-3 mr-1.5" /> Revise Essay
                                      </Button>
                                   )}
                                </div>
                             </div>
                          </div>
                        </div>
                        );
                      })()}

                      {/* ================= STAGE RENDER: VIDEO ATOM ================= */}
                      {displayType === 'VIDEO' && (
                        <div className="space-y-4">
                          {displayContent ? (
                            <SecureVideoPlayer
                              url={displayContent}
                              title={currentLesson.title || "IELTS Masterclass Video Lesson"}
                              className="border-4 border-white dark:border-slate-800 shadow-2xl"
                            />
                          ) : (
                            <div className="min-h-[300px] rounded-3xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                              <Video className="w-12 h-12 text-slate-300" />
                              <h4 className="font-bold text-slate-500 mt-2">No streaming video registered</h4>
                              <p className="text-xs text-slate-400">Content developers have not linked a raw video URL yet.</p>
                            </div>
                          )}
                          <p className="text-slate-500 text-xs italic leading-relaxed pl-2">
                             Press Play above. Take manual notes of hooks, transitional templates, and high-band grammar metrics.
                          </p>
                        </div>
                      )}

                      {/* ================= STAGE RENDER: VOICE ATOM ================= */}
                      {displayType === 'VOICE' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Left Panel: Content & Instructions */}
                          <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 pb-8">
                            {displayContent && (
                              <div className="bg-white dark:bg-slate-900 leading-relaxed shadow-sm p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                {renderRichBody(displayContent)}
                              </div>
                            )}

                            {displayAudioUrl && (
                              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-3 shadow-inner">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest italic flex items-center gap-1.5">
                                    <Volume2 className="w-4 h-4 text-purple-500" /> Master Audio exhibit
                                  </span>
                                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-none font-black text-[9px] uppercase tracking-wider py-1">Lecture Lesson Playback</Badge>
                                </div>
                                <p className="text-xs text-slate-500 font-semibold italic">Listen closely to the native pronunciation model before testing yourself.</p>
                                {displayAudioUrl && <audio controls src={displayAudioUrl} className="w-full mt-3 rounded-lg" controlsList="nodownload" />}
                              </div>
                            )}
                          </div>

                          {/* Right Panel: Speaking Recorder Station */}
                          <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] p-6 lg:p-8 border border-slate-100 dark:border-white/5 h-fit shadow-sm sticky top-8">
                            {displayEnableRecording ? (
                              <SpeakingRecorder
                                prompt={displayContent || pendingLesson?.title || "Speaking practice response"}
                                onComplete={async (data) => {
                                  // Map SpeakingRecorder analysis back to Courses's display maps
                                  setVoiceAudioUrlMap(p => ({ ...p, global: data.audioUrl }));
                                  if (data.transcript) {
                                    setVoiceTranscriptMap(p => ({ ...p, global: data.transcript }));
                                  }
                                  if (data.analysis) {
                                    setSpeakingAnalysisMap(p => ({ ...p, global: data.analysis }));
                                  }
                                }}
                              />
                            ) : (
                               <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                                  <Mic className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                                  <p className="text-xs font-semibold">Recording is disabled for this lesson material.</p>
                               </div>
                            )}

                            {/* Render Analysis (reuse existing analysis component if it exists in state) */}
                            {speakingAnalysisMap['global'] && (
                                <div className="mt-8">
                                    {renderSpeakingAnalysis('global', displayContent || pendingLesson?.title || "Speaking practice response", "")}
                                </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ================= STAGE RENDER: TEXT / LECTURE ATOM ================= */}
                      {(displayType === 'TEXT' || displayType === 'LEARNING' || !['LISTENING', 'READING', 'WRITING', 'VIDEO', 'VOICE', 'QUIZ', 'PRACTICE'].includes(displayType)) && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <Card className="p-6 sm:p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-xl">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-5">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                  Lesson Study Material
                                </h4>
                                <p className="text-[10px] text-slate-400 font-semibold italic">
                                  Review and study the materials or vocabulary presented below.
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-3xl border border-slate-100 dark:border-white/5 min-h-[400px]">
                              {renderRichBody(displayContent || "")}
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* ================= STAGE RENDER: QUIZ ATOM ================= */}
                      {(displayType === 'QUIZ' || displayType === 'PRACTICE') && (
                        <div className="space-y-6">
                          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-2">
                            <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-800 dark:text-white italic tracking-tight">{currentQuizTitle}</h4>
                            <p className="text-xs text-slate-500 italic font-semibold">{currentQuizDesc || "Complete the following evaluation elements with exact responses."}</p>
                          </div>

                          {currentQuizQuestions.length > 0 ? (() => {
                            const hasSpeakingQuestions = currentQuizQuestions.some(q => q.type === 'SPEAKING_QUESTION');
                            const QuizContentList = (
                              <div className={hasSpeakingQuestions ? "space-y-6 max-h-[700px] overflow-y-auto pr-2 pb-12" : "space-y-6"}>
                                {/* Visual Progress Indicator */}
                                <div className="space-y-1.5 px-1 w-full max-w-sm mb-4">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Progress</span>
                                    {(() => {
                                      const flat = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                      const ansCount = flat.filter(s => s.isAnswered).length;
                                      return (
                                        <span className="text-primary">{ansCount} / {flat.length}</span>
                                      );
                                    })()}
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                                    <div 
                                      className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                                      style={{ 
                                        width: `${(() => {
                                          const flat = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                          const ansCount = flat.filter(s => s.isAnswered).length;
                                          return flat.length > 0 ? Math.round((ansCount / flat.length) * 100) : 0;
                                        })()}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                                                                {currentQuizQuestions.map((q, qIdx) => {
                                const qType = q.type || 'MCQ';
                                const isCorrect = checkIsCorrect(q, quizAnswers);
                                const hasAnswered = isQuestionAnswered(q, quizAnswers);
                                const hasInlineBlank = (qType === 'BLANK' || qType === 'PASSAGE') && 
                                  typeof q.text === "string" && 
                                  (/_{2,}/.test(q.text) || q.text.toLowerCase().includes("[blank]"));
                                
                                // MATCHING group detection
                                const getHeadingsStr = (item: any) => {
                                  if (!item) return "";
                                  const p = item.passageText ?? item.headings ?? item.options ?? "";
                                  return typeof p === "string" ? p.trim() : (Array.isArray(p) ? p.join("\n").trim() : String(p).trim());
                                };
                                const isMatching = qType === 'MATCHING';
                                const prevQ = qIdx > 0 ? currentQuizQuestions[qIdx - 1] : null;
                                const prevH = getHeadingsStr(prevQ);
                                const currH = getHeadingsStr(q);
                                const isFirstInMatchingGroup = !prevQ || (prevQ.type || '').toUpperCase() !== 'MATCHING' || prevH !== currH || !currH;

                                if (isMatching && !isFirstInMatchingGroup) {
                                  return null;
                                }

                                const matchingGroupQuestions = [];
                                if (isMatching) {
                                  let tempIdx = qIdx;
                                  while (tempIdx < currentQuizQuestions.length) {
                                    const tempQ = currentQuizQuestions[tempIdx];
                                    if (tempQ && (tempQ.type || '').toUpperCase() === 'MATCHING' && getHeadingsStr(tempQ) === currH) {
                                      matchingGroupQuestions.push({ q: tempQ, originalIdx: tempIdx });
                                      tempIdx++;
                                    } else {
                                      break;
                                    }
                                  }
                                }

                                return (
                                  <Fragment key={`comp-frag-${q.id || qIdx}-${qIdx}`}>
                                    {(() => {
                                      if (!q.sectionHeading && !q.sectionInstruction) return null;
                                      if (prevQ) {
                                        const sameHeading = (prevQ.sectionHeading || "") === (q.sectionHeading || "");
                                        const sameInstruction = (prevQ.sectionInstruction || "") === (q.sectionInstruction || "");
                                        if (sameHeading && sameInstruction) return null;
                                      }
                                      return (
                                        <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 border border-dashed border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-2 mt-6 mb-2 scroll-mt-4 select-none">
                                          {q.sectionHeading && (
                                            <h5 className="text-sm sm:text-base font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                                              {q.sectionHeading}
                                            </h5>
                                          )}
                                          {q.sectionInstruction && (
                                            <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                              {q.sectionInstruction}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <div 
                                      id={`question-card-${q.id}`}
                                      className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 rounded-3xl space-y-4 relative"
                                    >
                                      <div className="flex items-start gap-4">
                                                                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black italic shrink-0">
                                          {(() => {
                                            if (isMatching && matchingGroupQuestions.length > 0) {
                                              const flatQuestions = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted);
                                              const firstSub = flatQuestions.find(s => s.blockIdx === matchingGroupQuestions[0].originalIdx);
                                              const lastSub = flatQuestions.find(s => s.blockIdx === matchingGroupQuestions[matchingGroupQuestions.length - 1].originalIdx);
                                              const startNum = firstSub ? firstSub.qNum : (matchingGroupQuestions[0].q.qNum || qIdx + 1);
                                              const endNum = lastSub ? lastSub.qNum : (matchingGroupQuestions[matchingGroupQuestions.length - 1].q.qNum || startNum);
                                              if (startNum !== endNum) return `${startNum}-${endNum}`;
                                              return startNum;
                                            }
                                            const subs = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).filter(s => s.blockIdx === qIdx);
                                            if (subs.length > 1) {
                                              return `${subs[0].qNum}-${subs[subs.length - 1].qNum}`;
                                            }
                                            return subs[0]?.qNum || (qIdx + 1);
                                          })()}
                                        </div>
                                        <div className="space-y-2">
                                          <Badge className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-none font-bold text-[10px] uppercase tracking-wider py-1 select-none mb-1">
                                            {qType === 'TF' ? 'True / False / Not Given' : qType === 'YN' ? 'Yes / No / Not Given' : qType === 'BLANK' ? 'Fill in the Blank' : qType === 'INLINE_BLANKS' ? 'Paragraph with Blanks' : qType === 'MATCHING' ? 'Matching Headings' : 'Multiple Choice'}
                                          </Badge>
                                          {hasInlineBlank ? (
                                            <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-relaxed pt-0.5">
                                              {q.text.split(/_{2,}|\[BLANK\]/i).map((part: string, index: number, array: string[]) => {
                                                if (index === array.length - 1) return <span key={index}>{part}</span>;
                                                if (index === 0) {
                                                  return (
                                                    <Fragment key={index}>
                                                      <span>{part}</span>
                                                      <input
                                                        type="text"
                                                        disabled={quizSubmitted}
                                                        value={quizAnswers[q.id] || ""}
                                                        onChange={e => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                        className={`inline-block w-48 border-b-4 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-0.5 mx-2 focus:ring-0 focus:border-indigo-500 text-center font-black outline-none transition-all ${quizSubmitted ? (isCorrect ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : "border-red-500 text-red-600 bg-red-500/10") : ""}`}
                                                      />
                                                    </Fragment>
                                                  );
                                                }
                                                return (
                                                  <Fragment key={index}>
                                                    <span>{part}</span>
                                                    <span className="font-bold text-slate-400">_____</span>
                                                  </Fragment>
                                                );
                                              })}
                                            </h4>
                                          ) : (
                                            !['INLINE_BLANKS', 'MATCHING'].includes(qType) && (
                                              <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-relaxed pt-0.5">{typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))}</h4>
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* MCQ Option Grid */}
                                      {(qType === 'MCQ') && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-12">
                                          {q.options?.map((opt: string, optIdx: number) => {
                                            const isSelected = quizAnswers[q.id] === optIdx;
                                            
                                            // Visual parameters depending on submission
                                            let borderClass = "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900";
                                            let textClass = "text-slate-700 dark:text-slate-300";
                                            let circleBg = "border-slate-300";

                                            if (isSelected) {
                                              borderClass = "border-primary bg-primary/5 dark:bg-primary/5 ring-1 ring-primary/40";
                                            }

                                            if (quizSubmitted) {
                                              if (isSelected) {
                                                if (isCorrect) {
                                                  borderClass = "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/35";
                                                  circleBg = "border-emerald-500 bg-emerald-500 text-white";
                                                } else {
                                                  borderClass = "border-red-500 bg-red-400/5 ring-1 ring-red-500/35";
                                                  circleBg = "border-red-500 bg-red-500 text-white";
                                                }
                                              } else if (optIdx === q.correctIndex) {
                                                // Highlight correct one anyway
                                                borderClass = "border-emerald-400 bg-emerald-400/5";
                                              }
                                            }

                                            return (
                                              <div 
                                                key={optIdx} 
                                                onClick={() => handleSelectOption(q.id, optIdx)}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${borderClass} ${quizSubmitted ? 'pointer-events-none' : ''}`}
                                              >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black ${circleBg}`}>
                                                  {isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
                                                </div>
                                                <span className={`text-sm sm:text-base font-semibold leading-relaxed ${textClass}`}>{opt}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* True / False / Not Given Option Row */}
                                      {(qType === 'TF' || qType === 'YN') && (
                                        <div className="grid grid-cols-3 gap-3 pl-0 sm:pl-12">
                                          {(qType === 'TF' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map((opt, optIdx) => {
                                            const isSelected = quizAnswers[q.id] === optIdx;

                                            let borderClass = "border-slate-150 dark:border-white/5 bg-white dark:bg-slate-900 text-slate-500";
                                            if (isSelected) {
                                              borderClass = "border-primary bg-primary/10 text-primary font-black ring-1 ring-primary/30";
                                            }

                                            if (quizSubmitted) {
                                              if (isSelected) {
                                                if (isCorrect) {
                                                  borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-black";
                                                } else {
                                                  borderClass = "border-red-500 bg-red-500/10 text-red-500 font-black";
                                                }
                                              } else if (optIdx === q.correctIndex) {
                                                borderClass = "border-emerald-400 bg-emerald-400/5 text-emerald-500";
                                              }
                                            }

                                            return (
                                              <button
                                                type="button"
                                                key={optIdx}
                                                onClick={() => {
                                                  if (quizSubmitted) return;
                                                  setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }));
                                                }}
                                                className={`p-3 sm:p-4 rounded-xl text-center border font-bold text-sm sm:text-base tracking-wider cursor-pointer transition-all uppercase leading-none ${borderClass} ${quizSubmitted ? 'pointer-events-none' : ''}`}
                                              >
                                                {opt}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Fill in the Blanks Input */}
                                      {(qType === 'BLANK' || qType === 'PASSAGE') && !hasInlineBlank && (
                                        <div className="pl-0 sm:pl-12 space-y-1.5">
                                          <input
                                            type="text"
                                            placeholder="Type your completion word or short term..."
                                            disabled={quizSubmitted}
                                            value={quizAnswers[q.id] || ""}
                                            onChange={(e) => {
                                              setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                                            }}
                                            className={`h-12 w-full px-5 rounded-xl border bg-white dark:bg-slate-900 text-base font-semibold focus:ring-1 focus:ring-primary focus-visible:outline-none ${quizSubmitted ? (isCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600" : "border-red-500 bg-red-500/5 text-red-600") : "border-slate-200 dark:border-white/10"}`}
                                          />
                                        </div>
                                      )}

                                      {/* Inline Blanks Input */}
                                      {qType === 'INLINE_BLANKS' && (
                                        <div className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap pl-0 sm:pl-12 mt-2">
                                          {(typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))).split(/_____|\[BLANK\]/i).map((part: string, index: number, array: string[]) => {
                                            if (index === array.length - 1) return <span key={index}>{part}</span>;
                                            
                                            const isSelectedCorrect = quizSubmitted ? (() => {
                                                const studentAns = (quizAnswers[`${q.id}_${index}`]?.toString() || "").trim().toLowerCase();
                                                const ansGroup = (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|")[index] || "";
                                                const correctOptions = ansGroup.split(",").map((x: string) => x.trim().toLowerCase());
                                                return correctOptions.some((opt: string) => studentAns === opt && opt);
                                            })() : null;

                                            const subQ = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).find(s => s.blockIdx === qIdx && s.subIdx === index);
                                            const subQuestionNumber = subQ ? subQ.qNum : "";

                                            return (
                                              <Fragment key={index}>
                                                <span>{part}</span>
                                                <span className="inline-flex items-center gap-1 mx-1 select-none">
                                                  <span className="text-xs font-black text-primary bg-primary/10 rounded px-2 py-0.5 italic">{subQuestionNumber}</span>
                                                  <input
                                                    type="text"
                                                    disabled={quizSubmitted}
                                                    value={quizAnswers[`${q.id}_${index}`] || ""}
                                                    onChange={e => setQuizAnswers(prev => ({ ...prev, [`${q.id}_${index}`]: e.target.value }))}
                                                    className={`inline-block w-40 border-b-2 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 mx-2 focus:ring-0 focus:border-primary text-center font-bold outline-none ring-0 ${quizSubmitted ? (isSelectedCorrect ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : "border-red-500 text-red-600 bg-red-500/10") : ""}`}
                                                  />
                                                </span>
                                              </Fragment>
                                            );
                                          })}
                                        </div>
                                      )}

                                                                            {/* Matching Headings */}
                                      {qType === 'MATCHING' && (() => {
                                        return (
                                          <div className="pl-0 sm:pl-12 space-y-5 mt-2">
                                              <div className="bg-slate-100/50 dark:bg-white/5 p-5 py-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
                                                 <h5 className="text-[10px] sm:text-xs font-black uppercase text-indigo-500 tracking-wider">List of Headings / Features</h5>
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                     {(typeof q.passageText === "string" ? q.passageText : (Array.isArray(q.passageText) ? q.passageText.join("\n") : String(q.passageText || ""))).split("\n").filter(Boolean).map((opt: string, oIdx: number) => (
                                                         <div key={oIdx} className="text-sm font-semibold text-slate-700 dark:text-slate-300">{opt}</div>
                                                     ))}
                                                 </div>
                                              </div>
                                              
                                              <div className="space-y-3">
                                                  {matchingGroupQuestions.map(({ q: groupQ, originalIdx }) => {
                                                     const prompts = (typeof groupQ.text === "string" ? groupQ.text : (Array.isArray(groupQ.text) ? groupQ.text.join("\n") : String(groupQ.text || ""))).split("\n").filter(Boolean);
                                                     return prompts.map((prompt: string, pIdx: number) => {
                                                         const options = (typeof groupQ.passageText === "string" ? groupQ.passageText : (Array.isArray(groupQ.passageText) ? groupQ.passageText.join("\n") : String(groupQ.passageText || ""))).split("\n").filter(Boolean);
                                                         
                                                         const isSelectedCorrect = quizSubmitted ? (() => {
                                                             const studentAns = (quizAnswers[groupQ.id]?.toString() || quizAnswers[`${groupQ.id}_${pIdx}`]?.toString() || "").trim().toLowerCase();
                                                             const correctAns = (typeof groupQ.correctAnswer === "string" ? groupQ.correctAnswer : (Array.isArray(groupQ.correctAnswer) ? groupQ.correctAnswer.join("\n") : String(groupQ.correctAnswer || ""))).split("\n").filter(Boolean)[pIdx] || (typeof groupQ.correctAnswer === "string" ? groupQ.correctAnswer : "");
                                                             const correctAlternatives = correctAns.split(",").map((x: string) => x.trim().toLowerCase());
                                                             return correctAlternatives.some((opt: string) => studentAns === opt && opt);
                                                         })() : null;
                                                         
                                                         return (
                                                             <div key={`${groupQ.id}-${pIdx}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm max-w-full overflow-hidden">
                                                                 {(() => {
                                                                     const subQ = getFlatSubQuestions(currentQuizQuestions, quizAnswers, quizSubmitted).find(s => s.blockIdx === originalIdx && s.subIdx === pIdx);
                                                                     const subQuestionNumber = subQ ? subQ.qNum : (groupQ.qNum || originalIdx + 1);
                                                                     return (
                                                                         <span className="text-sm font-bold text-slate-900 dark:text-white flex-1 flex items-start gap-2.5 min-w-0 pr-2">
                                                                             <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-black italic flex items-center justify-center shrink-0 mt-0.5">{subQuestionNumber}</span>
                                                                             <span className="break-words self-center leading-relaxed">{prompt}</span>
                                                                         </span>
                                                                     );
                                                                 })()}
                                                                 <div className="relative w-full md:w-64 shrink-0 text-left">
                                                                     <select
                                                                         disabled={quizSubmitted}
                                                                         value={quizAnswers[groupQ.id] || quizAnswers[`${groupQ.id}_${pIdx}`] || ""}
                                                                         onChange={e => setQuizAnswers(prev => ({ ...prev, [groupQ.id]: e.target.value, [`${groupQ.id}_${pIdx}`]: e.target.value }))}
                                                                         className={`w-full h-11 rounded-xl border bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-1 focus:ring-primary focus-visible:outline-none pl-4 pr-10 appearance-none font-sans cursor-pointer truncate ${quizSubmitted ? (isSelectedCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold" : "border-red-500 bg-red-500/5 text-red-600 font-bold") : "border-slate-200 dark:border-white/10"}`}
                                                                     >
                                                                    <option value="" disabled>Select heading...</option>
                                                                    {options.map((opt: string, oIdx: number) => (
                                                                        <option key={oIdx} value={opt}>{opt}</option>
                                                                    ))}
                                                                 </select>
                                                                 <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 dark:text-white/40">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                 </div>
                                                             </div>
                                                          </div>
                                                         );
                                                     });
                                                  })}
                                              </div>
                                          </div>
                                        );
                                      })()}

                                      {/* SPEAKING QUESTION / Voice Recorder per question */}
                                      {qType === 'SPEAKING_QUESTION' && (
                                        <div className="pl-0 sm:pl-12 mt-4 space-y-4">
                                            {/* Handled by global SpeakingRecorder on the right panel */}
                                        </div>
                                      )}

                                      {/* Feedback Indicator */}
                                      {quizSubmitted && (
                                        <div className="pl-0 sm:pl-10 flex items-center gap-2 mt-2">
                                          {qType === 'SPEAKING_QUESTION' ? (
                                             <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                               <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Response recorded successfully
                                             </span>
                                           ) : isCorrect ? (
                                            <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                                              <CheckCircle2 className="w-4 h-4" /> Response Correct
                                            </span>
                                          ) : (
                                            <span className="text-xs font-black text-red-500 flex items-center gap-1">
                                              <AlertCircle className="w-4 h-4" /> Correct Answer: <span className="underline italic ml-1">
                                                {qType === 'BLANK' || qType === 'PASSAGE' 
                                                  ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split(",")[0] 
                                                  : qType === 'TF' 
                                                    ? ['TRUE', 'FALSE', 'NOT GIVEN'][getQuestionCorrectIndex(q)] || 'TRUE' 
                                                  : qType === 'YN'
                                                    ? ['YES', 'NO', 'NOT GIVEN'][getQuestionCorrectIndex(q)] || 'YES' 
                                                    : qType === 'INLINE_BLANKS'
                                                      ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("|").map((x: string) => x.split(",")[0]).join(" | ")
                                                      : qType === 'MATCHING'
                                                        ? (typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : String(q.correctAnswer || ""))).split("\n").join(" | ")
                                                        : q.options?.[getQuestionCorrectIndex(q)] || q.options?.[q.correctIndex] || ""}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </Fragment>
                                );
                              })}

                              {/* Submission Grade Card */}
                              {!quizSubmitted ? (
                                activeLessonIdx === (currentModule?.lessons?.length || 1) - 1 ? (
                                  <div className="p-4 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-6">
                                    <Button 
                                      className="rounded-xl font-bold px-8 h-11 shadow-lg shadow-primary/20"
                                      onClick={handleSubmitQuiz}
                                    >
                                      Submit Module Test
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="p-5 mt-6 text-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Complete all units in this module to submit your test.</p>
                                  </div>
                                )
                              ) : (
                                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 rounded-[2rem] border-none shadow-inner flex flex-col sm:flex-row items-center justify-between gap-6">
                                  <div className="space-y-1.5 text-center sm:text-left">
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase font-black tracking-widest text-[9px]">
                                      Grade Locked
                                    </Badge>
                                    <h4 className="text-lg font-black tracking-tight">Module Score: {quizScore?.correct} / {quizScore?.total} Correct</h4>
                                    <p className="text-xs text-slate-500 font-semibold italic">Synchronic accuracy calculated as {quizScore?.percent}% accuracy.</p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    <Button 
                                      variant="outline" 
                                      className="rounded-xl font-bold h-11 border-slate-200"
                                      onClick={handleResetQuiz}
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-attempt
                                    </Button>
                                    
                                    <Button
                                      className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20"
                                      onClick={() => setActiveCourse(null)}
                                    >
                                      Return to Courses
                                    </Button>

                                    {quizScore && quizScore.percent >= 80 && (
                                      <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-amber-500/10" title="High Efficiency Badge Awarded">
                                        <Star className="w-5 h-5 fill-current" />
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              )}
                            </div>
                            );

                            return hasSpeakingQuestions ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="lg:col-span-1">
                                  {QuizContentList}
                                </div>
                                <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] p-6 lg:p-8 border border-slate-100 dark:border-white/5 h-fit shadow-sm sticky top-8">
                                  <SpeakingRecorder
                                    prompt={currentQuizTitle || "Speaking Quiz"}
                                    onComplete={(data) => {
                                      setVoiceAudioUrlMap(p => ({ ...p, global_quiz: data.audioUrl }));
                                      if (data.transcript) {
                                        setVoiceTranscriptMap(p => ({ ...p, global_quiz: data.transcript }));
                                      }
                                      if (data.analysis) {
                                        setSpeakingAnalysisMap(p => ({ ...p, global_quiz: data.analysis }));
                                      }
                                    }}
                                  />
                                  <div className="mt-8">
                                    {renderSpeakingAnalysis('global_quiz', currentQuizTitle || "Speaking test", "")}
                                  </div>
                                </div>
                              </div>
                            ) : QuizContentList;
                          })() : (
                            <div className="min-h-[300px] rounded-3xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                              <Brain className="w-12 h-12 text-slate-300" />
                              <h4 className="font-bold text-slate-500 mt-2">No active questionnaire found</h4>
                              <p className="text-xs text-slate-400">Content developers have not linked dynamic questions to this interactive lesson block yet.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-indigo-500 animate-pulse" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Syllabus item not loaded</h4>
                      <p className="text-sm text-slate-500 max-w-sm">This study track does not contain active syllabus modules yet or the curriculum is empty.</p>
                      <Button 
                        className="mt-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 shadow-lg shadow-indigo-500/20"
                        onClick={confirmExit}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Return to Catalog
                      </Button>
                    </div>
                  )}

                  {/* Syllabus Stepper Controls in Footer Footer */}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex items-center justify-between gap-4 mt-8">
                    <Button 
                      variant="outline"
                      className="rounded-xl font-bold text-xs h-10 border-slate-200 shadow-sm"
                      onClick={handlePrevLesson}
                      disabled={activeModuleIdx === 0 && activeLessonIdx === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous Lesson
                    </Button>

                    <div className="hidden sm:block text-center rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-2 hover:bg-slate-100 cursor-default transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Lesson Progression</p>
                      <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 mt-1 leading-none">
                        {getCourseTestLabel()}
                      </p>
                    </div>

                    {currentLesson && !completedLessons.includes(currentLesson.id) ? (
                      (() => {
                        const courseScores = safeGetItemAndParse<Record<string, any>>("course_scores", {});
                        const highestScore = activeCourse?.id ? courseScores[activeCourse.id] : undefined;
                        const isLastLessonOfCourse = activeModuleIdx === (activeCourse?.modules?.length || 1) - 1 && activeLessonIdx === (currentModule?.lessons?.length || 1) - 1;
                        const requiresScore = isLastLessonOfCourse && (highestScore === undefined || highestScore < 90);

                        return (
                          <Button 
                            className={`rounded-xl font-bold text-xs h-10 shadow-lg ${requiresScore ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'}`}
                            onClick={requiresScore ? undefined : handleMarkComplete}
                            disabled={requiresScore}
                            title={requiresScore ? "Score 90% or above on the module test to mark the course complete" : "Mark as complete"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> {requiresScore ? "90% required to complete" : "Mark Complete"}
                          </Button>
                        );
                      })()
                    ) : (
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Completed</span>
                      </div>
                    )}

                    <Button 
                      className="rounded-xl font-bold text-xs h-10 shadow-lg shadow-primary/10"
                      onClick={handleNextLesson}
                      disabled={
                        activeModuleIdx === (activeCourse?.modules?.length || 1) - 1 &&
                        activeLessonIdx === (currentModule?.lessons?.length || 1) - 1
                      }
                    >
                      Next Lesson <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Mobile Syllabus Drawer (Visible on small displays only) */}
              <AnimatePresence>
                {showMobileSyllabus && (
                  <>
                    <motion.div 
                      key="backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowMobileSyllabus(false)}
                      className="fixed inset-0 bg-black z-50 lg:hidden"
                    />
                    <motion.div
                      key="drawer"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 z-[60] shadow-2xl p-6 lg:hidden flex flex-col justify-between"
                    >
                      <div className="space-y-6 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 shrink-0">
                          <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white leading-none">
                              Syllabus Roadmap
                            </h4>
                            <p className="text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-widest">Select a candidate unit</p>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-full border border-slate-100 dark:border-white/5" 
                            onClick={() => setShowMobileSyllabus(false)}
                          >
                            <X className="w-4 h-4 text-slate-600" />
                          </Button>
                        </div>

                        <ScrollArea className="flex-1 pr-1 overflow-y-auto">
                          <div className="space-y-4 pr-2">
                            {activeCourse?.modules?.map((mod: any, mIdx: number) => (
                              <div key={mod.id} className="space-y-1.5">
                                <div className="flex items-center gap-2 pl-2 flex-wrap">
                                  <span className="text-[9px] font-black uppercase text-primary italic tracking-widest block">
                                    {mIdx + 1}. {mod.title}
                                  </span>
                                  {(() => {
                                    const skill = (mod.skillType || "").toLowerCase();
                                    if (skill === "reading") return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-1 h-4 px-1.5 min-h-0"><BookOpen className="w-2.5 h-2.5"/> Reading</Badge>;
                                    if (skill === "writing") return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-1 h-4 px-1.5 min-h-0"><PenTool className="w-2.5 h-2.5"/> Writing</Badge>;
                                    if (skill === "listening") return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-1 h-4 px-1.5 min-h-0"><Volume2 className="w-2.5 h-2.5"/> Listening</Badge>;
                                    if (skill === "speaking") return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-1 h-4 px-1.5 min-h-0"><Mic className="w-2.5 h-2.5"/> Speaking</Badge>;
                                    if (skill === "diagnostic" || skill === "diagnostics") return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-1 h-4 px-1.5 min-h-0"><Brain className="w-2.5 h-2.5"/> Diagnostics</Badge>;
                                    return mod.skillType ? <Badge className="bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-none text-[8px] font-black uppercase tracking-wider h-4 px-1.5 min-h-0">{mod.skillType}</Badge> : null;
                                  })()}
                                </div>
                                <div className="space-y-1">
                                  {mod.lessons?.map((lesson: any, lIdx: number) => {
                                    const isActive = activeModuleIdx === mIdx && activeLessonIdx === lIdx;
                                    return (
                                      <button
                                        key={lesson.id}
                                        onClick={() => {
                                          handleLessonChange(mIdx, lIdx);
                                          setShowMobileSyllabus(false);
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs font-semibold ${isActive ? 'bg-primary/5 border-l-4 border-l-primary text-primary shadow-sm dark:bg-white/5 pl-3' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/3'}`}
                                      >
                                        <div className="flex items-center gap-2 truncate min-w-0">
                                          {getLessonIcon(lesson.type)}
                                          <span className="truncate">{lesson.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {completedLessons.includes(lesson.id) && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                          <ChevronRight className="w-3 h-3 text-slate-300" />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="border-t border-slate-100 dark:border-white/5 pt-4 shrink-0">
                        <Button 
                          className="w-full rounded-xl text-xs font-bold py-2.5 shadow-lg shadow-primary/10" 
                          onClick={() => setShowMobileSyllabus(false)}
                        >
                          Return to Classroom
                        </Button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {lessonTimeUp[currentLessonKey] && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100 dark:border-white/10"
                    >
                      <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-6 shadow-inner">
                        <Clock className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Time Finished!</h3>
                      <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
                        The time limit for this unit has expired. Please start again.
                      </p>
                      <Button 
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 text-sm font-black uppercase tracking-wider"
                        onClick={() => {
                            handleResetQuiz();
                            setWritingAnswers({});
                            setWritingSubmitted({});
                            setLessonTimers(prev => ({ ...prev, [currentLessonKey]: (pendingLesson?.timeLimit || 5) * 60 }));
                            setLessonTimeUp(prev => ({ ...prev, [currentLessonKey]: false }));
                            // Also clear writing/other state if necessary
                        }}
                      >
                        Start Again
                      </Button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
  
  if (activeCourse && activeCourseId && isDashboardMode && typeof document !== 'undefined') {
    return createPortal(mainContent, document.body);
  }
  
  return mainContent;
}

export default function StudentCourses(props: { 
  isDashboardMode?: boolean; 
  initialFilter?: string; 
  userPlan?: string;
  onTriggerUpgrade?: (planName: string, price: number) => void;
}) {
  return (
    <CoursesErrorBoundary>
      <StudentCoursesInner {...props} />
    </CoursesErrorBoundary>
  );
}
