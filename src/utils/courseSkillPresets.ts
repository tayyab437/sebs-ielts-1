export type SkillType = "Reading" | "Listening" | "Speaking" | "Writing" | "General";

export interface SkillPresetConfig {
  skill: SkillType;
  title: string;
  level: string;
  type: "Academic" | "General Training";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  course_type: string;
  skill_category: string;
  description: string;
  reading_passage_title?: string;
  reading_passage_type?: string;
  reading_target_time_minutes?: number;
  reading_question_types?: string[];
  reading_passage_text?: string;
  listening_audio_url?: string;
  listening_accent_profile?: string;
  listening_section_focus?: string;
  listening_question_types?: string[];
  listening_audio_transcript?: string;
  writing_task_type?: string;
  writing_target_words?: number;
  writing_prompt?: string;
  writing_model_answer?: string;
  writing_rubrics_focus?: string;
  speaking_part_stage?: string;
  speaking_cue_card_prompt?: string;
  speaking_prep_time_seconds?: number;
  speaking_response_time_seconds?: number;
  speaking_focus_points?: string[];
  modules: Array<{
    id: string;
    title: string;
    skillType?: string;
    lessons: Array<{
      id: string;
      title: string;
      type: "TEXT" | "VIDEO" | "AUDIO" | "QUIZ";
      duration?: string;
    }>;
  }>;
}

