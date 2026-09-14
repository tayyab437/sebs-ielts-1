import React, { useState, useRef } from "react";
import { BlockData, BlockType, PanelType } from "./types";
import { BlockEditor } from "./BlockEditor";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";

interface EditorCanvasProps {
  blocks: BlockData[];
  setBlocks: React.Dispatch<React.SetStateAction<BlockData[]>>;
  panelId: PanelType;
  title: string;
}

// Wrapper for Sortable items
function SortableBlockItem({ id, block, index, updateBlock, deleteBlock, duplicateBlock, onOpenSlashMenu }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as any,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <BlockEditor 
         block={block} 
         index={index}
         updateBlock={updateBlock}
         deleteBlock={deleteBlock}
         duplicateBlock={duplicateBlock}
         onOpenSlashMenu={onOpenSlashMenu}
         dragHandleProps={{...attributes, ...listeners}}
      />
    </div>
  );
}

export function EditorCanvas({ blocks, setBlocks, panelId, title }: EditorCanvasProps) {
  const [slashMenu, setSlashMenu] = useState<{ isOpen: boolean; pos: {top: number, left: number}; blockIndex: number } | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems;
      });
    }
  };

  const addBlock = (type: BlockType, index?: number) => {
    const newBlock: BlockData = {
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data: {}
    };
    
    setBlocks(prev => {
      if (index !== undefined && index >= 0) {
        const copy = [...prev];
        copy.splice(index + 1, 0, newBlock);
        return copy;
      }
      return [...prev, newBlock];
    });
    setSlashMenu(null);
  };

  const updateBlock = (id: string, data: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const duplicateBlock = (id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: `block_${Date.now()}` };
      const newItems = [...prev];
      newItems.splice(idx + 1, 0, copy);
      return newItems;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === '/') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      // Calculate relative position based on the container if needed. For now, fixed to viewport to avoid overflow issues
      setSlashMenu({
         isOpen: true, 
         pos: { top: rect.bottom, left: rect.left }, 
         blockIndex: index 
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 lg:p-10 shadow-sm border border-slate-100 dark:border-white/5 relative">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">{title}</h3>
      
      <div className="flex-1 w-full max-w-3xl mx-auto space-y-2 relative pb-32">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, i) => (
              <SortableBlockItem 
                key={block.id}
                id={block.id} // Required for dnd-kit
                block={block}
                index={i}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                duplicateBlock={duplicateBlock}
                onOpenSlashMenu={handleKeyDown}
              />
            ))}
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <div 
            className="w-full py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center cursor-text transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setSlashMenu({ isOpen: true, pos: { top: rect.bottom - 40, left: rect.left + rect.width / 2 - 100 }, blockIndex: -1 });
            }}
          >
            <p className="text-slate-400 text-sm">Click here or type <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">/</kbd> to add a block</p>
          </div>
        )}

        {blocks.length > 0 && (
          <div className="pt-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity pb-8">
            <button 
              className="flex items-center gap-2 text-xs font-bold text-slate-400 py-2 px-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={(e) => {
                 const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                 setSlashMenu({ isOpen: true, pos: { top: rect.bottom, left: rect.left }, blockIndex: blocks.length - 1 });
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Block
            </button>
          </div>
        )}
      </div>

      {slashMenu?.isOpen && (
        <SlashCommandMenu 
          position={slashMenu.pos} 
          onSelect={(type) => addBlock(type, slashMenu.blockIndex)}
          onClose={() => setSlashMenu(null)}
        />
      )}
    </div>
  );
}
