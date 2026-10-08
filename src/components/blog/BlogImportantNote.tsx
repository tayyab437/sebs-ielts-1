import React from 'react';
import { AlertCircle, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import type { BlogImportantNote as BlogImportantNoteType } from '../../types/blog';

interface BlogImportantNoteProps {
  note: BlogImportantNoteType | string;
}

export const BlogImportantNote: React.FC<BlogImportantNoteProps> = ({ note }) => {
  if (!note) return null;
  const noteObj: BlogImportantNoteType = typeof note === 'string' 
    ? { title: 'Important Note', content: note, type: 'Important' } 
    : note;

  if (!noteObj.title && !noteObj.content) return null;

  const type = noteObj.type || 'Important';

  const styles = {
    Note: {
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-300 dark:border-sky-800',
      text: 'text-sky-900 dark:text-sky-300',
      icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
    },
    Important: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-300',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
    },
    Warning: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-300 dark:border-rose-800',
      text: 'text-rose-900 dark:text-rose-300',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
    },
    Tip: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-300',
      icon: <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    }
  }[type];

  return (
    <aside className={`my-8 p-6 ${styles.bg} border-l-4 ${styles.border} rounded-2xl shadow-sm text-left`}>
      <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-wider">
        {styles.icon}
        <span className={styles.text}>{noteObj.title || type}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed pl-7">
        {noteObj.content}
      </p>
    </aside>
  );
};
