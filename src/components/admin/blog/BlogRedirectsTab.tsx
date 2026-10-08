import React, { useEffect, useState } from 'react';
import { fetchAdminRedirects, saveAdminRedirect, deleteAdminRedirect } from '../../../lib/blogApi';
import type { BlogRedirect } from '../../../types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export const BlogRedirectsTab: React.FC = () => {
  const [redirects, setRedirects] = useState<BlogRedirect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [destUrl, setDestUrl] = useState<string>('');
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRedirects = () => {
    setLoading(true);
    fetchAdminRedirects()
      .then(setRedirects)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRedirects();
  }, []);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanSource = sourceUrl.trim();
    const cleanDest = destUrl.trim();

    if (!cleanSource || !cleanDest) {
      setError('Please provide both source and destination URLs.');
      return;
    }

    if (cleanSource === cleanDest) {
      setError('Source and destination cannot be identical (would create an infinite redirect loop).');
      return;
    }

    try {
      const saved = await saveAdminRedirect({
        source_url: cleanSource.startsWith('/') ? cleanSource : `/${cleanSource}`,
        destination_url: cleanDest.startsWith('/') || cleanDest.startsWith('http') ? cleanDest : `/${cleanDest}`,
        status_code: statusCode,
        reason: reason.trim() || 'Manual URL Migration',
        active: true
      });

      setRedirects((prev) => [saved, ...prev]);
      setSourceUrl('');
      setDestUrl('');
      setReason('');
      setSuccess('Redirect successfully created and activated.');
    } catch (err: any) {
      setError(err.message || 'Failed to create redirect');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this redirect rule?')) return;
    await deleteAdminRedirect(id);
    setRedirects((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-white/10 shadow-xl space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Search Engine Migration Engine
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">301 / 302 Redirect Manager</h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
          Preserve search ranking authority and prevent 404 dead ends when updating article permalinks or consolidating topical clusters.
        </p>
      </div>

      {/* Add New Redirect Form */}
      <form onSubmit={handleAddRedirect} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <span>Create New URL Redirect Rule</span>
        </h3>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Old / Source URL</label>
            <Input
              placeholder="/blog/old-slug"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="rounded-xl text-xs"
              required
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Target / Destination URL</label>
            <Input
              placeholder="/blog/new-permalink"
              value={destUrl}
              onChange={(e) => setDestUrl(e.target.value)}
              className="rounded-xl text-xs"
              required
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Status</label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase py-2.5 rounded-xl border-none cursor-pointer"
            >
              Add Rule
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Migration Reason / Note</label>
          <Input
            placeholder="e.g. Renamed permalink to align with search intent"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl text-xs"
          />
        </div>
      </form>

      {/* Redirects Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Active Redirect Rules ({redirects.length})
          </h4>
          <Button variant="ghost" size="sm" onClick={loadRedirects} className="text-xs gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">Loading redirects...</div>
        ) : redirects.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No active redirect rules configured.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {redirects.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">{r.source_url}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-primary font-bold truncate">{r.destination_url}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      HTTP {r.status_code}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="text-[11px] text-slate-500 italic">{r.reason}</p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(r.id)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
