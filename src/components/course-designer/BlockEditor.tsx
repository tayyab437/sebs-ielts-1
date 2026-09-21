import React from "react";
import { BlockData, BLOCKS_METADATA } from "./types";
import { GripVertical, Trash2, Copy, Plus, Table as TableIcon, Image as ImageIcon, Headphones, Video as VideoIcon, FileText, Sparkles, HelpCircle, FileCheck, Check, X, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "../RichTextEditor";
import SecureVideoPlayer from "@/src/components/common/SecureVideoPlayer";

function AutoResizeTextarea(props: React.ComponentProps<typeof Textarea>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [props.value]);

  return (
    <Textarea
      {...props}
      ref={ref}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
        if (props.onInput) props.onInput(e);
      }}
    />
  );
}


interface BlockProps {
  block: BlockData;
  index: number;
  updateBlock: (id: string, data: any) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  onOpenSlashMenu: (e: React.KeyboardEvent, index: number) => void;
  dragHandleProps?: any;
}

export function BlockEditor({ block, index, updateBlock, deleteBlock, duplicateBlock, onOpenSlashMenu, dragHandleProps }: BlockProps) {
  const meta = BLOCKS_METADATA[block.type];

  // Specific Renderer Map
  const renderBlockEditor = () => {
    switch (block.type) {
      case 'heading':
        return (
          <Input 
            value={block.data.text || block.data.content || block.data.title || ''} 
            onChange={(e) => updateBlock(block.id, { ...block.data, text: e.target.value })}
            placeholder="Heading 1"
            className="text-2xl font-black border-none bg-transparent shadow-none focus-visible:ring-0 px-0 rounded-none border-b border-transparent focus-visible:border-slate-200"
            onKeyDown={(e) => onOpenSlashMenu(e, index)}
          />
        );
      case 'text':
        return (
          <div className="space-y-2">
            <RichTextEditor 
              value={block.data.text || block.data.content || ''} 
              onChange={(val) => updateBlock(block.id, { ...block.data, text: val })}
              placeholder="Type content for this rich text block..."
            />
          </div>
        );
      case 'reading-passage':
        return (
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Reading Passage Material</div>
            <AutoResizeTextarea 
              value={block.data.text || block.data.content || ''} 
              onChange={(e) => updateBlock(block.id, { ...block.data, text: e.target.value })}
              placeholder="Enter IELTS passage content here..."
              className="border-none bg-transparent shadow-none focus-visible:ring-0 px-0 min-h-[50px] resize-none overflow-hidden text-sm sm:text-base leading-relaxed"
              onKeyDown={(e) => {
                if (e.target instanceof HTMLTextAreaElement) {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }
                onOpenSlashMenu(e, index);
              }}
            />
          </div>
        );
      case 'mcq':
      case 'listening-mcq':
        return (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5">
             <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex justify-between items-center">
               <span>{block.type === 'listening-mcq' ? 'Listening MCQ (Audio-Based)' : 'Multiple Choice Question'}</span>
             </div>
             <Input 
               value={block.data.question || block.data.text || block.data.content || ''}
               onChange={(e) => updateBlock(block.id, { ...block.data, question: e.target.value })}
               placeholder="Enter question text here..."
               className="font-semibold bg-white dark:bg-slate-950 rounded-xl"
             />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
               {['A', 'B', 'C', 'D'].map((opt, i) => (
                 <div key={opt} className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-black shrink-0">{opt}</div>
                   <Input 
                     value={block.data.options?.[i] || ''}
                     onChange={(e) => {
                       const newOpts = [...(block.data.options || ['', '', '', ''])];
                       newOpts[i] = e.target.value;
                       updateBlock(block.id, { ...block.data, options: newOpts });
                     }}
                     placeholder={`Option ${opt}`}
                     className="h-9 text-xs bg-white dark:bg-slate-950 rounded-lg font-medium"
                   />
                 </div>
               ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                 <div className="flex-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Correct Alternative</label>
                   <select 
                     className="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-bold"
                     value={block.data.correct || 'A'}
                     onChange={(e) => updateBlock(block.id, { ...block.data, correct: e.target.value })}
                   >
                     <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                   </select>
                 </div>
                 <div className="flex-[2]">
                   <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Explanatory Feedback</label>
                   <Input 
                      value={block.data.explanation || ''}
                      onChange={(e) => updateBlock(block.id, { ...block.data, explanation: e.target.value })}
                      placeholder="e.g., Paragraph 2 suggests that..."
                      className="h-9 text-xs bg-white dark:bg-slate-950 rounded-xl font-medium"
                    />
                 </div>
              </div>
          </div>
        );
      case 'true-false-not-given':
        return (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5">
             <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex justify-between items-center">
               <span>True / False / Not Given Group Editor</span>
             </div>
             
             {Array.isArray(block.data.statements) ? (
               <div className="space-y-4">
                 {block.data.statements.map((st: any, sIdx: number) => (
                   <div key={sIdx} className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                     <div className="flex items-center gap-2">
                       <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[10px] font-black text-indigo-500">{st.qNum || (sIdx + 1)}</span>
                       <Input 
                         value={st.text || ''}
                         onChange={(e) => {
                           const nextSt = [...block.data.statements];
                           nextSt[sIdx] = { ...st, text: e.target.value };
                           updateBlock(block.id, { ...block.data, statements: nextSt });
                         }}
                         placeholder="Factual statement..."
                         className="h-8 text-xs border-none shadow-none focus-visible:ring-0 px-0"
                       />
                       <select 
                         value={st.correct || 'TRUE'}
                         onChange={(e) => {
                           const nextSt = [...block.data.statements];
                           nextSt[sIdx] = { ...st, correct: e.target.value };
                           updateBlock(block.id, { ...block.data, statements: nextSt });
                         }}
                         className="h-8 rounded-lg border-none bg-slate-50 dark:bg-slate-900 text-[10px] font-bold px-2"
                       >
                         <option value="TRUE">TRUE</option><option value="FALSE">FALSE</option><option value="NOT GIVEN">NG</option>
                       </select>
                       <button onClick={() => {
                         const nextSt = block.data.statements.filter((_: any, i: number) => i !== sIdx);
                         updateBlock(block.id, { ...block.data, statements: nextSt });
                       }} className="text-slate-300 hover:text-red-400">
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}
                 <button 
                  onClick={() => {
                    const nextSt = [...(block.data.statements || []), { text: "", correct: "TRUE", qNum: "" }];
                    updateBlock(block.id, { ...block.data, statements: nextSt });
                  }}
                  className="w-full py-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] uppercase font-black text-slate-400 hover:bg-slate-50 transition-colors"
                 >
                   + Add Statement
                 </button>
               </div>
             ) : (
               <>
                 <Input 
                   value={block.data.statement || block.data.text || block.data.content || ''}
                   onChange={(e) => updateBlock(block.id, { ...block.data, statement: e.target.value })}
                   placeholder="Enter factual statement to evaluate..."
                   className="font-semibold bg-white dark:bg-slate-950 rounded-xl"
                 />
                 <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Evaluation Answer</label>
                      <select 
                        className="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-bold"
                        value={block.data.correct || 'TRUE'}
                        onChange={(e) => updateBlock(block.id, { ...block.data, correct: e.target.value })}
                      >
                        <option value="TRUE">TRUE</option><option value="FALSE">FALSE</option><option value="NOT GIVEN">NOT GIVEN</option>
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Factual Explanation</label>
                      <Input 
                         value={block.data.explanation || ''}
                         onChange={(e) => updateBlock(block.id, { ...block.data, explanation: e.target.value })}
                         placeholder="Evidence quote from reading material..."
                         className="h-9 text-xs bg-white dark:bg-slate-950 rounded-xl font-medium"
                       />
                    </div>
                 </div>
               </>
             )}
          </div>
        );
      case 'fill-blanks':
      case 'listening-fill-blanks':
      case 'sentence-completion':
      case 'summary-completion':
        const fillLabel = block.type === 'fill-blanks' ? 'Fill In The Blanks'
                         : block.type === 'listening-fill-blanks' ? 'Listening Fill Blanks'
                         : block.type === 'sentence-completion' ? 'Sentence Completion'
                         : 'Summary Completion';
        return (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5">
              <AutoResizeTextarea 
                value={block.data.text || block.data.statement || block.data.content || ''}
                onChange={(e) => updateBlock(block.id, { ...block.data, text: e.target.value })}
                placeholder="Enter passage. Use consecutive four underscores ____ to indicate a blank gap."
                className="bg-white dark:bg-slate-950 resize-y min-h-[100px] font-medium text-sm rounded-xl p-3"
              />
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Correct Answers Sequence</label>
                <Input 
                   value={block.data.answers || ''}
                   onChange={(e) => updateBlock(block.id, { ...block.data, answers: e.target.value })}
                   placeholder="e.g. coffee | computers | 2026 (use | to separate answers for consecutive gaps)"
                   className="h-9 text-xs bg-white dark:bg-slate-950 rounded-xl font-bold"
                 />
                 <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">
                   Note: Separate distinct gaps with pipes | (e.g., coffee | sugar). For alternative inputs within a single gap, use commas (e.g., coffee, arabica coffee | sugar).
                 </p>
              </div>
          </div>
        );
      case 'table-completion':
        const headers = block.data.headers || ["Col 1", "Col 2"];
        const rows = block.data.rows || [["____", "____"]];

        const updateTableData = (newHeaders: string[], newRows: string[][]) => {
          updateBlock(block.id, { ...block.data, headers: newHeaders, rows: newRows });
        };

        const addRow = () => {
          const newRow = Array(headers.length).fill("____");
          updateTableData(headers, [...rows, newRow]);
        };

        const deleteRow = (rIdx: number) => {
          const newRows = rows.filter((_: any, idx: number) => idx !== rIdx);
          updateTableData(headers, newRows);
        };

        const addColumn = () => {
          const newHeaders = [...headers, `Col ${headers.length + 1}`];
          const newRows = rows.map((row: string[]) => [...row, "____"]);
          updateTableData(newHeaders, newRows);
        };

        const deleteColumn = (cIdx: number) => {
          if (headers.length <= 1) return;
          const newHeaders = headers.filter((_: any, idx: number) => idx !== cIdx);
          const newRows = rows.map((row: string[]) => row.filter((_: any, idx: number) => idx !== cIdx));
          updateTableData(newHeaders, newRows);
        };

        const updateHeader = (hIdx: number, val: string) => {
          const newHeaders = [...headers];
          newHeaders[hIdx] = val;
          updateTableData(newHeaders, rows);
        };

        const updateCell = (rIdx: number, cIdx: number, val: string) => {
          const newRows = rows.map((row: string[], r: number) => {
            if (r !== rIdx) return row;
            const newRow = [...row];
            newRow[cIdx] = val;
            return newRow;
          });
          updateTableData(headers, newRows);
        };

        return (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5">
             <div className="flex items-center justify-between pointer-events-auto">
               <span className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-2">
                 <TableIcon className="w-4 h-4 text-slate-400" /> Table Completion Builder
               </span>
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={addColumn}
                   className="text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-slate-600 dark:text-slate-300"
                 >
                   <Plus className="w-3 h-3" /> Insert Col
                 </button>
                 <button
                   type="button"
                   onClick={addRow}
                   className="text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-slate-600 dark:text-slate-300"
                 >
                   <Plus className="w-3 h-3" /> Insert Row
                 </button>
               </div>
             </div>

             <div className="overflow-x-auto border border-slate-150 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-950">
               <table className="w-full text-left border-collapse text-xs">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-white/10">
                     {headers.map((hdr: string, hIdx: number) => (
                       <th key={hIdx} className="p-3 font-semibold relative min-w-[120px]">
                         <div className="flex items-center gap-2">
                           <input 
                             value={hdr}
                             onChange={(e) => updateHeader(hIdx, e.target.value)}
                             className="bg-transparent font-black text-slate-800 dark:text-white border-b border-transparent focus:border-indigo-500 focus:outline-none w-full text-xs"
                             placeholder="Header"
                           />
                           {headers.length > 1 && (
                             <button 
                               type="button"
                               onClick={() => deleteColumn(hIdx)}
                               className="text-slate-400 hover:text-red-500 absolute top-1 right-1 p-0.5"
                               title="Remove Column"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           )}
                         </div>
                       </th>
                     ))}
                     <th className="w-12 p-3"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {rows.map((row: string[], rIdx: number) => (
                     <tr key={rIdx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                       {row.map((cell: string, cIdx: number) => (
                         <td key={cIdx} className="p-3">
                           <input 
                             value={cell}
                             onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                             className="bg-transparent text-slate-700 dark:text-slate-300 border-b border-transparent focus:border-indigo-500 focus:outline-none w-full"
                             placeholder="Cell value (use ____ for empty blanks)"
                           />
                         </td>
                       ))}
                       <td className="p-2 text-center">
                         <button 
                           type="button"
                           onClick={() => deleteRow(rIdx)}
                           className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-150 transition-colors"
                           title="Remove Row"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

             <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Question Prompt / Instruction Text</label>
                  <Input 
                    value={block.data.text || ''}
                    onChange={(e) => updateBlock(block.id, { ...block.data, text: e.target.value })}
                    placeholder="Complete the table below with correct values."
                    className="h-9 text-xs bg-white dark:bg-slate-950 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Answers key for table blanks</label>
                  <Input 
                     value={block.data.answers || ''}
                     onChange={(e) => updateBlock(block.id, { ...block.data, answers: e.target.value })}
                     placeholder="e.g. 1st blank | 2nd blank (separated by | )"
                     className="h-9 text-xs bg-white dark:bg-slate-950 rounded-xl font-bold"
                   />
                   <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">
                     List correct answers matching empty `____` table cells sequencially from top-left to bottom-right.
                   </p>
                </div>
             </div>
          </div>
        );
      case 'matching-headings': {
        const parseStringOrArray = (val: any, defaultVal: string) => {
          if (!val) return defaultVal.split("\n");
          if (Array.isArray(val)) return val.map((item: any) => typeof item === 'string' ? item : (item.name || item.text || JSON.stringify(item)));
          if (typeof val === 'string') return val.split("\n");
          return defaultVal.split("\n");
        };

        const headings = parseStringOrArray(block.data.headings, "i. Heading A\nii. Heading B").filter(Boolean);
        const paragraphs = parseStringOrArray(block.data.paragraphs, "Paragraph A\nParagraph B").filter(Boolean);
        const answers = parseStringOrArray(block.data.answers, "i\nii").filter(Boolean);

        const updateMatchingData = (newHeadings: string[], newParagraphs: string[], newAnswers: string[]) => {
          updateBlock(block.id, {
            ...block.data,
            headings: newHeadings.join("\n"),
            paragraphs: newParagraphs.join("\n"),
            answers: newAnswers.join("\n")
          });
        };

        return (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-white/5">
            <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Rich Matching Headings Visual Builder
            </div>

            {/* List of Headings Section */}
            <div className="space-y-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Configure List of Headings</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = headings.length + 1;
                    const romanMap: Record<number, string> = {1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi', 7: 'vii', 8: 'viii', 9: 'ix', 10: 'x'};
                    const prefix = romanMap[nextNum] || `${nextNum}`;
                    updateMatchingData([...headings, `${prefix}. Heading Option ${nextNum}`], paragraphs, answers);
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded transition-colors text-slate-700 dark:text-slate-300 pointer-events-auto cursor-pointer"
                >
                  + Add Heading Option
                </button>
              </div>

              <div className="space-y-2">
                {headings.map((heading: string, hIdx: number) => (
                  <div key={hIdx} className="flex gap-2 items-center">
                    <Input
                      value={heading}
                      onChange={(e) => {
                        const nextH = [...headings];
                        nextH[hIdx] = e.target.value;
                        updateMatchingData(nextH, paragraphs, answers);
                      }}
                      placeholder={`e.g. i. General Introduction`}
                      className="h-9 text-xs bg-transparent rounded-lg font-bold"
                    />
                    {headings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextH = headings.filter((_, idx) => idx !== hIdx);
                          updateMatchingData(nextH, paragraphs, answers);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-colors pointer-events-auto cursor-pointer"
                        title="Remove Option"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* List of Paragraph Prompts + Match Selectors Section */}
            <div className="space-y-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-indigo-655 tracking-wider">Configure Paragraphs & Correct Keys</span>
                <button
                  type="button"
                  onClick={() => {
                    const charcode = 65 + paragraphs.length;
                    const label = String.fromCharCode(charcode <= 90 ? charcode : 65);
                    const defaultPrefix = headings[0]?.split(" ")[0]?.replace(".", "") || "i";
                    updateMatchingData(headings, [...paragraphs, `Paragraph ${label}`], [...answers, defaultPrefix]);
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded transition-colors text-slate-700 dark:text-slate-300 pointer-events-auto cursor-pointer"
                >
                  + Add Paragraph Prompt
                </button>
              </div>

              <div className="space-y-3">
                {paragraphs.map((para: string, pIdx: number) => {
                  const paraAns = answers[pIdx] || "";
                  return (
                    <div key={pIdx} className="flex flex-col sm:flex-row gap-3 sm:items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                      <div className="flex-1 flex gap-2 items-center">
                        <Input
                          value={para}
                          onChange={(e) => {
                            const nextP = [...paragraphs];
                            nextP[pIdx] = e.target.value;
                            updateMatchingData(headings, nextP, answers);
                          }}
                          placeholder="e.g. Paragraph A"
                          className="h-8 text-xs bg-transparent rounded-lg font-bold shrink-0 w-28 sm:w-36"
                        />
                        <div className="text-[10px] uppercase font-bold text-slate-400">matches →</div>
                      </div>
                      
                      <div className="flex-1 flex gap-2 items-center">
                        <select
                          value={paraAns}
                          onChange={(e) => {
                            const nextA = [...answers];
                            nextA[pIdx] = e.target.value;
                            updateMatchingData(headings, paragraphs, nextA);
                          }}
                          className="flex h-8 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs font-bold font-sans"
                        >
                          {headings.map((h, oIdx) => {
                            const prefix = h.split(" ")[0].replace(".", "");
                            return (
                              <option key={oIdx} value={prefix}>
                                {h}
                              </option>
                            );
                          })}
                        </select>
                        {paragraphs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextP = paragraphs.filter((_, idx) => idx !== pIdx);
                              const nextA = answers.filter((_, idx) => idx !== pIdx);
                              updateMatchingData(headings, nextP, nextA);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-colors pointer-events-auto cursor-pointer"
                            title="Remove Prompt"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'image':
        return (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Image Block Settings
            </div>
            {block.data.url && (
              <div className="relative group rounded-xl overflow-hidden bg-white dark:bg-slate-950 flex flex-col items-center justify-center border border-slate-205 dark:border-slate-800 p-2.5 max-w-full">
                <img 
                  src={block.data.url} 
                  alt={block.data.caption || "Image preview"} 
                  className="max-h-48 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
                {block.data.caption && (
                  <p className="text-xs text-slate-500 font-semibold italic mt-2 text-center">{block.data.caption}</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Input 
                value={block.data.url || ''} 
                onChange={(e) => updateBlock(block.id, { ...block.data, url: e.target.value })}
                placeholder="Source Image URL (e.g. https://images.unsplash.com/...)"
                className="flex-grow bg-white dark:bg-slate-950 font-mono text-xs rounded-lg h-9"
              />
              <label className="cursor-pointer shrink-0 h-9 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center">
                Upload File
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateBlock(block.id, { ...block.data, url: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <Input 
              value={block.data.caption || ''} 
              onChange={(e) => updateBlock(block.id, { ...block.data, caption: e.target.value })}
              placeholder="Caption/Subtitle description (optional)"
              className="bg-white dark:bg-slate-950 text-xs rounded-lg h-9"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5" /> Audio Track Player settings
            </div>
            <Input 
              value={block.data.url || ''} 
              onChange={(e) => updateBlock(block.id, { ...block.data, url: e.target.value })}
              placeholder="Audio URL path (e.g. https://example.com/audio.mp3)"
              className="bg-white dark:bg-slate-950 font-mono text-xs rounded-lg h-9"
            />
          </div>
        );
      case 'video':
        return (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-2">
              <VideoIcon className="w-3.5 h-3.5" /> Video Embedded Media
            </div>
            {block.data.url && (
              <div className="relative group rounded-xl overflow-hidden bg-white dark:bg-slate-950 flex flex-col items-center justify-center border border-slate-205 dark:border-slate-800 p-2.5 max-w-full">
                <SecureVideoPlayer
                  url={block.data.url}
                  title={block.data.caption || "Video Preview"}
                  className="w-full aspect-video rounded-lg max-h-56"
                />
                {block.data.caption && (
                  <p className="text-xs text-slate-500 font-semibold italic mt-2 text-center">{block.data.caption}</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Input 
                value={block.data.url || ''} 
                onChange={(e) => updateBlock(block.id, { ...block.data, url: e.target.value })}
                placeholder="Embedded Video path (e.g. YouTube web link)"
                className="flex-grow bg-white dark:bg-slate-950 font-mono text-xs rounded-lg h-9"
              />
              <label className="cursor-pointer shrink-0 h-9 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center">
                Upload File
                <input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateBlock(block.id, { ...block.data, url: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <Input 
              value={block.data.caption || ''} 
              onChange={(e) => updateBlock(block.id, { ...block.data, caption: e.target.value })}
              placeholder="Caption/Subtitle description (optional)"
              className="bg-white dark:bg-slate-950 text-xs rounded-lg h-9"
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> PDF Reference Viewer
            </div>
            <Input 
              value={block.data.url || ''} 
              onChange={(e) => updateBlock(block.id, { ...block.data, url: e.target.value })}
              placeholder="Reference PDF path (e.g. document link)"
              className="bg-white dark:bg-slate-950 font-mono text-xs rounded-lg h-9"
            />
          </div>
        );
      case 'note':
      case 'tip':
      case 'band-descriptor':
        const boxLabel = block.type === 'note' ? 'Callout Note' : block.type === 'tip' ? 'Exam Tip' : 'Band Descriptor Advisor';
        const boxBg = block.type === 'note' ? 'bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/30'
                    : block.type === 'tip' ? 'bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30'
                    : 'bg-indigo-50/50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/30';
        return (
          <div className={`p-4 rounded-xl border ${boxBg} space-y-2`}>
            <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 opacity-80">
              <Sparkles className="w-3.5 h-3.5" /> {boxLabel}
            </div>
            <AutoResizeTextarea 
              value={block.data.text || ''}
              onChange={(e) => updateBlock(block.id, { ...block.data, text: e.target.value })}
              placeholder={`Enter ${boxLabel.toLowerCase()} contents here...`}
              className="bg-transparent border-none p-0 focus-visible:ring-0 shadow-none text-sm leading-relaxed"
            />
          </div>
        );
      case 'question-range':
        return (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="font-bold text-[10px] uppercase text-indigo-500 mb-2 tracking-widest flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" /> Questions Range Context
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Visible Heading / Range</label>
                  <Input 
                    value={block.data.range || block.data.text || ''} 
                    onChange={(e) => updateBlock(block.id, { ...block.data, range: e.target.value })}
                    placeholder="e.g. QUESTIONS 1–7: TRUE / FALSE / NOT GIVEN"
                    className="bg-white dark:bg-slate-950 text-xs rounded-xl h-10 font-bold border-slate-200 dark:border-slate-800"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Detailed Instructions</label>
                  <AutoResizeTextarea 
                    value={block.data.instruction || ''} 
                    onChange={(e) => updateBlock(block.id, { ...block.data, instruction: e.target.value })}
                    placeholder="e.g. Write TRUE if the statement agrees with the information..."
                    className="bg-white dark:bg-slate-950 text-xs rounded-xl min-h-[80px] font-medium border-slate-200 dark:border-slate-800"
                  />
               </div>
            </div>
          </div>
        );
      case 'divider':
        return (
          <div className="py-2 flex items-center justify-center">
            <span className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></span>
            <span className="shrink-0 px-4 text-[9px] uppercase tracking-widest text-slate-400 font-extrabold bg-white dark:bg-slate-900">Divider line</span>
            <span className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></span>
          </div>
        );
      case 'listening-section':
        return (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="font-bold text-xs uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5" /> Listening Section Header
            </div>
            <Input 
              value={block.data.text || ''} 
              onChange={(e) => updateBlock(block.id, { ...block.data, text: e.target.value })}
              placeholder="e.g. Section 1"
              className="bg-white dark:bg-slate-950 text-xs rounded-lg h-9 font-bold"
            />
          </div>
        );

      default:
        return (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">?</span>
            </div>
            <h4 className="text-sm font-semibold">{meta?.title || block.type}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Advanced block editor placeholder. Configure JSON data directly below.</p>
            <AutoResizeTextarea
              className="mt-4 text-[10px] font-mono bg-white dark:bg-slate-950 h-24"
              value={JSON.stringify(block.data, null, 2)}
              onChange={(e) => {
                try {
                  const p = JSON.parse(e.target.value);
                  updateBlock(block.id, p);
                } catch(err) { /* ignore invalid json while typing */ }
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className="group relative flex items-start gap-2 py-1">
      {/* Block Controls (Hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-2 shrink-0">
        <button 
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button 
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          onClick={() => duplicateBlock(block.id)}
          title="Duplicate Block"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button 
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
          onClick={() => deleteBlock(block.id)}
          title="Delete Block"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Content */}
      <div className="flex-1 min-w-0">
        {renderBlockEditor()}
      </div>
    </div>
  );
}
