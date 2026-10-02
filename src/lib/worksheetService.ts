import { 
  WorksheetDefinition, 
  WorksheetEvaluationResult, 
  WorksheetFieldFeedback, 
  WorksheetSubmission,
  SuffixColumnConfig,
  NounTypeRowConfig,
  ChallengeItemConfig,
  AdverbTypeRowConfig
} from "../types/worksheet";
import { supabase } from "./supabaseClient";

export const NOUNS_WORKSHEET: WorksheetDefinition = {
  id: "ws-nouns-suffixes",
  type: "nouns_suffixes",
  title: "Nouns",
  subtitle: "Word formation through common suffixes & classification in context.",
  workshopTitle: "Writing Skills Training Workshop",
  totalPages: 2,
  maxTotalPoints: 100,
  description: "Official SEBS Writing Skills Worksheet covering 12 common noun suffixes, 8 major noun categories with contextual sentences, and the 10-word root-to-noun transformation challenge."
};

export const ADJECTIVES_ADVERBS_VERBS_WORKSHEET: WorksheetDefinition = {
  id: "ws-adjectives-adverbs-verbs",
  type: "adjectives_adverbs_verbs",
  title: "Adjectives, Adverbs & Verbs",
  subtitle: "Word formation through common suffixes and adverbs in context.",
  workshopTitle: "Writing Skills Training Workshop",
  totalPages: 2,
  maxTotalPoints: 100,
  description: "Official SEBS Writing Skills Worksheet covering 12 adjective suffixes, adverb and verb formation suffixes, and adverb usage with contextual sentence synthesis."
};

// Suffix configurations for Page 1 of Nouns Worksheet (12 columns)
export const NOUN_SUFFIX_COLUMNS: SuffixColumnConfig[] = [
  {
    suffix: "-ness",
    label: "-ness",
    targetType: "noun",
    sampleAnswers: ["happiness", "kindness", "darkness", "blindness", "sadness", "softness", "weakness", "cleverness", "calmness", "fairness"]
  },
  {
    suffix: "-ment",
    label: "-ment",
    targetType: "noun",
    sampleAnswers: ["development", "movement", "excitement", "achievement", "improvement", "agreement", "management", "punishment", "encouragement", "enjoyment"]
  },
  {
    suffix: "-tion",
    label: "-tion",
    targetType: "noun",
    sampleAnswers: ["action", "education", "protection", "creation", "situation", "invention", "connection", "solution", "preparation", "celebration"]
  },
  {
    suffix: "-sion",
    label: "-sion",
    targetType: "noun",
    sampleAnswers: ["decision", "vision", "conclusion", "confusion", "permission", "discussion", "expansion", "tension", "admission", "division"]
  },
  {
    suffix: "-ity",
    label: "-ity",
    targetType: "noun",
    sampleAnswers: ["activity", "clarity", "reality", "ability", "curiosity", "equality", "purity", "security", "simplicity", "creativity"]
  },
  {
    suffix: "-ance",
    label: "-ance",
    targetType: "noun",
    sampleAnswers: ["performance", "entrance", "acceptance", "allowance", "appearance", "assistance", "guidance", "importance", "tolerance", "distance"]
  },
  {
    suffix: "-ence",
    label: "-ence",
    targetType: "noun",
    sampleAnswers: ["difference", "presence", "silence", "confidence", "evidence", "existence", "independence", "intelligence", "patience", "violence"]
  },
  {
    suffix: "-ship",
    label: "-ship",
    targetType: "noun",
    sampleAnswers: ["friendship", "relationship", "leadership", "membership", "citizenship", "championship", "hardship", "ownership", "scholarship", "companionship"]
  },
  {
    suffix: "-hood",
    label: "-hood",
    targetType: "noun",
    sampleAnswers: ["childhood", "brotherhood", "neighborhood", "motherhood", "fatherhood", "adulthood", "manhood", "womanhood", "priesthood", "falsehood"]
  },
  {
    suffix: "-dom",
    label: "-dom",
    targetType: "noun",
    sampleAnswers: ["freedom", "wisdom", "kingdom", "stardom", "boredom", "earldom", "martyrdom", "officialdom", "dukedom"]
  },
  {
    suffix: "-er / -or",
    label: "-er / -or",
    targetType: "noun",
    sampleAnswers: ["teacher", "actor", "writer", "director", "speaker", "doctor", "player", "creator", "leader", "visitor", "singer", "sailor"]
  },
  {
    suffix: "-ist",
    label: "-ist",
    targetType: "noun",
    sampleAnswers: ["artist", "scientist", "pianist", "dentist", "novelist", "specialist", "journalist", "tourist", "chemist", "economist", "linguist"]
  }
];

