import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { 
  Flame, 
  Target, 
  BarChart3, 
  Clock, 
  PenTool, 
  Mic, 
  BookOpen, 
  Headphones, 
  ArrowUpRight,
  TrendingUp,
  Brain,
  Calendar,
  Video,
  Phone,
  Sparkles,
  ChevronRight,
  Layout,
  Settings,
  Lock,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  Upload,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Download,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Award,
  Users
} from "lucide-react";
import { Link, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, Shield, Star, Zap } from "lucide-react";
import { safeSetItem, compressImage, safeGetItemAndParse } from "@/src/lib/safeStorage";
import StudentCourses from "../public/Courses";
import WritingModule from "./WritingModule";
import StudentClassroomHub from "../../components/dashboard/StudentClassroomHub";
import AIConversationCoach from "../../components/dashboard/AIConversationCoach";
import GoogleMeetManager from "../../components/dashboard/GoogleMeetManager";
import EmbeddedCallManager from "../../components/dashboard/EmbeddedCallManager";
import VisualCalendar from "../../components/dashboard/VisualCalendar";
import CourseProgressTracker from "../../components/CourseProgressTracker";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const scoreData = [
  { name: 'Mar', score: 6.0 },
  { name: 'Apr', score: 6.5 },
  { name: 'May', score: 7.0 },
  { name: 'Jun', score: 7.5 },
];

function DashboardTooltip({ content, children }: { content: string, children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip inline-block">
      {children}
      <div className="absolute z-50 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 bottom-full left-1/2 -translate-x-1/2 mb-2 scale-90 group-hover/tooltip:scale-100 origin-bottom select-none">
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl border border-slate-800 dark:border-white/10 whitespace-nowrap">
          {content}
        </div>
        <div className="w-2.5 h-2.5 bg-slate-900 dark:bg-slate-950 border-r border-b border-slate-800 dark:border-white/10 rotate-45 transform left-1/2 -translate-x-1/2 -translate-y-1.5 absolute" />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl shadow-primary/10 animate-in fade-in zoom-in duration-300">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <p className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
            Band {payload[0].value}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const MockTestTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl text-white text-left max-w-xs space-y-1.5 font-sans">
        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Mock Examination Report</p>
        <p className="font-extrabold text-sm leading-tight text-white">{data.testName}</p>
        <div className="flex items-center gap-4 pt-1">
          <div>
            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Band Score</span>
            <span className="text-lg font-black text-indigo-350">Band {data.band}</span>
          </div>
          <div className="h-6 w-[1px] bg-white/15" />
          <div>
            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Percentage</span>
            <span className="text-lg font-black text-emerald-400">{data.score}%</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 font-bold italic pt-1 border-t border-white/5">{data.fullDate || "Simulation Data"}</p>
      </div>
    );
  }
  return null;
};

