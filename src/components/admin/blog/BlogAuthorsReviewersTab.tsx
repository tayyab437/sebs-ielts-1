import React, { useEffect, useState } from 'react';
import { 
  fetchAdminAuthors, 
  saveAdminAuthor, 
  deleteAdminAuthor,
  fetchAdminReviewers, 
  saveAdminReviewer, 
  deleteAdminReviewer 
} from '../../../lib/blogApi';
import type { BlogAuthor, BlogReviewer } from '../../../types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  ExternalLink, 
  Award, 
  Building2, 
  CheckCircle2, 
  Search,
  Sparkles,
  Globe,
  Linkedin,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';

export const BlogAuthorsReviewersTab: React.FC = () => {
  const [activeType, setActiveType] = useState<'authors' | 'reviewers'>('authors');
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [reviewers, setReviewers] = useState<BlogReviewer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Author Modal
  const [authorModalOpen, setAuthorModalOpen] = useState<boolean>(false);
  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);
  const [authorForm, setAuthorForm] = useState<Partial<BlogAuthor>>({
    name: '',
    slug: '',
    credentials: '',
    organization: 'SEBS Institute',
    bio: '',
    profile_image: '',
    expertise: [],
    social_links: { linkedin: '', website: '', twitter: '' },
    indexable: true
  });
  const [expertiseInput, setExpertiseInput] = useState<string>('');

  // Reviewer Modal
  const [reviewerModalOpen, setReviewerModalOpen] = useState<boolean>(false);
  const [editingReviewer, setEditingReviewer] = useState<BlogReviewer | null>(null);
  const [reviewerForm, setReviewerForm] = useState<Partial<BlogReviewer>>({
    name: '',
    slug: '',
    qualifications: '',
    organization: 'SEBS Institute Assessment Board',
    bio: '',
    avatar_url: '',
    expertise: [],
    indexable: true
  });
  const [revExpertiseInput, setRevExpertiseInput] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [authData, revData] = await Promise.all([
        fetchAdminAuthors(),
        fetchAdminReviewers()
      ]);
      setAuthors(authData || []);
      setReviewers(revData || []);
    } catch (err) {
      console.error('Failed to load authors/reviewers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Author Modal
  const handleOpenAuthorModal = (author?: BlogAuthor) => {
    setError(null);
    if (author) {
      setEditingAuthor(author);
      const img = author.profile_image || (author as any).avatar_url || '';
      setAuthorForm({
        ...author,
        profile_image: img,
        avatar_url: img,
        social_links: author.social_links || { linkedin: '', website: '', twitter: '' }
      });
      setExpertiseInput((author.expertise || []).join(', '));
    } else {
      setEditingAuthor(null);
      setAuthorForm({
        name: '',
        slug: '',
        credentials: '',
        organization: 'SEBS Institute',
        bio: '',
        profile_image: '',
        avatar_url: '',
        expertise: ['IELTS Academic & GT', 'Spoken English'],
        social_links: { linkedin: '', website: '', twitter: '' },
        indexable: true
      });
      setExpertiseInput('IELTS Academic & GT, Spoken English');
    }
    setAuthorModalOpen(true);
  };

  // Open Reviewer Modal
  const handleOpenReviewerModal = (reviewer?: BlogReviewer) => {
    setError(null);
    if (reviewer) {
      setEditingReviewer(reviewer);
      const img = reviewer.avatar_url || (reviewer as any).profile_image || '';
      setReviewerForm({
        ...reviewer,
        avatar_url: img,
        profile_image: img
      });
      setRevExpertiseInput((reviewer.expertise || []).join(', '));
    } else {
      setEditingReviewer(null);
      setReviewerForm({
        name: '',
        slug: '',
        qualifications: '',
        organization: 'SEBS Institute Assessment Board',
        bio: '',
        avatar_url: '',
        profile_image: '',
        expertise: ['Cambridge Examiner Protocols', 'Criterion Scoring Validation'],
        indexable: true
      });
      setRevExpertiseInput('Cambridge Examiner Protocols, Criterion Scoring Validation');
    }
    setReviewerModalOpen(true);
  };

  // Save Author
  const handleSaveAuthor = async () => {
    if (!authorForm.name?.trim()) {
      setError('Author name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const expArray = expertiseInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const img = (authorForm.profile_image || (authorForm as any).avatar_url || '').trim();

      const toSave: Partial<BlogAuthor> = {
        ...authorForm,
        profile_image: img,
        avatar_url: img,
        slug:
          authorForm.slug?.trim() ||
          authorForm.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        expertise: expArray
      };

      await saveAdminAuthor(toSave);
      setSuccessMsg(`Author profile for "${toSave.name}" updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setAuthorModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save author');
    } finally {
      setSaving(false);
    }
  };

  // Save Reviewer
  const handleSaveReviewer = async () => {
    if (!reviewerForm.name?.trim()) {
      setError('Reviewer name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const expArray = revExpertiseInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const img = (reviewerForm.avatar_url || (reviewerForm as any).profile_image || '').trim();

      const toSave: Partial<BlogReviewer> = {
        ...reviewerForm,
        avatar_url: img,
        profile_image: img,
        slug:
          reviewerForm.slug?.trim() ||
          reviewerForm.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        expertise: expArray
      };

      await saveAdminReviewer(toSave);
      setSuccessMsg(`Reviewer profile for "${toSave.name}" updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setReviewerModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save reviewer');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload helper for Authors
  const handleAuthorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image file must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAuthorForm((prev) => ({
          ...prev,
          profile_image: result,
          avatar_url: result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Image Upload helper for Reviewers
  const handleReviewerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image file must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setReviewerForm((prev) => ({
          ...prev,
          avatar_url: result,
          profile_image: result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Author
  const handleDeleteAuthor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete author "${name}"?`)) return;
    try {
      await deleteAdminAuthor(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete author');
    }
  };

  // Delete Reviewer
  const handleDeleteReviewer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete reviewer "${name}"?`)) return;
    try {
      await deleteAdminReviewer(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete reviewer');
    }
  };

  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.credentials?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviewers = reviewers.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.qualifications?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            E-E-A-T Authors & Reviewers Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Google Search E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness) requires clear attribution for academic content. Manage verified instructors, linguistic experts, and peer reviewers below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeType === 'authors' ? (
            <button
              type="button"
              onClick={() => handleOpenAuthorModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add Author</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenReviewerModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reviewer</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs font-bold animate-in fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveType('authors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              activeType === 'authors'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Primary Authors ({authors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('reviewers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              activeType === 'reviewers'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Peer Reviewers ({reviewers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading E-E-A-T credentials...</p>
        </div>
      ) : activeType === 'authors' ? (
        /* Authors Grid */
        filteredAuthors.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No authors found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Create your first author to assign authorship attribution to articles.</p>
            <Button onClick={() => handleOpenAuthorModal()} size="sm" className="rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Author
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAuthors.map((author) => (
              <div
                key={author.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                        {author.profile_image || (author as any).avatar_url ? (
                          <img src={author.profile_image || (author as any).avatar_url} alt={author.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">{author.name}</h3>
                          {author.indexable !== false && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                              Indexable
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                          {author.credentials || 'Course Mentor & Educator'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{author.organization || 'SEBS Institute'}</span>
                          <span className="mx-1">•</span>
                          <span>slug: /{author.slug}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/blog/author/${author.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Live Public Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorModal(author)}
                        className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Author"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAuthor(author.id, author.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Author"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {author.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3.5 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      {author.bio}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {(author.expertise || []).slice(0, 3).map((exp, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                        {exp}
                      </span>
                    ))}
                    {(author.expertise || []).length > 3 && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                        +{(author.expertise || []).length - 3} more
                      </span>
                    )}
                  </div>

                  {author.social_links?.linkedin && (
                    <a
                      href={author.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-[#0077b5] inline-flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Reviewers Grid */
        filteredReviewers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No peer reviewers registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Add verified Cambridge and IELTS academic reviewers to validate article technical accuracy.</p>
            <Button onClick={() => handleOpenReviewerModal()} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Reviewer
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviewers.map((reviewer) => (
              <div
                key={reviewer.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden flex items-center justify-center shrink-0">
                        {reviewer.avatar_url ? (
                          <img src={reviewer.avatar_url} alt={reviewer.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">{reviewer.name}</h3>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                            Peer Reviewer
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                          {reviewer.qualifications || 'Academic Assessment Specialist'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{reviewer.organization || 'SEBS Assessment Board'}</span>
                          <span className="mx-1">•</span>
                          <span>slug: /{reviewer.slug}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/blog/author/${reviewer.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Live Public Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenReviewerModal(reviewer)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Reviewer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReviewer(reviewer.id, reviewer.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Reviewer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {reviewer.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3.5 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      {reviewer.bio}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {(reviewer.expertise || []).slice(0, 3).map((exp, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        {exp}
                      </span>
                    ))}
                    {(reviewer.expertise || []).length > 3 && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                        +{(reviewer.expertise || []).length - 3} more
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-400">
                    E-E-A-T Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Author Edit/Create Modal */}
      <Dialog open={authorModalOpen} onOpenChange={setAuthorModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Users className="w-5 h-5 text-primary" />
              {editingAuthor ? 'Edit Author Profile' : 'Add New Primary Author'}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50">
              {error}
            </div>
          )}

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                <Input
                  value={authorForm.name || ''}
                  onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
                  placeholder="e.g. Syed Ejaz Bukhari"
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Profile Slug / URL *</label>
                <Input
                  value={authorForm.slug || ''}
                  onChange={(e) => setAuthorForm({ ...authorForm, slug: e.target.value })}
                  placeholder="e.g. syed-ejaz-bukhari"
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Credentials / Subtitle *</label>
                <Input
                  value={authorForm.credentials || ''}
                  onChange={(e) => setAuthorForm({ ...authorForm, credentials: e.target.value })}
                  placeholder="e.g. Founder & Master English Coach • 34+ Years Experience"
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Organization</label>
                <Input
                  value={authorForm.organization || ''}
                  onChange={(e) => setAuthorForm({ ...authorForm, organization: e.target.value })}
                  placeholder="SEBS Institute"
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            {/* Profile Picture with live preview & file upload */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">Avatar / Profile Picture</label>
              <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {authorForm.profile_image ? (
                    <img
                      src={authorForm.profile_image}
                      alt="Author Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-primary" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <Input
                    value={authorForm.profile_image || ''}
                    onChange={(e) =>
                      setAuthorForm({
                        ...authorForm,
                        profile_image: e.target.value,
                        avatar_url: e.target.value
                      })
                    }
                    placeholder="Paste image URL (https://... or /photo.webp)"
                    className="rounded-xl h-8 text-xs font-mono"
                  />

                  <div className="flex items-center flex-wrap gap-2 text-[11px]">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAuthorImageUpload}
                        className="hidden"
                      />
                    </label>

                    {authorForm.profile_image && (
                      <button
                        type="button"
                        onClick={() => setAuthorForm({ ...authorForm, profile_image: '', avatar_url: '' })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Author Bio & Background</label>
              <Textarea
                rows={3}
                value={authorForm.bio || ''}
                onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })}
                placeholder="Detailed educational background, teaching tenure, qualifications and pedagogy specializations..."
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Areas of Expertise (Comma-separated)</label>
              <Input
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                placeholder="IELTS Academic & GT, Spoken English, Phonetics"
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">LinkedIn Profile</label>
                <Input
                  value={authorForm.social_links?.linkedin || ''}
                  onChange={(e) =>
                    setAuthorForm({
                      ...authorForm,
                      social_links: { ...(authorForm.social_links || {}), linkedin: e.target.value }
                    })
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Personal Website</label>
                <Input
                  value={authorForm.social_links?.website || ''}
                  onChange={(e) =>
                    setAuthorForm({
                      ...authorForm,
                      social_links: { ...(authorForm.social_links || {}), website: e.target.value }
                    })
                  }
                  placeholder="https://sebsinstitute.com"
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={authorForm.indexable !== false}
                onChange={(e) => setAuthorForm({ ...authorForm, indexable: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Index profile page in search engines & sitemaps (Recommended for SEO)
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAuthorModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveAuthor} disabled={saving} className="rounded-xl text-xs">
              {saving ? 'Saving...' : editingAuthor ? 'Update Author' : 'Create Author'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviewer Edit/Create Modal */}
      <Dialog open={reviewerModalOpen} onOpenChange={setReviewerModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {editingReviewer ? 'Edit Peer Reviewer Profile' : 'Add New Peer Reviewer'}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50">
              {error}
            </div>
          )}

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reviewer Name *</label>
                <Input
                  value={reviewerForm.name || ''}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, name: e.target.value })}
                  placeholder="e.g. Syeda Zarnaz Gilani"
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Slug / URL *</label>
                <Input
                  value={reviewerForm.slug || ''}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, slug: e.target.value })}
                  placeholder="e.g. syeda-zarnaz-gilani"
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Qualifications / Degrees *</label>
                <Input
                  value={reviewerForm.qualifications || ''}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, qualifications: e.target.value })}
                  placeholder="e.g. BA English (University of London) • AEO Master Trainer"
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Review Board Organization</label>
                <Input
                  value={reviewerForm.organization || ''}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, organization: e.target.value })}
                  placeholder="SEBS Institute Assessment Board"
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            {/* Reviewer Avatar with live preview & file upload */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">Avatar / Reviewer Photo</label>
              <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {reviewerForm.avatar_url ? (
                    <img
                      src={reviewerForm.avatar_url}
                      alt="Reviewer Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-emerald-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <Input
                    value={reviewerForm.avatar_url || ''}
                    onChange={(e) =>
                      setReviewerForm({
                        ...reviewerForm,
                        avatar_url: e.target.value,
                        profile_image: e.target.value
                      })
                    }
                    placeholder="Paste image URL (https://... or /photo.webp)"
                    className="rounded-xl h-8 text-xs font-mono"
                  />

                  <div className="flex items-center flex-wrap gap-2 text-[11px]">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReviewerImageUpload}
                        className="hidden"
                      />
                    </label>

                    {reviewerForm.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setReviewerForm({ ...reviewerForm, avatar_url: '', profile_image: '' })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reviewer Bio & Academic Credentials</label>
              <Textarea
                rows={3}
                value={reviewerForm.bio || ''}
                onChange={(e) => setReviewerForm({ ...reviewerForm, bio: e.target.value })}
                placeholder="Senior Academic Reviewer and IELTS examiner specialist ensuring compliance with Cambridge Assessment English..."
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Review Focus Areas (Comma-separated)</label>
              <Input
                value={revExpertiseInput}
                onChange={(e) => setRevExpertiseInput(e.target.value)}
                placeholder="Cambridge Examiner Protocols, Criterion Scoring Validation, Academic Lexis"
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={reviewerForm.indexable !== false}
                onChange={(e) => setReviewerForm({ ...reviewerForm, indexable: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Index reviewer credentials in search engine rich snippets
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewerModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveReviewer} disabled={saving} className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : editingReviewer ? 'Update Reviewer' : 'Create Reviewer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
