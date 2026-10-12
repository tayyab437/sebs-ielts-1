import React, { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
  Square,
  Wand2,
  ListOrdered,
  HelpCircle,
  Info
} from "lucide-react";

export interface SpeakingQuestionItem {
  id: string;
  questionNumber: number;
  part: string;
  topic: string;
  question: string;
  suggestedTimeSeconds: number;
  cueBullets?: string[];
  modelAnswer: string;
  keyVocab: string;
  examinerTips: string;
}

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

function extractPresetToUnified(preset: any): SpeakingQuestionItem[] {
  const list: SpeakingQuestionItem[] = [];
  let qNum = 1;
  (preset.part1_questions || []).forEach((q: any) => {
    list.push({
      id: q.id || `sq-${qNum}`,
      questionNumber: qNum++,
      part: "Part 1 (Introduction)",
      topic: q.topic || "Daily Routine",
      question: q.question,
      suggestedTimeSeconds: 45,
      cueBullets: [],
      modelAnswer: q.model_answer,
      keyVocab: q.key_vocab,
      examinerTips: "Answer promptly with 2-3 detailed sentences and conversational flow."
    });
  });
  if (preset.part2) {
    list.push({
      id: `sq-${qNum}`,
      questionNumber: qNum++,
      part: "Part 2 (Cue Card)",
      topic: preset.part2.topic_title || "Individual Long Turn",
      question: preset.part2.topic_title,
      suggestedTimeSeconds: 120,
      cueBullets: preset.part2.cue_bullets || [],
      modelAnswer: preset.part2.model_response,
      keyVocab: Array.isArray(preset.part2.advanced_collocations) ? preset.part2.advanced_collocations.join(", ") : "",
      examinerTips: "Speak continuously for 1 to 2 minutes. Address all 4 cue bullets systematically."
    });
  }
  (preset.part3_questions || []).forEach((q: any) => {
    list.push({
      id: q.id || `sq-${qNum}`,
      questionNumber: qNum++,
      part: "Part 3 (Discussion)",
      topic: q.sub_theme || "Analytical Debate",
      question: q.question,
      suggestedTimeSeconds: 60,
      cueBullets: [],
      modelAnswer: q.sample_points,
      keyVocab: q.linking_phrases,
      examinerTips: "Analyze broader societal implications and contrast varying perspectives."
    });
  });
  return list;
}

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

  // AI Question Generator Configuration
  const [aiTopic, setAiTopic] = useState("Digital Technology, Smart Devices & AI");
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [aiExplanation, setAiExplanation] = useState(
    "Focus on modern digital life, personal tech usage, artificial intelligence impact on careers, and future societal transformations with Band 8.5+ vocabulary."
  );
  const [aiDifficulty, setAiDifficulty] = useState("Advanced");
  const [aiFormat, setAiFormat] = useState("Full IELTS Test (Part 1, 2, 3)");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");

  // Unified Questions Array (for 1-by-1 screen taking and custom editing)
  const [unifiedQuestions, setUnifiedQuestions] = useState<SpeakingQuestionItem[]>(() => {
    return extractPresetToUnified(PRESET_SPEAKING_TESTS[0]);
  });

  // Part 1 Questions State
  const [part1Questions, setPart1Questions] = useState<SpeakingPart1Question[]>(PRESET_SPEAKING_TESTS[0].part1_questions);

  // Part 2 Cue Card State
  const [part2Data, setPart2Data] = useState<SpeakingPart2Data>(PRESET_SPEAKING_TESTS[0].part2);

  // Part 3 Questions State
  const [part3Questions, setPart3Questions] = useState<SpeakingPart3Question[]>(PRESET_SPEAKING_TESTS[0].part3_questions);

  // Active Part Tab inside builder (0 = All Questions, 1 = Part 1, 2 = Part 2, 3 = Part 3)
  const [activePartTab, setActivePartTab] = useState<0 | 1 | 2 | 3>(0);

  // Interactive Live Recording Simulator State
  const [isRecordingSim, setIsRecordingSim] = useState(false);
  const [prepTimer, setPrepTimer] = useState(60);
  const [isPrepping, setIsPrepping] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedCourseId, setSavedCourseId] = useState<string>("");

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

  const syncUnifiedToParts = (list: SpeakingQuestionItem[]) => {
    const p1: SpeakingPart1Question[] = [];
    let p2: SpeakingPart2Data | null = null;
    const p3: SpeakingPart3Question[] = [];

    list.forEach(q => {
      const isPart2 = q.part?.toLowerCase().includes("part 2") || (q.cueBullets && q.cueBullets.length > 0);
      const isPart3 = q.part?.toLowerCase().includes("part 3");

      if (isPart2) {
        if (!p2) {
          p2 = {
            topic_title: q.question,
            cue_bullets: q.cueBullets && q.cueBullets.length > 0 ? q.cueBullets : [
              "What the situation or tool was and when you first used it",
              "How you currently utilize it in your daily life or studies",
              "What specific advantages it offers over conventional methods",
              "And explain why this topic is significant for your future"
            ],
            preparation_seconds: 60,
            speaking_seconds: 120,
            model_response: q.modelAnswer,
            advanced_collocations: q.keyVocab ? q.keyVocab.split(",").map(s => s.trim()).filter(Boolean) : []
          };
        }
      } else if (isPart3) {
        p3.push({
          id: q.id,
          question: q.question,
          sub_theme: q.topic,
          sample_points: q.modelAnswer,
          linking_phrases: q.keyVocab
        });
      } else {
        // Part 1
        p1.push({
          id: q.id,
          topic: q.topic,
          question: q.question,
          model_answer: q.modelAnswer,
          key_vocab: q.keyVocab
        });
      }
    });

    setPart1Questions(p1);
    setPart2Data(p2 || {
      topic_title: "",
      cue_bullets: [],
      preparation_seconds: 60,
      speaking_seconds: 120,
      model_response: "",
      advanced_collocations: []
    });
    setPart3Questions(p3);
  };

  const handleGenerateQuestionsWithAi = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic for the speaking test.");
      return;
    }

    setIsGeneratingAi(true);
    setErrorMessage("");
    setAiSuccessMessage("");

    try {
      const res = await fetch("/api/gemini/generate-speaking-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          numberOfQuestions: Number(aiQuestionCount) || 5,
          explanation: aiExplanation.trim(),
          difficulty: aiDifficulty,
          format: aiFormat
        })
      });

      if (!res.ok) {
        throw new Error(`AI generation service error (Status ${res.status})`);
      }

      const data = await res.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No questions were returned by AI.");
      }

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);

      const generated: SpeakingQuestionItem[] = data.questions.map((q: any, idx: number) => {
        let partVal = q.part;
        const isFormatPart1 = aiFormat.toLowerCase().includes("part 1");
        const isFormatPart2 = aiFormat.toLowerCase().includes("part 2");
        const isFormatPart3 = aiFormat.toLowerCase().includes("part 3");

        if (isFormatPart1) {
          partVal = "Part 1 (Introduction)";
        } else if (isFormatPart2) {
          partVal = "Part 2 (Cue Card)";
        } else if (isFormatPart3) {
          partVal = "Part 3 (Discussion)";
        } else if (!partVal) {
          partVal = idx === 0 ? "Part 1 (Introduction)" : (idx === 1 && data.questions.length >= 3 ? "Part 2 (Cue Card)" : "Part 3 (Discussion)");
        }

        const isP2 = partVal?.toLowerCase().includes("part 2") || (Array.isArray(q.cueBullets) && q.cueBullets.length > 0);

        return {
          id: q.id || `sq-${Date.now()}-${idx + 1}`,
          questionNumber: q.questionNumber || idx + 1,
          part: partVal || "Part 1 (Introduction)",
          topic: q.topic || aiTopic,
          question: q.question || "",
          suggestedTimeSeconds: q.suggestedTimeSeconds || (isP2 ? 120 : 60),
          cueBullets: isP2 && Array.isArray(q.cueBullets) ? q.cueBullets : [],
          modelAnswer: q.modelAnswer || "",
          keyVocab: q.keyVocab || "",
          examinerTips: q.examinerTips || "Structure your answer with clear discourse markers and concrete personal illustrations."
        };
      });

      setUnifiedQuestions(generated);
      syncUnifiedToParts(generated);
      setActivePartTab(0); // View all questions tab

      setAiSuccessMessage(`✨ Successfully generated ${generated.length} authentic IELTS speaking questions for "${aiTopic}"!`);
      toast.success(`Generated ${generated.length} AI Speaking Questions!`);
    } catch (err: any) {
      console.error("AI Generation error:", err);
      toast.error(err.message || "Failed to generate speaking questions with AI.");
      setErrorMessage(err.message || "Failed to generate speaking questions.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

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
      setUnifiedQuestions(extractPresetToUnified(found));
      setSaveSuccess(false);
      setAiSuccessMessage("");
    }
  };

  const handleAddUnifiedQuestion = () => {
    const nextNum = unifiedQuestions.length + 1;
    // Check if current questions are all Part 1 or format is Part 1
    const allPart1 = unifiedQuestions.length === 0 || unifiedQuestions.every(q => !q.part?.includes("2") && !q.part?.includes("3"));
    let defaultPart = "Part 1 (Introduction)";
    if (!allPart1 && !aiFormat.includes("Part 1")) {
      defaultPart = nextNum === 1 ? "Part 1 (Introduction)" : nextNum === 2 ? "Part 2 (Cue Card)" : "Part 3 (Discussion)";
    }

    const newQ: SpeakingQuestionItem = {
      id: `sq-${Date.now()}`,
      questionNumber: nextNum,
      part: defaultPart,
      topic: aiTopic || "Personal Background & Routines",
      question: "What aspects of this topic are most relevant to your current daily life?",
      suggestedTimeSeconds: defaultPart.includes("2") ? 120 : 60,
      cueBullets: defaultPart.includes("2") ? [
        "What the situation or experience was",
        "Who was involved with you at that time",
        "What key insights or outcomes arose",
        "And explain why this left a memorable impression on you"
      ] : [],
      modelAnswer: "From my standpoint, engaging with this subject matter provides invaluable perspective and enables personal growth.",
      keyVocab: "invaluable perspective, personal growth, profound impact",
      examinerTips: "Extend your response with a balanced perspective and appropriate transitional phrases."
    };
    const updated = [...unifiedQuestions, newQ];
    setUnifiedQuestions(updated);
    syncUnifiedToParts(updated);
  };

  const handleRemoveUnifiedQuestion = (id: string) => {
    const filtered = unifiedQuestions.filter(q => q.id !== id).map((q, idx) => ({
      ...q,
      questionNumber: idx + 1
    }));
    setUnifiedQuestions(filtered);
    syncUnifiedToParts(filtered);
  };

  const handleUpdateUnifiedQuestion = (id: string, updates: Partial<SpeakingQuestionItem>) => {
    const updated = unifiedQuestions.map(q => q.id === id ? { ...q, ...updates } : q);
    setUnifiedQuestions(updated);
    syncUnifiedToParts(updated);
  };

  const handleAddPart1Question = () => {
    const nextNum = unifiedQuestions.length + 1;
    const newId = `p1-${Date.now()}`;
    const newQ: SpeakingPart1Question = {
      id: newId,
      topic: "Personal Experience & Preferences",
      question: "What is your favorite time of the day to relax or study?",
      model_answer: "I am unequivocally a morning person. The initial hours of the dawn offer an atmosphere of serenity before the hustle and bustle begins.",
      key_vocab: "unequivocally, serenity, hustle and bustle"
    };
    const newUnified: SpeakingQuestionItem = {
      id: newId,
      questionNumber: nextNum,
      part: "Part 1 (Introduction)",
      topic: newQ.topic,
      question: newQ.question,
      suggestedTimeSeconds: 45,
      cueBullets: [],
      modelAnswer: newQ.model_answer,
      keyVocab: newQ.key_vocab,
      examinerTips: "Answer promptly with 2-3 detailed sentences and conversational flow."
    };
    setPart1Questions([...part1Questions, newQ]);
    setUnifiedQuestions([...unifiedQuestions, newUnified]);
  };

  const handleUpdatePart1Question = (id: string, updates: Partial<SpeakingPart1Question>) => {
    setPart1Questions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    setUnifiedQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      return {
        ...q,
        topic: updates.topic !== undefined ? updates.topic : q.topic,
        question: updates.question !== undefined ? updates.question : q.question,
        modelAnswer: updates.model_answer !== undefined ? updates.model_answer : q.modelAnswer,
        keyVocab: updates.key_vocab !== undefined ? updates.key_vocab : q.keyVocab,
      };
    }));
  };

  const handleRemovePart1Question = (id: string) => {
    setPart1Questions(part1Questions.filter(q => q.id !== id));
    setUnifiedQuestions(unifiedQuestions.filter(q => q.id !== id).map((q, idx) => ({ ...q, questionNumber: idx + 1 })));
  };

  const handleAddPart3Question = () => {
    const nextNum = unifiedQuestions.length + 1;
    const newId = `p3-${Date.now()}`;
    const newQ: SpeakingPart3Question = {
      id: newId,
      question: "How do you foresee this trend evolving over the next generation?",
      sub_theme: "Future Trajectories & Projections",
      sample_points: "Analyze technological democratization versus potential social inequalities.",
      linking_phrases: "In all likelihood... looking ahead... it remains to be seen whether..."
    };
    const newUnified: SpeakingQuestionItem = {
      id: newId,
      questionNumber: nextNum,
      part: "Part 3 (Discussion)",
      topic: newQ.sub_theme,
      question: newQ.question,
      suggestedTimeSeconds: 60,
      cueBullets: [],
      modelAnswer: newQ.sample_points,
      keyVocab: newQ.linking_phrases,
      examinerTips: "Analyze broader societal implications and contrast varying perspectives."
    };
    setPart3Questions([...part3Questions, newQ]);
    setUnifiedQuestions([...unifiedQuestions, newUnified]);
  };

  const handleUpdatePart3Question = (id: string, updates: Partial<SpeakingPart3Question>) => {
    setPart3Questions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    setUnifiedQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      return {
        ...q,
        topic: updates.sub_theme !== undefined ? updates.sub_theme : q.topic,
        question: updates.question !== undefined ? updates.question : q.question,
        modelAnswer: updates.sample_points !== undefined ? updates.sample_points : q.modelAnswer,
        keyVocab: updates.linking_phrases !== undefined ? updates.linking_phrases : q.keyVocab,
      };
    }));
  };

  const handleRemovePart3Question = (id: string) => {
    setPart3Questions(part3Questions.filter(q => q.id !== id));
    setUnifiedQuestions(unifiedQuestions.filter(q => q.id !== id).map((q, idx) => ({ ...q, questionNumber: idx + 1 })));
  };

  const handleSaveCourse = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      // Find existing course by title or test_number or savedCourseId to prevent duplicate publishing
      let existingList: any[] = [];
      try {
        existingList = JSON.parse(localStorage.getItem("mock_courses") || "[]");
      } catch (e) {}

      const cleanTitle = (title.trim() || "IELTS Speaking Studio Simulation");
      let matchedCourseId = savedCourseId;

      if (!matchedCourseId) {
        const matchedLocal = existingList.find((c: any) => 
          c.title && c.title.trim().toLowerCase() === cleanTitle.toLowerCase() && String(c.course_type || "").toLowerCase().includes("speaking")
        );
        if (matchedLocal) matchedCourseId = matchedLocal.id;
      }

      // Check database to ensure we update existing course rather than creating a duplicate
      if (!matchedCourseId && supabase) {
        try {
          const { data: dbMatches } = await supabase
            .from("courses")
            .select("id, title, course_type")
            .eq("title", cleanTitle);
          if (dbMatches && dbMatches.length > 0) {
            const spMatch = dbMatches.find((m: any) => String(m.course_type || "").toLowerCase().includes("speaking")) || dbMatches[0];
            matchedCourseId = spMatch.id;
          }
        } catch (e) {}
      }

      const courseId = matchedCourseId || `speaking-${Date.now()}`;
      if (!savedCourseId) {
        setSavedCourseId(courseId);
      }

      const hasPart2 = unifiedQuestions.some(q => (q.part?.toLowerCase().includes("part 2") || (q.cueBullets && q.cueBullets.length > 0)) && !q.part?.toLowerCase().includes("part 1"));
      const hasPart3 = unifiedQuestions.some(q => q.part?.toLowerCase().includes("part 3") && !q.part?.toLowerCase().includes("part 1"));

      const p1List = unifiedQuestions.filter(q => q.part?.toLowerCase().includes("part 1") || (!q.part?.toLowerCase().includes("part 2") && !q.part?.toLowerCase().includes("part 3")));
      const p2List = unifiedQuestions.filter(q => (q.part?.toLowerCase().includes("part 2") || (q.cueBullets && q.cueBullets.length > 0)) && !q.part?.toLowerCase().includes("part 1"));
      const p3List = unifiedQuestions.filter(q => q.part?.toLowerCase().includes("part 3") && !q.part?.toLowerCase().includes("part 1"));

      // Build modulesPayload strictly matching actual questions present (never inject fake cue card if all are Part 1)
      const modulesPayload: any[] = [];

      if (p1List.length > 0) {
        modulesPayload.push({
          id: `mod-speaking-p1`,
          title: "Part 1: Introduction & Personal Interview (4-5 mins)",
          description: "Examiner asks personal questions regarding hometown, routines, technology, and preferences.",
          duration: `${Math.max(4, Math.min(15, Math.ceil(p1List.length * 1.5)))} mins`,
          lessons: p1List.map((q, idx) => ({
            id: `les-p1-${idx + 1}`,
            title: `Q${idx + 1}: ${q.question}`,
            content: `### Examiner Question\n"${q.question}"\n\n### Model Band 9 Response\n${q.modelAnswer}\n\n### Essential Lexical Resource\n- **Vocabulary Booster:** ${q.keyVocab}`,
            duration: "2 mins",
            completed: false,
            questions: []
          }))
        });
      }

      if (hasPart2 && p2List.length > 0) {
        modulesPayload.push({
          id: `mod-speaking-p2`,
          title: "Part 2: Long Turn Cue Card (with 1-min prep timer)",
          description: part2Data.topic_title || p2List[0]?.question || "Candidate Long Turn Prompt",
          duration: "4 mins",
          lessons: p2List.map((p2Item, idx) => ({
            id: `les-p2-${idx + 1}`,
            title: `Part 2 Cue Card: ${p2Item.question}`,
            content: `### Prompt Topic\n**${p2Item.question}**\n\n### You should say:\n${(p2Item.cueBullets && p2Item.cueBullets.length > 0 ? p2Item.cueBullets : (part2Data.cue_bullets && part2Data.cue_bullets.length > 0 ? part2Data.cue_bullets : ["What it is", "How you use it", "Why it matters"])).map(b => `- ${b}`).join("\n")}\n\n### Band 9 Model Speech\n${p2Item.modelAnswer || part2Data.model_response}\n\n### High-Scoring Collocations\n${p2Item.keyVocab || part2Data.advanced_collocations.join(", ")}`,
            duration: "4 mins",
            completed: false,
            questions: []
          }))
        });
      }

      if (hasPart3 && p3List.length > 0) {
        modulesPayload.push({
          id: `mod-speaking-p3`,
          title: "Part 3: Two-Way Abstract Discussion (4-5 mins)",
          description: "In-depth analytical discourse exploring broader societal and philosophical angles.",
          duration: `${Math.max(4, Math.min(15, Math.ceil(p3List.length * 1.5)))} mins`,
          lessons: p3List.map((q, idx) => ({
            id: `les-p3-${idx + 1}`,
            title: `Discussion Q${idx + 1}: ${q.question}`,
            content: `### Analytical Topic\n${q.topic}\n\n### Examiner Question\n"${q.question}"\n\n### Key Argument Points\n${q.modelAnswer}\n\n### Discourse Markers & Linking\n${q.keyVocab}`,
            duration: "2 mins",
            completed: false,
            questions: []
          }))
        });
      }

      const payload = {
        id: courseId,
        title: cleanTitle,
        level: level || "8.0",
        type: type === "General Training" ? "General Training (GT)" : "Academic",
        difficulty: difficulty || "Advanced",
        description: description || "Authentic computer-simulated IELTS Speaking examination.",
        status: status || "Published",
        category: "Speaking Mastery",
        course_type: "Speaking Test",
        course_format: "speaking",
        duration: duration || "11-14 mins",
        access_tier: accessTier || "Free Trial",
        test_number: testNumber || "1",
        is_mock_test: true,
        exam_category: type === "General Training" ? "General Training" : "Academic",
        audio_url: "",
        transcript_name: `Speaking Test ${testNumber} Scripts & Rubrics`,
        transcript_url: "",
        speaking_questions: unifiedQuestions,
        modules: modulesPayload,
        speaking_data: {
          examiner_accent: examinerAccent,
          duration,
          questions: unifiedQuestions,
          part1_questions: p1List.map(q => ({
            id: q.id,
            topic: q.topic,
            question: q.question,
            model_answer: q.modelAnswer,
            key_vocab: q.keyVocab
          })),
          part2: hasPart2 ? (p2List[0] ? {
            topic_title: p2List[0].question,
            cue_bullets: p2List[0].cueBullets || [],
            preparation_seconds: 60,
            speaking_seconds: 120,
            model_response: p2List[0].modelAnswer,
            advanced_collocations: p2List[0].keyVocab ? p2List[0].keyVocab.split(",").map(s => s.trim()).filter(Boolean) : []
          } : part2Data) : null,
          part3_questions: p3List.map(q => ({
            id: q.id,
            question: q.question,
            sub_theme: q.topic,
            sample_points: q.modelAnswer,
            linking_phrases: q.keyVocab
          })),
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

      // Save to Supabase / MySQL
      if (supabase) {
        try {
          await supabase.from("courses").upsert([payload]);
        } catch (dbErr) {
          console.warn("Supabase upsert note:", dbErr);
        }
      }

      // Save to localStorage (with strict deduplication)
      try {
        const filtered = existingList.filter((c: any) => 
          c.id !== courseId && 
          !(c.title && c.title.trim().toLowerCase() === cleanTitle.toLowerCase() && String(c.course_type).toLowerCase().includes("speaking"))
        );
        localStorage.setItem("mock_courses", JSON.stringify([payload, ...filtered]));
      } catch (localErr) {
        console.warn("LocalStorage save note:", localErr);
      }

      // Trigger global event
      window.dispatchEvent(new Event("site_content_updated"));
      window.dispatchEvent(new Event("mock_courses_updated"));
      setSaveSuccess(true);
      toast.success("Speaking course published live! Students can now take the test with 1-question-per-screen voice recording.");
      if (onCourseSaved) onCourseSaved();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error("Failed to save Speaking Course:", err);
      setErrorMessage(err.message || "Failed to save course.");
      toast.error(err.message || "Failed to save speaking course.");
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

      {/* AI SPEAKING QUESTION MAKER PANEL */}
      <Card className="rounded-[2.5rem] border-slate-200/80 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-300" /> AI Question Maker
                </Badge>
                <Badge className="bg-amber-400 text-slate-900 border-none text-[10px] font-black">
                  Powered by Google Gemini
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Wand2 className="w-5 h-5 text-amber-300" />
                AI Speaking Question Maker & Test Generator
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs font-medium">
                Enter your test topic, desired number of questions, and brief explanation. AI automatically generates authentic examiner questions, Band 8.5+ model answers, vocabulary boosters, and examiner coaching tips.
              </CardDescription>
            </div>
            
            <Button
              type="button"
              onClick={handleGenerateQuestionsWithAi}
              disabled={isGeneratingAi}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs h-12 px-6 rounded-2xl shadow-xl shadow-emerald-900/30 shrink-0 cursor-pointer transition-all border border-emerald-400/30"
            >
              {isGeneratingAi ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-amber-200" />
                  Generate Questions with AI
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Topic Input */}
            <div className="md:col-span-6 space-y-2">
              <Label className="font-extrabold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>1. Test Topic or Subject Area</span>
                <span className="text-[10px] text-slate-400 font-semibold">Required</span>
              </Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="E.g., Work-Life Balance, AI & Robotics, Climate Change, Cultural Tourism..."
                className="h-11 rounded-xl text-xs font-bold bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              />
              {/* Quick Topic Ideas */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-400">Quick Picks:</span>
                {[
                  "Artificial Intelligence & Future Careers",
                  "Sustainable Cities & Climate",
                  "Global Tourism & Cultures",
                  "Remote Work & Modern Routines",
                  "Education & E-Learning",
                  "Social Media & Communication"
                ].map((sTopic) => (
                  <button
                    key={sTopic}
                    type="button"
                    onClick={() => setAiTopic(sTopic)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-white/5 transition-colors cursor-pointer"
                  >
                    {sTopic.split("&")[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div className="md:col-span-3 space-y-2">
              <Label className="font-extrabold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>2. Number of Questions</span>
                <Badge variant="outline" className="text-[10px] font-bold">{aiQuestionCount} Questions</Badge>
              </Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                className="h-11 rounded-xl text-xs font-bold bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              />
              <p className="text-[10px] text-slate-400 font-medium">
                Each question is displayed on 1 screen with custom voice recording.
              </p>
            </div>

            {/* Target Band & Format */}
            <div className="md:col-span-3 space-y-2">
              <Label className="font-extrabold text-xs text-slate-700 dark:text-slate-200">
                3. Difficulty & Format
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-11 px-2.5 font-bold text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="Intermediate">Band 6.5 - 7.0</option>
                  <option value="Advanced">Band 7.5 - 8.0</option>
                  <option value="Expert">Band 8.5 - 9.0</option>
                </select>

                <select
                  value={aiFormat}
                  onChange={(e) => setAiFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-11 px-2.5 font-bold text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="Full IELTS Test">Part 1, 2, 3</option>
                  <option value="Part 1 Interview">Part 1 Drills</option>
                  <option value="Part 2 Cue Cards">Part 2 Cue Card</option>
                  <option value="Part 3 Analytical">Part 3 Debate</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Examiner prompts structured to target criteria.
              </p>
            </div>

            {/* Brief Explanation / Instructor Context */}
            <div className="md:col-span-12 space-y-2">
              <Label className="font-extrabold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>4. Brief Explanation or Instructor Context (Optional)</span>
                <span className="text-[10px] text-slate-400 font-semibold">Teacher Instructions</span>
              </Label>
              <Textarea
                value={aiExplanation}
                onChange={(e) => setAiExplanation(e.target.value)}
                rows={2}
                placeholder="E.g., Give questions exploring workplace changes, psychological impacts of remote work, and ethical considerations. Emphasize idioms and discourse markers."
                className="rounded-xl text-xs font-medium bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 resize-none leading-relaxed"
              />
            </div>
          </div>

          {aiSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

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

        {/* Right Columns: 3-Part Architecture & All Questions View */}
        <div className="space-y-6 lg:col-span-2">
          {/* Part Switcher Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setActivePartTab(0)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activePartTab === 0
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-500" />
              <span>All Test Questions ({unifiedQuestions.length} Questions)</span>
            </button>

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
              <span>Part 1: Intro ({part1Questions.length})</span>
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
              <span>Part 2: Cue Card</span>
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
              <span>Part 3: Discussion ({part3Questions.length})</span>
            </button>
          </div>

          {/* TAB 0: ALL TEST QUESTIONS (1-BY-1 FLOW) */}
          {activePartTab === 0 && (
            <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black italic flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-emerald-600" />
                    All Speaking Test Questions ({unifiedQuestions.length} Questions)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students will see 1 question per screen with voice recording and AI evaluation. Customize or reorder any question below.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddUnifiedQuestion}
                    className="rounded-xl h-9 px-3 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {unifiedQuestions.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                    <Wand2 className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-slate-500 font-bold">No questions yet. Click "Generate Questions with AI" above or add one manually.</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateQuestionsWithAi}
                      className="rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate with AI
                    </Button>
                  </div>
                ) : (
                  unifiedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5">
                            Screen {idx + 1} of {unifiedQuestions.length}
                          </Badge>
                          <select
                            value={q.part?.includes("2") ? "Part 2 (Cue Card)" : q.part?.includes("3") ? "Part 3 (Discussion)" : "Part 1 (Introduction)"}
                            onChange={(e) => {
                              const newPart = e.target.value;
                              const isP2 = newPart.includes("2");
                              handleUpdateUnifiedQuestion(q.id, {
                                part: newPart,
                                suggestedTimeSeconds: isP2 ? 120 : (newPart.includes("3") ? 60 : 45),
                                cueBullets: isP2 ? (q.cueBullets && q.cueBullets.length > 0 ? q.cueBullets : [
                                  "What the situation or tool was and when you first used it",
                                  "How you currently utilize it in your daily life or studies",
                                  "What specific advantages it offers over conventional methods",
                                  "And explain why this topic is significant for your future"
                                ]) : []
                              });
                            }}
                            className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-[11px] font-bold px-2 py-0.5 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm"
                          >
                            <option value="Part 1 (Introduction)">Part 1 (Introduction)</option>
                            <option value="Part 2 (Cue Card)">Part 2 (Cue Card)</option>
                            <option value="Part 3 (Discussion)">Part 3 (Discussion)</option>
                          </select>
                          <Badge variant="outline" className="text-[10px] font-semibold text-slate-500">
                            <Clock className="w-3 h-3 mr-1 text-emerald-500" /> ~{q.suggestedTimeSeconds}s response
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUnifiedQuestion(q.id)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Question Prompt */}
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                          Examiner Question Prompt
                        </Label>
                        <Input
                          value={q.question}
                          onChange={(e) => handleUpdateUnifiedQuestion(q.id, { question: e.target.value })}
                          className="rounded-xl h-10 bg-white dark:bg-slate-900 font-bold text-xs"
                          placeholder="E.g., How has technology transformed your everyday communication habits?"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                            Sub-Topic / Focus Area
                          </Label>
                          <Input
                            value={q.topic}
                            onChange={(e) => handleUpdateUnifiedQuestion(q.id, { topic: e.target.value })}
                            className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                            placeholder="E.g., Daily Technology, Career Paths"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                            Target Response Duration (Seconds)
                          </Label>
                          <Input
                            type="number"
                            value={q.suggestedTimeSeconds}
                            onChange={(e) => handleUpdateUnifiedQuestion(q.id, { suggestedTimeSeconds: Number(e.target.value) || 60 })}
                            className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs"
                            placeholder="60"
                          />
                        </div>
                      </div>

                      {/* Cue Bullets if Part 2 */}
                      {q.cueBullets && q.cueBullets.length > 0 && (
                        <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-white/5">
                          <Label className="font-bold text-[10px] uppercase text-emerald-700 dark:text-emerald-400">
                            Cue Card Bullets ("You should say"):
                          </Label>
                          {q.cueBullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0">
                                {bIdx + 1}
                              </span>
                              <Input
                                value={bullet}
                                onChange={(e) => {
                                  const updatedBullets = [...(q.cueBullets || [])];
                                  updatedBullets[bIdx] = e.target.value;
                                  handleUpdateUnifiedQuestion(q.id, { cueBullets: updatedBullets });
                                }}
                                className="h-8 rounded-lg text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Model Answer */}
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                          Band 8.5+ Model Response
                        </Label>
                        <Textarea
                          value={q.modelAnswer}
                          onChange={(e) => handleUpdateUnifiedQuestion(q.id, { modelAnswer: e.target.value })}
                          rows={3}
                          className="rounded-xl bg-white dark:bg-slate-900 text-xs font-medium resize-none leading-relaxed"
                          placeholder="Authentic high-scoring monologue with sophisticated sentence structures..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                            Key Vocabulary Booster (Comma Separated)
                          </Label>
                          <Input
                            value={q.keyVocab}
                            onChange={(e) => handleUpdateUnifiedQuestion(q.id, { keyVocab: e.target.value })}
                            className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-purple-600 dark:text-purple-400"
                            placeholder="E.g., cognitive bandwidth, inextricably linked, profound metamorphosis..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                            Examiner Coaching Tip
                          </Label>
                          <Input
                            value={q.examinerTips}
                            onChange={(e) => handleUpdateUnifiedQuestion(q.id, { examinerTips: e.target.value })}
                            className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-amber-600 dark:text-amber-400"
                            placeholder="E.g., Extend ideas with cause and effect rather than simple yes/no."
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {unifiedQuestions.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleAddUnifiedQuestion}
                    variant="outline"
                    className="w-full h-11 rounded-2xl border-dashed border-2 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs hover:border-emerald-500 hover:text-emerald-600 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Another Question to Test Flow
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

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
                          onChange={(e) => handleUpdatePart1Question(q.id, { topic: e.target.value })}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                          placeholder="E.g., Hometown, Studies, Free Time"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Key Vocabulary Booster</Label>
                        <Input
                          value={q.key_vocab}
                          onChange={(e) => handleUpdatePart1Question(q.id, { key_vocab: e.target.value })}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-purple-600 dark:text-purple-400"
                          placeholder="E.g., inextricably linked, tranquility..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Examiner Question Prompt</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => handleUpdatePart1Question(q.id, { question: e.target.value })}
                        className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                        placeholder="E.g., Do you prefer reading books or watching documentaries?"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Band 9 Model Answer Transcript</Label>
                      <Textarea
                        value={q.model_answer}
                        onChange={(e) => handleUpdatePart1Question(q.id, { model_answer: e.target.value })}
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
                          onChange={(e) => handleUpdatePart3Question(q.id, { sub_theme: e.target.value })}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                          placeholder="E.g., Impact of Automation on Employment"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Discourse Markers & Linking Phrases</Label>
                        <Input
                          value={q.linking_phrases}
                          onChange={(e) => handleUpdatePart3Question(q.id, { linking_phrases: e.target.value })}
                          className="rounded-xl h-9 bg-white dark:bg-slate-900 font-medium text-xs text-sky-600 dark:text-sky-400"
                          placeholder="E.g., On the one hand... nevertheless..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Examiner Discussion Prompt</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => handleUpdatePart3Question(q.id, { question: e.target.value })}
                        className="rounded-xl h-9 bg-white dark:bg-slate-900 font-bold text-xs"
                        placeholder="E.g., To what extent do you believe automation will displace jobs?"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-[11px] text-slate-600 dark:text-slate-300">Sample High-Scoring Argument Points</Label>
                      <Textarea
                        value={q.sample_points}
                        onChange={(e) => handleUpdatePart3Question(q.id, { sample_points: e.target.value })}
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
