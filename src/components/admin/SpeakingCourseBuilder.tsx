import React, { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Clock,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Award,
  Layers,
  MessageSquare,
  Square
} from "lucide-react";

interface SpeakingPart1Question {
  id: string;
  topic: string;
  question: string;
  model_answer: string;
  key_vocab: string;
}

interface SpeakingPart2Data {
  topic_title: string;
  cue_bullets: string[];
  preparation_seconds: number;
  speaking_seconds: number;
  model_response: string;
  advanced_collocations: string[];
}

interface SpeakingPart3Question {
  id: string;
  question: string;
  sub_theme: string;
  sample_points: string;
  linking_phrases: string;
}

const PRESET_SPEAKING_TESTS = [
  {
    id: "preset-speaking-1",
    title: "IELTS Speaking Simulation: Technology, AI & Future Careers",
    description: "Complete 3-part computer-simulated IELTS Speaking test covering digital habits, automated technology cue card, and societal workforce transformations.",
    level: "8.0",
    difficulty: "Advanced",
    type: "Academic",
    access_tier: "Free Trial",
    test_number: "1",
    examiner_accent: "British Senior Examiner",
    part1_questions: [
      {
        id: "p1-1",
        topic: "Daily Technology & Smart Devices",
        question: "How often do you use digital devices for your work or studies?",
        model_answer: "To be completely candid, digital technology is inextricably linked with my daily workflow. I rely on my laptop for scholarly research, data processing, and collaborative communications almost continuously throughout the working day.",
        key_vocab: "inextricably linked, daily workflow, collaborative communications"
      },
      {
        id: "p1-2",
        topic: "Daily Technology & Smart Devices",
        question: "Do you prefer reading physical books or using digital e-readers?",
        model_answer: "While there is an undeniable tactile pleasure associated with turning physical pages, I predominantly opt for digital formats owing to their unparalleled portability and instant annotation capabilities.",
        key_vocab: "tactile pleasure, predominantly opt for, unparalleled portability"
      },
      {
        id: "p1-3",
        topic: "Hometown & Environment",
        question: "Has your hometown changed significantly over the past decade?",
        model_answer: "Indeed, it has undergone a remarkable metamorphosis. Ten years ago it was relatively tranquil, whereas today high-density residential developments and expanded transit arteries dominate the urban landscape.",
        key_vocab: "remarkable metamorphosis, tranquil, high-density residential developments"
      }
    ],
    part2: {
      topic_title: "Describe an artificial intelligence tool or piece of modern technology that you find exceptionally useful.",
      cue_bullets: [
        "What this technology is and when you first discovered it",
        "How you currently utilize it in your daily life or academic pursuits",
        "What specific advantages it offers over conventional methods",
        "And explain why you consider this technology indispensable for your future"
      ],
      preparation_seconds: 60,
      speaking_seconds: 120,
      model_response: "I would like to speak about a generative AI coding and research assistant that I integrated into my academic workflow roughly eight months ago. Initially, I approached large language models with a healthy degree of skepticism; however, once I mastered prompt refinement, the tool fundamentally accelerated my productivity. Unlike conventional search engines where one must sift through disparate hyperlinks, this interface synthesizes complex documentation into concise, actionable summaries. I consider it indispensable because it frees up cognitive bandwidth, enabling me to focus on creative problem-solving rather than rote information retrieval.",
      advanced_collocations: ["generative AI assistant", "healthy degree of skepticism", "prompt refinement", "cognitive bandwidth", "rote information retrieval"]
    },
    part3_questions: [
      {
        id: "p3-1",
        sub_theme: "Impact of Automation on Employment",
        question: "To what extent do you believe automation will displace conventional employment opportunities in the coming decades?",
        sample_points: "Discuss technological unemployment versus the emergence of novel industries (prompt engineers, algorithmic auditors).",
        linking_phrases: "On the one hand... nevertheless... looking at the broader macroeconomic trajectory..."
      },
      {
        id: "p3-2",
        sub_theme: "Human vs Machine Judgment",
        question: "Are there certain professions where human empathy and intuition can never be replicated by artificial systems?",
        sample_points: "Healthcare, psychological counseling, and early childhood education require nuanced emotional intelligence.",
        linking_phrases: "Fundamentally speaking... it is difficult to fathom... emotional nuances..."
      }
    ]
  },
  {
    id: "preset-speaking-2",
    title: "IELTS Speaking Practice: Environment, Travel & Global Tourism",
    description: "Full IELTS speaking examination exploring local tourism, memorable travel destinations cue card, and sustainable ecotourism debates.",
    level: "7.5",
    difficulty: "Intermediate",
    type: "General Training",
    access_tier: "Starter",
    test_number: "2",
    examiner_accent: "Australian Examiner",
    part1_questions: [
      {
        id: "p2-1",
        topic: "Travel & Vacations",
        question: "Do you prefer traveling alone or with a group of friends?",
        model_answer: "It truly depends on the objective of the excursion. Solo travel allows for spontaneous decision-making and profound introspection, whereas group expeditions foster camaraderie and shared memories.",
        key_vocab: "spontaneous decision-making, profound introspection, foster camaraderie"
      },
      {
        id: "p2-2",
        topic: "Nature & Parks",
        question: "How often do you visit parks or natural reserves in your free time?",
        model_answer: "I endeavor to visit our local botanical sanctuary at least once a week to disconnect from digital screens and immerse myself in natural greenery.",
        key_vocab: "endeavor to visit, disconnect from digital screens, immerse myself"
      }
    ],
    part2: {
      topic_title: "Describe a memorable journey you took to a picturesque natural location.",
      cue_bullets: [
        "Where you went and who accompanied you",
        "What the landscape and scenery looked like",
        "What activities you participated in during the trip",
        "And explain why this particular journey left such a lasting impression on you"
      ],
      preparation_seconds: 60,
      speaking_seconds: 120,
      model_response: "I would like to recount an exhilarating expedition to the rugged alpine highlands of Northern Pakistan. The dramatic vistas of snow-capped peaks juxtaposed against turquoise glacial lakes were utterly mesmerizing. What made the trip truly unforgettable was hiking to the base camp at sunrise, surrounded by untouched natural tranquility.",
      advanced_collocations: ["exhilarating expedition", "rugged alpine highlands", "dramatic vistas", "juxtaposed against", "untouched natural tranquility"]
    },
    part3_questions: [
      {
        id: "p2-3-1",
        sub_theme: "Sustainable Ecotourism",
        question: "How can national governments balance tourism revenue with environmental conservation in delicate ecosystems?",
        sample_points: "Implementing strict visitor quotas, tourist carbon taxes, and mandatory guided eco-trails.",
        linking_phrases: "It is a delicate balancing act... by enforcing stringent regulations..."
      }
    ]
  }
];

