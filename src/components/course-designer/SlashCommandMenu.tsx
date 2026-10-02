import React, { useState, useEffect, useRef } from "react";
import { BlockType, BLOCKS_METADATA } from "./types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Type, Heading, Image, FileText, List, CheckSquare, HelpCircle, FileAudio, FileVideo, Divide, LayoutTemplate, Mic, Star } from "lucide-react";

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ position, onSelect, onClose }: SlashCommandMenuProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    // Close on click outside or escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const allBlocks = Object.entries(BLOCKS_METADATA).map(([type, meta]) => ({
    type: type as BlockType,
    ...meta
  }));

  const filtered = allBlocks.filter(b => 
    b.title.toLowerCase().includes(query.toLowerCase()) || 
    b.category.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce((acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, typeof allBlocks>);

  const getIcon = (type: BlockType) => {
    switch (type) {
      case 'heading': return <Heading className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'audio': case 'listening-section': return <FileAudio className="w-4 h-4" />;
      case 'video': return <FileVideo className="w-4 h-4" />;
      case 'divider': return <Divide className="w-4 h-4" />;
      case 'reading-passage': return <FileText className="w-4 h-4" />;
      case 'mcq': case 'listening-mcq': case 'matching-headings': return <List className="w-4 h-4" />;
      case 'true-false-not-given': return <CheckSquare className="w-4 h-4" />;
      case 'fill-blanks': case 'listening-fill-blanks': case 'sentence-completion': case 'summary-completion': return <LayoutTemplate className="w-4 h-4" />;
      case 'academic-task1': case 'general-task1': case 'task2': return <Type className="w-4 h-4" />;
      case 'part1': case 'cue-card': case 'part3': return <Mic className="w-4 h-4" />;
      case 'tip': return <Star className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const calculatedLeft = Math.max(16, Math.min(position.left, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 300));
  const calculatedTop = Math.max(16, Math.min(position.top + 6, (typeof window !== 'undefined' ? window.innerHeight : 800) - 340));

  return (
    <Card 
      ref={menuRef}
      className="fixed z-[100] w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150"
      style={{ top: `${calculatedTop}px`, left: `${calculatedLeft}px` }}
    >
      <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950">
        <Input 
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search block type..."
          className="h-8 text-xs border-none bg-white dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-none"
        />
      </div>
      <div className="max-h-72 overflow-y-auto p-2 space-y-3 custom-scrollbar">
        {Object.entries(grouped).map(([category, blocks]) => (
          <div key={category}>
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {category}
            </div>
            {blocks.map(block => (
              <button
                key={block.type}
                type="button"
                className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left group transition-colors cursor-pointer"
                onClick={() => onSelect(block.type)}
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors shrink-0">
                  {getIcon(block.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{block.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{block.description}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500 font-medium">No matching block types found</div>
        )}
      </div>
    </Card>
  );
}