// Noun Types Configuration (Page 2, Table 1)
export const NOUN_TYPES_CONFIG: NounTypeRowConfig[] = [
  {
    id: "common_noun",
    nounType: "Common Noun",
    definition: "A general name for a person, place, thing or idea.",
    examples: "teacher, city, book, school, river, phone",
    expectedCriteria: "General non-capitalized noun that represents class of entities."
  },
  {
    id: "proper_noun",
    nounType: "Proper Noun",
    definition: "The specific name of a person, place or organisation. It begins with a capital letter.",
    examples: "Lahore, Ali, SEBS Institute, London, Pakistan, Google",
    expectedCriteria: "Specific capitalized noun for individual person, place, or institution."
  },
  {
    id: "concrete_noun",
    nounType: "Concrete Noun",
    definition: "A noun you can experience through the senses (sight, touch, taste, smell, hearing).",
    examples: "table, perfume, bell, flower, coffee, stone",
    expectedCriteria: "Physical tangible object detectable through the five physical senses."
  },
  {
    id: "abstract_noun",
    nounType: "Abstract Noun",
    definition: "A quality, feeling, state or idea that cannot be physically touched.",
    examples: "honesty, courage, happiness, freedom, intelligence, love",
    expectedCriteria: "Intangible concept, emotion, state of mind, or quality."
  },
  {
    id: "collective_noun",
    nounType: "Collective Noun",
    definition: "A word for a group considered as one unit.",
    examples: "team, class, committee, crowd, family, flock, audience",
    expectedCriteria: "Singular noun representing an entire group or collection of individuals."
  },
  {
    id: "countable_noun",
    nounType: "Countable Noun",
    definition: "A noun that can usually be counted and has singular/plural forms.",
    examples: "one file, three files, book, cars, chair, students",
    expectedCriteria: "Noun that accepts numbers and plural 's' or 'es' forms."
  },
  {
    id: "uncountable_noun",
    nounType: "Uncountable Noun",
    definition: "A noun not normally counted as separate units without a measure word.",
    examples: "information, water, advice, luggage, furniture, rice",
    expectedCriteria: "Mass noun that cannot take direct numeral counters or plural 's'."
  },
  {
    id: "compound_noun",
    nounType: "Compound Noun",
    definition: "A noun made from two or more words that act as one noun.",
    examples: "classroom, bus stop, police officer, swimming pool, toothpaste",
    expectedCriteria: "Noun created by joining two distinct base words together."
  }
];

// Noun Challenge Configuration (Page 2, Section 2)
export const NOUN_CHALLENGE_CONFIG: ChallengeItemConfig[] = [
  {
    id: "ch_happy",
    baseWord: "happy",
    targetType: "noun",
    expectedNouns: ["happiness"],
    suffix: "-ness",
    points: 2
  },
  {
    id: "ch_develop",
    baseWord: "develop",
    targetType: "noun",
    expectedNouns: ["development"],
    suffix: "-ment",
    points: 2
  },
  {
    id: "ch_decide",
    baseWord: "decide",
    targetType: "noun",
    expectedNouns: ["decision"],
    suffix: "-sion",
    points: 2
  },
  {
    id: "ch_active",
    baseWord: "active",
    targetType: "noun",
    expectedNouns: ["activity", "action", "activeness", "activism"],
    suffix: "-ity / -tion",
    points: 2
  },
  {
    id: "ch_friend",
    baseWord: "friend",
    targetType: "noun",
    expectedNouns: ["friendship", "friendliness"],
    suffix: "-ship",
    points: 2
  },
  {
    id: "ch_child",
    baseWord: "child",
    targetType: "noun",
    expectedNouns: ["childhood", "childishness"],
    suffix: "-hood",
    points: 2
  },
  {
    id: "ch_free",
    baseWord: "free",
    targetType: "noun",
    expectedNouns: ["freedom"],
    suffix: "-dom",
    points: 2
  },
  {
    id: "ch_teach",
    baseWord: "teach",
    targetType: "noun",
    expectedNouns: ["teacher", "teaching", "teachings"],
    suffix: "-er",
    points: 2
  },
  {
    id: "ch_art",
    baseWord: "art",
    targetType: "noun",
    expectedNouns: ["artist", "artistry"],
    suffix: "-ist",
    points: 2
  },
  {
    id: "ch_perform",
    baseWord: "perform",
    targetType: "noun",
    expectedNouns: ["performance", "performer"],
    suffix: "-ance",
    points: 2
  }
];

