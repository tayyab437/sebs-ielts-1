import { supabase } from "./supabaseClient";

export interface SiteSettings {
  site_favicon_url: string;
  site_favicon_alt: string;
  site_logo_url: string;
  site_logo_alt: string;
  site_hero_image_url: string;
  site_hero_image_alt: string;
  site_bukhari_audio_url: string;
  site_bukhari_audio_transcript: string;
  site_header_style?: "classic" | "iot";
  top_offer_bar_active?: boolean;
  top_offer_bar_text?: string;
  top_offer_bar_link_text?: string;
  top_offer_bar_link?: string;
  iot_banner_text?: string;
  iot_banner_subtext?: string;
  iot_banner_button_text?: string;
  iot_banner_link?: string;
  mock_test_promo_video_url?: string;
  // SEO Meta Titles and Descriptions
  meta_title_home?: string;
  meta_desc_home?: string;
  meta_title_courses?: string;
  meta_desc_courses?: string;
  meta_title_mock_tests?: string;
  meta_desc_mock_tests?: string;
  meta_title_pricing?: string;
  meta_desc_pricing?: string;
  meta_title_login?: string;
  meta_desc_login?: string;
  meta_title_signup?: string;
  meta_desc_signup?: string;
  meta_title_terms?: string;
  meta_desc_terms?: string;
  meta_title_privacy?: string;
  meta_desc_privacy?: string;
  meta_title_dashboard?: string;
  meta_desc_dashboard?: string;
  meta_title_writing?: string;
  meta_desc_writing?: string;
  // Page Links / Canonical URLs
  meta_link_home?: string;
  meta_link_courses?: string;
  meta_link_mock_tests?: string;
  meta_link_pricing?: string;
  meta_link_login?: string;
  meta_link_signup?: string;
  meta_link_terms?: string;
  meta_link_privacy?: string;
  meta_link_dashboard?: string;
  meta_link_writing?: string;
}

export const defaultSettings: SiteSettings = {
  site_favicon_url: "/sebs_official_logo_315.webp",
  site_favicon_alt: "SEB's Institute Favicon",
  site_logo_url: "/sebs_official_logo_315.webp",
  site_logo_alt: "SEB's Institute Logo",
  site_hero_image_url: "/ielts_prep_banner_960.webp",
  site_hero_image_alt: "SEBS English & IELTS Language Academy learning evaluation interface mockup",
  site_bukhari_audio_url: "",
  site_bukhari_audio_transcript: "Welcome to SEB's Institute! I'm Syed Ejaz Bukhari, your principal coach.",
  site_header_style: "classic",
  iot_banner_text: "Self-study to boost your IELTS Score to 6.5+",
  iot_banner_subtext: "Designed for Learners at IELTS 5.0-5.5",
  iot_banner_button_text: "Learn more",
  iot_banner_link: "/courses",
  mock_test_promo_video_url: "https://www.youtube.com/watch?v=yY-7o-q9M7U",
  meta_title_home: "SEB's Institute | IELTS Prep & Spoken English",
  meta_desc_home: "Master IELTS Band 8.5+ and spoken English with Syed Ejaz Bukhari. Authentic AI mock tests, real-time band evaluation, and live masterclasses.",
  meta_title_courses: "IELTS & English Courses | SEB's Institute",
  meta_desc_courses: "Explore IELTS Academic, General Training, Spoken English, and Writing courses taught by expert faculty with live interactive coaching.",
  meta_title_mock_tests: "IELTS Mock Tests & Exam Simulator | SEB's Institute",
  meta_desc_mock_tests: "Take authentic IELTS Listening, Reading, Writing, and Speaking mock tests with instant AI band scores and detailed answer keys.",
  meta_title_pricing: "Tuition Fees & Packages | SEB's Institute",
  meta_desc_pricing: "Transparent pricing for live online IELTS batches, 1-on-1 coaching with Syed Ejaz Bukhari, and full mock test packages.",
  meta_title_login: "Student Login | SEB's Institute",
  meta_desc_login: "Sign in to access your IELTS practice tests, live class schedules, AI writing feedback, and personal band score dashboard.",
  meta_title_signup: "Register for IELTS Prep | SEB's Institute",
  meta_desc_signup: "Create your free student account to practice authentic IELTS mock tests and attend masterclasses with Syed Ejaz Bukhari.",
  meta_title_terms: "Terms of Service | SEB's Institute",
  meta_desc_terms: "Read our official terms of service, student code of conduct, and course enrollment policies.",
  meta_title_privacy: "Privacy Policy | SEB's Institute",
  meta_desc_privacy: "Learn how SEB's Institute protects your personal data, test records, and account information.",
  meta_title_dashboard: "Student Dashboard | SEB's Institute",
  meta_desc_dashboard: "Track your IELTS band progress, review past test analytics, and join live online masterclasses.",
  meta_title_writing: "AI IELTS Writing Evaluator | SEB's Institute",
  meta_desc_writing: "Get instant Task 1 and Task 2 IELTS writing band scores evaluated across Task Achievement, Coherence, Vocabulary, and Grammar.",
  meta_link_home: "https://sebsinstitute.com/",
  meta_link_courses: "https://sebsinstitute.com/courses",
  meta_link_mock_tests: "https://sebsinstitute.com/mock-tests",
  meta_link_pricing: "https://sebsinstitute.com/pricing",
  meta_link_login: "https://sebsinstitute.com/login",
  meta_link_signup: "https://sebsinstitute.com/signup",
  meta_link_terms: "https://sebsinstitute.com/terms",
  meta_link_privacy: "https://sebsinstitute.com/privacy",
  meta_link_dashboard: "https://sebsinstitute.com/dashboard",
  meta_link_writing: "https://sebsinstitute.com/dashboard/writing"
};

