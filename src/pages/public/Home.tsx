import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import HeroSection from "@/src/components/HeroSection";
import LiveLessonsSection from "@/src/components/LiveLessonsSection";
import MockTestCollectionSection from "@/src/components/MockTestCollectionSection";
import OfficialPracticeMaterialsSection from "@/src/components/OfficialPracticeMaterialsSection";
import StudentTrustBannerSection from "@/src/components/StudentTrustBannerSection";
import SixStepsSection from "@/src/components/SixStepsSection";
import TakeFreeTestSection from "@/src/components/TakeFreeTestSection";
import FaqSection from "@/src/components/FaqSection";
import WorldwideReviewsGlobeSection from "@/src/components/WorldwideReviewsGlobeSection";
import SeoOverviewContentSection from "@/src/components/SeoOverviewContentSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeSetItem } from "@/src/lib/safeStorage";
import { 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Globe, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  PlayCircle, 
  BarChart3, 
  Zap, 
  Brain, 
  MessageSquare, 
  BookOpen, 
  PenTool, 
  X, 
  GraduationCap, 
  Flame, 
  Trophy, 
  TrendingUp, 
  Target, 
  Mic, 
  Headset, 
  Award, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Laptop,
  Check,
  ChevronRight,
  ChevronDown,
  Sparkle,
  Linkedin,
  Volume2,
  Pause,
  HelpCircle,
  Quote,
  Search,
  FileText,
  Clock,
  Send,
  Play,
  Sliders,
  Filter,
  Building2,
  CheckCircle,
  ExternalLink,
  Sparkles as SparklesIcon
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Live Lessons Category Filter State
  const [liveLessonCategory, setLiveLessonCategory] = useState("All");

  // Mock Test Collection Filter State
  const [testCollectionYear, setTestCollectionYear] = useState("2026");

  // Exam Simulation Interface Feature Tab
  const [activeExamFeature, setActiveExamFeature] = useState<number>(0);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    userType: "Student",
    fullName: "",
    email: "",
    phone: "",
    targetScore: "7.5",
    destination: "United Kingdom",
    message: ""
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Dynamic IELTS Score Calculator States
  const [listeningScore, setListeningScore] = useState(6.5);
  const [readingScore, setReadingScore] = useState(6.0);
  const [writingScore, setWritingScore] = useState(5.5);
  const [speakingScore, setSpeakingScore] = useState(6.0);

  // Calculated Overall Score
  const calculatedOverallBand = useMemo(() => {
    const avg = (listeningScore + readingScore + writingScore + speakingScore) / 4;
    const decimal = avg % 1;
    if (decimal < 0.25) return Math.floor(avg);
    if (decimal < 0.75) return Math.floor(avg) + 0.5;
    return Math.ceil(avg);
  }, [listeningScore, readingScore, writingScore, speakingScore]);

  // Hero Carousel Slides Configuration
  const heroSlides = [
    {
      id: 1,
      badge: "#1 GLOBAL IELTS ONLINE PLATFORM",
      title: "Achieve Your Dream Band Score With Just One Click!",
      subtitle: "Join over 34 Thousand + candidates practicing with real exam materials validated to British Council and IDP official standards.",
      ctaPrimary: "Start Free Mock Test",
      ctaSecondary: "Explore Live Lessons",
      ctaPrimaryLink: "/mock-tests",
      ctaSecondaryLink: "/courses",
      bgGradient: "from-blue-900/90 via-slate-900 to-indigo-950",
      accentColor: "emerald"
    },
    {
      id: 2,
      badge: "OFFICIAL RECOGNITION",
      title: "Proud Platinum Partner of British Council and IDP",
      subtitle: "The credibility and academic quality of IELTS Online Tests are globally recognized by hundreds of universities and testing centers.",
      ctaPrimary: "Verify Partner Credentials",
      ctaSecondary: "View Success Stories",
      ctaPrimaryLink: "/about",
      ctaSecondaryLink: "#testimonials",
      bgGradient: "from-indigo-950 via-slate-900 to-slate-950",
      accentColor: "amber"
    },
    {
      id: 3,
      badge: "INTENSIVE COURSES & 1v1 COACHING",
      title: "BREAKTHROUGH Your Band Score With Specialized IELTS Courses",
      subtitle: "Structured online video lessons and 1-on-1 private tutoring taught by British Council certified instructors with 8.5+ scores.",
      ctaPrimary: "Enroll in MasterClass",
      ctaSecondary: "Book Free Consultation",
      ctaPrimaryLink: "/courses",
      ctaSecondaryLink: "#contact-section",
      bgGradient: "from-slate-900 via-blue-950 to-teal-950",
      accentColor: "teal"
    },
    {
      id: 4,
      badge: "STUDY ABROAD ADVISORY",
      title: "Where Would You Like To Study Abroad?",
      subtitle: "Comprehensive university admission guidance for top destinations: UK, Australia, Canada, USA, and European institutions.",
      ctaPrimary: "Get Free 1-on-1 Consultation",
      ctaSecondary: "Explore Universities",
      ctaPrimaryLink: "#contact-section",
      ctaSecondaryLink: "/pricing",
      bgGradient: "from-slate-950 via-slate-900 to-blue-950",
      accentColor: "sky"
    }
  ];

  // Auto-advance hero slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Daily Live Lessons Data
  const liveLessons = [
    {
      id: "ll-1",
      title: "Academic Writing Task 2 - Agree & Disagree Essays: The Environment",
      category: "Writing",
      instructor: "Mary T.",
      credentials: "Former IELTS Senior Examiner",
      date: "Today, 18:00 UTC",
      attendees: 1420,
      badge: "FREE WEBINAR",
      isLiveSoon: true,
      avatarBg: "bg-amber-500"
    },
    {
      id: "ll-2",
      title: "IELTS Speaking Part 2 - Planning & Presenting Cue Cards with Band 8.0 Vocabulary",
      category: "Speaking",
      instructor: "Soheila A.",
      credentials: "Senior IELTS Master Trainer",
      date: "Tomorrow, 14:00 UTC",
      attendees: 2150,
      badge: "FREE WEBINAR",
      isLiveSoon: false,
      avatarBg: "bg-emerald-500"
    },
    {
      id: "ll-3",
      title: "General Training Writing - High Scoring Formal & Informal Letters of Complaint",
      category: "Writing",
      instructor: "Gillian S.",
      credentials: "GT IELTS Curriculum Lead",
      date: "Nov 18, 16:30 UTC",
      attendees: 980,
      badge: "FREE WEBINAR",
      isLiveSoon: false,
      avatarBg: "bg-indigo-500"
    },
    {
      id: "ll-4",
      title: "IELTS Reading - Rapid Skimming, Keyword Scanning & True/False/Not Given Logic",
      category: "Reading",
      instructor: "Syed Ejaz Bukhari",
      credentials: "Principal Master Coach",
      date: "Nov 19, 15:00 UTC",
      attendees: 3200,
      badge: "FEATURED WEBINAR",
      isLiveSoon: false,
      avatarBg: "bg-teal-600"
    },
    {
      id: "ll-5",
      title: "IELTS Listening Section 3 & 4 - Dealing with Multiple Choice & Distractors",
      category: "Listening",
      instructor: "Dr. Amanda Ross",
      credentials: "Acoustics & Phonetics Lead",
      date: "Nov 20, 17:00 UTC",
      attendees: 1100,
      badge: "FREE WEBINAR",
      isLiveSoon: false,
      avatarBg: "bg-purple-600"
    },
    {
      id: "ll-6",
      title: "Study Abroad Masterclass - Navigating UK & Canada Student Visa Requirements",
      category: "Study Abroad",
      instructor: "David Miller",
      credentials: "International Admissions Director",
      date: "Nov 21, 13:00 UTC",
      attendees: 2800,
      badge: "ADMISSION SPECIAL",
      isLiveSoon: false,
      avatarBg: "bg-blue-600"
    }
  ];

  const filteredLiveLessons = useMemo(() => {
    if (liveLessonCategory === "All") return liveLessons;
    return liveLessons.filter(lesson => lesson.category === liveLessonCategory);
  }, [liveLessonCategory]);

  // Practice Test Collections Data
  const mockTestCollections = [
    {
      id: "tc-2026-jan",
      year: "2026",
      title: "IELTS Mock Test 2026 January Collection",
      testsCount: 4,
      rating: 4.8,
      votes: 1326,
      type: "Academic & General",
      description: "Brand new practice paper set reflecting 2026 actual exam question trends across all 4 modules.",
      badge: "LATEST RELEASE"
    },
    {
      id: "tc-2025-dec",
      year: "2025",
      title: "IELTS Mock Test 2025 December Collection",
      testsCount: 4,
      rating: 4.7,
      votes: 2428,
      type: "Academic & General",
      description: "Authentic exam questions with audio recordings, answers, and line-by-line reading explanations.",
      badge: "MOST POPULAR"
    },
    {
      id: "tc-2025-nov",
      year: "2025",
      title: "IELTS Mock Test 2025 November Collection",
      testsCount: 4,
      rating: 4.9,
      votes: 3210,
      type: "Academic",
      description: "High-level reading passages and listening tapes with instant band score report.",
      badge: "VERIFIED HIGH ACCURACY"
    },
    {
      id: "tc-2025-oct",
      year: "2025",
      title: "IELTS Mock Test 2025 October Collection",
      testsCount: 4,
      rating: 4.6,
      votes: 1890,
      type: "General Training",
      description: "Tailored GT writing letters and workplace reading section practice items.",
      badge: "RECOMMENDED FOR GT"
    }
  ];

  const filteredTestCollections = useMemo(() => {
    return mockTestCollections.filter(c => c.year === testCollectionYear || testCollectionYear === "All");
  }, [testCollectionYear]);

  // Exam Simulation Interface Features Showcase
  const examInterfaceFeatures = [
    {
      id: "feature-split-screen",
      title: "Authentic Split-Screen Interface",
      shortLabel: "Real Exam Interface",
      description: "Experience the identical computer-delivered IELTS layout used at test centers. Features side-by-side reading text, highlight tool, text sizing, and live countdown timer.",
      icon: <Laptop className="w-5 h-5 text-emerald-500" />,
      previewTitle: "Computer-Delivered IELTS Reading & Listening",
      highlights: [
        "Identical split-screen text & question layout",
        "Built-in text highlighter & note-taking tool",
        "Official countdown timer with auto-submit",
        "Adjustable font size & contrast themes"
      ]
    },
    {
      id: "feature-instant-results",
      title: "Instant Band Score & Analytical Breakdown",
      shortLabel: "Instant Results",
      description: "Receive your overall band score immediately upon test submission, along with section-by-section breakdown of correct, incorrect, and unattempted questions.",
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      previewTitle: "Immediate Score Report & Diagnostic Metrics",
      highlights: [
        "Calculated IELTS Band Score (0 - 9.0)",
        "Raw score accuracy percentage breakdown",
        "Time spent per question analysis",
        "Global percentile ranking & leaderboard"
      ]
    },
    {
      id: "feature-locate-explain",
      title: "Locate & Explain Answer Key Tool",
      shortLabel: "Detailed Explanations",
      description: "Stop guessing why an answer is wrong. Our exclusive tool highlights the exact passage line where the answer lies and provides thorough step-by-step logic.",
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-500" />,
      previewTitle: "Line-by-Line Reading & Listening Audio Transcripts",
      highlights: [
        "Direct passage sentence highlighting",
        "Exact audio timestamp markers for Listening",
        "Vocabulary synonym match callouts",
        "Common distractor trap explanations"
      ]
    },
    {
      id: "feature-ai-examiner",
      title: "AI Examiner for Writing & Speaking",
      shortLabel: "AI Score Evaluation",
      description: "Submit your Task 1, Task 2 essays or speaking audio recordings to get scored by our AI engine trained on thousands of official British Council band rubrics.",
      icon: <Brain className="w-5 h-5 text-purple-500" />,
      previewTitle: "4-Criteria Official IELTS Assessment Feedback",
      highlights: [
        "Task Achievement / Coherence & Cohesion Analysis",
        "Lexical Resource & Vocabulary Range scoring",
        "Grammatical Range & Accuracy error detection",
        "Pronunciation & Fluency speech waveform report"
      ]
    },
    {
      id: "feature-progress-tracker",
      title: "Track Your Study Progress Over Time",
      shortLabel: "Performance Dashboard",
      description: "Monitor your improvement with intuitive visual progress graphs. Identify weak module areas and target specific question types for revision.",
      icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
      previewTitle: "Historical Band Trajectory & Skill Radar Charts",
      highlights: [
        "Historical test attempt band score trends",
        "Question type accuracy heatmaps",
        "Custom weak spot revision recommendations",
        "Exportable PDF performance certificates"
      ]
    }
  ];

  // 6 Steps Roadmap Data
  const sixSteps = [
    {
      stepNum: "01",
      title: "Placement Assessment",
      subtitle: "Pinpoint Your Starting Level",
      desc: "Take our diagnostic assessment to accurately gauge your current band score (Band 5.0 - 8.5) and identify key skill gaps.",
      icon: <Target className="w-6 h-6 text-emerald-500" />,
      color: "emerald"
    },
    {
      stepNum: "02",
      title: "Daily Live Webinars",
      subtitle: "Learn From Industry Masters",
      desc: "Attend daily live webinars hosted by former IELTS examiners to master question strategies and vocabulary frameworks.",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      color: "blue"
    },
    {
      stepNum: "03",
      title: "Specialized Intensive Courses",
      subtitle: "Targeted Skill Mastery",
      desc: "Enroll in structured video courses or 1-on-1 coaching for deep drills on Writing Task 2 and Speaking fluency.",
      icon: <GraduationCap className="w-6 h-6 text-indigo-500" />,
      color: "indigo"
    },
    {
      stepNum: "04",
      title: "Free Mock Exam Library",
      subtitle: "Authentic Test Practice",
      desc: "Practice with over 100+ authentic computer-delivered IELTS mock test papers with realistic difficulty and split-screen UI.",
      icon: <FileText className="w-6 h-6 text-teal-500" />,
      color: "teal"
    },
    {
      stepNum: "05",
      title: "Mock Test With AI",
      subtitle: "Instant Writing & Speaking Scoring",
      desc: "Get your essays and voice recordings evaluated by our AI Examiner for granular feedback on grammar and band descriptors.",
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      color: "purple"
    },
    {
      stepNum: "06",
      title: "Target Score Mastery",
      subtitle: "Achieve Your Dream Band & Study Abroad",
      desc: "Reach your target score with total confidence and unlock admission to top universities worldwide.",
      icon: <Trophy className="w-6 h-6 text-amber-500" />,
      color: "amber"
    }
  ];

  // Student Testimonials / Success Wall
  const studentReviews = [
    {
      id: "sr-1",
      name: "Amina Khan",
      location: "Lahore, Pakistan",
      overallBand: "8.5",
      scores: "Reading: 9.0 | Listening: 8.5 | Writing: 8.0 | Speaking: 8.0",
      target: "University of Toronto, Canada",
      review: "I practiced with IELTS Online Tests daily for 3 weeks! The split-screen test interface was identical to my actual computer-delivered IELTS test at the center. Got my dream 8.5!",
      verified: true
    },
    {
      id: "sr-2",
      name: "David Lee",
      location: "Kuala Lumpur, Malaysia",
      overallBand: "8.0",
      scores: "Reading: 8.5 | Listening: 8.0 | Writing: 8.0 | Speaking: 7.5",
      target: "Imperial College London, UK",
      review: "The AI Examiner feedback for Writing Task 2 was a game changer. It highlighted my repetitive vocabulary and sentence structure issues. Jumped from 6.5 to 8.0 in Writing!",
      verified: true
    },
    {
      id: "sr-3",
      name: "Rahul Sharma",
      location: "Delhi, India",
      overallBand: "7.5",
      scores: "Reading: 8.0 | Listening: 8.0 | Writing: 7.0 | Speaking: 7.5",
      target: "University of Melbourne, Australia",
      review: "The live webinars led by Mary T. and Syed Ejaz Bukhari taught me how to structure complex essays effortlessly. Highly recommend the free mock test library!",
      verified: true
    },
    {
      id: "sr-4",
      name: "Elena Rostova",
      location: "Almaty, Kazakhstan",
      overallBand: "8.0",
      scores: "Reading: 9.0 | Listening: 8.5 | Writing: 7.5 | Speaking: 7.5",
      target: "University of Sydney, Australia",
      review: "The Locate & Explain feature is incredible. You see exactly why an answer is True, False, or Not Given without wasting hours searching passages.",
      verified: true
    }
  ];

  // FAQs Data
  const faqs = [
    {
      q: "Are the IELTS practice tests on this platform completely free?",
      a: "Yes! All mock tests in our core Exam Library—including Reading, Listening, Writing, and Speaking—are 100% free to attempt with immediate scoring for Reading & Listening."
    },
    {
      q: "How accurate are the IELTS score reports generated by your AI Examiner?",
      a: "Our AI Examiner is trained on over 50,000 official IELTS exam scripts evaluated by certified British Council and IDP examiners. It evaluates according to the 4 official band descriptors (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range) with a high correlation rate of 95%+."
    },
    {
      q: "Is the online test interface similar to the official computer-delivered IELTS exam?",
      a: "Yes, our test environment is designed to closely match the official Computer-Delivered IELTS layout, including the split-screen reading view, question navigator, audio player controls, font sizing options, and test timer."
    },
    {
      q: "How do the Daily Live Webinars work?",
      a: "Our live webinars are free online masterclasses hosted daily by senior IELTS master trainers. You can register for free, interact with instructors live, ask questions in the Q&A box, and receive session handouts."
    },
    {
      q: "Can I get my Writing Task 1 and Task 2 essays evaluated with detailed feedback?",
      a: "Yes! You can submit your essays for instant AI evaluation or request personalized detailed evaluation by human senior IELTS examiners with line-by-line grammar corrections and band score improvement tips."
    },
    {
      q: "How do I track my study progress over time?",
      a: "Once you create a free account, all your test results, score breakdowns, time spent per section, and skill analytics are automatically saved in your personal Student Performance Dashboard."
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSubmitted(true);
      safeSetItem("user_contact_inquiry", JSON.stringify(contactForm));
    }, 1200);
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased overflow-x-hidden">
      
      {/* Hero Section Replicated From User Images */}
      <HeroSection />

      {/* Live Lessons Section (Replicated Exact UI From IELTS Online Tests) */}
      <div className="content-visibility-auto">
        <LiveLessonsSection />
      </div>

      {/* Mock Test Collection Showcase Section */}
      <div className="content-visibility-auto">
        <MockTestCollectionSection />
      </div>

      {/* 2026 Official IELTS Practice Materials Section */}
      <div className="content-visibility-auto">
        <OfficialPracticeMaterialsSection />
      </div>

      {/* 35,000,000+ Students Trust Us To Learn Mosaic Banner */}
      <div className="content-visibility-auto">
        <StudentTrustBannerSection />
      </div>

      {/* 6 Steps to Achieve Your IELTS Goal Section */}
      <div className="content-visibility-auto">
        <SixStepsSection />
      </div>

      {/* Take an IELTS Free Online Test Feature Slider Section */}
      <div className="content-visibility-auto">
        <TakeFreeTestSection />
      </div>

      {/* SEO-Rich Educational Overview & Global Testing Standards Section */}
      <div className="content-visibility-auto">
        <SeoOverviewContentSection />
      </div>

      {/* FAQ Section */}
      <div className="content-visibility-auto">
        <FaqSection />
      </div>

    </div>
  );
}
