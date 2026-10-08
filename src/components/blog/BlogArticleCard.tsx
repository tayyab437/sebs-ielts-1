import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, ArrowRight, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import type { BlogPost } from '../../types/blog';

interface BlogArticleCardProps {
  post: BlogPost;
  featured?: boolean;
}

export const BlogArticleCard: React.FC<BlogArticleCardProps> = ({ post, featured = false }) => {
  // Estimate reading time (~200 words per minute)
  const wordCount = (post.content || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent';

  if (featured) {
    return (
      <article className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-7 relative min-h-[280px] lg:min-h-[420px] overflow-hidden bg-slate-950">
          <img
            src={(post as any).featured_image_url || post.featured_image || '/ielts_prep_banner_960.webp'}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            loading="lazy"
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider shadow-md">
              Featured Pillar Guide
            </span>
            {post.category && (
              <span className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                {post.category.name}
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {readTime} min read
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-primary transition-colors">
              <Link to={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {post.author?.profile_image || (post.author as any)?.avatar_url ? (
                  <img src={post.author?.profile_image || (post.author as any)?.avatar_url} alt={post.author?.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {post.author?.name || 'Syed Ejaz Bukhari'}
                </p>
                {post.reviewer && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3" /> Reviewed by {post.reviewer.name}
                  </p>
                )}
              </div>
            </div>

            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider hover:gap-3 transition-all"
            >
              Read Article <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
          <img
            src={(post as any).featured_image_url || post.featured_image || '/ielts_prep_banner_960.webp'}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {post.category && (
            <div className="absolute top-3 left-3">
              <Link
                to={`/blog/category/${post.category.slug}`}
                className="px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider border border-white/20 hover:bg-primary transition-colors"
              >
                {post.category.name}
              </Link>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-3 text-left">
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              {readTime} min read
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
            <Link to={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </div>

      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {post.author?.profile_image || (post.author as any)?.avatar_url ? (
              <img src={post.author?.profile_image || (post.author as any)?.avatar_url} alt={post.author?.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
            {post.author?.name || 'Syed Ejaz Bukhari'}
          </span>
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="text-xs font-black text-primary hover:translate-x-1 transition-transform p-1"
          aria-label={`Read ${post.title}`}
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
};