export function updateDocumentFavicon(faviconUrl: string) {
  if (!faviconUrl || typeof document === "undefined") return;
  const selectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
  let updated = false;
  selectors.forEach((selector) => {
    const existing = document.querySelectorAll<HTMLLinkElement>(selector);
    existing.forEach((el) => {
      el.href = faviconUrl;
      updated = true;
    });
  });
  if (!updated) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = faviconUrl;
    document.head.appendChild(link);
  }
}

export function sanitizeAssetUrl(url: string | null | undefined, defaultUrl: string): string {
  if (!url) return defaultUrl;
  const trimmed = url.trim();
  if (!trimmed) return defaultUrl;
  if (trimmed.startsWith("/src/assets/images/")) {
    return trimmed.replace("/src/assets/images/", "/");
  }
  return trimmed;
}

let activeFetchPromise: Promise<SiteSettings> | null = null;
let cachedSettings: SiteSettings | null = null;

export function invalidateSettingsCache() {
  cachedSettings = null;
  activeFetchPromise = null;
}

export async function fetchSiteSettings(bypassCache = false): Promise<SiteSettings> {
  if (bypassCache) {
    cachedSettings = null;
    activeFetchPromise = null;
  } else if (cachedSettings) {
    return cachedSettings;
  }
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    try {
      const res = await fetch("/api/mysql/settings");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          const sanitizedData = { ...data };
          if (sanitizedData.site_logo_url) {
            sanitizedData.site_logo_url = sanitizeAssetUrl(sanitizedData.site_logo_url, defaultSettings.site_logo_url);
          }
          if (sanitizedData.site_favicon_url) {
            sanitizedData.site_favicon_url = sanitizeAssetUrl(sanitizedData.site_favicon_url, defaultSettings.site_favicon_url);
          }
          if (sanitizedData.site_hero_image_url) {
            sanitizedData.site_hero_image_url = sanitizeAssetUrl(sanitizedData.site_hero_image_url, defaultSettings.site_hero_image_url);
          }
          cachedSettings = { ...defaultSettings, ...sanitizedData };
          if (cachedSettings.site_favicon_url) {
            updateDocumentFavicon(cachedSettings.site_favicon_url);
          }
          return cachedSettings;
        }
      }
    } catch (err) {
      console.warn("Soft warning: Site settings could not be fetched from MySQL (falling back to local):", err);
    } finally {
      activeFetchPromise = null;
    }
    const local = getLocalSettings();
    if (local.site_favicon_url) {
      updateDocumentFavicon(local.site_favicon_url);
    }
    return local;
  })();

  return activeFetchPromise;
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  // First, save locally for offline support
  Object.keys(settings).forEach((key) => {
    const val = (settings as any)[key];
    if (val !== undefined && val !== null) {
      localStorage.setItem(key, String(val));
    }
  });
  
  if (settings.site_favicon_url) {
    updateDocumentFavicon(settings.site_favicon_url);
  }

  // Clear the cache so future calls fetch fresh data
  cachedSettings = null;
  activeFetchPromise = null;
  
  window.dispatchEvent(new Event("storage")); // Trigger local updates for other tabs

  try {
    const res = await fetch("/api/mysql/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      console.error("Failed to save settings via MySQL API:", await res.text());
    }
  } catch (err) {
    console.error("Error saving site settings to MySQL DB:", err);
  }
}

