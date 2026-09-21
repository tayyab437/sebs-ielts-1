import React, { useRef, useEffect, useState } from "react";
import { 
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, 
  Link2, Trash2, Palette, HelpCircle, Check, Sparkles, ChevronDown,
  CaseSensitive, Code, FileText, CheckSquare, PaintBucket, Type,
  Image as ImageIcon, Video as VideoIcon
} from "lucide-react";
import { supabase } from "@/src/lib/supabaseClient";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const COLOR_PALETTE = [
  { name: "Default Dark", color: "#334155" }, // Slate 700
  { name: "Primary Indigo", color: "#6366f1" }, // Indigo 500
  { name: "Emerald Green", color: "#10b981" }, // Emerald 500
  { name: "Amber Orange", color: "#f59e0b" },   // Amber 500
  { name: "Rose Red", color: "#f43f5e" },    // Rose 500
  { name: "Ocean Blue", color: "#3b82f6" },    // Blue 500
  { name: "Violet Purple", color: "#8b5cf6" },  // Violet 500
];

const HIGHLIGHT_PALETTE = [
  { name: "Clear", color: "transparent" },
  { name: "Yellow Gloss", color: "#fef08a" }, // Yellow 200
  { name: "Aqua Gloss", color: "#99f6e4" },   // Teal 200
  { name: "Emerald Gloss", color: "#a7f3d0" }, // Emerald 200
  { name: "Rose Gloss", color: "#fecdd3" },    // Rose 200
  { name: "Purple Gloss", color: "#ddd6fe" },  // Violet 200
  { name: "Blue Gloss", color: "#bfdbfe" },    // Blue 200
];

const FONT_FAMILIES = [
  { name: "Inter (Default)", value: '"Inter", sans-serif' },
  { name: "JetBrains Mono (Technical)", value: '"JetBrains Mono", monospace' },
  { name: "Times New Roman (Academic)", value: 'Times New Roman, serif' },
  { name: "Georgia (Editorial)", value: 'Georgia, serif' },
  { name: "Arial (Classic)", value: 'Arial, sans-serif' },
  { name: "Comic Sans (Playful)", value: '"Comic Sans MS", cursive' },
];

const FONT_SIZES = [
  { name: "12px", value: "12px" },
  { name: "14px", value: "14px" },
  { name: "16px", value: "16px" },
  { name: "18px", value: "18px" },
  { name: "20px", value: "20px" },
  { name: "24px", value: "24px" },
  { name: "32px", value: "32px" },
];

const LINE_HEIGHTS = [
  { name: "Compact (1.15)", value: "1.15" },
  { name: "Standard (1.5)", value: "1.5" },
  { name: "Comfortable (1.75)", value: "1.75" },
  { name: "Double (2.0)", value: "2.0" },
];

const LETTER_SPACINGS = [
  { name: "Normal", value: "normal" },
  { name: "Tight (-0.02em)", value: "-0.02em" },
  { name: "Wide (0.05em)", value: "0.05em" },
  { name: "Wider (0.1em)", value: "0.10em" },
];

export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  // If it already looks like HTML, return as-is
  if (/<[a-z][\s\S]*>/i.test(markdown)) {
    return markdown;
  }
  
  let html = markdown;

  // Replace blockquotes
  html = html.replace(/^>\s?(.*?)$/gm, "<blockquote>$1</blockquote>");

  // Triple header
  html = html.replace(/^###\s+(.*?)$/gm, "<h3>$1</h3>");
  // Double header
  html = html.replace(/^##\s+(.*?)$/gm, "<h2>$1</h2>");
  // Single header
  html = html.replace(/^#\s+(.*?)$/gm, "<h1>$1</h1>");

  // Bold and markdown bold markers
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, "<li>$1</li>");
  
  // Convert consecutive <li> tags into <ul> groups
  html = html.replace(/(<li>.*?<\/li>)+/g, "<ul>$&</ul>");

  // Map paragraphs
  const lines = html.split("\n");
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<li") || trimmed.startsWith("<blockquote")) {
      return line;
    }
    return `<p>${line}</p>`;
  });

  return processedLines.filter(Boolean).join("");
}

