import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  BookOpen, 
  Zap, 
  Database, 
  FileCode, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Compass, 
  ArrowRight,
  Eye,
  Settings,
  Layers,
  GraduationCap,
  UploadCloud,
  X,
  FileText,
  Headphones,
  PenTool,
  Mic,
  Volume2,
  Play,
  Pause,
  Sliders,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncCourseTierAccess } from "@/src/lib/membershipService";
import { CourseAccessTierPicker } from "@/src/components/admin/CourseAccessTierPicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// PRESET COURSES COVERING ALL 4 IELTS SKILLS + MOCK TESTS
const PRESET_COURSES = [
  {
    id: "preset-ai-education",
    title: "IELTS Academic Reading: Artificial Intelligence in Education",
    description: "An interactive, three-passage curriculum test covering the rise of AI in modern classrooms, adaptive learning tools, and ethical data privacy challenges.",
    course_type: "Reading Test",
    type: "Academic",
    category: "Reading Mastery",
    layout_type: "split",
    timeLimit: 60,
    test_number: "Reading Test 1",
    cefr: "B2",
    difficulty: "6.5/10",
    access_tier: "Free Trial",
    audio_url: "",
    transcript_url: "",
    transcript_name: "",
    show_in_catalog: true,
    show_in_syllabus: true,
    show_in_practice: true,
    is_mock_test: false,
    blocks: {
      single: [],
      left: [
        {
          id: "passage-1",
          type: "reading-passage",
          sectionNumber: 1,
          data: {
            title: "Passage 1: AI in the Modern Classroom",
            text: "Artificial intelligence is now becoming a visible part of many classrooms. In the past, technology in education usually meant computers, projectors, or online videos. Today, AI can do more than simply show information. It can analyse student performance, recommend learning materials, mark simple exercises, and even respond to student questions. In some schools, AI-powered platforms are used to create personalised learning paths. These systems observe how students answer questions and then adjust the difficulty of future tasks.\n\nOne common use of AI is adaptive learning. If a student is weak in grammar, mathematics, or reading, the system can provide extra practice in that area. If another student learns quickly, the program may offer more challenging tasks. This allows students to move at a pace that suits their ability. Teachers can also view reports that show which students need help and which topics require more classroom attention.\n\nAI is also used in language learning. Speech recognition tools can listen to pronunciation and provide instant feedback. Writing assistants can identify spelling errors, grammar mistakes, and unclear sentences. For students who feel shy in class, AI tools may offer a private space to practise. However, these tools are most useful when students understand that feedback is guidance, not a final judgment.\n\nIn addition, AI can support students with special learning needs. Text-to-speech tools can help learners who struggle with reading, while translation tools may support students who are learning in a second language. Some platforms can enlarge text, simplify instructions, or convert spoken words into written notes. These features can make learning more accessible.\n\nDespite these developments, AI does not automatically improve education. Its value depends on how it is used. A skilled teacher can use AI as a support tool, but poor planning can turn AI into a distraction. The most effective classrooms combine human explanation, discussion, practice, and technology."
          }
        },
        {
          id: "passage-2",
          type: "reading-passage",
          sectionNumber: 2,
          data: {
            title: "Passage 2: Benefits and Risks for Teachers and Students",
            text: "Supporters of AI in education argue that it can reduce pressure on teachers and make learning more efficient for students. Teachers often spend many hours marking quizzes, checking homework, preparing worksheets, and identifying weak areas. AI can assist with some of these tasks, giving teachers more time to plan lessons, guide discussions, and support students emotionally. When used well, AI can help teachers become more strategic rather than less important.\n\nFor students, AI offers fast feedback. Instead of waiting days for a teacher to check an exercise, students can receive immediate comments. This can be especially useful during exam preparation, where repeated practice is necessary. AI can also recommend revision activities based on previous mistakes. In this way, learning can become more targeted and less random.\n\nHowever, there are serious risks. One problem is overdependence. If students allow AI to write essays, solve problems, or summarise texts without thinking, they may lose the habit of independent learning. Education is not only about producing correct answers; it is also about developing patience, reasoning, creativity, and judgment. If AI removes all difficulty, students may become weaker learners.\n\nAnother concern is fairness. Not every school has equal access to reliable internet, updated devices, or paid AI platforms. Students from wealthy backgrounds may benefit more, while others may be left behind. This could increase educational inequality instead of reducing it.\n\nThere are also privacy concerns. AI systems often collect data about student performance, behaviour, and learning patterns. Schools must ask who owns this data, how it is stored, and whether it can be misused. Without clear rules, educational data may become a business product rather than a learning support.\n\nTeachers also face professional challenges. Some may fear that AI will reduce their role. Others may feel pressure to use tools they do not fully understand. Training is therefore essential. Teachers need to know not only how to operate AI tools but also when to trust them, when to question them, and when to avoid them."
          }
        },
        {
          id: "passage-3",
          type: "reading-passage",
          sectionNumber: 3,
          data: {
            title: "Passage 3: Can AI Replace Traditional Education?",
            text: "The question of whether artificial intelligence can replace traditional education is becoming more common. Some people believe that AI tutors, online courses, and automated feedback systems will make schools less necessary. They argue that AI can teach any subject at any time, repeat explanations patiently, and personalise lessons for each learner. From this view, the classroom may seem old-fashioned.\n\nThere is some truth in this argument. AI can provide information quickly and can support independent learning. A student can ask for an explanation of photosynthesis, a maths problem, or an essay structure and receive a response within seconds. For motivated learners, this access can be powerful. AI can act like a study assistant available outside school hours.\n\nHowever, traditional education is not only the transfer of information. Schools are social environments where students learn cooperation, discipline, responsibility, and communication. A classroom teaches students how to listen to others, ask questions, handle disagreement, and participate in a group. These experiences are difficult to replace with a machine.\n\nTeachers also do more than explain content. They notice confusion, fear, laziness, confidence, and emotional changes. A good teacher can motivate a student, challenge weak habits, and understand family or social factors that affect learning. AI may identify mistakes in an answer, but it cannot fully understand the human story behind those mistakes.\n\nAnother limitation is moral and cultural learning. Education includes values, ethics, and identity. Students need adults who model honesty, patience, respect, and empathy. AI can provide examples of these ideas, but it does not live them. Human role models remain essential.\n\nThe most realistic future is not AI replacing education, but AI reshaping it. Schools may use AI for practice, revision, feedback, and support, while teachers focus more on guidance, discussion, creativity, and human development. Traditional education may change, but its human purpose will remain."
          }
        }
      ],
      right: [
        {
          id: "range-1",
          type: "question-range",
          data: { text: "Questions 1–7: True/False/Not Given", sectionNumber: 1 }
        },
        {
          id: "tfng-1",
          type: "true-false-not-given",
          sectionNumber: 1,
          data: {
            sectionHeading: "True/False/Not Given",
            sectionInstruction: "Write TRUE if the statement agrees with the information, FALSE if the statement contradicts, or NOT GIVEN if there is no information.",
            statements: [
              { id: "p1-q1", qNum: 1, text: "AI in education can analyse how students perform.", answer: "TRUE" },
              { id: "p1-q2", qNum: 2, text: "Adaptive learning gives every student the same tasks.", answer: "FALSE" },
              { id: "p1-q3", qNum: 3, text: "Teachers can use AI reports to identify students who need support.", answer: "TRUE" },
              { id: "p1-q4", qNum: 4, text: "Speech recognition tools can help with pronunciation practice.", answer: "TRUE" },
              { id: "p1-q5", qNum: 5, text: "AI tools are always more accurate than human teachers.", answer: "NOT GIVEN" },
              { id: "p1-q6", qNum: 6, text: "Translation tools may help students learning in a second language.", answer: "TRUE" },
              { id: "p1-q7", qNum: 7, text: "The passage says AI should completely replace classroom discussion.", answer: "FALSE" }
            ]
          }
        },
        {
          id: "range-2",
          type: "question-range",
          data: { text: "Questions 8–13: Sentence Completion", sectionNumber: 1 }
        },
        {
          id: "blank-1",
          type: "fill-blanks",
          sectionNumber: 1,
          data: {
            sectionHeading: "Sentence Completion",
            sectionInstruction: "Complete the sentences using NO MORE THAN TWO WORDS from the passage.",
            text: "8. AI-powered platforms can create personalised learning ____.\n9. Adaptive systems can adjust the ____ of future tasks.\n10. Writing assistants can identify grammar mistakes and unclear ____.\n11. AI may provide shy students with a private space to ____.\n12. Text-to-speech tools can help learners who struggle with ____.\n13. The best classrooms combine human explanation, discussion, practice, and ____.",
            answers: "paths | difficulty | sentences | practise | reading | technology"
          }
        },
        {
          id: "range-3",
          type: "question-range",
          data: { text: "Questions 14–19: Matching Headings (Passage 2)", sectionNumber: 2 }
        },
        {
          id: "match-headings-1",
          type: "matching-headings",
          sectionNumber: 2,
          data: {
            headings: "A. The danger of students becoming dependent\nB. Why teacher training matters\nC. How AI can save teachers' time\nD. The problem of unequal access\nE. The value of quick feedback\nF. Concerns about student data",
            paragraphs: [
              { name: "Paragraph 1 (Supporters of AI argue...)", answer: "C" },
              { name: "Paragraph 2 (For students, AI offers...)", answer: "E" },
              { name: "Paragraph 3 (However, there are serious risks...)", answer: "A" },
              { name: "Paragraph 4 (Another concern is fairness...)", answer: "D" },
              { name: "Paragraph 5 (There are also privacy concerns...)", answer: "F" },
              { name: "Paragraph 6 (Teachers also face professional challenges...)", answer: "B" }
            ]
          }
        },
        {
          id: "range-4",
          type: "question-range",
          data: { text: "Questions 20–24: Multiple Choice (Passage 2)", sectionNumber: 2 }
        },
        {
          id: "mcq-1",
          type: "mcq",
          sectionNumber: 2,
          data: {
            questionNumber: 20,
            question: "According to the passage, AI can help teachers by",
            options: [
              "A. removing all classroom duties",
              "B. reducing some routine tasks",
              "C. replacing lesson planning completely",
              "D. stopping students from asking questions"
            ],
            correctAnswer: "B"
          }
        }
      ]
    }
  },
  {
    id: "preset-listening-orientation",
    title: "IELTS Academic Listening: Campus Orientation & Academic Facilities",
    description: "Authentic multi-section listening simulation featuring student accommodation enquiries, sports complex guide, environmental research project discussion, and a lecture on urban architecture.",
    course_type: "Listening Test",
    type: "Academic",
    category: "Listening Mastery",
    layout_type: "split",
    timeLimit: 30,
    test_number: "Listening Test 1",
    cefr: "B2",
    difficulty: "6.5/10",
    access_tier: "Free Trial",
    audio_url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    transcript_url: "",
    transcript_name: "Full Audio Recording Transcript (Sections 1–4)",
    show_in_catalog: true,
    show_in_syllabus: true,
    show_in_practice: true,
    is_mock_test: false,
    blocks: {
      single: [],
      left: [
        {
          id: "list-sec-1",
          type: "text",
          sectionNumber: 1,
          data: {
            title: "Section 1: Accommodation Services Dialogue",
            text: "### Section 1 Scenario\nA conversation between a newly enrolled postgraduate student and a university housing officer discussing on-campus studio options, catered meal plans, and semester lease terms.\n\n**Key Audio Markers:**\n- Contact Details and Student ID validation\n- Room inventory and ensuite bathroom criteria\n- Weekly deposit and utilities breakdown"
          }
        },
        {
          id: "list-sec-2",
          type: "text",
          sectionNumber: 2,
          data: {
            title: "Section 2: Campus Sports & Wellness Orientation",
            text: "### Section 2 Scenario\nA guide presenting facilities and fitness programs at the new university wellness pavilion.\n\n**Key Audio Markers:**\n- Operating hours and off-peak student rates\n- Olympic pool schedule and reservation system\n- Induction workshops and equipment booking"
          }
        },
        {
          id: "list-sec-3",
          type: "text",
          sectionNumber: 3,
          data: {
            title: "Section 3: Environmental Science Tutorial Discussion",
            text: "### Section 3 Scenario\nTwo undergraduate students consulting their course supervisor about fieldwork research on wetland biodiversity and soil nitrate testing."
          }
        }
      ],
      right: [
        {
          id: "list-range-1",
          type: "question-range",
          data: { text: "Questions 1–5: Form Completion (Section 1)", sectionNumber: 1 }
        },
        {
          id: "list-blank-1",
          type: "fill-blanks",
          sectionNumber: 1,
          data: {
            sectionHeading: "Student Housing Application",
            sectionInstruction: "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
            text: "1. Applicant Surname: Jenkins\n2. Preferred Residence: ____ Hall\n3. Room Specification: Ensuite with single ____\n4. Contract Length: ____ weeks\n5. Max Weekly Budget: £____",
            answers: "Wellington | balcony | 42 | 165"
          }
        },
        {
          id: "list-range-2",
          type: "question-range",
          data: { text: "Questions 6–10: Multiple Choice (Section 2)", sectionNumber: 2 }
        },
        {
          id: "list-mcq-1",
          type: "listening-mcq",
          sectionNumber: 2,
          data: {
            questionNumber: 6,
            question: "The newly renovated gym is open free of charge for students during",
            options: [
              "A. early morning before 8:00 AM",
              "B. weekday off-peak hours (1:00 PM - 4:00 PM)",
              "C. weekend evenings only",
              "D. Sunday public holidays"
            ],
            correctAnswer: "B"
          }
        },
        {
          id: "list-mcq-2",
          type: "listening-mcq",
          sectionNumber: 2,
          data: {
            questionNumber: 7,
            question: "To use the Olympic pool, students must first",
            options: [
              "A. show proof of a medical certificate",
              "B. complete a 15-minute safety induction",
              "C. purchase an annual club pass",
              "D. register via the student union mobile app"
            ],
            correctAnswer: "B"
          }
        }
      ]
    }
  },
  {
    id: "preset-writing-energy",
    title: "IELTS Academic Writing: Renewable Energy Transition & AI Workforce",
    description: "Full Task 1 & Task 2 examination pack. Task 1 requires describing a comparative renewable energy chart (150 words). Task 2 presents a discursive essay prompt on artificial intelligence and workplace automation (250 words).",
    course_type: "Writing Test",
    type: "Academic",
    category: "Writing Mastery",
    layout_type: "split",
    timeLimit: 60,
    test_number: "Writing Test 1",
    cefr: "B2",
    difficulty: "7.0/10",
    access_tier: "Free Trial",
    audio_url: "",
    transcript_url: "",
    transcript_name: "",
    show_in_catalog: true,
    show_in_syllabus: true,
    show_in_practice: true,
    is_mock_test: false,
    blocks: {
      single: [],
      left: [
        {
          id: "w-task1-prompt",
          type: "text",
          sectionNumber: 1,
          data: {
            title: "Writing Task 1: Chart Description",
            text: "### Academic Writing Task 1\nYou should spend about **20 minutes** on this task.\n\n*The chart below shows the percentage of electricity generated from renewable sources (Solar, Wind, Hydro, and Biomass) in four European countries between 2010 and 2025.*\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least **150 words**."
          }
        },
        {
          id: "w-task2-prompt",
          type: "text",
          sectionNumber: 2,
          data: {
            title: "Writing Task 2: Discursive Essay",
            text: "### Academic Writing Task 2\nYou should spend about **40 minutes** on this task.\n\nWrite about the following topic:\n\n*Some people believe that artificial intelligence and automation will eliminate most traditional jobs, causing widespread economic hardship. Others argue that AI will create entirely new industries and improve overall human productivity.*\n\nDiscuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least **250 words**."
          }
        }
      ],
      right: [
        {
          id: "w-resp-1",
          type: "academic-task1",
          sectionNumber: 1,
          data: {
            taskNumber: 1,
            title: "Task 1 Response Submission",
            instruction: "Type your Task 1 response below. Minimum 150 words.",
            minWords: 150,
            text: ""
          }
        },
        {
          id: "w-resp-2",
          type: "task2",
          sectionNumber: 2,
          data: {
            taskNumber: 2,
            title: "Task 2 Response Submission",
            instruction: "Type your Task 2 discursive essay below. Minimum 250 words.",
            minWords: 250,
            text: ""
          }
        }
      ]
    }
  },
  {
    id: "preset-speaking-technology",
    title: "IELTS Speaking Practice: Technology, Education & Future Careers",
    description: "Complete 3-part computer-simulated IELTS Speaking test with Part 1 introduction warm-up, Part 2 Cue Card (with 1-min preparation timer), and Part 3 abstract discussion questions.",
    course_type: "Speaking Test",
    type: "Academic",
    category: "Speaking Mastery",
    layout_type: "split",
    timeLimit: 15,
    test_number: "Speaking Test 1",
    cefr: "B2",
    difficulty: "6.5/10",
    access_tier: "Free Trial",
    audio_url: "https://actions.google.com/sounds/v1/ambiences/office_hallway.ogg",
    transcript_url: "",
    transcript_name: "Speaking Examiner Guide & Model Band 8 Answers",
    show_in_catalog: true,
    show_in_syllabus: true,
    show_in_practice: true,
    is_mock_test: false,
    blocks: {
      single: [],
      left: [
        {
          id: "sp-guide-1",
          type: "text",
          sectionNumber: 1,
          data: {
            title: "Examiner Assessment Protocol",
            text: "### IELTS Speaking Test Structure\n- **Part 1 (4–5 mins):** General questions about yourself, your studies, and everyday topics.\n- **Part 2 (3–4 mins):** Monologue based on a Cue Card. You have 1 minute to take notes and 2 minutes to speak uninterrupted.\n- **Part 3 (4–5 mins):** In-depth analytical discussion connecting to the Part 2 theme.\n\n**Scoring Criteria:** Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation."
          }
        }
      ],
      right: [
        {
          id: "sp-part1",
          type: "part1",
          sectionNumber: 1,
          data: {
            title: "Part 1: Warm-up & Everyday Habits",
            topic: "Technology in Daily Life",
            instruction: "Answer the examiner's questions clearly in 2–3 sentences each.",
            questions: [
              "How often do you use digital devices for study or work?",
              "Do you prefer reading printed books or reading on a screen? Why?",
              "What is an app or website that helps you stay productive?"
            ]
          }
        },
        {
          id: "sp-part2",
          type: "cue-card",
          sectionNumber: 2,
          data: {
            title: "Part 2: Individual Long Turn (Cue Card)",
            topic: "Describe a piece of technology that you find extremely useful",
            instruction: "You have 1 minute to prepare your notes. You should speak for 1 to 2 minutes.",
            bullets: [
              "What the technology is and when you started using it",
              "How often you use it and for what purpose",
              "How it has made your work or daily routine easier",
              "And explain why you would recommend it to others"
            ]
          }
        },
        {
          id: "sp-part3",
          type: "part3",
          sectionNumber: 3,
          data: {
            title: "Part 3: Two-Way Analytical Discussion",
            topic: "Technology & Society in the 21st Century",
            instruction: "Develop your answers with reasons, examples, and counterarguments.",
            questions: [
              "Do you think modern technology has increased or decreased personal isolation?",
              "Should governments regulate how artificial intelligence is used in schools?",
              "How might workplace communication change over the next twenty years?"
            ]
          }
        }
      ]
    }
  }
];

