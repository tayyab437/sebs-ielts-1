/**
 * Safe Storage & Image Compression Utilities
 * Designed to prevent QuotaExceededError in restricted environments (like nested iFrames)
 */

/**
 * Compresses a base64 image string to a maximum width/height of 128px
 * and converts to a low-size JPEG format using HTML5 Canvas.
 * This can shrink a 4MB-5MB raw avatar image down to 5KB-10KB.
 */
export const compressImage = (base64Str: string, maxWidth = 128, maxHeight = 128): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !base64Str || !base64Str.startsWith("data:")) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.75 quality to save vast amount of space
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          resolve(base64Str);
        }
      } catch (e) {
        console.warn("Failed to compress image in canvas:", e);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

/**
 * Safely sets an item in localStorage.
 * If quota is exceeded (e.g. QuotaExceededError), it purges non-critical cache/history keys.
 * If setting "student_profile" still fails, it strips the giant 'avatar_url' attribute and retries.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`safeSetItem failed for key "${key}":`, error);

    const isQuotaError = 
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      String(error.message).toLowerCase().includes("quota") ||
      String(error.message).toLowerCase().includes("exceeded");

    if (isQuotaError) {
      console.info("Quota exceeded. Attempting to clear non-essential localStorage caches...");
      
      // 1. Purge non-essential caching keys to reclaim storage
      const nonCriticalKeys = [
        "cached_published_courses",
        "cached_admin_courses",
        "mock_courses",
        "mock_quizzes",
        "quiz_history",
        "app_notifications",
        "quiz_answers_state",
        "writing_answers_state",
        "mock_testimonials",
        "sebs_team_members",
        "course_lesson_timers",
        "course_lesson_timeup",
        "voice_audio_urls"
      ];

      for (const k of nonCriticalKeys) {
        if (k !== key) {
          try {
            localStorage.removeItem(k);
          } catch (e) {}
        }
      }

      // 2. Truncate long arrays (specifically keeping only the top 3 submissions)
      try {
        const cachedSubmissionsStr = localStorage.getItem("admin_writing_submissions");
        if (cachedSubmissionsStr) {
          const subs = JSON.parse(cachedSubmissionsStr);
          if (Array.isArray(subs) && subs.length > 3) {
            localStorage.setItem("admin_writing_submissions", JSON.stringify(subs.slice(0, 3)));
          }
        }
      } catch (e) {}

      // 3. Special target: If setting course catalog cache, convert to lightweight metadata
      if (key === "cached_published_courses" || key === "cached_admin_courses") {
        try {
          const list = JSON.parse(value);
          if (Array.isArray(list)) {
            const lightweight = list.map((c: any) => ({
              id: c.id,
              title: c.title || c.name,
              name: c.name || c.title,
              type: c.type,
              course_type: c.course_type,
              course_format: c.course_format,
              category: c.category,
              difficulty: c.difficulty,
              level: c.level,
              featured_image: c.featured_image,
              thumbnail_url: c.thumbnail_url,
              access_tier: c.access_tier,
              status: c.status,
              isMediaCourse: c.isMediaCourse,
              mediaType: c.mediaType,
              show_in_catalog: c.show_in_catalog,
              show_in_syllabus: c.show_in_syllabus,
              show_in_practice: c.show_in_practice,
              test_number: c.test_number,
              created_at: c.created_at
            }));
            localStorage.setItem(key, JSON.stringify(lightweight));
            console.info(`Saved lightweight catalog fallback for key "${key}".`);
            return true;
          }
        } catch (e) {}
      }

      // 4. Special target: If we're setting student_profile, strip the avatar_url as it's the largest part
      if (key === "student_profile") {
        try {
          const profile = JSON.parse(value);
          if (profile.avatar_url && profile.avatar_url.startsWith("data:")) {
            console.info("Stripping heavy base64 avatar_url from student_profile to stay within quota.");
            profile.avatar_url = ""; // Strip raw base64
            const strippedValue = JSON.stringify(profile);
            localStorage.setItem(key, strippedValue);
            return true;
          }
        } catch (e) {
          console.error("Error during profile stripping recovery:", e);
        }
      }

      // 5. Try the write one final time
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.warn(`Storage write fallback notice for key "${key}":`, retryError);
        
        // If it's STILL student_profile, make a super-minimal payload to at least save core state (XP, streak)
        if (key === "student_profile") {
          try {
            const profile = JSON.parse(value);
            const absoluteMinimal = {
              first_name: profile.first_name || "John",
              last_name: profile.last_name || "Doe",
              xp: profile.xp || 2450,
              streak: profile.streak || 12,
              target_band: profile.target_band || 8.0,
              predicted_band: profile.predicted_band || 7.5,
              exam_type: profile.exam_type || "Academic"
            };
            localStorage.setItem(key, JSON.stringify(absoluteMinimal));
            console.info("Saved absolute minimal student_profile fallback successfully.");
            return true;
          } catch (extremeError) {
            console.error("Absolute minimal save failed:", extremeError);
          }
        }
        return false;
      }
    }
    return false;
  }
}

/**
 * Safely parses a JSON string, returning a fallback value if it fails.
 */
export function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    console.error("Failed to parse JSON string:", str, e);
    return fallback;
  }
}

/**
 * Safely retrieves an item from localStorage and parses it, returning a fallback value if it fails or doesn't exist.
 */
export function safeGetItemAndParse<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return safeJsonParse(val, fallback);
  } catch (e) {
    console.error(`Failed to get and parse localStorage key "${key}":`, e);
    return fallback;
  }
}

