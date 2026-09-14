import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  Timer,
  Award,
  AlertCircle,
  History,
  DoorOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

function ActiveSessionCard({ session, onMark }: { session: any, onMark: (id: string) => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiresAt = new Date(session.expires_at).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((expiresAt - now) / 1000));
    };
    
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [session.expires_at]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  if (timeLeft <= 0) return null;
  
  return (
    <Card className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 shadow-xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-bl-2xl">
        <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
        <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase italic tracking-tight pr-14">{session.classrooms?.name}</CardTitle>
        <CardDescription className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Live Attendance Window</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => onMark(session.id)}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-emerald-950/10 border-none"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark Presence Now
        </Button>
      </CardContent>
    </Card>
  );
}

function UnifiedAttendanceCalendar({ history }: { history: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  
  const markedDates = history.reduce((acc, h) => {
    const d = new Date(h.marked_at).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(h);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card className="bg-slate-900 border-none text-white p-5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-5">
         <CalendarDays className="w-8 h-8 text-indigo-500/20" />
      </div>
      <div className="mb-5 relative z-10">
         <h4 className="font-black italic text-sm tracking-widest uppercase">My Logbook</h4>
         <p className="text-[10px] font-bold text-slate-400 uppercase">Unified Course Attendance</p>
      </div>
      <div className="flex justify-between items-center mb-5">
         <h4 className="font-black italic text-lg text-emerald-400">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h4>
         <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10 hover:text-white text-slate-400" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10 hover:text-white text-slate-400" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
         </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
         {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-[9px] font-black tracking-widest uppercase text-slate-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
         {blanks.map(b => <div key={`blank-${b}`} className="aspect-square rounded-2xl bg-white/5 border border-white/5" />)}
         {days.map(d => {
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toDateString();
            const classesMarked = markedDates[dateStr] || [];
            const isToday = new Date().toDateString() === dateStr;

            return (
              <div key={d} className={`aspect-square rounded-2xl p-1 flex flex-col items-center justify-start relative border transition-all ${isToday ? 'border-primary ring-2 ring-primary/20' : 'border-white/5 hover:border-white/20'} ${classesMarked.length > 0 ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                 <span className={`text-[10px] font-bold ${classesMarked.length > 0 ? 'text-emerald-400' : isToday ? 'text-primary' : 'text-slate-400'}`}>{d}</span>
                 {classesMarked.length > 0 && (
                   <div className="flex flex-wrap justify-center gap-1 mt-1 w-full px-0.5">
                      {classesMarked.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" title={c.attendance_sessions?.classrooms?.name} />
                      ))}
                   </div>
                 )}
              </div>
            );
         })}
      </div>
    </Card>
  )
}

export default function StudentClassroomHub() {
  const [myClassrooms, setMyClassrooms] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassroomData();
    const interval = setInterval(checkActiveSessions, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch classrooms through enrollments
        const { data: enrollments, error: eErr } = await supabase
          .from("classroom_enrollments")
          .select("*, classrooms(*)")
          .eq("student_id", user.id);
        
        if (eErr) throw eErr;
        const classes = enrollments?.map(e => e.classrooms) || [];
        setMyClassrooms(classes);

        // Fetch attendance history
        const { data: history, error: hErr } = await supabase
          .from("attendance_logs")
          .select("*, attendance_sessions(*, classrooms(name))")
          .eq("student_id", user.id)
          .order("marked_at", { ascending: false });
        
        if (hErr) throw hErr;
        setAttendanceHistory(history || []);

        // Check for active sessions for these classrooms
        if (classes.length > 0) {
          const classIds = classes.map(c => c.id);
          const { data: sessions, error: sErr } = await supabase
            .from("attendance_sessions")
            .select("*, classrooms(name)")
            .in("classroom_id", classIds)
            .gt("expires_at", new Date().toISOString());
          
          if (sErr) throw sErr;
          
          // Filter sessions already marked
          const unmarked = (sessions || []).filter(s => 
            !(history || []).some((h: any) => h.session_id === s.id)
          );
          setActiveSessions(unmarked);
        }
      } else {
        // Localstorage fallbacks
        const savedClasses = localStorage.getItem("sebs_classrooms");
        setMyClassrooms(savedClasses ? JSON.parse(savedClasses).slice(0, 2) : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSessions = async () => {
    if (!supabase || myClassrooms.length === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const classIds = myClassrooms.map(c => c.id);
      const { data: sessions } = await supabase
        .from("attendance_sessions")
        .select("*, classrooms(name)")
        .in("classroom_id", classIds)
        .gt("expires_at", new Date().toISOString());

      const { data: history } = await supabase
        .from("attendance_logs")
        .select("session_id")
        .eq("student_id", user.id);
      
      const unmarked = (sessions || []).filter(s => 
        !(history || []).some(h => h.session_id === s.id)
      );
      
      if (unmarked.length > activeSessions.length) {
        toast.info("A live attendance window is active for your class!", {
          icon: <Timer className="w-4 h-4 text-emerald-500 animate-pulse" />
        });
      }
      setActiveSessions(unmarked || []);
    } catch (err) {}
  };

  const markAttendance = async (sessionId: string) => {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("attendance_logs")
          .insert([{ session_id: sessionId, student_id: user.id, marked_at: new Date().toISOString() }]);
        
        if (error) throw error;
      } else {
        const history = [...attendanceHistory, { session_id: sessionId, marked_at: new Date().toISOString(), attendance_sessions: { classrooms: { name: "Sample Class" }} }];
        setAttendanceHistory(history);
      }
      
      setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
      toast.success("Attendance marked successfully! Great consistency. 🎉");
      fetchClassroomData();
    } catch (err) {
      toast.error("Failed to mark attendance");
    }
  };

  if (loading) return (
    <div className="py-12 text-center animate-pulse">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-xs font-black uppercase text-slate-400">Synchronizing Classrooms...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Active Attendance Alerts */}
      <AnimatePresence>
        {activeSessions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-500 animate-bounce" />
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 italic">Action Required: Attendance Window Open</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <ActiveSessionCard key={session.id} session={session} onMark={markAttendance} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Classrooms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              My <span className="text-primary">Classrooms</span>
            </h2>
            <Badge variant="outline" className="text-[10px] font-black uppercase">{myClassrooms.length} Enrolled</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myClassrooms.map((c) => (
              <Card key={c.id} className="rounded-[2.5rem] border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-xl overflow-hidden group hover:scale-[1.01] transition-all">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-black uppercase italic tracking-tight leading-tight">{c.name}</CardTitle>
                  <CardDescription className="text-xs font-semibold line-clamp-2 mt-2 leading-relaxed">{c.description || "Active language learning cohort directed by SEB Institute faculty."}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                       <Users className="w-3.5 h-3.5 text-slate-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Cohort</span>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-xl h-8 text-[10px] font-black uppercase italic tracking-widest text-primary">
                      Class Portal <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {myClassrooms.length === 0 && (
              <Card className="col-span-full rounded-[2.5rem] border-dashed border-slate-200 dark:border-white/10 bg-transparent flex flex-col items-center justify-center p-12 text-center h-64">
                <Users className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">You are not enrolled in any classrooms yet.</p>
              </Card>
            )}
          </div>
        </div>

        {/* History / Streak Sidebar */}
        <div className="space-y-6">
          <UnifiedAttendanceCalendar history={attendanceHistory} />
        </div>
      </div>
    </div>
  );
}
