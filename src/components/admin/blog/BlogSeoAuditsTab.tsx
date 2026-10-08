import React, { useEffect, useState } from 'react';
import { fetchAdminAudits, fetchAdminPosts } from '../../../lib/blogApi';
import type { BlogAuditItem, BlogPost } from '../../../types/blog';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  Link2, 
  Clock, 
  FileWarning, 
  ArrowRight 
} from 'lucide-react';

interface BlogSeoAuditsTabProps {
  onEditPost: (postId: string) => void;
}

export const BlogSeoAuditsTab: React.FC<BlogSeoAuditsTabProps> = ({ onEditPost }) => {
  const [audits, setAudits] = useState<BlogAuditItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchAdminAudits(), fetchAdminPosts()])
      .then(([auditItems, allPosts]) => {
        // Build live orphan & cannibalization analysis
        const enriched = [...auditItems];

        // 1. Check for Orphan Pages (pages not linked from any other post content)
        allPosts.forEach((post) => {
          if (post.status === 'published') {
            const isLinked = allPosts.some(
              (other) => other.id !== post.id && other.content?.includes(post.slug)
            );
            if (!isLinked) {
              enriched.push({
                id: `audit-orphan-${post.id}`,
                type: 'warning',
                code: 'ORPHAN_PAGE',
                title: 'Potential Orphan Article (0 Internal Links Inbound)',
                description: `No other published article links directly to "${post.title}". Search crawlers may find it hard to discover.`,
                affected_url: `/blog/${post.slug}`,
                suggested_action: 'Link to this article from a relevant pillar guide or cluster topic.',
                status: 'open'
              });
            }
          }
        });

        // 2. Check for Keyword Cannibalization
        const keywordMap = new Map<string, BlogPost[]>();
        allPosts.forEach((p) => {
          if (p.primary_keyword && p.status === 'published') {
            const kw = p.primary_keyword.trim().toLowerCase();
            const existing = keywordMap.get(kw) || [];
            existing.push(p);
            keywordMap.set(kw, existing);
          }
        });

        keywordMap.forEach((matchedPosts, kw) => {
          if (matchedPosts.length > 1) {
            enriched.push({
              id: `audit-cannibal-${kw}`,
              type: 'warning',
              code: 'KEYWORD_CANNIBALIZATION',
              title: `Potential Keyword Overlap: "${kw}"`,
              description: `${matchedPosts.length} published articles target the same primary keyword (${matchedPosts.map(p => `"${p.title}"`).join(', ')}). May compete in Google search.`,
              affected_url: `/blog/${matchedPosts[0].slug}`,
              suggested_action: 'Differentiate search intent between articles or establish a clear pillar-cluster relationship.',
              status: 'open'
            });
          }
        });

        setAudits(enriched);
        setPosts(allPosts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const criticalCount = audits.filter((a) => a.type === 'critical').length;
  const warningCount = audits.filter((a) => a.type === 'warning').length;
  const infoCount = audits.filter((a) => a.type === 'info').length;

  const filteredAudits = audits.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Automated Technical SEO Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Site-Wide SEO Health & Audit Monitor</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
            Continuous verification of canonical URL consistency, orphan pages, keyword cannibalization, crawlability, and schema completeness.
          </p>
        </div>

        <Button
          onClick={loadData}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shrink-0 border-none"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run Audit</span>
        </Button>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Audit Items</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{audits.length}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Critical Issues
          </span>
          <p className="text-2xl font-black text-rose-600">{criticalCount}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Warnings & Cannibalization
          </span>
          <p className="text-2xl font-black text-amber-600">{warningCount}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-sky-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Stale Content Alerts
          </span>
          <p className="text-2xl font-black text-sky-600">{infoCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'critical', 'warning', 'info'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              filterType === type
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-primary'
            }`}
          >
            {type === 'all' ? 'All Findings' : type}
          </button>
        ))}
      </div>

      {/* Audit Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            Running technical SEO audit inspection...
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Clean Technical SEO State</h3>
            <p className="text-xs text-slate-500">No issues found for the selected filter category.</p>
          </div>
        ) : (
          filteredAudits.map((item) => {
            const isCritical = item.type === 'critical';
            const isWarning = item.type === 'warning';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isCritical
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20'
                    : isWarning
                    ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/20'
                    : 'border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-sky-100 text-sky-700 border border-sky-300'
                      }`}
                    >
                      {item.code}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{item.affected_url}</span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                  <p className="text-[11px] font-bold text-primary flex items-center gap-1 pt-1">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span>Action: {item.suggested_action}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.affected_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
                    title="View Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
