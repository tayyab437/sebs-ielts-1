export type BlogStatus = 'draft' | 'pending_review' | 'scheduled' | 'published' | 'archived';
export type BlogContentType = 'pillar' | 'cluster' | 'supporting' | 'news';
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional' | 'local' | 'other' | 'Informational' | 'Navigational' | 'Commercial' | 'Transactional';

export interface BlogFaq {
  question: string;
  answer: string;
  display_order?: number;
}

export interface BlogSource {
  title: string;
  url: string;
  publisher?: string;
  publication_date?: string;
  source_type?: string;
  date?: string;
}

export interface BlogCorrection {
  notice: string;
  date: string;
  reason: string;
}

export interface BlogImportantNote {
  title?: string;
  content: string;
  type?: 'Note' | 'Important' | 'Warning' | 'Tip';
}

export interface BlogCta {
  enabled?: boolean;
  heading?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  button_text?: string;
  buttonUrl?: string;
  button_url?: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  profile_image?: string;
  avatar_url?: string;
  bio?: string;
  credentials?: string;
  designation?: string;
  organization?: string;
  expertise: string[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  indexable: boolean;
  created_at?: string;
}

export interface BlogReviewer {
  id: string;
  name: string;
  slug: string;
  profile_image?: string;
  avatar_url?: string;
  bio?: string;
  qualifications?: string;
  credentials?: string;
  designation?: string;
  expertise: string[];
  organization?: string;
  profile_url?: string;
  indexable: boolean;
  created_at?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seo_title?: string;
  meta_description?: string;
  canonical?: string;
  indexable: boolean;
  display_order: number;
  parent_id?: string | null;
  image_url?: string;
  post_count?: number;
  is_active?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_format: 'html' | 'markdown';
  featured_image?: string;
  featured_image_url?: string;
  featured_image_alt?: string;
  featured_image_caption?: string;
  status: BlogStatus;
  content_type: BlogContentType;
  category_id: string;
  author_id: string;
  reviewer_id?: string | null;
  published_at?: string | null;
  updated_at?: string;
  last_reviewed_at?: string | null;
  scheduled_at?: string | null;
  archived_at?: string | null;
  
  // SEO & Indexation
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  robots_index: boolean;
  robots_follow: boolean;
  
  // Social Previews
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_image_url?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  
  // Editorial SEO Context
  primary_keyword?: string;
  search_intent?: SearchIntent;
  target_country?: string;
  target_audience?: string;
  pillar_article_id?: string | null;
  cluster_name?: string | null;
  parent_article_id?: string | null;
  
  // Metrics & Signals
  reading_time: number;
  word_count: number;
  featured: boolean;
  is_featured?: boolean;
  
  // Structured Content Blocks
  direct_answer_question?: string;
  direct_answer_text?: string;
  key_takeaways?: string[];
  important_note?: BlogImportantNote | string;
  faqs?: BlogFaq[];
  sources?: BlogSource[];
  related_post_ids?: string[];
  related_posts?: BlogPost[];
  cta?: BlogCta;
  corrections?: BlogCorrection[];
  
  // Populated relations
  author?: BlogAuthor;
  reviewer?: BlogReviewer;
  category?: BlogCategory;
  
  created_at?: string;
}

export interface BlogRevision {
  id: string;
  post_id: string;
  editor_name: string;
  timestamp: string;
  created_at?: string;
  content_snapshot: string;
  metadata_snapshot: Partial<BlogPost>;
  summary?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  changed_by?: string;
}

export interface BlogMedia {
  id: string;
  url: string;
  file_url?: string;
  filename?: string;
  original_filename?: string;
  alt_text?: string;
  caption?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  created_at?: string;
}

export interface BlogRedirect {
  id: string;
  source_url: string;
  destination_url: string;
  status_code: 301 | 302;
  reason?: string;
  created_at: string;
  active: boolean;
}

export interface BlogAuditItem {
  id: string;
  type: 'critical' | 'warning' | 'good' | 'info';
  code: string;
  title: string;
  description: string;
  affected_url: string;
  suggested_action: string;
  status: 'open' | 'resolved';
}

export interface BlogSettings {
  blog_title: string;
  blog_description: string;
  seo_title: string;
  meta_description: string;
  default_og_image: string;
  default_author_id: string;
  posts_per_page: number;
  auto_toc: boolean;
  show_reading_time: boolean;
  review_interval_days: number;
}
