import React, { useEffect, useState } from 'react';
import { fetchAdminPostById, createAdminPost, updateAdminPost, fetchAdminCategories, fetchAdminAuthors, fetchAdminReviewers, fetchAdminPosts } from '../../../lib/blogApi';
import type { BlogPost, BlogCategory, BlogAuthor, BlogReviewer, BlogFaq, BlogSource } from '../../../types/blog';
import { BlogTipTapEditor } from '../../blog/BlogTipTapEditor';
import { BlogMediaLibraryModal } from './BlogMediaLibraryModal';
import { BlogRevisionsModal } from './BlogRevisionsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText, Sparkles, Layers, User, ShieldCheck, Search, Globe, Calendar, Clock, CheckCircle2,
  AlertCircle, History, Eye, Save, Plus, Trash2, ArrowLeft, Image as ImageIcon, HelpCircle
} from 'lucide-react';

interface BlogPostEditorTabProps {
  postId: string | null;
  onBackToList: () => void;
  onPostSaved?: (id: string) => void;
}

export const BlogPostEditorTab: React.FC<BlogPostEditorTabProps> = ({
  postId,
  onBackToList,
  onPostSaved
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'structure' | 'author' | 'seo' | 'publish'>('content');
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [reviewers, setReviewers] = useState<BlogReviewer[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [mediaModalOpen, setMediaLibraryOpen] = useState<boolean>(false);
  const [mediaSelectCallback, setMediaSelectCallback] = useState<((url: string, alt: string) => void) | null>(null);
  const [revisionsModalOpen, setRevisionsModalOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    featured_image_alt: '',
    featured_image_caption: '',
    status: 'draft',
    content_type: 'cluster',
    category_id: '',
    author_id: '',
    reviewer_id: '',
    pillar_article_id: '',
    cluster_name: '',
    is_featured: false,
    direct_answer_question: '',
    direct_answer_text: '',
    key_takeaways: [],
    important_note: { title: '', content: '', type: 'Important' },
    faqs: [],
    sources: [],
    cta: { enabled: true, heading: 'Aiming for Band 8.5+ in IELTS?', description: 'Join Syed Ejaz Bukhari’s intensive Master Batches for personalized essay evaluation and cue card drills.', buttonText: 'Explore Masterclasses', buttonUrl: '/courses' },
    seo_title: '',
    meta_description: '',
    canonical_url: '',
    primary_keyword: '',
    search_intent: 'informational',
    robots_index: true,
    robots_follow: true,
    og_title: '',
    og_description: '',
    og_image_url: '',
    scheduled_at: ''
  });

  useEffect(() => {
    // Load reference data
    fetchAdminCategories().then(setCategories).catch(() => {});
    fetchAdminAuthors().then((a) => {
      setAuthors(a);
      if (!formData.author_id && a.length > 0) setFormData((prev) => ({ ...prev, author_id: a[0].id }));
    }).catch(() => {});
    fetchAdminReviewers().then((r) => {
      setReviewers(r);
      if (!formData.reviewer_id && r.length > 0) setFormData((prev) => ({ ...prev, reviewer_id: r[0].id }));
    }).catch(() => {});
    fetchAdminPosts().then((res: any) => setAllPosts(Array.isArray(res) ? res : res.posts || [])).catch(() => {});

    if (postId) {
      setLoading(true);
      fetchAdminPostById(postId)
        .then((data) => {
          if (data) {
            setFormData({
              ...data,
              key_takeaways: Array.isArray(data.key_takeaways) ? data.key_takeaways : [],
              faqs: Array.isArray(data.faqs) ? data.faqs : [],
              sources: Array.isArray(data.sources) ? data.sources : [],
              important_note: data.important_note || ('Important note' as any),
              cta: (data.cta as any) || { enabled: true, heading: '', description: '', buttonText: '', buttonUrl: '' }
            });
          }
        })
        .catch((err) => setError(err.message || 'Failed to load post for editing'))
        .finally(() => setLoading(false));
    }
  }, [postId]);

  // Handle Form Change
  const handleChange = (field: keyof BlogPost, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // Helper to open media modal with callback
  const triggerMediaPicker = (callback: (url: string, alt: string) => void) => {
    setMediaSelectCallback(() => callback);
    setMediaLibraryOpen(true);
  };

  // Save handler
  const handleSave = async (overrideStatus?: string) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: Partial<BlogPost> = {
        ...formData,
        status: (overrideStatus || formData.status || 'draft') as any
      };

      let resultId = postId;
      let resultSlug = formData.slug;

      if (postId) {
        const res = await updateAdminPost(postId, payload);
        resultSlug = res.slug;
        setSuccessMsg('Article updated successfully!');
      } else {
        const res = await createAdminPost(payload);
        resultId = res.id;
        resultSlug = res.slug;
        setSuccessMsg('New article created successfully!');
        if (onPostSaved) onPostSaved(resultId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  // Quality Checklist items (Section 99)
  const checklist = [
    { label: 'Title present', valid: Boolean(formData.title?.trim()) },
    { label: 'Slug specified', valid: Boolean(formData.slug?.trim()) },
    { label: 'Excerpt present', valid: Boolean(formData.excerpt?.trim()) },
    { label: 'Category assigned', valid: Boolean(formData.category_id) },
    { label: 'Author assigned', valid: Boolean(formData.author_id) },
    { label: 'Reviewer assigned', valid: Boolean(formData.reviewer_id) },
    { label: 'Featured image present', valid: Boolean(formData.featured_image_url) },
    { label: 'SEO Title configured (50-60 chars)', valid: Boolean(formData.seo_title && formData.seo_title.length >= 30) },
    { label: 'Meta Description configured (120-160 chars)', valid: Boolean(formData.meta_description && formData.meta_description.length >= 80) }
  ];

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-bold text-slate-400">
        Loading post editor workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Editor Top Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBackToList} className="rounded-xl font-bold text-xs">
            <ArrowLeft className="w-4 h-4 mr-1" /> All Articles
          </Button>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {postId ? `Edit Article: ${formData.title || 'Untitled'}` : 'Create New Academic Article'}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Status: <span className="uppercase font-bold text-primary">{formData.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {postId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevisionsModalOpen(true)}
              className="rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-primary" />
              <span>Revisions</span>
            </Button>
          )}

          {postId && (
            <a
              href={`/blog/preview/${postId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </a>
          )}

          <Button
            onClick={() => handleSave('draft')}
            disabled={saving}
            variant="outline"
            className="rounded-xl text-xs font-bold"
          >
            Save Draft
          </Button>

          <Button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Article'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-600 font-bold text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-600 font-bold text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editor Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'content', label: '1. Content & Editor', icon: <FileText className="w-4 h-4" /> },
          { id: 'structure', label: '2. Structured Blocks', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
          { id: 'author', label: '3. Author & E-E-A-T', icon: <User className="w-4 h-4 text-emerald-500" /> },
          { id: 'seo', label: '4. SEO & Social Cards', icon: <Globe className="w-4 h-4 text-indigo-500" /> },
          { id: 'publish', label: '5. Publishing Pipeline', icon: <Calendar className="w-4 h-4 text-purple-500" /> }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: CONTENT & TIPTAP EDITOR */}
      {activeSubTab === 'content' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-5 shadow-sm">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                Article H1 Title *
              </label>
              <Input
                placeholder="e.g., IELTS: Complete Exam Guide to Format, Scoring, Fees & Registration"
                value={formData.title || ''}
                onChange={(e) => {
                  handleChange('title', e.target.value);
                  if (!postId) {
                    handleChange('slug', e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'));
                  }
                }}
                className="rounded-2xl text-base font-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Evergreen URL Slug *
                </label>
                <Input
                  placeholder="e.g., ielts-complete-exam-guide"
                  value={formData.slug || ''}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Category *
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                Excerpt / Summary Introduction *
              </label>
              <Textarea
                placeholder="Write a concise 2-3 sentence introduction explaining what scholars will learn in this article..."
                value={formData.excerpt || ''}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                className="rounded-2xl text-xs h-20"
              />
            </div>

            {/* Featured Image Picker */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Featured Banner Image</span>
                <Button
                  type="button"
                  onClick={() => triggerMediaPicker((url, alt) => {
                    handleChange('featured_image_url', url);
                    if (alt) handleChange('featured_image_alt', alt);
                  })}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1 text-primary" /> Open Media Library
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8">
                  <Input
                    placeholder="Featured image URL..."
                    value={formData.featured_image_url || ''}
                    onChange={(e) => handleChange('featured_image_url', e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Input
                    placeholder="Image alt text..."
                    value={formData.featured_image_alt || ''}
                    onChange={(e) => handleChange('featured_image_alt', e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {formData.featured_image_url && (
                <div className="w-32 h-20 rounded-xl overflow-hidden border border-slate-300 relative bg-slate-900">
                  <img src={formData.featured_image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* TipTap Rich Text Editor */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                Main Article Body Content (TipTap Word / Docs Style Editor)
              </label>
              <BlogTipTapEditor
                content={formData.content || ''}
                onChange={(html) => handleChange('content', html)}
                onOpenMediaLibrary={(callback) => triggerMediaPicker(callback)}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STRUCTURED BLOCKS */}
      {activeSubTab === 'structure' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-6 shadow-sm">
            {/* Content Hierarchy & Type */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Content Hierarchy Strategy
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Content Type</label>
                  <select
                    value={formData.content_type || 'cluster'}
                    onChange={(e) => handleChange('content_type', e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="pillar">Pillar Article (Core Guide)</option>
                    <option value="cluster">Cluster Article (Topic Deep-Dive)</option>
                    <option value="supporting">Supporting Article (Narrow Skill)</option>
                    <option value="news">News / Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Parent Pillar Article</label>
                  <select
                    value={formData.pillar_article_id || ''}
                    onChange={(e) => handleChange('pillar_article_id', e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="">-- None (Root Pillar) --</option>
                    {allPosts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Cluster Group Name</label>
                  <Input
                    placeholder="e.g., IELTS Writing Mastery"
                    value={formData.cluster_name || ''}
                    onChange={(e) => handleChange('cluster_name', e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              </div>
            </div>

            {/* Direct Answer Block (Section 20) */}
            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-3">
              <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                Direct Answer Block (For Search Engines & Quick Answers)
              </h3>
              <Input
                placeholder="Question / Prompt: e.g., What is IELTS and which module should I take?"
                value={formData.direct_answer_question || ''}
                onChange={(e) => handleChange('direct_answer_question', e.target.value)}
                className="rounded-xl text-xs"
              />
              <Textarea
                placeholder="Concise 1-paragraph definitive answer..."
                value={formData.direct_answer_text || ''}
                onChange={(e) => handleChange('direct_answer_text', e.target.value)}
                className="rounded-xl text-xs h-20"
              />
            </div>

            {/* Key Takeaways Repeater (Section 21) */}
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Key Takeaways List
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const list = Array.isArray(formData.key_takeaways) ? [...formData.key_takeaways] : [];
                    handleChange('key_takeaways', [...list, '']);
                  }}
                  className="rounded-xl text-xs font-bold bg-indigo-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Takeaway Point
                </Button>
              </div>

              {(formData.key_takeaways || []).map((point, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={point}
                    onChange={(e) => {
                      const list = [...(formData.key_takeaways || [])];
                      list[idx] = e.target.value;
                      handleChange('key_takeaways', list);
                    }}
                    placeholder={`Takeaway #${idx + 1}...`}
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const list = [...(formData.key_takeaways || [])];
                      list.splice(idx, 1);
                      handleChange('key_takeaways', list);
                    }}
                    className="text-rose-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* FAQs Repeater (Section 23) */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Structured FAQs (Generates FAQPage Schema)
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const faqs = Array.isArray(formData.faqs) ? [...formData.faqs] : [];
                    handleChange('faqs', [...faqs, { question: '', answer: '' }]);
                  }}
                  className="rounded-xl text-xs font-bold bg-primary text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add FAQ Item
                </Button>
              </div>

              {(formData.faqs || []).map((faq, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      placeholder={`FAQ Question #${idx + 1}`}
                      value={faq.question}
                      onChange={(e) => {
                        const faqs = [...(formData.faqs || [])];
                        faqs[idx].question = e.target.value;
                        handleChange('faqs', faqs);
                      }}
                      className="rounded-xl text-xs font-bold"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const faqs = [...(formData.faqs || [])];
                        faqs.splice(idx, 1);
                        handleChange('faqs', faqs);
                      }}
                      className="text-rose-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Expert Answer..."
                    value={faq.answer}
                    onChange={(e) => {
                      const faqs = [...(formData.faqs || [])];
                      faqs[idx].answer = e.target.value;
                      handleChange('faqs', faqs);
                    }}
                    className="rounded-xl text-xs h-16"
                  />
                </div>
              ))}
            </div>

            {/* Sources & Citations Repeater (Section 24) */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Academic Sources & References
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const sources = Array.isArray(formData.sources) ? [...formData.sources] : [];
                    handleChange('sources', [...sources, { title: '', url: '', publisher: '', date: '' }]);
                  }}
                  className="rounded-xl text-xs font-bold bg-primary text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Reference Source
                </Button>
              </div>

              {(formData.sources || []).map((src, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="Source Title..."
                      value={src.title}
                      onChange={(e) => {
                        const list = [...(formData.sources || [])];
                        list[idx].title = e.target.value;
                        handleChange('sources', list);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="Source URL..."
                      value={src.url}
                      onChange={(e) => {
                        const list = [...(formData.sources || [])];
                        list[idx].url = e.target.value;
                        handleChange('sources', list);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Publisher / Year..."
                      value={src.publisher}
                      onChange={(e) => {
                        const list = [...(formData.sources || [])];
                        list[idx].publisher = e.target.value;
                        handleChange('sources', list);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const list = [...(formData.sources || [])];
                        list.splice(idx, 1);
                        handleChange('sources', list);
                      }}
                      className="text-rose-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUTHOR & E-E-A-T */}
      {activeSubTab === 'author' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) Attribution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Primary Author *
                </label>
                <select
                  value={formData.author_id || ''}
                  onChange={(e) => handleChange('author_id', e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold"
                >
                  <option value="">-- Select Author --</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.designation || 'Author'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Expert Peer Reviewer *
                </label>
                <select
                  value={formData.reviewer_id || ''}
                  onChange={(e) => handleChange('reviewer_id', e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold"
                >
                  <option value="">-- Select Reviewer --</option>
                  {reviewers.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.designation || 'Reviewer'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SEO & SOCIAL CARDS */}
      {activeSubTab === 'seo' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              Search Engine Optimization (SEO) & Social Cards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  SEO Title (50-60 Recommended Chars)
                </label>
                <Input
                  value={formData.seo_title || ''}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder="e.g., IELTS Exam Complete Guide 2026: Format, Band Scoring & Fees"
                  className="rounded-xl text-xs font-bold"
                />
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                  Character count: {(formData.seo_title || '').length} / 60
                </span>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Primary Keyword
                </label>
                <Input
                  value={formData.primary_keyword || ''}
                  onChange={(e) => handleChange('primary_keyword', e.target.value)}
                  placeholder="e.g., IELTS complete guide"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                Meta Description (120-160 Recommended Chars)
              </label>
              <Textarea
                value={formData.meta_description || ''}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                placeholder="Concise, click-worthy search result snippet..."
                className="rounded-xl text-xs h-20"
              />
              <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                Character count: {(formData.meta_description || '').length} / 160
              </span>
            </div>

            {/* Live Search Engine Snippet Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Google Search Result Preview</span>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate hover:underline cursor-pointer">
                {formData.seo_title || formData.title || 'Article Title'}
              </p>
              <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 truncate">
                https://sebsinstitute.com/blog/{formData.slug || 'article-slug'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {formData.meta_description || formData.excerpt || 'Article summary description snippet...'}
              </p>
            </div>

            {/* Quality Checklist (Section 99) */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Editorial & SEO Readiness Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {item.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className={item.valid ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PUBLISHING PIPELINE */}
      {activeSubTab === 'publish' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Publishing Lifecycle & Scheduling
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published (Public)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Schedule Date & Time (Asia/Karachi Timezone)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    handleChange('scheduled_at', e.target.value);
                    if (e.target.value) handleChange('status', 'scheduled');
                  }}
                  className="rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Dialog */}
      <BlogMediaLibraryModal
        open={mediaModalOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelectMedia={(item) => {
          if (mediaSelectCallback) mediaSelectCallback(item.file_url || item.url || '', item.alt_text || '');
        }}
      />

      {/* Revisions Dialog */}
      {postId && (
        <BlogRevisionsModal
          postId={postId}
          open={revisionsModalOpen}
          onOpenChange={setRevisionsModalOpen}
          onRevisionRestored={() => {
            fetchAdminPostById(postId).then(setFormData).catch(() => {});
          }}
        />
      )}
    </div>
  );
};
