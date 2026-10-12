import fs from "fs";
import path from "path";

export interface BlogRenderResult {
  notFound?: boolean;
  redirect?: { destination: string; status: number };
  html: string;
}

function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function readBlogData(): any {
  const filePath = path.join(process.cwd(), "blog_data.json");
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8") || "{}");
    }
  } catch (e) {
    console.warn("[blogSeoRenderer] Failed to read blog_data.json:", e);
  }
  return { posts: [], categories: [], authors: [], reviewers: [], settings: {}, redirects: [] };
}

/**
 * Builds dynamic XML sitemap string integrating all published posts, categories & authors
 */
export function generateDynamicSitemap(): string {
  const data = readBlogData();
  const publicSitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
  let baseContent = "";
  if (fs.existsSync(publicSitemapPath)) {
    baseContent = fs.readFileSync(publicSitemapPath, "utf-8");
  }

  // If public/sitemap.xml already contains comprehensive blog entries, return it
  if (baseContent && baseContent.includes("/blog/ielts-complete-master-guide-2026")) {
    return baseContent;
  }

  const posts = (data.posts || []).filter((p: any) => p.status === "published" && p.robots_index !== false);
  const categories = data.categories || [];
  const authors = data.authors || [];

  const postUrls = posts.map((p: any) => {
    const lastMod = (p.updated_at || p.published_at || new Date().toISOString()).split("T")[0];
    const imgTag = p.featured_image ? `
    <image:image>
      <image:loc>${escapeAttr(p.featured_image)}</image:loc>
      <image:title>${escapeHtml(p.title)}</image:title>
    </image:image>` : "";
    return `  <url>
    <loc>https://sebsinstitute.com/blog/${p.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://sebsinstitute.com/blog/${p.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="https://sebsinstitute.com/blog/${p.slug}" />${imgTag}
  </url>`;
  }).join("\n");

  const catUrls = categories.map((c: any) => `  <url>
    <loc>https://sebsinstitute.com/blog/category/${c.slug}</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://sebsinstitute.com/blog/category/${c.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="https://sebsinstitute.com/blog/category/${c.slug}" />
  </url>`).join("\n");

  const authorUrls = authors.map((a: any) => `  <url>
    <loc>https://sebsinstitute.com/blog/author/${a.slug}</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://sebsinstitute.com/blog/author/${a.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="https://sebsinstitute.com/blog/author/${a.slug}" />
  </url>`).join("\n");

  if (baseContent && baseContent.includes("</urlset>")) {
    const injection = `
  <!-- Blog Hub & Articles -->
  <url>
    <loc>https://sebsinstitute.com/blog</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://sebsinstitute.com/blog" />
    <xhtml:link rel="alternate" hreflang="en" href="https://sebsinstitute.com/blog" />
  </url>
${postUrls}
${catUrls}
${authorUrls}
</urlset>`;
    return baseContent.replace("</urlset>", injection);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://sebsinstitute.com/</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://sebsinstitute.com/blog</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${postUrls}
${catUrls}
${authorUrls}
</urlset>`;
}

/**
 * Builds RSS 2.0 Feed for search engines & subscribers
 */
export function generateBlogRss(): string {
  const data = readBlogData();
  const posts = (data.posts || []).filter((p: any) => p.status === "published");

  const items = posts.map((p: any) => {
    const pubDate = new Date(p.published_at || Date.now()).toUTCString();
    return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>https://sebsinstitute.com/blog/${p.slug}</link>
      <guid>https://sebsinstitute.com/blog/${p.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeHtml(p.excerpt || p.meta_description || "")}</description>
      <author>sebs.info@gmail.com (${escapeHtml(p.author?.name || "Syed Ejaz Bukhari")})</author>
      <category>${escapeHtml(p.category?.name || "IELTS Preparation")}</category>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SEB's Institute Academic Journal &amp; IELTS Resource Hub</title>
    <link>https://sebsinstitute.com/blog</link>
    <description>Authoritative educational articles, Band 8.5+ strategies, and exam research curated by Syed Ejaz Bukhari.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://sebsinstitute.com/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

/**
 * Replace head tags in HTML template with dynamic post metadata
 */
function replaceHeadTags(html: string, options: {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: string;
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  sectionName?: string;
  noindex?: boolean;
  extraHead?: string;
}): string {
  let result = html;

  // 1. Replace Title
  result = result.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapeHtml(options.title)}</title>`
  );

  // 2. Replace Canonical URL
  result = result.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeAttr(options.canonicalUrl)}" />`
  );

  // 3. Replace Meta Description
  result = result.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeAttr(options.description)}" />`
  );

  // 4. OpenGraph Tags
  const ogImg = options.ogImage || "https://sebsinstitute.com/ielts_prep_banner_960.webp";
  result = result.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${options.ogType || 'article'}" />`
  );
  result = result.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeAttr(options.canonicalUrl)}" />`
  );
  result = result.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(options.title)}" />`
  );
  result = result.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttr(options.description)}" />`
  );
  result = result.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeAttr(ogImg)}" />`
  );

  // 5. Twitter Card Tags
  result = result.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeAttr(options.title)}" />`
  );
  result = result.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeAttr(options.description)}" />`
  );
  result = result.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeAttr(ogImg)}" />`
  );

  // 6. Handle Robots tag (if noindex)
  if (options.noindex) {
    result = result.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="noindex, nofollow" />`
    );
    result = result.replace(
      /<meta\s+name="googlebot"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="googlebot" content="noindex, nofollow" />`
    );
  }

  // 7. Inject extra head tags (JSON-LD schemas, article metadata) before </head>
  if (options.extraHead) {
    result = result.replace("</head>", `${options.extraHead}\n</head>`);
  }

  return result;
}

