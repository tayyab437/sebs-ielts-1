import React from 'react';
import type { BlogPost } from '../../types/blog';

interface BlogJsonLdProps {
  post: BlogPost;
}

export const BlogJsonLd: React.FC<BlogJsonLdProps> = ({ post }) => {
  const publishedDate = post.published_at ? new Date(post.published_at).toISOString() : new Date().toISOString();
  const modifiedDate = post.updated_at ? new Date(post.updated_at).toISOString() : publishedDate;

  // Article / BlogPosting Schema
  const articleSchema: any = {
    '@context': 'https://schema.org',
    '@type': post.content_type === 'pillar' ? 'Article' : 'BlogPosting',
    headline: post.seo_title || post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image_url ? [`https://sebsinstitute.com${post.featured_image_url}`] : ['https://sebsinstitute.com/ielts_prep_banner_960.webp'],
    datePublished: publishedDate,
    dateModified: modifiedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonical_url || `https://sebsinstitute.com/blog/${post.slug}`
    },
    publisher: {
      '@type': 'Organization',
      name: "SEB's Institute",
      url: 'https://sebsinstitute.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sebsinstitute.com/sebs_official_logo_315.webp'
      }
    }
  };

  if (post.author) {
    articleSchema.author = {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.designation || 'Educator',
      description: post.author.bio,
      url: `https://sebsinstitute.com/blog/author/${post.author.slug}`
    };
  }

  if (post.reviewer) {
    articleSchema.reviewedBy = {
      '@type': 'Person',
      name: post.reviewer.name,
      jobTitle: post.reviewer.designation || 'Master Trainer',
      description: post.reviewer.bio,
      url: `https://sebsinstitute.com/blog/author/${post.reviewer.slug}`
    };
  }

  // FAQPage Schema (Only if FAQs exist)
  let faqSchema: any = null;
  if (Array.isArray(post.faqs) && post.faqs.length > 0) {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
};
