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
  AlertCircle,
  Calendar,
  UserPlus,
  ArrowRight,
  BookOpen,
  History,
  Timer,
  Layout,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function AdminClassroomManager() {
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
        // Localstorage fallback
        const saved = localStorage.getItem("sebs_classrooms");
        setClassrooms(saved ? JSON.parse(saved) : []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load classrooms");
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
      toast.success("Classroom created successfully!");
      setIsCreating(false);
      setNewClassroom({ name: "", description: "" });
    } catch (err) {
      toast.error("Failed to create classroom");
    }
  };

  const deleteClassroom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this classroom? All enrollment data will be lost.")) return;
    try {
      if (supabase) {
        const { error } = await supabase.from("classrooms").delete().eq("id", id);
        if (error) throw error;
      }
      const updated = classrooms.filter(c => c.id !== id);
      setClassrooms(updated);
      if (!supabase) localStorage.setItem("sebs_classrooms", JSON.stringify(updated));
      toast.success("Classroom deleted");
      if (selectedClassroom?.id === id) setSelectedClassroom(null);
    } catch (err) {
      toast.error("Failed to delete classroom");
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
    
    // Check if student is already enrolled in state
    const alreadyEnrolled = enrolledStudents.some(
      s => s.student_id === selectedStudentId || (s.profiles && s.profiles.id === selectedStudentId)
    );
    if (alreadyEnrolled) {
      toast.warning("Student is already enrolled in this classroom.");
      setSelectedStudentId("");
      return;
    }

    setIsAddingStudent(true);
    try {
      if (supabase) {
        // Find profile
        const profile = allProfiles.find(p => p.id === selectedStudentId);
        if (!profile) {
          toast.error("Selected student not found");
          return;
        }

        const { error: eErr } = await supabase
          .from("classroom_enrollments")
          .upsert([{ classroom_id: selectedClassroom.id, student_id: profile.id }]);
        
        if (eErr) throw eErr;
        
        setEnrolledStudents([...enrolledStudents, { student_id: profile.id, profiles: profile }]);
      } else {
        const profile = allProfiles.find(p => p.id === selectedStudentId) || { first_name: "Local", last_name: "Student", email: "local@student.com" };
        const id = `enroll-${Date.now()}`;
        const newEnroll = { id, student_id: selectedStudentId, classroom_id: selectedClassroom.id, profiles: profile };
        const updated = [...enrolledStudents, newEnroll];
        setEnrolledStudents(updated);
        localStorage.setItem(`sebs_enrollments_${selectedClassroom.id}`, JSON.stringify(updated));
      }
      toast.success("Student enrolled!");
      setSelectedStudentId("");
    } catch (err) {
      toast.error("Failed to enroll student. They might already be enrolled.");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!selectedClassroom) return;
    if (!confirm("Are you sure you want to remove this student from the classroom?")) return;
    try {
      if (supabase) {
        const { error } = await supabase
          .from("classroom_enrollments")
          .delete()
          .eq("classroom_id", selectedClassroom.id)
          .eq("student_id", studentId);
        if (error) throw error;
      }
      const updated = enrolledStudents.filter((e: any) => e.profiles?.id !== studentId && e.student_id !== studentId);
      setEnrolledStudents(updated);
      if (!supabase) localStorage.setItem(`sebs_enrollments_${selectedClassroom.id}`, JSON.stringify(updated));
      toast.success("Student removed");
    } catch (err) {
      toast.error("Failed to remove student");
    }
  };

  const launchAttendance = async () => {
    if (!selectedClassroom) return;
    try {
      const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const payload = {
        classroom_id: selectedClassroom.id,
        expires_at,
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data, error } = await supabase
          .from("attendance_sessions")
          .insert([payload])
          .select();
        if (error) throw error;
        setAttendanceSessions([data[0], ...attendanceSessions]);
      } else {
        const newSession = { ...payload, id: `session-${Date.now()}` };
        const updated = [newSession, ...attendanceSessions];
        setAttendanceSessions(updated);
        localStorage.setItem(`sebs_attendance_${selectedClassroom.id}`, JSON.stringify(updated));
      }
      toast.success("Attendance session launched for 5 minutes!");
    } catch (err) {
      toast.error("Failed to launch attendance");
    }
  };

  const viewReport = async (session: any) => {
    setReportSession(session);
    setReportLogs([]); // clear ancient
    if (supabase) {
      try {
        const { data: logs, error } = await supabase
          .from("attendance_logs")
          .select("*, profiles(first_name, last_name, email)")
          .eq("session_id", session.id)
          .order("marked_at", { ascending: true });
        
        if (error) throw error;
        setReportLogs(logs || []);
      } catch (err) {
        toast.error("Failed to fetch report logs");
      }
    } else {
      // Local fallback pseudo data
      setReportLogs([
        { profiles: { first_name: "Mock", last_name: "Student", email: "mock@student.com" }, marked_at: new Date().toISOString() }
      ]);
    }
  };

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Classroom <span className="text-primary">Management</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Build and manage specialized study cohorts
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="rounded-xl h-11 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Classroom
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classroom List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-[2rem] border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search classrooms..."
                  className="pl-10 h-10 rounded-xl bg-slate-100/50 dark:bg-white/5 border-none text-xs font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2 px-2">
                  {filteredClassrooms.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectClassroom(c)}
                      className={`w-full p-4 rounded-2xl text-left transition-all group relative border ${
                        selectedClassroom?.id === c.id 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black uppercase tracking-tight text-sm leading-none italic">{c.name}</h4>
                          <p className={`text-[10px] font-bold mt-1 opacity-70 line-clamp-1`}>{c.description || "No description provided."}</p>
                        </div>
                        <Trash2 
                          onClick={(e) => { e.stopPropagation(); deleteClassroom(c.id); }}
                          className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${selectedClassroom?.id === c.id ? "text-white" : "text-rose-500"}`}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 opacity-60" />
                          <span className="text-[10px] font-black italic">Enrollment Portal</span>
                        </div>
                        <ArrowRight className="w-3 h-3 ml-auto opacity-40" />
                      </div>
                    </button>
                  ))}
                  {filteredClassrooms.length === 0 && (
                    <div className="py-12 text-center">
                      <BookOpen className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No classes found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Classroom Detail View */}
        <div className="lg:col-span-2">
          {selectedClassroom ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-20 -mt-20" />
                <div className="relative z-10">
                  <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-3 py-1 font-black italic">Active Cohort</Badge>
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{selectedClassroom.name}</h3>
                  <p className="text-slate-400 text-sm font-semibold max-w-md mt-4 leading-relaxed">{selectedClassroom.description}</p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 shrink-0">
                  <Button 
                    onClick={launchAttendance}
                    className="rounded-2xl h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs border-none shadow-xl shadow-emerald-950/20"
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Launch Attendance
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students Management */}
                <Card className="rounded-[2rem] border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-black uppercase italic tracking-wider">Enrolled Students</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-black">{enrolledStudents.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex gap-2">
                      <select
                        className="flex-1 h-10 rounded-xl bg-slate-100/50 dark:bg-white/5 border-none text-xs font-bold px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                      >
                        <option value="">Select a student...</option>
                        {allProfiles.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} ({p.email})
                          </option>
                        ))}
                      </select>
                      <Button 
                        size="icon" 
                        onClick={enrollStudent}
                        disabled={isAddingStudent || !selectedStudentId}
                        className="rounded-xl h-10 w-10 bg-slate-900 dark:bg-white dark:text-slate-900 text-white shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {enrolledStudents.map((enroll, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <div>
                              <p className="text-xs font-black uppercase italic tracking-tight">{enroll.profiles?.first_name} {enroll.profiles?.last_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{enroll.profiles?.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 rounded-lg" onClick={() => removeStudent(enroll.student_id || enroll.profiles?.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Attendance History */}
                <Card className="rounded-[2rem] border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <History className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm font-black uppercase italic tracking-wider">Attendance Logs</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[370px]">
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {attendanceSessions.map((session, idx) => {
                          const isActive = new Date(session.expires_at) > new Date();
                          return (
                            <div key={idx} className="p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {new Date(session.created_at).toLocaleString()}
                                </span>
                                {isActive ? (
                                  <Badge className="bg-emerald-500 text-white border-none text-[8px] uppercase tracking-widest px-2 animate-pulse">Monitoring Live</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest px-2">Archived</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Session Window: 5 Mins</p>
                                <Button onClick={() => viewReport(session)} variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest italic text-primary">View Report</Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="rounded-[2.5rem] border-dashed border-slate-200 dark:border-white/10 bg-transparent h-[600px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                <Layout className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-400">Select a Classroom</h3>
              <p className="text-xs font-bold text-slate-500 max-w-sm mt-3 leading-relaxed">
                Choose a cohort from the directory to manage students, track attendance data, and communicate with scholars.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportSession(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/10">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                  Attendance <span className="text-primary">Report</span>
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                  {new Date(reportSession.created_at).toLocaleString()}
                </p>
                <Badge variant="outline" className="mt-4">{reportLogs.length} Students Present</Badge>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  {reportLogs.map((log: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <p className="text-sm font-black uppercase italic tracking-tight">{log.profiles?.first_name} {log.profiles?.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{log.profiles?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500">Present</span>
                      </div>
                    </div>
                  ))}
                  {reportLogs.length === 0 && (
                    <div className="text-center py-12">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">No attendance registered.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-white/10 shrink-0">
                <Button 
                  onClick={() => setReportSession(null)}
                  className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-xs"
                >
                  Close Report
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-3xl overflow-hidden"
            >
              <div className="p-10">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-8">
                  Forge New <span className="text-primary">Cohort</span>
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classroom Title</Label>
                    <Input 
                      placeholder="e.g. Band 8.5 Masterclass 2026"
                      className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border-none text-sm font-bold"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cohort Description</Label>
                    <textarea 
                      placeholder="Describe the learning objectives or schedule..."
                      className="w-full h-32 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none text-sm font-bold resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={newClassroom.description}
                      onChange={(e) => setNewClassroom({...newClassroom, description: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                      className="flex-1 h-14 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createClassroom}
                      className="flex-1 h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl"
                    >
                      Build Classroom
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
