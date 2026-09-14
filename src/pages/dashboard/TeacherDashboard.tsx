import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, BookOpen, CheckCircle2, Video, Plus, Search, GraduationCap, 
  Sparkles, Clock, BarChart3, ArrowRight, FileText, Mic, Award, 
  Calendar, Check, Trash2, ExternalLink, MessageSquare, Send, 
  TrendingUp, Copy, Sliders, Activity, Mail, CheckCheck,
  ClipboardList, Library, Layout, Puzzle, Settings, LogOut, ChevronRight
} from "lucide-react";

// New Teacher Sub-Components
import TeacherAttendance from "../../components/teacher/TeacherAttendance";
import TeacherResourceLibrary from "../../components/teacher/TeacherResourceLibrary";
import TeacherQuizWorkshop from "../../components/teacher/TeacherQuizWorkshop";
import TeacherCourseDesigner from "../../components/teacher/TeacherCourseDesigner";
import AdminLiveMeetings from "../../components/admin/AdminLiveMeetings";
import { useMeetings } from "../../context/MeetingsContext";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

// Initial Core Static Mocks for the Teacher Command Environment
const INITAL_MOCK_SUBMISSIONS = [
  {
    id: "sub-1",
    student_name: "Aisha Ahmed",
    student_email: "aisha.ahmed@example.com",
    course_title: "IELTS Mastery Ultimate",
    lesson_title: "Writing Task 2: Technology & Society",
    lesson_type: "WRITING",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    response_text: "In the contemporary era, the development of computer science has fundamentally altered personal communications. Some individuals argue that this trend leads to isolation. In my opinion, technological progression actually bridges long-distance families, though caution should be maintained regarding social media addictive structures.",
    status: "pending",
    grade_feedback: null,
    score: null,
    rubric_scores: { task_achievement: 0, coherence: 0, lexical: 0, grammar: 0 }
  },
  {
    id: "sub-2",
    student_name: "Sajid Khan",
    student_email: "sajid.khan@example.com",
    course_title: "Spoken English Premium",
    lesson_title: "Speaking Cue Card: Describing a Memorable Travel",
    lesson_type: "SPEAKING",
    created_at: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
    response_text: "Our journey to Hunza Valley was exceptionally spectacular. The gigantic snowpeaks of Rakaposhi mountains felt closely nearby. I spoke with native villagers about their standard agrarian lifestyle...",
    voice_audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    status: "pending",
    grade_feedback: null,
    score: null,
    rubric_scores: { task_achievement: 0, coherence: 0, lexical: 0, grammar: 0 }
  }
];

const INITIAL_STUDENT_ROSTER = [
  { id: "st-1", name: "Aisha Ahmed", email: "aisha.ahmed@example.com", target_band: "8.5", active_streak: 8, xp: 1820, country: "Pakistan", level: "Advanced IELTS", completed_homeworks: 14, average_score: 8.0, performance_status: "High Performer" },
  { id: "st-2", name: "Sajid Khan", email: "sajid.khan@example.com", target_band: "7.5", active_streak: 15, xp: 2950, country: "Pakistan", level: "Spoken English", completed_homeworks: 9, average_score: 7.2, performance_status: "Performing Normal" },
  { id: "st-3", name: "Maria Benson", email: "maria.b@example.com", target_band: "8.0", active_streak: 22, xp: 4890, country: "United Kingdom", level: "Advanced Academic IELTS", completed_homeworks: 18, average_score: 7.8, performance_status: "High Performer" },
  { id: "st-4", name: "Kamran Shah", email: "kamran.shah@example.com", target_band: "7.0", active_streak: 0, xp: 450, country: "Pakistan", level: "IELTS Free Trial", completed_homeworks: 2, average_score: 6.0, performance_status: "Needs Immediate Attention" }
];

