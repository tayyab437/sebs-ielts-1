import { supabase } from "./supabaseClient";

export interface CurriculumFeature {
  title: string;
  text: string;
}

export interface DetailedCurriculum {
  duration: string;
  focus: string;
  method: string;
  bestFor: string;
  mainFeatures: CurriculumFeature[];
  outcomes: string[];
}

export interface PricingPlan {
  id: string;
  name: string;
  category: "spoken" | "ielts-writing";
  tagline: string;
  priceDisplay: string;
  priceVal: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  isPopular: boolean;
  accent: string;
  detailedCurriculum?: DetailedCurriculum;
  sort_order?: number;
}

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: "plan-1-month-spoken",
    name: "1 Month Spoken English",
    category: "spoken",
    tagline: "Build speech fluency, boost confidence & master conversation basics",
    priceDisplay: "PKR 25,000",
    priceVal: 25000,
    period: "1 Month Program",
    description: "Ideal for beginners looking to build essential speaking, listening and everyday conversation skills.",
    features: [
      "Confidence removal of fear, shyness & hesitation",
      "EBM (Ejaz Bukhari Method) core speech drills",
      "Practical tenses & sentence structure",
      "Everyday vocabulary & pronunciation guidance"
    ],
    cta: "Enroll Spoken English",
    isPopular: false,
    accent: "border-slate-205 dark:border-white/10",
    detailedCurriculum: {
      duration: "1 Month Course Duration",
      focus: "Fast confidence building and basic spoken English improvement based on EBM - Ejaz Bukhari Method.",
      method: "EBM — Ejaz Bukhari Method",
      bestFor: "Beginners, weak speakers, students, job seekers, homemakers, and professionals who want quick improvement in daily speaking.",
      mainFeatures: [
        { title: "Confidence Building", text: "Students are encouraged to speak from the first week. The focus is to remove hesitation, fear, and shyness." },
        { title: "Daily Use Sentences", text: "Students learn practical sentences used at home, school, office, market, phone calls, and social situations." },
        { title: "Grammar in Speaking", text: "Grammar is taught through spoken use, not only rules. Students learn how to use tenses, helping verbs, questions, negatives, and common sentence structures in real speech." },
        { title: "Vocabulary Development", text: "Students learn useful words for daily conversation, family, work, education, shopping, travel, emotions, and routine life." },
        { title: "Question-Answer Practice", text: "Students practise short and clear answers so they can respond confidently in real conversations." },
        { title: "Self-Introduction Training", text: "Students learn how to introduce themselves properly in English for class, interviews, meetings, and social situations." },
        { title: "Pronunciation Correction", text: "Common pronunciation mistakes are corrected gently during speaking practice." },
        { title: "Role Plays", text: "Students practise real-life situations such as meeting someone, asking for help, shopping, giving directions, and talking on the phone." },
        { title: "Error Correction", text: "Students receive correction in sentence structure, word choice, pronunciation, and fluency." },
        { title: "EBM Practice Sheets", text: "Students receive structured practice material based on the Ejaz Bukhari Method to revise and improve outside class." },
        { title: "Speaking Habit Formation", text: "The course builds the habit of speaking English regularly instead of only memorising grammar." },
        { title: "Basic Presentation Practice", text: "Students learn to speak for 1–2 minutes on simple topics such as my family, my routine, my goals, my school, my work, and my city." },
        { title: "Monthly Assessment", text: "At the end of the month, students are assessed in speaking, grammar use, vocabulary, confidence, and fluency." },
        { title: "Certificate of Completion", text: "Students who complete the course receive a certificate from SEB’s Institute." }
      ],
      outcomes: [
        "Introduce themselves confidently.",
        "Speak simple daily-use sentences.",
        "Answer basic questions.",
        "Use common grammar structures in speaking.",
        "Speak on familiar topics for 1–2 minutes.",
        "Reduce hesitation and fear of speaking.",
        "Understand the basic EBM speaking system."
      ]
    },
    sort_order: 1
  },
  {
    id: "plan-1-month-writing",
    name: "1 Month Writing Focus",
    category: "ielts-writing",
    tagline: "Dedicated intensive program for IELTS Writing Task 1 & 2",
    priceDisplay: "PKR 35,000",
    priceVal: 35000,
    period: "1 Month Program",
    description: "Focused strictly on mastering the structural layout, coherence, vocab range, and grammar of IELTS writing.",
    features: [
      "Comprehensive coverage of Task 1 (graphs, diagrams) & Task 2 (essays)",
      "8 detailed live marking reviews by qualified expert instructors",
      "1 Month unlimited instant AI structural and grammar evaluations"
    ],
    cta: "Enroll in Writing Prep",
    isPopular: false,
    accent: "border-teal-500/30 dark:border-teal-500/20",
    detailedCurriculum: {
      duration: "1 Month Course Duration",
      focus: "Mastering the structural layout, coherence, vocabulary range, and grammar of IELTS Academic & GT Writing Task 1 & 2.",
      method: "Instructor Evaluations & Interactive Marking",
      bestFor: "Candidates seeking immediate writing band elevation who keep getting stuck at 6.0 or 6.5.",
      mainFeatures: [
        { title: "Task 1 Diagnostic Drill", text: "Target complete graph trends, chart analysis, process diagrams, system flows, and map explanations with high-band nouns and verbs." },
        { title: "Task 2 Essay Matrix", text: "Learn the 5 core essay templates (opinion, discussion, double-question, etc.) that ensure structural perfection." },
        { title: "Coherence & Cohesion Formulas", text: "Connect paragraphs with professional linkers and lexical referencing to secure a high structural coherence score." },
        { title: "Lexical & Vocabulary Enhancement", text: "Adopt advanced collocations, topic-specific vocabulary packs, and precise antonyms/synonyms to replace generic words." },
        { title: "8 Expert Live Evaluations", text: "Get detailed, fully annotated, human expert corrections grading your spelling, grammar, task achievement, and cohesive flow." },
        { title: "Unlimited AI Essay Grader", text: "Write as many essays as you want and get near-instant band evaluation scores with grammar and syntax explanations 24/7." }
      ],
      outcomes: [
        "Organize IELTS Task 1 and Task 2 replies with complete layout accuracy.",
        "Confidently target and achieve Band 7.5+ in IELTS Writing.",
        "Write beautiful, cohesive paragraphs with transitions.",
        "Manage exam time flawlessly: 20 mins for Task 1 and 40 mins for Task 2."
      ]
    },
    sort_order: 2
  },
  {
    id: "plan-2-month-spoken",
    name: "2 Month Spoken English",
    category: "spoken",
    tagline: "Professional fluency, advanced speech, & presentation training",
    priceDisplay: "PKR 40,000",
    priceVal: 40000,
    period: "2 Months Program",
    description: "Advanced program for students and executives seeking absolute professional command of English.",
    features: [
      "Stronger fluency, tenses flow & speech pacing control",
      "Public speaking workshops & storytelling opinion modules",
      "Job interview bootcamps, resume review & professional self-introduction"
    ],
    cta: "Get Advanced Fluency",
    isPopular: false,
    accent: "border-indigo-500/30 dark:border-indigo-500/20",
    detailedCurriculum: {
      duration: "2 Months Course Duration",
      focus: "Stronger fluency, better grammar control, longer speaking, and real-life communication based on EBM - Ejaz Bukhari Method.",
      method: "EBM — Ejaz Bukhari Method",
      bestFor: "Learners who want deeper improvement, more practice, better fluency, and stronger confidence.",
      mainFeatures: [
        { title: "Complete Confidence Development", text: "Students are trained to speak with more confidence, clarity, and control in daily, academic, and professional situations." },
        { title: "Stronger Grammar for Speaking", text: "Students practise tenses, modals, questions, negatives, conditionals, connectors, and sentence expansion through spoken activities." },
        { title: "Fluency Building", text: "The course focuses on helping students speak longer, smoother, and more naturally without stopping again and again." },
        { title: "Daily Conversation Practice", text: "Students practise conversations related to home, school, office, travel, shopping, interviews, social life, and personal goals." },
        { title: "Vocabulary Expansion", text: "Students learn a wider vocabulary for opinions, feelings, decisions, problems, personality, education, jobs, business, and communication." },
        { title: "Guided Speaking Drills", text: "Students practise sentence patterns repeatedly so correct English becomes a habit." },
        { title: "Storytelling Practice", text: "Students learn how to talk about past experiences, daily events, personal memories, and future plans." },
        { title: "Opinion Speaking", text: "Students learn to express opinions with reasons, using structured phrases like 'I think...', 'In my opinion...', 'The reason is...', 'I agree because...' etc." },
        { title: "Interview English", text: "Students practise common interview questions, professional self-introduction, strengths, weaknesses, goals, and work-related answers." },
        { title: "Presentation Skills", text: "Students learn how to speak on a topic for 2–5 minutes with beginning, middle, and ending." },
        { title: "Pronunciation and Voice Clarity", text: "Students receive correction on pronunciation, stress, pauses, speed, and clarity." },
        { title: "Listening and Response Practice", text: "Students practise understanding questions and giving suitable answers without panic." },
        { title: "Writing-to-Speaking Practice", text: "Students write short ideas and then speak them, helping them organise thoughts before speaking." },
        { title: "Real-Life Role Plays", text: "Students practise practical situations such as client dealing, office discussion, parent-teacher meeting, complaint handling, asking for information, and giving suggestions." },
        { title: "EBM Worksheets and Speaking Tasks", text: "Students receive structured worksheets, sentence-building tasks, vocabulary tasks, and speaking assignments based on EBM." },
        { title: "Weekly Speaking Performance", text: "Students are given short speaking tasks every week to track progress." },
        { title: "Error Log System", text: "Common mistakes are recorded and corrected so students can avoid repeating the same errors." },
        { title: "Monthly Progress Report", text: "Students receive progress feedback on confidence, fluency, grammar, vocabulary, pronunciation, and participation." },
        { title: "Final Speaking Assessment", text: "At the end of two months, students complete a final speaking test, self-introduction, topic presentation, and question-answer session." },
        { title: "Certificate of Completion", text: "Students receive a certificate after successful completion of the program." }
      ],
      outcomes: [
        "Speak more confidently in daily situations.",
        "Give longer answers with reasons.",
        "Use grammar more accurately while speaking.",
        "Speak on common topics for 2–5 minutes.",
        "Handle basic interviews and introductions.",
        "Participate in simple discussions.",
        "Improve pronunciation and fluency.",
        "Use EBM sentence-building techniques independently."
      ]
    },
    sort_order: 3
  },
  {
    id: "plan-4-weeks-ielts",
    name: "SEB’s IELTS General Training Course Based on EBM",
    category: "ielts-writing",
    tagline: "Focused preparation, practical test strategy, band improvement, and exam confidence training",
    priceDisplay: "PKR 44,000",
    priceVal: 44000,
    period: "4 Weeks Program",
    description: "Highly focused, high-intensity IELTS General Training (GT) preparation incorporating the time-tested Ejaz Bukhari Method (EBM) for fast scores.",
    features: [
      "Strategic IELTS GT confidence building for all 4 modules",
      "Regular Letter Writing (Task 1) & Essay (Task 2) evaluations",
      "Comprehensive speaking drills and actual listening strategy sheets",
      "Weak area diagnostics & final mock test assessment"
    ],
    cta: "Fast-Track My GT Score",
    isPopular: true,
    accent: "border-primary ring-2 ring-primary ring-offset-4 dark:ring-offset-slate-950",
    detailedCurriculum: {
      duration: "4 Weeks Program",
      focus: "Fast IELTS General Training preparation, practical test strategy, band improvement, time management, and confidence in all four modules.",
      method: "EBM — Ejaz Bukhari Method",
      bestFor: "Students, professionals, job seekers, immigration applicants, skilled workers, and overseas candidates who want focused IELTS GT preparation in a short time.",
      mainFeatures: [
        {
          title: "IELTS GT Confidence Building",
          text: "Students are guided from the first week to understand the IELTS General Training test format, remove fear, and build confidence for Listening, Reading, Writing, and Speaking."
        },
        {
          title: "Complete Test Understanding",
          text: "Students learn the structure of the IELTS GT test, question types, timing, scoring system, answer rules, and common mistakes that affect band scores."
        },
        {
          title: "Listening Practice",
          text: "Students practise IELTS Listening sections with different accents, keywords, distractors, spellings, numbers, dates, names, maps, forms, and answer transfer techniques."
        },
        {
          title: "General Training Reading Skills",
          text: "Students learn how to handle IELTS GT reading texts such as notices, advertisements, workplace rules, instructions, official information, policies, articles, and longer passages."
        },
        {
          title: "Reading Question-Type Practice",
          text: "Students practise MCQs, matching information, matching headings, True/False/Not Given, sentence completion, summary completion, short-answer questions, and locating details."
        },
        {
          title: "Writing Task 1 Letter Training",
          text: "Students learn how to write formal, semi-formal, and informal letters with correct tone, purpose, opening, body paragraphs, closing, and useful expressions."
        },
        {
          title: "Writing Task 2 Essay Training",
          text: "Students learn how to write IELTS essays with clear introduction, opinion, reasons, examples, paragraph structure, conclusion, coherence, and grammar accuracy."
        },
        {
          title: "Speaking Practice",
          text: "Students practise IELTS Speaking Part 1, Part 2, and Part 3 with fluency, confidence, vocabulary, grammar, pronunciation, and natural answer development."
        },
        {
          title: "Grammar for IELTS GT",
          text: "Students revise important grammar for IELTS, including tenses, sentence structure, modals, connectors, conditionals, comparisons, articles, prepositions, and complex sentences."
        },
        {
          title: "Vocabulary for IELTS GT",
          text: "Students learn practical and topic-based vocabulary for work, travel, education, family, society, health, technology, environment, services, rules, complaints, and daily communication."
        },
        {
          title: "Letter-Writing Language",
          text: "Students practise useful expressions for requests, complaints, apologies, invitations, suggestions, explanations, applications, and giving information."
        },
        {
          title: "Time Management Practice",
          text: "Students learn how to manage time in Reading, Writing, Listening, and Speaking so they can complete tasks properly during the test."
        },
        {
          title: "EBM Practice Sheets",
          text: "Students receive structured practice material based on the Ejaz Bukhari Method to revise, practise, and improve outside class."
        },
        {
          title: "Error Correction",
          text: "Students receive correction in writing, speaking, grammar, vocabulary, pronunciation, sentence structure, tone, coherence, and task achievement."
        },
        {
          title: "Weekly Mock Practice",
          text: "Students attempt IELTS GT-style practice tasks and mini-mocks to check progress, improve speed, and build exam readiness."
        },
        {
          title: "Writing Feedback",
          text: "Students receive feedback on IELTS GT Writing Task 1 letters and Task 2 essays so they can understand mistakes and improve band performance."
        },
        {
          title: "Speaking Feedback",
          text: "Students receive speaking feedback on fluency, pronunciation, grammar range, vocabulary, confidence, and answer development."
        },
        {
          title: "Band Score Awareness",
          text: "Students learn what examiners look for and how band descriptors apply to Writing and Speaking performance."
        },
        {
          title: "Final Mock Test",
          text: "At the end of the course, students complete a final IELTS GT-style mock test to assess preparation and identify their current level."
        },
        {
          title: "Personal Improvement Guidance",
          text: "Students receive guidance on weak areas and what they should practise after the course to continue improving."
        },
        {
          title: "Certificate of Completion",
          text: "Students who complete the course receive a certificate from SEB’s Institute."
        }
      ],
      outcomes: [
        "Understand the IELTS General Training test format.",
        "Attempt Listening with better focus and accuracy.",
        "Read GT texts with better strategy and time control.",
        "Understand notices, workplace texts, instructions, and longer passages more effectively.",
        "Write formal, semi-formal, and informal letters with proper tone and structure.",
        "Write Task 2 essays with clearer ideas, reasons, examples, and organization.",
        "Speak more confidently in all three speaking parts.",
        "Use better grammar and vocabulary for IELTS GT.",
        "Avoid common IELTS GT mistakes.",
        "Manage time more effectively in the test.",
        "Understand the basic EBM IELTS GT preparation system.",
        "Attempt an IELTS GT-style mock test with more confidence."
      ]
    },
    sort_order: 4
  },
  {
    id: "plan-4-weeks-ielts-academic",
    name: "SEB’s IELTS Academic Course Based on EBM",
    category: "ielts-writing",
    tagline: "EBM does not only prepare students for IELTS; it builds the strategy, confidence, and discipline needed for a better band score.",
    priceDisplay: "PKR 44,000",
    priceVal: 44000,
    period: "4 Weeks Program",
    description: "Fast-track IELTS Academic preparation program built on the Ejaz Bukhari Method (EBM) targeting maximum band growth.",
    features: [
      "IELTS Academic high-band coaching for all 4 modules",
      "Regular Writing Task 1 (graphs, charts) & Task 2 evaluations",
      "Interactive academic reading, diagnostic listening & exam drills",
      "Official certificate of completion from SEB’s Institute"
    ],
    cta: "Fast-Track My Academic Score",
    isPopular: false,
    accent: "border-indigo-500/30 dark:border-indigo-500/20",
    detailedCurriculum: {
      duration: "4 Weeks Program",
      focus: "Fast IELTS Academic preparation, test strategy, band improvement, time management, and confidence in all four modules.",
      method: "EBM — Ejaz Bukhari Method",
      bestFor: "Students, graduates, professionals, job seekers, and overseas applicants who want focused IELTS Academic preparation in a short time.",
      mainFeatures: [
        {
          title: "IELTS Confidence Building",
          text: "Students are guided from the first week to understand the IELTS Academic test format, remove fear, and build confidence for all four modules: Listening, Reading, Writing, and Speaking."
        },
        {
          title: "Complete Test Understanding",
          text: "Students learn the structure of the IELTS Academic test, question types, time limits, scoring system, and common mistakes that reduce band scores."
        },
        {
          title: "Listening Practice",
          text: "Students practise IELTS Listening sections with different accents, question types, keywords, distractors, spelling accuracy, and answer transfer techniques."
        },
        {
          title: "Academic Reading Skills",
          text: "Students learn how to handle IELTS Academic reading passages through skimming, scanning, keyword matching, locating answers, understanding question types, and managing time."
        },
        {
          title: "Writing Task 1 Training",
          text: "Students learn how to describe graphs, charts, tables, maps, processes, and diagrams with correct structure, overview, comparisons, vocabulary, and grammar."
        },
        {
          title: "Writing Task 2 Training",
          text: "Students learn how to write essays with clear introduction, thesis statement, topic sentences, supporting ideas, examples, conclusion, and logical development."
        },
        {
          title: "Speaking Practice",
          text: "Students practise IELTS Speaking Part 1, Part 2, and Part 3 with fluency, vocabulary, grammar, pronunciation, confidence, and natural response building."
        },
        {
          title: "Grammar for IELTS",
          text: "Students revise important grammar for IELTS, including tenses, sentence structure, complex sentences, connectors, passive voice, conditionals, comparisons, and error correction."
        },
        {
          title: "Vocabulary for IELTS",
          text: "Students learn useful academic and topic-based vocabulary for education, environment, technology, health, society, work, media, culture, and global issues."
        },
        {
          title: "Question-Type Strategy",
          text: "Students are trained in IELTS question types, including MCQs, matching headings, True/False/Not Given, Yes/No/Not Given, sentence completion, summary completion, map labelling, and short-answer questions."
        },
        {
          title: "Time Management Practice",
          text: "Students learn how to complete each IELTS module within the given time and avoid wasting time on difficult questions."
        },
        {
          title: "EBM Practice Sheets",
          text: "Students receive structured practice material based on the Ejaz Bukhari Method to revise, practise, and improve outside class."
        },
        {
          title: "Error Correction",
          text: "Students receive correction in writing, speaking, grammar, vocabulary, pronunciation, sentence structure, task response, coherence, and accuracy."
        },
        {
          title: "Weekly Mock Practice",
          text: "Students attempt regular IELTS-style practice tasks and mini-mocks to check progress and build exam readiness."
        },
        {
          title: "Writing Feedback",
          text: "Students receive feedback on IELTS Writing Task 1 and Task 2 so they can understand their mistakes and improve their band score."
        },
        {
          title: "Speaking Feedback",
          text: "Students receive speaking feedback on fluency, pronunciation, grammar, vocabulary, confidence, and answer development."
        },
        {
          title: "Band Score Awareness",
          text: "Students learn what examiners look for and how band descriptors apply to writing and speaking performance."
        },
        {
          title: "Final Mock Test",
          text: "At the end of the course, students complete a final IELTS-style mock test to assess their preparation and identify their current level."
        },
        {
          title: "Personal Improvement Guidance",
          text: "Students receive guidance on their weak areas and what they should practise after the course to continue improving."
        },
        {
          title: "Certificate of Completion",
          text: "Students who complete the course receive a certificate from SEB’s Institute."
        }
      ],
      outcomes: [
        "Understand the IELTS Academic test format.",
        "Attempt Listening with better focus and accuracy.",
        "Read Academic passages with better strategy and time control.",
        "Write Task 1 reports with proper structure and overview.",
        "Write Task 2 essays with clearer arguments and examples.",
        "Speak more confidently in all three speaking parts.",
        "Use better grammar and vocabulary for IELTS.",
        "Avoid common IELTS mistakes.",
        "Manage time more effectively in the test.",
        "Understand the basic EBM IELTS preparation system.",
        "Attempt an IELTS-style mock test with more confidence."
      ]
    },
    sort_order: 5
  },
  {
    id: "plan-6-month-spoken",
    name: "SEB’s 6-Month Spoken English + AI Skills Program",
    category: "spoken",
    tagline: "EBM speaking mastery & practical artificial intelligence (AI) skills for modern learning & earning",
    priceDisplay: "PKR 60,000",
    priceVal: 60000,
    period: "6 Months Program",
    description: "Our signature professional transformation program. Master fluent English speaking of Ejaz Bukhari Method integrated deeply with high-income AI digital skills.",
    features: [
      "Complete spoken English fluency and EBM confidence building",
      "Comprehensive AI tools prompting, content writing & digital freelance training",
      "Create your own English & AI personal learning portfolio",
      "Verified executive diploma signed by Principal Coach Syed Ejaz Bukhari"
    ],
    cta: "Enroll Spoken & AI Program",
    isPopular: false,
    accent: "border-purple-500/40 dark:border-purple-500/30 bg-purple-50/5 dark:bg-purple-950/5",
    detailedCurriculum: {
      duration: "6 Months Program",
      focus: "Complete spoken English development, confidence building, fluency, grammar control, vocabulary growth, pronunciation improvement, real-life communication, and practical AI skills for modern learning and earning.",
      method: "EBM — Ejaz Bukhari Method + AI Skill Integration",
      bestFor: "Beginners, weak speakers, students, job seekers, homemakers, professionals, business people, and serious learners who want to improve spoken English and also learn how to use AI for personal, academic, professional, and earning purposes.",
      mainFeatures: [
        {
          title: "Complete Confidence Building",
          text: "Students are guided step by step to remove hesitation, fear, shyness, and lack of confidence in English speaking."
        },
        {
          title: "Daily Use English Sentences",
          text: "Students learn practical sentences used at home, school, college, office, market, phone calls, meetings, interviews, and social situations."
        },
        {
          title: "Grammar in Speaking",
          text: "Grammar is taught through spoken use, not only rules. Students learn how to use tenses, helping verbs, modals, questions, negatives, conditionals, connectors, and sentence structures in real speech."
        },
        {
          title: "Vocabulary Development",
          text: "Students learn useful vocabulary for daily life, education, work, family, travel, shopping, emotions, personality, problems, decisions, communication, and professional situations."
        },
        {
          title: "Sentence-Building Practice",
          text: "Students practise making correct, clear, and meaningful sentences so they can speak with better accuracy."
        },
        {
          title: "Question-Answer Practice",
          text: "Students practise short answers, detailed answers, follow-up answers, and natural responses so they can handle real conversations with confidence."
        },
        {
          title: "Self-Introduction Training",
          text: "Students learn how to introduce themselves properly for class, interviews, meetings, professional settings, and social situations."
        },
        {
          title: "Pronunciation Correction",
          text: "Common pronunciation mistakes are corrected through guided speaking practice, word drills, sentence reading, and repeated correction."
        },
        {
          title: "Fluency Building",
          text: "Students learn how to speak smoothly, connect ideas, avoid unnecessary pauses, and continue speaking without stopping again and again."
        },
        {
          title: "Listening and Response Practice",
          text: "Students practise listening to questions, understanding meaning, and giving suitable answers without panic or confusion."
        },
        {
          title: "Role Plays",
          text: "Students practise real-life situations such as meeting someone, asking for help, shopping, giving directions, phone conversations, office discussions, complaints, interviews, and client dealing."
        },
        {
          title: "Conversation Practice",
          text: "Students learn how to start, continue, and end conversations naturally in daily, academic, professional, and social situations."
        },
        {
          title: "Storytelling Practice",
          text: "Students learn how to speak about past experiences, daily events, memories, personal stories, and future plans with better structure."
        },
        {
          title: "Opinion Speaking",
          text: "Students practise giving opinions with reasons, examples, and explanations using phrases such as 'I think', 'In my opinion', 'I agree', and 'The reason is'."
        },
        {
          title: "Presentation Practice",
          text: "Students learn how to speak on a topic with a clear beginning, middle, and ending. They practise short and longer presentations throughout the course."
        },
        {
          title: "Interview English",
          text: "Students practise common interview questions, professional self-introduction, strengths, weaknesses, goals, experience, education, and job-related communication."
        },
        {
          title: "Workplace and Professional English",
          text: "Students learn useful English for office communication, meetings, teamwork, reporting, requests, suggestions, problem-solving, and professional behaviour."
        },
        {
          title: "Social English",
          text: "Students learn polite expressions, greetings, invitations, apologies, requests, thanks, small talk, and everyday social communication."
        },
        {
          title: "AI Skills Introduction",
          text: "Students learn what AI is, how it works at a basic level, and how modern learners can use AI for study, communication, content creation, work, and earning opportunities."
        },
        {
          title: "Prompt Writing Skills",
          text: "Students learn how to give clear instructions to AI tools so they can get useful answers, ideas, drafts, examples, summaries, and practice material."
        },
        {
          title: "AI for Speaking Practice",
          text: "Students learn how to use AI to generate speaking topics, role-play situations, interview questions, conversation prompts, and daily speaking practice tasks."
        },
        {
          title: "AI for Writing and Correction",
          text: "Students learn how to use AI to improve messages, emails, paragraphs, captions, scripts, profiles, proposals, and professional writing."
        },
        {
          title: "AI for Vocabulary and Ideas",
          text: "Students learn how to use AI to build vocabulary lists, examples, sentence banks, topic ideas, explanations, and practice exercises."
        },
        {
          title: "AI for Content Creation",
          text: "Students learn how to create simple social media captions, short posts, video scripts, YouTube descriptions, Facebook content, business messages, and promotional ideas."
        },
        {
          title: "AI for Earning Skills",
          text: "Students learn how AI can help in online earning areas such as content writing, caption writing, product descriptions, resume improvement, basic freelancing services, digital products, and client communication."
        },
        {
          title: "Freelancing Awareness",
          text: "Students learn the basics of online work, service selection, portfolio building, simple proposals, client communication, and responsible earning expectations."
        },
        {
          title: "Digital Product Ideas",
          text: "Students learn how to use English and AI to create simple digital products such as worksheets, e-books, vocabulary lists, study guides, templates, captions, and practice material."
        },
        {
          title: "Client Communication Practice",
          text: "Students practise how to speak and write professionally with clients, including greetings, offers, replies, follow-ups, requests, complaints, and service explanations."
        },
        {
          title: "English + AI Portfolio",
          text: "Students create a small portfolio during the course, including speaking scripts, written samples, AI-assisted content, client messages, social media posts, and one basic digital product idea."
        },
        {
          title: "Error Correction",
          text: "Students receive correction in grammar, sentence structure, word choice, pronunciation, fluency, confidence, response development, and written communication."
        },
        {
          title: "EBM Practice Sheets",
          text: "Students receive structured practice material based on the Ejaz Bukhari Method to revise, practise, and improve outside class."
        },
        {
          title: "Speaking Habit Formation",
          text: "The course builds the habit of speaking English regularly instead of only memorising grammar or vocabulary."
        },
        {
          title: "Vocabulary-in-Use Practice",
          text: "Students do not only memorise words. They learn how to use vocabulary in sentences, answers, conversations, presentations, and AI-assisted writing."
        },
        {
          title: "Grammar-to-Speaking Conversion",
          text: "Students learn how to convert grammar knowledge into practical spoken English so they can use structures naturally while speaking."
        },
        {
          title: "Weekly Speaking and AI Tasks",
          text: "Students complete weekly speaking tasks and AI-based practice tasks to improve confidence, fluency, pronunciation, communication, and digital skill awareness."
        },
        {
          title: "Monthly Assessment",
          text: "Students are assessed every month in confidence, fluency, grammar use, vocabulary, pronunciation, listening response, speaking performance, writing clarity, and AI task completion."
        },
        {
          title: "Progress Review",
          text: "Students receive regular feedback on their improvement, weak areas, speaking habits, AI skill development, and targets for the next month."
        },
        {
          title: "Final Speaking and AI Project",
          text: "At the end of the course, students complete a final assessment including self-introduction, question-answer session, topic speaking, role play, presentation, and a basic English + AI portfolio project."
        },
        {
          title: "Certificate of Completion",
          text: "Students who complete the course receive a certificate from SEB’s Institute."
        }
      ],
      outcomes: [
        "Introduce themselves confidently.",
        "Speak in daily-life situations with better control.",
        "Use common grammar structures in speaking.",
        "Ask and answer questions more naturally.",
        "Speak on familiar topics with confidence.",
        "Express opinions with reasons and examples.",
        "Participate in conversations without fear.",
        "Speak for 3–5 minutes on common topics.",
        "Handle basic interviews and professional communication.",
        "Use better vocabulary in daily and workplace situations.",
        "Improve pronunciation and voice clarity.",
        "Reduce hesitation, fear, and shyness.",
        "Use AI for speaking practice, writing support, idea generation, and vocabulary development.",
        "Use AI to create basic content, captions, messages, and simple professional drafts.",
        "Understand how AI can support freelancing, digital products, and online earning skills.",
        "Create a basic English + AI portfolio.",
        "Understand and follow the EBM speaking system.",
        "Build the habit of speaking English and using AI responsibly for learning and earning."
      ]
    },
    sort_order: 6
  }
];