// Adjectives & Adverbs & Verbs Configurations
export const ADJECTIVE_SUFFIX_COLUMNS: SuffixColumnConfig[] = [
  { suffix: "-full", label: "-full", targetType: "adjective", sampleAnswers: ["beautiful", "helpful", "careful", "wonderful", "successful", "peaceful", "painful", "grateful", "powerful", "hopeful"] },
  { suffix: "-less", label: "-less", targetType: "adjective", sampleAnswers: ["careless", "hopeless", "endless", "fearless", "homeless", "useless", "painless", "flawless", "powerless", "speechless"] },
  { suffix: "-ive", label: "-ive", targetType: "adjective", sampleAnswers: ["active", "creative", "attractive", "impressive", "effective", "decisive", "protective", "expensive", "massive", "responsive"] },
  { suffix: "-en", label: "-en", targetType: "adjective", sampleAnswers: ["golden", "wooden", "frozen", "broken", "hidden", "silken", "woolen", "rotten", "chosen", "fallen"] },
  { suffix: "-ed", label: "-ed", targetType: "adjective", sampleAnswers: ["excited", "tired", "bored", "interested", "confused", "talented", "skilled", "crowded", "worried", "surprised"] },
  { suffix: "-ing", label: "-ing", targetType: "adjective", sampleAnswers: ["exciting", "tiring", "boring", "interesting", "confusing", "amazing", "challenging", "charming", "relaxing", "shocking"] },
  { suffix: "-able", label: "-able", targetType: "adjective", sampleAnswers: ["comfortable", "readable", "adaptable", "enjoyable", "acceptable", "fashionable", "suitable", "reliable", "predictable", "valuable"] },
  { suffix: "-ible", label: "-ible", targetType: "adjective", sampleAnswers: ["visible", "flexible", "responsible", "terrible", "horrible", "credible", "sensible", "accessible", "eligible", "reversible"] },
  { suffix: "-ical", label: "-ical", targetType: "adjective", sampleAnswers: ["historical", "practical", "musical", "critical", "logical", "economical", "technical", "magical", "chemical", "physical"] },
  { suffix: "-ial", label: "-ial", targetType: "adjective", sampleAnswers: ["financial", "official", "commercial", "social", "essential", "influential", "residential", "confidential", "substantial", "initial"] },
  { suffix: "-ious", label: "-ious", targetType: "adjective", sampleAnswers: ["ambitious", "delicious", "cautious", "furious", "curious", "precious", "infectious", "religious", "suspicious", "spacious"] },
  { suffix: "-ous", label: "-ous", targetType: "adjective", sampleAnswers: ["famous", "dangerous", "nervous", "generous", "poisonous", "miraculous", "continuous", "adventurous", "enormous", "glamorous"] }
];

export const ADVERBS_VERBS_SUFFIX_COLUMNS: SuffixColumnConfig[] = [
  { suffix: "-ly", label: "-ly (Adverbs)", targetType: "adverb", sampleAnswers: ["quickly", "beautifully", "slowly", "clearly", "happily", "easily", "softly", "carefully", "honestly", "patiently"] },
  { suffix: "-ify", label: "-ify (Verbs)", targetType: "verb", sampleAnswers: ["simplify", "clarify", "purify", "justify", "modify", "identify", "beautify", "terrify", "solidify", "classify"] },
  { suffix: "-ise,-ize", label: "-ise / -ize (Verbs)", targetType: "verb", sampleAnswers: ["realize", "organize", "criticize", "memorize", "apologize", "summarize", "emphasize", "specialize", "modernize", "recognize"] },
  { suffix: "-ate", label: "-ate (Verbs)", targetType: "verb", sampleAnswers: ["create", "educate", "activate", "motivate", "communicate", "participate", "hesitate", "calculate", "celebrate", "demonstrate"] }
];

