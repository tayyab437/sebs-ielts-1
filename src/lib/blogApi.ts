import type {
  BlogPost,
  BlogCategory,
  BlogAuthor,
  BlogReviewer,
  BlogSettings,
  BlogAuditItem,
  BlogRedirect,
  BlogRevision
} from '../types/blog';

// In-memory / localStorage cache fallback for immediate offline & preview resilience
const FALLBACK_CACHE_KEY = 'sebs_blog_posts_cache_v2';
const CATEGORIES_CACHE_KEY = 'sebs_blog_categories_cache_v2';
const AUTHORS_CACHE_KEY = 'sebs_blog_authors_cache_v2';
const REVIEWERS_CACHE_KEY = 'sebs_blog_reviewers_cache_v2';
const SETTINGS_CACHE_KEY = 'sebs_blog_settings_cache_v2';

export const DEFAULT_BLOG_SETTINGS: BlogSettings = {
  blog_title: "SEB's Institute Academic Journal & IELTS Resource Hub",
  blog_description: "Authoritative educational articles, Band 8.5+ strategies, and exam research curated by Syed Ejaz Bukhari.",
  seo_title: "IELTS & English Learning Blog | SEBS Institute",
  meta_description: "Explore comprehensive guides on IELTS Academic & General Training, speaking fluency, essay structures, and British Council standards.",
  default_og_image: "/syed_ejaz_bukhari_hero.webp",
  default_author_id: "author-seb",
  posts_per_page: 9,
  auto_toc: true,
  show_reading_time: true,
  review_interval_days: 90
};

// Default seed categories
export const DEFAULT_CATEGORIES: BlogCategory[] = [
  {
    id: "cat_1_1791377157718",
    name: "IELTS",
    slug: "ielts",
    description: "Core curriculum, module overviews, test format nuances, and 9-band scale strategies.",
    seo_title: "IELTS Complete Preparation & Resources | SEBS Institute",
    meta_description: "Master the IELTS exam with expert breakdowns of Academic and General Training modules.",
    indexable: true,
    display_order: 1,
    post_count: 6
  },
  {
    id: "cat-ielts-writing",
    name: "IELTS Writing",
    slug: "ielts-writing",
    description: "In-depth guides for Task 1 reports/letters and Task 2 argumentative and discursive essays.",
    seo_title: "IELTS Writing Task 1 & 2 Guides | SEBS Institute",
    meta_description: "Master Band 8+ essay templates, coherence techniques, and lexical resources for Academic and GT.",
    indexable: true,
    display_order: 2,
    post_count: 5
  },
  {
    id: "cat-ielts-speaking",
    name: "IELTS Speaking",
    slug: "ielts-speaking",
    description: "Oral interview protocols, Part 2 cue card blueprints, and pronunciation phonetic retraining.",
    seo_title: "IELTS Speaking Practice & Cue Cards | SEBS Institute",
    meta_description: "Fluency tactics, Cambridge marking criteria, and model audio answers with Sir Ejaz Bukhari.",
    indexable: true,
    display_order: 3,
    post_count: 4
  },
  {
    id: "cat-exam-strategy",
    name: "Exam Strategy & Band Scoring",
    slug: "exam-strategy",
    description: "British Council and IDP scoring rubrics, computer-delivered vs paper test comparisons, and time management.",
    seo_title: "IELTS Exam Strategies & Band Descriptors | SEBS Institute",
    meta_description: "Understand raw-to-band conversions, test day protocol, and common score-deflating pitfalls.",
    indexable: true,
    display_order: 4,
    post_count: 3
  },
  {
    id: "cat-reading-listening",
    name: "Reading & Listening",
    slug: "reading-listening",
    description: "Speed reading methods, distractor avoidance, and audio transcript navigation.",
    seo_title: "IELTS Reading & Listening Techniques | SEBS Institute",
    meta_description: "Skimming, scanning, and active listening strategies for 40/40 test results.",
    indexable: true,
    display_order: 5,
    post_count: 2
  }
];

// Default seed authors
export const DEFAULT_AUTHORS: BlogAuthor[] = [
  {
    id: "author_tayyab_ashfaq",
    name: "Tayyab Ashfaq",
    slug: "tayyab-ashfaq",
    profile_image: "https://i.ibb.co/TMDSq4cK/Whats-App-Image-2026-10-14-at-11-17-47-AM.jpg",
    avatar_url: "https://i.ibb.co/TMDSq4cK/Whats-App-Image-2026-10-14-at-11-17-47-AM.jpg",
    bio: "Lead IELTS Research Analyst & Academic Essay Specialist at SEBS Institute.",
    credentials: "IELTS Senior Academic Evaluator • Master of Applied Linguistics",
    organization: "SEBS Institute",
    expertise: ["IELTS Academic & GT", "Task 2 Discursive Rhetoric", "Band Descriptors"],
    social_links: {
      website: "https://sebsinstitute.com"
    },
    indexable: true
  },
  {
    id: "author-seb",
    name: "Syed Ejaz Bukhari",
    slug: "syed-ejaz-bukhari",
    profile_image: "/syed_ejaz_bukhari_hero.webp",
    avatar_url: "/syed_ejaz_bukhari_hero.webp",
    bio: "Founder and Principal Mentor at SEBS Institute. Over 34 years of instructional leadership in English phonetics, linguistic retraining, and IELTS test coaching.",
    credentials: "Founder & Master English Coach • 34+ Years Experience • British Council Certified Instructor",
    organization: "SEBS Institute",
    expertise: ["IELTS Academic & GT", "Spoken English Fluency", "Phonetics & Accent Softening", "Advanced Discourse"],
    social_links: {
      linkedin: "https://linkedin.com",
      website: "https://sebsinstitute.com"
    },
    indexable: true
  },
  {
    id: "author-za",
    name: "Zoha Ali",
    slug: "zoha-ali",
    bio: "Senior Linguistics Specialist and EFL mentor focusing on cognitive language processing and structured lexical acquisition.",
    credentials: "MS ELTL • CELTA Qualified • 10+ Years Pedagogy",
    organization: "SEBS Institute",
    expertise: ["EFL Pedagogy", "Grammatical Cohesion", "Cambridge Assessment Framework"],
    indexable: true
  }
];

// Default seed reviewer
export const DEFAULT_REVIEWERS: BlogReviewer[] = [
  {
    id: "reviewer_ejaz_bukhari",
    name: "Syed Ejaz Bukhari",
    slug: "syed-ejaz-bukhari",
    bio: "Founder and Principal Linguistics Trainer at SEB's Institute. Renowned language mentor with 30+ years coaching thousands of scholars to verified Band 8.5+ IELTS results.",
    qualifications: "Master of English Linguistics, Certified IELTS Master Trainer (Since 1992)",
    organization: "SEBS Institute Assessment Board",
    expertise: ["Cambridge Examiner Protocols", "Criterion Scoring Validation", "Academic Lexis"],
    indexable: true
  },
  {
    id: "reviewer-sz",
    name: "Syeda Zarnaz Gilani",
    slug: "syeda-zarnaz-gilani",
    bio: "Senior Academic Reviewer and IELTS examiner specialist. University of London graduate ensuring curriculum compliance with Cambridge Assessment English.",
    qualifications: "BA English (University of London) • AEO & British Council Master Trainer",
    organization: "SEBS Institute Assessment Board",
    expertise: ["Cambridge Examiner Protocols", "Criterion Scoring Validation", "Academic Lexis"],
    indexable: true
  }
];