// SQL SCRIPT FOR SUPABASE DB SYNCHRONIZATION PANEL
const SUPABASE_SQL_CODE = `-- -----------------------------------------------------
-- Database schema update for full course synchronisation
-- Run this in your Supabase SQL Editor to support the courses metadata
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT,
    level TEXT DEFAULT '7.0',
    type TEXT DEFAULT 'Academic',
    difficulty TEXT DEFAULT 'Intermediate',
    course_format TEXT DEFAULT 'split',
    tags TEXT[] DEFAULT '{}'::TEXT[],
    status TEXT DEFAULT 'Draft',
    modules JSONB DEFAULT '[]'::JSONB,
    featured_image TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    thumbnail_type TEXT DEFAULT 'image',
    course_type TEXT DEFAULT 'Reading Test',
    layout_type TEXT DEFAULT 'split',
    show_in_catalog BOOLEAN DEFAULT TRUE,
    show_in_syllabus BOOLEAN DEFAULT TRUE,
    show_in_practice BOOLEAN DEFAULT TRUE,
    time_limit INTEGER DEFAULT 60,
    test_number TEXT,
    is_mock_test BOOLEAN DEFAULT FALSE,
    exam_category TEXT DEFAULT 'Academic',
    access_tier TEXT DEFAULT 'Free Trial',
    audio_url TEXT DEFAULT '',
    transcript_url TEXT DEFAULT '',
    transcript_name TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '7.0';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_format TEXT DEFAULT 'split';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_type TEXT DEFAULT 'image';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'Reading Test';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'split';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS show_in_catalog BOOLEAN DEFAULT TRUE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS show_in_syllabus BOOLEAN DEFAULT TRUE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS show_in_practice BOOLEAN DEFAULT TRUE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 60;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS test_number TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_mock_test BOOLEAN DEFAULT FALSE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS exam_category TEXT DEFAULT 'Academic';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS access_tier TEXT DEFAULT 'Free Trial';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS transcript_url TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS transcript_name TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
`;

