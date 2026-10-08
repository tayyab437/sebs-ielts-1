import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Minus, Table as TableIcon, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Sparkles, HelpCircle, ExternalLink, AlignLeft, AlignCenter, AlignRight,
  Code, Eraser
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [searchLinkQuery, setSearchLinkQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<Array<{ title: string; slug: string }>>([]);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [wordCount, setWordCount] = useState(0);

  // Sync internal HTML with external content prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
      updateWordCount(content || '');
    }
  }, [content]);

  const updateWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    updateWordCount(html);
    onChange(html, JSON.stringify({ type: 'doc', html }));
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  // Internal Link Search
  useEffect(() => {
    if (!searchLinkQuery.trim()) {
      setLinkSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/blog/posts?search=${encodeURIComponent(searchLinkQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.posts)) {
            setLinkSearchResults(data.posts.map((p: any) => ({ title: p.title, slug: `/blog/${p.slug}` })));
          }
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchLinkQuery]);

  const handleOpenLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const applyLink = () => {
    editorRef.current?.focus();
    if (!linkUrl.trim()) {
      document.execCommand('unlink', false);
    } else {
      const selected = window.getSelection()?.toString();
      if (!selected && linkText.trim()) {
        const linkHtml = `<a href="${linkUrl.trim()}" class="text-primary font-bold underline underline-offset-4 decoration-primary/40 hover:decoration-primary" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
      } else {
        document.execCommand('createLink', false, linkUrl.trim());
      }
    }
    handleInput();
    setLinkDialogOpen(false);
  };

  const handleInsertImage = useCallback(() => {
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary((url, alt) => {
        if (url) {
          editorRef.current?.focus();
          const imgHtml = `<figure class="my-6 text-center"><img src="${url}" alt="${alt || ''}" class="rounded-2xl max-w-full h-auto mx-auto shadow-md border border-slate-200 dark:border-white/10" />${alt ? `<figcaption class="text-xs text-slate-500 mt-2">${alt}</figcaption>` : ''}</figure><p><br></p>`;
          document.execCommand('insertHTML', false, imgHtml);
          handleInput();
        }
      });
    } else {
      const url = window.prompt('Enter Image URL:');
      if (url) {
        editorRef.current?.focus();
        const imgHtml = `<figure class="my-6 text-center"><img src="${url}" alt="Article image" class="rounded-2xl max-w-full h-auto mx-auto shadow-md" /></figure><p><br></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        handleInput();
      }
    }
  }, [onOpenMediaLibrary]);

  const handleInsertTable = () => {
    let tableHtml = `<table class="w-full my-6 border-collapse border border-slate-300 dark:border-slate-700 text-sm"><thead><tr>`;
    for (let c = 0; c < tableCols; c++) {
      tableHtml += `<th class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 font-bold text-left">Header ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < tableRows - 1; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < tableCols; c++) {
        tableHtml += `<td class="border border-slate-300 dark:border-slate-700 p-3">Cell data</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, tableHtml);
    handleInput();
    setTableDialogOpen(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Standard clipboard paste behavior preserved
  };

  return (
    <div className="border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col">
      {/* Sticky Top Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-white/10 select-none">
        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Heading 2"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 4"
            onClick={() => execCommand('formatBlock', '<h4>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs"
          >
            <Heading4 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Paragraph"
            onClick={() => execCommand('formatBlock', '<p>')}
            className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            P
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => execCommand('bold')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => execCommand('italic')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => execCommand('underline')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => execCommand('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Inline Code"
            onClick={() => execCommand('formatBlock', '<pre>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Bullet List"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => execCommand('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Divider Line"
            onClick={() => execCommand('insertHorizontalRule')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Align Left"
            onClick={() => execCommand('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => execCommand('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => execCommand('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Links, Media & Table */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Insert or Edit Link"
            onClick={handleOpenLinkDialog}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Insert Image (Media Library)"
            onClick={handleInsertImage}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Insert Table"
            onClick={() => setTableDialogOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Formatting & History */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            title="Clear Formatting"
            onClick={() => execCommand('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Undo"
            onClick={() => execCommand('undo')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo"
            onClick={() => execCommand('redo')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="p-6 sm:p-8 min-h-[380px] focus:outline-none prose dark:prose-invert prose-slate max-w-none text-left leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      />

      {/* Editor Footer / Word Count */}
      <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong></span>
          <span>Reading Time: <strong className="text-slate-800 dark:text-slate-200">{Math.max(1, Math.ceil(wordCount / 200))} min</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>SEO-Structured WYSIWYG Engine</span>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Target URL</label>
              <Input
                placeholder="https://... or /courses"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Display Text (optional)</label>
              <Input
                placeholder="Anchor text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Search Internal Articles</label>
              <Input
                placeholder="Search blog post title..."
                value={searchLinkQuery}
                onChange={(e) => setSearchLinkQuery(e.target.value)}
              />
              {linkSearchResults.length > 0 && (
                <div className="mt-2 border rounded-xl divide-y max-h-36 overflow-y-auto">
                  {linkSearchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLinkUrl(item.slug);
                        if (!linkText) setLinkText(item.title);
                      }}
                      className="w-full text-left p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="font-semibold truncate">{item.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={applyLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Insertion Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Rows</label>
              <Input
                type="number"
                min={2}
                max={10}
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Columns</label>
              <Input
                type="number"
                min={1}
                max={6}
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInsertTable}>Insert Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