// Default Seed Posts (Pillar, Cluster, Supporting)
export const DEFAULT_POSTS: BlogPost[] = [
  {
    id: "post_ielts_complete_guide",
    title: "IELTS: Complete Exam Guide to Format, Scoring, Fees & Registration",
    slug: "ielts-complete-exam-guide",
    excerpt: "An authoritative master guide to the International English Language Testing System (IELTS). Discover exam format differences, 9-band scale descriptors, registration fees, and strategic preparation roadmaps verified by Syed Ejaz Bukhari.",
    content: `
      <h2>Understanding the IELTS Examination Architecture</h2>
      <p>The International English Language Testing System (IELTS) is the world's most recognized high-stakes English proficiency evaluation, jointly managed by the British Council, IDP: IELTS Australia, and Cambridge Assessment English. Each year, millions of candidates sit for the examination to unlock university admissions, skilled migration pathways, and professional licensure across the United Kingdom, Canada, Australia, New Zealand, and the United States.</p>

      <h2>IELTS Academic vs. IELTS General Training</h2>
      <p>Selecting the correct test module is essential for achieving your immigration or academic objectives:</p>
      <ul>
        <li><strong>IELTS Academic:</strong> Formatted for undergraduate and postgraduate university admissions as well as professional healthcare registrations (GMC, NMC). The reading passages feature rigorous scholarly syntax, and Writing Task 1 requires analytical reporting of charts, graphs, maps, or processes.</li>
        <li><strong>IELTS General Training:</strong> Designed for migration to Canada (Express Entry), Australia (SkillSelect), and secondary education or work experience programs. Reading texts emphasize everyday workplace communications, and Writing Task 1 consists of a formal, semi-formal, or informal letter.</li>
      </ul>

      <h2>The 4 Core Skill Modules Breakdown</h2>
      <p>Both test variations evaluate four fundamental linguistic domains across a comprehensive testing sequence:</p>
      <ol>
        <li><strong>Listening (30 Minutes + 10 Mins Transfer):</strong> 4 recorded audio sections featuring native British, Australian, and North American accents, escalating from social dialogues to university lectures.</li>
        <li><strong>Reading (60 Minutes):</strong> 3 extensive sections comprising 40 questions covering True/False/Not Given, Headings Matching, and Sentence Completion.</li>
        <li><strong>Writing (60 Minutes):</strong> Task 1 (150 words minimum, 20 mins) and Task 2 (250 words minimum discursive essay, 40 mins).</li>
        <li><strong>Speaking (11–14 Minutes):</strong> A face-to-face interactive viva with a certified British Council/IDP examiner covering Part 1 introduction, Part 2 individual long turn (cue card), and Part 3 two-way conceptual discussion.</li>
      </ol>

      <h2>How the 9-Band Scoring System Works</h2>
      <p>IELTS evaluates proficiency on an internationally standardized 9-band scale. Candidate responses receive integer or half-band scores (e.g., 7.5, 8.0, 8.5) across all four skills, which are averaged and rounded according to strict Cambridge rounding conventions.</p>
    `,
    content_format: "html",
    featured_image: "/ielts_prep_banner_960.webp",
    featured_image_alt: "IELTS complete exam guide banner",
    status: "published",
    content_type: "pillar",
    category_id: "cat_1_1791377157718",
    author_id: "author_tayyab_ashfaq",
    reviewer_id: "reviewer_ejaz_bukhari",
    published_at: "2026-10-07T12:45:58.000Z",
    updated_at: "2026-10-07T12:45:58.000Z",
    last_reviewed_at: "2026-10-07T12:45:58.000Z",
    seo_title: "IELTS Exam Complete Guide 2026: Format, Band Scoring & Registration",
    meta_description: "Master the IELTS exam with our comprehensive guide to Academic vs General Training, 9-band score calculations, test dates, and proven prep roadmaps by SEB's Institute.",
    canonical_url: "https://sebsinstitute.com/blog/ielts-complete-exam-guide",
    robots_index: true,
    robots_follow: true,
    primary_keyword: "IELTS complete guide",
    search_intent: "informational",
    reading_time: 8,
    word_count: 950,
    featured: true,
    direct_answer_question: "What is IELTS and which module should I take?",
    direct_answer_text: "The IELTS (International English Language Testing System) is a globally standardized test evaluating English proficiency across Listening, Reading, Writing, and Speaking. Take IELTS Academic for university degrees or professional licensing; take IELTS General Training for Express Entry immigration and work visas.",
    key_takeaways: [
      "IELTS is co-owned by the British Council, IDP, and Cambridge University.",
      "Band scores range from 1.0 (Non-User) to 9.0 (Expert User) in half-band increments.",
      "Listening and Speaking modules are identical for both Academic and General Training.",
      "Test results remain valid for exactly 2 years from the examination date."
    ],
    important_note: "Computer-delivered IELTS results are declared within 3 to 5 calendar days, whereas paper-based test TRFs (Test Report Forms) require 13 days. Both formats are completely equal in validity and test difficulty.",
    faqs: [
      {
        question: "How long are IELTS test scores valid?",
        answer: "IELTS scores are officially valid for 2 years from the date on your Test Report Form (TRF)."
      },
      {
        question: "What score is considered a good IELTS band?",
        answer: "A Band 7.0 (Good User) to Band 8.0 (Very Good User) is widely recognized as competitive for top global universities and maximum Canadian Express Entry CRS points."
      },
      {
        question: "Can I retake individual skills in IELTS?",
        answer: "Yes, IELTS One Skill Retake (OSR) allows computer-based test takers to retake any single module (Listening, Reading, Writing, or Speaking) within 60 days of the original test date."
      }
    ],
    sources: [
      {
        title: "IELTS Official Guide & Band Descriptors",
        url: "https://www.ielts.org",
        publisher: "IELTS Official Partners"
      },
      {
        title: "British Council Take IELTS Examination Portal",
        url: "https://takeielts.britishcouncil.org",
        publisher: "British Council"
      }
    ]
  },
  {
    id: "post-ielts-master-guide-2026",
    title: "IELTS Complete Master Guide 2026: Format, Band Descriptors & 8.5 Strategy",
    slug: "ielts-complete-master-guide-2026",
    excerpt: "An exhaustive, verified breakdown of the IELTS exam in 2026. Explore module timings, raw-to-band conversions, computer-delivered nuances, and proven preparation timelines.",
    content: `
      <h2>The Modern IELTS Testing Ecosystem</h2>
      <p>The International English Language Testing System (IELTS) continues to be the definitive global benchmark for English language proficiency, accepted by over 12,500 universities, immigration authorities, and professional accreditation boards worldwide. In 2026, understanding both the Academic and General Training formats is the prerequisite for achieving Band 8.0 or higher.</p>

      <h2>Test Architecture & Module Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Duration</th>
            <th>Question Count</th>
            <th>Core Skill Measured</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Listening</td>
            <td>30 mins (+ 10 mins transfer for paper)</td>
            <td>40 Questions</td>
            <td>Acoustic comprehension, accents, note-taking</td>
          </tr>
          <tr>
            <td>Reading</td>
            <td>60 mins</td>
            <td>40 Questions</td>
            <td>Skimming, scanning, critical inference</td>
          </tr>
          <tr>
            <td>Writing</td>
            <td>60 mins</td>
            <td>2 Tasks</td>
            <td>Synthesis, logical coherence, argumentative lexis</td>
          </tr>
          <tr>
            <td>Speaking</td>
            <td>11–14 mins</td>
            <td>3 Parts</td>
            <td>Oral fluency, phonetic precision, lexical range</td>
          </tr>
        </tbody>
      </table>

      <h2>The Four Pillars of Assessment</h2>
      <p>Whether taking paper-based or computerized test formats, candidates must internalize the four standard descriptors: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Task Achievement / Response.</p>

      <h2>Strategic Preparation Timeline</h2>
      <p>A candidate starting at CEFR B2 level requires between 8 to 12 weeks of deliberate practice to cross into the C1/C2 (Band 8.0–8.5) tier. At SEBS Institute, our students engage in real-time diagnostic recording and rigorous examiner feedback drills to eliminate recurring grammatical errors before test day.</p>
    `,
    content_format: "html",
    featured_image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format,compress&fm=webp&w=1200&q=80",
    featured_image_alt: "IELTS complete preparation book and study desk with academic notes",
    status: "published",
    content_type: "pillar",
    category_id: "cat-exam-strategy",
    author_id: "author-seb",
    reviewer_id: "reviewer-sz",
    published_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-03-01T14:30:00Z",
    last_reviewed_at: "2026-03-01T14:30:00Z",
    seo_title: "IELTS Complete Master Guide 2026: Format & 8.5 Strategy",
    meta_description: "Comprehensive 2026 IELTS handbook covering test format, band descriptors, computer-delivered vs paper nuances, and preparation roadmaps.",
    canonical_url: "https://sebsinstitute.com/blog/ielts-complete-master-guide-2026",
    robots_index: true,
    robots_follow: true,
    primary_keyword: "IELTS complete guide",
    search_intent: "informational",
    reading_time: 8,
    word_count: 1450,
    featured: true,
    direct_answer_question: "What is the primary difference between IELTS Academic and General Training?",
    direct_answer_text: "IELTS Academic evaluates English proficiency for higher education and university admissions through complex research texts and data synthesis. General Training assesses everyday communicative competence for migration and secondary employment using workplace memos and practical reading material.",
    key_takeaways: [
      "Total exam duration is 2 hours 45 minutes across all four modules.",
      "The Listening and Speaking modules are identical in both Academic and General Training.",
      "Scores are reported on a 9-band scale in half-band increments.",
      "IELTS results remain valid for exactly 2 years from test date."
    ],
    important_note: "Always verify whether your target immigration authority or university requires Computer-Delivered (CD) or Paper-Delivered IELTS before booking your test date.",
    faqs: [
      {
        question: "How long is my IELTS test result valid for?",
        answer: "IELTS Test Report Forms (TRFs) are valid for 2 years from the date of the examination."
      },
      {
        question: "Can I retake just one module if my score was low?",
        answer: "IELTS One Skill Retake (OSR) is available at select computer-delivered test centers worldwide within 60 days of the original test date."
      }
    ],
    sources: [
      {
        title: "Cambridge English: IELTS Guide for Candidates",
        url: "https://www.cambridgeenglish.org/exams-and-tests/ielts/",
        publisher: "Cambridge University Press & Assessment"
      },
      {
        title: "British Council Global Testing Guidelines",
        url: "https://takeielts.britishcouncil.org/",
        publisher: "British Council"
      }
    ]
  },
  {
    id: "post-ielts-writing-task-2-band-8",
    title: "IELTS Writing Task 2: 7-Step Band 8 Essay Architecture & Model Structures",
    slug: "ielts-writing-task-2-band-8-essay-architecture",
    excerpt: "Learn how to structure discursive, opinion, and problem-solution essays that satisfy all four Cambridge marking descriptors with crystalline logical progression.",
    content: `
      <h2>The Core Formula for Band 8 Task Response</h2>
      <p>The single most frequent mistake committed by Band 6.5 candidates is failing to present a clear, fully developed position throughout their essay. To secure Band 8 or higher, every paragraph must trace back to a singular thesis statement established in the introductory paragraph.</p>

      <h2>The 4-Paragraph Canonical Blueprint</h2>
      <ol>
        <li><strong>Introduction (45 words):</strong> Background paraphrase + Explicit thesis statement with your two central contentions.</li>
        <li><strong>Body Paragraph 1 (90 words):</strong> Topic sentence + Primary argument + Concrete real-world exemplification + Logical implication.</li>
        <li><strong>Body Paragraph 2 (90 words):</strong> Counter-perspective or secondary argument + Elaboration + Contextual evidence + Analytical resolution.</li>
        <li><strong>Conclusion (35 words):</strong> Synthesis of main arguments without introducing new extraneous claims.</li>
      </ol>

      <h2>Avoiding Over-Complicated Vocabulary</h2>
      <p>Lexical Resource is not an invitation to insert archaic words. The British Council and IDP examiners look for precision and natural collocation. Using 'substantive ramifications' correctly will score far higher than forcing obscure synonyms that warp sentence meaning.</p>
    `,
    content_format: "html",
    featured_image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format,compress&fm=webp&w=1200&q=80",
    featured_image_alt: "Fountain pen on handwritten essay notebook with scholarly draft",
    status: "published",
    content_type: "cluster",
    category_id: "cat-ielts-writing",
    author_id: "author-seb",
    reviewer_id: "reviewer-sz",
    published_at: "2026-02-10T10:00:00Z",
    updated_at: "2026-03-05T11:00:00Z",
    last_reviewed_at: "2026-03-05T11:00:00Z",
    seo_title: "IELTS Writing Task 2: Band 8 Essay Architecture",
    meta_description: "Master the 4-paragraph essay formula for IELTS Writing Task 2 with model templates, coherence connectors, and Band 8 band descriptors.",
    canonical_url: "https://sebsinstitute.com/blog/ielts-writing-task-2-band-8-essay-architecture",
    robots_index: true,
    robots_follow: true,
    primary_keyword: "IELTS writing task 2 band 8",
    search_intent: "informational",
    reading_time: 6,
    word_count: 1100,
    featured: false,
    key_takeaways: [
      "Task 2 accounts for 66% (two-thirds) of your overall Writing band score.",
      "Aim for 260–280 words; writing under 250 words incurs a severe penalty.",
      "Spend no more than 40 minutes on Task 2, leaving 5 minutes for careful proofreading."
    ],
    faqs: [
      {
        question: "Should I write more than 300 words in Task 2?",
        answer: "No. Writing excessively long essays increases grammatical error density and leaves insufficient time for Task 1 and final editing."
      }
    ]
  },
  {
    id: "post-ielts-speaking-part-2-cue-cards",
    title: "IELTS Speaking Part 2 Cue Cards: 1-Minute Brainstorming Blueprint",
    slug: "ielts-speaking-part-2-cue-cards-brainstorming",
    excerpt: "Turn your 60 seconds of prep time into a fluent 2-minute monologue without freezing, repeating ideas, or losing grammatical control.",
    content: `
      <h2>The Anatomy of the Speaking Cue Card</h2>
      <p>Part 2 of the IELTS Speaking interview is the candidate's individual long turn. The examiner provides a task card, paper, and pencil, granting precisely 60 seconds of preparation before prompting you to speak for between 1 and 2 minutes.</p>

      <h2>The PAST-PRESENT-FUTURE Narrative Anchor</h2>
      <p>Instead of jotting isolated words that you struggle to assemble while speaking, organize your scratchpad into three chronological nodes: How this event started (Past), How it manifested and what you did (Action), and Why it continues to hold resonance for your life today (Reflection). This naturally introduces diverse tense structures required for Band 8 Grammatical Range.</p>
    `,
    content_format: "html",
    featured_image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format,compress&fm=webp&w=1200&q=80",
    featured_image_alt: "Candidate in oral speaking practice session with coach",
    status: "published",
    content_type: "supporting",
    category_id: "cat-ielts-speaking",
    author_id: "author-za",
    reviewer_id: "reviewer-sz",
    published_at: "2026-02-24T08:30:00Z",
    updated_at: "2026-03-02T09:00:00Z",
    last_reviewed_at: "2026-03-02T09:00:00Z",
    seo_title: "IELTS Speaking Part 2 Cue Cards: 1-Minute Blueprint",
    meta_description: "Master the 60-second preparation strategy for IELTS Speaking Part 2 cue cards with narrative frameworks and phonetic fluency drills.",
    canonical_url: "https://sebsinstitute.com/blog/ielts-speaking-part-2-cue-cards-brainstorming",
    robots_index: true,
    robots_follow: true,
    primary_keyword: "IELTS speaking part 2 cue cards",
    search_intent: "informational",
    reading_time: 5,
    word_count: 850,
    featured: false,
    key_takeaways: [
      "The examiner will interrupt you gently at 2 minutes — this is normal and not a score penalty.",
      "Use your 1 minute to outline structural milestones rather than full sentences.",
      "Vary intonation and pace to demonstrate natural discourse flow."
    ]
  },
  {
    id: "post-ielts-computer-based-writing-format",
    title: "IELTS Computer-Based Writing Format: Interface, Scoring & Booking Guide",
    slug: "ielts-computer-based-writing-format-interface-scoring-and-booking-guide",
    excerpt: "Master the computer-delivered IELTS Writing test with our authoritative 2026 guide. Explore the split-screen interface, word-count counter, shortcut keys, Band 8+ scoring criteria, and IDP/British Council booking tips.",
    content: `
      <h2>1. Understanding the Computer-Delivered IELTS Writing Ecosystem</h2>
      <p>In 2026, over 70% of global test-takers select <strong>Computer-Delivered (CD) IELTS</strong> over the traditional paper-based format. While the academic syllabus, task prompts, and Cambridge evaluation standards remain 100% identical between both formats, the digital environment introduces critical ergonomic, cognitive, and mechanical nuances that can either elevate or jeopardize your target band score.</p>
      <p>The test comprises two compulsory components completed within exactly 60 minutes: <strong>Writing Task 1</strong> (150 words minimum, recommended 20 minutes) and <strong>Writing Task 2</strong> (250 words minimum, recommended 40 minutes). Both tasks are presented simultaneously, allowing candidates to switch freely between Task 1 and Task 2 at any point during the session.</p>

      <h2>2. Comprehensive Test Interface Walkthrough</h2>
      <p>The official British Council and IDP IELTS testing software runs on dedicated, locked-down workstations designed for maximum clarity and zero distraction.</p>
      
      <h3>The Split-Screen Layout</h3>
      <p>The screen is divided vertically into two synchronized panes:</p>
      <ul>
        <li><strong>Left Pane (Question & Stimulus):</strong> Displays the task instructions, graphic stimulus (bar chart, line graph, pie chart, table, or diagram for Academic Task 1, or letter prompt for General Training), and scoring reminders. You can scroll this pane independently without moving your essay text.</li>
        <li><strong>Right Pane (Candidate Response Box):</strong> An unrestricted multi-line plain text editing window where you type your essay. As you type past the visible boundary, the box scrolls automatically while keeping the question prompt visible on the left.</li>
      </ul>

      <h3>Real-Time Word Count Display</h3>
      <p>Directly beneath the right text editing pane sits an automated, real-time <strong>Word Count Indicator</strong>. In the paper test, candidates waste valuable minutes manually counting lines and estimating word totals. On the computer, the software updates the exact word count with every keystroke. Aim for <strong>165–185 words</strong> for Task 1 and <strong>270–290 words</strong> for Task 2.</p>

      <h3>Timer Alerts & Visual Warnings</h3>
      <p>A digital countdown clock is pinned to the top center of your monitor. At <strong>10 minutes remaining</strong> and <strong>5 minutes remaining</strong>, the clock flashes red and displays a notification banner across the top header before resuming silent countdown. The test automatically locks and submits your text when 00:00 is reached.</p>

      <h3>Keyboard Editing Shortcuts vs. Spell-Check</h3>
      <p>The test interface natively supports standard operating system keyboard shortcuts:</p>
      <ul>
        <li><code>Ctrl + C</code> (Copy) &bull; <code>Ctrl + V</code> (Paste) &bull; <code>Ctrl + X</code> (Cut)</li>
        <li><code>Ctrl + Z</code> (Undo)</li>
        <li>Mouse left-click and drag to highlight sections of your text for quick reorganization.</li>
      </ul>
      <p><strong>CRITICAL WARNING:</strong> There is <em>NO spell-check, autocorrect, or red squiggly underline</em> anywhere in the software. Typos, misspelled academic words, and omitted capitalizations are strictly registered and will reduce your Lexical Resource mark.</p>

      <h2>3. Computer-Delivered vs. Paper-Based: Strategic Advantages</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Computer-Delivered (CD) IELTS</th>
            <th>Paper-Based IELTS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Results Turnaround</td>
            <td>1 to 5 Calendar Days</td>
            <td>13 Calendar Days</td>
          </tr>
          <tr>
            <td>Word Count Tracking</td>
            <td>Automatic live counter</td>
            <td>Manual counting required</td>
          </tr>
          <tr>
            <td>Paragraph Reordering</td>
            <td>Instant cut-and-paste</td>
            <td>Messy erasing & re-writing</td>
          </tr>
          <tr>
            <td>Handwriting Legibility</td>
            <td>100% clean typography</td>
            <td>Subject to examiner fatigue</td>
          </tr>
          <tr>
            <td>Test Center Frequency</td>
            <td>Up to 3 sessions daily</td>
            <td>Fixed Saturday/Thursday slots</td>
          </tr>
          <tr>
            <td>One Skill Retake (OSR)</td>
            <td>Fully supported at select centres</td>
            <td>Limited or unavailable</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Cambridge Scoring Rubric & 4 Band Descriptors Demystified</h2>
      <p>Your writing is scored across four equally weighted criteria (25% each) by certified Cambridge Assessment English examiners:</p>
      <ol>
        <li><strong>Task Achievement / Response (25%):</strong> Fully addressing all parts of the prompt, establishing a clear thesis, and providing relevant, thoroughly supported arguments.</li>
        <li><strong>Coherence & Cohesion (25%):</strong> Logical paragraphing, clear progression from introduction to conclusion, and sophisticated use of cohesive devices without robotic formulaic transitions.</li>
        <li><strong>Lexical Resource (25%):</strong> Range and precision of academic vocabulary, natural collocations, and minimal spelling or word-formation slips.</li>
        <li><strong>Grammatical Range & Accuracy (25%):</strong> Balance of complex, compound, and conditional sentence structures with high grammatical control and punctuation accuracy.</li>
      </ol>

      <h2>5. 60-Minute Master Time Allocation Strategy</h2>
      <p>At SEB's Institute, Sir Syed Ejaz Bukhari trains candidates to adhere strictly to the <strong>20/40 Rule with Built-in Proofreading Margins</strong>:</p>
      <ul>
        <li><strong>Task 2 (First 40 Minutes — Recommended):</strong> Because Task 2 carries double the mark weighting of Task 1, tackling it first with maximum mental stamina is optimal. Spend 5 minutes planning thesis and arguments, 30 minutes typing, and 5 minutes proofreading grammar and typos.</li>
        <li><strong>Task 1 (Remaining 20 Minutes):</strong> Spend 3 minutes analyzing data trends or letter purpose, 14 minutes typing the overview and detailed groupings, and 3 minutes checking numerical accuracy and prepositions.</li>
      </ul>

      <h2>6. Step-by-Step Official Booking Guide</h2>
      <ol>
        <li><strong>Select Test Administrator:</strong> Visit the official portal for either <em>British Council IELTS</em> (takeielts.britishcouncil.org) or <em>IDP IELTS</em> (ielts.idp.com). Both offer authentic Cambridge exams with equal global validity.</li>
        <li><strong>Choose Test Module:</strong> Select either <strong>IELTS Academic</strong> (for higher education undergraduate/postgraduate degrees) or <strong>IELTS General Training</strong> (for migration, Express Entry, or employment visas).</li>
        <li><strong>Filter by 'Computer':</strong> Ensure you select 'IELTS on Computer'. Verify the test venue address and choose your preferred morning, afternoon, or evening session.</li>
        <li><strong>Upload Identification:</strong> Upload a high-resolution, uncropped scanned copy of your valid international passport. Your original passport must be presented on exam day.</li>
        <li><strong>Confirm & Pay:</strong> Complete secure payment via debit/credit card. You will receive an immediate booking confirmation email containing your candidate reference number and portal login credentials.</li>
      </ol>

      <h2>7. Critical Test-Day Ergonomics & Preparation Checklist</h2>
      <ul>
        <li><strong>Test Typing Speed:</strong> Practice typing at minimum 35–40 words per minute on a standard desktop external keyboard with physical keys (not a soft laptop keyboard).</li>
        <li><strong>Noise Management:</strong> Most computer labs offer noise-cancelling headphones or foam earplugs. Request these immediately if adjacent typing clatter distracts you.</li>
        <li><strong>Rough Sheet Provided:</strong> You will receive a pencil and a scratch paper sheet stamped with your confidential login credentials. Use this for quick 3-minute brainstorming sketches before typing.</li>
      </ul>
    `,
    content_format: "html",
    featured_image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format,compress&fm=webp&w=1200&q=80",
    featured_image_alt: "Candidate typing IELTS Computer-Based Writing essay on official workstation interface",
    status: "published",
    content_type: "pillar",
    category_id: "cat-ielts-writing",
    author_id: "author-seb",
    reviewer_id: "reviewer-sz",
    published_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-03-05T12:00:00Z",
    last_reviewed_at: "2026-03-05T12:00:00Z",
    seo_title: "IELTS Computer-Based Writing: Interface, Scoring & Booking Guide",
    meta_description: "Complete guide to Computer-Delivered IELTS Writing: split-screen layout, live word counter, timer alerts, Band 8 scoring descriptors, and official booking instructions.",
    canonical_url: "https://sebsinstitute.com/blog/ielts-computer-based-writing-format-interface-scoring-and-booking-guide",
    robots_index: true,
    robots_follow: true,
    primary_keyword: "IELTS computer based writing format",
    search_intent: "informational",
    reading_time: 7,
    word_count: 1350,
    featured: true,
    direct_answer_question: "How does the computer-based IELTS Writing interface work?",
    direct_answer_text: "The computer-delivered IELTS Writing test features a split-screen interface: the prompt or visual stimulus is pinned on the left half, and an active editing text box is on the right. It features an automated on-screen word counter, a countdown timer that turns red at 10 and 5 minutes remaining, and standard keyboard editing shortcuts (Ctrl+C, Ctrl+V, Ctrl+X). No spell-check or grammar auto-correct is provided.",
    key_takeaways: [
      "The screen is split vertically: task instructions on the left, your response input box on the right.",
      "An automatic live word counter updates at the bottom of the screen, removing manual word counting.",
      "Standard cut, copy, and paste shortcuts work, but there is NO spell-check or autocorrect feature.",
      "Both Task 1 (20 minutes, 150 words) and Task 2 (40 minutes, 250 words) must be completed within 60 minutes.",
      "Results for computer-delivered IELTS are released within 1 to 5 days, significantly faster than paper-based tests."
    ],
    important_note: "Remember that test center computers do NOT have spell-check enabled. Typos and spelling mistakes directly penalize your Lexical Resource descriptor score. Always reserve 3–5 minutes at the end to proofread your response.",
    faqs: [
      {
        question: "Can I use keyboard shortcuts like Ctrl+C and Ctrl+V in the computer-delivered IELTS Writing test?",
        answer: "Yes. Standard keyboard shortcuts for cut (Ctrl+X / Cmd+X), copy (Ctrl+C / Cmd+C), and paste (Ctrl+V / Cmd+V) are fully supported in the official test software."
      },
      {
        question: "Does the computer-based IELTS Writing test have auto-correct or spell-check?",
        answer: "No. Auto-correct, grammar assistance, and spell-check are completely disabled. Candidates must type with accuracy, and spelling errors directly impact your Lexical Resource band score."
      },
      {
        question: "Is computer-delivered IELTS Writing scored by AI or human examiners?",
        answer: "Computer-delivered IELTS Writing is evaluated by accredited human Cambridge examiners according to the four standard IELTS band descriptors: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy."
      },
      {
        question: "How do I book a computer-delivered IELTS test date?",
        answer: "You can book directly through the official British Council or IDP IELTS booking portals. Select 'IELTS on Computer', choose your preferred city and certified test centre, upload a valid passport copy, and complete fee payment online."
      }
    ],
    sources: [
      {
        title: "Cambridge Assessment English: Guide to Computer-delivered IELTS",
        url: "https://www.cambridgeenglish.org/exams-and-tests/ielts/",
        publisher: "Cambridge University Press & Assessment"
      },
      {
        title: "IDP IELTS Official Computer Test Demonstration",
        url: "https://ielts.idp.com/prepare/article-computer-delivered-ielts",
        publisher: "IDP Education"
      },
      {
        title: "British Council Computer-delivered IELTS Candidate Portal",
        url: "https://takeielts.britishcouncil.org/take-ielts/which-test/computer",
        publisher: "British Council"
      }
    ]
  }
];