// Word and Docs sometimes declare styles in alternative/custom ways or classes, but styled copy-pasting uses base style attributes
function getStyleValFromAttribute(el: HTMLElement, prop: string): string {
  const styleAttr = el.getAttribute("style");
  if (!styleAttr) return "";
  const match = new RegExp(`${prop}\\s*:\\s*([^;]+)`, "i").exec(styleAttr);
  return match ? match[1].trim() : "";
}

function cleanHtmlNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as HTMLElement;
  const tagName = el.tagName.toLowerCase();

  const allowedTags = [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span", 
    "strong", "b", "em", "i", "u", "strike", "s", "del", 
    "code", "blockquote", "ul", "ol", "li", "a", "br"
  ];

  // If the tag is not allowed, clean its children and unwrap them (return as fragment)
  if (!allowedTags.includes(tagName)) {
    const fragment = document.createDocumentFragment();
    el.childNodes.forEach((child) => {
      const cleaned = cleanHtmlNode(child);
      if (cleaned) fragment.appendChild(cleaned);
    });
    return fragment;
  }

  const cleanedEl = document.createElement(tagName);

  // Preserve specific link attributes
  if (tagName === "a") {
    const href = el.getAttribute("href");
    if (href) cleanedEl.setAttribute("href", href);
    cleanedEl.setAttribute("target", "_blank");
    cleanedEl.setAttribute("rel", "noopener noreferrer");
  }

  // Styles of importance to preserve (font properties, spacing, background and colors)
  const stylesToPreserve = [
    "color", "background-color", "font-family", "font-size", 
    "line-height", "letter-spacing", "font-weight", "font-style", 
    "text-decoration", "text-align"
  ];
  
  stylesToPreserve.forEach((styleProp) => {
    const styleVal = el.style.getPropertyValue(styleProp) || getStyleValFromAttribute(el, styleProp);
    if (styleVal) {
      cleanedEl.style.setProperty(styleProp, styleVal);
    }
  });

  // Recursively append children
  el.childNodes.forEach((child) => {
    const cleaned = cleanHtmlNode(child);
    if (cleaned) cleanedEl.appendChild(cleaned);
  });

  return cleanedEl;
}