export function getSkillCoursePreset(skill: SkillType): SkillPresetConfig {
  const timestamp = Date.now();

  if (skill === "Reading") {
    return {
      skill: "Reading",
      title: "IELTS Academic & GT Reading Mastery",
      level: "7.5",
      type: "Academic",
      difficulty: "Advanced",
      category: "Reading",
      course_type: "Reading",
      skill_category: "reading",
      description: "Master full-length Academic & General Training IELTS reading passages, speed-reading strategies, True/False/Not Given traps, paragraph heading matching, and scientific abstract analysis.",
      reading_passage_title: "The Architecture of Megacities and Urban Ecology",
      reading_passage_type: "Academic Research Article",
      reading_target_time_minutes: 20,
      reading_question_types: ["True/False/Not Given", "Matching Headings", "Sentence Completion", "Summary Completion", "Multiple Choice"],
      reading_passage_text: `Urbanization has emerged as one of the definitive demographic shifts of the 21st century. As metropolitan clusters expand to accommodate millions of residents, structural engineers and environmental scientists face unprecedented challenges in balancing high-density habitation with ecological equilibrium.

Recent innovations in bio-climatic architectural design demonstrate that vertical forestry and natural ventilation channels can attenuate the urban heat island effect by up to 3.8 degrees Celsius. Furthermore, algorithmic computational modeling allows urban planners to simulate solar radiation absorption across complex skyscraper arrays, minimizing overall carbon emissions while maximizing indoor natural illumination.`,
      modules: [
        {
          id: `mod-${timestamp}-1`,
          title: "Unit 1: Skimming, Scanning & Rapid Keyword Trapping",
          skillType: "READING",
          lessons: [
            { id: `les-1`, title: "1.1 Skimming for Global Structure & Main Ideas", type: "TEXT", duration: "25 min" },
            { id: `les-2`, title: "1.2 Scanning for Dates, Numbers, and Proper Nouns", type: "VIDEO", duration: "18 min" },
            { id: `les-3`, title: "1.3 Paragraph Heading Matching & Micro-topic Isolation", type: "QUIZ", duration: "20 min" },
          ],
        },
        {
          id: `mod-${timestamp}-2`,
          title: "Unit 2: True / False / Not Given & Yes / No / Not Given Traps",
          skillType: "READING",
          lessons: [
            { id: `les-4`, title: "2.1 Unpacking Subtle Logical Negations & Qualifiers", type: "TEXT", duration: "30 min" },
            { id: `les-5`, title: "2.2 The 'Not Given' Boundary: Differentiating Absence from Disproof", type: "QUIZ", duration: "25 min" },
          ],
        },
        {
          id: `mod-${timestamp}-3`,
          title: "Unit 3: Summary, Table & Flowchart Completion under Time Pressure",
          skillType: "READING",
          lessons: [
            { id: `les-6`, title: "3.1 Deconstructing Syntactic Constraints & Word Limits", type: "TEXT", duration: "35 min" },
            { id: `les-7`, title: "3.2 Full 20-Minute Timed Passage Exam Simulation", type: "QUIZ", duration: "20 min" },
          ],
        },
      ],
    };
  }

  if (skill === "Listening") {
    return {
      skill: "Listening",
      title: "IELTS Band 8.5+ Listening Multi-Accent Blueprint",
      level: "8.0",
      type: "Academic",
      difficulty: "Advanced",
      category: "Listening",
      course_type: "Listening",
      skill_category: "listening",
      description: "Comprehensive 4-part IELTS Listening masterclass covering high-speed numbers and spellings, map direction labelling, multiple speaker academic debates, and rapid monologue note-taking.",
      listening_audio_url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
      listening_accent_profile: "British Council RP, Australian & North American Mixed",
      listening_section_focus: "Sections 1 to 4 Complete Simulation",
      listening_question_types: ["Form & Note Completion", "Map & Diagram Labelling", "Multiple Choice", "Sentence Completion"],
      listening_audio_transcript: `[Section 1: Social Context Enquiry]
Advisor: Good morning, City Community College Admissions, how may I assist you today?
Student: Hello! I'm calling to inquire about the international student orientation scheduled for next Thursday.
Advisor: Certainly! May I have your full name and student ID reference number?
Student: Yes, it's David Harrison, and my reference code is H-A-R-R-9-0-4.`,
      modules: [
        {
          id: `mod-${timestamp}-1`,
          title: "Unit 1: Section 1 Social Dialogues & Form Filling Accuracy",
          skillType: "LISTENING",
          lessons: [
            { id: `les-1`, title: "1.1 Eliminating Spelling & Number Transfer Errors", type: "AUDIO", duration: "20 min" },
            { id: `les-2`, title: "1.2 Predicting Word Forms (Nouns, Verbs, Adjectives)", type: "TEXT", duration: "15 min" },
          ],
        },
        {
          id: `mod-${timestamp}-2`,
          title: "Unit 2: Section 2 Map Labelling & Spatial Navigation",
          skillType: "LISTENING",
          lessons: [
            { id: `les-3`, title: "2.1 Clockwise, Compass & Landmark Direction Terms", type: "VIDEO", duration: "25 min" },
            { id: `les-4`, title: "2.2 Interactive Map Blueprint Practice Test", type: "QUIZ", duration: "20 min" },
          ],
        },
        {
          id: `mod-${timestamp}-3`,
          title: "Unit 3: Section 3 & 4 Academic Discussions & Monologue Lectures",
          skillType: "LISTENING",
          lessons: [
            { id: `les-5`, title: "3.1 Tracking Speaker Agreement & Contrastive Signposts", type: "AUDIO", duration: "35 min" },
            { id: `les-6`, title: "3.2 Rapid Shorthand Note-Taking for University Lectures", type: "TEXT", duration: "30 min" },
          ],
        },
      ],
    };
  }

  if (skill === "Writing") {
    return {
      skill: "Writing",
      title: "IELTS Writing Task 1 & 2 Band 9 Architecture",
      level: "8.5",
      type: "Academic",
      difficulty: "Advanced",
      category: "Writing",
      course_type: "Writing",
      skill_category: "writing",
      description: "Master Band 9 paragraph blueprints for Task 1 visual data analysis and Task 2 argumentative essays, evaluated against Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range.",
      writing_task_type: "Task 2 Academic Essay & Task 1 Visual Analysis",
      writing_target_words: 250,
      writing_prompt: "Some people believe that university education should be completely free for all citizens, while others argue that individuals should pay for their higher education. Discuss both views and give your own opinion.",
      writing_model_answer: `The debate over the financial responsibility of tertiary education is highly contentious. While some assert that higher education ought to be entirely state-funded to promote egalitarian opportunity, others maintain that students should bear the financial burden since they are the primary beneficiaries. In my perspective, a hybrid framework subsidizing critical scientific and pedagogical disciplines offers the most sustainable equilibrium.

Proponents of tuition-free university education argue that unrestricted access to higher learning catalyzes socioeconomic mobility and fosters an innovative knowledge economy. When individuals from marginalized backgrounds are unencumbered by debt, national productivity increases exponentially. For instance, Scandinavian nations with state-funded university systems routinely rank among the highest globally in human capital metrics and civic satisfaction.

Conversely, detractors contend that fully subsidizing higher education places an unsustainable strain on public coffers and risks devaluing academic qualifications through systemic credential inflation. If degrees are funded entirely through taxation, vocational alternatives may be unfairly sidelined. Furthermore, students who invest their own financial resources tend to exhibit higher commitment levels and career accountability.

In conclusion, while free higher education advances social equity, universal subsidies often compromise institutional financial robustness. A calibrated policy providing merit-based state funding for essential sectors while requiring moderate contributions for non-priority fields provides an optimal reconciliation.`,
      writing_rubrics_focus: "Task Achievement (TA/TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA)",
      modules: [
        {
          id: `mod-${timestamp}-1`,
          title: "Unit 1: Task 1 Overview Mastery (Trends, Percentages & Data Grouping)",
          skillType: "WRITING",
          lessons: [
            { id: `les-1`, title: "1.1 The Golden Rule of Writing a Bulletproof Overview", type: "TEXT", duration: "25 min" },
            { id: `les-2`, title: "1.2 Precision Vocabulary for Upward/Downward Trends", type: "TEXT", duration: "20 min" },
            { id: `les-3`, title: "1.3 Process Diagrams and Map Comparison Blueprints", type: "VIDEO", duration: "30 min" },
          ],
        },
        {
          id: `mod-${timestamp}-2`,
          title: "Unit 2: Task 2 Essay Blueprints & Thesis Statements",
          skillType: "WRITING",
          lessons: [
            { id: `les-4`, title: "2.1 Crafting Unambiguous Thesis Statements & Roadmaps", type: "VIDEO", duration: "30 min" },
            { id: `les-5`, title: "2.2 The PEEL Body Paragraph Formula (Point, Evidence, Explanation, Link)", type: "TEXT", duration: "35 min" },
          ],
        },
        {
          id: `mod-${timestamp}-3`,
          title: "Unit 3: Grammatical Range & Complex Sentence Structures",
          skillType: "WRITING",
          lessons: [
            { id: `les-6`, title: "3.1 Conditionals, Inversions, and Reduced Relative Clauses", type: "TEXT", duration: "40 min" },
            { id: `les-7`, title: "3.2 Band 9 AI Writing Evaluation Simulation", type: "QUIZ", duration: "40 min" },
          ],
        },
      ],
    };
  }

  if (skill === "Speaking") {
    return {
      skill: "Speaking",
      title: "IELTS Speaking Band 8.5+ Fluency, Idioms & Confidence",
      level: "8.5",
      type: "Academic",
      difficulty: "Advanced",
      category: "Speaking",
      course_type: "Speaking",
      skill_category: "speaking",
      description: "Exclusive 1-on-1 interview coaching curriculum with Sir Syed Ejaz Bukhari: Part 1 natural responses, Part 2 2-minute cue card storytelling with 1-minute prep notes, and Part 3 abstract analytical argumentation.",
      speaking_part_stage: "Part 1, Part 2 Cue Card & Part 3 Abstract Discussion",
      speaking_cue_card_prompt: `Describe an ambition that you have had for a long time.
You should say:
• What it is and when you first thought of it
• Why you want to achieve it
• What steps you are taking towards it
• And explain how achieving it will transform your future.`,
      speaking_prep_time_seconds: 60,
      speaking_response_time_seconds: 120,
      speaking_focus_points: [
        "Natural Intonation & Thought-Group Phrasing",
        "Idiomatic Collocations & Academic Phrasal Verbs",
        "Complex Discourse Markers (e.g., 'From a broader societal viewpoint', 'It stands to reason that')",
        "Eliminating Hesitation Fillers ('um', 'like', 'you know')",
      ],
      modules: [
        {
          id: `mod-${timestamp}-1`,
          title: "Unit 1: Part 1 Familiar Topics & Conversational Fluency",
          skillType: "SPEAKING",
          lessons: [
            { id: `les-1`, title: "1.1 The 'Answer + Extend + Example' Triad Formula", type: "VIDEO", duration: "20 min" },
            { id: `les-2`, title: "1.2 Idiomatic Responses for Hometown, Studies & Leisure", type: "AUDIO", duration: "25 min" },
          ],
        },
        {
          id: `mod-${timestamp}-2`,
          title: "Unit 2: Part 2 Cue Card Architecture (2-Minute Monologue)",
          skillType: "SPEAKING",
          lessons: [
            { id: `les-3`, title: "2.1 The 1-Minute Mind-Mapping Strategy for Cue Cards", type: "TEXT", duration: "25 min" },
            { id: `les-4`, title: "2.2 Past-Present-Future Narrative Arc Template", type: "VIDEO", duration: "30 min" },
          ],
        },
        {
          id: `mod-${timestamp}-3`,
          title: "Unit 3: Part 3 Abstract Discussion & Analytical Reasoning",
          skillType: "SPEAKING",
          lessons: [
            { id: `les-5`, title: "3.1 Comparing Past vs Future Society & Hypothetical Arguments", type: "AUDIO", duration: "35 min" },
            { id: `les-6`, title: "3.2 AI Live Speaking Mock Examiner Practice Drill", type: "QUIZ", duration: "15 min" },
          ],
        },
      ],
    };
  }

  // Fallback General Course Preset
  return {
    skill: "General",
    title: "Complete IELTS Band 8.0+ Comprehensive Accelerator",
    level: "8.0",
    type: "Academic",
    difficulty: "Advanced",
    category: "Comprehensive",
    course_type: "Comprehensive",
    skill_category: "all",
    description: "All-in-one preparation package covering Listening, Reading, Writing, and Speaking with live coaching modules by Sir Syed Ejaz Bukhari.",
    modules: [],
  };
}
