import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useMeetings } from "../../context/MeetingsContext";
import { copyToClipboard, copyToClipboardQuiet } from "@/src/lib/safeClipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, Link as LinkIcon, 
  Clock, Users, Copy, Check, ExternalLink, Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function VisualCalendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date();
  });
  const { meetings: allMeetings, loading } = useMeetings();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [user, setUser] = useState<any>(null);
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    async function loadStudent() {
      if (supabase) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            setUser(sbUser);
            setStudentEmail(sbUser.email || "");
          }
        } catch (e) {
          console.warn("VisualCalendar: auth check failed silently:", e);
        }
      }
    }
    loadStudent();
  }, []);

  const meetings = allMeetings.filter((meeting: any) => {
    // 1. If explicit ID match, show it
    if (user?.id && meeting.student_id === user.id) return true;

    // 2. Fallback to email matching
    if (!meeting.invitee_email) return true; // Empty means public
    const target = meeting.invitee_email.trim().toLowerCase();
    if (target === "all-students@sebs.edu" || target === "") return true;
    
    if (!studentEmail) return true; // Fallback if not logged in
    const emails = target.split(",").map((e: string) => e.trim().toLowerCase());
    return emails.includes(studentEmail.trim().toLowerCase());
  });

  const handleJoinMeet = (url: string) => {
    try {
      window.open(url, "_blank");
    } catch (e) {}

    // Safely copy to clipboard silently
    copyToClipboardQuiet(url);

    toast.success(
      <div className="space-y-1">
        <p className="font-extrabold text-xs text-slate-900">Opening Google Meet...</p>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          The link has been copied to your clipboard. If the popup was blocked by your browser, tap below to launch:
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1 text-[11.5px] underline font-black text-indigo-600 hover:text-indigo-700 mt-1 cursor-pointer"
        >
          Go to Google Meet Space
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>,
      { duration: 10000 }
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Days calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Calendar matrix of days
  const calendarDays: (Date | null)[] = [];
  // Fill empty spacer days for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Fill actual month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Check if a day has meetings scheduled
  const getMeetingsForDay = (date: Date) => {
    return meetings.filter(m => {
      const meetDate = new Date(m.scheduled_start);
      return meetDate.getFullYear() === date.getFullYear() &&
             meetDate.getMonth() === date.getMonth() &&
             meetDate.getDate() === date.getDate();
    });
  };

  const selectedDayMeetings = selectedDate ? getMeetingsForDay(selectedDate) : [];

  const handleCopyLink = (meetingUrl: string) => {
    const fallbackLink = meetingUrl || window.location.href;
    copyToClipboard(fallbackLink, "Meeting room share link copied to clipboard!");
  };

  return (
    <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col h-full min-h-[460px]">
      <CardHeader className="bg-gradient-to-r from-indigo-900/10 via-teal-900/5 to-transparent border-b border-slate-100 dark:border-white/5 py-5 px-6 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-white">
              <CalendarIcon className="w-5 h-5 text-indigo-500 animate-pulse" />
              Live Class Schedule
            </CardTitle>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-extrabold uppercase tracking-wide">
              Dates highlighted in purple have scheduled live classes
            </p>
          </div>
          <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-wider px-2 py-0.5">
            Interactive Calendar
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
        
        {/* Calendar Navigation and Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              {currentDate.toLocaleString("default", { month: "long" })} {year}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevMonth} 
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextMonth} 
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] uppercase text-slate-400 tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(w => (
              <div key={w} className="py-1">{w}</div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const meetCount = getMeetingsForDay(day).length;
              const isSelected = selectedDate && 
                                 selectedDate.getFullYear() === day.getFullYear() && 
                                 selectedDate.getMonth() === day.getMonth() && 
                                 selectedDate.getDate() === day.getDate();
              
              const isToday = new Date().getFullYear() === day.getFullYear() && 
                              new Date().getMonth() === day.getMonth() && 
                              new Date().getDate() === day.getDate();

              return (
                <button
                  key={`day-${day.getDate()}`}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer font-extrabold text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 ${
                    isSelected 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105" 
                      : isToday 
                        ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-500/50" 
                        : "hover:bg-slate-50 dark:hover:bg-white/5 bg-slate-50/30 dark:bg-slate-900/30"
                  }`}
                >
                  <span>{day.getDate()}</span>
                  
                  {/* Indicator Dot for Live meetings */}
                  {meetCount > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                      isSelected ? "bg-white animate-pulse" : "bg-indigo-500 animate-bounce"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Segment */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-5 min-h-[160px] flex flex-col justify-start">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            Agenda for {selectedDate?.toLocaleDateString(undefined, { dateStyle: "medium" })}
          </p>

          {loading ? (
            <p className="text-[11px] text-slate-400 font-bold italic py-4">Syncing meeting logs...</p>
          ) : selectedDayMeetings.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50/20 dark:bg-slate-900/20">
              <p className="text-xs font-bold text-slate-450 dark:text-slate-400">No scheduled classrooms on this date</p>
              <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">Explore other dates with indicator dots</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
              {selectedDayMeetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/2 hover:border-indigo-500/20 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white leading-tight">
                      {meeting.title}
                    </span>
                    <Badge className="bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-500 border-none font-bold text-[8px] uppercase tracking-wider py-0.5 px-1.5 flex items-center gap-1">
                      {meeting.meeting_type === "google_meet" ? "Google Meet" : "Embedded Cell"}
                    </Badge>
                  </div>

                  {meeting.description && (
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-extrabold text-slate-400 pt-1">
                    <span className="flex items-center gap-1 uppercase">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {new Date(meeting.scheduled_start).toLocaleTimeString(undefined, { timeStyle: "short" })} &bull; {meeting.duration_minutes}m
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(meeting.meeting_url || `${window.location.origin}/dashboard?tab=embedded-calling&joinRoom=${meeting.room_id}`)}
                        className="h-7 text-[9px] tracking-wide font-black uppercase text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/5 rounded-lg border border-slate-200 dark:border-white/10 px-2 flex items-center gap-1"
                        title="Copy Meeting Link"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Link
                      </Button>

                      {meeting.meeting_url && meeting.meeting_url !== "#" ? (
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={meeting.meeting_url} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <Button 
                              onClick={(e) => { e.preventDefault(); handleJoinMeet(meeting.meeting_url); }}
                              size="sm" 
                              className="h-7 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[9px] uppercase px-2 rounded-lg flex items-center gap-1"
                            >
                              Join Meet
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                          <Button 
                            onClick={() => {
                              toast.success(`Redirecting to built-in virtual room ${meeting.room_id}...`);
                              window.location.href = `/dashboard?tab=embedded-calling&room=${meeting.room_id}`;
                            }}
                            size="sm" 
                            className="h-7 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-[9px] uppercase px-2 rounded-lg flex items-center gap-1"
                            title="Direct Built-in Call alternative"
                          >
                            Join Peer
                            <Video className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => {
                            toast.success(`Redirecting to built-in virtual voice calling room ${meeting.room_id}...`);
                            // Quick transfer to the embedded calling workspace
                            window.location.href = `/dashboard?tab=embedded-calling&room=${meeting.room_id}`;
                          }}
                          size="sm" 
                          className="h-7 bg-sky-500 hover:bg-sky-600 text-slate-900 font-black text-[9px] uppercase px-2.5 rounded-lg flex items-center gap-1"
                        >
                          Join Peer
                          <Video className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
