export type BlockType = 
  // Base
  | 'heading' | 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'divider'
  // Reading
  | 'reading-passage' | 'mcq' | 'true-false-not-given' | 'fill-blanks' 
  | 'matching-headings' | 'matching-information' | 'matching-features'
  | 'sentence-completion' | 'summary-completion' | 'table-completion'
  | 'flow-chart' | 'diagram-label'
  // Listening
  | 'listening-section' | 'listening-mcq' | 'listening-fill-blanks'
  // Writing
  | 'academic-task1' | 'general-task1' | 'task2'
  // Speaking
  | 'part1' | 'cue-card' | 'part3'
  // Structure
  | 'lesson' | 'assignment' | 'quiz' | 'downloadable-resource'
  // Utilities
  | 'question-range' | 'note' | 'tip' | 'band-descriptor';

export interface BlockData {
  id: string;
  type: BlockType;
  data: any;
}

export type LayoutType = 'single' | 'split';

export type PanelType = 'single' | 'left' | 'right';

export interface CourseData {
  id?: string;
  title: string;
  description: string;
  thumbnail_url: string;
  thumbnail_type?: 'image' | 'video';
  audio_url?: string;
  transcript_url?: string;
  transcript_name?: string;
  course_type: string;
  type?: string;
  category?: string;
  content?: string;
  layout_type: LayoutType;
  status: 'draft' | 'published' | 'Draft' | 'Published';
  blocks: {
    single: BlockData[];
    left: BlockData[];
    right: BlockData[];
  };
  timeLimit?: number;
  test_number?: string;
  show_in_catalog?: boolean;
  show_in_syllabus?: boolean;
  show_in_practice?: boolean;
  access_tier?: 'Free Trial' | 'Pro Premium' | 'Mastery Ultimate';
}

export const BLOCKS_METADATA: Record<BlockType, { title: string; category: string; description: string }> = {
  // Base
  'heading': { title: 'Heading', category: 'Basic', description: 'Large section heading' },
  'text': { title: 'Text', category: 'Basic', description: 'Standard paragraph text' },
  'image': { title: 'Image', category: 'Basic', description: 'Upload or link an image' },
  'audio': { title: 'Audio Player', category: 'Basic', description: 'Embed an audio track' },
  'video': { title: 'Video Player', category: 'Basic', description: 'Embed a video' },
  'pdf': { title: 'PDF Viewer', category: 'Basic', description: 'Embed a PDF document' },
  'divider': { title: 'Divider', category: 'Basic', description: 'Horizontal line separator' },
  
  // Reading
  'reading-passage': { title: 'Reading Passage', category: 'Reading', description: 'Long form IELTS reading text' },
  'mcq': { title: 'Multiple Choice', category: 'Reading', description: 'A, B, C, D question' },
  'true-false-not-given': { title: 'True/False/Not Given', category: 'Reading', description: 'Standard TFNG block' },
  'fill-blanks': { title: 'Fill in the Blanks', category: 'Reading', description: 'Text with gaps' },
  'matching-headings': { title: 'Matching Headings', category: 'Reading', description: 'Match paragraphs to headings' },
  'matching-information': { title: 'Matching Information', category: 'Reading', description: 'Match info to paragraphs' },
  'matching-features': { title: 'Matching Features', category: 'Reading', description: 'Match statements to categories' },
  'sentence-completion': { title: 'Sentence Completion', category: 'Reading', description: 'Complete sentences from text' },
  'summary-completion': { title: 'Summary Completion', category: 'Reading', description: 'Complete a summary' },
  'table-completion': { title: 'Table Completion', category: 'Reading', description: 'Fill in table data' },
  'flow-chart': { title: 'Flow Chart', category: 'Reading', description: 'Complete a process chart' },
  'diagram-label': { title: 'Diagram Label', category: 'Reading', description: 'Label parts of a diagram' },
  
  // Listening
  'listening-section': { title: 'Listening Section Head', category: 'Listening', description: 'Marks a new audio section' },
  'listening-mcq': { title: 'Listening MCQ', category: 'Listening', description: 'Audio multiple choice' },
  'listening-fill-blanks': { title: 'Listening Fill Blanks', category: 'Listening', description: 'Form/note completion' },
  
  // Writing
  'academic-task1': { title: 'Chart/Graph Task', category: 'Writing', description: 'Academic Writing Task 1' },
  'general-task1': { title: 'Letter Task', category: 'Writing', description: 'General Training Task 1' },
  'task2': { title: 'Essay Task', category: 'Writing', description: 'IELTS Writing Task 2' },
  
  // Speaking
  'part1': { title: 'Speaking Part 1', category: 'Speaking', description: 'Introduction questions' },
  'cue-card': { title: 'Cue Card (Part 2)', category: 'Speaking', description: 'Individual long turn' },
  'part3': { title: 'Speaking Part 3', category: 'Speaking', description: 'Two-way discussion' },
  
  // Structure
  'lesson': { title: 'Lesson', category: 'Structure', description: 'Sub-lesson wrapper' },
  'assignment': { title: 'Assignment', category: 'Structure', description: 'Student assignment block' },
  'quiz': { title: 'Quiz Container', category: 'Structure', description: 'Wrapper for a group of questions' },
  'downloadable-resource': { title: 'Resource File', category: 'Structure', description: 'File for students to download' },
  
  // Utilities
  'question-range': { title: 'Question Range', category: 'Utility', description: 'Header e.g. Questions 1-5' },
  'note': { title: 'Callout Note', category: 'Utility', description: 'Highlighted information box' },
  'tip': { title: 'Exam Tip', category: 'Utility', description: 'Strategy or tip box' },
  'band-descriptor': { title: 'Band Descriptor', category: 'Utility', description: 'Scoring criteria breakdown' }
};
