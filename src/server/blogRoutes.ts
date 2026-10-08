import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export function createBlogRouter(mysqlPool: Pool, verifyTokenFn: (token: string) => { userId: string; email: string } | null) {
  const router = Router();

  // Middleware to require admin authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
      }
      const token = authHeader.split(' ')[1];
      const verified = verifyTokenFn(token);
      if (!verified) {
        return res.status(401).json({ error: 'Invalid or expired session token' });
      }

      // Check user role from profiles table
      const [rows]: any = await mysqlPool.execute('SELECT role, email FROM profiles WHERE id = ? OR email = ? LIMIT 1', [verified.userId, verified.email]);
      const user = rows && rows[0];

      // Admin check (admin role or designated system superadmin email)
      const isAdmin = user && (user.role === 'admin' || user.email === 'ac.repair.in.dubai3@gmail.com' || verified.email === 'ac.repair.in.dubai3@gmail.com');
      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
      }

      req.adminUser = { id: verified.userId, email: verified.email };
      next();
    } catch (err: any) {
      console.error('requireAdmin error:', err);
      return res.status(500).json({ error: 'Authentication verification error' });
    }
  };

  // Multer storage setup for blog media uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, safeName);
    }
  });

  const fileFilter = (_req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, and SVG images are allowed.'), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Background worker: Periodically publish scheduled posts
  setInterval(async () => {
    try {
      const now = new Date();
      const [scheduled]: any = await mysqlPool.query(
        'SELECT id, title, slug FROM blog_posts WHERE status = "scheduled" AND scheduled_at <= ?',
        [now]
      );
      if (scheduled && scheduled.length > 0) {
        for (const post of scheduled) {
          await mysqlPool.query(
            'UPDATE blog_posts SET status = "published", published_at = IFNULL(published_at, NOW()) WHERE id = ?',
            [post.id]
          );
          console.log(`[Blog Scheduler] Automatically published scheduled article: "${post.title}" (${post.slug})`);
        }
      }
    } catch (err) {
      // Background worker error caught silently
    }
  }, 60 * 1000); // Check every 60 seconds

  // ==========================================
  // PUBLIC ROUTES
  // ==========================================

  // 1. Get published posts (with search, category, tag, pagination)
  router.get('/posts', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 9));
      const offset = (page - 1) * limit;
      const categorySlug = (req.query.category as string || '').trim();
      const search = (req.query.search as string || '').trim();
      const featured = req.query.featured === 'true';

      let whereConditions = ['p.status = "published"', '(p.published_at <= NOW() OR p.published_at IS NULL)'];
      const params: any[] = [];

      if (categorySlug) {
        whereConditions.push('c.slug = ?');
        params.push(categorySlug);
      }

      if (featured) {
        whereConditions.push('p.is_featured = TRUE');
      }

      if (search) {
        whereConditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.primary_keyword LIKE ? OR p.content LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // Total count
      const [countRows]: any = await mysqlPool.query(
        `SELECT COUNT(*) as total FROM blog_posts p
         LEFT JOIN blog_categories c ON p.category_id = c.id
         WHERE ${whereClause}`,
        params
      );
      const total = countRows[0]?.total || 0;

      // Posts list
      const queryParams = [...params, limit, offset];
      const [posts]: any = await mysqlPool.query(
        `SELECT 
          p.id, p.title, p.slug, p.excerpt, p.featured_image_url, p.featured_image_alt,
          p.content_type, p.is_featured, p.published_at, p.updated_at, p.last_reviewed_at,
          p.primary_keyword, p.search_intent,
          c.id as category_id, c.name as category_name, c.slug as category_slug,
          a.id as author_id, a.name as author_name, a.slug as author_slug, a.avatar_url as author_avatar, a.designation as author_designation,
          r.id as reviewer_id, r.name as reviewer_name, r.slug as reviewer_slug, r.avatar_url as reviewer_avatar, r.designation as reviewer_designation
         FROM blog_posts p
         LEFT JOIN blog_categories c ON p.category_id = c.id
         LEFT JOIN blog_authors a ON p.author_id = a.id
         LEFT JOIN blog_reviewers r ON p.reviewer_id = r.id
         WHERE ${whereClause}
         ORDER BY p.is_featured DESC, p.published_at DESC, p.created_at DESC
         LIMIT ? OFFSET ?`,
        queryParams
      );

      const formattedPosts = posts.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        featured_image_url: p.featured_image_url,
        featured_image_alt: p.featured_image_alt,
        content_type: p.content_type,
        is_featured: Boolean(p.is_featured),
        published_at: p.published_at,
        updated_at: p.updated_at,
        last_reviewed_at: p.last_reviewed_at,
        primary_keyword: p.primary_keyword,
        category: p.category_id ? { id: p.category_id, name: p.category_name, slug: p.category_slug } : null,
        author: p.author_id ? { id: p.author_id, name: p.author_name, slug: p.author_slug, avatar_url: p.author_avatar, designation: p.author_designation } : null,
        reviewer: p.reviewer_id ? { id: p.reviewer_id, name: p.reviewer_name, slug: p.reviewer_slug, avatar_url: p.reviewer_avatar, designation: p.reviewer_designation } : null
      }));

      res.json({
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      console.error('Error fetching public blog posts:', err);
      res.status(500).json({ error: 'Failed to retrieve blog articles' });
    }
  });

  // 2. Get single post by slug (handles 301 redirects)
  router.get('/posts/slug/:slug', async (req, res) => {
    try {
      const slug = req.params.slug.trim().toLowerCase();

      // Check if redirect exists for this slug
      const testUrl1 = `/blog/${slug}`;
      const [redirects]: any = await mysqlPool.execute(
        'SELECT destination_url, status_code FROM blog_redirects WHERE source_url = ? AND is_active = TRUE LIMIT 1',
        [testUrl1]
      );
      if (redirects && redirects.length > 0) {
        return res.json({
          redirect: {
            destination: redirects[0].destination_url,
            status: redirects[0].status_code || 301
          }
        });
      }

      const [posts]: any = await mysqlPool.execute(
        `SELECT 
          p.*,
          c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.description as cat_desc,
          a.id as auth_id, a.name as auth_name, a.slug as auth_slug, a.avatar_url as auth_avatar, a.bio as auth_bio, a.designation as auth_designation, a.credentials as auth_credentials, a.social_links as auth_social,
          r.id as rev_id, r.name as rev_name, r.slug as rev_slug, r.avatar_url as rev_avatar, r.bio as rev_bio, r.designation as rev_designation, r.credentials as rev_credentials, r.social_links as rev_social,
          pil.id as pillar_id, pil.title as pillar_title, pil.slug as pillar_slug
         FROM blog_posts p
         LEFT JOIN blog_categories c ON p.category_id = c.id
         LEFT JOIN blog_authors a ON p.author_id = a.id
         LEFT JOIN blog_reviewers r ON p.reviewer_id = r.id
         LEFT JOIN blog_posts pil ON p.pillar_article_id = pil.id
         WHERE p.slug = ? AND p.status = 'published' AND (p.published_at <= NOW() OR p.published_at IS NULL)
         LIMIT 1`,
        [slug]
      );

      if (!posts || posts.length === 0) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const raw = posts[0];

      // Parse JSON fields safely
      const parseJsonSafe = (val: any, fallback: any) => {
        if (!val) return fallback;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch { return fallback; }
      };

      // Fetch related posts if any
      let relatedPosts: any[] = [];
      const relatedIds = parseJsonSafe(raw.related_post_ids, []);
      if (Array.isArray(relatedIds) && relatedIds.length > 0) {
        const placeholders = relatedIds.map(() => '?').join(',');
        const [relRows]: any = await mysqlPool.query(
          `SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image_url, c.name as category_name, c.slug as category_slug
           FROM blog_posts p
           LEFT JOIN blog_categories c ON p.category_id = c.id
           WHERE p.id IN (${placeholders}) AND p.status = 'published'
           LIMIT 4`,
          relatedIds
        );
        relatedPosts = relRows.map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          featured_image_url: r.featured_image_url,
          category: r.category_name ? { name: r.category_name, slug: r.category_slug } : null
        }));
      }

      // If less than 3 manual related posts, automatically supplement with posts from same category
      if (relatedPosts.length < 3 && raw.category_id) {
        const existingIds = [raw.id, ...relatedPosts.map(r => r.id)];
        const placeholders = existingIds.map(() => '?').join(',');
        const needed = 3 - relatedPosts.length;
        const [autoRel]: any = await mysqlPool.query(
          `SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image_url, c.name as category_name, c.slug as category_slug
           FROM blog_posts p
           LEFT JOIN blog_categories c ON p.category_id = c.id
           WHERE p.category_id = ? AND p.id NOT IN (${placeholders}) AND p.status = 'published'
           ORDER BY p.published_at DESC
           LIMIT ?`,
          [raw.category_id, ...existingIds, needed]
        );
        autoRel.forEach((r: any) => {
          relatedPosts.push({
            id: r.id,
            title: r.title,
            slug: r.slug,
            excerpt: r.excerpt,
            featured_image_url: r.featured_image_url,
            category: r.category_name ? { name: r.category_name, slug: r.category_slug } : null
          });
        });
      }

      const postData = {
        id: raw.id,
        title: raw.title,
        slug: raw.slug,
        excerpt: raw.excerpt,
        content: raw.content,
        featured_image_url: raw.featured_image_url,
        featured_image_alt: raw.featured_image_alt,
        featured_image_caption: raw.featured_image_caption,
        status: raw.status,
        content_type: raw.content_type,
        category_id: raw.category_id,
        author_id: raw.author_id,
        reviewer_id: raw.reviewer_id,
        pillar_article_id: raw.pillar_article_id,
        cluster_name: raw.cluster_name,
        is_featured: Boolean(raw.is_featured),
        direct_answer_question: raw.direct_answer_question,
        direct_answer_text: raw.direct_answer_text,
        key_takeaways: parseJsonSafe(raw.key_takeaways, []),
        important_note: parseJsonSafe(raw.important_note, null),
        faqs: parseJsonSafe(raw.faqs, []),
        sources: parseJsonSafe(raw.sources, []),
        cta: parseJsonSafe(raw.cta, null),
        seo_title: raw.seo_title || raw.title,
        meta_description: raw.meta_description || raw.excerpt,
        canonical_url: raw.canonical_url || `https://sebsinstitute.com/blog/${raw.slug}`,
        primary_keyword: raw.primary_keyword,
        search_intent: raw.search_intent,
        robots_index: Boolean(raw.robots_index),
        robots_follow: Boolean(raw.robots_follow),
        og_title: raw.og_title || raw.seo_title || raw.title,
        og_description: raw.og_description || raw.meta_description || raw.excerpt,
        og_image_url: raw.og_image_url || raw.featured_image_url,
        published_at: raw.published_at,
        updated_at: raw.updated_at,
        last_reviewed_at: raw.last_reviewed_at,
        category: raw.cat_id ? {
          id: raw.cat_id,
          name: raw.cat_name,
          slug: raw.cat_slug,
          description: raw.cat_desc
        } : null,
        author: raw.auth_id ? {
          id: raw.auth_id,
          name: raw.auth_name,
          slug: raw.auth_slug,
          avatar_url: raw.auth_avatar,
          bio: raw.auth_bio,
          designation: raw.auth_designation,
          credentials: raw.auth_credentials,
          social_links: parseJsonSafe(raw.auth_social, {})
        } : null,
        reviewer: raw.rev_id ? {
          id: raw.rev_id,
          name: raw.rev_name,
          slug: raw.rev_slug,
          avatar_url: raw.rev_avatar,
          bio: raw.rev_bio,
          designation: raw.rev_designation,
          credentials: raw.rev_credentials,
          social_links: parseJsonSafe(raw.rev_social, {})
        } : null,
        pillar: raw.pillar_id ? {
          id: raw.pillar_id,
          title: raw.pillar_title,
          slug: raw.pillar_slug
        } : null,
        related_posts: relatedPosts
      };

      res.json(postData);
    } catch (err: any) {
      console.error('Error fetching post by slug:', err);
      res.status(500).json({ error: 'Failed to retrieve article' });
    }
  });

  // 3. Get all active categories with post counts
  router.get('/categories', async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query(
        `SELECT c.*, COUNT(p.id) as post_count
         FROM blog_categories c
         LEFT JOIN blog_posts p ON c.id = p.category_id AND p.status = 'published'
         WHERE c.is_active = TRUE
         GROUP BY c.id
         ORDER BY c.sort_order ASC, c.name ASC`
      );
      res.json(rows.map((r: any) => ({
        ...r,
        is_active: Boolean(r.is_active),
        post_count: Number(r.post_count || 0)
      })));
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  });

  // 4. Get single category by slug
  router.get('/categories/:slug', async (req, res) => {
    try {
      const slug = req.params.slug.trim().toLowerCase();
      const [rows]: any = await mysqlPool.execute(
        `SELECT c.*, COUNT(p.id) as post_count
         FROM blog_categories c
         LEFT JOIN blog_posts p ON c.id = p.category_id AND p.status = 'published'
         WHERE c.slug = ? AND c.is_active = TRUE
         GROUP BY c.id
         LIMIT 1`,
        [slug]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({
        ...rows[0],
        is_active: Boolean(rows[0].is_active),
        post_count: Number(rows[0].post_count || 0)
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve category' });
    }
  });

  // 5. Get all active authors
  router.get('/authors', async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query(
        `SELECT a.*, COUNT(p.id) as post_count
         FROM blog_authors a
         LEFT JOIN blog_posts p ON a.id = p.author_id AND p.status = 'published'
         WHERE a.is_active = TRUE
         GROUP BY a.id
         ORDER BY a.name ASC`
      );
      res.json(rows.map((r: any) => ({
        ...r,
        is_active: Boolean(r.is_active),
        social_links: typeof r.social_links === 'string' ? JSON.parse(r.social_links || '{}') : r.social_links || {}
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve authors' });
    }
  });

  // 6. Get single author by slug
  router.get('/authors/:slug', async (req, res) => {
    try {
      const slug = req.params.slug.trim().toLowerCase();
      const [rows]: any = await mysqlPool.execute(
        `SELECT a.*, COUNT(p.id) as post_count
         FROM blog_authors a
         LEFT JOIN blog_posts p ON a.id = p.author_id AND p.status = 'published'
         WHERE a.slug = ? AND a.is_active = TRUE
         GROUP BY a.id
         LIMIT 1`,
        [slug]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Author not found' });
      }
      const raw = rows[0];
      res.json({
        ...raw,
        is_active: Boolean(raw.is_active),
        social_links: typeof raw.social_links === 'string' ? JSON.parse(raw.social_links || '{}') : raw.social_links || {}
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve author' });
    }
  });

  // 7. Get public blog settings
  router.get('/settings', async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query('SELECT setting_key, setting_value FROM blog_settings');
      const settingsMap: any = {
        blog_title: "SEB's Institute Academic Blog & IELTS Research",
        blog_description: "Authoritative IELTS preparation guides, speaking cue cards, band 9 writing templates, and English linguistics heuristics by Syed Ejaz Bukhari.",
        default_seo_title: "IELTS & English Learning Blog | SEB's Institute",
        default_meta_description: "Master IELTS Band 8.5+ with expert linguistic frameworks, speaking cue card drills, and writing templates evaluated by Syed Ejaz Bukhari.",
        default_og_image: "/ielts_prep_banner_960.webp",
        posts_per_page: 9
      };
      if (rows && rows.length > 0) {
        rows.forEach((r: any) => {
          if (r.setting_key === 'posts_per_page') {
            settingsMap[r.setting_key] = parseInt(r.setting_value) || 9;
          } else {
            settingsMap[r.setting_key] = r.setting_value;
          }
        });
      }
      res.json(settingsMap);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load blog settings' });
    }
  });

  // ==========================================
  // ADMIN ROUTES (Protected by requireAdmin)
  // ==========================================

  // Admin Dashboard stats
  router.get('/admin/stats', requireAdmin, async (_req, res) => {
    try {
      const [postStats]: any = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_posts,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts,
          SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_posts,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_posts,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_posts
        FROM blog_posts
      `);

      const [catCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM blog_categories');
      const [authorCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM blog_authors');
      const [reviewerCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM blog_reviewers');
      const [redirectCount]: any = await mysqlPool.query('SELECT COUNT(*) as cnt FROM blog_redirects');

      const s = postStats[0] || {};
      res.json({
        total_posts: Number(s.total_posts || 0),
        published_posts: Number(s.published_posts || 0),
        draft_posts: Number(s.draft_posts || 0),
        pending_posts: Number(s.pending_posts || 0),
        scheduled_posts: Number(s.scheduled_posts || 0),
        archived_posts: Number(s.archived_posts || 0),
        total_categories: Number(catCount[0]?.cnt || 0),
        total_authors: Number(authorCount[0]?.cnt || 0),
        total_reviewers: Number(reviewerCount[0]?.cnt || 0),
        total_redirects: Number(redirectCount[0]?.cnt || 0)
      });
    } catch (err: any) {
      console.error('Error fetching admin blog stats:', err);
      res.status(500).json({ error: 'Failed to load dashboard statistics' });
    }
  });

  // Admin: Get all posts with filtering and pagination
  router.get('/admin/posts', requireAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;
      const status = (req.query.status as string || '').trim();
      const categoryId = (req.query.category_id as string || '').trim();
      const authorId = (req.query.author_id as string || '').trim();
      const search = (req.query.search as string || '').trim();

      let whereConditions: string[] = ['1=1'];
      const params: any[] = [];

      if (status) {
        whereConditions.push('p.status = ?');
        params.push(status);
      }

      if (categoryId) {
        whereConditions.push('p.category_id = ?');
        params.push(categoryId);
      }

      if (authorId) {
        whereConditions.push('p.author_id = ?');
        params.push(authorId);
      }

      if (search) {
        whereConditions.push('(p.title LIKE ? OR p.slug LIKE ? OR p.excerpt LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      const [countRows]: any = await mysqlPool.query(
        `SELECT COUNT(*) as total FROM blog_posts p WHERE ${whereClause}`,
        params
      );
      const total = countRows[0]?.total || 0;

      const [posts]: any = await mysqlPool.query(
        `SELECT 
          p.id, p.title, p.slug, p.status, p.content_type, p.is_featured,
          p.published_at, p.scheduled_at, p.created_at, p.updated_at, p.last_reviewed_at,
          c.id as category_id, c.name as category_name, c.slug as category_slug,
          a.id as author_id, a.name as author_name,
          r.id as reviewer_id, r.name as reviewer_name
         FROM blog_posts p
         LEFT JOIN blog_categories c ON p.category_id = c.id
         LEFT JOIN blog_authors a ON p.author_id = a.id
         LEFT JOIN blog_reviewers r ON p.reviewer_id = r.id
         WHERE ${whereClause}
         ORDER BY p.updated_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      res.json({
        posts: posts.map((p: any) => ({
          ...p,
          is_featured: Boolean(p.is_featured),
          category: p.category_id ? { id: p.category_id, name: p.category_name, slug: p.category_slug } : null,
          author: p.author_id ? { id: p.author_id, name: p.author_name } : null,
          reviewer: p.reviewer_id ? { id: p.reviewer_id, name: p.reviewer_name } : null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      console.error('Error fetching admin posts:', err);
      res.status(500).json({ error: 'Failed to load posts' });
    }
  });

  // Admin: Get single post for editing (or preview)
  router.get('/admin/posts/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [rows]: any = await mysqlPool.execute(
        `SELECT p.*,
          c.name as cat_name, c.slug as cat_slug,
          a.name as auth_name,
          r.name as rev_name
         FROM blog_posts p
         LEFT JOIN blog_categories c ON p.category_id = c.id
         LEFT JOIN blog_authors a ON p.author_id = a.id
         LEFT JOIN blog_reviewers r ON p.reviewer_id = r.id
         WHERE p.id = ? LIMIT 1`,
        [id]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const p = rows[0];
      const parseJsonSafe = (val: any, fallback: any) => {
        if (!val) return fallback;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch { return fallback; }
      };

      res.json({
        ...p,
        is_featured: Boolean(p.is_featured),
        robots_index: Boolean(p.robots_index),
        robots_follow: Boolean(p.robots_follow),
        key_takeaways: parseJsonSafe(p.key_takeaways, []),
        important_note: parseJsonSafe(p.important_note, null),
        faqs: parseJsonSafe(p.faqs, []),
        sources: parseJsonSafe(p.sources, []),
        related_post_ids: parseJsonSafe(p.related_post_ids, []),
        cta: parseJsonSafe(p.cta, null),
        category: p.category_id ? { id: p.category_id, name: p.cat_name, slug: p.cat_slug } : null,
        author: p.author_id ? { id: p.author_id, name: p.auth_name } : null,
        reviewer: p.reviewer_id ? { id: p.reviewer_id, name: p.rev_name } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve post details' });
    }
  });

  // Helper function to sanitize and enforce clean slug
  const formatSlug = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Admin: Create new post
  router.post('/admin/posts', requireAdmin, async (req: any, res) => {
    try {
      const body = req.body || {};
      const title = (body.title || '').trim();
      if (!title) {
        return res.status(400).json({ error: 'Post title is required' });
      }

      let slug = formatSlug(body.slug || title);
      if (!slug) {
        slug = `post-${Date.now()}`;
      }

      // Check if slug is unique
      const [existingSlug]: any = await mysqlPool.execute('SELECT id FROM blog_posts WHERE slug = ? LIMIT 1', [slug]);
      if (existingSlug && existingSlug.length > 0) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const id = `post_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const status = body.status || 'draft';
      const contentType = body.content_type || 'cluster';

      const stringifySafe = (val: any) => (val ? JSON.stringify(val) : null);

      await mysqlPool.execute(
        `INSERT INTO blog_posts (
          id, title, slug, excerpt, content, content_json, featured_image_url, featured_image_alt,
          featured_image_caption, status, content_type, category_id, author_id, reviewer_id,
          pillar_article_id, cluster_name, is_featured, direct_answer_question, direct_answer_text,
          key_takeaways, important_note, faqs, sources, related_post_ids, cta,
          seo_title, meta_description, canonical_url, primary_keyword, search_intent,
          robots_index, robots_follow, og_title, og_description, og_image_url,
          published_at, scheduled_at, last_reviewed_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?
        )`,
        [
          id,
          title,
          slug,
          body.excerpt || null,
          body.content || '',
          body.content_json || null,
          body.featured_image_url || null,
          body.featured_image_alt || null,
          body.featured_image_caption || null,
          status,
          contentType,
          body.category_id || null,
          body.author_id || null,
          body.reviewer_id || null,
          body.pillar_article_id || null,
          body.cluster_name || null,
          body.is_featured ? 1 : 0,
          body.direct_answer_question || null,
          body.direct_answer_text || null,
          stringifySafe(body.key_takeaways),
          stringifySafe(body.important_note),
          stringifySafe(body.faqs),
          stringifySafe(body.sources),
          stringifySafe(body.related_post_ids),
          stringifySafe(body.cta),
          body.seo_title || null,
          body.meta_description || null,
          body.canonical_url || null,
          body.primary_keyword || null,
          body.search_intent || null,
          body.robots_index !== false ? 1 : 0,
          body.robots_follow !== false ? 1 : 0,
          body.og_title || null,
          body.og_description || null,
          body.og_image_url || null,
          status === 'published' ? (body.published_at ? new Date(body.published_at) : new Date()) : (body.published_at ? new Date(body.published_at) : null),
          body.scheduled_at ? new Date(body.scheduled_at) : null,
          body.last_reviewed_at ? new Date(body.last_reviewed_at) : null
        ]
      );

      // Create initial revision
      const revisionId = `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await mysqlPool.execute(
        `INSERT INTO blog_revisions (id, post_id, title, content, content_json, excerpt, seo_data, status, changed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          revisionId,
          id,
          title,
          body.content || '',
          body.content_json || null,
          body.excerpt || null,
          JSON.stringify({ seo_title: body.seo_title, meta_description: body.meta_description, slug }),
          status,
          req.adminUser.email
        ]
      );

      res.status(201).json({ id, slug, message: 'Article created successfully' });
    } catch (err: any) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: err.message || 'Failed to create article' });
    }
  });

  // Admin: Update existing post (handles revisions and automatic 301 redirects)
  router.put('/admin/posts/:id', requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const body = req.body || {};

      // Retrieve current post state
      const [currentRows]: any = await mysqlPool.execute('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [id]);
      if (!currentRows || currentRows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const current = currentRows[0];

      const title = (body.title || current.title).trim();
      let newSlug = formatSlug(body.slug || current.slug);

      // If slug changed, verify uniqueness
      if (newSlug !== current.slug) {
        const [existingSlug]: any = await mysqlPool.execute('SELECT id FROM blog_posts WHERE slug = ? AND id != ? LIMIT 1', [newSlug, id]);
        if (existingSlug && existingSlug.length > 0) {
          return res.status(400).json({ error: `The slug "${newSlug}" is already in use by another article` });
        }

        // Automatic 301 redirect creation for published articles! (Section 7)
        if (current.status === 'published') {
          const oldUrl = `/blog/${current.slug}`;
          const newUrl = `/blog/${newSlug}`;
          const redirectId = `redir_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          try {
            await mysqlPool.execute(
              `INSERT INTO blog_redirects (id, source_url, destination_url, status_code, is_active)
               VALUES (?, ?, ?, 301, TRUE)
               ON DUPLICATE KEY UPDATE destination_url = VALUES(destination_url), is_active = TRUE`,
              [redirectId, oldUrl, newUrl]
            );
            console.log(`[Blog 301 Redirect Created] ${oldUrl} -> ${newUrl}`);
          } catch (rErr) {
            console.warn('Could not auto-create 301 redirect:', rErr);
          }
        }
      }

      const stringifySafe = (val: any) => (val !== undefined ? (val ? JSON.stringify(val) : null) : undefined);

      const status = body.status !== undefined ? body.status : current.status;
      let publishedAt = current.published_at;
      if (status === 'published' && !current.published_at) {
        publishedAt = body.published_at ? new Date(body.published_at) : new Date();
      } else if (body.published_at !== undefined) {
        publishedAt = body.published_at ? new Date(body.published_at) : null;
      }

      await mysqlPool.execute(
        `UPDATE blog_posts SET
          title = ?,
          slug = ?,
          excerpt = ?,
          content = ?,
          content_json = ?,
          featured_image_url = ?,
          featured_image_alt = ?,
          featured_image_caption = ?,
          status = ?,
          content_type = ?,
          category_id = ?,
          author_id = ?,
          reviewer_id = ?,
          pillar_article_id = ?,
          cluster_name = ?,
          is_featured = ?,
          direct_answer_question = ?,
          direct_answer_text = ?,
          key_takeaways = ?,
          important_note = ?,
          faqs = ?,
          sources = ?,
          related_post_ids = ?,
          cta = ?,
          seo_title = ?,
          meta_description = ?,
          canonical_url = ?,
          primary_keyword = ?,
          search_intent = ?,
          robots_index = ?,
          robots_follow = ?,
          og_title = ?,
          og_description = ?,
          og_image_url = ?,
          published_at = ?,
          scheduled_at = ?,
          last_reviewed_at = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          title,
          newSlug,
          body.excerpt !== undefined ? body.excerpt : current.excerpt,
          body.content !== undefined ? body.content : current.content,
          body.content_json !== undefined ? body.content_json : current.content_json,
          body.featured_image_url !== undefined ? body.featured_image_url : current.featured_image_url,
          body.featured_image_alt !== undefined ? body.featured_image_alt : current.featured_image_alt,
          body.featured_image_caption !== undefined ? body.featured_image_caption : current.featured_image_caption,
          status,
          body.content_type !== undefined ? body.content_type : current.content_type,
          body.category_id !== undefined ? body.category_id : current.category_id,
          body.author_id !== undefined ? body.author_id : current.author_id,
          body.reviewer_id !== undefined ? body.reviewer_id : current.reviewer_id,
          body.pillar_article_id !== undefined ? body.pillar_article_id : current.pillar_article_id,
          body.cluster_name !== undefined ? body.cluster_name : current.cluster_name,
          body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : current.is_featured,
          body.direct_answer_question !== undefined ? body.direct_answer_question : current.direct_answer_question,
          body.direct_answer_text !== undefined ? body.direct_answer_text : current.direct_answer_text,
          body.key_takeaways !== undefined ? stringifySafe(body.key_takeaways) : current.key_takeaways,
          body.important_note !== undefined ? stringifySafe(body.important_note) : current.important_note,
          body.faqs !== undefined ? stringifySafe(body.faqs) : current.faqs,
          body.sources !== undefined ? stringifySafe(body.sources) : current.sources,
          body.related_post_ids !== undefined ? stringifySafe(body.related_post_ids) : current.related_post_ids,
          body.cta !== undefined ? stringifySafe(body.cta) : current.cta,
          body.seo_title !== undefined ? body.seo_title : current.seo_title,
          body.meta_description !== undefined ? body.meta_description : current.meta_description,
          body.canonical_url !== undefined ? body.canonical_url : current.canonical_url,
          body.primary_keyword !== undefined ? body.primary_keyword : current.primary_keyword,
          body.search_intent !== undefined ? body.search_intent : current.search_intent,
          body.robots_index !== undefined ? (body.robots_index ? 1 : 0) : current.robots_index,
          body.robots_follow !== undefined ? (body.robots_follow ? 1 : 0) : current.robots_follow,
          body.og_title !== undefined ? body.og_title : current.og_title,
          body.og_description !== undefined ? body.og_description : current.og_description,
          body.og_image_url !== undefined ? body.og_image_url : current.og_image_url,
          publishedAt,
          body.scheduled_at !== undefined ? (body.scheduled_at ? new Date(body.scheduled_at) : null) : current.scheduled_at,
          body.last_reviewed_at !== undefined ? (body.last_reviewed_at ? new Date(body.last_reviewed_at) : null) : current.last_reviewed_at,
          id
        ]
      );

      // Create revision snapshot
      const revisionId = `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await mysqlPool.execute(
        `INSERT INTO blog_revisions (id, post_id, title, content, content_json, excerpt, seo_data, status, changed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          revisionId,
          id,
          title,
          body.content || current.content,
          body.content_json || current.content_json,
          body.excerpt || current.excerpt,
          JSON.stringify({ seo_title: body.seo_title || current.seo_title, meta_description: body.meta_description || current.meta_description, slug: newSlug }),
          status,
          req.adminUser.email
        ]
      );

      res.json({ message: 'Article updated successfully', slug: newSlug });
    } catch (err: any) {
      console.error('Error updating post:', err);
      res.status(500).json({ error: err.message || 'Failed to update article' });
    }
  });

  // Admin: Duplicate article (Section 54)
  router.post('/admin/posts/:id/duplicate', requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const [rows]: any = await mysqlPool.execute('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Source post not found' });
      }
      const orig = rows[0];

      const newId = `post_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const newTitle = `${orig.title} (Copy)`;
      const newSlug = `${orig.slug}-copy-${Date.now().toString().slice(-4)}`;

      await mysqlPool.execute(
        `INSERT INTO blog_posts (
          id, title, slug, excerpt, content, content_json, featured_image_url, featured_image_alt,
          featured_image_caption, status, content_type, category_id, author_id, reviewer_id,
          pillar_article_id, cluster_name, is_featured, direct_answer_question, direct_answer_text,
          key_takeaways, important_note, faqs, sources, related_post_ids, cta,
          seo_title, meta_description, canonical_url, primary_keyword, search_intent,
          robots_index, robots_follow, og_title, og_description, og_image_url
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, 'draft', ?, ?, ?, ?,
          ?, ?, 0, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )`,
        [
          newId,
          newTitle,
          newSlug,
          orig.excerpt,
          orig.content,
          orig.content_json,
          orig.featured_image_url,
          orig.featured_image_alt,
          orig.featured_image_caption,
          orig.content_type,
          orig.category_id,
          orig.author_id,
          orig.reviewer_id,
          orig.pillar_article_id,
          orig.cluster_name,
          orig.direct_answer_question,
          orig.direct_answer_text,
          orig.key_takeaways,
          orig.important_note,
          orig.faqs,
          orig.sources,
          orig.related_post_ids,
          orig.cta,
          orig.seo_title,
          orig.meta_description,
          null, // Reset canonical
          orig.primary_keyword,
          orig.search_intent,
          orig.robots_index,
          orig.robots_follow,
          orig.og_title,
          orig.og_description,
          orig.og_image_url
        ]
      );

      res.status(201).json({ id: newId, slug: newSlug, message: 'Article duplicated as Draft' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to duplicate article' });
    }
  });

  // Admin: Quick Status Update (publish, submit-review, approve, schedule, archive)
  router.post('/admin/posts/:id/status', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { status, scheduled_at } = req.body;
      const validStatuses = ['draft', 'pending_review', 'approved', 'scheduled', 'published', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided' });
      }

      let extraUpdate = '';
      const params: any[] = [status];

      if (status === 'published') {
        extraUpdate = ', published_at = IFNULL(published_at, NOW())';
      } else if (status === 'scheduled') {
        if (!scheduled_at) {
          return res.status(400).json({ error: 'Scheduled date and time required' });
        }
        extraUpdate = ', scheduled_at = ?';
        params.push(new Date(scheduled_at));
      } else if (status === 'archived') {
        extraUpdate = ', archived_at = NOW()';
      }

      params.push(id);
      await mysqlPool.query(`UPDATE blog_posts SET status = ? ${extraUpdate}, updated_at = NOW() WHERE id = ?`, params);
      res.json({ message: `Post status changed to ${status}` });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update post status' });
    }
  });

  // Admin: Delete post (with safety warning & redirect recommendation if published)
  router.delete('/admin/posts/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [rows]: any = await mysqlPool.execute('SELECT title, slug, status FROM blog_posts WHERE id = ? LIMIT 1', [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const post = rows[0];

      // Delete associated revisions
      await mysqlPool.execute('DELETE FROM blog_revisions WHERE post_id = ?', [id]);
      // Delete post
      await mysqlPool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);

      res.json({
        message: `Article "${post.title}" deleted`,
        wasPublished: post.status === 'published',
        slug: post.slug
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  // Admin: View Revisions for a post
  router.get('/admin/posts/:id/revisions', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [rows]: any = await mysqlPool.execute(
        'SELECT id, post_id, title, excerpt, status, changed_by, created_at FROM blog_revisions WHERE post_id = ? ORDER BY created_at DESC LIMIT 30',
        [id]
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve revision history' });
    }
  });

  // Admin: Restore a specific revision
  router.post('/admin/posts/:id/restore-revision/:revisionId', requireAdmin, async (req, res) => {
    try {
      const { id, revisionId } = req.params;
      const [rows]: any = await mysqlPool.execute('SELECT * FROM blog_revisions WHERE id = ? AND post_id = ? LIMIT 1', [revisionId, id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Revision not found' });
      }
      const rev = rows[0];

      await mysqlPool.execute(
        `UPDATE blog_posts SET
          title = ?,
          content = ?,
          content_json = ?,
          excerpt = ?,
          status = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [rev.title, rev.content, rev.content_json, rev.excerpt, rev.status, id]
      );

      res.json({ message: 'Revision successfully restored', restoredTitle: rev.title });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to restore revision' });
    }
  });

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  router.get('/admin/categories', requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query(
        `SELECT c.*, COUNT(p.id) as post_count
         FROM blog_categories c
         LEFT JOIN blog_posts p ON c.id = p.category_id
         GROUP BY c.id
         ORDER BY c.sort_order ASC, c.name ASC`
      );
      res.json(rows.map((r: any) => ({
        ...r,
        is_active: Boolean(r.is_active),
        post_count: Number(r.post_count || 0)
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  });

  router.post('/admin/categories', requireAdmin, async (req, res) => {
    try {
      const { name, slug, description, seo_title, meta_description, canonical_url, featured_image, is_active, sort_order } = req.body;
      if (!name) return res.status(400).json({ error: 'Category name is required' });
      const cleanSlug = formatSlug(slug || name);

      const id = `cat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await mysqlPool.execute(
        `INSERT INTO blog_categories (id, name, slug, description, seo_title, meta_description, canonical_url, featured_image, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), cleanSlug, description || null, seo_title || null, meta_description || null, canonical_url || null, featured_image || null, is_active !== false ? 1 : 0, Number(sort_order) || 0]
      );
      res.status(201).json({ id, message: 'Category created' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create category' });
    }
  });

  router.put('/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { name, slug, description, seo_title, meta_description, canonical_url, featured_image, is_active, sort_order } = req.body;
      const cleanSlug = formatSlug(slug || name);

      await mysqlPool.execute(
        `UPDATE blog_categories SET
          name = ?, slug = ?, description = ?, seo_title = ?, meta_description = ?,
          canonical_url = ?, featured_image = ?, is_active = ?, sort_order = ?, updated_at = NOW()
         WHERE id = ?`,
        [name.trim(), cleanSlug, description || null, seo_title || null, meta_description || null, canonical_url || null, featured_image || null, is_active !== false ? 1 : 0, Number(sort_order) || 0, id]
      );
      res.json({ message: 'Category updated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update category' });
    }
  });

  // Delete category with dependency check (Section 85)
  router.delete('/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [countRows]: any = await mysqlPool.execute('SELECT COUNT(*) as count FROM blog_posts WHERE category_id = ?', [id]);
      const count = countRows[0]?.count || 0;
      if (count > 0) {
        return res.status(400).json({
          error: `Cannot delete category because it contains ${count} active article(s). Please reassign or unpublish the articles first, or deactivate the category instead.`
        });
      }
      await mysqlPool.execute('DELETE FROM blog_categories WHERE id = ?', [id]);
      res.json({ message: 'Category deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // ==========================================
  // AUTHORS & REVIEWERS CRUD
  // ==========================================

  router.get('/admin/authors', requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query(
        `SELECT a.*, COUNT(p.id) as post_count
         FROM blog_authors a
         LEFT JOIN blog_posts p ON a.id = p.author_id
         GROUP BY a.id
         ORDER BY a.name ASC`
      );
      res.json(rows.map((r: any) => ({
        ...r,
        is_active: Boolean(r.is_active),
        post_count: Number(r.post_count || 0),
        social_links: typeof r.social_links === 'string' ? JSON.parse(r.social_links || '{}') : r.social_links || {}
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve authors' });
    }
  });

  router.post('/admin/authors', requireAdmin, async (req, res) => {
    try {
      const { name, slug, avatar_url, bio, designation, credentials, profile_url, social_links, is_active } = req.body;
      if (!name) return res.status(400).json({ error: 'Author name is required' });
      const cleanSlug = formatSlug(slug || name);
      const id = `author_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      await mysqlPool.execute(
        `INSERT INTO blog_authors (id, name, slug, avatar_url, bio, designation, credentials, profile_url, social_links, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), cleanSlug, avatar_url || null, bio || null, designation || null, credentials || null, profile_url || null, social_links ? JSON.stringify(social_links) : null, is_active !== false ? 1 : 0]
      );
      res.status(201).json({ id, message: 'Author created' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create author' });
    }
  });

  router.put('/admin/authors/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { name, slug, avatar_url, bio, designation, credentials, profile_url, social_links, is_active } = req.body;
      const cleanSlug = formatSlug(slug || name);

      await mysqlPool.execute(
        `UPDATE blog_authors SET
          name = ?, slug = ?, avatar_url = ?, bio = ?, designation = ?, credentials = ?,
          profile_url = ?, social_links = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [name.trim(), cleanSlug, avatar_url || null, bio || null, designation || null, credentials || null, profile_url || null, social_links ? JSON.stringify(social_links) : null, is_active !== false ? 1 : 0, id]
      );
      res.json({ message: 'Author updated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update author' });
    }
  });

  router.delete('/admin/authors/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [countRows]: any = await mysqlPool.execute('SELECT COUNT(*) as count FROM blog_posts WHERE author_id = ?', [id]);
      const count = countRows[0]?.count || 0;
      if (count > 0) {
        return res.status(400).json({
          error: `Cannot delete author who has ${count} associated article(s). Please reassign the articles or deactivate the author profile instead.`
        });
      }
      await mysqlPool.execute('DELETE FROM blog_authors WHERE id = ?', [id]);
      res.json({ message: 'Author deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete author' });
    }
  });

  // Reviewers
  router.get('/admin/reviewers', requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query(
        `SELECT r.*, COUNT(p.id) as review_count
         FROM blog_reviewers r
         LEFT JOIN blog_posts p ON r.id = p.reviewer_id
         GROUP BY r.id
         ORDER BY r.name ASC`
      );
      res.json(rows.map((r: any) => ({
        ...r,
        is_active: Boolean(r.is_active),
        review_count: Number(r.review_count || 0),
        social_links: typeof r.social_links === 'string' ? JSON.parse(r.social_links || '{}') : r.social_links || {}
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve reviewers' });
    }
  });

  router.post('/admin/reviewers', requireAdmin, async (req, res) => {
    try {
      const { name, slug, avatar_url, bio, designation, credentials, profile_url, social_links, is_active } = req.body;
      if (!name) return res.status(400).json({ error: 'Reviewer name is required' });
      const cleanSlug = formatSlug(slug || name);
      const id = `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      await mysqlPool.execute(
        `INSERT INTO blog_reviewers (id, name, slug, avatar_url, bio, designation, credentials, profile_url, social_links, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), cleanSlug, avatar_url || null, bio || null, designation || null, credentials || null, profile_url || null, social_links ? JSON.stringify(social_links) : null, is_active !== false ? 1 : 0]
      );
      res.status(201).json({ id, message: 'Reviewer created' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create reviewer' });
    }
  });

  router.put('/admin/reviewers/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { name, slug, avatar_url, bio, designation, credentials, profile_url, social_links, is_active } = req.body;
      const cleanSlug = formatSlug(slug || name);

      await mysqlPool.execute(
        `UPDATE blog_reviewers SET
          name = ?, slug = ?, avatar_url = ?, bio = ?, designation = ?, credentials = ?,
          profile_url = ?, social_links = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [name.trim(), cleanSlug, avatar_url || null, bio || null, designation || null, credentials || null, profile_url || null, social_links ? JSON.stringify(social_links) : null, is_active !== false ? 1 : 0, id]
      );
      res.json({ message: 'Reviewer updated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update reviewer' });
    }
  });

  router.delete('/admin/reviewers/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [countRows]: any = await mysqlPool.execute('SELECT COUNT(*) as count FROM blog_posts WHERE reviewer_id = ?', [id]);
      const count = countRows[0]?.count || 0;
      if (count > 0) {
        return res.status(400).json({
          error: `Cannot delete reviewer who has ${count} reviewed article(s). Please reassign the reviewer or deactivate the profile instead.`
        });
      }
      await mysqlPool.execute('DELETE FROM blog_reviewers WHERE id = ?', [id]);
      res.json({ message: 'Reviewer deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete reviewer' });
    }
  });

  // ==========================================
  // MEDIA LIBRARY
  // ==========================================

  router.get('/admin/media', requireAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
      const offset = (page - 1) * limit;
      const search = (req.query.search as string || '').trim();

      let query = 'SELECT * FROM blog_media';
      const params: any[] = [];
      if (search) {
        query += ' WHERE filename LIKE ? OR original_filename LIKE ? OR alt_text LIKE ? OR title LIKE ?';
        const p = `%${search}%`;
        params.push(p, p, p, p);
      }
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows]: any = await mysqlPool.query(query, params);

      const [countRows]: any = await mysqlPool.query(
        search
          ? 'SELECT COUNT(*) as total FROM blog_media WHERE filename LIKE ? OR original_filename LIKE ? OR alt_text LIKE ? OR title LIKE ?'
          : 'SELECT COUNT(*) as total FROM blog_media',
        search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []
      );

      res.json({
        media: rows,
        pagination: {
          page,
          limit,
          total: countRows[0]?.total || 0,
          totalPages: Math.ceil((countRows[0]?.total || 0) / limit)
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load media items' });
    }
  });

  router.post('/admin/media/upload', requireAdmin, upload.single('file') as any, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const file = req.file;
      const id = `media_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const fileUrl = `/uploads/blog/${file.filename}`;
      const altText = (req.body.alt_text || '').trim();
      const title = (req.body.title || file.originalname).trim();

      await mysqlPool.execute(
        `INSERT INTO blog_media (id, filename, original_filename, file_url, mime_type, file_size, alt_text, title, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, file.filename, file.originalname, fileUrl, file.mimetype, file.size, altText, title, req.adminUser.email]
      );

      res.status(201).json({
        id,
        filename: file.filename,
        original_filename: file.originalname,
        file_url: fileUrl,
        alt_text: altText,
        title,
        message: 'Media uploaded successfully'
      });
    } catch (err: any) {
      console.error('Media upload error:', err);
      res.status(500).json({ error: err.message || 'File upload failed' });
    }
  });

  router.put('/admin/media/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { alt_text, title, caption } = req.body;
      await mysqlPool.execute(
        'UPDATE blog_media SET alt_text = ?, title = ?, caption = ? WHERE id = ?',
        [alt_text || '', title || '', caption || '', id]
      );
      res.json({ message: 'Media metadata updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update media item' });
    }
  });

  // Delete media with usage warning check (Section 87)
  router.delete('/admin/media/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const [rows]: any = await mysqlPool.execute('SELECT filename, file_url FROM blog_media WHERE id = ? LIMIT 1', [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Media not found' });
      }
      const item = rows[0];

      // Check if image is used as featured image in any published posts
      const [usedRows]: any = await mysqlPool.execute(
        'SELECT id, title FROM blog_posts WHERE featured_image_url = ? LIMIT 5',
        [item.file_url]
      );
      if (usedRows && usedRows.length > 0) {
        const titles = usedRows.map((u: any) => `"${u.title}"`).join(', ');
        return res.status(400).json({
          error: `This image is actively referenced as the featured image in ${usedRows.length} post(s): ${titles}. Please replace the image in those articles before deleting.`
        });
      }

      // Delete file from disk if exists
      const filePath = path.join(uploadDir, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await mysqlPool.execute('DELETE FROM blog_media WHERE id = ?', [id]);
      res.json({ message: 'Media item deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete media' });
    }
  });

  // ==========================================
  // REDIRECTS MANAGEMENT (Section 7 & 72)
  // ==========================================

  router.get('/admin/redirects', requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query('SELECT * FROM blog_redirects ORDER BY created_at DESC LIMIT 200');
      res.json(rows.map((r: any) => ({
        ...r,
        is_active: Boolean(r.is_active)
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load redirects' });
    }
  });

  router.post('/admin/redirects', requireAdmin, async (req, res) => {
    try {
      let { source_url, destination_url, status_code, is_active } = req.body;
      if (!source_url || !destination_url) {
        return res.status(400).json({ error: 'Source and destination URLs are required' });
      }

      source_url = source_url.trim();
      destination_url = destination_url.trim();

      // Ensure proper leading slash if relative
      if (!source_url.startsWith('/') && !source_url.startsWith('http')) {
        source_url = `/${source_url}`;
      }
      if (!destination_url.startsWith('/') && !destination_url.startsWith('http')) {
        destination_url = `/${destination_url}`;
      }

      // Prevent redirect loop (source = destination)
      if (source_url === destination_url) {
        return res.status(400).json({ error: 'Source URL and Destination URL cannot be identical (would cause redirect loop)' });
      }

      const id = `redir_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await mysqlPool.execute(
        `INSERT INTO blog_redirects (id, source_url, destination_url, status_code, is_active)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE destination_url = VALUES(destination_url), status_code = VALUES(status_code), is_active = VALUES(is_active)`,
        [id, source_url, destination_url, Number(status_code) || 301, is_active !== false ? 1 : 0]
      );
      res.status(201).json({ id, message: 'Redirect created/updated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create redirect' });
    }
  });

  router.delete('/admin/redirects/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      await mysqlPool.execute('DELETE FROM blog_redirects WHERE id = ?', [id]);
      res.json({ message: 'Redirect rule deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete redirect rule' });
    }
  });

  // ==========================================
  // BLOG SETTINGS (Admin)
  // ==========================================

  router.get('/admin/settings', requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await mysqlPool.query('SELECT setting_key, setting_value FROM blog_settings');
      const settingsMap: any = {};
      rows.forEach((r: any) => {
        settingsMap[r.setting_key] = r.setting_value;
      });
      res.json(settingsMap);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  router.post('/admin/settings', requireAdmin, async (req, res) => {
    try {
      const settings = req.body || {};
      for (const [key, val] of Object.entries(settings)) {
        const id = `set_${key}`;
        await mysqlPool.execute(
          `INSERT INTO blog_settings (id, setting_key, setting_value)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [id, key, String(val)]
        );
      }
      res.json({ message: 'Blog settings saved successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  return router;
}