// Helper: LocalStorage Cache Sync
function getLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// -------------------------------------------------------------
// PUBLIC READ APIS
// -------------------------------------------------------------

export async function fetchPublicPosts(params?: {
  category?: string;
  search?: string;
  tag?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ posts: BlogPost[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  try {
    const res = await fetch(`/api/blog/posts?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.posts)) {
        setLocalCache(FALLBACK_CACHE_KEY, data.posts);
        return data;
      }
    }
  } catch (err) {
    console.warn("Public posts API network error, using client cache fallback:", err);
  }

  // Fallback to local cache
  const allCached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  let filtered = allCached.filter(p => p.status === 'published');

  if (params?.category) {
    filtered = filtered.filter(p => p.category_id === params.category || p.category?.slug === params.category);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.primary_keyword && p.primary_keyword.toLowerCase().includes(q))
    );
  }

  const limit = params?.limit || 9;
  const page = params?.page || 1;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return { posts: paginated, total, page, totalPages };
}

export async function fetchPublicPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.redirect) {
        return data as any;
      }
      const post = data.post || (data.id || data.slug ? data : null);
      if (post) {
        // Cache post in fallback cache
        const allCached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
        const existingIdx = allCached.findIndex(p => p.slug === post.slug || p.id === post.id);
        if (existingIdx >= 0) {
          allCached[existingIdx] = post;
        } else {
          allCached.push(post);
        }
        setLocalCache(FALLBACK_CACHE_KEY, allCached);
        return post;
      }
    }
  } catch (err) {
    console.warn("Public post by slug network error, checking local cache:", err);
  }

  const allCached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  const found = allCached.find(p => p.slug === slug || p.id === slug) || DEFAULT_POSTS.find(p => p.slug === slug || p.id === slug);
  if (found) {
    // Populate relations if missing
    const cats = getLocalCache<BlogCategory[]>(CATEGORIES_CACHE_KEY, DEFAULT_CATEGORIES);
    const authors = getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
    const reviewers = getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);

    return {
      ...found,
      category: found.category || cats.find(c => c.id === found.category_id) || DEFAULT_CATEGORIES.find(c => c.id === found.category_id),
      author: found.author || authors.find(a => a.id === found.author_id) || DEFAULT_AUTHORS.find(a => a.id === found.author_id),
      reviewer: found.reviewer || reviewers.find(r => r.id === found.reviewer_id) || DEFAULT_REVIEWERS.find(r => r.id === found.reviewer_id)
    };
  }
  return null;
}

export async function recordPostView(slugOrId: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/blog/posts/${encodeURIComponent(slugOrId)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.views === 'number') {
        // Also update local cache
        const allCached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
        const norm = decodeURIComponent(slugOrId).trim().toLowerCase().replace(/^\/+|\/+$/g, "");
        const p = allCached.find(post => 
          (post.slug && post.slug.toLowerCase() === norm) || 
          (post.id && post.id.toLowerCase() === norm) ||
          post.slug === slugOrId || 
          post.id === slugOrId
        );
        if (p) {
          p.views = data.views;
          setLocalCache(FALLBACK_CACHE_KEY, allCached);
        }
        return data.views;
      }
    }
  } catch (err) {
    console.warn("Could not record post view:", err);
  }
  return null;
}

export async function fetchCategories(): Promise<BlogCategory[]> {
  try {
    const res = await fetch('/api/blog/categories');
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.categories) ? data.categories : null);
      if (list && list.length > 0) {
        setLocalCache(CATEGORIES_CACHE_KEY, list);
        return list;
      }
    }
  } catch {}
  return getLocalCache<BlogCategory[]>(CATEGORIES_CACHE_KEY, DEFAULT_CATEGORIES);
}

export async function fetchCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const cats = await fetchCategories();
  return cats.find(c => c.slug === slug || c.id === slug) || null;
}

export async function fetchAuthors(): Promise<BlogAuthor[]> {
  try {
    const res = await fetch('/api/blog/authors');
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.authors) ? data.authors : null);
      if (list && list.length > 0) {
        const normalized: BlogAuthor[] = list.map((a: any) => ({
          ...a,
          profile_image: a.profile_image || a.avatar_url || '',
          avatar_url: a.avatar_url || a.profile_image || ''
        }));
        setLocalCache(AUTHORS_CACHE_KEY, normalized);
        return normalized;
      }
    }
  } catch {}
  return getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
}

export async function fetchAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  const norm = slug.trim().toLowerCase();
  try {
    const res = await fetch(`/api/blog/authors/${norm}`);
    if (res.ok) {
      const data = await res.json();
      const a = data.author || data;
      if (a && (a.id || a.slug)) {
        return {
          ...a,
          profile_image: a.profile_image || a.avatar_url || '',
          avatar_url: a.avatar_url || a.profile_image || ''
        };
      }
    }
  } catch {}

  const authors = await fetchAuthors();
  const found = authors.find(a => (a.slug || '').toLowerCase() === norm || (a.id || '').toLowerCase() === norm);
  if (found) {
    return {
      ...found,
      profile_image: found.profile_image || found.avatar_url || '',
      avatar_url: found.avatar_url || found.profile_image || ''
    };
  }

  // Also check reviewers if accessed via /blog/author/:slug
  const reviewers = await fetchReviewers();
  const rev = reviewers.find(r => (r.slug || '').toLowerCase() === norm || (r.id || '').toLowerCase() === norm);
  if (rev) {
    return {
      id: rev.id,
      name: rev.name,
      slug: rev.slug,
      bio: rev.bio,
      credentials: rev.qualifications,
      designation: rev.qualifications,
      organization: rev.organization,
      profile_image: rev.avatar_url || rev.profile_image || '',
      avatar_url: rev.avatar_url || rev.profile_image || '',
      expertise: rev.expertise,
      indexable: rev.indexable
    };
  }
  return null;
}

export async function fetchReviewers(): Promise<BlogReviewer[]> {
  try {
    const res = await fetch('/api/blog/reviewers');
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.reviewers) ? data.reviewers : null);
      if (list && list.length > 0) {
        const normalized: BlogReviewer[] = list.map((r: any) => ({
          ...r,
          avatar_url: r.avatar_url || r.profile_image || '',
          profile_image: r.profile_image || r.avatar_url || ''
        }));
        setLocalCache(REVIEWERS_CACHE_KEY, normalized);
        return normalized;
      }
    }
  } catch {}
  return getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);
}

export async function fetchPublicBlogSettings(): Promise<BlogSettings> {
  try {
    const res = await fetch('/api/blog/settings');
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        setLocalCache(SETTINGS_CACHE_KEY, data.settings);
        return data.settings;
      }
    }
  } catch {}
  return getLocalCache<BlogSettings>(SETTINGS_CACHE_KEY, DEFAULT_BLOG_SETTINGS);
}

// -------------------------------------------------------------
// ADMIN CMS APIS
// -------------------------------------------------------------

export async function fetchAdminPosts(params?: {
  status?: string;
  category?: string;
  category_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<BlogPost[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category || params?.category_id) query.append('category', (params.category || params.category_id)!);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`/api/blog/admin/posts?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : null);
      if (posts) {
        setLocalCache(FALLBACK_CACHE_KEY, posts);
        return posts;
      }
    }
  } catch {}

  const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  let filtered = cached;
  if (params?.status && params.status !== 'all') {
    filtered = filtered.filter(p => p.status === params.status);
  }
  if (params?.category) {
    filtered = filtered.filter(p => p.category_id === params.category);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.slug.includes(q));
  }
  return filtered;
}

