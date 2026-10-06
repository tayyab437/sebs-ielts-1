import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PenTool,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Laptop,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart2,
  Mail,
  Award,
  HelpCircle,
  Layers,
  ArrowUpRight,
  GraduationCap,
  Sliders,
  Send,
  ExternalLink,
  RotateCcw,
  Zap,
  Volume2,
  ShieldCheck,
  Compass,
  Menu
} from "lucide-react";

// Types for Topics
interface WritingTopic {
  id: string;
  title: string;
  prompt: string;
  type: "Opinion" | "Discussion" | "Advantages & Disadvantages" | "Problem & Solution" | "Academic Task 1" | "General Training Letters";
  task: "Task 1" | "Task 2";
  difficulty: "Band 6.5" | "Band 7.5" | "Band 8.0+";
  tags: string[];
}

const WRITING_TOPICS: WritingTopic[] = [
  {
    id: "topic-1",
    title: "University Education vs. Practical Career Skills",
    prompt: "Some people believe that university education should focus strictly on academic theory, while others argue that higher education institutions should prioritize teaching practical career skills. Discuss both views and give your opinion.",
    type: "Discussion",
    task: "Task 2",
    difficulty: "Band 7.5",
    tags: ["Education", "Careers", "Academic"]
  },
  {
    id: "topic-2",
    title: "Artificial Intelligence in the Global Workplace",
    prompt: "In recent years, artificial intelligence has automated numerous tasks across multiple industries. Do the advantages of this technological transformation outweigh the disadvantages for the global workforce?",
    type: "Advantages & Disadvantages",
    task: "Task 2",
    difficulty: "Band 8.0+",
    tags: ["Technology", "Workforce", "AI"]
  },
  {
    id: "topic-3",
    title: "Urban Traffic Congestion & Public Transit Subsidies",
    prompt: "Traffic congestion in metropolitan centers has become a severe environmental and logistical issue. What are the primary causes of this problem, and what viable solutions can municipal governments implement?",
    type: "Problem & Solution",
    task: "Task 2",
    difficulty: "Band 7.5",
    tags: ["Environment", "Urbanization", "Society"]
  },
  {
    id: "topic-4",
    title: "Government Funding for the Arts vs. Essential Public Services",
    prompt: "Some individuals believe that national governments should heavily fund museums, theater, and fine arts, while others argue that taxpayer money should exclusively support healthcare and education. To what extent do you agree or disagree?",
    type: "Opinion",
    task: "Task 2",
    difficulty: "Band 8.0+",
    tags: ["Culture", "Government", "Society"]
  },
  {
    id: "topic-5",
    title: "Global Energy Consumption Trends (1990–2025)",
    prompt: "The line graph illustrates global energy consumption across renewable sources, fossil fuels, and nuclear power over a thirty-five year period. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
    type: "Academic Task 1",
    task: "Task 1",
    difficulty: "Band 7.5",
    tags: ["Line Graph", "Data Analysis", "Academic"]
  },
  {
    id: "topic-6",
    title: "Letter to Local Municipal Council Regarding Road Repairs",
    prompt: "You live in a residential neighborhood where the main access road has developed hazardous potholes following recent storms. Write a formal letter to the local municipal council explaining the situation, outlining the hazards, and requesting urgent repairs.",
    type: "General Training Letters",
    task: "Task 1",
    difficulty: "Band 6.5",
    tags: ["Formal Letter", "Community", "General Training"]
  },
  {
    id: "topic-7",
    title: "Remote Work and Mental Well-being",
    prompt: "A growing number of corporations now permit employees to work entirely from home. While some welcome the flexibility, others argue it leads to isolation and diminished collaboration. Discuss both viewpoints and give your own perspective.",
    type: "Discussion",
    task: "Task 2",
    difficulty: "Band 7.5",
    tags: ["Lifestyle", "Work", "Psychology"]
  },
  {
    id: "topic-8",
    title: "Island Infrastructure Development Map",
    prompt: "The two maps show an uninhabited coastal island before and after the construction of tourist accommodation facilities. Summarize the information by describing key infrastructure changes and environmental impact.",
    type: "Academic Task 1",
    task: "Task 1",
    difficulty: "Band 8.0+",
    tags: ["Maps", "Processes", "Academic"]
  },
  {
    id: "topic-9",
    title: "Consumer Spending Habits & Cashless Societies",
    prompt: "Many nations are rapidly transitioning toward completely cashless economic transactions. Do the benefits of digital currency and mobile banking outweigh the potential security and privacy risks?",
    type: "Advantages & Disadvantages",
    task: "Task 2",
    difficulty: "Band 7.5",
    tags: ["Finance", "Technology", "Economics"]
  }
];

