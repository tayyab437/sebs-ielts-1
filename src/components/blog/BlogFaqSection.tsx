import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { BlogFaq } from '../../types/blog';

interface BlogFaqSectionProps {
  faqs: BlogFaq[];
}

export const BlogFaqSection: React.FC<BlogFaqSectionProps> = ({ faqs }) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  if (!faqs || faqs.length === 0) return null;

  const toggle = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className="my-10 p-6 sm:p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl text-left shadow-sm">
      <div className="flex items-center gap-2.5 text-primary font-black text-xs uppercase tracking-wider mb-2">
        <HelpCircle className="w-4 h-4 text-primary shrink-0" />
        <span>Frequently Asked Questions</span>
      </div>

      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
        Questions & Expert Answers
      </h3>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-sm sm:text-base hover:text-primary transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 font-medium">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
