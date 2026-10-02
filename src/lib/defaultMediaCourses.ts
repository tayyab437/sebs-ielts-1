import { MediaCourse } from "../types/mediaCourse";

export const DEFAULT_MEDIA_COURSES: MediaCourse[] = [
  {
    id: "mc-speaking-masterclass",
    title: "IELTS Band 8.5 Speaking & Phonetic Retraining Video Masterclass",
    slug: "ielts-band-8-5-speaking-phonetic-retraining",
    subtitle: "Eliminate Accent Blockers, Master Stress-Timed Cadence & Crack Cue Cards with Syed Ejaz Bukhari",
    description: "An intensive cinematic video curriculum crafted for scholars targeting Band 8.0 to 9.0 in IELTS Speaking. Learn the proprietary 'English, Not Pinglish' vocal-conditioning technique, natural thought group chunking, and instant spontaneous answer construction for Part 1, Part 2, and Part 3.",
    mediaType: "video",
    category: "IELTS Speaking Mastery",
    targetBand: "8.5+",
    difficulty: "Advanced",
    instructor: "Syed Ejaz Bukhari",
    instructorTitle: "Principal IELTS Director & Linguistic Expert",
    instructorAvatar: "/sebs_official_logo_160.webp",
    featuredImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "Published",
    accessTier: "Free",
    totalDuration: "1h 45m",
    tags: ["IELTS Speaking", "Pronunciation", "Fluency", "Syed Ejaz Bukhari", "Part 2 Cue Cards"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: "mod-1-phonetics",
        title: "Module 1: Vocal Architecture & Stress-Timed Cadence",
        description: "Master English rhythm mechanics and stop the syllable-timed habits that drag down your Fluency and Pronunciation scores.",
        order: 1,
        episodes: [
          {
            id: "ep-1-1",
            title: "Lesson 1: Eliminating 'Pinglish' & Mastering English Vowel Reduction",
            description: "Learn how the Schwa /ə/ sound transforms your speaking flow from mechanical to instinctively native-sounding.",
            mediaType: "video",
            mediaUrl: "https://www.youtube.com/watch?v=V-_O7nl0Ii0",
            youtubeId: "V-_O7nl0Ii0",
            duration: "12:30",
            durationSeconds: 750,
            posterUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80",
            speaker: "Syed Ejaz Bukhari",
            order: 1,
            transcript: "Welcome to SEB's Institute. Today we deconstruct why so many candidates get stuck at Band 6.0 in IELTS Speaking. The key difference between a Band 6.0 speaker and a Band 8.5 speaker is not big dictionary words; it is stress-timed rhythm and smooth vowel reduction...",
            questions: [
              {
                id: "q-1-1-1",
                type: "mcq",
                prompt: "According to Syed Ejaz Bukhari, what is the primary structural difference between South Asian English and standard British/International English rhythm?",
                timestamp: 180,
                timestampFormatted: "03:00",
                gateType: "in_video",
                options: [
                  "South Asian English uses more formal idioms",
                  "English is stress-timed whereas many regional dialects are syllable-timed",
                  "English requires shouting the first word of every sentence",
                  "Standard English has faster consonants but no vowel reduction"
                ],
                correctIndex: 1,
                explanation: "English is stress-timed: only content words carry stress and unstressed syllables shrink in duration (vowel reduction). Syllable-timed speaking gives equal weight to all syllables, causing a choppy rhythm.",
                hint: "Think about the timing mechanism of vowels and stress in natural discourse.",
                points: 10,
                requiredToPass: true
              },
              {
                id: "q-1-1-2",
                type: "fib",
                prompt: "Complete the key phonological term: The most frequent vowel sound in spoken English that enables stress-timing is the ____ sound (symbol /ə/).",
                timestamp: 360,
                timestampFormatted: "06:00",
                gateType: "in_video",
                correctAnswer: "schwa",
                acceptedAnswers: ["schwa", "the schwa", "schwa sound", "/ə/"],
                caseSensitive: false,
                explanation: "The schwa /ə/ sound is the unstressed central neutral vowel sound essential for fluent connected speech.",
                hint: "It starts with the letter 's' and sounds like 'uh'.",
                points: 10,
                requiredToPass: false
              },
              {
                id: "q-1-1-3",
                type: "qa",
                prompt: "Checkpoint Assessment: Explain why using conversational discourse markers (e.g., 'Well, frankly...', 'To be completely candid...') improves your IELTS Fluency score more than memorized linkers (e.g., 'Furthermore, moreover').",
                timestamp: 700,
                timestampFormatted: "11:40",
                gateType: "post_video",
                sampleAnswer: "Conversational discourse markers reflect genuine natural thinking pauses and spontaneous speech management required in IELTS Speaking, whereas rigid academic essay linkers like 'moreover' sound unnatural and scripted, causing examiners to penalize lexical authenticity.",
                rubricNotes: "Award full marks if the student mentions natural conversational pausing, avoiding scripted tone, and authentic discourse management.",
                explanation: "IELTS Speaking evaluates spontaneous conversational fluency, not written academic essay mechanics.",
                points: 15,
                requiredToPass: true
              }
            ],
            resources: [
              {
                id: "res-nouns-1",
                title: "SEBS Practice Sheet: Nouns & Suffix Word Formation",
                url: "https://sebsinstitute.com/worksheets/nouns.pdf",
                type: "pdf",
                size: "2 Pages • Fillable Online"
              },
              {
                id: "res-adj-1",
                title: "SEBS Practice Sheet: Adjectives, Adverbs & Verbs",
                url: "https://sebsinstitute.com/worksheets/adjectives-adverbs.pdf",
                type: "pdf",
                size: "2 Pages • Fillable Online"
              }
            ]
          },
          {
            id: "ep-1-2",
            title: "Lesson 2: Thought Chunking & Intonation Peaks in Complex Sentences",
            description: "How to group words into natural thought units to never run out of breath and sound authoritative during IELTS examiner cross-examination.",
            mediaType: "video",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: "15:45",
            durationSeconds: 945,
            posterUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80",
            speaker: "Syed Ejaz Bukhari",
            order: 2,
            transcript: "When speaking in IELTS Part 3, you are dealing with abstract societal issues. If you speak word-by-word, your brain panics. If you chunk your speech into grammatical ideas...",
            questions: [
              {
                id: "q-1-2-1",
                type: "tfng",
                prompt: "True, False, or Not Given: In IELTS Speaking, rising intonation at the end of a statement shows definitive authority and finality.",
                timestamp: 240,
                timestampFormatted: "04:00",
                gateType: "in_video",
                options: ["True", "False", "Not Given"],
                correctIndex: 1,
                explanation: "False! Falling intonation signals completion and authority. Rising intonation on statements indicates uncertainty or a question (uptalk).",
                points: 10,
                requiredToPass: true
              },
              {
                id: "q-1-2-2",
                type: "fib",
                prompt: "Fill in the blank: To connect two contrasting viewpoints smoothly in Part 3, you can use the phrase 'On the flip ____, however...' to maintain dynamic rhythm.",
                timestamp: 600,
                timestampFormatted: "10:00",
                gateType: "in_video",
                correctAnswer: "side",
                acceptedAnswers: ["side", "flip side"],
                caseSensitive: false,
                explanation: "The idiom 'on the flip side' is an idiomatic conversational device highly prized in Band 8+ Lexical Resource.",
                points: 10,
                requiredToPass: false
              }
            ]
          }
        ]
      },
      {
        id: "mod-2-cuecards",
        title: "Module 2: Part 2 Cue Card Mastery (Past-Present-Future Framework)",
        description: "Never run out of things to say in your 2-minute monologue. Build unbreakable coherence with the 3-phase chronological storyline.",
        order: 2,
        episodes: [
          {
            id: "ep-2-1",
            title: "Lesson 3: The 1-Minute Prep Blueprint & The Sensory Description Method",
            description: "Turn simple notes on your rough paper into a structured 120-second cinematic presentation.",
            mediaType: "video",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            duration: "18:10",
            durationSeconds: 1090,
            posterUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
            speaker: "Syed Ejaz Bukhari",
            order: 1,
            transcript: "During your 1-minute preparation time in Part 2, do NOT write full sentences. Write keywords corresponding to sight, sound, emotions, and turning points...",
            questions: [
              {
                id: "q-2-1-1",
                type: "mcq",
                prompt: "What is the biggest mistake students make during the 1-minute preparation time for IELTS Part 2?",
                timestamp: 210,
                timestampFormatted: "03:30",
                gateType: "in_video",
                options: [
                  "Writing down 4-5 key prompt words",
                  "Trying to write full sentences that they run out of time to finish",
                  "Closing their eyes to visualize the memory",
                  "Drawing a timeline diagram"
                ],
                correctIndex: 1,
                explanation: "Writing full sentences consumes precious seconds and leaves you unprepared for the second half of the talk. Keywords and sensory prompts are much faster and more flexible.",
                points: 10,
                requiredToPass: true
              },
              {
                id: "q-2-1-2",
                type: "qa",
                prompt: "Practice Task: Name the 4 sensory anchor categories Syed Ejaz Bukhari instructs candidates to write on their Part 2 prep sheet.",
                timestamp: 750,
                timestampFormatted: "12:30",
                gateType: "post_video",
                sampleAnswer: "1. Visuals/Atmosphere (What it looked like), 2. Auditory/Sounds (Conversations & noise), 3. Internal Emotions (How it felt then vs now), 4. Key Takeaway/Reflection (Why it mattered).",
                rubricNotes: "Full points if at least 3 sensory/reflection dimensions are identified.",
                explanation: "Sensory anchors trigger spontaneous descriptive language, enriching Lexical Resource (Band 8+).",
                points: 15,
                requiredToPass: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "mc-audio-phonetics",
    title: "Bukhari's Phonetics & Acoustic Ear-Training Audio Series",
    slug: "bukharis-phonetics-acoustic-ear-training-audio",
    subtitle: "High-Definition Audio Masterclass for IELTS Listening Section 3 & 4 Catenation & Accent Decoding",
    description: "An immersive podcast-style audio training course designed to calibrate your ear to rapid British, Australian, Canadian, and Scottish accents. Includes interactive listening comprehension drills, dictation FIBs, and connected speech quizzes between audio tracks.",
    mediaType: "audio",
    category: "IELTS Listening Lab",
    targetBand: "8.0+",
    difficulty: "Mastery",
    instructor: "Syed Ejaz Bukhari & Zoha Ali",
    instructorTitle: "Senior EFL & Cognitive Linguistics Specialist",
    instructorAvatar: "/sebs_official_logo_160.webp",
    featuredImage: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80",
    trailerUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    status: "Published",
    accessTier: "Free",
    totalDuration: "1h 15m",
    tags: ["Audio Podcast", "Listening", "Phonetics", "Connected Speech", "Accents"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: "mod-audio-1",
        title: "Track Set 1: Rapid Connected Speech & Elision Drills",
        description: "Listen to native speakers linking words and practice catching numbers, names, and academic terms in real time.",
        order: 1,
        episodes: [
          {
            id: "ep-audio-1-1",
            title: "Episode 1: The Secret of Consonant-to-Vowel Catenation",
            description: "How 'an apple' becomes 'a-napple' and why word boundaries disappear in fast academic lectures.",
            mediaType: "audio",
            mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            duration: "09:40",
            durationSeconds: 580,
            posterUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
            speaker: "Syed Ejaz Bukhari",
            order: 1,
            transcript: "Welcome to Episode 1 of the Phonetics Audio Lab. In this lesson, we train your ear to recognize catenation. When a word ends with a consonant sound and the following word begins with a vowel sound...",
            questions: [
              {
                id: "q-audio-1-1",
                type: "mcq",
                prompt: "In the phrase 'hold on a second', how do native speakers group the sounds via catenation?",
                timestamp: 120,
                timestampFormatted: "02:00",
                gateType: "in_video",
                options: [
                  "Hold | on | a | second (4 distinct pauses)",
                  "Hol-do-na-second (linked as one unbroken flow)",
                  "H-old on a sec-ond",
                  "Hold-on a-second"
                ],
                correctIndex: 1,
                explanation: "The consonant 'd' links to 'o', and 'n' links to 'a', sounding like 'hol-do-na-second'. Recognizing this prevents confusion in Listening Section 3!",
                points: 10,
                requiredToPass: true
              },
              {
                id: "q-audio-1-2",
                type: "fib",
                prompt: "Dictation Drill: When the speaker mentions the university department name, what is the exact title mentioned in the audio? 'Department of Applied ____ Studies'.",
                timestamp: 300,
                timestampFormatted: "05:00",
                gateType: "in_video",
                correctAnswer: "linguistic",
                acceptedAnswers: ["linguistic", "linguistics", "Linguistics"],
                caseSensitive: false,
                explanation: "In IELTS Listening, spellings must be precise. 'Linguistic' or 'Linguistics' are both accepted.",
                points: 10,
                requiredToPass: true
              },
              {
                id: "q-audio-1-3",
                type: "qa",
                prompt: "Reflective Check: Summarize the three acoustic cues for identifying when a speaker is shifting to a new lecture slide in Section 4.",
                timestamp: 550,
                timestampFormatted: "09:10",
                gateType: "post_video",
                sampleAnswer: "1. A distinct pitch reset (higher starting pitch), 2. A preceding silent pause of 0.8-1.2 seconds, 3. A transitional discourse phrase (e.g., 'Turning now to...', 'If we now examine...').",
                explanation: "Recognizing pitch resets and pauses helps you avoid getting lost in 10-question continuous Section 4 monologues.",
                points: 15,
                requiredToPass: true
              }
            ]
          },
          {
            id: "ep-audio-1-2",
            title: "Episode 2: Distractor Traps in Listening Section 1 & 2",
            description: "How examiners use correction signals ('Oh sorry, I meant Thursday, not Tuesday') to fool unprepared test-takers.",
            mediaType: "audio",
            mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            duration: "11:15",
            durationSeconds: 675,
            posterUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
            speaker: "Zoha Ali",
            order: 2,
            transcript: "Examiners in IELTS Listening will almost never give you the answer without attempting at least one distractor. Watch out for words like 'actually', 'originally', 'on second thought'...",
            questions: [
              {
                id: "q-audio-2-1",
                type: "mcq",
                prompt: "Which of the following phrases is the strongest indicator that the speaker is about to correct a previously stated date or price?",
                timestamp: 180,
                timestampFormatted: "03:00",
                gateType: "in_video",
                options: [
                  "'As I mentioned earlier...'",
                  "'Actually, let me double check that...'",
                  "'According to the schedule...'",
                  "'Without a doubt...'"
                ],
                correctIndex: 1,
                explanation: "'Actually, let me double check that' is a classic IELTS marker indicating the first number was a distractor and the true answer is about to follow.",
                points: 10,
                requiredToPass: true
              },
              {
                id: "q-audio-2-2",
                type: "fib",
                prompt: "Fill in the blank: The rule of thumb when listening to phone numbers or addresses in Section 1 is to wait until the speaker confirms with a signal word like '____' before writing the final digits.",
                timestamp: 450,
                timestampFormatted: "07:30",
                gateType: "in_video",
                correctAnswer: "right",
                acceptedAnswers: ["right", "correct", "got it", "perfect", "yes"],
                caseSensitive: false,
                explanation: "Confirmation dialogues usually conclude with 'Right', 'Got it', or 'Perfect'.",
                points: 10,
                requiredToPass: false
              }
            ]
          }
        ]
      }
    ]
  }
];