export async function fetchAdminPostById(id: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`/api/blog/admin/posts/${id}`);
    if (res.ok) {
      const data = await res.json();
      const post = data?.post || (data?.id ? data : null);
      if (post) return post;
    }
  } catch {}

  const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  return cached.find(p => p.id === id) || null;
}

export async function createAdminPost(postData: Partial<BlogPost>): Promise<BlogPost> {
  try {
    const res = await fetch('/api/blog/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if (res.ok) {
      const data = await res.json();
      const created = data?.post || (data?.id ? data : null);
      if (created) {
        const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
        setLocalCache(FALLBACK_CACHE_KEY, [created, ...cached.filter(p => p.id !== created.id)]);
        return created;
      }
    }
  } catch {}

  // Fallback local creation
  const newPost: BlogPost = {
    id: `post-${Date.now()}`,
    title: postData.title || "Untitled Article",
    slug: postData.slug || `untitled-${Date.now()}`,
    excerpt: postData.excerpt || "",
    content: postData.content || "",
    content_format: postData.content_format || "html",
    featured_image: postData.featured_image,
    featured_image_alt: postData.featured_image_alt,
    status: postData.status || "published",
    content_type: postData.content_type || "supporting",
    category_id: postData.category_id || "cat-ielts-writing",
    author_id: postData.author_id || "author-seb",
    reviewer_id: postData.reviewer_id,
    published_at: postData.status === 'published' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    last_reviewed_at: postData.last_reviewed_at,
    seo_title: postData.seo_title,
    meta_description: postData.meta_description,
    canonical_url: postData.canonical_url || `https://sebsinstitute.com/blog/${postData.slug || ''}`,
    robots_index: postData.robots_index !== false,
    robots_follow: postData.robots_follow !== false,
    reading_time: Math.max(1, Math.ceil((postData.content?.split(/\s+/).length || 100) / 200)),
    word_count: postData.content?.split(/\s+/).length || 0,
    featured: postData.featured || false,
    direct_answer_question: postData.direct_answer_question,
    direct_answer_text: postData.direct_answer_text,
    key_takeaways: postData.key_takeaways,
    important_note: postData.important_note,
    faqs: postData.faqs,
    sources: postData.sources,
    created_at: new Date().toISOString()
  };

  const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  setLocalCache(FALLBACK_CACHE_KEY, [newPost, ...cached.filter(p => p.id !== newPost.id)]);
  return newPost;
}

