import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { safeGetItemAndParse } from "@/src/lib/safeStorage";
import { fetchSiteSettings, saveSiteSettings, updateDocumentFavicon } from "@/src/lib/settings";
import { flattenQuestionsToIndividual, countTotalQuestions } from "@/src/utils/questionFlattener";
import { CourseDesignerComponent } from "../../components/course-designer";
import AdminLiveMeetings from "../../components/admin/AdminLiveMeetings";
import AICourseCreator from "../../components/admin/AICourseCreator";
import CourseVisualizer from "../../components/admin/CourseVisualizer";
import AdminClassroomManager from "../../components/admin/AdminClassroomManager";
import AdminCustomPagesManager from "../../components/admin/AdminCustomPagesManager";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Layout,
  FileText,
  Settings,
  Users,
  Save,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Brain,
  Upload,
  File,
  Image as ImageIcon,
  Film,
  Music,
  Paperclip,
  Loader2,
  ExternalLink,
  Tag as TagIcon,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Heading,
  List,
  Code,
  Quote,
  Link as LinkIcon,
  Eye,
  Check,
  HelpCircle,
  Video,
  Mic,
  Volume2,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Sliders,
  ArrowUp,
  ArrowDown,
  PenTool,
  Clock,
  BarChart3,
  Flag,
  FileDown,
  Globe,
  Megaphone,
  Sparkles,
  Percent,
  X,
  Bell,
  Mail,
  Linkedin,
  DoorOpen,
  Coins,
  MonitorPlay,
  Trophy,
  LogIn,
  User,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import ReactMarkdown from "react-markdown";
import RichTextEditor from "../../components/RichTextEditor";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { pricingService, PricingPlan, DEFAULT_PRICING_PLANS } from "@/src/lib/pricingService";

const ADMIN_EMAIL = "ac.repair.in.dubai3@gmail.com";

const parseCSV = (csvText: string): any[] => {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"'; // Escaped quote
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === '\n' || char === '\r') {
      if (insideQuotes) {
        currentLine += char;
      } else {
        if (currentLine.trim() || lines.length > 0) {
          lines.push(currentLine);
        }
        currentLine = "";
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const parseCSVLine = (lineText: string): string[] => {
    const result: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    result.push(field.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/[-_\s]+/g, ""));
  
  const colIndex = {
    question: headers.findIndex(h => h.includes("question") || h === "q"),
    optionA: headers.findIndex(h => h.includes("optiona") || h === "a" || h === "opta"),
    optionB: headers.findIndex(h => h.includes("optionb") || h === "b" || h === "optb"),
    optionC: headers.findIndex(h => h.includes("optionc") || h === "c" || h === "optc"),
    optionD: headers.findIndex(h => h.includes("optiond") || h === "d" || h === "optd"),
    correctAnswer: headers.findIndex(h => h.includes("correct") || h.includes("answer") || h === "correctindex" || h === "correctanswer" || h === "ans"),
  };

  // Fallbacks by order if no matching header
  if (colIndex.question === -1) colIndex.question = 0;
  if (colIndex.optionA === -1) colIndex.optionA = 1;
  if (colIndex.optionB === -1) colIndex.optionB = 2;
  if (colIndex.optionC === -1) colIndex.optionC = 3;
  if (colIndex.optionD === -1) colIndex.optionD = 4;
  if (colIndex.correctAnswer === -1) colIndex.correctAnswer = 5;

  const importedQuestions: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0 || !row[colIndex.question]) continue;

    const qText = row[colIndex.question] || "";
    const options = [
      row[colIndex.optionA] || "",
      row[colIndex.optionB] || "",
      row[colIndex.optionC] || "",
      row[colIndex.optionD] || "",
    ];

    const rawCorrect = (row[colIndex.correctAnswer] || "").toLowerCase().trim();
    let correctIndex = 0;

    // Evaluate correctIndex robustly:
    // 1. By exact string match with any options
    const matchIdx = options.findIndex(opt => opt.toLowerCase().trim() === rawCorrect);
    if (matchIdx !== -1) {
      correctIndex = matchIdx;
    } else {
      // 2. By letter choice: A, B, C, D
      if (rawCorrect === "a" || rawCorrect === "1" || rawCorrect.includes("option a") || rawCorrect === "0") {
        correctIndex = 0;
      } else if (rawCorrect === "b" || rawCorrect === "2" || rawCorrect.includes("option b")) {
        correctIndex = 1;
      } else if (rawCorrect === "c" || rawCorrect === "3" || rawCorrect.includes("option c")) {
        correctIndex = 2;
      } else if (rawCorrect === "d" || rawCorrect === "4" || rawCorrect.includes("option d")) {
        correctIndex = 3;
      } else {
        const num = parseInt(rawCorrect, 10);
        if (!isNaN(num) && num >= 0 && num < 4) {
          correctIndex = num;
        }
      }
    }

    importedQuestions.push({
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
      text: qText,
      options,
      correctIndex,
    });
  }

  return importedQuestions;
};

const DEFAULT_STUDENTS = [
  {
    id: "std-1",
    name: "Amara Okeke",
    email: "amara.okeke@example.com",
    country: "Nigeria",
    examType: "Academic",
    currentBand: 5.5,
    targetBand: 7.5,
    speaking: 5.0,
    writing: 5.5,
    reading: 6.0,
    listening: 5.5,
    enrolledPlan: "Pro Premium",
    status: "Active",
    enrollmentDate: "2026-03-12",
    notes: "Struggles with word pronunciation stress and structural writing cohesion. Highly responsive to AI suggestions and speaking practice modules."
  },
  {
    id: "std-2",
    name: "Wei Zhang",
    email: "wei.zhang@example.com",
    country: "China",
    examType: "Academic",
    currentBand: 6.0,
    targetBand: 8.0,
    speaking: 6.0,
    writing: 5.5,
    reading: 6.5,
    listening: 6.0,
    enrolledPlan: "Mastery Ultimate",
    status: "Active",
    enrollmentDate: "2026-04-05",
    notes: "Excellent reading comprehension. Needs intensive mock feedback coaching on cohesive paragraph progression."
  },
  {
    id: "std-3",
    name: "Sophia Martinez",
    email: "sophia.m@example.com",
    country: "Mexico",
    examType: "Academic",
    currentBand: 5.0,
    targetBand: 7.0,
    speaking: 5.5,
    writing: 4.5,
    reading: 5.0,
    listening: 5.0,
    enrolledPlan: "Pro Premium",
    status: "Active",
    enrollmentDate: "2026-02-20",
    notes: "Needs guidance on Cohesion and Task Achievement in Writing Task 2. Speaks standard English, grammatically decent."
  },
  {
    id: "std-4",
    name: "Haruto Tanaka",
    email: "tanaka.haruto@example.jp",
    country: "Japan",
    examType: "General Training",
    currentBand: 6.0,
    targetBand: 6.5,
    speaking: 6.5,
    writing: 5.5,
    reading: 6.0,
    listening: 6.0,
    enrolledPlan: "Free Trial",
    status: "Inactive",
    enrollmentDate: "2026-05-01",
    notes: "Preparing for immigration visa. Mostly looking for General training feedback."
  },
  {
    id: "std-5",
    name: "Amina Al-Mansoor",
    email: "amina.mansoor@example.ae",
    country: "United Arab Emirates",
    examType: "Academic",
    currentBand: 6.5,
    targetBand: 7.5,
    speaking: 7.0,
    writing: 6.0,
    reading: 6.5,
    listening: 6.5,
    enrolledPlan: "Mastery Ultimate",
    status: "Graduated",
    enrollmentDate: "2026-01-15",
    notes: "Graduated and achieved 7.5 on actual IELTS test! Transitioned successfully to the University of Edinburgh."
  }
];

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(true);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("admin_dashboard_tab") || "courses");

  useEffect(() => {
    localStorage.setItem("admin_dashboard_tab", activeTab);
    if (activeTab === "courses" || activeTab === "overview") {
      fetchData();
    }
  }, [activeTab]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  // General Settings States
  const [generalFaviconUrl, setGeneralFaviconUrl] = useState(() => localStorage.getItem("site_favicon_url") || "/sebs_official_logo_315.webp");
  const [generalFaviconAlt, setGeneralFaviconAlt] = useState(() => localStorage.getItem("site_favicon_alt") || "SEB's Institute Favicon");
  const [generalLogoUrl, setGeneralLogoUrl] = useState(() => localStorage.getItem("site_logo_url") || "/sebs_official_logo_315.webp");
  const [generalLogoAlt, setGeneralLogoAlt] = useState(() => localStorage.getItem("site_logo_alt") || "SEB's Institute Logo");
  const [generalHeroImageUrl, setGeneralHeroImageUrl] = useState(() => localStorage.getItem("site_hero_image_url") || "/ielts_prep_banner_960.webp");
  const [generalHeroImageAlt, setGeneralHeroImageAlt] = useState(() => localStorage.getItem("site_hero_image_alt") || "SEBS English & IELTS Language Academy learning evaluation interface mockup");
  const [generalAudioUrl, setGeneralAudioUrl] = useState(() => localStorage.getItem("site_bukhari_audio_url") || "");
  const [generalAudioTranscript, setGeneralAudioTranscript] = useState(() => localStorage.getItem("site_bukhari_audio_transcript") || "Welcome to SEB's Institute! I'm Syed Ejaz Bukhari, your principal coach.");
  const [mockTestPromoVideoUrl, setMockTestPromoVideoUrl] = useState(() => localStorage.getItem("mock_test_promo_video_url") || "/SEBS_promo.mp4");
  const [siteHeaderStyle, setSiteHeaderStyle] = useState<"classic" | "iot">(() => (localStorage.getItem("site_header_style") as "classic" | "iot") || "classic");
  const [iotBannerText, setIotBannerText] = useState(() => localStorage.getItem("iot_banner_text") || "Self-study to boost your IELTS Score to 6.5+");
  const [iotBannerSubtext, setIotBannerSubtext] = useState(() => localStorage.getItem("iot_banner_subtext") || "Designed for Learners at IELTS 5.0-5.5");
  const [iotBannerButtonText, setIotBannerButtonText] = useState(() => localStorage.getItem("iot_banner_button_text") || "Learn more");
  const [iotBannerLink, setIotBannerLink] = useState(() => localStorage.getItem("iot_banner_link") || "/courses");
  const [activeGeneralSection, setActiveGeneralSection] = useState<string | null>(null);

  // SEO Meta Titles & Descriptions States
  const [metaTitleHome, setMetaTitleHome] = useState("SEB's Institute | IELTS Band 8.5 & Spoken English");
  const [metaDescHome, setMetaDescHome] = useState("Master IELTS Band 8.5+ and spoken English with Syed Ejaz Bukhari. Practice authentic AI mock tests, get instant band evaluations, and join live classes.");
  const [metaTitleCourses, setMetaTitleCourses] = useState("IELTS & English Courses | SEB's Institute");
  const [metaDescCourses, setMetaDescCourses] = useState("Explore specialized IELTS Academic, General Training, Spoken English, and Writing Mastery courses taught by expert faculty.");
  const [metaTitleMockTests, setMetaTitleMockTests] = useState("IELTS Mock Tests & Real Exam Simulators | SEB's Institute");
  const [metaDescMockTests, setMetaDescMockTests] = useState("Take authentic British Council & IDP standard IELTS Listening, Reading, Writing, and Speaking mock tests with instant AI band scores.");
  const [metaTitlePricing, setMetaTitlePricing] = useState("Tuition Fees & Enrollment Packages | SEB's Institute");
  const [metaDescPricing, setMetaDescPricing] = useState("Transparent pricing for live online IELTS batches, personal coaching with Syed Ejaz Bukhari, and full mock test packages.");
  const [metaTitleLogin, setMetaTitleLogin] = useState("Student Portal Login | SEB's Institute");
  const [metaDescLogin, setMetaDescLogin] = useState("Sign in to access your IELTS practice tests, live class schedules, AI writing feedback, and personal band score dashboard.");
  const [metaTitleSignup, setMetaTitleSignup] = useState("Register for IELTS Prep & Mock Tests | SEB's Institute");
  const [metaDescSignup, setMetaDescSignup] = useState("Create your free SEB's Institute student account to start practicing IELTS mock tests and join expert English classes.");
  const [metaTitleTerms, setMetaTitleTerms] = useState("Terms of Service | SEB's Institute");
  const [metaDescTerms, setMetaDescTerms] = useState("Read our official terms of service, student code of conduct, and course enrollment policies.");
  const [metaTitlePrivacy, setMetaTitlePrivacy] = useState("Privacy Policy | SEB's Institute");
  const [metaDescPrivacy, setMetaDescPrivacy] = useState("Learn how SEB's Institute protects your personal data, test records, and account information.");
  const [metaTitleDashboard, setMetaTitleDashboard] = useState("Student Dashboard & Practice Area | SEB's Institute");
  const [metaDescDashboard, setMetaDescDashboard] = useState("Track your IELTS band progress, review past test analytics, and join live online classes.");
  const [metaTitleWriting, setMetaTitleWriting] = useState("AI IELTS Writing Evaluator | SEB's Institute");
  const [metaDescWriting, setMetaDescWriting] = useState("Get instant Task 1 and Task 2 IELTS writing band scores evaluated across Task Achievement, Coherence, Vocabulary, and Grammar.");

  // Page Links / Canonical URL States
  const [metaLinkHome, setMetaLinkHome] = useState("https://sebsinstitute.com/");
  const [metaLinkCourses, setMetaLinkCourses] = useState("https://sebsinstitute.com/courses");
  const [metaLinkMockTests, setMetaLinkMockTests] = useState("https://sebsinstitute.com/mock-tests");
  const [metaLinkPricing, setMetaLinkPricing] = useState("https://sebsinstitute.com/pricing");
  const [metaLinkLogin, setMetaLinkLogin] = useState("https://sebsinstitute.com/login");
  const [metaLinkSignup, setMetaLinkSignup] = useState("https://sebsinstitute.com/signup");
  const [metaLinkTerms, setMetaLinkTerms] = useState("https://sebsinstitute.com/terms");
  const [metaLinkPrivacy, setMetaLinkPrivacy] = useState("https://sebsinstitute.com/privacy");
  const [metaLinkDashboard, setMetaLinkDashboard] = useState("https://sebsinstitute.com/dashboard");
  const [metaLinkWriting, setMetaLinkWriting] = useState("https://sebsinstitute.com/dashboard/writing");

  useEffect(() => {
    fetchSiteSettings(true).then(settings => {
      setGeneralFaviconUrl(settings.site_favicon_url);
      setGeneralFaviconAlt(settings.site_favicon_alt);
      setGeneralLogoUrl(settings.site_logo_url);
      setGeneralLogoAlt(settings.site_logo_alt);
      setGeneralHeroImageUrl(settings.site_hero_image_url);
      setGeneralHeroImageAlt(settings.site_hero_image_alt);
      setGeneralAudioUrl(settings.site_bukhari_audio_url);
      setGeneralAudioTranscript(settings.site_bukhari_audio_transcript);
      if (settings.site_header_style) setSiteHeaderStyle(settings.site_header_style);
      if (settings.iot_banner_text) setIotBannerText(settings.iot_banner_text);
      if (settings.iot_banner_subtext) setIotBannerSubtext(settings.iot_banner_subtext);
      if (settings.iot_banner_button_text) setIotBannerButtonText(settings.iot_banner_button_text);
      if (settings.iot_banner_link) setIotBannerLink(settings.iot_banner_link);
      if (settings.mock_test_promo_video_url) setMockTestPromoVideoUrl(settings.mock_test_promo_video_url);

      // Page SEO Meta Tags & Links Settings
      if (settings.meta_title_home) setMetaTitleHome(settings.meta_title_home);
      if (settings.meta_desc_home) setMetaDescHome(settings.meta_desc_home);
      if (settings.meta_link_home) setMetaLinkHome(settings.meta_link_home);
      if (settings.meta_title_courses) setMetaTitleCourses(settings.meta_title_courses);
      if (settings.meta_desc_courses) setMetaDescCourses(settings.meta_desc_courses);
      if (settings.meta_link_courses) setMetaLinkCourses(settings.meta_link_courses);
      if (settings.meta_title_mock_tests) setMetaTitleMockTests(settings.meta_title_mock_tests);
      if (settings.meta_desc_mock_tests) setMetaDescMockTests(settings.meta_desc_mock_tests);
      if (settings.meta_link_mock_tests) setMetaLinkMockTests(settings.meta_link_mock_tests);
      if (settings.meta_title_pricing) setMetaTitlePricing(settings.meta_title_pricing);
      if (settings.meta_desc_pricing) setMetaDescPricing(settings.meta_desc_pricing);
      if (settings.meta_link_pricing) setMetaLinkPricing(settings.meta_link_pricing);
      if (settings.meta_title_login) setMetaTitleLogin(settings.meta_title_login);
      if (settings.meta_desc_login) setMetaDescLogin(settings.meta_desc_login);
      if (settings.meta_link_login) setMetaLinkLogin(settings.meta_link_login);
      if (settings.meta_title_signup) setMetaTitleSignup(settings.meta_title_signup);
      if (settings.meta_desc_signup) setMetaDescSignup(settings.meta_desc_signup);
      if (settings.meta_link_signup) setMetaLinkSignup(settings.meta_link_signup);
      if (settings.meta_title_terms) setMetaTitleTerms(settings.meta_title_terms);
      if (settings.meta_desc_terms) setMetaDescTerms(settings.meta_desc_terms);
      if (settings.meta_link_terms) setMetaLinkTerms(settings.meta_link_terms);
      if (settings.meta_title_privacy) setMetaTitlePrivacy(settings.meta_title_privacy);
      if (settings.meta_desc_privacy) setMetaDescPrivacy(settings.meta_desc_privacy);
      if (settings.meta_link_privacy) setMetaLinkPrivacy(settings.meta_link_privacy);
      if (settings.meta_title_dashboard) setMetaTitleDashboard(settings.meta_title_dashboard);
      if (settings.meta_desc_dashboard) setMetaDescDashboard(settings.meta_desc_dashboard);
      if (settings.meta_link_dashboard) setMetaLinkDashboard(settings.meta_link_dashboard);
      if (settings.meta_title_writing) setMetaTitleWriting(settings.meta_title_writing);
      if (settings.meta_desc_writing) setMetaDescWriting(settings.meta_desc_writing);
      if (settings.meta_link_writing) setMetaLinkWriting(settings.meta_link_writing);

      // Top Rolling Offer Bar Settings
      if (settings.top_offer_bar_active !== undefined) setOfferBarActive(settings.top_offer_bar_active);
      if (settings.top_offer_bar_text) setOfferBarText(settings.top_offer_bar_text);
      if (settings.top_offer_bar_link_text) setOfferBarLinkText(settings.top_offer_bar_link_text);
      if (settings.top_offer_bar_link) setOfferBarLink(settings.top_offer_bar_link);
    });
  }, []);

  // Dynamic Pricing Plans States
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Load pricing plans in Admin settings
  useEffect(() => {
    async function loadPlans() {
      setIsLoadingPlans(true);
      try {
        const loadedPlans = await pricingService.getPlans();
        setPricingPlans(loadedPlans);
      } catch (err) {
        console.error("Admin: Error loading pricing plans", err);
      } finally {
        setIsLoadingPlans(false);
      }
    }
    loadPlans();
  }, []);

  // Dynamic Instructors Directory States
  const [teamMembers, setTeamMembers] = useState<any[]>(() => {
    const stored = localStorage.getItem("sebs_team_members");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: "team-seb",
        initials: "SEB",
        gradient: "from-emerald-600 to-emerald-800",
        name: "Syed Ejaz Bukhari",
        role: "Founder & Principal English Mentor",
        credentials: "15+ Years Experience • IELTS Expert",
        bio: "Renowned pioneer of the 'We Teach English, Not Pinglish' vocal-conditioning approach. Coached thousands of successful students globally with custom-targeted phonetic strategies.",
        expertise: ["IELTS Academic / General", "PTE Strategic Mastery", "Phonetic Retraining", "Executive Spoken English"],
        email: "info@sebsinstitute.com",
        linkedin: "https://linkedin.com",
        image_url: null,
        sort_order: 1
      },
      {
        id: "team-za",
        initials: "ZA",
        gradient: "from-emerald-500 to-teal-500",
        name: "Zoha Ali",
        role: "Senior EFL & Linguistics Specialist",
        credentials: "MS ELTL • MS Mentorship • CELTA Qualified • 10+ Years Exp.",
        bio: "Certified EFL Mentor and expert linguist specializing in advanced cognitive training and fluent English coaching based on cognitive linguistics principles.",
        expertise: ["IELTS General / Academic", "PTE & Pearson Prep", "LanguageCert C1/C2", "Linguistic Methodology"],
        email: "info@sebsinstitute.com",
        linkedin: "https://linkedin.com",
        image_url: null,
        sort_order: 2
      },
      {
        id: "team-sz",
        initials: "SZ",
        gradient: "from-amber-500 to-orange-500",
        name: "Syeda Zarnaz Gilani",
        role: "Senior IELTS & Communication Coach",
        credentials: "BA English (UoL) • British Council & AEO Expert • 8 Years Exp.",
        bio: "Distinguished graduate from the University of London. Leveraging international pedagogical training to enable rapid speech confidence through intensive vocal drills and auditory pattern mapping.",
        expertise: ["IELTS Speaking / Listening", "Spoken English Fluency", "Academic ESL Pedagogy", "Confidence Building"],
        email: "info@sebsinstitute.com",
        linkedin: "https://linkedin.com",
        image_url: null,
        sort_order: 3
      }
    ];
  });
  const [editingInstructor, setEditingInstructor] = useState<any | null>(null);

  // Instructors Directory Handlers
  const handleTeamMemberFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string" && editingInstructor) {
          setEditingInstructor((prev: any) => ({ ...prev, image_url: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstructor) return;

    // Process expertise input back to array if it is string
    let expertiseArray = [];
    if (Array.isArray(editingInstructor.expertise)) {
      expertiseArray = editingInstructor.expertise;
    } else if (typeof editingInstructor.expertise === "string") {
      expertiseArray = (editingInstructor.expertise as string)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    const payload = {
      ...editingInstructor,
      expertise: expertiseArray,
      sort_order: Number(editingInstructor.sort_order || 0),
    };

    const isNew = !editingInstructor.id || 
                    String(editingInstructor.id).startsWith("temp-") || 
                    String(editingInstructor.id).startsWith("team-new-") || 
                    String(editingInstructor.id).startsWith("local-");

    try {
      const res = await fetch("/api/mysql/team_members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          payload.id = data.id;
        }
        toast.success("Instructor profile synchronized to Hostinger MySQL!");
      } else {
        const errText = await res.text();
        console.warn("Could not save to team_members MySQL DB:", errText);
        toast.error("Saved locally. (Database notice: " + errText + ")");
      }
    } catch (err: any) {
      console.error("Hostinger MySQL team_members save error:", err);
      toast.error("Saved safely to local settings!");
    }

    // Always update local state
    let updatedList;
    if (isNew) {
      const finalPayload = { ...payload, id: payload.id || `local-${Date.now()}` };
      updatedList = [...teamMembers, finalPayload];
    } else {
      updatedList = teamMembers.map((item) => item.id === payload.id ? payload : item);
    }

    // Sort by sort_order ascending
    updatedList.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

    setTeamMembers(updatedList);
    localStorage.setItem("sebs_team_members", JSON.stringify(updatedList));
    setEditingInstructor(null);
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this instructor from your directory?")) return;

    if (!id.startsWith("local-")) {
      try {
        const res = await fetch(`/api/mysql/team_members/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          toast.success("Instructor deleted from Hostinger MySQL database!");
        } else {
          const errText = await res.text();
          console.warn("Delete MySQL DB error:", errText);
          toast.error("Deleted locally. (Database notice: " + errText + ")");
        }
      } catch (err) {
        console.error("Database delete crash:", err);
      }
    } else {
      toast.success("Instructor removed locally!");
    }

    const updatedList = teamMembers.filter((item) => item.id !== id);
    setTeamMembers(updatedList);
    localStorage.setItem("sebs_team_members", JSON.stringify(updatedList));

    if (editingInstructor?.id === id) {
      setEditingInstructor(null);
    }
  };

  // Pricing Plans Handlers
  const handleAddNewPricingPlan = () => {
    setEditingPlan({
      id: `plan-new-${Date.now()}`,
      name: "",
      category: "spoken",
      tagline: "",
      priceDisplay: "PKR 0",
      priceVal: 0,
      period: "1 Month Program",
      description: "",
      features: [],
      cta: "Enroll Now",
      isPopular: false,
      accent: "border-slate-200 dark:border-white/10",
      detailedCurriculum: {
        duration: "",
        focus: "",
        method: "",
        bestFor: "",
        mainFeatures: [],
        outcomes: []
      },
      sort_order: pricingPlans.length + 1
    });
  };

  const handleDeletePricingPlan = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this pricing plan?")) return;
    const updated = pricingPlans.filter((p) => p.id !== id);
    setPricingPlans(updated);
    const success = await pricingService.savePlans(updated);
    if (success) {
      toast.success("Pricing plan deleted successfully!");
      // Notify other tabs of local changes
      window.dispatchEvent(new Event("storage_pricing_updated"));
    } else {
      toast.error("Failed to delete pricing plan.");
    }
  };

  const handleSavePricingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (!editingPlan.name.trim()) {
      toast.error("Please enter a plan name.");
      return;
    }

    let updatedList: PricingPlan[];
    const isNew = String(editingPlan.id).startsWith("plan-new-");
    
    // Create clean final draft
    const finalPayload = {
      ...editingPlan,
      id: isNew ? `plan-${editingPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}` : editingPlan.id
    };

    if (isNew) {
      updatedList = [...pricingPlans, finalPayload];
    } else {
      updatedList = pricingPlans.map((p) => p.id === editingPlan.id ? finalPayload : p);
    }

    // Sort order assignment
    updatedList = updatedList.map((p, idx) => ({ ...p, sort_order: p.sort_order || idx + 1 }));

    setPricingPlans(updatedList);
    setEditingPlan(null);

    const success = await pricingService.savePlans(updatedList);
    if (success) {
      toast.success("Pricing plans catalog synchronized perfectly!");
      // Notify other tabs of local changes
      window.dispatchEvent(new Event("storage_pricing_updated"));
    } else {
      toast.error("Local save completed, connection to Supabase failed.");
    }
  };

  const handleResetPricingPlansToDefault = async () => {
    if (!window.confirm("This will overwrite all customized pricing plans with the default 5 plans. Proceed?")) return;
    setPricingPlans(DEFAULT_PRICING_PLANS);
    const success = await pricingService.savePlans(DEFAULT_PRICING_PLANS);
    if (success) {
      toast.success("Pricing plans reset to defaults successfully!");
      // Notify other tabs of local changes
      window.dispatchEvent(new Event("storage_pricing_updated"));
    } else {
      toast.error("Failed to reset plans.");
    }
  };

  // New: Announcement Settings States
  const [announcementActive, setAnnouncementActive] = useState<boolean>(() => localStorage.getItem("site_announcement_active") === "true");
  const [announcementTitle, setAnnouncementTitle] = useState(() => localStorage.getItem("site_announcement_title") || "Important Academy Notice");
  const [announcementMessage, setAnnouncementMessage] = useState(() => localStorage.getItem("site_announcement_message") || "Special Live Batch admissions for IELTS Academic & General are closing tonight at Midnight! Enter code PRIORITY85 to secure a seat.");
  const [announcementTheme, setAnnouncementTheme] = useState(() => localStorage.getItem("site_announcement_theme") || "urgent-red");
  const [announcementExpiry, setAnnouncementExpiry] = useState(() => localStorage.getItem("site_announcement_expiry") || "Closes in 02 hours 15 minutes");

  // New: Top Offer Bar States
  const [offerBarActive, setOfferBarActive] = useState<boolean>(() => {
    const val = localStorage.getItem("top_offer_bar_active");
    return val === null ? true : val === "true"; // default to true
  });
  const [offerBarText, setOfferBarText] = useState(() => localStorage.getItem("top_offer_bar_text") || "Special Live Batches with Syed Ejaz Bukhari now recruiting • Genuine IELTS Band 8.5+ Syllabus");
  const [offerBarLinkText, setOfferBarLinkText] = useState(() => localStorage.getItem("top_offer_bar_link_text") || "Claim Seats");
  const [offerBarLink, setOfferBarLink] = useState(() => localStorage.getItem("top_offer_bar_link") || "/courses");

  const handleGeneralFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "favicon" | "logo" | "hero" | "audio") => {
    const file = e.target.files?.[0];
    if (file) {
      if (supabase) {
        setIsUploading(true);
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `site_${type}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `settings/${fileName}`;

          const { error } = await supabase.storage
            .from("resources")
            .upload(filePath, file);

          if (!error) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("resources").getPublicUrl(filePath);

            if (type === "favicon") setGeneralFaviconUrl(publicUrl);
            else if (type === "logo") setGeneralLogoUrl(publicUrl);
            else if (type === "hero") setGeneralHeroImageUrl(publicUrl);
            else if (type === "audio") setGeneralAudioUrl(publicUrl);
            
            setIsUploading(false);
            return;
          }
        } catch (e) {
          console.error("Upload failed", e);
        }
        setIsUploading(false);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (type === "favicon") {
            setGeneralFaviconUrl(reader.result);
          } else if (type === "logo") {
            setGeneralLogoUrl(reader.result);
          } else if (type === "hero") {
            setGeneralHeroImageUrl(reader.result);
          } else if (type === "audio") {
            setGeneralAudioUrl(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneralSettings = async () => {
    await saveSiteSettings({
      site_favicon_url: generalFaviconUrl,
      site_favicon_alt: generalFaviconAlt,
      site_logo_url: generalLogoUrl,
      site_logo_alt: generalLogoAlt,
      site_hero_image_url: generalHeroImageUrl,
      site_hero_image_alt: generalHeroImageAlt,
      site_bukhari_audio_url: generalAudioUrl,
      site_bukhari_audio_transcript: generalAudioTranscript,
      mock_test_promo_video_url: mockTestPromoVideoUrl,
      site_header_style: siteHeaderStyle,
      iot_banner_text: iotBannerText,
      iot_banner_subtext: iotBannerSubtext,
      iot_banner_button_text: iotBannerButtonText,
      iot_banner_link: iotBannerLink,
      meta_title_home: metaTitleHome,
      meta_desc_home: metaDescHome,
      meta_title_courses: metaTitleCourses,
      meta_desc_courses: metaDescCourses,
      meta_title_mock_tests: metaTitleMockTests,
      meta_desc_mock_tests: metaDescMockTests,
      meta_title_pricing: metaTitlePricing,
      meta_desc_pricing: metaDescPricing,
      meta_title_login: metaTitleLogin,
      meta_desc_login: metaDescLogin,
      meta_title_signup: metaTitleSignup,
      meta_desc_signup: metaDescSignup,
      meta_title_terms: metaTitleTerms,
      meta_desc_terms: metaDescTerms,
      meta_title_privacy: metaTitlePrivacy,
      meta_desc_privacy: metaDescPrivacy,
      meta_title_dashboard: metaTitleDashboard,
      meta_desc_dashboard: metaDescDashboard,
      meta_title_writing: metaTitleWriting,
      meta_desc_writing: metaDescWriting,
      meta_link_home: metaLinkHome,
      meta_link_courses: metaLinkCourses,
      meta_link_mock_tests: metaLinkMockTests,
      meta_link_pricing: metaLinkPricing,
      meta_link_login: metaLinkLogin,
      meta_link_signup: metaLinkSignup,
      meta_link_terms: metaLinkTerms,
      meta_link_privacy: metaLinkPrivacy,
      meta_link_dashboard: metaLinkDashboard,
      meta_link_writing: metaLinkWriting,
      top_offer_bar_active: offerBarActive,
      top_offer_bar_text: offerBarText,
      top_offer_bar_link_text: offerBarLinkText,
      top_offer_bar_link: offerBarLink,
    });

    localStorage.setItem("top_offer_bar_active", offerBarActive ? "true" : "false");
    localStorage.setItem("top_offer_bar_text", offerBarText);
    localStorage.setItem("top_offer_bar_link_text", offerBarLinkText);
    localStorage.setItem("top_offer_bar_link", offerBarLink);

    localStorage.setItem("meta_link_home", metaLinkHome);
    localStorage.setItem("meta_link_courses", metaLinkCourses);
    localStorage.setItem("meta_link_mock_tests", metaLinkMockTests);
    localStorage.setItem("meta_link_pricing", metaLinkPricing);
    localStorage.setItem("meta_link_login", metaLinkLogin);
    localStorage.setItem("meta_link_signup", metaLinkSignup);
    localStorage.setItem("meta_link_terms", metaLinkTerms);
    localStorage.setItem("meta_link_privacy", metaLinkPrivacy);
    localStorage.setItem("meta_link_dashboard", metaLinkDashboard);
    localStorage.setItem("meta_link_writing", metaLinkWriting);

    localStorage.setItem("site_header_style", siteHeaderStyle);
    localStorage.setItem("iot_banner_text", iotBannerText);
    localStorage.setItem("iot_banner_subtext", iotBannerSubtext);
    localStorage.setItem("iot_banner_button_text", iotBannerButtonText);
    localStorage.setItem("iot_banner_link", iotBannerLink);

    // Update active document favicon element
    updateDocumentFavicon(generalFaviconUrl);

    window.dispatchEvent(new Event("storage"));

    setSaveStatus({
      type: "success",
      message: "General branding & header style settings updated successfully!"
    });
    setTimeout(() => {
      setSaveStatus({ type: "none", message: "" });
    }, 3000);
  };

  const handleSaveAnnouncementSettings = () => {
    localStorage.setItem("site_announcement_active", announcementActive ? "true" : "false");
    localStorage.setItem("site_announcement_title", announcementTitle);
    localStorage.setItem("site_announcement_message", announcementMessage);
    localStorage.setItem("site_announcement_theme", announcementTheme);
    localStorage.setItem("site_announcement_expiry", announcementExpiry);

    window.dispatchEvent(new Event("storage"));
    toast.success("Announcement popup settings have been updated and are active!");
  };

  const handleSaveOfferBarSettings = async () => {
    await saveSiteSettings({
      top_offer_bar_active: offerBarActive,
      top_offer_bar_text: offerBarText,
      top_offer_bar_link_text: offerBarLinkText,
      top_offer_bar_link: offerBarLink
    });

    localStorage.setItem("top_offer_bar_active", offerBarActive ? "true" : "false");
    localStorage.setItem("top_offer_bar_text", offerBarText);
    localStorage.setItem("top_offer_bar_link_text", offerBarLinkText);
    localStorage.setItem("top_offer_bar_link", offerBarLink);

    window.dispatchEvent(new Event("storage"));
    toast.success("Top offer bar ticker configurations saved successfully!");
  };
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | "none";
    message: string;
  }>({ type: "none", message: "" });

  // Management State
  const [courses, setCourses] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isEditingTestimonial, setIsEditingTestimonial] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<any>({
    name: "",
    role: "",
    comment: "",
    rating: 5,
    avatar_url: ""
  });
  const [testimonialSearch, setTestimonialSearch] = useState("");
  const [submissionsFilter, setSubmissionsFilter] = useState<string>("all");
  const [viewingHistorySub, setViewingHistorySub] = useState<any | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);

  // Intervention Helper
  const getInterventionStatus = (student: any) => {
    const studentSubmissions = (submissions || []).filter((sub: any) => {
      return (
        (sub.studentId && student.id && String(sub.studentId) === String(student.id)) ||
        (sub.studentName && student.name && sub.studentName.trim().toLowerCase() === student.name.trim().toLowerCase())
      );
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // Need at least 2 tests for consecutive check
    const nonWritingSubs = studentSubmissions.filter((s: any) => (s.lessonType || "").toUpperCase() !== "WRITING");
    if (nonWritingSubs.length < 2) return { flagged: false, reason: "" };

    const lastTwo = nonWritingSubs.slice(0, 2);
    const belowTarget = lastTwo.every((sub: any) => {
      try {
        const details = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
        const score = details?.score?.percent || 0;
        const bandEquivalent = (score / 100) * 9;
        return bandEquivalent < (student.targetBand || 7.0);
      } catch (e) {
        return false;
      }
    });

    return { 
      flagged: belowTarget, 
      reason: belowTarget ? "Performance has consistently dropped below target band in last 2 tests." : "" 
    };
  };

  // Modals / Editing States
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isEditingTest, setIsEditingTest] = useState(false);
  const [isEditingResource, setIsEditingResource] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const [currentStudent, setCurrentStudent] = useState<any>({
    name: "",
    email: "",
    country: "",
    examType: "Academic",
    currentBand: 6.0,
    targetBand: 7.0,
    speaking: 6.0,
    writing: 6.0,
    reading: 6.0,
    listening: 6.0,
    enrolledPlan: "Free Trial",
    status: "Active",
    enrollmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("All");
  const [studentPlanFilter, setStudentPlanFilter] = useState("All");
  const [studentExamFilter, setStudentExamFilter] = useState("All");

  const [currentCourse, setCurrentCourse] = useState<any>({
    title: "",
    level: "7.0",
    type: "Academic",
    difficulty: "Intermediate",
    description: "",
    modules: [],
    status: "Published",
    featured_image: "",
  });
  const [currentSimpleCourse, setCurrentSimpleCourse] = useState<any>({
    title: "",
    level: "7.0",
    type: "Academic",
    difficulty: "Intermediate",
    description: "",
    tags: [],
    course_format: "four_skills",
    readingContent: "",
    writingContent: "",
    listeningContent: "",
    speakingContent: "",
    status: "Published",
    featured_image: "",
  });
  const [currentTest, setCurrentTest] = useState<any>({
    name: "",
    difficulty: "7.0",
    description: "",
    total_time: 165,
    questions: 40,
    status: "Draft",
    sections: [
      { id: "s1", type: "Listening", title: "Section 1", content: "", questions: [] },
      { id: "s2", type: "Reading", title: "Section 2", content: "", questions: [] },
      { id: "s3", type: "Writing", title: "Section 3", content: "", questions: [] },
      { id: "s4", type: "Speaking", title: "Section 4", content: "", questions: [] }
    ]
  });
  const [currentResource, setCurrentResource] = useState<any>({
    name: "",
    type: "PDF",
    size: "0 MB",
    url: "",
    tags: [],
  });
  const [previewResource, setPreviewResource] = useState<any | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCourseDragActive, setIsCourseDragActive] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<
    Record<string, boolean>
  >({});
  const [textEditorMode, setTextEditorMode] = useState<
    Record<string, "edit" | "preview">
  >({});

  const analyticsData = (submissions || []).reduce((acc: any[], sub) => {
    const date = new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let score = 0;
    if (sub.lessonType !== "WRITING") {
      try {
        const details = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
        score = details?.score?.percent || 0;
      } catch (e) {}
    } else {
        // For writing, let's just use a dummy score for the chart consistency or rely on word count
        score = Math.min(100, (sub.wordCount || 0) / 2.5);
    }
    
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.total += score;
      existing.count += 1;
      existing.score = Number((existing.total / existing.count).toFixed(1));
    } else {
      acc.push({ date, total: score, count: 1, score: Number(score.toFixed(1)) });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10); // Last 10 days

  useEffect(() => {
    if (saveStatus.type !== "none") {
      const timer = setTimeout(
        () => setSaveStatus({ type: "none", message: "" }),
        5000,
      );
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      const { data, error } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (error) {
        // If bucket doesn't exist, we might get an error.
        // In a real environment, the bucket would be created.
        // For the sake of the assistant, we'll simulate a successful upload if it fails due to bucket not existing,
        // but normally we'd handle it properly.
        console.warn("Storage upload failed", error);
        // Simulate a URL for preview purposes if real storage isn't ready
        const mockUrl = URL.createObjectURL(file);
        setCurrentResource({
          ...currentResource,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: fileExt?.toUpperCase() || "FILE",
          url: mockUrl,
        });
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("resources").getPublicUrl(filePath);

        setCurrentResource({
          ...currentResource,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: fileExt?.toUpperCase() || "FILE",
          url: publicUrl,
        });
      }
    } catch (e) {
      console.error("Upload process error", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeaturedImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Choose an image smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      if (!supabase) {
        // Local fallback (Base64)
        const reader = new FileReader();
        reader.onloadend = () => {
          setCurrentCourse((prev: any) => ({
            ...prev,
            featured_image: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        const fileExt = file.name.split(".").pop();
        const fileName = `course_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `courses/${fileName}`;

        // Try to upload to "resources" bucket in Supabase storage, or fall back to base64
        const { error } = await supabase.storage
          .from("resources")
          .upload(filePath, file);

        if (error) {
          console.warn("Storage upload failed, falling back to Base64", error);
          const reader = new FileReader();
          reader.onloadend = () => {
            setCurrentCourse((prev: any) => ({
              ...prev,
              featured_image: reader.result as string,
            }));
          };
          reader.readAsDataURL(file);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("resources").getPublicUrl(filePath);

          setCurrentCourse((prev: any) => ({
            ...prev,
            featured_image: publicUrl,
          }));
        }
      }
    } catch (e) {
      console.error("Featured image upload process error", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCourseDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsCourseDragActive(true);
    } else if (e.type === "dragleave") {
      setIsCourseDragActive(false);
    }
  };

  const handleCourseDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCourseDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.indexOf("image/") === -1) {
        alert("Please drop a valid image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Choose an image smaller than 5MB.");
        return;
      }
      setIsUploading(true);
      try {
        if (!supabase) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setCurrentCourse((prev: any) => ({
              ...prev,
              featured_image: reader.result as string,
            }));
          };
          reader.readAsDataURL(file);
        } else {
          const fileExt = file.name.split(".").pop();
          const fileName = `course_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `courses/${fileName}`;

          const { error } = await supabase.storage
            .from("resources")
            .upload(filePath, file);

          if (error) {
            console.warn(
              "Storage upload failed, falling back to Base64",
              error,
            );
            const reader = new FileReader();
            reader.onloadend = () => {
              setCurrentCourse((prev: any) => ({
                ...prev,
                featured_image: reader.result as string,
              }));
            };
            reader.readAsDataURL(file);
          } else {
            const {
              data: { publicUrl },
            } = supabase.storage.from("resources").getPublicUrl(filePath);

            setCurrentCourse((prev: any) => ({
              ...prev,
              featured_image: publicUrl,
            }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const [currentQuiz, setCurrentQuiz] = useState<any>({
    title: "",
    description: "",
    course_id: "",
    questions: [],
  });

  useEffect(() => {
    async function initAdmin() {
      setIsAdmin(true);
      setLoading(false);
      try {
        await fetchData();
      } catch (err: any) {
        console.warn("Background data load warning:", err.message);
      }
    }
    initAdmin();
  }, []);

  const fetchData = async () => {
    try {
      if (!supabase) {
        // LocalStorage fallback for demo/development environments
        const localCourses = safeGetItemAndParse<any[]>("mock_courses", [
              {
                id: "default-course-1",
                title: "Mastering IELTS Academic",
                level: "7.5",
                type: "Academic",
                difficulty: "Advanced",
                description:
                  "Complete preparation syllabus for achieving Band 7 or higher.",
                modules: [
                  {
                    id: "mod-1",
                    title: "Paragraph Construction",
                    lessons: [
                      {
                        id: "les-1",
                        title: "Introduction hooks",
                        type: "TEXT",
                      },
                      {
                        id: "les-2",
                        title: "Thesis Statement Design",
                        type: "VIDEO",
                      },
                    ],
                  },
                ],
                status: "Published",
                created_at: new Date().toISOString(),
              },
            ]);

        const localMockTests = safeGetItemAndParse<any[]>("mock_tests", [
              {
                id: "default-test-1",
                name: "Full Academic Mock Exam #1",
                difficulty: "7.0",
                questions: 40,
                status: "Published",
                created_at: new Date().toISOString(),
              },
            ]);

        const localResources = safeGetItemAndParse<any[]>("mock_resources", [
              {
                id: "default-res-1",
                name: "Official Band 8 Writing Samples.pdf",
                type: "PDF",
                size: "4.2 MB",
                url: "#",
                tags: ["Writing", "Band 8", "Official"],
                created_at: new Date().toISOString(),
              },
            ]);

        const localQuizzes = safeGetItemAndParse<any[]>("mock_quizzes", [
              {
                id: "default-quiz-1",
                title: "Academic Vocabulary Quiz",
                description: "Test your understanding of academic word lists.",
                course_id: "default-course-1",
                questions: [
                  {
                    id: "q-1",
                    text: "What is the synonym of 'Significant'?",
                    options: ["Important", "Small", "Trivial", "Useless"],
                    correctIndex: 0,
                  },
                ],
                created_at: new Date().toISOString(),
              },
            ]);

        const localStudents = safeGetItemAndParse<any[]>("mock_students", DEFAULT_STUDENTS);

        const defaultMockTestimonials = [
          {
            id: "t1",
            name: "Iram Shehzadi",
            role: "RJ, Radio Pakistan",
            comment: "In my opinion, this Institute does not teach English; it connects with your soul. You must join these classes to see the magic.",
            rating: 5,
            avatar_url: ""
          },
          {
            id: "t2",
            name: "Abu Huraira Shakir",
            role: "Advocate & Lawyer",
            comment: "The IELTS classes were incredibly thorough, meticulously organized, and delivered with clear progression pathways. Superb experience.",
            rating: 5,
            avatar_url: ""
          },
          {
            id: "t3",
            name: "Muhammad Husain Azam",
            role: "Student",
            comment: "My English is significantly better now. I speak so much more confidently. Thank you to all the expert teachers at SEBS.",
            rating: 5,
            avatar_url: ""
          }
        ];

        const localTestimonials = safeGetItemAndParse<any[]>("mock_testimonials", defaultMockTestimonials);

        if (!localStorage.getItem("mock_courses"))
          localStorage.setItem("mock_courses", JSON.stringify(localCourses));
        if (!localStorage.getItem("mock_tests"))
          localStorage.setItem("mock_tests", JSON.stringify(localMockTests));
        if (!localStorage.getItem("mock_resources"))
          localStorage.setItem(
            "mock_resources",
            JSON.stringify(localResources),
          );
        if (!localStorage.getItem("mock_quizzes"))
          localStorage.setItem("mock_quizzes", JSON.stringify(localQuizzes));
        if (!localStorage.getItem("mock_students"))
          localStorage.setItem("mock_students", JSON.stringify(localStudents));
        if (!localStorage.getItem("mock_testimonials"))
          localStorage.setItem("mock_testimonials", JSON.stringify(localTestimonials));

        const rawLocalSubmissions = safeGetItemAndParse<any[]>("admin_writing_submissions", []);
        const localSubmissions = rawLocalSubmissions.map((s: any) => ({
          id: s.id,
          studentId: s.studentId || s.student_id || null,
          studentName: s.studentName || s.student_name,
          courseTitle: s.courseTitle || s.course_title,
          lessonTitle: s.lessonTitle || s.lesson_title,
          lessonType: s.lessonType || s.lesson_type || "WRITING",
          content: s.content,
          wordCount: s.content ? s.content.split(" ").filter((w: string) => w.length > 0).length : 0,
          submittedAt: s.submittedAt || s.created_at
        }));

        const parsedLocalCourses = (localCourses || []).map((course: any) => ({
          ...course,
          modules: typeof course.modules === "string" ? JSON.parse(course.modules) : (course.modules || [])
        }));

        const coursesLocalMockTests = parsedLocalCourses.filter((course: any) => {
          const cls = String(course.course_type || "").toLowerCase();
          return cls === "mock test" || course.is_mock_test === true || cls.includes("test") || cls.includes("task");
        }).map((course: any) => {
          let sectionType = "Reading"; // Default fallback
          const formatLower = String(course.course_type || "").toLowerCase();
          if (formatLower.includes("listening")) sectionType = "Listening";
          else if (formatLower.includes("writing")) sectionType = "Writing";
          else if (formatLower.includes("speaking")) sectionType = "Speaking";

          let normalizedSections: any[] = [];
          let allQs: any[] = [];
          if (course.modules && course.modules.length > 0) {
            course.modules.forEach((mod: any, mIdx: number) => {
              if (mod.lessons && mod.lessons.length > 0) {
                mod.lessons.forEach((les: any, lIdx: number) => {
                  let sType = sectionType;
                  const lesType = String(les.type || "").toLowerCase();
                  if (lesType.includes("listening")) sType = "Listening";
                  else if (lesType.includes("writing")) sType = "Writing";
                  else if (lesType.includes("speaking")) sType = "Speaking";
                  else if (lesType.includes("reading") || lesType.includes("practice")) sType = "Reading";

                  normalizedSections.push({
                    id: les.id || `les-${mIdx}-${lIdx}-${Date.now()}`,
                    type: sType,
                    title: les.title || `Section ${mIdx + 1}.${lIdx + 1}`,
                    content: les.content || "",
                    questions: les.questions || []
                  });
                  if (les.questions && Array.isArray(les.questions)) {
                    allQs.push(...les.questions);
                  }
                });
              } else {
                let sType = sectionType;
                const modType = String(mod.type || "").toLowerCase();
                if (modType.includes("listening")) sType = "Listening";
                else if (modType.includes("writing")) sType = "Writing";
                else if (modType.includes("speaking")) sType = "Speaking";
                else if (modType.includes("reading") || modType.includes("practice")) sType = "Reading";

                normalizedSections.push({
                  id: mod.id || `mod-${mIdx}-${Date.now()}`,
                  type: sType,
                  title: mod.title || `Section ${mIdx + 1}`,
                  content: mod.content || "",
                  questions: mod.questions || []
                });
                if (mod.questions && Array.isArray(mod.questions)) {
                  allQs.push(...mod.questions);
                }
              }
            });
          }

          const totalQsCount = countTotalQuestions(allQs);

          return {
            id: course.id,
            name: course.title,
            difficulty: course.level || "7.0",
            questions: totalQsCount > 0 ? totalQsCount : (course.questions || 40),
            status: course.status || "Published",
            sections: normalizedSections,
            thumbnail: course.featured_image || course.thumbnail_url || "",
            isFromCourses: true,
            course_type: "Mock Test",
            test_number: course.test_number
          };
        });

        const sortedLocalCourses = [...parsedLocalCourses].sort((a, b) => {
          const getTestNum = (testNum: any): number => {
            if (testNum === undefined || testNum === null) return Infinity;
            const str = String(testNum).trim();
            if (str === "") return Infinity;
            const parsedVal = parseInt(str, 10);
            if (!isNaN(parsedVal)) return parsedVal;
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : Infinity;
          };
          const aVal = getTestNum(a.test_number);
          const bVal = getTestNum(b.test_number);
          if (aVal !== bVal) return aVal - bVal;
          return String(a.name || "").localeCompare(String(b.name || ""));
        });

        setCourses(sortedLocalCourses);
        setMockTests([...(localMockTests || []), ...coursesLocalMockTests]);
        setResources(localResources);
        setQuizzes(localQuizzes);
        setStudents(localStudents);
        setSubmissions(localSubmissions);
        setTestimonials(localTestimonials);
        return;
      }

      const { data: c } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: m } = await supabase
        .from("mock_tests")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: r } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: q } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      let teamData: any[] = [];
      try {
        const res = await fetch("/api/mysql/team_members");
        if (res.ok) {
          const team = await res.json();
          if (team && team.length > 0) {
            teamData = team;
          } else {
            const local = localStorage.getItem("sebs_team_members");
            if (local) teamData = JSON.parse(local);
          }
        }
      } catch (err) {
        console.warn("Could not query 'team_members' from Hostinger MySQL, falling back to local storage:", err);
      }

      let tCount = [];
      try {
        const res = await fetch("/api/mysql/testimonials");
        if (res.ok) {
          const testData = await res.json();
          if (testData && testData.length > 0) {
            tCount = testData;
          } else {
            tCount = localStorage.getItem("mock_testimonials")
              ? JSON.parse(localStorage.getItem("mock_testimonials")!)
              : [];
          }
        }
      } catch (err) {
        console.warn("Could not query 'testimonials' from Hostinger MySQL, falling back to local storage:", err);
        tCount = localStorage.getItem("mock_testimonials")
          ? JSON.parse(localStorage.getItem("mock_testimonials")!)
          : [];
      }

      let sCount: any[] = [];
      try {
        // Fetch from profiles (Real Registered Users from Auth)
        const { data: pData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        
        // Fetch from students (Legacy or manually added)
        const { data: sData } = await supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false });

        const profiles = pData || [];
        const manualStudents = sData || [];
        
        const profileStudents = profiles.map(p => ({
          id: p.id,
          name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email?.split('@')[0] || "User",
          email: p.email,
          country: p.country || "Unknown",
          examType: p.exam_type || "Academic",
          currentBand: Number(p.current_band || 6.0),
          targetBand: Number(p.target_band || 7.5),
          speaking: Number(p.speaking || 6.0),
          writing: Number(p.writing || 6.0),
          reading: Number(p.reading || 6.0),
          listening: Number(p.listening || 6.0),
          enrolledPlan: p.plan || p.enrolled_plan || "Free Trial",
          status: p.status || "Active",
          enrollmentDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: p.notes || ""
        }));

        // Combine and deduplicate by email
        const combined = [...profileStudents];
        manualStudents.forEach(ms => {
          if (!combined.some(cs => cs.email === ms.email)) {
            combined.push(ms);
          }
        });

        sCount = combined.length > 0 ? combined : DEFAULT_STUDENTS;
      } catch (err) {
        console.warn("Could not query 'profiles' or 'students' table, falling back to local mock storage:", err);
        sCount = localStorage.getItem("mock_students")
          ? JSON.parse(localStorage.getItem("mock_students")!)
          : DEFAULT_STUDENTS;
        if (!localStorage.getItem("mock_students")) {
          localStorage.setItem("mock_students", JSON.stringify(DEFAULT_STUDENTS));
        }
      }

      let subCount: any[] = [];
      try {
        const { data: subData } = await supabase
          .from("student_submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
        subCount = (subData || []).map((s: any) => ({
          id: s.id,
          studentId: s.student_id,
          studentName: s.student_name,
          courseTitle: s.course_title,
          lessonTitle: s.lesson_title,
          lessonType: s.lesson_type || "WRITING",
          content: s.content,
          wordCount: s.content ? s.content.split(" ").filter((w: string) => w.length > 0).length : 0,
          submittedAt: s.created_at
        }));
      } catch (err) {
        const localSubs = safeGetItemAndParse<any[]>("admin_writing_submissions", []);
        subCount = localSubs.map((s: any) => ({
          id: s.id,
          studentId: s.studentId || s.student_id || null,
          studentName: s.studentName || s.student_name,
          courseTitle: s.courseTitle || s.course_title,
          lessonTitle: s.lessonTitle || s.lesson_title,
          lessonType: s.lessonType || s.lesson_type || "WRITING",
          content: s.content,
          wordCount: s.content ? s.content.split(" ").filter((w: string) => w.length > 0).length : 0,
          submittedAt: s.submittedAt || s.created_at
        }));
      }

      // Parse modules and questions if they are stored as JSON strings
      const parsedCourses = (c || []).map((course) => ({
        ...course,
        modules:
          typeof course.modules === "string"
            ? JSON.parse(course.modules)
            : course.modules || [],
      }));

      const parsedQuizzes = (q || []).map((quiz) => ({
        ...quiz,
        questions:
          typeof quiz.questions === "string"
            ? JSON.parse(quiz.questions)
            : quiz.questions || [],
      }));

      const parsedResources = (r || []).map((resource) => ({
        ...resource,
        tags:
          typeof resource.tags === "string"
            ? JSON.parse(resource.tags)
            : resource.tags || [],
      }));

      // Sync mock tests with central server API
      let apiMockTests: any[] = [];
      try {
        const mockRes = await fetch("/api/mysql/mock_tests");
        if (mockRes.ok) {
          const apiData = await mockRes.json();
          if (Array.isArray(apiData)) apiMockTests = apiData;
        }
      } catch (err) {
        console.warn("Could not query 'mock_tests' from server API:", err);
      }

      const localMockTests = safeGetItemAndParse<any[]>("mock_tests", []);
      // Merge server API tests into local array
      const combinedMockMap = new Map();
      (localMockTests || []).forEach((item: any) => { if (item.id) combinedMockMap.set(item.id, item); });
      apiMockTests.forEach((item: any) => { if (item.id) combinedMockMap.set(item.id, item); });
      const mergedLocalMockTests = Array.from(combinedMockMap.values());

      const localMap = new Map(mergedLocalMockTests.map((item: any) => [item.id, item]));

      const parsedTest = (m || []).map((test) => {
        const localOverride = localMap.get(test.id) || {};
        const monthVal = test.test_month || test.month || localOverride.test_month || localOverride.month || "January";
        const yearVal = test.test_year || test.year || localOverride.test_year || localOverride.year || "2026";
        return {
          ...test,
          ...localOverride,
          test_month: monthVal,
          month: monthVal,
          test_year: yearVal,
          year: yearVal,
          sections:
            typeof test.sections === "string"
              ? JSON.parse(test.sections)
              : test.sections || localOverride.sections || [],
        };
      });

      // Include any local or server API mock tests not present in database
      const dbTestIds = new Set((m || []).map((test: any) => test.id));
      mergedLocalMockTests.forEach((lt: any) => {
        if (lt.id && !dbTestIds.has(lt.id)) {
          parsedTest.push({
            ...lt,
            test_month: lt.test_month || lt.month || "January",
            month: lt.test_month || lt.month || "January",
            test_year: lt.test_year || lt.year || "2026",
            year: lt.test_year || lt.year || "2026",
            sections: typeof lt.sections === "string" ? JSON.parse(lt.sections) : lt.sections || []
          });
        }
      });

      const countActualQuestions = (questions: any[]): number => {
        if (!Array.isArray(questions)) return 0;
        let count = 0;
        questions.forEach((q: any) => {
          const qType = String(q.type || "").toUpperCase();
          if (qType === "INLINE_BLANKS") {
            const corrList = String(q.correctAnswer || "").split("|").filter(Boolean);
            count += corrList.length > 0 ? corrList.length : 1;
          } else if (qType === "MATCHING") {
            const prompts = String(q.text || "").split("\n").filter(Boolean);
            count += prompts.length > 0 ? prompts.length : 1;
          } else {
            count += 1;
          }
        });
        return count;
      };

      const coursesMockTests = parsedCourses.filter((course: any) => {
        const cls = String(course.course_type || "").toLowerCase();
        return cls === "mock test" || course.is_mock_test === true || cls.includes("test") || cls.includes("task");
      }).map((course: any) => {
        let allQs: any[] = [];
        let sectionType = "Reading"; // Default fallback
        const formatLower = String(course.course_type || "").toLowerCase();
        if (formatLower.includes("listening")) sectionType = "Listening";
        else if (formatLower.includes("writing")) sectionType = "Writing";
        else if (formatLower.includes("speaking")) sectionType = "Speaking";

        let normalizedSections: any[] = [];
        if (course.modules && course.modules.length > 0) {
          course.modules.forEach((mod: any, mIdx: number) => {
            if (mod.lessons && mod.lessons.length > 0) {
              mod.lessons.forEach((les: any) => {
                let sType = sectionType;
                const lesType = String(les.type || "").toLowerCase();
                if (lesType.includes("listening")) sType = "Listening";
                else if (lesType.includes("writing")) sType = "Writing";
                else if (lesType.includes("speaking")) sType = "Speaking";
                else if (lesType.includes("reading") || lesType.includes("practice")) sType = "Reading";

                normalizedSections.push({
                  id: les.id || `les-${mIdx}-${Date.now()}`,
                  type: sType,
                  title: les.title || `Section ${mIdx + 1}`,
                  content: les.content || "",
                  questions: les.questions || []
                });
                if (les.questions && Array.isArray(les.questions)) {
                  allQs.push(...les.questions);
                }
              });
            } else {
              let sType = sectionType;
              const modType = String(mod.type || "").toLowerCase();
              if (modType.includes("listening")) sType = "Listening";
              else if (modType.includes("writing")) sType = "Writing";
              else if (modType.includes("speaking")) sType = "Speaking";
              else if (modType.includes("reading") || modType.includes("practice")) sType = "Reading";

              normalizedSections.push({
                id: mod.id || `mod-${mIdx}-${Date.now()}`,
                type: sType,
                title: mod.title || `Section ${mIdx + 1}`,
                content: mod.content || "",
                questions: mod.questions || []
              });
              if (mod.questions && Array.isArray(mod.questions)) {
                allQs.push(...mod.questions);
              }
            }
          });
        }
        const totalQsCount = countActualQuestions(allQs);
        return {
          id: course.id,
          name: course.title,
          difficulty: course.level || "7.0",
          questions: totalQsCount > 0 ? totalQsCount : (course.questions || 40),
          status: course.status || "Published",
          sections: normalizedSections,
          thumbnail: course.featured_image || course.thumbnail_url || "",
          isFromCourses: true,
          course_type: "Mock Test",
          test_number: course.test_number
        };
      });

      const sortedCourses = [...parsedCourses].sort((a, b) => {
        const getTestNum = (testNum: any): number => {
          if (testNum === undefined || testNum === null) return Infinity;
          const str = String(testNum).trim();
          if (str === "") return Infinity;
          const parsedVal = parseInt(str, 10);
          if (!isNaN(parsedVal)) return parsedVal;
          const match = str.match(/\d+/);
          return match ? parseInt(match[0], 10) : Infinity;
        };
        const aVal = getTestNum(a.test_number);
        const bVal = getTestNum(b.test_number);
        if (aVal !== bVal) return aVal - bVal;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });

      setCourses(sortedCourses);
      setMockTests([...parsedTest, ...coursesMockTests]);
      setResources(parsedResources);
      setQuizzes(parsedQuizzes);
      setStudents(sCount);
      setSubmissions(subCount);
      setTestimonials(tCount);
      if (teamData && teamData.length > 0) {
        setTeamMembers(teamData);
        localStorage.setItem("sebs_team_members", JSON.stringify(teamData));
      }
    } catch (e) {
      console.error("Error fetching admin data", e);
    }
  };

  const handleSelectModuleSource = (skillType: "Listening" | "Reading" | "Writing" | "Speaking", sourceValue: string) => {
    if (!sourceValue) {
      const updatedSections = [...(currentTest.sections || [])];
      const sIdx = updatedSections.findIndex((s: any) => s.type === skillType);
      if (sIdx > -1) {
        updatedSections[sIdx] = {
          ...updatedSections[sIdx],
          source_type: "manual",
          source_id: "",
          source_val: "",
          content: `Independent ${skillType} section. Define passage/instructions here.`,
          questions: []
        };
        setCurrentTest({
          ...currentTest,
          sections: updatedSections,
        });
        toast.info(`Reset ${skillType} section to manual configuration mode.`);
      }
      return;
    }

    const [type, id] = sourceValue.split("::");

    if (type === "course") {
      const chosenCourse = courses.find((c: any) => c.id === id);
      if (chosenCourse) {
        const updatedSections = [...(currentTest.sections || [])];
        let sIdx = updatedSections.findIndex((s: any) => s.type === skillType);

        let contentArr: string[] = [];
        let questions: any[] = [];

        if (chosenCourse.modules && chosenCourse.modules.length > 0) {
          chosenCourse.modules.forEach((mod: any) => {
            if (mod.lessons && mod.lessons.length > 0) {
              mod.lessons.forEach((les: any) => {
                if (les.content && les.content.trim() !== "") {
                  contentArr.push(les.content);
                }
                if (les.questions && Array.isArray(les.questions)) {
                  questions.push(...les.questions);
                }
              });
            } else {
              if (mod.content && mod.content.trim() !== "") {
                contentArr.push(mod.content);
              }
              if (mod.questions && Array.isArray(mod.questions)) {
                questions.push(...mod.questions);
              }
            }
          });
        }

        let content = contentArr.join("\n\n---\n\n").trim();
        if (!content) {
          content = `### Course Reference: ${chosenCourse.title}\n\n${chosenCourse.description || ""}\n\nThis compiled segment inherits syllabus assets designed under course context.`;
        }

        if (questions.length === 0) {
          questions = [
            { id: `q-${Date.now()}-1`, text: `Based on the '${chosenCourse.title}' lectures, complete the correct study methodology.`, options: ["Continuous practice with feedback", "Passive reading only", "Not studying", "Relying on luck"], correctIndex: 0 }
          ];
        }

        const updatedSecObj = {
          id: sIdx > -1 ? updatedSections[sIdx].id : `sec-${Date.now()}`,
          type: skillType,
          title: `${skillType}: ${chosenCourse.title}`,
          source_type: "course",
          source_id: id,
          source_val: sourceValue,
          content,
          questions
        };

        if (sIdx === -1) {
          updatedSections.push(updatedSecObj);
        } else {
          updatedSections[sIdx] = updatedSecObj;
        }

        const countActualQuestions = (qs: any[]): number => {
          if (!Array.isArray(qs)) return 0;
          let count = 0;
          qs.forEach((q: any) => {
            const qType = String(q.type || "").toUpperCase();
            if (qType === "INLINE_BLANKS") {
              const corrList = String(q.correctAnswer || "").split("|").filter(Boolean);
              count += corrList.length > 0 ? corrList.length : 1;
            } else if (qType === "MATCHING") {
              const prompts = String(q.text || "").split("\n").filter(Boolean);
              count += prompts.length > 0 ? prompts.length : 1;
            } else {
              count += 1;
            }
          });
          return count;
        };

        const totalQuestions = updatedSections.reduce((acc: number, cur: any) => acc + countActualQuestions(cur.questions), 0);
        setCurrentTest({
          ...currentTest,
          sections: updatedSections,
          questions: totalQuestions > 0 ? totalQuestions : currentTest.questions
        });
        toast.success(`Loaded Course '${chosenCourse.title}' (${countActualQuestions(questions)} questions mapped) to ${skillType}!`);
      }
    } else if (type === "quiz") {
      const chosenQuiz = quizzes.find((q: any) => q.id === id);
      if (chosenQuiz) {
        const updatedSections = [...(currentTest.sections || [])];
        let sIdx = updatedSections.findIndex((s: any) => s.type === skillType);

        const content = `### Practice Quiz: ${chosenQuiz.title}\n\n${chosenQuiz.description || "Self-study practice quiz used for interactive simulations."}`;
        const questions = chosenQuiz.questions || [];

        const updatedSecObj = {
          id: sIdx > -1 ? updatedSections[sIdx].id : `sec-${Date.now()}`,
          type: skillType,
          title: `${skillType}: ${chosenQuiz.title}`,
          source_type: "quiz",
          source_id: id,
          source_val: sourceValue,
          content,
          questions
        };

        if (sIdx === -1) {
          updatedSections.push(updatedSecObj);
        } else {
          updatedSections[sIdx] = updatedSecObj;
        }

        const countActualQuestions = (qs: any[]): number => {
          if (!Array.isArray(qs)) return 0;
          let count = 0;
          qs.forEach((q: any) => {
            const qType = String(q.type || "").toUpperCase();
            if (qType === "INLINE_BLANKS") {
              const corrList = String(q.correctAnswer || "").split("|").filter(Boolean);
              count += corrList.length > 0 ? corrList.length : 1;
            } else if (qType === "MATCHING") {
              const prompts = String(q.text || "").split("\n").filter(Boolean);
              count += prompts.length > 0 ? prompts.length : 1;
            } else {
              count += 1;
            }
          });
          return count;
        };

        const totalQuestions = updatedSections.reduce((acc: number, cur: any) => acc + countActualQuestions(cur.questions), 0);
        setCurrentTest({
          ...currentTest,
          sections: updatedSections,
          questions: totalQuestions > 0 ? totalQuestions : currentTest.questions
        });
        toast.success(`Loaded Practice Test '${chosenQuiz.title}' (${countActualQuestions(questions)} items mapped) to ${skillType}!`);
      }
    }
  };

  // Generic Save Function
  const handleSave = async (
    table: string,
    data: any,
    callback: (val: boolean) => void,
  ) => {
    console.group(`[Save Action] ${table}`);
    console.log("Input Data:", data);

    setIsSaving(true);
    setSaveStatus({ type: "none", message: "" });

    try {
      const ident = data.title || data.name;
      if (!ident || ident.trim() === "") {
        setSaveStatus({
          type: "error",
          message: "Title/Name is strictly required.",
        });
        setIsSaving(false);
        console.groupEnd();
        return;
      }

      const payload = { ...data };
      if (table === "mock_tests") {
        const monthVal = payload.test_month || payload.month || "January";
        const yearVal = payload.test_year || payload.year || "2026";
        payload.test_month = monthVal;
        payload.month = monthVal;
        payload.test_year = yearVal;
        payload.year = yearVal;
      }
      if (table === "courses") {
        if (payload.featured_image && !payload.thumbnail_url) {
          payload.thumbnail_url = payload.featured_image;
        } else if (payload.thumbnail_url && !payload.featured_image) {
          payload.featured_image = payload.thumbnail_url;
        }
      }
      if (!payload.id || payload.id === "" || payload.id === "null") {
        payload.id = supabase ? undefined : `local-${Date.now()}`;
      }

      // Cleanup internal or undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      // Stringify JSON fields (only if writing to database, keep objects if in localStorage)
      const isSqlMode = !!supabase;

      // Synchronize to LocalStorage mirror for instant local updates
      if (table === "mock_tests" || table === "courses") {
        const storageKey = table.startsWith("mock_") ? table : `mock_${table}`;
        try {
          const currentItems = localStorage.getItem(storageKey)
            ? JSON.parse(localStorage.getItem(storageKey)!)
            : [];
          const mirrorItem = {
            ...payload,
            test_month: payload.test_month,
            month: payload.test_month,
            test_year: payload.test_year,
            year: payload.test_year,
            created_at: payload.created_at || new Date().toISOString(),
          };
          const existingIdx = currentItems.findIndex(
            (item: any) => item.id && payload.id && item.id === payload.id,
          );
          if (existingIdx > -1) {
            currentItems[existingIdx] = { ...currentItems[existingIdx], ...mirrorItem };
          } else {
            currentItems.push(mirrorItem);
          }
          localStorage.setItem(storageKey, JSON.stringify(currentItems));

          if (table === "mock_tests") {
            try {
              await fetch("/api/mysql/mock_tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mirrorItem),
              });
            } catch (apiErr) {
              console.warn("Could not sync mock test to server API:", apiErr);
            }
          }
        } catch (lsErr) {
          console.warn("Mirror sync error:", lsErr);
        }
      }

      if (!isSqlMode) {
        setSaveStatus({
          type: "success",
          message: `${table} synchronized locally successfully!`,
        });
        setTimeout(() => callback(false), 1500);
        await fetchData();
        console.groupEnd();
        return;
      }

      // Supabase Mode Stringifying
      if (payload.questions && typeof payload.questions !== "string") {
        payload.questions = JSON.stringify(payload.questions);
      }
      if (payload.modules && typeof payload.modules !== "string") {
        payload.modules = JSON.stringify(payload.modules);
      }
      if (payload.tags && typeof payload.tags !== "string") {
        payload.tags = JSON.stringify(payload.tags);
      }
      if (payload.sections && typeof payload.sections !== "string") {
        payload.sections = JSON.stringify(payload.sections);
      }

      console.log("Final Payload for Supabase:", payload);

      let { data: res, error } = await supabase
        .from(table)
        .upsert([payload])
        .select();

      if (error && error.code === "42703") {
        console.warn("Supabase missing column error, retrying without non-standard schema fields...", error);
        const retryPayload = { ...payload };
        delete retryPayload.test_month;
        delete retryPayload.test_year;
        delete retryPayload.month;
        delete retryPayload.year;
        delete retryPayload.is_mock_test;

        const retryRes = await supabase
          .from(table)
          .upsert([retryPayload])
          .select();

        error = retryRes.error;
        res = retryRes.data;
      }

      if (error) {
        console.error("Upsert Error:", error);
        let errorMsg = error.message;

        if (error.code === "42703") {
          errorMsg = `Missing database column. Saved to local storage. (${error.message})`;
        } else if (error.code === "42P01") {
          errorMsg = `Table "${table}" not found. Saved to local storage.`;
        } else if (error.code === "42501") {
          errorMsg =
            "Supabase RLS Violation: You must run the SQL POLICY commands in your Supabase SQL Editor to allow saving. Check supabase_schema.sql.";
        }

        setSaveStatus({ type: "error", message: errorMsg });
        console.groupEnd();
        return;
      }

      console.info("Save Successful:", res);
      setSaveStatus({
        type: "success",
        message: `${table} synchronized successfully!`,
      });

      setTimeout(() => callback(false), 1500); // Close editor after brief success display
      await fetchData();
    } catch (e: any) {
      console.error("Fatal exception during save:", e);
      let errMsg = e.message || "An unexpected error occurred.";
      if (errMsg.includes("Failed to fetch") || errMsg.includes("fetch")) {
        errMsg =
          "Connection Failed (Failed to fetch): Your Supabase credentials in the Secrets panel are either unconfigured, incorrect, or unreachable. Please double check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
      }
      setSaveStatus({ type: "error", message: errMsg });
    } finally {
      setIsSaving(false);
      console.groupEnd();
    }
  };

  // Generic Delete Function supporting offline/demo fallback
  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    // Detect if this mock test belongs to courses instead
    const itemToDelete = mockTests.find(t => t.id === id);
    const actualTable = (table === "mock_tests" && itemToDelete?.isFromCourses) ? "courses" : table;

    const toastId = toast.loading(`Deleting item from ${actualTable}...`);

    if (!supabase) {
      try {
        const storageKey = actualTable.startsWith("mock_") ? actualTable : `mock_${actualTable}`;
        // Ensure we handle default data if localStorage is empty
        let currentItems = [];
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          currentItems = JSON.parse(raw);
        } else {
          // Fallback to currently loaded state if localStorage was never initialized
          if (actualTable === "courses") currentItems = courses;
          else if (actualTable === "mock_tests") currentItems = mockTests;
          else if (actualTable === "resources") currentItems = resources;
          else if (actualTable === "quizzes") currentItems = quizzes;
        }

        const filtered = currentItems.filter((item: any) => item.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));

        if (actualTable === "mock_tests") {
          try {
            await fetch(`/api/mysql/mock_tests/${id}`, { method: "DELETE" });
          } catch (e) {}
        }
        
        // Clear active course storage if deleted
        if (actualTable === "courses" && localStorage.getItem("active_course_id") === id) {
          localStorage.removeItem("active_course_id");
          localStorage.removeItem("active_course_timestamp");
        }

        // Clear editor if the deleted item was being edited
        if (actualTable === "courses" && currentCourse?.id === id) {
          setIsEditingCourse(false);
          setCurrentCourse({
            title: "",
            level: "7.0",
            type: "Academic",
            difficulty: "Intermediate",
            description: "",
            modules: [],
            status: "Published",
            featured_image: "",
          });
        } else if (table === "quizzes" && currentQuiz?.id === id) {
          setIsEditingQuiz(false);
          setCurrentQuiz({ title: "", description: "", course_id: "", questions: [] });
        } else if (table === "mock_tests" && currentTest?.id === id) {
          setIsEditingTest(false);
          setCurrentTest({ name: "", difficulty: "7.0", questions: 0, status: "Published" });
        }

        await fetchData();
        toast.success("Item deleted successfully", { id: toastId });
      } catch (e: any) {
        toast.error("Failed to delete locally: " + e.message, { id: toastId });
      }
      return;
    }

    try {
      if (actualTable === "mock_tests") {
        try {
          await fetch(`/api/mysql/mock_tests/${id}`, { method: "DELETE" });
        } catch (e) {}
      }
      const { error } = await supabase.from(actualTable).delete().eq("id", id);
      if (error) throw error;
      
      // Clear editor if the deleted item was being edited
      if (actualTable === "courses") {
        if (localStorage.getItem("active_course_id") === id) {
          localStorage.removeItem("active_course_id");
          localStorage.removeItem("active_course_timestamp");
        }
        if (currentCourse?.id === id) setIsEditingCourse(false);
      }
      else if (table === "quizzes" && currentQuiz?.id === id) setIsEditingQuiz(false);
      else if (table === "mock_tests" && currentTest?.id === id) setIsEditingTest(false);

      await fetchData();
      toast.success("Item deleted successfully from database", { id: toastId });
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
  };

  const handleSaveTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTestimonial.name || !currentTestimonial.name.trim() || !currentTestimonial.comment || !currentTestimonial.comment.trim()) {
      alert("Name and Comment are strictly required.");
      return;
    }

    const toastId = toast.loading("Saving testimonial...");
    try {
      const isEdit = !!currentTestimonial.id;
      const tPayload = {
        name: currentTestimonial.name,
        role: currentTestimonial.role || "Student",
        comment: currentTestimonial.comment,
        rating: Number(currentTestimonial.rating || 5),
        avatar_url: currentTestimonial.avatar_url || ""
      };

      const res = await fetch("/api/mysql/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tPayload, id: currentTestimonial.id })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }

      // Sync localstorage as well
      const defaultMockTestimonials = [
        {
          id: "t1",
          name: "Iram Shehzadi",
          role: "RJ, Radio Pakistan",
          comment: "In my opinion, this Institute does not teach English; it connects with your soul. You must join these classes to see the magic.",
          rating: 5,
          avatar_url: ""
        },
        {
          id: "t2",
          name: "Abu Huraira Shakir",
          role: "Advocate & Lawyer",
          comment: "The IELTS classes were incredibly thorough, meticulously organized, and delivered with clear progression pathways. Superb experience.",
          rating: 5,
          avatar_url: ""
        },
        {
          id: "t3",
          name: "Muhammad Husain Azam",
          role: "Student",
          comment: "My English is significantly better now. I speak so much more confidently. Thank you to all the expert teachers at SEBS.",
          rating: 5,
          avatar_url: ""
        }
      ];

      const existing = localStorage.getItem("mock_testimonials")
        ? JSON.parse(localStorage.getItem("mock_testimonials")!)
        : defaultMockTestimonials;
      
      let updatedTestimonialsList = [];
      if (isEdit) {
        updatedTestimonialsList = existing.map((item: any) => 
          item.id === currentTestimonial.id ? { ...item, ...tPayload } : item
        );
      } else {
        const newT = {
          id: `t-local-${Date.now()}`,
          ...tPayload,
          created_at: new Date().toISOString()
        };
        updatedTestimonialsList = [newT, ...existing];
      }
      localStorage.setItem("mock_testimonials", JSON.stringify(updatedTestimonialsList));

      toast.success(isEdit ? "Testimonial updated successfully!" : "Testimonial added successfully!", { id: toastId });
      setIsEditingTestimonial(false);
      setCurrentTestimonial({
        name: "",
        role: "",
        comment: "",
        rating: 5,
        avatar_url: ""
      });
      await fetchData();
    } catch (err: any) {
      console.error("Error saving testimonial:", err);
      toast.error(err.message || "Failed to save testimonial.", { id: toastId });
    }
  };

  const handleDeleteTestimonialItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    const toastId = toast.loading("Deleting testimonial...");
    try {
      const res = await fetch(`/api/mysql/testimonials/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }

      const existing = localStorage.getItem("mock_testimonials")
        ? JSON.parse(localStorage.getItem("mock_testimonials")!)
        : [];
      const filtered = existing.filter((item: any) => item.id !== id);
      localStorage.setItem("mock_testimonials", JSON.stringify(filtered));

      toast.success("Testimonial deleted successfully!", { id: toastId });
      await fetchData();
    } catch (err: any) {
      console.error("Error deleting testimonial:", err);
      toast.error(err.message || "Failed to delete testimonial.", { id: toastId });
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent.name || !currentStudent.email) {
      alert("Name and email are strictly required!");
      return;
    }
    
    let updatedList = [...students];
    if (currentStudent.id) {
      // Edit mode
      updatedList = updatedList.map(s => s.id === currentStudent.id ? currentStudent : s);
      setSaveStatus({ type: "success", message: "Student record synchronized successfully!" });
    } else {
      // Create mode
      const newStudent = {
        ...currentStudent,
        id: `std-${Date.now()}`,
        enrollmentDate: currentStudent.enrollmentDate || new Date().toISOString().split("T")[0],
      };
      updatedList = [newStudent, ...updatedList];
      setSaveStatus({ type: "success", message: "Student record created successfully!" });
    }

    setStudents(updatedList);
    localStorage.setItem("mock_students", JSON.stringify(updatedList));

    if (supabase) {
      try {
        const isEdit = !!currentStudent.id;
        const payload = isEdit ? currentStudent : {
          ...currentStudent,
          id: undefined,
          enrollmentDate: currentStudent.enrollmentDate || new Date().toISOString().split("T")[0],
        };
        const { error } = await supabase.from("students").upsert([payload]);
        if (error) console.warn("Supabase upsert failed, fall back to local persistence:", error);
      } catch (err) {
        console.warn("Could not upsert student to DB table 'students':", err);
      }
    }

    setIsEditingStudent(false);
    setSelectedStudent(null);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this student record? All session histories and portfolios will be unlinked.")) return;
    const updatedList = students.filter(s => s.id !== id);
    setStudents(updatedList);
    localStorage.setItem("mock_students", JSON.stringify(updatedList));
    setSaveStatus({ type: "success", message: "Student record deleted successfully!" });

    if (supabase) {
      try {
        const { error } = await supabase.from("students").delete().eq("id", id);
        if (error) console.warn("Supabase delete failed:", error);
      } catch (err) {
        console.warn("Could not delete from DB 'students' table:", err);
      }
    }

    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
  };

  const handleAddQuestion = () => {
    setCurrentQuiz({
      ...currentQuiz,
      questions: [
        ...currentQuiz.questions,
        {
          id: Date.now().toString(),
          text: "",
          options: ["", "", "", ""],
          correctIndex: 0,
        },
      ],
    });
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setCurrentQuiz({
      ...currentQuiz,
      questions: currentQuiz.questions.map((q: any) =>
        q.id === id ? { ...q, [field]: value } : q,
      ),
    });
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
    setCurrentQuiz({
      ...currentQuiz,
      questions: currentQuiz.questions.map((q: any) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt: string, i: number) =>
                i === optIndex ? value : opt,
              ),
            }
          : q,
      ),
    });
  };

  const removeQuestion = (id: string) => {
    setCurrentQuiz({
      ...currentQuiz,
      questions: currentQuiz.questions.filter((q: any) => q.id !== id),
    });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (!currentQuiz?.questions) return;
    const questions = [...currentQuiz.questions];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    // Swap
    const temp = questions[index];
    questions[index] = questions[targetIdx];
    questions[targetIdx] = temp;

    setCurrentQuiz({
      ...currentQuiz,
      questions,
    });
  };

  const addOption = (qId: string) => {
    setCurrentQuiz({
      ...currentQuiz,
      questions: currentQuiz.questions.map((q: any) => {
        if (q.id === qId) {
          return {
            ...q,
            options: [...(q.options || []), ""],
          };
        }
        return q;
      }),
    });
  };

  const removeOption = (qId: string, optIndex: number) => {
    setCurrentQuiz({
      ...currentQuiz,
      questions: currentQuiz.questions.map((q: any) => {
        if (q.id === qId) {
          const newOptions = (q.options || []).filter(
            (_: any, i: number) => i !== optIndex,
          );
          let correct = q.correctIndex;
          if (correct >= newOptions.length) {
            correct = Math.max(0, newOptions.length - 1);
          }
          return {
            ...q,
            options: newOptions,
            correctIndex: correct,
          };
        }
        return q;
      }),
    });
  };

  const handleFormatText = (
    mIdx: number,
    lIdx: number,
    style: string,
    lessonId: string,
  ) => {
    const textarea = document.getElementById(
      `textarea-${lessonId}`,
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = "";
    switch (style) {
      case "bold":
        replacement = `**${selected || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selected || "italic text"}*`;
        break;
      case "header":
        replacement = `### ${selected || "Section Title"}\n`;
        break;
      case "list":
        replacement = `\n- ${selected || "List item"}`;
        break;
      case "numlist":
        replacement = `\n1. ${selected || "Numbered item"}`;
        break;
      case "code":
        replacement = `\`${selected || "code snippet"}\``;
        break;
      case "link":
        replacement = `[${selected || "link text"}](https://example.com)`;
        break;
      case "quote":
        replacement = `\n> ${selected || "blockquote"}\n`;
        break;
    }

    const newValue =
      text.substring(0, start) + replacement + text.substring(end);
    const newMods = [...currentCourse.modules];
    newMods[mIdx].lessons[lIdx].content = newValue;
    setCurrentCourse({ ...currentCourse, modules: newMods });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 50);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    );
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return url;
  };

  const renderPreviewText = (content: string) => {
    if (!content)
      return (
        <p className="text-slate-400 text-xs italic">
          No content written yet. Start typing to see layout preview...
        </p>
      );

    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    return (
      <div className="markdown-body prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 leading-relaxed text-xs p-2">
        {isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-bold text-primary italic">
        Verifying Admin clearance...
      </div>
    );

  if (isAdmin === false) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-black text-red-900 tracking-tighter uppercase">
              Access Denied
            </h2>
            <p className="text-sm text-red-700 italic">
              This area is restricted to system administrators only. Your login
              has been logged.
            </p>
            <Button
              variant="outline"
              className="w-full border-red-200"
              onClick={() => (window.location.href = "/")}
            >
              Back to Safety
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] pt-8 pb-12">
      <AnimatePresence>
        {saveStatus.type !== "none" && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div
              className={`p-4 rounded-3xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
                saveStatus.type === "success"
                  ? "bg-emerald-500/90 border-emerald-400 text-white"
                  : "bg-rose-500/90 border-rose-400 text-white"
              }`}
            >
              {saveStatus.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm font-black italic">{saveStatus.message}</p>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setSaveStatus({ type: "none", message: "" })}
              >
                <Plus className="w-4 h-4 rotate-45" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1700px] mx-auto px-4 lg:px-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-col lg:flex-row gap-8 items-start w-full bg-transparent border-none"
        >
          {/* Permanent Desktop / Responsive Sidebar */}
          <aside
            className={`shrink-0 lg:sticky lg:top-24 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 shadow-xl shadow-slate-200/25 dark:shadow-none transition-all duration-300 ease-in-out relative group ${
              isSidebarCollapsed || isEditingCourse
                ? "w-20 px-3 py-6 rounded-[2rem] flex flex-col items-center space-y-6 hidden lg:flex"
                : "w-full lg:w-80 p-6 rounded-[2rem] space-y-6"
            }`}
          >
            {/* Collapse Toggle Button */}
            {!isEditingCourse && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm z-20 hover:bg-primary hover:text-white transition-all"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
              </Button>
            )}

            {/* Upper Identity Card */}
            {(!isSidebarCollapsed && !isEditingCourse) && (
              <div className="space-y-2 pb-5 border-b border-slate-100 dark:border-white/5">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">
                  Manage academic curriculum and student records.
                </p>
              </div>
            )}

            {/* Navigation Menu Stack */}
            <div className={`space-y-2 ${(isSidebarCollapsed || isEditingCourse) ? "w-full" : ""}`}>
              {(!isSidebarCollapsed && !isEditingCourse) && (
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic pl-1">
                  System Management
                </Label>
              )}
              <TabsList className="bg-transparent gap-1 h-auto p-0 flex flex-col items-stretch w-full">
                {[
                  {
                    value: "courses",
                    label: "Curriculum Suite",
                    icon: <BookOpen className="w-4 h-4" />,
                  },
                  {
                    value: "course-designer",
                    label: "Course Designer",
                    icon: <PenTool className="w-4 h-4" />,
                  },
                  {
                    value: "ai-course-creator",
                    label: "AI Course Creator",
                    icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
                  },
                  {
                    value: "course-visualizer",
                    label: "Course Visualizer",
                    icon: <Eye className="w-4 h-4 text-emerald-500" />,
                  },
                  {
                    value: "mock-tests",
                    label: "Examinations Desk",
                    icon: <Layout className="w-4 h-4" />,
                  },
                  {
                    value: "quiz-builder",
                    label: "Quiz Workshop",
                    icon: <Brain className="w-4 h-4" />,
                  },
                  {
                    value: "resources",
                    label: "Resource Library",
                    icon: <FileText className="w-4 h-4" />,
                  },
                  {
                    value: "meetings",
                    label: "Live Classes & Calls",
                    icon: <Video className="w-4 h-4" />,
                  },
                  {
                    value: "testimonials",
                    label: "Testimonials Manager",
                    icon: <Award className="w-4 h-4" />,
                  },
                  {
                    value: "users",
                    label: "Students Database",
                    icon: <Users className="w-4 h-4" />,
                  },
                  {
                    value: "submissions",
                    label: "Submissions & Test Results",
                    icon: <PenTool className="w-4 h-4" />,
                  },
                  {
                    value: "analytics",
                    label: "Performance Analytics",
                    icon: <BarChart3 className="w-4 h-4" />,
                  },
                  {
                    value: "classrooms",
                    label: "Classroom Hub",
                    icon: <DoorOpen className="w-4 h-4" />,
                  },
                  {
                    value: "general",
                    label: "General Settings",
                    icon: <Globe className="w-4 h-4" />,
                  },
                  {
                    value: "settings",
                    label: "System Config",
                    icon: <Settings className="w-4 h-4" />,
                  },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`justify-start rounded-xl text-left font-bold transition-all flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-transparent border border-transparent ${
                      isSidebarCollapsed || isEditingCourse
                        ? "w-12 h-12 mx-auto justify-center px-0 mb-2"
                        : "w-full px-4 py-3 gap-3 text-xs"
                    }`}
                    title={(isSidebarCollapsed || isEditingCourse) ? tab.label : undefined}
                    onClick={() => {
                      if (isEditingCourse && tab.value !== "courses") {
                        const confirmLeave = window.confirm("You have unsaved changes. Leave anyway?");
                        if (confirmLeave) setIsEditingCourse(false);
                        else return;
                      } else if (isEditingCourse && tab.value === "courses") {
                        // Let it switch tab, handled by onValueChange but here we just leave
                      }
                    }}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    {(!isSidebarCollapsed && !isEditingCourse) && <span className="truncate">{tab.label}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Sync controls */}
            {(!isSidebarCollapsed && !isEditingCourse) && (
              <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Filter database..."
                    className="pl-9 rounded-xl border bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/5 h-10 font-bold text-xs focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-xl h-10 px-4 border-slate-200/80 dark:border-white/10 shadow-sm font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5"
                  onClick={() => {
                    fetchData();
                    alert("Database synchronized.");
                  }}
                >
                  <Save className="w-3.5 h-3.5" />
                  Refresh Database
                </Button>
              </div>
            )}
          </aside>

          {/* Right Workstation Grid */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6"
              >
                <TabsContent value="courses" className="mt-0 space-y-6">
                  <div className={`grid gap-6 ${isEditingCourse ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
                    {/* Summary Card */}
                    {!isEditingCourse && (
                      <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 dark:bg-slate-900">
                        <CardHeader>
                          <CardTitle className="text-xl font-black italic flex items-center justify-between">
                            Active Courses
                            <Plus
                              className="w-5 h-5 text-primary cursor-pointer hover:rotate-90 transition-transform"
                              onClick={() => {
                                setCurrentCourse({
                                  title: "",
                                  level: "7.0",
                                  type: "Academic",
                                  difficulty: "Intermediate",
                                  description: "",
                                  modules: [],
                                  status: "Published",
                                  featured_image: "",
                                });
                                setIsEditingCourse(true);
                              }}
                            />
                          </CardTitle>
                          <CardDescription>
                            Manage your academic syllabus
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {courses.length === 0 ? (
                            <div className="text-center py-10 opacity-40">
                              <BookOpen className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-xs font-bold italic uppercase tracking-widest">
                                No Active Curriculum
                              </p>
                            </div>
                          ) : (
                            courses.map((course) => (
                              <div
                                key={course.id}
                                onClick={() => {
                                  setCurrentCourse(
                                    JSON.parse(JSON.stringify(course)),
                                  );
                                  setIsEditingCourse(true);
                                  // When editing a course from the list, also set the active designer ID
                                  localStorage.setItem('active_course_designer_id', course.id);
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border gap-2 ${currentCourse?.id === course.id ? "bg-primary/5 border-primary/20" : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-primary/10"}`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {course.featured_image ? (
                                    <img
                                      src={course.featured_image}
                                      alt={course.title}
                                      className="w-10 h-10 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary italic">
                                      {course.title
                                        ? course.title.charAt(0)
                                        : "C"}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-sm font-black truncate max-w-[130px] sm:max-w-none">
                                        {course.title}
                                      </p>
                                      {course.status === "Draft" && (
                                        <Badge
                                          variant="outline"
                                          className="text-[8px] font-black uppercase tracking-wider border-amber-300 text-amber-600 bg-amber-50/50 dark:bg-amber-500/10 dark:text-amber-400 rounded px-1.5 h-4 italic shrink-0"
                                        >
                                          Draft
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase italic shrink-0">
                                        {course.level} Band
                                      </p>
                                      <div className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                      <Badge
                                        variant="secondary"
                                        className="px-1 py-0 h-4 text-[8px] font-black uppercase italic rounded-md bg-slate-100 shrink-0"
                                      >
                                        {course.difficulty || "Intermediate"}
                                      </Badge>
                                      <div className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                      <Badge
                                        className={`px-1.5 py-0 h-4 text-[8px] font-black uppercase italic rounded-md border-none ${course.type === "Academic" ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"} shrink-0`}
                                      >
                                        {course.type === "Academic" ? "Academic" : "General Training"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 rounded-lg text-red-500 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete("courses", course.id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Course Editor */}
                    <Card className={`${isEditingCourse ? "col-span-1" : "md:col-span-2"} rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/5 min-h-[400px]`}>
                      {isEditingCourse ? (
                        <div className="p-4 sm:p-6 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-xl"
                                onClick={() => setIsEditingCourse(false)}
                              >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                              </Button>
                              <h3 className="text-xl sm:text-2xl font-black italic">
                                {currentCourse.id ? "Edit" : "Create"} Course Module
                              </h3>
                            </div>
                            <Badge
                              variant="outline"
                              className="w-fit border-primary text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase italic"
                            >
                              Syllabus Workshop
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label
                                htmlFor="course-title"
                                className="text-[10px] uppercase font-black italic text-slate-400"
                              >
                                Course Official Title
                              </Label>
                              <Input
                                id="course-title"
                                value={currentCourse.title || ""}
                                onChange={(e) =>
                                  setCurrentCourse({
                                    ...currentCourse,
                                    title: e.target.value,
                                  })
                                }
                                placeholder="e.g. Academic Writing Mastery"
                                className="rounded-xl h-12 focus-visible:ring-primary/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="course-level"
                                className="text-[10px] uppercase font-black italic text-slate-400"
                              >
                                Target IELTS Band
                              </Label>
                              <select
                                id="course-level"
                                className="w-full h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={currentCourse.level || "7.0"}
                                onChange={(e) =>
                                  setCurrentCourse({
                                    ...currentCourse,
                                    level: e.target.value,
                                  })
                                }
                              >
                                <option value="5.5">
                                  Band 5.5 - Modest User
                                </option>
                                <option value="6.0">
                                  Band 6.0 - Competent User
                                </option>
                                <option value="6.5">
                                  Band 6.5 - Competent User +
                                </option>
                                <option value="7.0">
                                  Band 7.0 - Good User
                                </option>
                                <option value="7.5">
                                  Band 7.5 - Good User +
                                </option>
                                <option value="8.0">
                                  Band 8.0 - Very Good User
                                </option>
                                <option value="9.0">
                                  Band 9.0 - Expert User
                                </option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black italic text-slate-400">
                                Test Type
                              </Label>
                              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl h-12">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCurrentCourse({
                                      ...currentCourse,
                                      type: "Academic",
                                    })
                                  }
                                  className={`rounded-lg font-black text-xs italic transition-all ${currentCourse.type === "Academic" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                  Academic (AC)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCurrentCourse({
                                      ...currentCourse,
                                      type: "General Training",
                                    })
                                  }
                                  className={`rounded-lg font-black text-xs italic transition-all ${currentCourse.type === "General Training" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                  General (GT)
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="course-difficulty"
                                className="text-[10px] uppercase font-black italic text-slate-400"
                              >
                                Content Difficulty
                              </Label>
                              <select
                                id="course-difficulty"
                                className="w-full h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={
                                  currentCourse.difficulty || "Intermediate"
                                }
                                onChange={(e) =>
                                  setCurrentCourse({
                                    ...currentCourse,
                                    difficulty: e.target.value,
                                  })
                                }
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">
                                  Intermediate
                                </option>
                                <option value="Advanced">Advanced</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-3 p-6 sm:p-8 bg-slate-50 dark:bg-white/2 rounded-[2rem] border border-slate-200/60 dark:border-white/5 animate-in fade-in duration-300">
                            <Label className="text-[10px] uppercase font-black italic text-slate-400 block mb-1">
                              Curriculum Featured Display Image
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Image Preview Window */}
                              <div className="md:col-span-1 rounded-2xl bg-[#E2E8F0] dark:bg-slate-950 border border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden h-[166px] relative shadow-inner group/preview">
                                {currentCourse.featured_image ? (
                                  <>
                                    <img
                                      src={currentCourse.featured_image}
                                      alt="Featured Image Preview"
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        className="h-9 px-4 rounded-xl text-xs font-black bg-red-500 text-white shadow-xl hover:bg-red-600 transition-all flex items-center justify-center gap-1.5"
                                        onClick={() =>
                                          setCurrentCourse({
                                            ...currentCourse,
                                            featured_image: "",
                                          })
                                        }
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove Image
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center p-4">
                                    <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-1.5" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                                      No image selected
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Upload Area / Raw URL */}
                              <div className="md:col-span-2 space-y-4">
                                <div
                                  onDragEnter={handleCourseDrag}
                                  onDragOver={handleCourseDrag}
                                  onDragLeave={handleCourseDrag}
                                  onDrop={handleCourseDrop}
                                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all h-[100px] flex items-center justify-center ${
                                    isCourseDragActive
                                      ? "border-primary bg-primary/5 scale-[1.01]"
                                      : "border-slate-200 dark:border-white/10 hover:border-primary/50 bg-white/40 dark:bg-slate-950/30"
                                  }`}
                                >
                                  <input
                                    type="file"
                                    id="featured-image-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFeaturedImageUpload}
                                  />
                                  <label
                                    htmlFor="featured-image-upload"
                                    className="cursor-pointer flex flex-col items-center justify-center w-full h-full gap-1"
                                  >
                                    <Upload className="w-5 h-5 text-slate-400 transition-transform hover:scale-110" />
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        Click to upload raw image or drag it
                                        here
                                      </p>
                                      <p className="text-[9px] text-slate-400 italic">
                                        PNG, JPG, SVG or GIF, max 5MB
                                      </p>
                                    </div>
                                  </label>
                                </div>

                                {/* Custom URL Field */}
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-black italic text-slate-400">
                                    Or specify an external custom Image URL
                                  </span>
                                  <Input
                                    type="url"
                                    placeholder="https://images.unsplash.com/... or picsum link"
                                    value={currentCourse.featured_image || ""}
                                    onChange={(e) =>
                                      setCurrentCourse({
                                        ...currentCourse,
                                        featured_image: e.target.value,
                                      })
                                    }
                                    className="h-10 rounded-xl font-semibold text-xs focus-visible:ring-primary/20"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="course-desc"
                              className="text-[10px] uppercase font-black italic text-slate-400"
                            >
                              Course Curriculum Description
                            </Label>
                            <textarea
                              id="course-desc"
                              className="w-full min-h-[100px] rounded-2xl border border-slate-200 dark:border-white/10 bg-transparent p-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              value={currentCourse.description || ""}
                              onChange={(e) =>
                                setCurrentCourse({
                                  ...currentCourse,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Provide a detailed breakdown of what students will achieve in this module..."
                            />
                          </div>

                          {/* Lessons / Modules Builder */}
                          <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                              <h4 className="text-xs sm:text-sm font-black italic uppercase tracking-widest text-slate-400">
                                Unit structure (
                                {currentCourse.modules?.length || 0})
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                className="self-end sm:self-auto rounded-xl font-bold h-8 text-[10px] uppercase italic"
                                onClick={() => {
                                  const newModule = {
                                    id: Date.now().toString(),
                                    title: "New Unit",
                                    lessons: [],
                                  };
                                  setCurrentCourse({
                                    ...currentCourse,
                                    modules: [
                                      ...(currentCourse.modules || []),
                                      newModule,
                                    ],
                                  });
                                }}
                              >
                                + Add Unit
                              </Button>
                            </div>

                            <Reorder.Group
                              axis="y"
                              values={currentCourse.modules || []}
                              onReorder={(newOrder) =>
                                setCurrentCourse({
                                  ...currentCourse,
                                  modules: newOrder,
                                })
                              }
                              className="space-y-4 sm:space-y-6"
                            >
                              {(currentCourse.modules || []).map(
                                (mod: any, mIdx: number) => (
                                  <Reorder.Item
                                    key={mod.id}
                                    value={mod}
                                    className="p-3 sm:p-5 md:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group"
                                  >
                                    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4">
                                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-primary text-white flex items-center justify-center text-[10px] sm:text-xs font-bold italic shrink-0">
                                          {mIdx + 1}
                                        </div>
                                        <Input
                                          value={mod.title}
                                          onChange={(e) => {
                                            const newMods = [
                                              ...currentCourse.modules,
                                            ];
                                            newMods[mIdx].title =
                                              e.target.value;
                                            setCurrentCourse({
                                              ...currentCourse,
                                              modules: newMods,
                                            });
                                          }}
                                          className="h-9 border-none bg-transparent font-black italic p-0 focus-visible:ring-0 text-base sm:text-lg tracking-tight flex-1 min-w-0"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 mx-2 hidden md:flex">
                                        {["READING", "WRITING", "SPEAKING", "LISTENING"].map(skill => (
                                          <button
                                            key={skill}
                                            type="button"
                                            className={`px-2 py-1 rounded text-[8px] font-black uppercase italic tracking-widest border transition-all ${
                                              mod.skillType === skill 
                                                ? "bg-primary text-white border-primary shadow-sm" 
                                                : "border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                            onClick={() => {
                                              const newMods = [...currentCourse.modules];
                                              newMods[mIdx].skillType = skill;
                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                            }}
                                          >
                                            {skill}
                                          </button>
                                        ))}
                                      </div>
                                      <Dialog>
                                        <DialogTrigger
                                          render={
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 px-2 sm:px-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-[10px] uppercase italic gap-1.5 shrink-0"
                                            />
                                          }
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span className="hidden sm:inline">
                                            Delete Unit
                                          </span>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle className="text-xl font-black italic tracking-tight">
                                              Delete Learning Unit
                                            </DialogTitle>
                                            <DialogDescription className="font-medium">
                                              Are you sure you want to delete{" "}
                                              <span className="text-primary font-bold">
                                                "{mod.title}"
                                              </span>
                                              ? This action will permanently
                                              remove all lessons and content
                                              within this unit.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <DialogFooter className="gap-2">
                                            <DialogClose
                                              render={
                                                <Button
                                                  variant="ghost"
                                                  className="font-bold rounded-xl"
                                                />
                                              }
                                            >
                                              Hold on, Go Back
                                            </DialogClose>
                                            <DialogClose
                                              render={
                                                <Button
                                                  variant="destructive"
                                                  className="bg-red-500 hover:bg-red-600 font-bold rounded-xl shadow-lg shadow-red-200"
                                                  onClick={() => {
                                                    const newMods =
                                                      currentCourse.modules.filter(
                                                        (_: any, i: number) =>
                                                          i !== mIdx,
                                                      );
                                                    setCurrentCourse({
                                                      ...currentCourse,
                                                      modules: newMods,
                                                    });
                                                  }}
                                                />
                                              }
                                            >
                                              Yes, Delete Unit
                                            </DialogClose>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>

                                    <div className="pl-0 sm:pl-10 space-y-3 mt-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest pl-2">
                                          Active Lessons
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-[10px] font-bold text-primary hover:bg-primary/5 px-2"
                                          onClick={() => {
                                            const newMods = [
                                              ...currentCourse.modules,
                                            ];
                                            const newLesson = {
                                              id: Date.now().toString(),
                                              title: "New Lesson",
                                              type: "TEXT",
                                            };
                                            newMods[mIdx].lessons = [
                                              ...(newMods[mIdx].lessons || []),
                                              newLesson,
                                            ];
                                            setCurrentCourse({
                                              ...currentCourse,
                                              modules: newMods,
                                            });
                                          }}
                                        >
                                          + Add Lesson
                                        </Button>
                                      </div>

                                      <Reorder.Group
                                        axis="y"
                                        values={mod.lessons || []}
                                        onReorder={(newOrder) => {
                                          const newMods = [
                                            ...currentCourse.modules,
                                          ];
                                          newMods[mIdx].lessons = newOrder;
                                          setCurrentCourse({
                                            ...currentCourse,
                                            modules: newMods,
                                          });
                                        }}
                                        className="grid grid-cols-1 gap-2"
                                      >
                                        {(mod.lessons || []).map(
                                          (lesson: any, lIdx: number) => (
                                            <Reorder.Item
                                              key={lesson.id}
                                              value={lesson}
                                              className="flex flex-col gap-2 p-2 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 group/lesson overflow-hidden transition-all duration-200"
                                            >
                                              <div className="flex items-center gap-2 w-full">
                                                <GripVertical className="w-3 h-3 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-slate-400 italic shrink-0">
                                                  {lIdx + 1}
                                                </div>
                                                <Input
                                                  value={lesson.title}
                                                  onChange={(e) => {
                                                    const newMods = [
                                                      ...currentCourse.modules,
                                                    ];
                                                    newMods[mIdx].lessons[
                                                      lIdx
                                                    ].title = e.target.value;
                                                    setCurrentCourse({
                                                      ...currentCourse,
                                                      modules: newMods,
                                                    });
                                                  }}
                                                  className="h-8 border-none bg-transparent font-bold text-xs sm:text-sm p-0 focus-visible:ring-0 flex-1 min-w-0"
                                                />
                                                <select
                                                  className="h-7 rounded-lg border-none bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase italic pl-1 pr-5 focus:ring-0 shrink-0 select-custom"
                                                  value={lesson.type}
                                                  onChange={(e) => {
                                                    const newMods = [
                                                      ...currentCourse.modules,
                                                    ];
                                                    newMods[mIdx].lessons[
                                                      lIdx
                                                    ].type = e.target.value;
                                                    // Clear content if type is changed, or set empty default
                                                    if (
                                                      newMods[mIdx].lessons[
                                                        lIdx
                                                      ].content === undefined
                                                    ) {
                                                      newMods[mIdx].lessons[
                                                        lIdx
                                                      ].content = "";
                                                    }
                                                    setCurrentCourse({
                                                      ...currentCourse,
                                                      modules: newMods,
                                                    });
                                                  }}
                                                >
                                                  <option value="TEXT">Text</option>
                                                  {(!mod.skillType || mod.skillType === "READING") && (
                                                    <>
                                                      <option value="READING">Reading (Split view)</option>
                                                      <option value="QUIZ">Quiz</option>
                                                      <option value="VOICE">Voice/Audio</option>
                                                    </>
                                                  )}
                                                  {(!mod.skillType || mod.skillType === "WRITING") && (
                                                    <>
                                                      <option value="WRITING">Writing (Split Screen)</option>
                                                    </>
                                                  )}
                                                  {(!mod.skillType || mod.skillType === "SPEAKING") && (
                                                    <>
                                                      <option value="VOICE">Voice Prompt</option>
                                                      <option value="PRACTICE">Interactive Practice</option>
                                                    </>
                                                  )}
                                                  {(!mod.skillType || mod.skillType === "LISTENING") && (
                                                    <>
                                                      <option value="LISTENING">Listening (Audio Stream)</option>
                                                      <option value="VOICE">Voice/Audio</option>
                                                      <option value="QUIZ">Listening Quiz</option>
                                                      <option value="VIDEO">Video</option>
                                                    </>
                                                  )}
                                                  {!mod.skillType && (
                                                    <option value="VIDEO">Video</option>
                                                  )}
                                                </select>

                                                {/* Toggle content details */}
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  type="button"
                                                  className={`h-6 w-6 shrink-0 transition-all ${expandedLessons[lesson.id] ? "text-primary bg-primary/10" : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                                  onClick={() =>
                                                    setExpandedLessons(
                                                      (prev) => ({
                                                        ...prev,
                                                        [lesson.id]:
                                                          !prev[lesson.id],
                                                      }),
                                                    )
                                                  }
                                                  title="Edit Lesson Content"
                                                >
                                                  <ChevronDown
                                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedLessons[lesson.id] ? "rotate-180" : ""}`}
                                                  />
                                                </Button>

                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  type="button"
                                                  className="h-6 w-6 text-slate-300 hover:text-red-500 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/lesson:opacity-100 transition-opacity"
                                                  onClick={() => {
                                                    const newMods = [
                                                      ...currentCourse.modules,
                                                    ];
                                                    newMods[mIdx].lessons =
                                                      newMods[
                                                        mIdx
                                                      ].lessons.filter(
                                                        (_: any, i: number) =>
                                                          i !== lIdx,
                                                      );
                                                    setCurrentCourse({
                                                      ...currentCourse,
                                                      modules: newMods,
                                                    });
                                                  }}
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>

                                              {/* Expandable options depending on raw content type */}
                                              {expandedLessons[lesson.id] && (
                                                <motion.div
                                                  initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                  }}
                                                  animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                  }}
                                                  exit={{
                                                    height: 0,
                                                    opacity: 0,
                                                  }}
                                                  className="w-full pl-0 sm:pl-8 pr-2 pb-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-4"
                                                >
                                                  {/* ================= TIMER SETTINGS SECTION ================= */}
                                                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 mb-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                      <div className="space-y-0.5">
                                                        <h5 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                          <Clock className="w-4 h-4 text-emerald-500" />
                                                          Lesson Time Limit
                                                        </h5>
                                                        <p className="text-[9px] text-slate-400 font-semibold italic">
                                                          {lesson.hasTimer ? "A timer is active for this lesson." : "Enable a time limit for this lesson/quiz."}
                                                        </p>
                                                      </div>
                                                      <div className="flex items-center gap-3">
                                                        {lesson.hasTimer && (
                                                          <div className="flex items-center gap-2">
                                                            <Input 
                                                              type="number" 
                                                              min="1" 
                                                              value={lesson.timeLimit || 5} 
                                                              onChange={(e) => {
                                                                const newMods = [...currentCourse.modules];
                                                                newMods[mIdx].lessons[lIdx].timeLimit = parseInt(e.target.value) || 5;
                                                                setCurrentCourse({ ...currentCourse, modules: newMods });
                                                              }}
                                                              className="w-16 h-8 text-xs text-center p-1 font-bold" 
                                                            />
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">min</span>
                                                          </div>
                                                        )}
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant={lesson.hasTimer ? "default" : "outline"}
                                                          className={`h-8 rounded-xl font-black text-[10px] uppercase tracking-wider ${lesson.hasTimer ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].hasTimer = !lesson.hasTimer;
                                                            if (!lesson.timeLimit) newMods[mIdx].lessons[lIdx].timeLimit = 5;
                                                            setCurrentCourse({ ...currentCourse, modules: newMods });
                                                          }}
                                                        >
                                                          {lesson.hasTimer ? "Timer Enabled" : "Enable Timer"}
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* ================= MULTI-PART SEQUENCED LESSON DESIGN SECTION ================= */}
                                                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 mb-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                      <div className="space-y-0.5">
                                                        <h5 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                          <Sliders className="w-4 h-4 text-emerald-500" />
                                                          Lesson Sequential Block Series
                                                        </h5>
                                                        <p className="text-[9px] text-slate-400 font-semibold italic">
                                                          {lesson.parts && lesson.parts.length > 0 
                                                            ? `This lesson consists of ${lesson.parts.length} sequential content parts.`
                                                            : "Convert this single-format lesson into a sequenced multi-part unit to combine text slides, reading pages, audios, video presentations, and multiple interactive quizzes."}
                                                        </p>
                                                      </div>
                                                      
                                                      {!lesson.parts || lesson.parts.length === 0 ? (
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="default"
                                                          className="h-8 rounded-xl font-black text-[10px] uppercase tracking-wider"
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].parts = [
                                                              {
                                                                id: `part-${Date.now()}-1`,
                                                                title: "Lecture Notes",
                                                                type: lesson.type || "TEXT",
                                                                content: lesson.content || "",
                                                                questions: lesson.questions || [],
                                                                audioUrl: lesson.audioUrl || "",
                                                                enableRecording: lesson.enableRecording !== false
                                                              }
                                                            ];
                                                            setCurrentCourse({
                                                              ...currentCourse,
                                                              modules: newMods,
                                                            });
                                                          }}
                                                        >
                                                          Convert to Multi-Part Sequenced Unit
                                                        </Button>
                                                      ) : (
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-xl select-none">
                                                          Multi-Part Mode Engaged
                                                        </span>
                                                      )}
                                                    </div>

                                                    {lesson.parts && lesson.parts.length > 0 && (
                                                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/40 dark:border-white/5 pt-2">
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-white/5"
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].parts.push({
                                                              id: `part-${Date.now()}-${Math.random()}`,
                                                              title: "New Lecture Text",
                                                              type: "TEXT",
                                                              content: "",
                                                              questions: []
                                                            });
                                                            setCurrentCourse({ ...currentCourse, modules: newMods });
                                                          }}
                                                        >
                                                          + Add Text Slide
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-white/5"
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].parts.push({
                                                              id: `part-${Date.now()}-${Math.random()}`,
                                                              title: "New Reading & Questions Set",
                                                              type: "READING",
                                                              content: "",
                                                              questions: []
                                                            });
                                                            setCurrentCourse({ ...currentCourse, modules: newMods });
                                                          }}
                                                        >
                                                          + Add Reading block
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-white/5"
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].parts.push({
                                                              id: `part-${Date.now()}-${Math.random()}`,
                                                              title: "Interactive Quiz Block",
                                                              type: "QUIZ",
                                                              content: "",
                                                              questions: []
                                                            });
                                                            setCurrentCourse({ ...currentCourse, modules: newMods });
                                                          }}
                                                        >
                                                          + Add Quiz block
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-white/5"
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].parts.push({
                                                              id: `part-${Date.now()}-${Math.random()}`,
                                                              title: "Linked Video block",
                                                              type: "VIDEO",
                                                              content: ""
                                                            });
                                                            setCurrentCourse({ ...currentCourse, modules: newMods });
                                                          }}
                                                        >
                                                          + Add Video Block
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-white/5"
                                                          onClick={() => {
                                                            const newMods = [...currentCourse.modules];
                                                            newMods[mIdx].lessons[lIdx].parts.push({
                                                              id: `part-${Date.now()}-${Math.random()}`,
                                                              title: "Speaking Practice block",
                                                              type: "VOICE",
                                                              content: "",
                                                              audioUrl: ""
                                                            });
                                                            setCurrentCourse({ ...currentCourse, modules: newMods });
                                                          }}
                                                        >
                                                          + Add Voice block
                                                        </Button>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* ================= SEQUENCE EDITOR INTERFACE FOR INSTANT DRAG/ORDER SELECTION ================= */}
                                                  {lesson.parts && lesson.parts.length > 0 && (
                                                    <div className="space-y-4">
                                                      {lesson.parts.map((part: any, pIdx: number) => {
                                                        const pType = part.type || "TEXT";
                                                        return (
                                                          <div 
                                                            key={part.id || pIdx} 
                                                            className="p-4 sm:p-5 bg-slate-100/30 dark:bg-white/5 rounded-3xl border border-slate-200/50 dark:border-white/5 space-y-4 shadow-sm"
                                                          >
                                                            {/* Part Header & Up / Down order management */}
                                                            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 dark:border-white/5">
                                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0">BLOCK {pIdx + 1}</span>
                                                                <Input
                                                                  placeholder="Part Title (e.g., Reading Assignment)"
                                                                  value={part.title || ""}
                                                                  onChange={(e) => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    newMods[mIdx].lessons[lIdx].parts[pIdx].title = e.target.value;
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                  className="h-7 font-black text-xs text-slate-800 dark:text-white bg-transparent border-none p-0 focus-visible:ring-0 min-w-0 font-bold"
                                                                />
                                                              </div>
                                                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                                                <select
                                                                  className="h-6 rounded-md border-none bg-slate-100 dark:bg-slate-900 text-[8px] font-black uppercase pl-1 pr-4 focus:ring-0 shrink-0"
                                                                  value={part.type}
                                                                  onChange={(e) => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    newMods[mIdx].lessons[lIdx].parts[pIdx].type = e.target.value;
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                >
                                                                  <option value="TEXT">Text Slide</option>
                                                                  <option value="READING">Reading & Questions</option>
                                                                  <option value="VIDEO">Video Embed</option>
                                                                  <option value="QUIZ">Interactive Quiz</option>
                                                                  <option value="VOICE">Speaking Practice</option>
                                                                  <option value="LISTENING">Listening (Audio Stream)</option>
                                                                </select>

                                                                {/* Move Block Up */}
                                                                <Button
                                                                  type="button"
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  className="h-6 w-6 text-slate-400 hover:text-indigo-500 rounded-md focus:bg-slate-50 disabled:opacity-30"
                                                                  disabled={pIdx === 0}
                                                                  onClick={() => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    const arr = newMods[mIdx].lessons[lIdx].parts;
                                                                    const tmp = arr[pIdx];
                                                                    arr[pIdx] = arr[pIdx - 1];
                                                                    arr[pIdx - 1] = tmp;
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                >
                                                                  <ArrowUp className="w-3.5 h-3.5" />
                                                                </Button>

                                                                {/* Move Block Down */}
                                                                <Button
                                                                  type="button"
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  className="h-6 w-6 text-slate-400 hover:text-indigo-500 rounded-md focus:bg-slate-50 disabled:opacity-30"
                                                                  disabled={pIdx === lesson.parts.length - 1}
                                                                  onClick={() => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    const arr = newMods[mIdx].lessons[lIdx].parts;
                                                                    const tmp = arr[pIdx];
                                                                    arr[pIdx] = arr[pIdx + 1];
                                                                    arr[pIdx + 1] = tmp;
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                >
                                                                  <ArrowDown className="w-3.5 h-3.5" />
                                                                </Button>

                                                                {/* Delete Block */}
                                                                <Button
                                                                  type="button"
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  className="h-6 w-6 text-slate-400 hover:text-red-500 rounded-md focus:bg-red-50"
                                                                  onClick={() => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    newMods[mIdx].lessons[lIdx].parts.splice(pIdx, 1);
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                >
                                                                  <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                              </div>
                                                            </div>

                                                            {/* Part Body Editor depending on block type */}
                                                            {(pType === "TEXT" || pType === "READING") && (
                                                              <div className="space-y-2">
                                                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                                                                  {pType === "READING" ? "Reading Passage Text Content" : "Lecture Content Slides"}
                                                                </span>
                                                                <RichTextEditor
                                                                  value={part.content || ""}
                                                                  onChange={(newVal) => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    newMods[mIdx].lessons[lIdx].parts[pIdx].content = newVal;
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                  placeholder={pType === "READING" ? "Type or paste reading passage contents..." : "Type text slide layout notes..."}
                                                                />
                                                              </div>
                                                            )}

                                                            {pType === "VIDEO" && (
                                                              <div className="space-y-2">
                                                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Presenter Video Link / Youtube URL</span>
                                                                <Input
                                                                  type="url"
                                                                  placeholder="e.g. YouTube video URL or embed"
                                                                  value={part.content || ""}
                                                                  onChange={(e) => {
                                                                    const newMods = [...currentCourse.modules];
                                                                    newMods[mIdx].lessons[lIdx].parts[pIdx].content = e.target.value;
                                                                    setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                  }}
                                                                  className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold"
                                                                />
                                                              </div>
                                                            )}

                                                            {(pType === "VOICE" || pType === "LISTENING") && (
                                                              <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Phonetic Audio Guide Resource (MP3)</span>
                                                                  <Input
                                                                    type="url"
                                                                    placeholder="https://example.com/audio.mp3"
                                                                    value={part.audioUrl || ""}
                                                                    onChange={(e) => {
                                                                      const newMods = [...currentCourse.modules];
                                                                      newMods[mIdx].lessons[lIdx].parts[pIdx].audioUrl = e.target.value;
                                                                      setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                    }}
                                                                    className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                                                                  />
                                                                </div>
                                                                <div className="space-y-1">
                                                                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Pronunciation Guidelines Transcript</span>
                                                                  <RichTextEditor
                                                                    value={part.content || ""}
                                                                    onChange={(newVal) => {
                                                                      const newMods = [...currentCourse.modules];
                                                                      newMods[mIdx].lessons[lIdx].parts[pIdx].content = newVal;
                                                                      setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                    }}
                                                                    placeholder="Type speech transcription references..."
                                                                  />
                                                                </div>
                                                              </div>
                                                            )}

                                                            {(pType === "QUIZ" || pType === "READING") && (
                                                              <div className="pt-3 border-t border-dashed border-slate-250 dark:border-white/5 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Interactive Evaluation Items</span>
                                                                  <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-6 text-[8px] font-black uppercase tracking-wider rounded-md border-indigo-100 dark:border-white/10 font-bold"
                                                                    onClick={() => {
                                                                      const newMods = [...currentCourse.modules];
                                                                      if (!newMods[mIdx].lessons[lIdx].parts[pIdx].questions) {
                                                                        newMods[mIdx].lessons[lIdx].parts[pIdx].questions = [];
                                                                      }
                                                                      newMods[mIdx].lessons[lIdx].parts[pIdx].questions.push({
                                                                        id: `qpqp-${Date.now()}-${Math.random()}`,
                                                                        type: "MCQ",
                                                                        text: "",
                                                                        options: ["", "", "", ""],
                                                                        correctIndex: 0
                                                                       });
                                                                       setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                     }}
                                                                  >
                                                                    + Add Standard Question
                                                                  </Button>
                                                                </div>

                                                                {part.questions && part.questions.length > 0 ? (
                                                                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                                    {part.questions.map((pq: any, pqIdx: number) => {
                                                                      const pqType = pq.type || "MCQ";
                                                                      return (
                                                                        <div key={pq.id || pqIdx} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-white/5 space-y-3 relative">
                                                                          {/* Trash item */}
                                                                          <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 h-5 w-5"
                                                                            onClick={() => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].parts[pIdx].questions.splice(pqIdx, 1);
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                          >
                                                                            <Trash2 className="w-3 h-3" />
                                                                          </Button>

                                                                          <div className="flex items-center justify-between mr-6">
                                                                            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Item {pqIdx + 1} ({pqType})</span>
                                                                            <select
                                                                              className="h-5 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-[8px] font-bold uppercase pl-1 pr-5 focus:ring-1 focus:ring-primary shrink-0 select-custom"
                                                                              value={pqType}
                                                                              onChange={(e) => {
                                                                                const newMods = [...currentCourse.modules];
                                                                                const tgtInput = e.target.value;
                                                                                newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].type = tgtInput;
                                                                                if (tgtInput === "TF") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = ["TRUE", "FALSE", "NOT GIVEN"];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctIndex = 0;
                                                                                } else if (tgtInput === "YN") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = ["YES", "NO", "NOT GIVEN"];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctIndex = 0;
                                                                                } else if (tgtInput === "MCQ") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = ["", "", "", ""];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctIndex = 0;
                                                                                } else if (tgtInput === "BLANK") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = [];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctAnswer = "";
                                                                                } else if (tgtInput === "PASSAGE") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = [];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctAnswer = "";
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].passageText = "";
                                                                                } else if (tgtInput === "MATCHING") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = [];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctAnswer = "";
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].passageText = "";
                                                                                } else if (tgtInput === "INLINE_BLANKS") {
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options = [];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctAnswer = "";
                                                                                }
                                                                                setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                              }}
                                                                            >
                                                                              <option value="MCQ">MCQ</option>
                                                                              <option value="TF">TRUE / FALSE</option>
                                                                               <option value="YN">YES / NO / NOT GIVEN</option>
                                                                               <option value="BLANK">FILL BLANK</option>
                                                                              <option value="PASSAGE">PASSAGE BASED</option>
                                                                              <option value="MATCHING">MATCHING HEADINGS</option>
                                                                              <option value="INLINE_BLANKS">PARAGRAPH WITH BLANKS</option>
                                                                            </select>
                                                                          </div>

                                                                          {/* Instructions headings inside parts */}
                                                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/25 p-2 rounded-xl border border-slate-100">
                                                                            <div className="space-y-0.5">
                                                                              <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Group Heading (e.g. Questions 27-30)</span>
                                                                              <Input
                                                                                placeholder="Questions X-Y"
                                                                                value={pq.sectionHeading || ""}
                                                                                onChange={(e) => {
                                                                                  const newMods = [...currentCourse.modules];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].sectionHeading = e.target.value;
                                                                                  setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className="h-6 text-[9px] font-semibold bg-white dark:bg-slate-900 border border-slate-100 rounded"
                                                                              />
                                                                            </div>
                                                                            <div className="space-y-0.5">
                                                                              <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Group Instruction</span>
                                                                              <Input
                                                                                placeholder="IELTS standard instruction details..."
                                                                                value={pq.sectionInstruction || ""}
                                                                                onChange={(e) => {
                                                                                  const newMods = [...currentCourse.modules];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].sectionInstruction = e.target.value;
                                                                                  setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className="h-6 text-[9px] font-semibold bg-white dark:bg-slate-900 border border-slate-100 rounded"
                                                                              />
                                                                            </div>
                                                                          </div>

                                                                          {(pqType === "PASSAGE" || pqType === "MATCHING") && (
                                                                            <div className="space-y-1">
                                                                              <span className="text-[8px] font-black uppercase text-indigo-400 block tracking-wider">{pqType === "MATCHING" ? "List of Headings / Options (separated by enter)" : "Reference Passage Segment"}</span>
                                                                              <textarea
                                                                                placeholder={pqType === "MATCHING" ? "i. Heading A\\nii. Heading B\\niii. Heading C" : "Type or paste short paragraph segment of passage..."}
                                                                                value={pq.passageText || ""}
                                                                                onChange={(e) => {
                                                                                   const newMods = [...currentCourse.modules];
                                                                                   newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].passageText = e.target.value;
                                                                                   setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className="w-full text-[10px] font-semibold p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 rounded-lg min-h-[60px]"
                                                                              />
                                                                            </div>
                                                                          )}

                                                                          <div className="space-y-1">
                                                                            {(pqType === "MATCHING" || pqType === "INLINE_BLANKS") ? (
                                                                              <textarea
                                                                                placeholder={pqType === "MATCHING" ? "Enter prompts separated by enter key (e.g. 14. Section A)" : "Paragraph with _____ for blanks..."}
                                                                                value={pq.text || ""}
                                                                                onChange={(e) => {
                                                                                  const newMods = [...currentCourse.modules];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].text = e.target.value;
                                                                                  setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className="w-full border-none bg-slate-50 dark:bg-slate-950 font-bold text-[11px] rounded p-2 min-h-[80px]"
                                                                              />
                                                                            ) : (
                                                                              <Input
                                                                                placeholder={pqType === "BLANK" || pqType === "PASSAGE" ? "Type statement with blank placeholders _____ ..." : "Type question criteria..."}
                                                                                value={pq.text || ""}
                                                                                onChange={(e) => {
                                                                                  const newMods = [...currentCourse.modules];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].text = e.target.value;
                                                                                  setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className="h-7 border-none bg-slate-50 dark:bg-slate-950 font-bold text-[11px] rounded"
                                                                              />
                                                                            )}
                                                                          </div>

                                                                          {pqType === "MCQ" && (
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                              {(pq.options || []).map((oVal: string, oIdx: number) => (
                                                                                <div key={oIdx} className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-dashed">
                                                                                  <input
                                                                                    type="radio"
                                                                                    name={`pq-item-radio-${pIdx}-${pqIdx}`}
                                                                                    checked={pq.correctIndex === oIdx}
                                                                                    onChange={() => {
                                                                                      const newMods = [...currentCourse.modules];
                                                                                      newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctIndex = oIdx;
                                                                                      setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                    }}
                                                                                    className="w-3 h-3 text-primary"
                                                                                  />
                                                                                  <Input
                                                                                    placeholder={`Option ${oIdx + 1}`}
                                                                                    value={oVal}
                                                                                    onChange={(e) => {
                                                                                      const newMods = [...currentCourse.modules];
                                                                                      newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].options[oIdx] = e.target.value;
                                                                                      setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                    }}
                                                                                    className="h-5 text-[9px] bg-transparent border-none p-0 focus-visible:ring-0"
                                                                                  />
                                                                                </div>
                                                                              ))}
                                                                            </div>
                                                                          )}

                                                                          {(pqType === "TF" || pqType === "YN") && (
                                                                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/30 p-1 text-[10px] rounded border border-slate-100">
                                                                              {(pqType === "TF" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]).map((vTF, iTF) => (
                                                                                <label key={iTF} className="flex items-center gap-1 cursor-pointer font-black text-[9px] select-none font-bold">
                                                                                  <input
                                                                                    type="radio"
                                                                                    name={`pq-item-tf-${pIdx}-${pqIdx}`}
                                                                                    checked={pq.correctIndex === iTF}
                                                                                    onChange={() => {
                                                                                      const newMods = [...currentCourse.modules];
                                                                                      newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctIndex = iTF;
                                                                                      setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                    }}
                                                                                    className="w-3 h-3 text-primary"
                                                                                  />
                                                                                  {vTF}
                                                                                </label>
                                                                              ))}
                                                                            </div>
                                                                          )}

                                                                          {(pqType === "BLANK" || pqType === "PASSAGE" || pqType === "MATCHING" || pqType === "INLINE_BLANKS") && (
                                                                            <div className="space-y-1">
                                                                              <span className="text-[8px] font-black uppercase text-emerald-500 block tracking-wider">Correct Answers set</span>
                                                                              <Input
                                                                                placeholder={pqType === "INLINE_BLANKS" ? "Separate blanks by | (e.g. cat|dog)" : pqType === "MATCHING" ? "Enter corresponding exact heading prefixes (e.g. i\\nii)" : "Type correct term (e.g., three, 3)"}
                                                                                value={pq.correctAnswer || ""}
                                                                                onChange={(e) => {
                                                                                  const newMods = [...currentCourse.modules];
                                                                                  newMods[mIdx].lessons[lIdx].parts[pIdx].questions[pqIdx].correctAnswer = e.target.value;
                                                                                  setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className="h-6 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-150 rounded-md"
                                                                              />
                                                                            </div>
                                                                          )}
                                                                        </div>
                                                                      );
                                                                    })}
                                                                  </div>
                                                                ) : (
                                                                  <p className="text-[9px] italic text-slate-400 bg-slate-50 dark:bg-transparent p-2 rounded-lg border border-dashed border-slate-150">No questions built inside this part block yet.</p>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}

                                                  {/* Fallback to traditional block editor when single-format block sequence is preferred */}
                                                  {(!lesson.parts || lesson.parts.length === 0) && (
                                                    <>
                                                      {/* ================= TEXT TYPE LESSON WRAPPER ================= */}
                                                      {(lesson.type === "TEXT" || lesson.type === "READING" || lesson.type === "WRITING" || lesson.type === "LISTENING" || lesson.type === "VOICE") && (
                                                    <div className="space-y-3">
                                                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                          {lesson.type === "READING" ? "Reading Passage Text Content" : lesson.type === "WRITING" ? "Writing Prompt Content" : "Lesson Lecture Content"}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            type="button"
                                                            className={`h-7 px-3 rounded-lg text-xs font-bold ${!textEditorMode[lesson.id] || textEditorMode[lesson.id] === "edit" ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-slate-500"}`}
                                                            onClick={() =>
                                                              setTextEditorMode(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [lesson.id]:
                                                                    "edit",
                                                                }),
                                                              )
                                                            }
                                                          >
                                                            <Edit3 className="w-3 h-3 mr-1" />{" "}
                                                            Editor
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            type="button"
                                                            className={`h-7 px-3 rounded-lg text-xs font-bold ${textEditorMode[lesson.id] === "preview" ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-slate-500"}`}
                                                            onClick={() =>
                                                              setTextEditorMode(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [lesson.id]:
                                                                    "preview",
                                                                }),
                                                              )
                                                            }
                                                          >
                                                            <Eye className="w-3 h-3 mr-1" />{" "}
                                                            Live Preview
                                                          </Button>
                                                        </div>
                                                      </div>

                                                      {!textEditorMode[
                                                        lesson.id
                                                      ] ||
                                                      textEditorMode[
                                                        lesson.id
                                                      ] === "edit" ? (
                                                        <RichTextEditor
                                                          value={lesson.content || ""}
                                                          onChange={(newValue) => {
                                                            const newMods = [
                                                              ...currentCourse.modules,
                                                            ];
                                                            newMods[mIdx].lessons[lIdx].content = newValue;
                                                            setCurrentCourse({
                                                              ...currentCourse,
                                                              modules: newMods,
                                                            });
                                                          }}
                                                          placeholder={lesson.type === "READING" ? "Paste/type reading assessment passage text content here..." : lesson.type === "WRITING" ? "Paste/type writing task prompt here..." : "Type academic guidelines, key vocabulary arrays, study lists, or lecture guides..."}
                                                        />
                                                      ) : (
                                                        <div className="p-4 border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl min-h-[160px] max-h-[300px] overflow-y-auto">
                                                          {renderPreviewText(
                                                            lesson.content ||
                                                              "",
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  {/* ================= VIDEO TYPE LESSON WRAPPER ================= */}
                                                  {lesson.type === "VIDEO" && (
                                                    <div className="space-y-3">
                                                      <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                                                          Video Lecture Embed
                                                          Link or URL
                                                        </label>
                                                        <Input
                                                          type="url"
                                                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or Vimeo URL"
                                                          value={
                                                            lesson.content || ""
                                                          }
                                                          onChange={(e) => {
                                                            const newMods = [
                                                              ...currentCourse.modules,
                                                            ];
                                                            newMods[
                                                              mIdx
                                                            ].lessons[
                                                              lIdx
                                                            ].content =
                                                              e.target.value;
                                                            setCurrentCourse({
                                                              ...currentCourse,
                                                              modules: newMods,
                                                            });
                                                          }}
                                                          className="h-10 rounded-xl font-semibold text-xs focus-visible:ring-primary/20 bg-white dark:bg-slate-950"
                                                        />
                                                      </div>

                                                      {lesson.content ? (
                                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-3 rounded-2xl">
                                                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 italic flex items-center gap-1.5">
                                                            <Video className="w-3 h-3 text-red-500 animate-pulse" />{" "}
                                                            Playback Preview Box
                                                          </p>
                                                          {getEmbedUrl(
                                                            lesson.content,
                                                          ).includes("http") ? (
                                                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-md border-2 border-white dark:border-slate-800">
                                                              <iframe
                                                                src={getEmbedUrl(
                                                                  lesson.content,
                                                                )}
                                                                className="w-full h-full"
                                                                allowFullScreen
                                                                title="Lesson Video Preview"
                                                              />
                                                            </div>
                                                          ) : (
                                                            <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
                                                              Pasted path may
                                                              not support inline
                                                              preview but player
                                                              will attempt
                                                              fallback load
                                                              during lessons.
                                                            </div>
                                                          )}
                                                        </div>
                                                      ) : (
                                                        <p className="text-[9px] text-slate-400 italic">
                                                          Input valid
                                                          educational stream
                                                          sources to generate
                                                          diagnostic players for
                                                          candidate screens.
                                                        </p>
                                                      )}
                                                    </div>
                                                  )}

                                                  {/* ================= VOICE TYPE LESSON WRAPPER ================= */}
                                                  {(lesson.type === "VOICE" || lesson.type === "LISTENING") && (
                                                    <div className="space-y-4">
                                                      <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                                                          Audio Stream URL / Reference Audio Link
                                                        </label>
                                                        <Input
                                                          type="url"
                                                          placeholder="e.g. https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                                                          value={lesson.audioUrl || ""}
                                                          onChange={(e) => {
                                                            const newMods = [
                                                              ...currentCourse.modules,
                                                            ];
                                                            newMods[mIdx].lessons[lIdx].audioUrl = e.target.value;
                                                            setCurrentCourse({
                                                              ...currentCourse,
                                                              modules: newMods,
                                                            });
                                                          }}
                                                          className="h-10 rounded-xl font-semibold text-xs focus-visible:ring-primary/20 bg-white dark:bg-slate-950"
                                                        />
                                                      </div>

                                                      {/* Audio preview playback box */}
                                                      {lesson.audioUrl && (
                                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-3 rounded-2xl">
                                                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 italic flex items-center gap-1.5">
                                                            <Music className="w-3" /> Audio Player Preview
                                                          </p>
                                                          <audio src={lesson.audioUrl} controls className="w-full" />
                                                        </div>
                                                      )}

                                                      <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                                                          Voice Lesson Guidelines / Transcription / Study Notes
                                                        </label>
                                                        <RichTextEditor
                                                          value={lesson.content || ""}
                                                          onChange={(newValue) => {
                                                            const newMods = [
                                                              ...currentCourse.modules,
                                                            ];
                                                            newMods[mIdx].lessons[lIdx].content = newValue;
                                                            setCurrentCourse({
                                                              ...currentCourse,
                                                              modules: newMods,
                                                            });
                                                          }}
                                                          placeholder="Type speaking instructions, phonetic tips, transcriptions or audio summary guidelines..."
                                                        />
                                                      </div>

                                                      {/* Interactive configuration toggles */}
                                                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                                                        <div>
                                                          <p className="text-xs font-black text-slate-800 dark:text-white leading-none">
                                                            Interactive Speaking Practice
                                                          </p>
                                                          <p className="text-[9px] text-slate-400 font-semibold italic mt-1 leading-none">
                                                            Enable high-fidelity voice recorder and real-time transcribing console for student trials.
                                                          </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <input 
                                                            type="checkbox"
                                                            id={`enable-rec-${lesson.id}`}
                                                            checked={lesson.enableRecording !== false} // True by default
                                                            onChange={(e) => {
                                                              const newMods = [
                                                                ...currentCourse.modules,
                                                              ];
                                                              newMods[mIdx].lessons[lIdx].enableRecording = e.target.checked;
                                                              setCurrentCourse({
                                                                ...currentCourse,
                                                                modules: newMods,
                                                              });
                                                            }}
                                                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}

                                                  {/* ================= QUIZ OR PRACTICE TYPE LESSON WRAPPER ================= */}
                                                  {(lesson.type === "QUIZ" || lesson.type === "READING" ||
                                                    lesson.type ===
                                                      "PRACTICE") && (
                                                    <div className="space-y-4">
                                                      {/* Selection Matrix */}
                                                      <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                        <div>
                                                          <p className="text-xs font-black text-slate-800 dark:text-white leading-none">
                                                            Lesson Quiz
                                                            Configuration
                                                          </p>
                                                          <p className="text-[9px] text-slate-400 font-semibold italic mt-1 leading-none">
                                                            Determine where this
                                                            lesson retrieves its
                                                            questionnaire schema
                                                          </p>
                                                        </div>
                                                        <select
                                                          className="h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold px-2 pr-6 focus:ring-1 focus:ring-primary"
                                                          value={
                                                            lesson.quizType ||
                                                            "DYNAMIC"
                                                          }
                                                          onChange={(e) => {
                                                            const newMods = [
                                                              ...currentCourse.modules,
                                                            ];
                                                            newMods[
                                                              mIdx
                                                            ].lessons[
                                                              lIdx
                                                            ].quizType =
                                                              e.target.value;
                                                            if (
                                                              e.target.value ===
                                                                "DYNAMIC" &&
                                                              !newMods[mIdx]
                                                                .lessons[lIdx]
                                                                .questions
                                                            ) {
                                                              newMods[
                                                                mIdx
                                                              ].lessons[
                                                                lIdx
                                                              ].questions = [];
                                                            }
                                                            setCurrentCourse({
                                                              ...currentCourse,
                                                              modules: newMods,
                                                            });
                                                          }}
                                                        >
                                                          <option value="DYNAMIC">
                                                            Build Inline
                                                            Questions (Dynamic)
                                                          </option>
                                                          <option value="MASTER_QUIZ">
                                                            Link a Master Quiz
                                                            (Workshop)
                                                          </option>
                                                        </select>
                                                      </div>

                                                      {/* Options Rendering */}
                                                      {lesson.quizType ===
                                                      "MASTER_QUIZ" ? (
                                                        <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                            Select Associated
                                                            Master Quiz
                                                          </Label>
                                                          <select
                                                            className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-900 px-3 text-xs font-bold"
                                                            value={
                                                              lesson.linkedQuizId ||
                                                              ""
                                                            }
                                                            onChange={(e) => {
                                                              const newMods = [
                                                                ...currentCourse.modules,
                                                              ];
                                                              newMods[
                                                                mIdx
                                                              ].lessons[
                                                                lIdx
                                                              ].linkedQuizId =
                                                                e.target.value;
                                                              // Also find and assign quiz name for public viewing if helpful
                                                              const matchQuiz =
                                                                quizzes.find(
                                                                  (q) =>
                                                                    q.id ===
                                                                    e.target
                                                                      .value,
                                                                );
                                                              if (matchQuiz) {
                                                                newMods[
                                                                  mIdx
                                                                ].lessons[
                                                                  lIdx
                                                                ].title =
                                                                  `Quiz: ${matchQuiz.title}`;
                                                              }
                                                              setCurrentCourse({
                                                                ...currentCourse,
                                                                modules:
                                                                  newMods,
                                                              });
                                                            }}
                                                          >
                                                            <option value="">
                                                              -- Choose Workshop
                                                              Quiz --
                                                            </option>
                                                            {quizzes.map(
                                                              (qz) => (
                                                                <option
                                                                  key={qz.id}
                                                                  value={qz.id}
                                                                >
                                                                  {qz.title} (
                                                                  {qz.questions
                                                                    ?.length ||
                                                                    0}{" "}
                                                                  items)
                                                                </option>
                                                              ),
                                                            )}
                                                          </select>
                                                          <p className="text-[9px] text-slate-400 italic">
                                                            Select one of your
                                                            pre-built quizzes
                                                            created within the
                                                            Dedicated "Quiz
                                                            Workshop" tab.
                                                          </p>
                                                        </div>
                                                      ) : (
                                                        /* DYNAMIC INLINE MCQS */
                                                        <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                                          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-2 mb-2">
                                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                              Inline Question
                                                              Sheets (
                                                              {
                                                                (
                                                                  lesson.questions ||
                                                                  []
                                                                ).length
                                                              }
                                                              )
                                                            </Label>
                                                                                           <div className="flex items-center gap-2">
                                                              <Button
                                                                type="button"
                                                                size="sm"
                                                                className="h-6 rounded-lg text-[9px] font-black uppercase tracking-wider px-2 bg-primary hover:bg-primary/90 text-white"
                                                                onClick={() => {
                                                                  const newMods =
                                                                    [
                                                                      ...currentCourse.modules,
                                                                    ];
                                                                  const existingQuestions =
                                                                    newMods[mIdx]
                                                                      .lessons[
                                                                      lIdx
                                                                    ].questions ||
                                                                    [];
                                                                  newMods[
                                                                    mIdx
                                                                  ].lessons[
                                                                    lIdx
                                                                  ].questions = [
                                                                    ...existingQuestions,
                                                                    {
                                                                      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                                                      type: "MCQ",
                                                                      correctAnswer: "",
                                                                      text: "",
                                                                      options: [
                                                                        "",
                                                                        "",
                                                                        "",
                                                                        "",
                                                                      ],
                                                                      correctIndex: 0,
                                                                    },
                                                                  ];
                                                                  setCurrentCourse(
                                                                    {
                                                                      ...currentCourse,
                                                                      modules:
                                                                        newMods,
                                                                    },
                                                                  );
                                                                }}
                                                              >
                                                                + Add Question
                                                              </Button>
                                                              
                                                              <label
                                                                className="h-6 rounded-lg text-[9px] font-black uppercase tracking-wider px-2 bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                                                title="Columns: question, option a, option b, option c, option d, correct answer"
                                                              >
                                                                <File className="w-3 h-3" />
                                                                <span>Import CSV</span>
                                                                <input
                                                                  type="file"
                                                                  accept=".csv"
                                                                  className="hidden"
                                                                  onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                      const text = event.target?.result as string;
                                                                      if (text) {
                                                                        const imported = parseCSV(text);
                                                                        if (imported.length > 0) {
                                                                          const newMods = [...currentCourse.modules];
                                                                          const existingQuestions = newMods[mIdx].lessons[lIdx].questions || [];
                                                                          newMods[mIdx].lessons[lIdx].questions = [
                                                                            ...existingQuestions,
                                                                            ...imported
                                                                          ];
                                                                          setCurrentCourse({
                                                                            ...currentCourse,
                                                                            modules: newMods
                                                                          });
                                                                        } else {
                                                                          console.warn("Could not find any valid questions in the CSV.");
                                                                        }
                                                                      }
                                                                    };
                                                                    reader.readAsText(file);
                                                                    e.target.value = "";
                                                                  }}
                                                                />
                                                              </label>
                                                            </div>
                                                          </div>

                                                          {lesson.questions &&
                                                          lesson.questions
                                                            .length > 0 ? (
                                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                                              {lesson.questions.map(
                                                                (
                                                                  q: any,
                                                                  qIdx: number,
                                                                ) => {
                                                                  const qType = q.type || "MCQ";
                                                                  return (
                                                                    <div
                                                                       key={`admin-q-${q.id || qIdx}-${qIdx}`}
                                                                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 space-y-3 relative group/ques shadow-sm"
                                                                    >
                                                                      <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 h-5 w-5"
                                                                        onClick={() => {
                                                                          const newMods =
                                                                            [
                                                                              ...currentCourse.modules,
                                                                            ];
                                                                          newMods[
                                                                            mIdx
                                                                          ].lessons[
                                                                            lIdx
                                                                          ].questions =
                                                                            newMods[
                                                                              mIdx
                                                                            ].lessons[
                                                                              lIdx
                                                                            ].questions.filter(
                                                                              (
                                                                                item: any,
                                                                              ) =>
                                                                                item.id !==
                                                                                q.id,
                                                                            );
                                                                          setCurrentCourse(
                                                                            {
                                                                              ...currentCourse,
                                                                              modules:
                                                                                newMods,
                                                                            },
                                                                          );
                                                                        }}
                                                                      >
                                                                        <Trash2 className="w-3 h-3" />
                                                                      </Button>

                                                                      <div className="flex items-center justify-between mr-6">
                                                                        <span className="text-[9px] font-black uppercase text-primary italic tracking-wider block">
                                                                          Question {qIdx + 1}
                                                                        </span>
                                                                        <select
                                                                          className="h-6 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-[9px] font-bold uppercase tracking-wider pl-1.5 pr-6 focus:ring-1 focus:ring-primary focus:border-primary shrink-0 select-custom"
                                                                          value={qType}
                                                                          onChange={(e) => {
                                                                            const newMods = [...currentCourse.modules];
                                                                            const targetType = e.target.value;
                                                                            newMods[mIdx].lessons[lIdx].questions[qIdx].type = targetType;
                                                                            if (targetType === "TF") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = ["TRUE", "FALSE", "NOT GIVEN"];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndex = 0;
                                                                            } else if (targetType === "YN") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = ["YES", "NO", "NOT GIVEN"];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndex = 0;
                                                                            } else if (targetType === "MCQ") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = ["", "", "", ""];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndex = 0;
                                                                            } else if (targetType === "MULTI_MCQ") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = ["", "", "", "", ""];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndexes = [];
                                                                            } else if (targetType === "BLANK") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = [];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctAnswer = "";
                                                                            } else if (targetType === "PASSAGE") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = [];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctAnswer = "";
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].passageText = "";
                                                                            } else if (targetType === "MATCHING") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = [];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctAnswer = "";
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].passageText = "";
                                                                            } else if (targetType === "INLINE_BLANKS") {
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].options = [];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctAnswer = "";
                                                                            }
                                                                            setCurrentCourse({
                                                                              ...currentCourse,
                                                                              modules: newMods,
                                                                            });
                                                                          }}
                                                                        >
                                                                          <option value="MCQ">MCQ</option>
                                                                          <option value="MULTI_MCQ">MCQ (Multiple Answers)</option>
                                                                          <option value="TF">TRUE / FALSE</option>
                                                                          <option value="YN">YES / NO / NOT GIVEN</option>
                                                                          <option value="BLANK">FILL BLANK</option>
                                                                          <option value="PASSAGE">PASSAGE BASED</option>
                                                                          <option value="MATCHING">MATCHING HEADINGS</option>
                                                                          <option value="INLINE_BLANKS">PARAGRAPH WITH BLANKS</option>
                                                                        </select>
                                                                      </div>

                                                                      {/* Optional Section Heading & Instructions */}
                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                                                                        <div className="space-y-0.5">
                                                                          <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Group Heading (e.g., Questions 27-30)</span>
                                                                          <Input
                                                                            placeholder="No group heading"
                                                                            value={q.sectionHeading || ""}
                                                                            onChange={(e) => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].sectionHeading = e.target.value;
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                            className="h-7 text-[10px] font-semibold bg-white dark:bg-slate-900 border-none rounded-md"
                                                                          />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                          <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Group Instruction</span>
                                                                          <Input
                                                                            placeholder="No group instructions"
                                                                            value={q.sectionInstruction || ""}
                                                                            onChange={(e) => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].sectionInstruction = e.target.value;
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                            className="h-7 text-[10px] font-semibold bg-white dark:bg-slate-900 border-none rounded-md"
                                                                          />
                                                                        </div>
                                                                      </div>
                                                                      
                                                                      {(qType === 'PASSAGE' || qType === 'MATCHING') && (
                                                                        <div className="space-y-1">
                                                                          <span className="text-[8px] font-black uppercase text-indigo-400 block tracking-wider">{qType === "MATCHING" ? "List of Headings / Options (separated by enter)" : "Reference Passage Segment"}</span>
                                                                          <textarea
                                                                            placeholder={qType === "MATCHING" ? "i. Heading A\\nii. Heading B\\niii. Heading C" : "Type or paste the short passage segment here..."}
                                                                            value={q.passageText || ""}
                                                                            onChange={(e) => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].passageText = e.target.value;
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                            className="w-full text-xs font-semibold p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-lg min-h-[60px]"
                                                                          />
                                                                        </div>
                                                                      )}

                                                                      <div className="space-y-1">
                                                                        {(qType === "MATCHING" || qType === "INLINE_BLANKS") ? (
                                                                          <textarea
                                                                            placeholder={qType === "MATCHING" ? "Enter prompts separated by enter key" : "Paragraph with _____ for blanks..."}
                                                                            value={q.text || ""}
                                                                            onChange={(e) => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].text = e.target.value;
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                            className="w-full border-none bg-slate-50 dark:bg-slate-950 font-bold text-xs rounded-lg p-2 min-h-[80px]"
                                                                          />
                                                                        ) : (
                                                                          <Input
                                                                            placeholder={
                                                                              qType === 'TF' 
                                                                                ? "Type True/False statement..." 
                                                                                : (qType === 'BLANK' || qType === 'PASSAGE')
                                                                                  ? "Type sentence with blank placeholder (use _____ to indicate blanks)..."
                                                                                  : "Type multiple choice question prompt..."
                                                                            }
                                                                            value={q.text || ""}
                                                                            onChange={(e) => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].text = e.target.value;
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                            className="h-8 border-none bg-slate-50 dark:bg-slate-950 font-bold text-xs rounded-lg"
                                                                          />
                                                                        )}
                                                                      </div>

                                                                      {/* MCQ Choice List */}
                                                                      {(qType === 'MCQ' || qType === 'MULTI_MCQ') && (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                          {(
                                                                            q.options || [
                                                                              "",
                                                                              "",
                                                                              "",
                                                                              "",
                                                                            ]
                                                                          ).map(
                                                                            (
                                                                              opt: string,
                                                                              optIdx: number,
                                                                            ) => {
                                                                              const isCorrect = qType === 'MCQ' 
                                                                                ? q.correctIndex === optIdx
                                                                                : (q.correctIndexes || []).includes(optIdx);

                                                                              return (
                                                                                <div
                                                                                  key={
                                                                                    optIdx
                                                                                  }
                                                                                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] ${isCorrect ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-400" : "bg-transparent border-slate-100 dark:border-white/5"}`}
                                                                                >
                                                                                  <input
                                                                                    type={qType === 'MCQ' ? "radio" : "checkbox"}
                                                                                    name={`ans-${q.id}`}
                                                                                    checked={isCorrect}
                                                                                    onChange={() => {
                                                                                      const newMods = [...currentCourse.modules];
                                                                                      if (qType === 'MCQ') {
                                                                                        newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndex = optIdx;
                                                                                      } else {
                                                                                        const current = newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndexes || [];
                                                                                        if (current.includes(optIdx)) {
                                                                                          newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndexes = current.filter((i: number) => i !== optIdx);
                                                                                        } else {
                                                                                          newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndexes = [...current, optIdx];
                                                                                        }
                                                                                      }
                                                                                      setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                    }}
                                                                                    className="h-3 w-3 accent-emerald-500 cursor-pointer"
                                                                                  />
                                                                                <Input
                                                                                  placeholder={`Choice ${optIdx + 1}`}
                                                                                  value={
                                                                                    opt ||
                                                                                    ""
                                                                                  }
                                                                                  onChange={(
                                                                                    e,
                                                                                  ) => {
                                                                                    const newMods =
                                                                                      [
                                                                                        ...currentCourse.modules,
                                                                                      ];
                                                                                    const updatedOptions =
                                                                                      [
                                                                                        ...(newMods[
                                                                                          mIdx
                                                                                        ]
                                                                                          .lessons[
                                                                                          lIdx
                                                                                        ]
                                                                                          .questions[
                                                                                          qIdx
                                                                                        ]
                                                                                          .options || [
                                                                                          "",
                                                                                          "",
                                                                                          "",
                                                                                          "",
                                                                                        ]),
                                                                                      ];
                                                                                    updatedOptions[
                                                                                      optIdx
                                                                                    ] =
                                                                                      e.target.value;
                                                                                    newMods[
                                                                                      mIdx
                                                                                    ].lessons[
                                                                                      lIdx
                                                                                    ].questions[
                                                                                      qIdx
                                                                                    ].options =
                                                                                      updatedOptions;
                                                                                    setCurrentCourse(
                                                                                      {
                                                                                        ...currentCourse,
                                                                                        modules:
                                                                                          newMods,
                                                                                      },
                                                                                    );
                                                                                  }}
                                                                                  className="h-6 border-none bg-transparent p-0 font-semibold text-xs text-slate-700 dark:text-slate-300 focus-visible:ring-0"
                                                                                />
                                                                              </div>
                                                                            );
                                                                          }
                                                                        )}
                                                                      </div>
                                                                    )}

                                                                      {/* True / False / Not Given Selectors */}
                                                                      {(qType === 'TF' || qType === 'YN') && (
                                                                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950/40 rounded-lg">
                                                                          {(qType === 'TF' ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]).map((opt, optIdx) => {
                                                                            const isActive = q.correctIndex === optIdx;
                                                                            return (
                                                                              <button
                                                                                type="button"
                                                                                key={optIdx}
                                                                                onClick={() => {
                                                                                  const newMods = [...currentCourse.modules];
                                                                                  newMods[mIdx].lessons[lIdx].questions[qIdx].correctIndex = optIdx;
                                                                                  setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                                }}
                                                                                className={`py-1 rounded font-bold text-[9px] uppercase text-center cursor-pointer transition-all border ${isActive ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5"}`}
                                                                              >
                                                                                {opt}
                                                                              </button>
                                                                            );
                                                                          })}
                                                                        </div>
                                                                      )}

                                                                      {/* Fill in the Blanks Correct Answer Term */}
                                                                      {(qType === 'BLANK' || qType === 'PASSAGE' || qType === 'MATCHING' || qType === 'INLINE_BLANKS') && (
                                                                        <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-white/5">
                                                                          <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider block">Set Correct Term(s)</span>
                                                                          <Input
                                                                            placeholder={qType === "INLINE_BLANKS" ? "Separate blanks by | (e.g. cat|dog)" : qType === "MATCHING" ? "Enter corresponding headings..." : "balances, credit balances..."}
                                                                            value={q.correctAnswer || ""}
                                                                            onChange={(e) => {
                                                                              const newMods = [...currentCourse.modules];
                                                                              newMods[mIdx].lessons[lIdx].questions[qIdx].correctAnswer = e.target.value;
                                                                              setCurrentCourse({ ...currentCourse, modules: newMods });
                                                                            }}
                                                                            className="h-7 w-full border bg-white dark:bg-slate-900 border-slate-100 rounded-md font-semibold text-[11px] focus-visible:ring-1"
                                                                          />
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  );
                                                                },
                                                              )}
                                                            </div>
                                                          ) : (
                                                            <div className="text-center py-6 text-xs text-slate-400 font-bold italic border border-dashed border-slate-100 dark:border-white/5 rounded-xl">
                                                              No dynamic
                                                              questions built.
                                                              Click "+ Add
                                                              Question" to
                                                              construct
                                                              candidate
                                                              evaluations.
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  </>)}
                                                </motion.div>
                                              )}
                                            </Reorder.Item>
                                          ),
                                        )}
                                      </Reorder.Group>
                                    </div>
                                  </Reorder.Item>
                                ),
                              )}
                            </Reorder.Group>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3 pt-6 w-full">
                            <Button
                              type="button"
                              disabled={isSaving}
                              className="lg:flex-1 h-12 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
                              onClick={() => {
                                const updatedCourse = {
                                  ...currentCourse,
                                  status: "Published",
                                };
                                setCurrentCourse(updatedCourse);
                                handleSave(
                                  "courses",
                                  updatedCourse,
                                  setIsEditingCourse,
                                );
                              }}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Lock in Curriculum
                            </Button>

                            <Button
                              type="button"
                              disabled={isSaving}
                              variant="secondary"
                              className="h-12 rounded-2xl font-black bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest border border-slate-200/50"
                              onClick={() => {
                                const updatedCourse = {
                                  ...currentCourse,
                                  status: "Draft",
                                };
                                setCurrentCourse(updatedCourse);
                                handleSave(
                                  "courses",
                                  updatedCourse,
                                  setIsEditingCourse,
                                );
                              }}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4 mr-2" />
                              )}
                              Save Draft
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 rounded-2xl font-bold px-6 text-xs uppercase tracking-widest"
                              onClick={() => {
                                setCurrentCourse({
                                  title: "",
                                  level: "7.0",
                                  type: "Academic",
                                  difficulty: "Intermediate",
                                  description: "",
                                  modules: [],
                                  status: "Published",
                                  featured_image: "",
                                });
                                setIsEditingCourse(false);
                              }}
                              disabled={isSaving}
                            >
                              Cancel Changes
                            </Button>

                            {currentCourse.id && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-2xl font-bold px-6 text-xs uppercase tracking-widest border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                                onClick={() => handleDelete("courses", currentCourse.id)}
                                disabled={isSaving}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Course
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                          <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Plus className="w-8 h-8 text-slate-300" />
                          </div>
                          <h3 className="text-xl font-black tracking-tight">
                            Curriculum Builder
                          </h3>
                          <p className="text-sm text-slate-500 italic">
                            Select a course to edit or initialize a new academic
                            module.
                          </p>
                          <Button
                            className="rounded-xl font-bold px-8 h-12 shadow-lg shadow-primary/10"
                            onClick={() => {
                              setCurrentCourse({
                                title: "",
                                level: "7.0",
                                type: "Academic",
                                difficulty: "Intermediate",
                                description: "",
                                modules: [],
                                status: "Published",
                                featured_image: "",
                              });
                              setIsEditingCourse(true);
                            }}
                          >
                            Construct New Module
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                </TabsContent>

                
                <TabsContent value="course-designer" className="mt-0 space-y-6 overflow-hidden">
                  <div className="h-[calc(100vh-140px)] w-full overflow-y-auto overflow-x-hidden custom-scrollbar rounded-3xl -mx-6 px-6 pb-20">
                     <CourseDesignerComponent initialId={currentCourse?.id} />
                  </div>
                </TabsContent>

                <TabsContent value="ai-course-creator" className="mt-0 space-y-6 overflow-hidden">
                  <div className="h-[calc(100vh-140px)] w-full overflow-y-auto overflow-x-hidden custom-scrollbar rounded-3xl -mx-6 px-6 pb-20">
                     <AICourseCreator />
                  </div>
                </TabsContent>

                <TabsContent value="course-visualizer" className="mt-0 space-y-6 overflow-hidden">
                  <div className="h-[calc(100vh-140px)] w-full overflow-y-auto overflow-x-hidden custom-scrollbar rounded-3xl -mx-6 px-6 pb-20">
                     <CourseVisualizer />
                  </div>
                </TabsContent>

                <TabsContent value="mock-tests" className="mt-0">
                  <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-white/5">
                      <div>
                        <CardTitle className="text-2xl font-black italic tracking-tighter">
                          Examinations Desk
                        </CardTitle>
                        <CardDescription>
                          Central command for configuring full IELTS mock simulations
                        </CardDescription>
                      </div>
                      {!isEditingTest && (
                        <div className="flex gap-2">
                           <Dialog>
                            <DialogTrigger render={<Button variant="outline" size="icon" className="rounded-xl" />}>
                                <HelpCircle className="w-4 h-4" />
                              </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic">Desk Protocol & Purpose</DialogTitle>
                                <DialogDescription>
                                  The Examinations Desk is designed for administrative oversight of full-length IELTS simulation packs.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100">
                                    <h6 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Simulated Reality</h6>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                      Create exam packs that mirror the actual computer-delivered IELTS structure (3 sections in Listening/Reading, 2 tasks in Writing).
                                    </p>
                                  </div>
                                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100">
                                    <h6 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Global Scoring</h6>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                      Define correct answers and difficulty levels to provide students with automated accuracy feedback and Band performance predictions.
                                    </p>
                                  </div>
                                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100">
                                    <h6 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Multi-Import</h6>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                      Use the CSV Multi-Import feature to rapidly populate assessment items from external question banks.
                                    </p>
                                  </div>
                                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100">
                                    <h6 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Live Deployment</h6>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                      Control the lifecycle of exam packs—from draft incubation to live student access across the entire SEBS platform.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            onClick={() => {
                              setCurrentTest({
                                name: "",
                                difficulty: "7.0",
                                description: "",
                                total_time: 165,
                                questions: 40,
                                status: "Draft",
                                exam_category: "Academic",
                                access_tier: "Free Trial",
                                is_mock_test: true,
                                test_month: "January",
                                test_year: "2026",
                                month: "January",
                                year: "2026",
                                sections: [
                                  { id: "s1", type: "Listening", title: "Section 1", content: "", questions: [] },
                                  { id: "s2", type: "Reading", title: "Section 2", content: "", questions: [] },
                                  { id: "s3", type: "Writing", title: "Section 3", content: "", questions: [] },
                                  { id: "s4", type: "Speaking", title: "Section 4", content: "", questions: [] }
                                ]
                              });
                              setIsEditingTest(true);
                            }}
                            className="rounded-xl font-bold"
                          >
                            Add Mock Test
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      {isEditingTest ? (
                        <div className="p-8 space-y-12 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black italic text-2xl tracking-tight text-primary">
                              {currentTest.id ? "Test Architecture Refinement" : "New Examination Genesis"}
                            </h4>
                            <div className="flex gap-3">
                               <Button
                                type="button"
                                variant="ghost"
                                className="font-bold rounded-xl"
                                onClick={() => setIsEditingTest(false)}
                                disabled={isSaving}
                              >
                                Abandon Changes
                              </Button>
                              <Button
                                type="button"
                                disabled={isSaving}
                                className="rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 px-8"
                                onClick={() =>
                                  handleSave(
                                    "mock_tests",
                                    currentTest,
                                    setIsEditingTest,
                                  )
                                }
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4 mr-2" />
                                )}
                                Synchronize Database
                              </Button>
                            </div>
                          </div>

                          {/* Core Configuration */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="md:col-span-2 space-y-4">
                               <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  Examination Descriptor
                                </Label>
                                <Input
                                  placeholder="e.g. Cambridge Official Mock Paper #4"
                                  className="h-12 text-lg font-bold rounded-xl border-slate-200"
                                  value={currentTest.name}
                                  onChange={(e) =>
                                    setCurrentTest({
                                      ...currentTest,
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  Thumbnail URL
                                </Label>
                                <Input
                                  placeholder="https://images.unsplash.com/photo-..."
                                  className="h-12 font-bold rounded-xl border-slate-200"
                                  value={currentTest.thumbnail || ""}
                                  onChange={(e) =>
                                    setCurrentTest({
                                      ...currentTest,
                                      thumbnail: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                    Exam Category
                                  </Label>
                                  <select 
                                    className="w-full h-12 px-4 font-bold rounded-xl border border-slate-200 bg-white"
                                    value={currentTest.exam_category || "All"}
                                    onChange={(e) => setCurrentTest({...currentTest, exam_category: e.target.value})}
                                  >
                                    <option value="All">All Tests</option>
                                    <option value="Academic">Academic</option>
                                    <option value="General Training">General Training</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                    Is Mock Test?
                                  </Label>
                                  <div className="h-12 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <input 
                                      type="checkbox" 
                                      className="w-5 h-5 accent-primary"
                                      checked={currentTest.is_mock_test || false}
                                      onChange={(e) => setCurrentTest({...currentTest, is_mock_test: e.target.checked})}
                                    />
                                    <span className="ml-3 font-bold text-sm">Feature in Mock Tests</span>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                    Test Month
                                  </Label>
                                  <select 
                                    className="w-full h-12 px-4 font-bold rounded-xl border border-slate-200 bg-white"
                                    value={currentTest.test_month || currentTest.month || "January"}
                                    onChange={(e) => setCurrentTest({ ...currentTest, test_month: e.target.value, month: e.target.value })}
                                  >
                                    <option value="">Select Month...</option>
                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                    Test Year
                                  </Label>
                                  <Input
                                    placeholder="2026"
                                    className="h-12 font-bold rounded-xl border-slate-200"
                                    value={currentTest.test_year || currentTest.year || "2026"}
                                    onChange={(e) => setCurrentTest({ ...currentTest, test_year: e.target.value, year: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  System Overview / Syllabus Description
                                </Label>
                                <textarea
                                  className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 bg-white dark:bg-slate-950 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                  placeholder="Provide an overview of the difficulty and expected outcomes..."
                                  value={currentTest.description || ""}
                                  onChange={(e) => setCurrentTest({...currentTest, description: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  Target Band Difficulty
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="7.5"
                                  className="h-12 font-black text-center text-primary rounded-xl"
                                  value={currentTest.difficulty}
                                  onChange={(e) =>
                                    setCurrentTest({
                                      ...currentTest,
                                      difficulty: e.target.value,
                                    })
                                  }
                                />
                                <p className="text-[9px] text-slate-400 italic">Expected difficulty level for this pack.</p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  Session Duration (Minutes)
                                </Label>
                                <div className="flex items-center gap-3">
                                   <Clock className="w-5 h-5 text-slate-300" />
                                   <Input
                                    type="number"
                                    className="h-12 font-black text-center rounded-xl"
                                    value={currentTest.total_time || 165}
                                    onChange={(e) =>
                                      setCurrentTest({
                                        ...currentTest,
                                        total_time: parseInt(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <p className="text-[9px] text-slate-400 italic">Total clock time for full simulation.</p>
                              </div>
                            </div>

                             <div className="space-y-6">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  Total Assessment Items
                                </Label>
                                <Input
                                  type="number"
                                  className="h-12 font-black text-center rounded-xl"
                                  value={currentTest.questions}
                                  onChange={(e) =>
                                    setCurrentTest({
                                      ...currentTest,
                                      questions: parseInt(e.target.value),
                                    })
                                  }
                                />
                                <p className="text-[9px] text-slate-400 italic">Count of questions to be answered.</p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                  Deployment Status
                                </Label>
                                <select
                                  className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-xs appearance-none cursor-pointer bg-white dark:bg-slate-950"
                                  value={currentTest.status}
                                  onChange={(e) => setCurrentTest({...currentTest, status: e.target.value})}
                                >
                                  <option value="Draft">Draft (Internal Only)</option>
                                  <option value="Live">Live (Publicly Available)</option>
                                  <option value="Archived">Archived</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Modular Composer Dashboard */}
                          <Card className="rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950 p-6 md:p-8 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h5 className="font-black italic text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-teal-500 animate-pulse" />
                                  Examinations Source Selection
                                </h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Configure this exam by mapping designed Courses or Practice Tests/Quizzes directly into IELTS simulation sections.
                                </p>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest">
                                <GraduationCap className="w-4 h-4 text-teal-500" />
                                Modular Recipe Desk
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Listening Column */}
                              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-3 flex flex-col justify-between shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
                                      <Volume2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">Listening Section</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 italic font-semibold leading-normal">Map syllabus or assessments to Listening Section.</p>
                                </div>

                                <select
                                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-teal-500/25 outline-none transition-all cursor-pointer"
                                  value={(currentTest.sections || []).find((s: any) => s.type === "Listening")?.source_val || ""}
                                  onChange={(e) => handleSelectModuleSource("Listening", e.target.value)}
                                >
                                  <option value="">(Custom / Manual Section)</option>
                                  {courses.length > 0 && (
                                    <optgroup label="Designed Courses">
                                      {courses.map(c => (
                                        <option key={c.id} value={`course::${c.id}`}>📚 Course: {c.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {quizzes.length > 0 && (
                                    <optgroup label="Designed Quizzes / Practice Tests">
                                      {quizzes.map(q => (
                                        <option key={q.id} value={`quiz::${q.id}`}>📝 Quiz: {q.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              {/* Reading Column */}
                              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-3 flex flex-col justify-between shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                                      <BookOpen className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">Reading Section</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 italic font-semibold leading-normal">Map syllabus or assessments to Reading Section.</p>
                                </div>

                                <select
                                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-sky-500/25 outline-none transition-all cursor-pointer"
                                  value={(currentTest.sections || []).find((s: any) => s.type === "Reading")?.source_val || ""}
                                  onChange={(e) => handleSelectModuleSource("Reading", e.target.value)}
                                >
                                  <option value="">(Custom / Manual Section)</option>
                                  {courses.length > 0 && (
                                    <optgroup label="Designed Courses">
                                      {courses.map(c => (
                                        <option key={c.id} value={`course::${c.id}`}>📚 Course: {c.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {quizzes.length > 0 && (
                                    <optgroup label="Designed Quizzes / Practice Tests">
                                      {quizzes.map(q => (
                                        <option key={q.id} value={`quiz::${q.id}`}>📝 Quiz: {q.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              {/* Writing Column */}
                              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-3 flex flex-col justify-between shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                      <PenTool className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">Writing Section</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 italic font-semibold leading-normal">Map syllabus or assessments to Writing Section.</p>
                                </div>

                                <select
                                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-purple-500/25 outline-none transition-all cursor-pointer"
                                  value={(currentTest.sections || []).find((s: any) => s.type === "Writing")?.source_val || ""}
                                  onChange={(e) => handleSelectModuleSource("Writing", e.target.value)}
                                >
                                  <option value="">(Custom / Manual Section)</option>
                                  {courses.length > 0 && (
                                    <optgroup label="Designed Courses">
                                      {courses.map(c => (
                                        <option key={c.id} value={`course::${c.id}`}>📚 Course: {c.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {quizzes.length > 0 && (
                                    <optgroup label="Designed Quizzes / Practice Tests">
                                      {quizzes.map(q => (
                                        <option key={q.id} value={`quiz::${q.id}`}>📝 Quiz: {q.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              {/* Speaking Column */}
                              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-3 flex flex-col justify-between shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                      <Mic className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">Speaking Section</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 italic font-semibold leading-normal">Map syllabus or assessments to Speaking Section.</p>
                                </div>

                                <select
                                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-amber-500/25 outline-none transition-all cursor-pointer"
                                  value={(currentTest.sections || []).find((s: any) => s.type === "Speaking")?.source_val || ""}
                                  onChange={(e) => handleSelectModuleSource("Speaking", e.target.value)}
                                >
                                  <option value="">(Custom / Manual Section)</option>
                                  {courses.length > 0 && (
                                    <optgroup label="Designed Courses">
                                      {courses.map(c => (
                                        <option key={c.id} value={`course::${c.id}`}>📚 Course: {c.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {quizzes.length > 0 && (
                                    <optgroup label="Designed Quizzes / Practice Tests">
                                      {quizzes.map(q => (
                                        <option key={q.id} value={`quiz::${q.id}`}>📝 Quiz: {q.title}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            </div>
                          </Card>

                          {/* Section Architecture */}
                          <div className="space-y-8">
                             <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Layout className="w-5 h-5" />
                                  </div>
                                  <h5 className="font-black italic text-xl">Module Architecture</h5>
                               </div>
                               <Button 
                                  onClick={() => {
                                    const newSections = [...(currentTest.sections || [])];
                                    newSections.push({
                                      id: `sec-${Date.now()}`,
                                      type: "Reading",
                                      title: "New Module Section",
                                      content: "",
                                      questions: []
                                    });
                                    setCurrentTest({...currentTest, sections: newSections});
                                  }}
                                  variant="outline"
                                  className="rounded-xl border-dashed border-2 font-bold text-xs h-10 px-6"
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Add Section Module
                                </Button>
                             </div>

                             <div className="grid gap-6">
                                {(currentTest.sections || []).map((sec: any, sIdx: number) => (
                                  <Card key={sec.id || sIdx} className="rounded-3xl border shadow-lg overflow-hidden bg-white dark:bg-slate-950">
                                    <div className="p-6 flex flex-wrap items-center justify-between bg-slate-50 dark:bg-white/5 border-b gap-4">
                                       <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black italic text-xs shrink-0 shadow-lg shadow-primary/20">
                                            {sIdx + 1}
                                          </div>
                                          <Input 
                                            value={sec.title} 
                                            onChange={(e) => {
                                              const updated = [...currentTest.sections];
                                              updated[sIdx].title = e.target.value;
                                              setCurrentTest({...currentTest, sections: updated});
                                            }}
                                            className="font-black italic border-transparent bg-transparent focus:border-primary/50 text-base h-9 px-2 hover:bg-white/50"
                                            placeholder="Section Title..."
                                          />
                                       </div>
                                       <div className="flex items-center gap-3">
                                          <select
                                            className="h-9 px-3 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest cursor-pointer bg-white dark:bg-slate-900"
                                            value={sec.type}
                                            onChange={(e) => {
                                              const updated = [...currentTest.sections];
                                              updated[sIdx].type = e.target.value;
                                              setCurrentTest({...currentTest, sections: updated});
                                            }}
                                          >
                                            <option>Listening</option>
                                            <option>Reading</option>
                                            <option>Writing</option>
                                            <option>Speaking</option>
                                          </select>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-red-500 rounded-lg h-9 w-9"
                                            onClick={() => {
                                               const updated = currentTest.sections.filter((_: any, i: number) => i !== sIdx);
                                               setCurrentTest({...currentTest, sections: updated});
                                            }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 rounded-lg h-9 w-9"
                                            onClick={() => {
                                              setExpandedLessons(prev => ({...prev, [sec.id]: !prev[sec.id]}));
                                            }}
                                          >
                                            {expandedLessons[sec.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                          </Button>
                                       </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                      {expandedLessons[sec.id] && (
                                        <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-8 space-y-8">
                                            {/* Passage Editor */}
                                            <div className="space-y-4">
                                               <div className="flex items-center justify-between">
                                                  <Label className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">
                                                    Prompt/Passage/Audio Content (Markdown)
                                                  </Label>
                                                  <div className="flex gap-2">
                                                     <Button 
                                                        variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase"
                                                        onClick={() => setTextEditorMode(prev => ({...prev, [sec.id]: "edit"}))}
                                                      >Edit</Button>
                                                     <Button 
                                                        variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase"
                                                        onClick={() => setTextEditorMode(prev => ({...prev, [sec.id]: "preview"}))}
                                                     >Preview</Button>
                                                  </div>
                                               </div>
                                               
                                               {textEditorMode[sec.id] === "preview" ? (
                                                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border prose dark:prose-invert max-w-none text-sm min-h-[150px]">
                                                     <ReactMarkdown>{sec.content || "*No content provided.*"}</ReactMarkdown>
                                                  </div>
                                               ) : (
                                                  <textarea 
                                                    className="w-full min-h-[250px] p-6 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed"
                                                    value={sec.content}
                                                    onChange={(e) => {
                                                      const updated = [...currentTest.sections];
                                                      updated[sIdx].content = e.target.value;
                                                      setCurrentTest({...currentTest, sections: updated});
                                                    }}
                                                    placeholder="Enter your passage text or instructions here..."
                                                  />
                                               )}
                                            </div>

                                            {/* Question Manager */}
                                            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                              <div className="flex items-center justify-between">
                                                 <div className="flex items-center gap-3">
                                                    <Brain className="w-5 h-5 text-primary" />
                                                    <h6 className="font-black italic text-lg">{sec.type} Assessment Items ({sec.questions?.length || 0})</h6>
                                                 </div>
                                                 <div className="flex gap-3">
                                                   <Button 
                                                      variant="outline"
                                                      className="h-9 px-4 rounded-xl border-slate-200 text-[10px] font-black uppercase italic"
                                                      onClick={() => {
                                                        const fileInput = document.createElement('input');
                                                        fileInput.type = 'file';
                                                        fileInput.accept = '.csv';
                                                        fileInput.onchange = (e: any) => {
                                                          const file = e.target.files[0];
                                                          if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (fileEvent: any) => {
                                                              const text = fileEvent.target.result;
                                                              const imported = parseCSV(text);
                                                              const updated = [...currentTest.sections];
                                                              updated[sIdx].questions = [...(updated[sIdx].questions || []), ...imported];
                                                              setCurrentTest({...currentTest, sections: updated});
                                                              toast.success(`Imported ${imported.length} questions successfully!`);
                                                            };
                                                            reader.readAsText(file);
                                                          }
                                                        };
                                                        fileInput.click();
                                                      }}
                                                    >
                                                      <Upload className="w-3.5 h-3.5 mr-2 text-primary" /> Multi-Import CSV
                                                   </Button>
                                                   <Button
                                                      onClick={() => {
                                                        const updated = [...currentTest.sections];
                                                        if (!updated[sIdx].questions) updated[sIdx].questions = [];
                                                        updated[sIdx].questions.push({
                                                          id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                                          text: "",
                                                          options: ["", "", "", ""],
                                                          correctIndex: 0,
                                                          type: "MCQ"
                                                        });
                                                        setCurrentTest({...currentTest, sections: updated});
                                                      }}
                                                      className="h-9 px-4 rounded-xl font-black text-[10px] uppercase italic"
                                                    >
                                                      <Plus className="w-3.5 h-3.5 mr-2" /> Append Single Item
                                                   </Button>
                                                 </div>
                                              </div>

                                              <div className="grid gap-4">
                                                {(sec.questions || []).map((q: any, qIdx: number) => (
                                                  <div key={q.id || qIdx} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200/50 dark:border-white/5 space-y-4 hover:shadow-md transition-all group">
                                                     <div className="flex items-start justify-between">
                                                        <div className="flex-1 space-y-2">
                                                          <div className="flex items-center gap-3">
                                                             <Badge className="bg-primary text-white italic font-black text-[10px]">Item #{qIdx + 1}</Badge>
                                                             <Input 
                                                              value={typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\n") : String(q.text || ""))}
                                                              onChange={(e) => {
                                                                const updated = [...currentTest.sections];
                                                                updated[sIdx].questions[qIdx].text = e.target.value;
                                                                setCurrentTest({...currentTest, sections: updated});
                                                              }}
                                                              className="font-bold border-transparent bg-transparent px-0 h-auto focus:ring-0 text-sm"
                                                              placeholder="Assessable condition / Question text..."
                                                            />
                                                          </div>
                                                        </div>
                                                        <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all rounded-lg h-7 w-7"
                                                          onClick={() => {
                                                            const updated = [...currentTest.sections];
                                                            updated[sIdx].questions = updated[sIdx].questions.filter((_: any, i: number) => i !== qIdx);
                                                            setCurrentTest({...currentTest, sections: updated});
                                                          }}
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                     </div>

                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                        {q.options?.map((opt: string, oIdx: number) => (
                                                          <div key={oIdx} className="flex items-center gap-3">
                                                             <div 
                                                                onClick={() => {
                                                                  const updated = [...currentTest.sections];
                                                                  updated[sIdx].questions[qIdx].correctIndex = oIdx;
                                                                  setCurrentTest({...currentTest, sections: updated});
                                                                }}
                                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${q.correctIndex === oIdx ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}`}
                                                              >
                                                                {q.correctIndex === oIdx ? <Check className="w-3 h-3" /> : <span className="text-[10px] font-black uppercase">{String.fromCharCode(65 + oIdx)}</span>}
                                                             </div>
                                                             <Input
                                                              value={opt}
                                                              onChange={(e) => {
                                                                const updated = [...currentTest.sections];
                                                                updated[sIdx].questions[qIdx].options[oIdx] = e.target.value;
                                                                setCurrentTest({...currentTest, sections: updated});
                                                              }}
                                                              className="text-xs font-semibold h-9 rounded-lg"
                                                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                                                            />
                                                          </div>
                                                        ))}
                                                     </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </Card>
                                ))}
                             </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex justify-end pt-8 border-t border-slate-200">
                             <div className="flex gap-4">
                               {currentTest.id && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold px-8 text-red-500 hover:bg-red-50 border-red-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete("mock_tests", currentTest.id);
                                    }}
                                    disabled={isSaving}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Rescind Full Pack
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  disabled={isSaving}
                                  className="h-12 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/30 px-12 transition-all hover:translate-y-[-2px]"
                                  onClick={() =>
                                    handleSave(
                                      "mock_tests",
                                      currentTest,
                                      setIsEditingTest,
                                    )
                                  }
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                  )}
                                  Finalize and Sync
                                </Button>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b uppercase text-[10px] font-black italic tracking-widest text-slate-400">
                              <tr>
                                <th className="px-6 py-4">
                                  Test Identification
                                </th>
                                <th className="px-6 py-4">Difficulty</th>
                                <th className="px-6 py-4">Questions</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                              {mockTests.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-20 text-center text-slate-400 font-bold italic uppercase text-xs"
                                  >
                                    No active examinations registered
                                  </td>
                                </tr>
                              ) : (
                                mockTests.map((test, i) => (
                                  <tr
                                    key={i}
                                    className="hover:bg-slate-50/50 dark:hover:bg-white/1 transition-colors group"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                          {test.thumbnail ? (
                                            <img 
                                              src={test.thumbnail} 
                                              className="w-full h-full object-cover" 
                                              referrerPolicy="no-referrer" 
                                            />
                                          ) : (
                                            <Layout className="w-4 h-4 text-slate-300" />
                                          )}
                                        </div>
                                        <span className="font-bold">
                                          {test.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-black italic text-primary">
                                      Band {test.difficulty}
                                    </td>
                                    <td className="px-6 py-4">
                                      {test.questions} Items
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge
                                        className={
                                          test.status === "Live"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            : "bg-slate-100 text-slate-500 border-slate-200"
                                        }
                                      >
                                        {test.status}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="rounded-xl hover:bg-white border border-slate-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (test.isFromCourses) {
                                              setCurrentCourse({
                                                id: test.id,
                                                title: test.name,
                                                description: test.description || "",
                                                thumbnail_url: test.thumbnail,
                                                course_type: "Mock Test"
                                              });
                                              localStorage.setItem("active_course_designer_id", test.id);
                                              setActiveTab("course-designer");
                                            } else {
                                              const monthVal = test.test_month || test.month || "January";
                                              const yearVal = test.test_year || test.year || "2026";
                                              setCurrentTest({
                                                ...test,
                                                test_month: monthVal,
                                                month: monthVal,
                                                test_year: yearVal,
                                                year: yearVal,
                                              });
                                              setIsEditingTest(true);
                                            }
                                          }}
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-400 hover:text-red-600 rounded-xl"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete("mock_tests", test.id);
                                          }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quiz-builder" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quiz List */}
                    <Card className="lg:col-span-1 rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 bg-white dark:bg-slate-900 overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-white/5">
                        <div>
                          <CardTitle className="text-xl font-black italic">
                            Active Quizzes
                          </CardTitle>
                          <CardDescription>Created modules</CardDescription>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => {
                            setCurrentQuiz({
                              title: "",
                              description: "",
                              course_id: "",
                              questions: [],
                            });
                            setIsEditingQuiz(true);
                          }}
                        >
                          <Plus className="w-5 h-5 text-primary" />
                        </Button>
                      </CardHeader>
                      <ScrollArea className="h-[500px]">
                        <CardContent className="p-4 space-y-3">
                          {quizzes.length === 0 ? (
                            <div className="text-center py-20 opacity-30">
                              <Brain className="w-12 h-12 mx-auto mb-4" />
                              <p className="text-xs font-black uppercase italic">
                                No Quizzes Found
                              </p>
                            </div>
                          ) : (
                            quizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                onClick={() => {
                                  setCurrentQuiz({
                                    ...quiz,
                                    questions:
                                      typeof quiz.questions === "string"
                                        ? JSON.parse(quiz.questions)
                                        : quiz.questions,
                                  });
                                  setIsEditingQuiz(true);
                                }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${currentQuiz?.id === quiz.id ? "bg-primary/5 border-primary" : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200"}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-black text-sm group-hover:text-primary transition-colors">
                                    {quiz.title}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] uppercase tracking-tighter"
                                  >
                                    {quiz.course_id || "Global"}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2 italic mb-3">
                                  {quiz.description}
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  <span>
                                    {quiz.questions?.length || 0} Questions
                                  </span>
                                  <Trash2
                                    className="w-3.5 h-3.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete("quizzes", quiz.id);
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </ScrollArea>
                    </Card>

                    {/* Builder Area */}
                    <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-white/5">
                      {isEditingQuiz ? (
                        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                Quiz Title
                              </Label>
                              <Input
                                placeholder="e.g. Present Continuous Mastery"
                                className="rounded-xl h-12 border-slate-200"
                                value={currentQuiz.title}
                                onChange={(e) =>
                                  setCurrentQuiz({
                                    ...currentQuiz,
                                    title: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                Target Course Linkage
                              </Label>
                              <select
                                className="w-full h-12 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-900 px-4 font-bold text-sm bg-transparent"
                                value={currentQuiz.course_id || ""}
                                onChange={(e) =>
                                  setCurrentQuiz({
                                    ...currentQuiz,
                                    course_id: e.target.value,
                                  })
                                }
                              >
                                <option value="">
                                  -- Associate with a Course --
                                </option>
                                {courses.map((course) => (
                                  <option key={course.id} value={course.id}>
                                    {course.title} ({course.level || "Band"} - {course.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                              Instructions
                            </Label>
                            <textarea
                              className="w-full rounded-2xl border border-slate-200 bg-transparent p-4 font-medium text-sm min-h-[80px]"
                              placeholder="Describe how students should complete this quiz..."
                              value={currentQuiz.description}
                              onChange={(e) =>
                                setCurrentQuiz({
                                  ...currentQuiz,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black italic tracking-tight text-xl">
                                Questionnaire ({currentQuiz.questions.length})
                              </h3>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleAddQuestion}
                                  className="rounded-xl font-bold bg-primary px-4"
                                >
                                  + Add Item
                                </Button>
                                
                                <label
                                  className="h-9 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                                  title="CSV Columns: question, option a, option b, option c, option d, correct answer"
                                >
                                  <File className="w-3.5 h-3.5" />
                                  <span>Import CSV</span>
                                  <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const text = event.target?.result as string;
                                        if (text) {
                                          const imported = parseCSV(text);
                                          if (imported.length > 0) {
                                            setCurrentQuiz({
                                              ...currentQuiz,
                                              questions: [
                                                ...currentQuiz.questions,
                                                ...imported
                                              ]
                                            });
                                          } else {
                                            console.warn("Could not find any valid questions in the CSV.");
                                          }
                                        }
                                      };
                                      reader.readAsText(file);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-6">
                              {currentQuiz.questions.map(
                                (q: any, qIndex: number) => (
                                  <div
                                    key={`quiz-item-${q.id || qIndex}-${qIndex}`}
                                    className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 relative group"
                                  >
                                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-400 hover:text-primary disabled:opacity-30"
                                        disabled={qIndex === 0}
                                        onClick={() =>
                                          moveQuestion(qIndex, "up")
                                        }
                                        title="Move Question Up"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-400 hover:text-primary disabled:opacity-30"
                                        disabled={
                                          qIndex ===
                                          currentQuiz.questions.length - 1
                                        }
                                        onClick={() =>
                                          moveQuestion(qIndex, "down")
                                        }
                                        title="Move Question Down"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        onClick={() => removeQuestion(q.id)}
                                        title="Delete Question"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    <div className="space-y-4">
                                      {/* Optional Section Heading & Instructions */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-100/50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 mb-2">
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Group Heading (e.g., Questions 27-30)</span>
                                          <Input
                                            placeholder="No group heading"
                                            value={q.sectionHeading || ""}
                                            onChange={(e) =>
                                              updateQuestion(q.id, "sectionHeading", e.target.value)
                                            }
                                            className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border-none rounded-xl"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Group Instruction / Hint</span>
                                          <Input
                                            placeholder="No group instructions"
                                            value={q.sectionInstruction || ""}
                                            onChange={(e) =>
                                              updateQuestion(q.id, "sectionInstruction", e.target.value)
                                            }
                                            className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border-none rounded-xl"
                                          />
                                        </div>
                                      </div>

                                      {/* Question Format Type Selection */}
                                      <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200 dark:border-white/5 mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Question Format Type:</span>
                                        <select
                                          className="h-6 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-[9px] font-bold uppercase tracking-wider pl-1.5 pr-6 focus:ring-1 focus:ring-primary focus:border-primary shrink-0 select-custom"
                                          value={q.type || "MCQ"}
                                          onChange={(e) => {
                                            const t = e.target.value;
                                            let updatedFields: any = { type: t };
                                            if (t === "TF") {
                                              updatedFields.options = ["TRUE", "FALSE", "NOT GIVEN"];
                                              updatedFields.correctIndex = 0;
                                            } else if (t === "YN") {
                                              updatedFields.options = ["YES", "NO", "NOT GIVEN"];
                                              updatedFields.correctIndex = 0;
                                            } else if (t === "MCQ") {
                                              updatedFields.options = ["", "", "", ""];
                                              updatedFields.correctIndex = 0;
                                            } else if (t === "MULTI_MCQ") {
                                              updatedFields.options = ["", "", "", ""];
                                              updatedFields.correctIndexes = [0];
                                            } else if (t === "BLANK") {
                                              updatedFields.options = [];
                                              updatedFields.correctAnswer = "";
                                            } else if (t === "PASSAGE") {
                                              updatedFields.options = [];
                                              updatedFields.correctAnswer = "";
                                              updatedFields.passageText = "";
                                            } else if (t === "MATCHING") {
                                              updatedFields.options = [];
                                              updatedFields.correctAnswer = "";
                                              updatedFields.passageText = "";
                                            } else if (t === "INLINE_BLANKS") {
                                              updatedFields.options = [];
                                              updatedFields.correctAnswer = "";
                                            }
                                            setCurrentQuiz({
                                              ...currentQuiz,
                                              questions: currentQuiz.questions.map((item: any) =>
                                                item.id === q.id ? { ...item, ...updatedFields } : item
                                              )
                                            });
                                          }}
                                        >
                                          <option value="MCQ">Multiple Choice</option>
                                          <option value="MULTI_MCQ">Multiple Response (Multi-correct)</option>
                                          <option value="TF">True / False</option>
                                          <option value="YN">Yes / No / Not Given</option>
                                          <option value="BLANK">Fill in the blanks</option>
                                          <option value="PASSAGE">Passage Based</option>
                                          <option value="MATCHING">Matching Headings</option>
                                          <option value="INLINE_BLANKS">Paragraph with Blanks</option>
                                        </select>
                                      </div>

                                      {/* Short Passage Editor for PASSAGE format questions */}
                                      {(q.type === 'PASSAGE' || q.type === 'MATCHING') && (
                                        <div className="space-y-1 bg-slate-150/10 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 mb-3">
                                          <span className="text-[9px] font-black uppercase text-indigo-500 block tracking-wider">{q.type === "MATCHING" ? "List of Headings / Options (separated by enter)" : "Passage Segment"}</span>
                                          <textarea
                                            placeholder={q.type === "MATCHING" ? "i. Heading A\\nii. Heading B\\niii. Heading C" : "Type or paste the short passage segment here..."}
                                            value={q.passageText || ""}
                                            onChange={(e) =>
                                              updateQuestion(q.id, "passageText", e.target.value)
                                            }
                                            className="w-full text-xs font-semibold p-2.5 bg-white dark:bg-slate-900 border border-slate-150 rounded-lg min-h-[80px]"
                                          />
                                        </div>
                                      )}

                                      <div className="flex items-center gap-3 mb-4 pr-24">
                                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs italic">
                                          {qIndex + 1}
                                        </div>
                                        {(q.type === "MATCHING" || q.type === "INLINE_BLANKS") ? (
                                          <textarea
                                            placeholder={q.type === "MATCHING" ? "Enter prompts separated by enter key" : "Paragraph with _____ for blanks..."}
                                            value={q.text || ""}
                                            onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                                            className="w-full border-none bg-transparent text-lg font-black tracking-tight focus:ring-0 p-0 min-h-[80px]"
                                          />
                                        ) : (
                                          <Input
                                            placeholder={
                                              q.type === 'TF' 
                                                ? "Type True/False statement..." 
                                                : (q.type === 'BLANK' || q.type === 'PASSAGE')
                                                  ? "Type sentence with blank placeholder (use _____ to indicate blanks)..."
                                                  : "Type multiple choice question prompt..."
                                            }
                                            className="border-none bg-transparent text-lg font-black tracking-tight focus:ring-0 p-0 h-auto"
                                            value={typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\n") : JSON.stringify(q.text)))}
                                            onChange={(e) =>
                                              updateQuestion(
                                                q.id,
                                                "text",
                                                e.target.value,
                                              )
                                            }
                                          />
                                        )}
                                      </div>

                                      {/* MCQ & MULTI_MCQ Choices */}
                                      {(!q.type || q.type === 'MCQ' || q.type === 'MULTI_MCQ') && (
                                        <>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(q.options || []).map(
                                              (opt: string, optIndex: number) => {
                                                const isMulti = q.type === 'MULTI_MCQ';
                                                const isSelected = isMulti 
                                                  ? (Array.isArray(q.correctIndexes) && q.correctIndexes.includes(optIndex))
                                                  : q.correctIndex === optIndex;

                                                return (
                                                  <div
                                                    key={optIndex}
                                                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${isSelected ? "bg-emerald-50/50 border-emerald-200" : "bg-white dark:bg-slate-900 border-slate-200"}`}
                                                  >
                                                    <div className="flex items-center gap-3 flex-1">
                                                      <div
                                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}
                                                        onClick={() => {
                                                          if (isMulti) {
                                                            const current = Array.isArray(q.correctIndexes) ? [...q.correctIndexes] : [];
                                                            if (current.includes(optIndex)) {
                                                              updateQuestion(q.id, "correctIndexes", current.filter(i => i !== optIndex));
                                                            } else {
                                                              updateQuestion(q.id, "correctIndexes", [...current, optIndex]);
                                                            }
                                                          } else {
                                                            updateQuestion(q.id, "correctIndex", optIndex);
                                                          }
                                                        }}
                                                      >
                                                        {isSelected && (
                                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                                        )}
                                                      </div>
                                                      <Input
                                                        placeholder={`Choice ${optIndex + 1}`}
                                                        className="border-none h-auto p-0 bg-transparent text-sm font-bold w-full"
                                                        value={opt || ""}
                                                        onChange={(e) =>
                                                          updateOption(
                                                            q.id,
                                                            optIndex,
                                                            e.target.value,
                                                          )
                                                        }
                                                      />
                                                    </div>
                                                    {q.options &&
                                                      q.options.length > 2 && (
                                                        <Button
                                                          type="button"
                                                          size="icon"
                                                          variant="ghost"
                                                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                                                          onClick={() =>
                                                            removeOption(
                                                              q.id,
                                                              optIndex,
                                                            )
                                                          }
                                                          title="Remove choice"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                      )}
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                          <div className="flex justify-end pt-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="rounded-xl font-bold h-8 text-[11px] uppercase text-slate-500 hover:text-primary transition-all"
                                              onClick={() => addOption(q.id)}
                                            >
                                              + Add Choice Option
                                            </Button>
                                          </div>
                                        </>
                                      )}

                                      {/* True / False Layout */}
                                      {(q.type === 'TF' || q.type === 'YN') && (
                                        <div className="flex items-center gap-6 bg-slate-100/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                          {(q.type === 'TF' ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]).map((valTF, idxTF) => (
                                            <label key={idxTF} className="flex items-center gap-2 cursor-pointer font-bold text-xs select-none">
                                              <input
                                                type="radio"
                                                name={`standalone-tf-ans-${q.id}`}
                                                checked={q.correctIndex === idxTF}
                                                onChange={() =>
                                                  updateQuestion(q.id, "correctIndex", idxTF)
                                                }
                                                className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                                              />
                                              {valTF}
                                            </label>
                                          ))}
                                        </div>
                                      )}

                                      {/* Fill Blanket & Passage Layout */}
                                      {(q.type === 'BLANK' || q.type === 'PASSAGE' || q.type === 'MATCHING' || q.type === 'INLINE_BLANKS') && (
                                        <div className="space-y-2 bg-slate-100/50 dark:bg-white/5 p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                          <span className="text-[10px] font-black uppercase text-emerald-500 block tracking-wider">Set Correct Answer Term(s)</span>
                                          <Input
                                            placeholder={q.type === "INLINE_BLANKS" ? "Separate blanks by | (e.g. cat|dog)" : q.type === "MATCHING" ? "Enter correct heading indices (e.g., i\\nii)" : "Type correct term (e.g. synonym 1, synonym 2)"}
                                            value={q.correctAnswer || ""}
                                            onChange={(e) =>
                                              updateQuestion(q.id, "correctAnswer", e.target.value)
                                            }
                                            className="h-8 w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl font-bold text-xs"
                                          />
                                          <span className="text-[9px] text-slate-400 italic font-semibold">Separate multiple alternative acceptable terms with commas.</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="pt-10 flex gap-4">
                            <Button
                              type="button"
                              disabled={isSaving}
                              className="flex-1 h-12 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/20 disabled:opacity-50"
                              onClick={() =>
                                handleSave(
                                  "quizzes",
                                  currentQuiz,
                                  setIsEditingQuiz,
                                )
                              }
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Synchronize to Database
                            </Button>
                            {currentQuiz.id && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-2xl font-bold px-6 text-xs uppercase tracking-widest border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                                onClick={() => handleDelete("quizzes", currentQuiz.id)}
                                disabled={isSaving}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Quiz
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="h-12 rounded-2xl font-bold px-8"
                              onClick={() => setIsEditingQuiz(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-40 text-center space-y-4 px-6">
                          <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                            <Brain className="w-10 h-10 text-slate-300" />
                          </div>
                          <h3 className="text-2xl font-black italic tracking-tighter">
                            Syed Ejaz Bukhari's Workshop
                          </h3>
                          <p className="text-sm text-slate-500 italic max-w-xs">
                            Select an existing quiz to revise or initiate the
                            creation of a new interactive module.
                          </p>
                          <Button
                            className="rounded-xl font-bold px-10 h-12"
                            onClick={() => {
                              setCurrentQuiz({
                                title: "",
                                description: "",
                                course_id: "",
                                questions: [],
                              });
                              setIsEditingQuiz(true);
                            }}
                          >
                            Construct New Quiz
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Folders/Categories */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 italic px-2">
                        Library Overview
                      </h4>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
                        {isEditingResource ? (
                          <div className="space-y-4">
                            <h5 className="font-black italic text-sm">
                              {currentResource.id ? "Edit" : "New"} Resource
                            </h5>

                            <div className="relative group">
                              <Button
                                variant="outline"
                                className="w-full h-24 rounded-2xl border-dashed border-2 flex flex-col gap-2 relative overflow-hidden"
                                disabled={isUploading}
                              >
                                {isUploading ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase italic">
                                      Click to Upload Asset
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  onChange={handleFileUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  disabled={isUploading}
                                />
                              </Button>
                            </div>

                            <Input
                              placeholder="File Name"
                              value={currentResource.name || ""}
                              onChange={(e) =>
                                setCurrentResource({
                                  ...currentResource,
                                  name: e.target.value,
                                })
                              }
                              className="rounded-xl"
                            />
                            <select
                              className="w-full h-10 rounded-xl border border-slate-200 bg-transparent px-3 text-xs font-bold"
                              value={currentResource.type}
                              onChange={(e) =>
                                setCurrentResource({
                                  ...currentResource,
                                  type: e.target.value,
                                })
                              }
                            >
                              <option value="PDF">PDF Document</option>
                              <option value="DOCX">Word Document</option>
                              <option value="PNG">Image (PNG)</option>
                              <option value="JPG">Image (JPG)</option>
                              <option value="MP4">Video (MP4)</option>
                              <option value="ZIP">Archive (ZIP)</option>
                              <option value="URL">External Link</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Size"
                                value={currentResource.size || ""}
                                onChange={(e) =>
                                  setCurrentResource({
                                    ...currentResource,
                                    size: e.target.value,
                                  })
                                }
                                className="rounded-xl h-9 text-[10px]"
                              />
                              <div className="flex gap-1 items-center">
                                <Input
                                  placeholder="URL/Source"
                                  value={currentResource.url || ""}
                                  onChange={(e) =>
                                    setCurrentResource({
                                      ...currentResource,
                                      url: e.target.value,
                                    })
                                  }
                                  className="rounded-xl h-9 text-[10px] flex-1"
                                />
                                {currentResource.url && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 rounded-xl text-primary shrink-0"
                                    onClick={() =>
                                      setPreviewResource(currentResource)
                                    }
                                    title="Preview current study material"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase italic text-slate-400">
                                Categorization Tags
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add tag (Press Enter)"
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && tagInput.trim()) {
                                      e.preventDefault();
                                      if (
                                        !(currentResource.tags || []).includes(
                                          tagInput.trim(),
                                        )
                                      ) {
                                        setCurrentResource({
                                          ...currentResource,
                                          tags: [
                                            ...(currentResource.tags || []),
                                            tagInput.trim(),
                                          ],
                                        });
                                      }
                                      setTagInput("");
                                    }
                                  }}
                                  className="rounded-xl h-9 text-xs"
                                />
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(currentResource.tags || []).map(
                                  (tag: string, tidx: number) => (
                                    <Badge
                                      key={tidx}
                                      variant="secondary"
                                      className="text-[9px] font-bold flex items-center gap-1 pr-1"
                                    >
                                      {tag}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-3 w-3 hover:bg-transparent"
                                        onClick={() => {
                                          setCurrentResource({
                                            ...currentResource,
                                            tags: currentResource.tags.filter(
                                              (t: string) => t !== tag,
                                            ),
                                          });
                                        }}
                                      >
                                        <Trash2 className="w-2 h-2" />
                                      </Button>
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="flex-1 font-bold disabled:opacity-50"
                                onClick={() =>
                                  handleSave(
                                    "resources",
                                    currentResource,
                                    setIsEditingResource,
                                  )
                                }
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingResource(false)}
                                disabled={isSaving}
                              >
                                X
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-3xl font-black italic tracking-tighter text-primary">
                              {resources.length}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase italic">
                              Total Assets
                            </p>
                            <Button
                              className="w-full mt-4 rounded-xl font-bold h-10"
                              size="sm"
                              onClick={() => {
                                setCurrentResource({
                                  name: "",
                                  type: "PDF",
                                  size: "0 MB",
                                });
                                setIsEditingResource(true);
                              }}
                            >
                              + New Resource
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resources List */}
                    <div className="md:col-span-3">
                      <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-xl font-black italic">
                            Active Resources
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {resources.length === 0 ? (
                              <div className="text-center py-20 opacity-20">
                                <FileText className="w-12 h-12 mx-auto" />
                                <p className="text-xs uppercase font-black mt-2">
                                  Library Empty
                                </p>
                              </div>
                            ) : (
                              resources.map((res, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    setCurrentResource(res);
                                    setIsEditingResource(true);
                                  }}
                                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/10 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center font-black text-[10px] italic shadow-sm">
                                      {["PNG", "JPG", "JPEG"].includes(
                                        res.type,
                                      ) ? (
                                        <ImageIcon className="w-5 h-5 text-indigo-400" />
                                      ) : ["MP4", "MOV", "VIDEO"].includes(
                                          res.type,
                                        ) ? (
                                        <Film className="w-5 h-5 text-orange-400" />
                                      ) : ["MP3", "WAV", "AUDIO"].includes(
                                          res.type,
                                        ) ? (
                                        <Music className="w-5 h-5 text-emerald-400" />
                                      ) : (
                                        <File className="w-5 h-5 text-indigo-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold truncate text-sm">
                                          {res.name}
                                        </p>
                                        <div className="flex gap-1">
                                          {(res.tags || []).map(
                                            (tag: string, tidx: number) => (
                                              <Badge
                                                key={tidx}
                                                variant="outline"
                                                className="text-[7px] h-3 px-1 border-slate-200 text-slate-400 font-black italic"
                                              >
                                                {tag}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest italic">
                                          {res.size} • {res.type}
                                        </p>
                                        {res.url && (
                                          <a
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl text-primary hover:text-primary-hover hover:bg-primary/10 opacity-0 group-hover:opacity-100 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewResource(res);
                                      }}
                                      title="Preview Study Material"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete("resources", res.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Premium Interactive Resource Preview Dialog */}
                  <Dialog
                    open={!!previewResource}
                    onOpenChange={(open) => !open && setPreviewResource(null)}
                  >
                    <DialogContent className="sm:max-w-3xl rounded-[2rem] border-none bg-white dark:bg-slate-900 shadow-2xl">
                      <DialogHeader className="space-y-1">
                        <DialogTitle className="text-xl font-black italic flex items-center gap-2">
                          <Eye className="w-5 h-5 text-primary" />
                          Previewing:{" "}
                          {previewResource?.name || "Study Material"}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Resource Type:{" "}
                          <strong className="text-primary">
                            {previewResource?.type}
                          </strong>{" "}
                          • Size:{" "}
                          <strong className="text-primary">
                            {previewResource?.size || "N/A"}
                          </strong>
                        </DialogDescription>
                      </DialogHeader>

                      <div className="bg-slate-50 dark:bg-slate-200/5 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-center min-h-[350px]">
                        {previewResource ? (
                          <>
                            {previewResource.type === "PDF" &&
                            previewResource.url &&
                            previewResource.url !== "#" ? (
                              <iframe
                                src={
                                  previewResource.url.startsWith("blob:")
                                    ? previewResource.url
                                    : `${previewResource.url}#toolbar=0`
                                }
                                className="w-full h-[450px] border-none rounded-2xl bg-white shadow-inner"
                                title="PDF Document Preview"
                              />
                            ) : ["MP4", "MOV", "VIDEO"].includes(
                                previewResource.type?.toUpperCase(),
                              ) &&
                              previewResource.url &&
                              previewResource.url !== "#" ? (
                              <video
                                src={previewResource.url}
                                controls
                                className="w-full max-h-[450px] rounded-2xl outline-none bg-black shadow-inner"
                              />
                            ) : ["PNG", "JPG", "JPEG"].includes(
                                previewResource.type?.toUpperCase(),
                              ) &&
                              previewResource.url &&
                              previewResource.url !== "#" ? (
                              <img
                                src={previewResource.url}
                                alt="Study Material Preview"
                                className="max-w-full max-h-[450px] object-contain rounded-2xl shadow-md"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-center p-8 space-y-4 max-w-md">
                                <FileText className="w-16 h-16 text-primary mx-auto opacity-60 animate-bounce" />
                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                                  {previewResource.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                  This is a{" "}
                                  <strong className="text-slate-800 dark:text-slate-200 uppercase">
                                    {previewResource.type}
                                  </strong>{" "}
                                  candidate study reference with a file size
                                  indicator of{" "}
                                  <span className="text-primary font-bold">
                                    {previewResource.size || "Unknown"}
                                  </span>
                                  .
                                </p>
                                {previewResource.url &&
                                previewResource.url !== "#" ? (
                                  <div className="flex flex-col gap-2 pt-2">
                                    <a
                                      href={previewResource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 justify-center rounded-xl text-xs font-black uppercase tracking-wider h-10 w-full bg-primary text-white hover:bg-primary/90 transition-all text-center"
                                    >
                                      Review In New Sandbox Tab{" "}
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <p className="text-[10px] text-slate-400">
                                      Direct download or preview streaming
                                      available via official URL links.
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-orange-500 italic font-medium">
                                    Please drag, drop or upload a valid file
                                    asset or input a direct URL to stream
                                    digital content preview.
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        )}
                      </div>

                      <DialogFooter className="sm:justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-b-[2rem] -mx-6 -mb-6 mt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex gap-1.5 flex-wrap">
                          {(previewResource?.tags || []).map(
                            (tag: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[8px] h-5 font-black uppercase italic select-none"
                              >
                                {tag}
                              </Badge>
                            ),
                          )}
                        </div>
                        <DialogClose
                          render={
                            <Button
                              type="button"
                              variant="secondary"
                              className="rounded-xl text-xs font-bold"
                            />
                          }
                        >
                          Close Preview Window
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="testimonials" className="mt-0 space-y-6">
                  {/* Testimonial Management Dashboard */}
                  <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-slate-950 dark:text-white">
                          Testimonials Manager
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                          Configure success stories, student ratings, and reviews featured on the website landing page.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          setIsEditingTestimonial(true);
                          setCurrentTestimonial({
                            name: "",
                            role: "",
                            comment: "",
                            rating: 5,
                            avatar_url: ""
                          });
                        }}
                        className="rounded-xl font-bold bg-primary text-white flex items-center gap-2 hover:bg-primary/95 shadow-md h-11 px-5"
                      >
                        <Plus className="w-4 h-4" /> Add Testimonial
                      </Button>
                    </div>

                    {/* Filter and stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="md:col-span-3 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search testimonials by student name, role or review comment..."
                          value={testimonialSearch}
                          onChange={(e) => setTestimonialSearch(e.target.value)}
                          className="pl-10 h-12 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                        />
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Total Count</p>
                          <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-200">{testimonials.length}</p>
                        </div>
                        <Award className="w-8 h-8 text-primary/40" />
                      </div>
                    </div>

                    {isEditingTestimonial ? (
                      <Card className="rounded-[2rem] border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6">
                          {currentTestimonial.id ? "✏️ Edit Testimonial" : "✨ Create New Testimonial"}
                        </h3>
                        <form onSubmit={handleSaveTestimonialSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <Label htmlFor="t-name" className="text-xs font-black uppercase text-slate-500 italic block">Student / Reviewer Name *</Label>
                              <Input
                                id="t-name"
                                required
                                value={currentTestimonial.name || ""}
                                onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, name: e.target.value })}
                                placeholder="e.g., RJ Iram Shehzadi"
                                className="rounded-xl h-11 text-xs"
                              />
                            </div>
                            <div className="space-y-4">
                              <Label htmlFor="t-role" className="text-xs font-black uppercase text-slate-500 italic block">Role / Headline</Label>
                              <Input
                                id="t-role"
                                value={currentTestimonial.role || ""}
                                onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, role: e.target.value })}
                                placeholder="e.g., Radio Presenter / RJ or IELTS Graduate"
                                className="rounded-xl h-11 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <Label className="text-xs font-black uppercase text-slate-500 italic block">Rating *</Label>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setCurrentTestimonial({ ...currentTestimonial, rating: star })}
                                    className="p-1 scale-110 hover:scale-125 transition-transform"
                                  >
                                    <span className={`text-2xl ${
                                      star <= (currentTestimonial.rating || 5)
                                        ? "text-amber-500"
                                        : "text-slate-300 dark:text-slate-700"
                                    }`}>★</span>
                                  </button>
                                ))}
                                <span className="text-xs font-mono font-bold text-slate-500 ml-2">
                                  {currentTestimonial.rating || 5} Stars
                                </span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <Label htmlFor="t-avatar" className="text-xs font-black uppercase text-slate-500 italic block">Avatar Image URL (Optional)</Label>
                              <Input
                                id="t-avatar"
                                value={currentTestimonial.avatar_url || ""}
                                onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, avatar_url: e.target.value })}
                                placeholder="e.g., https://images.unsplash.com/... or leave blank for initials"
                                className="rounded-xl h-11 text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="t-comment" className="text-xs font-black uppercase text-slate-500 italic block">Review Comment / Testimony Content *</Label>
                            <textarea
                              id="t-comment"
                              required
                              rows={4}
                              value={currentTestimonial.comment || ""}
                              onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, comment: e.target.value })}
                              placeholder="Write the full feedback here..."
                              className="w-full text-xs p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:outline-none leading-relaxed"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditingTestimonial(false);
                                setCurrentTestimonial({
                                  name: "",
                                  role: "",
                                  comment: "",
                                  rating: 5,
                                  avatar_url: ""
                                });
                              }}
                              className="rounded-xl h-11 font-bold"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="rounded-xl h-11 font-bold px-6"
                            >
                              {currentTestimonial.id ? "Save Changes" : "Submit Testimony"}
                            </Button>
                          </div>
                        </form>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {testimonials
                          .filter(t => {
                            const term = testimonialSearch.toLowerCase();
                            return (
                              String(t.name || "").toLowerCase().includes(term) ||
                              String(t.role || "").toLowerCase().includes(term) ||
                              String(t.comment || "").toLowerCase().includes(term)
                            );
                          })
                          .map((t) => {
                            const initials = (t.name || "S").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                            return (
                              <Card key={t.id || t.name} className="p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-slate-950/20 relative flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex text-amber-500 font-mono text-xs select-none">
                                      {"★".repeat(t.rating || 5)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          setCurrentTestimonial(t);
                                          setIsEditingTestimonial(true);
                                        }}
                                        className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center p-0 animate-none transition-colors"
                                        title="Edit Review"
                                        type="button"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteTestimonialItem(t.id)}
                                        className="w-8 h-8 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950/20 text-rose-500 flex items-center justify-center p-0 transition-colors"
                                        title="Delete Review"
                                        type="button"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{t.comment}"
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                                  {t.avatar_url ? (
                                    <img
                                      src={t.avatar_url}
                                      alt={t.name}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-900 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{t.name}</h4>
                                    <p className="text-[10px] text-slate-400 truncate">{t.role || "Student"}</p>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}

                        {testimonials.length === 0 && (
                          <div className="col-span-full py-12 text-center rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                            <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                              No testimonials configured yet. Click "Add Testimonial" to make success stories visible!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="users" className="mt-0 space-y-6">
                  {/* Dynamic Statistics Block */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 italic">Total Registered</p>
                        <h4 className="text-2xl font-black">{students.length}</h4>
                      </div>
                    </Card>

                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 italic">Active Students</p>
                        <h4 className="text-2xl font-black">{students.filter(s => s.status === 'Active').length}</h4>
                      </div>
                    </Card>

                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 italic">Premium Members</p>
                        <h4 className="text-2xl font-black">
                          {students.filter(s => s.enrolledPlan === 'Pro Premium' || s.enrolledPlan === 'Mastery Ultimate').length}
                        </h4>
                      </div>
                    </Card>

                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 italic">IELTS Graduates</p>
                        <h4 className="text-2xl font-black">{students.filter(s => s.status === 'Graduated').length}</h4>
                      </div>
                    </Card>
                  </div>

                  {/* Search, Filters, and Add Controls Bar */}
                  <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 md:max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search students by name, email, country..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="pl-9 h-11 bg-slate-50 dark:bg-white/5 border-slate-200/80 rounded-xl font-medium text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Exam Filter */}
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-450 italic shrink-0">Exam:</Label>
                          <select
                            value={studentExamFilter}
                            onChange={(e) => setStudentExamFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 h-10 font-bold text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="All">All Exams</option>
                            <option value="Academic">Academic</option>
                            <option value="General Training">General Training</option>
                          </select>
                        </div>

                        {/* Plan Filter */}
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-450 italic shrink-0">Plan:</Label>
                          <select
                            value={studentPlanFilter}
                            onChange={(e) => setStudentPlanFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 h-10 font-bold text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="All">All Plans</option>
                            <option value="Free Trial">Free Trial</option>
                            <option value="Pro Premium">Pro Premium</option>
                            <option value="Mastery Ultimate">Mastery Ultimate</option>
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-450 italic shrink-0">Status:</Label>
                          <select
                            value={studentStatusFilter}
                            onChange={(e) => setStudentStatusFilter(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 h-10 font-bold text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Graduated">Graduated</option>
                          </select>
                        </div>

                        <Button
                          onClick={() => {
                            setCurrentStudent({
                              name: "",
                              email: "",
                              country: "",
                              examType: "Academic",
                              currentBand: 6.0,
                              targetBand: 7.0,
                              speaking: 6.0,
                              writing: 6.0,
                              reading: 6.0,
                              listening: 6.0,
                              enrolledPlan: "Free Trial",
                              status: "Active",
                              enrollmentDate: new Date().toISOString().split("T")[0],
                              notes: "",
                            });
                            setIsEditingStudent(true);
                          }}
                          className="rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-2 bg-primary text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Register Student
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Core Workspace Layout: Master-Detail Split Screen */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left: Interactive Directory Table */}
                    <div className="lg:col-span-2 space-y-4">
                      <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 overflow-hidden">
                        <div className="p-6 pb-2 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900">
                          <div>
                            <CardTitle className="text-lg font-black italic">Student Registry</CardTitle>
                            <CardDescription className="text-xs">
                              Viewing {
                                students.filter((student) => {
                                  const matchesSearch =
                                    (student.name || "").toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                                    (student.email || "").toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                                    (student.country && student.country.toLowerCase().includes((studentSearch || "").toLowerCase()));
                                  const matchesStatus =
                                    studentStatusFilter === "All" || student.status === studentStatusFilter;
                                  const matchesPlan =
                                    studentPlanFilter === "All" || student.enrolledPlan === studentPlanFilter;
                                  const matchesExam =
                                    studentExamFilter === "All" || student.examType === studentExamFilter;
                                  return matchesSearch && matchesStatus && matchesPlan && matchesExam;
                                }).length
                              } of {students.length} total profiles
                            </CardDescription>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Student Details</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Exam Focus & Score</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Membership</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Status</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 italic text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.filter((student) => {
                                const matchesSearch =
                                  (student.name || "").toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                                  (student.email || "").toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                                  (student.country && student.country.toLowerCase().includes((studentSearch || "").toLowerCase()));
                                const matchesStatus =
                                  studentStatusFilter === "All" || student.status === studentStatusFilter;
                                const matchesPlan =
                                  studentPlanFilter === "All" || student.enrolledPlan === studentPlanFilter;
                                const matchesExam =
                                  studentExamFilter === "All" || student.examType === studentExamFilter;
                                return matchesSearch && matchesStatus && matchesPlan && matchesExam;
                              }).length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="text-center py-20 text-slate-400 italic text-sm">
                                    No students match the selected filter criteria.
                                  </td>
                                </tr>
                              ) : (
                                students.filter((student) => {
                                  const matchesSearch =
                                    (student.name || "").toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                                    (student.email || "").toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                                    (student.country && student.country.toLowerCase().includes((studentSearch || "").toLowerCase()));
                                  const matchesStatus =
                                    studentStatusFilter === "All" || student.status === studentStatusFilter;
                                  const matchesPlan =
                                    studentPlanFilter === "All" || student.enrolledPlan === studentPlanFilter;
                                  const matchesExam =
                                    studentExamFilter === "All" || student.examType === studentExamFilter;
                                  return matchesSearch && matchesStatus && matchesPlan && matchesExam;
                                }).map((student) => (
                                  <tr
                                    key={student.id}
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setIsStudentDetailOpen(true);
                                    }}
                                    className={`border-b border-slate-100 dark:border-white/5 last:border-b-0 cursor-pointer transition-all ${
                                      selectedStudent?.id === student.id
                                        ? "bg-primary/5 dark:bg-primary/10"
                                        : getInterventionStatus(student).flagged 
                                          ? "bg-rose-50/40 dark:bg-rose-500/5 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                          : "hover:bg-slate-50 dark:hover:bg-white/5"
                                    } ${getInterventionStatus(student).flagged ? "border-l-4 border-l-rose-500" : ""}`}
                                  >
                                    {/* Name and identity */}
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                                            {student.name.charAt(0)}
                                          </div>
                                          {getInterventionStatus(student).flagged && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                              <AlertCircle className="w-2.5 h-2.5 text-white" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{student.name}</p>
                                            {getInterventionStatus(student).flagged && (
                                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold text-[7px] px-1 py-0 h-3 leading-none uppercase italic">
                                                Flagged
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[10px] font-medium text-slate-450 dark:text-slate-400 truncate max-w-[130px]">{student.email}</p>
                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 shrink-0">
                                              <MapPin className="w-2.5 h-2.5 shrink-0" /> {student.country || "Intl"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Focus and score timeline */}
                                    <td className="p-4">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                          <div className="space-y-1">
                                            <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[8px] font-black uppercase text-slate-500 rounded bg-slate-100 dark:bg-white/10 dark:text-slate-350">
                                              {student.examType}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-[11px] font-bold">
                                              <span className="text-slate-405">B{student.currentBand}</span>
                                              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                              <span className="text-primary font-black">B{student.targetBand}</span>
                                            </div>
                                          </div>
                                          <span className="text-[9px] font-black text-primary italic leading-none font-mono">
                                            {Math.round(((student.currentBand || 1) / (student.targetBand || 9)) * 100)}%
                                          </span>
                                        </div>
                                        {/* Current Band Progress Bar */}
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.max(0, ((student.currentBand || 1) / (student.targetBand || 9)) * 100))}%` }}
                                            className={`h-full ring-1 ring-inset ring-black/5 ${
                                              getInterventionStatus(student).flagged ? "bg-rose-500" : "bg-primary"
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    </td>

                                    {/* Subscription plan level */}
                                    <td className="p-4">
                                      <Badge
                                        className={`rounded px-2 h-5 text-[9px] font-black uppercase italic ${
                                          student.enrolledPlan === "Mastery Ultimate"
                                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                            : student.enrolledPlan === "Pro Premium"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                        }`}
                                      >
                                        {student.enrolledPlan}
                                      </Badge>
                                    </td>

                                    {/* Status level */}
                                    <td className="p-4">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`w-2 h-2 rounded-full ring-2 ${
                                            student.status === "Active"
                                              ? "bg-emerald-500 ring-emerald-500/20 animate-pulse"
                                              : student.status === "Graduated"
                                              ? "bg-violet-500 ring-violet-500/20"
                                              : student.status === "Suspended"
                                              ? "bg-rose-500 ring-rose-500/20"
                                              : "bg-slate-350 ring-slate-400/20"
                                          }`}
                                        />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-350">{student.status}</span>
                                      </div>
                                    </td>

                                    {/* Standard administrative tasks */}
                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-slate-405 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                                          onClick={() => {
                                            setCurrentStudent({...student});
                                            setIsEditingStudent(true);
                                          }}
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-lg"
                                          onClick={() => handleDeleteStudent(student.id)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>

                    {/* Right: Detailed Selected Student Profile & Advisor Notes */}
                    <div className="lg:col-span-1">
                      {selectedStudent ? (
                        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 overflow-hidden sticky top-24">
                          <div className="bg-primary text-white p-6 relative">
                            {/* Visual glowing backgrounds */}
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute top-4 right-4 bg-white/10 p-1 rounded-lg text-white">
                              <GraduationCap className="w-4 h-4" />
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl text-white">
                                {selectedStudent.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/90 italic">
                                  Student File
                                </span>
                                <h3 className="text-xl font-black mt-1 truncate">{selectedStudent.name}</h3>
                                <p className="text-[10px] text-white/80 font-medium font-mono tracking-tight mt-0.5 truncate">{selectedStudent.email}</p>
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-6 space-y-6">
                            {/* Score card grid */}
                            <div className="space-y-4">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Component Bands Breakdown</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { label: "Speaking", score: selectedStudent.speaking || 6.0, icon: <Mic className="w-3 h-3" /> },
                                  { label: "Writing", score: selectedStudent.writing || 6.0, icon: <FileText className="w-3 h-3" /> },
                                  { label: "Reading", score: selectedStudent.reading || 6.0, icon: <BookOpen className="w-3 h-3" /> },
                                  { label: "Listening", score: selectedStudent.listening || 6.0, icon: <Volume2 className="w-3 h-3" /> },
                                ].map((item, id) => (
                                  <div
                                    key={id}
                                    className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center flex flex-col justify-between items-center"
                                  >
                                    <div className="text-slate-400 mb-1">{item.icon}</div>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate max-w-full">{item.label}</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 block">
                                      {Number(item.score).toFixed(1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Core Target Milestones */}
                            <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Master Target Track</h5>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <span className="text-[10px] font-bold text-slate-400">Current Average</span>
                                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">B{Number(selectedStudent.currentBand).toFixed(1)}</p>
                                </div>
                                
                                <div className="flex-1 px-4 flex flex-col items-center">
                                  <span className="text-[10px] font-bold text-slate-400 italic">Target Progress</span>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden relative">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-primary"
                                      style={{ width: `${Math.min(100, Math.max(0, (Number(selectedStudent.currentBand) / Number(selectedStudent.targetBand)) * 100))}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-black text-primary uppercase italic mt-1 font-mono">
                                    {((Number(selectedStudent.currentBand) / Number(selectedStudent.targetBand)) * 100).toFixed(0)}% Close
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-slate-400">Target Score</span>
                                  <p className="text-2xl font-black text-primary">B{Number(selectedStudent.targetBand).toFixed(1)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Enrolled plan & Registration metadata */}
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between py-1 bg-slate-50/50 dark:bg-white/2 rounded-lg px-2">
                                <span className="font-bold text-slate-400">Origin / Country</span>
                                <span className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-primary shrink-0" /> {selectedStudent.country || "Intl"}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 bg-slate-50/50 dark:bg-white/2 rounded-lg px-2">
                                <span className="font-bold text-slate-400">Focus Curriculum</span>
                                <span className="font-black text-slate-700 dark:text-slate-200">{selectedStudent.examType} Syllabus</span>
                              </div>
                              <div className="flex justify-between py-1 bg-slate-50/50 dark:bg-white/2 rounded-lg px-2">
                                <span className="font-bold text-slate-400">Registered Level</span>
                                <span className="font-black text-slate-700 dark:text-slate-200">{selectedStudent.enrolledPlan}</span>
                              </div>
                              <div className="flex justify-between py-1 bg-slate-50/50 dark:bg-white/2 rounded-lg px-2">
                                <span className="font-bold text-slate-400">Enrollment Date</span>
                                <span className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" /> {selectedStudent.enrollmentDate || "2026-05-15"}
                                </span>
                              </div>
                            </div>

                            {/* Academic advisory notepad */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Academic Advisory Notes</h5>
                                <Badge variant="outline" className="text-[8px] font-black uppercase border-primary text-primary px-1.5 h-4 italic shrink-0">
                                  Coaching Desk
                                </Badge>
                              </div>
                              
                              <textarea
                                value={selectedStudent.notes || ""}
                                onChange={(e) => {
                                  const updatedNotes = e.target.value;
                                  const updated = students.map(s => s.id === selectedStudent.id ? { ...s, notes: updatedNotes } : s);
                                  setStudents(updated);
                                  localStorage.setItem("mock_students", JSON.stringify(updated));
                                  setSelectedStudent({ ...selectedStudent, notes: updatedNotes });
                                }}
                                placeholder="Write diagnostic advice, specific skill deficiencies, or customized study strategies for this student here..."
                                className="w-full h-24 p-3 bg-brand-50/20 dark:bg-white/2 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-slate-300 transition-all rounded-2xl text-[11px] leading-relaxed resize-none text-slate-700 dark:text-slate-200 focus:outline-none placeholder:text-slate-400 placeholder:italic font-normal"
                              />
                              <p className="text-[9px] text-slate-400 italic leading-snug">
                                * Advisory notes are auto-saved locally in real time. These notes determine customized evaluation prompts in speaking & writing mock examinations.
                              </p>
                            </div>

                            {/* Actions bar */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => {
                                  setCurrentStudent({...selectedStudent});
                                  setIsEditingStudent(true);
                                }}
                                className="flex-1 rounded-xl h-10 font-bold text-xs bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                              >
                                Edit Profile
                              </Button>

                              <Button
                                onClick={() => handleDeleteStudent(selectedStudent.id)}
                                variant="outline"
                                className="rounded-xl h-10 font-bold text-xs border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/10 dark:hover:bg-red-500/10"
                              >
                                Delete File
                              </Button>
                            </div>

                            {/* Test & Practice Results History */}
                            {(() => {
                              const studentFilteredSubmissions = submissions.filter((sub: any) => {
                                return (
                                  (sub.studentId && selectedStudent.id && String(sub.studentId) === String(selectedStudent.id)) ||
                                  (sub.studentName && selectedStudent.name && sub.studentName.trim().toLowerCase() === selectedStudent.name.trim().toLowerCase())
                                );
                              });

                              return (
                                <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Exam & Test History ({studentFilteredSubmissions.length})</h5>
                                    <Badge variant="outline" className="text-[8px] font-black uppercase border-primary text-primary px-1.5 h-4 italic shrink-0">
                                      Transcript Check
                                    </Badge>
                                  </div>

                                  {studentFilteredSubmissions.length === 0 ? (
                                    <div className="p-4 bg-slate-50 dark:bg-white/2 rounded-2xl border border-dashed border-slate-205 dark:border-white/5 text-center text-[10px] text-slate-450 italic font-medium leading-relaxed">
                                      No practice or examination submissions recorded for this student profile yet.
                                    </div>
                                  ) : (
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                      {studentFilteredSubmissions.map((sub: any, sIdx: number) => {
                                        let details: any = null;
                                        if (sub.lessonType !== "WRITING") {
                                          try {
                                            details = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
                                          } catch (e) {
                                            console.warn("Parse exception reading quiz details:", e);
                                          }
                                        }

                                        const isWriting = sub.lessonType === "WRITING";
                                        return (
                                          <div
                                            key={sub.id || `hist-${sIdx}`}
                                            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/2 dark:hover:bg-white/5 border border-slate-150 dark:border-white/5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                                            onClick={() => setViewingHistorySub(sub)}
                                          >
                                            <div className="min-w-0">
                                              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate leading-snug">{sub.lessonTitle}</p>
                                              <div className="flex items-center gap-1.5 mt-1.5">
                                                <Badge className={`px-1 py-0 h-3.5 text-[8px] font-black rounded border-none ${
                                                  isWriting
                                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-450"
                                                    : sub.lessonType === "LISTENING"
                                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-450"
                                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                                                }`}>
                                                  {sub.lessonType || "READING"}
                                                </Badge>
                                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                                  <Calendar className="w-2.5 h-2.5 shrink-0" /> {new Date(sub.submittedAt).toLocaleDateString()}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                              {isWriting ? (
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 px-2 py-0.5 rounded-lg leading-none">
                                                  {sub.wordCount || 0} w
                                                </span>
                                              ) : (
                                                <div className="flex flex-col items-end leading-none">
                                                  <span className="text-xs font-black text-primary leading-none">
                                                    {details?.score?.correct ?? "?"}/{details?.score?.total ?? "?"}
                                                  </span>
                                                  <span className="text-[8px] font-black text-slate-400 mt-1 leading-none font-mono">
                                                    {details?.score?.percent ?? 0}%
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="rounded-[2rem] border-2 border-dashed border-slate-200/80 dark:border-white/5 p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col justify-center items-center min-h-[350px] bg-slate-50/50 dark:bg-white/1">
                          <Users className="w-12 h-12 mb-4 text-slate-300" />
                          <h4 className="text-sm font-black italic uppercase tracking-wider text-slate-500">Student Profile Workspace</h4>
                          <p className="text-[11px] leading-relaxed max-w-[200px] mt-2 italic font-medium">
                            Select any student directory row to review components breakdown, modify target bands, or write academic advisory notes.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Standard Registration & Editing Dialog Overlay with Motion */}
                  <AnimatePresence>
                    {isEditingStudent && (
                      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl w-full max-w-2xl overflow-hidden my-8"
                        >
                          <form onSubmit={handleSaveStudent}>
                            {/* Form Header */}
                            <div className="bg-primary text-white p-6 flex justify-between items-center">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full italic">
                                  Registry Terminal
                                </span>
                                <h3 className="text-xl font-black mt-1">
                                  {currentStudent.id ? "Edit Student Account Record" : "Register New Student Profile"}
                                </h3>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-white/10 text-white"
                                onClick={() => setIsEditingStudent(false)}
                              >
                                <Plus className="w-5 h-5 rotate-45" />
                              </Button>
                            </div>

                            {/* Form Body - Scrollable */}
                            <div className="max-h-[60vh] overflow-y-auto p-6 lg:p-8 space-y-6 scrollbar-thin">
                              <div className="space-y-6 pb-6">
                                {/* Basic Fields Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5 col-span-1">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Full Name (Required)</Label>
                                    <Input
                                      value={currentStudent.name}
                                      onChange={(e) => setCurrentStudent({...currentStudent, name: e.target.value})}
                                      placeholder="e.g. Wei Zhang"
                                      required
                                      className="rounded-xl h-11 border-slate-200 focus:ring-primary focus:border-primary text-xs font-semibold"
                                    />
                                  </div>

                                  <div className="space-y-1.5 col-span-1">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Email Address (Required)</Label>
                                    <Input
                                      type="email"
                                      value={currentStudent.email}
                                      onChange={(e) => setCurrentStudent({...currentStudent, email: e.target.value})}
                                      placeholder="e.g. wei.zhang@example.com"
                                      required
                                      className="rounded-xl h-11 border-slate-200 focus:ring-primary focus:border-primary text-xs font-semibold"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Country of Origin</Label>
                                    <Input
                                      value={currentStudent.country}
                                      onChange={(e) => setCurrentStudent({...currentStudent, country: e.target.value})}
                                      placeholder="e.g. China"
                                      className="rounded-xl h-11 border-slate-200 focus:ring-primary focus:border-primary text-xs font-semibold"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Registration Date</Label>
                                    <Input
                                      type="date"
                                      value={currentStudent.enrollmentDate ? currentStudent.enrollmentDate.split('T')[0] : ''}
                                      onChange={(e) => setCurrentStudent({...currentStudent, enrollmentDate: e.target.value})}
                                      className="rounded-xl h-11 border-slate-200 focus:ring-primary focus:border-primary text-xs font-semibold font-mono"
                                    />
                                  </div>
                                </div>

                                {/* Membership tier and Status Group */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Exam Focus Type</Label>
                                    <select
                                      value={currentStudent.examType}
                                      onChange={(e) => setCurrentStudent({...currentStudent, examType: e.target.value})}
                                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary h-11"
                                    >
                                      <option value="Academic">Academic</option>
                                      <option value="General Training">General Training</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Membership Tier</Label>
                                    <select
                                      value={currentStudent.enrolledPlan}
                                      onChange={(e) => setCurrentStudent({...currentStudent, enrolledPlan: e.target.value})}
                                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary h-11"
                                    >
                                      <option value="Free Trial">Free Trial</option>
                                      <option value="Pro Premium">Pro Premium</option>
                                      <option value="Mastery Ultimate">Mastery Ultimate</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Academic Status</Label>
                                    <select
                                      value={currentStudent.status}
                                      onChange={(e) => setCurrentStudent({...currentStudent, status: e.target.value})}
                                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary h-11"
                                    >
                                      <option value="Active">Active</option>
                                      <option value="Inactive">Inactive</option>
                                      <option value="Suspended">Suspended</option>
                                      <option value="Graduated">Graduated</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Bands Timeline settings */}
                                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-4">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">IELTS Target & Current Benchmarks</h5>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Current Overall Band</Label>
                                      <select
                                        value={currentStudent.currentBand}
                                        onChange={(e) => setCurrentStudent({...currentStudent, currentBand: parseFloat(e.target.value)})}
                                        className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary h-11"
                                      >
                                        {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(v => (
                                          <option key={v} value={v}>Band {v.toFixed(1)}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Target Overall Band</Label>
                                      <select
                                        value={currentStudent.targetBand}
                                        onChange={(e) => setCurrentStudent({...currentStudent, targetBand: parseFloat(e.target.value)})}
                                        className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary h-11"
                                      >
                                        {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(v => (
                                          <option key={v} value={v}>Band {v.toFixed(1)}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* component items */}
                                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-4 font-mono">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Evaluation Component Breakdown</h5>
                                  
                                  <div className="grid grid-cols-4 gap-2">
                                    {[
                                      { key: "speaking", label: "Speaking" },
                                      { key: "writing", label: "Writing" },
                                      { key: "reading", label: "Reading" },
                                      { key: "listening", label: "Listening" },
                                    ].map((item) => (
                                      <div key={item.key} className="space-y-1.5 text-center">
                                        <Label className="text-[9px] font-bold uppercase text-slate-400">{item.label}</Label>
                                        <select
                                          value={currentStudent[item.key] || 6.0}
                                          onChange={(e) => setCurrentStudent({...currentStudent, [item.key]: parseFloat(e.target.value)})}
                                          className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-black focus:ring-2 focus:ring-primary h-10 text-center"
                                        >
                                          {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(v => (
                                            <option key={v} value={v}>{v.toFixed(1)}</option>
                                          ))}
                                        </select>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Custom notes text area */}
                                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-1.5">
                                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic">Academic Advisory Study Notes</Label>
                                  <textarea
                                    value={currentStudent.notes}
                                    onChange={(e) => setCurrentStudent({...currentStudent, notes: e.target.value})}
                                    placeholder="e.g. Needs specialized practice on relative clauses, coherence in transitions, and timing constraints on writing task indicators..."
                                    className="w-full h-24 p-3 bg-white dark:bg-slate-905 border border-slate-200 rounded-xl text-xs focus:ring-primary focus:border-primary focus:outline-none leading-relaxed"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Form Footer */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 justify-end items-center">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl h-11 px-5 border-slate-200 font-bold text-xs hover:bg-slate-100"
                                onClick={() => setIsEditingStudent(false)}
                              >
                                Cancel Form
                              </Button>
                              <Button
                                type="submit"
                                className="rounded-xl h-11 px-6 font-bold text-xs bg-primary text-white flex items-center gap-1"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
                                {currentStudent.id ? "Synchronize Student" : "Register Student"}
                              </Button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="submissions" className="mt-0">
                  <div className="space-y-6">
                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                      <div>
                        <CardTitle className="text-2xl font-black italic">Student Results & Submissions</CardTitle>
                        <CardDescription className="text-xs">
                          Comprehensive log of writing exercises, listening/reading drills, and full-length academic mock exams taken by students.
                        </CardDescription>
                      </div>
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner shrink-0">
                        <PenTool className="w-8 h-8" />
                      </div>
                    </Card>

                    {/* Filter categories tabs/pills */}
                    <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-150 dark:border-white/5">
                      {[
                        { id: "all", label: "All Achievements" },
                        { id: "writing", label: "Writing Essays" },
                        { id: "mock_test", label: "Academic Mock Tests" },
                        { id: "practice", label: "Skills Drills & Quizzes" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSubmissionsFilter(tab.id)}
                          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${
                            submissionsFilter === tab.id
                              ? "bg-primary text-white border-transparent shadow-md shadow-primary/20 scale-105"
                              : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350 dark:border-white/5"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {(() => {
                        const filtered = (submissions || []).filter((sub: any) => {
                          const type = (sub.lessonType || "").toUpperCase();
                          if (submissionsFilter === "all") return true;
                          if (submissionsFilter === "writing") return type === "WRITING";
                          if (submissionsFilter === "mock_test") return type === "MOCK_TEST";
                          if (submissionsFilter === "practice") return type !== "WRITING" && type !== "MOCK_TEST";
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <Card className="rounded-[2rem] border-none shadow-xl p-12 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 text-slate-400">
                              <FileText className="w-12 h-12 mb-4 text-slate-300" />
                              <h4 className="font-bold text-lg text-slate-500">No matching submissions</h4>
                              <p className="text-xs">Students have not recorded any activities in this category yet.</p>
                            </Card>
                          );
                        }

                        return filtered.map((sub: any, idx: number) => {
                          const isWriting = (sub.lessonType || "").toUpperCase() === "WRITING";
                          const isMock = (sub.lessonType || "").toUpperCase() === "MOCK_TEST";
                          
                          let quizDetails: any = null;
                          if (!isWriting) {
                            try {
                              quizDetails = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
                            } catch (e) {
                              // Plain text or unparsed fallback
                            }
                          }

                          return (
                            <Card key={sub.id || idx} className="rounded-[1.5rem] border border-slate-100 dark:border-white/5 p-6 space-y-4 bg-white dark:bg-slate-900 shadow-md">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                                      {sub.studentName || "Anonymous Student"}
                                    </h4>
                                    <Badge className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border-none ${
                                      isWriting
                                        ? "bg-pink-500/15 text-pink-700 dark:text-pink-400"
                                        : isMock
                                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    }`}>
                                      {sub.lessonType || "READING"}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-500 italic mt-1">
                                    {sub.courseTitle || "Skills Category"} - {sub.lessonTitle}
                                  </p>
                                </div>
                                <div className="text-right flex sm:flex-col items-end justify-between sm:justify-start gap-2 sm:gap-0">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(sub.submittedAt || new Date()).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {isWriting ? (
                                <div className="space-y-4">
                                  <div className="bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-loose font-sans">
                                      {sub.content || "Empty content."}
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-450 font-bold italic">
                                    <span>Word Count: <span className="text-slate-900 dark:text-white font-black">{sub.content ? sub.content.split(" ").filter((w: string) => w.length > 0).length : 0} words</span></span>
                                    <Button
                                      onClick={() => setViewingHistorySub(sub)}
                                      variant="ghost"
                                      className="rounded-xl h-9 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                                    >
                                      Grading Assistant
                                    </Button>
                                  </div>
                                </div>
                              ) : quizDetails?.results?.[0]?.type === 'speaking' ? (
                                <div className="space-y-6">
                                  <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Mic className="w-5 h-5 text-rose-500" />
                                      <h5 className="font-black uppercase text-xs tracking-wider italic">Audio Response Recording</h5>
                                    </div>
                                    <audio src={quizDetails.results[0].data?.audioUrl} controls className="w-full h-10" />
                                    
                                    <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transcript</p>
                                      <p className="text-sm italic font-medium text-slate-600 dark:text-slate-300">{quizDetails.results[0].data?.transcript}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                      { label: "Overall", value: quizDetails.results[0].data?.analysis?.overallBand },
                                      { label: "Fluency", value: quizDetails.results[0].data?.analysis?.criteria?.fluencyCoherence?.band || quizDetails.results[0].data?.analysis?.fluencyScore },
                                      { label: "Lexical", value: quizDetails.results[0].data?.analysis?.criteria?.lexicalResource?.band || quizDetails.results[0].data?.analysis?.correctnessScore },
                                      { label: "Grammar", value: quizDetails.results[0].data?.analysis?.criteria?.grammaticalRange?.band || quizDetails.results[0].data?.analysis?.pronunciationScore }
                                    ].map((stat, sIdx) => (
                                      <div key={sIdx} className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                        <p className="text-lg font-black italic text-primary">{stat.value || "N/A"}</p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">AI Suggestions for Student</p>
                                    <p className="text-xs font-medium italic text-slate-600 dark:text-slate-300 leading-relaxed">
                                      {quizDetails.results[0].data?.analysis?.suggestions || "No suggestions provided."}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-6 text-left">
                                  {isMock && quizDetails?.sections && quizDetails.sections.some((s:any) => s.type === 'Speaking') && (
                                    <div className="space-y-4 border-b border-slate-100 dark:border-white/5 pb-6">
                                      {quizDetails.sections.filter((s: any) => s.type === 'Speaking').map((sec: any, sIdx: number) => (
                                        <div key={sIdx} className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                                          <div className="flex items-center gap-3">
                                             <Mic className="w-5 h-5 text-rose-500" />
                                             <h5 className="font-black uppercase text-xs tracking-wider italic">{sec.section || "Speaking Module"}</h5>
                                          </div>
                                          {sec.results?.[0]?.data?.audioUrl ? (
                                            <div className="space-y-4">
                                              <audio src={sec.results[0].data.audioUrl} controls className="w-full h-10" />
                                              {sec.results[0].data.analysis && (
                                                 <div className="space-y-4">
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                       {[
                                                          { label: "Overall", value: sec.results[0].data.analysis.overallBand || "N/A" },
                                                          { label: "Fluency", value: sec.results[0].data.analysis.criteria?.fluencyCoherence?.band || sec.results[0].data.analysis.fluencyScore || "N/A" },
                                                          { label: "Vocabulary", value: sec.results[0].data.analysis.criteria?.lexicalResource?.band || sec.results[0].data.analysis.correctnessScore || "N/A" },
                                                          { label: "Grammar", value: sec.results[0].data.analysis.criteria?.grammaticalRange?.band || sec.results[0].data.analysis.pronunciationScore || "N/A" }
                                                       ].map((stat, stIdx) => (
                                                          <div key={stIdx} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-white/5 text-center shadow-sm">
                                                             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                                             <p className="text-sm font-black italic text-primary">{stat.value}</p>
                                                          </div>
                                                       ))}
                                                    </div>
                                                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-left">
                                                       <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">AI Feedback</p>
                                                       <p className="text-[11px] font-medium italic text-slate-600 dark:text-slate-300 leading-relaxed">
                                                          {sec.results[0].data.analysis.suggestions || "No feedback generated."}
                                                       </p>
                                                    </div>
                                                 </div>
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase italic">No recording found for this section.</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="space-y-4">
                                  {/* Progress Bar of score accuracy */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-400 uppercase tracking-wider text-[10px]">Test Accuracy</span>
                                        <span className="text-primary font-bold font-mono">{quizDetails?.score?.percent ?? 0}%</span>
                                      </div>
                                      <Progress value={quizDetails?.score?.percent ?? 0} className="h-2 rounded-full" />
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                                      <div>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Score Ratio</span>
                                        <span className="text-2xl font-black font-mono text-primary">
                                          {quizDetails?.score?.correct ?? 0} <span className="text-slate-300 font-normal">/</span> {quizDetails?.score?.total ?? 0}
                                        </span>
                                      </div>
                                      <Button
                                        onClick={() => setViewingHistorySub(sub)}
                                        className="rounded-xl h-10 px-5 font-bold text-xs bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200"
                                      >
                                        Inspect Transcript
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            </Card>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-8">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-xl font-black italic">System Academic Performance</h3>
                          <p className="text-xs text-slate-400">Average test scores across all candidates (Last 10 Days)</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] py-1">
                            Live Metrics
                          </Badge>
                        </div>
                      </div>

                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData.length > 0 ? analyticsData : [
                            {date: 'Jun 01', score: 65},
                            {date: 'Jun 02', score: 68},
                            {date: 'Jun 03', score: 72},
                            {date: 'Jun 04', score: 70},
                            {date: 'Jun 05', score: 75},
                          ]}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))'}} 
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))'}} 
                              domain={[0, 100]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '1rem', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }} 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={4}
                              fillOpacity={1} 
                              fill="url(#colorScore)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 p-8 flex flex-col justify-between">
                      <div className="space-y-6">
                        <h3 className="text-xl font-black italic">Top Performing Modules</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-4 italic">Candidate accuracy by domain</p>
                        
                        <div className="h-[280px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={[
                                { name: 'Listening', score: 88, fill: '#6366f1' },
                                { name: 'Reading', score: 72, fill: '#f59e0b' },
                                { name: 'Writing', score: 64, fill: '#8b5cf6' },
                                { name: 'Grammar', score: 79, fill: '#10b981' },
                                { name: 'Lexis', score: 74, fill: '#ef4444' },
                              ]}
                              layout="vertical"
                              margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                            >
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 900, fill: 'hsl(var(--foreground))'}}
                                width={70}
                              />
                              <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ 
                                  borderRadius: '1rem', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                              />
                              <Bar 
                                dataKey="score" 
                                radius={[0, 8, 8, 0]} 
                                barSize={18}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[10px] font-black uppercase text-slate-400 italic">Global Average Accuracy</p>
                            <div className="flex items-end gap-2 mt-1">
                              <h4 className="text-3xl font-black text-primary">
                                {(analyticsData.reduce((a, b) => a + b.score, 0) / (analyticsData.length || 1)).toFixed(1)}%
                              </h4>
                              <span className="text-[10px] font-bold text-emerald-500 flex items-center mb-1">
                                <ArrowUp className="w-3 h-3" /> 2.4%
                              </span>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[10px] font-black uppercase text-slate-400 italic">Submission Volume</p>
                            <div className="flex items-end gap-2 mt-1">
                              <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                                {submissions.length}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 mb-1">Total Records</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                        <Button className="w-full rounded-xl h-12 font-bold text-xs gap-2 group">
                          Export Performance Report <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-0">
                  <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="text-2xl font-black italic tracking-tighter">
                        Global Parameters
                      </CardTitle>
                      <CardDescription>
                        Adjust core AI prompts, target limits, and system
                        thresholds
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">
                          Gemini 1.5 Pro Threshold
                        </Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            defaultValue="0.7"
                            className="flex-1 accent-primary"
                          />
                          <Badge
                            variant="outline"
                            className="h-10 px-4 font-black text-lg italic"
                          >
                            0.7
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                          Higher thresholds prioritize academic rigor over
                          encouraging feedback in writing evaluations.
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">
                          Maintenance Mode
                        </Label>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200">
                          <div>
                            <p className="text-sm font-black">
                              System Lockdown
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Prevent student logins during database migrations.
                            </p>
                          </div>
                          <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="general" className="mt-0">
                  <div className={`grid grid-cols-1 ${activeGeneralSection === "logo-favicon" ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-8 max-w-6xl mx-auto`}>
                    {/* Input Controls Card */}
                    <Card className={`${activeGeneralSection === "logo-favicon" ? "lg:col-span-2" : "lg:col-span-1"} rounded-[2rem] border-none shadow-2xl shadow-slate-200/50`}>
                      <CardHeader>
                        <CardTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                          <Globe className="w-6 h-6 text-primary" />
                          General Brand Settings
                        </CardTitle>
                        <CardDescription>
                          Select from the available brand customisation options below to view and edit settings.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Favicon & Logo Selection Option */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setActiveGeneralSection(activeGeneralSection === "logo-favicon" ? null : "logo-favicon")}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Favicon & Logo Selection</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Configure site brand assets, favicon, logos, and alternate accessibility text.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400">
                              {activeGeneralSection === "logo-favicon" ? (
                                <ChevronUp className="w-5 h-5 text-primary animate-pulse" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          {/* Collapsible Content */}
                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "logo-favicon" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10">
                                  {/* Header Layout Style Switcher Section */}
                                  <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-lg">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xs font-black uppercase tracking-widest italic text-amber-400 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                        0. Header Layout & Navigation Switcher
                                      </h3>
                                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                                        Active: {siteHeaderStyle === "iot" ? "Header Style 2 (IELTS Online Tests)" : "Header Style 1 (Classic SEB's)"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                      Switch between the traditional classic header and the newly replicated IELTS Online Tests (IOT) banner layout.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                      {/* Option 1: Classic Header */}
                                      <div
                                        onClick={() => setSiteHeaderStyle("classic")}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                          siteHeaderStyle === "classic"
                                            ? "border-emerald-500 bg-emerald-950/40 text-white ring-2 ring-emerald-500/50"
                                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-400">
                                              Header Style 1: Classic
                                            </span>
                                            {siteHeaderStyle === "classic" && (
                                              <span className="text-[9px] font-black uppercase bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                                                Active
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] leading-relaxed text-slate-300">
                                            Features top academic offer ticker bar + SEB's Institute official logo + traditional navigation bar.
                                          </p>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSiteHeaderStyle("classic");
                                          }}
                                          className={`mt-4 w-full text-xs font-black uppercase rounded-lg ${
                                            siteHeaderStyle === "classic"
                                              ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                          }`}
                                        >
                                          {siteHeaderStyle === "classic" ? "Currently Active" : "Switch to Header Style 1"}
                                        </Button>
                                      </div>

                                      {/* Option 2: IOT Style Header */}
                                      <div
                                        onClick={() => setSiteHeaderStyle("iot")}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                          siteHeaderStyle === "iot"
                                            ? "border-rose-500 bg-rose-950/40 text-white ring-2 ring-rose-500/50"
                                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-extrabold uppercase tracking-wide text-rose-400">
                                              Header Style 2: IELTS Online Tests (IOT)
                                            </span>
                                            {siteHeaderStyle === "iot" && (
                                              <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full">
                                                Active
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] leading-relaxed text-slate-300">
                                            Features IOT header layout with self-study score booster banner, dark target score pill, and search navbar.
                                          </p>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSiteHeaderStyle("iot");
                                          }}
                                          className={`mt-4 w-full text-xs font-black uppercase rounded-lg ${
                                            siteHeaderStyle === "iot"
                                              ? "bg-rose-500 text-white hover:bg-rose-400"
                                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                          }`}
                                        >
                                          {siteHeaderStyle === "iot" ? "Currently Active" : "Switch to Header Style 2"}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* IOT Banner customization if Header Style 2 is selected */}
                                    {siteHeaderStyle === "iot" && (
                                      <div className="mt-4 pt-4 border-t border-indigo-500/20 space-y-3 bg-slate-950/80 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                                          Header Style 2 Banner Customization
                                        </span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <Label className="text-[11px] text-slate-300 font-bold">Banner Heading</Label>
                                            <Input
                                              value={iotBannerText}
                                              onChange={(e) => setIotBannerText(e.target.value)}
                                              className="bg-slate-900 border-slate-700 text-white text-xs rounded-lg mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-[11px] text-slate-300 font-bold">Target Audience Subtext / Pill Tag</Label>
                                            <Input
                                              value={iotBannerSubtext}
                                              onChange={(e) => setIotBannerSubtext(e.target.value)}
                                              className="bg-slate-900 border-slate-700 text-white text-xs rounded-lg mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-[11px] text-slate-300 font-bold">Button CTA Label</Label>
                                            <Input
                                              value={iotBannerButtonText}
                                              onChange={(e) => setIotBannerButtonText(e.target.value)}
                                              className="bg-slate-900 border-slate-700 text-white text-xs rounded-lg mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-[11px] text-slate-300 font-bold">Button CTA Link</Label>
                                            <Input
                                              value={iotBannerLink}
                                              onChange={(e) => setIotBannerLink(e.target.value)}
                                              className="bg-slate-900 border-slate-700 text-white text-xs rounded-lg mt-1"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Favicon Settings Section */}
                                  <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-widest italic text-primary">
                                      1. Favicon Architecture
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="favicon-url" className="text-xs font-bold text-slate-705 dark:text-slate-300">Favicon Source URL</Label>
                                        <Input
                                          id="favicon-url"
                                          placeholder="/vite.svg or https://..."
                                          value={generalFaviconUrl}
                                          onChange={(e) => setGeneralFaviconUrl(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-705 dark:text-slate-300">Upload Favicon File</Label>
                                        <div className="border border-dashed border-slate-250 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition relative flex flex-col items-center justify-center bg-white dark:bg-transparent">
                                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Click to upload your image file</span>
                                          <span className="text-[10px] text-slate-400 mt-1">Converts automatically to Base64 URI</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleGeneralFileChange(e, "favicon")}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="favicon-alt" className="text-xs font-bold text-slate-705 dark:text-slate-300">Favicon Alternate Text (Alt)</Label>
                                        <Input
                                          id="favicon-alt"
                                          placeholder="E.g., SEB's Institute Icon"
                                          value={generalFaviconAlt}
                                          onChange={(e) => setGeneralFaviconAlt(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Logo Settings Section */}
                                  <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-widest italic text-primary">
                                      2. Primary Logo Architecture
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="logo-url" className="text-xs font-bold text-slate-705 dark:text-slate-300">Logo Source URL</Label>
                                        <Input
                                          id="logo-url"
                                          placeholder="/sebs_official_logo_v2_1780389206872.png or https://..."
                                          value={generalLogoUrl}
                                          onChange={(e) => setGeneralLogoUrl(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-705 dark:text-slate-300">Upload Logo File</Label>
                                        <div className="border border-dashed border-slate-250 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition relative flex flex-col items-center justify-center bg-white dark:bg-transparent">
                                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Click to upload your logo file</span>
                                          <span className="text-[10px] text-slate-400 mt-1">Converts automatically to Base64 URI</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleGeneralFileChange(e, "logo")}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="logo-alt" className="text-xs font-bold text-slate-705 dark:text-slate-300">Logo Alternate Text (Alt)</Label>
                                        <Input
                                          id="logo-alt"
                                          placeholder="E.g., SEBS Official Logo v2"
                                          value={generalLogoAlt}
                                          onChange={(e) => setGeneralLogoAlt(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Hero Image Settings Section */}
                                  <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-widest italic text-primary">
                                      3. Hero Section Image Architecture
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="hero-image-url" className="text-xs font-bold text-slate-705 dark:text-slate-300">Hero Image Source URL</Label>
                                        <Input
                                          id="hero-image-url"
                                          placeholder="/src/assets/images/... or https://..."
                                          value={generalHeroImageUrl}
                                          onChange={(e) => setGeneralHeroImageUrl(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-705 dark:text-slate-300">Upload Hero Image File</Label>
                                        <div className="border border-dashed border-slate-250 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition relative flex flex-col items-center justify-center bg-white dark:bg-transparent">
                                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Click to upload your hero image file</span>
                                          <span className="text-[10px] text-slate-400 mt-1">Converts automatically to Base64 URI</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleGeneralFileChange(e, "hero")}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="hero-image-alt" className="text-xs font-bold text-slate-705 dark:text-slate-300">Hero Image Alternate Text (Alt)</Label>
                                        <Input
                                          id="hero-image-alt"
                                          placeholder="E.g., SEBS English & IELTS Language Academy mock feedback panel"
                                          value={generalHeroImageAlt}
                                          onChange={(e) => setGeneralHeroImageAlt(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  
                                  {/* Mock Test Promo Video Settings Section */}
                                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 border">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="w-10 h-10 rounded-xl bg-[#00a8cc]/10 flex items-center justify-center text-[#00a8cc]">
                                        <MonitorPlay className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Mock Test Promo Video</h4>
                                        <p className="text-xs text-slate-500">Auto-playing video shown in the mock test section on the homepage. Supports YouTube, Vimeo, or direct MP4 URLs.</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-1.5">
                                        <Label htmlFor="mock-test-promo-video-url" className="text-xs font-bold text-slate-705 dark:text-slate-300">Promo Video URL (YouTube, Vimeo, or MP4)</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            id="mock-test-promo-video-url"
                                            placeholder="E.g., https://www.youtube.com/watch?v=... or https://site.com/video.mp4"
                                            value={mockTestPromoVideoUrl}
                                            onChange={(e) => setMockTestPromoVideoUrl(e.target.value)}
                                            className="rounded-xl border h-10 font-bold text-xs flex-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Syed Ejaz Bukhari Voice Guidance Settings Section */}
                                  <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-widest italic text-primary">
                                      4. Syed Ejaz Bukhari Audio Configuration
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="bukhari-audio-url" className="text-xs font-bold text-slate-705 dark:text-slate-300">Audio Source URL (MP3/WAV/etc.)</Label>
                                        <Input
                                          id="bukhari-audio-url"
                                          placeholder="https://... or raw audio stream path"
                                          value={generalAudioUrl}
                                          onChange={(e) => setGeneralAudioUrl(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-705 dark:text-slate-300">Upload Custom Audio File</Label>
                                        <div className="border border-dashed border-slate-250 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition relative flex flex-col items-center justify-center bg-white dark:bg-transparent">
                                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Click to upload your custom voice audio file</span>
                                          <span className="text-[10px] text-slate-400 mt-1">Accepts mp3, wav, m4a - Converts to Base64 URI</span>
                                          <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={(e) => handleGeneralFileChange(e, "audio")}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="bukhari-audio-transcript" className="text-xs font-bold text-slate-705 dark:text-slate-300">Voice Greeting Subtitle Text / Transcript</Label>
                                        <Input
                                          id="bukhari-audio-transcript"
                                          placeholder="E.g., Welcome to my institute! Let us master structural fluency together..."
                                          value={generalAudioTranscript}
                                          onChange={(e) => setGeneralAudioTranscript(e.target.value)}
                                          className="rounded-xl border h-10 font-bold text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <Button 
                                    onClick={handleSaveGeneralSettings}
                                    className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/95 text-white font-black italic tracking-wide text-xs uppercase"
                                  >
                                    <Save className="w-4 h-4 mr-2" /> Save Brand Configuration
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Page SEO & Meta Tags Manager Dropdown Section */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setActiveGeneralSection(activeGeneralSection === "page-seo" ? null : "page-seo")}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Search className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Page SEO & Meta Tags Manager</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Customize Google search snippet titles and meta descriptions for every page across the website.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 font-bold shrink-0">
                              {activeGeneralSection === "page-seo" ? (
                                <ChevronUp className="w-5 h-5 text-indigo-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "page-seo" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10 text-left">
                                  
                                  <div className="grid grid-cols-1 gap-6">
                                    {/* Home Page */}
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <Globe className="w-4 h-4 text-sky-500" /> Home Page (<code className="text-[11px] text-slate-500">/</code>)
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                        <Input
                                          value={metaLinkHome}
                                          onChange={(e) => setMetaLinkHome(e.target.value)}
                                          placeholder="e.g. https://sebsinstitute.com/"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                        <Input
                                          value={metaTitleHome}
                                          onChange={(e) => setMetaTitleHome(e.target.value)}
                                          placeholder="Home Page Meta Title"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                        <textarea
                                          value={metaDescHome}
                                          onChange={(e) => setMetaDescHome(e.target.value)}
                                          placeholder="Home Page Meta Description"
                                          rows={2}
                                          className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      </div>
                                    </div>

                                    {/* Courses Page */}
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <BookOpen className="w-4 h-4 text-emerald-500" /> Courses Page (<code className="text-[11px] text-slate-500">/courses</code>)
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                        <Input
                                          value={metaLinkCourses}
                                          onChange={(e) => setMetaLinkCourses(e.target.value)}
                                          placeholder="e.g. https://sebsinstitute.com/courses"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                        <Input
                                          value={metaTitleCourses}
                                          onChange={(e) => setMetaTitleCourses(e.target.value)}
                                          placeholder="Courses Page Meta Title"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                        <textarea
                                          value={metaDescCourses}
                                          onChange={(e) => setMetaDescCourses(e.target.value)}
                                          placeholder="Courses Page Meta Description"
                                          rows={2}
                                          className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      </div>
                                    </div>

                                    {/* Mock Tests Page */}
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <Trophy className="w-4 h-4 text-amber-500" /> Mock Tests Page (<code className="text-[11px] text-slate-500">/mock-tests</code>)
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                        <Input
                                          value={metaLinkMockTests}
                                          onChange={(e) => setMetaLinkMockTests(e.target.value)}
                                          placeholder="e.g. https://sebsinstitute.com/mock-tests"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                        <Input
                                          value={metaTitleMockTests}
                                          onChange={(e) => setMetaTitleMockTests(e.target.value)}
                                          placeholder="Mock Tests Page Meta Title"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                        <textarea
                                          value={metaDescMockTests}
                                          onChange={(e) => setMetaDescMockTests(e.target.value)}
                                          placeholder="Mock Tests Page Meta Description"
                                          rows={2}
                                          className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      </div>
                                    </div>

                                    {/* Pricing Page */}
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <BarChart3 className="w-4 h-4 text-purple-500" /> Pricing & Fees Page (<code className="text-[11px] text-slate-500">/pricing</code>)
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                        <Input
                                          value={metaLinkPricing}
                                          onChange={(e) => setMetaLinkPricing(e.target.value)}
                                          placeholder="e.g. https://sebsinstitute.com/pricing"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                        <Input
                                          value={metaTitlePricing}
                                          onChange={(e) => setMetaTitlePricing(e.target.value)}
                                          placeholder="Pricing Page Meta Title"
                                          className="rounded-xl border h-9 text-xs font-medium"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                        <textarea
                                          value={metaDescPricing}
                                          onChange={(e) => setMetaDescPricing(e.target.value)}
                                          placeholder="Pricing Page Meta Description"
                                          rows={2}
                                          className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      </div>
                                    </div>

                                    {/* Auth Pages (Login & Signup) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <LogIn className="w-4 h-4 text-blue-500" /> Login Page (<code className="text-[11px] text-slate-500">/login</code>)
                                        </span>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                          <Input
                                            value={metaTitleLogin}
                                            onChange={(e) => setMetaTitleLogin(e.target.value)}
                                            placeholder="Login Page Meta Title"
                                           />
                                         </div>
                                         <div className="space-y-1.5">
                                           <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                           <Input
                                             value={metaLinkLogin}
                                             onChange={(e) => setMetaLinkLogin(e.target.value)}
                                             placeholder="e.g. https://sebsinstitute.com/login"
                                            className="rounded-xl border h-9 text-xs font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                          <textarea
                                            value={metaDescLogin}
                                            onChange={(e) => setMetaDescLogin(e.target.value)}
                                            placeholder="Login Page Meta Description"
                                            rows={2}
                                            className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      </div>

                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <User className="w-4 h-4 text-cyan-500" /> Signup Page (<code className="text-[11px] text-slate-500">/signup</code>)
                                        </span>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                          <Input
                                            value={metaTitleSignup}
                                            onChange={(e) => setMetaTitleSignup(e.target.value)}
                                            placeholder="Signup Page Meta Title"
                                           />
                                         </div>
                                         <div className="space-y-1.5">
                                           <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                           <Input
                                             value={metaLinkSignup}
                                             onChange={(e) => setMetaLinkSignup(e.target.value)}
                                             placeholder="e.g. https://sebsinstitute.com/signup"
                                            className="rounded-xl border h-9 text-xs font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                          <textarea
                                            value={metaDescSignup}
                                            onChange={(e) => setMetaDescSignup(e.target.value)}
                                            placeholder="Signup Page Meta Description"
                                            rows={2}
                                            className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Student Dashboard & Writing Evaluator */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Student Dashboard (<code className="text-[11px] text-slate-500">/dashboard</code>)
                                        </span>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                          <Input
                                            value={metaTitleDashboard}
                                            onChange={(e) => setMetaTitleDashboard(e.target.value)}
                                            placeholder="Dashboard Meta Title"
                                           />
                                         </div>
                                         <div className="space-y-1.5">
                                           <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                           <Input
                                             value={metaLinkDashboard}
                                             onChange={(e) => setMetaLinkDashboard(e.target.value)}
                                             placeholder="e.g. https://sebsinstitute.com/dashboard"
                                            className="rounded-xl border h-9 text-xs font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                          <textarea
                                            value={metaDescDashboard}
                                            onChange={(e) => setMetaDescDashboard(e.target.value)}
                                            placeholder="Dashboard Meta Description"
                                            rows={2}
                                            className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      </div>

                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-rose-500" /> AI Writing Evaluator (<code className="text-[11px] text-slate-500">/dashboard/writing</code>)
                                        </span>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                          <Input
                                            value={metaTitleWriting}
                                            onChange={(e) => setMetaTitleWriting(e.target.value)}
                                            placeholder="Writing Module Meta Title"
                                           />
                                         </div>
                                         <div className="space-y-1.5">
                                           <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                           <Input
                                             value={metaLinkWriting}
                                             onChange={(e) => setMetaLinkWriting(e.target.value)}
                                             placeholder="e.g. https://sebsinstitute.com/dashboard/writing"
                                            className="rounded-xl border h-9 text-xs font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                          <textarea
                                            value={metaDescWriting}
                                            onChange={(e) => setMetaDescWriting(e.target.value)}
                                            placeholder="Writing Module Meta Description"
                                            rows={2}
                                            className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Legal Pages (Terms & Privacy) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <ShieldCheck className="w-4 h-4 text-teal-500" /> Terms of Service (<code className="text-[11px] text-slate-500">/terms</code>)
                                        </span>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                          <Input
                                            value={metaTitleTerms}
                                            onChange={(e) => setMetaTitleTerms(e.target.value)}
                                            placeholder="Terms Page Meta Title"
                                           />
                                         </div>
                                         <div className="space-y-1.5">
                                           <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                           <Input
                                             value={metaLinkTerms}
                                             onChange={(e) => setMetaLinkTerms(e.target.value)}
                                             placeholder="e.g. https://sebsinstitute.com/terms"
                                            className="rounded-xl border h-9 text-xs font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                          <textarea
                                            value={metaDescTerms}
                                            onChange={(e) => setMetaDescTerms(e.target.value)}
                                            placeholder="Terms Page Meta Description"
                                            rows={2}
                                            className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      </div>

                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                                        <span className="font-extrabold text-xs text-primary flex items-center gap-2">
                                          <ShieldCheck className="w-4 h-4 text-slate-500" /> Privacy Policy (<code className="text-[11px] text-slate-500">/privacy</code>)
                                        </span>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Title</Label>
                                          <Input
                                            value={metaTitlePrivacy}
                                            onChange={(e) => setMetaTitlePrivacy(e.target.value)}
                                            placeholder="Privacy Page Meta Title"
                                           />
                                         </div>
                                         <div className="space-y-1.5">
                                           <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL / Page Link</Label>
                                           <Input
                                             value={metaLinkPrivacy}
                                             onChange={(e) => setMetaLinkPrivacy(e.target.value)}
                                             placeholder="e.g. https://sebsinstitute.com/privacy"
                                            className="rounded-xl border h-9 text-xs font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Description</Label>
                                          <textarea
                                            value={metaDescPrivacy}
                                            onChange={(e) => setMetaDescPrivacy(e.target.value)}
                                            placeholder="Privacy Page Meta Description"
                                            rows={2}
                                            className="w-full rounded-xl border p-2.5 text-xs font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                  </div>

                                  <Button 
                                    onClick={handleSaveGeneralSettings}
                                    className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/95 text-white font-black italic tracking-wide text-xs uppercase"
                                  >
                                    <Save className="w-4 h-4 mr-2" /> Save Page Meta Settings
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Announcement Popup Settings Section */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setActiveGeneralSection(activeGeneralSection === "announcement" ? null : "announcement")}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                                <Megaphone className="w-5 h-5 animate-pulse" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Announcement Popup Settings</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Manage your global welcome broadcast pop-up banner, duration timers, active triggers and themes.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 font-bold shrink-0">
                              {activeGeneralSection === "announcement" ? (
                                <ChevronUp className="w-5 h-5 text-red-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "announcement" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10 text-left">
                                  <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                                      <h3 className="text-xs font-black uppercase tracking-widest italic text-red-650 dark:text-red-400 flex items-center gap-1.5 font-sans">
                                        <Megaphone className="w-4 h-4" /> Global Welcome Broadcast popup
                                      </h3>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAnnouncementActive(!announcementActive)}
                                        className={`rounded-xl px-4 h-8 text-[11px] font-black uppercase tracking-widest ${announcementActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-120 dark:bg-white/5 border-slate-200 text-slate-400"}`}
                                      >
                                        {announcementActive ? "Active" : "Disabled"}
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="popup-title" className="text-xs font-bold text-slate-705 dark:text-slate-300">Broadcast Header Title</Label>
                                        <Input
                                          id="popup-title"
                                          placeholder="E.g., Special Admissions Notice"
                                          value={announcementTitle}
                                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                                          className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="popup-expiry" className="text-xs font-bold text-slate-705 dark:text-slate-300">Active Urgency Indicator (Time/Exp)</Label>
                                        <Input
                                          id="popup-expiry"
                                          placeholder="E.g., Closing Tonight Midnight"
                                          value={announcementExpiry}
                                          onChange={(e) => setAnnouncementExpiry(e.target.value)}
                                          className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="popup-message" className="text-xs font-bold text-slate-705 dark:text-slate-300">Broadcast Core Message</Label>
                                      <textarea
                                        id="popup-message"
                                        rows={3}
                                        placeholder="Enter the broadcast notification copy..."
                                        value={announcementMessage}
                                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                                        className="w-full rounded-xl border p-3 font-semibold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 focus:outline-none focus:border-red-550"
                                      />
                                    </div>

                                    {/* Theme Options (Urgent Red or Standard Slate) */}
                                    <div className="space-y-2">
                                      <Label className="text-xs font-bold text-slate-750 dark:text-slate-300">Display Color Aesthetic Preset</Label>
                                      <div className="flex gap-3">
                                        <button
                                          type="button"
                                          onClick={() => setAnnouncementTheme("urgent-red")}
                                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${announcementTheme === "urgent-red" ? "border-red-500 bg-red-500/10 text-red-650 dark:text-red-400" : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                        >
                                          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                                          Urgent Red Theme
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setAnnouncementTheme("standard")}
                                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${announcementTheme === "standard" ? "border-emerald-550 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                        >
                                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-555 bg-emerald-500" />
                                          Standard Emerald Theme
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <Button 
                                    onClick={handleSaveAnnouncementSettings}
                                    className="w-full rounded-2xl h-12 bg-red-600 hover:bg-red-550 text-white font-black italic tracking-wide text-xs uppercase"
                                  >
                                    <Save className="w-4 h-4 mr-2" /> Save Announcement Trigger settings
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Top Rolling Offer Bar Settings Section */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setActiveGeneralSection(activeGeneralSection === "offer-bar" ? null : "offer-bar")}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Percent className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Top Rolling Offer Bar</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Sync global promotions to your premium rolling countdown header, link pathways and close buttons.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 font-bold shrink-0">
                              {activeGeneralSection === "offer-bar" ? (
                                <ChevronUp className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "offer-bar" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10 text-left">
                                  <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                                      <h3 className="text-xs font-black uppercase tracking-widest italic text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-sans">
                                        <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" /> Header Offer Ticker Banner
                                      </h3>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setOfferBarActive(!offerBarActive)}
                                        className={`rounded-xl px-4 h-8 text-[11px] font-black uppercase tracking-widest ${offerBarActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-120 dark:bg-white/5 border-slate-200 text-slate-400"}`}
                                      >
                                        {offerBarActive ? "Active" : "Disabled"}
                                      </Button>
                                    </div>

                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="offer-text" className="text-xs font-bold text-slate-705 dark:text-slate-300">Offer Bar Message Ticker Copy</Label>
                                        <Input
                                          id="offer-text"
                                          placeholder="E.g., Special Live Batches are now recruiting"
                                          value={offerBarText}
                                          onChange={(e) => setOfferBarText(e.target.value)}
                                          className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="offer-link-text" className="text-xs font-bold text-slate-705 dark:text-slate-300">Button/Link Text</Label>
                                          <Input
                                            id="offer-link-text"
                                            placeholder="E.g., Claim Seats"
                                            value={offerBarLinkText}
                                            onChange={(e) => setOfferBarLinkText(e.target.value)}
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="offer-link-path" className="text-xs font-bold text-slate-705 dark:text-slate-300">Redirect Link URL Path</Label>
                                          <Input
                                            id="offer-link-path"
                                            placeholder="E.g., /courses or /pricing"
                                            value={offerBarLink}
                                            onChange={(e) => setOfferBarLink(e.target.value)}
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Button 
                                    onClick={handleSaveOfferBarSettings}
                                    className="w-full rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-550 text-white font-black italic tracking-wide text-xs uppercase"
                                  >
                                    <Save className="w-4 h-4 mr-2" /> Save Ticker Header Configuration
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Dynamic Instructors Directory Settings Section */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGeneralSection(activeGeneralSection === "instructors" ? null : "instructors");
                              setEditingInstructor(null);
                            }}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Instructors Directory settings</span>
                                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Manage your elite faculty profiles, specify credentials, custom gradients, email channels and LinkedIn profiles.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 font-bold shrink-0">
                              {activeGeneralSection === "instructors" ? (
                                <ChevronUp className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "instructors" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10 text-left">
                                  
                                  {/* List of current instructors */}
                                  {!editingInstructor && (
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Faculty List ({teamMembers.length})</span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => setEditingInstructor({
                                            id: `team-new-${Date.now()}`,
                                            name: "",
                                            role: "",
                                            credentials: "",
                                            initials: "",
                                            gradient: "from-emerald-600 to-emerald-800",
                                            bio: "",
                                            expertise: "",
                                            email: "info@sebsinstitute.com",
                                            linkedin: "https://linkedin.com",
                                            image_url: null,
                                            sort_order: teamMembers.length + 1
                                          })}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9 px-4 font-black uppercase tracking-wider font-sans transition-colors"
                                        >
                                          <Plus className="w-4 h-4 mr-1.5" /> Add New Faculty
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-1 gap-3">
                                        {teamMembers.map((member, i) => {
                                          const specializations = Array.isArray(member.expertise) 
                                            ? member.expertise.join(", ") 
                                            : member.expertise || "";
                                          const hasCustomAvatar = !!member.image_url;

                                          return (
                                            <div 
                                              key={member.id || i}
                                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all gap-4"
                                            >
                                              <div className="flex items-center gap-4">
                                                {/* Mini Avatar preview */}
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${member.gradient || "from-emerald-600 to-emerald-800"} p-[2px] shadow-sm shrink-0`}>
                                                  <div className="w-full h-full rounded-xl bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                                                    {hasCustomAvatar ? (
                                                      <img 
                                                        src={member.image_url} 
                                                        alt={member.name} 
                                                        className="w-full h-full rounded-xl object-cover" 
                                                        referrerPolicy="no-referrer"
                                                      />
                                                    ) : (
                                                      <span className={`text-[10px] font-black bg-gradient-to-tr ${member.gradient || "from-emerald-600 to-emerald-800"} bg-clip-text text-transparent font-mono`}>
                                                        {member.initials || "FAC"}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white">{member.name || "Untitled Educator"}</h4>
                                                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-550 border-none font-bold text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded">
                                                      Pos {member.sort_order || 0}
                                                    </Badge>
                                                  </div>
                                                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{member.role || "No Title Specified"}</p>
                                                  <p className="text-[10px] text-slate-400 font-bold truncate max-w-sm mt-0.5">{specializations}</p>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2 self-end sm:self-center">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setEditingInstructor({
                                                    ...member,
                                                    expertise: Array.isArray(member.expertise) ? member.expertise.join(", ") : member.expertise || ""
                                                  })}
                                                  className="border-slate-200 dark:border-white/10 hover:bg-slate-550 h-8 w-8 p-0 rounded-lg flex items-center justify-center text-slate-500"
                                                >
                                                  <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleDeleteTeamMember(member.id)}
                                                  className="border-red-100 hover:bg-red-500/5 hover:text-red-650 hover:border-red-500/20 h-8 w-8 p-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-650"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Editing / Creating view */}
                                  {editingInstructor && (
                                    <form onSubmit={handleSaveTeamMember} className="space-y-5 p-5 rounded-3xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                                        <h4 className="text-xs font-black uppercase tracking-widest italic text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-sans">
                                          <Users className="w-4 h-4" /> 
                                          {editingInstructor.id && !editingInstructor.id.startsWith("team-new-") ? "Edit Faculty Profile" : "Create New Faculty profile"}
                                        </h4>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingInstructor(null)}
                                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 col-span-1">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Instructor Full Name</Label>
                                          <Input
                                            required
                                            value={editingInstructor.name}
                                            onChange={e => setEditingInstructor({...editingInstructor, name: e.target.value})}
                                            placeholder="E.g., Dr. Alice Smith"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                          />
                                        </div>
                                        <div className="space-y-1.5 col-span-1">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Designation / Role</Label>
                                          <Input
                                            required
                                            value={editingInstructor.role}
                                            onChange={e => setEditingInstructor({...editingInstructor, role: e.target.value})}
                                            placeholder="E.g., Senior Linguistics Lead"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Credentials Line</Label>
                                          <Input
                                            value={editingInstructor.credentials}
                                            onChange={e => setEditingInstructor({...editingInstructor, credentials: e.target.value})}
                                            placeholder="E.g., MS Linguistics • CELTA Certified • 10+ Years Exp."
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                          />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initials (max 3 letters)</Label>
                                            <Input
                                              value={editingInstructor.initials || ""}
                                              onChange={e => setEditingInstructor({...editingInstructor, initials: e.target.value.substring(0,3).toUpperCase()})}
                                              placeholder="E.g., DAS"
                                              className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-mono"
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sort Order Position</Label>
                                            <Input
                                              type="number"
                                              value={editingInstructor.sort_order}
                                              onChange={e => setEditingInstructor({...editingInstructor, sort_order: Number(e.target.value)})}
                                              placeholder="E.g., 1"
                                              className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Preset Avatar Gradients selector */}
                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Visual Aesthetic Gradient</Label>
                                        <div className="flex gap-2 flex-wrap pb-1">
                                          {[
                                            { class: "from-emerald-600 to-emerald-800", label: "Emerald Royal" },
                                            { class: "from-emerald-500 to-teal-500", label: "Midnight Sea" },
                                            { class: "from-amber-500 to-orange-500", label: "Warm Sunset" },
                                            { class: "from-red-500 to-rose-500", label: "Crimson Blaze" },
                                            { class: "from-emerald-500 to-green-500", label: "Vibrant Emerald" },
                                            { class: "from-blue-500 to-emerald-500", label: "Deep Cobalt" }
                                          ].map((g, i) => (
                                            <button
                                              key={i}
                                              type="button"
                                              onClick={() => setEditingInstructor({ ...editingInstructor, gradient: g.class })}
                                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${editingInstructor.gradient === g.class ? "border-slate-800 dark:border-white bg-slate-900/10 text-slate-900 dark:text-white" : "border-slate-100 hover:border-slate-250 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] text-slate-405"}`}
                                            >
                                              <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${g.class}`} />
                                              {g.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Professional Biography Summary</Label>
                                        <textarea
                                          required
                                          rows={3}
                                          value={editingInstructor.bio}
                                          onChange={e => setEditingInstructor({...editingInstructor, bio: e.target.value})}
                                          placeholder="Enter brief biographical summary of the educator..."
                                          className="w-full rounded-xl border p-3 font-semibold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 focus:outline-none focus:border-red-500"
                                        />
                                      </div>

                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Specialization Tags (comma separated)</Label>
                                        <Input
                                          value={editingInstructor.expertise}
                                          onChange={e => setEditingInstructor({...editingInstructor, expertise: e.target.value})}
                                          placeholder="E.g., IELTS Academic, Spoken Mastery, Accent Training"
                                          className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Email Channel</Label>
                                          <Input
                                            type="email"
                                            value={editingInstructor.email || ""}
                                            onChange={e => setEditingInstructor({...editingInstructor, email: e.target.value})}
                                            placeholder="info@sebsinstitute.com"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">LinkedIn Profile URL</Label>
                                          <Input
                                            type="url"
                                            value={editingInstructor.linkedin || ""}
                                            onChange={e => setEditingInstructor({...editingInstructor, linkedin: e.target.value})}
                                            placeholder="https://linkedin.com"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                          />
                                        </div>
                                      </div>

                                      {/* Avatar Image Selection & Upload option */}
                                      <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <Label className="text-xs font-bold text-slate-800 dark:text-slate-300">Instructor Picture Avatar</Label>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Supply an image URL path or upload a file directly to serialize it as a Base64 asset.</p>
                                          </div>
                                          {editingInstructor.image_url && (
                                            <button 
                                              type="button" 
                                              onClick={() => setEditingInstructor({...editingInstructor, image_url: null})}
                                              className="text-[10px] font-black uppercase text-red-500 hover:text-red-700"
                                            >
                                              Clear Image
                                            </button>
                                          )}
                                        </div>

                                        <div className="flex gap-4 items-center">
                                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${editingInstructor.gradient || "from-emerald-600 to-emerald-800"} p-[2px] shadow shrink-0 overflow-hidden flex items-center justify-center`}>
                                            <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                                              {editingInstructor.image_url ? (
                                                <img 
                                                  src={editingInstructor.image_url} 
                                                  alt="Instructor Picture" 
                                                  className="w-full h-full object-cover"
                                                  referrerPolicy="no-referrer"
                                                />
                                              ) : (
                                                <span className={`text-xs font-black bg-gradient-to-tr ${editingInstructor.gradient || "from-emerald-600 to-emerald-800"} bg-clip-text text-transparent font-mono`}>
                                                  {editingInstructor.initials || "FAC"}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex-1 space-y-2">
                                            <Input
                                              value={editingInstructor.image_url || ""}
                                              onChange={e => setEditingInstructor({...editingInstructor, image_url: e.target.value || null})}
                                              placeholder="E.g., https://example.com/alice.png"
                                              className="rounded-xl border h-9 font-semibold text-xs text-slate-905 dark:text-white bg-white dark:bg-slate-900"
                                            />
                                            <div className="relative">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                id="educator-file-picker"
                                                onChange={handleTeamMemberFileChange}
                                                className="hidden"
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById("educator-file-picker")?.click()}
                                                className="rounded-xl px-4 h-8 text-[10px] font-black uppercase tracking-wider"
                                              >
                                                <Upload className="w-3.5 h-3.5 mr-1.5" /> Or Upload Image File
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-3 pt-2">
                                        <Button
                                          type="submit"
                                          className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-505 text-white font-black uppercase tracking-wider text-xs"
                                        >
                                          <Save className="w-4 h-4 mr-2" /> Save Profile Details
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => setEditingInstructor(null)}
                                          className="rounded-xl h-11 border-slate-200 px-6 font-black uppercase tracking-wider text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </form>
                                  )}

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Dynamic Pricing Plans Settings Section */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGeneralSection(activeGeneralSection === "pricing" ? null : "pricing");
                              setEditingPlan(null);
                            }}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                                <Coins className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Manage Pricing Plans</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Review, edit, add, or delete training programs, prices, features list, and full curriculum. Sync to Supabase.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 font-bold shrink-0">
                              {activeGeneralSection === "pricing" ? (
                                <ChevronUp className="w-5 h-5 text-purple-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "pricing" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10 text-left">
                                  
                                  {/* List of current pricing plans */}
                                  {!editingPlan && (
                                    <div className="space-y-4">
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-100 dark:border-white/5 gap-3">
                                        <div className="text-left">
                                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Programs ({pricingPlans.length})</span>
                                          <p className="text-[10px] text-slate-400 leading-normal">Saved to dynamic catalog</p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleResetPricingPlansToDefault}
                                            className="border-slate-200 hover:bg-slate-50 text-slate-605 dark:text-slate-350 rounded-xl text-xs h-9 px-3 font-semibold transition-colors bg-white dark:bg-slate-900"
                                          >
                                            Reset Defaults
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleAddNewPricingPlan}
                                            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs h-9 px-4 font-black uppercase tracking-wider font-sans transition-colors"
                                          >
                                            <Plus className="w-4 h-4 mr-1.5" /> Add New Plan
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 gap-3">
                                        {pricingPlans.map((plan, i) => {
                                          return (
                                            <div 
                                              key={plan.id || i}
                                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all gap-4"
                                            >
                                              <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-sm shrink-0">
                                                  PKR
                                                </div>
                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white">{plan.name || "Untitled Program"}</h4>
                                                    {plan.isPopular && (
                                                      <Badge className="bg-amber-500 text-white border-none font-bold text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded">
                                                        Popular
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">{plan.priceDisplay}</span>
                                                    <span className="text-slate-300 dark:text-slate-700 font-sans">•</span>
                                                    <span className="text-[11px] text-slate-400 font-bold">{plan.period}</span>
                                                    <span className="text-slate-300 dark:text-slate-700 font-sans">•</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{plan.category}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2 self-end sm:self-center">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setEditingPlan(plan)}
                                                  className="border-slate-200 dark:border-white/10 hover:bg-slate-50 h-8 w-8 p-0 rounded-lg flex items-center justify-center text-slate-500"
                                                >
                                                  <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleDeletePricingPlan(plan.id)}
                                                  className="border-red-100 hover:bg-red-550/5 hover:text-red-600 h-8 w-8 p-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {pricingPlans.length === 0 && (
                                          <div className="text-center py-8 text-xs text-slate-400 font-semibold font-sans">
                                            No training packages found in catalog. Create one, or tap "Reset Defaults" above!
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Editing/Creating view for a Plan */}
                                  {editingPlan && (
                                    <form onSubmit={handleSavePricingPlan} className="space-y-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-inner">
                                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                                        <h4 className="text-xs font-black uppercase tracking-widest italic text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-sans">
                                          <Coins className="w-4 h-4" /> 
                                          {String(editingPlan.id).startsWith("plan-new-") ? "Create New Pricing Plan" : "Edit Pricing Card"}
                                        </h4>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-305">Plan Display Name</Label>
                                          <Input
                                            required
                                            value={editingPlan.name}
                                            onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                                            placeholder="E.g., 4 Weeks IELTS Prep"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-305">Course Category Connection</Label>
                                          <select
                                            value={editingPlan.category}
                                            onChange={e => setEditingPlan({...editingPlan, category: e.target.value as any})}
                                            className="w-full rounded-xl border h-10 px-3 font-semibold text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                                          >
                                            <option value="spoken">spoken (Spoken English)</option>
                                            <option value="ielts-writing">ielts-writing (IELTS & Writing)</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-705 dark:text-slate-305">Tagline / Subheading Accent</Label>
                                        <Input
                                          value={editingPlan.tagline}
                                          onChange={e => setEditingPlan({...editingPlan, tagline: e.target.value})}
                                          placeholder="E.g., Complete speech fluency, boost confidence & master conversation"
                                          className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-705 dark:text-slate-305">Price Display Text (PKR / USD / etc.)</Label>
                                          <Input
                                            required
                                            value={editingPlan.priceDisplay}
                                            onChange={e => setEditingPlan({...editingPlan, priceDisplay: e.target.value})}
                                            placeholder="E.g., PKR 44,000"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-705 dark:text-slate-305">Numeric Value (for stats)</Label>
                                          <Input
                                            type="number"
                                            value={editingPlan.priceVal}
                                            onChange={e => setEditingPlan({...editingPlan, priceVal: Number(e.target.value)})}
                                            placeholder="E.g., 44000"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-705 dark:text-slate-305">Program Duration Period</Label>
                                          <Input
                                            required
                                            value={editingPlan.period || ""}
                                            onChange={e => setEditingPlan({...editingPlan, period: e.target.value})}
                                            placeholder="E.g., 4 Weeks Program"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-705 dark:text-slate-305">Brief Outline Description</Label>
                                        <textarea
                                          value={editingPlan.description || ""}
                                          onChange={e => setEditingPlan({...editingPlan, description: e.target.value})}
                                          placeholder="Enter brief card description..."
                                          className="w-full rounded-xl border p-3 font-semibold text-xs bg-white dark:bg-slate-950 text-slate-100 border-slate-200 dark:border-white/10"
                                          rows={2}
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-705">Action Button Label (CTA)</Label>
                                          <Input
                                            value={editingPlan.cta || ""}
                                            onChange={e => setEditingPlan({...editingPlan, cta: e.target.value})}
                                            placeholder="E.g., Enroll Now"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-705">Card Accent CSS Border Class</Label>
                                          <Input
                                            value={editingPlan.accent || ""}
                                            onChange={e => setEditingPlan({...editingPlan, accent: e.target.value})}
                                            placeholder="E.g., border-primary ring-2 ring-primary bg-slate-50"
                                            className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 py-1">
                                        <input
                                          type="checkbox"
                                          id="plan-is-popular"
                                          checked={editingPlan.isPopular}
                                          onChange={e => setEditingPlan({...editingPlan, isPopular: e.target.checked})}
                                          className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                                        />
                                        <Label htmlFor="plan-is-popular" className="text-xs font-extrabold text-slate-700 dark:text-slate-300 cursor-pointer">
                                          Mark this plan as &quot;Most Popular&quot; (highlights with Flame / glow overlay)
                                        </Label>
                                      </div>

                                      {/* Key Features list (mapped from features text) */}
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700">Quick Bullet Points Inclusions (one per line)</Label>
                                        <textarea
                                          value={(editingPlan.features || []).join("\n")}
                                          onChange={e => setEditingPlan({...editingPlan, features: e.target.value.split("\n")})}
                                          placeholder="Confidence removal of fear, shyness & hesitation&#10;EBM core speech drills&#10;Practical tenses & sentence structure"
                                          rows={4}
                                          className="w-full rounded-xl border p-3 font-semibold text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-white/10"
                                        />
                                      </div>

                                      {/* Detailed Curriculum Section (for pop-ups as well) */}
                                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <h5 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">Detailed Curriculum Outlines (Interactive Popups & Outcomes)</h5>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-705">Curriculum Focus Area</Label>
                                            <Input
                                              value={editingPlan.detailedCurriculum?.focus || ""}
                                              onChange={e => setEditingPlan({
                                                ...editingPlan,
                                                detailedCurriculum: {
                                                  ...editingPlan.detailedCurriculum,
                                                  focus: e.target.value,
                                                  duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                  method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                  bestFor: editingPlan.detailedCurriculum?.bestFor || "",
                                                  mainFeatures: editingPlan.detailedCurriculum?.mainFeatures || [],
                                                  outcomes: editingPlan.detailedCurriculum?.outcomes || []
                                                }
                                              })}
                                              placeholder="E.g., Fast confidence building and basic spoken English improvement"
                                              className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-705">Best For Target Group</Label>
                                            <Input
                                              value={editingPlan.detailedCurriculum?.bestFor || ""}
                                              onChange={e => setEditingPlan({
                                                ...editingPlan,
                                                detailedCurriculum: {
                                                  ...editingPlan.detailedCurriculum,
                                                  bestFor: e.target.value,
                                                  duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                  method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                  focus: editingPlan.detailedCurriculum?.focus || "",
                                                  mainFeatures: editingPlan.detailedCurriculum?.mainFeatures || [],
                                                  outcomes: editingPlan.detailedCurriculum?.outcomes || []
                                                }
                                              })}
                                              placeholder="E.g., Beginners, weak speakers, professionals"
                                              className="rounded-xl border h-10 font-semibold text-xs text-slate-900 bg-white dark:bg-slate-955"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-slate-705">Key Learning Outcomes (One per line - Displays on card and inside popup!)</Label>
                                          <textarea
                                            value={(editingPlan.detailedCurriculum?.outcomes || []).join("\n")}
                                            onChange={e => setEditingPlan({
                                              ...editingPlan,
                                              detailedCurriculum: {
                                                ...editingPlan.detailedCurriculum,
                                                outcomes: e.target.value.split("\n"),
                                                duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                focus: editingPlan.detailedCurriculum?.focus || "",
                                                bestFor: editingPlan.detailedCurriculum?.bestFor || "",
                                                mainFeatures: editingPlan.detailedCurriculum?.mainFeatures || []
                                              }
                                            })}
                                            placeholder="Introduce themselves confidently.&#10;Speak simple daily-use sentences.&#10;Answer basic questions."
                                            rows={4}
                                            className="w-full rounded-xl border p-3 font-semibold text-xs bg-white dark:bg-slate-950 text-slate-100 border-slate-200 dark:border-white/10"
                                          />
                                        </div>

                                        {/* Dynamic Core Curriculum Modules (mainFeatures) Builder */}
                                        <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-white/5 col-span-1 md:col-span-2">
                                          <div className="flex justify-between items-center">
                                            <Label className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">Core Curriculum Syllabus Modules ({editingPlan.detailedCurriculum?.mainFeatures?.length || 0})</Label>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                const currentFeatures = editingPlan.detailedCurriculum?.mainFeatures || [];
                                                setEditingPlan({
                                                  ...editingPlan,
                                                  detailedCurriculum: {
                                                    ...editingPlan.detailedCurriculum,
                                                    duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                    method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                    focus: editingPlan.detailedCurriculum?.focus || "",
                                                    bestFor: editingPlan.detailedCurriculum?.bestFor || "",
                                                    outcomes: editingPlan.detailedCurriculum?.outcomes || [],
                                                    mainFeatures: [
                                                      ...currentFeatures,
                                                      { title: "New Module Title", text: "New module description/syllabus details." }
                                                    ]
                                                  }
                                                });
                                              }}
                                              className="h-7 text-[10px] uppercase font-bold tracking-wider rounded-lg border-purple-200 dark:border-purple-400/20 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> Add Module
                                            </Button>
                                          </div>

                                          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {(editingPlan.detailedCurriculum?.mainFeatures || []).map((feat, fIdx) => (
                                              <div key={fIdx} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl space-y-2">
                                                <div className="flex justify-between items-center gap-2">
                                                  <Input
                                                    required
                                                    value={feat.title}
                                                    onChange={e => {
                                                      const currentFeatures = [...(editingPlan.detailedCurriculum?.mainFeatures || [])];
                                                      currentFeatures[fIdx] = { ...currentFeatures[fIdx], title: e.target.value };
                                                      setEditingPlan({
                                                        ...editingPlan,
                                                        detailedCurriculum: {
                                                          ...editingPlan.detailedCurriculum,
                                                          mainFeatures: currentFeatures,
                                                          duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                          method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                          focus: editingPlan.detailedCurriculum?.focus || "",
                                                          bestFor: editingPlan.detailedCurriculum?.bestFor || "",
                                                          outcomes: editingPlan.detailedCurriculum?.outcomes || []
                                                        }
                                                      });
                                                    }}
                                                    placeholder="E.g., Confidence Building"
                                                    className="h-8 font-black text-xs text-slate-900 bg-white dark:bg-slate-950 rounded-lg flex-1"
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      const currentFeatures = (editingPlan.detailedCurriculum?.mainFeatures || []).filter((_, idx) => idx !== fIdx);
                                                      setEditingPlan({
                                                        ...editingPlan,
                                                        detailedCurriculum: {
                                                          ...editingPlan.detailedCurriculum,
                                                          mainFeatures: currentFeatures,
                                                          duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                          method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                          focus: editingPlan.detailedCurriculum?.focus || "",
                                                          bestFor: editingPlan.detailedCurriculum?.bestFor || "",
                                                          outcomes: editingPlan.detailedCurriculum?.outcomes || []
                                                        }
                                                      });
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-lg border-red-105 hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </Button>
                                                </div>
                                                <textarea
                                                  value={feat.text}
                                                  onChange={e => {
                                                    const currentFeatures = [...(editingPlan.detailedCurriculum?.mainFeatures || [])];
                                                    currentFeatures[fIdx] = { ...currentFeatures[fIdx], text: e.target.value };
                                                    setEditingPlan({
                                                      ...editingPlan,
                                                      detailedCurriculum: {
                                                        ...editingPlan.detailedCurriculum,
                                                        mainFeatures: currentFeatures,
                                                        duration: editingPlan.detailedCurriculum?.duration || editingPlan.period,
                                                        method: editingPlan.detailedCurriculum?.method || "EBM — Ejaz Bukhari Method",
                                                        focus: editingPlan.detailedCurriculum?.focus || "",
                                                        bestFor: editingPlan.detailedCurriculum?.bestFor || "",
                                                        outcomes: editingPlan.detailedCurriculum?.outcomes || []
                                                      }
                                                    });
                                                  }}
                                                  placeholder="Enter module details or learning outcomes..."
                                                  rows={2}
                                                  className="w-full rounded-lg border p-2 font-semibold text-xs bg-white dark:bg-slate-955 text-slate-900 dark:text-white border-slate-200 dark:border-white/10"
                                                />
                                              </div>
                                            ))}
                                            {(!editingPlan.detailedCurriculum?.mainFeatures || editingPlan.detailedCurriculum.mainFeatures.length === 0) && (
                                              <div className="text-center py-4 text-[11px] text-slate-400 font-medium italic">
                                                No curriculum syllabus modules defined yet. Tap &quot;Add Module&quot; above!
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                      </div>

                                      <div className="flex gap-3 pt-3">
                                        <Button
                                          type="submit"
                                          className="flex-1 rounded-xl h-11 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-xs"
                                        >
                                          <Save className="w-4 h-4 mr-2" /> Save Pricing Plan
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => setEditingPlan(null)}
                                          className="rounded-xl h-11 border-slate-200 px-6 font-black uppercase tracking-wider text-xs bg-white dark:bg-slate-900"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </form>
                                  )}

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Custom Pages & HTML/CSS Builder Section */}
                        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setActiveGeneralSection(activeGeneralSection === "custom-pages" ? null : "custom-pages")}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-white">Custom Pages & HTML/CSS Builder</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                                  Create and manage custom landing pages, policy documents, and rich text or HTML/CSS layouts.
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 font-bold shrink-0">
                              {activeGeneralSection === "custom-pages" ? (
                                <ChevronUp className="w-5 h-5 text-teal-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {activeGeneralSection === "custom-pages" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <div className="border-t border-slate-100 dark:border-white/5 p-6 bg-slate-50/20 dark:bg-slate-900/10 text-left">
                                  <AdminCustomPagesManager />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Previews Panel Card */}
                    {activeGeneralSection === "logo-favicon" && (
                      <div className="space-y-6">
                        <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 bg-white dark:bg-slate-900 sticky top-24">
                          <CardHeader>
                            <CardTitle className="text-lg font-black italic tracking-tighter flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-indigo-505 text-indigo-500" />
                              Live Brand Preview
                            </CardTitle>
                            <CardDescription>
                              Real-time rendering diagnostics of assets on both dark and light modes.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Favicon Previews */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">Favicon Rendering</Label>
                              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-white shadow-md flex items-center justify-center p-2 border">
                                  <img 
                                    src={generalFaviconUrl || undefined} 
                                    alt={generalFaviconAlt} 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/vite.svg";
                                    }}
                                  />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-black truncate max-w-[150px]">{generalFaviconAlt}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">16x16 / Vector</p>
                                </div>
                              </div>
                            </div>

                            {/* Light Preview */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">Logo on Light Canvas</Label>
                              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center min-h-[100px] overflow-hidden">
                                <img 
                                  src={generalLogoUrl || undefined} 
                                  alt={generalLogoAlt} 
                                  className="max-h-12 w-auto object-contain mix-blend-multiply"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>

                            {/* Dark Preview */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">Logo on Dark Canvas</Label>
                              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[100px] overflow-hidden">
                                <img 
                                  src={generalLogoUrl || undefined} 
                                  alt={generalLogoAlt} 
                                  className="max-h-12 w-auto object-contain brightness-200 invert dark:brightness-200 dark:invert"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>

                            {/* Hero Image Live Preview */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">Hero Section Image Preview</Label>
                              <div className="relative rounded-2xl overflow-hidden aspect-video border bg-slate-950">
                                <img 
                                  src={generalHeroImageUrl || undefined}
                                  alt={generalHeroImageAlt}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/ielts_prep_banner_1781330535098.jpg";
                                  }}
                                />
                              </div>
                            </div>

                            {/* Syed Ejaz Bukhari Audio Live Preview */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest italic text-slate-400">Ejaz Bukhari Audio Preview</Label>
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-left space-y-2">
                                {generalAudioUrl ? (
                                  <div className="space-y-2">
                                    <audio src={generalAudioUrl || undefined} controls className="w-full h-8" />
                                    <p className="text-[10px] text-slate-500 italic max-h-16 overflow-y-auto">
                                      Transcript: "{generalAudioTranscript}"
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <p className="text-xs text-slate-400 font-medium">No custom audio uploaded yet</p>
                                    <p className="text-[9px] text-slate-400">Will fall back to default advisor text sound effects</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="meetings" className="mt-0">
                  <AdminLiveMeetings />
                </TabsContent>

                <TabsContent value="classrooms" className="mt-0">
                  <AdminClassroomManager />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>

        {/* Detailed Selected Student Profile & Advisor Notes in a Dialog */}
        <AnimatePresence>
          {isStudentDetailOpen && selectedStudent && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl w-full max-w-5xl overflow-hidden my-8"
              >
                {/* Dialog Header */}
                <div className="bg-primary text-white p-6 relative">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl text-white">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/90 italic">
                          Student File & Performance
                        </span>
                        <h3 className="text-xl font-black mt-1 truncate">{selectedStudent.name}</h3>
                        <p className="text-[10px] text-white/80 font-medium font-mono tracking-tight mt-0.5 truncate">{selectedStudent.email}</p>
                      </div>
                    </div>

                    {getInterventionStatus(selectedStudent).flagged && (
                      <div className="flex-1 max-w-sm ml-auto mr-4 hidden md:block">
                        <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-2xl p-3 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-rose-200 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-rose-100 italic">Intervention Required</p>
                            <p className="text-[10px] font-medium text-rose-50/80 leading-snug mt-0.5">
                              {getInterventionStatus(selectedStudent).reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center shrink-0"
                      onClick={() => setIsStudentDetailOpen(false)}
                    >
                      <Plus className="w-6 h-6 rotate-45" />
                    </Button>
                  </div>
                </div>

                {/* Dialog Body - Two Column Layout */}
                <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
                  
                  {/* Left Column: Stats and notes */}
                  <div className="space-y-6">
                    {/* Component bands breakdown */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Component Bands Breakdown</h5>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Speaking", score: selectedStudent.speaking || 6.0, icon: <Mic className="w-3.5 h-3.5" /> },
                          { label: "Writing", score: selectedStudent.writing || 6.0, icon: <FileText className="w-3.5 h-3.5" /> },
                          { label: "Reading", score: selectedStudent.reading || 6.0, icon: <BookOpen className="w-3.5 h-3.5" /> },
                          { label: "Listening", score: selectedStudent.listening || 6.0, icon: <Volume2 className="w-3.5 h-3.5" /> },
                        ].map((item, id) => (
                          <div
                            key={id}
                            className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center flex flex-col justify-between items-center"
                          >
                            <div className="text-slate-400 mb-1">{item.icon}</div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate max-w-full">{item.label}</span>
                            <span className="text-base font-black text-slate-800 dark:text-slate-100 mt-1 block">
                              {Number(item.score || 6.0).toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Master Target track */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5 space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Master Target Track</h5>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-slate-400">Current Average</span>
                          <p className="text-3xl font-black text-slate-800 dark:text-slate-100">B{Number(selectedStudent.currentBand || 6.0).toFixed(1)}</p>
                        </div>
                        
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400 italic">Target Progress</span>
                          <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden relative">
                            <div
                                className="absolute left-0 top-0 h-full bg-primary"
                                style={{ width: `${Math.min(100, Math.max(0, (Number(selectedStudent.currentBand || 6) / Number(selectedStudent.targetBand || 7)) * 100))}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-primary uppercase italic mt-1 font-mono">
                            {((Number(selectedStudent.currentBand || 6) / Number(selectedStudent.targetBand || 7)) * 100).toFixed(0)}% Close
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400">Target Score</span>
                          <p className="text-3xl font-black text-primary">B{Number(selectedStudent.targetBand || 7.0).toFixed(1)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Course registry metadata */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50/50 dark:bg-white/2 rounded-2xl">
                        <span className="font-bold text-slate-400 block pb-0.5">Origin / Country</span>
                        <span className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {selectedStudent.country || "Intl"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50/50 dark:bg-white/2 rounded-2xl">
                        <span className="font-bold text-slate-400 block pb-0.5">Focus Curriculum</span>
                        <span className="font-black text-slate-700 dark:text-slate-200">{selectedStudent.examType} Syllabus</span>
                      </div>
                      <div className="p-3 bg-slate-50/50 dark:bg-white/2 rounded-2xl">
                        <span className="font-bold text-slate-400 block pb-0.5">Registered Level</span>
                        <span className="font-black text-slate-700 dark:text-slate-200">{selectedStudent.enrolledPlan}</span>
                      </div>
                      <div className="p-3 bg-slate-50/50 dark:bg-white/2 rounded-2xl">
                        <span className="font-bold text-slate-400 block pb-0.5">Enrollment Date</span>
                        <span className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {selectedStudent.enrollmentDate || "2026-05-15"}
                        </span>
                      </div>
                    </div>

                      {/* Advisor writing notepad */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Academic Advisory Notes</h5>
                          {selectedStudent.notesSeverity && (
                            <Badge 
                              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-none italic ${
                                selectedStudent.notesSeverity === 'high' 
                                  ? 'bg-rose-500 text-white animate-pulse' 
                                  : selectedStudent.notesSeverity === 'medium' 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-emerald-500 text-white'
                              }`}
                            >
                              {selectedStudent.notesSeverity} priority note
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <select 
                            value={selectedStudent.notesSeverity || "low"}
                            onChange={(e) => {
                              const sev = e.target.value;
                              const updated = students.map(s => s.id === selectedStudent.id ? { ...s, notesSeverity: sev } : s);
                              setStudents(updated);
                              localStorage.setItem("mock_students", JSON.stringify(updated));
                              setSelectedStudent({ ...selectedStudent, notesSeverity: sev });
                            }}
                            className="text-[9px] font-black uppercase bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-1 h-5 outline-none text-slate-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[8px] font-black uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded-md"
                            onClick={() => {
                              toast.success(`Advisory notes for ${selectedStudent.name} saved successfully.`);
                            }}
                          >
                            Save Note
                          </Button>
                        </div>
                      </div>
                      
                      <textarea
                        value={selectedStudent.notes || ""}
                        onChange={(e) => {
                          const updatedNotes = e.target.value;
                          const updated = students.map(s => s.id === selectedStudent.id ? { ...s, notes: updatedNotes } : s);
                          setStudents(updated);
                          localStorage.setItem("mock_students", JSON.stringify(updated));
                          setSelectedStudent({ ...selectedStudent, notes: updatedNotes });
                        }}
                        placeholder="Write diagnostic advice, specific skill deficiencies, or customized study strategies for this student here..."
                        className="w-full h-32 p-3 bg-brand-50/20 dark:bg-white/2 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-slate-300 transition-all rounded-2xl text-xs leading-relaxed resize-none text-slate-700 dark:text-slate-200 focus:outline-none placeholder:text-slate-400 placeholder:italic font-normal"
                      />
                      <p className="text-[9px] text-slate-400 italic leading-snug">
                        * Advisory notes are auto-saved in real time. These notes help tailor evaluation mock prompts.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Historical test achievements */}
                  <div className="space-y-4">
                    {(() => {
                      const studentFilteredSubmissions = submissions.filter((sub: any) => {
                        return (
                          (sub.studentId && selectedStudent.id && String(sub.studentId) === String(selectedStudent.id)) ||
                          (sub.studentName && selectedStudent.name && sub.studentName.trim().toLowerCase() === selectedStudent.name.trim().toLowerCase())
                        );
                      });

                      return (
                        <div className="space-y-4 h-full flex flex-col">
                          <div className="flex justify-between items-center shrink-0">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                              Complete Exam & Test History ({studentFilteredSubmissions.length})
                            </h5>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/15 uppercase font-bold text-[8px] py-0.5 border-none rounded">
                              Archives Desk
                            </Badge>
                          </div>

                          {studentFilteredSubmissions.length === 0 ? (
                            <div className="flex-1 p-8 bg-slate-50 dark:bg-white/2 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/5 text-center flex flex-col justify-center items-center text-slate-400 py-12">
                              <FileText className="w-8 h-8 mb-2 text-slate-300" />
                              <span className="text-xs italic font-medium">No test submissions registered for this candidate yet.</span>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
                              {studentFilteredSubmissions.map((sub: any, sIdx: number) => {
                                let details: any = null;
                                const isWriting = (sub.lessonType || "").toUpperCase() === "WRITING";
                                if (!isWriting) {
                                  try {
                                    details = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
                                  } catch (e) {
                                    console.warn("Parse exception reading quiz details:", e);
                                  }
                                }

                                return (
                                  <div
                                    key={sub.id || `hist-${sIdx}`}
                                    className={`p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/2 dark:hover:bg-white/5 border rounded-2xl transition-all flex items-center justify-between gap-3 shadow-sm hover:translate-x-1 duration-150 cursor-pointer ${
                                      selectedStudent.flaggedTests?.includes(sub.id) 
                                        ? "border-rose-400 dark:border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/10" 
                                        : "border-slate-150 dark:border-white/5"
                                    }`}
                                    onClick={() => {
                                      setViewingHistorySub(sub);
                                    }}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate leading-snug">{sub.lessonTitle}</p>
                                        {selectedStudent.flaggedTests?.includes(sub.id) && (
                                          <Flag className="w-3 h-3 text-rose-500 fill-rose-500" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <Badge className={`px-2 py-0.5 text-[8px] font-black rounded border-none uppercase ${
                                          isWriting
                                            ? "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                                            : (sub.lessonType || "").toUpperCase() === "LISTENING"
                                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                              : (sub.lessonType || "").toUpperCase() === "MOCK_TEST"
                                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        }`}>
                                          {sub.lessonType || "READING"}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                                          <Calendar className="w-3 h-3 shrink-0" /> {new Date(sub.submittedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0 flex items-center gap-3">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className={`h-8 w-8 rounded-full ${selectedStudent.flaggedTests?.includes(sub.id) ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-100' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-100'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const isFlagged = selectedStudent.flaggedTests?.includes(sub.id);
                                          const currentFlags = selectedStudent.flaggedTests || [];
                                          const newFlags = isFlagged 
                                            ? currentFlags.filter((id: string) => id !== sub.id)
                                            : [...currentFlags, sub.id];
                                          
                                          const updated = students.map(s => s.id === selectedStudent.id ? { ...s, flaggedTests: newFlags } : s);
                                          setStudents(updated);
                                          localStorage.setItem("mock_students", JSON.stringify(updated));
                                          setSelectedStudent({ ...selectedStudent, flaggedTests: newFlags });
                                          
                                          toast.success(isFlagged ? "Test unflagged" : "Test flagged for review");
                                        }}
                                      >
                                        <Flag className={`w-3.5 h-3.5 ${selectedStudent.flaggedTests?.includes(sub.id) ? 'fill-rose-500' : ''}`} />
                                      </Button>
                                      
                                      {isWriting ? (
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 px-2.5 py-1 rounded-xl">
                                          {sub.wordCount || (sub.content ? sub.content.split(" ").filter((w: string) => w.length > 0).length : 0)} words
                                        </span>
                                      ) : (
                                        <div className="flex flex-col items-end leading-none">
                                          <span className="text-sm font-black text-primary leading-none">
                                            {details?.score?.correct ?? "?"} <span className="text-slate-300 font-normal">/</span> {details?.score?.total ?? "?"}
                                          </span>
                                          <span className="text-[9px] font-black text-slate-400 mt-1 leading-none font-mono">
                                            {details?.score?.percent ?? 0}% Acc
                                          </span>
                                        </div>
                                      )}
                                      <div className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-primary hover:text-white dark:bg-white/5 transition-all flex items-center justify-center shrink-0">
                                        <ChevronRight className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Dialog Footer Actions */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 justify-between items-center">
                  <Button
                    onClick={() => {
                      handleDeleteStudent(selectedStudent.id);
                      setIsStudentDetailOpen(false);
                    }}
                    variant="outline"
                    className="rounded-xl h-11 font-bold text-xs border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/10 dark:hover:bg-red-500/10 gap-1.5"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" /> Delete Student Profile
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        toast.info(`Generating performance report for ${selectedStudent.name}...`);
                        setTimeout(() => {
                          toast.success(`PDF Performance Report exported successfully.`);
                        }, 1500);
                      }}
                      variant="outline"
                      className="rounded-xl h-11 px-4 font-bold text-xs border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 gap-2"
                    >
                      <FileDown className="w-4 h-4" /> Export Report
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentStudent({...selectedStudent});
                        setIsEditingStudent(true);
                      }}
                      className="rounded-xl h-11 px-6 font-bold text-xs bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      Edit Registry Info
                    </Button>
                    <Button
                      onClick={() => setIsStudentDetailOpen(false)}
                      className="rounded-xl h-11 px-6 font-bold text-xs bg-primary text-white"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Dialog for Inspect Transcript */}
        <AnimatePresence>
          {viewingHistorySub && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl w-full max-w-2xl overflow-hidden my-8"
              >
                {/* Header */}
                <div className="bg-primary text-white p-6 justify-between flex items-center">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full italic">
                      Submission Transcript
                    </span>
                    <h3 className="text-xl font-black mt-1">
                      {viewingHistorySub.lessonTitle}
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-white/10 text-white"
                    onClick={() => setViewingHistorySub(null)}
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </Button>
                </div>

                {/* Body */}
                <div className="p-6 lg:p-8 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
                  {/* Meta info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-white/2 rounded-2xl">
                      <span className="text-slate-400 font-bold block">Candidate:</span>
                      <span className="font-black text-slate-800 dark:text-slate-100 truncate block">
                        {viewingHistorySub.studentName}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-white/2 rounded-2xl">
                      <span className="text-slate-400 font-bold block">Curriculum:</span>
                      <span className="font-black text-slate-800 dark:text-slate-100 truncate block">
                        {viewingHistorySub.courseTitle}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-white/2 rounded-2xl">
                      <span className="text-slate-400 font-bold block">Category:</span>
                      <span className="font-black text-slate-800 dark:text-slate-100 truncate block">
                        {viewingHistorySub.lessonType || "READING"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-white/2 rounded-2xl">
                      <span className="text-slate-400 font-bold block">Submitted:</span>
                      <span className="font-black text-slate-800 dark:text-slate-100 truncate block">
                        {new Date(viewingHistorySub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Main practice details */}
                  {(viewingHistorySub.lessonType || "").toUpperCase() === "WRITING" ? (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Essay Content ({viewingHistorySub.wordCount || 0} words)</h5>
                      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-white/5 leading-relaxed font-sans text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[30vh] overflow-y-auto">
                        {viewingHistorySub.content || "[Empty Response]"}
                      </div>
                    </div>
                  ) : (
                    (() => {
                      let details: any = null;
                      try {
                        details = typeof viewingHistorySub.content === 'string' ? JSON.parse(viewingHistorySub.content) : viewingHistorySub.content;
                      } catch (e) {
                        console.warn(e);
                      }

                      return (
                        <div className="space-y-4">
                          {/* High level progress metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Correct Answers</span>
                              <span className="text-2xl font-black text-primary mt-1 block">
                                {details?.score?.correct ?? "?"} / {details?.score?.total ?? "?"}
                              </span>
                            </div>
                            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Accuracy Percent</span>
                              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                                {details?.score?.percent ?? "0"}%
                              </span>
                            </div>
                          </div>

                          {/* Question by question transcript */}
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Core Evaluation Record</h5>
                            <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                              {details?.answers && details.answers.length > 0 ? (
                                details.answers.map((ans: any, idx: number) => {
                                  const isCorrect = ans.isCorrect;
                                  return (
                                    <div 
                                      key={idx}
                                      className="p-3 bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 rounded-2xl flex items-start gap-3"
                                    >
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black leading-none ${
                                        isCorrect 
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                      }`}>
                                        {idx + 1}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <Badge className="px-1 py-0 h-4 text-[7px] font-black uppercase bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-350 rounded border-none">
                                          {ans.type || ans.questionType || "MCQ"}
                                        </Badge>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1.5 leading-snug">
                                          {ans.questionText || ans.question || `Question ${idx + 1}`}
                                        </p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-150/40 dark:border-white/5 text-[11px] font-bold">
                                          <div>
                                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Candidate Response:</span>
                                            <span className={`font-black uppercase ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                              {ans.studentAnswer || "[No Response]"}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Target Correct Answer:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-black uppercase">
                                              {ans.correctAnswer || "[Unspecified]"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center italic text-xs text-slate-450 py-6">
                                  No itemized answer breakdown available for this test record.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-slate-150 dark:border-white/5 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setViewingHistorySub(null)}
                    className="rounded-xl h-10 px-6 font-bold text-xs bg-primary text-white"
                  >
                    Close File
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
