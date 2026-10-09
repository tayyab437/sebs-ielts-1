import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fetchSiteSettings, defaultSettings, SiteSettings } from "@/src/lib/settings";

export function PageSEOManager() {
  const location = useLocation();

  useEffect(() => {
    const updatePageSEO = (settings: SiteSettings) => {
      const safeSettings = settings || defaultSettings;
      const path = location.pathname;
      let title = safeSettings.meta_title_home || defaultSettings.meta_title_home;
      let description = safeSettings.meta_desc_home || defaultSettings.meta_desc_home;

      if (path === "/courses" || path === "/dashboard/courses") {
        title = safeSettings.meta_title_courses || defaultSettings.meta_title_courses;
        description = safeSettings.meta_desc_courses || defaultSettings.meta_desc_courses;
      } else if (path.startsWith("/courses/") || path.startsWith("/dashboard/courses/")) {
        const segments = path.replace(/^\/dashboard\//, "").split("/").filter(Boolean);
        if (segments.length >= 4) {
          const exam = segments[1].toUpperCase() === "GT" ? "General Training" : "Academic";
          const skill = segments[2] ? segments[2].charAt(0).toUpperCase() + segments[2].slice(1) : "Module";
          const num = segments[3];
          title = `IELTS ${exam} ${skill} Test ${num} - Course Practice | SEB's Institute`;
          description = `Comprehensive IELTS ${exam} ${skill} interactive curriculum and practice module Test #${num} with step-by-step guidance.`;
        } else {
          title = safeSettings.meta_title_courses || defaultSettings.meta_title_courses;
          description = safeSettings.meta_desc_courses || defaultSettings.meta_desc_courses;
        }
      } else if (path === "/mock-tests") {
        title = safeSettings.meta_title_mock_tests || defaultSettings.meta_title_mock_tests;
        description = safeSettings.meta_desc_mock_tests || defaultSettings.meta_desc_mock_tests;
      } else if (path.includes("ielts-mock-test-") || path.includes("/ielts-mock-test/")) {
        const segments = path.replace(/^\/dashboard\//, "").split("/").filter(Boolean);
        const yearMatch = (segments[0] || "").match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : "2026";
        const monthRaw = segments[1] || "";
        const month = monthRaw ? monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1) : "";
        const testName = segments[2] ? decodeURIComponent(segments[2]).replace(/-/g, " ") : "";
        const skill = segments[3] ? decodeURIComponent(segments[3]).replace(/-/g, " ") : "";

        if (testName && skill) {
          title = `${testName.toUpperCase()} - ${skill.toUpperCase()} | IELTS Mock Test ${year} | SEB's Institute`;
          description = `Practice ${testName} (${skill}) online with authentic audio, timed exam simulator, and automatic AI band scoring.`;
        } else if (testName) {
          title = `${testName.toUpperCase()} | IELTS Mock Test ${year} | SEB's Institute`;
          description = `Full simulated IELTS practice test for ${testName} with timed listening, reading, writing, and speaking modules.`;
        } else if (month) {
          title = `IELTS Mock Test ${year} ${month} | Official Exam Simulation | SEB's Institute`;
          description = `Explore IELTS Mock Test ${year} ${month} collection. Complete online practice tests with instant band calculations.`;
        } else {
          title = `IELTS Mock Test ${year} Series | SEB's Institute`;
          description = `Practice full-length IELTS ${year} mock tests with real exam questions and AI evaluations.`;
        }
      } else if (path.includes("academic") || path.includes("acdamic")) {
        title = "IELTS Academic Mock Tests | SEB's Institute";
        description = "Take full-length timed IELTS Academic practice mock tests with instant AI band evaluation and complete module explanations.";
      } else if (path.includes("general-training") || path.includes("gt-tests")) {
        title = "IELTS General Training Mock Tests | SEB's Institute";
        description = "Official standard IELTS General Training mock tests with comprehensive section feedback, audio playback, and scoring.";
      } else if (path === "/ielts-speaking" || path === "/ielts-speaking/" || path === "/ielts/ielts-speaking" || path === "/dashboard/ielts-speaking") {
        title = "IELTS Speaking: Questions, Topics, Tips & Test Format | SEBS";
        description = "Learn the IELTS Speaking test format, Part 1, 2 and 3 questions, topics, scoring criteria, practice strategies and expert preparation tips from SEBS.";
      } else if (path === "/ielts-writing" || path === "/ielts-writing/" || path === "/ielts/ielts-writing" || path === "/dashboard/ielts-writing") {
        title = "IELTS Writing: Task 1, Task 2 & Computer-Based Guide | SEB's Institute";
        description = "Master IELTS Writing Task 1 visual reports and Task 2 essays with scoring criteria, band descriptors, computer-based testing strategies, and expert model answers from SEBS.";
      } else if (path === "/pricing") {
        title = safeSettings.meta_title_pricing || defaultSettings.meta_title_pricing;
        description = safeSettings.meta_desc_pricing || defaultSettings.meta_desc_pricing;
      } else if (path === "/login") {
        title = safeSettings.meta_title_login || defaultSettings.meta_title_login;
        description = safeSettings.meta_desc_login || defaultSettings.meta_desc_login;
      } else if (path === "/signup") {
        title = safeSettings.meta_title_signup || defaultSettings.meta_title_signup;
        description = safeSettings.meta_desc_signup || defaultSettings.meta_desc_signup;
      } else if (path === "/terms") {
        title = safeSettings.meta_title_terms || defaultSettings.meta_title_terms;
        description = safeSettings.meta_desc_terms || defaultSettings.meta_desc_terms;
      } else if (path === "/privacy") {
        title = safeSettings.meta_title_privacy || defaultSettings.meta_title_privacy;
        description = safeSettings.meta_desc_privacy || defaultSettings.meta_desc_privacy;
      } else if (path === "/dashboard") {
        title = safeSettings.meta_title_dashboard || defaultSettings.meta_title_dashboard;
        description = safeSettings.meta_desc_dashboard || defaultSettings.meta_desc_dashboard;
      } else if (path === "/dashboard/writing" || path.startsWith("/dashboard/writing/")) {
        title = safeSettings.meta_title_writing || defaultSettings.meta_title_writing;
        description = safeSettings.meta_desc_writing || defaultSettings.meta_desc_writing;
      } else if (path.startsWith("/admin")) {
        title = "Admin Console | SEB's Institute";
        description = "Administrative portal for Syed Ejaz Bukhari & SEB's Institute management team.";
      }

      // Update Document Title
      if (title) {
        document.title = title;
      }

      // Update or Create Meta Description Tag
      if (description) {
        let metaDescTag: HTMLMetaElement | null = document.querySelector("meta[name='description']");
        if (!metaDescTag) {
          metaDescTag = document.createElement("meta");
          metaDescTag.name = "description";
          document.head.appendChild(metaDescTag);
        }
        metaDescTag.content = description;
      }

      // Update or Create Canonical Link Tag
      let canonicalUrl = path === "/" ? "https://sebsinstitute.com/" : `https://sebsinstitute.com${path}`;
      if (path === "/" && safeSettings.meta_link_home) canonicalUrl = safeSettings.meta_link_home;
      else if (path === "/courses" && safeSettings.meta_link_courses) canonicalUrl = safeSettings.meta_link_courses;
      else if (path === "/mock-tests" && safeSettings.meta_link_mock_tests) canonicalUrl = safeSettings.meta_link_mock_tests;
      else if (path === "/pricing" && safeSettings.meta_link_pricing) canonicalUrl = safeSettings.meta_link_pricing;
      else if (path === "/login" && safeSettings.meta_link_login) canonicalUrl = safeSettings.meta_link_login;
      else if (path === "/signup" && safeSettings.meta_link_signup) canonicalUrl = safeSettings.meta_link_signup;
      else if (path === "/terms" && safeSettings.meta_link_terms) canonicalUrl = safeSettings.meta_link_terms;
      else if (path === "/ielts-speaking" || path === "/ielts-speaking/" || path === "/ielts/ielts-speaking") canonicalUrl = "https://sebsinstitute.com/ielts-speaking/";
      else if (path === "/ielts-writing" || path === "/ielts-writing/" || path === "/ielts/ielts-writing") canonicalUrl = "https://sebsinstitute.com/ielts-writing/";
      else if (path === "/privacy" && safeSettings.meta_link_privacy) canonicalUrl = safeSettings.meta_link_privacy;
      else if (path === "/dashboard" && safeSettings.meta_link_dashboard) canonicalUrl = safeSettings.meta_link_dashboard;
      else if ((path === "/dashboard/writing" || path.startsWith("/dashboard/writing/")) && safeSettings.meta_link_writing) canonicalUrl = safeSettings.meta_link_writing;

      let canonicalLinkTag: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
      if (!canonicalLinkTag) {
        canonicalLinkTag = document.createElement("link");
        canonicalLinkTag.rel = "canonical";
        document.head.appendChild(canonicalLinkTag);
      }
      canonicalLinkTag.href = canonicalUrl;

      // Open Graph & Social Media Tags
      const rawImage = safeSettings.site_hero_image_url || "/ielts_prep_banner_1781330535098.jpg";
      const imageUrl = rawImage.startsWith("http") ? rawImage : `https://sebsinstitute.com${rawImage.startsWith('/') ? rawImage : '/' + rawImage}`;

      const setMeta = (attrName: "property" | "name", attrValue: string, contentValue: string) => {
        let tag = document.querySelector<HTMLMetaElement>(`meta[${attrName}='${attrValue}']`);
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute(attrName, attrValue);
          document.head.appendChild(tag);
        }
        tag.content = contentValue;
      };

      setMeta("property", "og:title", title);
      setMeta("property", "og:description", description);
      setMeta("property", "og:url", canonicalUrl);
      setMeta("property", "og:image", imageUrl);
      setMeta("property", "og:type", "website");
      setMeta("property", "og:site_name", "SEB's Institute");

      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:title", title);
      setMeta("name", "twitter:description", description);
      setMeta("name", "twitter:url", canonicalUrl);
      setMeta("name", "twitter:image", imageUrl);
      // Robots Directives (Dynamic per-route: noindex on admin/dashboard, index on public)
      const isPrivate = path.startsWith("/admin") || path.startsWith("/dashboard");
      const robotsDirective = isPrivate 
        ? "noindex, nofollow" 
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
      
      setMeta("name", "robots", robotsDirective);
      setMeta("name", "googlebot", robotsDirective);
      setMeta("name", "bingbot", robotsDirective);

      // International Hreflang Tags Synchronization
      const hreflangLocales = ["x-default", "en", "en-US", "en-GB", "en-PK", "en-IN", "en-AE", "en-CA", "en-AU"];
      hreflangLocales.forEach((locale) => {
        let tag = document.querySelector<HTMLLinkElement>(`link[rel='alternate'][hreflang='${locale}']`);
        if (!tag) {
          tag = document.createElement("link");
          tag.rel = "alternate";
          tag.setAttribute("hreflang", locale);
          document.head.appendChild(tag);
        }
        tag.href = canonicalUrl;
      });

      // Update Favicon Tags
      if (safeSettings.site_favicon_url) {
        const selectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
        selectors.forEach((sel) => {
          const existing = document.querySelectorAll<HTMLLinkElement>(sel);
          existing.forEach((el) => {
            el.href = safeSettings.site_favicon_url;
          });
        });
      }
    };

    fetchSiteSettings(false).then(updatePageSEO);
    const onSettingsUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === "object") {
        updatePageSEO(e.detail);
      }
    };
    window.addEventListener("site_settings_updated", onSettingsUpdate);
    return () => {
      window.removeEventListener("site_settings_updated", onSettingsUpdate);
    };
  }, [location.pathname]);

  return null;
}
