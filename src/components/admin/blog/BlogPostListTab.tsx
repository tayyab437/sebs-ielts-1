import React, { useEffect, useState } from 'react';
import { fetchAdminPosts, duplicateAdminPost, deleteAdminPost, updateAdminPostStatus, fetchAdminCategories } from '../../../lib/blogApi';
import type { BlogPost, BlogCategory } from '../../../types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Copy, Eye, Archive, Trash2, Filter, CheckCircle2, Clock, FileEdit, AlertCircle } from 'lucide-react';

interface BlogPostListTabProps {
  onEditPost: (postId: string) => void;
  onCreateNew: () => void;
}

export const BlogPostListTab: React.FC<BlogPostListTabProps> = ({ onEditPost, onCreateNew }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadPosts = () => {
    setLoading(true);
    fetchAdminPosts({
      page: pagination.page,
      limit: pagination.limit,
      status: statusFilter,
      category_id: categoryFilter,
      search
    })
      .then((res: any) => {
        if (Array.isArray(res)) {
          setPosts(res);
          setPagination({ page: 1, limit: 15, total: res.length, totalPages: Math.ceil(res.length / 15) || 1 });
        } else if (res && res.posts) {
          setPosts(res.posts);
          setPagination(res.pagination || { page: 1, limit: 15, total: res.posts.length, totalPages: Math.ceil(res.posts.length / 15) || 1 });
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load posts');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadPosts();
  }, [pagination.page, statusFilter, categoryFilter, search]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await duplicateAdminPost(id);
      alert('Article duplicated as draft!');
      onEditPost(res.id);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate post');
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this article? It will be hidden from public listings while preserving history.')) return;
    try {
      await updateAdminPostStatus(id, 'archived');
      loadPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to archive post');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article permanently?')) return;
    try {
      const res = await deleteAdminPost(id);
      if (typeof res === 'object' && (res as any)?.wasPublished) {
        alert(`Article deleted. Note: This article was previously published at /blog/${(res as any).slug}. Consider adding a 301 redirect in Redirects Manager.`);
      }
      loadPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Published</span>;
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-black text-[10px] uppercase flex items-center gap-1 w-fit"><FileEdit className="w-3 h-3" /> Draft</span>;
      case 'pending_review':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 font-black text-[10px] uppercase flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'scheduled':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-black text-[10px] uppercase flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'archived':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 font-black text-[10px] uppercase flex items-center gap-1 w-fit"><Archive className="w-3 h-3" /> Archived</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black text-[10px] uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Article Management Desk</h2>
          <p className="text-xs text-slate-500">Browse, filter, edit, duplicate, and publish blog articles.</p>
        </div>

        <Button
          onClick={onCreateNew}
          className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-5 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Post</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center shadow-sm">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search posts by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl text-xs h-10"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="pending_review">Pending Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">
            Loading articles list...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-500 font-bold">{error}</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400 space-y-2">
            <p>No posts match the selected criteria.</p>
            <Button onClick={onCreateNew} variant="outline" className="rounded-xl text-xs font-bold">
              Create Article
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/5 font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">Title & Slug</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Published / Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-800 dark:text-slate-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-1">{post.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">/blog/{post.slug}</p>
                    </td>
                    <td className="p-4">{getStatusBadge(post.status)}</td>
                    <td className="p-4">
                      {post.category ? (
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[10px] uppercase">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {post.author?.name || 'Tayyab Ashfaq'}
                    </td>
                    <td className="p-4 text-[11px] text-slate-500">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.updated_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPost(post.id)}
                          className="h-8 px-2.5 rounded-lg text-primary hover:bg-primary/10 font-bold"
                          title="Edit Post"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <a
                          href={post.status === 'published' ? `/blog/${post.slug}` : `/blog/preview/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold inline-flex items-center justify-center"
                          title="Preview Post"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(post.id)}
                          className="h-8 px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                          title="Duplicate as Draft"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        {post.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(post.id)}
                            className="h-8 px-2.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
                            title="Archive Article"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="h-8 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