const moduleData = [
  { name: 'Reading', score: 8.0, color: '#0ea5e9' },
  { name: 'Listening', score: 7.5, color: '#6366f1' },
  { name: 'Writing', score: 6.5, color: '#f59e0b' },
  { name: 'Speaking', score: 7.0, color: '#10b981' },
];

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StudentDashboard() {
  const { tab: routeTab } = useParams<{ tab?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("student_profile") || localStorage.getItem("sb-user") || localStorage.getItem("authenticated_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  
  // Responsive navigation and active sub-view toggling
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "resources" | "courses" | "writing" | "speaking" | "listening" | "reading" | "writing-simulator" | "speaking-simulator" | "ai-conversation" | "google-meet" | "embedded-calling" | "classrooms">(() => {
    // Priority 1: Route Params (/dashboard/:tab)
    if (routeTab) return routeTab as any;

    // Priority 2: URL Query Params (?tab=...)
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam) return tabParam as any;

    // Priority 3: Persistent Local Storage
    const saved = localStorage.getItem("student_dashboard_tab");
    return (saved as any) || "overview";
  });

  // Sync routeTab/searchParams to activeTab
  useEffect(() => {
    if (routeTab && routeTab !== activeTab) {
      setActiveTab(routeTab as any);
    } else {
      const tabParam = searchParams.get("tab");
      if (tabParam && tabParam !== activeTab) {
        setActiveTab(tabParam as any);
      }
    }
  }, [routeTab, searchParams]);

  // Sync tab with URL and Persistence
  useEffect(() => {
    localStorage.setItem("student_dashboard_tab", activeTab);
    
    // Update URL without full reload if user changes tab in dashboard
    if (location.pathname === "/dashboard") {
      const currentParam = searchParams.get("tab");
      if (activeTab === "overview") {
        if (currentParam) {
          searchParams.delete("tab");
          setSearchParams(searchParams, { replace: true });
        }
      } else if (currentParam !== activeTab) {
        setSearchParams({ tab: activeTab }, { replace: true });
      }
    }
  }, [activeTab, location.pathname]);

  useEffect(() => {
    const syncState = async () => {
      if (!supabase) return;
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('current_state')
            .eq('id', authUser.id)
            .single();
          
          await supabase
            .from('profiles')
            .update({ 
              current_state: { 
                ...(existing?.current_state || {}),
                dashboard_tab: activeTab 
              } 
            })
            .eq('id', authUser.id);
        }
      } catch (e) {}
    };
    syncState();
  }, [activeTab]);
  // Resources study materials state
  const [resources, setResources] = useState<any[]>([]);
  const [resourcesFilter, setResourcesFilter] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  
  // Profile Editor Form values
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [targetBand, setTargetBand] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("student_target_band");
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {}
    return 6.5;
  });
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempTargetBand, setTempTargetBand] = useState<string>("6.5");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [examType, setExamType] = useState("Academic");
  const [successMsg, setSuccessMsg] = useState("");
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const planParam = params.get("plan");
    const isSimulated = params.get("simulated");

    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam as any);
      localStorage.setItem("student_dashboard_tab", tabParam);
      // Clean only the 'tab' parameter from URL, keeping others like 'room'
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("tab");
      const searchStr = newParams.toString();
      const cleanUrl = window.location.pathname + (searchStr ? `?${searchStr}` : "") + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (paymentStatus === "success" && planParam) {
      toast.success(
        isSimulated 
          ? `Sandbox Bypass Successful! Upgraded to ${planParam}.` 
          : `Payment successful! Thank you for subscribing to ${planParam}.`
      );

      // Reset local state instantly so user gets visual feedback
      if (userProfile) {
        setUserProfile((prev: any) => ({ ...prev, plan: planParam }));
      }

      // Clean query parameters from URL safely
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Trigger user profile backup sync
      if (supabase) {
        (async () => {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
              await supabase
                .from('profiles')
                .update({ plan: planParam })
                .eq('id', authUser.id);
            }
          } catch (e) {
            console.warn("Client fallback plan sync failed:", e);
          }
        })();
      }
    } else if (paymentStatus === "cancel") {
      toast.error("Subscription purchase checkout cancelled.");
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [userProfile?.id]);

  // Meetings Notification Trigger: alerts 10 min before scheduled starts, and new invitations
  const [notifiedMeetings, setNotifiedMeetings] = useState<string[]>([]);
  useEffect(() => {
    const checkUpcomingMeetings = async () => {
      try {
        let allMeetings: any[] = [];
        let currentUserId = "anonymous_preview_user";
        let studentEmail = "";

        if (supabase) {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            currentUserId = sbUser.id;
            studentEmail = sbUser.email || "";
          }
        }

        // 1. Load from Supabase if possible (only future/recent meetings, required columns)
        if (supabase) {
          const { data, error } = await supabase
            .from("live_meetings")
            .select("id, title, scheduled_start, meeting_type, invitee_email")
            .gte("scheduled_start", new Date(Date.now() - 30 * 60 * 1000).toISOString());
          if (!error && data) {
            allMeetings = data;
          }
        }

        // 2. Load from global local storage first
        const globalSaved = localStorage.getItem("sebs_global_meetings");
        if (globalSaved) {
          try {
            const parsed = JSON.parse(globalSaved);
            parsed.forEach((m: any) => {
              if (!allMeetings.some(item => item.id === m.id)) {
                allMeetings.push(m);
              }
            });
          } catch (e) {}
        } else {
          // Fallbacks for backwards-compatibility
          const googleSaved = localStorage.getItem(`sebs_google_meetings_${currentUserId}`) || localStorage.getItem("sebs_google_meetings_anonymous_preview_user");
          const embedSaved = localStorage.getItem(`sebs_embedded_meetings_${currentUserId}`) || localStorage.getItem("sebs_embedded_meetings_anonymous_preview_user");

          if (googleSaved) {
            try {
              const parsed = JSON.parse(googleSaved);
              parsed.forEach((m: any) => {
                if (!allMeetings.some(item => item.id === m.id)) {
                  allMeetings.push(m);
                }
              });
            } catch(e) {}
          }
          if (embedSaved) {
            try {
              const parsed = JSON.parse(embedSaved);
              parsed.forEach((m: any) => {
                if (!allMeetings.some(item => item.id === m.id)) {
                  allMeetings.push(m);
                }
              });
            } catch(e) {}
          }
        }

        // Filter based on student invitation
        const filteredMeetings = allMeetings.filter((meeting: any) => {
          if (!meeting.invitee_email) return true; // Empty means public
          const target = meeting.invitee_email.trim().toLowerCase();
          if (target === "all-students@sebs.edu" || target === "") return true;
          
          if (!studentEmail) return true; // Fallback if not logged in
          const emails = target.split(",").map((e: string) => e.trim().toLowerCase());
          return emails.includes(studentEmail.trim().toLowerCase());
        });

        // Check for brand new invitations (to send in-app notification & simulated email)
        const notifiedNewStr = localStorage.getItem("sebs_new_notified_meetings") || "[]";
        let notifiedNew: string[] = [];
        try {
          notifiedNew = JSON.parse(notifiedNewStr);
        } catch (e) {}

        let updatedNotifiedNew = [...notifiedNew];
        let hasNewInvites = false;

        filteredMeetings.forEach((meeting) => {
          if (!updatedNotifiedNew.includes(meeting.id)) {
            updatedNotifiedNew.push(meeting.id);
            hasNewInvites = true;

            // Instantly sync with App Notification Centre
            window.dispatchEvent(
              new CustomEvent("new_notification", {
                detail: {
                  id: meeting.id,
                  title: "New IELTS Class Scheduled 📅",
                  message: `You are requested to attend "${meeting.title}" on ${new Date(meeting.scheduled_start).toLocaleString()}`,
                  time: "Just now",
                  read: false,
                },
              })
            );

            // Pop highly polished confirmation toast representing BOTH notification and received email!
            toast.success(
              <div className="space-y-1 p-0.5">
                <p className="font-extrabold text-emerald-600 text-[11.5px] flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ✉️ Official Invitation Received!
                </p>
                <p className="text-[11px] text-slate-800 font-black leading-tight">
                  You are invited to: "{meeting.title}"
                </p>
                <p className="text-[9.5px] text-slate-500 font-semibold leading-normal">
                  Class starts: {new Date(meeting.scheduled_start).toLocaleString()}
                </p>
                <p className="text-[8px] bg-indigo-50 dark:bg-white/5 py-0.5 px-1.5 rounded text-indigo-600 dark:text-indigo-400 font-mono tracking-wider inline-block">
                  Delivered to mailbox: {studentEmail || "your registered email"}
                </p>
              </div>,
              { duration: 15000 }
            );
          }
        });

        if (hasNewInvites) {
          localStorage.setItem("sebs_new_notified_meetings", JSON.stringify(updatedNotifiedNew));
        }

        const nowMs = Date.now();
        const tenMinsMs = 10 * 60 * 1000;

        filteredMeetings.forEach((meeting) => {
          const startTime = new Date(meeting.scheduled_start).getTime();
          const timeDiff = startTime - nowMs;

          // Alert if the meeting starts within 10 minutes (and not already notified or ended)
          if (timeDiff > 0 && timeDiff <= tenMinsMs) {
            if (!notifiedMeetings.includes(meeting.id)) {
              setNotifiedMeetings(prev => [...prev, meeting.id]);
              
              toast.info(
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Meeting starts in 10 minutes!
                  </p>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{meeting.title}</p>
                  <p className="text-[9px] font-black uppercase text-indigo-500">
                    Channel: {meeting.meeting_type === "google_meet" ? "Google Meet" : "Embedded Calling"}
                  </p>
                </div>,
                {
                  duration: 10000,
                  icon: <Bell className="w-4 h-4 text-indigo-500 animate-bounce" />
                }
              );
            }
          }
        });
      } catch (err) {}
    };

    checkUpcomingMeetings();
    window.addEventListener("sebs_meetings_updated", checkUpcomingMeetings);
    window.addEventListener("storage", checkUpcomingMeetings);
    const interval = setInterval(checkUpcomingMeetings, 60000); // Poll every 60 seconds to save egress
    return () => {
      window.removeEventListener("sebs_meetings_updated", checkUpcomingMeetings);
      window.removeEventListener("storage", checkUpcomingMeetings);
      clearInterval(interval);
    };
  }, [notifiedMeetings]);

  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [streakCount, setStreakCount] = useState(12);
  const [xpPoints, setXpPoints] = useState(2450);

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("completed_lessons");
      return saved ? JSON.parse(saved) : ["m1-l1"]; // default with m1-l1 completed for wonderful instant progress visualization
    } catch (e) {
      return ["m1-l1"];
    }
  });

  const [coursesList, setCoursesList] = useState<any[]>([]);

  // Load completed lessons list from Supabase if active
  useEffect(() => {
    const syncCompleted = async () => {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("completed_lessons")
          .eq("id", user.id)
          .single();
        if (profile?.completed_lessons && Array.isArray(profile.completed_lessons)) {
          setCompletedLessons(profile.completed_lessons);
        }
      } catch (e) {
        console.warn("Could not sync completed lessons from database:", e);
      }
    };
    syncCompleted();
  }, [userProfile]);

  // Load courses details
  useEffect(() => {
    const loadCoursesList = async () => {
      let localC = [];
      try {
        const cached = localStorage.getItem("mock_courses");
        if (cached) {
          localC = JSON.parse(cached);
        }
      } catch (e) {}

      if (!localC || localC.length === 0) {
        localC = [
          {
            id: "course-writing-band9",
            title: "IELTS Writing Task 2 Masterclass",
            type: "Writing",
            difficulty: "Advanced",
            level: "8.0+",
            modules: [
              {
                id: "m1-intro",
                title: "Introduction Formulas",
                lessons: [
                  { id: "m1-l1", title: "1. The Paraphrasing Hack" },
                  { id: "m1-l2", title: "2. Structuring Thesis Statements" }
                ]
              },
              {
                id: "m2-body",
                title: "Body Paragraph Architecture",
                lessons: [
                  { id: "m2-l1", title: "1. PEEL Paragraph Builder" },
                  { id: "m2-l2", title: "2. Argumentative Practice Quiz" }
                ]
              }
            ]
          },
          {
            id: "course-speaking-band9",
            title: "IELTS Speaking Band 9.0 Strategy",
            type: "Speaking",
            difficulty: "All Levels",
            level: "7.5 - 9.0",
            modules: [
              {
                id: "sp-m1",
                title: "Fluency & Coherence Secrets",
                lessons: [
                  { id: "sp-m1-l1", title: "1. Eliminating Pause Fillers" }
                ]
              }
            ]
          },
          {
            id: "course-reading-band9",
            title: "IELTS Reading Academic Secrets",
            type: "Reading",
            difficulty: "Advanced",
            level: "7.5+",
            modules: [
              {
                id: "rm1-skills",
                title: "Core Reading Operations",
                lessons: [
                  { id: "rm1-l1", title: "1. Mobile Money Transfers by Safaricom" }
                ]
              }
            ]
          }
        ];
      }

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("courses")
            .select("*");
          if (data && data.length > 0) {
            const parsed = data.map((c: any) => ({
              ...c,
              modules: typeof c.modules === "string" ? JSON.parse(c.modules) : c.modules
            }));
            setCoursesList(parsed);
            return;
          }
        } catch (e) {
          console.warn("Could not load courses from Supabase, using local database:", e);
        }
      }
      setCoursesList(localC);
    };

    loadCoursesList();
  }, [userProfile]);

  const enrolledCoursesChartData = useMemo(() => {
    return coursesList.map((course: any) => {
      let mods = course.modules;
      if (typeof mods === "string") {
        try {
          mods = JSON.parse(mods);
        } catch (e) {
          mods = [];
        }
      }
      mods = Array.isArray(mods) ? mods : [];

      const allLessons = mods.flatMap((m: any) => m.lessons || []) || [];
      const totalLessonsCount = allLessons.length;
      const completedCount = allLessons.filter((l: any) => l && l.id && completedLessons.includes(l.id)).length;
      const percentage = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;
      
      let barColor = "#6366f1"; // Indigo default
      if (course.type === "Writing") barColor = "#f59e0b"; // Amber
      else if (course.type === "Speaking") barColor = "#10b981"; // Emerald
      else if (course.type === "Reading") barColor = "#0ea5e9"; // Sky blue
      else if (course.type === "Listening") barColor = "#a855f7"; // Purple
      
      const courseTitle = course.title || course.name || "Untitled Course";

      return {
        id: course.id,
        name: courseTitle,
        shortName: courseTitle.length > 18 ? `${courseTitle.substring(0, 18)}...` : courseTitle,
        type: course.type || "General",
        completed: completedCount,
        total: totalLessonsCount,
        percentage: percentage,
        fill: barColor,
        lessons: allLessons
      };
    });
  }, [coursesList, completedLessons]);

  const handleQuickStudyCourse = async (courseId: string) => {
    const course = enrolledCoursesChartData.find((c: any) => c.id === courseId);
    if (!course) return;

    const nextUncompleted = course.lessons.find((l: any) => !completedLessons.includes(l.id));
    if (!nextUncompleted) {
      toast.success(`You have already completed the entire curriculum for "${course.name}"! Outstanding work! 🎉`);
      return;
    }

    const updatedCompleted = [...completedLessons, nextUncompleted.id];
    setCompletedLessons(updatedCompleted);
    localStorage.setItem("completed_lessons", JSON.stringify(updatedCompleted));

    const newXp = xpPoints + 150;
    setXpPoints(newXp);
    
    const updatedProfile = {
      ...userProfile,
      xp: newXp
    };
    setUserProfile(updatedProfile);
    safeSetItem("student_profile", JSON.stringify(updatedProfile));

    if (supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase
            .from("profiles")
            .update({ 
              completed_lessons: updatedCompleted,
              xp: newXp
            })
            .eq("id", authUser.id);
        }
      } catch (err) {
        console.warn("DB syncing course lesson completion failed:", err);
      }
    }

    toast.success(
      <div className="space-y-1 text-left font-sans">
        <p className="font-extrabold text-xs text-slate-900 dark:text-white">Lesson Completed! 🚀</p>
        <p className="text-[10px] text-slate-500 italic">"{nextUncompleted.title}" marked as finished.</p>
        <p className="text-[9px] uppercase font-black tracking-wider text-indigo-600">+150 XP Earned</p>
      </div>
    );
  };
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [moduleProgress, setModuleProgress] = useState({
    writing: 65,
    speaking: 50,
    reading: 80,
    listening: 70
  });

  useEffect(() => {
    const savedProg = localStorage.getItem('module_progress');
    if (savedProg) {
      try { setModuleProgress(JSON.parse(savedProg)); } catch(e) {}
    }
  }, []);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnimatePresenceOpen, setIsAnimatePresenceOpen] = useState(true); // helper for presence tracking if needed

  // Dynamic Mock Test Attempts history for Recharts Trends Visualizer
  const [mockHistory, setMockHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchMockTestHistory = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from("student_submissions")
          .select("*")
          .eq("student_id", user.id)
          .eq("lesson_type", "MOCK_TEST")
          .order("created_at", { ascending: true });
          
        if (data) {
          setMockHistory(data.map(d => ({
            ...d,
            content: typeof d.content === 'string' ? JSON.parse(d.content) : d.content
          })));
        }
      } catch (err) {
        console.error("Error loading mock test history for graph:", err);
      }
    };
    fetchMockTestHistory();
  }, []);

  const mockChartData = useMemo(() => {
    if (mockHistory.length === 0) {
      // Elegant default mock-up curve of standard progress if there are no submissions logged yet
      return [
        { date: "Diagnostic", score: 55, band: "5.5", testName: "Initial Placement Diagnostic", fullDate: "Simulation Baseline" },
        { date: "Practice 1", score: 65, band: "6.5", testName: "Mid-Term Practice Evaluation", fullDate: "Simulation Checkpoint 1" },
        { date: "Practice 2", score: 75, band: "7.5", testName: "Mock Test Academic Section", fullDate: "Simulation Checkpoint 2" },
        { date: "Latest", score: 85, band: "8.5", testName: "Standard Examination Sim", fullDate: "Simulation Current Estimate" }
      ];
    }
    return mockHistory.map((att, idx) => {
      const percent = att.content?.score?.percent || 0;
      let band = "5.5";
      if (percent >= 90) band = "9.0";
      else if (percent >= 85) band = "8.5";
      else if (percent >= 75) band = "7.5";
      else if (percent >= 65) band = "6.5";
      else if (percent >= 50) band = "5.5";
      
      return {
        date: new Date(att.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        score: percent,
        band: band,
        testName: att.lesson_title || `Attempt ${idx + 1}`,
        fullDate: new Date(att.created_at).toLocaleDateString()
      };
    });
  }, [mockHistory]);

  const performanceMetrics = useMemo(() => {
    // Combine quizHistory and mockHistory
    const allTests: any[] = [];
    const seenKeys = new Set<string>();

    (quizHistory || []).forEach((item, idx) => {
      const key = item.id || `${item.quiz || item.course}_${item.date || idx}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allTests.push(item);
      }
    });

    (mockHistory || []).forEach((att, idx) => {
      const key = att.id || `${att.lesson_title || "Mock"}_${att.created_at || idx}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const contentObj = typeof att.content === 'string' ? JSON.parse(att.content || '{}') : (att.content || {});
        const percent = contentObj.score?.percent !== undefined ? contentObj.score.percent : (att.score || 0);
        allTests.push({
          id: att.id,
          quiz: att.lesson_title || "Mock Test",
          percent: percent,
          score: percent,
          band: contentObj.score?.band || att.band,
          timeSpent: att.time_taken_seconds || contentObj.timeSpent || 180,
          date: att.created_at
        });
      }
    });

    const totalTestsCount = allTests.length;

    if (totalTestsCount === 0) {
      return {
        totalTests: 0,
        averageScore: "0.0",
        averageTime: "00:00 mins",
        accuracy: "0%"
      };
    }

    let sumBand = 0;
    let sumPercent = 0;
    let sumTimeSeconds = 0;
    let validCount = 0;

    allTests.forEach((t) => {
      let bandVal = 0;
      let percentVal = 0;

      if (t.band !== undefined && t.band !== null && !isNaN(parseFloat(t.band))) {
        bandVal = parseFloat(t.band);
        percentVal = t.percent !== undefined && !isNaN(parseFloat(t.percent)) ? parseFloat(t.percent) : (bandVal / 9) * 100;
      } else if (t.percent !== undefined && t.percent !== null && !isNaN(parseFloat(t.percent))) {
        percentVal = parseFloat(t.percent);
        if (percentVal >= 90) bandVal = 9.0;
        else if (percentVal >= 85) bandVal = 8.5;
        else if (percentVal >= 80) bandVal = 8.0;
        else if (percentVal >= 75) bandVal = 7.5;
        else if (percentVal >= 70) bandVal = 7.0;
        else if (percentVal >= 65) bandVal = 6.5;
        else if (percentVal >= 60) bandVal = 6.0;
        else if (percentVal >= 50) bandVal = 5.5;
        else if (percentVal >= 40) bandVal = 5.0;
        else if (percentVal > 0) bandVal = Math.round((percentVal / 100) * 9 * 2) / 2;
        else bandVal = 0;
      } else if (t.score !== undefined && t.score !== null && !isNaN(parseFloat(t.score))) {
        const s = parseFloat(t.score);
        if (s <= 9.0) {
          bandVal = s;
          percentVal = (s / 9) * 100;
        } else {
          percentVal = s;
          bandVal = percentVal >= 85 ? 8.5 : percentVal >= 75 ? 7.5 : percentVal >= 65 ? 6.5 : 5.5;
        }
      }

      sumBand += bandVal;
      sumPercent += percentVal;
      validCount++;

      const tSec = Number(t.timeSpent || t.durationSeconds || t.time_taken_seconds || t.duration) || 180;
      sumTimeSeconds += tSec;
    });

    const avgBand = validCount > 0 ? (sumBand / validCount).toFixed(1) : "0.0";
    const avgAccuracy = validCount > 0 ? Math.round(sumPercent / validCount) : 0;
    
    const avgTimeSec = Math.round(sumTimeSeconds / totalTestsCount);
    const mins = Math.floor(avgTimeSec / 60);
    const secs = avgTimeSec % 60;
    const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} mins`;

    return {
      totalTests: totalTestsCount,
      averageScore: avgBand,
      averageTime: formattedTime,
      accuracy: `${avgAccuracy}%`
    };
  }, [quizHistory, mockHistory]);

  useEffect(() => {
    const handleProfileUpdateEvent = () => {
       const lxp = safeGetItemAndParse<any>("student_profile", {}).xp;
       if (lxp && lxp !== xpPoints) setXpPoints(lxp);
       const h = safeGetItemAndParse<any[]>("quiz_history", []);
       setQuizHistory(h);

       // Also check target band in localStorage if updated
       const savedTarget = localStorage.getItem("student_target_band");
       if (savedTarget) {
         const num = parseFloat(savedTarget);
         if (!isNaN(num) && num > 0) setTargetBand(num);
       }
       
       try {
         const saved = localStorage.getItem("completed_lessons");
         if (saved) {
           const parsed = JSON.parse(saved);
           if (Array.isArray(parsed)) {
             setCompletedLessons(parsed);
           }
         }
       } catch (e) {
         console.warn("Error parsing completed_lessons in handler", e);
       }
    };

    window.addEventListener("profile_updated", handleProfileUpdateEvent);
    window.addEventListener("quiz_submitted", handleProfileUpdateEvent);
    window.addEventListener("sebs_test_completed", handleProfileUpdateEvent);
    window.addEventListener("storage", handleProfileUpdateEvent);

    handleProfileUpdateEvent(); // fetch initially
    return () => {
      window.removeEventListener("profile_updated", handleProfileUpdateEvent);
      window.removeEventListener("quiz_submitted", handleProfileUpdateEvent);
      window.removeEventListener("sebs_test_completed", handleProfileUpdateEvent);
      window.removeEventListener("storage", handleProfileUpdateEvent);
    };
  }, [xpPoints]);

  // Sync completed lessons on active tab change to Overview
  useEffect(() => {
    if (activeTab === "overview") {
      try {
        const saved = localStorage.getItem("completed_lessons");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCompletedLessons(parsed);
          }
        }
      } catch (e) {
        console.warn("Error syncing completed lessons on tab change", e);
      }
    }
  }, [activeTab]);

  const handleCheckIn = async () => {
    if (hasCheckedIn) return;
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('checked_in_day', todayStr);
    setHasCheckedIn(true);
    
    const newStreak = streakCount + 1;
    const newXp = xpPoints + 150;
    setStreakCount(newStreak);
    setXpPoints(newXp);
    
    const updated = {
      ...userProfile,
      streak: newStreak,
      xp: newXp
    };
    setUserProfile(updated);
    safeSetItem('student_profile', JSON.stringify(updated));
    
    if (supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase
            .from('profiles')
            .update({ streak: newStreak, xp: newXp })
            .eq('id', authUser.id);
        }
      } catch (e) {
        console.warn("DB syncing streak count failed:", e);
      }
    }
  };

  const handleSimulatePractice = (moduleKey: "writing" | "speaking" | "reading" | "listening") => {
    const currentVal = moduleProgress[moduleKey];
    if (currentVal >= 100) return;
    
    const newVal = Math.min(100, currentVal + 10);
    const updatedProg = {
      ...moduleProgress,
      [moduleKey]: newVal
    };
    setModuleProgress(updatedProg);
    localStorage.setItem('module_progress', JSON.stringify(updatedProg));
    
    if (supabase) {
      (async () => {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            await supabase
              .from('profiles')
              .update({ module_progress: updatedProg })
              .eq('id', authUser.id);
          }
        } catch (e) {}
      })();
    }
    
    // Reward with +120 XP
    const newXp = xpPoints + 120;
    setXpPoints(newXp);
    
    // Also, if not yet checked in, check them in to keep the streak going!
    if (!hasCheckedIn) {
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('checked_in_day', todayStr);
      setHasCheckedIn(true);
      setStreakCount(prev => prev + 1);
    }
    
    const updatedProfile = {
      ...userProfile,
      xp: newXp,
      streak: hasCheckedIn ? streakCount : streakCount + 1
    };
    setUserProfile(updatedProfile);
    safeSetItem('student_profile', JSON.stringify(updatedProfile));
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!supabase) {
        // High fidelity LocalStorage Fallback for static/development previews
        const fallback = safeGetItemAndParse<any>('student_profile', {
              first_name: "John",
              last_name: "Doe",
              streak: 12,
              xp: 2450,
              target_band: 8.0,
              predicted_band: 7.5,
              last_lesson: "Orientation Lecture",
              avatar_url: "",
              exam_type: "Academic"
            });
        setUserProfile(fallback);
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !userProfile) {
          setUserProfile((prev: any) => prev || session.user);
        }
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        
        if (authErr && authErr.message.includes("Auth session missing")) {
          // No active session, use local fallback quietly
          const fallback = safeGetItemAndParse<any>('student_profile', {
                first_name: "John",
                last_name: "Doe",
                streak: 12,
                xp: 2450,
                target_band: 8.0,
                predicted_band: 7.5,
                last_lesson: "Orientation Lecture",
                avatar_url: "",
                exam_type: "Academic"
              });
          setUserProfile(fallback);
          setLoading(false);
          return;
        }

        if (authErr) throw authErr;
        
        if (user) {
          // Fetch or create profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it (fallback if trigger fails)
            const { data: newProfile, error: insErr } = await supabase
              .from('profiles')
              .insert([{ 
                id: user.id, 
                email: user.email, 
                first_name: user.user_metadata.first_name || 'Student',
                last_name: user.user_metadata.last_name || '',
                target_band: 8.0,
                streak: 12,
                xp: 2450,
                predicted_band: 7.5,
                last_lesson: "Orientation Lecture",
                exam_type: "Academic"
              }])
              .select()
              .single();
            if (insErr) throw insErr;
            setUserProfile(newProfile);
          } else if (error) {
            throw error;
          } else {
            setUserProfile(data);
            if (data.current_state?.dashboard_tab) {
              setActiveTab(data.current_state.dashboard_tab);
            }
            if (data.module_progress && Object.keys(data.module_progress).length > 0) {
              setModuleProgress(data.module_progress);
              localStorage.setItem('module_progress', JSON.stringify(data.module_progress));
            }
          }
        }
      } catch (err: any) {
        console.error("Retrieved error during profile load, fallback activated:", err);
        const fallback = localStorage.getItem('student_profile') 
          ? JSON.parse(localStorage.getItem('student_profile')!) 
          : {
              first_name: "John",
              last_name: "Doe",
              streak: 12,
              xp: 2450,
              target_band: 8.0,
              predicted_band: 7.5,
              last_lesson: "Orientation Lecture",
              avatar_url: "",
              exam_type: "Academic"
            };
        setUserProfile(fallback);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();

    if (!supabase) return;

    // Set up real-time subscription
    let channel: any;
    try {
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            if (payload.new && (payload.new as any).id === userProfile?.id) {
              setUserProfile(payload.new);
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Real-time profile subscription bypassed:", e);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn("Real-time channel teardown bypassed:", e);
        }
      }
    };
  }, []);

  // Update edit form values on initial load
  useEffect(() => {
    async function fetchResources() {
      try {
        if (!supabase) {
          const localResources = localStorage.getItem('mock_resources') 
            ? JSON.parse(localStorage.getItem('mock_resources')!) 
            : [
                {
                  id: "default-res-1",
                  name: "Official Band 8 Writing Samples.pdf",
                  type: "PDF",
                  size: "4.2 MB",
                  url: "#",
                  tags: ["Writing", "Band 8", "Official"],
                  created_at: new Date().toISOString()
                },
                {
                  id: "default-res-2",
                  name: "Target Band 7+ IELTS Speaking Strategy Module.mp4",
                  type: "MP4",
                  size: "24.5 MB",
                  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  tags: ["Speaking", "Strategy", "Band 7"],
                  created_at: new Date().toISOString()
                },
                {
                  id: "default-res-3",
                  name: "Academic Vocabulary Wordlist Collocations.docx",
                  type: "DOCX",
                  size: "1.8 MB",
                  url: "#",
                  tags: ["Vocabulary", "Academic", "Collocations"],
                  created_at: new Date().toISOString()
                }
              ];
          if (!localStorage.getItem('mock_resources')) {
            localStorage.setItem('mock_resources', JSON.stringify(localResources));
          }
          setResources(localResources);
          return;
        }
        const { data: r, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const parsed = (r || []).map(resource => ({
          ...resource,
          tags: typeof resource.tags === 'string' ? JSON.parse(resource.tags) : (resource.tags || [])
        }));
        setResources(parsed);
      } catch (err) {
        console.warn("Failed fetching resources database:", err);
      }
    }
    fetchResources();
  }, []);

  // Update edit form values on initial load
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || "");
      setLastName(userProfile.last_name || "");
      setTargetBand(Number(userProfile.target_band) || 8.0);
      setAvatarUrl(userProfile.avatar_url || "");
      setExamType(userProfile.exam_type || "Academic");
      setStreakCount(Number(userProfile.streak) || 12);
      setXpPoints(Number(userProfile.xp) || 2450);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const savedCheckedIn = localStorage.getItem('checked_in_day');
      setHasCheckedIn(savedCheckedIn === todayStr);

      const savedProg = localStorage.getItem('module_progress');
      if (savedProg) {
        setModuleProgress(JSON.parse(savedProg));
      }
    }
  }, [userProfile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Choose an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setAvatarUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.indexOf("image/") === -1) {
        alert("Please drop a valid image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Choose an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setAvatarUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpgradePlan = async (planName: string, price: number, billingCycle: string = "monthly") => {
    if (!userProfile?.id) {
      toast.error("User ID reference is missing. Please sign in again.");
      return;
    }
    setIsUpgradingPlan(true);
    const toastId = toast.loading(`Preparing secure ${planName} checkout session...`);
    try {
      const response = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          price,
          userId: userProfile.id,
          billingCycle
        })
      });
      const data = await response.json();
      if (data.url) {
        toast.dismiss(toastId);
        window.location.href = data.url;
      } else if (data.mode === "fallback" && data.fallbackUrl) {
        toast.success("Redirecting to secure local sandbox upgrade...", { id: toastId });
        window.location.href = data.fallbackUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment gateway checkout", { id: toastId });
      }
    } catch (e: any) {
      toast.error(`Checkout initialization failed: ${e.message}`, { id: toastId });
    } finally {
      setIsUpgradingPlan(false);
    }
  };

  const handleTestBypassUpgrade = async (planName: string) => {
    if (!userProfile?.id) {
      toast.error("User reference is missing.");
      return;
    }
    setIsUpgradingPlan(true);
    const toastId = toast.loading(`Initiating sandbox test payment bypass to allocate ${planName} plan...`);
    try {
      const response = await fetch("/api/payment/test-bypass-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          planName
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Sandbox payment successful! Account upgraded to ${planName}.`, { id: toastId });
        setUserProfile((prev: any) => ({ ...prev, plan: planName }));
      } else {
        toast.error(data.error || "Test payment bypass sandbox failed", { id: toastId });
      }
    } catch (e: any) {
      toast.error(`Bypass connection failed: ${e.message}`, { id: toastId });
    } finally {
      setIsUpgradingPlan(false);
    }
  };

  const handleResetToFree = async () => {
    if (!userProfile?.id) return;
    setIsUpgradingPlan(true);
    const toastId = toast.loading("Resetting subscription membership parameter to Free Trial...");
    try {
      const response = await fetch("/api/payment/test-bypass-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          planName: "Free Trial"
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Subscription reset to standard Free Trial.", { id: toastId });
        setUserProfile((prev: any) => ({ ...prev, plan: "Free Trial" }));
      } else {
        toast.error("Reset failed: " + data.error, { id: toastId });
      }
    } catch (e: any) {
      toast.error("Reset request error: " + e.message, { id: toastId });
    } finally {
      setIsUpgradingPlan(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const triggerCheckout = params.get("trigger_checkout");
    if (triggerCheckout && userProfile?.id) {
      const planName = triggerCheckout === "pro-premium" ? "Pro Premium" : "Mastery Ultimate";
      const price = triggerCheckout === "pro-premium" ? 49 : 129;

      // Clean query parameters from URL safely so we don't recursive trigger
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Open settings tab and trigger checkout
      setActiveTab("settings");
      setTimeout(() => {
        handleUpgradePlan(planName, price);
      }, 800);
    }
  }, [userProfile?.id]);

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    setSuccessMsg("");

    const updatedModel = {
      first_name: firstName,
      last_name: lastName,
      target_band: targetBand,
      avatar_url: avatarUrl,
      exam_type: examType
    };

    if (!supabase) {
      // Local fallback
      const newProf = { ...userProfile, ...updatedModel };
      safeSetItem('student_profile', JSON.stringify(newProf));
      setUserProfile(newProf);
      setSuccessMsg("Profile updated locally successfully!");
      setIsUpdating(false);
      setTimeout(() => {
        setSuccessMsg("");
        setActiveTab("overview");
      }, 1500);
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Could not find user credentials.");

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          target_band: targetBand,
          avatar_url: avatarUrl,
          exam_type: examType
        })
        .eq('id', authUser.id);

      if (error) throw error;

      setUserProfile((prev: any) => ({ ...prev, ...updatedModel }));
      setSuccessMsg("Profile synchronization successful!");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveTab("overview");
      }, 1500);
    } catch (err: any) {
      alert("Failed updating database: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold italic animate-pulse">Syncing your IELTS preparation workspace...</p>
      </div>
    );
  }

  // Registration gate for dashboard
  const isSupabaseDev = !supabase;
  if (!userProfile && !isSupabaseDev) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter uppercase italic leading-none">
          Dashboard <span className="text-primary">Locked</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-12 text-sm font-semibold leading-relaxed">
          The SEB's Institute Student Dashboard is a private study environment reserved for registered scholars. Please log in to access your personalized training metrics.
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

  const user = {
    name: userProfile?.first_name || "Student",
    streak: streakCount,
    xp: xpPoints,
    targetBand: targetBand,
    predictedBand: Number(userProfile?.predicted_band) || 6.5,
    lastLesson: userProfile?.last_lesson || "Orientation"
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-2 flex">
      
      {/* Scrollable Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-80px)] sticky top-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Navigation</p>
          <div className="space-y-1">
            {[
              { id: "overview", name: "Overview", icon: <Layout className="w-4 h-4" /> },
              { id: "classrooms", name: "Classroom Hub", icon: <Users className="w-4 h-4" /> },
              { id: "courses", name: "Courses", icon: <BookOpen className="w-4 h-4" /> },
              { id: "resources", name: "Resources", icon: <FileText className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Training Modules</p>
          <div className="space-y-1">
            {[
              { id: "listening", name: "Listening", icon: <Headphones className="w-4 h-4" /> },
              { id: "reading", name: "Reading", icon: <BookOpen className="w-4 h-4" /> },
              { id: "writing", name: "Writing", icon: <PenTool className="w-4 h-4" /> },
              { id: "speaking", name: "Speaking", icon: <Mic className="w-4 h-4" /> },
              { id: "ai-conversation", name: "AI Conversation", icon: <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> },
            ].map((item) => {
              const isComingSoon = item.id === "ai-conversation";
              return (
                <button
                  key={item.id}
                  id={`sidebar-link-${item.id}`}
                  onClick={() => !isComingSoon && setActiveTab(item.id as any)}
                  disabled={isComingSoon}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isComingSoon
                      ? "opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-500 hover:bg-transparent"
                      : activeTab === item.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {isComingSoon && (
                    <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Interactive Live Rooms</p>
          <div className="space-y-1">
            <button
              id="sidebar-link-google-meet"
              onClick={() => setActiveTab("google-meet")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === "google-meet" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Video className="w-4 h-4 text-teal-400" />
              Google Meet
            </button>
            <button
              id="sidebar-link-embedded-calling"
              onClick={() => setActiveTab("embedded-calling")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === "embedded-calling" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Phone className="w-4 h-4 text-sky-400 animate-pulse" />
              Embedded Calling
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Evaluation</p>
          <div className="space-y-1">
            <Link 
              to="/mock-tests" 
              id="sidebar-link-mock-tests"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Mock Tests
            </Link>
            <button
              id="sidebar-link-settings"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === "settings" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Mobile-only horizontal bar as fallback if on small screen */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 p-2 overflow-x-auto no-scrollbar flex gap-1">
            {[
              { id: "overview", name: "Overview", icon: <Layout className="w-4 h-4" /> },
              { id: "classrooms", name: "Classes", icon: <Users className="w-4 h-4" /> },
              { id: "courses", name: "Courses", icon: <BookOpen className="w-4 h-4" /> },
              { id: "ai-conversation", name: "AI Coach", icon: <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> },
              { id: "writing", name: "Writing", icon: <PenTool className="w-4 h-4" /> },
              { id: "speaking", name: "Speaking", icon: <Mic className="w-4 h-4" /> },
              { id: "settings", name: "Settings", icon: <Settings className="w-4 h-4" /> },
            ].map((item) => {
              const isComingSoon = item.id === "ai-conversation";
              return (
                <button
                  key={item.id}
                  onClick={() => !isComingSoon && setActiveTab(item.id as any)}
                  disabled={isComingSoon}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap relative ${
                    isComingSoon
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : activeTab === item.id 
                        ? "text-primary bg-primary/5" 
                        : "text-slate-500"
                  }`}
                >
                  {item.icon}
                  <span className="flex items-center gap-1">
                    {item.name}
                    {isComingSoon && (
                      <span className="text-[7px] bg-red-600 text-white px-1 rounded font-black uppercase">
                        Soon
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-1 lg:max-w-[calc(100vw-288px)] px-4 sm:px-6 lg:px-12 py-8 pt-6">
        <div className="max-w-[1600px] mx-auto space-y-12">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1 flex-1">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex flex-wrap items-center gap-x-3">
                {activeTab === "overview" ? `Welcome back, ${firstName || user.name}!` : activeTab === "resources" ? "Resource Library" : activeTab === "courses" ? "My Courses" : activeTab === "ai-conversation" ? "AI Conversation Coach" : activeTab === "google-meet" ? "Google Meet Workspace" : activeTab === "embedded-calling" ? "Virtual Live Calling" : activeTab === "classrooms" ? "Classroom Hub" : "Profile Settings"}
                {activeTab === "overview" && (
                  <Badge className={`font-black text-[9px] uppercase tracking-wider border-none ${examType === 'Academic' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {examType} Preparation
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-slate-500 font-medium italic">
                {activeTab === "overview" ? "Your AI Study Curator has updated your learning path." : activeTab === "resources" ? "Browse, filter, and access candidate reference resources uploaded by administrators." : activeTab === "courses" ? "Browse and participate in the official learning tracks." : activeTab === "ai-conversation" ? "Practice real-time spoken English conversation with our responsive AI avatar Clara." : activeTab === "google-meet" ? "Spawn and coordinate live video interaction session codes powered by Google Meet." : activeTab === "embedded-calling" ? "Connect with voice & video features directly in our built-in classroom portal." : activeTab === "classrooms" ? "Access your enrolled cohorts to mark attendance and track history." : "Personalize candidate identity details and target exam metrics."}
              </p>

              {activeTab === "overview" && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl bg-white/50 dark:bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  {[
                    { name: "Writing", val: moduleProgress.writing, color: "bg-amber-500" },
                    { name: "Speaking", val: moduleProgress.speaking, color: "bg-emerald-500" },
                    { name: "Reading", val: moduleProgress.reading, color: "bg-blue-500" },
                    { name: "Listening", val: moduleProgress.listening, color: "bg-indigo-500" },
                  ].map((skill, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{skill.name}</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{skill.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${skill.color} transition-all duration-500`} style={{ width: `${skill.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {activeTab === "settings" ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 animate-in fade-in slide-in-from-bottom duration-200"
            >
              <Card className="border-slate-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Account & Assessment Setup</CardTitle>
                      <p className="text-xs text-slate-400 italic">Adjust candidate target metrics to dynamically realign AI curation.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  
                  {successMsg && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-300 animate-in fade-in zoom-in-95 duration-200">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold leading-relaxed">{successMsg}</span>
                    </div>
                  )}

                  {/* Profile Image Drag and Drop */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Candidate Identity Photo</label>
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragActive 
                          ? "border-primary bg-primary/5 scale-[1.01]" 
                          : "border-slate-200 dark:border-white/10 hover:border-primary/50 bg-slate-50/30 dark:bg-white/1"
                      }`}
                    >
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                      />
                      <label htmlFor="avatar-upload" className="cursor-pointer space-y-3 block">
                        {avatarUrl ? (
                          <div className="relative w-24 h-24 mx-auto rounded-full group/avatar overflow-hidden border-2 border-primary shadow-inner">
                            <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change Profile Picture</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 shadow-sm relative group">
                            <Upload className="w-6 h-6 text-slate-400 dark:text-slate-600 transition-transform group-hover:scale-110" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload raw image or drag it here</p>
                          <p className="text-[10px] text-slate-400 italic">PNG, JPG or GIF, absolute max 5MB size</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Names columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">First Name</label>
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 w-full px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-800 dark:text-white"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 w-full px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-800 dark:text-white"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Target IELTS Band Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Target IELTS Band Score</label>
                    <div className="flex flex-wrap gap-2">
                      {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setTargetBand(score)}
                          className={`h-11 px-4 rounded-xl text-xs font-black transition-all ${
                            targetBand === score 
                              ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {score.toFixed(1)}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Changing your target score will dynamically align your syllabus recommendations.</p>
                  </div>

                  {/* Exam type buttons selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Academic vs. General Focus</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: "Academic", desc: "For higher education credentials & vocational admission certifications" },
                        { id: "General Training", desc: "For immigration guidelines, secondary schooling or employment filters" }
                      ].map((format) => (
                        <button
                          key={format.id}
                          type="button"
                          onClick={() => setExamType(format.id)}
                          className={`p-4 rounded-2xl text-left border transition-all focus:outline-none ${
                            examType === format.id 
                              ? "border-primary bg-primary/5 ring-1 ring-primary" 
                              : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-800"
                          }`}
                        >
                          <div className="font-bold text-sm text-slate-800 dark:text-white">{format.id}</div>
                          <div className="text-xs text-slate-400 mt-1">{format.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                </CardContent>
                <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <span className="text-xs text-slate-400 italic text-center sm:text-left">Click save to synchronize with your core student roadmap.</span>
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("overview")}
                      className="rounded-xl h-11 px-6 font-bold text-xs flex-1 sm:flex-initial"
                      disabled={isUpdating}
                    >
                      Discard
                    </Button>
                    <Button 
                      onClick={handleSaveProfile}
                      className="rounded-xl h-11 px-6 font-bold text-xs shadow-md shadow-primary/10 bg-primary hover:bg-primary/95 text-white flex items-center justify-center space-x-2 flex-1 sm:flex-initial"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Synchronizing...</span>
                        </>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Membership & Plan Subscriptions Card */}
              <Card className="border-slate-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden bg-white dark:bg-slate-900 mt-8">
                <CardHeader className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-indigo-500" />
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Membership & Plan Billing</CardTitle>
                      <p className="text-xs text-slate-400 italic">Configure payment subscriptions, handle secure invoices, and manage candidate tiers.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  {/* Current Active Plan Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/1 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Active Account Tier</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-slate-800 dark:text-white">
                          {userProfile?.plan || "Free Trial"}
                        </span>
                        {(userProfile?.plan === "Pro Premium") ? (
                          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 border-none text-white font-black text-[10px] tracking-wide py-0.5 px-2">
                            ✨ PRO ACTIVE
                          </Badge>
                        ) : (userProfile?.plan === "Mastery Ultimate") ? (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white font-black text-[10px] tracking-wide py-0.5 px-2">
                            🚀 MASTERY ACTIVE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 font-bold text-[10px]">
                            STANDARD TRIAL
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {(userProfile?.plan === "Pro Premium") 
                          ? "Congratulations! You have complete access to writing simulators, instant audio evaluates, and expert syllabus."
                          : (userProfile?.plan === "Mastery Ultimate") 
                            ? "Ultimate level access. Complete premium curriculum plus scheduled personal IELTS instructor feedback slots."
                            : "Standard candidate trial mode. Upgrading to a premium membership unlocks unrestricted AI grading modules."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {userProfile?.plan && userProfile.plan !== "Free Trial" && (
                        <Button 
                          onClick={handleResetToFree}
                          variant="outline"
                          size="sm"
                          className="rounded-xl font-bold text-xs h-10 border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          disabled={isUpgradingPlan}
                        >
                          Downgrade / Reset Plan
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Upgrades grid */}
                  <div className="grid grid-cols-1 max-w-md mx-auto gap-6">
                    {/* Pro Premium Card */}
                    <div className={`p-6 rounded-3xl border transition-all ${
                      userProfile?.plan === "Pro Premium"
                        ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                        : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950"
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge variant="outline" className="border-indigo-300 dark:border-indigo-700 text-indigo-500 font-extrabold text-[9px] uppercase tracking-wide">
                            RECOMMENDED
                          </Badge>
                          <h4 className="text-base font-black text-slate-800 dark:text-white mt-1.5">Pro Premium</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-800 dark:text-white">$49</span>
                          <span className="text-[10px] text-slate-400 font-bold block">per month</span>
                        </div>
                      </div>
                      
                      <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>Unlimited Listening & Reading Mock Assessments</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>Complete AI Evaluation with Instant Score Reports</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>Dynamic Study Curriculum and Tracker</span>
                        </li>
                      </ul>

                      <div className="space-y-2.5">
                        <Button
                          onClick={() => handleUpgradePlan("Pro Premium", 49, "monthly")}
                          disabled={isUpgradingPlan || userProfile?.plan === "Pro Premium"}
                          className="w-full rounded-xl font-bold text-xs h-11 bg-indigo-600 hover:bg-indigo-550 text-white"
                        >
                          {userProfile?.plan === "Pro Premium" ? "Active Plan" : "Upgrade with Stripe"}
                        </Button>
                        <Button
                          onClick={() => handleTestBypassUpgrade("Pro Premium")}
                          variant="secondary"
                          disabled={isUpgradingPlan || userProfile?.plan === "Pro Premium"}
                          className="w-full rounded-xl font-bold text-xs h-11 border border-slate-200 dark:border-white/10"
                        >
                          Test Sandbox Bypass (Instant)
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : activeTab === "resources" ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 animate-in fade-in duration-200"
            >
              {/* Filter Row */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Search materials, exam tasks or keywords..."
                    className="pl-10 h-12 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-800 dark:text-white"
                    value={resourcesFilter}
                    onChange={(e) => setResourcesFilter(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {["All", "Writing", "Reading", "Listening", "Speaking", "Vocabulary", "Official"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs h-10 transition-all ${
                        selectedTag === tag
                          ? "bg-primary text-white shadow-md shadow-primary/10"
                          : "bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/60 dark:border-white/10"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources
                  .filter((res) => {
                    const matchesSearch = res.name?.toLowerCase().includes(resourcesFilter.toLowerCase());
                    const matchesTag = selectedTag === "All" || (res.tags || []).some((t: string) => t.toLowerCase() === selectedTag.toLowerCase());
                    return matchesSearch && matchesTag;
                  })
                  .map((res) => (
                    <Card key={res.id} className="rounded-3xl border border-slate-200/70 dark:border-white/15 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10">
                            {["PNG", "JPG", "JPEG"].includes(res.type?.toUpperCase()) ? (
                              <ImageIcon className="w-6 h-6 text-indigo-500" />
                            ) : ["MP4", "MOV", "VIDEO", "MP3"].includes(res.type?.toUpperCase()) ? (
                              <Film className="w-6 h-6 text-orange-500" />
                            ) : (
                              <FileText className="w-6 h-6 text-indigo-500" />
                            )}
                          </div>
                          <Badge variant="secondary" className="bg-slate-50 dark:bg-white/5 border-none font-extrabold text-[10px] tracking-widest text-slate-400">
                            {res.size?.toUpperCase() || "ASSET DATA"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2">
                            {res.name}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            {(res.tags || []).map((tag: string, tidx: number) => (
                              <Badge key={tidx} variant="outline" className="text-[8px] h-4.5 font-bold uppercase italic rounded border border-slate-200 dark:border-white/10 text-slate-400">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5 flex justify-end gap-2">
                        {res.url && res.url !== "#" ? (
                          <Button 
                            className="rounded-xl w-full h-10 font-bold text-xs flex items-center justify-center gap-1 bg-primary text-white"
                            onClick={() => window.open(res.url, "_blank")}
                          >
                            <span>Access Asset</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button 
                            className="rounded-xl w-full h-10 font-bold text-xs flex items-center justify-center gap-1 select-none"
                            variant="secondary"
                            onClick={() => alert("This premium course document is synced to your candidate session locally.")}
                          >
                            <span>Static Review Mode</span>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </Card>
                ))}
                
                {resources.filter((res) => {
                  const matchesSearch = res.name?.toLowerCase().includes(resourcesFilter.toLowerCase());
                  const matchesTag = selectedTag === "All" || (res.tags || []).some((t: string) => t.toLowerCase() === selectedTag.toLowerCase());
                  return matchesSearch && matchesTag;
                }).length === 0 && (
                  <div className="col-span-1 md:col-span-3 py-20 text-center">
                    <Card className="border-dashed p-10 bg-slate-50/30 dark:bg-white/5">
                      <CardContent className="flex flex-col items-center justify-center space-y-4">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <h3 className="text-base font-black italic text-slate-800 dark:text-white">No Study Materials Match</h3>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Adjust your dynamic filters or keywords search query to view matching materials.</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </motion.div>
          ) : ["courses", "reading", "listening", "writing", "speaking"].includes(activeTab) ? (
            <div 
              key={activeTab}
              className="animate-in fade-in duration-200"
            >
               <StudentCourses 
                 isDashboardMode={true} 
                 initialFilter={activeTab === "courses" ? undefined : activeTab} 
                 userPlan={userProfile?.plan || "Free Trial"}
                 onTriggerUpgrade={(planName, price) => handleUpgradePlan(planName, price)}
               />
            </div>
          ) : activeTab === "writing-simulator" || activeTab === "speaking-simulator" ? (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.2 }}
               className="animate-in fade-in duration-300"
             >
                <WritingModule initialType={activeTab === "speaking-simulator" ? "speaking" : "writing"} />
             </motion.div>
          ) : activeTab === "ai-conversation" ? (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
               className="animate-in fade-in duration-300"
             >
                <AIConversationCoach />
             </motion.div>
          ) : activeTab === "google-meet" ? (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
               className="animate-in fade-in duration-300"
             >
                <GoogleMeetManager />
             </motion.div>
          ) : activeTab === "embedded-calling" ? (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
               className="animate-in fade-in duration-300"
             >
                <EmbeddedCallManager />
             </motion.div>
          ) : activeTab === "classrooms" ? (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
               className="animate-in fade-in duration-300"
             >
                <StudentClassroomHub />
             </motion.div>
          ) : (
            <>
              {/* My Test Performance Metrics Section */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] dark:text-slate-100 tracking-tight">
                  My Test Performance
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {/* Card 1: Target Score */}
                  <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between items-center text-center relative shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all min-h-[140px]">
                    <button 
                      onClick={() => {
                        setTempTargetBand(targetBand.toString());
                        setIsTargetModalOpen(true);
                      }}
                      className="absolute top-3 right-3 text-xs font-semibold text-sky-500 hover:text-sky-600 underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 mt-1">
                      <Target className="w-6 h-6 text-[#1e293b] dark:text-sky-400 stroke-[1.75]" />
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                      Target Score
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] dark:text-white mt-1.5 tracking-tight">
                      {targetBand ? Number(targetBand).toFixed(1) : "6.5"}
                    </div>
                  </Card>

                  {/* Card 2: Average Score */}
                  <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between items-center text-center relative shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all min-h-[140px]">
                    <DashboardTooltip content="Real-time average band score across all completed test attempts">
                      <div className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    </DashboardTooltip>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 mt-1">
                      <TrendingUp className="w-6 h-6 text-[#1e293b] dark:text-sky-400 stroke-[1.75]" />
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                      Average Score
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] dark:text-white mt-1.5 tracking-tight">
                      {performanceMetrics.averageScore}
                    </div>
                  </Card>

                  {/* Card 3: Total Tests Taken */}
                  <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between items-center text-center relative shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all min-h-[140px]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 mt-1">
                      <FileText className="w-6 h-6 text-[#1e293b] dark:text-sky-400 stroke-[1.75]" />
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                      Total Tests Taken
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] dark:text-white mt-1.5 tracking-tight">
                      {performanceMetrics.totalTests}
                    </div>
                  </Card>

                  {/* Card 4: Average Time */}
                  <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between items-center text-center relative shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all min-h-[140px]">
                    <DashboardTooltip content="Average duration spent per completed test attempt">
                      <div className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    </DashboardTooltip>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 mt-1">
                      <Clock className="w-6 h-6 text-[#1e293b] dark:text-sky-400 stroke-[1.75]" />
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                      Average Time
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] dark:text-white mt-1.5 tracking-tight">
                      {performanceMetrics.averageTime}
                    </div>
                  </Card>

                  {/* Card 5: Accuracy */}
                  <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between items-center text-center relative shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all min-h-[140px]">
                    <DashboardTooltip content="Real-time accuracy percentage across all attempted test questions">
                      <div className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    </DashboardTooltip>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 mt-1">
                      <Target className="w-6 h-6 text-[#1e293b] dark:text-sky-400 stroke-[1.75]" />
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                      Accuracy
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] dark:text-white mt-1.5 tracking-tight">
                      {performanceMetrics.accuracy}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Target Band Edit Modal */}
              {isTargetModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-sky-500" />
                        Edit Target Score
                      </h3>
                      <button onClick={() => setIsTargetModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Target Band Score (1.0 - 9.0)
                      </label>
                      <input 
                        type="number"
                        step="0.5"
                        min="1.0"
                        max="9.0"
                        value={tempTargetBand}
                        onChange={(e) => setTempTargetBand(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsTargetModalOpen(false)} className="flex-1 rounded-xl">
                        Cancel
                      </Button>
                      <Button 
                        onClick={async () => {
                          const num = parseFloat(tempTargetBand);
                          if (!isNaN(num) && num >= 1 && num <= 9) {
                            setTargetBand(num);
                            localStorage.setItem("student_target_band", num.toString());

                            const updatedProf = { ...(userProfile || {}), target_band: num };
                            setUserProfile(updatedProf);
                            safeSetItem("student_profile", JSON.stringify(updatedProf));

                            if (supabase) {
                              try {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (user) {
                                  await supabase
                                    .from("profiles")
                                    .update({ target_band: num })
                                    .eq("id", user.id);
                                }
                              } catch (e) {
                                console.warn("Failed to sync target band to database:", e);
                              }
                            }

                            window.dispatchEvent(new Event("profile_updated"));
                            toast.success(`Target score updated to Band ${num.toFixed(1)}`);
                          } else {
                            toast.error("Please enter a valid band score between 1.0 and 9.0");
                          }
                          setIsTargetModalOpen(false);
                        }}
                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}



              {/* Visual Calendar Class Schedule Grid */}
              <div className="pt-2">
                <VisualCalendar />
              </div>

              {/* Analytics Section */}
              <div className="w-full">
                 <Card className="rounded-[2rem] border-none bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                           <BarChart3 className="w-5 h-5" />
                         </div>
                         <div>
                           <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-none">Mock Exam Trends</h3>
                           <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider block">Official grading performance over time</span>
                         </div>
                       </div>
                       <Badge className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 font-black text-[9px] uppercase tracking-wide border-none shadow-none">
                         IELTS Metrics
                       </Badge>
                     </div>
                   </div>

                   <div className="h-[260px] w-full pt-6">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={mockChartData} margin={{ left: -15, right: 10 }}>
                         <defs>
                           <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                         <XAxis 
                           dataKey="date" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                           dy={10}
                         />
                         <YAxis 
                           domain={[0, 100]} 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                           width={30}
                         />
                         <Tooltip content={<MockTestTooltip />} cursor={{ stroke: 'rgba(99, 102, 241, 0.15)', strokeWidth: 2 }} />
                         <Area 
                           type="monotone" 
                           dataKey="score" 
                           stroke="#6366f1" 
                           strokeWidth={4} 
                           fillOpacity={1} 
                           fill="url(#colorScore)"
                           animationDuration={1500}
                           animationEasing="ease-in-out"
                           activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                         />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>
              </div>

              {/* Modules Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary">Your Practice Modules</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: "Writing", icon: <PenTool className="w-6 h-6" />, path: "/dashboard/writing", color: "text-amber-600 bg-amber-50 border-amber-100", score: 6.5, tooltip: "Grade essays under genuine testing constraints" },
                    { title: "Speaking", icon: <Mic className="w-6 h-6" />, path: "/dashboard/speaking", color: "text-emerald-600 bg-emerald-50 border-emerald-100", score: 7.0, tooltip: "Test vocal coherency with recorded prompts" },
                    { title: "Reading", icon: <BookOpen className="w-6 h-6" />, path: "/dashboard/reading", color: "text-blue-600 bg-blue-50 border-blue-100", score: 8.0, tooltip: "Practice timeline tracking inside articles" },
                    { title: "Listening", icon: <Headphones className="w-6 h-6" />, path: "/dashboard/listening", color: "text-indigo-600 bg-indigo-50 border-indigo-100", score: 7.5, tooltip: "Answer dynamic multiple speaker audio layouts" },
                  ].map((module, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }}>
                      <DashboardTooltip content={module.tooltip}>
                        <Link to={module.path}>
                          <Card className="border-2 hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${module.color} border`}>
                                  {module.icon}
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 italic">Score</div>
                                  <div className="text-2xl font-bold text-primary">{module.score}</div>
                                </div>
                              </div>
                              <h3 className="text-lg font-bold mb-1">{module.title}</h3>
                              <div className="flex items-center text-sm text-muted-foreground font-medium">
                                Continue Lesson <ChevronRight className="w-4 h-4 ml-1" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </DashboardTooltip>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Student Progress & Achievements */}
              <div className="space-y-6">
                <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  Student <span className="text-primary">Progress</span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Course Completion Card */}
                  <Card className="rounded-[2.5rem] border-slate-200/60 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Target className="w-24 h-24 text-primary" />
                    </div>
                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black uppercase italic tracking-tight">Course Completion</CardTitle>
                          <p className="text-xs font-bold text-slate-500 uppercase">Overall Academic Progress</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">68<span className="text-2xl text-slate-400">%</span></div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400">On Track</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span>17 / 25 Modules Completed</span>
                          <span>Band {targetBand} Target</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full" style={{ width: '68%' }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Achievements Badge System */}
                  <Card className="rounded-[2.5rem] border-slate-200/60 dark:border-white/5 shadow-xl bg-slate-900 dark:bg-black text-white overflow-hidden relative">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-400" fill="currentColor" /> Achievements
                          </CardTitle>
                          <p className="text-xs font-bold text-slate-400 uppercase">Milestones & Stars</p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-amber-400 tracking-tighter">{xpPoints}</span>
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">Total XP</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                        {/* Earned Badges */}
                        {[
                          { title: "Writing Master", icon: <PenTool className="w-5 h-5" />, color: "text-amber-300", bg: "bg-amber-500/20", borderColor: "border-amber-500/30", date: "Sep 12" },
                          { title: "Perfect Quiz", icon: <Zap className="w-5 h-5 text-emerald-300" fill="currentColor" />, color: "text-emerald-300", bg: "bg-emerald-500/20", borderColor: "border-emerald-500/30", date: "Oct 04" },
                          { title: "7 Day Streak", icon: <Flame className="w-5 h-5" />, color: "text-rose-300", bg: "bg-rose-500/20", borderColor: "border-rose-500/30", date: "Oct 18" },
                          { title: "Speaking Pro", icon: <Mic className="w-5 h-5" />, color: "text-indigo-300", bg: "bg-indigo-500/20", borderColor: "border-indigo-500/30", date: "Nov 02" },
                          { title: "Grammar Star", icon: <BookOpen className="w-5 h-5" />, color: "text-blue-300", bg: "bg-blue-500/20", borderColor: "border-blue-500/30", date: "Locked", locked: true }
                        ].map((badge, idx) => (
                          <div key={idx} className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border ${badge.locked ? 'border-white/5 bg-white/5 opacity-50 grayscale' : `${badge.borderColor} ${badge.bg}`} w-24 aspect-[4/5] relative group transition-all hover:scale-105`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.locked ? 'bg-white/10 text-slate-500' : 'bg-white/10 ' + badge.color} mb-3`}>
                              {badge.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase text-center leading-tight mb-1">{badge.title}</span>
                            <span className="text-[8px] font-bold text-slate-400">{badge.date}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Daily Tasks & Recent Results */}
              <div className="w-full pb-12">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{quizHistory.length > 0 ? "Recent Quiz Results" : "Daily Study Plan"}</CardTitle>
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-none font-bold text-[10px]">
                        {quizHistory.length > 0 ? "History" : <><Sparkles className="w-3 h-3 mr-1" /> AI Generated</>}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {quizHistory.length > 0 ? (
                          quizHistory.map((quiz, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-800 dark:text-white line-clamp-1">{quiz.quiz}</div>
                                <div className="text-xs text-slate-500 font-medium italic">{quiz.course} - {quiz.module}</div>
                              </div>
                              <div className="flex items-center space-x-4 shrink-0">
                                <div className="text-right">
                                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Score</div>
                                  <div className={`font-black text-lg ${quiz.percent >= 80 ? 'text-emerald-500' : quiz.percent >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {quiz.percent}%
                                  </div>
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                  {new Date(quiz.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          [
                            { time: "09:00 AM", task: "Complete Academic Reading Test 4", tag: "Reading", xp: 150, locked: false },
                            { time: "11:30 AM", task: "Analyze Writing Task 2 Lexical Range", tag: "Writing", xp: 100, locked: false },
                            { time: "02:00 PM", task: "Speaking Part 2:Cue Card Practice", tag: "Speaking", xp: 200, locked: false },
                            { time: "04:30 PM", task: "Idiomatic Expressions Vocabulary", tag: "Vocabulary", xp: 50, locked: true },
                            { time: "06:00 PM", task: "Full Mock Test Review", tag: "Review", xp: 300, locked: true },
                          ].map((task, i) => (
                            <div key={i} className="flex gap-4 group">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${task.locked ? 'bg-slate-200 dark:bg-slate-800' : 'bg-primary'} ring-4 ring-background`} />
                                <div className="w-0.5 h-full bg-slate-200 dark:bg-white/10 my-1" />
                              </div>
                              <div className={`flex-1 pb-6 ${task.locked ? 'opacity-50' : 'opacity-100'}`}>
                                <div className="text-xs font-bold text-primary italic mb-1 uppercase tracking-tighter">{task.time}</div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:bg-primary/5 transition-colors">
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-800 dark:text-white">{task.task}</div>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{task.tag}</Badge>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-bold text-slate-500 italic">+{task.xp} XP</span>
                                    <Button size="sm" variant={task.locked ? "secondary" : "default"}>
                                      {task.locked ? "Locked" : "Start"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
