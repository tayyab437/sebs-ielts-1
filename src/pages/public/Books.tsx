import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Search, 
  Download, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Star, 
  Filter, 
  Headphones, 
  FileText, 
  GraduationCap, 
  Layers, 
  Flame, 
  Award,
  ChevronRight,
  BookMarked,
  Eye,
  Share2,
  X,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface BookItem {
  id: string;
  title: string;
  subtitle: string;
  series: string;
  bookNumber?: number;
  category: "cambridge" | "academic" | "general" | "vocabulary" | "guide";
  examType: "Academic & General" | "Academic Only" | "General Training Only" | "Skills & Vocab";
  year: string;
  rating: number;
  reviewsCount: number;
  badge?: string;
  badgeColor?: string;
  coverGradient: string;
  coverImage?: string;
  publisher: string;
  pages: number;
  audioIncluded: boolean;
  testsCount: number;
  description: string;
  features: string[];
  testsBreakdown: {
    testNumber: number;
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
    route: string;
  }[];
  downloadUrl?: string;
}

const BOOKS_DATA: BookItem[] = [
  {
    id: "cambridge-19-ac",
    title: "Cambridge IELTS 19 Academic",
    subtitle: "Authentic Examination Papers with Answers & Audio",
    series: "Cambridge Official Series",
    bookNumber: 19,
    category: "cambridge",
    examType: "Academic Only",
    year: "2024-2025",
    rating: 4.9,
    reviewsCount: 3840,
    badge: "Latest 2024/25 Edition",
    badgeColor: "bg-rose-500 text-white",
    coverGradient: "from-blue-700 via-indigo-800 to-slate-900",
    publisher: "Cambridge University Press & Assessment",
    pages: 184,
    audioIncluded: true,
    testsCount: 4,
    description: "The newest authentic IELTS Academic practice tests from Cambridge. Contains four complete examination papers with audios, sample answers, and detailed examiner scores.",
    features: [
      "4 Authentic Full Academic Mock Exams",
      "Official Audio Transcripts with British & Aussie Accents",
      "Model Band 9 Writing Task 1 & 2 Scripts",
      "Step-by-step scoring sheets & answer keys"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Section 1-4 Complete Audio", reading: "Passages 1-3 Academic", writing: "Bar Chart + Opinion Essay", speaking: "Parts 1, 2, 3 Cue Cards", route: "/courses" },
      { testNumber: 2, listening: "Section 1-4 Complete Audio", reading: "Passages 1-3 Academic", writing: "Process Diagram + Discussion", speaking: "Parts 1, 2, 3 Cue Cards", route: "/courses" },
      { testNumber: 3, listening: "Section 1-4 Complete Audio", reading: "Passages 1-3 Academic", writing: "Line Graph + Problem/Solution", speaking: "Parts 1, 2, 3 Cue Cards", route: "/courses" },
      { testNumber: 4, listening: "Section 1-4 Complete Audio", reading: "Passages 1-3 Academic", writing: "Map Comparison + Advantage/Disadvantage", speaking: "Parts 1, 2, 3 Cue Cards", route: "/courses" },
    ]
  },
  {
    id: "cambridge-19-gt",
    title: "Cambridge IELTS 19 General Training",
    subtitle: "Official Practice Papers for Immigration & Work Visas",
    series: "Cambridge Official Series",
    bookNumber: 19,
    category: "general",
    examType: "General Training Only",
    year: "2024-2025",
    rating: 4.9,
    reviewsCount: 2950,
    badge: "Hot for Express Entry",
    badgeColor: "bg-emerald-600 text-white",
    coverGradient: "from-emerald-700 via-teal-800 to-slate-900",
    publisher: "Cambridge University Press & Assessment",
    pages: 176,
    audioIncluded: true,
    testsCount: 4,
    description: "Authentic IELTS General Training practice papers tailored for candidates aiming for CLB 9/10 in Canada Express Entry, Australian PR, and UK Skilled Worker visas.",
    features: [
      "4 Full General Training Tests with workplace texts",
      "Section 1 & 2 Social/Workplace Reading Passages",
      "Task 1 Formal, Semi-formal, and Informal Letters",
      "Real-world immigration scoring benchmarks"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Authentic Audio Track 1", reading: "Section 1-3 GT Passages", writing: "Formal Letter + Essay", speaking: "Parts 1-3 Drills", route: "/courses" },
      { testNumber: 2, listening: "Authentic Audio Track 2", reading: "Section 1-3 GT Passages", writing: "Informal Letter + Essay", speaking: "Parts 1-3 Drills", route: "/courses" },
      { testNumber: 3, listening: "Authentic Audio Track 3", reading: "Section 1-3 GT Passages", writing: "Semi-formal Letter + Essay", speaking: "Parts 1-3 Drills", route: "/courses" },
      { testNumber: 4, listening: "Authentic Audio Track 4", reading: "Section 1-3 GT Passages", writing: "Formal Letter + Essay", speaking: "Parts 1-3 Drills", route: "/courses" },
    ]
  },
  {
    id: "cambridge-18-ac",
    title: "Cambridge IELTS 18 Academic",
    subtitle: "Authentic Practice Tests with Full Answer Key",
    series: "Cambridge Official Series",
    bookNumber: 18,
    category: "cambridge",
    examType: "Academic Only",
    year: "2023",
    rating: 4.8,
    reviewsCount: 4210,
    badge: "Most Popular",
    badgeColor: "bg-blue-600 text-white",
    coverGradient: "from-sky-700 via-blue-800 to-indigo-950",
    publisher: "Cambridge English Language Assessment",
    pages: 180,
    audioIncluded: true,
    testsCount: 4,
    description: "Widely regarded as the golden standard for university admissions test preparation. Features detailed answer explanations and authentic examiner comments.",
    features: [
      "Authentic Cambridge Examination material",
      "Detailed examiner analysis on Band 7-9 sample responses",
      "Audio files downloadable and streamable online",
      "Complete IELTS academic reading answer keys"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "4 Audio Sections", reading: "3 Long Academic Texts", writing: "Pie Charts + Essay", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 2, listening: "4 Audio Sections", reading: "3 Long Academic Texts", writing: "Table + Argument", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 3, listening: "4 Audio Sections", reading: "3 Long Academic Texts", writing: "Multiple Graphs + Discussion", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 4, listening: "4 Audio Sections", reading: "3 Long Academic Texts", writing: "Process Map + Essay", speaking: "Part 1-3", route: "/courses" },
    ]
  },
  {
    id: "cambridge-18-gt",
    title: "Cambridge IELTS 18 General Training",
    subtitle: "Authentic Exam Tests for Work & PR Candidates",
    series: "Cambridge Official Series",
    bookNumber: 18,
    category: "general",
    examType: "General Training Only",
    year: "2023",
    rating: 4.8,
    reviewsCount: 3120,
    coverGradient: "from-teal-700 via-cyan-800 to-slate-950",
    publisher: "Cambridge English Language Assessment",
    pages: 172,
    audioIncluded: true,
    testsCount: 4,
    description: "Comprehensive General Training book designed specifically for work visa, immigration, and secondary education IELTS applicants.",
    features: [
      "4 Complete GT Examination Papers",
      "Model Letters for Task 1 with Band 8.5 structures",
      "General reading passages on employment & accommodation",
      "Full audio listening tracks and tapescripts"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Audio Track 1", reading: "Notices & Ads + Section 3", writing: "Complaint Letter + Essay", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 2, listening: "Audio Track 2", reading: "Workplace Guidelines + Section 3", writing: "Request Letter + Essay", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 3, listening: "Audio Track 3", reading: "Training Handbooks + Section 3", writing: "Apology Letter + Essay", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 4, listening: "Audio Track 4", reading: "Staff Manuals + Section 3", writing: "Invitation Letter + Essay", speaking: "Part 1-3", route: "/courses" },
    ]
  },
  {
    id: "official-cambridge-guide",
    title: "The Official Cambridge Guide to IELTS",
    subtitle: "For Academic & General Training — Complete Study Blueprint",
    series: "Official Guide",
    category: "guide",
    examType: "Academic & General",
    year: "Comprehensive Edition",
    rating: 5.0,
    reviewsCount: 6890,
    badge: "Official Best Seller",
    badgeColor: "bg-amber-500 text-slate-950 font-bold",
    coverGradient: "from-amber-600 via-orange-700 to-slate-900",
    publisher: "Cambridge University Press",
    pages: 402,
    audioIncluded: true,
    testsCount: 8,
    description: "The definitive guide written by IELTS test writers. Covers all 4 skills with step-by-step strategies, video masterclass insights, plus 8 full-length practice tests (7 Academic, 1 General Training).",
    features: [
      "8 Full-Length Authentic Practice Tests",
      "Step-by-step strategy for every single question type",
      "Speaking test video analysis and band breakdowns",
      "Comprehensive answer explanations with test-taker tips"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Test 1 Audio", reading: "Academic Test 1", writing: "Task 1 & 2", speaking: "Official Drill", route: "/courses" },
      { testNumber: 2, listening: "Test 2 Audio", reading: "Academic Test 2", writing: "Task 1 & 2", speaking: "Official Drill", route: "/courses" },
      { testNumber: 3, listening: "Test 3 Audio", reading: "Academic Test 3", writing: "Task 1 & 2", speaking: "Official Drill", route: "/courses" },
      { testNumber: 4, listening: "Test 4 Audio", reading: "Academic Test 4", writing: "Task 1 & 2", speaking: "Official Drill", route: "/courses" },
    ]
  },
  {
    id: "ielts-vocab-band9",
    title: "SEB's Band 9 Master Vocabulary & Collocations",
    subtitle: "By Syed Ejaz Bukhari (Cambridge CELTA)",
    series: "SEB Master Series",
    category: "vocabulary",
    examType: "Skills & Vocab",
    year: "2025 Masterclass",
    rating: 5.0,
    reviewsCount: 5120,
    badge: "SEB Signature Edition",
    badgeColor: "bg-purple-600 text-white",
    coverGradient: "from-purple-800 via-indigo-900 to-slate-950",
    publisher: "SEB's English & IELTS Academy",
    pages: 220,
    audioIncluded: true,
    testsCount: 20,
    description: "Curated by master trainer Syed Ejaz Bukhari. Features 1,200+ high-impact academic collocations, topic-based lexical banks, and idiomatic expressions guaranteed to elevate your Lexical Resource score to Band 8.5-9.0.",
    features: [
      "Topic-by-Topic Vocabulary: Environment, Tech, Global Economy, AI, Health",
      "High-scoring collocations & transition linkers",
      "Common candidate errors & how to avoid Band 6 clichés",
      "Audio pronunciation for every advanced word"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Lexical Audio Track 1", reading: "Collocation Drills", writing: "Band 9 Vocabulary in Action", speaking: "Speaking Phrases", route: "/courses" },
      { testNumber: 2, listening: "Lexical Audio Track 2", reading: "Idiomatic Drills", writing: "Academic Connectors", speaking: "Fluency Structures", route: "/courses" },
    ]
  },
  {
    id: "cambridge-17-ac",
    title: "Cambridge IELTS 17 Academic",
    subtitle: "Authentic Practice Tests with Audio & Model Answers",
    series: "Cambridge Official Series",
    bookNumber: 17,
    category: "cambridge",
    examType: "Academic Only",
    year: "2022",
    rating: 4.8,
    reviewsCount: 3890,
    coverGradient: "from-violet-700 via-indigo-800 to-slate-900",
    publisher: "Cambridge University Press",
    pages: 178,
    audioIncluded: true,
    testsCount: 4,
    description: "4 authentic examination papers from Cambridge Assessment English. Perfect for practicing time management and understanding tricky question traps.",
    features: [
      "4 Complete Academic Tests with high-difficulty passages",
      "True / False / Not Given & Heading Matchers focus",
      "Audio transcripts for full listening papers",
      "Model sample essays with examiner scores"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Full Audio Track", reading: "Academic Passages 1-3", writing: "Task 1 & Task 2", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 2, listening: "Full Audio Track", reading: "Academic Passages 1-3", writing: "Task 1 & Task 2", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 3, listening: "Full Audio Track", reading: "Academic Passages 1-3", writing: "Task 1 & Task 2", speaking: "Part 1-3", route: "/courses" },
      { testNumber: 4, listening: "Full Audio Track", reading: "Academic Passages 1-3", writing: "Task 1 & Task 2", speaking: "Part 1-3", route: "/courses" },
    ]
  },
  {
    id: "ielts-grammar-band9",
    title: "Cambridge Grammar for IELTS with Answers",
    subtitle: "Grammar Reference & Practice for Band 7+",
    series: "Grammar & Structure",
    category: "vocabulary",
    examType: "Skills & Vocab",
    year: "Cambridge Essential",
    rating: 4.9,
    reviewsCount: 4400,
    badge: "Must Read",
    badgeColor: "bg-blue-600 text-white",
    coverGradient: "from-cyan-800 via-blue-900 to-slate-950",
    publisher: "Cambridge University Press",
    pages: 258,
    audioIncluded: true,
    testsCount: 25,
    description: "Covers all the essential grammar required for the IELTS exam while simultaneously providing genuine IELTS test practice in all four papers.",
    features: [
      "Complex sentence structures (conditionals, inversions, cleft sentences)",
      "Grammar presented in real listening and reading contexts",
      "Helpful tips to avoid grammatical errors in Writing & Speaking",
      "Audio listening activities integrated into every unit"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Grammar in Context Audio", reading: "Passage Analysis", writing: "Complex Structures Task", speaking: "Grammar Range Drill", route: "/courses" },
    ]
  },
  {
    id: "cambridge-16-ac",
    title: "Cambridge IELTS 16 Academic",
    subtitle: "Authentic Examination Papers",
    series: "Cambridge Official Series",
    bookNumber: 16,
    category: "cambridge",
    examType: "Academic Only",
    year: "2021",
    rating: 4.7,
    reviewsCount: 3500,
    coverGradient: "from-slate-800 via-blue-950 to-slate-900",
    publisher: "Cambridge Assessment English",
    pages: 176,
    audioIncluded: true,
    testsCount: 4,
    description: "Authentic IELTS Academic examination tests for standard practice and baseline benchmark scoring.",
    features: [
      "4 Full Academic Tests",
      "High quality audio and transcripts",
      "Answer keys with score convertor tables",
      "Writing sample answers with bands"
    ],
    testsBreakdown: [
      { testNumber: 1, listening: "Audio 1", reading: "Passages 1-3", writing: "Task 1 & 2", speaking: "Parts 1-3", route: "/courses" },
      { testNumber: 2, listening: "Audio 2", reading: "Passages 1-3", writing: "Task 1 & 2", speaking: "Parts 1-3", route: "/courses" },
    ]
  }
];

