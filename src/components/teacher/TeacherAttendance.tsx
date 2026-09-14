import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Calendar,
  UserPlus,
  ArrowRight,
  BookOpen,
  History,
  Timer,
  Layout,
  ClipboardCheck,
  CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import AttendanceCalendar from "./AttendanceCalendar";

export default function TeacherAttendance() {
  const [view, setView] = useState<"management" | "calendar">("management");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: "", description: "" });
  
  const [selectedClassroom, setSelectedClassroom] = useState<any | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
  const [reportSession, setReportSession] = useState<any | null>(null);
  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  useEffect(() => {
    fetchClassrooms();
    fetchAllProfiles();
  }, []);

  const fetchAllProfiles = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .order("first_name", { ascending: true });
        if (error) throw error;
        setAllProfiles(data || []);
      } else {
        // Mock profiles
        setAllProfiles([
          { id: "mock-1", first_name: "Aisha", last_name: "Ahmed", email: "aisha@example.com" },
          { id: "mock-2", first_name: "Sajid", last_name: "Khan", email: "sajid@example.com" },
          { id: "mock-3", first_name: "Kamran", last_name: "Shah", email: "kamran@example.com" },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("classrooms")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setClassrooms(data || []);
      } else {
        const saved = localStorage.getItem("sebs_classrooms");
        setClassrooms(saved ? JSON.parse(saved) : [
          { id: "class-1", name: "IELTS Mastery Evening Batch", description: "Advanced speaking and writing focus", created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async () => {
    if (!newClassroom.name.trim()) return;
    try {
      const payload = {
        name: newClassroom.name,
        description: newClassroom.description,
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data, error } = await supabase
          .from("classrooms")
          .insert([payload])
          .select();
        if (error) throw error;
        setClassrooms([data[0], ...classrooms]);
      } else {
        const updated = [{ ...payload, id: `class-${Date.now()}` }, ...classrooms];
        setClassrooms(updated);
        localStorage.setItem("sebs_classrooms", JSON.stringify(updated));
      }
      toast.success("Class created successfully!");
      setIsCreating(false);
      setNewClassroom({ name: "", description: "" });
    } catch (err) {
      toast.error("Failed to create class");
    }
  };

  const selectClassroom = async (classroom: any) => {
    setSelectedClassroom(classroom);
    fetchEnrolledStudents(classroom.id);
    fetchAttendanceSessions(classroom.id);
  };

  const fetchEnrolledStudents = async (classId: string) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("classroom_enrollments")
          .select("*, profiles!inner(first_name, last_name, email)")
          .eq("classroom_id", classId);
        if (error) throw error;
        setEnrolledStudents(data || []);
      } else {
        const saved = localStorage.getItem(`sebs_enrollments_${classId}`);
        setEnrolledStudents(saved ? JSON.parse(saved) : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceSessions = async (classId: string) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("attendance_sessions")
          .select("*")
          .eq("classroom_id", classId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setAttendanceSessions(data || []);
      } else {
        const saved = localStorage.getItem(`sebs_attendance_${classId}`);
        setAttendanceSessions(saved ? JSON.parse(saved) : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const enrollStudent = async () => {
    if (!selectedStudentId || !selectedClassroom) return;
    setIsAddingStudent(true);
    try {
      if (supabase) {
        const profile = allProfiles.find(p => p.id === selectedStudentId);
        const { error } = await supabase
          .from("classroom_enrollments")
          .insert([{ classroom_id: selectedClassroom.id, student_id: selectedStudentId }]);
        if (error) throw error;
        setEnrolledStudents([...enrolledStudents, { profiles: profile }]);
      } else {
        const profile = allProfiles.find(p => p.id === selectedStudentId);
        const updated = [...enrolledStudents, { profiles: profile, student_id: selectedStudentId }];
        setEnrolledStudents(updated);
        localStorage.setItem(`sebs_enrollments_${selectedClassroom.id}`, JSON.stringify(updated));
      }
      toast.success("Student added to class!");
      setSelectedStudentId("");
    } catch (err) {
      toast.error("Enrollment failed");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const launchAttendance = async () => {
    if (!selectedClassroom) return;
    try {
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const payload = {
        classroom_id: selectedClassroom.id,
        expires_at,
        created_at: new Date().toISOString(),
      };
      if (supabase) {
        const { data, error } = await supabase.from("attendance_sessions").insert([payload]).select();
        if (error) throw error;
        setAttendanceSessions([data[0], ...attendanceSessions]);
      } else {
        const newSession = { ...payload, id: `session-${Date.now()}` };
        const updated = [newSession, ...attendanceSessions];
        setAttendanceSessions(updated);
        localStorage.setItem(`sebs_attendance_${selectedClassroom.id}`, JSON.stringify(updated));
      }
      toast.success("Attendance session active for 15 minutes!");
    } catch (err) {
      toast.error("Launch failed");
    }
  };

  const viewReport = async (session: any) => {
    setReportSession(session);
    if (supabase) {
      const { data } = await supabase.from("attendance_logs").select("*, profiles(first_name, last_name, email)").eq("session_id", session.id);
      setReportLogs(data || []);
    } else {
      setReportLogs([{ profiles: allProfiles[0], marked_at: new Date().toISOString() }]);
    }
  };

  const filteredClassrooms = classrooms.filter(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm text-left">
        <div className="flex gap-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">Class & <span className="text-emerald-500">Attendance</span> Tracking</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Manage student cohorts and track session presence</p>
          </div>
          
          <div className="hidden md:flex ml-6 p-1 bg-slate-100 dark:bg-white/5 rounded-xl self-center">
            <button 
              onClick={() => setView("management")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${view === "management" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Users className="w-3 h-3" /> Management
            </button>
            <button 
              onClick={() => setView("calendar")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${view === "calendar" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <CalendarDays className="w-3 h-3" /> Calendar View
            </button>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="rounded-xl h-10 px-6 bg-slate-900 border-none dark:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[10px] cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> New Class
        </Button>
      </div>

      {view === "management" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search classes..." className="pl-10 h-10 rounded-xl bg-slate-100/50 dark:bg-white/5 border-none text-xs font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-2 px-2">
                {filteredClassrooms.map((c) => (
                  <button key={c.id} onClick={() => selectClassroom(c)} className={`w-full p-4 rounded-2xl text-left transition-all border ${selectedClassroom?.id === c.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"} cursor-pointer`}>
                    <h4 className="font-bold text-sm leading-none">{c.name}</h4>
                    <p className={`text-[10px] mt-1 opacity-70 line-clamp-1`}>{c.description || "No description"}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedClassroom ? (
            <div className="space-y-6">
              <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden text-left">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Active Class</Badge>
                    <h3 className="text-2xl font-black italic tracking-tight uppercase leading-none">{selectedClassroom.name}</h3>
                    <p className="text-slate-400 text-xs font-medium mt-3">{selectedClassroom.description || "Administrative cohort managed by Senior Faculty"}</p>
                  </div>
                  <Button onClick={launchAttendance} className="rounded-xl h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg cursor-pointer">
                    <ClipboardCheck className="w-4 h-4 mr-2" /> Launch Attendence
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
                  <CardHeader className="border-b border-slate-50 dark:border-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <CardTitle className="text-xs font-black uppercase italic tracking-widest">Enrollment Portal</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black">{enrolledStudents.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-50 dark:border-white/5 flex gap-2">
                      <select className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-[10px] font-bold px-3 focus:outline-none" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                        <option value="">Select Candidate...</option>
                        {allProfiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                      </select>
                      <Button onClick={enrollStudent} disabled={isAddingStudent || !selectedStudentId} size="icon" className="h-9 w-9 bg-slate-900 text-white rounded-xl cursor-pointer">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-[250px]">
                      <div className="divide-y divide-slate-50 dark:divide-white/5">
                        {enrolledStudents.map((enroll, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-black uppercase italic">{enroll.profiles?.first_name} {enroll.profiles?.last_name}</p>
                              <p className="text-[9px] font-bold text-slate-400">{enroll.profiles?.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 rounded-lg"><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
                  <CardHeader className="border-b border-slate-50 dark:border-white/5 p-4">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-500" />
                      <CardTitle className="text-xs font-black uppercase italic tracking-widest">Attendance Archive</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[310px]">
                      <div className="divide-y divide-slate-50 dark:divide-white/5 text-left">
                        {attendanceSessions.map((session, idx) => {
                          const isActive = new Date(session.expires_at) > new Date();
                          return (
                            <div key={idx} className="p-4 flex justify-between items-center">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  {isActive ? <Badge className="bg-emerald-500 text-white text-[8px] uppercase px-1.5 animate-pulse">Monitoring Live</Badge> : <Badge variant="outline" className="text-[8px] uppercase px-1.5">Archived</Badge>}
                                </div>
                              </div>
                              <Button onClick={() => viewReport(session)} variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase italic text-emerald-600 cursor-pointer">View Logs</Button>
                            </div>
                          );
                        })}
                        {attendanceSessions.length === 0 && <div className="p-12 text-center text-[10px] font-bold text-slate-400 uppercase">No sessions logged</div>}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="h-[500px] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900">
               <ClipboardCheck className="w-12 h-12 text-slate-200 mb-4" />
               <h4 className="text-sm font-black uppercase italic text-slate-400">Select Class To Begin Tracking</h4>
               <p className="text-[10px] font-bold text-slate-500 max-w-xs mt-2">Manage your study co-horts, register attendance sessions and trace candidate regularity records.</p>
            </div>
          )}
        </div>
      </div>
      ) : (
        <AttendanceCalendar selectedClassroom={selectedClassroom} enrolledStudents={enrolledStudents} />
      )}

      <AnimatePresence>
        {reportSession && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReportSession(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-left">
              <div className="p-8 border-b border-slate-100 dark:border-white/5">
                 <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">Attendance <span className="text-emerald-500">Diagnostic</span></h3>
                 <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">{new Date(reportSession.created_at).toLocaleString()}</p>
                 <Badge variant="outline" className="mt-4 text-[9px] font-black uppercase">{reportLogs.length} Candidates Marked Present</Badge>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {reportLogs.map((log: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <p className="text-[11px] font-black uppercase italic">{log.profiles?.first_name} {log.profiles?.last_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{log.profiles?.email}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-6 border-t border-slate-100 dark:border-white/5">
                <Button onClick={() => setReportSession(null)} className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] cursor-pointer">Close Report</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-left">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none mb-8">Build New <span className="text-emerald-500">Cohort</span></h3>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classroom Headline</Label>
                  <Input placeholder="e.g. Band 8.5 Strategy Weekend" className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none text-xs font-bold" value={newClassroom.name} onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cohort Description</Label>
                  <textarea placeholder="Specify study targets or scheduled routines..." className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none text-xs font-bold resize-none focus:outline-none" value={newClassroom.description} onChange={(e) => setNewClassroom({...newClassroom, description: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1 h-12 rounded-xl border-slate-200 dark:border-white/5 font-black uppercase tracking-widest text-[10px] cursor-pointer">Cancel</Button>
                  <Button onClick={createClassroom} className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] border-none cursor-pointer">Build Active Class</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
