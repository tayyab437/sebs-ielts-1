export type WorksheetType = 'nouns_suffixes' | 'adjectives_adverbs_verbs' | 'speaking_cuecard_vocab' | 'custom';

export interface WorksheetFieldFeedback {
  fieldKey: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  userValue: string;
  expectedSample?: string;
  feedbackText: string;
}

export interface WorksheetEvaluationResult {
  submissionId: string;
  worksheetId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  bandScore: string;
  grade: string;
  overallSummary: string;
  strengths: string[];
  improvements: string[];
  fieldFeedbacks: Record<string, WorksheetFieldFeedback>;
  instructorFeedbackNotes: string;
  status: 'evaluated' | 'pending' | 'reviewed';
}

export interface WorksheetSubmission {
  id: string;
  worksheetId: string;
  episodeId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  date: string;
  answers: Record<string, any>;
  evaluation?: WorksheetEvaluationResult;
  status: 'draft' | 'submitted' | 'graded';
  createdAt: string;
  updatedAt: string;
}

export interface SuffixColumnConfig {
  suffix: string;
  label: string;
  targetType: 'noun' | 'adjective' | 'adverb' | 'verb';
  sampleAnswers: string[];
  minRequired?: number;
}

export interface NounTypeRowConfig {
  id: string;
  nounType: string;
  definition: string;
  examples: string;
  expectedCriteria: string;
}

export interface ChallengeItemConfig {
  id: string;
  baseWord: string;
  targetType: string;
  expectedNouns: string[];
  suffix: string;
  points: number;
}

export interface AdverbTypeRowConfig {
  id: string;
  adverbType: string;
  definition: string;
  examples: string;
  categoryOptions?: string[];
  correctCategory?: string;
}

export interface WorksheetDefinition {
  id: string;
  type: WorksheetType;
  title: string;
  subtitle: string;
  workshopTitle: string;
  totalPages: number;
  maxTotalPoints: number;
  description: string;
}