export default function SpeakingCourseBuilder({ onCourseSaved }: { onCourseSaved?: () => void }) {
  // General Specifications
  const [title, setTitle] = useState(PRESET_SPEAKING_TESTS[0].title);
  const [description, setDescription] = useState(PRESET_SPEAKING_TESTS[0].description);
  const [level, setLevel] = useState("8.0");
  const [type, setType] = useState("Academic");
  const [difficulty, setDifficulty] = useState("Advanced");
  const [accessTier, setAccessTier] = useState("Free Trial");
  const [testNumber, setTestNumber] = useState("1");
  const [examinerAccent, setExaminerAccent] = useState("British Senior Examiner");
  const [duration, setDuration] = useState("11-14 mins");
  const [status, setStatus] = useState("Published");

  // Part 1 Questions State
  const [part1Questions, setPart1Questions] = useState<SpeakingPart1Question[]>(PRESET_SPEAKING_TESTS[0].part1_questions);

  // Part 2 Cue Card State
  const [part2Data, setPart2Data] = useState<SpeakingPart2Data>(PRESET_SPEAKING_TESTS[0].part2);

  // Part 3 Questions State
  const [part3Questions, setPart3Questions] = useState<SpeakingPart3Question[]>(PRESET_SPEAKING_TESTS[0].part3_questions);

  // Active Part Tab inside builder
  const [activePartTab, setActivePartTab] = useState<1 | 2 | 3>(1);

  // Interactive Live Recording Simulator State
  const [isRecordingSim, setIsRecordingSim] = useState(false);
  const [prepTimer, setPrepTimer] = useState(60);
  const [isPrepping, setIsPrepping] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let timerId: any;
    if (isPrepping && prepTimer > 0) {
      timerId = setInterval(() => {
        setPrepTimer(prev => prev - 1);
      }, 1000);
    } else if (prepTimer === 0 && isPrepping) {
      setIsPrepping(false);
      setIsRecordingSim(true);
    }
    return () => clearInterval(timerId);
  }, [isPrepping, prepTimer]);

  const handleLoadPreset = (presetId: string) => {
    const found = PRESET_SPEAKING_TESTS.find(p => p.id === presetId);
    if (found) {
      setTitle(found.title);
      setDescription(found.description);
      setLevel(found.level);
      setDifficulty(found.difficulty);
      setType(found.type);
      setAccessTier(found.access_tier);
      setTestNumber(found.test_number);
      setExaminerAccent(found.examiner_accent);
      setPart1Questions(found.part1_questions);
      setPart2Data(found.part2);
      setPart3Questions(found.part3_questions);
      setSaveSuccess(false);
    }
  };

  const handleAddPart1Question = () => {
    const newQ: SpeakingPart1Question = {
      id: `p1-${Date.now()}`,
      topic: "Personal Experience & Preferences",
      question: "What is your favorite time of the day to relax or study?",
      model_answer: "I am unequivocally a morning person. The initial hours of the dawn offer an atmosphere of serenity before the hustle and bustle begins.",
      key_vocab: "unequivocally, serenity, hustle and bustle"
    };
    setPart1Questions([...part1Questions, newQ]);
  };

  const handleRemovePart1Question = (id: string) => {
    setPart1Questions(part1Questions.filter(q => q.id !== id));
  };

  const handleAddPart3Question = () => {
    const newQ: SpeakingPart3Question = {
      id: `p3-${Date.now()}`,
      question: "How do you foresee this trend evolving over the next generation?",
      sub_theme: "Future Trajectories & Projections",
      sample_points: "Analyze technological democratization versus potential social inequalities.",
      linking_phrases: "In all likelihood... looking ahead... it remains to be seen whether..."
    };
    setPart3Questions([...part3Questions, newQ]);
  };

  const handleRemovePart3Question = (id: string) => {
    setPart3Questions(part3Questions.filter(q => q.id !== id));
  };

  const handleSaveCourse = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      const courseId = `speaking-${Date.now()}`;

      // Modules matching platform 3-part layout
      const modulesPayload = [
        {
          id: `mod-speaking-p1`,
          title: "Part 1: Introduction & Personal Interview (4-5 mins)",
          description: "Examiner asks personal questions regarding hometown, routines, technology, and preferences.",
          duration: "5 mins",
          lessons: part1Questions.map((q, idx) => ({
            id: `les-p1-${idx + 1}`,
            title: `Q${idx + 1}: ${q.question}`,
            content: `### Examiner Question\n"${q.question}"\n\n### Model Band 9 Response\n${q.model_answer}\n\n### Essential Lexical Resource\n- **Vocabulary Booster:** ${q.key_vocab}`,
            duration: "2 mins",
            completed: false,
            questions: []
          }))
        },
        {
          id: `mod-speaking-p2`,
          title: "Part 2: Long Turn Cue Card (with 1-min prep timer)",
          description: part2Data.topic_title,
          duration: "4 mins",
          lessons: [
            {
              id: `les-p2-cue-card`,
              title: "Part 2 Cue Card Topic & Guided Speaking Simulation",
              content: `### Prompt Topic\n**${part2Data.topic_title}**\n\n### You should say:\n${part2Data.cue_bullets.map(b => `- ${b}`).join("\n")}\n\n### Band 9 Model Speech\n${part2Data.model_response}\n\n### High-Scoring Collocations\n${part2Data.advanced_collocations.map(c => `- ${c}`).join("\n")}`,
              duration: "4 mins",
              completed: false,
              questions: []
            }
          ]
        },
        {
          id: `mod-speaking-p3`,
          title: "Part 3: Two-Way Abstract Discussion (4-5 mins)",
          description: "In-depth analytical discourse exploring broader societal and philosophical angles.",
          duration: "5 mins",
          lessons: part3Questions.map((q, idx) => ({
            id: `les-p3-${idx + 1}`,
            title: `Discussion Q${idx + 1}: ${q.question}`,
            content: `### Analytical Topic\n${q.sub_theme}\n\n### Examiner Question\n"${q.question}"\n\n### Key Argument Points\n${q.sample_points}\n\n### Discourse Markers & Linking\n${q.linking_phrases}`,
            duration: "2 mins",
            completed: false,
            questions: []
          }))
        }
      ];

      const payload = {
        id: courseId,
        title: title.trim() || "IELTS Speaking Studio Simulation",
        level: level || "8.0",
        type: type === "General Training" ? "General Training (GT)" : "Academic",
        difficulty: difficulty || "Advanced",
        description: description || "Authentic computer-simulated IELTS Speaking examination.",
        status: status || "Published",
        category: "Speaking Mastery",
        course_type: "Speaking Test",
        duration: duration || "11-14 mins",
        access_tier: accessTier || "Free Trial",
        test_number: testNumber || "1",
        is_mock_test: true,
        exam_category: type === "General Training" ? "General Training" : "Academic",
        audio_url: "",
        transcript_name: `Speaking Test ${testNumber} Scripts & Rubrics`,
        transcript_url: "",
        modules: modulesPayload,
        speaking_data: {
          examiner_accent: examinerAccent,
          duration,
          part1_questions: part1Questions,
          part2: part2Data,
          part3_questions: part3Questions,
          rubrics: {
            fluency_coherence: "25% - Speaking length, hesitation control, discourse markers",
            lexical_resource: "25% - Academic collocations, idiomatic expressions, precision",
            grammatical_range: "25% - Complex clauses, conditionals, passive voice structures",
            pronunciation: "25% - Word stress, intonation contours, phonological clarity"
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to Supabase
      if (supabase) {
        try {
          await supabase.from("courses").upsert([payload]);
        } catch (dbErr) {
          console.warn("Supabase upsert note:", dbErr);
        }
      }

      // Save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("mock_courses") || "[]");
        const filtered = existing.filter((c: any) => c.id !== courseId);
        localStorage.setItem("mock_courses", JSON.stringify([payload, ...filtered]));
      } catch (localErr) {
        console.warn("LocalStorage save note:", localErr);
      }

      // Trigger global event
      window.dispatchEvent(new Event("site_content_updated"));
      setSaveSuccess(true);
      if (onCourseSaved) onCourseSaved();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error("Failed to save Speaking Course:", err);
      setErrorMessage(err.message || "Failed to save course.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-none font-bold text-xs uppercase tracking-wider backdrop-blur-md">
                <Mic className="w-3.5 h-3.5 mr-1" />
                Speaking Studio & Simulation
              </Badge>
              <Badge className="bg-amber-300 text-slate-900 border-none font-black text-xs">
                AI Band 9 Speech Engine
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              IELTS Speaking Course & Simulation Studio
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm font-medium leading-relaxed">
              Build full 3-part computer-simulated and live IELTS Speaking tests. Configures Part 1 warm-ups, Part 2 Long Turn Cue Cards (with 60-second preparation timer), Part 3 deep discussions, model answers, and official IELTS band criteria.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleSaveCourse}
              disabled={isSaving}
              className="bg-white text-emerald-900 hover:bg-slate-100 font-black text-xs h-11 px-6 rounded-2xl shadow-xl transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 text-emerald-600" />
                  Publish Speaking Course
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-3 flex-wrap text-xs">
          <span className="font-black text-teal-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Load Official Presets:
          </span>
          {PRESET_SPEAKING_TESTS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleLoadPreset(p.id)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 cursor-pointer text-[11px]"
            >
              {p.title.split(":")[0]} ({p.type})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 font-bold text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Speaking course saved and published live! Students can now launch the speaking interview & cue card simulator.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Live Simulator Preview */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card 1: Course Identity */}
          <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-black italic flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                1. Speaking Course Metadata
              </CardTitle>
              <CardDescription className="text-xs">
                Platform syllabus & examiner configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Course Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., IELTS Speaking Masterclass: Technology & Careers"
                  className="rounded-xl h-10 font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Exam Type</Label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 px-3 font-bold text-xs focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Academic">Academic</option>
                    <option value="General Training">General Training</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Target Band</Label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 px-3 font-bold text-xs focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                  >
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0">Band 8.0</option>
                    <option value="8.5">Band 8.5+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Access Tier</Label>
                  <select
                    value={accessTier}
                    onChange={(e) => setAccessTier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 px-3 font-bold text-xs focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Free Trial">Free Trial</option>
                    <option value="Starter">Starter Tier</option>
                    <option value="Pro">Pro Pass</option>
                    <option value="Mastery Ultimate">Mastery Ultimate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Examiner Voice</Label>
                  <select
                    value={examinerAccent}
                    onChange={(e) => setExaminerAccent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 px-3 font-bold text-xs focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                  >
                    <option value="British Senior Examiner">British Senior Examiner</option>
                    <option value="Australian Examiner">Australian Examiner</option>
                    <option value="Canadian Examiner">Canadian Examiner</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs font-medium resize-none"
                  placeholder="Overview of speaking test coverage..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Interactive Speaking Simulator Widget */}
          <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50 dark:bg-slate-800/50">
              <CardTitle className="text-base font-black italic flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-600" />
                2. Live Interview & Prep Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Test the 60-second prep countdown and speaking recorder
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 text-center space-y-3">
                <div className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  {isPrepping ? "Preparation Countdown" : isRecordingSim ? "Recording Response..." : "Ready for Simulation"}
                </div>

                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                  {isPrepping ? (
                    <span className="text-amber-500 animate-pulse">00:{prepTimer.toString().padStart(2, "0")}</span>
                  ) : isRecordingSim ? (
                    <span className="text-rose-500 animate-pulse">01:48</span>
                  ) : (
                    "01:00"
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  {!isPrepping && !isRecordingSim ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPrepTimer(60);
                        setIsPrepping(true);
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> Start 60s Prep Timer
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsPrepping(false);
                        setIsRecordingSim(false);
                        setPrepTimer(60);
                      }}
                      className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-rose-200 text-rose-600"
                    >
                      <Square className="w-3.5 h-3.5 mr-1.5" /> Reset Simulator
                    </Button>
                  )}
                </div>
              </div>

              {/* Assessment Rubrics preview */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" /> IELTS Band 9 Scoring Breakdown:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="font-black text-primary">Fluency & Coherence:</span>
                    <p className="text-slate-500 mt-0.5">Continuous flow without noticeable strain.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="font-black text-purple-600">Lexical Resource:</span>
                    <p className="text-slate-500 mt-0.5">Flexible use of rare idioms & collocations.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="font-black text-emerald-600">Grammatical Range:</span>
                    <p className="text-slate-500 mt-0.5">Consistent accurate complex structures.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="font-black text-sky-600">Pronunciation:</span>
                    <p className="text-slate-500 mt-0.5">Effortless to understand with subtle nuance.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: 3-Part Architecture */}
        <div className="space-y-6 lg:col-span-2">
          {/* Part Switcher Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setActivePartTab(1)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activePartTab === 1
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Part 1: Introduction ({part1Questions.length} Questions)</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePartTab(2)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activePartTab === 2
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Part 2: Long Turn Cue Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePartTab(3)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activePartTab === 3
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Part 3: Discussion ({part3Questions.length} Questions)</span>
            </button>
          </div>

          {/* Part 1 Content */}
          {activePartTab === 1 && (
            <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black italic flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Part 1: Personal Interview Questions & Model Answers
                  </CardTitle>
                  <CardDescription className="text-xs">
                    4-5 minutes warm-up questions on familiar everyday topics
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPart1Question}
                  className="rounded-xl h-9 px-3 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {part1Questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-emerald-600 text-white font-black text-[11px] px-2 py-0.5">
                        Question {idx + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePart1Question(q.id)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Topic Area</Label>
                        <Input
                          value={q.topic}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPart1Questions(part1Questions.map(item => item.id === q.id ? { ...item, topic: val } : item));
                          }}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                          placeholder="E.g., Hometown, Studies, Free Time"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Key Vocabulary Booster</Label>
                        <Input
                          value={q.key_vocab}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPart1Questions(part1Questions.map(item => item.id === q.id ? { ...item, key_vocab: val } : item));
                          }}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-purple-600 dark:text-purple-400"
                          placeholder="E.g., inextricably linked, tranquility..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Examiner Question Prompt</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPart1Questions(part1Questions.map(item => item.id === q.id ? { ...item, question: val } : item));
                        }}
                        className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                        placeholder="E.g., Do you prefer reading books or watching documentaries?"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Band 9 Model Answer Transcript</Label>
                      <Textarea
                        value={q.model_answer}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPart1Questions(part1Questions.map(item => item.id === q.id ? { ...item, model_answer: val } : item));
                        }}
                        rows={3}
                        className="rounded-xl bg-white dark:bg-slate-900 text-xs font-medium resize-none leading-relaxed"
                        placeholder="Sample fluent answer with high-level grammatical structures..."
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Part 2 Content: Cue Card */}
          {activePartTab === 2 && (
            <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-black italic flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Part 2: Long Turn Cue Card Topic & Guided Bullet Points
                </CardTitle>
                <CardDescription className="text-xs">
                  Candidate receives 1 minute preparation time followed by 2 minutes uninterrupted speaking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Cue Card Main Topic</Label>
                  <Input
                    value={part2Data.topic_title}
                    onChange={(e) => setPart2Data({ ...part2Data, topic_title: e.target.value })}
                    className="rounded-xl h-10 font-bold text-xs"
                    placeholder="Describe an artificial intelligence tool or technology you find useful..."
                  />
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
                  <Label className="font-black text-[11px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    "You Should Say:" Guided Prompt Bullets
                  </Label>
                  {part2Data.cue_bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        {bIdx + 1}
                      </span>
                      <Input
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...part2Data.cue_bullets];
                          newBullets[bIdx] = e.target.value;
                          setPart2Data({ ...part2Data, cue_bullets: newBullets });
                        }}
                        className="rounded-xl h-9 bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Band 9 Masterclass Model Monologue (2-Minute Speech)</Label>
                  <Textarea
                    value={part2Data.model_response}
                    onChange={(e) => setPart2Data({ ...part2Data, model_response: e.target.value })}
                    rows={6}
                    className="rounded-xl bg-white dark:bg-slate-900 text-xs font-medium resize-none leading-relaxed"
                    placeholder="Full 2-minute monologue incorporating cohesive devices and sophisticated discourse..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Advanced Collocations & Idioms (Comma Separated)</Label>
                  <Input
                    value={part2Data.advanced_collocations.join(", ")}
                    onChange={(e) => {
                      const split = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setPart2Data({ ...part2Data, advanced_collocations: split });
                    }}
                    className="rounded-xl h-9 font-medium text-xs text-purple-600 dark:text-purple-400"
                    placeholder="E.g., cognitive bandwidth, disparate hyperlinks, fundamentally accelerated..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Part 3 Content: Deep Discussion */}
          {activePartTab === 3 && (
            <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black italic flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Part 3: Two-Way Abstract & Analytical Discussion
                  </CardTitle>
                  <CardDescription className="text-xs">
                    4-5 minutes exploring broader societal, economic, and philosophical perspectives
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPart3Question}
                  className="rounded-xl h-9 px-3 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {part3Questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-emerald-600 text-white font-black text-[11px] px-2 py-0.5">
                        Analytical Question {idx + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePart3Question(q.id)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Sub-theme</Label>
                        <Input
                          value={q.sub_theme}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPart3Questions(part3Questions.map(item => item.id === q.id ? { ...item, sub_theme: val } : item));
                          }}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                          placeholder="E.g., Impact of Automation on Employment"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Discourse Markers & Linking Phrases</Label>
                        <Input
                          value={q.linking_phrases}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPart3Questions(part3Questions.map(item => item.id === q.id ? { ...item, linking_phrases: val } : item));
                          }}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-sky-600 dark:text-sky-400"
                          placeholder="E.g., On the one hand... nevertheless..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Examiner Discussion Prompt</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPart3Questions(part3Questions.map(item => item.id === q.id ? { ...item, question: val } : item));
                        }}
                        className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                        placeholder="E.g., To what extent do you believe automation will displace jobs?"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Sample High-Scoring Argument Points</Label>
                      <Textarea
                        value={q.sample_points}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPart3Questions(part3Questions.map(item => item.id === q.id ? { ...item, sample_points: val } : item));
                        }}
                        rows={3}
                        className="rounded-xl bg-white dark:bg-slate-900 text-xs font-medium resize-none leading-relaxed"
                        placeholder="Key analytical viewpoints, counterarguments, and societal examples..."
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
