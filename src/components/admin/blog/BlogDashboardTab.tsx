import React, { useEffect, useState, useCallback } from 'react';
import { fetchAdminStats, fetchAdminAudits } from '../../../lib/blogApi';
import type { BlogAuditItem } from '../../../types/blog';
import { 
  FileText, 
  CheckCircle2, 
  FileEdit, 
  Clock, 
  Archive, 
  Layers, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  RotateCw, 
  ShieldAlert, 
  Globe2,
  Sparkles,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogDashboardTabProps {
  onNavigate: (view: string, filter?: string) => void;
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
    total_views?: number;
  } | null>(null);
  const [audits, setAudits] = useState<BlogAuditItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  const syncMetrics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsData, auditsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminAudits().catch(() => [])
      ]);
      if (statsData) {
        setStats(statsData);
      }
      if (Array.isArray(auditsData)) {
        setAudits(auditsData);
      }
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error syncing CMS metrics:', err);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    syncMetrics();
  }, [syncMetrics]);

  const openAuditsCount = audits.filter(a => a.status === 'open').length;

  return (
    <div className="space-y-8 text-left">
      {/* 1. Upper Quick Banner Header */}
      <div className="p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live CMS Metrics Synced
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Last synced: {lastSyncTime}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Blog CMS Command Center</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Real-time synchronization across academic articles, E-E-A-T authorship credentials, SEO metadata, redirects, and scheduled publication pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Button
            type="button"
            onClick={() => syncMetrics(true)}
            disabled={refreshing}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            title="Force refresh all statistics from database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Metrics'}</span>
          </Button>

          <Button
            onClick={() => onNavigate('create')}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Article</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Metric Cards Grid (div:nth-of-type(2) matching CSS selector target) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {/* Card 1: Total Posts */}
        <div 
          onClick={() => onNavigate('posts')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm hover:border-primary/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view all articles in CMS"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-primary transition-colors">Total Posts</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.total_posts ?? 0)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>All articles</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
          </div>
        </div>

        {/* Card 2: Published (Specifically focused element: div:nth-of-type(2)) */}
        <div 
          onClick={() => onNavigate('posts', 'published')}
          className="p-5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl space-y-2 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-emerald-50/40 via-transparent to-transparent dark:from-emerald-950/20"
          title="Click to view live published articles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Published</span>
            <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.published_posts ?? 0)}
          </p>
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live & Indexed
            </span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 3: Drafts */}
        <div 
          onClick={() => onNavigate('posts', 'draft')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm hover:border-amber-500/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view draft articles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Drafts</span>
            <FileEdit className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.draft_posts ?? 0)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            <span>Work in progress</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 4: Scheduled */}
        <div 
          onClick={() => onNavigate('posts', 'scheduled')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm hover:border-indigo-500/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view scheduled articles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Scheduled</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.scheduled_posts ?? 0)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
            <span>Upcoming queue</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 5: Categories */}
        <div 
          onClick={() => onNavigate('categories')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm hover:border-purple-500/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to manage topic categories"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Categories</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.total_categories ?? 0)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            <span>Topic taxonomy</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 6: Archived */}
        <div 
          onClick={() => onNavigate('posts', 'archived')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2 shadow-sm hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view archived articles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Archived</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.archived_posts ?? 0)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Past revisions</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 7: Total Article Views */}
        <div 
          onClick={() => onNavigate('posts')}
          className="p-5 bg-white dark:bg-slate-900 border border-primary/20 dark:border-primary/30 rounded-2xl space-y-2 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-primary/5 via-transparent to-transparent"
          title="Click to view article view analytics"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Article Views</span>
            <div className="p-1 rounded-md bg-primary/10">
              <Eye className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.total_views ?? 0).toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[10px] text-primary font-bold">
            <span>Live Readers</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* 3. Extended Ecosystem Status & Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => onNavigate('posts')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {stats?.total_posts ?? 0} articles
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center justify-between">
            <span>All Articles</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Search, filter by status or category, duplicate drafts, manage slugs, or edit live published content.
          </p>
        </div>

        <div
          onClick={() => onNavigate('categories')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg">
              {stats?.total_categories ?? 0} categories
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors flex items-center justify-between">
            <span>Topic Clusters</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Organize IELTS modules, TOEFL, PTE, Spoken English, and SEBS news topic clusters.
          </p>
        </div>

        <div
          onClick={() => onNavigate('authors')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
              {stats?.total_authors ?? 0} auth • {stats?.total_reviewers ?? 0} rev
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors flex items-center justify-between">
            <span>Authors & Reviewers</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage E-E-A-T expert profiles, Cambridge credentials, and peer review qualifications.
          </p>
        </div>

        <div
          onClick={() => onNavigate('audits')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
              openAuditsCount > 0 
                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40' 
                : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
            }`}>
              {openAuditsCount > 0 ? `${openAuditsCount} notice${openAuditsCount > 1 ? 's' : ''}` : 'All Clean'}
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors flex items-center justify-between">
            <span>SEO & Audits</span>
            <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify meta descriptions, focus keywords, canonical tags, and structured data schemas.
          </p>
        </div>
      </div>
    </div>
  );
};
