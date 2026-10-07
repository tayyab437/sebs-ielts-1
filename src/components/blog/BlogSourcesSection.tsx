import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import type { BlogSource } from '../../types/blog';

interface BlogSourcesSectionProps {
  sources: BlogSource[];
}

export const BlogSourcesSection: React.FC<BlogSourcesSectionProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="my-8 p-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl text-left">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider mb-4">
        <BookOpen className="w-4 h-4 text-primary shrink-0" />
        <span>References & Citations</span>
      </div>

      <ol className="space-y-3 list-decimal list-inside text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
        {sources.map((src, idx) => (
          <li key={idx} className="leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-white mr-1">{src.title}</span>
            {src.publisher && <span className="text-slate-500 italic mr-1">({src.publisher}{src.date ? `, ${src.date}` : ''})</span>}
            {src.url && (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary font-bold hover:underline ml-1.5"
              >
                <span>View Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};
