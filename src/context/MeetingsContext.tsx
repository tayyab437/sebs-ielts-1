import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_type: "google_meet" | "embedded_calling";
  meeting_url: string;
  room_id: string;
  status: "scheduled" | "active" | "ended";
  scheduled_start: string;
  duration_minutes: number;
  invitee_email?: string;
  created_at: string;
  student_id?: string;
  host_id?: string;
}

interface MeetingsContextType {
  meetings: Meeting[];
  loading: boolean;
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  fetchMeetings: () => Promise<void>;
  saveMeetings: (updated: Meeting[]) => void;
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

export const MeetingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      const saved = localStorage.getItem("sebs_global_meetings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);

  const fetchMeetings = async () => {
    try {
      let currentUserId = "anonymous_preview_user";
      if (supabase) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            currentUserId = sbUser.id;
          }
        } catch (e) {
          console.warn("MeetingsContext: auth call failed, using default user id", e);
        }
      }

      let dbMeetings: Meeting[] = [];
      // 1. Load from Supabase if connected
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("live_meetings")
            .select("*")
            .order("scheduled_start", { ascending: true });

          if (!error && data) {
            dbMeetings = data;
          }
        } catch (e) {
          console.warn("MeetingsContext: Supabase live_meetings query failed, falling back", e);
        }
      }

      // 2. Fetch and merge from global local storage key
      const globalSaved = localStorage.getItem("sebs_global_meetings");
      let localMeetings: Meeting[] = [];
      if (globalSaved) {
        try {
          localMeetings = JSON.parse(globalSaved);
        } catch (e) {
          console.error("Failed to parse global meetings:", e);
        }
      } else {
        // Look up fallbacks if global wasn't created yet
        const googleSaved = localStorage.getItem(`sebs_google_meetings_${currentUserId}`) || localStorage.getItem("sebs_google_meetings_anonymous_preview_user");
        const embedSaved = localStorage.getItem(`sebs_embedded_meetings_${currentUserId}`) || localStorage.getItem("sebs_embedded_meetings_anonymous_preview_user");
        if (googleSaved) {
          try { localMeetings.push(...JSON.parse(googleSaved)); } catch (e) {}
        }
        if (embedSaved) {
          try { localMeetings.push(...JSON.parse(embedSaved)); } catch (e) {}
        }
      }

      // Merging: prioritize Supabase if duplicates exist, preserve local additions
      const merged: Meeting[] = [...dbMeetings];
      localMeetings.forEach((m) => {
        if (!merged.some((item) => item.id === m.id)) {
          merged.push(m);
        }
      });

      // 3. Fallbacks if we still have absolutely nothing AND never initialized
      const hasInitialized = localStorage.getItem("sebs_meetings_initialized");
      
      if (merged.length === 0 && !hasInitialized) {
        const defaultGoogle: Meeting = {
          id: "mock-1",
          title: "IELTS Speaking Assessment with Coach Clara",
          description: "Live 1-on-1 performance review focusing on vocabulary expansion and structural feedback.",
          meeting_type: "google_meet",
          meeting_url: "https://meet.google.com/abc-defg-hij",
          room_id: "abc-defg-hij",
          status: "active",
          scheduled_start: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          duration_minutes: 30,
          invitee_email: "coach.clara@sebs.edu",
          created_at: new Date().toISOString()
        };

        const defaultEmbed: Meeting = {
          id: "mock-embed-1",
          title: "Peer Group Speaking Trial (IELTS Cue Card)",
          description: "Collaborative verbal mock assessment with real-time timers and speech subtitle transcribing.",
          meeting_type: "embedded_calling",
          meeting_url: "#",
          room_id: "SEBS-IELTS",
          status: "scheduled",
          scheduled_start: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
          duration_minutes: 45,
          invitee_email: "all-students@sebs.edu",
          created_at: new Date().toISOString()
        };

        const defaults = [defaultGoogle, defaultEmbed];
        setMeetings(defaults);
        localStorage.setItem("sebs_global_meetings", JSON.stringify(defaults));
        localStorage.setItem("sebs_meetings_initialized", "true");
        // ... rest of fallback keys ignored for brevity if they are not strictly needed
      } else {
        setMeetings(merged);
        if (merged.length > 0) {
           localStorage.setItem("sebs_meetings_initialized", "true");
        }
      }
    } catch (err) {
      console.error("Error loaded meetings in context:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveMeetings = (updated: Meeting[]) => {
    setMeetings(updated);
    localStorage.setItem("sebs_global_meetings", JSON.stringify(updated));

    // Save fallback split keys so any component still using them works seamlessly
    let currentUserId = "anonymous_preview_user";
    const googleMeetings = updated.filter(m => m.meeting_type === "google_meet");
    const embeddedMeetings = updated.filter(m => m.meeting_type === "embedded_calling");

    localStorage.setItem(`sebs_google_meetings_${currentUserId}`, JSON.stringify(googleMeetings));
    localStorage.setItem(`sebs_embedded_meetings_${currentUserId}`, JSON.stringify(embeddedMeetings));
    localStorage.setItem("sebs_google_meetings_anonymous_preview_user", JSON.stringify(googleMeetings));
    localStorage.setItem("sebs_embedded_meetings_anonymous_preview_user", JSON.stringify(embeddedMeetings));

    // Broadcast update
    window.dispatchEvent(new Event("sebs_meetings_updated"));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Do not run background meeting queries on public landing pages during initial navigation
    const pathname = window.location.pathname;
    const isDashboardOrAdmin = pathname.startsWith('/dashboard') || 
                               pathname.startsWith('/admin') ||
                               pathname.startsWith('/teacher');

    let timer: any;
    let channel: any;

    if (isDashboardOrAdmin) {
      if ("requestIdleCallback" in window) {
        timer = (window as any).requestIdleCallback(() => fetchMeetings(), { timeout: 4000 });
      } else {
        timer = setTimeout(() => fetchMeetings(), 1500);
      }

      // Setup Real-time Supabase subscription for active dashboard/admin users
      if (supabase) {
        channel = supabase
          .channel("db-meetings-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "live_meetings",
            },
            () => {
              console.log("Real-time meetings update detected...");
              fetchMeetings();
            }
          )
          .subscribe();
      }
    }

    // Listen to changes from other tabs or windows
    window.addEventListener("sebs_meetings_updated", fetchMeetings);
    window.addEventListener("storage", fetchMeetings);

    return () => {
      window.removeEventListener("sebs_meetings_updated", fetchMeetings);
      window.removeEventListener("storage", fetchMeetings);
      if (timer) {
        if ("cancelIdleCallback" in window) {
          (window as any).cancelIdleCallback(timer);
        } else {
          clearTimeout(timer);
        }
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <MeetingsContext.Provider value={{ meetings, loading, setMeetings, fetchMeetings, saveMeetings }}>
      {children}
    </MeetingsContext.Provider>
  );
};

export const useMeetings = () => {
  const context = useContext(MeetingsContext);
  if (context === undefined) {
    throw new Error("useMeetings must be used within a MeetingsProvider");
  }
  return context;
};
