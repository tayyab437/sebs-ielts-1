import React, { useEffect, useState } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number; // 2 for H2, 3 for H3
}

interface BlogTableOfContentsProps {
  contentHtml: string;
}

export const BlogTableOfContents: React.FC<BlogTableOfContentsProps> = ({ contentHtml }) => {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  useEffect(() => {
    if (!contentHtml) return;

    // Parse content DOM to find H2 and H3 tags and inject IDs
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const nodes = doc.querySelectorAll('h2, h3');

    const items: TocItem[] = [];
    nodes.forEach((node, index) => {
      const text = node.textContent || `Section ${index + 1}`;
      const slug = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const id = slug || `section-${index + 1}`;

      // Update actual DOM headings on screen
      const el = document.getElementById(id) || document.querySelector(`[data-heading="${id}"]`);
      if (el) {
        el.id = id;
      }

      items.push({
        id,
        text,
        level: node.tagName.toLowerCase() === 'h2' ? 2 : 3
      });
    });

    setHeadings(items);
  }, [contentHtml]);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    headings.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100; // Account for fixed header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <nav
      aria-label="Table of contents"
      className="my-8 p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider">
          <List className="w-4 h-4 text-primary" />
          <span>Table of Contents</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="sm:hidden text-xs font-bold text-slate-500 flex items-center gap-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <span>{isOpenMobile ? 'Hide' : 'Show'}</span>
          {isOpenMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <ol className={`mt-4 space-y-2 text-xs font-bold transition-all ${isOpenMobile ? 'block' : 'hidden sm:block'}`}>
        {headings.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id} className={item.level === 3 ? 'pl-4' : 'pl-0'}>
              <button
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={`text-left w-full transition-colors leading-relaxed hover:text-primary flex items-start gap-2 ${
                  isActive
                    ? 'text-primary font-black scale-[1.01]'
                    : 'text-slate-600 dark:text-slate-400 font-medium'
                }`}
              >
                <span className="text-primary/60 shrink-0 select-none">•</span>
                <span className="line-clamp-2">{item.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
