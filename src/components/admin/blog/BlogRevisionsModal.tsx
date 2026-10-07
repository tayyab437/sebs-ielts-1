import React, { useEffect, useState } from 'react';
import { fetchPostRevisions, restorePostRevision } from '../../../lib/blogApi';
import type { BlogRevision } from '../../../types/blog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { History, RotateCcw, Clock, User } from 'lucide-react';

interface BlogRevisionsModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevisionRestored: () => void;
}

export const BlogRevisionsModal: React.FC<BlogRevisionsModalProps> = ({
  postId,
  open,
  onOpenChange,
  onRevisionRestored
}) => {
  const [revisions, setRevisions] = useState<BlogRevision[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRev, setSelectedRev] = useState<BlogRevision | null>(null);
  const [restoring, setRestoring] = useState<boolean>(false);

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      fetchPostRevisions(postId)
        .then(setRevisions)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, postId]);

  const handleRestore = async () => {
    if (!selectedRev) return;
    const confirm = window.confirm(`Are you sure you want to restore the revision from ${new Date(selectedRev.created_at).toLocaleString()}? This will replace the current draft content.`);
    if (!confirm) return;

    setRestoring(true);
    try {
      await restorePostRevision(postId, selectedRev.id);
      alert('Revision successfully restored!');
      onRevisionRestored();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || 'Failed to restore revision');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-left">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Article Revision History & Audit Log
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            Loading revisions history...
          </div>
        ) : revisions.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500">
            No previous revisions recorded for this post.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4">
            {/* Revision Timeline List */}
            <div className="md:col-span-5 border-r border-slate-200 dark:border-white/10 pr-4 space-y-2 max-h-[380px] overflow-y-auto">
              {revisions.map((rev) => {
                const isSelected = selectedRev?.id === rev.id;
                return (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => setSelectedRev(rev)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary font-bold text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{new Date(rev.created_at).toLocaleString()}</span>
                    </div>
                    <p className="font-black text-slate-800 dark:text-slate-200 truncate">{rev.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> {rev.changed_by || 'Admin'}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Revision Preview */}
            <div className="md:col-span-7 space-y-3 max-h-[380px] overflow-y-auto">
              {selectedRev ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-primary">Revision Snapshot Title</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedRev.title}</h4>
                  </div>

                  {selectedRev.excerpt && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase text-slate-400">Excerpt</span>
                      <p className="text-slate-700 dark:text-slate-300 italic mt-1">{selectedRev.excerpt}</p>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 max-h-48 overflow-y-auto">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Content Preview</span>
                    <div
                      className="prose prose-xs dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: selectedRev.content || '<p>No content snapshot</p>' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400 italic">
                  Select a revision from the left to inspect its content and restore.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs font-bold">
            Close
          </Button>
          {selectedRev && (
            <Button
              onClick={handleRestore}
              disabled={restoring}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{restoring ? 'Restoring...' : 'Restore Selected Revision'}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