function getLocalSettings(): SiteSettings {
  return {
    site_favicon_url: sanitizeAssetUrl(localStorage.getItem("site_favicon_url"), defaultSettings.site_favicon_url),
    site_favicon_alt: localStorage.getItem("site_favicon_alt") || defaultSettings.site_favicon_alt,
    site_logo_url: sanitizeAssetUrl(localStorage.getItem("site_logo_url"), defaultSettings.site_logo_url),
    site_logo_alt: localStorage.getItem("site_logo_alt") || defaultSettings.site_logo_alt,
    site_hero_image_url: sanitizeAssetUrl(localStorage.getItem("site_hero_image_url"), defaultSettings.site_hero_image_url),
    site_hero_image_alt: localStorage.getItem("site_hero_image_alt") || defaultSettings.site_hero_image_alt,
    site_bukhari_audio_url: localStorage.getItem("site_bukhari_audio_url") || defaultSettings.site_bukhari_audio_url,
    site_bukhari_audio_transcript: localStorage.getItem("site_bukhari_audio_transcript") || defaultSettings.site_bukhari_audio_transcript,
    site_header_style: (localStorage.getItem("site_header_style") as "classic" | "iot") || "classic",
    top_offer_bar_active: localStorage.getItem("top_offer_bar_active") === null ? true : localStorage.getItem("top_offer_bar_active") === "true",
    top_offer_bar_text: localStorage.getItem("top_offer_bar_text") || "Special Live Batches with Syed Ejaz Bukhari now recruiting • Genuine IELTS Band 8.5+ Syllabus",
    top_offer_bar_link_text: localStorage.getItem("top_offer_bar_link_text") || "Claim Seats",
    top_offer_bar_link: localStorage.getItem("top_offer_bar_link") || "/courses",
    iot_banner_text: localStorage.getItem("iot_banner_text") || "Self-study to boost your IELTS Score to 6.5+",
    iot_banner_subtext: localStorage.getItem("iot_banner_subtext") || "Designed for Learners at IELTS 5.0-5.5",
    iot_banner_button_text: localStorage.getItem("iot_banner_button_text") || "Learn more",
    iot_banner_link: localStorage.getItem("iot_banner_link") || "/courses",
    mock_test_promo_video_url: localStorage.getItem("mock_test_promo_video_url") || "https://www.youtube.com/watch?v=yY-7o-q9M7U",
    meta_title_home: localStorage.getItem("meta_title_home") || defaultSettings.meta_title_home,
    meta_desc_home: localStorage.getItem("meta_desc_home") || defaultSettings.meta_desc_home,
    meta_link_home: localStorage.getItem("meta_link_home") || defaultSettings.meta_link_home,
    meta_title_courses: localStorage.getItem("meta_title_courses") || defaultSettings.meta_title_courses,
    meta_desc_courses: localStorage.getItem("meta_desc_courses") || defaultSettings.meta_desc_courses,
    meta_link_courses: localStorage.getItem("meta_link_courses") || defaultSettings.meta_link_courses,
    meta_title_mock_tests: localStorage.getItem("meta_title_mock_tests") || defaultSettings.meta_title_mock_tests,
    meta_desc_mock_tests: localStorage.getItem("meta_desc_mock_tests") || defaultSettings.meta_desc_mock_tests,
    meta_link_mock_tests: localStorage.getItem("meta_link_mock_tests") || defaultSettings.meta_link_mock_tests,
    meta_title_pricing: localStorage.getItem("meta_title_pricing") || defaultSettings.meta_title_pricing,
    meta_desc_pricing: localStorage.getItem("meta_desc_pricing") || defaultSettings.meta_desc_pricing,
    meta_link_pricing: localStorage.getItem("meta_link_pricing") || defaultSettings.meta_link_pricing,
    meta_title_login: localStorage.getItem("meta_title_login") || defaultSettings.meta_title_login,
    meta_desc_login: localStorage.getItem("meta_desc_login") || defaultSettings.meta_desc_login,
    meta_link_login: localStorage.getItem("meta_link_login") || defaultSettings.meta_link_login,
    meta_title_signup: localStorage.getItem("meta_title_signup") || defaultSettings.meta_title_signup,
    meta_desc_signup: localStorage.getItem("meta_desc_signup") || defaultSettings.meta_desc_signup,
    meta_link_signup: localStorage.getItem("meta_link_signup") || defaultSettings.meta_link_signup,
    meta_title_terms: localStorage.getItem("meta_title_terms") || defaultSettings.meta_title_terms,
    meta_desc_terms: localStorage.getItem("meta_desc_terms") || defaultSettings.meta_desc_terms,
    meta_link_terms: localStorage.getItem("meta_link_terms") || defaultSettings.meta_link_terms,
    meta_title_privacy: localStorage.getItem("meta_title_privacy") || defaultSettings.meta_title_privacy,
    meta_desc_privacy: localStorage.getItem("meta_desc_privacy") || defaultSettings.meta_desc_privacy,
    meta_link_privacy: localStorage.getItem("meta_link_privacy") || defaultSettings.meta_link_privacy,
    meta_title_dashboard: localStorage.getItem("meta_title_dashboard") || defaultSettings.meta_title_dashboard,
    meta_desc_dashboard: localStorage.getItem("meta_desc_dashboard") || defaultSettings.meta_desc_dashboard,
    meta_link_dashboard: localStorage.getItem("meta_link_dashboard") || defaultSettings.meta_link_dashboard,
    meta_title_writing: localStorage.getItem("meta_title_writing") || defaultSettings.meta_title_writing,
    meta_desc_writing: localStorage.getItem("meta_desc_writing") || defaultSettings.meta_desc_writing,
    meta_link_writing: localStorage.getItem("meta_link_writing") || defaultSettings.meta_link_writing,
  };
}