/**
 * Generates Google-compliant Schema.org JSON-LD structured data for article
 */
function buildArticleSchema(post: any): string {
  const publishedDate = post.published_at ? new Date(post.published_at).toISOString() : new Date().toISOString();
  const modifiedDate = post.updated_at ? new Date(post.updated_at).toISOString() : publishedDate;
  const canonical = post.canonical_url || `https://sebsinstitute.com/blog/${post.slug}`;
  const featImg = post.featured_image || "https://sebsinstitute.com/ielts_prep_banner_960.webp";

  const articleSchema: any = {
    "@context": "https://schema.org",
    "@type": post.content_type === "pillar" ? "Article" : "BlogPosting",
    "headline": post.seo_title || post.title,
    "description": post.meta_description || post.excerpt,
    "image": [featImg],
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonical
    },
    "author": {
      "@type": "Person",
      "name": post.author?.name || "Syed Ejaz Bukhari",
      "jobTitle": post.author?.credentials || "Master English & IELTS Coach",
      "url": `https://sebsinstitute.com/blog/author/${post.author?.slug || "syed-ejaz-bukhari"}`
    },
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "SEB's Institute",
      "url": "https://sebsinstitute.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://i.ibb.co/Xxg75WQc/image-1.jpg"
      }
    }
  };

  if (post.reviewer) {
    articleSchema.reviewedBy = {
      "@type": "Person",
      "name": post.reviewer.name,
      "jobTitle": post.reviewer.qualifications || "Senior Academic Reviewer",
      "url": `https://sebsinstitute.com/blog/author/${post.reviewer.slug || "syeda-zarnaz-gilani"}`
    };
  }

  // Breadcrumb schema
  const breadcrumbSchema: any = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://sebsinstitute.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://sebsinstitute.com/blog"
      }
    ]
  };

  if (post.category) {
    breadcrumbSchema.itemListElement.push({
      "@type": "ListItem",
      "position": 3,
      "name": post.category.name,
      "item": `https://sebsinstitute.com/blog/category/${post.category.slug}`
    });
    breadcrumbSchema.itemListElement.push({
      "@type": "ListItem",
      "position": 4,
      "name": post.title,
      "item": canonical
    });
  } else {
    breadcrumbSchema.itemListElement.push({
      "@type": "ListItem",
      "position": 3,
      "name": post.title,
      "item": canonical
    });
  }

  let schemasHtml = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;

  // FAQ Schema
  if (Array.isArray(post.faqs) && post.faqs.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": post.faqs.map((f: any) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    };
    schemasHtml += `\n<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;
  }

  return schemasHtml;
}

/**
 * Replaces the homepage static content inside <div id="root">...</div> with semantic article content
 */
function replaceRootContainer(html: string, innerContent: string): string {
  const rootStart = html.indexOf('<div id="root">');
  if (rootStart === -1) return html;

  // Find closing </div> before </div>\n    <noscript> or <script
  const nextMarker = html.indexOf('<noscript>', rootStart);
  if (nextMarker !== -1) {
    // Find the last </div> before <noscript>
    const beforeNoscript = html.substring(0, nextMarker);
    const lastDiv = beforeNoscript.lastIndexOf('</div>');
    if (lastDiv !== -1 && lastDiv > rootStart) {
      return html.substring(0, rootStart + '<div id="root">'.length) +
        '\n' + innerContent + '\n' +
        html.substring(lastDiv);
    }
  }

  return html;
}

/**
 * Renders complete Google-compliant HTML for a single blog post
 */
export function renderBlogPostHtml(slug: string, baseHtml: string): BlogRenderResult {
  const data = readBlogData();

  // 1. Check for Active 301 Redirect Rules
  const redirectRule = (data.redirects || []).find((r: any) =>
    r.active && (r.source_url === `/blog/${slug}` || r.source_url === slug)
  );
  if (redirectRule) {
    return {
      redirect: {
        destination: redirectRule.destination_url,
        status: redirectRule.status_code || 301
      },
      html: ""
    };
  }

  // 2. Find Post
  const rawPost = (data.posts || []).find((p: any) => p.slug === slug || p.id === slug);
  if (!rawPost) {
    // Return explicit 404 with noindex to prevent Google Soft 404!
    const notFoundHtml = replaceHeadTags(baseHtml, {
      title: "Article Not Found | SEB's Institute Blog",
      description: "The requested IELTS guide or article was not found.",
      canonicalUrl: `https://sebsinstitute.com/blog/${slug}`,
      noindex: true
    });
    const root404 = `
      <div class="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div class="max-w-md w-full bg-slate-800/80 border border-slate-700 p-8 rounded-3xl space-y-4 shadow-xl">
          <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center text-3xl font-black">404</div>
          <h1 class="text-2xl font-black text-white">Article Not Found</h1>
          <p class="text-xs text-slate-400 leading-relaxed">
            The blog article you are looking for does not exist, has been renamed, or was moved.
          </p>
          <div class="pt-2">
            <a href="/blog" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00a8cc] text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-[#0096b7] transition-all">
              &larr; Return to Academic Blog
            </a>
          </div>
        </div>
      </div>
    `;
    return {
      notFound: true,
      html: replaceRootContainer(notFoundHtml, root404)
    };
  }

  // Populate relations
  const post = {
    ...rawPost,
    category: (data.categories || []).find((c: any) => c.id === rawPost.category_id),
    author: (data.authors || []).find((a: any) => a.id === rawPost.author_id),
    reviewer: (data.reviewers || []).find((r: any) => r.id === rawPost.reviewer_id)
  };

  const pageTitle = `${post.seo_title || post.title} | SEB's Institute Blog`;
  const metaDesc = post.meta_description || post.excerpt || "Comprehensive IELTS guide by Syed Ejaz Bukhari.";
  const canonicalUrl = post.canonical_url || `https://sebsinstitute.com/blog/${post.slug}`;
  const featImg = post.featured_image || "https://sebsinstitute.com/ielts_prep_banner_960.webp";
  const authorName = post.author?.name || "Syed Ejaz Bukhari";
  const categoryName = post.category?.name || "IELTS Preparation";

  const schemasHtml = buildArticleSchema(post);

  // Replace <head> tags
  const updatedHtml = replaceHeadTags(baseHtml, {
    title: pageTitle,
    description: metaDesc,
    canonicalUrl,
    ogType: "article",
    ogImage: featImg,
    publishedTime: post.published_at,
    modifiedTime: post.updated_at || post.published_at,
    authorName,
    sectionName: categoryName,
    extraHead: schemasHtml
  });

  // Calculate read time
  const wordCount = (post.content || "").replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recent";

  // Build semantic SSR content
  const takeawaysHtml = Array.isArray(post.key_takeaways) && post.key_takeaways.length > 0
    ? `<section class="my-8 p-6 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
         <h3 class="text-sm font-black uppercase tracking-wider text-emerald-400 mb-3">Key Takeaways</h3>
         <ul class="space-y-2 text-sm text-slate-300">
           ${post.key_takeaways.map((t: string) => `<li class="flex items-start gap-2"><span class="text-emerald-400 font-bold">&bull;</span><span>${escapeHtml(t)}</span></li>`).join("")}
         </ul>
       </section>`
    : "";

  const directAnswerHtml = post.direct_answer_question && post.direct_answer_text
    ? `<section class="my-8 p-6 bg-cyan-950/30 border-l-4 border-[#00a8cc] rounded-r-2xl">
         <h3 class="text-xs font-black uppercase tracking-wider text-[#00a8cc] mb-1">Direct Answer</h3>
         <h4 class="text-base font-bold text-white mb-2">${escapeHtml(post.direct_answer_question)}</h4>
         <p class="text-sm text-slate-300 leading-relaxed">${escapeHtml(post.direct_answer_text)}</p>
       </section>`
    : "";

  const faqsHtml = Array.isArray(post.faqs) && post.faqs.length > 0
    ? `<section class="my-10 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
         <h3 class="text-xl font-black text-white mb-6">Frequently Asked Questions</h3>
         <div class="space-y-4">
           ${post.faqs.map((f: any) => `
             <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
               <h4 class="text-sm font-bold text-white mb-2">${escapeHtml(f.question)}</h4>
               <p class="text-xs text-slate-400 leading-relaxed">${escapeHtml(f.answer)}</p>
             </div>`).join("")}
         </div>
       </section>`
    : "";

  const articleSemanticHtml = `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 text-left">
      <!-- Site Header -->
      <header class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="/" class="flex items-center gap-3">
            <img src="https://i.ibb.co/Xxg75WQc/image-1.jpg" alt="SEB's Institute Logo" width="140" height="76" class="h-12 w-auto object-contain" />
            <div>
              <span class="text-lg font-black tracking-tight text-white block">SEB's Institute</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#00a8cc] block">Academic Journal</span>
            </div>
          </a>
          <nav class="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="/" class="hover:text-white transition-colors">Home</a>
            <a href="/blog" class="text-[#00a8cc] hover:text-white transition-colors">Blog</a>
            <a href="/courses" class="hover:text-[#00a8cc] transition-colors">Courses</a>
            <a href="/mock-tests" class="hover:text-[#00a8cc] transition-colors">Mock Tests</a>
            <a href="/pricing" class="hover:text-[#00a8cc] transition-colors">Pricing</a>
          </nav>
          <a href="/blog" class="text-xs font-bold uppercase text-[#00a8cc] hover:underline">&larr; Back to Articles</a>
        </div>
      </header>

      <!-- Main Article Container -->
      <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <!-- Breadcrumbs -->
        <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <a href="/" class="hover:text-white">Home</a>
          <span>/</span>
          <a href="/blog" class="hover:text-white">Blog</a>
          ${post.category ? `<span>/</span><a href="/blog/category/${post.category.slug}" class="text-[#00a8cc] hover:underline">${escapeHtml(post.category.name)}</a>` : ""}
          <span>/</span>
          <span class="text-slate-200 truncate max-w-xs">${escapeHtml(post.title)}</span>
        </nav>

        <!-- Category Badge -->
        <div class="flex items-center gap-2">
          ${post.category ? `<a href="/blog/category/${post.category.slug}" class="px-3 py-1 rounded-full bg-[#00a8cc]/10 text-[#00a8cc] text-xs font-black uppercase tracking-wider">${escapeHtml(post.category.name)}</a>` : ""}
          ${post.content_type === "pillar" ? `<span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider">Pillar Guide</span>` : ""}
        </div>

        <!-- Title -->
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
          ${escapeHtml(post.title)}
        </h1>

        <!-- Excerpt -->
        ${post.excerpt ? `<p class="text-lg sm:text-xl font-normal text-slate-300 leading-relaxed border-l-4 border-[#00a8cc] pl-4 py-1 italic">${escapeHtml(post.excerpt)}</p>` : ""}

        <!-- Byline -->
        <div class="flex items-center justify-between flex-wrap gap-4 py-4 border-y border-slate-800 text-xs text-slate-400">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="font-bold text-white">${escapeHtml(authorName)}</span>
              <span class="text-slate-500">•</span>
              <span>${post.author?.credentials || "Master English & IELTS Coach"}</span>
            </div>
            ${post.reviewer ? `
              <div class="flex items-center gap-1 text-emerald-400 border-l border-slate-800 pl-4">
                <span>Reviewed by:</span>
                <span class="font-bold">${escapeHtml(post.reviewer.name)}</span>
              </div>` : ""}
          </div>
          <div class="flex items-center gap-3">
            <span>Published: ${formattedDate}</span>
            <span>•</span>
            <span>${readTime} min read</span>
          </div>
        </div>

        <!-- Featured Image -->
        <figure class="my-6 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
          <img src="${escapeAttr(featImg)}" alt="${escapeAttr(post.featured_image_alt || post.title)}" class="w-full h-auto object-cover max-h-[480px]" width="1200" height="675" />
        </figure>

        ${directAnswerHtml}
        ${takeawaysHtml}

        <!-- Article Body -->
        <div class="my-8 text-slate-200 leading-relaxed space-y-4 text-base">
          ${post.content || ""}
        </div>

        ${faqsHtml}

        <!-- Author Bio Box -->
        <section class="my-10 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div class="flex items-center gap-4">
            <img src="/syed_ejaz_bukhari_hero.webp" alt="${escapeAttr(authorName)}" class="w-16 h-16 rounded-full object-cover border-2 border-[#00a8cc]" />
            <div>
              <span class="text-[10px] uppercase tracking-widest text-[#00a8cc] font-black block">About the Author</span>
              <h3 class="text-lg font-black text-white">${escapeHtml(authorName)}</h3>
              <p class="text-xs text-slate-400">${escapeHtml(post.author?.credentials || "Founder & Principal Mentor at SEBS Institute")}</p>
            </div>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(post.author?.bio || "Over 34 years of instructional leadership in English phonetics, linguistic retraining, and IELTS test coaching.")}</p>
        </section>

        <!-- CTA Box -->
        <section class="my-10 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-[#00a8cc]/30 text-center space-y-4">
          <h3 class="text-2xl font-black text-white">Aiming for Band 8.5+ in IELTS?</h3>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join Syed Ejaz Bukhari’s intensive Master Batches for personalized essay evaluation and cue card drills.
          </p>
          <div class="pt-2">
            <a href="/courses" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#00a8cc] hover:bg-[#0096b7] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg">
              Explore Live Masterclasses &rarr;
            </a>
          </div>
        </section>
      </article>

      <!-- Footer -->
      <footer class="bg-slate-950 border-t border-slate-850 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 text-center">
        &copy; 2026 SEB's Institute &bull; Syed Ejaz Bukhari. All rights reserved.
      </footer>
    </div>
  `;

  return {
    notFound: false,
    html: replaceRootContainer(updatedHtml, articleSemanticHtml)
  };
}

/**
 * Renders complete Google-compliant HTML for Blog Directory (/blog)
 */
export function renderBlogHomeHtml(baseHtml: string): BlogRenderResult {
  const data = readBlogData();
  const posts = (data.posts || []).filter((p: any) => p.status === "published");
  const categories = data.categories || [];

  const pageTitle = "IELTS & English Learning Academic Journal | SEB's Institute";
  const metaDesc = "Explore authoritative educational articles, Band 8.5+ strategies, and exam research curated by Syed Ejaz Bukhari at SEBS Institute.";
  const canonicalUrl = "https://sebsinstitute.com/blog";

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": metaDesc,
    "url": canonicalUrl,
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "SEB's Institute",
      "url": "https://sebsinstitute.com"
    },
    "hasPart": posts.map((p: any) => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "url": `https://sebsinstitute.com/blog/${p.slug}`,
      "description": p.excerpt
    }))
  };

  const updatedHtml = replaceHeadTags(baseHtml, {
    title: pageTitle,
    description: metaDesc,
    canonicalUrl,
    ogType: "website",
    extraHead: `<script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>`
  });

  const postsGrid = posts.map((p: any) => `
    <article class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:border-[#00a8cc]/50 transition-all flex flex-col justify-between">
      <div>
        <a href="/blog/${p.slug}" class="block aspect-[16/9] overflow-hidden bg-slate-950">
          <img src="${escapeAttr(p.featured_image || '/syed_ejaz_bukhari_hero.webp')}" alt="${escapeAttr(p.title)}" class="w-full h-full object-cover" width="600" height="338" loading="lazy" />
        </a>
        <div class="p-6 space-y-3">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#00a8cc]/10 text-[#00a8cc]">${escapeHtml(p.category?.name || "IELTS")}</span>
            <span class="text-slate-500 text-xs">${p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
          </div>
          <h2 class="text-lg font-black text-white hover:text-[#00a8cc] transition-colors">
            <a href="/blog/${p.slug}">${escapeHtml(p.title)}</a>
          </h2>
          <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed">${escapeHtml(p.excerpt || "")}</p>
        </div>
      </div>
      <div class="p-6 pt-0 border-t border-slate-800/60 mt-4 flex items-center justify-between">
        <span class="text-xs font-bold text-slate-300">${escapeHtml(p.author?.name || "Syed Ejaz Bukhari")}</span>
        <a href="/blog/${p.slug}" class="text-xs font-black text-[#00a8cc] hover:underline">Read Article &rarr;</a>
      </div>
    </article>
  `).join("");

  const semanticContent = `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 text-left">
      <header class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="/" class="flex items-center gap-3">
            <img src="https://i.ibb.co/Xxg75WQc/image-1.jpg" alt="SEB's Institute Logo" width="140" height="76" class="h-12 w-auto object-contain" />
            <div>
              <span class="text-lg font-black tracking-tight text-white block">SEB's Institute</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#00a8cc] block">Academic Journal</span>
            </div>
          </a>
          <nav class="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="/" class="hover:text-white transition-colors">Home</a>
            <a href="/courses" class="hover:text-[#00a8cc] transition-colors">Courses</a>
            <a href="/mock-tests" class="hover:text-[#00a8cc] transition-colors">Mock Tests</a>
            <a href="/pricing" class="hover:text-[#00a8cc] transition-colors">Pricing</a>
          </nav>
        </div>
      </header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
        <div class="text-center max-w-3xl mx-auto space-y-3">
          <span class="text-xs font-black uppercase tracking-widest text-[#00a8cc]">Knowledge Hub &amp; Examiner Research</span>
          <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">Academic Journal &amp; IELTS Guides</h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Exhaustive tutorials, band scoring rubrics, model essays, and speaking cue card blueprints curated by Syed Ejaz Bukhari.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          ${categories.map((c: any) => `<a href="/blog/category/${c.slug}" class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#00a8cc] text-xs font-bold text-slate-300 hover:text-white transition-all">${escapeHtml(c.name)}</a>`).join("")}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${postsGrid}
        </div>
      </main>
      <footer class="mt-20 bg-slate-950 border-t border-slate-850 py-12 text-xs text-slate-500 text-center">
        &copy; 2026 SEB's Institute &bull; Syed Ejaz Bukhari. All rights reserved.
      </footer>
    </div>
  `;

  return {
    notFound: false,
    html: replaceRootContainer(updatedHtml, semanticContent)
  };
}
