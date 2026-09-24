import { useState, useEffect, useMemo, Fragment } from "react";
import IeltsTestView from "../../components/IeltsTestView";

import { flattenQuestionsToIndividual, countTotalQuestions, normalizeCourseToSections } from "@/src/utils/questionFlattener";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Flag,
  ChevronRight,
  ChevronLeft,
  Layout,
  Send,
  AlertTriangle,
  PlayCircle,
  BookOpen,
  Headset,
  Headphones,
  PenTool,
  Mic,
  CheckCircle2,
  Award,
  ArrowLeft,
  ArrowRight,
  History,
  BarChart3,
  Calendar,
  RefreshCcw,
  RefreshCw,
  TrendingUp,
  Target,
  Activity,
  GraduationCap,
  Users,
  Search,
  ChevronDown,
  Zap,
  Lock,
  Crown,
  Gem,
  CreditCard,
  Highlighter,
  Edit3,
  Volume2,
  Play,
  Pause,
  Flame,
  Sparkles,
  Plus,
  Trash,
  Trash2,
  Star,
  Key,
  LayoutGrid,
} from "lucide-react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { canAccessMockTest, fetchMembershipTiers, MembershipTier } from "@/src/lib/membershipService";
import ReactMarkdown from "react-markdown";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../lib/supabaseClient";
import { SpeakingRecorder } from "../../components/dashboard/SpeakingRecorder";
import { SpeakingTestModule } from "../../components/dashboard/SpeakingTestModule";
import { toast } from "sonner";

// Smart Writing Coach Vocab & Band Projected Estimator helper function
const getWritingCoaching = (text: string) => {
  const rawText = text || "";
  const words = rawText.split(/\s+/).filter(Boolean);
  const count = words.length;

  const transitions = [
    "however",
    "therefore",
    "subsequently",
    "moreover",
    "nevertheless",
    "consequently",
    "furthermore",
    "nonetheless",
    "firstly",
    "secondly",
    "finally",
    "in addition",
    "as a result",
    "whereas",
    "on the other hand",
  ];
  const transitionsUsed = transitions.filter((t) =>
    rawText.toLowerCase().includes(t),
  );

  const advancedAcademicTerms = [
    "facilitate",
    "conjecture",
    "substantiate",
    "prominent",
    "detrimental",
    "expedite",
    "implement",
    "paramount",
    "empirical",
    "requisite",
    "aggregate",
    "inevitable",
    "concur",
    "advocate",
  ];
  const advancedUsed = advancedAcademicTerms.filter((w) =>
    rawText.toLowerCase().includes(w),
  );

  const weakVocabulary = [
    { weak: "very", replace: "extremely, exceptionally, immensely" },
    { weak: "good", replace: "beneficial, exemplary, superb, advantageous" },
    { weak: "bad", replace: "detrimental, adverse, unfavorable, catastrophic" },
    { weak: "happy", replace: "exhilarated, content, delighted, ecstatic" },
    { weak: "sad", replace: "melancholic, despondent, dejected" },
    { weak: "big", replace: "substantial, massive, colossal, gargantuan" },
  ];
  const weakFlagged = weakVocabulary.filter((f) =>
    new RegExp(`\\b${f.weak}\\b`, "i").test(rawText),
  );

  let projectedBand = 5.0;
  if (count > 50) projectedBand = 5.5;
  if (count > 120) projectedBand = 6.0;
  if (count > 180 && transitionsUsed.length >= 2) projectedBand = 6.5;
  if (count > 250 && transitionsUsed.length >= 3) projectedBand = 7.5;
  if (count > 300 && transitionsUsed.length >= 4 && advancedUsed.length >= 2)
    projectedBand = 8.5;

  return {
    count,
    transitionsUsed,
    advancedUsed,
    weakFlagged,
    projectedBand,
  };
};

const getSpeakingPartDetails = (q: any, qIdx: number) => {
  let partNumber = q.part || q.partNumber || null;
  let heading = q.sectionHeading || null;
  let instruction = q.sectionInstruction || null;

  const textLower = String(q.text || "").toLowerCase();
  const idLower = String(q.id || "").toLowerCase();

  if (!partNumber) {
    if (
      idLower.includes("part-1") ||
      idLower.includes("part1") ||
      textLower.includes("part 1")
    ) {
      partNumber = 1;
    } else if (
      idLower.includes("part-2") ||
      idLower.includes("part2") ||
      textLower.includes("part 2") ||
      textLower.includes("cue card") ||
      idLower.includes("cue-card")
    ) {
      partNumber = 2;
    } else if (
      idLower.includes("part-3") ||
      idLower.includes("part3") ||
      textLower.includes("part 3")
    ) {
      partNumber = 3;
    } else {
      partNumber = qIdx === 0 ? 1 : qIdx === 1 ? 2 : 3;
    }
  }

  if (!heading) {
    if (partNumber === 1) {
      heading = "Part 1: Introduction & General Interview";
    } else if (partNumber === 2) {
      heading = "Part 2: Individual Long Turn (Cue Card)";
    } else if (partNumber === 3) {
      heading = "Part 3: Two-Way Analytical Discussion";
    } else {
      heading = `Part ${partNumber}: Extended Segment`;
    }
  }

  if (!instruction) {
    if (partNumber === 1) {
      instruction =
        "The examiner will ask you general, warm-up questions on familiar topics such as home, studies, hobbies, or daily routines. Try to speak naturally and give smooth, complete responses.";
    } else if (partNumber === 2) {
      instruction =
        "You will be given a cue card describing a specific scenario. You have 1 minute to plan your answer using a pen and paper. Speak continuously for 1 to 2 minutes, addressing all follow-up prompts.";
    } else if (partNumber === 3) {
      instruction =
        "You will be asked deeper questions connected to the topic in Part 2. These questions allow you to discuss more abstract, analytical issues and articulate logical viewpoints.";
    } else {
      instruction =
        "Express your perspective eloquently. Aim for wide lexical variation, flexible cohesive linkers, and precise grammar structures.";
    }
  }

  return { partNumber, heading, instruction };
};

export const slugify = (str: string): string => {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const getTestYearAndMonth = (test: any) => {
  if (!test) return { year: "2026", month: "January" };

  let rawYear = test.test_year ?? test.year;
  let year = rawYear ? String(rawYear).trim() : "";

  if (!year || !/^\d{4}$/.test(year)) {
    const searchStr = `${test.name || ""} ${test.title || ""} ${test.description || ""} ${test.id || ""}`;
    const match = searchStr.match(/\b(202[0-9])\b/);
    if (match) {
      year = match[1];
    }
  }

  if ((!year || !/^\d{4}$/.test(year)) && test.created_at) {
    try {
      const d = new Date(test.created_at);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear().toString();
      }
    } catch (e) {}
  }

  if (!year || !/^\d{4}$/.test(year)) {
    year = "2026";
  }

  let rawMonth = test.test_month ?? test.month;
  let month = rawMonth ? String(rawMonth).trim() : "";

  if (!month || month === "Other") {
    const searchStr = `${test.name || ""} ${test.title || ""}`;
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    for (const m of monthNames) {
      if (new RegExp(`\\b${m}\\b`, "i").test(searchStr)) {
        month = m;
        break;
      }
    }
  }

  if ((!month || month === "Other") && test.created_at) {
    try {
      const d = new Date(test.created_at);
      if (!isNaN(d.getTime())) {
        month = d.toLocaleString("en-US", { month: "long" });
      }
    } catch (e) {}
  }

  if (!month || month === "Other") {
    month = "January";
  }

  return { year, month };
};

export const parseTestPath = (pathname: string) => {
  const cleanPath = pathname.replace(/^\/dashboard/, "");
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length >= 2 && segments[0].toLowerCase().startsWith("ielts-mock-test-")) {
    const yearPart = segments[0].toLowerCase().replace("ielts-mock-test-", "").trim();
    const monthPart = segments[1].toLowerCase().trim();
    const testNamePart = segments[2] ? decodeURIComponent(segments[2]).toLowerCase().trim() : null;
    const testTypePart = segments[3] ? decodeURIComponent(segments[3]).toLowerCase().trim() : null;
    return {
      isMockRoute: true,
      year: yearPart || "2026",
      month: monthPart,
      testName: testNamePart,
      testType: testTypePart,
    };
  }
  return null;
};

