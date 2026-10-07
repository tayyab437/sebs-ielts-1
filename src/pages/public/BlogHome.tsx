import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Sparkles, BookOpen, Layers, ArrowRight, Filter, FileText } from 'lucide-react';
import { BlogArticleCard } from '../../components/blog/BlogArticleCard';
import { fetchPublicPosts, fetchCategories, fetchPublicBlogSettings } from '../../lib/blogApi';
import type { BlogPost, BlogCategory, BlogSettings } from '../../types/blog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export const BlogHome: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1');
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });

  const [searchInput, setSearchInput] = useState<string>(searchParam);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
    fetchPublicBlogSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch featured post on page 1 with no search filter
    if (pageParam === 1 && !categoryParam && !searchParam) {
      fetchPublicPosts({ featured: true, limit: 1 })
        .then((res) => {
          if (res.posts && res.posts.length > 0) {
            setFeaturedPost(res.posts[0]);
          } else {
            setFeaturedPost(null);
          }
        })
        .catch(() => {});
    } else {
      setFeaturedPost(null);
    }

    fetchPublicPosts({
      page: pageParam,
      limit: settings?.posts_per_page || 9,
      category: categoryParam,
      search: searchParam
    })
      .then((res) => {
        setPosts(res.posts);
        setPagination(res.pagination);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load blog articles');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pageParam, categoryParam, searchParam, settings]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategorySelect = (slug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug) {
      newParams.set('category', slug);
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-primary/30">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>SEB's Institute Official Academic Blog</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            IELTS Preparation & <span className="text-primary underline decoration-primary/30 underline-offset-8">English Linguistics</span> Heuristics
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Authoritative test strategies, speaking cue cards, band 9 writing templates, and exam insights verified by Syed Ejaz Bukhari.
          </p>

          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search articles, IELTS Task 2 topics, cue cards, grammar..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-white/10 rounded-2xl pl-12 pr-28 py-6 text-sm text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-primary/20 shadow-xl"
              />
              <Button
                type="submit"
                className="absolute right-2 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-5 py-3.5 rounded-xl shadow-md cursor-pointer"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Category Pills Bar */}
        {categories.length > 0 && (
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Explore Categories</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => handleCategorySelect('')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                  !categoryParam
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-primary'
                }`}
              >
                All Articles
              </button>
              {categories.map((cat) => {
                const isSelected = categoryParam === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-primary'
                    }`}
                  >
                    {cat.name} ({cat.post_count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Post (Only on clean first page view) */}
        {featuredPost && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Featured Pillar Guide</span>
            </div>
            <BlogArticleCard post={featuredPost} featured={true} />
          </div>
        )}

        {/* Active Filter Notice */}
        {(categoryParam || searchParam) && (
          <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 text-left">
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              Showing articles for:{' '}
              {categoryParam && <span className="text-primary font-black uppercase mr-2">Category: {categoryParam}</span>}
              {searchParam && <span className="text-primary font-black">Search: "{searchParam}"</span>}
            </p>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="text-xs font-bold text-rose-600 underline hover:text-rose-700 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Latest Articles Grid */}
        <section className="space-y-6 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {searchParam ? 'Search Results' : categoryParam ? 'Category Articles' : 'Latest Masterclass Articles'}
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} articles)
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl h-80 border border-slate-200 dark:border-white/10 animate-pulse p-6" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-2xl text-rose-600 font-bold text-sm">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">No articles found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search criteria or category filter.</p>
              <Button onClick={() => setSearchParams({})} className="bg-primary text-white font-bold text-xs rounded-xl mt-2">
                Reset Filters
              </Button>
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
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(pagination.page - 1));
                  setSearchParams(p);
                }}
                className="rounded-xl font-bold text-xs px-4"
              >
                Previous
              </Button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', String(pNum));
                    setSearchParams(p);
                  }}
                  className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    pNum === pagination.page
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-primary'
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(pagination.page + 1));
                  setSearchParams(p);
                }}
                className="rounded-xl font-bold text-xs px-4"
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
