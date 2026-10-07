import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Layers, ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { fetchCategoryBySlug, fetchPublicPosts } from '../../lib/blogApi';
import type { BlogCategory, BlogPost } from '../../types/blog';
import { BlogArticleCard } from '../../components/blog/BlogArticleCard';
import { BlogBreadcrumbs } from '../../components/blog/BlogBreadcrumbs';
import { Button } from '../../components/ui/button';

export const BlogCategoryView: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug) return;
    setLoading(true);
    setError(null);

    fetchCategoryBySlug(categorySlug)
      .then((cat) => {
        setCategory(cat);
        return fetchPublicPosts({ category: cat.slug, page, limit: 9 });
      })
      .then((res) => {
        if (res) {
          setPosts(res.posts);
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        setError(err.message || 'Category not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [categorySlug, page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Category Not Found</h1>
          <p className="text-xs text-slate-500">The requested blog category does not exist or has been deactivated.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <BlogBreadcrumbs items={[{ label: category.name }]} />

        {/* Category Header */}
        <header className="p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl shadow-xl border border-white/10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Layers className="w-4 h-4 text-primary" />
            <span>Category Archive</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{category.name}</h1>

          {category.description && (
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}

          <div className="text-xs font-bold text-slate-400">
            {pagination.total} published article(s) in this topic
          </div>
        </header>

        {/* Articles List */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Articles in {category.name}</span>
          </h2>

          {posts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">No articles in this category yet</h3>
              <p className="text-xs text-slate-500">Check back soon for new guides and masterclasses.</p>
              <Link to="/blog" className="inline-block px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl mt-2">
                Browse All Articles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post) => (
                <BlogArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setSearchParams({ page: String(pagination.page - 1) })}
                className="rounded-xl font-bold text-xs"
              >
                Previous
              </Button>
              <span className="text-xs font-bold px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setSearchParams({ page: String(pagination.page + 1) })}
                className="rounded-xl font-bold text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