export const ADVERBS_CONTEXT_CONFIG: AdverbTypeRowConfig[] = [
  {
    id: "adv_manner",
    adverbType: "Adverbs of Manner",
    definition: "Adverbs of manner answer the question 'How did it happen?'",
    examples: "e.g. Beautifully, quickly, softly, gracefully, carefully",
    categoryOptions: ["Manner (How)", "Frequency (How often)", "Place (Where)", "Time (When)", "Conjunctive"],
    correctCategory: "Manner (How)"
  },
  {
    id: "adv_frequency",
    adverbType: "Adverbs of Frequency",
    definition: "Adverbs of frequency answer the question 'How often?'",
    examples: "e.g. Again, always, never, seldom, frequently, rarely",
    categoryOptions: ["Manner (How)", "Frequency (How often)", "Place (Where)", "Time (When)", "Conjunctive"],
    correctCategory: "Frequency (How often)"
  },
  {
    id: "adv_place",
    adverbType: "Adverbs of Place",
    definition: "Adverbs of place clarify where the action took place.",
    examples: "e.g. Above, here, everywhere, outside, nearby, underground",
    categoryOptions: ["Manner (How)", "Frequency (How often)", "Place (Where)", "Time (When)", "Conjunctive"],
    correctCategory: "Place (Where)"
  },
  {
    id: "adv_time",
    adverbType: "Adverbs of Time",
    definition: "Adverbs of time detail when the action took place.",
    examples: "e.g. Already, yesterday, tomorrow, now, lately, immediately",
    categoryOptions: ["Manner (How)", "Frequency (How often)", "Place (Where)", "Time (When)", "Conjunctive"],
    correctCategory: "Time (When)"
  },
  {
    id: "adv_conjunctive",
    adverbType: "Conjunctive Adverbs",
    definition: "Conjunctive adverbs connect two independent clauses or sentences (e.g., Additionally, however, meanwhile, therefore).",
    examples: "e.g. However, therefore, furthermore, meanwhile, nonetheless",
    categoryOptions: ["Manner (How)", "Frequency (How often)", "Place (Where)", "Time (When)", "Conjunctive"],
    correctCategory: "Conjunctive"
  }
];

/**
 * Intelligent Evaluation Engine for SEBS Worksheets
 */
