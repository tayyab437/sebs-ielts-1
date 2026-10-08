import React, { useState } from 'react';
import { BlogDashboardTab } from './BlogDashboardTab';
import { BlogPostListTab } from './BlogPostListTab';
import { BlogPostEditorTab } from './BlogPostEditorTab';
import { BlogCategoriesTab } from './BlogCategoriesTab';
import { BlogSeoAuditsTab } from './BlogSeoAuditsTab';
import { BlogRedirectsTab } from './BlogRedirectsTab';
import { 
  FileText, 
  Layers, 
  Plus, 
  BarChart3, 
  ShieldAlert, 
  ArrowLeft, 
  Globe2, 
  ExternalLink 
} from 'lucide-react';

export const BlogManager: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'posts' | 'editor' | 'categories' | 'audits' | 'redirects'>('overview');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setActiveView('editor');
  };

  const handleCreateNew = () => {
    setEditingPostId(null);
    setActiveView('editor');
  };

  const handleBackToList = () => {
    setEditingPostId(null);
    setActiveView('posts');
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Navigation Bar for Blog CMS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          {activeView === 'editor' && (
            <button
              type="button"
              onClick={handleBackToList}
              className="mr-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Back to Article List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>SEO-First Blog & Content Management</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Publish human-researched IELTS resources with technical SEO and E-E-A-T compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <span>Live Blog</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Subtab Switcher */}
      {activeView !== 'editor' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-white/5 scrollbar-none">
          {[
            { id: 'overview', label: 'Dashboard & Metrics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'posts', label: 'All Articles', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'categories', label: 'Topic Clusters & Categories', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'audits', label: 'SEO Health & Audits', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
            { id: 'redirects', label: '301 Redirect Rules', icon: <Globe2 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                activeView === tab.id
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-primary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Subtab View Rendering */}
      <div>
        {activeView === 'overview' && (
          <BlogDashboardTab
            onNavigate={(view) => {
              if (view === 'create') handleCreateNew();
              else if (view === 'posts') setActiveView('posts');
              else if (view === 'categories') setActiveView('categories');
              else if (view === 'audits') setActiveView('audits');
            }}
          />
        )}

        {activeView === 'posts' && (
          <BlogPostListTab
            onEditPost={handleEditPost}
            onCreateNew={handleCreateNew}
          />
        )}

        {activeView === 'editor' && (
          <BlogPostEditorTab
            postId={editingPostId}
            onBackToList={handleBackToList}
            onPostSaved={() => {
              // Stay in editor or can go back to list
            }}
          />
        )}

        {activeView === 'categories' && <BlogCategoriesTab />}

        {activeView === 'audits' && <BlogSeoAuditsTab onEditPost={handleEditPost} />}

        {activeView === 'redirects' && <BlogRedirectsTab />}
      </div>
    </div>
  );
};
