import React, { useEffect, useState } from 'react';
import { fetchAdminStats } from '../../../lib/blogApi';
import { FileText, CheckCircle2, FileEdit, Clock, Archive, Layers, Users, ShieldCheck, ArrowRight, Plus } from 'lucide-react';
import { Button } from '../../ui/button';

interface BlogDashboardTabProps {
  onNavigate: (view: string) => void;
}

export const BlogDashboardTab: React.FC<BlogDashboardTabProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-bold text-slate-400">
        Loading CMS Overview Statistics...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Upper Quick Banner Header */}
      <div className="p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            SEB's Institute Content Management System
          </span>
          <h2 className="text-3xl font-black tracking-tight">Blog CMS Command Center</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Manage academic articles, E-E-A-T authorship credentials, SEO metadata, redirects, and scheduled publication pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => onNavigate('create')}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Article</span>
          </Button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Posts</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats?.total_posts || 0}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats?.published_posts || 0}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Drafts</span>
            <FileEdit className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats?.draft_posts || 0}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Scheduled</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats?.scheduled_posts || 0}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Categories</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats?.total_categories || 0}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Archived</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats?.archived_posts || 0}</p>
        </div>
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate('posts')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center justify-between">
            <span>Manage All Articles</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Search, filter by status or category, duplicate drafts, or edit published content.
          </p>
        </div>

        <div
          onClick={() => onNavigate('categories')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors flex items-center justify-between">
            <span>Category Taxonomy</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Organize IELTS modules, TOEFL, PTE, Spoken English, and SEBS news categories.
          </p>
        </div>

        <div
          onClick={() => onNavigate('authors')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors flex items-center justify-between">
            <span>Authors & Reviewers</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage E-E-A-T credentials for Syed Ejaz Bukhari and academy editors.
          </p>
        </div>
      </div>
    </div>
  );
};
