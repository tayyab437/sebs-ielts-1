import { MediaCourse } from "../types/mediaCourse";
import { DEFAULT_MEDIA_COURSES } from "./defaultMediaCourses";
import { defaultSettings } from "./settings";

/**
 * Converts a MediaCourse into the standard application Course structure
 * while preserving all media properties (video/audio URLs, interspersed questions, transcripts, etc.)
 */
export function mediaCourseToAppCourse(mediaCourse: MediaCourse): any {
  if (!mediaCourse) return null;

  const isAudio = mediaCourse.mediaType === "audio";
  const courseFormat = isAudio ? "audio_series" : "video_masterclass";
  const courseType = isAudio ? "Listening" : (mediaCourse.category?.toLowerCase().includes("speak") ? "Speaking" : "All-in-One");

  // Map accessTier
  let accessTier = "Free Trial";
  if (mediaCourse.accessTier === "Pro") accessTier = "Pro Premium";
  else if (mediaCourse.accessTier === "VIP") accessTier = "Mastery Ultimate";
  else if (mediaCourse.accessTier === "Enrolled") accessTier = "Pro Premium";

  // Calculate total episodes and duration
  const allEpisodes = (mediaCourse.modules || []).flatMap((m) => m.episodes || []);
  const totalEpisodesCount = allEpisodes.length;

  return {
    id: mediaCourse.id,
    title: mediaCourse.title,
    subtitle: mediaCourse.subtitle,
    tagline: mediaCourse.subtitle,
    description: mediaCourse.description,
    type: isAudio ? "Audio Podcast Series" : "Video Masterclass",
    course_type: mediaCourse.category || (isAudio ? "Listening" : "Speaking"),
    course_format: courseFormat,
    category: mediaCourse.category || (isAudio ? "IELTS Listening Mastery" : "IELTS Speaking Mastery"),
    difficulty: mediaCourse.difficulty || "Advanced",
    level: mediaCourse.targetBand || "8.5+",
    featured_image: mediaCourse.featuredImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    thumbnail_url: mediaCourse.featuredImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    instructor: mediaCourse.instructor || "Syed Ejaz Bukhari",
    instructor_title: mediaCourse.instructorTitle || "Principal IELTS Director & Linguistic Expert",
    instructor_avatar: mediaCourse.instructorAvatar || defaultSettings.site_logo_url,
    access_tier: accessTier,
    status: mediaCourse.status || "Published",
    total_duration: mediaCourse.totalDuration || "1h 30m",
    total_episodes: totalEpisodesCount,
    tags: Array.isArray(mediaCourse.tags) ? mediaCourse.tags : ["IELTS", "Masterclass"],
    isMediaCourse: true,
    mediaType: mediaCourse.mediaType || "video",
    trailer_url: mediaCourse.trailerUrl,
    show_in_catalog: true,
    show_in_syllabus: true,
    show_in_practice: true,
    created_at: mediaCourse.createdAt || new Date().toISOString(),
    updated_at: mediaCourse.updatedAt || new Date().toISOString(),
    rawMediaCourse: mediaCourse,
    modules: (mediaCourse.modules || []).map((mod, modIdx) => ({
      id: mod.id || `mod-${modIdx + 1}`,
      title: mod.title,
      description: mod.description,
      order: mod.order || modIdx + 1,
      lessons: (mod.episodes || []).map((ep, epIdx) => ({
        id: ep.id || `ep-${modIdx + 1}-${epIdx + 1}`,
        title: ep.title,
        description: ep.description,
        type: ep.mediaType === "audio" ? "VOICE" : "VIDEO",
        mediaType: ep.mediaType || "video",
        mediaUrl: ep.mediaUrl,
        youtubeId: ep.youtubeId,
        duration: ep.duration || "10:00",
        durationSeconds: ep.durationSeconds || 600,
        posterUrl: ep.posterUrl,
        speaker: ep.speaker || mediaCourse.instructor,
        transcript: ep.transcript,
        order: ep.order || epIdx + 1,
        cefrBand: ep.cefrBand,
        pedagogicalRule: ep.pedagogicalRule,
        learningObjectives: ep.learningObjectives,
        instructorNotes: ep.instructorNotes,
        rawEpisode: ep,
        questions: (ep.questions || []).map((q) => ({
          id: q.id,
          type: q.type === "mcq" ? "MCQ" : (q.type === "fib" ? "BLANK" : (q.type === "tfng" ? "TF" : "QA")),
          text: q.prompt,
          prompt: q.prompt,
          timestamp: q.timestamp,
          timestampFormatted: q.timestampFormatted,
          gateType: q.gateType,
          options: q.options || (q.type === "tfng" ? ["TRUE", "FALSE", "NOT GIVEN"] : []),
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
          correctAnswer: q.correctAnswer || (q.acceptedAnswers ? q.acceptedAnswers[0] : ""),
          acceptedAnswers: q.acceptedAnswers,
          sampleAnswer: q.sampleAnswer,
          rubricNotes: q.rubricNotes,
          explanation: q.explanation,
          hint: q.hint,
          points: q.points || 10,
          requiredToPass: q.requiredToPass
        })),
        resources: ep.resources || [],
        content: ep.transcript || ep.description || ""
      }))
    }))
  };
}