const INITIAL_LIVE_SLOTS = [
  { id: "slot-1", class_title: "Direct Speaking Crackdowns & Cue Patterns", date: "2026-06-20", start_time: "18:00", end_time: "19:30", capacity: 15, course_level: "Advanced IELTS", status: "Active", enrolled_count: 8, join_url: "https://meet.google.com/abc-defg-hij" },
  { id: "slot-2", class_title: "Writing Task 2 Coherence & Grammatical Range", date: "2026-06-22", start_time: "16:00", end_time: "17:30", capacity: 12, course_level: "Pro IELTS Core", status: "Active", enrolled_count: 11, join_url: "https://meet.google.com/xyz-uvwx-yz" },
  { id: "slot-3", class_title: "Scoring Revision & Confidence Boost Mocks", date: "2026-06-25", start_time: "19:00", end_time: "20:30", capacity: 25, course_level: "Spoken English", status: "Active", enrolled_count: 5, join_url: "https://meet.google.com/mnp-qrst-uvw" }
];

const INITIAL_MESSAGES = [
  { id: "msg-1", student_id: "st-1", sender: "student", student_name: "Aisha Ahmed", text: "Assalam u Alaikum Sir Bukhari, I finished editing my compound clauses in yesterday's assignment. Is it worthy of band 8.5?", timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: "msg-2", student_id: "st-1", sender: "teacher", student_name: "Aisha Ahmed", text: "Walaikum Assalam Aisha. Yes, I inspected your response. It has brilliant vocabulary markers. Watch out for repetitive prepositions.", timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: "msg-3", student_id: "st-2", sender: "student", student_name: "Sajid Khan", text: "Sir, could you review my cue card delivery speed? I felt a bit out of breath during yesterday's spoken mock test.", timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
];

export default function TeacherDashboard() {
  const { meetings } = useMeetings();

  const activeMeetings = useMemo(() => {
    const now = new Date();
    return meetings.filter(m => {
      const endTime = new Date(new Date(m.scheduled_start).getTime() + (m.duration_minutes || 45) * 60000);
      return endTime >= now;
    }).sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
  }, [meetings]);

  const [activeTab, setActiveTab] = useState("overview");
  
  // Dashboard Core States
  const [submissions, setSubmissions] = useState<any[]>(() => {
    const saved = localStorage.getItem("teacher_submissions");
    return saved ? JSON.parse(saved) : INITAL_MOCK_SUBMISSIONS;
  });
  
  const [students, setStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem("teacher_students");
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_ROSTER;
  });

  const [liveSessionSlots, setLiveSessionSlots] = useState<any[]>(() => {
    const saved = localStorage.getItem("teacher_live_session_slots");
    return saved ? JSON.parse(saved) : INITIAL_LIVE_SLOTS;
  });

  const [privateMessages, setPrivateMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem("teacher_private_messages");
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [selectedChatStudent, setSelectedChatStudent] = useState<string>("st-1");
  const [newMessageText, setNewMessageText] = useState("");
  const [isTypingSim, setIsTypingSim] = useState(false);

  // New Live Session Form State
  const [newSlotTitle, setNewSlotTitle] = useState("");
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("");
  const [newSlotEnd, setNewSlotEnd] = useState("");
  const [newSlotCapacity, setNewSlotCapacity] = useState(15);
  const [newSlotLevel, setNewSlotLevel] = useState("Advanced IELTS");
  const [newSlotUrl, setNewSlotUrl] = useState("");

  // Grading states
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(7.5);
  const [feedbackRemarks, setFeedbackRemarks] = useState("");
  const [rubricScores, setRubricScores] = useState({ task_achievement: 7.5, coherence: 7.5, lexical: 7.5, grammar: 7.5 });
  const [isAiGrading, setIsAiGrading] = useState(false);

  // Student list search term
  const [studentSearch, setStudentSearch] = useState("");

  // Sidebar Broadcaster state
  const [sidebarAnnouncement, setSidebarAnnouncement] = useState("");

  // Sync state mutations cleanly to localStorage
  useEffect(() => {
    localStorage.setItem("teacher_submissions", JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem("teacher_students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("teacher_live_session_slots", JSON.stringify(liveSessionSlots));
  }, [liveSessionSlots]);

  useEffect(() => {
    localStorage.setItem("teacher_private_messages", JSON.stringify(privateMessages));
  }, [privateMessages]);

  // Create slot handler
  const handleCreateLiveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTitle || !newSlotDate || !newSlotStart || !newSlotEnd) {
      toast.error("Please fill out all required session details");
      return;
    }

    const randomID = `meet-${Math.random().toString(36).substring(2, 7)}`;
    const slot = {
      id: `slot-${Date.now()}`,
      class_title: newSlotTitle,
      date: newSlotDate,
      start_time: newSlotStart,
      end_time: newSlotEnd,
      capacity: Number(newSlotCapacity) || 15,
      course_level: newSlotLevel,
      status: "Active",
      enrolled_count: 0,
      join_url: newSlotUrl || `https://meet.google.com/${randomID}`
    };

    setLiveSessionSlots([slot, ...liveSessionSlots]);
    setNewSlotTitle("");
    setNewSlotDate("");
    setNewSlotStart("");
    setNewSlotEnd("");
    setNewSlotUrl("");
    toast.success("Live IELTS Preparation Slot Created!", {
      description: `Class scheduled for ${newSlotDate} at ${newSlotStart}.`
    });
  };

  // Grade publisher
  const handlePublishGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    const avgRubric = Number(((rubricScores.task_achievement + rubricScores.coherence + rubricScores.lexical + rubricScores.grammar) / 4).toFixed(1));
    const finalScore = gradeScore || avgRubric || 7.5;

    const updated = submissions.map(sub => {
      if (sub.id === selectedSub.id) {
        return {
          ...sub,
          status: "graded",
          score: finalScore,
          rubric_scores: { ...rubricScores },
          grade_feedback: feedbackRemarks,
          graded_at: new Date().toISOString()
        };
      }
      return sub;
    });

    setSubmissions(updated);
    toast.success("Linguistic Grade Published!", {
      description: `Sent physical diagnostic report back to ${selectedSub.student_name}.`
    });

    // Award XP and complete homework count
    const updatedSt = students.map(st => {
      if (st.email === selectedSub.student_email) {
        return {
          ...st,
          xp: st.xp + 150,
          completed_homeworks: st.completed_homeworks + 1,
          average_score: Number(((st.average_score * st.completed_homeworks + finalScore) / (st.completed_homeworks + 1)).toFixed(2))
        };
      }
      return st;
    });
    setStudents(updatedSt);

    setSelectedSub(null);
    setFeedbackRemarks("");
  };

  // AI assessment trigger
  const handleAiEvaluation = () => {
    setIsAiGrading(true);
    setTimeout(() => {
      const isSpeaking = selectedSub?.lesson_type === "SPEAKING";
      const taskResponse = 7.5;
      const coh = 8.0;
      const lex = 7.5;
      const gram = 8.0;
      setRubricScores({ task_achievement: taskResponse, coherence: coh, lexical: lex, grammar: gram });
      setGradeScore(7.7);
      setFeedbackRemarks(`[Syed Ejaz Bukhari Language Assessment Center - AI Assist Evaluation]\n\n🏆 BAND APPRAISAL: Band 7.7\n\n1. Coherence & Flow: The response demonstrates robust, balanced argumentation. The candidate connects key ideas smoothly using high-fidelity transition links.\n2. Grammar Constraints: Fantastic layout of active complex clauses. Try substituting 2 passives for dynamic voice to unlock Band 8.5.\n\n📚 Recommended Prep: Complete our Lexical Booster Module page.`);
      setIsAiGrading(false);
      toast.success("AI Evaluation Complete!");
    }, 1200);
  };

  // Chat message sender
  const handleSendPrivateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const activeStObj = students.find(s => s.id === selectedChatStudent);
    const newMsg = {
      id: `msg-${Date.now()}`,
      student_id: selectedChatStudent,
      sender: "teacher",
      student_name: activeStObj?.name || "Aisha Ahmed",
      text: newMessageText,
      timestamp: new Date().toISOString()
    };

    setPrivateMessages(prev => [...prev, newMsg]);
    setNewMessageText("");
    toast.success("Message Transmitted Securely", { description: `Linguistic advice shared to ${activeStObj?.name}.` });

    // Generate responsive feedback simulation
    setIsTypingSim(true);
    setTimeout(() => {
      setIsTypingSim(false);
      const responsesMocks = [
        "Thank you so much Sir Ejaz! That feedback explains my lexical hesitation precisely. I am practicing our formula sheets now.",
        "Understood, respected instructor. I will modify my speaking intonation templates for the live session tomorrow.",
        "Superb explanation, Sir! I will print the Band 9.0 vocabulary booster document. See you during speaking simulations!"
      ];
      const randomReply = responsesMocks[Math.floor(Math.random() * responsesMocks.length)];
      const studentMsg = {
        id: `msg-${Date.now() + 1}`,
        student_id: selectedChatStudent,
        sender: "student",
        student_name: activeStObj?.name || "Aisha Ahmed",
        text: randomReply,
        timestamp: new Date().toISOString()
      };
      setPrivateMessages(prev => [...prev, studentMsg]);
    }, 1800);
  };

  // Announcement trigger via fast actions
  const handleSidebarAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarAnnouncement.trim()) return;
    toast.success("Academy Broadcast Shared Successfully!", {
      description: sidebarAnnouncement
    });
    setSidebarAnnouncement("");
  };

  // Derived Analytics Data metrics
  const activeStudentObj = students.find(s => s.id === selectedChatStudent) || students[0];
  const totalSubmissionsGraded = submissions.filter(s => s.status === "graded").length;
  const averageAccuracyKPI = Number((students.reduce((acc, current) => acc + current.average_score, 0) / students.length).toFixed(2));

  // Chart data definitions
  const trendData = [
    { name: "Week 1", "Class Average Band": 6.8, "Aisha Ahmed": 7.0 },
    { name: "Week 2", "Class Average Band": 7.1, "Aisha Ahmed": 7.5 },
    { name: "Week 3", "Class Average Band": 7.3, "Aisha Ahmed": 7.8 },
    { name: "Week 4", "Class Average Band": 7.5, "Aisha Ahmed": 8.0 },
    { name: "Week 5", "Class Average Band": 7.8, "Aisha Ahmed": 8.5 }
  ];

  const criteriaData = [
    { criteria: "Task Response", score: 7.6 },
    { criteria: "Coherence", score: 7.9 },
    { criteria: "Lexical Resources", score: 7.5 },
    { criteria: "Grammar Accuracy", score: 7.2 }
  ];

  return (
    <div className="min-h-screen pt-8 pb-16 bg-slate-50 dark:bg-slate-950 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Block Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-100 dark:bg-emerald-950/50 text-emerald-650 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                ⭐ Senior Faculty Command
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">SEB's Inst. Private Suite</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-3">
              Teacher <span className="text-emerald-650 dark:text-emerald-400">Control Center</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-450 font-medium max-w-xl">
              Conduct grading tasks, scheduler workshops, host dynamic feedback chats, and trace comprehensive candidate analytics.
            </p>
          </div>
          
          <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 font-mono text-xs flex gap-4">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-black">Local Server Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">2026-06-18</span>
            </div>
            <div className="border-l border-slate-200 dark:border-white/10" />
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-black">Primary Instructor</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Syed Ejaz Bukhari</span>
            </div>
          </div>
        </div>

        {/* Dynamic Executive Stats Indicator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Active Cohort Candidates", count: students.length, icon: <Users className="w-5 h-5 text-emerald-500" />, detail: "4 regional centers", color: "border-emerald-500" },
            { label: "Queue Submissions", count: submissions.filter(s => s.status === 'pending').length, icon: <FileText className="w-5 h-5 text-indigo-500 animate-pulse" />, detail: "Needs diagnostic checks", color: "border-indigo-505" },
            { label: "Scheduled Live Seminars", count: liveSessionSlots.filter(s => s.status === "Active").length, icon: <Video className="w-5 h-5 text-rose-500" />, detail: "Zoom & Google Meet slots", color: "border-rose-500" },
            { label: "Linguistic Mean Scale", count: `Band ${averageAccuracyKPI}`, icon: <TrendingUp className="w-5 h-5 text-amber-500" />, detail: "IELTS standard targets", color: "border-amber-500" }
          ].map((stat, i) => (
            <Card key={i} className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl relative overflow-hidden shadow-sm">
              <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${stat.color === 'border-emerald-500' ? 'bg-emerald-500' : stat.color === 'border-rose-500' ? 'bg-rose-500' : stat.color === 'border-indigo-505' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{stat.label}</span>
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl">{stat.icon}</div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                  {stat.count}
                </div>
                <p className="text-[10.5px] italic text-slate-450 mt-1 font-semibold">● {stat.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Master Double-Column Workspace (3/4 main workspace, 1/4 Quick Actions Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT AREA: Interactive Core Workspace Tabs (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl flex flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Overview</TabsTrigger>
                <TabsTrigger value="grader" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Grader workshop ({submissions.filter(s => s.status === 'pending').length})</TabsTrigger>
                <TabsTrigger value="live-meetings" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Meetings</TabsTrigger>
                <TabsTrigger value="attendance" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Classes & Attendance</TabsTrigger>
                <TabsTrigger value="course-designer" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Course Architect</TabsTrigger>
                <TabsTrigger value="quiz-workshop" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Quiz Workshop</TabsTrigger>
                <TabsTrigger value="resources" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Resource Library</TabsTrigger>
                <TabsTrigger value="messaging" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Direct Feedback</TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer transition-all">Analytics</TabsTrigger>
              </TabsList>

              {/* NEW TABS - Modular Components Integrated */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl p-6 text-left shadow-sm">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white mb-4">Classroom Vitality Summary</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase text-emerald-600">Upcoming Live Focus</span>
                          <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">NEXT SESSION</Badge>
                        </div>
                        {activeMeetings.length > 0 ? (
                          <>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeMeetings[0].title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-slate-500 font-bold">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(activeMeetings[0].scheduled_start).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Scheduled</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No live sessions currently prioritized.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-black uppercase text-indigo-500 block">Pending Reviews</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white">{submissions.filter(s => s.status === "pending").length}</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-black uppercase text-amber-500 block">Student Inquiries</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white">3 active</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl p-6 text-left shadow-sm">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white mb-4">Quick Diagnostic</h3>
                    <div className="space-y-4">
                      {students.slice(0, 3).map(st => (
                        <div key={st.id} className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-600 dark:text-slate-400">{st.name}</span>
                          <Badge variant="outline" className="text-[9px] font-mono font-bold">Band {st.average_score}</Badge>
                        </div>
                      ))}
                      <Button variant="ghost" onClick={() => setActiveTab('analytics')} className="w-full text-[10px] font-black uppercase tracking-wider text-emerald-600 mt-2">View Full Analytics</Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="live-meetings">
                <AdminLiveMeetings />
              </TabsContent>

              <TabsContent value="attendance">
                <TeacherAttendance />
              </TabsContent>

              <TabsContent value="course-designer">
                <TeacherCourseDesigner />
              </TabsContent>

              <TabsContent value="quiz-workshop">
                <TeacherQuizWorkshop />
              </TabsContent>

              <TabsContent value="resources">
                <TeacherResourceLibrary />
              </TabsContent>

              {/* TAB 2: GRADER WORKSHOP */}
              <TabsContent value="grader" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left priority sub list (5 cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider text-left">Submission Inbox</h3>
                    <div className="space-y-3">
                      {submissions.map((sub) => {
                        const isSelected = selectedSub?.id === sub.id;
                        return (
                          <div 
                            key={sub.id}
                            onClick={() => {
                              setSelectedSub(sub);
                              if (sub.status === 'graded') {
                                setRubricScores(sub.rubric_scores);
                                setGradeScore(sub.score);
                                setFeedbackRemarks(sub.grade_feedback || "");
                              } else {
                                setRubricScores({ task_achievement: 7.0, coherence: 7.0, lexical: 7.0, grammar: 7.0 });
                                setGradeScore(7.0);
                                setFeedbackRemarks("");
                              }
                            }}
                            className={`p-4 rounded-2xl text-left border cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/20 dark:border-emerald-500/60' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-350'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1 pb-1">
                              <Badge className={sub.lesson_type === 'WRITING' ? 'bg-indigo-50 text-[8.5px]' : 'bg-rose-50 text-[8.5px]'}>{sub.lesson_type}</Badge>
                              <span className={`text-[9px] uppercase font-bold ${sub.status === 'graded' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
                                ● {sub.status === 'graded' ? `Graded (${sub.score})` : 'Pending'}
                              </span>
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-normal">{sub.student_name}</h4>
                            <p className="text-[11px] text-slate-450 truncate">{sub.lesson_title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Workbook Desk (8 cols) */}
                  <div className="lg:col-span-8">
                    {selectedSub ? (
                      <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-6 text-left">
                        <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                          <div className="text-left">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedSub.student_name}</h3>
                            <p className="text-[11px] text-slate-455 font-semibold text-emerald-600 block mt-0.5">{selectedSub.course_title}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block uppercase font-mono mb-0.5">SUBMISSION TIME</span>
                            <span className="text-xs font-mono font-bold">{new Date(selectedSub.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl text-xs font-serif leading-relaxed italic border border-slate-200/50 dark:border-white/5 max-h-56 overflow-y-auto whitespace-pre-wrap text-slate-650 dark:text-slate-300">
                          {selectedSub.response_text}
                        </div>

                        {selectedSub.voice_audio_url && (
                          <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-left">
                            <span className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 animate-pulse" /> Oral Speeches Recording Track
                            </span>
                            <audio controls src={selectedSub.voice_audio_url} className="w-full h-8 mt-2" />
                          </div>
                        )}

                        <form onSubmit={handlePublishGrade} className="space-y-5 pt-3 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] uppercase font-black tracking-wider text-slate-700 dark:text-slate-300">Detailed IELTS Analytical Rubrics (1.0 to 9.0)</span>
                            <Button 
                              type="button" 
                              onClick={handleAiEvaluation} 
                              disabled={isAiGrading}
                              className="h-8 text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-650 rounded-xl cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-400 animate-spin mr-1" /> AI Assessor Heuristics
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-white/3 p-3.5 rounded-2xl">
                            {[
                              { label: "Task Response", key: 'task_achievement' },
                              { label: "Coherence", key: 'coherence' },
                              { label: "Lexical Resources", key: 'lexical' },
                              { label: "Grammar accuracy", key: 'grammar' }
                            ].map((rub) => (
                              <div key={rub.key} className="space-y-1 text-center bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-white/5">
                                <label className="text-[9px] uppercase font-black text-slate-400">{rub.label}</label>
                                <Input 
                                  type="number" 
                                  step="0.5" 
                                  min="1" 
                                  max="9" 
                                  value={rubricScores[rub.key as keyof typeof rubricScores]}
                                  onChange={(e) => setRubricScores({
                                    ...rubricScores,
                                    [rub.key]: Number(e.target.value) || 7.0
                                  })}
                                  className="h-8 text-center text-xs font-mono font-bold"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 p-3.5 rounded-2xl">
                            <div className="sm:col-span-2 text-left">
                              <span className="text-[10px] uppercase font-black text-indigo-501 text-indigo-650 block">Conclusive Appraisal Band Score</span>
                              <span className="text-[9.5px] text-slate-450 font-semibold leading-relaxed">Adjust derived average score indicators if necessary.</span>
                            </div>
                            <Input 
                              type="number" 
                              step="0.5" 
                              min="1" 
                              max="9" 
                              value={gradeScore}
                              onChange={(e) => setGradeScore(Number(e.target.value) || 7.0)}
                              className="h-10 text-center text-md font-mono font-black border-indigo-500/20"
                            />
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Detailed Linguistic Comments & Correction Keys</label>
                            <textarea 
                              placeholder="Detail critical correction patterns, vocabulary boosters advice, spelling markers mistakes..."
                              value={feedbackRemarks}
                              onChange={(e) => setFeedbackRemarks(e.target.value)}
                              className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-3 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="flex gap-2.5">
                            <Button type="button" onClick={() => setSelectedSub(null)} variant="ghost" className="rounded-xl h-10 flex-1 uppercase text-xs font-bold">Cancel</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 flex-1 uppercase text-xs font-bold shrink-0 cursor-pointer">Publish Active Grade</Button>
                          </div>
                        </form>
                      </Card>
                    ) : (
                      <div className="p-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-white dark:bg-slate-900 text-center">
                        <Award className="w-12 h-12 opacity-30 mx-auto mb-3" />
                        <h4 className="text-xs uppercase font-black text-slate-400">Grading workshop workspace idle</h4>
                        <p className="text-[11px] text-slate-450 mt-1 max-w-xs mx-auto">Select any student response in the sidebar list to initialize exhaustive analytical reviews.</p>
                      </div>
                    )}
                  </div>

                </div>
              </TabsContent>

              {/* TAB 4: PRIVATE MESSAGING FEEDBACK */}
              <TabsContent value="messaging" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Direct chat contacts list (4 cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider text-left">Academic Cohorts</h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {students.map((st) => {
                        const lastMsg = privateMessages.filter(m => m.student_id === st.id).slice(-1)[0];
                        const isSelected = selectedChatStudent === st.id;
                        return (
                          <div 
                            key={st.id}
                            onClick={() => setSelectedChatStudent(st.id)}
                            className={`p-3 rounded-2xl cursor-pointer text-left border flex items-center gap-3 transition-all ${
                              isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500/40 dark:bg-indigo-950/20 dark:border-indigo-500/60' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-300'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 font-bold italic flex items-center justify-center shrink-0 text-slate-700 dark:text-white">
                              {st.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{st.name}</h4>
                                <span className="text-[8.5px] bg-indigo-100/40 text-indigo-700 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded leading-none">{st.target_band}</span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{lastMsg ? lastMsg.text : 'No conversations recorded.'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active chat desk (8 cols) */}
                  <div className="lg:col-span-8">
                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col h-[520px]">
                      {/* Recipient Header */}
                      <div className="p-4 bg-slate-50 dark:bg-white/3 border-b border-slate-200/60 dark:border-white/5 flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-serif italic text-xs font-bold leading-none shrink-0">
                            {activeStudentObj?.name?.slice(0, 1)}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">{activeStudentObj?.name}</h4>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{activeStudentObj?.level} • {activeStudentObj?.country}</span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase text-[9px] font-black">
                          Target Band {activeStudentObj?.target_band}
                        </Badge>
                      </div>

                      {/* Chat Messages Log Area */}
                      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/40 text-left space-y-3.5">
                        {privateMessages.filter(m => m.student_id === selectedChatStudent).map((msg) => {
                          const isTeacher = msg.sender === "teacher";
                          return (
                            <div key={msg.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                                isTeacher 
                                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-white/5 rounded-tl-none'
                              }`}>
                                <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                                <span className={`text-[8.5px] block text-right mt-1.5 opacity-70 font-mono ${isTeacher ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {isTeacher ? 'Delivered' : 'Student'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {isTypingSim && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/55 rounded-2xl p-3 text-[11px] text-slate-400 italic">
                              {activeStudentObj?.name} is drafts response...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Msg Sender Input form */}
                      <form onSubmit={handleSendPrivateMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-white/5 flex gap-2">
                        <Input 
                          placeholder={`Transmit linguistic remarks to ${activeStudentObj?.name}...`}
                          value={newMessageText}
                          onChange={e => setNewMessageText(e.target.value)}
                          className="rounded-xl border-slate-200 dark:border-white/10 text-xs shrink"
                          required
                        />
                        <Button type="submit" className="bg-emerald-650 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 px-4 shrink-0 flex items-center justify-center gap-1.5 font-bold text-xs uppercase cursor-pointer">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </form>
                    </Card>
                  </div>

                </div>
              </TabsContent>

              {/* TAB 5: ANALYTICS MODULES */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weekly Trend line charts */}
                  <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl p-5 text-left shadow-sm">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" /> IELTS Band Class Growth Trend
                    </h3>
                    <p className="text-[11px] mb-4 text-slate-400 font-semibold">Diagnostic weekly progression average comparing total class versus top scholars.</p>
                    <div className="h-64 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                          <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#888' }} />
                          <YAxis domain={[5.0, 9.0]} tick={{ fontSize: 9.5, fill: '#888' }} />
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '10.5px' }} />
                          <Line type="monotone" dataKey="Class Average Band" stroke="#059669" strokeWidth={3} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Aisha Ahmed" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Rubric metrics breakdown */}
                  <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl p-5 text-left shadow-sm">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                      <Sliders className="w-5 h-5 text-indigo-500" /> Average Rubric achievement
                    </h3>
                    <p className="text-[11px] mb-4 text-slate-400 font-semibold font-sans">Appraisals distributed by core assessment parameters in IELTS standards.</p>
                    <div className="h-64 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={criteriaData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                          <XAxis dataKey="criteria" tick={{ fontSize: 9.5, fill: '#888' }} />
                          <YAxis domain={[0, 9.0]} tick={{ fontSize: 9.5, fill: '#888' }} />
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                          <Bar dataKey="score" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={34} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* Sub KPI progress metrics */}
                <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl p-6 text-left shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Scholar Diagnostic Portfolio status</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-slate-400 uppercase font-black tracking-widest text-[8.5px]">
                          <th className="py-3 px-2">Student Candidate</th>
                          <th className="py-3 px-2">Course level</th>
                          <th className="py-3 px-2">Streak days</th>
                          <th className="py-3 px-2 text-center">Submissions Completed</th>
                          <th className="py-3 px-2 text-center">Current Band avg</th>
                          <th className="py-3 px-2 text-center">Diagnostic appraisal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {students.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-white/2">
                            <td className="py-3 px-2 font-extrabold text-slate-900 dark:text-white">{st.name}<span className="block text-[10px] text-slate-400 font-mono font-medium">{st.country}</span></td>
                            <td className="py-3 px-2 font-mono text-[11px] text-slate-505">{st.level}</td>
                            <td className="py-3 px-2 font-bold font-mono text-emerald-600">{st.active_streak} days</td>
                            <td className="py-3 px-2 text-center font-mono font-black">{st.completed_homeworks} tasks</td>
                            <td className="py-3 px-2 text-center"><Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">Band {st.average_score}</Badge></td>
                            <td className="py-3 px-2 text-center">
                              <Badge className={`text-[8.5px] font-black uppercase tracking-wider ${
                                st.performance_status === 'High Performer' ? 'bg-emerald-100 text-emerald-850' :
                                st.performance_status === 'Performing Normal' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {st.performance_status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT AREA: QUICK ACTIONS SIDEBAR (1 col) */}
          <div className="lg:col-span-1 space-y-6">
             <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 p-6 text-left">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Activity className="w-4 h-4 text-emerald-500" /> Executive Actions
                   </h3>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                   {[
                     { label: "New Live Session", tab: "live-meetings", icon: <Video className="w-4 h-4" />, color: "text-rose-500" },
                     { label: "Attendance Registry", tab: "attendance", icon: <ClipboardList className="w-4 h-4" />, color: "text-emerald-500" },
                     { label: "Curriculum Studio", tab: "course-designer", icon: <Layout className="w-4 h-4" />, color: "text-indigo-500" },
                     { label: "Resource Upload", tab: "resources", icon: <Library className="w-4 h-4" />, color: "text-sky-500" },
                     { label: "Quiz Workshop", tab: "quiz-workshop", icon: <Puzzle className="w-4 h-4" />, color: "text-amber-500" },
                     { label: "Direct Broadcast", tab: "messaging", icon: <Mail className="w-4 h-4" />, color: "text-slate-400" }
                   ].map((action, i) => (
                     <button 
                       key={i} 
                       onClick={() => setActiveTab(action.tab)}
                       className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
                     >
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl bg-slate-50 dark:bg-white/5 ${action.color}`}>
                           {action.icon}
                         </div>
                         <span className="text-[11px] font-black uppercase italic text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                       </div>
                       <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                     </button>
                   ))}
                </CardContent>
             </Card>

             <Card className="border-slate-200 dark:border-white/5 bg-slate-900 rounded-3xl p-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
                <h3 className="text-[11px] font-black uppercase text-emerald-400 tracking-widest mb-4">Academy Broadcast</h3>
                <form onSubmit={handleSidebarAnnouncementSubmit} className="space-y-4">
                   <textarea 
                     placeholder="Broadcast linguistic tips or alerts to all cohort members..." 
                     value={sidebarAnnouncement}
                     onChange={e => setSidebarAnnouncement(e.target.value)}
                     className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-3 text-[11px] text-white font-medium focus:outline-none focus:border-emerald-500/50 resize-none"
                   />
                   <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">
                      Send Academy Alert
                   </Button>
                </form>
             </Card>

             <div className="p-4 rounded-[2rem] bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-left">
                <span className="text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Faculty Log</span>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-300 mt-2 leading-relaxed">
                  "Excellence is not an act, but a habit. Keep our candidates motivated for Band 8.5."
                </p>
                <div className="mt-3 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white">S</div>
                   <span className="text-[10px] font-black uppercase italic text-slate-500">Syed Ejaz Bukhari</span>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
