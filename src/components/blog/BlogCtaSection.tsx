import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { BlogCta } from '../../types/blog';

interface BlogCtaSectionProps {
  cta?: BlogCta | null;
}

export const BlogCtaSection: React.FC<BlogCtaSectionProps> = ({ cta }) => {
  if (!cta || !cta.enabled) return null;

  return (
    <aside className="my-10 p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl shadow-2xl relative overflow-hidden text-left border border-white/10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Master Classes & Coaching</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          {cta.heading || 'Ready to Achieve Band 8.5+ in IELTS?'}
        </h3>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
          {cta.description || 'Train directly under Syed Ejaz Bukhari. Get personalized essay evaluation, live speaking cue card mock tests, and verified preparation roadmaps.'}
        </p>

        <div className="pt-2">
          <Link
            to={cta.buttonUrl || '/courses'}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:gap-3 cursor-pointer border-none"
          >
            <span>{cta.buttonText || 'Explore Courses'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
