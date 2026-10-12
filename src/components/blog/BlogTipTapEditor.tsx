import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Minus, Table as TableIcon, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Sparkles, HelpCircle, ExternalLink, AlignLeft, AlignCenter, AlignRight,
  Code, Eraser, Video as VideoIcon, Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Check, X, AlertCircle, Info, MessageSquare, Terminal, Search, Youtube
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

interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
}

interface TableContextInfo {
  table: HTMLTableElement;
  cell: HTMLTableCellElement;
  row: HTMLTableRowElement;
  rowIndex: number;
  colIndex: number;
  totalRows: number;
  totalCols: number;
}

export const BlogTipTapEditor: React.FC<BlogTipTapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write or paste your master article content here... (Type "/" for commands or Ctrl+K for links)',
  onOpenMediaLibrary
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection preservation refs
  const savedRangeRef = useRef<Range | null>(null);
  const editingAnchorRef = useRef<HTMLAnchorElement | null>(null);

  // Link Dialog State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [searchLinkQuery, setSearchLinkQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<Array<{ title: string; slug: string }>>([]);

  // Table Dialog State
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Video Dialog State
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');

  // Image Fallback Dialog State
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Table Context State (for row/column actions)
  const [tableContext, setTableContext] = useState<TableContextInfo | null>(null);

  // Notion-style Slash Command Menu State
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const slashStartRangeRef = useRef<{ container: Node; offset: number } | null>(null);

  // Word count & stats
  const [wordCount, setWordCount] = useState(0);

  // Save selection safely whenever selection changes inside editor
  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
      detectTableContext();
    }
  }, []);

  // Sync internal HTML with external content prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
      updateWordCount(content || '');
    }
  }, [content]);

  const updateWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    updateWordCount(html);
    onChange(html, JSON.stringify({ type: 'doc', html }));
    detectTableContext();
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    restoreSavedSelection();
    document.execCommand(command, false, value);
    saveCurrentSelection();
    handleInput();
  };

  // Restore saved selection
  const restoreSavedSelection = useCallback(() => {
    if (!savedRangeRef.current || !editorRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // Helper to find closest ancestor matching selector
  const findAncestor = (node: Node | null, selector: string): HTMLElement | null => {
    let current: Node | null = node;
    while (current && current !== editorRef.current) {
      if (current instanceof HTMLElement && current.matches(selector)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  };

  // Detect if selection is inside a table
  const detectTableContext = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      setTableContext(null);
      return;
    }

    const node = sel.anchorNode;
    if (!node || !editorRef.current.contains(node)) {
      setTableContext(null);
      return;
    }

    const cell = findAncestor(node, 'td, th') as HTMLTableCellElement | null;
    const table = findAncestor(node, 'table') as HTMLTableElement | null;
    const row = findAncestor(node, 'tr') as HTMLTableRowElement | null;

    if (cell && table && row) {
      const rowIndex = row.rowIndex;
      const colIndex = cell.cellIndex;
      const totalRows = table.rows.length;
      let totalCols = 0;
      for (let i = 0; i < totalRows; i++) {
        totalCols = Math.max(totalCols, table.rows[i].cells.length);
      }

      setTableContext({
        table,
        cell,
        row,
        rowIndex,
        colIndex,
        totalRows,
        totalCols
      });
    } else {
      setTableContext(null);
    }
  };

  // Internal Link Search API
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

  // Handle Open Link Dialog (Ctrl+K or toolbar button)
  const handleOpenLinkDialog = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }

    // Check if cursor or selection is already inside an anchor tag
    const anchor = sel?.anchorNode ? findAncestor(sel.anchorNode, 'a') as HTMLAnchorElement | null : null;
    if (anchor) {
      editingAnchorRef.current = anchor;
      setLinkUrl(anchor.getAttribute('href') || '');
      setLinkText(anchor.textContent || '');
    } else if (savedRangeRef.current) {
      editingAnchorRef.current = null;
      const selectedText = savedRangeRef.current.toString();
      setLinkText(selectedText);
      setLinkUrl('');
    } else {
      editingAnchorRef.current = null;
      setLinkText('');
      setLinkUrl('');
    }

    setSearchLinkQuery('');
    setLinkDialogOpen(true);
  }, []);

  // Apply Link at EXACT selected keyword position
  const applyLink = () => {
    setLinkDialogOpen(false);
    const targetUrl = linkUrl.trim();
    const targetText = linkText.trim();

    editorRef.current?.focus();

    // Case 1: Editing an existing anchor element
    if (editingAnchorRef.current && document.body.contains(editingAnchorRef.current)) {
      if (!targetUrl) {
        // Remove link but keep text
        const parent = editingAnchorRef.current.parentNode;
        while (editingAnchorRef.current.firstChild) {
          parent?.insertBefore(editingAnchorRef.current.firstChild, editingAnchorRef.current);
        }
        parent?.removeChild(editingAnchorRef.current);
      } else {
        editingAnchorRef.current.href = targetUrl;
        if (targetText) {
          editingAnchorRef.current.textContent = targetText;
        }
      }
      editingAnchorRef.current = null;
      handleInput();
      return;
    }

    // Case 2: Inserting a new link at the saved range position
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);

      if (!targetUrl) {
        document.execCommand('unlink', false);
      } else {
        const textToUse = targetText || savedRangeRef.current.toString() || targetUrl;

        // Cleanly delete current range contents
        savedRangeRef.current.deleteContents();

        // Create pristine styled anchor element
        const a = document.createElement('a');
        a.href = targetUrl;
        a.textContent = textToUse;
        a.className = 'text-primary font-bold underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        savedRangeRef.current.insertNode(a);

        // Position cursor right after the newly inserted link
        const afterRange = document.createRange();
        afterRange.setStartAfter(a);
        afterRange.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(afterRange);
        savedRangeRef.current = afterRange.cloneRange();
      }

      handleInput();
    }
  };

  // Insert Image
  const handleInsertImageTrigger = useCallback(() => {
    saveCurrentSelection();
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary((url, alt) => {
        if (url) {
          insertImageHtml(url, alt || '', '');
        }
      });
    } else {
      setImageUrl('');
      setImageAlt('');
      setImageCaption('');
      setImageDialogOpen(true);
    }
  }, [onOpenMediaLibrary, saveCurrentSelection]);

  const insertImageHtml = (url: string, alt: string, caption: string) => {
    editorRef.current?.focus();
    restoreSavedSelection();

    const imgFigure = document.createElement('figure');
    imgFigure.className = 'my-6 text-center';

    const img = document.createElement('img');
    img.src = url;
    img.alt = alt || 'Article image';
    img.className = 'rounded-2xl max-w-full h-auto mx-auto shadow-md border border-slate-200 dark:border-white/10';
    imgFigure.appendChild(img);

    if (caption || alt) {
      const figcap = document.createElement('figcaption');
      figcap.className = 'text-xs text-slate-500 mt-2 italic text-center';
      figcap.textContent = caption || alt;
      imgFigure.appendChild(figcap);
    }

    const p = document.createElement('p');
    p.innerHTML = '<br>';

    if (savedRangeRef.current) {
      savedRangeRef.current.deleteContents();
      savedRangeRef.current.insertNode(p);
      savedRangeRef.current.insertNode(imgFigure);

      const afterRange = document.createRange();
      afterRange.setStartAfter(p);
      afterRange.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(afterRange);
      savedRangeRef.current = afterRange.cloneRange();
    } else {
      editorRef.current?.appendChild(imgFigure);
      editorRef.current?.appendChild(p);
    }

    handleInput();
  };

  // Video Helper: Parse YouTube ID or return iframe embed
  const parseVideoEmbedUrl = (raw: string): string => {
    const trimmed = raw.trim();
    // Check if it's already an iframe
    const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (iframeMatch) return iframeMatch[1];

    // Check YouTube standard: youtube.com/watch?v=ID or youtu.be/ID
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytMatch) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }

    // Check Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return trimmed;
  };

  const handleInsertVideo = () => {
    const embedUrl = parseVideoEmbedUrl(videoUrl);
    if (!embedUrl) return;

    editorRef.current?.focus();
    restoreSavedSelection();

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'my-6 aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 bg-black';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.className = 'w-full h-full';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    if (videoCaption) iframe.title = videoCaption;

    videoWrapper.appendChild(iframe);

    const p = document.createElement('p');
    p.innerHTML = '<br>';

    if (savedRangeRef.current) {
      savedRangeRef.current.deleteContents();
      savedRangeRef.current.insertNode(p);
      savedRangeRef.current.insertNode(videoWrapper);

      const afterRange = document.createRange();
      afterRange.setStartAfter(p);
      afterRange.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(afterRange);
      savedRangeRef.current = afterRange.cloneRange();
    } else {
      editorRef.current?.appendChild(videoWrapper);
      editorRef.current?.appendChild(p);
    }

    handleInput();
    setVideoDialogOpen(false);
    setVideoUrl('');
    setVideoCaption('');
  };

  // Table Insertion
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
    restoreSavedSelection();
    document.execCommand('insertHTML', false, tableHtml);
    handleInput();
    setTableDialogOpen(false);
  };

  // Table Accessibility Actions (Add/Delete Row & Column)
  const addTableRow = (position: 'above' | 'below') => {
    if (!tableContext) return;
    const { table, row, totalCols } = tableContext;
    const newRow = document.createElement('tr');

    const numCols = row.cells.length || totalCols || 1;
    for (let i = 0; i < numCols; i++) {
      const td = document.createElement('td');
      td.className = 'border border-slate-300 dark:border-slate-700 p-3';
      td.innerHTML = '<br>';
      newRow.appendChild(td);
    }

    if (position === 'above') {
      row.parentNode?.insertBefore(newRow, row);
    } else {
      row.parentNode?.insertBefore(newRow, row.nextSibling);
    }

    // Move cursor to first cell of new row
    const firstCell = newRow.cells[0];
    const range = document.createRange();
    range.selectNodeContents(firstCell);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    savedRangeRef.current = range.cloneRange();

    handleInput();
  };

  const deleteTableRow = () => {
    if (!tableContext) return;
    const { table, row } = tableContext;
    if (table.rows.length <= 1) {
      deleteCurrentTable();
      return;
    }
    row.remove();
    handleInput();
  };

  const addTableColumn = (position: 'left' | 'right') => {
    if (!tableContext) return;
    const { table, colIndex } = tableContext;
    const insertIndex = position === 'left' ? colIndex : colIndex + 1;

    for (let r = 0; r < table.rows.length; r++) {
      const currentRow = table.rows[r];
      const isHeader = currentRow.parentNode?.nodeName === 'THEAD' || currentRow.cells[0]?.tagName === 'TH';
      const cell = document.createElement(isHeader ? 'th' : 'td');

      if (isHeader) {
        cell.className = 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 font-bold text-left';
        cell.textContent = `Header ${insertIndex + 1}`;
      } else {
        cell.className = 'border border-slate-300 dark:border-slate-700 p-3';
        cell.innerHTML = '<br>';
      }

      if (insertIndex >= currentRow.cells.length) {
        currentRow.appendChild(cell);
      } else {
        currentRow.insertBefore(cell, currentRow.cells[insertIndex]);
      }
    }

    handleInput();
  };

  const deleteTableColumn = () => {
    if (!tableContext) return;
    const { table, colIndex } = tableContext;

    if (tableContext.totalCols <= 1) {
      deleteCurrentTable();
      return;
    }

    for (let r = 0; r < table.rows.length; r++) {
      const row = table.rows[r];
      if (row.cells[colIndex]) {
        row.deleteCell(colIndex);
      }
    }

    handleInput();
  };

  const toggleTableHeader = () => {
    if (!tableContext) return;
    const { table } = tableContext;
    if (table.rows.length === 0) return;

    const firstRow = table.rows[0];
    const cells = Array.from(firstRow.cells);
    const isCurrentlyTh = cells[0]?.tagName === 'TH';

    cells.forEach((cell) => {
      const newCell = document.createElement(isCurrentlyTh ? 'td' : 'th');
      newCell.className = isCurrentlyTh
        ? 'border border-slate-300 dark:border-slate-700 p-3'
        : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 font-bold text-left';
      newCell.innerHTML = cell.innerHTML;
      firstRow.replaceChild(newCell, cell);
    });

    handleInput();
  };

  const deleteCurrentTable = () => {
    if (!tableContext) return;
    const { table } = tableContext;
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    table.parentNode?.insertBefore(p, table);
    table.remove();

    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    savedRangeRef.current = range.cloneRange();

    setTableContext(null);
    handleInput();
  };

  // Insert Callout Box
  const insertCalloutBox = (type: 'note' | 'answer' | 'takeaways') => {
    editorRef.current?.focus();
    restoreSavedSelection();

    let blockHtml = '';
    if (type === 'note') {
      blockHtml = `
        <div class="my-6 p-5 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200">
          <p class="font-bold text-sm mb-1">Important Note / Examiner Insight</p>
          <p class="text-sm">Write your high-value examination tip or advice here...</p>
        </div><p><br></p>
      `;
    } else if (type === 'answer') {
      blockHtml = `
        <div class="my-6 p-6 rounded-2xl bg-primary/10 border border-primary/30 text-slate-900 dark:text-white">
          <p class="text-xs font-black uppercase tracking-wider text-primary mb-1">Direct Answer / Key Question</p>
          <h3 class="text-lg font-bold mb-2">What is the optimal answer?</h3>
          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Provide your concise 40-60 word authoritative answer directly matching search intent.</p>
        </div><p><br></p>
      `;
    } else {
      blockHtml = `
        <div class="my-6 p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
          <p class="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Key Takeaways</p>
          <ul class="list-disc pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            <li>Essential principle 1</li>
            <li>Critical strategy 2</li>
            <li>Practical recommendation 3</li>
          </ul>
        </div><p><br></p>
      `;
    }

    document.execCommand('insertHTML', false, blockHtml);
    handleInput();
  };

  // Close Slash Menu
  const closeSlashMenu = useCallback(() => {
    setSlashMenuOpen(false);
    setSlashQuery('');
    slashStartRangeRef.current = null;
  }, []);

  // Remove the typed "/query" from the editor
  const cleanSlashQueryFromEditor = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const currentRange = sel.getRangeAt(0);

    // Look backward in the text node for the slash
    if (currentRange.startContainer.nodeType === Node.TEXT_NODE) {
      const text = currentRange.startContainer.textContent || '';
      const offset = currentRange.startOffset;
      const lastSlashIdx = text.lastIndexOf('/', offset - 1);
      if (lastSlashIdx !== -1) {
        const deleteRange = document.createRange();
        deleteRange.setStart(currentRange.startContainer, lastSlashIdx);
        deleteRange.setEnd(currentRange.startContainer, offset);
        deleteRange.deleteContents();
        savedRangeRef.current = deleteRange.cloneRange();
      }
    }
  }, []);

  // Slash Commands Definitions
  const slashCommands: SlashCommandItem[] = [
    {
      id: 'h2',
      title: 'Heading 2',
      description: 'Primary article section heading',
      icon: <Heading2 className="w-4 h-4 text-primary" />,
      keywords: ['h2', 'heading', 'title', 'section'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('formatBlock', '<h2>');
        closeSlashMenu();
      }
    },
    {
      id: 'h3',
      title: 'Heading 3',
      description: 'Sub-topic milestone heading',
      icon: <Heading3 className="w-4 h-4 text-primary" />,
      keywords: ['h3', 'subheading', 'sub'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('formatBlock', '<h3>');
        closeSlashMenu();
      }
    },
    {
      id: 'h4',
      title: 'Heading 4',
      description: 'Minor subsection heading',
      icon: <Heading4 className="w-4 h-4 text-primary" />,
      keywords: ['h4', 'minor'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('formatBlock', '<h4>');
        closeSlashMenu();
      }
    },
    {
      id: 'text',
      title: 'Paragraph',
      description: 'Plain body text paragraph',
      icon: <AlignLeft className="w-4 h-4 text-slate-500" />,
      keywords: ['p', 'text', 'paragraph', 'normal'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('formatBlock', '<p>');
        closeSlashMenu();
      }
    },
    {
      id: 'bullet',
      title: 'Bullet List',
      description: 'Unordered bulleted list',
      icon: <List className="w-4 h-4 text-emerald-500" />,
      keywords: ['ul', 'bullet', 'list', 'points'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('insertUnorderedList');
        closeSlashMenu();
      }
    },
    {
      id: 'number',
      title: 'Numbered List',
      description: 'Sequential step-by-step list',
      icon: <ListOrdered className="w-4 h-4 text-emerald-500" />,
      keywords: ['ol', 'number', 'numbered', 'steps', 'order'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('insertOrderedList');
        closeSlashMenu();
      }
    },
    {
      id: 'table',
      title: 'Data Table',
      description: 'Insert comparative scoring or schedule grid',
      icon: <TableIcon className="w-4 h-4 text-indigo-500" />,
      keywords: ['table', 'grid', 'rows', 'columns'],
      action: () => {
        cleanSlashQueryFromEditor();
        closeSlashMenu();
        setTableDialogOpen(true);
      }
    },
    {
      id: 'image',
      title: 'Image Figure',
      description: 'Upload or select high-res visual banner',
      icon: <ImageIcon className="w-4 h-4 text-purple-500" />,
      keywords: ['image', 'img', 'photo', 'picture', 'figure'],
      action: () => {
        cleanSlashQueryFromEditor();
        closeSlashMenu();
        handleInsertImageTrigger();
      }
    },
    {
      id: 'video',
      title: 'Video Embed',
      description: 'Embed YouTube or IELTS lecture video',
      icon: <VideoIcon className="w-4 h-4 text-rose-500" />,
      keywords: ['video', 'youtube', 'vimeo', 'embed', 'lecture'],
      action: () => {
        cleanSlashQueryFromEditor();
        closeSlashMenu();
        setVideoDialogOpen(true);
      }
    },
    {
      id: 'link',
      title: 'Hyperlink (Ctrl+K)',
      description: 'Connect internal article or external citation',
      icon: <LinkIcon className="w-4 h-4 text-blue-500" />,
      keywords: ['link', 'url', 'href', 'internal'],
      action: () => {
        cleanSlashQueryFromEditor();
        closeSlashMenu();
        handleOpenLinkDialog();
      }
    },
    {
      id: 'callout',
      title: 'Important Callout',
      description: 'Highlight examiner warning or tip box',
      icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
      keywords: ['note', 'warning', 'callout', 'tip', 'alert', 'important'],
      action: () => {
        cleanSlashQueryFromEditor();
        insertCalloutBox('note');
        closeSlashMenu();
      }
    },
    {
      id: 'answer',
      title: 'Direct Answer Box',
      description: 'SEO featured snippet quick response',
      icon: <MessageSquare className="w-4 h-4 text-primary" />,
      keywords: ['answer', 'direct', 'snippet', 'faq'],
      action: () => {
        cleanSlashQueryFromEditor();
        insertCalloutBox('answer');
        closeSlashMenu();
      }
    },
    {
      id: 'quote',
      title: 'Blockquote',
      description: 'Stylized quotation from examiner or scholar',
      icon: <Quote className="w-4 h-4 text-slate-500" />,
      keywords: ['quote', 'blockquote', 'citation'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('formatBlock', '<blockquote>');
        closeSlashMenu();
      }
    },
    {
      id: 'divider',
      title: 'Divider Line',
      description: 'Horizontal separator line',
      icon: <Minus className="w-4 h-4 text-slate-400" />,
      keywords: ['divider', 'hr', 'line', 'separator'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('insertHorizontalRule');
        closeSlashMenu();
      }
    },
    {
      id: 'code',
      title: 'Code / Text Box',
      description: 'Monospaced format or template snippet',
      icon: <Terminal className="w-4 h-4 text-teal-500" />,
      keywords: ['code', 'pre', 'snippet'],
      action: () => {
        cleanSlashQueryFromEditor();
        execCommand('formatBlock', '<pre>');
        closeSlashMenu();
      }
    }
  ];

  // Filter commands by query
  const filteredCommands = slashCommands.filter((cmd) => {
    if (!slashQuery.trim()) return true;
    const q = slashQuery.toLowerCase().trim();
    return cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q));
  });

  // Handle Keyboard Shortcuts & Slash Command Trigger
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 1. Accessibility Shortcut: Ctrl+K / Cmd+K for Link
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      handleOpenLinkDialog();
      return;
    }

    // 2. Tab key navigation in table
    if (e.key === 'Tab' && tableContext) {
      e.preventDefault();
      const { table, row, cell, colIndex } = tableContext;
      const isLastCellInRow = colIndex === row.cells.length - 1;
      const isLastRowInTable = row.rowIndex === table.rows.length - 1;

      if (!e.shiftKey) {
        if (isLastCellInRow && isLastRowInTable) {
          // Automatically add a row below and jump into it (Docs standard behavior!)
          addTableRow('below');
          return;
        } else if (isLastCellInRow && !isLastRowInTable) {
          // Jump to first cell in next row
          const nextRow = table.rows[row.rowIndex + 1];
          const targetCell = nextRow.cells[0];
          const range = document.createRange();
          range.selectNodeContents(targetCell);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          savedRangeRef.current = range.cloneRange();
          detectTableContext();
          return;
        } else {
          // Jump to next cell in current row
          const nextCell = row.cells[colIndex + 1];
          if (nextCell) {
            const range = document.createRange();
            range.selectNodeContents(nextCell);
            range.collapse(true);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            savedRangeRef.current = range.cloneRange();
            detectTableContext();
            return;
          }
        }
      } else {
        // Shift+Tab: Move backward
        if (colIndex > 0) {
          const prevCell = row.cells[colIndex - 1];
          const range = document.createRange();
          range.selectNodeContents(prevCell);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          savedRangeRef.current = range.cloneRange();
          detectTableContext();
          return;
        } else if (row.rowIndex > 0) {
          const prevRow = table.rows[row.rowIndex - 1];
          const targetCell = prevRow.cells[prevRow.cells.length - 1];
          const range = document.createRange();
          range.selectNodeContents(targetCell);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          savedRangeRef.current = range.cloneRange();
          detectTableContext();
          return;
        }
      }
    }

    // 3. Navigation while Slash Menu is active
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[slashSelectedIndex]) {
          filteredCommands[slashSelectedIndex].action();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSlashMenu();
        return;
      }
      if (e.key === 'Backspace') {
        if (!slashQuery) {
          closeSlashMenu();
        }
      }
    }

    // 4. Triggering Slash Command
    if (e.key === '/' && !slashMenuOpen) {
      // Calculate coordinates for popup menu
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && containerRef.current) {
        const range = sel.getRangeAt(0).cloneRange();
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        let top = rect.bottom - containerRect.top + 8;
        let left = rect.left - containerRect.left;

        // Bound to container width
        if (left + 280 > containerRect.width) {
          left = Math.max(16, containerRect.width - 296);
        }

        setSlashPosition({ top, left: Math.max(16, left) });
        setSlashQuery('');
        setSlashSelectedIndex(0);
        setSlashMenuOpen(true);
        slashStartRangeRef.current = { container: range.startContainer, offset: range.startOffset };
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    saveCurrentSelection();

    // If slash menu is open, track typed query
    if (slashMenuOpen && e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const currentRange = sel.getRangeAt(0);
        if (currentRange.startContainer.nodeType === Node.TEXT_NODE) {
          const text = currentRange.startContainer.textContent || '';
          const offset = currentRange.startOffset;
          const slashIdx = text.lastIndexOf('/', offset - 1);
          if (slashIdx !== -1) {
            const query = text.slice(slashIdx + 1, offset);
            setSlashQuery(query);
            setSlashSelectedIndex(0);
          } else {
            closeSlashMenu();
          }
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col"
    >
      {/* Sticky Top Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-white/10 select-none">
        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Heading 2 (Section Title)"
            aria-label="Heading 2"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 3 (Subsection)"
            aria-label="Heading 3"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 4 (Minor Point)"
            aria-label="Heading 4"
            onClick={() => execCommand('formatBlock', '<h4>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs"
          >
            <Heading4 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Standard Paragraph"
            aria-label="Paragraph"
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
            aria-label="Bold"
            onClick={() => execCommand('bold')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
            onClick={() => execCommand('italic')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            aria-label="Underline"
            onClick={() => execCommand('underline')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            aria-label="Strikethrough"
            onClick={() => execCommand('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Code Block"
            aria-label="Code Block"
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
            aria-label="Bullet List"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            aria-label="Numbered List"
            onClick={() => execCommand('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Blockquote"
            aria-label="Blockquote"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Divider Line"
            aria-label="Divider"
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
            aria-label="Align Left"
            onClick={() => execCommand('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Center"
            aria-label="Align Center"
            onClick={() => execCommand('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Right"
            aria-label="Align Right"
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
            title="Add Link (Shortcut: Ctrl+K)"
            aria-label="Add Link (Ctrl+K)"
            onClick={handleOpenLinkDialog}
            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-slate-700 dark:text-slate-300 relative group flex items-center gap-1 font-bold text-xs"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] font-mono text-slate-400">Ctrl+K</span>
          </button>
          <button
            type="button"
            title="Insert Image (Media Library)"
            aria-label="Insert Image"
            onClick={handleInsertImageTrigger}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Insert Video (YouTube/Vimeo)"
            aria-label="Insert Video"
            onClick={() => {
              saveCurrentSelection();
              setVideoDialogOpen(true);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <VideoIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Insert Table Grid"
            aria-label="Insert Table"
            onClick={() => {
              saveCurrentSelection();
              setTableDialogOpen(true);
            }}
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
            aria-label="Clear Formatting"
            onClick={() => execCommand('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            onClick={() => execCommand('undo')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            onClick={() => execCommand('redo')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Table Accessibility Context Bar (Shown when cursor is inside any table) */}
      {tableContext && (
        <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-primary">
            <TableIcon className="w-4 h-4 shrink-0" />
            <span>Table Active</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary">
              Row {tableContext.rowIndex + 1} of {tableContext.totalRows} • Col {tableContext.colIndex + 1} of {tableContext.totalCols}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => addTableRow('above')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-xs hover:text-primary transition-colors text-[11px]"
            >
              <ArrowUp className="w-3 h-3" /> +Row Above
            </button>
            <button
              type="button"
              onClick={() => addTableRow('below')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-xs hover:text-primary transition-colors text-[11px]"
            >
              <ArrowDown className="w-3 h-3" /> +Row Below
            </button>
            <button
              type="button"
              onClick={deleteTableRow}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-bold flex items-center gap-1 shadow-xs transition-colors text-[11px]"
            >
              <Trash2 className="w-3 h-3" /> -Row
            </button>
            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={() => addTableColumn('left')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-xs hover:text-primary transition-colors text-[11px]"
            >
              <ArrowLeft className="w-3 h-3" /> +Col Left
            </button>
            <button
              type="button"
              onClick={() => addTableColumn('right')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-xs hover:text-primary transition-colors text-[11px]"
            >
              <ArrowRight className="w-3 h-3" /> +Col Right
            </button>
            <button
              type="button"
              onClick={deleteTableColumn}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-bold flex items-center gap-1 shadow-xs transition-colors text-[11px]"
            >
              <Trash2 className="w-3 h-3" /> -Col
            </button>
            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={toggleTableHeader}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-xs transition-colors text-[11px]"
            >
              Header Format
            </button>
            <button
              type="button"
              onClick={deleteCurrentTable}
              className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-1 shadow-xs transition-colors text-[11px]"
            >
              <Trash2 className="w-3 h-3" /> Delete Table
            </button>
          </div>
        </div>
      )}

      {/* Notion-style Slash Command Floating Popup */}
      {slashMenuOpen && (
        <div
          style={{ top: `${slashPosition.top}px`, left: `${slashPosition.left}px` }}
          className="absolute z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Notion Commands
            </span>
            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Esc to dismiss
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-transparent">
            {filteredCommands.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No command matching &ldquo;/{slashQuery}&rdquo;
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === slashSelectedIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSlashSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-tight truncate">{cmd.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{cmd.description}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseUp={saveCurrentSelection}
        onSelect={saveCurrentSelection}
        data-placeholder={placeholder}
        className="p-6 sm:p-8 min-h-[380px] focus:outline-none prose dark:prose-invert prose-slate max-w-none text-left leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      />

      {/* Editor Footer / Word Count & Accessibility Hints */}
      <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong></span>
          <span>Reading Time: <strong className="text-slate-800 dark:text-slate-200">{Math.max(1, Math.ceil(wordCount / 200))} min</strong></span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
          <span className="hidden sm:inline bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
            Press <strong className="text-primary font-mono">/</strong> for Notion commands
          </span>
          <span className="hidden sm:inline bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
            <strong className="text-primary font-mono">Ctrl+K</strong> for Link
          </span>
          <div className="flex items-center gap-1 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accessible SEO Engine</span>
          </div>
        </div>
      </div>

      {/* Hyperlink Dialog (Ctrl+K or toolbar) */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <span>{editingAnchorRef.current ? 'Edit Hyperlink' : 'Insert Hyperlink'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Target URL or Path *
              </label>
              <Input
                placeholder="https://... or /courses or /blog/slug"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLink();
                  }
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Selected Keyword / Anchor Text
              </label>
              <Input
                placeholder="Selected text in article..."
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The link will be inserted directly at the highlighted keyword position without shifting content.
              </p>
            </div>

            {/* Internal Post Quick Search */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Search Internal Articles (SEO Interlinking)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  placeholder="Type to search institute articles..."
                  value={searchLinkQuery}
                  onChange={(e) => setSearchLinkQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {linkSearchResults.length > 0 && (
                <div className="mt-2 border rounded-xl divide-y max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
                  {linkSearchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLinkUrl(item.slug);
                        if (!linkText) setLinkText(item.title);
                      }}
                      className="w-full text-left p-2.5 text-xs hover:bg-primary/10 hover:text-primary flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold truncate">{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>
              {editingAnchorRef.current ? 'Update Link' : 'Insert Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Insertion Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-rose-500" />
              <span>Embed Video (YouTube / Vimeo)</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Video URL or Embed Code *
              </label>
              <Input
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Supports standard YouTube links, shortened youtu.be links, Vimeo, or iframe embed code.
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Video Title / Caption (Optional)
              </label>
              <Input
                placeholder="e.g., IELTS Writing Task 2 Masterclass"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertVideo} disabled={!videoUrl.trim()}>
              Insert Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Insertion Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-primary" />
              <span>Insert Table Grid</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Rows</label>
              <Input
                type="number"
                min={2}
                max={15}
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Columns</label>
              <Input
                type="number"
                min={1}
                max={8}
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Once inserted, you can add or delete rows and columns at any time with the contextual Table Toolbar or Tab key.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertTable}>Insert Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Fallback URL Dialog (When Media Library not configured) */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>Insert Image</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Image URL *</label>
              <Input
                placeholder="https://... image address"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Alt Text (for SEO & Accessibility) *</label>
              <Input
                placeholder="Descriptive text for visually impaired and search engines"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Caption (Optional)</label>
              <Input
                placeholder="Visible caption below image"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (imageUrl.trim()) {
                  insertImageHtml(imageUrl.trim(), imageAlt.trim(), imageCaption.trim());
                  setImageDialogOpen(false);
                }
              }}
              disabled={!imageUrl.trim()}
            >
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