export async function updateAdminPost(id: string, postData: Partial<BlogPost>): Promise<BlogPost> {
  try {
    const res = await fetch(`/api/blog/admin/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if (res.ok) {
      const data = await res.json();
      const updatedItem = data?.post || (data?.id ? data : null);
      if (updatedItem) {
        const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
        const updated = cached.map(p => p.id === id ? updatedItem : p);
        setLocalCache(FALLBACK_CACHE_KEY, updated);
        return updatedItem;
      }
    }
  } catch {}

  const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  let updatedPost: BlogPost = {
    ...cached.find(p => p.id === id)!,
    ...postData,
    updated_at: new Date().toISOString()
  };
  const updated = cached.map(p => p.id === id ? updatedPost : p);
  setLocalCache(FALLBACK_CACHE_KEY, updated);
  return updatedPost;
}

export async function duplicateAdminPost(id: string): Promise<BlogPost> {
  const post = await fetchAdminPostById(id);
  if (!post) throw new Error("Post not found");
  return createAdminPost({
    ...post,
    title: `${post.title} (Copy)`,
    slug: `${post.slug}-copy-${Date.now()}`,
    status: 'draft',
    published_at: null
  });
}

export async function updateAdminPostStatus(id: string, status: BlogPost['status']): Promise<BlogPost> {
  return updateAdminPost(id, {
    status,
    published_at: status === 'published' ? new Date().toISOString() : undefined
  });
}

export async function deleteAdminPost(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/blog/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
      setLocalCache(FALLBACK_CACHE_KEY, cached.filter(p => p.id !== id));
      return true;
    }
  } catch {}

  const cached = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  setLocalCache(FALLBACK_CACHE_KEY, cached.filter(p => p.id !== id));
  return true;
}

export async function fetchAdminCategories(): Promise<BlogCategory[]> {
  return fetchCategories();
}

export async function saveAdminCategory(category: Partial<BlogCategory>): Promise<BlogCategory> {
  try {
    const res = await fetch('/api/blog/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.category || data;
    }
  } catch {}

  const cats = getLocalCache<BlogCategory[]>(CATEGORIES_CACHE_KEY, DEFAULT_CATEGORIES);
  const existingIdx = cats.findIndex(c => c.id === category.id);
  const savedCat: BlogCategory = {
    id: category.id || `cat-${Date.now()}`,
    name: category.name || "New Category",
    slug: category.slug || `category-${Date.now()}`,
    description: category.description || "",
    indexable: category.indexable !== false,
    display_order: category.display_order || cats.length + 1,
    post_count: category.post_count || 0
  };

  if (existingIdx >= 0) cats[existingIdx] = savedCat;
  else cats.push(savedCat);

  setLocalCache(CATEGORIES_CACHE_KEY, cats);
  return savedCat;
}

export const createAdminCategory = (cat: Partial<BlogCategory>) => saveAdminCategory(cat);
export const updateAdminCategory = (id: string, cat: Partial<BlogCategory>) => saveAdminCategory({ ...cat, id });
export async function deleteAdminCategory(id: string): Promise<boolean> {
  const cats = getLocalCache<BlogCategory[]>(CATEGORIES_CACHE_KEY, DEFAULT_CATEGORIES);
  setLocalCache(CATEGORIES_CACHE_KEY, cats.filter(c => c.id !== id));
  try {
    await fetch(`/api/blog/admin/categories/${id}`, { method: 'DELETE' });
  } catch {}
  return true;
}

export async function fetchAdminAuthors(): Promise<BlogAuthor[]> {
  return fetchAuthors();
}

export async function saveAdminAuthor(author: Partial<BlogAuthor>): Promise<BlogAuthor> {
  const imgUrl = author.profile_image || (author as any).avatar_url || '';
  const toSend = {
    ...author,
    profile_image: imgUrl,
    avatar_url: imgUrl
  };

  try {
    const res = await fetch('/api/blog/admin/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend)
    });
    if (res.ok) {
      const data = await res.json();
      const rawSaved = data?.author || data;
      const normalizedSaved: BlogAuthor = {
        ...rawSaved,
        profile_image: rawSaved.profile_image || rawSaved.avatar_url || imgUrl,
        avatar_url: rawSaved.avatar_url || rawSaved.profile_image || imgUrl
      };
      const authors = getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
      const existingIdx = authors.findIndex(a => a.id === normalizedSaved.id || a.slug === normalizedSaved.slug);
      if (existingIdx >= 0) authors[existingIdx] = normalizedSaved;
      else authors.push(normalizedSaved);
      setLocalCache(AUTHORS_CACHE_KEY, authors);
      return normalizedSaved;
    }
  } catch (err) {
    console.warn("Failed to save author to API, updating client cache:", err);
  }

  const authors = getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
  const existingIdx = authors.findIndex(a => a.id === author.id || (author.slug && a.slug === author.slug));
  const savedAuthor: BlogAuthor = {
    id: author.id || `author-${Date.now()}`,
    name: author.name || "New Author",
    slug: author.slug || author.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `author-${Date.now()}`,
    bio: author.bio || "",
    credentials: author.credentials || "",
    organization: author.organization || "SEBS Institute",
    expertise: author.expertise || [],
    profile_image: imgUrl,
    avatar_url: imgUrl,
    social_links: author.social_links || { linkedin: '', website: '', twitter: '' },
    indexable: author.indexable !== false
  };

  if (existingIdx >= 0) authors[existingIdx] = savedAuthor;
  else authors.push(savedAuthor);

  setLocalCache(AUTHORS_CACHE_KEY, authors);
  return savedAuthor;
}

export async function deleteAdminAuthor(authorId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/blog/admin/authors/${authorId}`, { method: 'DELETE' });
    if (res.ok) {
      const authors = getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
      setLocalCache(AUTHORS_CACHE_KEY, authors.filter(a => a.id !== authorId));
      return true;
    }
  } catch {}
  const authors = getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
  setLocalCache(AUTHORS_CACHE_KEY, authors.filter(a => a.id !== authorId));
  return true;
}

