import React, { useState, useRef } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Plus,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  FileAudio,
  Layers,
  HelpCircle
} from "lucide-react";

interface ListeningQuestion {
  id: string;
  section: number; // 1, 2, 3, 4
  number: number;
  question_text: string;
  type: "fill-blank" | "multiple-choice" | "matching" | "map-labelling";
  options?: string[];
  correct_answer: string;
  acceptable_answers?: string[];
  explanation?: string;
  audio_timestamp?: string; // e.g. "02:15"
}

interface ListeningSectionInfo {
  section: number;
  title: string;
  context: string;
  speakers: string;
  start_time: string;
  end_time: string;
  transcript: string;
}

const PRESET_LISTENING_TESTS = [
  {
    id: "preset-listening-1",
    title: "Cambridge IELTS 19 Academic Listening Test 1 (Full Simulation)",
    description: "Authentic 4-section listening examination covering accommodation booking, park expansion project, psychology student project, and marine ecosystem lecture.",
    level: "7.5",
    difficulty: "Advanced",
    type: "Academic",
    access_tier: "Free Trial",
    test_number: "1",
    audio_url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    accent: "British RP",
    sections: [
      {
        section: 1,
        title: "Section 1: Student Accommodation Inquiry",
        context: "Conversation between a university housing officer and an incoming international student.",
        speakers: "Two speakers (Student & Officer)",
        start_time: "00:00",
        end_time: "06:30",
        transcript: "Officer: Good morning, Student Accommodation Service. How can I help you today?\nStudent: Hello, I'm calling about reserving a room at the West Campus residence hall for the autumn semester.\nOfficer: Certainly! Let me take down a few details. Could you provide your full surname?\nStudent: Yes, it is Thornton. T-H-O-R-N-T-O-N.\nOfficer: Thank you. And your contact telephone number in case we need to reach you?\nStudent: It is 07946 228901.",
      },
      {
        section: 2,
        title: "Section 2: City Botanical Park Renovation Guide",
        context: "A guided talk by the project manager on the new facilities and visitor guidelines.",
        speakers: "Monologue (Project Manager)",
        start_time: "06:30",
        end_time: "13:00",
        transcript: "Speaker: Welcome everyone to today's orientation regarding the Riverdale Botanical Sanctuary renovation. As many of you know, our primary goal has been to enhance accessibility for wheelchairs and young families while preserving indigenous plant species. The new North Pavilion now hosts interactive educational kiosks where visitors can scan QR codes to learn about medicinal botany.",
      },
      {
        section: 3,
        title: "Section 3: Psychology Research Presentation",
        context: "Academic discussion between two undergraduate students and their professor reviewing experimental methodology.",
        speakers: "Three speakers (Dr. Evans, Lucas & Maya)",
        start_time: "13:00",
        end_time: "21:00",
        transcript: "Dr. Evans: Maya, Lucas, I reviewed the draft for your sensory cognition experiment. The sample size seems appropriate, but I'm concerned about the control variables during the audio-visual stimulus stage.\nLucas: We noticed that ambient light in Lab B varied during the afternoon sessions, so we calibrated the digital light meters to 300 lux across all trials.",
      },
      {
        section: 4,
        title: "Section 4: University Lecture on Coral Bleaching",
        context: "A formal university lecture delivered by a marine biologist on temperature anomalies and symbiosis breakdown.",
        speakers: "Monologue (Marine Biologist Lecturer)",
        start_time: "21:00",
        end_time: "30:00",
        transcript: "Lecturer: Today we shall examine the ecological triggers and cascading ramifications of mass coral bleaching events across tropical reefs. Corals maintain an obligate endosymbiotic relationship with photosynthetic microalgae known as zooxanthellae. When sea surface temperatures exceed seasonal baselines by merely one to two degrees Celsius over prolonged intervals, the coral host expels the algae, leading to rapid starvation and structural calcification collapse.",
      }
    ],
    sampleQuestions: [
      {
        id: "q1",
        section: 1,
        number: 1,
        question_text: "Student surname: [ 1 ]",
        type: "fill-blank" as const,
        correct_answer: "Thornton",
        acceptable_answers: ["thornton", "THORNTON"],
        explanation: "The student explicitly spells out T-H-O-R-N-T-O-N.",
        audio_timestamp: "01:10"
      },
      {
        id: "q2",
        section: 1,
        number: 2,
        question_text: "Contact phone number: [ 2 ]",
        type: "fill-blank" as const,
        correct_answer: "07946 228901",
        acceptable_answers: ["07946228901", "07946-228901"],
        explanation: "Given directly as 07946 228901.",
        audio_timestamp: "02:05"
      },
      {
        id: "q3",
        section: 2,
        number: 11,
        question_text: "What is the primary feature of the newly renovated North Pavilion?",
        type: "multiple-choice" as const,
        options: [
          "A) A children's botanical garden playground",
          "B) Interactive educational kiosks with QR codes",
          "C) A commercial organic café and souvenir store",
          "D) An indoor greenhouse for exotic rainforest flora"
        ],
        correct_answer: "B",
        explanation: "The speaker highlights the new North Pavilion hosting interactive educational kiosks with QR codes.",
        audio_timestamp: "08:15"
      },
      {
        id: "q4",
        section: 4,
        number: 31,
        question_text: "Corals maintain an obligate relationship with photosynthetic algae called [ 31 ].",
        type: "fill-blank" as const,
        correct_answer: "zooxanthellae",
        acceptable_answers: ["Zooxanthellae", "microalgae"],
        explanation: "The lecturer mentions zooxanthellae explicitly in the introduction.",
        audio_timestamp: "22:45"
      }
    ]
  },
  {
    id: "preset-listening-2",
    title: "Everyday Social Dialogues & City Services (General Training Focus)",
    description: "Practical listening practice for IELTS General Training candidates covering public library memberships, train timetable inquiries, and neighborhood community events.",
    level: "6.5",
    difficulty: "Intermediate",
    type: "General Training",
    access_tier: "Starter",
    test_number: "2",
    audio_url: "https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg",
    accent: "Australian",
    sections: [
      {
        section: 1,
        title: "Section 1: Community Sports Club Registration",
        context: "Inquiry about weekend tennis court hire and coaching sessions.",
        speakers: "Two speakers (Receptionist & Customer)",
        start_time: "00:00",
        end_time: "06:30",
        transcript: "Receptionist: Welcome to Oakridge Sports Complex! Are you inquiring about the junior squash league or weekend court rentals?\nCustomer: Weekend court hire please. My friend and I want to play on Saturday mornings from 9 AM.",
      },
      {
        section: 2,
        title: "Section 2: City Recycling & Composting Initiative",
        context: "Public broadcast on new green bin collection rules.",
        speakers: "Monologue (Council Officer)",
        start_time: "06:30",
        end_time: "13:00",
        transcript: "Council Officer: Good evening residents. Commencing next Monday, our council is rolling out the organic waste recovery scheme. Green-lidded bins must contain only food scraps, garden prunings, and compostable paper packaging.",
      },
      {
        section: 3,
        title: "Section 3: Group Assignment on Renewable Energy Feasibility",
        context: "Engineering students discussing solar panel installation costs.",
        speakers: "Two students (Liam & Chloe)",
        start_time: "13:00",
        end_time: "21:00",
        transcript: "Chloe: Liam, I've calculated the payback period for monocrystalline solar panels on the campus gymnasium roof. With government rebates, it is roughly 4.8 years.\nLiam: That is much faster than the initial 7-year estimate!",
      },
      {
        section: 4,
        title: "Section 4: History of Urban Water Supply Infrastructure",
        context: "Academic lecture on early 19th-century reservoir construction.",
        speakers: "Monologue (History Professor)",
        start_time: "21:00",
        end_time: "30:00",
        transcript: "Professor: In the early decades of the Victorian era, major industrial metropolises faced severe outbreaks of waterborne diseases. The transition toward high-pressure aqueduct networks represented a monumental triumph in municipal engineering.",
      }
    ],
    sampleQuestions: [
      {
        id: "q2-1",
        section: 1,
        number: 1,
        question_text: "Customer requested day for court rental: [ 1 ]",
        type: "fill-blank" as const,
        correct_answer: "Saturday",
        acceptable_answers: ["saturday", "SATURDAY", "Saturday morning"],
        explanation: "Customer specifically requests Saturday mornings at 9 AM.",
        audio_timestamp: "01:20"
      },
      {
        id: "q2-2",
        section: 3,
        number: 21,
        question_text: "The calculated payback period with government rebates is [ 21 ] years.",
        type: "fill-blank" as const,
        correct_answer: "4.8",
        acceptable_answers: ["4.8 years", "four point eight"],
        explanation: "Chloe states the payback period is 4.8 years.",
        audio_timestamp: "14:30"
      }
    ]
  }
];

