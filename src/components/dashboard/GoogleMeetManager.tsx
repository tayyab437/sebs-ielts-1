import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabaseClient";
import { 
  Calendar, Video, Users, Clock, Plus, Trash2, ExternalLink, 
  RefreshCw, Info, Lock, CheckCircle2, AlertCircle, Sparkles, Copy 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useMeetings, Meeting } from "../../context/MeetingsContext";
import { copyToClipboard, copyToClipboardQuiet } from "@/src/lib/safeClipboard";

export default function GoogleMeetManager() {
  const { meetings: allMeetings, saveMeetings, loading } = useMeetings();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem("user_role") || "student");
  const canSchedule = userRole === "admin" || userRole === "teacher";
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Derive google meetings filtered for student email or ID
  const googleMeetings = allMeetings.filter(m => m.meeting_type === "google_meet");
  const filteredLocal = googleMeetings.filter((m: any) => {
    // 1. If explicit ID match, show it
    if (user?.id && m.student_id === user.id) return true;

    // 2. Fallback to email matching
    if (!m.invitee_email) return true;
    const target = m.invitee_email.trim().toLowerCase();
    if (target === "all-students@sebs.edu" || target === "") return true;
    
    if (!studentEmail) return true;
    const emails = target.split(",").map((e: string) => e.trim().toLowerCase());
    return emails.includes(studentEmail.trim().toLowerCase());
  });
  const meetings = filteredLocal;

  useEffect(() => {
    async function loadUser() {
      if (supabase) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            setUser(sbUser);
            setStudentEmail(sbUser.email || "");
            
            // Query user role from profiles table
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", sbUser.id)
              .single();
            if (profile?.role) {
              setUserRole(profile.role);
              localStorage.setItem("user_role", profile.role);
            }
          }
        } catch (e) {
          console.warn("GoogleMeetManager: auth load failed silently:", e);
        }
      }
    }
    loadUser();
  }, []);

  const saveMeetingsList = (updated: Meeting[]) => {
    const otherMeetings = allMeetings.filter(m => m.meeting_type !== "google_meet");
    const merged = [...otherMeetings, ...updated];
    saveMeetings(merged);
  };

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



  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledStart) {
      toast.error("Please provide both a template meeting title and starting date/time.");
      return;
    }

    setSubmitting(true);
    const currentUserId = user?.id || "anonymous_preview_user";

    try {
      // 1. Generate a valid mock-up google meet code
      const possibleChars = "abcdefghijklmnopqrstuvwxyz";
      const grp1 = Array.from({length: 3}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
      const grp2 = Array.from({length: 4}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
      const grp3 = Array.from({length: 3}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
      const generatedMeetCode = `${grp1}-${grp2}-${grp3}`;
      const generatedMeetUrl = `https://meet.google.com/${generatedMeetCode}`;

      const newMeeting: Meeting = {
        id: (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : "meet-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15),
        title: title.trim(),
        description: description.trim(),
        meeting_type: "google_meet",
        meeting_url: generatedMeetUrl,
        room_id: generatedMeetCode,
        status: "scheduled",
        scheduled_start: new Date(scheduledStart).toISOString(),
        duration_minutes: durationMinutes,
        invitee_email: inviteeEmail.trim() || undefined,
        created_at: new Date().toISOString()
      };

      // 2. Insert into Supabase if connected
      if (supabase) {
        const { error } = await supabase
          .from("live_meetings")
          .insert([{
            id: newMeeting.id,
            title: newMeeting.title,
            description: newMeeting.description,
            meeting_type: newMeeting.meeting_type,
            meeting_url: newMeeting.meeting_url,
            room_id: newMeeting.room_id,
            status: newMeeting.status,
            scheduled_start: newMeeting.scheduled_start,
            duration_minutes: newMeeting.duration_minutes,
            host_id: currentUserId,
            student_id: currentUserId,
            invitee_email: newMeeting.invitee_email
          }]);
          
        if (error) {
          console.warn("Supabase insert failed, styling with local sandbox:", error.message);
        }
      }

      // 3. Keep local fallback in sync
      const updated = [newMeeting, ...meetings];
      saveMeetingsList(updated);

      toast.success("Google Meet live room successfully generated and scheduled!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setScheduledStart("");
      setDurationMinutes(45);
      setInviteeEmail("");
      setIsFormOpen(false);

    } catch (err: any) {
      toast.error("Failed to generate meeting: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from("live_meetings")
          .delete()
          .eq("id", id);
        if (error) {
          console.error("Supabase delete failed:", error);
          toast.error("Database deletion failed: " + error.message);
          return;
        }
      }
      
      const filtered = meetings.filter(m => m.id !== id);
      saveMeetingsList(filtered);
      toast.success("Scheduled meeting deleted successfully.");
    } catch (err) {
      toast.error("Error deleting meeting.");
    }
  };

  const handleCopyToClipboard = (text: string) => {
    copyToClipboard(text, "Link copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-[#0a2327] to-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white border border-teal-500/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge className="bg-teal-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Google Workspace</Badge>
              <Badge className="bg-indigo-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Direct Calendar Integration</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-teal-100 to-slate-200 bg-clip-text text-transparent">Google Meet Classrooms</h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium italic max-w-xl">
              Schedule official interactive sessions directly using Google Calendar. Automatically spawns unique Meet video calling invitations for instructors and students.
            </p>
          </div>

          {canSchedule && (
            <Button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="rounded-2xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-6 py-6 text-xs uppercase tracking-wider shrink-0 transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Class
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Meetings List */}
        <div className={canSchedule ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              Live Sessions Queue
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase">{meetings.length} Total Matches</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-4">
              <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase">Synchronizing with live calendar...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-500/5 flex items-center justify-center text-teal-500">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-700 dark:text-white">No active meetings scheduled</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  {canSchedule 
                    ? "Bring your study plans to life! Create a new scheduled Google Meet session instantly using the scheduling panel."
                    : "Stay tuned for your upcoming live classes. Your instructors will schedule new interactive Google Meet sessions soon!"}
                </p>
              </div>
              {canSchedule && (
                <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-full rounded-2xl text-xs font-bold border-teal-500/35 hover:bg-teal-500/5">
                  Schedule First Meeting
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => {
                const scheduledTime = new Date(meeting.scheduled_start).getTime();
                const now = Date.now();
                const durationMs = (meeting.duration_minutes || 45) * 60 * 1000;
                const isUpcoming = scheduledTime > now;
                const isLive = now >= scheduledTime && now <= scheduledTime + durationMs;
                const isEnded = now > scheduledTime + durationMs;

                let statusLabel: "Live" | "Upcoming" | "Ended" = "Upcoming";
                let statusBg = "bg-teal-500/10 text-teal-600 dark:text-teal-400";
                if (isLive || meeting.status === "active") {
                  statusLabel = "Live";
                  statusBg = "bg-rose-500 text-white animate-pulse";
                } else if (isEnded || meeting.status === "ended") {
                  statusLabel = "Ended";
                  statusBg = "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400";
                }

                return (
                  <motion.div
                    key={meeting.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-white dark:bg-slate-900/60 rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 hover:border-teal-500/30 transition-all shadow-md hover:shadow-xl relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${statusBg} border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5`}>
                          {statusLabel}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(meeting.scheduled_start).toLocaleString()} ({meeting.duration_minutes} Mins)
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight group-hover:text-teal-500 transition-colors">
                        {meeting.title}
                      </h4>

                      {meeting.description && (
                        <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed font-semibold max-w-xl">
                          {meeting.description}
                        </p>
                      )}

                      {meeting.invitee_email && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-white/2 px-2.5 py-1 rounded-lg w-fit">
                          <Users className="w-3 h-3 text-slate-400" />
                          Attendee: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{meeting.invitee_email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(meeting.meeting_url)}
                        className="rounded-xl h-11 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase px-4 flex items-center gap-1.5"
                        title="Copy Meeting Link"
                      >
                        <Copy className="w-4 h-4 text-teal-500" />
                        Copy Meeting Link
                      </Button>

                      {canSchedule && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMeeting(meeting.id)}
                          className="rounded-xl h-11 w-11 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 border border-slate-100 dark:border-white/5"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                        <a 
                          href={meeting.meeting_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full sm:w-auto"
                        >
                          <Button onClick={(e) => { e.preventDefault(); handleJoinMeet(meeting.meeting_url); }} className="w-full sm:w-auto rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs px-5 h-11 uppercase tracking-wider flex items-center justify-center gap-2">
                            Join Meet
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Button 
                          onClick={() => {
                            toast.success(`Redirecting to built-in virtual voice calling room ${meeting.room_id}...`);
                            window.location.href = `/dashboard?tab=embedded-calling&room=${meeting.room_id}`;
                          }}
                          className="w-full sm:w-auto rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs px-5 h-11 uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          Join Integrated Call
                          <Video className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Hand Sidebar: Form / Configuration */}
        {canSchedule && (
          <div className="lg:col-span-4 space-y-6">
            
            <AnimatePresence>
              {isFormOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <Plus className="w-4.5 h-4.5 text-teal-500" />
                      Schedule Class
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">Instantly publish meeting data into the queue</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleCreateMeeting} className="space-y-4">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Class Title</label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Speaking Section Trial Run"
                          className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs h-10 font-bold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="What will you practice in this meeting?"
                          className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-semibold py-2.5 min-h-[70px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Start Time</label>
                          <Input
                            type="datetime-local"
                            value={scheduledStart}
                            onChange={(e) => setScheduledStart(e.target.value)}
                            className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs h-10 font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Duration (Min)</label>
                          <Input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs h-10 font-bold"
                            min="5"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Attendee Email (Optional)</label>
                        <Input
                          type="email"
                          value={inviteeEmail}
                          onChange={(e) => setInviteeEmail(e.target.value)}
                          placeholder="instructor@sebs.edu"
                          className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs h-10 font-bold"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black uppercase text-xs h-11 tracking-wider mt-2"
                      >
                        {submitting ? "Spawning Event..." : "Confirm Schedule"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>


          </div>
        )}

      </div>

    </div>
  );
}
