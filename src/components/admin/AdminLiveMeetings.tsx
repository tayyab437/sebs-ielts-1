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
  RefreshCw, Info, Lock, CheckCircle2, AlertCircle, Copy, Link, Laptop, ShieldCheck,
  History
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { 
  initGoogleAuth, 
  googleSignIn, 
  googleSignOut, 
  createGoogleMeetSpace 
} from "@/src/lib/googleMeetHelper";

import { useMeetings, Meeting } from "../../context/MeetingsContext";
import { copyToClipboard } from "@/src/lib/safeClipboard";

export default function AdminLiveMeetings() {
  const { meetings, loading, saveMeetings } = useMeetings();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingType, setMeetingType] = useState<"google_meet" | "embedded_calling">("google_meet");
  const [scheduledStart, setScheduledStart] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [customRoomId, setCustomRoomId] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  // Google Meet Auth states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Enrolled and registered student list state
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      if (!supabase) {
        // High fidelity fallbacks for static development
        setRegisteredStudents([
          { id: "mock-s1", name: "Sarah Connor (IELTS Premium Academic)", email: "sarah.connor@sebs.edu", plan: "Pro Premium" },
          { id: "mock-s2", name: "Marcus Wright (General Training Course)", email: "marcus.wright@sebs.edu", plan: "Mastery Ultimate" },
          { id: "mock-s3", name: "Clara Oswald (Speaking-focused Intensive)", email: "clara.oswald@sebs.edu", plan: "Free Trial" },
          { id: "mock-s4", name: "Kyle Reese (Academic Writing Focus)", email: "kyle.reese@sebs.edu", plan: "Pro Premium" }
        ]);
        return;
      }
      try {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, plan")
          .order("created_at", { ascending: false });

        const { data: sData } = await supabase
          .from("students")
          .select("id, first_name, last_name, email")
          .order("created_at", { ascending: false });

        const profiles = pData || [];
        const manualStudents = sData || [];

        const profileStudents = profiles.map((p: any) => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email?.split('@')[0] || "User",
          email: p.email,
          plan: p.plan || p.enrolled_plan || "Free Trial"
        }));

        const combined = [...profileStudents];
        manualStudents.forEach((ms: any) => {
          if (!combined.some(cs => cs.email === ms.email)) {
            combined.push({
              id: ms.id,
              name: `${ms.first_name || ''} ${ms.last_name || ''}`.trim() || ms.email?.split('@')[0] || "User",
              email: ms.email,
              plan: "Enrolled Candidate"
            });
          }
        });

        if (combined.length === 0) {
          combined.push(
            { id: "mock-s1", name: "Sarah Connor (IELTS Premium Academic)", email: "sarah.connor@sebs.edu", plan: "Pro Premium" },
            { id: "mock-s2", name: "Marcus Wright (General Training Course)", email: "marcus.wright@sebs.edu", plan: "Mastery Ultimate" },
            { id: "mock-s3", name: "Clara Oswald (Speaking-focused Intensive)", email: "clara.oswald@sebs.edu", plan: "Free Trial" },
            { id: "mock-s4", name: "Kyle Reese (Academic Writing Focus)", email: "kyle.reese@sebs.edu", plan: "Pro Premium" }
          );
        }

        setRegisteredStudents(combined);
      } catch (err) {
        console.warn("Could not query registered active students:", err);
      }
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (gUser, token) => {
        setGoogleUser(gUser);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        toast.success(`Google Account connected: ${result.user.email}`);
      }
    } catch (err: any) {
      toast.error("Google connection failed: " + err.message);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      toast.success("Disconnected from Google services");
    } catch (err: any) {
      toast.error("Google disconnect failed: " + err.message);
    }
  };

  useEffect(() => {
    async function loadUser() {
      if (supabase) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            setUser(sbUser);
          }
        } catch (e) {
          console.warn("AdminLiveMeetings: auth check failed silently:", e);
        }
      }
    }
    loadUser();
  }, []);

  const saveToStorageAndState = (updated: Meeting[]) => {
    saveMeetings(updated);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledStart) {
      toast.error("Please provide both a meeting title and starting date/time.");
      return;
    }

    setSubmitting(true);
    const currentUserId = user?.id || "anonymous_preview_user";

    try {
      let finalRoomId = customRoomId.trim();
      let finalUrl = customUrl.trim();

      // Ensure appropriate defaults if empty
      if (meetingType === "google_meet") {
        if (!finalUrl && googleToken) {
          try {
            toast.loading("Generating real Google Meet space...", { id: "generate-meet" });
            const meetSpace = await createGoogleMeetSpace(googleToken);
            finalRoomId = meetSpace.meetingCode || "";
            finalUrl = meetSpace.meetingUri;
            toast.success("Authentic Google Meet space generated!", { id: "generate-meet" });
          } catch (meetErr: any) {
            console.error("Failed to generate Google Meet space:", meetErr);
            toast.error("Meet Space Generation Failed: " + meetErr.message, { id: "generate-meet" });
            throw meetErr;
          }
        } else if (!finalUrl && !googleToken) {
          // If no token, check if they want to connect. If they decline or connect fails, use fallback
          const autoConnect = window.confirm(
            "Configure Google Meet: Connect your Google Account to automatically generate an authentic Google Meet Link? Otherwise, a simulated preview room will be created."
          );
          if (autoConnect) {
            try {
              const result = await googleSignIn();
              if (result) {
                setGoogleUser(result.user);
                setGoogleToken(result.accessToken);
                toast.loading("Google connected! Spawning Google Meet space...", { id: "generate-meet" });
                const meetSpace = await createGoogleMeetSpace(result.accessToken);
                finalRoomId = meetSpace.meetingCode || "";
                finalUrl = meetSpace.meetingUri;
                toast.success("Authentic Google Meet space generated!", { id: "generate-meet" });
              } else {
                throw new Error("Sign-in cancelled");
              }
            } catch (authErr: any) {
              toast.error("Google Auth failed: " + authErr.message + ". Falling back to simulated meet code.");
              if (!finalRoomId) {
                const possibleChars = "abcdefghijklmnopqrstuvwxyz";
                const grp1 = Array.from({length: 3}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
                const grp2 = Array.from({length: 4}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
                const grp3 = Array.from({length: 3}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
                finalRoomId = `${grp1}-${grp2}-${grp3}`;
              }
              finalUrl = `${window.location.origin}/dashboard?tab=embedded-calling&room=${finalRoomId}`;
            }
          } else {
            if (!finalRoomId) {
              const possibleChars = "abcdefghijklmnopqrstuvwxyz";
              const grp1 = Array.from({length: 3}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
              const grp2 = Array.from({length: 4}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
              const grp3 = Array.from({length: 3}, () => possibleChars[Math.floor(Math.random() * 26)]).join("");
              finalRoomId = `${grp1}-${grp2}-${grp3}`;
            }
            finalUrl = `${window.location.origin}/dashboard?tab=embedded-calling&room=${finalRoomId}`;
          }
        }
      } else {
        // embedded calling
        if (!finalRoomId) {
          finalRoomId = "SEBS-" + Math.floor(1000 + Math.random() * 9000);
        }
        finalUrl = "#";
      }

      // Try to identify a single student_id if only one email is provided
      let targetStudentId: string | undefined = undefined;
      const emails = inviteeEmail.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (emails.length === 1) {
        const found = registeredStudents.find(s => s.email.toLowerCase() === emails[0]);
        if (found) targetStudentId = found.id;
      }

      const newMeeting: Meeting = {
        id: (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : "meet-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15),
        title: title.trim(),
        description: description.trim(),
        meeting_type: meetingType,
        meeting_url: finalUrl,
        room_id: finalRoomId,
        status: "scheduled",
        scheduled_start: new Date(scheduledStart).toISOString(),
        duration_minutes: durationMinutes,
        invitee_email: inviteeEmail.trim() || undefined,
        created_at: new Date().toISOString()
      };

      // Try saving to Supabase
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
            student_id: targetStudentId,
            invitee_email: newMeeting.invitee_email
          }]);

        if (error) {
          console.warn("Supabase meeting write error, adding locally & continuing:", error.message);
        }
      }

      const updated = [newMeeting, ...meetings];
      saveToStorageAndState(updated);

      toast.success(`${meetingType === "google_meet" ? "Google Meet" : "Embedded Calling"} class created beautifully!`);

      // Reset form fields
      setTitle("");
      setDescription("");
      setScheduledStart("");
      setDurationMinutes(45);
      setInviteeEmail("");
      setCustomRoomId("");
      setCustomUrl("");

    } catch (err: any) {
      toast.error("Failed to submit scheduled meeting: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeeting = async (id: string) => {
    const isConfirmed = window.confirm("Permanently delete this meeting session? This action will remove it from all student calendars and cannot be undone.");
    if (!isConfirmed) return;

    try {
      if (supabase && !id.startsWith("mock-")) {
        const { error } = await supabase.from("live_meetings").delete().eq("id", id);
        if (error) {
          console.warn("Supabase delete failed (continuing with local removal):", error);
          // We don't return early here, we still want to remove it locally for a better UX
        }
      }
      const filtered = meetings.filter(m => m.id !== id);
      saveToStorageAndState(filtered);
      toast.success("Meeting record purged successfully.");
    } catch (err) {
      console.error("Error encountered during record deletion:", err);
      toast.error("Error encountered during record deletion.");
    }
  };

  const copyLink = (txt: string) => {
    copyToClipboard(txt, "Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-900 p-8 rounded-[2.5rem] border border-indigo-500/10 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/15 to-transparent pointer-events-none" />
         <div className="max-w-2xl relative z-10 space-y-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1">Classroom desk</Badge>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter">Live Classes & Call Orchestrator</h2>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold italic">
               Administrate both official Google Meet Classrooms and dynamic, integrated WebRTC Webcalling corridors for your students instantly.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left hand side: Form scheduler */}
        <div className="lg:col-span-4">
          <Card className="rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
             <CardHeader className="p-6 bg-slate-50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                   <Plus className="w-4 h-4 text-primary" />
                   Publish Live Session
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Fills student calendars globally with calling triggers</CardDescription>
             </CardHeader>
             <CardContent className="p-6">
                <form onSubmit={handleCreateMeeting} className="space-y-4">
                   
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Classroom Type</label>
                    {meetingType === "google_meet" && (
                       <div className="mb-2 p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/10 space-y-1.5">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                   <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${googleToken ? "bg-teal-400" : "bg-amber-400"}`}></span>
                                   <span className={`relative inline-flex rounded-full h-2 w-2 ${googleToken ? "bg-teal-500" : "bg-amber-500"}`}></span>
                                </span>
                                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-teal-400 tracking-wide">
                                   {googleToken ? "Google Integrated" : "Google Disconnected"}
                                </span>
                             </div>
                             {googleToken && (
                                <button
                                  type="button"
                                  onClick={handleDisconnectGoogle}
                                  className="text-[9px] font-bold uppercase text-red-500 hover:underline cursor-pointer"
                                >
                                   Disconnect
                                </button>
                             )}
                          </div>
                          {googleToken ? (
                             <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                Connected as <span className="text-teal-600 dark:text-teal-400">{googleUser?.email || "Google Account"}</span>
                             </div>
                          ) : (
                             <div className="flex items-center justify-between gap-2">
                                <p className="text-[9px] text-slate-500 font-semibold leading-tight">
                                   No account linked.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleConnectGoogle}
                                  className="h-6 px-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
                                >
                                   Authorize Meet (Open in New Tab if Popup Blocks)
                                </button>
                             </div>
                          )}
                       </div>
                    )}
                      <div className="grid grid-cols-2 gap-2">
                         <button
                           type="button"
                           onClick={() => setMeetingType("google_meet")}
                           className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                             meetingType === "google_meet"
                               ? "bg-teal-500/15 text-teal-600 border-teal-500/30"
                               : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500"
                           }`}
                         >
                            Google Meet
                         </button>
                         <button
                           type="button"
                           onClick={() => setMeetingType("embedded_calling")}
                           className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                             meetingType === "embedded_calling"
                               ? "bg-sky-500/15 text-sky-600 border-sky-500/30"
                               : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500"
                           }`}
                         >
                            Embedded Call
                         </button>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Lesson / Room Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Masterclass on IELTS cue cards"
                        className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold h-10"
                        required
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Class Syllabus Description</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Topics, study targets or reading resources..."
                        className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-semibold py-2 min-h-[70px]"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-slate-400">Start Time</label>
                         <Input
                           type="datetime-local"
                           value={scheduledStart}
                           onChange={(e) => setScheduledStart(e.target.value)}
                           className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold h-10"
                           required
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-slate-400">Duration (Mins)</label>
                         <Input
                           type="number"
                           value={durationMinutes}
                           onChange={(e) => setDurationMinutes(Number(e.target.value))}
                           className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold h-10"
                           min="5"
                           required
                         />
                      </div>
                   </div>

                   <div className="space-y-1">
                    <div className="space-y-2.5 border-t border-slate-100 dark:border-white/5 pt-3">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase text-slate-400">
                           Enrolled & Registered Students ({registeredStudents.length})
                         </label>
                         <div className="flex items-center gap-2">
                           <button
                             type="button"
                             onClick={() => {
                               const allEmails = registeredStudents.map(s => s.email).filter(Boolean);
                               setInviteeEmail(allEmails.join(", "));
                             }}
                             className="text-[9.5px] font-black text-indigo-500 dark:text-indigo-400 hover:underline uppercase tracking-wider"
                           >
                             All Students
                           </button>
                           <span className="text-slate-200 dark:text-white/10 text-[9px] font-bold">|</span>
                           <button
                             type="button"
                             onClick={() => setInviteeEmail("")}
                             className="text-[9.5px] font-black text-rose-500 hover:underline uppercase tracking-wider"
                           >
                             Clear
                           </button>
                         </div>
                      </div>

                      <div className="border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl p-2.5 max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-thin">
                        {registeredStudents.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic p-1">No enrolled students detected.</p>
                        ) : (
                          registeredStudents.map((student) => {
                            const currentEmails = inviteeEmail.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
                            const isSelected = currentEmails.includes(student.email.trim().toLowerCase());
                            
                            return (
                              <div 
                                key={student.id}
                                onClick={() => {
                                  let emails = inviteeEmail.split(",").map(e => e.trim()).filter(Boolean);
                                  const targetEmail = student.email.trim();
                                  if (emails.some(e => e.toLowerCase() === targetEmail.toLowerCase())) {
                                    emails = emails.filter(e => e.toLowerCase() !== targetEmail.toLowerCase());
                                  } else {
                                    emails.push(targetEmail);
                                  }
                                  setInviteeEmail(emails.join(", "));
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                                  isSelected 
                                    ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50" 
                                    : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                    isSelected 
                                      ? "bg-indigo-500 border-indigo-500 text-white" 
                                      : "border-slate-300 dark:border-white/15"
                                  }`}>
                                    {isSelected && (
                                      <svg className="w-2.5 h-2.5 stroke-[3] stroke-white fill-none" viewBox="0 0 24 24">
                                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                                      {student.name}
                                    </p>
                                    <p className="text-[9px] font-mono text-slate-550 font-bold leading-none">
                                      {student.email}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`text-[8px] font-black uppercase scale-90 px-1.5 py-0 ${
                                  student.plan?.toLowerCase().includes("pro") 
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/15" 
                                    : student.plan?.toLowerCase().includes("mastery")
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                                    : "bg-slate-500/10 text-slate-400 border border-slate-500/10"
                                }`}>
                                  {student.plan || "Free"}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-slate-400">Student Invitee Email List</label>
                         <Input
                           type="text"
                           value={inviteeEmail}
                           onChange={(e) => setInviteeEmail(e.target.value)}
                           placeholder="all-candidates@sebs.edu"
                           className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold h-10"
                         />
                         <p className="text-[9px] text-slate-400 leading-normal font-medium">
                           Click students in the list above to toggle invitations. Separate custom emails with commas.
                         </p>
                      </div>
                    </div>
                   </div>

                   <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-white/5">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                         {meetingType === "google_meet" ? "Custom Meet URL (Optional)" : "Custom Room ID Code (Optional)"}
                      </label>
                      {meetingType === "google_meet" ? (
                        <div className="space-y-1">
                          <Input
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="e.g. https://meet.google.com/xxx-xxxx-xxx"
                            className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold h-10"
                          />
                          <p className="text-[9px] text-amber-600 dark:text-amber-500 font-extrabold uppercase tracking-wide leading-relaxed">
                            ⚠️ Enter an authentic Google Meet link. If omitted, students can instantly fall back to our integrated WebRTC video classroom instead.
                          </p>
                        </div>
                      ) : (
                        <Input
                          value={customRoomId}
                          onChange={(e) => setCustomRoomId(e.target.value)}
                          placeholder="e.g. SEBS-IELTS-ROOM"
                          className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold h-10 uppercase"
                        />
                      )}
                   </div>

                   <Button
                     type="submit"
                     disabled={submitting}
                     className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-transform hover:scale-[1.01]"
                   >
                     {submitting ? "Publishing Class..." : "Generate Scheduled Room"}
                   </Button>

                </form>
             </CardContent>
          </Card>
        </div>

        {/* Right hand side: Scheduled Rooms Pipeline */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-indigo-500" />
                 Active Managed Classes
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase">{meetings.length} Total</span>
           </div>

           {loading ? (
             <div className="p-12 text-center bg-white dark:bg-slate-900 border rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase">Fetching schedules...</p>
             </div>
           ) : (
             <div className="space-y-4">
                {(() => {
                  const now = new Date();
                  const activeMeetings = meetings.filter(m => {
                    const endTime = new Date(new Date(m.scheduled_start).getTime() + (m.duration_minutes || 45) * 60000);
                    return endTime >= now;
                  }).sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());

                  if (activeMeetings.length === 0) {
                    return (
                      <div className="p-16 text-center border-2 border-dashed rounded-[2.5rem] bg-white dark:bg-slate-900 space-y-4">
                         <History className="w-10 h-10 text-slate-300 mx-auto" />
                         <div>
                            <p className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-tighter italic">No Active Managed Classes</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Utilize the Publishing panel to spawn new sessions!</p>
                         </div>
                      </div>
                    );
                  }

                  return activeMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow hover:shadow-lg transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6"
                    >
                     <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <Badge className={`${
                             meeting.meeting_type === "google_meet"
                               ? "bg-teal-500 text-slate-950"
                               : "bg-sky-500 text-slate-950"
                           } border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5`}>
                              {meeting.meeting_type === "google_meet" ? "Google Meet" : "Embedded Calling"}
                           </Badge>
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(meeting.scheduled_start).toLocaleString()} &bull; {meeting.duration_minutes} Mins
                           </span>
                        </div>

                        <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                           {meeting.title}
                        </h4>

                        {meeting.description && (
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xl">
                             {meeting.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2.5">
                           <div className="text-[9px] font-bold bg-slate-55 bg-slate-100 dark:bg-white/5 py-1 px-2.5 rounded-lg text-slate-500 flex items-center gap-1">
                              Room ID: <span className="font-mono text-indigo-500 dark:text-indigo-400 font-extrabold uppercase select-all">{meeting.room_id}</span>
                           </div>
                           {meeting.invitee_email && (
                             <div className="text-[9px] font-bold bg-slate-100 dark:bg-white/5 py-1 px-2.5 rounded-lg text-indigo-500 flex items-center gap-1">
                                Student/Invitee: <span className="font-extrabold">{meeting.invitee_email}</span>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button
                          onClick={() => {
                            const url = meeting.meeting_type === "google_meet"
                              ? meeting.meeting_url
                              : `/dashboard?tab=embedded-calling&room=${meeting.room_id}`;
                            window.open(url, "_blank");
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Video className="w-4 h-4" />
                          Access Meeting
                        </Button>
                        {meeting.meeting_type === "google_meet" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyLink(meeting.meeting_url)}
                            className="rounded-xl h-11 w-11 border border-slate-100 dark:border-white/5"
                            title="Copy Meet Link"
                          >
                             <Copy className="w-4 h-4 text-slate-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyLink(meeting.room_id)}
                            className="rounded-xl h-11 w-11 border border-slate-100 dark:border-white/5"
                            title="Copy Room ID Code"
                          >
                             <Link className="w-4 h-4 text-slate-500" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMeeting(meeting.id)}
                          className="rounded-xl h-11 w-11 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Delete Lesson"
                        >
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
                ))
              })()}
            </div>
          )}

           {/* Meeting History Logs Section */}
          <Card className="rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden mb-6">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-white">
                    <Laptop className="w-5 h-5 text-rose-500" />
                    Session History & Expired Classes
                  </CardTitle>
                  <p className="text-slate-400 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                    Full audit archives of meetings that have reached their capacity or time limit
                  </p>
                </div>
                {(() => {
                  const now = new Date();
                  const pastCount = meetings.filter(m => {
                    const endTime = new Date(new Date(m.scheduled_start).getTime() + (m.duration_minutes || 45) * 60000);
                    return endTime < now;
                  }).length;
                  return (
                    <Badge className="bg-rose-500/10 text-rose-500 font-bold border-none text-[10px] px-3 py-1 uppercase rounded-full">
                      {pastCount} Completed Sessions
                    </Badge>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="py-4 px-6">Meeting & Description</th>
                      <th className="py-2.5 px-4">Date / Time</th>
                      <th className="py-2.5 px-4">Platform</th>
                      <th className="py-2.5 px-4">Invitee</th>
                      <th className="py-2.5 px-4">Room Token</th>
                      <th className="py-2.5 px-4 text-center">Duration</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const now = new Date();
                      const pastMeetings = meetings.filter(m => {
                        const endTime = new Date(new Date(m.scheduled_start).getTime() + (m.duration_minutes || 45) * 60000);
                        return endTime < now;
                      }).sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime());

                      if (pastMeetings.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-xs font-bold text-slate-400 uppercase italic">
                              No history records found yet
                            </td>
                          </tr>
                        );
                      }

                      return pastMeetings.map((m) => {
                        const scheduledTime = new Date(m.scheduled_start).getTime();
                        const n = Date.now();
                        const durationMs = (m.duration_minutes || 45) * 60 * 1000;
                        const isLive = n >= scheduledTime && n <= scheduledTime + durationMs;
                        const isEnded = n > scheduledTime + durationMs;
                        
                        let statusLabel = "Upcoming";
                        let statusColor = "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
                        if (isLive || m.status === "active") {
                          statusLabel = "Live";
                          statusColor = "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse";
                        } else if (isEnded || m.status === "ended") {
                          statusLabel = "Ended";
                          statusColor = "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5";
                        }

                        return (
                          <tr key={m.id} className="border-b border-slate-100 dark:border-white/5 text-[11px] font-bold hover:bg-slate-50/30 dark:hover:bg-white/2 transition-colors">
                            <td className="py-4 px-6 max-w-xs sm:max-w-sm">
                              <p className="font-extrabold text-slate-800 dark:text-white leading-snug">{m.title}</p>
                              <p className="text-[10px] text-slate-405 dark:text-slate-500 line-clamp-1 italic mt-0.5 leading-none">{m.description || "No description provided."}</p>
                            </td>
                            <td className="py-4 px-4 text-slate-650 dark:text-slate-350 select-none">
                              <span className="block font-bold">{new Date(m.scheduled_start).toLocaleDateString()}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(m.scheduled_start).toLocaleTimeString(undefined, { timeStyle: "short" })}</span>
                            </td>
                            <td className="py-4 px-4 select-none">
                              <Badge className={`${
                                m.meeting_type === "google_meet" 
                                  ? "bg-teal-500/15 text-teal-650 border-none animate-none" 
                                  : "bg-sky-500/15 text-sky-650 border-none animate-none"
                              } font-black text-[9px] uppercase tracking-wider py-0.5 px-2`}>
                                {m.meeting_type === "google_meet" ? "Google Meet" : "Embedded"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-indigo-650 dark:text-indigo-400 font-bold select-all truncate max-w-[150px]">
                              {m.invitee_email || "All Students"}
                            </td>
                            <td className="py-4 px-4 font-mono text-[10px] text-slate-500 uppercase select-all">
                              {m.room_id}
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-slate-500 shrink-0">
                              {m.duration_minutes}m
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-block border rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const url = m.meeting_type === "google_meet" ? m.meeting_url : `${window.location.origin}/dashboard?tab=embedded-calling&joinRoom=${m.room_id}`;
                                    copyLink(url);
                                  }}
                                  className="w-7 h-7 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg"
                                  title="Copy Shareable Link"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMeeting(m.id)}
                                  className="h-8 px-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl flex items-center gap-1.5 font-black uppercase text-[9px] border border-rose-100 dark:border-rose-900/30"
                                  title="Permanently Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Setup Info Box */}
           <div className="bg-slate-50 dark:bg-white/2 rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 space-y-3.5">
              <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-slate-700 dark:text-white">
                 <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                 How calling channels sync:
              </h4>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 leading-relaxed">
                 Any scheduled classrooms or peer room codes generated here are instantly mirrored within the <strong>Google Meet Tab</strong> and <strong>Embedded Calling Tab</strong> of the Student Dashboard. Direct database integration ensures unified real-time video sessions without complex, slow external auth configs!
              </p>
           </div>
        </div>

      </div>

    </div>
  );
}