export interface BooksPageProps {
  isDashboardMode?: boolean;
}

export default function BooksPage({ isDashboardMode = false }: BooksPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [activeBookModal, setActiveBookModal] = useState<BookItem | null>(null);

  const categories = [
    { id: "all", label: "All Books & Materials", count: BOOKS_DATA.length },
    { id: "cambridge", label: "Cambridge 1-19 Series", count: BOOKS_DATA.filter(b => b.category === "cambridge").length },
    { id: "academic", label: "Academic (AC)", count: BOOKS_DATA.filter(b => b.examType.includes("Academic")).length },
    { id: "general", label: "General Training (GT)", count: BOOKS_DATA.filter(b => b.examType.includes("General")).length },
    { id: "vocabulary", label: "Vocabulary & Grammar", count: BOOKS_DATA.filter(b => b.category === "vocabulary").length },
    { id: "guide", label: "Official Guides", count: BOOKS_DATA.filter(b => b.category === "guide").length },
  ];

  const filteredBooks = useMemo(() => {
    return BOOKS_DATA.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.series.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === "all" ||
        (selectedCategory === "academic" && book.examType.includes("Academic")) ||
        (selectedCategory === "general" && book.examType.includes("General")) ||
        book.category === selectedCategory;

      const matchesExamType = 
        selectedExamType === "all" ||
        book.examType.toLowerCase().includes(selectedExamType.toLowerCase());

      return matchesSearch && matchesCategory && matchesExamType;
    });
  }, [searchQuery, selectedCategory, selectedExamType]);

  const handleDownload = (book: BookItem) => {
    toast.success(`Preparing "${book.title}" Official Study PDF Package!`, {
      description: "Includes official practice questions, audios & Band 9 solution keys."
    });
  };

  const handleShare = (book: BookItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + "/books#" + book.id);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 ${isDashboardMode ? "p-4 sm:p-6" : "pb-20"}`}>
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white pt-10 pb-16 sm:pt-14 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-semibold mb-4 backdrop-blur-md">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Official Cambridge & SEB IELTS Library</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl text-white">
            Explore IELTS Books & <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">Official Practice Papers</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Access the complete collection of authentic Cambridge IELTS 1–19 practice books, official study guides, vocabulary banks, and interactive online test papers.
          </p>

          {/* Quick Action Search Bar */}
          <div className="mt-8 w-full max-w-2xl">
            <div className="relative flex items-center shadow-2xl rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 p-1.5 focus-within:border-indigo-400 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Cambridge 1-19, General Training, Academic, Vocabulary..."
                className="w-full bg-transparent border-0 px-3 py-2.5 text-sm sm:text-base text-white placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 mr-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Button
                type="button"
                onClick={() => {}}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 sm:px-6 rounded-xl shrink-0"
              >
                Search
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Category Pills & Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-white dark:bg-[#161b22] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/5"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick CTA to Courses */}
          <div className="shrink-0 flex items-center gap-3">
            <Link
              to="/courses"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
            >
              <span>Practice in Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between py-5">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredBooks.length}</strong> official books & practice packages
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Format:</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
              Interactive + PDF + Audio
            </span>
          </div>
        </div>

        {/* BOOKS GRID */}
        {filteredBooks.length === 0 ? (
          <div className="my-16 text-center bg-white dark:bg-[#161b22] rounded-3xl p-12 border border-slate-200 dark:border-white/5 shadow-sm max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No books found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try searching with a different keyword or resetting your filter criteria.</p>
            <Button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                id={`book-card-${book.id}`}
                className="group bg-white dark:bg-[#161b22] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                
                {/* Book Header / Cover Area */}
                <div>
                  <div className={`relative h-48 bg-gradient-to-br ${book.coverGradient} p-5 flex flex-col justify-between overflow-hidden`}>
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Top Badges */}
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white/90 text-[11px] font-bold tracking-wider uppercase border border-white/10">
                        {book.series}
                      </span>
                      {book.badge && (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-sm ${book.badgeColor || "bg-rose-600 text-white"}`}>
                          {book.badge}
                        </span>
                      )}
                    </div>

                    {/* Cover Center Content */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-white/80 text-xs font-semibold mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>{book.publisher}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
                        {book.title}
                      </h3>
                      <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                        {book.subtitle}
                      </p>
                    </div>

                    {/* Bottom Metadata Bar on Cover */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-white/80 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-white">{book.rating}</span>
                        <span>({book.reviewsCount.toLocaleString()})</span>
                      </div>
                      <span className="bg-white/15 px-2 py-0.5 rounded text-white font-semibold">
                        {book.examType}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3.5">
                    
                    {/* Key Specs Pills */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Tests</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{book.testsCount} Full Tests</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Audio</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">Included</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Answers</span>
                        <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">Band 9 Key</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {book.description}
                    </p>

                    {/* Feature Highlights */}
                    <div className="space-y-1.5 pt-1">
                      {book.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 pt-0 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveBookModal(book)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Tests</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(book)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Get PDF</span>
                    </button>
                  </div>

                  {/* Primary CTA: Launch interactive tests in Courses */}
                  <button
                    type="button"
                    onClick={() => navigate("/courses")}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 hover:from-blue-700 hover:via-sky-600 hover:to-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <span>Practice Tests in Courses</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* BOTTOM PROMO CARD */}
        <section className="mt-14 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-800/50">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />
          
          <div className="max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Video Masterclasses Available</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Want Syed Ejaz Bukhari to solve these books live with you?
            </h2>
            <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
              Step into the interactive Course Player to watch video walk-throughs of every Cambridge reading passage, listen to authentic audio tracks, and get AI-powered evaluation for your writing tasks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/courses")}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-indigo-950" />
              <span>Launch Course Player</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/mock-tests")}
              className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
            >
              <span>Take Mock Test</span>
            </button>
          </div>
        </section>

      </main>

      {/* BOOK DETAILS / TEST BREAKDOWN MODAL */}
      {activeBookModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${activeBookModal.coverGradient} text-white flex items-start justify-between relative`}>
              <div>
                <span className="px-2.5 py-0.5 rounded bg-black/40 text-xs font-bold uppercase tracking-wider">
                  {activeBookModal.series}
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-2">
                  {activeBookModal.title}
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  {activeBookModal.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveBookModal(null)}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-white/5">
                <span>Publisher: <strong className="text-slate-800 dark:text-white">{activeBookModal.publisher}</strong></span>
                <span>Category: <strong className="text-slate-800 dark:text-white">{activeBookModal.examType}</strong></span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-indigo-500" />
                <span>Practice Tests in this Book</span>
              </h4>

              <div className="space-y-2.5">
                {activeBookModal.testsBreakdown.map((test) => (
                  <div
                    key={test.testNumber}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
                          {test.testNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                          Test {test.testNumber} Complete Mock Paper
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pl-8">
                        <span>🎧 {test.listening}</span>
                        <span>📖 {test.reading}</span>
                        <span>✍️ {test.writing}</span>
                        <span>🎙️ {test.speaking}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveBookModal(null);
                        navigate("/courses");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
                    >
                      <span>Start Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Tip:</strong> All test questions and audio are mapped directly into our live courses player and mock test rooms for real-time practice with timer simulations.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-[#111418] border-t border-slate-200 dark:border-white/5 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => handleDownload(activeBookModal)}
                className="text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF
              </Button>
              <Button
                onClick={() => {
                  setActiveBookModal(null);
                  navigate("/courses");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Open in Courses Player
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
