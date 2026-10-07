import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableHeaderExtension from '@tiptap/extension-table-header';
import TableCellExtension from '@tiptap/extension-table-cell';
import UnderlineExtension from '@tiptap/extension-underline';
import PlaceholderExtension from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Table as TableIcon, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Sparkles, AlertCircle, HelpCircle, BookOpen, ExternalLink, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

interface BlogTipTapEditorProps {
  content: string;
  onChange: (htmlContent: string, jsonContent?: string) => void;
  placeholder?: string;
  onOpenMediaLibrary?: (onSelectUrl: (url: string, alt: string) => void) => void;
}

export const BlogTipTapEditor: React.FC<BlogTipTapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write or paste your master article content here...',
  onOpenMediaLibrary
}) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [searchLinkQuery, setSearchLinkQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<Array<{ title: string; slug: string }>>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4]
        }
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary font-bold underline decoration-primary/30 underline-offset-4 hover:decoration-primary'
        }
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-6 shadow-md border border-slate-200 dark:border-white/10'
        }
      }),
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full my-6 border-collapse border border-slate-200 dark:border-slate-800 text-sm'
        }
      }),
      TableRowExtension,
      TableHeaderExtension.configure({
        HTMLAttributes: {
          class: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 font-bold text-left'
        }
      }),
      TableCellExtension.configure({
        HTMLAttributes: {
          class: 'border border-slate-200 dark:border-slate-800 p-3'
        }
      }),
      PlaceholderExtension.configure({
        placeholder
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = JSON.stringify(editor.getJSON());
      onChange(html, json);
    }
  });

  // Sync content if changed externally
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  // Handle internal link search
  useEffect(() => {
    if (!searchLinkQuery.trim()) {
      setLinkSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/blog/posts?search=${encodeURIComponent(searchLinkQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.posts) {
            setLinkSearchResults(data.posts.map((p: any) => ({ title: p.title, slug: `/blog/${p.slug}` })));
          }
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchLinkQuery]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkDialogOpen(true);
  }, [editor]);

  const applyLink = () => {
    if (!editor) return;
    if (linkUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    }
    setLinkDialogOpen(false);
  };

  const addImage = useCallback(() => {
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary((url, alt) => {
        if (editor && url) {
          editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
        }
      });
    } else {
      const url = window.prompt('Enter Image URL');
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, onOpenMediaLibrary]);

  if (!editor) {
    return (
      <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center text-slate-400 font-bold animate-pulse">
        Loading TipTap Rich Text Editor...
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* Editor Toolbar */}
      <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-white/10 p-2.5 flex flex-wrap items-center gap-1">
        {/* Formatting Group */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('bold') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('italic') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('underline') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('strike') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 px-2 rounded-lg font-black text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Heading 2 (Section)"
          >
            H2
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`h-8 px-2 rounded-lg font-black text-xs ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Heading 3 (Sub-section)"
          >
            H3
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={`h-8 px-2 rounded-lg font-black text-xs ${editor.isActive('heading', { level: 4 }) ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Heading 4"
          >
            H4
          </Button>
        </div>

        {/* Lists & Blocks */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('orderedList') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('blockquote') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300"
            title="Divider Line"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Link & Media */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('link') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'}`}
            title="Insert / Edit Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addImage}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:text-primary"
            title="Insert Image (Media Library)"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300"
            title="Insert Data Table"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* History Undo / Redo */}
        <div className="flex items-center gap-0.5 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Main Content Editing Canvas */}
      <div className="p-6 md:p-10 min-h-[420px] max-w-none prose dark:prose-invert prose-slate focus:outline-none font-sans text-slate-800 dark:text-slate-200">
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Insert Hyperlink
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Destination URL
              </label>
              <Input
                placeholder="https://... or /blog/article-slug"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Search Internal SEBS Content
              </label>
              <Input
                placeholder="Type article title to find internal URL..."
                value={searchLinkQuery}
                onChange={(e) => setSearchLinkQuery(e.target.value)}
                className="rounded-xl text-xs"
              />
              {linkSearchResults.length > 0 && (
                <div className="mt-2 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 bg-slate-50 dark:bg-slate-900 max-h-40 overflow-y-auto">
                  {linkSearchResults.map((res) => (
                    <button
                      key={res.slug}
                      type="button"
                      onClick={() => {
                        setLinkUrl(res.slug);
                        setSearchLinkQuery('');
                        setLinkSearchResults([]);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 flex items-center justify-between font-bold text-slate-700 dark:text-slate-200"
                    >
                      <span className="truncate">{res.title}</span>
                      <span className="text-[10px] text-primary shrink-0 ml-2">{res.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={applyLink} className="rounded-xl bg-primary text-white font-bold">
              Apply Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