export function evaluateWorksheetSubmission(
  worksheetType: string,
  answers: Record<string, any>,
  studentName: string,
  studentId: string
): WorksheetEvaluationResult {
  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const submittedAt = new Date().toISOString();
  const fieldFeedbacks: Record<string, WorksheetFieldFeedback> = {};

  let totalScore = 0;
  let maxScore = 100;
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (worksheetType === "nouns_suffixes" || worksheetType === "ws-nouns-suffixes") {
    // 1. Evaluate Page 1: Suffix Columns (Max 36 points - 12 columns x 3 points per valid column set)
    let suffixEarned = 0;
    const suffixMax = 36;
    let validSuffixCount = 0;

    NOUN_SUFFIX_COLUMNS.forEach((col) => {
      const colKey = `suffix_${col.suffix}`;
      const rawEntries = answers[colKey] || [];
      const userEntries: string[] = Array.isArray(rawEntries) 
        ? rawEntries.map(s => String(s).trim()).filter(Boolean)
        : String(rawEntries).split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

      let colValidWords = 0;
      const cleanSuffix = col.suffix.replace(/^-/, "").toLowerCase();

      userEntries.forEach((word) => {
        const wLower = word.toLowerCase();
        // Check if ends with suffix and is at least 3 chars longer than suffix
        if (col.suffix === "-er / -or") {
          if ((wLower.endsWith("er") || wLower.endsWith("or")) && wLower.length >= 4) {
            colValidWords++;
          }
        } else if (wLower.endsWith(cleanSuffix) && wLower.length >= cleanSuffix.length + 2) {
          colValidWords++;
        }
      });

      const colScore = Math.min(3, colValidWords);
      suffixEarned += colScore;
      if (colScore >= 2) validSuffixCount++;

      fieldFeedbacks[colKey] = {
        fieldKey: colKey,
        isCorrect: colScore >= 2,
        score: colScore,
        maxScore: 3,
        userValue: userEntries.join(", "),
        expectedSample: col.sampleAnswers.slice(0, 4).join(", "),
        feedbackText: colScore >= 2 
          ? `Excellent! Formed ${colValidWords} correct noun(s) using suffix ${col.suffix}.` 
          : colValidWords === 1 
          ? `Good start with 1 word. Form 2-3 words like: ${col.sampleAnswers.slice(0, 3).join(", ")}.`
          : `Provide valid nouns ending with ${col.suffix} (e.g. ${col.sampleAnswers.slice(0, 3).join(", ")}).`
      };
    });

    totalScore += suffixEarned;
    if (validSuffixCount >= 10) {
      strengths.push("Outstanding mastery of English noun suffix morphology across all 12 structural categories.");
    } else if (validSuffixCount >= 6) {
      strengths.push("Solid foundation in core noun suffixes (-ness, -ment, -tion, -ity).");
    } else {
      improvements.push("Expand vocabulary for rarer abstract noun suffixes like -ance, -ence, -hood, and -dom.");
    }

    // 2. Evaluate Page 2, Section 1: Noun Types & Context Sentences (Max 40 points - 8 rows x 5 points)
    let nounTypesEarned = 0;
    const nounTypesMax = 40;

    NOUN_TYPES_CONFIG.forEach((row) => {
      const exKey = `type_ex_${row.id}`;
      const sentKey = `type_sent_${row.id}`;
      const userExample = String(answers[exKey] || "").trim();
      const userSentence = String(answers[sentKey] || "").trim();

      let rowScore = 0;
      let feedback = "";

      // Validate example
      let exValid = false;
      if (userExample.length >= 2) {
        if (row.id === "proper_noun") {
          exValid = /^[A-Z]/.test(userExample);
        } else {
          exValid = true;
        }
      }

      if (exValid) rowScore += 2;

      // Validate sentence
      let sentValid = false;
      if (userSentence.length >= 10 && userSentence.split(/\s+/).length >= 4) {
        rowScore += 3;
        sentValid = true;
      } else if (userSentence.length > 0) {
        rowScore += 1;
      }

      nounTypesEarned += rowScore;

      if (rowScore === 5) {
        feedback = `Perfect! Correct ${row.nounType} example and well-formed contextual sentence.`;
      } else if (rowScore >= 3) {
        feedback = `Good example. Ensure the sentence is complete and clearly demonstrates the noun's role.`;
      } else if (row.id === "proper_noun" && userExample && !/^[A-Z]/.test(userExample)) {
        feedback = `Remember: Proper nouns MUST begin with a capital letter (e.g., Lahore, SEBS Institute).`;
      } else {
        feedback = `Provide a clear ${row.nounType} example and write a full sentence using it.`;
      }

      fieldFeedbacks[`type_${row.id}`] = {
        fieldKey: `type_${row.id}`,
        isCorrect: rowScore >= 4,
        score: rowScore,
        maxScore: 5,
        userValue: `Example: "${userExample}" | Sentence: "${userSentence}"`,
        expectedSample: `e.g., ${row.examples}`,
        feedbackText: feedback
      };
    });

    totalScore += nounTypesEarned;
    if (nounTypesEarned >= 32) {
      strengths.push("Accurate identification and rich contextual application of all 8 core English noun classifications.");
    } else {
      improvements.push("Ensure proper nouns start with capital letters and collective/uncountable nouns are used with appropriate singular verbs.");
    }

    // 3. Evaluate Page 2, Section 2: Noun Challenge Base Word Transformations (Max 20 points - 10 items x 2 points)
    let challengeEarned = 0;
    let challengeCorrect = 0;

    NOUN_CHALLENGE_CONFIG.forEach((ch) => {
      const fieldKey = `ch_${ch.baseWord}`;
      const userVal = String(answers[fieldKey] || "").trim().toLowerCase();
      const isMatch = ch.expectedNouns.some(exp => userVal.includes(exp) || userVal === exp);

      const itemScore = isMatch ? 2 : 0;
      challengeEarned += itemScore;
      if (isMatch) challengeCorrect++;

      fieldFeedbacks[fieldKey] = {
        fieldKey,
        isCorrect: isMatch,
        score: itemScore,
        maxScore: 2,
        userValue: userVal || "(empty)",
        expectedSample: ch.expectedNouns[0],
        feedbackText: isMatch 
          ? `Correct! "${ch.baseWord}" + suffix "${ch.suffix}" -> "${ch.expectedNouns[0]}".`
          : `Incorrect or missing. The correct noun from root "${ch.baseWord}" is "${ch.expectedNouns[0]}" (${ch.suffix}).`
      };
    });

    totalScore += challengeEarned;
    if (challengeCorrect >= 8) {
      strengths.push("Superb root-word morphological derivation speed and precision.");
    } else {
      improvements.push("Review irregular spelling transformations when adding suffixes (e.g. decide -> decision, happy -> happiness, active -> activity).");
    }

    // 4. Urdu Reflection Synthesis (Max 4 points)
    const urduReflect = String(answers["urdu_reflection"] || "").trim();
    const urduScore = urduReflect.length >= 10 ? 4 : (urduReflect.length > 0 ? 2 : 0);
    totalScore += urduScore;

    fieldFeedbacks["urdu_reflection"] = {
      fieldKey: "urdu_reflection",
      isCorrect: urduScore >= 2,
      score: urduScore,
      maxScore: 4,
      userValue: urduReflect || "(none)",
      feedbackText: urduScore >= 2 
        ? "Thoughtful linguistic reflection and synthesis recorded in your personal study portfolio."
        : "Complete the reflection box to summarize what you learned in your own words."
    };

  } else {
    // Adjectives, Adverbs & Verbs Evaluation
    let earned = 0;

    // 1. Adjective Suffixes (12 columns x 3 = 36 pts)
    ADJECTIVE_SUFFIX_COLUMNS.forEach((col) => {
      const colKey = `adj_suffix_${col.suffix}`;
      const rawEntries = answers[colKey] || [];
      const userEntries: string[] = Array.isArray(rawEntries) 
        ? rawEntries.map(s => String(s).trim()).filter(Boolean)
        : String(rawEntries).split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

      const colValidWords = userEntries.filter(w => w.length >= 4).length;
      const colScore = Math.min(3, colValidWords);
      earned += colScore;

      fieldFeedbacks[colKey] = {
        fieldKey: colKey,
        isCorrect: colScore >= 2,
        score: colScore,
        maxScore: 3,
        userValue: userEntries.join(", "),
        expectedSample: col.sampleAnswers.slice(0, 3).join(", "),
        feedbackText: colScore >= 2 ? `Great job! Formed adjectives ending with ${col.suffix}.` : `Add adjectives ending with ${col.suffix} (e.g. ${col.sampleAnswers.slice(0, 3).join(", ")}).`
      };
    });

    // 2. Adverbs & Verbs (4 columns x 4 = 16 pts)
    ADVERBS_VERBS_SUFFIX_COLUMNS.forEach((col) => {
      const colKey = `av_suffix_${col.suffix}`;
      const rawEntries = answers[colKey] || [];
      const userEntries: string[] = Array.isArray(rawEntries) 
        ? rawEntries.map(s => String(s).trim()).filter(Boolean)
        : String(rawEntries).split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

      const count = userEntries.filter(w => w.length >= 4).length;
      const colScore = Math.min(4, count * 2);
      earned += colScore;

      fieldFeedbacks[colKey] = {
        fieldKey: colKey,
        isCorrect: colScore >= 2,
        score: colScore,
        maxScore: 4,
        userValue: userEntries.join(", "),
        expectedSample: col.sampleAnswers.slice(0, 3).join(", "),
        feedbackText: colScore >= 2 ? `Accurate word formation with ${col.suffix}.` : `Build words with ${col.suffix}.`
      };
    });

    // 3. Adverbs in Context (5 rows x 8 = 40 pts)
    ADVERBS_CONTEXT_CONFIG.forEach((adv) => {
      const sentKey = `adv_sent_${adv.id}`;
      const catKey = `adv_cat_${adv.id}`;
      const sentence = String(answers[sentKey] || "").trim();
      const category = String(answers[catKey] || "").trim();

      let rowScore = 0;
      if (sentence.length >= 12 && sentence.split(/\s+/).length >= 4) rowScore += 5;
      else if (sentence.length > 0) rowScore += 2;

      if (category && (category.toLowerCase().includes(adv.correctCategory?.toLowerCase() || "") || category === adv.correctCategory)) {
        rowScore += 3;
      }

      earned += rowScore;

      fieldFeedbacks[`adv_${adv.id}`] = {
        fieldKey: `adv_${adv.id}`,
        isCorrect: rowScore >= 6,
        score: rowScore,
        maxScore: 8,
        userValue: `Sentence: "${sentence}" | Category: "${category}"`,
        expectedSample: `${adv.examples} | Category: ${adv.correctCategory}`,
        feedbackText: rowScore >= 6 ? `Fluent sentence and accurate classification for ${adv.adverbType}.` : `Write a natural sentence containing ${adv.adverbType}.`
      };
    });

    // 4. Urdu Reflection (8 pts)
    const urduReflect = String(answers["urdu_reflection"] || "").trim();
    const urduScore = urduReflect.length >= 10 ? 8 : (urduReflect.length > 0 ? 4 : 0);
    earned += urduScore;

    totalScore = earned;
    if (totalScore >= 80) {
      strengths.push("Excellent grammatical precision and variety in using modifiers (adjectives and adverbs) in discourse.");
    } else {
      improvements.push("Practice using conjunctive adverbs (e.g. however, consequently) to build cohesive paragraph transitions.");
    }
  }

  // Ensure total is bounded
  totalScore = Math.min(100, Math.max(0, totalScore));
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Band Score Calculation
  let bandScore = "Band 6.0";
  let grade = "C (Competent)";
  if (percentage >= 95) {
    bandScore = "Band 9.0 (Expert)";
    grade = "A+ (Mastery Distinction)";
  } else if (percentage >= 88) {
    bandScore = "Band 8.5 (Very Good)";
    grade = "A (High Distinction)";
  } else if (percentage >= 80) {
    bandScore = "Band 8.0 (Good User)";
    grade = "A- (Distinction)";
  } else if (percentage >= 70) {
    bandScore = "Band 7.0 (Competent)";
    grade = "B+ (Merit)";
  } else if (percentage >= 60) {
    bandScore = "Band 6.5 (Modest)";
    grade = "B (Pass)";
  } else {
    bandScore = "Band 5.5";
    grade = "C (Needs Revision)";
  }

  const overallSummary = percentage >= 85
    ? `Exceptional performance! ${studentName} demonstrates commanding accuracy in English word-formation morphology, suffix derivations, and sentence-level contextual syntax.`
    : percentage >= 70
    ? `Well done! ${studentName} shows good structural awareness of English suffixes and classifications, with minor punctuation and capitalization refinement needed.`
    : `${studentName} has attempted the core drills. Continue practicing suffix tables and complete contextual sentences to reach Band 8.0+ fluency.`;

  const instructorFeedbackNotes = percentage >= 85
    ? `Certified by Syed Ejaz Bukhari: Impressive lexical depth and accurate spelling throughout. Ready for advanced discourse synthesis.`
    : `Director's Guidance: Review the provided answer keys to memorize high-utility academic collocations for Band 8.5 writing.`;

  return {
    submissionId,
    worksheetId: worksheetType,
    studentId,
    studentName,
    submittedAt,
    totalScore,
    maxScore,
    percentage,
    bandScore,
    grade,
    overallSummary,
    strengths,
    improvements,
    fieldFeedbacks,
    instructorFeedbackNotes,
    status: "evaluated"
  };
}