export default function RichTextEditor({ value, onChange, placeholder = "Start typing here...", className = "" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // States for drop-down overlays
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showLineHeight, setShowLineHeight] = useState(false);
  const [showLetterSpacing, setShowLetterSpacing] = useState(false);
  
  const [currentColor, setCurrentColor] = useState("#334155");
  const [currentBgColor, setCurrentBgColor] = useState("transparent");
  const [activeFontFamily, setActiveFontFamily] = useState('"Inter", sans-serif');
  const [activeFontSize, setActiveFontSize] = useState("14px");
  const [activeLineHeight, setActiveLineHeight] = useState("1.5");
  const [activeLetterSpacing, setActiveLetterSpacing] = useState("normal");

  const handleInsertImage = () => {
    const url = prompt("Enter Image URL:");
    if (url) {
      const htmlToInsert = `<img src="${url}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" alt="Inserted image" referrerPolicy="no-referrer" />`;
      executeCommand("insertHTML", htmlToInsert);
    }
  };

  const handleInsertVideo = () => {
    const url = prompt("Enter Video URL (MP4, Youtube Share, etc.):");
    if (url) {
      let htmlToInsert = "";
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
        const ytId = match && match[1] ? match[1] : "";
        const embedUrl = ytId
          ? `https://www.youtube-nocookie.com/embed/${ytId}?modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`
          : url.replace("watch?v=", "embed/");
        htmlToInsert = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 12px 0; border-radius: 12px; background: #000;"><iframe src="${embedUrl}" style="position: absolute; top:0; left:0; width:100%; height:100%; border:0; border-radius: 12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      } else {
        htmlToInsert = `<video src="${url}" controls style="max-width:100%; border-radius:8px; margin: 12px 0;"></video>`;
      }
      executeCommand("insertHTML", htmlToInsert);
    }
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const triggerVideoUpload = () => {
    videoInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      if (re.target?.result) {
        const htmlToInsert = `<img src="${re.target.result}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" alt="Uploaded Image" />`;
        executeCommand("insertHTML", htmlToInsert);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      if (re.target?.result) {
        const htmlToInsert = `<video src="${re.target.result}" controls style="max-width: 100%; border-radius: 8px; margin: 12px 0;"></video>`;
        executeCommand("insertHTML", htmlToInsert);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Initialize and sync editor content
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      const targetHtml = convertMarkdownToHtml(value);
      if (editorRef.current.innerHTML !== targetHtml) {
        editorRef.current.innerHTML = targetHtml || `<p><br></p>`;
      }
    }
  }, [value]);

  // Sync content back to parent state on inputs
  const handleInput = () => {
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      if (content === "<p><br></p>" || content === "<br>" || content === "") {
        content = "";
      }
      onChange(content);
    }
  };

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleInput();
  };

  // Modern CSS-based styling wrapper
  const applyInlineStyle = (styleName: string, value: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    
    // If selection is a collapsed cursor, insert a zero-width space span for typing
    if (range.collapsed) {
      const span = document.createElement("span");
      span.style.setProperty(styleName, value);
      const textNode = document.createTextNode("\u200B");
      span.appendChild(textNode);
      range.insertNode(span);
      
      // Move cursor right inside the span after the zero-width character
      const newRange = document.createRange();
      newRange.setStart(textNode, 1);
      newRange.setEnd(textNode, 1);
      selection.removeAllRanges();
      selection.addRange(newRange);
      handleInput();
      return;
    }

    const span = document.createElement("span");
    span.style.setProperty(styleName, value);
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    } catch (e) {
      document.execCommand("insertHTML", false, `<span style="${styleName}: ${value}">${selection.toString()}</span>`);
    }
    handleInput();
  };

  // Set style to the active block paragraph
  const applyBlockStyle = (styleName: string, value: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container: any = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentNode;
      }
      while (container && container !== editorRef.current && !["P", "DIV", "H1", "H2", "H3", "LI", "BLOCKQUOTE"].includes(container.tagName)) {
        container = container.parentNode;
      }
      if (container && container !== editorRef.current) {
        container.style.setProperty(styleName, value);
      } else {
        // Fallback to inline block styling if outside any standard container
        applyInlineStyle(styleName, value);
      }
      handleInput();
    }
  };

  // Convert casings
  const handleCasing = (caseType: "uppercase" | "lowercase" | "capitalize") => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString();
      let transformed = "";
      if (caseType === "uppercase") transformed = selectedText.toUpperCase();
      if (caseType === "lowercase") transformed = selectedText.toLowerCase();
      if (caseType === "capitalize") {
        transformed = selectedText.replace(/\b\w/g, c => c.toUpperCase());
      }
      // Replace only selection text
      document.execCommand("insertText", false, transformed);
      handleInput();
    }
  };

  // Inline Code formatting
  const handleInlineCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const code = document.createElement("code");
      code.className = "bg-slate-100 dark:bg-slate-800 text-rose-500 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5";
      try {
        code.appendChild(range.extractContents());
        range.insertNode(code);
      } catch (e) {
        document.execCommand("insertHTML", false, `<code class="bg-slate-100 dark:bg-slate-800 text-rose-500 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200">${selection.toString()}</code>`);
      }
      handleInput();
    }
  };

  const handleLink = () => {
    const url = prompt("Enter the hyperlink target URL:", "https://");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const handleApplyColor = (color: string) => {
    executeCommand("foreColor", color);
    setCurrentColor(color);
    setShowTextColor(false);
  };

  const handleApplyHighlight = (color: string) => {
    executeCommand("hiliteColor", color);
    setCurrentBgColor(color);
    setShowBgColor(false);
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMeta = e.ctrlKey || e.metaKey;
    if (isMeta) {
      const key = e.key.toLowerCase();
      if (key === "b" || e.keyCode === 66) {
        e.preventDefault();
        executeCommand("bold");
      } else if (key === "i" || e.keyCode === 73) {
        e.preventDefault();
        executeCommand("italic");
      } else if (key === "u" || e.keyCode === 85) {
        e.preventDefault();
        executeCommand("underline");
      }
    }
  };

  // Intercept and sanitize external pasted HTML / formatted styles
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;

    // Check for images
    let imageFile: File | null = null;
    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        if (clipboardData.items[i].type.indexOf("image/") === 0) {
          imageFile = clipboardData.items[i].getAsFile();
          break;
        }
      }
    }

    if (imageFile) {
      if (supabase) {
        // We use a temporary local object URL to show it immediately, then trigger upload.
        // Or simply do the upload inline and then insertImage.
        const originalName = imageFile.name || "image.png";
        const fileExt = originalName.split('.').pop() || "png";
        const fileName = `pasted-editor-${Date.now()}.${fileExt}`;

        // Insert a loading text placeholder while uploading (optional)
        document.execCommand("insertText", false, `[Uploading image: ${fileName}...]`);

        const { data, error } = await supabase.storage
          .from("resources")
          .upload(`editor/${fileName}`, imageFile, { upsert: false });

        if (error) {
          console.warn("Rich text image upload failed (bucket missing or permissions error). Falling back to Base64:", error);
          const base64Reader = new FileReader();
          base64Reader.onload = (re) => {
             if (re.target?.result) {
                 const htmlToInsert = `<img src="${re.target.result}" style="max-width: 100%; border-radius: 8px;" alt="Pasted Image (Base64)" />`;
                 document.execCommand("insertHTML", false, htmlToInsert);
                 handleInput();
             }
          }
          base64Reader.readAsDataURL(imageFile);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("resources")
          .getPublicUrl(`editor/${fileName}`);

        // Ideally we'd replace the placeholder, but for simple contentEditable:
        // By typing "insertImage" we just append. For better UX, we just focus and append.
        
        // As a simple fix, let's just trigger insert image at current selection.
        // It's safest to just insert it dynamically
        const htmlToInsert = `<img src="${publicUrl}" style="max-width: 100%; border-radius: 8px;" alt="Pasted Image" />`;
        document.execCommand("insertHTML", false, htmlToInsert);
        handleInput();
      } else {
        // Fallback to base64 if no supabase connected
        const reader = new FileReader();
        reader.onload = (re) => {
          if (re.target?.result) {
            const htmlToInsert = `<img src="${re.target.result}" style="max-width: 100%; border-radius: 8px;" alt="Pasted Image (Base64)" />`;
            document.execCommand("insertHTML", false, htmlToInsert);
            handleInput();
          }
        };
        reader.readAsDataURL(imageFile);
      }
      return;
    }

    const html = clipboardData.getData("text/html");
    const text = clipboardData.getData("text/plain");

    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const fragment = document.createDocumentFragment();
      
      doc.body.childNodes.forEach((child) => {
        const cleaned = cleanHtmlNode(child);
        if (cleaned) fragment.appendChild(cleaned);
      });

      // Insert clean fragment
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const lastChild = fragment.lastChild;
        range.insertNode(fragment);
        
        if (lastChild) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastChild);
          newRange.setEndAfter(lastChild);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      handleInput();
    } else if (text) {
      document.execCommand("insertText", false, text);
      handleInput();
    }
  };

  const closeDropdowns = () => {
    setShowTextColor(false);
    setShowBgColor(false);
    setShowFontFamily(false);
    setShowFontSize(false);
    setShowLineHeight(false);
    setShowLetterSpacing(false);
  };

  return (
    <div className={`flex flex-col border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm ${className}`}>
      
      {/* RICH COGNITIVE TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
        
        {/* BLOCK 1: INLINE FORMATS */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand("strikeThrough")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Strike-through text"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleInlineCode}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Inline block code format"
          >
            <Code className="w-4 h-4 text-purple-500" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* BLOCK 2: DROPDOWNS (FONT FAMILY, FONT SIZE) */}
          {/* FONT FAMILY DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { closeDropdowns(); setShowFontFamily(!showFontFamily); }}
              className="px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center gap-1 bg-white dark:bg-slate-900"
              title="Font Family"
            >
              <Type className="w-3.5 h-3.5 mr-0.5 text-emerald-500" />
              <span className="truncate max-w-[80px]">
                {FONT_FAMILIES.find(f => f.value === activeFontFamily)?.name || "Font"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showFontFamily && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-xl z-50 flex flex-col min-w-[200px]">
                {FONT_FAMILIES.map((fam) => (
                  <button
                    key={fam.name}
                    type="button"
                    onClick={() => {
                      applyInlineStyle("font-family", fam.value);
                      setActiveFontFamily(fam.value);
                      setShowFontFamily(false);
                    }}
                    style={{ fontFamily: fam.value }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{fam.name}</span>
                    {activeFontFamily === fam.value && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FONT SIZE DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { closeDropdowns(); setShowFontSize(!showFontSize); }}
              className="px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center gap-1 bg-white dark:bg-slate-900"
              title="Font Size"
            >
              <span className="font-extrabold text-[10px] text-indigo-500 mr-0.5">A+</span>
              <span>{activeFontSize}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showFontSize && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-xl z-50 flex flex-col min-w-[120px]">
                {FONT_SIZES.map((fs) => (
                  <button
                    key={fs.name}
                    type="button"
                    onClick={() => {
                      applyInlineStyle("font-size", fs.value);
                      setActiveFontSize(fs.value);
                      setShowFontSize(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span style={{ fontSize: fs.value }}>{fs.name}</span>
                    {activeFontSize === fs.value && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FONT COLOR PICKER */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { closeDropdowns(); setShowTextColor(!showTextColor); }}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-1 border border-slate-250 dark:border-white/5"
              title="Font Color"
            >
              <Palette className="w-4 h-4" style={{ color: currentColor }} />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showTextColor && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl shadow-xl z-50 flex flex-col gap-2 min-w-[160px]">
                <span className="text-[10px] font-black uppercase text-slate-400">Foreground color</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_PALETTE.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleApplyColor(item.color)}
                      style={{ backgroundColor: item.color }}
                      className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                      title={item.name}
                    >
                      {currentColor === item.color && (
                        <Check className="w-3 h-3 text-white mix-blend-difference" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* HIGHLIGHT / BACKGROUND COLOR */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { closeDropdowns(); setShowBgColor(!showBgColor); }}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-1 border border-slate-250 dark:border-white/5"
              title="Highlight Background"
            >
              <PaintBucket className="w-4 h-4 text-amber-500" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showBgColor && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl shadow-xl z-50 flex flex-col gap-2 min-w-[160px]">
                <span className="text-[10px] font-black uppercase text-slate-400">Highlight Text</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {HIGHLIGHT_PALETTE.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleApplyHighlight(item.color)}
                      style={{ backgroundColor: item.color }}
                      className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                      title={item.name}
                    >
                      {currentBgColor === item.color && (
                        <Check className="w-3 h-3 text-black mix-blend-difference" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* BLOCK 3: HEADINGS & BLOCKS */}
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Large Heading (H2)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Medium Heading (H3)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<p>")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors text-xs font-bold"
            title="Convert to standard Paragraph paragraph"
          >
            ¶
          </button>

          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<blockquote>")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Format selection as Quote block"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* BLOCK 4: ALIGNMENTS */}
          <button
            type="button"
            onClick={() => executeCommand("justifyLeft")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand("justifyCenter")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand("justifyRight")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* BLOCK 5: LISTS */}
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* BLOCK 6: ADVANCED LAYOUT CONTROLS (LINE HEIGHT, LETTER SPACING) */}
          {/* LINE HEIGHT */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { closeDropdowns(); setShowLineHeight(!showLineHeight); }}
              className="px-2 py-1.5 text-[11px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center gap-1 bg-white dark:bg-slate-900"
              title="Line Height spacing"
            >
              <span>LH: {activeLineHeight}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showLineHeight && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-xl z-50 flex flex-col min-w-[140px]">
                {LINE_HEIGHTS.map((lh) => (
                  <button
                    key={lh.name}
                    type="button"
                    onClick={() => {
                      applyBlockStyle("line-height", lh.value);
                      setActiveLineHeight(lh.value);
                      setShowLineHeight(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{lh.name}</span>
                    {activeLineHeight === lh.value && <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LETTER SPACING */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { closeDropdowns(); setShowLetterSpacing(!showLetterSpacing); }}
              className="px-2 py-1.5 text-[11px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center gap-1 bg-white dark:bg-slate-900"
              title="Letter Spacing Tracking"
            >
              <span>Tracking</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showLetterSpacing && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-xl z-50 flex flex-col min-w-[150px]">
                {LETTER_SPACINGS.map((ls) => (
                  <button
                    key={ls.name}
                    type="button"
                    onClick={() => {
                      applyInlineStyle("letter-spacing", ls.value);
                      setActiveLetterSpacing(ls.value);
                      setShowLetterSpacing(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{ls.name}</span>
                    {activeLetterSpacing === ls.value && <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* BLOCK 7: CASING & TRANSFORMS */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-white/10 rounded-lg">
            <button
              type="button"
              onClick={() => handleCasing("uppercase")}
              className="p-1 px-2 text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 hover:text-emerald-500 rounded hover:bg-white dark:hover:bg-slate-900"
              title="Transform selection to UPPERCASE"
            >
              AA
            </button>
            <button
              type="button"
              onClick={() => handleCasing("lowercase")}
              className="p-1 px-2 text-[9px] font-black lowercase text-slate-600 dark:text-slate-400 hover:text-emerald-500 rounded hover:bg-white dark:hover:bg-slate-900"
              title="Transform selection to lowercase"
            >
              aa
            </button>
            <button
              type="button"
              onClick={() => handleCasing("capitalize")}
              className="p-1 px-2 text-[9px] font-black text-slate-600 dark:text-slate-400 hover:text-emerald-500 rounded hover:bg-white dark:hover:bg-slate-900"
              title="Capitalize Words"
            >
              Aa
            </button>
          </div>
        </div>

        {/* BLOCK 8: HYPERLINK, IMAGES, VIDEOS, & TRASH DECORATIONS */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleLink}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-205 dark:border-white/5 bg-white dark:bg-slate-900"
            title="Insert web link"
          >
            <Link2 className="w-4 h-4 text-sky-500" />
          </button>

          {/* Insert/Upload Image */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-white/10 rounded-lg">
            <button
              type="button"
              onClick={handleInsertImage}
              className="p-1 px-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 rounded hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1"
              title="Insert Image by Link URL"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Img URL</span>
            </button>
            <button
              type="button"
              onClick={triggerImageUpload}
              className="p-1 px-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 rounded hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1"
              title="Upload Image from computer"
            >
              <span className="text-[9px] font-black shrink-0">↑ Upload</span>
            </button>
          </div>

          {/* Insert/Upload Video */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-white/10 rounded-lg">
            <button
              type="button"
              onClick={handleInsertVideo}
              className="p-1 px-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 rounded hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1"
              title="Insert Video by Link URL / Youtube"
            >
              <VideoIcon className="w-3.5 h-3.5 text-pink-500" />
              <span className="hidden md:inline">Vid URL</span>
            </button>
            <button
              type="button"
              onClick={triggerVideoUpload}
              className="p-1 px-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 rounded hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1"
              title="Upload Video from computer"
            >
              <span className="text-[9px] font-black shrink-0">↑ Upload</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              executeCommand("removeFormat");
              setCurrentColor("#334155");
              setCurrentBgColor("transparent");
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 hover:text-rose-600 transition-all font-black uppercase text-[10px] flex items-center gap-1 border border-rose-500/10"
            title="Clear styled structures and fonts from active canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Styling</span>
          </button>
        </div>
      </div>

      <input 
        ref={imageInputRef}
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleImageFileChange}
      />
      <input 
        ref={videoInputRef}
        type="file" 
        accept="video/*" 
        className="hidden" 
        onChange={handleVideoFileChange}
      />

      {/* EDITABLE WYSIWYG CANVAS */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="prose dark:prose-invert max-w-none p-6 min-h-[240px] max-h-[550px] overflow-y-auto outline-none text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed cursor-text select-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-600 block empty:before:pointer-events-none"
        style={{ minHeight: "240px" }}
      />

      {/* FOOTER INFORMANT */}
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
        <span className="flex items-center gap-1 text-emerald-500 font-black">
          <Sparkles className="w-3 h-3 animate-pulse" /> WYSIWYG Canvas Active
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <HelpCircle className="w-3 h-3 text-slate-400" /> Formatted Word/GDocs copy and paste is preserved!
        </span>
      </div>
    </div>
  );
}
