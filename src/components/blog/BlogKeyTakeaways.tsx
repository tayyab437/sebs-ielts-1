import React from 'react';
import { Sparkles, Check } from 'lucide-react';

interface BlogKeyTakeawaysProps {
  items: string[];
}

export const BlogKeyTakeaways: React.FC<BlogKeyTakeawaysProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="my-8 p-6 sm:p-7 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 rounded-3xl text-left shadow-sm">
      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-black text-xs uppercase tracking-wider mb-4">
        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
        <span>Key Takeaways</span>
      </div>

      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