export default function ListeningCourseBuilder({ onCourseSaved }: { onCourseSaved?: () => void }) {
  // Course Metadata State
  const [title, setTitle] = useState("IELTS Listening Masterclass: Cambridge Official Practice Test 1");
  const [description, setDescription] = useState("Full-length 40-question IELTS Listening exam simulation with authentic 4-section audio progression, timestamps, detailed answer keys, and band score conversion.");
  const [level, setLevel] = useState("7.5");
  const [type, setType] = useState("Academic");
  const [difficulty, setDifficulty] = useState("Advanced");
  const [accessTier, setAccessTier] = useState("Free Trial");
  const [testNumber, setTestNumber] = useState("1");
  const [accent, setAccent] = useState("British RP");
  const [duration, setDuration] = useState("30 mins");
  const [status, setStatus] = useState("Published");
  const [audioUrl, setAudioUrl] = useState("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg");

  // Sections State
  const [sections, setSections] = useState<ListeningSectionInfo[]>(PRESET_LISTENING_TESTS[0].sections);
  const [activeSectionTab, setActiveSectionTab] = useState(1);

  // Questions State
  const [questions, setQuestions] = useState<ListeningQuestion[]>(PRESET_LISTENING_TESTS[0].sampleQuestions as ListeningQuestion[]);

  // Audio Playback Preview State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAudioPlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn("Playback prevented", e);
      });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const found = PRESET_LISTENING_TESTS.find(p => p.id === presetId);
    if (found) {
      setTitle(found.title);
      setDescription(found.description);
      setLevel(found.level);
      setDifficulty(found.difficulty);
      setType(found.type);
      setAccessTier(found.access_tier);
      setTestNumber(found.test_number);
      setAudioUrl(found.audio_url);
      setAccent(found.accent);
      setSections(found.sections);
      setQuestions(found.sampleQuestions as ListeningQuestion[]);
      setSaveSuccess(false);
    }
  };

  const handleAddQuestion = (sectionNumber: number) => {
    const nextNumber = questions.length > 0 ? Math.max(...questions.map(q => q.number)) + 1 : 1;
    const newQ: ListeningQuestion = {
      id: `q-${Date.now()}`,
      section: sectionNumber,
      number: nextNumber,
      question_text: `Write NO MORE THAN TWO WORDS: [ ${nextNumber} ]`,
      type: "fill-blank",
      correct_answer: "",
      acceptable_answers: [],
      explanation: "",
      audio_timestamp: "00:00"
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleUpdateQuestion = (id: string, updates: Partial<ListeningQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSaveCourse = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      const courseId = `listening-${Date.now()}`;
      
      // Structure modules matching platform layout
      const modulesPayload = sections.map((sec) => {
        const secQuestions = questions.filter(q => q.section === sec.section);
        return {
          id: `mod-listening-sec-${sec.section}`,
          title: sec.title,
          description: sec.context,
          duration: `${sec.start_time} - ${sec.end_time}`,
          lessons: [
            {
              id: `les-audio-sec-${sec.section}`,
              title: `${sec.title} - Audio & Questions (${secQuestions.length} Items)`,
              content: sec.transcript,
              audio_url: audioUrl,
              video_url: "",
              duration: "8 mins",
              completed: false,
              questions: secQuestions.map(q => ({
                id: q.id,
                number: q.number,
                question: q.question_text,
                question_text: q.question_text,
                type: q.type,
                options: q.options || [],
                correct_answer: q.correct_answer,
                explanation: q.explanation || "",
                timestamp: q.audio_timestamp || ""
              }))
            }
          ]
        };
      });

      const payload = {
        id: courseId,
        title: title.trim() || "IELTS Listening Mastery Test",
        level: level || "7.5",
        type: type === "General Training" ? "General Training (GT)" : "Academic",
        difficulty: difficulty || "Advanced",
        description: description || "Authentic IELTS Listening practice exam.",
        status: status || "Published",
        category: "Listening Mastery",
        course_type: "Listening Test",
        duration: duration || "30 mins",
        access_tier: accessTier || "Free Trial",
        test_number: testNumber || "1",
        is_mock_test: true,
        exam_category: type === "General Training" ? "General Training" : "Academic",
        audio_url: audioUrl,
        transcript_name: `Listening Test ${testNumber} Transcripts`,
        transcript_url: "",
        modules: modulesPayload,
        listening_data: {
          accent,
          duration,
          audio_url: audioUrl,
          sections,
          total_questions: questions.length
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
      console.error("Failed to save Listening Course:", err);
      setErrorMessage(err.message || "Failed to save course.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentSection = sections.find(s => s.section === activeSectionTab) || sections[0];
  const currentSectionQuestions = questions.filter(q => q.section === activeSectionTab);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-sky-600 via-indigo-600 to-blue-900 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-none font-bold text-xs uppercase tracking-wider backdrop-blur-md">
                <Headphones className="w-3.5 h-3.5 mr-1" />
                Listening Lab & Studio
              </Badge>
              <Badge className="bg-emerald-400 text-slate-900 border-none font-black text-xs">
                Platform Standard v4.2
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              IELTS Listening Course & Examination Studio
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm font-medium leading-relaxed">
              Create and publish complete 4-Section IELTS listening exams. Configures audio tracks, accent profiles, section time markers, live transcripts, and auto-graded question banks.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleSaveCourse}
              disabled={isSaving}
              className="bg-white text-indigo-900 hover:bg-slate-100 font-black text-xs h-11 px-6 rounded-2xl shadow-xl transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 text-indigo-600" />
                  Publish Listening Course
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-3 flex-wrap text-xs">
          <span className="font-black text-sky-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Load Official Presets:
          </span>
          {PRESET_LISTENING_TESTS.map((p) => (
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
          <span>Listening course saved and published live! Students can now access this test in the Examinations & Curriculum sections.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Audio Configuration */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card 1: Course Identity */}
          <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-black italic flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                1. Course & Test Specifications
              </CardTitle>
              <CardDescription className="text-xs">
                Platform syllabus metadata & target band levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Course Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Cambridge IELTS 19 Academic Listening Test 1"
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
                    <option value="6.0">Band 6.0</option>
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
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Test Number</Label>
                  <Input
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="1"
                    className="rounded-xl h-10 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs font-medium resize-none"
                  placeholder="Overview of audio dialogue topics and section coverage..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Audio Engine & Player */}
          <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-black italic flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-sky-600" />
                2. Audio Stream & Accent Architecture
              </CardTitle>
              <CardDescription className="text-xs">
                Master MP3/OGG stream and accent configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Audio Stream URL</Label>
                <Input
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://...mp3 or actions.google.com/..."
                  className="rounded-xl h-10 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Primary Accent</Label>
                  <select
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 px-3 font-bold text-xs focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                  >
                    <option value="British RP">British RP (Standard)</option>
                    <option value="Australian">Australian English</option>
                    <option value="North American">North American</option>
                    <option value="Scottish / Irish">Scottish / Irish</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Audio Duration</Label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30 mins"
                    className="rounded-xl h-10 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Native Audio Preview Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                    Audio Stream Player Preview
                  </span>
                  <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 p-0.5 rounded-lg text-[10px] font-bold">
                    {[0.75, 1.0, 1.25].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${playbackSpeed === spd ? "bg-white dark:bg-slate-900 text-primary shadow-xs" : "text-slate-500"}`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  preload="metadata"
                  className="w-full hidden"
                />

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAudioPlayPause}
                    className="rounded-xl h-9 px-4 font-bold text-xs bg-primary text-white hover:bg-primary/90 cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Audio
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Play Test Audio
                      </>
                    )}
                  </Button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Tests live audio playback before student launch.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: 4 Sections & Questions Architecture */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section Selector Tabs */}
          <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-black italic flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    3. IELTS 4-Section Architecture & Transcripts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure dialogue contexts, time intervals, and transcripts for each section
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {[1, 2, 3, 4].map((secNum) => (
                    <button
                      key={secNum}
                      type="button"
                      onClick={() => setActiveSectionTab(secNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        activeSectionTab === secNum
                          ? "bg-primary text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Section {secNum}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Section Title</Label>
                    <Input
                      value={currentSection.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections(sections.map(s => s.section === activeSectionTab ? { ...s, title: val } : s));
                      }}
                      className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Speakers / Dialogue Type</Label>
                    <Input
                      value={currentSection.speakers}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections(sections.map(s => s.section === activeSectionTab ? { ...s, speakers: val } : s));
                      }}
                      className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Audio Start Time</Label>
                    <Input
                      value={currentSection.start_time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections(sections.map(s => s.section === activeSectionTab ? { ...s, start_time: val } : s));
                      }}
                      placeholder="00:00"
                      className="rounded-xl h-9 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Audio End Time</Label>
                    <Input
                      value={currentSection.end_time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections(sections.map(s => s.section === activeSectionTab ? { ...s, end_time: val } : s));
                      }}
                      placeholder="06:30"
                      className="rounded-xl h-9 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Section Verbatim Transcript</Label>
                  <Textarea
                    value={currentSection.transcript}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections(sections.map(s => s.section === activeSectionTab ? { ...s, transcript: val } : s));
                    }}
                    rows={6}
                    className="rounded-xl bg-white dark:bg-slate-900 text-xs font-mono resize-none leading-relaxed"
                    placeholder="Speaker dialogue transcript with [Examiner] / [Student] speaker labels..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Questions Editor */}
          <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black italic flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    4. Section {activeSectionTab} Questions ({currentSectionQuestions.length} Items)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Questions, input prompts, accepted answers & explanations
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddQuestion(activeSectionTab)}
                  className="rounded-xl h-9 px-3 font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {currentSectionQuestions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-400">
                  <Headphones className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-bold">No questions added yet for Section {activeSectionTab}.</p>
                  <p className="text-[11px] mt-1">Click "Add Question" above to configure form fills, MCQs, or map labelling items.</p>
                </div>
              ) : (
                currentSectionQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-sky-600 text-white font-black text-[11px] px-2 py-0.5">
                          Q{q.number}
                        </Badge>
                        <select
                          value={q.type}
                          onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as any })}
                          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 h-7 px-2 font-bold text-[11px]"
                        >
                          <option value="fill-blank">Form / Note Completion</option>
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="matching">Matching Information</option>
                          <option value="map-labelling">Map / Diagram Labelling</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <input
                            type="text"
                            value={q.audio_timestamp || "00:00"}
                            onChange={(e) => handleUpdateQuestion(q.id, { audio_timestamp: e.target.value })}
                            className="w-12 text-center bg-transparent border-b border-slate-300 dark:border-slate-700 font-mono text-[10px]"
                            placeholder="00:00"
                          />
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Question Prompt / Sentence</Label>
                      <Input
                        value={q.question_text}
                        onChange={(e) => handleUpdateQuestion(q.id, { question_text: e.target.value })}
                        className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                        placeholder="E.g., Complete the notes: Full Name [ 1 ]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Correct Answer</Label>
                        <Input
                          value={q.correct_answer}
                          onChange={(e) => handleUpdateQuestion(q.id, { correct_answer: e.target.value })}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs text-emerald-600 dark:text-emerald-400"
                          placeholder="E.g., Thornton or B"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Explanation & Audio Clue</Label>
                        <Input
                          value={q.explanation || ""}
                          onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-slate-500"
                          placeholder="E.g., Explicitly spelled out at 01:10..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