/**
 * Loads media courses from localStorage or default static courses.
 */
export function getStoredMediaCourses(): MediaCourse[] {
  try {
    const saved = localStorage.getItem("mock_media_courses");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse mock_media_courses from localStorage:", e);
  }
  return DEFAULT_MEDIA_COURSES;
}

let inFlightMediaCoursesPromise: Promise<MediaCourse[]> | null = null;
let memoryMediaCoursesCache: MediaCourse[] | null = null;
let memoryMediaCoursesTime = 0;

/**
 * Invalidate client in-memory cache for media courses
 */
export function invalidateMediaCoursesCache() {
  memoryMediaCoursesCache = null;
  memoryMediaCoursesTime = 0;
  inFlightMediaCoursesPromise = null;
}

/**
 * Fetches media courses from the server API and syncs with localStorage with in-memory caching and request deduplication.
 */
export async function fetchAllMediaCourses(forceRefresh = false): Promise<MediaCourse[]> {
  const now = Date.now();
  if (!forceRefresh && memoryMediaCoursesCache && (now - memoryMediaCoursesTime < 60000)) {
    return memoryMediaCoursesCache;
  }
  if (!forceRefresh && inFlightMediaCoursesPromise) {
    return inFlightMediaCoursesPromise;
  }

  inFlightMediaCoursesPromise = (async () => {
    try {
      const res = await fetch("/api/media_courses");
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          // Merge with local storage
          const local = getStoredMediaCourses();
          const map = new Map<string, MediaCourse>();
          local.forEach((c) => map.set(c.id, c));
          serverData.forEach((c: MediaCourse) => map.set(c.id, c));
          const merged = Array.from(map.values());
          memoryMediaCoursesCache = merged;
          memoryMediaCoursesTime = Date.now();
          try {
            localStorage.setItem("mock_media_courses", JSON.stringify(merged));
          } catch (e) {}
          return merged;
        }
      }
    } catch (err) {
      console.warn("Media courses API unavailable, using local cache:", err);
    } finally {
      inFlightMediaCoursesPromise = null;
    }
    const fallback = getStoredMediaCourses();
    memoryMediaCoursesCache = fallback;
    memoryMediaCoursesTime = Date.now();
    return fallback;
  })();

  return inFlightMediaCoursesPromise;
}

/**
 * Combines standard base courses with all converted Media Courses.
 */
export function mergeCoursesWithMedia(baseCourses: any[] = [], mediaCourses: MediaCourse[] = []): any[] {
  const mediaList = (mediaCourses.length > 0 ? mediaCourses : getStoredMediaCourses()).map(mediaCourseToAppCourse);
  const map = new Map<string, any>();

  // Add base courses
  (baseCourses || []).forEach((c) => {
    if (c && c.id) map.set(c.id, c);
  });

  // Add / overwrite media courses
  mediaList.forEach((mc) => {
    if (mc && mc.id) map.set(mc.id, mc);
  });

  return Array.from(map.values());
}
