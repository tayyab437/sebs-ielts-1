import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, Award, Calendar, CheckCircle2 } from 'lucide-react';
import type { BlogAuthor, BlogReviewer } from '../../types/blog';

interface BlogAuthorBoxProps {
  author?: BlogAuthor | null;
  reviewer?: BlogReviewer | null;
  publishedDate?: string;
  updatedDate?: string;
  lastReviewedDate?: string;
}

export const BlogAuthorBox: React.FC<BlogAuthorBoxProps> = ({
  author,
  reviewer,
  publishedDate,
  updatedDate,
  lastReviewedDate
}) => {
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="my-8 p-6 sm:p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl text-left space-y-6 shadow-sm">
      {/* E-E-A-T Date Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 pb-4 border-b border-slate-200/60 dark:border-white/5">
        {publishedDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Published: {formatDate(publishedDate)}
          </span>
        )}
        {updatedDate && updatedDate !== publishedDate && (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Last Updated: {formatDate(updatedDate)}
          </span>
        )}
        {lastReviewedDate && (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Peer Reviewed: {formatDate(lastReviewedDate)}
          </span>
        )}
      </div>

      {/* Author & Reviewer Side-by-Side or Stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Author */}
        {author ? (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {author.profile_image || (author as any).avatar_url ? (
                <img src={author.profile_image || (author as any).avatar_url} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Written By
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                <Link to={`/blog/author/${author.slug}`} className="hover:text-primary transition-colors">
                  {author.name}
                </Link>
              </h4>
              {(author.credentials || (author as any).designation) && (
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{author.credentials || (author as any).designation}</p>
              )}
              {author.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {author.bio}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Written By
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">Syed Ejaz Bukhari</h4>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Founder & Principal English Mentor • SEBS Institute</p>
            </div>
          </div>
        )}

        {/* Reviewer */}
        {reviewer && (
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-white/5 pt-6 md:pt-0 md:pl-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {reviewer.avatar_url ? (
                <img src={reviewer.avatar_url} alt={reviewer.name} className="w-full h-full object-cover" />
              ) : (
                <Award className="w-7 h-7 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                <ShieldCheck className="w-3 h-3" /> Reviewed & Verified
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                <Link to={`/blog/author/${reviewer.slug}`} className="hover:text-emerald-600 transition-colors">
                  {reviewer.name}
                </Link>
              </h4>
              {reviewer.designation && (
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{reviewer.designation}</p>
              )}
              {reviewer.credentials && (
                <p className="text-[11px] text-slate-500 italic mt-0.5">{reviewer.credentials}</p>
              )}
              {reviewer.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {reviewer.bio}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