export default function IeltsWritingGuide() {
  const navigate = useNavigate();

  // Navigation state
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Task 1 Toggle State
  const [task1Mode, setTask1Mode] = useState<"academic" | "gt">("academic");

  // Task 2 Accordion State
  const [expandedEssayType, setExpandedEssayType] = useState<string | null>("opinion");

  // Interactive Word Counter State
  const [userText, setUserText] = useState("");
  const wordCount = useMemo(() => {
    return userText.trim() ? userText.trim().split(/\s+/).length : 0;
  }, [userText]);

  // Topic filter state
  const [selectedTopicFilter, setSelectedTopicFilter] = useState("All");
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(6);

  // Computer tips accordion state
  const [expandedTipIndex, setExpandedTipIndex] = useState<number | null>(0);

  // FAQ accordion state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    if (selectedTopicFilter === "All") return WRITING_TOPICS;
    if (selectedTopicFilter === "Task 1") return WRITING_TOPICS.filter(t => t.task === "Task 1");
    if (selectedTopicFilter === "Task 2") return WRITING_TOPICS.filter(t => t.task === "Task 2");
    return WRITING_TOPICS.filter(t => t.type === selectedTopicFilter);
  }, [selectedTopicFilter]);

  // Active section scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "overview",
        "format",
        "task1",
        "task2",
        "computer-based",
        "word-counter",
        "scoring",
        "strategy",
        "topics",
        "practice",
        "computer-tips",
        "common-mistakes",
        "faq",
        "resources"
      ];

      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
      setIsMobileNavOpen(false);
    }
  };

  // Structured Data Schema for SEO
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalWebPage",
        "@id": "https://sebsinstitute.com/ielts-writing/#webpage",
        "url": "https://sebsinstitute.com/ielts-writing",
        "name": "IELTS Writing: Task 1, Task 2 & Computer-Based Guide | SEB's Institute",
        "description": "Master IELTS Writing with Task 1 and Task 2 strategies, computer-based IELTS guidance, writing topics, scoring criteria, practice questions and expert preparation from SEB's Institute.",
        "inLanguage": "en-US",
        "publisher": {
          "@type": "EducationalOrganization",
          "name": "SEB's Institute",
          "url": "https://sebsinstitute.com",
          "founder": {
            "@type": "Person",
            "name": "Syed Ejaz Bukhari"
          }
        },
        "author": {
          "@type": "Person",
          "name": "Syed Ejaz Bukhari"
        },
        "dateModified": "2026-10-05"
      },
      {
        "@type": "FAQPage",
        "@id": "https://sebsinstitute.com/ielts-writing/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How long is the IELTS Writing test?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The IELTS Writing test lasts exactly 60 minutes. Candidates are advised to spend approximately 20 minutes on Task 1 and 40 minutes on Task 2."
            }
          },
          {
            "@type": "Question",
            "name": "How many words should I write in IELTS Task 1 and Task 2?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For Task 1, you must write a minimum of 150 words. For Task 2, you must write a minimum of 250 words. Writing below the word requirement will incur a penalty under Task Achievement / Task Response."
            }
          },
          {
            "@type": "Question",
            "name": "Is computer-based IELTS Writing different from paper-based IELTS Writing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The test format, timing, question types, and scoring criteria are identical. The difference is that computer-based IELTS allows typing responses on a keyboard with an on-screen word counter and timer, while paper-based requires handwritten answer sheets."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://sebsinstitute.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Resources",
            "item": "https://sebsinstitute.com/courses"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "IELTS Writing",
            "item": "https://sebsinstitute.com/ielts-writing"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased selection:bg-[#FFF1F2] selection:text-[#B5121B]">
      {/* Schema.org SEO JSON-LD Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* SECTION 1: STICKY SUB-NAVIGATION BAR */}
      <nav
        aria-label="IELTS Writing Resource Navigation"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAEAEA] shadow-2xs transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm tracking-tight text-[#171717] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B5121B]" />
                <span className="hidden sm:inline">SEB's Institute</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-[#B5121B] font-bold">IELTS Writing</span>
              </span>
            </div>

            {/* Desktop Horizontal Jump Links */}
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {[
                { id: "overview", label: "Overview" },
                { id: "format", label: "Format & Timing" },
                { id: "task1", label: "Task 1" },
                { id: "task2", label: "Task 2" },
                { id: "computer-based", label: "Computer-Based" },
                { id: "word-counter", label: "Word Counter" },
                { id: "scoring", label: "Scoring" },
                { id: "strategy", label: "Strategy" },
                { id: "topics", label: "Topics" },
                { id: "practice", label: "Practice" },
                { id: "faq", label: "FAQs" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === item.id
                      ? "bg-[#FFF1F2] text-[#B5121B] font-bold border border-[#B5121B]/20"
                      : "text-[#5F6368] hover:text-[#171717] hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Fast Action CTA */}
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/writing"
                className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-[#B5121B] hover:bg-[#D71920] text-white font-bold text-xs tracking-wide shadow-xs transition-colors cursor-pointer"
              >
                <span>Practice Writing</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="lg:hidden p-1.5 rounded-lg border border-[#EAEAEA] text-[#5F6368] hover:text-[#171717] cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Horizontal Pill Scrollbar */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-[#EAEAEA]/60 -mx-4 px-4 bg-[#FFF7F7]">
            {[
              { id: "overview", label: "Overview" },
              { id: "format", label: "Format" },
              { id: "task1", label: "Task 1" },
              { id: "task2", label: "Task 2" },
              { id: "computer-based", label: "Computer" },
              { id: "word-counter", label: "Counter" },
              { id: "scoring", label: "Scoring" },
              { id: "topics", label: "Topics" },
              { id: "practice", label: "Practice" },
              { id: "faq", label: "FAQ" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  activeSection === item.id
                    ? "bg-[#B5121B] text-white shadow-xs"
                    : "bg-white text-[#5F6368] border border-[#EAEAEA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* SECTION 2: SOPHISTICATED HERO SECTION */}
      <header
        id="overview"
        className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden border-b border-[#EAEAEA] bg-gradient-to-b from-[#FFF7F7] via-white to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF1F2] border border-[#B5121B]/20 text-[#B5121B] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#B5121B] animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  IELTS Writing Resource
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-bold text-[#5F6368]">Academic & General Training</span>
              </div>

              {/* Main H1 Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-[#171717] leading-[1.18]">
                IELTS Writing: Complete Guide to Task 1, Task 2 & Computer-Based Tests
              </h1>

              {/* Supporting Editorial Paragraph */}
              <p className="text-base sm:text-lg text-[#5F6368] leading-relaxed font-normal max-w-2xl">
                Master IELTS Writing with clear structures, practical strategies, topic guidance, and computer-based test preparation for Academic and General Training candidates.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  to="/dashboard/writing"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#B5121B] hover:bg-[#D71920] text-white font-extrabold text-sm shadow-md shadow-[#B5121B]/15 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Start IELTS Writing Practice</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/mock-tests"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#171717] font-bold text-sm border border-[#EAEAEA] shadow-2xs transition-colors cursor-pointer text-center"
                >
                  <Laptop className="w-4 h-4 text-[#B5121B]" />
                  <span>Take Free IELTS Test</span>
                </Link>
              </div>

              {/* Small Trust Indicators */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#EAEAEA] text-[#5F6368]">
                {[
                  "Academic + GT",
                  "Task 1 + Task 2",
                  "Computer-Based Mode",
                  "AI Evaluation"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16803C] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual: Authentic Computer-Delivered IELTS Writing Mockup */}
            <div className="lg:col-span-5 relative">
              
              {/* Floating Real-Time Badge */}
              <div className="absolute -top-3 -right-2 z-20 hidden sm:flex items-center gap-1.5 bg-[#B5121B] text-white px-3.5 py-1.5 rounded-full shadow-lg text-[11px] font-black uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Real-Time Writing Practice</span>
              </div>

              {/* Floating Task 1 + 2 Pill */}
              <div className="absolute -bottom-3 -left-2 z-20 hidden sm:flex items-center gap-1.5 bg-white border border-[#EAEAEA] px-3.5 py-1.5 rounded-full shadow-md text-[11px] font-extrabold text-[#171717]">
                <Layers className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Task 1 + Task 2 Supported</span>
              </div>

              {/* Computer Exam Screen Mockup Frame */}
              <div className="rounded-2xl border-2 border-[#EAEAEA] bg-white shadow-xl overflow-hidden text-left">
                {/* Simulated Computer Test Header Bar */}
                <div className="bg-[#171717] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#B5121B] text-white text-[10px] font-black px-2 py-0.5 rounded">
                      TASK 2
                    </span>
                    <span className="font-extrabold tracking-tight">Essay Response</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>00:39:42 remaining</span>
                  </div>
                </div>

                {/* Question Prompt Area */}
                <div className="p-4 bg-[#FFF7F7] border-b border-[#EAEAEA] space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#B5121B] tracking-wider">
                    Writing Task 2 Prompt
                  </span>
                  <p className="text-xs font-semibold text-[#171717] leading-relaxed">
                    "Some people think that universities should focus on graduates' job prospects, while others believe knowledge itself is more important. Discuss both views."
                  </p>
                </div>

                {/* Simulated Typing Editor Area */}
                <div className="p-4 space-y-3 bg-white">
                  <div className="h-32 p-2.5 rounded-xl border border-[#EAEAEA] bg-slate-50/50 text-[11px] font-mono text-slate-700 leading-relaxed overflow-hidden">
                    <span className="text-[#171717] font-semibold">
                      In contemporary discourse, the fundamental objective of tertiary education remains subject to intense scholarly debate. While proponents of pragmatic vocationalism contend that institutions must prioritize employability...
                    </span>
                    <span className="inline-block w-1.5 h-3.5 bg-[#B5121B] ml-0.5 animate-pulse" />
                  </div>

                  {/* On-Screen Word Counter & Status Footer */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EAEAEA]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600">
                      <span className="text-[11px]">Word count:</span>
                      <span className="text-sm font-black text-[#B5121B]">268</span>
                      <span className="text-[10px] text-[#16803C] font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Min 250 Met
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                        Auto-Saved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* SECTION 3: QUICK ANSWER / SEARCH INTENT SECTION */}
      <section className="py-12 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              What Is the IELTS Writing Test?
            </h2>
            <p className="text-sm sm:text-base text-[#5F6368] leading-relaxed font-normal">
              The IELTS Writing test evaluates how effectively you communicate ideas in written English. It contains two tasks, and candidates have exactly 60 minutes to complete both.
            </p>
          </div>

          {/* Two Clean Horizontal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch pt-2">
            
            {/* Task 1 Card */}
            <div className="p-6 rounded-2xl bg-[#FFF7F7] border border-[#EAEAEA] hover:border-[#B5121B]/30 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#B5121B] tracking-wider px-2.5 py-0.5 rounded bg-[#FFF1F2]">
                    TASK 1 (20 Minutes)
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">150+ words</span>
                </div>
                <h3 className="text-lg font-bold text-[#171717]">Visual Report or Letter</h3>
                <div className="text-xs text-[#5F6368] space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-[#171717]">Academic:</strong> Describe visual information such as graphs, charts, tables, maps, or processes.
                  </p>
                  <p>
                    <strong className="text-[#171717]">General Training:</strong> Write a formal, semi-formal, or personal letter based on a given scenario.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#EAEAEA] text-[11px] text-[#5F6368] font-medium">
                Contributes approximately 33% of your overall Writing band score.
              </div>
            </div>

            {/* Task 2 Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#EAEAEA] hover:border-[#B5121B]/30 transition-all space-y-3 flex flex-col justify-between shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#B5121B] tracking-wider px-2.5 py-0.5 rounded bg-[#FFF1F2]">
                    TASK 2 (40 Minutes)
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">250+ words</span>
                </div>
                <h3 className="text-lg font-bold text-[#171717]">Formal Discursive Essay</h3>
                <div className="text-xs text-[#5F6368] space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-[#171717]">Academic + General Training:</strong> Write a structured academic essay responding to a point of view, argument, discussion, or societal problem.
                  </p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFF1F2] border border-[#B5121B]/20 text-[11px] font-bold text-[#B5121B] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Task 2 carries twice the weight (66%) of your final Writing band score.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: IELTS WRITING FORMAT & TIMELINE */}
      <section id="format" className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Exam Structure
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              IELTS Writing Format & Recommended Timing
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Manage your 60 minutes strategically to ensure both tasks are fully planned, written, and proofread.
            </p>
          </div>

          {/* Visual Timeline Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1: Task 1 */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-2xs space-y-4 text-left relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#B5121B] font-black text-base flex items-center justify-center">
                01
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#B5121B] uppercase tracking-wider">Minutes 00 – 20</span>
                <h3 className="text-lg font-bold text-[#171717]">Task 1: Summary / Letter</h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Spend 3 mins planning key trends or bullet points, 14 mins writing 150+ words, and 3 mins reviewing spelling and numbers.
                </p>
              </div>
              <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Minimum: 150 words</span>
                <span className="text-[#B5121B]">20 Mins</span>
              </div>
            </div>

            {/* Step 2: Task 2 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#B5121B]/30 shadow-md space-y-4 text-left relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#B5121B] text-white font-black text-base flex items-center justify-center">
                02
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#B5121B] uppercase tracking-wider">Minutes 20 – 55</span>
                <h3 className="text-lg font-bold text-[#171717]">Task 2: Academic Essay</h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Spend 5 mins brainstorming argument structures, 25 mins writing 250+ words with coherent paragraph transitions.
                </p>
              </div>
              <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Minimum: 250 words</span>
                <span className="text-[#B5121B]">35 Mins</span>
              </div>
            </div>

            {/* Step 3: Review */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-2xs space-y-4 text-left relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#B5121B] font-black text-base flex items-center justify-center">
                03
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#B5121B] uppercase tracking-wider">Minutes 55 – 60</span>
                <h3 className="text-lg font-bold text-[#171717]">Final Proofreading</h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Check both tasks for subject-verb agreement, accurate verb tenses, paragraph spacing, and punctuation accuracy.
                </p>
              </div>
              <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Error elimination</span>
                <span className="text-[#16803C]">5 Mins</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: IELTS WRITING TASK 1 GUIDE */}
      <section id="task1" className="py-16 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Detailed Breakdown
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
              IELTS Writing Task 1
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-normal leading-relaxed">
              Understand the core distinction between Academic graphical reports and General Training letters.
            </p>

            {/* Academic vs General Training Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-[#FFF7F7] border border-[#EAEAEA] mt-2">
              <button
                type="button"
                onClick={() => setTask1Mode("academic")}
                className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  task1Mode === "academic"
                    ? "bg-[#B5121B] text-white shadow-xs"
                    : "text-[#5F6368] hover:text-[#171717]"
                }`}
              >
                Academic Task 1 (Visual Data)
              </button>
              <button
                type="button"
                onClick={() => setTask1Mode("gt")}
                className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  task1Mode === "gt"
                    ? "bg-[#B5121B] text-white shadow-xs"
                    : "text-[#5F6368] hover:text-[#171717]"
                }`}
              >
                General Training Task 1 (Letters)
              </button>
            </div>
          </div>

          {/* Academic Task 1 View */}
          {task1Mode === "academic" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 6 Visual Data Types Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                {[
                  { name: "Line Graphs", desc: "Trends over time" },
                  { name: "Bar Charts", desc: "Category comparisons" },
                  { name: "Pie Charts", desc: "Proportions & shares" },
                  { name: "Tables", desc: "Dense numerical data" },
                  { name: "Maps", desc: "Past vs present plans" },
                  { name: "Processes", desc: "Step-by-step systems" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[#EAEAEA] bg-[#FFF7F7] text-[#171717] space-y-1 hover:border-[#B5121B]/30 transition-all"
                  >
                    <span className="text-xs font-bold block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">{item.desc}</span>
                  </div>
                ))}
              </div>

              {/* 4-Step Academic Task 1 Structure Component */}
              <div className="bg-white rounded-2xl border border-[#EAEAEA] p-6 sm:p-8 shadow-2xs space-y-6">
                <h3 className="text-base sm:text-lg font-black text-[#171717] flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#B5121B]" />
                  <span>Standard 4-Paragraph Academic Task 1 Structure</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-[#EAEAEA] bg-slate-50/50 space-y-1.5">
                    <span className="font-extrabold text-[#B5121B] text-[11px] uppercase tracking-wider block">
                      Paragraph 1: Introduction
                    </span>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      Paraphrase the prompt statement using synonyms for time periods, units, and categories.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#B5121B]/20 bg-[#FFF1F2] space-y-1.5">
                    <span className="font-extrabold text-[#B5121B] text-[11px] uppercase tracking-wider block">
                      Paragraph 2: The Overview (Crucial)
                    </span>
                    <p className="text-slate-700 leading-relaxed font-normal">
                      State 2–3 main overall trends or high/low points without quoting specific data figures. Mandatory for Band 7+.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#EAEAEA] bg-slate-50/50 space-y-1.5">
                    <span className="font-extrabold text-[#B5121B] text-[11px] uppercase tracking-wider block">
                      Paragraph 3: Detail Paragraph 1
                    </span>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      Group similar categories and describe specific data points, start/end values, and significant fluctuations.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#EAEAEA] bg-slate-50/50 space-y-1.5">
                    <span className="font-extrabold text-[#B5121B] text-[11px] uppercase tracking-wider block">
                      Paragraph 4: Detail Paragraph 2
                    </span>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      Highlight remaining comparisons, contrasting trends, and secondary patterns with exact numerical data.
                    </p>
                  </div>
                </div>

                {/* Band 8+ Callout with Red Left Border */}
                <div className="p-4 rounded-r-xl border-l-4 border-l-[#B5121B] bg-[#FFF7F7] border border-[#EAEAEA] text-xs space-y-1">
                  <span className="font-extrabold text-[#B5121B] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Band 8+ Examiner Strategy Note
                  </span>
                  <p className="text-[#5F6368] leading-relaxed">
                    Never include your personal opinion or attempt to explain <em>why</em> a trend occurred (e.g., do not say "energy rose because of population growth"). Only describe what is explicitly shown in the chart.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Training Task 1 View */}
          {task1Mode === "gt" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 3 Letter Formats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    title: "Formal Letter",
                    scenario: "To an unknown person, organization, or authority.",
                    salutation: "Dear Sir/Madam, ... Yours faithfully,",
                    tone: "Respectful, objective, no contractions (do not use don't)."
                  },
                  {
                    title: "Semi-Formal Letter",
                    scenario: "To someone you know by name in a professional context.",
                    salutation: "Dear Mr. Davies, ... Yours sincerely,",
                    tone: "Polite, structured, professional yet direct."
                  },
                  {
                    title: "Informal Letter",
                    scenario: "To a close friend, relative, or colleague.",
                    salutation: "Dear Lucas, ... Best regards, / Warmly,",
                    tone: "Conversational, natural idioms, friendly phrasing."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#B5121B]" />
                      <h4 className="text-base font-bold text-[#171717]">{item.title}</h4>
                    </div>
                    <p className="text-xs text-[#5F6368]">{item.scenario}</p>
                    <div className="text-[11px] space-y-1 bg-white p-3 rounded-xl border border-[#EAEAEA]">
                      <div><strong className="text-slate-800">Opening/Closing:</strong> <span className="font-mono text-slate-600">{item.salutation}</span></div>
                      <div><strong className="text-slate-800">Tone:</strong> <span className="text-slate-600">{item.tone}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Band 8+ Callout */}
              <div className="p-4 rounded-r-xl border-l-4 border-l-[#B5121B] bg-[#FFF7F7] border border-[#EAEAEA] text-xs space-y-1">
                <span className="font-extrabold text-[#B5121B] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> GT Letter Requirement
                </span>
                <p className="text-[#5F6368] leading-relaxed">
                  Every General Training prompt contains exactly three bullet points. You must address all three bullet points with balanced depth to achieve Band 7 or higher in Task Achievement.
                </p>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* SECTION 6: IELTS WRITING TASK 2 GUIDE */}
      <section id="task2" className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Major Essay Types
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
              IELTS Writing Task 2
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] leading-relaxed font-normal">
              Task 2 requires you to write a structured essay responding to an argument, opinion, problem, or discussion. Click each essay type below for structure and sample language.
            </p>
          </div>

          {/* 4 Expandable Accordion Cards */}
          <div className="space-y-4">
            
            {/* Accordion 1: Opinion Essay */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setExpandedEssayType(expandedEssayType === "opinion" ? null : "opinion")}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#B5121B] font-bold text-xs flex items-center justify-center shrink-0">
                    01
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#171717]">
                      Opinion Essay (Agree or Disagree)
                    </h3>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      To what extent do you agree or disagree with a specific statement?
                    </p>
                  </div>
                </div>
                {expandedEssayType === "opinion" ? (
                  <ChevronUp className="w-5 h-5 text-[#B5121B]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedEssayType === "opinion" && (
                <div className="p-6 pt-0 border-t border-[#EAEAEA] bg-[#FFF7F7]/40 text-xs space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Recommended Structure</span>
                      <ul className="list-disc list-inside space-y-1 text-[#5F6368] font-normal leading-relaxed">
                        <li><strong>Intro:</strong> Paraphrase prompt + clear thesis statement</li>
                        <li><strong>Body 1:</strong> Primary reason supporting your opinion + example</li>
                        <li><strong>Body 2:</strong> Secondary reason + practical illustration</li>
                        <li><strong>Conclusion:</strong> Restate opinion with varied vocabulary</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Useful Linking Language</span>
                      <p className="text-[#5F6368] leading-relaxed">
                        "I firmly contend that...", "A compelling justification for this view is...", "Furthermore...", "Conversely, while some maintain..."
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Discussion Essay */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setExpandedEssayType(expandedEssayType === "discussion" ? null : "discussion")}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#B5121B] font-bold text-xs flex items-center justify-center shrink-0">
                    02
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#171717]">
                      Discussion Essay (Discuss Both Views & Give Opinion)
                    </h3>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Explore two contrasting perspectives fairly before stating your own position.
                    </p>
                  </div>
                </div>
                {expandedEssayType === "discussion" ? (
                  <ChevronUp className="w-5 h-5 text-[#B5121B]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedEssayType === "discussion" && (
                <div className="p-6 pt-0 border-t border-[#EAEAEA] bg-[#FFF7F7]/40 text-xs space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Recommended Structure</span>
                      <ul className="list-disc list-inside space-y-1 text-[#5F6368] font-normal leading-relaxed">
                        <li><strong>Intro:</strong> Paraphrase both perspectives + indicate your stance</li>
                        <li><strong>Body 1:</strong> Analyze View A thoroughly</li>
                        <li><strong>Body 2:</strong> Analyze View B + provide your reasoned support</li>
                        <li><strong>Conclusion:</strong> Summarize synthesis of both arguments</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Common Mistake to Avoid</span>
                      <p className="text-[#5F6368] leading-relaxed">
                        Failing to present a clear opinion throughout the entire essay, or only discussing one viewpoint while ignoring the other.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Advantages & Disadvantages */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setExpandedEssayType(expandedEssayType === "advantages" ? null : "advantages")}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#B5121B] font-bold text-xs flex items-center justify-center shrink-0">
                    03
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#171717]">
                      Advantages & Disadvantages (Outweigh Question)
                    </h3>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Assess positive versus negative consequences of a modern trend or policy.
                    </p>
                  </div>
                </div>
                {expandedEssayType === "advantages" ? (
                  <ChevronUp className="w-5 h-5 text-[#B5121B]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedEssayType === "advantages" && (
                <div className="p-6 pt-0 border-t border-[#EAEAEA] bg-[#FFF7F7]/40 text-xs space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Recommended Structure</span>
                      <ul className="list-disc list-inside space-y-1 text-[#5F6368] font-normal leading-relaxed">
                        <li><strong>Intro:</strong> Paraphrase + state whether advantages or drawbacks dominate</li>
                        <li><strong>Body 1:</strong> Examine the significant advantages</li>
                        <li><strong>Body 2:</strong> Examine the drawbacks and explain why one side carries more weight</li>
                        <li><strong>Conclusion:</strong> Reiterate final judgment</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Useful Vocabulary</span>
                      <p className="text-[#5F6368] leading-relaxed">
                        "Substantial merit", "inherent drawback", "eclipses the disadvantages", "far-reaching ramifications".
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: Problem & Solution */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setExpandedEssayType(expandedEssayType === "problem" ? null : "problem")}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#B5121B] font-bold text-xs flex items-center justify-center shrink-0">
                    04
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#171717]">
                      Problem & Solution (Causes & Measures)
                    </h3>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Identify root causes of a challenge and propose realistic, actionable remedies.
                    </p>
                  </div>
                </div>
                {expandedEssayType === "problem" ? (
                  <ChevronUp className="w-5 h-5 text-[#B5121B]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedEssayType === "problem" && (
                <div className="p-6 pt-0 border-t border-[#EAEAEA] bg-[#FFF7F7]/40 text-xs space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Recommended Structure</span>
                      <ul className="list-disc list-inside space-y-1 text-[#5F6368] font-normal leading-relaxed">
                        <li><strong>Intro:</strong> Paraphrase topic + outline causes and solutions</li>
                        <li><strong>Body 1:</strong> Primary causes / triggers with logical links</li>
                        <li><strong>Body 2:</strong> Concrete solutions corresponding to each cause</li>
                        <li><strong>Conclusion:</strong> Summary of collective responsibility</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#EAEAEA]">
                      <span className="font-bold text-[#171717] block">Key Strategy</span>
                      <p className="text-[#5F6368] leading-relaxed">
                        Ensure every solution proposed in Body 2 directly matches a cause identified in Body 1.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7: COMPUTER-BASED IELTS WRITING */}
      <section id="computer-based" className="py-16 bg-[#FFF1F2] border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              SEO Deep Dive
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
              Computer-Based IELTS Writing
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium leading-relaxed">
              What changes when you take IELTS Writing on a computer versus paper?
            </p>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Paper-Based Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-2xs space-y-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  PAPER-BASED FORMAT
                </span>
                <span className="text-xs font-mono text-slate-400">Traditional</span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Handwritten Answer Sheets</h3>
              <ul className="space-y-2.5 text-xs text-[#5F6368]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Handwritten responses with pencil on physical sheets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Manual word count estimation (lines × average words per line).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Erasing and rewriting takes manual physical time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Handwriting legibility directly impacts examiner ease.</span>
                </li>
              </ul>
            </div>

            {/* Computer-Based Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#B5121B]/30 shadow-md space-y-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#B5121B]">
                  COMPUTER-BASED FORMAT
                </span>
                <span className="text-xs font-black text-[#B5121B] px-2 py-0.5 rounded bg-[#FFF1F2]">Digital Mode</span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Digital Typing & Live Word Counter</h3>
              <ul className="space-y-2.5 text-xs text-[#171717] font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Type directly on standard QWERTY keyboards with high speed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Exact real-time on-screen word counter (no guesswork).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Effortless editing: cut, copy, paste, and insert paragraphs instantly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Fixed on-screen countdown timer with automatic 10-minute warning.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Assessment Criteria Neutrality Statement */}
          <div className="p-4 rounded-xl bg-white border border-[#B5121B]/20 text-xs text-center text-[#5F6368] max-w-4xl mx-auto leading-relaxed">
            <strong className="text-[#171717]">Important Note: </strong>
            The IELTS Writing assessment criteria remain completely identical regardless of delivery mode — scoring is focused strictly on the quality of your response: task achievement, coherence, vocabulary, and grammar.
          </div>

          {/* Computer Writing Toolkit */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[#171717] uppercase tracking-wider text-center">
              Computer-Delivered Writing Toolkit & Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {[
                { title: "Word Counter", desc: "Live numeric feedback" },
                { title: "Digital Timer", desc: "Always visible on top" },
                { title: "Keyboard Editing", desc: "Cut / Copy / Paste allowed" },
                { title: "Font Resizing", desc: "Standard or large text" },
                { title: "Paragraph Breaks", desc: "Clear double Enter spacing" }
              ].map((tool, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-[#EAEAEA] space-y-1">
                  <span className="text-xs font-bold text-[#171717] block">{tool.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{tool.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 8: INTERACTIVE MINI WORD COUNTER COMPONENT */}
      <section id="word-counter" className="py-16 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Free Interactive Utility
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              Practice Word Counter Simulator
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Simulate the computer-based IELTS typing experience without needing to create an account.
            </p>
          </div>

          {/* Counter Widget */}
          <div className="rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Type or paste your IELTS response below:</span>
              <button
                type="button"
                onClick={() => setUserText("")}
                className="text-[#B5121B] hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Clear Text
              </button>
            </div>

            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Start typing your IELTS Task 1 or Task 2 response here to measure pacing, word targets, and typing efficiency..."
              rows={6}
              className="w-full rounded-xl bg-white border border-[#EAEAEA] p-4 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B5121B]/20 leading-relaxed resize-none"
            />

            {/* Counter Statistics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 items-center text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#EAEAEA] flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Total Words:</span>
                <span className="text-lg font-black text-[#B5121B] font-mono">{wordCount}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#EAEAEA] flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Task 1 (150+):</span>
                {wordCount >= 150 ? (
                  <span className="text-xs font-extrabold text-[#16803C] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {150 - wordCount} words needed
                  </span>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#EAEAEA] flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Task 2 (250+):</span>
                {wordCount >= 250 ? (
                  <span className="text-xs font-extrabold text-[#16803C] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {250 - wordCount} words needed
                  </span>
                )}
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Task 2 Target (250 Words)</span>
                <span>{Math.min(100, Math.round((wordCount / 250) * 100))}% Completed</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    wordCount >= 250 ? "bg-[#16803C]" : "bg-[#B5121B]"
                  }`}
                  style={{ width: `${Math.min(100, (wordCount / 250) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: WRITING SCORING & BAND SCALE */}
      <section id="scoring" className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Official Rubric
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
              How IELTS Writing Is Scored
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium leading-relaxed">
              Every IELTS Writing response is assessed across 4 equally weighted criteria (25% each).
            </p>
          </div>

          {/* 4 Scoring Criteria Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-2xs space-y-2 text-left">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FFF1F2] text-[#B5121B]">
                25% WEIGHT
              </span>
              <h3 className="text-sm font-extrabold text-[#171717]">
                Task Achievement / Response
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Evaluates how fully and accurately you answer every component of the prompt with relevant, well-supported ideas.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-2xs space-y-2 text-left">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FFF1F2] text-[#B5121B]">
                25% WEIGHT
              </span>
              <h3 className="text-sm font-extrabold text-[#171717]">
                Coherence & Cohesion
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Assesses logical paragraph sequencing, progression of thought, and natural use of cohesive discourse markers.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-2xs space-y-2 text-left">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FFF1F2] text-[#B5121B]">
                25% WEIGHT
              </span>
              <h3 className="text-sm font-extrabold text-[#171717]">
                Lexical Resource
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Measures the range, precision, and appropriateness of your vocabulary, including academic collocations and spelling accuracy.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-2xs space-y-2 text-left">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FFF1F2] text-[#B5121B]">
                25% WEIGHT
              </span>
              <h3 className="text-sm font-extrabold text-[#171717]">
                Grammatical Range & Accuracy
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Scrutinizes the variety of complex sentence structures, clause subordinate combinations, and punctuation precision.
              </p>
            </div>

          </div>

          {/* Simple Band Scale Visual */}
          <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block text-center">
              IELTS Writing Band Level Progression Scale
            </span>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-[#171717]">Band 5.0</strong>
                <span className="text-[10px] text-slate-400">Modest User</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-[#171717]">Band 6.0</strong>
                <span className="text-[10px] text-slate-400">Competent User</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#B5121B]/30">
                <strong className="block text-[#B5121B]">Band 7.0</strong>
                <span className="text-[10px] text-[#B5121B] font-semibold">Good User</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#B5121B]/30">
                <strong className="block text-[#B5121B]">Band 8.0</strong>
                <span className="text-[10px] text-[#B5121B] font-semibold">Very Good User</span>
              </div>
              <div className="p-3 rounded-xl bg-[#16803C]/10 border border-[#16803C]/30 text-[#16803C]">
                <strong className="block font-black">Band 9.0</strong>
                <span className="text-[10px] font-bold">Expert User</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 10: BAND 8+ WRITING STRATEGY */}
      <section id="strategy" className="py-16 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Step-by-Step Methodology
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              7-Step Strategy to Improve Your Writing Band
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Follow this structured sequence during every practice session and real examination.
            </p>
          </div>

          {/* Numbered Vertical Progression */}
          <div className="space-y-3">
            {[
              { num: "01", title: "Analyze the Prompt Carefully", desc: "Identify the topic, the specific instruction words (e.g. 'discuss both', 'agree or disagree'), and all question sub-parts." },
              { num: "02", title: "Spend 3–5 Minutes Planning Before Writing", desc: "Brainstorm 2 distinct main arguments and note supporting examples on scratch paper." },
              { num: "03", title: "Establish a Clear 4-Paragraph Structure", desc: "Intro, Body Paragraph 1, Body Paragraph 2, and Conclusion. Avoid single-sentence paragraphs." },
              { num: "04", title: "Develop Ideas Fully (Idea → Explanation → Example)", desc: "Do not just list ideas; explain why each point is true and substantiate with realistic evidence." },
              { num: "05", title: "Deploy Precise, Topic-Specific Vocabulary", desc: "Use natural academic collocations rather than shoehorning overly rare words inappropriately." },
              { num: "06", title: "Vary Sentence Architecture", desc: "Mix simple sentences with relative clauses, condition statements, and passive constructions." },
              { num: "07", title: "Dedicate 3–5 Minutes for Rigorous Proofreading", desc: "Review for plural agreement (-s), articles (a/an/the), spelling mistakes, and word targets." }
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#EAEAEA] bg-[#FFF7F7]/40 hover:bg-[#FFF7F7] transition-colors flex items-start gap-4"
              >
                <span className="w-8 h-8 rounded-lg bg-[#FFF1F2] text-[#B5121B] font-black text-xs flex items-center justify-center shrink-0">
                  {step.num}
                </span>
                <div className="space-y-0.5 text-left">
                  <h3 className="text-sm font-bold text-[#171717]">{step.title}</h3>
                  <p className="text-xs text-[#5F6368] leading-relaxed font-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Link to AI Writing Evaluator */}
          <div className="p-6 rounded-2xl bg-[#FFF1F2] border border-[#B5121B]/20 text-center space-y-3">
            <h3 className="text-base font-bold text-[#171717]">
              Want Instant Band Evaluation on Your Essays?
            </h3>
            <p className="text-xs text-[#5F6368] max-w-xl mx-auto font-normal">
              Submit your essay to SEBS's AI Writing Evaluator to get detailed feedback on all 4 IELTS criteria and sentence-level corrections.
            </p>
            <Link
              to="/dashboard/writing"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B5121B] hover:bg-[#D71920] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <span>Practice With AI Writing Feedback</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION 11: IELTS WRITING TOPICS & PRACTICE QUESTIONS */}
      <section id="topics" className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Practice Bank
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
              IELTS Writing Topics & Practice Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-normal leading-relaxed">
              Filter by essay category to practice writing authentic Academic and General Training questions.
            </p>

            {/* Category Filter Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
              {[
                "All",
                "Opinion",
                "Discussion",
                "Advantages & Disadvantages",
                "Problem & Solution",
                "Academic Task 1",
                "General Training Letters"
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedTopicFilter(cat);
                    setVisibleTopicsCount(6);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedTopicFilter === cat
                      ? "bg-[#B5121B] text-white shadow-xs"
                      : "bg-white text-[#5F6368] border border-[#EAEAEA] hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {filteredTopics.slice(0, visibleTopicsCount).map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-2xs hover:shadow-md hover:border-[#B5121B]/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FFF1F2] text-[#B5121B]">
                      {topic.type}
                    </span>
                    <span className="text-[10px] font-bold text-[#16803C] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                      {topic.difficulty}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#171717] line-clamp-2">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-[#5F6368] line-clamp-3 leading-relaxed font-normal">
                    {topic.prompt}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">{topic.task}</span>
                  <Link
                    to={`/dashboard/writing?topic=${encodeURIComponent(topic.title)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#B5121B] hover:text-[#D71920]"
                  >
                    <span>Practice Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleTopicsCount < filteredTopics.length && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleTopicsCount(prev => prev + 3)}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#171717] font-bold text-xs border border-[#EAEAEA] shadow-2xs cursor-pointer transition-colors"
              >
                Load More Writing Topics ({filteredTopics.length - visibleTopicsCount} remaining)
              </button>
            </div>
          )}

        </div>
      </section>

      {/* SECTION 12: PRACTICE IELTS WRITING ONLINE */}
      <section id="practice" className="py-16 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Interactive Preparation
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
              Practice IELTS Writing Online
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Choose your preferred practice track below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Track 1 */}
            <div className="bg-[#FFF7F7] rounded-2xl p-6 border border-[#EAEAEA] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#B5121B] flex items-center justify-center">
                  <PenTool className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#171717]">Free Writing Practice</h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Access a library of authentic Task 1 and Task 2 prompts with on-screen timing and word counting.
                </p>
              </div>
              <Link
                to="/dashboard/writing"
                className="w-full py-2.5 rounded-xl bg-[#B5121B] hover:bg-[#D71920] text-white font-bold text-xs text-center shadow-xs transition-colors block cursor-pointer"
              >
                Start Free Practice
              </Link>
            </div>

            {/* Track 2 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#B5121B]/30 shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#B5121B] text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#171717]">AI Writing Evaluator</h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Receive comprehensive band score predictions, vocabulary enhancements, and grammar error breakdowns.
                </p>
              </div>
              <Link
                to="/dashboard/writing"
                className="w-full py-2.5 rounded-xl bg-[#B5121B] hover:bg-[#D71920] text-white font-bold text-xs text-center shadow-xs transition-colors block cursor-pointer"
              >
                Try AI Evaluator
              </Link>
            </div>

            {/* Track 3 */}
            <div className="bg-[#FFF7F7] rounded-2xl p-6 border border-[#EAEAEA] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#B5121B] flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#171717]">Full Mock Examination</h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Experience a timed, authentic computer-delivered IELTS simulation covering all 4 sections.
                </p>
              </div>
              <Link
                to="/mock-tests"
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#171717] font-bold text-xs border border-[#EAEAEA] text-center shadow-2xs transition-colors block cursor-pointer"
              >
                Launch Mock Test
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 13: COMPUTER-BASED WRITING TIPS ACCORDION */}
      <section id="computer-tips" className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Exam Day Strategy
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              Computer-Based IELTS Writing Tips
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Practical advice for students taking IELTS on a computer.
            </p>
          </div>

          {/* Accordion Questions */}
          <div className="space-y-3">
            {[
              { q: "How can I increase my typing speed for computer-based IELTS?", a: "Practice touch-typing daily on a standard external desktop keyboard. You only need about 25–30 words per minute to complete both tasks comfortably." },
              { q: "Can I edit and move sentences easily during the test?", a: "Yes. You can use standard keyboard shortcuts (Ctrl+C to copy, Ctrl+V to paste, Ctrl+X to cut) or highlight and delete text seamlessly." },
              { q: "How should I allocate the 60 minutes on the computer interface?", a: "Begin immediately with Task 1 (20 minutes). Complete Task 2 within 35 minutes. Dedicate the final 5 minutes exclusively to proofreading." },
              { q: "Is spell-check or autocorrect available in the computer IELTS test?", a: "No. The software does not highlight spelling mistakes or capitalize words automatically. You are responsible for accurate spelling." },
              { q: "What should I do if I accidentally delete a paragraph?", a: "Use the standard undo shortcut (Ctrl+Z) immediately, or retype the key idea if not restored." },
              { q: "Is computer-based IELTS easier than paper-based IELTS?", a: "The grading criteria and questions are identical. Most candidates find the computer test faster and easier to edit, but the intellectual difficulty is the same." }
            ].map((tip, idx) => (
              <div key={idx} className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setExpandedTipIndex(expandedTipIndex === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#171717]">{tip.q}</span>
                  {expandedTipIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#B5121B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {expandedTipIndex === idx && (
                  <div className="p-4 pt-0 text-xs text-[#5F6368] leading-relaxed border-t border-[#EAEAEA] bg-[#FFF7F7]/30">
                    {tip.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 14: COMMON MISTAKES VS BETTER APPROACH */}
      <section id="common-mistakes" className="py-16 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Pitfalls & Solutions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              Common IELTS Writing Mistakes vs. Better Approach
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Transform weak writing habits into high-scoring examination responses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch text-left">
            
            {/* Common Mistakes Column */}
            <div className="bg-[#FFF7F7] rounded-2xl p-6 border border-[#B5121B]/20 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-[#B5121B] flex items-center justify-center font-bold text-xs">
                  ✕
                </div>
                <h3 className="text-sm font-extrabold text-[#B5121B] uppercase tracking-wider">
                  Frequent Mistakes
                </h3>
              </div>
              <ul className="space-y-3 text-xs text-[#5F6368]">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>Writing without planning, resulting in disorganized paragraphs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>Spending 30+ minutes on Task 1 and rushing Task 2.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>Memorizing template essays and inserting them out of context.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>Writing under 150 (Task 1) or 250 (Task 2) words.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>Omitting an overview paragraph in Academic Task 1.</span>
                </li>
              </ul>
            </div>

            {/* Better Approach Column */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#16803C] flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <h3 className="text-sm font-extrabold text-[#16803C] uppercase tracking-wider">
                  Recommended Approach
                </h3>
              </div>
              <ul className="space-y-3 text-xs text-[#171717] font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Plan each paragraph before typing a single sentence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Strict 20/40 time split to prioritize high-weight Task 2.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Develop original ideas tailored specifically to the prompt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Aim for 170–190 words (Task 1) and 270–290 words (Task 2).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16803C] mt-0.5 shrink-0" />
                  <span>Always include a dedicated 2-sentence Overview in Task 1.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 15: FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              Frequently Asked Questions About IELTS Writing
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Everything you need to know about format, timing, and scoring.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "1. How long is the IELTS Writing test?",
                a: "The IELTS Writing test is exactly 60 minutes long. There is no additional transfer time, so all answers must be entered into the computer or paper answer booklet within this period."
              },
              {
                q: "2. How many tasks are in the IELTS Writing test?",
                a: "There are two tasks: Task 1 (visual data summary for Academic or letter for General Training) and Task 2 (formal discursive essay for both modules)."
              },
              {
                q: "3. What is the difference between Academic and General Training Writing?",
                a: "Task 1 differs: Academic requires analyzing a graph, chart, map, or process, while General Training requires writing a letter. Task 2 is an essay for both, though Academic essay topics tend to be more formal and theoretical."
              },
              {
                q: "4. Is computer-based IELTS Writing different from paper-based?",
                a: "The assessment criteria, timing, and questions are identical. On a computer, you type your answers with a visible word counter and countdown timer."
              },
              {
                q: "5. How many words should I write in IELTS Task 1?",
                a: "You must write a minimum of 150 words. A safe target is approximately 170 to 190 words."
              },
              {
                q: "6. How many words should I write in IELTS Task 2?",
                a: "You must write a minimum of 250 words. An ideal length is between 270 and 290 words."
              },
              {
                q: "7. How is IELTS Writing scored?",
                a: "Responses are graded by certified examiners across 4 criteria: Task Achievement/Response (25%), Coherence and Cohesion (25%), Lexical Resource (25%), and Grammatical Range and Accuracy (25%)."
              },
              {
                q: "8. Can I use American spelling in IELTS Writing?",
                a: "Yes. Both British and American English spellings are accepted (e.g. 'color' or 'colour', 'organize' or 'organise'), provided you remain consistent throughout your response."
              },
              {
                q: "9. Should I write Task 1 or Task 2 first?",
                a: "You can write in whichever order you prefer. Because Task 2 carries double the weight, some candidates write Task 2 first while their concentration is highest."
              },
              {
                q: "10. How can I improve my IELTS Writing band score?",
                a: "Focus on understanding question requirements, planning cohesive paragraphs, avoiding repetition with precise collocations, and getting feedback on grammar errors."
              }
            ].map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#171717]">{faq.q}</span>
                  {expandedFaqIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#B5121B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {expandedFaqIndex === idx && (
                  <div className="p-4 pt-0 text-xs text-[#5F6368] leading-relaxed border-t border-[#EAEAEA] bg-[#FFF7F7]/30 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 16: INTERNAL SEBS RESOURCE LINKS */}
      <section id="resources" className="py-16 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#B5121B]">
              Comprehensive Curriculum
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              Continue Your IELTS Preparation
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] font-medium">
              Explore dedicated modules across all four IELTS test skills.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            
            <Link
              to="/courses"
              className="p-5 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] hover:border-[#B5121B]/30 transition-all space-y-2 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#171717] group-hover:text-[#B5121B]">IELTS Speaking Studio</span>
                <ArrowRight className="w-4 h-4 text-[#B5121B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#5F6368]">
                Practice Part 1, Part 2 Cue Cards with 60-second timers, and Part 3 abstract discussions.
              </p>
            </Link>

            <Link
              to="/courses"
              className="p-5 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] hover:border-[#B5121B]/30 transition-all space-y-2 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#171717] group-hover:text-[#B5121B]">IELTS Reading Lab</span>
                <ArrowRight className="w-4 h-4 text-[#B5121B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#5F6368]">
                Master True/False/Not Given, Headings, and passage skimming strategies.
              </p>
            </Link>

            <Link
              to="/courses"
              className="p-5 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] hover:border-[#B5121B]/30 transition-all space-y-2 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#171717] group-hover:text-[#B5121B]">IELTS Listening Suite</span>
                <ArrowRight className="w-4 h-4 text-[#B5121B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#5F6368]">
                Timed audio test simulations with British, Australian, and American accents.
              </p>
            </Link>

            <Link
              to="/mock-tests"
              className="p-5 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] hover:border-[#B5121B]/30 transition-all space-y-2 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#171717] group-hover:text-[#B5121B]">Official Mock Tests</span>
                <ArrowRight className="w-4 h-4 text-[#B5121B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#5F6368]">
                Take full-length computer-delivered test simulations with instant scoring.
              </p>
            </Link>

            <Link
              to="/dashboard/writing"
              className="p-5 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] hover:border-[#B5121B]/30 transition-all space-y-2 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#171717] group-hover:text-[#B5121B]">AI Writing Evaluator</span>
                <ArrowRight className="w-4 h-4 text-[#B5121B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#5F6368]">
                Get immediate band score breakdowns and sentence-level corrections.
              </p>
            </Link>

            <Link
              to="/courses"
              className="p-5 rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] hover:border-[#B5121B]/30 transition-all space-y-2 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#171717] group-hover:text-[#B5121B]">Comprehensive Courses</span>
                <ArrowRight className="w-4 h-4 text-[#B5121B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#5F6368]">
                Explore structured preparation packages curated by Syed Ejaz Bukhari.
              </p>
            </Link>

          </div>
        </div>
      </section>

      {/* SECTION 17: SYED EJAZ BUKHARI INSTRUCTOR AUTHORITY */}
      <section className="py-16 bg-[#FFF7F7] border-b border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 border border-[#EAEAEA] shadow-sm text-left space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-[#FFF1F2] border border-[#B5121B]/20 text-[#B5121B] flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
                SEB
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#B5121B]">
                  Instructor Authority & Legacy
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#171717]">
                  Learn IELTS Writing With Syed Ejaz Bukhari
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6368] leading-relaxed font-normal">
                  "SEB's Institute combines structured IELTS preparation, live instruction, computer-delivered practice, and AI-assisted feedback to help candidates identify weaknesses and improve their performance."
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#EAEAEA] text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-[#171717]">Writing Expertise</strong>
                <span className="text-[11px] text-slate-500">Over 3 decades of pedagogical excellence.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-[#171717]">Live Classrooms</strong>
                <span className="text-[11px] text-slate-500">Interactive live workshops and direct guidance.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-[#171717]">AI Diagnostic Suite</strong>
                <span className="text-[11px] text-slate-500">Instant feedback powered by IELTS band criteria.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 18: FINAL HIGH-CONVERSION CTA */}
      <section className="py-20 bg-[#B5121B] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-white/80 bg-white/10 px-3.5 py-1 rounded-full border border-white/20">
            Start Today
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Improve Your IELTS Writing Score?
          </h2>
          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-normal">
            Practice Task 1 and Task 2, understand your weaknesses, and prepare for the computer-delivered IELTS experience with SEB's Institute.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              to="/dashboard/writing"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#B5121B] font-black text-sm shadow-xl transition-all cursor-pointer"
            >
              START FREE WRITING PRACTICE
            </Link>

            <Link
              to="/mock-tests"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#B5121B] hover:bg-[#D71920] border-2 border-white text-white font-black text-sm transition-all cursor-pointer"
            >
              TAKE FREE IELTS TEST
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