const LOCAL_STORAGE_KEY = "sebs_pricing_plans";

export const pricingService = {
  // Load plans
  async getPlans(): Promise<PricingPlan[]> {
    // 1. Try to fetch from Supabase if connected
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("pricing_plans")
          .select("*")
          .order("sort_order", { ascending: true });
        
        if (!error && data) {
          // Check if any default plans are missing from the DB
          const dbIds = new Set(data.map(p => p.id));
          const hasMissing = DEFAULT_PRICING_PLANS.some(df => !dbIds.has(df.id));
          
          if (hasMissing || data.length === 0) {
            console.info("PricingService: database is missing some new plan entries. Auto syncing default plans catalog...");
            setTimeout(() => {
              pricingService.savePlans(DEFAULT_PRICING_PLANS).catch(err =>
                console.warn("PricingService: failed lazy initial database sync of new catalog:", err)
              );
            }, 100);
            return DEFAULT_PRICING_PLANS;
          }

          // Auto upgrade old 6-month or 4-week plans if they don't contain the new EBM/AI names
          let changed = false;
          const mapped = (data as PricingPlan[]).map(p => {
            if (p.id === "plan-6-month-spoken" && (!p.name || !p.name.includes("AI"))) {
              const fresh = DEFAULT_PRICING_PLANS.find(df => df.id === "plan-6-month-spoken");
              if (fresh) {
                changed = true;
                return fresh;
              }
            }
            if (p.id === "plan-4-weeks-ielts" && (!p.name || !p.name.includes("General Training"))) {
              const fresh = DEFAULT_PRICING_PLANS.find(df => df.id === "plan-4-weeks-ielts");
              if (fresh) {
                changed = true;
                return fresh;
              }
            }
            return p;
          });

          if (changed) {
            setTimeout(() => {
              pricingService.savePlans(DEFAULT_PRICING_PLANS).catch(err => 
                console.warn("PricingService: failed lazy sync of upgraded curriculum:", err)
              );
            }, 100);
            return DEFAULT_PRICING_PLANS;
          }
          return mapped;
        } else if (error) {
          console.warn("PricingService: Failed to query schema, checking details", error);
        }
      } catch (e) {
        console.warn("PricingService: Catch error fetching from DB, falling back", e);
      }
    }

    // 2. Fallback to localStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const localIds = new Set(parsed.map(p => p.id));
          const hasMissing = DEFAULT_PRICING_PLANS.some(df => !localIds.has(df.id));
          if (hasMissing) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING_PLANS));
            return DEFAULT_PRICING_PLANS;
          }
          
          const mapped = (parsed as PricingPlan[]).map(p => {
            if (p.id === "plan-6-month-spoken" && (!p.name || !p.name.includes("AI"))) {
              const fresh = DEFAULT_PRICING_PLANS.find(df => df.id === "plan-6-month-spoken");
              if (fresh) return fresh;
            }
            if (p.id === "plan-4-weeks-ielts" && (!p.name || !p.name.includes("General Training"))) {
              const fresh = DEFAULT_PRICING_PLANS.find(df => df.id === "plan-4-weeks-ielts");
              if (fresh) return fresh;
            }
            return p;
          });
          return mapped;
        }
      } catch (e) {
        console.warn("PricingService: Failed to parse localStorage", e);
      }
    }

    // 3. Keep default static pricing plans if absolutely empty
    return DEFAULT_PRICING_PLANS;
  },

  // Save all plans at once (Bulk sync)
  async savePlans(plans: PricingPlan[]): Promise<boolean> {
    // Save to localStorage immediately as primary/local mirror
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
      window.dispatchEvent(new Event("storage_pricing_updated"));
    } catch (e) {
      console.error("PricingService: Failed to write to localStorage", e);
    }

    // Save to Supabase if connected
    if (supabase) {
      try {
        // Try deleting existing and inserting the updated list
        // Or upserting them all. Deleting first ensures sync on ordering/count.
        const { error: deleteError } = await supabase
          .from("pricing_plans")
          .delete()
          .neq("id", "invalid_id_placeholder");

        if (!deleteError) {
          // Prepare clean rows
          const rows = plans.map((p, idx) => ({
            id: p.id || `plan-custom-${Date.now()}-${idx}`,
            name: p.name,
            category: p.category,
            tagline: p.tagline,
            priceDisplay: p.priceDisplay,
            priceVal: Number(p.priceVal) || 0,
            period: p.period,
            description: p.description,
            features: p.features,
            cta: p.cta,
            isPopular: p.isPopular,
            accent: p.accent,
            detailedCurriculum: p.detailedCurriculum,
            sort_order: p.sort_order || idx + 1
          }));

          const { error: insertError } = await supabase
            .from("pricing_plans")
            .upsert(rows);

          if (!insertError) {
            return true;
          } else {
            console.warn("PricingService: Failed to insert plans to DB", insertError);
          }
        } else {
          console.warn("PricingService: Failed to clear plans table", deleteError);
        }
      } catch (e) {
        console.warn("PricingService: Exception saving to Supabase", e);
      }
    }

    return true; // Return true as it did save to localStorage successfully!
  }
};
