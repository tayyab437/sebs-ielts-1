import { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMeetings } from "@/src/context/MeetingsContext";
import { supabase } from "@/src/lib/supabaseClient";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface AttendanceCalendarProps {
  selectedClassroom: any;
  enrolledStudents: any[];
}

export default function AttendanceCalendar({ selectedClassroom, enrolledStudents }: AttendanceCalendarProps) {
  const { meetings } = useMeetings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
  const [daySessions, setDaySessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClassroom) {
      fetchAttendanceSessions();
    }
  }, [selectedClassroom]);

  if (!selectedClassroom) {
    return (
      <div className="h-[500px] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900">
         <CalendarIcon className="w-12 h-12 text-slate-200 mb-4" />
         <h4 className="text-sm font-black uppercase italic text-slate-400">Select Class To View Calendar</h4>
         <p className="text-[10px] font-bold text-slate-500 max-w-xs mt-2">Choose a study co-hort from the Management view to visualize attendance cycles and scheduled sessions.</p>
      </div>
    );
  }

  useEffect(() => {
    // Filter sessions for the selected date
    const filtered = [
      ...attendanceSessions.filter(s => isSameDay(parseISO(s.created_at), selectedDate)),
      ...meetings.filter(m => isSameDay(parseISO(m.scheduled_start), selectedDate))
    ].map(s => ({
      ...s,
      type: s.meeting_type ? 'meeting' : 'session',
      timestamp: s.created_at || s.scheduled_start
    }));
    setDaySessions(filtered);
    if (filtered.length > 0) {
      setSelectedSession(filtered[0]);
    } else {
      setSelectedSession(null);
    }
  }, [selectedDate, attendanceSessions, meetings]);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceLogs(selectedSession.id);
    } else {
      setAttendanceLogs([]);
    }
  }, [selectedSession]);

  const fetchAttendanceSessions = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("attendance_sessions")
          .select("*")
          .eq("classroom_id", selectedClassroom.id);
        if (error) throw error;
        setAttendanceSessions(data || []);
      } else {
        const saved = localStorage.getItem(`sebs_attendance_${selectedClassroom.id}`);
        setAttendanceSessions(saved ? JSON.parse(saved) : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceLogs = async (sessionId: string) => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("attendance_logs")
          .select("*")
          .eq("session_id", sessionId);
        if (error) throw error;
        setAttendanceLogs(data || []);
      } else {
        const saved = localStorage.getItem(`sebs_logs_${sessionId}`);
        setAttendanceLogs(saved ? JSON.parse(saved) : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (studentId: string) => {
    if (!selectedSession) return;
    
    const isPresent = attendanceLogs.some(log => log.student_id === studentId);
    
    try {
      if (supabase) {
        if (isPresent) {
          const { error } = await supabase
            .from("attendance_logs")
            .delete()
            .eq("session_id", selectedSession.id)
            .eq("student_id", studentId);
          if (error) throw error;
          setAttendanceLogs(attendanceLogs.filter(log => log.student_id !== studentId));
        } else {
          const payload = {
            session_id: selectedSession.id,
            student_id: studentId,
            marked_at: new Date().toISOString()
          };
          const { data, error } = await supabase
            .from("attendance_logs")
            .insert([payload])
            .select();
          if (error) throw error;
          setAttendanceLogs([...attendanceLogs, data[0]]);
        }
      } else {
        // Mock / Offline Toggling
        let updated;
        if (isPresent) {
          updated = attendanceLogs.filter(log => log.student_id !== studentId);
        } else {
          updated = [...attendanceLogs, { session_id: selectedSession.id, student_id: studentId, marked_at: new Date().toISOString() }];
        }
        setAttendanceLogs(updated);
        localStorage.setItem(`sebs_logs_${selectedSession.id}`, JSON.stringify(updated));
      }
      toast.success(isPresent ? "Marked Absent" : "Marked Present");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const hasClassOnDay = (day: Date) => {
    return [
      ...attendanceSessions.map(s => parseISO(s.created_at)),
      ...meetings.map(m => parseISO(m.scheduled_start))
    ].some(d => isSameDay(d, day));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      {/* CALENDAR SECTION */}
      <Card className="lg:col-span-7 rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-white/5 p-6">
          <div>
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-500" />
              Attendance Calendar
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{format(currentDate, 'MMMM yyyy')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const hasClass = hasClassOnDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative aspect-square rounded-xl p-2 transition-all flex flex-col items-center justify-center cursor-pointer
                    ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                    ${isSelected ? 'bg-slate-900 text-white shadow-lg z-10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}
                    ${isToday(day) && !isSelected ? 'border-2 border-emerald-500/50' : ''}
                  `}
                >
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasClass && (
                    <div className={`mt-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                  )}

                  {isToday(day) && (
                    <span className="absolute top-1 left-1.5 text-[6px] font-black uppercase text-emerald-500">Today</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Scheduled Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500/50" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Current Day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SESSION & STUDENT PANEL */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-full">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 p-6 bg-slate-50/50 dark:bg-white/2">
            <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-800 dark:text-white">
              Sessions for {format(selectedDate, 'MMM d, yyyy')}
            </h3>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="max-h-[200px] border-b border-slate-50 dark:border-white/5">
              <div className="p-4 space-y-2">
                {daySessions.length > 0 ? (
                  daySessions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSession(s)}
                      className={`w-full p-4 rounded-xl text-left transition-all border ${selectedSession?.id === s.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-900'} cursor-pointer`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className={`text-[8px] uppercase mb-1 px-1 py-0 ${selectedSession?.id === s.id ? 'border-white/30 text-white' : 'border-emerald-500/30 text-emerald-500'}`}>
                            {s.type === 'meeting' ? 'Live Meeting' : 'Attendance Session'}
                          </Badge>
                          <h4 className="text-[11px] font-black uppercase italic line-clamp-1">{s.title || 'General Session'}</h4>
                          <div className="flex items-center gap-1.5 mt-1 opacity-70">
                            <Clock className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase">{format(parseISO(s.timestamp), 'h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center bg-slate-50/50 dark:bg-white/1 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">No sessions scheduled</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-6 bg-white dark:bg-slate-900 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Candidate Roll Call</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase border-none bg-slate-100 dark:bg-white/5">
                  {attendanceLogs.length} / {enrolledStudents.length} Present
                </Badge>
              </div>

              {selectedSession ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {enrolledStudents.map((enroll) => {
                      const student = enroll.profiles || enroll;
                      const isPresent = attendanceLogs.some(log => log.student_id === student.id);
                      
                      return (
                        <div key={student.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                          <div>
                            <p className="text-[10px] font-black uppercase italic">{student.first_name} {student.last_name}</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">{student.email}</p>
                          </div>
                          <Button
                            onClick={() => toggleAttendance(student.id)}
                            size="sm"
                            className={`h-8 rounded-xl px-4 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isPresent 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-none' 
                                : 'bg-white dark:bg-slate-950 text-slate-400 border border-slate-200 dark:border-white/10 hover:text-emerald-500'
                            }`}
                          >
                            {isPresent ? <><CheckCircle2 className="w-3 h-3 mr-1.5" /> Present</> : <><XCircle className="w-3 h-3 mr-1.5" /> Absent</>}
                          </Button>
                        </div>
                      );
                    })}
                    {enrolledStudents.length === 0 && (
                      <div className="py-12 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No students enrolled</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-white/1 rounded-3xl border border-dashed border-slate-100 dark:border-white/5">
                  <Users className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Select a session to manage attendance</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