export async function fetchAdminReviewers(): Promise<BlogReviewer[]> {
  return fetchReviewers();
}

export async function saveAdminReviewer(reviewer: Partial<BlogReviewer>): Promise<BlogReviewer> {
  const imgUrl = reviewer.avatar_url || (reviewer as any).profile_image || '';
  const toSend = {
    ...reviewer,
    avatar_url: imgUrl,
    profile_image: imgUrl
  };

  try {
    const res = await fetch('/api/blog/admin/reviewers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend)
    });
    if (res.ok) {
      const data = await res.json();
      const rawSaved = data?.reviewer || data;
      const normalizedSaved: BlogReviewer = {
        ...rawSaved,
        avatar_url: rawSaved.avatar_url || rawSaved.profile_image || imgUrl,
        profile_image: rawSaved.profile_image || rawSaved.avatar_url || imgUrl
      };
      const reviewers = getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);
      const existingIdx = reviewers.findIndex(r => r.id === normalizedSaved.id || r.slug === normalizedSaved.slug);
      if (existingIdx >= 0) reviewers[existingIdx] = normalizedSaved;
      else reviewers.push(normalizedSaved);
      setLocalCache(REVIEWERS_CACHE_KEY, reviewers);
      return normalizedSaved;
    }
  } catch (err) {
    console.warn("Failed to save reviewer to API, updating client cache:", err);
  }

  const reviewers = getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);
  const existingIdx = reviewers.findIndex(r => r.id === reviewer.id || (reviewer.slug && r.slug === reviewer.slug));
  const savedRev: BlogReviewer = {
    id: reviewer.id || `reviewer-${Date.now()}`,
    name: reviewer.name || "New Reviewer",
    slug: reviewer.slug || reviewer.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `reviewer-${Date.now()}`,
    bio: reviewer.bio || "",
    qualifications: reviewer.qualifications || "",
    organization: reviewer.organization || "SEBS Institute Assessment Board",
    expertise: reviewer.expertise || [],
    avatar_url: imgUrl,
    profile_image: imgUrl,
    indexable: reviewer.indexable !== false
  };

  if (existingIdx >= 0) reviewers[existingIdx] = savedRev;
  else reviewers.push(savedRev);

  setLocalCache(REVIEWERS_CACHE_KEY, reviewers);
  return savedRev;
}