/**
 * Storage Helpers
 */
export function getWorksheetSubmissionKey(worksheetId: string, studentId: string): string {
  return `worksheet_sub_${worksheetId}_${studentId}`;
}

export function getWorksheetDraftKey(worksheetId: string, studentId: string): string {
  return `worksheet_draft_${worksheetId}_${studentId}`;
}

export function saveWorksheetDraft(
  worksheetId: string,
  episodeId: string,
  courseId: string,
  studentId: string,
  studentName: string,
  answers: Record<string, any>
): void {
  try {
    const key = getWorksheetDraftKey(worksheetId, studentId);
    const draft: WorksheetSubmission = {
      id: `draft_${Date.now()}`,
      worksheetId,
      episodeId,
      courseId,
      studentId,
      studentName,
      date: new Date().toLocaleDateString("en-GB"),
      answers,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (e) {
    console.warn("Could not save worksheet draft:", e);
  }
}

export function getWorksheetDraft(worksheetId: string, studentId: string): WorksheetSubmission | null {
  try {
    const key = getWorksheetDraftKey(worksheetId, studentId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load worksheet draft:", e);
  }
  return null;
}

export function saveWorksheetSubmission(submission: WorksheetSubmission): void {
  try {
    // 1. Save specific user-worksheet state
    const key = getWorksheetSubmissionKey(submission.worksheetId, submission.studentId);
    localStorage.setItem(key, JSON.stringify(submission));

    // 2. Append to all submissions list
    const allKey = "sebs_all_worksheet_submissions";
    const existing = JSON.parse(localStorage.getItem(allKey) || "[]");
    const updated = [submission, ...existing.filter((s: any) => s.id !== submission.id && !(s.worksheetId === submission.worksheetId && s.studentId === submission.studentId))];
    localStorage.setItem(allKey, JSON.stringify(updated));

    // 3. Clear draft
    const draftKey = getWorksheetDraftKey(submission.worksheetId, submission.studentId);
    localStorage.removeItem(draftKey);

    // 4. Async sync with Supabase if configured
    if (supabase) {
      supabase.from("worksheet_submissions").upsert([
        {
          id: submission.id,
          worksheet_id: submission.worksheetId,
          episode_id: submission.episodeId,
          course_id: submission.courseId,
          student_id: submission.studentId,
          student_name: submission.studentName,
          score: submission.evaluation?.totalScore || 0,
          max_score: submission.evaluation?.maxScore || 100,
          percentage: submission.evaluation?.percentage || 0,
          band_score: submission.evaluation?.bandScore || "Band 7.0",
          grade: submission.evaluation?.grade || "A",
          answers: submission.answers,
          evaluation: submission.evaluation,
          status: submission.status,
          created_at: submission.createdAt,
          updated_at: submission.updatedAt
        }
      ]).then(({ error }) => {
        if (error) console.warn("Cloud sync error for worksheet submission:", error);
      }).catch(err => console.warn("Supabase worksheet submission sync caught:", err));
    }
  } catch (e) {
    console.warn("Could not save worksheet submission:", e);
  }
}

export function getWorksheetSubmission(worksheetId: string, studentId: string): WorksheetSubmission | null {
  try {
    const key = getWorksheetSubmissionKey(worksheetId, studentId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load worksheet submission:", e);
  }
  return null;
}

export function getAllUserWorksheetSubmissions(studentId?: string): WorksheetSubmission[] {
  try {
    const allKey = "sebs_all_worksheet_submissions";
    const list: WorksheetSubmission[] = JSON.parse(localStorage.getItem(allKey) || "[]");
    if (studentId) {
      return list.filter(s => s.studentId === studentId);
    }
    return list;
  } catch (e) {
    console.warn("Could not fetch user worksheet submissions:", e);
    return [];
  }
}

/**
 * Automatically resolves the logged-in student's full name and identifier
 * across student_profile, sb-user, authenticated_user, user, and localStorage credentials.
 */
export function getLoggedInStudentInfo(): { id: string; name: string; email: string } {
  try {
    // 1. Check student_profile in localStorage
    const studentProfRaw = localStorage.getItem("student_profile");
    if (studentProfRaw) {
      const p = JSON.parse(studentProfRaw);
      const name = p.full_name || p.name || (p.first_name ? `${p.first_name} ${p.last_name || ""}`.trim() : "") || p.displayName;
      if (name && name !== "Student Candidate" && name !== "Candidate") {
        return { id: p.id || "std-current", name, email: p.email || "" };
      }
    }

    // 2. Check sb-user (Supabase cached session)
    const sbUserRaw = localStorage.getItem("sb-user");
    if (sbUserRaw) {
      const u = JSON.parse(sbUserRaw);
      const meta = u.user_metadata || {};
      const name = meta.full_name || meta.name || (meta.first_name ? `${meta.first_name} ${meta.last_name || ""}`.trim() : "") || u.name;
      if (name && name !== "Student Candidate" && name !== "Candidate") {
        return { id: u.id || "std-current", name, email: u.email || "" };
      }
      if (u.email) {
        const prefix = u.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        return { id: u.id || "std-current", name: prefix, email: u.email };
      }
    }

    // 3. Check authenticated_user
    const authUserRaw = localStorage.getItem("authenticated_user");
    if (authUserRaw) {
      const a = JSON.parse(authUserRaw);
      const name = a.full_name || a.name || (a.first_name ? `${a.first_name} ${a.last_name || ""}`.trim() : "") || a.displayName;
      if (name && name !== "Student Candidate" && name !== "Candidate") {
        return { id: a.id || "std-current", name, email: a.email || "" };
      }
      if (a.email) {
        const prefix = a.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        return { id: a.id || "std-current", name: prefix, email: a.email };
      }
    }

    // 4. Check user
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const u = JSON.parse(userRaw);
      const name = u.full_name || u.name || (u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : "");
      if (name && name !== "Student Candidate" && name !== "Candidate") {
        return { id: u.id || "std-current", name, email: u.email || "" };
      }
    }

    // 5. Individual key fallbacks
    const directName = localStorage.getItem("userName") || localStorage.getItem("student_name") || localStorage.getItem("user_name");
    if (directName && directName !== "Student Candidate" && directName !== "Candidate") {
      return { id: "std-current", name: directName, email: "" };
    }
  } catch (e) {
    console.warn("Could not parse student info from storage:", e);
  }

  return { id: "std-current", name: "", email: "" };
}
