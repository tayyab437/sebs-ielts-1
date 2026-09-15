import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fetchSiteSettings, defaultSettings, SiteSettings } from "@/src/lib/settings";

export function PageSEOManager() {
  const location = useLocation();

  useEffect(() => {
    const updatePageSEO = (settings: SiteSettings) => {
      const path = location.pathname;
      let title = settings.meta_title_home || defaultSettings.meta_title_home;
      let description = settings.meta_desc_home || defaultSettings.meta_desc_home;

      if (path === "/courses" || path === "/dashboard/courses") {
        title = settings.meta_title_courses || defaultSettings.meta_title_courses;
        description = settings.meta_desc_courses || defaultSettings.meta_desc_courses;
      } else if (path.startsWith("/courses/") || path.startsWith("/dashboard/courses/")) {
        const segments = path.replace(/^\/dashboard\//, "").split("/").filter(Boolean);
        if (segments.length >= 4) {
          const exam = segments[1].toUpperCase() === "GT" ? "General Training" : "Academic";
          const skill = segments[2].charAt(0).toUpperCase() + segments[2].slice(1);
          const num = segments[3];
          title = `IELTS ${exam} ${skill} Test ${num} - Course Practice | SEB's Institute`;
          description = `Comprehensive IELTS ${exam} ${skill} interactive curriculum and practice module Test #${num} with step-by-step guidance.`;
        } else {
          title = settings.meta_title_courses || defaultSettings.meta_title_courses;
          description = settings.meta_desc_courses || defaultSettings.meta_desc_courses;
        }
      } else if (path === "/mock-tests") {
        title = settings.meta_title_mock_tests || defaultSettings.meta_title_mock_tests;
        description = settings.meta_desc_mock_tests || defaultSettings.meta_desc_mock_tests;
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
      } else if (path === "/pricing") {
        title = settings.meta_title_pricing || defaultSettings.meta_title_pricing;
        description = settings.meta_desc_pricing || defaultSettings.meta_desc_pricing;
      } else if (path === "/login") {
        title = settings.meta_title_login || defaultSettings.meta_title_login;
        description = settings.meta_desc_login || defaultSettings.meta_desc_login;
      } else if (path === "/signup") {
        title = settings.meta_title_signup || defaultSettings.meta_title_signup;
        description = settings.meta_desc_signup || defaultSettings.meta_desc_signup;
      } else if (path === "/terms") {
        title = settings.meta_title_terms || defaultSettings.meta_title_terms;
        description = settings.meta_desc_terms || defaultSettings.meta_desc_terms;
      } else if (path === "/privacy") {
        title = settings.meta_title_privacy || defaultSettings.meta_title_privacy;
        description = settings.meta_desc_privacy || defaultSettings.meta_desc_privacy;
      } else if (path === "/dashboard") {
        title = settings.meta_title_dashboard || defaultSettings.meta_title_dashboard;
        description = settings.meta_desc_dashboard || defaultSettings.meta_desc_dashboard;
      } else if (path === "/dashboard/writing" || path.startsWith("/dashboard/writing/")) {
        title = settings.meta_title_writing || defaultSettings.meta_title_writing;
        description = settings.meta_desc_writing || defaultSettings.meta_desc_writing;
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
      if (path === "/" && settings.meta_link_home) canonicalUrl = settings.meta_link_home;
      else if (path === "/courses" && settings.meta_link_courses) canonicalUrl = settings.meta_link_courses;
      else if (path === "/mock-tests" && settings.meta_link_mock_tests) canonicalUrl = settings.meta_link_mock_tests;
      else if (path === "/pricing" && settings.meta_link_pricing) canonicalUrl = settings.meta_link_pricing;
      else if (path === "/login" && settings.meta_link_login) canonicalUrl = settings.meta_link_login;
      else if (path === "/signup" && settings.meta_link_signup) canonicalUrl = settings.meta_link_signup;
      else if (path === "/terms" && settings.meta_link_terms) canonicalUrl = settings.meta_link_terms;
      else if (path === "/privacy" && settings.meta_link_privacy) canonicalUrl = settings.meta_link_privacy;
      else if (path === "/dashboard" && settings.meta_link_dashboard) canonicalUrl = settings.meta_link_dashboard;
      else if ((path === "/dashboard/writing" || path.startsWith("/dashboard/writing/")) && settings.meta_link_writing) canonicalUrl = settings.meta_link_writing;

      let canonicalLinkTag: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
      if (!canonicalLinkTag) {
        canonicalLinkTag = document.createElement("link");
        canonicalLinkTag.rel = "canonical";
        document.head.appendChild(canonicalLinkTag);
      }
      canonicalLinkTag.href = canonicalUrl;

      // Open Graph & Social Media Tags
      const rawImage = settings.site_hero_image_url || "/ielts_prep_banner_1781330535098.jpg";
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
      if (settings.site_favicon_url) {
        const selectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
        selectors.forEach((sel) => {
          const existing = document.querySelectorAll<HTMLLinkElement>(sel);
          existing.forEach((el) => {
            el.href = settings.site_favicon_url;
          });
        });
      }
    };

    const handleSync = () => {
      fetchSiteSettings(true).then(updatePageSEO);
    };

    handleSync();
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, [location.pathname]);

  return null;
}