export default function AICourseCreator() {
  const [activeTab, setActiveTab] = useState<"presets" | "generator">("presets");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("All");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // AI Forge Form States
  const [skillType, setSkillType] = useState("reading"); // "reading" | "listening" | "writing" | "speaking" | "mock"
  const [topic, setTopic] = useState("");
  const [rawText, setRawText] = useState("");
  const [courseType, setCourseType] = useState("Academic");
  const [category, setCategory] = useState("Reading Mastery");
  const [accessTier, setAccessTier] = useState("Free Trial");
  const [audioUrl, setAudioUrl] = useState("");
  const [cefrLevel, setCefrLevel] = useState("B2");
  const [difficulty, setDifficulty] = useState("6.5");
  const [timeLimit, setTimeLimit] = useState(60);
  const [testNumber, setTestNumber] = useState("1");
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio Testing State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // File Upload States
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update default category and time limit whenever skill type changes
  useEffect(() => {
    if (skillType === "listening") {
      setCategory("Listening Mastery");
      setTimeLimit(30);
      if (!audioUrl) {
        setAudioUrl("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg");
      }
    } else if (skillType === "writing") {
      setCategory("Writing Mastery");
      setTimeLimit(60);
    } else if (skillType === "speaking") {
      setCategory("Speaking Mastery");
      setTimeLimit(15);
    } else if (skillType === "mock") {
      setCategory("Full Mock Exam");
      setTimeLimit(165);
    } else {
      setCategory("Reading Mastery");
      setTimeLimit(60);
    }
  }, [skillType]);

  // Audio player toggle
  const toggleAudioPlay = (url: string) => {
    if (!url) {
      toast.error("Please enter a valid audio link first.");
      return;
    }

    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => {
          toast.error("Could not play audio track. Please verify URL.");
          setIsPlayingAudio(false);
        };
      } else {
        audioRef.current.src = url;
      }
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
        toast.info("Playing audio stream preview...");
      }).catch(err => {
        toast.error("Audio playback error: " + err.message);
        setIsPlayingAudio(false);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (fileType === "json") {
      reader.onload = (e) => {
        try {
          const jsonText = e.target?.result as string;
          const parsed = JSON.parse(jsonText);
          
          if (parsed.title && (parsed.blocks || parsed.modules)) {
            parsed.id = parsed.id || ((typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : "course-" + Math.random().toString(36).substring(2, 15));
            setSelectedCourse(parsed);
            setUploadedFile({ name: file.name, size: file.size, type: file.type });
            toast.success(`Imported Course Package: ${parsed.title}`);
            addLog(`Imported and loaded JSON course package "${parsed.title}" into curriculum workbench.`);
          } else {
            setRawText(JSON.stringify(parsed, null, 2));
            setUploadedFile({ name: file.name, size: file.size, type: file.type });
            toast.success("Loaded JSON content into raw source text.");
            addLog(`Loaded raw JSON content from "${file.name}" into workspace.`);
            const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            setTopic(cleanName);
          }
        } catch (err: any) {
          toast.error("Failed to parse JSON file.");
          addLog(`ERR: JSON file parse error - ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else if (["txt", "md", "csv", "xml"].includes(fileType || "")) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text);
        setUploadedFile({ name: file.name, size: file.size, type: file.type });
        toast.success(`Loaded text from ${file.name}`);
        addLog(`Loaded raw text from "${file.name}" into workspace.`);
        
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTopic(cleanName);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text);
        setUploadedFile({ name: file.name, size: file.size, type: file.type });
        toast.success(`Loaded content from ${file.name}`);
        addLog(`Loaded raw content from "${file.name}" as text.`);
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTopic(cleanName);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setRawText("");
    toast.info("Cleared uploaded file content.");
    addLog("Cleared custom reading source file.");
  };

  // Sync Log Helper
  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Copy code utility
  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CODE);
    setIsCopied(true);
    toast.success("Supabase SQL Script copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Preset Selection Action
  const handleLoadPreset = (preset: any) => {
    setSelectedCourse(JSON.parse(JSON.stringify(preset)));
    toast.success(`Loaded preset: ${preset.title}`);
    addLog(`Loaded package "${preset.title}" into curriculum workbench.`);
  };

  // AI Generation Action
  const handleGenerateCourse = async () => {
    if (!topic && !rawText) {
      toast.error("Please enter a topic or paste study source material.");
      return;
    }

    setIsGenerating(true);
    const resolvedCourseType = skillType === "listening" ? "Listening Test"
      : skillType === "writing" ? "Writing Test"
      : skillType === "speaking" ? "Speaking Test"
      : skillType === "mock" ? "Mock Test"
      : "Reading Test";

    addLog(`Initiating Gemini-powered Course Forge for "${resolvedCourseType}" on: "${topic || "custom material"}"`);
    
    try {
      const response = await fetch("/api/gemini/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          rawText,
          course_type: resolvedCourseType,
          skillType,
          audioUrl,
          accessTier,
          category,
          type: courseType === "Academic" ? "Academic" : "General Training (GT)",
          cefrLevel,
          difficulty,
          timeLimit,
          testNumber
        })
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Network failed");
      }

      const generatedData = await response.json();
      
      // Inject temporary workspace UUIDs so editable key bindings stay unique
      generatedData.id = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : "gen-" + Math.random().toString(36).substring(2, 15);
      if (audioUrl && !generatedData.audio_url) {
        generatedData.audio_url = audioUrl;
      }
      
      setSelectedCourse(generatedData);
      toast.success(`AI ${resolvedCourseType} generated successfully!`);
      addLog(`Gemini generated curriculum package. Blocks count: ${(generatedData.blocks?.left?.length || 0) + (generatedData.blocks?.right?.length || 0)}.`);
    } catch (err: any) {
      console.error("AI Forge Error:", err);
      toast.error(`AI Generation Failed: ${err.message}`);
      addLog(`ERR: AI forge failed - ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save/Sync Course directly to Supabase Courses Table & Local Storage
  const handleSyncCourse = async () => {
    if (!selectedCourse) return;

    setIsSaving(true);
    addLog(`Starting Supabase Cloud Database synchronisation for: "${selectedCourse.title}"`);
    
    try {
      const passageContent = selectedCourse.blocks?.left?.map((p: any) => p.data?.text || p.data?.title || "").filter(Boolean).join("\n\n") || "";
      const customCategory = selectedCourse.category || selectedCourse.type || "General Training";
      const dbType = selectedCourse.type === "General Training (GT)" ? "General" : "Academic";
      const rawCourseType = selectedCourse.course_type || "Reading Test";
      const skillName = rawCourseType.toLowerCase().includes("listening") ? "listening"
        : rawCourseType.toLowerCase().includes("writing") ? "writing"
        : rawCourseType.toLowerCase().includes("speaking") ? "speaking"
        : "reading";

      const leftBlocks = selectedCourse.blocks?.left || [];
      const rightBlocks = selectedCourse.blocks?.right || [];

      // Build structured lessons based on skill
      const lessonsList: any[] = [];

      if (skillName === "reading") {
        const sections = [
          { title: "Section 1", passage: leftBlocks[0] },
          { title: "Section 2", passage: leftBlocks[1] },
          { title: "Section 3", passage: leftBlocks[2] }
        ];

        sections.forEach((sec, sIdx) => {
          const sectionPassage = sec.passage;
          const sectionTitle = sectionPassage?.data?.title || `Section ${sIdx + 1}: Reading Material`;
          const sectionContent = sectionPassage?.data?.text || `Passage ${sIdx + 1} material.`;
          
          lessonsList.push({
            id: `les-reading-${selectedCourse.id || "1"}-${sIdx + 1}`,
            title: `${sIdx + 1}. ${sectionTitle}`,
            type: "READING",
            content: sectionContent,
            questions: rightBlocks.filter((b: any) => (b.sectionNumber || b.data?.sectionNumber || 1) === sIdx + 1),
            hasTimer: true,
            timeLimit: Math.round((selectedCourse.timeLimit || 60) / 3)
          });
        });
      } else if (skillName === "listening") {
        lessonsList.push({
          id: `les-listening-${selectedCourse.id || Date.now()}`,
          title: selectedCourse.title || "IELTS Listening Full Test",
          type: "LISTENING",
          content: passageContent || "Listening audio tracks and examination sections.",
          questions: rightBlocks,
          audioUrl: selectedCourse.audio_url || "",
          transcriptUrl: selectedCourse.transcript_url || "",
          transcriptName: selectedCourse.transcript_name || "Audio Transcript",
          hasTimer: true,
          timeLimit: selectedCourse.timeLimit || 30
        });
      } else if (skillName === "writing") {
        lessonsList.push({
          id: `les-writing-${selectedCourse.id || Date.now()}`,
          title: selectedCourse.title || "IELTS Writing Examination",
          type: "WRITING",
          content: passageContent || "Writing Task 1 & Task 2 prompts.",
          questions: rightBlocks,
          hasTimer: true,
          timeLimit: selectedCourse.timeLimit || 60
        });
      } else if (skillName === "speaking") {
        lessonsList.push({
          id: `les-speaking-${selectedCourse.id || Date.now()}`,
          title: selectedCourse.title || "IELTS Speaking Interview",
          type: "SPEAKING",
          content: passageContent || "Speaking cue card and prompt questions.",
          questions: rightBlocks,
          hasTimer: true,
          timeLimit: selectedCourse.timeLimit || 15
        });
      }

      const compiledModules = [
        {
          id: `mod-${selectedCourse.id || Date.now()}`,
          title: `${rawCourseType} Curriculum Module`,
          skillType: skillName,
          lessons: lessonsList,
          designer_blocks: selectedCourse.blocks,
          access_tier: selectedCourse.access_tier || "Free Trial",
          test_number: selectedCourse.test_number || "1"
        }
      ];

      const courseId = selectedCourse.id || ((typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : "course-" + Math.random().toString(36).substring(2, 15));

      const payloadSchemaA = {
        id: courseId,
        title: selectedCourse.title || "Untitled",
        description: selectedCourse.description || "",
        content: passageContent,
        category: customCategory,
        level: selectedCourse.cefr || "7.0",
        type: dbType,
        difficulty: selectedCourse.difficulty || "Intermediate",
        status: "Published",
        modules: compiledModules,
        featured_image: "",
        thumbnail_url: selectedCourse.thumbnail_url || "",
        thumbnail_type: "image",
        course_type: rawCourseType,
        layout_type: selectedCourse.layout_type || "split",
        course_format: selectedCourse.layout_type || "split",
        show_in_catalog: selectedCourse.show_in_catalog !== undefined ? selectedCourse.show_in_catalog : true,
        show_in_syllabus: selectedCourse.show_in_syllabus !== undefined ? selectedCourse.show_in_syllabus : true,
        show_in_practice: selectedCourse.show_in_practice !== undefined ? selectedCourse.show_in_practice : true,
        time_limit: selectedCourse.timeLimit || 60,
        test_number: selectedCourse.test_number || "1",
        is_mock_test: rawCourseType.includes("Mock") || !!selectedCourse.is_mock_test,
        exam_category: selectedCourse.type === "General Training (GT)" ? "General Training" : "Academic",
        access_tier: selectedCourse.access_tier || "Free Trial",
        audio_url: selectedCourse.audio_url || "",
        transcript_url: selectedCourse.transcript_url || "",
        transcript_name: selectedCourse.transcript_name || ""
      };

      addLog(`Upserting core record into table "courses"...`);
      const { error } = await supabase.from("courses").upsert([payloadSchemaA]);

      if (error) {
        throw error;
      }

      // Also update localStorage so local state and offline mode reflect the new course
      try {
        const existingLocal = JSON.parse(localStorage.getItem('mock_courses') || '[]');
        const updatedLocal = [payloadSchemaA, ...existingLocal.filter((c: any) => c.id !== courseId)];
        localStorage.setItem('mock_courses', JSON.stringify(updatedLocal));
        localStorage.setItem('designer_courses', JSON.stringify(updatedLocal));
      } catch (e) {}

      // Synchronize with membership tiers catalog
      try {
        await syncCourseTierAccess(courseId, [selectedCourse.access_tier || "Free Trial"]);
      } catch (e) {
        console.warn("Could not sync membership tier in AICourseCreator:", e);
      }

      toast.success("Database synced successfully! Course is live in Courses section.");
      addLog(`SUCCESS: Course uploaded and fully indexed in public.courses table!`);
    } catch (dbErr: any) {
      console.error("Supabase Sync Error:", dbErr);
      toast.error(`Database Sync Failed: ${dbErr.message}`);
      addLog(`ERR: Supabase update aborted - ${dbErr.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Transfer to Course Designer Draft
  const handleOpenInCourseDesigner = () => {
    if (!selectedCourse) return;
    try {
      localStorage.setItem('in_progress_course_designer_draft', JSON.stringify(selectedCourse));
      if (selectedCourse.id) {
        localStorage.setItem('active_course_designer_id', selectedCourse.id);
      }
      toast.success("Course transferred to Course Designer draft!");
      addLog("Transferred active course package to Course Designer workspace draft.");
    } catch (e) {
      toast.error("Could not write to local draft storage.");
    }
  };

  // Filtered Presets
  const filteredPresets = PRESET_COURSES.filter(preset => {
    if (selectedSkillFilter === "All") return true;
    return preset.course_type.toLowerCase().includes(selectedSkillFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6 animate-fade-in" id="ai-course-creator-root">
      
      {/* Visual Ambient Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 dark:bg-black p-8 sm:p-12 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              AI curriculum center
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none italic">
              AI Course Creator
            </h1>
            <p className="text-sm text-slate-400 font-semibold max-w-2xl leading-relaxed">
              Design and forge all IELTS modules — Reading, Listening (with audio stream integration), Writing, and Speaking — via server-side Gemini AI in seconds, with full metadata mapping.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={activeTab === "presets" ? "default" : "outline"}
              className={`rounded-2xl font-bold h-12 px-6 transition-all ${activeTab === "presets" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-slate-800 text-slate-300 hover:bg-slate-900"}`}
              onClick={() => setActiveTab("presets")}
            >
              <Compass className="w-4 h-4 mr-2" />
              Presets Packages
            </Button>
            <Button 
              variant={activeTab === "generator" ? "default" : "outline"}
              className={`rounded-2xl font-bold h-12 px-6 transition-all ${activeTab === "generator" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-slate-800 text-slate-300 hover:bg-slate-900"}`}
              onClick={() => setActiveTab("generator")}
            >
              <Zap className="w-4 h-4 mr-2 text-amber-400" />
              Gemini AI Forge
            </Button>
          </div>
        </div>
      </div>

      {/* Main Interface Full Width Container */}
      <div className="space-y-6">
        
        {/* Main Interface Action Sections */}
        <div className="space-y-6">
          
          {/* TAB 1: PRESET PACKAGE SELECTOR */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              {/* Skill Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {["All", "Reading", "Listening", "Writing", "Speaking"].map(skill => (
                  <Button
                    key={skill}
                    variant={selectedSkillFilter === skill ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSkillFilter(skill)}
                    className={`rounded-xl text-xs font-bold px-4 h-9 ${
                      selectedSkillFilter === skill 
                        ? "bg-indigo-600 text-white" 
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {skill === "Reading" && <BookOpen className="w-3.5 h-3.5 mr-1.5" />}
                    {skill === "Listening" && <Headphones className="w-3.5 h-3.5 mr-1.5" />}
                    {skill === "Writing" && <PenTool className="w-3.5 h-3.5 mr-1.5" />}
                    {skill === "Speaking" && <Mic className="w-3.5 h-3.5 mr-1.5" />}
                    {skill === "All" && <Layers className="w-3.5 h-3.5 mr-1.5" />}
                    {skill} Modules
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPresets.map((preset) => (
                  <Card 
                    key={preset.id} 
                    className="rounded-[2rem] border border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden relative group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <CardHeader className="space-y-3 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 rounded-lg text-[10px] font-black uppercase">
                            {preset.course_type}
                          </Badge>
                          {preset.audio_url && (
                            <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                              <Volume2 className="w-3 h-3" /> Audio Track
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {preset.type}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">{preset.timeLimit} mins</span>
                      </div>
                      <CardTitle className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {preset.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {preset.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                        <span>CEFR: <strong className="text-slate-800 dark:text-slate-200">{preset.cefr}</strong></span>
                        <span>Level: <strong className="text-slate-800 dark:text-slate-200">{preset.difficulty}</strong></span>
                        <span>Tier: <strong className="text-emerald-600">{preset.access_tier}</strong></span>
                      </div>

                      <Button 
                        className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-indigo-600 dark:hover:bg-indigo-400 text-xs font-black transition-all flex items-center justify-center gap-2"
                        onClick={() => handleLoadPreset(preset)}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Load into Workbench
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AI FORGE GENERATOR */}
          {activeTab === "generator" && (
            <Card className="rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Gemini AI Course Forge
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Synthesize IELTS Curriculum
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Select your desired skill module (Reading, Listening, Writing, Speaking), customize metadata, provide topic or source text, and generate structured exams with automated question types.
                </p>
              </div>

              {/* Skill Module Selection Tabs */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Target Skill Module</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "reading", label: "Reading", icon: BookOpen },
                    { id: "listening", label: "Listening", icon: Headphones },
                    { id: "writing", label: "Writing", icon: PenTool },
                    { id: "speaking", label: "Speaking", icon: Mic },
                    { id: "mock", label: "Full Mock", icon: Layers }
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSel = skillType === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSkillType(s.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-black transition-all ${
                          isSel 
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-md"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSel ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Core Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Curriculum Topic / Title</label>
                  <Input 
                    placeholder="e.g. Sustainable Urban Planning & Mobility"
                    className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold focus-visible:ring-indigo-500 text-sm"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Course Category</label>
                  <Input 
                    placeholder="e.g. Reading Mastery / Climate & Science"
                    className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold focus-visible:ring-indigo-500 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              {/* Audio Stream Link (Appears when Listening is selected or if audio is provided) */}
              {(skillType === "listening" || audioUrl) && (
                <div className="space-y-3 p-4 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5" /> Audio Stream / Recording Link (Listening Module)
                    </label>
                    <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold">Direct URL or MP3 Link</span>
                  </div>

                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://example.com/ielts_listening_track.mp3"
                      className="h-11 rounded-xl border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-950 text-xs font-bold"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => toggleAudioPlay(audioUrl)}
                      className={`rounded-xl h-11 px-4 text-xs font-black flex items-center gap-1.5 transition-all ${
                        isPlayingAudio 
                          ? "bg-amber-600 text-white border-amber-600" 
                          : "border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlayingAudio ? "Stop" : "Test"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="text-slate-400 font-bold">Quick sample links:</span>
                    <button 
                      type="button"
                      onClick={() => setAudioUrl("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg")}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-200"
                    >
                      Campus Dialogue
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAudioUrl("https://actions.google.com/sounds/v1/ambiences/office_hallway.ogg")}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-200"
                    >
                      Academic Interview
                    </button>
                  </div>
                </div>
              )}

              {/* Secondary Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam Format</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none"
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value)}
                  >
                    <option value="Academic">Academic</option>
                    <option value="General">General (GT)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Access Tier</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none"
                    value={accessTier}
                    onChange={(e) => setAccessTier(e.target.value)}
                  >
                    <option value="Free Trial">Free Trial</option>
                    <option value="Pro Premium">Pro Premium</option>
                    <option value="Mastery Ultimate">Mastery Ultimate</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Target CEFR / Band</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none"
                    value={cefrLevel}
                    onChange={(e) => setCefrLevel(e.target.value)}
                  >
                    <option value="B1">B1 (Band 5.0 - 5.5)</option>
                    <option value="B2">B2 (Band 6.0 - 6.5)</option>
                    <option value="C1">C1 (Band 7.0 - 7.5)</option>
                    <option value="C2">C2 (Band 8.0 - 9.0)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Time Limit (mins)</label>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Source Material Upload / Paste */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Custom Reading / Study Source Text (Optional)</label>
                  <span className="text-[9px] text-slate-400 font-bold italic">Bypasses topic auto-generation</span>
                </div>

                {/* Drag and Drop File Uploader Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-5 flex flex-col items-center justify-center transition-all ${
                    isDragging 
                      ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <input 
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    accept=".txt,.md,.json,.csv,.xml"
                    onChange={handleFileChange}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-between w-full bg-indigo-50/30 dark:bg-indigo-950/20 px-4 py-3 rounded-2xl border border-indigo-500/10 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                          <FileText className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="rounded-xl h-8 w-8 hover:bg-red-500/10 hover:text-red-500 text-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="file-upload-input" 
                      className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full h-full py-4 group"
                    >
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-400 dark:text-slate-600 transition-transform group-hover:scale-105">
                        <UploadCloud className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="text-indigo-500 font-black">Click to upload source document</span> or drag and drop
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Supported formats: .txt, .md, .json, .csv, .xml
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                <Textarea 
                  placeholder="Paste your source text, transcript, reading passage, or exam prompts here..."
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs min-h-[130px]"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              <Button 
                disabled={isGenerating}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-all"
                onClick={handleGenerateCourse}
              >
                {isGenerating ? "Forging Course via Gemini AI..." : "Forge Curriculum Package"}
                <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
              </Button>
            </Card>
          )}

          {/* EDITABLE WORKBENCH CANVAS */}
          <AnimatePresence mode="wait">
            {selectedCourse ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Active Course Title & Header */}
                <Card className="rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30 p-6 space-y-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-indigo-600 text-white rounded-lg uppercase text-[9px] font-black">CURRICULUM WORKBENCH</Badge>
                        <Badge className="bg-emerald-500 text-white rounded-lg uppercase text-[9px] font-black">{selectedCourse.course_type || "Reading Test"}</Badge>
                        {selectedCourse.audio_url && (
                          <Badge className="bg-amber-500 text-white rounded-lg uppercase text-[9px] font-black flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Audio Linked
                          </Badge>
                        )}
                        <Badge variant="outline" className="rounded-lg text-[9px] font-bold">{selectedCourse.access_tier || "Free Trial"}</Badge>
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white italic">
                        {selectedCourse.title}
                      </h2>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline"
                        className="rounded-xl h-10 px-4 text-xs font-bold flex items-center gap-1.5 border-slate-300 dark:border-slate-700"
                        onClick={handleOpenInCourseDesigner}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Course Designer
                      </Button>
                      <Button 
                        disabled={isSaving}
                        className="rounded-xl h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/20"
                        onClick={handleSyncCourse}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? "Syncing..." : "Sync to Supabase"}
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Config Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Course Name</label>
                      <Input 
                        value={selectedCourse.title || ""}
                        onChange={(e) => setSelectedCourse({...selectedCourse, title: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Course Skill Type</label>
                      <select 
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none"
                        value={selectedCourse.course_type || "Reading Test"}
                        onChange={(e) => setSelectedCourse({...selectedCourse, course_type: e.target.value})}
                      >
                        <option value="Reading Test">Reading Test</option>
                        <option value="Listening Test">Listening Test</option>
                        <option value="Writing Test">Writing Test</option>
                        <option value="Speaking Test">Speaking Test</option>
                        <option value="Mock Test">Mock Test</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</label>
                      <Input 
                        value={selectedCourse.category || ""}
                        onChange={(e) => setSelectedCourse({...selectedCourse, category: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <CourseAccessTierPicker
                        value={selectedCourse.access_tier || "Free Trial"}
                        courseId={selectedCourse.id}
                        onChange={(tierName) => setSelectedCourse({ ...selectedCourse, access_tier: tierName })}
                      />
                    </div>

                    {/* Audio Link Input */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                          <Headphones className="w-3 h-3 text-amber-500" /> Audio Stream URL
                        </label>
                        {selectedCourse.audio_url && (
                          <button 
                            type="button" 
                            onClick={() => toggleAudioPlay(selectedCourse.audio_url)}
                            className="text-[10px] font-black text-indigo-500 flex items-center gap-1 hover:underline"
                          >
                            {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            {isPlayingAudio ? "Pause" : "Test Play"}
                          </button>
                        )}
                      </div>
                      <Input 
                        value={selectedCourse.audio_url || ""}
                        placeholder="https://domain.com/audio.mp3"
                        onChange={(e) => setSelectedCourse({...selectedCourse, audio_url: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>

                    {/* Transcript Name / Link */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Transcript Name / Label</label>
                      <Input 
                        value={selectedCourse.transcript_name || ""}
                        placeholder="e.g. Official Listening Transcript"
                        onChange={(e) => setSelectedCourse({...selectedCourse, transcript_name: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Time Limit (mins)</label>
                      <Input 
                        type="number"
                        value={selectedCourse.timeLimit || 60}
                        onChange={(e) => setSelectedCourse({...selectedCourse, timeLimit: Number(e.target.value)})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Test Number / Code</label>
                      <Input 
                        value={selectedCourse.test_number || "1"}
                        onChange={(e) => setSelectedCourse({...selectedCourse, test_number: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Target CEFR</label>
                      <Input 
                        value={selectedCourse.cefr || "B2"}
                        onChange={(e) => setSelectedCourse({...selectedCourse, cefr: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Difficulty Band</label>
                      <Input 
                        value={selectedCourse.difficulty || "6.5/10"}
                        onChange={(e) => setSelectedCourse({...selectedCourse, difficulty: e.target.value})}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  {/* Visibility Toggles */}
                  <div className="flex items-center gap-6 pt-3 border-t border-slate-200 dark:border-white/5 flex-wrap text-xs font-bold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedCourse.show_in_catalog !== false}
                        onChange={(e) => setSelectedCourse({...selectedCourse, show_in_catalog: e.target.checked})}
                        className="rounded accent-indigo-600"
                      />
                      <span>Show in Catalog</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedCourse.show_in_syllabus !== false}
                        onChange={(e) => setSelectedCourse({...selectedCourse, show_in_syllabus: e.target.checked})}
                        className="rounded accent-indigo-600"
                      />
                      <span>Show in Syllabus</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedCourse.show_in_practice !== false}
                        onChange={(e) => setSelectedCourse({...selectedCourse, show_in_practice: e.target.checked})}
                        className="rounded accent-indigo-600"
                      />
                      <span>Show in Practice</span>
                    </label>
                  </div>
                </Card>

                {/* Left Panel: Content / Passages / Transcripts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center gap-2 pl-1">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Left Panel Blocks (Passages & Prompts)
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-8 text-xs font-bold"
                      onClick={() => {
                        const copy = { ...selectedCourse };
                        copy.blocks.left = [
                          ...(copy.blocks.left || []),
                          {
                            id: `left-${Date.now()}`,
                            type: "text",
                            sectionNumber: (copy.blocks.left?.length || 0) + 1,
                            data: { title: `New Material ${(copy.blocks.left?.length || 0) + 1}`, text: "Content text..." }
                          }
                        ];
                        setSelectedCourse(copy);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Left Block
                    </Button>
                  </div>

                  {selectedCourse.blocks?.left?.map((p: any, pIdx: number) => (
                    <Card key={p.id || `left-${pIdx}`} className="rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950/20 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <Input 
                          value={p.data?.title || ""}
                          onChange={(e) => {
                            const copy = { ...selectedCourse };
                            copy.blocks.left[pIdx].data = { ...copy.blocks.left[pIdx].data, title: e.target.value };
                            setSelectedCourse(copy);
                          }}
                          className="font-black text-sm rounded-xl border-slate-200 dark:border-slate-800"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const copy = { ...selectedCourse };
                            copy.blocks.left = copy.blocks.left.filter((_: any, i: number) => i !== pIdx);
                            setSelectedCourse(copy);
                          }}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea 
                        value={p.data?.text || ""}
                        onChange={(e) => {
                          const copy = { ...selectedCourse };
                          copy.blocks.left[pIdx].data = { ...copy.blocks.left[pIdx].data, text: e.target.value };
                          setSelectedCourse(copy);
                        }}
                        className="rounded-2xl border-slate-200 dark:border-slate-800 min-h-[140px] text-xs leading-relaxed"
                      />
                    </Card>
                  ))}
                </div>

                {/* Right Panel: Interactive Question Blocks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center gap-2 pl-1">
                      <Sliders className="w-4 h-4 text-indigo-500" />
                      Right Panel Blocks (Questions & Assessments)
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 text-xs font-bold"
                        onClick={() => {
                          const copy = { ...selectedCourse };
                          copy.blocks.right = [
                            ...(copy.blocks.right || []),
                            {
                              id: `q-mcq-${Date.now()}`,
                              type: "mcq",
                              sectionNumber: 1,
                              data: {
                                questionNumber: (copy.blocks.right?.length || 0) + 1,
                                question: "New Multiple Choice Question",
                                options: ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                                correctAnswer: "A"
                              }
                            }
                          ];
                          setSelectedCourse(copy);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add MCQ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 text-xs font-bold"
                        onClick={() => {
                          const copy = { ...selectedCourse };
                          copy.blocks.right = [
                            ...(copy.blocks.right || []),
                            {
                              id: `q-blank-${Date.now()}`,
                              type: "fill-blanks",
                              sectionNumber: 1,
                              data: {
                                sectionHeading: "Fill in the Blanks",
                                sectionInstruction: "Complete the sentence.",
                                text: "The candidate should complete ____ with correct facts.",
                                answers: "blanks"
                              }
                            }
                          ];
                          setSelectedCourse(copy);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Blanks
                      </Button>
                    </div>
                  </div>

                  {selectedCourse.blocks?.right?.map((q: any, qIdx: number) => (
                    <Card key={q.id || `right-${qIdx}`} className="rounded-[2rem] border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950/20 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 rounded-lg text-[9px] font-black uppercase">
                            {q.type}
                          </Badge>
                          {q.sectionNumber && (
                            <Badge variant="outline" className="text-[9px] font-bold">Sec {q.sectionNumber}</Badge>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const copy = { ...selectedCourse };
                            copy.blocks.right = copy.blocks.right.filter((_: any, i: number) => i !== qIdx);
                            setSelectedCourse(copy);
                          }}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl h-8 w-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Render block specific inputs */}
                      {q.type === "question-range" && (
                        <Input 
                          value={q.data?.text || ""}
                          onChange={(e) => {
                            const copy = { ...selectedCourse };
                            copy.blocks.right[qIdx].data.text = e.target.value;
                            setSelectedCourse(copy);
                          }}
                          className="font-bold text-xs rounded-xl"
                        />
                      )}

                      {(q.type === "mcq" || q.type === "listening-mcq") && (
                        <div className="space-y-2">
                          <Input 
                            value={q.data?.question || ""}
                            onChange={(e) => {
                              const copy = { ...selectedCourse };
                              copy.blocks.right[qIdx].data.question = e.target.value;
                              setSelectedCourse(copy);
                            }}
                            placeholder="Question text"
                            className="font-bold text-xs rounded-xl"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input 
                              value={q.data?.correctAnswer || "A"}
                              onChange={(e) => {
                                const copy = { ...selectedCourse };
                                copy.blocks.right[qIdx].data.correctAnswer = e.target.value;
                                setSelectedCourse(copy);
                              }}
                              placeholder="Correct Letter (A/B/C/D)"
                              className="text-xs font-black text-emerald-600 rounded-xl"
                            />
                          </div>
                        </div>
                      )}

                      {(q.type === "fill-blanks" || q.type === "sentence-completion" || q.type === "summary-completion") && (
                        <div className="space-y-2">
                          <Textarea 
                            value={q.data?.text || ""}
                            onChange={(e) => {
                              const copy = { ...selectedCourse };
                              copy.blocks.right[qIdx].data.text = e.target.value;
                              setSelectedCourse(copy);
                            }}
                            className="text-xs rounded-xl min-h-[70px]"
                          />
                          <Input 
                            value={q.data?.answers || ""}
                            onChange={(e) => {
                              const copy = { ...selectedCourse };
                              copy.blocks.right[qIdx].data.answers = e.target.value;
                              setSelectedCourse(copy);
                            }}
                            placeholder="Answers separated by | (e.g. answer1 | answer2)"
                            className="text-xs font-bold text-indigo-600 rounded-xl"
                          />
                        </div>
                      )}

                      {q.type === "true-false-not-given" && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500">Statements ({q.data?.statements?.length || 0})</p>
                          {q.data?.statements?.map((st: any, sIdx: number) => (
                            <div key={sIdx} className="flex gap-2 items-center">
                              <span className="text-xs font-black text-slate-400">{st.qNum || sIdx + 1}.</span>
                              <Input 
                                value={st.text || ""}
                                onChange={(e) => {
                                  const copy = { ...selectedCourse };
                                  copy.blocks.right[qIdx].data.statements[sIdx].text = e.target.value;
                                  setSelectedCourse(copy);
                                }}
                                className="text-xs rounded-xl font-medium"
                              />
                              <select
                                value={st.answer || "TRUE"}
                                onChange={(e) => {
                                  const copy = { ...selectedCourse };
                                  copy.blocks.right[qIdx].data.statements[sIdx].answer = e.target.value;
                                  setSelectedCourse(copy);
                                }}
                                className="h-9 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                              >
                                <option value="TRUE">TRUE</option>
                                <option value="FALSE">FALSE</option>
                                <option value="NOT GIVEN">NOT GIVEN</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