export async function deleteAdminReviewer(reviewerId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/blog/admin/reviewers/${reviewerId}`, { method: 'DELETE' });
    if (res.ok) {
      const reviewers = getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);
      setLocalCache(REVIEWERS_CACHE_KEY, reviewers.filter(r => r.id !== reviewerId));
      return true;
    }
  } catch {}
  const reviewers = getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);
  setLocalCache(REVIEWERS_CACHE_KEY, reviewers.filter(r => r.id !== reviewerId));
  return true;
}

export async function fetchAdminStats(): Promise<{
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  pending_posts: number;
  scheduled_posts: number;
  archived_posts: number;
  total_categories: number;
  total_authors: number;
  total_reviewers: number;
  total_redirects: number;
}> {
  try {
    const res = await fetch('/api/blog/stats');
    if (res.ok) {
      const data = await res.json();
      const raw = data?.stats || data;
      if (raw && typeof raw === 'object') {
        return {
          total_posts: Number(raw.total_posts) || 0,
          published_posts: Number(raw.published_posts) || 0,
          draft_posts: Number(raw.draft_posts) || 0,
          pending_posts: Number(raw.pending_posts) || 0,
          scheduled_posts: Number(raw.scheduled_posts) || 0,
          archived_posts: Number(raw.archived_posts) || 0,
          total_categories: Number(raw.total_categories) || 0,
          total_authors: Number(raw.total_authors) || 0,
          total_reviewers: Number(raw.total_reviewers) || 0,
          total_redirects: Number(raw.total_redirects) || 0
        };
      }
    }
  } catch (err) {
    console.error('Failed to fetch /api/blog/stats:', err);
  }

  const posts = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  const cats = getLocalCache<BlogCategory[]>(CATEGORIES_CACHE_KEY, DEFAULT_CATEGORIES);
  const authors = getLocalCache<BlogAuthor[]>(AUTHORS_CACHE_KEY, DEFAULT_AUTHORS);
  const revs = getLocalCache<BlogReviewer[]>(REVIEWERS_CACHE_KEY, DEFAULT_REVIEWERS);

  return {
    total_posts: posts.length,
    published_posts: posts.filter(p => p.status === 'published').length,
    draft_posts: posts.filter(p => p.status === 'draft').length,
    pending_posts: posts.filter(p => p.status === 'pending_review').length,
    scheduled_posts: posts.filter(p => p.status === 'scheduled').length,
    archived_posts: posts.filter(p => p.status === 'archived').length,
    total_categories: cats.length,
    total_authors: authors.length,
    total_reviewers: revs.length,
    total_redirects: 0
  };
}

export async function fetchAdminAudits(): Promise<BlogAuditItem[]> {
  try {
    const res = await fetch('/api/blog/audits');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.audits)) return data.audits;
    }
  } catch {}

  // Compute live client-side technical SEO health audit items
  const posts = getLocalCache<BlogPost[]>(FALLBACK_CACHE_KEY, DEFAULT_POSTS);
  const items: BlogAuditItem[] = [];

  posts.forEach(post => {
    // 1. Missing Canonical
    if (post.status === 'published' && !post.canonical_url) {
      items.push({
        id: `audit-canonical-${post.id}`,
        type: 'critical',
        code: 'MISSING_CANONICAL',
        title: 'Published Article Missing Canonical Tag',
        description: `Article "${post.title}" is published without an explicit self-referential canonical URL.`,
        affected_url: `/blog/${post.slug}`,
        suggested_action: 'Add canonical URL pointing to preferred permalink.',
        status: 'open'
      });
    }

    // 2. Missing Meta Description
    if (post.status === 'published' && (!post.meta_description || post.meta_description.length < 50)) {
      items.push({
        id: `audit-meta-${post.id}`,
        type: 'warning',
        code: 'THIN_META_DESCRIPTION',
        title: 'Meta Description Missing or Too Short',
        description: `Snippet description is ${post.meta_description?.length || 0} characters. Search engines may generate suboptimal SERP snippets.`,
        affected_url: `/blog/${post.slug}`,
        suggested_action: 'Craft a 120-160 character editorial meta description addressing search intent.',
        status: 'open'
      });
    }

    // 3. Stale Content (over 180 days without review)
    if (post.status === 'published' && post.last_reviewed_at) {
      const lastRev = new Date(post.last_reviewed_at).getTime();
      const diffDays = (Date.now() - lastRev) / (1000 * 60 * 60 * 24);
      if (diffDays > 180) {
        items.push({
          id: `audit-stale-${post.id}`,
          type: 'info',
          code: 'STALE_CONTENT',
          title: 'Article Not Reviewed in Over 180 Days',
          description: `Article was last reviewed on ${new Date(post.last_reviewed_at).toLocaleDateString()}. Factual IELTS criteria should be re-verified.`,
          affected_url: `/blog/${post.slug}`,
          suggested_action: 'Review factual accuracy and update last_reviewed_at date.',
          status: 'open'
        });
      }
    }
  });

  return items;
}

export async function fetchAdminRedirects(): Promise<BlogRedirect[]> {
  try {
    const res = await fetch('/api/blog/redirects');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.redirects)) return data.redirects;
    }
  } catch {}
  return [];
}

export async function saveAdminRedirect(redirect: Partial<BlogRedirect>): Promise<BlogRedirect> {
  const res = await fetch('/api/blog/redirects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(redirect)
  });
  const data = await res.json();
  return data.redirect;
}

export async function deleteAdminRedirect(id: string): Promise<boolean> {
  await fetch(`/api/blog/redirects/${id}`, { method: 'DELETE' });
  return true;
}

export async function fetchPostRevisions(postId: string): Promise<BlogRevision[]> {
  try {
    const res = await fetch(`/api/blog/admin/posts/${postId}/revisions`);
    if (res.ok) {
      const data = await res.json();
      return data.revisions || [];
    }
  } catch {}
  return [];
}

export const fetchAdminRevisions = fetchPostRevisions;
export const restorePostRevision = restoreAdminRevision;

export async function restoreAdminRevision(postId: string, revisionId: string): Promise<BlogPost> {
  const res = await fetch(`/api/blog/admin/posts/${postId}/revisions/${revisionId}/restore`, {
    method: 'POST'
  });
  const data = await res.json();
  return data.post;
}

const MEDIA_CACHE_KEY = 'sebs_blog_media_cache_v2';
const DEFAULT_MEDIA: any[] = [
  {
    id: "media-1",
    url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format,compress&fm=webp&w=1200&q=80",
    filename: "ielts-study-desk.webp",
    alt_text: "IELTS complete preparation book and study desk",
    title: "IELTS Study Desk",
    created_at: new Date().toISOString()
  },
  {
    id: "media-2",
    url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format,compress&fm=webp&w=1200&q=80",
    filename: "essay-draft-pen.webp",
    alt_text: "Fountain pen on essay draft notebook",
    title: "Essay Drafting",
    created_at: new Date().toISOString()
  },
  {
    id: "media-3",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format,compress&fm=webp&w=1200&q=80",
    filename: "speaking-session.webp",
    alt_text: "Oral speaking coaching session with candidate",
    title: "Speaking Coaching",
    created_at: new Date().toISOString()
  }
];

export async function fetchAdminMedia(params?: { search?: string; limit?: number }): Promise<{ media: any[]; total: number }> {
  try {
    const res = await fetch('/api/blog/admin/media');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.media)) return { media: data.media, total: data.media.length };
    }
  } catch {}

  const cached = getLocalCache<any[]>(MEDIA_CACHE_KEY, DEFAULT_MEDIA);
  let filtered = cached;
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(m => (m.title || '').toLowerCase().includes(q) || (m.alt_text || '').toLowerCase().includes(q));
  }
  return { media: filtered, total: filtered.length };
}

export async function uploadAdminMedia(file: File, altText?: string, title?: string): Promise<any> {
  // Read as base64 data URL for instant storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia = {
        id: `media-${Date.now()}`,
        url: reader.result as string,
        file_url: reader.result as string,
        filename: file.name,
        original_filename: file.name,
        alt_text: altText || file.name.replace(/\.[^/.]+$/, ""),
        title: title || file.name,
        mime_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString()
      };
      const cached = getLocalCache<any[]>(MEDIA_CACHE_KEY, DEFAULT_MEDIA);
      setLocalCache(MEDIA_CACHE_KEY, [newMedia, ...cached]);
      resolve(newMedia);
    };
    reader.readAsDataURL(file);
  });
}

export async function deleteAdminMedia(id: string): Promise<boolean> {
  const cached = getLocalCache<any[]>(MEDIA_CACHE_KEY, DEFAULT_MEDIA);
  setLocalCache(MEDIA_CACHE_KEY, cached.filter(m => m.id !== id));
  return true;
}

