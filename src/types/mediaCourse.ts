export type MediaCourseType = 'video' | 'audio' | 'hybrid';

export type MediaQuestionType = 'mcq' | 'fib' | 'qa' | 'tfng' | 'audio_repeat';

export type GateType = 'in_video' | 'post_video' | 'standalone_checkpoint';

export interface MediaQuestion {
  id: string;
  type: MediaQuestionType;
  prompt: string;
  timestamp?: number; // seconds into video/audio (e.g. 195s = 03:15)
  timestampFormatted?: string; // e.g. "03:15"
  gateType: GateType; // 'in_video' pauses player at timestamp, 'post_video' triggers upon completion
  options?: string[]; // for MCQ / TFNG
  correctIndex?: number; // for MCQ / TFNG
  correctAnswer?: string; // for FIB or exact match
  acceptedAnswers?: string[]; // for FIB with alternate acceptable inputs
  caseSensitive?: boolean;
  sampleAnswer?: string; // for Q&A open response
  rubricNotes?: string; // for examiner grading notes
  explanation?: string; // pedagogical breakdown
  hint?: string;
  points?: number;
  requiredToPass?: boolean;
  userAnswer?: any; // runtime state
  isCorrect?: boolean; // runtime state
}

export interface PedagogicalRule {
  title: string;
  description: string;
  formula?: string;
  trap?: string;
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
}

export interface EpisodeResource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'audio' | 'link' | 'doc';
  size?: string;
}

export interface MediaEpisode {
  id: string;
  title: string;
  description: string;
  mediaType: 'video' | 'audio';
  mediaUrl: string; // YouTube URL, MP4/MP3, or direct link
  youtubeId?: string; // extracted YouTube video ID
  duration: string; // e.g. "14:20"
  durationSeconds?: number;
  posterUrl?: string;
  transcript?: string;
  speaker?: string;
  order: number;
  cefrBand?: string;
  pedagogicalRule?: PedagogicalRule;
  learningObjectives?: LearningObjective[];
  instructorNotes?: string[];
  questions: MediaQuestion[];
  resources?: EpisodeResource[];
}

export interface MediaModule {
  id: string;
  title: string;
  description: string;
  order: number;
  episodes: MediaEpisode[];
}

export interface MediaCourse {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  mediaType: MediaCourseType;
  category: string;
  targetBand: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';
  instructor: string;
  instructorTitle: string;
  instructorAvatar?: string;
  featuredImage: string;
  trailerUrl?: string;
  status: 'Published' | 'Draft' | 'Archived';
  accessTier: 'Free' | 'Enrolled' | 'Pro' | 'VIP';
  totalDuration?: string;
  tags: string[];
  modules: MediaModule[];
  createdAt: string;
  updatedAt: string;
}
