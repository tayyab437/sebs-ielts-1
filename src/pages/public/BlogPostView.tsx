import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchPublicPostBySlug, fetchAdminPostById } from '../../lib/blogApi';
import type { BlogPost } from '../../types/blog';
import { BlogBreadcrumbs } from '../../components/blog/BlogBreadcrumbs';
import { BlogJsonLd } from '../../components/blog/BlogJsonLd';
import { BlogTableOfContents } from '../../components/blog/BlogTableOfContents';
import { BlogDirectAnswer } from '../../components/blog/BlogDirectAnswer';
import { BlogKeyTakeaways } from '../../components/blog/BlogKeyTakeaways';
import { BlogImportantNote } from '../../components/blog/BlogImportantNote';
import { BlogFaqSection } from '../../components/blog/BlogFaqSection';
import { BlogSourcesSection } from '../../components/blog/BlogSourcesSection';
import { BlogAuthorBox } from '../../components/blog/BlogAuthorBox';
import { BlogCtaSection } from '../../components/blog/BlogCtaSection';
import { BlogArticleCard } from '../../components/blog/BlogArticleCard';

interface BlogPostViewProps {
  isPreviewMode?: boolean;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ isPreviewMode = false }) => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (isPreviewMode && id) {
      // Preview mode for admins
      fetchAdminPostById(id)
        .then((data) => {
          setPost(data);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load preview');
        })
        .finally(() => setLoading(false));
    } else if (slug) {
      fetchPublicPostBySlug(slug)
        .then((data: any) => {
          if (!data) {
            setError('Article not found');
            return;
          }
          // If server issued a 301 redirect object
          if (data.redirect) {
            navigate(data.redirect.destination, { replace: true });
            return;
          }
          setPost(data);
        })
        .catch((err) => {
          setError(err.message || 'Article not found');
        })
        .finally(() => setLoading(false));
    }
  }, [slug, id, isPreviewMode, navigate]);

  useEffect(() => {
    if (!post) return;

    // Dynamically update document title, canonical link, and social meta tags
    document.title = `${post.seo_title || post.title} | SEB's Institute Blog`;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const articleUrl = post.canonical_url || `https://sebsinstitute.com/blog/${post.slug}`;
    const desc = post.meta_description || post.excerpt || "Comprehensive IELTS guide and linguistic mastery by Syed Ejaz Bukhari.";

    setMeta('description', desc);
    setMeta('og:title', post.seo_title || post.title, true);
    setMeta('og:description', desc, true);
    setMeta('og:url', articleUrl, true);
    setMeta('og:type', 'article', true);

    const featImg = (post as any).featured_image_url || post.featured_image || 'https://sebsinstitute.com/ielts_prep_banner_960.webp';
    setMeta('og:image', featImg, true);
    setMeta('twitter:image', featImg);
    setMeta('twitter:title', post.seo_title || post.title);
    setMeta('twitter:description', desc);

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', articleUrl);

    // Scroll to top on post switch
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Article Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The blog article you are looking for may have been moved, renamed, or archived.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Estimate reading time
  const wordCount = (post.content || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const breadcrumbs = [
    ...(post.category ? [{ label: post.category.name, url: `/blog/category/${post.category.slug}` }] : []),
    { label: post.title }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 text-left">
      <BlogJsonLd post={post} />

      {/* Preview Mode Banner for Admins */}
      {isPreviewMode && (
        <div className="bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest py-2 px-4 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
          <span>⚠️ ADMIN PREVIEW MODE (UNPUBLISHED DRAFT) — NOINDEX</span>
        </div>
      )}

      {/* Article Header & Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* 1. Breadcrumbs */}
        <BlogBreadcrumbs items={breadcrumbs} />

        {/* 2. Category & Meta Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <Link
              to={`/blog/category/${post.category.slug}`}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-colors"
            >
              {post.category.name}
            </Link>
          )}
          {post.content_type === 'pillar' && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
              Pillar Guide
            </span>
          )}
        </div>

        {/* 3. Article H1 Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          {post.title}
        </h1>

        {/* 4. Excerpt / Lead Subtitle */}
        {post.excerpt && (
          <p className="text-lg sm:text-xl font-normal text-slate-600 dark:text-slate-300 leading-relaxed border-l-4 border-primary pl-4 py-1 italic">
            {post.excerpt}
          </p>
        )}

        {/* 5. Author, Reviewer & Reading Time Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-y border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {post.author?.profile_image || (post.author as any)?.avatar_url ? (
                  <img src={post.author?.profile_image || (post.author as any)?.avatar_url} alt={post.author?.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block leading-none">Author</span>
                <span className="font-bold text-slate-900 dark:text-white">{post.author?.name || 'Syed Ejaz Bukhari'}</span>
              </div>
            </div>

            {post.reviewer && (
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center overflow-hidden shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-emerald-600 font-bold block leading-none">Reviewed By</span>
                  <span className="font-bold text-slate-900 dark:text-white">{post.reviewer.name}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {readTime} min read
            </span>
          </div>
        </div>

        {/* 6. Featured Image */}
        {(post.featured_image || (post as any).featured_image_url) && (
          <figure className="my-6">
            <div className="rounded-3xl overflow-hidden bg-slate-950 aspect-[16/9] shadow-xl border border-slate-200/80 dark:border-white/10">
              <img
                src={post.featured_image || (post as any).featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-full object-cover"
              />
            </div>
            {(post as any).featured_image_caption && (
              <figcaption className="text-center text-xs text-slate-500 italic mt-2">
                {(post as any).featured_image_caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* 7. Direct Answer Block */}
        {post.direct_answer_question && post.direct_answer_text && (
          <BlogDirectAnswer question={post.direct_answer_question} answer={post.direct_answer_text} />
        )}

        {/* 8. Key Takeaways Block */}
        {Array.isArray(post.key_takeaways) && post.key_takeaways.length > 0 && (
          <BlogKeyTakeaways items={post.key_takeaways} />
        )}

        {/* 8b. Important Note / Callout */}
        {post.important_note && <BlogImportantNote note={post.important_note} />}

        {/* 9. Table of Contents */}
        <BlogTableOfContents contentHtml={post.content} />

        {/* 10. Main Article Body */}
        <main
          className="my-8 max-w-none prose dark:prose-invert prose-slate prose-headings:font-black prose-headings:tracking-tight prose-h2:text-2xl prose-h2:sm:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-slate-900 dark:prose-h2:text-white prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-800 dark:prose-p:text-slate-200 prose-li:text-slate-800 dark:prose-li:text-slate-200 prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* 11. FAQs Accordion */}
        {Array.isArray(post.faqs) && post.faqs.length > 0 && <BlogFaqSection faqs={post.faqs} />}

        {/* 12. Sources & References */}
        {Array.isArray(post.sources) && post.sources.length > 0 && <BlogSourcesSection sources={post.sources} />}

        {/* 13. E-E-A-T Author & Reviewer Bio Box */}
        <BlogAuthorBox
          author={post.author}
          reviewer={post.reviewer}
          publishedDate={post.published_at}
          updatedDate={post.updated_at}
          lastReviewedDate={post.last_reviewed_at}
        />

        {/* 14. SEBS CTA Block */}
        {post.cta && <BlogCtaSection cta={post.cta} />}

        {/* 15. Related Articles Grid */}
        {Array.isArray(post.related_posts) && post.related_posts.length > 0 && (
          <section className="pt-10 border-t border-slate-200 dark:border-white/10 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Related Articles & Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.related_posts.map((rel: any) => (
                <BlogArticleCard key={rel.id} post={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
