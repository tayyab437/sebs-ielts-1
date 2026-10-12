import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { User, Award, ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { fetchAuthorBySlug, fetchPublicPosts } from '../../lib/blogApi';
import type { BlogAuthor, BlogPost } from '../../types/blog';
import { BlogArticleCard } from '../../components/blog/BlogArticleCard';
import { BlogBreadcrumbs } from '../../components/blog/BlogBreadcrumbs';
import { Button } from '@/components/ui/button';

export const BlogAuthorView: React.FC = () => {
  const params = useParams<{ authorSlug?: string; slug?: string }>();
  const authorSlug = params.authorSlug || params.slug;
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  const [author, setAuthor] = useState<BlogAuthor | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorSlug) return;
    setLoading(true);
    setError(null);

    fetchAuthorBySlug(authorSlug)
      .then((auth) => {
        if (!auth) throw new Error('Author not found');
        setAuthor(auth);
        document.title = `${auth.name} | SEB's Institute Author Profile`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', auth.bio || `${auth.name} - Faculty at SEB's Institute`);
        let canonicalEl = document.querySelector('link[rel="canonical"]');
        if (canonicalEl) canonicalEl.setAttribute('href', `https://sebsinstitute.com/blog/author/${auth.slug}`);
        return fetchPublicPosts({ page, limit: 12 }).then((res) => ({ auth, res }));
      })
      .then(({ auth, res }) => {
        if (res && auth) {
          const authPosts = res.posts.filter((p) => p.author?.id === auth.id || p.author_id === auth.id || p.author?.slug === auth.slug);
          setPosts(authPosts);
          setPagination({ page: res.page, limit: 9, total: authPosts.length, totalPages: Math.ceil(authPosts.length / 9) || 1 });
        }
      })
      .catch((err) => {
        setError(err.message || 'Author profile not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authorSlug, page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Author Profile Not Found</h1>
          <p className="text-xs text-slate-500">The requested author or reviewer profile does not exist.</p>
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
        <BlogBreadcrumbs items={[{ label: author.name }]} />

        {/* Author Bio Header Card */}
        <header className="p-8 sm:p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
          </div>

          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Verified Educator & Mentor</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {author.name}
            </h1>

            {author.designation && (
              <p className="text-sm font-bold text-primary">{author.designation}</p>
            )}

            {author.credentials && (
              <p className="text-xs text-slate-500 italic">{author.credentials}</p>
            )}

            {author.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed pt-2">
                {author.bio}
              </p>
            )}
          </div>
        </header>

        {/* Articles Written */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Articles Published by {author.name}</span>
          </h2>

          {posts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">No published articles yet</h3>
              <p className="text-xs text-slate-500">Check back soon for new research articles and masterclasses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post) => (
                <BlogArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