const isUserLoggedIn = (): boolean => {
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

interface MockTestProps {
  defaultCategory?: "All" | "Academic" | "General Training";
}

export default function MockTest({ defaultCategory }: MockTestProps = {}) {
  const { testId: routeTestId, year: paramYear, month: paramMonth, testName: paramTestName, testType: paramTestType } = useParams<any>();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardMode = location.pathname.startsWith("/dashboard");

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("sb-user") || localStorage.getItem("authenticated_user") || localStorage.getItem("student_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [attemptHistory, setAttemptHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("tests");

  // Dynamic question numbering across the entire test (from 1 to 40)
  const questionNumbering = useMemo(() => {
    const numberMap: Record<string, number> = {};
    const blockStartMap: Record<string, number> = {};
    const blockEndMap: Record<string, number> = {};

    if (selectedTest && Array.isArray(selectedTest.sections)) {
      let currentNum = 1;
      selectedTest.sections.forEach((sec: any) => {
        if (sec.type === "Speaking" || sec.type === "Writing") return;

        const flatQs = flattenQuestionsToIndividual(sec.questions || [], currentNum);
        flatQs.forEach((q: any) => {
          const num = q.qNum || currentNum;
          blockStartMap[q.id] = num;
          numberMap[q.id] = num;
          blockEndMap[q.id] = num;
          currentNum = Math.max(currentNum + 1, num + 1);
        });
      });
    }
    return { numberMap, blockStartMap, blockEndMap };
  }, [selectedTest]);

  // Premium tier state & check helper
  const [userPlan, setUserPlan] = useState<string>(() => {
    return localStorage.getItem("override_student_plan") || "Free Trial";
  });
  const [selectedTestForLock, setSelectedTestForLock] = useState<any | null>(
    null,
  );
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(
    null,
  );

  // 1. In-Context Passage Highlighter & Sticky Notes States
  const [highlights, setHighlights] = useState<
    { id: string; text: string; color: string; sectionId: string }[]
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("mock_highlights") || "[]");
    } catch {
      return [];
    }
  });
  const [stickyNotes, setStickyNotes] = useState<
    {
      id: string;
      note: string;
      snippet?: string;
      color: string;
      sectionId: string;
    }[]
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("mock_sticky_notes") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedPassageSnippet, setSelectedPassageSnippet] = useState("");
  const [stickyNoteInput, setStickyNoteInput] = useState("");
  const [activeLeftPanelTab, setActiveLeftPanelTab] = useState<
    "passage" | "notes"
  >("passage");

  // Save states to localstorage on change
  useEffect(() => {
    localStorage.setItem("mock_highlights", JSON.stringify(highlights));
  }, [highlights]);
  useEffect(() => {
    localStorage.setItem("mock_sticky_notes", JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  // Handlemouseup to extract selection contextually
  const handlePassageSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 3) {
      setSelectedPassageSnippet(sel.toString().trim());
    }
  };

  // 2. Interactive Audio Speed & Subtitle Seek Controllers
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(120);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(-1);

  // Ticking effect for active audio controller simulation
  useEffect(() => {
    if (!isAudioPlaying) return;
    const interval = setInterval(
      () => {
        setAudioCurrentTime((prev) => {
          if (prev >= audioDuration) {
            setIsAudioPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      },
      Math.max(100, 1000 / audioSpeed),
    );
    return () => clearInterval(interval);
  }, [isAudioPlaying, audioSpeed, audioDuration]);

  // 3. Gamified Daily Streak & Mastery States
  const [userStreakCount, setUserStreakCount] = useState(() => {
    return Number(localStorage.getItem("mock_user_streak") || "4");
  });
  const [streakCheckedInToday, setStreakCheckedInToday] = useState(() => {
    return localStorage.getItem("mock_streak_today") === "true";
  });
  const [userXP, setUserXP] = useState(() => {
    return Number(localStorage.getItem("mock_user_xp") || "1250");
  });

  const handleSecureStreak = () => {
    if (streakCheckedInToday) return;
    setUserStreakCount((prev) => prev + 1);
    setStreakCheckedInToday(true);
    setUserXP((prev) => prev + 150);
    localStorage.setItem("mock_user_streak", String(userStreakCount + 1));
    localStorage.setItem("mock_streak_today", "true");
    localStorage.setItem("mock_user_xp", String(userXP + 150));
    toast.success(
      "🔥 Streak protected! You achieved +150 XP and unlocked 'Consecutive Gladiator' bonus status!",
    );
  };

  const getIELTSBandScore = (percent: number) => {
    if (percent >= 90)
      return {
        band: "9.0",
        title: "Expert User",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      };
    if (percent >= 85)
      return {
        band: "8.5",
        title: "Very Good User",
        color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
      };
    if (percent >= 75)
      return {
        band: "7.5",
        title: "Very Good User",
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      };
    if (percent >= 65)
      return {
        band: "6.5",
        title: "Competent User",
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      };
    if (percent >= 50)
      return {
        band: "5.5",
        title: "Modest User",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      };
    if (percent >= 35)
      return {
        band: "4.5",
        title: "Limited User",
        color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      };
    return {
      band: "3.5",
      title: "Extremely Limited",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };
  };

  const getAIFeedbackComments = (percent: number, testName: string) => {
    if (percent >= 85) {
      return {
        overview: `Magnificent result! You have demonstrated exceptional precision on "${testName || "this exam"}". Your command of vocabulary, sentence linkage, and question-type dynamics aligns closely with Band 8.5/9.0 criteria.`,
        strengths:
          "Elite speed scanning, structural keyphrase mapping, accurate comprehension of implicit arguments, and robust paraphrasing.",
        weaknesses:
          "Very occasional overthinking on negative factual questions or obscure technical distractors.",
        recommendations:
          "Maintain consistent reading practice using high-level academic literature (e.g., Nature, The Economist). Focus on fine-grain details of logical arguments and avoid second-guessing your first instincts.",
      };
    }
    if (percent >= 70) {
      return {
        overview: `Strong, competitive attempt on "${testName || "this exam"}". You demonstrate a reliable foundation suitable for Band 7.0/7.5, with minor points of vulnerability in high-attention sections.`,
        strengths:
          "Competent vocabulary inference, consistent locating of general answers in the text, and strong grammatical intuition.",
        weaknesses:
          "Time management during dense paragraphs (Section 3) and falling for compound logical distractors.",
        recommendations:
          "Work on active skim-reading techniques. Before reading questions, spend exactly 2 minutes map-marking paragraph topic sentences. Focus revision specifically on 'True/False/Not Given' logic maps.",
      };
    }
    if (percent >= 50) {
      return {
        overview: `Solid base on "${testName || "this exam"}". You have the tools for success, but vocabulary limitations and scanning duration constraints are currently capping your performance around Band 5.5/6.0.`,
        strengths:
          "Good comprehension of explicit factual assertions, clear recognition of simple keyword matches.",
        weaknesses:
          "Susceptibility to direct synonym tricks, low speed-reading metrics, and loss of concentration on longer articles.",
        recommendations:
          "Dedicate 20 minutes daily to IELTS Academic vocabulary flashcards. Practice answering passage questions in timed blocks of exactly 18 minutes to systematically build urgency resistance.",
      };
    }
    return {
      overview: `This attempt on "${testName || "this exam"}" indicates that foundational concepts need some structured reinforcement. Do not be discouraged; identifying this gap is the first step toward substantial IELTS improvement.`,
      strengths:
        "Recognizing basic conversational vocabulary and locating core keywords when they are copied directly.",
      weaknesses:
        "Differentiating between 'False' and 'Not Given' states, following complex academic clauses, and speed pacing.",
      recommendations:
        "Start practicing with the timer entirely disabled. Read the text thoroughly line-by-line first and highlight unfamiliar root words. Complete 1 complete passage a day, looking up unknown terms immediately in our dictionary.",
    };
  };

  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);

  useEffect(() => {
    fetchMembershipTiers().then(tiers => {
      if (tiers && tiers.length > 0) setMembershipTiers(tiers);
    }).catch(console.warn);

    const handleTiersUpdate = () => {
      fetchMembershipTiers().then(tiers => {
        if (tiers && tiers.length > 0) setMembershipTiers(tiers);
      }).catch(console.warn);
    };

    window.addEventListener("sebs_memberships_updated", handleTiersUpdate);
    return () => window.removeEventListener("sebs_memberships_updated", handleTiersUpdate);
  }, []);

  const checkCourseAccess = (plan: string, pathTier?: string, testId?: string, testObj?: any) => {
    const candidatePlan = (plan || userPlan || "Free Trial Tier").trim();
    const targetTestId = testId || testObj?.id;

    const mockProfile = { 
      plan: candidatePlan, 
      role: (window as any).__user_role || "student",
      forcePlanCheck: true 
    };

    const authResult = canAccessMockTest(
      targetTestId || "",
      testObj?.exam_category || "Academic",
      mockProfile,
      membershipTiers,
      testObj || { id: targetTestId, access_tier: pathTier }
    );
    return authResult.granted;
  };

  // Category Detection Helper
  const detectCategoryFromRoute = (): "All" | "Academic" | "General Training" => {
    if (defaultCategory) return defaultCategory;
    const path = (location.pathname || window.location.pathname).toLowerCase();
    const params = new URLSearchParams(location.search || window.location.search);
    const catQuery = params.get("category");

    if (
      path.includes("academic") ||
      path.includes("acdamic") ||
      catQuery?.toLowerCase() === "academic"
    ) {
      return "Academic";
    }
    if (
      path.includes("general-training") ||
      path.includes("general%20training") ||
      path.includes("general training") ||
      path.includes("gt-tests") ||
      path === "/general-training" ||
      catQuery?.toLowerCase() === "general training" ||
      catQuery?.toLowerCase() === "gt"
    ) {
      return "General Training";
    }
    return "All";
  };

  // NEW UI STATES
  const [activeCategory, setActiveCategory] = useState<
    "All" | "Academic" | "General Training"
  >(detectCategoryFromRoute);
  const [activeSkill, setActiveSkill] = useState<
    "All" | "listening" | "reading" | "writing" | "speaking"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedMonthModal, setSelectedMonthModal] = useState<{
    year: string;
    month: string;
    tests: any[];
  } | null>(null);

  // Sync category with URL changes
  useEffect(() => {
    const detected = detectCategoryFromRoute();
    if (detected !== activeCategory) {
      setActiveCategory(detected);
    }
  }, [location.pathname, location.search, defaultCategory]);

  const handleCategorySelect = (catId: "All" | "Academic" | "General Training") => {
    setActiveCategory(catId);
    setSelectedMonthModal(null);
    setIsTestActive(false);
    setSelectedTest(null);

    if (catId === "Academic") {
      navigate(isDashboardMode ? "/dashboard/mock-test/academic-tests" : "/mock-test/academic-tests");
    } else if (catId === "General Training") {
      navigate(isDashboardMode ? "/dashboard/mock-test/general-training-tests" : "/mock-test/general-training-tests");
    } else {
      navigate(isDashboardMode ? "/dashboard/mock-tests" : "/mock-tests");
    }
  };

  const handleOpenMonth = (year: string, month: string, testsInMonth?: any[]) => {
    const tests = testsInMonth || (groupedByYearAndMonth[year]?.[month] || []);
    setSelectedMonthModal({
      year,
      month,
      tests,
    });
    setIsTestActive(false);
    setSelectedTest(null);

    const targetUrl = isDashboardMode
      ? `/dashboard/ielts-mock-test-${year}/${month.toLowerCase()}`
      : `/ielts-mock-test-${year}/${month.toLowerCase()}`;
    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleBackFromMonth = () => {
    setSelectedMonthModal(null);
    let backUrl = "/mock-tests";
    if (activeCategory === "Academic") {
      backUrl = isDashboardMode ? "/dashboard/mock-test/academic-tests" : "/mock-test/academic-tests";
    } else if (activeCategory === "General Training") {
      backUrl = isDashboardMode ? "/dashboard/mock-test/general-training-tests" : "/mock-test/general-training-tests";
    } else {
      backUrl = isDashboardMode ? "/dashboard/mock-tests" : "/mock-tests";
    }
    navigate(backUrl);
  };

  const updateTestUrl = (test: any, targetSkill?: string) => {
    const { year, month } = getTestYearAndMonth(test);
    const testSlug = slugify(test.name || test.title || test.id || "test");
    const monthSlug = month.toLowerCase();

    let targetUrl = "";
    if (targetSkill) {
      const skillSlug = slugify(targetSkill);
      targetUrl = isDashboardMode
        ? `/dashboard/ielts-mock-test-${year}/${monthSlug}/${testSlug}/${skillSlug}`
        : `/ielts-mock-test-${year}/${monthSlug}/${testSlug}/${skillSlug}`;
    } else {
      targetUrl = isDashboardMode
        ? `/dashboard/ielts-mock-test-${year}/${monthSlug}/${testSlug}/full-test`
        : `/ielts-mock-test-${year}/${monthSlug}/${testSlug}/full-test`;
    }

    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleQuitSession = () => {
    setIsTestActive(false);
    setSelectedTest(null);
    if (selectedMonthModal) {
      const monthUrl = isDashboardMode
        ? `/dashboard/ielts-mock-test-${selectedMonthModal.year}/${selectedMonthModal.month.toLowerCase()}`
        : `/ielts-mock-test-${selectedMonthModal.year}/${selectedMonthModal.month.toLowerCase()}`;
      navigate(monthUrl);
    } else {
      let listUrl = "/mock-tests";
      if (activeCategory === "Academic") {
        listUrl = isDashboardMode ? "/dashboard/mock-test/academic-tests" : "/mock-test/academic-tests";
      } else if (activeCategory === "General Training") {
        listUrl = isDashboardMode ? "/dashboard/mock-test/general-training-tests" : "/mock-test/general-training-tests";
      } else {
        listUrl = isDashboardMode ? "/dashboard/mock-tests" : "/mock-tests";
      }
      navigate(listUrl);
    }
  };

  // Deep-linking route synchronization
  useEffect(() => {
    const parsed = parseTestPath(location.pathname);

    if (parsed && availableTests.length > 0) {
      const formattedMonth = parsed.month.charAt(0).toUpperCase() + parsed.month.slice(1).toLowerCase();

      if (parsed.testName) {
        const targetSlug = slugify(parsed.testName);
        const found = availableTests.find((t) => {
          const tSlug = slugify(t.name || t.title || "");
          const tId = String(t.id || "").toLowerCase();
          return tSlug === targetSlug || tId === targetSlug || (targetSlug.length > 2 && (tSlug.includes(targetSlug) || targetSlug.includes(tSlug)));
        });

        if (found) {
          let targetSkill: string | undefined = undefined;
          if (parsed.testType) {
            const typeLower = parsed.testType.toLowerCase();
            if (typeLower.includes("listen")) targetSkill = "Listening";
            else if (typeLower.includes("read")) targetSkill = "Reading";
            else if (typeLower.includes("writ")) targetSkill = "Writing";
            else if (typeLower.includes("speak")) targetSkill = "Speaking";
          }

          const { year, month } = getTestYearAndMonth(found);
          setSelectedMonthModal({
            year,
            month,
            tests: (groupedByYearAndMonth && groupedByYearAndMonth[year]?.[month]) || [found],
          });

          if (!selectedTest || selectedTest.id !== found.id || !isTestActive) {
            handleStartTest(found, false, targetSkill, true);
          }
        }
      } else {
        // Month route: e.g. /ielts-mock-test-2026/january
        const matchingTests = availableTests.filter((t) => {
          const meta = getTestYearAndMonth(t);
          return meta.year === parsed.year && meta.month.toLowerCase() === parsed.month.toLowerCase();
        });

        setSelectedMonthModal({
          year: parsed.year,
          month: formattedMonth,
          tests: matchingTests.length > 0 ? matchingTests : ((groupedByYearAndMonth && groupedByYearAndMonth[parsed.year]?.[formattedMonth]) || []),
        });

        if (isTestActive) {
          setIsTestActive(false);
          setSelectedTest(null);
        }
      }
    } else if (!parsed && routeTestId && availableTests.length > 0) {
      const found = availableTests.find(
        (t) => String(t.id).toLowerCase() === String(routeTestId).toLowerCase()
      );
      if (found && (!selectedTest || selectedTest.id !== found.id)) {
        handleStartTest(found, false, undefined, true);
      }
    } else if (!parsed && !routeTestId) {
      if (selectedMonthModal && !location.pathname.includes("ielts-mock-test-")) {
        setSelectedMonthModal(null);
      }
      if (isTestActive && !testSubmitted && !location.pathname.includes("ielts-mock-test-")) {
        setIsTestActive(false);
        setSelectedTest(null);
      }
    }
  }, [location.pathname, routeTestId, availableTests]);

  useEffect(() => {
    fetchTests();
    fetchHistory();
  }, [activeCategory, activeSkill]);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
          }
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          if (authUser) {
            setUser(authUser);
            const { data: profile } = await supabase
              .from("profiles")
              .select("plan")
              .eq("id", authUser.id)
              .single();
            if (profile?.plan) {
              setUserPlan(profile.plan);
            }
          }
        }
      } catch (e) {
        console.error("Error loading user plan for mock tests:", e);
      } finally {
        setIsAuthChecking(false);
      }
    };
    fetchUserPlan();
  }, []);

  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("student_submissions")
        .select("*")
        .eq("student_id", user.id)
        .eq("lesson_type", "MOCK_TEST")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setAttemptHistory(
          data.map((d) => ({
            ...d,
            content:
              typeof d.content === "string" ? JSON.parse(d.content) : d.content,
          })),
        );
      }
    } catch (e) {
      console.error("History fetch error:", e);
    }
  };

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      let mergedData: any[] = [];

      // 1. Fetch from central server database API endpoint '/api/mysql/mock_tests'
      try {
        const apiRes = await fetch("/api/mysql/mock_tests");
        if (apiRes.ok) {
          const apiTests = await apiRes.json();
          if (Array.isArray(apiTests) && apiTests.length > 0) {
            const formatted = apiTests
              .filter((t: any) => {
                if (activeCategory === "All") return true;
                const cat = String(t.exam_category || t.category || "").toLowerCase();
                return !cat || cat === activeCategory.toLowerCase();
              })
              .map((t: any) => ({
                ...t,
                name: t.name || t.title || "Untitled Full Mock Test",
              }));
            mergedData = [...formatted];
          }
        }
      } catch (apiErr) {
        console.warn("MockTest: API query for '/api/mysql/mock_tests' failed:", apiErr);
      }

      // 2. Fetch from Supabase table 'mock_tests' (Primary Examination Desk table)
      try {
        const { data: dbMockTests, error } = await supabase.from("mock_tests").select("*");

        if (dbMockTests && dbMockTests.length > 0) {
          const formattedMockTests = dbMockTests
            .filter((t: any) => {
              if (activeCategory === "All") return true;
              const cat = String(t.exam_category || t.category || "").toLowerCase();
              return !cat || cat === activeCategory.toLowerCase();
            })
            .map((t: any) => ({
              ...t,
              name: t.name || t.title || "Untitled Full Mock Test",
            }));

          const existingIds = new Set(mergedData.map((d) => d.id));
          formattedMockTests.forEach((fmt) => {
            if (!existingIds.has(fmt.id)) {
              mergedData.push(fmt);
            }
          });
        }
      } catch (err) {
        console.warn("MockTest: Database query for 'mock_tests' failed:", err);
      }

      // 2. Load from localStorage 'mock_tests' (Saved from Admin Examination Desk) and overlay
      const localTestsStr = localStorage.getItem("mock_tests");
      if (localTestsStr) {
        try {
          const localTests = JSON.parse(localTestsStr);
          if (Array.isArray(localTests)) {
            const localMap = new Map(localTests.map((lt: any) => [lt.id, lt]));

            // Overlay onto mergedData
            mergedData = mergedData.map((item: any) => {
              if (localMap.has(item.id)) {
                const lt = localMap.get(item.id);
                return {
                  ...item,
                  ...lt,
                  test_month: lt.test_month || lt.month || item.test_month || item.month,
                  month: lt.test_month || lt.month || item.test_month || item.month,
                  test_year: lt.test_year || lt.year || item.test_year || item.year,
                  year: lt.test_year || lt.year || item.test_year || item.year,
                };
              }
              return item;
            });

            // Add any local test not in mergedData
            const existingIds = new Set(mergedData.map((d) => d.id));
            localTests.forEach((lt: any) => {
              if (lt.id && !existingIds.has(lt.id)) {
                const matchesCategory =
                  activeCategory === "All" ||
                  String(lt.exam_category || "").toLowerCase() === activeCategory.toLowerCase();
                if (matchesCategory) {
                  mergedData.push({
                    ...lt,
                    name: lt.name || lt.title || "Untitled Local Mock Test",
                    isLocal: true,
                  });
                }
              }
            });
          }
        } catch (localErr) {
          console.error("Error merging localStorage mock_tests:", localErr);
        }
      }

      // 3. Fetch strictly mock test items from 'courses' table ONLY if they are explicitly configured mock tests
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .or("is_mock_test.eq.true,course_type.eq.Mock Test");

        if (data && data.length > 0) {
          const formattedCourses = data
            .filter((c: any) => {
              // Only include courses if they have an explicit test_month or is_mock_test is strictly set AND they have sections or test_month
              const isExplicitMock = (c.is_mock_test === true || String(c.course_type).toLowerCase() === "mock test") && (c.test_month || c.month || c.test_number);
              if (!isExplicitMock && mergedData.length > 0) return false;

              if (activeCategory === "All") return true;
              const cat = String(c.exam_category || c.category || "").toLowerCase();
              return !cat || cat === activeCategory.toLowerCase();
            })
            .map((c: any) => ({
              ...c,
              name: c.title || c.name || "Untitled Practice Section",
            }));
          
          const existingIds = new Set(mergedData.map((d) => d.id));
          formattedCourses.forEach((fc) => {
            if (!existingIds.has(fc.id)) mergedData.push(fc);
          });
        }
      } catch (err) {
        console.warn("MockTest: Database query for 'courses' failed:", err);
      }

      // 4. Fallback default examination packs ONLY if no mock tests exist in database or local storage
      if (mergedData.length === 0) {
        const defaultDeskPacks = [
          // 2026
          ...["January", "February", "March"].map((m, idx) => ({
            id: `exam-desk-2026-${m.toLowerCase()}`,
            name: `IELTS Practice Exam 2026 - ${m}`,
            title: `IELTS Practice Exam 2026 - ${m}`,
            difficulty: "7.5",
            questions: 40,
            total_time: 165,
            status: "Published",
            test_year: "2026",
            test_month: m,
            course_type: "Mock Test",
            exam_category: idx % 2 === 0 ? "Academic" : "General Training",
            access_tier: "Free Trial",
            sections: [
              { id: "s1", type: "Listening", title: "Section 1", content: "", questions: [] },
              { id: "s2", type: "Reading", title: "Section 2", content: "", questions: [] },
              { id: "s3", type: "Writing", title: "Section 3", content: "", questions: [] },
              { id: "s4", type: "Speaking", title: "Section 4", content: "", questions: [] }
            ]
          })),
          // 2025
          ...["January", "February", "March", "April", "May", "June", "July", "August", "September", "October"].map((m, idx) => ({
            id: `exam-desk-2025-${m.toLowerCase()}`,
            name: `IELTS Practice Exam 2025 - ${m}`,
            title: `IELTS Practice Exam 2025 - ${m}`,
            difficulty: "7.0",
            questions: 40,
            total_time: 165,
            status: "Published",
            test_year: "2025",
            test_month: m,
            course_type: "Mock Test",
            exam_category: idx % 2 === 0 ? "Academic" : "General Training",
            access_tier: idx > 3 ? "Pro Premium" : "Free Trial",
            sections: [
              { id: "s1", type: "Listening", title: "Section 1", content: "", questions: [] },
              { id: "s2", type: "Reading", title: "Section 2", content: "", questions: [] },
              { id: "s3", type: "Writing", title: "Section 3", content: "", questions: [] },
              { id: "s4", type: "Speaking", title: "Section 4", content: "", questions: [] }
            ]
          }))
        ];

        mergedData = defaultDeskPacks.filter((dp) => {
          return activeCategory === "All" || dp.exam_category.toLowerCase() === activeCategory.toLowerCase();
        });
      }

      // 5. Build parsed items with sections expanded
      let parsed = mergedData.map((t) => {
        const normalizedSects = normalizeCourseToSections(t);

        const totalQsCount = countTotalQuestions(normalizedSects);

        return {
          ...t,
          sections: normalizedSects,
          questions: totalQsCount > 0 ? totalQsCount : t.questions || 40,
        };
      });

      // 6. Filter by active skill/section components if activeSkill is specified
      if (activeSkill !== "All") {
        parsed = parsed.filter((t: any) => {
          const format = String(
            t.course_format || t.course_type || t.name || t.title || "",
          ).toLowerCase();
          const hasSkillSection = (t.sections || []).some(
            (sec: any) =>
              String(sec.type || "").toLowerCase() ===
              activeSkill.toLowerCase(),
          );
          return format.includes(activeSkill.toLowerCase()) || hasSkillSection;
        });
      }

      setAvailableTests(parsed);
    } catch (e) {
      console.error("Fetch tests error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTestActive && timeLeft > 0 && !testSubmitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTestActive && !testSubmitted) {
      handleFinishTest();
    }
    return () => clearInterval(timer);
  }, [isTestActive, timeLeft, testSubmitted]);

  useEffect(() => {
    const shouldHide = isTestActive && !testSubmitted;
    window.dispatchEvent(
      new CustomEvent("hide_main_navbar", { detail: shouldHide }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("hide_main_navbar", { detail: false }),
      );
    };
  }, [isTestActive, testSubmitted]);

  const getTestTimeLimitInSeconds = (test: any, targetSkill?: string): number => {
    if (!test) return 165 * 60;

    const rawTestMins =
      test.total_time ??
      test.duration ??
      test.time_limit ??
      test.timeLimit ??
      test.time ??
      test.duration_minutes ??
      test.total_time_minutes ??
      test.time_limit_minutes;

    const parsedTestMins = Number(rawTestMins);
    const hasValidTestMins = !isNaN(parsedTestMins) && parsedTestMins > 0;

    if (targetSkill) {
      const section = (test.sections || []).find((s: any) =>
        String(s.type || s.title || "").toLowerCase().includes(targetSkill.toLowerCase())
      );

      if (section) {
        const rawSecMins =
          section.time_limit ??
          section.timeLimit ??
          section.duration ??
          section.total_time ??
          section.time ??
          section.duration_minutes;
        const parsedSecMins = Number(rawSecMins);
        if (!isNaN(parsedSecMins) && parsedSecMins > 0) {
          return parsedSecMins * 60;
        }
      }

      const skillLower = targetSkill.toLowerCase();
      if (skillLower.includes("listening")) return 30 * 60;
      if (skillLower.includes("reading")) return 60 * 60;
      if (skillLower.includes("writing")) return 60 * 60;
      if (skillLower.includes("speaking")) return 15 * 60;
    }

    if (hasValidTestMins) {
      return parsedTestMins * 60;
    }

    return 165 * 60;
  };

  const handleStartTest = (
    test: any,
    forceRestart = false,
    targetSkill?: string,
    skipUrlUpdate = false,
  ) => {
    if (!isUserLoggedIn()) {
      toast.error("Sign In Required", {
        description: "Please sign in to attempt mock tests and save your results.",
      });
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (!checkCourseAccess(userPlan, test.access_tier || "Free Trial", test.id, test)) {
      setSelectedTestForLock(test);
      return;
    }

    const testTimeLimits = getTestTimeLimitInSeconds(test, targetSkill);
    const sessionKey = targetSkill
      ? `mock_session_${test.id}_${targetSkill.toLowerCase()}`
      : `mock_session_${test.id}`;

    if (!forceRestart) {
      const saved = localStorage.getItem(sessionKey) || localStorage.getItem(`mock_session_${test.id}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (Date.now() - data.timestamp < 12 * 60 * 60 * 1000) {
            setAnswers(data.answers || {});
            setTimeLeft(Math.min(data.timeLeft, testTimeLimits));
            if (targetSkill) {
              const skillIdx = (test.sections || []).findIndex((s: any) =>
                String(s.type || s.title || "").toLowerCase().includes(targetSkill.toLowerCase())
              );
              setCurrentSectionIdx(skillIdx >= 0 ? skillIdx : (data.currentSectionIdx || 0));
            } else {
              setCurrentSectionIdx(data.currentSectionIdx || 0);
            }
            setSelectedTest(test);
            setIsTestActive(true);

            if (!skipUrlUpdate) {
              updateTestUrl(test, targetSkill);
            }
            return;
          }
        } catch (e) {
          console.error("Error reading saved session:", e);
        }
      }
    }

    setSelectedTest(test);
    setTimeLeft(testTimeLimits);
    setIsTestActive(true);
    setAnswers({});

    let targetIdx = -1;
    if (targetSkill) {
      targetIdx = (test.sections || []).findIndex((s: any) =>
        String(s.type || s.title || "").toLowerCase().includes(targetSkill.toLowerCase())
      );
    }

    if (targetIdx >= 0) {
      setCurrentSectionIdx(targetIdx);
    } else {
      const firstIdx = (test.sections || []).findIndex(
        (s: any) => s.questions?.length > 0 || s.content,
      );
      setCurrentSectionIdx(firstIdx >= 0 ? firstIdx : 0);
    }

    if (!skipUrlUpdate) {
      updateTestUrl(test, targetSkill);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? hours + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFinishTest = async () => {
    if (!selectedTest) return;

    let totalCorrect = 0;
    let totalQuestions = 0;
    const sectionResults: any[] = [];

    const compareAnswers = (stud: string, corr: string): boolean => {
      const s = String(stud || "")
        .trim()
        .toLowerCase();
      const c = String(corr || "")
        .trim()
        .toLowerCase();
      if (!s || !c) return false;
      const parts = c.split(",").map((p) => p.trim().toLowerCase());
      
      const isMatch = parts.some(p => {
        if (p === s) return true;
        
        // Clean strings from non-alphanumeric for direct clean match
        const cleanS = s.replace(/[^a-z0-9]/g, "");
        const cleanP = p.replace(/[^a-z0-9]/g, "");
        if (cleanS === cleanP && cleanS.length > 0) return true;
        
        // Support matching single letter options with their full text (e.g., "A" vs "A. The Heading")
        if (s.startsWith(p + ".") || s.startsWith(p + ":") || s.startsWith(p + " ")) {
          return true;
        }
        if (p.startsWith(s + ".") || p.startsWith(s + ":") || p.startsWith(s + " ")) {
          return true;
        }
        
        return false;
      });
      
      return isMatch;
    };

    (selectedTest.sections || []).forEach((sec: any) => {
      let qResults: any[] = [];
      if (sec.type === "Speaking") {
        const speakingData = answers[`speaking-${sec.id}`];
        qResults = [
          {
            type: "speaking",
            data: speakingData ? JSON.parse(speakingData) : null,
          },
        ];
      } else if (sec.type === "Writing") {
        qResults = [
          { type: "writing", content: answers[`writing-${sec.id}`] || "" },
        ];
      } else {
        qResults = (sec.questions || []).flatMap((q: any) => {
          const qType = String(q.type || "").toUpperCase();

          if (qType === "INLINE_BLANKS") {
            const corrList = String(q.correctAnswer || "")
              .split("|")
              .map((x) => x.trim());
            return corrList.map((corr: string, idx: number) => {
              totalQuestions++;
              const studentAns = (answers[`${q.id}_${idx}`] || "").trim();
              const isCorrect = compareAnswers(studentAns, corr);
              if (isCorrect) totalCorrect++;
              return {
                ...q,
                id: `${q.id}_${idx}`,
                text: `${q.text || "Fill in the blank"} (Part ${idx + 1})`,
                studentAns,
                correctAns: corr,
                isCorrect,
              };
            });
          } else if (qType === "MATCHING") {
            const prompts = String(q.text || "")
              .split("\n")
              .filter(Boolean);
            const corrList = String(q.correctAnswer || "")
              .split("\n")
              .filter(Boolean);
            return prompts.map((prompt: string, idx: number) => {
              totalQuestions++;
              const studentAns = (answers[`${q.id}_${idx}`] || "").trim();
              const corr = corrList[idx] || "";
              const isCorrect = compareAnswers(studentAns, corr);
              if (isCorrect) totalCorrect++;
              return {
                ...q,
                id: `${q.id}_${idx}`,
                text: prompt,
                studentAns,
                correctAns: corr,
                isCorrect,
              };
            });
          } else {
            totalQuestions++;
            const studentAns = (answers[q.id] || "").trim();
            let correctAns = "";
            let isCorrect = false;

            if (qType === "BLANK" || !q.options || q.options.length === 0) {
              correctAns = String(q.correctAnswer || "").trim();
              isCorrect = compareAnswers(studentAns, correctAns);
            } else {
              correctAns = q.options[q.correctIndex] || "";
              isCorrect = studentAns === correctAns;
            }
            if (isCorrect) totalCorrect++;
            return [{ ...q, studentAns, correctAns, isCorrect }];
          }
        });
      }
      sectionResults.push({
        section: sec.title,
        type: sec.type,
        results: qResults,
      });
    });

    const percent =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
    const scoreDetails = {
      testId: selectedTest.id,
      testName: selectedTest.name,
      score: { correct: totalCorrect, total: totalQuestions, percent },
      sections: sectionResults,
    };

    setTestScore(scoreDetails);
    setTestSubmitted(true);
    setIsTestActive(false);
    localStorage.removeItem(`mock_session_${selectedTest.id}`);

    const studentProfile = JSON.parse(
      localStorage.getItem("student_profile") || "{}",
    );
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("student_submissions").insert([
          {
            student_id: user?.id,
            student_name: studentProfile.name || "Anonymous",
            course_title: "Mock Examination",
            lesson_title: selectedTest.name,
            lesson_type: "MOCK_TEST",
            content: JSON.stringify(scoreDetails),
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const chartData = useMemo(() => {
    return attemptHistory
      .slice(0, 10)
      .reverse()
      .map((att) => ({
        date: new Date(att.created_at).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
        score: att.content?.score?.percent || 0,
        fullDate: new Date(att.created_at).toLocaleString(),
      }));
  }, [attemptHistory]);

  const filteredTests = availableTests
    .filter((t) =>
      (t.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()),
    )
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA && timeB) {
        return sortBy === "newest" ? timeB - timeA : timeA - timeB;
      }
      const valA = String(a.id || "");
      const valB = String(b.id || "");
      return sortBy === "newest"
        ? valB.localeCompare(valA)
        : valA.localeCompare(valB);
    });

  const groupedByYearAndMonth = filteredTests.reduce((acc: any, test) => {
    const { year, month } = getTestYearAndMonth(test);
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    acc[year][month].push(test);
    return acc;
  }, {});

  const monthsOrder = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (selectedTestForLock) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="w-full rounded-[3rem] border-none bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
            {/* Background ambient glowing spheres */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[110px] -z-10" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-650/15 rounded-full blur-[110px] -z-15" />

            <div className="space-y-8 relative z-10">
              {/* Luxury Crown Anim Icon */}
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center shadow-2xl shadow-indigo-500/20 ring-4 ring-white/10 border border-indigo-400">
                <Crown className="w-10 h-10 text-white animate-bounce" />
              </div>

              <div className="space-y-3">
                <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                  ✨ Premium Examination Pack ✨
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                  Unlock{" "}
                  <span className="text-indigo-400 underline decoration-indigo-400/30">
                    {selectedTestForLock.name || "This Practice Test"}
                  </span>
                </h2>
                <p className="max-w-xl mx-auto text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  This mock examination is a realistic testing sim with
                  automated AI assessment, custom grade sheets, and detailed
                  metric logs reserved for premium scholars.
                </p>
              </div>

              {/* Level Highlight Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Gem className="w-5 h-5" />
                    <h4 className="font-bold text-sm">Pro Premium</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 font-medium">
                    <li className="flex items-center gap-2">
                      ✓ Realistic Reading & Listening Rooms
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Advanced interactive writing drafts
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Institutional scoring models
                    </li>
                  </ul>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-amber-500/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Crown className="w-5 h-5" />
                    <h4 className="font-bold text-sm">Mastery Ultimate</h4>
                  </div>
                  <ul className="text-xs text-slate-350 space-y-2 font-semibold">
                    <li className="flex items-center gap-2 text-slate-300">
                      ✓ Everything in Pro Premium plus:
                    </li>
                    <li className="flex items-center gap-1.5 font-bold text-amber-300">
                      🔥 Unlimited Live AI Speaking Grading
                    </li>
                    <li className="flex items-center gap-2 text-slate-300">
                      ✓ Official benchmark projections
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pricing stats banner */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-400 max-w-md mx-auto">
                Required License Tier:{" "}
                <span className="font-bold text-indigo-400 underline uppercase">
                  {selectedTestForLock.access_tier || "Pro Premium"}
                </span>
                <br />
                Your Current Workspace Level:{" "}
                <span className="font-extrabold uppercase text-slate-300">
                  {userPlan}
                </span>
              </div>

              {/* Form Call to Actions */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 max-w-md mx-auto">
                <Button
                  className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-indigo-600/30"
                  onClick={() => {
                    const requiredTier =
                      selectedTestForLock.access_tier || "Pro Premium";
                    alert(
                      `Please upgrade to ${requiredTier} from the Account Billing & Settings section.`,
                    );
                  }}
                >
                  <CreditCard className="w-4 h-4" /> Secure Checkout Upgrade
                </Button>

                <Button
                  className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black uppercase text-xs tracking-widest gap-2 border border-white/10"
                  onClick={async () => {
                    const requiredTier =
                      selectedTestForLock.access_tier || "Pro Premium";
                    localStorage.setItem("override_student_plan", requiredTier);
                    setUserPlan(requiredTier);
                    if (supabase) {
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();
                      if (user?.id) {
                        await supabase
                          .from("profiles")
                          .update({ plan: requiredTier })
                          .eq("id", user.id);
                      }
                    }
                    // close modal / reset lock
                    setSelectedTestForLock(null);
                    toast.success(
                      `Welcome to ${requiredTier}! This mock exam is now unlocked.`,
                    );
                  }}
                >
                  ⚡ Test Pay Bypass
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTestForLock(null)}
                className="text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-wider transition-colors pt-4 block mx-auto underline"
              >
                Return to Mock Tests Directory
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Verifying Candidate Credentials...
        </p>
      </div>
    );
  }

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
          Mock Tests <span className="text-primary">Locked</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-12 text-sm font-semibold leading-relaxed">
          The full-length IELTS simulation dashboard is exclusively available to
          registered candidates of SEB's Institute to maintain the integrity of
          our benchmarking data.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-sm">
          <Link to="/signup" className="flex-1">
            <Button className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl border-none">
              Register Now
            </Button>
          </Link>
          <Link to="/login" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-slate-200 dark:border-white/10 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Candidate Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isTestActive && !testSubmitted) {
    if (selectedMonthModal) {
      const displayPracticeTests = selectedMonthModal.tests || [];

      return (
        <div className="min-h-screen bg-[#F4F7FA] dark:bg-slate-950 pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackFromMonth}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 transition-all shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-sky-500" /> Back to IELTS Mock Test Directory ({selectedMonthModal.year})
              </button>
            </div>

            {/* Month Header Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-8">
              {/* Thumbnail Cover Graphic */}
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-[#122338] via-[#1a2f47] to-[#0c1624] p-4 flex flex-col justify-between shadow-xl text-white relative overflow-hidden shrink-0 border-l-4 border-slate-900 select-none">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">SEBS IELTS</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="z-10 my-auto text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">IELTS</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none uppercase">
                    MOCK TEST
                  </h4>
                  <p className="text-lg font-black text-white tracking-tight mt-0.5">
                    {selectedMonthModal.year}
                  </p>
                  <div className="mt-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                      {selectedMonthModal.month}
                    </span>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-sky-500/20 blur-xl pointer-events-none" />
                <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-amber-500/15 blur-lg pointer-events-none" />
              </div>

              {/* Title & Stats */}
              <div className="flex-1 text-center sm:text-left space-y-3 pt-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1a2b3c] dark:text-white tracking-tight leading-snug">
                  IELTS Mock Test {selectedMonthModal.year} {selectedMonthModal.month}
                </h1>

                {/* Star Rating */}
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold">
                  <span className="text-amber-500 font-black text-base">3.6</span>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" />
                    <Star className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <span className="text-slate-400 font-semibold text-xs ml-1">(8,098 votes)</span>
                </div>

                {/* Meta info */}
                <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Published on: <strong className="text-slate-800 dark:text-slate-200">06 Sep 2023</strong></span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Tests taken: <strong className="text-slate-800 dark:text-slate-200">5,847,440</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Test Cards Stack */}
            <div className="space-y-6">
              {displayPracticeTests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-800">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No practice tests available</h3>
                  <p className="text-sm text-slate-500 mt-1">There are no practice tests added for {selectedMonthModal.month} {selectedMonthModal.year} yet.</p>
                </div>
              ) : (
                displayPracticeTests.map((testItem: any, idx: number) => {
                  const testTitle = testItem.name || testItem.title || `Practice Test ${idx + 1}`;

                const isAccessible = checkCourseAccess(
                  userPlan,
                  testItem.access_tier || "Free Trial",
                  testItem.id,
                  testItem
                );

                let testProgressPercent = 0;
                const completedAttempts = attemptHistory.filter((att: any) => att.lesson_title === testTitle && att.lesson_type === "MOCK_TEST");
                if (completedAttempts.length > 0) {
                  testProgressPercent = 100;
                } else {
                  try {
                    const savedSession = localStorage.getItem(`mock_session_${testItem.id}`);
                    if (savedSession) {
                      const data = JSON.parse(savedSession);
                      const answeredCount = Object.keys(data.answers || {}).length;
                      
                      let totalQuestions = 0;
                      (testItem.sections || []).forEach((sec: any) => {
                         if (sec.type === "Speaking" || sec.type === "Writing") {
                            totalQuestions += 1;
                         } else {
                            (sec.questions || []).forEach((q: any) => {
                              const qType = String(q.type || "").toUpperCase();
                              if (qType === "INLINE_BLANKS") {
                                 totalQuestions += String(q.correctAnswer || "").split("|").length;
                              } else if (qType === "MATCHING") {
                                 totalQuestions += String(q.text || "").split("\n").filter(Boolean).length;
                              } else {
                                 totalQuestions += 1;
                              }
                            });
                         }
                      });
                      
                      if (totalQuestions > 0) {
                        testProgressPercent = Math.min(99, Math.round((answeredCount / totalQuestions) * 100));
                      }
                    }
                  } catch (e) {
                    // Ignore
                  }
                }

                return (
                  <div
                    key={testItem.id || idx}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-7 md:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5"
                  >
                    {/* Practice Test Title */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-extrabold text-[#1a2b3c] dark:text-white">
                          {testTitle}
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold border border-slate-200/80 dark:border-slate-700">
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                          <span>{Math.round(getTestTimeLimitInSeconds(testItem) / 60)} Mins</span>
                        </div>
                      </div>
                      {testItem.access_tier && testItem.access_tier !== "Free Trial" && (
                        <Badge className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 border-none">
                          {testItem.access_tier}
                        </Badge>
                      )}
                    </div>

                    {/* 4 Skill Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 1. Listening */}
                      <div className="border border-teal-200/80 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20 rounded-2xl p-6 flex flex-col items-center justify-between text-center min-h-[220px]">
                        <div className="flex items-center gap-2 pt-1">
                          <Headphones className="w-5 h-5 text-[#008B9B]" />
                          <span className="font-extrabold text-sm text-[#1e293b] dark:text-slate-100">
                            Listening
                          </span>
                        </div>
                        <div className="w-full flex flex-col items-center gap-3 mt-6">
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Listening");
                            }}
                            className="w-full py-2.5 px-4 rounded-full bg-[#008B9B] hover:bg-[#007380] text-white font-extrabold text-xs shadow-sm shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Take Test
                          </button>
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Listening");
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-colors shadow-xs cursor-pointer"
                            title="View Key / Start Listening"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2. Reading */}
                      <div className="border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-2xl p-6 flex flex-col items-center justify-between text-center min-h-[220px]">
                        <div className="flex items-center gap-2 pt-1">
                          <BookOpen className="w-5 h-5 text-[#1E6B3B]" />
                          <span className="font-extrabold text-sm text-[#1e293b] dark:text-slate-100">
                            Reading
                          </span>
                        </div>
                        <div className="w-full flex flex-col items-center gap-3 mt-6">
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Reading");
                            }}
                            className="w-full py-2.5 px-4 rounded-full bg-[#1E6B3B] hover:bg-[#16522c] text-white font-extrabold text-xs shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Take Test
                          </button>
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Reading");
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-xs cursor-pointer"
                            title="View Key / Start Reading"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 3. Writing */}
                      <div className="border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 rounded-2xl p-6 flex flex-col items-center justify-between text-center min-h-[220px]">
                        <div className="flex items-center gap-2 pt-1">
                          <PenTool className="w-5 h-5 text-[#D98A33]" />
                          <span className="font-extrabold text-sm text-[#1e293b] dark:text-slate-100">
                            Writing
                          </span>
                        </div>
                        <div className="w-full flex flex-col items-center gap-3 mt-6">
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Writing");
                            }}
                            className="w-full py-2.5 px-4 rounded-full bg-[#D98A33] hover:bg-[#c07727] text-white font-extrabold text-xs shadow-sm shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Take Test
                          </button>
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Writing");
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-300 transition-colors shadow-xs cursor-pointer"
                            title="View Key / Start Writing"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 4. Speaking */}
                      <div className="border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 rounded-2xl p-6 flex flex-col items-center justify-between text-center min-h-[220px]">
                        <div className="flex items-center gap-2 pt-1">
                          <Mic className="w-5 h-5 text-[#A13E53]" />
                          <span className="font-extrabold text-sm text-[#1e293b] dark:text-slate-100">
                            Speaking
                          </span>
                        </div>
                        <div className="w-full flex flex-col items-center gap-3 mt-6">
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Speaking");
                            }}
                            className="w-full py-2.5 px-4 rounded-full bg-[#A13E53] hover:bg-[#883244] text-white font-extrabold text-xs shadow-sm shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Take Test
                          </button>
                          <button
                            onClick={() => {
                              handleStartTest(testItem, false, "Speaking");
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors shadow-xs cursor-pointer"
                            title="View Key / Start Speaking"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Full Test Banner Bar at Bottom */}
                    <div className="bg-[#e9eef4] dark:bg-slate-800/80 rounded-2xl p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                      {/* Red NEW Ribbon on Far Left */}
                      <div className="absolute -left-7 top-2.5 bg-red-600 text-white font-black text-[9px] py-0.5 w-24 text-center -rotate-45 shadow-sm uppercase tracking-wider select-none pointer-events-none">
                        NEW
                      </div>

                      {/* Left Title */}
                      <div className="flex items-center gap-2 pl-6">
                        <LayoutGrid className="w-5 h-5 text-slate-700 dark:text-slate-200 shrink-0" />
                        <span className="font-extrabold text-sm text-[#1e293b] dark:text-white flex items-center gap-1.5">
                          Full Test
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 border border-slate-400/60 dark:border-slate-500 rounded-full w-4 h-4 inline-flex items-center justify-center font-black">?</span>
                        </span>
                      </div>

                      {/* Center Progress Bar */}
                      <div className="w-full max-w-xs h-6 bg-white dark:bg-slate-900 rounded-full border border-slate-300/80 dark:border-slate-700 p-0.5 relative flex items-center overflow-hidden">
                        <div className="h-full bg-sky-500/20 rounded-full transition-all duration-1000 ease-out" style={{ width: `${testProgressPercent}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                          {testProgressPercent}%
                        </span>
                      </div>

                      {/* Right Start Button */}
                      <button
                        onClick={() => {
                          handleStartTest(testItem, false);
                        }}
                        className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#23395B] hover:bg-[#1b2d48] text-white font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                      >
                        {isAccessible ? (
                          <>
                            <Zap className="w-4 h-4 fill-current" />
                            Start
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Unlock
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-slate-100 dark:border-white/5 pb-8">
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-4xl font-black text-[#2D3E50] dark:text-white uppercase tracking-tight">
                Mock Test Dashboard
              </h1>
              <p className="text-slate-400 font-bold italic uppercase text-xs tracking-widest">
                Real-time simulation environment
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl"
            >
              <TabsList className="bg-transparent gap-2 h-10">
                <TabsTrigger
                  value="tests"
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary font-black italic text-xs uppercase tracking-widest gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Packs
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary font-black italic text-xs uppercase tracking-widest gap-2"
                >
                  <History className="w-4 h-4" /> Records
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "tests" ? (
              <motion.div
                key="tests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-center mb-8">
                  <div className="inline-flex items-center gap-2 border-b border-slate-200 dark:border-white/10 px-4">
                    {[
                      {
                        id: "All",
                        name: "All Tests",
                        icon: <Layout className="w-5 h-5" />,
                      },
                      {
                        id: "Academic",
                        name: "Academic Test",
                        icon: <GraduationCap className="w-5 h-5" />,
                      },
                      {
                        id: "General Training",
                        name: "General Training Test",
                        icon: <Users className="w-5 h-5" />,
                      },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 text-sm font-bold transition-all relative ${
                          activeCategory === cat.id
                            ? "text-[#2D3E50] dark:text-white"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        {cat.icon}
                        {cat.name}
                        {activeCategory === cat.id && (
                          <motion.div
                            layoutId="activeCategory"
                            className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2D3E50] dark:bg-primary"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-8">
                  {[
                    {
                      id: "All",
                      name: "All Skills",
                      icon: <Layout className="w-4 h-4" />,
                      color: "bg-[#2D3E50] text-white",
                    },
                    {
                      id: "listening",
                      name: "Listening",
                      icon: <Headphones className="w-4 h-4" />,
                      color: "border-[#4A90E2] text-[#4A90E2]",
                    },
                    {
                      id: "reading",
                      name: "Reading",
                      icon: <BookOpen className="w-4 h-4" />,
                      color: "border-[#5B6AD0] text-[#5B6AD0]",
                    },
                    {
                      id: "writing",
                      name: "Writing",
                      icon: <PenTool className="w-4 h-4" />,
                      color: "bg-[#E6914D] text-white",
                    },
                    {
                      id: "speaking",
                      name: "Speaking",
                      icon: <Mic className="w-4 h-4" />,
                      color: "bg-[#C05D6D] text-white",
                    },
                  ].map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setActiveSkill(skill.id as any)}
                      className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${
                        activeSkill === skill.id
                          ? skill.color + " shadow-lg"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {skill.icon}
                      {skill.name}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      className="w-full h-14 pl-12 pr-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative min-w-[180px]">
                    <select
                      className="w-full h-14 px-6 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 font-bold focus:outline-none appearance-none cursor-pointer pr-10 text-slate-600"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 font-black italic text-xs uppercase tracking-widest">
                      Sourcing examination packs...
                    </p>
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                    <AlertTriangle className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="text-xl font-black italic">
                      No matches found
                    </h3>
                    <p className="text-slate-400 max-w-xs mx-auto">
                      Try adjusting your filters or search keywords to find
                      content.
                    </p>
                  </div>
                ) : (
                  <>
                    {Object.keys(groupedByYearAndMonth)
                      .sort((a, b) => b.localeCompare(a))
                      .map((year) => {
                        const monthsInYear = monthsOrder.filter(
                          (m) => groupedByYearAndMonth[year][m],
                        );
                        const defaultTakenCounts: Record<
                          string,
                          Record<string, string>
                        > = {
                          "2026": {
                            January: "356,943",
                            February: "184,200",
                            March: "120,500",
                          },
                          "2025": {
                            January: "3,158,639",
                            February: "1,155,971",
                            March: "897,762",
                            April: "624,684",
                            May: "490,803",
                            June: "574,536",
                            July: "734,691",
                            August: "161,849",
                            September: "239,853",
                            October: "66,686",
                          },
                          "2024": {
                            January: "5,847,374",
                            February: "2,403,077",
                            March: "1,225,676",
                            April: "665,914",
                            May: "435,926",
                            June: "642,978",
                            July: "318,158",
                            August: "314,532",
                            September: "302,902",
                            October: "258,540",
                            November: "6,276",
                          },
                        };

                        return (
                          <div key={year} className="mb-10">
                            {/* Year Book Container */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/60 dark:shadow-none overflow-hidden">
                              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-12">
                                {/* 3D Book Cover Graphic */}
                                <div className="relative group shrink-0 mx-auto lg:mx-0 my-2 select-none">
                                  <div className="relative w-48 h-64 sm:w-52 sm:h-72 rounded-r-2xl shadow-[18px_18px_35px_rgba(0,0,0,0.22)] border-l-8 border-slate-900 bg-gradient-to-br from-slate-900 via-[#1b2b3e] to-[#0f172a] p-6 flex flex-col justify-between overflow-hidden text-white transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                                    {/* Spine Edge Page Effect */}
                                    <div className="absolute right-0 top-0 bottom-0 w-3.5 bg-gradient-to-l from-slate-300 via-slate-100 to-slate-400 rounded-r-md border-l border-slate-500/30 shadow-inner flex flex-col justify-between py-3">
                                      <div className="w-full h-px bg-slate-400/40" />
                                      <div className="w-full h-px bg-slate-400/40" />
                                      <div className="w-full h-px bg-slate-400/40" />
                                    </div>

                                    {/* Header Badge */}
                                    <div className="flex items-center gap-2 z-10">
                                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                                        <Zap className="w-3.5 h-3.5 text-sky-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-black tracking-widest text-sky-300 uppercase leading-none">
                                          SEBS IELTS
                                        </p>
                                      </div>
                                    </div>

                                    {/* Main Title */}
                                    <div className="z-10 my-auto py-2">
                                      <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-white drop-shadow-md">
                                        IELTS
                                      </h3>
                                      <p className="text-xs font-black text-sky-400 uppercase tracking-[0.2em] mt-1">
                                        MOCK TEST
                                      </p>
                                      <p className="text-3xl font-black text-white tracking-tight mt-2">
                                        {year}
                                      </p>
                                    </div>

                                    {/* Bottom Tag */}
                                    <div className="z-10">
                                      <span className="inline-block px-3 py-1 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                                        {monthsInYear[0] || "January"}
                                      </span>
                                    </div>

                                    {/* Decorative Glows */}
                                    <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />
                                    <div className="absolute -left-10 -top-10 w-28 h-28 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />
                                  </div>
                                  <div className="w-40 h-3 bg-black/15 dark:bg-black/40 rounded-full blur-md mx-auto mt-3" />
                                </div>

                                {/* Right Content: Title + Month Grid */}
                                <div className="flex-1 w-full text-center lg:text-left">
                                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] dark:text-white tracking-tight mb-6">
                                    IELTS Mock Test {year}
                                  </h2>

                                  {/* Grid of Months */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {monthsInYear.map((month) => {
                                      const testsInMonth =
                                        groupedByYearAndMonth[year][month] || [];
                                      const countStr =
                                        defaultTakenCounts[year]?.[month] ||
                                        `${(testsInMonth.length * 12540).toLocaleString()}`;

                                      return (
                                        <button
                                          key={month}
                                          onClick={() =>
                                            handleOpenMonth(
                                              year,
                                              month,
                                              testsInMonth,
                                            )
                                          }
                                          className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-sky-500 dark:hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/5 transition-all text-left group flex flex-col justify-between min-h-[82px]"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-base sm:text-lg font-bold text-[#1e293b] dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                              {month}
                                            </span>
                                            <Badge
                                              variant="secondary"
                                              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border-none"
                                            >
                                              {testsInMonth.length}{" "}
                                              {testsInMonth.length === 1
                                                ? "test"
                                                : "tests"}
                                            </Badge>
                                          </div>

                                          <div className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                                            <span>{countStr} tests taken</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                  </>
                )}
              </motion.div>
            ) : activeTab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="p-10 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <History className="w-10 h-10 text-primary" />
                      <div>
                        <h2 className="text-2xl font-black italic uppercase">
                          Performance Records
                        </h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                          Review your attempt history
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={fetchHistory}
                      className="rounded-full h-12 w-12 text-slate-400"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="p-8 space-y-6">
                    {attemptHistory.length === 0 ? (
                      <div className="text-center py-16 space-y-4">
                        <History className="w-16 h-16 text-slate-300 mx-auto" />
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-lg">
                            No attempt history found
                          </h3>
                          <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                            Once you complete mock tests, your scores, detailed
                            AI assessor feedback, and performance insights will
                            appear here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {attemptHistory.map((att) => {
                          const percent = att.content?.score?.percent || 0;
                          const total = att.content?.score?.total || 0;
                          const correct = att.content?.score?.correct || 0;
                          const bandInfo = getIELTSBandScore(percent);
                          const feedback = getAIFeedbackComments(
                            percent,
                            att.lesson_title,
                          );
                          const isExpanded = expandedAttemptId === att.id;

                          return (
                            <Card
                              key={att.id}
                              className={`rounded-[2rem] border-none bg-slate-50/50 dark:bg-white/2 p-6 transition-all duration-300 overflow-hidden ${
                                isExpanded
                                  ? "ring-2 ring-primary/40 shadow-xl bg-white dark:bg-slate-900/60"
                                  : "hover:bg-white dark:hover:bg-white/5 hover:shadow-lg"
                              }`}
                            >
                              {/* Row Info Header */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                  <h4 className="font-black italic text-slate-900 dark:text-white text-lg">
                                    {att.lesson_title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="text-primary font-black italic">
                                      Mock Examination
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span>
                                      {new Date(
                                        att.created_at,
                                      ).toLocaleDateString()}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span>
                                      {new Date(
                                        att.created_at,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>

                                {/* Action items and scores column */}
                                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                        Score Percent
                                      </div>
                                      <div className="text-lg font-black text-primary italic leading-none">
                                        {percent}%
                                      </div>
                                    </div>
                                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
                                    <div className="text-right">
                                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">
                                        Projected IELTS
                                      </div>
                                      <div className="text-lg font-black text-indigo-500 dark:text-indigo-400 italic leading-none">
                                        Band {bandInfo.band}
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    variant={isExpanded ? "default" : "outline"}
                                    onClick={() =>
                                      setExpandedAttemptId(
                                        isExpanded ? null : att.id,
                                      )
                                    }
                                    className="rounded-2xl font-black italic uppercase text-[10px] tracking-widest px-6 h-12"
                                  >
                                    {isExpanded
                                      ? "Close Report"
                                      : "Detailed Feedback"}
                                  </Button>
                                </div>
                              </div>

                              {/* Report Details sub-container */}
                              {isExpanded && (
                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                  {/* Report Header Band Summary */}
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Band score block */}
                                    <Card className="rounded-[2rem] border-none bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                                      <div className="space-y-1 relative z-10">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                                          IELTS Metric Standard
                                        </span>
                                        <h5 className="text-sm font-bold text-slate-300">
                                          Performance Assessment
                                        </h5>
                                      </div>
                                      <div className="my-6 flex items-baseline gap-2 relative z-10">
                                        <span className="text-6xl font-black tracking-tight text-white leading-none">
                                          {bandInfo.band}
                                        </span>
                                        <div className="space-y-1">
                                          <div className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                                            Band Rating
                                          </div>
                                          <Badge
                                            className={`border-none rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-wider ${bandInfo.color}`}
                                          >
                                            {bandInfo.title}
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-[11px] text-slate-400 font-medium italic relative z-10">
                                        Based on {correct} correct inputs from{" "}
                                        {total} evaluable fields ({percent}%
                                        accuracy).
                                      </p>
                                    </Card>

                                    {/* Assessor overview */}
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 space-y-4 shadow-inner">
                                      <div className="flex items-center gap-3">
                                        <Award className="w-5 h-5 text-indigo-505 text-indigo-505 text-indigo-500 animate-pulse" />
                                        <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-850 dark:text-slate-200">
                                          AI Assessor Verdict
                                        </h5>
                                      </div>
                                      <p className="text-xs text-slate-600 dark:text-slate-305 text-slate-300 font-medium leading-relaxed">
                                        {feedback.overview}
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        <div className="space-y-1">
                                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                            Core Strengths
                                          </span>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                                            {feedback.strengths}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-550 text-amber-500">
                                            Key Gaps
                                          </span>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                                            {feedback.weaknesses}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Strategy Plan */}
                                  <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        Custom Study Action plan
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
                                      {feedback.recommendations}
                                    </p>
                                  </div>

                                  {/* Section & Question Review details */}
                                  {att.content?.sections &&
                                    att.content.sections.length > 0 && (
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="w-4 h-4 text-slate-450 text-slate-400" />
                                          <h5 className="font-black italic uppercase text-xs text-slate-500 tracking-wider">
                                            Passage & Answers Registry
                                          </h5>
                                        </div>

                                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                          {att.content.sections.map(
                                            (secDetail: any, sIdx: number) => (
                                              <div
                                                key={sIdx}
                                                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-white/5 space-y-4"
                                              >
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase">
                                                    {secDetail.section}
                                                  </span>
                                                  <Badge className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border-none px-3 py-1">
                                                    {secDetail.type ||
                                                      "Section"}
                                                  </Badge>
                                                </div>

                                                {/* Question keys list */}
                                                <div className="space-y-3">
                                                  {secDetail.results &&
                                                    secDetail.results.map(
                                                      (
                                                        res: any,
                                                        rIdx: number,
                                                      ) => {
                                                        if (
                                                          res.type === "writing"
                                                        ) {
                                                          return (
                                                            <div
                                                              key={rIdx}
                                                              className="space-y-1"
                                                            >
                                                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                                Your Written
                                                                Essay response
                                                              </span>
                                                              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs text-slate-600 dark:text-slate-300 italic font-serif leading-relaxed whitespace-pre-wrap">
                                                                "
                                                                {res.content ||
                                                                  "Empty response submitted."}
                                                                "
                                                              </div>
                                                            </div>
                                                          );
                                                        }
                                                        if (
                                                          res.type ===
                                                          "speaking"
                                                        ) {
                                                          return (
                                                            <div
                                                              key={rIdx}
                                                              className="space-y-1"
                                                            >
                                                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                                Speaking
                                                                Recorded session
                                                              </span>
                                                              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
                                                                <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
                                                                <span>
                                                                  Recorded audio
                                                                  submission
                                                                  logged
                                                                  successfully
                                                                  for
                                                                  evaluation.
                                                                </span>
                                                              </div>
                                                            </div>
                                                          );
                                                        }

                                                        return (
                                                          <div
                                                            key={rIdx}
                                                            className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-white/2 last:border-none last:pb-0"
                                                          >
                                                            <div className="space-y-1 flex-1">
                                                              <p className="text-xs text-slate-705 text-slate-700 dark:text-slate-300 font-bold leading-tight flex items-center gap-1.5">
                                                                <span className="text-[10px] text-slate-400 italic font-mono">
                                                                  Q{rIdx + 1}.
                                                                </span>
                                                                {res.question ||
                                                                  `Question ${rIdx + 1}`}
                                                              </p>
                                                              <div className="flex items-center gap-3 text-[11px] font-semibold font-mono">
                                                                <span className="text-slate-400">
                                                                  Your Answer:{" "}
                                                                  <span
                                                                    className={
                                                                      res.isCorrect
                                                                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                                                        : "text-rose-600 dark:text-rose-400 font-bold"
                                                                    }
                                                                  >
                                                                    {res.studentAns ||
                                                                      "Unanswered"}
                                                                  </span>
                                                                </span>
                                                                {!res.isCorrect && (
                                                                  <span className="text-slate-400">
                                                                    Correct:{" "}
                                                                    <span className="text-indigo-650 dark:text-indigo-400 font-bold">
                                                                      {res.correctAns ||
                                                                        "No Keys"}
                                                                    </span>
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                            {res.isCorrect ? (
                                                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                                            ) : (
                                                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
                                                            )}
                                                          </div>
                                                        );
                                                      },
                                                    )}
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
                    <h3 className="text-2xl font-black italic uppercase mb-8">
                      Score Progression
                    </h3>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="colorScore"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--primary)"
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--primary)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E2E8F0"
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 10,
                              fontWeight: 900,
                              fill: "#94A3B8",
                            }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 10,
                              fontWeight: 900,
                              fill: "#94A3B8",
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload?.[0])
                                return (
                                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                                    <p className="text-2xl font-black italic">
                                      {payload[0].value}%
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                      {payload[0].payload.fullDate}
                                    </p>
                                  </div>
                                );
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="var(--primary)"
                            strokeWidth={4}
                            fill="url(#colorScore)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <div className="space-y-8">
                    <Card className="rounded-[3rem] p-8 bg-black text-white border-none shadow-2xl space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                        Global Percentile
                      </p>
                      <h2 className="text-6xl font-black italic tracking-tighter">
                        74th
                      </h2>
                      <p className="text-slate-400 font-medium italic">
                        You are currently performing better than 74% of
                        international candidates.
                      </p>
                    </Card>
                    <Card className="rounded-[3rem] p-8 bg-primary/10 border-none shadow-2xl text-primary space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest italic opacity-80">
                        Skill Mastery
                      </p>
                      <div className="flex items-center justify-between font-black text-3xl italic">
                        <span>LISTENING</span>
                        <span>8.5</span>
                      </div>
                      <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[85%]" />
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }


  if (isTestActive && !testSubmitted) {
    return (
      <IeltsTestView 
        test={selectedTest}
        currentSectionIdx={currentSectionIdx}
        setCurrentSectionIdx={setCurrentSectionIdx}
        answers={answers}
        setAnswers={setAnswers}
        timeLeft={timeLeft}
        handleFinishTest={handleFinishTest}
        handleQuitSession={handleQuitSession}
        formatTime={formatTime}
      />
    );
  }

  const currentSec = selectedTest?.sections?.[currentSectionIdx];


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white h-20 flex items-center justify-between px-10 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleQuitSession}
            className="text-slate-400 hover:text-white rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-primary block">
              Evaluation Stream
            </span>
            <span className="text-sm font-black italic leading-none">
              {selectedTest?.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!testSubmitted && (
            <>
              <div
                className={`flex items-center gap-3 px-6 py-2 rounded-2xl border ${timeLeft < 300 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-white/5 border-white/10"}`}
              >
                <Clock className="w-5 h-5 opacity-60" />
                <span className="text-2xl font-black font-mono tracking-tighter">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button
                onClick={handleFinishTest}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black italic rounded-2xl px-8 h-12 shadow-xl shadow-emerald-900/20"
              >
                Submit Pack
              </Button>
            </>
          )}
          {testSubmitted && (
            <Link to="/courses">
              <Button className="rounded-2xl font-black italic px-8 h-12">
                Return to Courses
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="pt-28 pb-12 max-w-[1600px] mx-auto px-10">
        {testSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="rounded-[3rem] border-none shadow-2xl p-12 text-center bg-white dark:bg-slate-900 space-y-8">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] mx-auto flex items-center justify-center">
                <Award className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-none italic font-black uppercase tracking-widest text-[10px]">
                  Session Terminated
                </Badge>
                <h2 className="text-4xl font-black italic text-slate-900 dark:text-white">
                  Validation Results Synchronized
                </h2>
                <p className="text-slate-500 font-medium">
                  Your attempt has been analyzed and logged in the institutional
                  database.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Item Accuracy
                  </span>
                  <span className="text-4xl font-black italic text-primary">
                    {testScore.score.correct} / {testScore.score.total}
                  </span>
                </div>
                <div className="p-8 rounded-[2rem] bg-primary/5 border-2 border-primary/10 flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Performance Ratio
                  </span>
                  <span className="text-4xl font-black italic text-primary">
                    {testScore.score.percent}%
                  </span>
                </div>
                <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    IELTS Projection
                  </span>
                  <span className="text-4xl font-black italic text-primary">
                    {~~(testScore.score.percent / 11)}.5+
                  </span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-center gap-4">
                <Button
                  variant="outline"
                  className="rounded-2xl h-14 px-10 font-black italic"
                  onClick={() => window.location.reload()}
                >
                  Re-test Request
                </Button>
                <Link to="/courses">
                  <Button className="rounded-2xl h-14 px-12 font-black italic shadow-xl shadow-primary/20">
                    Return to Courses
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8 w-full">
            {/* Top Navigation Desk */}
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
              <div className="px-8 py-4 bg-slate-50 dark:bg-white/5 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Flag className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-450 dark:text-slate-400">
                    Navigation Desk - Active Modules & Practice Progress
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 italic">
                  Select a section/module header to jump directly.
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedTest?.sections?.map((s: any, i: number) => {
                  let answered = 0;
                  let total = 0;
                  if (Array.isArray(s.questions)) {
                    s.questions.forEach((q: any) => {
                      const qType = String(q.type || "").toUpperCase();
                      if (qType === "INLINE_BLANKS") {
                        const corrList = String(q.correctAnswer || "")
                          .split("|")
                          .filter(Boolean);
                        const count = corrList.length > 0 ? corrList.length : 1;
                        total += count;
                        for (let index = 0; index < count; index++) {
                          if (
                            (answers[`${q.id}_${index}`] || "").trim() !== ""
                          ) {
                            answered++;
                          }
                        }
                      } else if (qType === "MATCHING") {
                        const prompts = String(q.text || "")
                          .split("\n")
                          .filter(Boolean);
                        const count = prompts.length > 0 ? prompts.length : 1;
                        total += count;
                        for (let pIdx = 0; pIdx < count; pIdx++) {
                          if (
                            (answers[`${q.id}_${pIdx}`] || "").trim() !== ""
                          ) {
                            answered++;
                          }
                        }
                      } else {
                        total++;
                        if ((answers[q.id] || "").trim() !== "") {
                          answered++;
                        }
                      }
                    });
                  }
                  return (
                    <div
                      key={s.id || i}
                      onClick={() => setCurrentSectionIdx(i)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${currentSectionIdx === i ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-150 dark:hover:bg-white/5 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black italic leading-none">
                          {s.type || "Practice"} Module
                        </span>
                        <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">
                          {answered}/{total}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-black/10 dark:bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${currentSectionIdx === i ? "bg-white" : "bg-primary"}`}
                          style={{
                            width:
                              total > 0 ? `${(answered / total) * 105}%` : "0%",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="w-full space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSectionIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {currentSec?.type === "Speaking" ? (
                    <SpeakingTestModule
                      section={currentSec}
                      answers={answers}
                      setAnswers={setAnswers}
                      supabase={supabase}
                    />
                  ) : (
                    <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 min-h-[700px]">
                      <div className="flex flex-col md:flex-row h-full">
                      <ScrollArea className="md:w-1/2 p-12 border-r border-slate-100 dark:border-white/5 h-[700px]">
                        {/* TAB SELECTOR HEADER FOR ACTIVE HIGHLIGHTS & ESSAY COACH */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                          <div className="flex items-center gap-3 text-primary uppercase font-black italic text-xs">
                            {currentSec?.type === "Listening" ? (
                              <Headset className="w-4 h-4" />
                            ) : currentSec?.type === "Writing" ? (
                              <PenTool className="w-4 h-4" />
                            ) : currentSec?.type === "Speaking" ? (
                              <Mic className="w-4 h-4" />
                            ) : (
                              <BookOpen className="w-4 h-4" />
                            )}
                            {currentSec?.type} Module
                          </div>
                          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 h-8 items-center text-[10px]">
                            <button
                              onClick={() => setActiveLeftPanelTab("passage")}
                              className={`px-3 py-1 rounded-lg font-black uppercase tracking-wider transition-all ${activeLeftPanelTab === "passage" ? "bg-white dark:bg-white/10 text-primary shadow-xs" : "text-slate-450 hover:text-slate-650"}`}
                            >
                              📄 Content
                            </button>
                            <button
                              onClick={() => setActiveLeftPanelTab("notes")}
                              className={`px-3 py-1 rounded-lg font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeLeftPanelTab === "notes" ? "bg-white dark:bg-white/10 text-primary shadow-xs" : "text-slate-450 hover:text-slate-650"}`}
                            >
                              ✏️ Notes
                              <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full text-[8px] font-black">
                                {highlights.filter(
                                  (h) => h.sectionId === currentSec?.id,
                                ).length +
                                  stickyNotes.filter(
                                    (n) => n.sectionId === currentSec?.id,
                                  ).length}
                              </span>
                            </button>
                          </div>
                        </div>
                        {activeLeftPanelTab === "notes" ? (
                          <div className="space-y-6 animate-in fade-in-20 duration-200 text-left">
                            <div className="flex items-center justify-between">
                              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                Saved Annotations
                              </h2>
                              <button
                                onClick={() => {
                                  setHighlights((prev) =>
                                    prev.filter(
                                      (h) => h.sectionId !== currentSec?.id,
                                    ),
                                  );
                                  setStickyNotes((prev) =>
                                    prev.filter(
                                      (n) => n.sectionId !== currentSec?.id,
                                    ),
                                  );
                                  toast.success(
                                    "All annotations cleared for this section.",
                                  );
                                }}
                                className="text-[10px] text-red-500 font-extrabold hover:underline"
                              >
                                Clear Page
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                  Draft a custom Sticky Note
                                </span>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Type your study hint here..."
                                    value={stickyNoteInput}
                                    onChange={(e) =>
                                      setStickyNoteInput(e.target.value)
                                    }
                                    className="flex-1 h-10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white font-semibold bg-white dark:bg-slate-900 outline-none"
                                  />
                                  <Button
                                    onClick={() => {
                                      if (!stickyNoteInput.trim()) return;
                                      setStickyNotes((prev) => [
                                        ...prev,
                                        {
                                          id: Math.random().toString(),
                                          note: stickyNoteInput,
                                          color:
                                            "border-yellow-400 bg-yellow-50/20",
                                          sectionId: currentSec.id,
                                        },
                                      ]);
                                      setStickyNoteInput("");
                                      toast.success("Sticky note locked!");
                                    }}
                                    className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-wider"
                                  >
                                    Save Note
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                                  Text Highlight Registry
                                </span>
                                {highlights.filter(
                                  (h) => h.sectionId === currentSec?.id,
                                ).length === 0 ? (
                                  <p className="text-[11px] text-slate-400 font-medium italic">
                                    No highlighted sentences on this page yet.
                                    Click Content tab and drag-select phrase
                                    blocks to save.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {highlights
                                      .filter(
                                        (h) => h.sectionId === currentSec?.id,
                                      )
                                      .map((hl) => (
                                        <div
                                          key={hl.id}
                                          className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed relative flex justify-between gap-4 ${hl.color}`}
                                        >
                                          <span>"${hl.text}"</span>
                                          <button
                                            onClick={() => {
                                              setHighlights((prev) =>
                                                prev.filter(
                                                  (item) => item.id !== hl.id,
                                                ),
                                              );
                                              toast.success(
                                                "Highlight removed.",
                                              );
                                            }}
                                            className="text-slate-450 hover:text-red-500 shrink-0 self-start"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                                  Editable Sticky Notes Ledger
                                </span>
                                {stickyNotes.filter(
                                  (n) => n.sectionId === currentSec?.id,
                                ).length === 0 ? (
                                  <p className="text-[11px] text-slate-400 font-medium italic">
                                    No sticky notes preserved yet. Enter text
                                    comments above to lock study memory.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {stickyNotes
                                      .filter(
                                        (n) => n.sectionId === currentSec?.id,
                                      )
                                      .map((note) => (
                                        <div
                                          key={note.id}
                                          className="p-3.5 rounded-xl border border-dashed border-indigo-350 dark:border-indigo-805 bg-indigo-50/10 text-[11px] flex justify-between gap-4"
                                        >
                                          <div className="space-y-1 flex-1">
                                            {note.snippet && (
                                              <p className="text-[10px] text-slate-400 italic font-mono truncate max-w-xs text-left">
                                                Ref: "${note.snippet}"
                                              </p>
                                            )}
                                            <input
                                              type="text"
                                              value={note.note}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setStickyNotes((prev) =>
                                                  prev.map((item) =>
                                                    item.id === note.id
                                                      ? { ...item, note: val }
                                                      : item,
                                                  ),
                                                );
                                              }}
                                              className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 focus:underline w-full text-left"
                                            />
                                          </div>
                                          <button
                                            onClick={() => {
                                              setStickyNotes((prev) =>
                                                prev.filter(
                                                  (item) => item.id !== note.id,
                                                ),
                                              );
                                              toast.success(
                                                "Sticky note deleted.",
                                              );
                                            }}
                                            className="text-slate-450 hover:text-red-500 transition-colors shrink-0"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 text-left">
                            <h1 className="text-3xl font-black italic text-slate-900 dark:text-white uppercase tracking-tight">
                              {currentSec?.title}
                            </h1>

                            {/* INTELLIGENT HIGHLIGHTER FLOATING TOOLBAR */}
                            {selectedPassageSnippet && (
                              <div className="bg-indigo-51/50 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-500/20 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                                    <Highlighter className="w-4 h-4" /> Selected
                                    Passage Text
                                  </span>
                                  <button
                                    onClick={() =>
                                      setSelectedPassageSnippet("")
                                    }
                                    className="text-[10px] text-slate-450 hover:text-red-500 font-extrabold underline"
                                  >
                                    Clear Selection
                                  </button>
                                </div>
                                <p className="text-xs italic text-slate-700 dark:text-slate-300 font-medium line-clamp-2 bg-white/45 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                                  "${selectedPassageSnippet}"
                                </p>

                                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                  <button
                                    onClick={() => {
                                      setHighlights((prev) => [
                                        ...prev,
                                        {
                                          id: Math.random().toString(),
                                          text: selectedPassageSnippet,
                                          color:
                                            "bg-yellow-104 bg-yellow-100 text-yellow-850 text-yellow-800 border-yellow-250 border-2 dark:bg-yellow-900/40 dark:text-yellow-200",
                                          sectionId: currentSec.id,
                                        },
                                      ]);
                                      toast.success(
                                        "Yellow Highlight recorded!",
                                      );
                                      setSelectedPassageSnippet("");
                                    }}
                                    className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-850 rounded-lg flex items-center justify-center gap-1.5"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-405 shrink-0" />
                                    Yellow
                                  </button>
                                  <button
                                    onClick={() => {
                                      setHighlights((prev) => [
                                        ...prev,
                                        {
                                          id: Math.random().toString(),
                                          text: selectedPassageSnippet,
                                          color:
                                            "bg-emerald-104 bg-emerald-100 text-emerald-850 text-emerald-850 border-emerald-250 border-2 dark:bg-emerald-900/40 dark:text-emerald-200",
                                          sectionId: currentSec.id,
                                        },
                                      ]);
                                      toast.success(
                                        "Green Highlight recorded!",
                                      );
                                      setSelectedPassageSnippet("");
                                    }}
                                    className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-emerald-110 bg-emerald-100 hover:bg-emerald-250 text-emerald-850 rounded-lg flex items-center justify-center gap-1.5"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-405 shrink-0" />
                                    Green
                                  </button>
                                  <button
                                    onClick={() => {
                                      setHighlights((prev) => [
                                        ...prev,
                                        {
                                          id: Math.random().toString(),
                                          text: selectedPassageSnippet,
                                          color:
                                            "bg-sky-104 bg-sky-100 text-sky-850 border-sky-250 border-2 dark:bg-sky-950/40 dark:text-sky-250",
                                          sectionId: currentSec.id,
                                        },
                                      ]);
                                      toast.success("Blue Highlight recorded!");
                                      setSelectedPassageSnippet("");
                                    }}
                                    className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-850 rounded-lg flex items-center justify-center gap-1.5"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-sky-450 shrink-0" />
                                    Blue
                                  </button>
                                  <button
                                    onClick={() => {
                                      setStickyNotes((prev) => [
                                        ...prev,
                                        {
                                          id: Math.random().toString(),
                                          note: `Verify reading details: "${selectedPassageSnippet.slice(0, 35)}..."`,
                                          snippet: selectedPassageSnippet,
                                          color:
                                            "border-indigo-400 bg-indigo-50/20",
                                          sectionId: currentSec.id,
                                        },
                                      ]);
                                      toast.success(
                                        "Added to Notes repository!",
                                      );
                                      setSelectedPassageSnippet("");
                                      setActiveLeftPanelTab("notes");
                                    }}
                                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1 ml-auto"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Sticky Note
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* DYNAMIC LISTENING CONTROLLER AND MULTI-SPEED SEEK */}
                            {currentSec?.type === "Listening" && (
                              <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-xl border border-white/10 relative overflow-hidden text-left mb-4">
                                <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 animate-pulse" />
                                    Dynamic Listening Matrix
                                  </span>
                                  <Badge className="bg-indigo-650 border-none text-[9px] uppercase font-black tracking-widest text-indigo-200">
                                    SPEED CONTROL ACTIVE
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-4 justify-between">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIsAudioPlaying(!isAudioPlaying)
                                    }
                                    className="w-12 h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md shrink-0 focus:scale-95"
                                  >
                                    {isAudioPlaying ? (
                                      <Pause className="w-5 h-5 fill-white animate-pulse" />
                                    ) : (
                                      <Play className="w-5 h-5 fill-white ml-0.5" />
                                    )}
                                  </button>

                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[11px] font-mono font-bold text-slate-400">
                                      <span>Seek Progress</span>
                                      <span>
                                        {Math.floor(audioCurrentTime / 60)}:
                                        {(audioCurrentTime % 60)
                                          .toString()
                                          .padStart(2, "0")}{" "}
                                        / {Math.floor(audioDuration / 60)}:00
                                      </span>
                                    </div>
                                    <div
                                      className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative cursor-pointer"
                                      onClick={(e) => {
                                        const rect =
                                          e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const percent = Math.min(
                                          1,
                                          Math.max(0, clickX / rect.width),
                                        );
                                        setAudioCurrentTime(
                                          Math.round(percent * audioDuration),
                                        );
                                        toast.success(
                                          `Position synchronized to ${Math.round(percent * audioDuration)} seconds!`,
                                        );
                                      }}
                                    >
                                      <div
                                        className="h-full bg-indigo-505 bg-indigo-550 bg-indigo-500 transition-all rounded-full"
                                        style={{
                                          width: `${(audioCurrentTime / audioDuration) * 100}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 shrink-0">
                                    <span className="text-[8px] font-black tracking-widest uppercase text-slate-400 block text-right leading-none">
                                      TEMPO RATE
                                    </span>
                                    <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl">
                                      {[0.75, 1.0, 1.25, 1.5, 2.0].map(
                                        (spd) => (
                                          <button
                                            key={spd}
                                            type="button"
                                            onClick={() => {
                                              setAudioSpeed(spd);
                                              toast.success(
                                                `Playback velocity shifted to ${spd}x`,
                                              );
                                            }}
                                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${audioSpeed === spd ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
                                          >
                                            ${spd}x
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* INTERACTIVE SUBTITLE MATRIX SELECTOR */}
                                <div className="space-y-2.5 pt-3 border-t border-white/5">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-450 block">
                                    Click timeline fragment block to seek player
                                    destination
                                  </span>
                                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-left scrollbar-thin">
                                    {[
                                      {
                                        time: 0,
                                        text: "[Narrator] Section 1: You will hear a registration officer discussing course details.",
                                      },
                                      {
                                        time: 18,
                                        text: "[Officer] Hello, welcome to the Admissions center. How can I facilitate your query?",
                                      },
                                      {
                                        time: 38,
                                        text: "[Student] Hi, I am requesting enrollment information for the advanced listening syllabus.",
                                      },
                                      {
                                        time: 58,
                                        text: "[Officer] Of course! We offer standard and professional modules with complete feedback grids.",
                                      },
                                      {
                                        time: 78,
                                        text: "[Student] Perfect, does that include the speech speed controller and simulated test bypasses?",
                                      },
                                      {
                                        time: 98,
                                        text: "[Officer] Yes! You can adjust the playback from double speed to three-quarter times safely.",
                                      },
                                    ].map((cue, cIdx) => {
                                      const isActive =
                                        audioCurrentTime >= cue.time &&
                                        (cIdx === 5 ||
                                          audioCurrentTime <
                                            [0, 18, 38, 58, 78, 120][cIdx + 1]);
                                      return (
                                        <div
                                          key={cIdx}
                                          onClick={() => {
                                            setAudioCurrentTime(cue.time);
                                            setIsAudioPlaying(true);
                                            toast.success(
                                              `Audio temporal point synchronized to ${cue.time} seconds!`,
                                            );
                                          }}
                                          className={`p-2.5 rounded-xl transition-all cursor-pointer border text-[11px] leading-relaxed flex items-center gap-2 ${isActive ? "bg-indigo-950/45 text-white border-indigo-500/40 ring-2 ring-indigo-500/10 shadow-lg" : "bg-slate-900 hover:bg-slate-800 text-slate-350 border-white/5"}`}
                                        >
                                          <div
                                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isActive ? "bg-indigo-500 text-white animate-pulse" : "bg-slate-850 bg-slate-800 text-slate-500"}`}
                                          >
                                            <span className="font-mono font-bold text-[9px]">
                                              ${cue.time}s
                                            </span>
                                          </div>
                                          <span className="font-sans font-medium">
                                            ${cue.text}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {currentSec?.type !== "Speaking" &&
                              currentSec?.content && (
                                <div
                                  onMouseUp={handlePassageSelection}
                                  className="prose dark:prose-invert max-w-none text-slate-650 dark:text-slate-300 font-medium leading-relaxed font-sans text-sm outline-none"
                                >
                                  <ReactMarkdown>
                                    {currentSec?.content}
                                  </ReactMarkdown>
                                </div>
                              )}

                            {currentSec?.type === "Speaking" &&
                              currentSec?.questions &&
                              currentSec.questions.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 space-y-6 text-left">
                                  <h3 className="text-xl font-black uppercase text-indigo-505 tracking-tight flex items-center gap-2">
                                    <Mic className="w-5 h-5 text-indigo-500 shrink-0" />
                                    IELTS Speaking Prompts
                                  </h3>
                                  <div className="space-y-8">
                                    {(() => {
                                      let lastPartNum: number | null = null;
                                      return currentSec.questions.map(
                                        (q: any, qIdx: number) => {
                                          const {
                                            partNumber,
                                            heading,
                                            instruction,
                                          } = getSpeakingPartDetails(q, qIdx);
                                          const showHeading =
                                            lastPartNum !== partNumber;
                                          lastPartNum = partNumber;

                                          return (
                                            <Fragment key={q.id || qIdx}>
                                              {showHeading && (
                                                <div className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border border-dashed border-indigo-200 dark:border-indigo-900/30 rounded-3xl space-y-2 mt-8 mb-4 select-none">
                                                  <h5 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                    {heading}
                                                  </h5>
                                                  {instruction && (
                                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                                      {instruction}
                                                    </p>
                                                  )}
                                                </div>
                                              )}

                                              <div
                                                id={`speaking-card-${q.id || qIdx}`}
                                                className="p-6 sm:p-8 bg-slate-50/30 dark:bg-white/2 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-6 transition-all hover:bg-slate-50/50 dark:hover:bg-white/5 relative scroll-mt-6"
                                              >
                                                <div className="flex items-start gap-5">
                                                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm text-primary flex items-center justify-center font-black italic text-sm shrink-0">
                                                    {qIdx + 1}
                                                  </div>
                                                  <div className="space-y-2 flex-1">
                                                    <Badge className="bg-white/85 dark:bg-slate-900/80 text-indigo-600 border-indigo-100 dark:border-indigo-900/10 font-black text-[9px] uppercase tracking-widest px-2.5 shadow-sm">
                                                      Part {partNumber} Question
                                                    </Badge>
                                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-lg leading-snug tracking-tight text-left">
                                                      {typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))}
                                                    </h4>
                                                  </div>
                                                </div>

                                                {q.passageText && (
                                                  <div className="p-6 bg-slate-100/30 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                                                        Cue Card Prompts /
                                                        Requirements
                                                      </span>
                                                    </div>
                                                    <div className="text-sm text-slate-650 dark:text-slate-350 font-medium whitespace-pre-wrap leading-relaxed italic">
                                                      {typeof q.passageText === "string" ? q.passageText : (q.passageText?.name || (Array.isArray(q.passageText) ? q.passageText.join("\n") : JSON.stringify(q.passageText)))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </Fragment>
                                          );
                                        },
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </ScrollArea>
                      <ScrollArea className="md:w-1/2 p-12 bg-slate-50/50 dark:bg-white/5 h-[700px]">
                        <div className="space-y-10">
                          {currentSec?.type === "Writing" ? (
                            <div className="space-y-6">
                              {/* REAL-TIME ESSAY WRITING FIELD */}
                              <div className="space-y-3 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Essay Draft Space
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-extrabold font-mono uppercase">
                                    Words:{" "}
                                    {answers[`writing-${currentSec.id}`]
                                      ?.split(/\s+/)
                                      .filter(Boolean).length || 0}
                                  </span>
                                </div>
                                <textarea
                                  className="w-full min-h-[320px] p-8 rounded-3xl border-none shadow-inner bg-white dark:bg-slate-950 font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none leading-relaxed"
                                  placeholder="Draft your interactive IELTS response here..."
                                  value={
                                    answers[`writing-${currentSec.id}`] || ""
                                  }
                                  onChange={(e) =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [`writing-${currentSec.id}`]:
                                        e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              {/* SMART WRITING COACH AND REAL-TIME FEEDS STATS */}
                              {(() => {
                                const report = getWritingCoaching(
                                  answers[`writing-${currentSec.id}`] || "",
                                );
                                return (
                                  <div className="bg-slate-900 text-white rounded-[2rem] p-6 space-y-4 border border-white/5 shadow-2xl text-left">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                      </div>
                                      <div>
                                        <h4 className="font-extrabold text-xs text-white leading-none">
                                          Smart Writing Coach Assistant
                                        </h4>
                                        <span className="text-[8px] text-slate-400 uppercase tracking-wider block mt-0.5">
                                          Real-time analytical essay evaluation
                                        </span>
                                      </div>
                                      <div className="ml-auto flex items-center gap-1 bg-indigo-650/30 px-3 py-1 rounded-xl">
                                        <span className="text-[8px] uppercase tracking-widest text-indigo-300 font-black">
                                          BAND ESTIMATE
                                        </span>
                                        <span className="text-sm font-black text-white italic">
                                          {~~report.projectedBand}.5+
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">
                                          Target Counter
                                        </span>
                                        <div className="flex items-baseline justify-between">
                                          <span className="text-sm font-black italic">
                                            {report.count} words
                                          </span>
                                          <span className="text-[9px] text-slate-400 uppercase tracking-widest">
                                            {report.count >= 250
                                              ? "✅ ACHIEVED"
                                              : "Target: 250+"}
                                          </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                          <div
                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                            style={{
                                              width: `${Math.min(100, (report.count / 250) * 100)}%`,
                                            }}
                                          />
                                        </div>
                                      </div>

                                      <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">
                                          Coherence Rate
                                        </span>
                                        <div className="flex items-baseline justify-between">
                                          <span className="text-sm font-black italic">
                                            {report.transitionsUsed.length}{" "}
                                            links
                                          </span>
                                          <span className="text-[9px] text-slate-400 uppercase tracking-widest">
                                            Connectors
                                          </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                          <div
                                            className="h-full bg-emerald-500 rounded-full transition-all"
                                            style={{
                                              width: `${Math.min(100, (report.transitionsUsed.length / 5) * 100)}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Suggestions panel */}
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                      <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest block font-sans">
                                        Live Coaching Insights
                                      </span>

                                      <div className="space-y-1.5 text-[10px] leading-relaxed font-sans">
                                        {report.count < 150 ? (
                                          <p className="text-slate-300 italic">
                                            ⚠️ Your draft is under the minimum
                                            word criteria. Expand your ideas to
                                            gain better scores.
                                          </p>
                                        ) : report.transitionsUsed.length <
                                          3 ? (
                                          <p className="text-slate-300 italic">
                                            💡 Core Tip: Include more academic
                                            transitional phrases like
                                            **"Furthermore"**, or **"On the
                                            other hand"** to increase Coherence.
                                          </p>
                                        ) : (
                                          <p className="text-emerald-400 font-bold italic">
                                            🌟 Exquisite job! You have satisfied
                                            transitional requirements of high
                                            band scores.
                                          </p>
                                        )}

                                        {report.weakFlagged.length > 0 && (
                                          <div className="p-3 bg-indigo-950/45 border border-indigo-805/10 rounded-xl space-y-1 mt-1 text-left">
                                            <p className="text-amber-400 font-bold uppercase text-[9px] tracking-wider leading-none">
                                              SIMPLE WORDS SWAP FLAGS
                                            </p>
                                            {report.weakFlagged
                                              .slice(0, 2)
                                              .map((wf, idx) => (
                                                <p
                                                  key={idx}
                                                  className="text-slate-300 italic text-[9px]"
                                                >
                                                  Swap simple{" "}
                                                  <span className="font-bold underline text-amber-300">
                                                    "${wf.weak}"
                                                  </span>{" "}
                                                  with high-tier vocab:{" "}
                                                  <span className="text-emerald-400">
                                                    ${wf.replace}
                                                  </span>
                                                </p>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : currentSec?.type === "Speaking" ? (
                            <div className="space-y-8 max-w-4xl mx-auto text-left">
                              {answers[`speaking-${currentSec.id}`] ? (
                                <div className="space-y-6">
                                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                          <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                          <h3 className="text-xl font-black italic uppercase tracking-tight">
                                            Practice Complete
                                          </h3>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                            Review your AI-graded response below
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl h-10 font-bold uppercase italic text-[10px] text-slate-400 hover:text-red-500 gap-2"
                                        onClick={() => {
                                          setAnswers((p) => {
                                            const newAns = { ...p };
                                            delete newAns[
                                              `speaking-${currentSec.id}`
                                            ];
                                            return newAns;
                                          });
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" /> Restart
                                        section
                                      </Button>
                                    </div>

                                    {(() => {
                                      try {
                                        const data = JSON.parse(
                                          answers[`speaking-${currentSec.id}`],
                                        );
                                        return (
                                          <div className="space-y-8">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                              {data.audioUrl && (
                                                <audio
                                                  src={data.audioUrl}
                                                  controls
                                                  className="w-full h-10"
                                                />
                                              )}
                                            </div>

                                            {data.analysis && (
                                              <div className="space-y-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                  {[
                                                    {
                                                      label: "Overall",
                                                      value:
                                                        data.analysis
                                                          .overallBand,
                                                      color: "text-amber-500",
                                                    },
                                                    {
                                                      label: "Fluency",
                                                      value:
                                                        data.analysis.criteria
                                                          ?.fluencyCoherence
                                                          ?.band ||
                                                        data.analysis
                                                          .fluencyScore,
                                                      color: "text-blue-500",
                                                    },
                                                    {
                                                      label: "Vocabulary",
                                                      value:
                                                        data.analysis.criteria
                                                          ?.lexicalResource
                                                          ?.band ||
                                                        data.analysis
                                                          .correctnessScore,
                                                      color: "text-emerald-500",
                                                    },
                                                    {
                                                      label: "Grammar",
                                                      value:
                                                        data.analysis.criteria
                                                          ?.grammaticalRange
                                                          ?.band ||
                                                        data.analysis
                                                          .pronunciationScore,
                                                      color: "text-rose-500",
                                                    },
                                                  ].map((stat, i) => (
                                                    <div
                                                      key={i}
                                                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm text-center"
                                                    >
                                                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        {stat.label}
                                                      </p>
                                                      <p
                                                        className={`text-xl font-black italic ${stat.color}`}
                                                      >
                                                        {stat.value || "N/A"}
                                                      </p>
                                                    </div>
                                                  ))}
                                                </div>

                                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                                  <div className="flex items-center gap-2 mb-4">
                                                    <Mic className="w-4 h-4 text-primary" />
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                                                      Detailed Feedback
                                                    </h4>
                                                  </div>
                                                  <div className="space-y-4">
                                                    <div>
                                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        Transcript
                                                      </p>
                                                      <p className="text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                        {data.analysis
                                                          .transcript ||
                                                          data.transcript}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        Improvement Suggestions
                                                      </p>
                                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                                        {
                                                          data.analysis
                                                            .suggestions
                                                        }
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      } catch (e) {
                                        return null;
                                      }
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                  {/* Speaking guide removed */}

                                  <SpeakingRecorder
                                    onComplete={async (data) => {
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [`speaking-${currentSec.id}`]:
                                          JSON.stringify(data),
                                      }));
                                      toast.success(
                                        "Speaking response recorded and analyzed!",
                                      );

                                      // Immediate sync to database for admin review
                                      if (supabase) {
                                        try {
                                          const {
                                            data: { user },
                                          } = await supabase.auth.getUser();
                                          const studentProfile = JSON.parse(
                                            localStorage.getItem(
                                              "student_profile",
                                            ) || "{}",
                                          );
                                          await supabase
                                            .from("student_submissions")
                                            .insert([
                                              {
                                                student_id: user?.id,
                                                student_name:
                                                  studentProfile.name ||
                                                  "Anonymous",
                                                course_title:
                                                  "Speaking Practice (Mock)",
                                                lesson_title:
                                                  currentSec.title ||
                                                  "Speaking Section",
                                                lesson_type:
                                                  "SPEAKING_PRACTICE",
                                                content: JSON.stringify({
                                                  sections: [
                                                    {
                                                      section: currentSec.title,
                                                      type: "Speaking",
                                                      results: [
                                                        {
                                                          type: "speaking",
                                                          data,
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                }),
                                                created_at:
                                                  new Date().toISOString(),
                                              },
                                            ]);
                                        } catch (e) {
                                          console.warn(
                                            "Failed immediate speaking sync:",
                                            e,
                                          );
                                        }
                                      }
                                    }}
                                    prompt={
                                      currentSec.title +
                                      ": " +
                                      (currentSec.content || "") +
                                      (currentSec.questions &&
                                      currentSec.questions.length > 0
                                        ? "\n\nSpeaking Questions:\n" +
                                          currentSec.questions
                                            .map(
                                              (q: any, idx: number) =>
                                                `${idx + 1}. ${typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))}${
                                                  q.passageText
                                                    ? "\nDetails: " +
                                                      q.passageText
                                                    : ""
                                                }`,
                                            )
                                            .join("\n")
                                        : "")
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-8">
                              {(currentSec?.questions || []).map(
                                (q: any, qIdx: number) => {
                                  const qType = String(
                                    q.type || "",
                                  ).toUpperCase();

                                  if (qType === "BLANK") {
                                    return (
                                      <div key={q.id} className="space-y-4">
                                        <div className="flex items-start gap-4">
                                          <div className="w-auto min-w-[2rem] h-8 px-1.5 rounded-xl bg-primary text-white flex items-center justify-center font-black italic text-xs mt-1 shrink-0">
                                            {questionNumbering.numberMap[
                                              q.id
                                            ] || qIdx + 1}
                                          </div>
                                          <p className="font-bold text-slate-800 dark:text-slate-200">
                                            {typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))}
                                          </p>
                                        </div>
                                        <div className="pl-12">
                                          <input
                                            type="text"
                                            placeholder="Type your answer here..."
                                            value={answers[q.id] || ""}
                                            onChange={(e) =>
                                              setAnswers((prev) => ({
                                                ...prev,
                                                [q.id]: e.target.value,
                                              }))
                                            }
                                            className="h-12 w-full max-w-md px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                          />
                                        </div>
                                      </div>
                                    );
                                  }

                                  if (qType === "INLINE_BLANKS") {
                                    return (
                                      <div
                                        key={q.id}
                                        className="space-y-4 animate-fade-in"
                                      >
                                        <div className="flex items-start gap-4">
                                          <div className="w-auto min-w-[2rem] h-8 px-1.5 rounded-xl bg-primary text-white flex items-center justify-center font-black italic text-xs mt-1 shrink-0">
                                            {questionNumbering.blockStartMap[
                                              q.id
                                            ]
                                              ? questionNumbering.blockStartMap[
                                                  q.id
                                                ] ===
                                                questionNumbering.blockEndMap[
                                                  q.id
                                                ]
                                                ? `${questionNumbering.blockStartMap[q.id]}`
                                                : `${questionNumbering.blockStartMap[q.id]}–${questionNumbering.blockEndMap[q.id]}`
                                              : qIdx + 1}
                                          </div>
                                          <p className="font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest text-[9px] mt-1.5 italic">
                                            SUMMARY COMPLETION (BLANKS)
                                          </p>
                                        </div>
                                        <div className="pl-12 text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap">
                                          {(typeof q.text === "string"
                                            ? q.text
                                            : Array.isArray(q.text)
                                              ? q.text.join("\n")
                                              : String(q.text || "")
                                          )
                                            .split(/_{3,}|\[BLANK\]/i)
                                            .map(
                                              (
                                                part: string,
                                                idx: number,
                                                arr: string[],
                                              ) => {
                                                if (idx === arr.length - 1)
                                                  return (
                                                    <span key={idx}>
                                                      {part}
                                                    </span>
                                                  );
                                                return (
                                                  <Fragment key={idx}>
                                                    <span>{part}</span>
                                                    <span className="inline-flex items-center gap-1 mx-1 select-none">
                                                      <span className="text-[10px] font-black text-primary bg-primary/10 rounded px-1.5 py-0.5 italic border border-primary/20">
                                                        {questionNumbering
                                                          .numberMap[
                                                          `${q.id}_${idx}`
                                                        ] ||
                                                          `${qIdx + 1}.${idx + 1}`}
                                                      </span>
                                                      <input
                                                        type="text"
                                                        placeholder={`Blank ${questionNumbering.numberMap[`${q.id}_${idx}`] || idx + 1}`}
                                                        value={
                                                          answers[
                                                            `${q.id}_${idx}`
                                                          ] || ""
                                                        }
                                                        onChange={(e) =>
                                                          setAnswers(
                                                            (prev) => ({
                                                              ...prev,
                                                              [`${q.id}_${idx}`]:
                                                                e.target.value,
                                                            }),
                                                          )
                                                        }
                                                        className="inline-block w-36 border-b-2 border-x-0 border-t-0 border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-slate-900/50 px-2 py-0.5 focus:ring-0 focus:border-primary text-center font-bold text-slate-900 dark:text-white outline-none transition-all"
                                                      />
                                                    </span>
                                                  </Fragment>
                                                );
                                              },
                                            )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  if (qType === "MATCHING") {
                                    const questionsList = currentSec?.questions || [];
                                    const prevQ = qIdx > 0 ? questionsList[qIdx - 1] : null;
                                    const getHeadingsStr = (item: any) => {
                                      if (!item) return "";
                                      const p = item.passageText ?? item.headings ?? item.options ?? "";
                                      return typeof p === "string" ? p.trim() : (Array.isArray(p) ? p.join("\n").trim() : String(p).trim());
                                    };
                                    const prevHeadings = getHeadingsStr(prevQ);
                                    const currHeadings = getHeadingsStr(q);
                                    const isFirstInMatchingGroup = !prevQ || String(prevQ.type || "").toUpperCase() !== "MATCHING" || prevHeadings !== currHeadings || !currHeadings;
                                    const listHeadings = currHeadings.split("\n").filter(Boolean);
                                    const parts = (
                                      typeof q.text === "string"
                                        ? q.text
                                        : Array.isArray(q.text)
                                          ? q.text.join("\n")
                                          : String(q.text || "")
                                    )
                                      .split("\n")
                                      .filter(Boolean);

                                    return (
                                      <div key={q.id} className="space-y-5">
                                        <div className="flex items-start gap-4">
                                          <div className="w-auto min-w-[2.25rem] h-9 px-2 rounded-xl bg-primary text-white flex items-center justify-center font-black italic text-xs mt-1 shrink-0">
                                            {questionNumbering.blockStartMap[
                                              q.id
                                            ]
                                              ? questionNumbering.blockStartMap[
                                                  q.id
                                                ] ===
                                                questionNumbering.blockEndMap[
                                                  q.id
                                                ]
                                                ? `${questionNumbering.blockStartMap[q.id]}`
                                                : `${questionNumbering.blockStartMap[q.id]}–${questionNumbering.blockEndMap[q.id]}`
                                              : qIdx + 1}
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
                                              Matching Headings
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-0.5">
                                              Choose the correct heading from
                                              the list for each paragraph or
                                              statement
                                            </p>
                                          </div>
                                        </div>
                                        <div className="pl-0 sm:pl-12 space-y-5">
                                          {isFirstInMatchingGroup && listHeadings.length > 0 && (
                                            <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-150 dark:border-white/10 space-y-3 shadow-inner max-w-3xl">
                                              <h5 className="text-[10px] sm:text-xs font-black uppercase text-indigo-500 tracking-wider">
                                                List of Headings / Features
                                              </h5>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {listHeadings.map(
                                                  (hd, hIdx) => (
                                                    <div
                                                      key={hIdx}
                                                      className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xs"
                                                    >
                                                      {hd}
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          <div className="space-y-3.5 max-w-3xl">
                                            {parts.map((pText, pIdx) => (
                                              <div
                                                key={pIdx}
                                                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:border-slate-200 dark:hover:border-white/10 transition-all"
                                              >
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                  <span className="w-7 h-6 rounded bg-primary/10 text-primary text-[10px] font-black italic flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                                                    {questionNumbering
                                                      .numberMap[
                                                      `${q.id}_${pIdx}`
                                                    ] ||
                                                      `${qIdx + 1}.${pIdx + 1}`}
                                                  </span>
                                                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                                                    {pText}
                                                  </span>
                                                </div>
                                                <select
                                                  value={
                                                    answers[
                                                      `${q.id}_${pIdx}`
                                                    ] || ""
                                                  }
                                                  onChange={(e) =>
                                                    setAnswers((prev) => ({
                                                      ...prev,
                                                      [`${q.id}_${pIdx}`]:
                                                        e.target.value,
                                                    }))
                                                  }
                                                  className="h-10 w-full md:w-72 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus-visible:outline-none px-3 cursor-pointer text-slate-700 dark:text-slate-300 shrink-0"
                                                >
                                                  <option value="" disabled>
                                                    Select feature / heading...
                                                  </option>
                                                  {listHeadings.map(
                                                    (hd, hIdx) => (
                                                      <option
                                                        key={hIdx}
                                                        value={hd}
                                                      >
                                                        {hd}
                                                      </option>
                                                    ),
                                                  )}
                                                </select>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Default MCQ & TF render
                                  return (
                                    <div key={q.id} className="space-y-4">
                                      <div className="flex items-start gap-4">
                                        <div className="w-auto min-w-[2rem] h-8 px-1.5 rounded-xl bg-primary text-white flex items-center justify-center font-black italic text-xs mt-1 shrink-0">
                                          {questionNumbering.numberMap[q.id] ||
                                            qIdx + 1}
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">
                                          {typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))}
                                        </p>
                                      </div>
                                      <div className="grid gap-3 pl-12 max-w-2xl">
                                        {q.options?.map(
                                          (opt: string, oIdx: number) => (
                                            <div
                                              key={oIdx}
                                              onClick={() =>
                                                setAnswers((prev) => ({
                                                  ...prev,
                                                  [q.id]: opt,
                                                }))
                                              }
                                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${answers[q.id] === opt ? "bg-primary border-primary text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300"}`}
                                            >
                                              <div
                                                className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10px] font-black ${answers[q.id] === opt ? "bg-white/20 border-white/40" : "border-slate-200"}`}
                                              >
                                                {String.fromCharCode(65 + oIdx)}
                                              </div>
                                              <span className="text-xs font-bold">
                                                {opt}
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </Card>
                  )}
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
                    <Button
                      variant="ghost"
                      disabled={currentSectionIdx === 0}
                      onClick={() => setCurrentSectionIdx((prev) => prev - 1)}
                      className="rounded-xl h-12 px-8 font-black italic"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="flex gap-2">
                      {selectedTest?.sections?.map((_: any, i: number) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${currentSectionIdx === i ? "w-8 bg-primary" : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                    <Button
                      disabled={
                        currentSectionIdx ===
                        (selectedTest?.sections?.length || 1) - 1
                      }
                      onClick={() => setCurrentSectionIdx((prev) => prev + 1)}
                      className="rounded-xl h-12 px-10 font-black italic"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
