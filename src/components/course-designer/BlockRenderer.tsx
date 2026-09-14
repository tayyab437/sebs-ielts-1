import React from "react";
import { BlockData, BlockType } from "./types";

interface BlockRendererProps {
  block: BlockData;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type as string) {
    case 'heading':
      return <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 my-4 tracking-tight">{block.data.text || block.data.content || block.data.title || "Heading"}</h2>;
    case 'text':
      const textVal = block.data.text || block.data.content || "";
      if (/<[a-z][\s\S]*>/i.test(textVal)) {
        return (
          <div 
            className="text-slate-650 dark:text-slate-300 leading-relaxed my-3 prose dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_video]:max-w-full [&_video]:rounded-xl [&_video]:my-3 text-sm sm:text-base font-medium" 
            dangerouslySetInnerHTML={{ __html: textVal }} 
          />
        );
      }
      return <p className="text-slate-650 dark:text-slate-300 leading-relaxed my-2 whitespace-pre-wrap text-sm sm:text-base font-medium">{textVal}</p>;
    
    case 'mcq':
    case 'listening-mcq': {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      return (
        <div className="my-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm text-left">
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-2">
            {block.type === 'listening-mcq' ? 'Listening MCQ' : 'Multiple Choice Question'} {block.data.questionNumber || block.data.qNum ? `(Q${block.data.questionNumber || block.data.qNum})` : ''}
          </span>
          <h4 className="font-extrabold text-slate-800 dark:text-slate-250 mb-4 text-base sm:text-lg tracking-tight leading-snug">{block.data.question || block.data.text || block.data.content || ""}</h4>
          <div className="space-y-2.5">
            {block.data.options?.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input type="radio" disabled name={`mcq_${block.id}`} className="w-4 h-4 text-indigo-600 border-slate-300 pointer-events-none" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  <span className="inline-block w-5 text-indigo-400 font-extrabold">{letters[i]}.</span> {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'yes-no-not-given':
    case 'yes-no':
    case 'yn':
    case 'ynng':
    case 'true-false-not-given': {
      const isYN = (block.type as string).includes('yes') || (block.type as string).includes('yn');
      const optionsList = isYN ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'];
      const headingLabel = isYN ? 'Opinion Verification (YNNG)' : 'Direct Verification (TFNG)';
      const singleHeadingLabel = isYN ? 'Opinion Verification Statement' : 'Direct Verification Statement';

      if (Array.isArray(block.data.statements)) {
        return (
          <div className="my-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm text-left space-y-6">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black uppercase text-indigo-505 tracking-widest block">{headingLabel}</span>
            </div>
            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {block.data.statements.map((st: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row gap-4 justify-between items-start pt-4 first:pt-0">
                  <div className="flex-1">
                    <span className="inline-block mr-2 font-black text-indigo-400">{st.qNum || (i + 1)}.</span>
                    <span className="text-slate-700 dark:text-slate-200 text-sm sm:text-base font-semibold leading-relaxed">{st.text || st.statement}</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {optionsList.map(opt => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-905">
                        <span className="text-slate-500 text-[10px] uppercase font-black">{opt}</span>
                        <input type="radio" disabled name={`tfng_${block.id}_${i}`} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-600" />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="my-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm text-left">
          <span className="text-[10px] font-black uppercase text-indigo-505 tracking-widest block mb-3">{singleHeadingLabel}</span>
          <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
             <div className="flex-1">
                <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm sm:text-base leading-relaxed">
                   {block.data.qNum || block.data.questionNumber ? <span className="text-indigo-400 font-black mr-2">{block.data.qNum || block.data.questionNumber}.</span> : ''}
                   {block.data.statement || block.data.text || block.data.content || ""}
                </p>
             </div>
             <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                {optionsList.map(opt => (
                  <label key={opt} className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800">
                     <span className="text-slate-505">{opt}</span>
                     <input type="radio" disabled name={`tfng_${block.id}`} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-600" />
                  </label>
                ))}
             </div>
          </div>
        </div>
      );
    }

    case 'fill-blanks':
    case 'listening-fill-blanks':
    case 'sentence-completion':
    case 'summary-completion': {
      if (Array.isArray(block.data.sentences)) {
        return (
          <div className="my-6 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 text-left space-y-4">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">
                {block.type.replace('-', ' ')}
              </span>
            </div>
            <div className="space-y-3.5">
              {block.data.sentences.map((st: any, i: number) => {
                let textCleaned = st.text || "";
                if (textCleaned.includes("[") && textCleaned.includes("]")) {
                  textCleaned = textCleaned.replace(/\[[^\]]+\]/g, "_____");
                }
                textCleaned = textCleaned.replace(/_{4,}/g, "_____");
                const parts = textCleaned.split('_____');
                return (
                  <div key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-semibold">
                    <span className="font-black mr-2 text-indigo-400">{st.qNum || (i + 1)}.</span>
                    {parts.map((part: string, pIdx: number) => (
                      <React.Fragment key={pIdx}>
                        {part}
                        {pIdx < parts.length - 1 && (
                          <input 
                            type="text" 
                            disabled
                            placeholder="..."
                            className="mx-1 px-2.5 py-0.5 w-24 border-b-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-950 text-indigo-600 font-bold focus:outline-none text-center rounded-md text-xs sm:text-sm"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      
      let rawText = block.data.text || block.data.statement || block.data.content || "";
      if (rawText.includes("[") && rawText.includes("]")) {
         rawText = rawText.replace(/\[[^\]]+\]/g, "_____");
      }
      rawText = rawText.replace(/_{4,}/g, "_____");
      const parts = rawText.split('_____');
      return (
        <div className="my-6 p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-[2rem] border border-slate-100 dark:border-slate-800/65 text-left">
           <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-3">{block.type.replace('-', ' ')}</span>
           {block.data.instruction && <p className="text-xs text-slate-405 italic mb-4 font-medium">{block.data.instruction}</p>}
           <div className="text-slate-705 dark:text-slate-300 leading-loose text-sm sm:text-base font-semibold">
             {block.data.startQNum || block.data.qNum ? <span className="text-indigo-400 font-black mr-2">{block.data.startQNum || block.data.qNum}.</span> : ''}
             {parts.map((part: string, i: number) => (
               <React.Fragment key={i}>
                 {part}
                 {i < parts.length - 1 && (
                   <input 
                     type="text" 
                     disabled
                     placeholder="..."
                     className="mx-1 px-2 w-28 border-b-2 border-indigo-500 bg-white dark:bg-slate-950 text-indigo-600 font-extrabold text-center rounded-md text-xs sm:text-sm"
                   />
                 )}
               </React.Fragment>
             ))}
           </div>
        </div>
      );
    }

    case 'short-answer':
    case 'sa': {
      if (Array.isArray(block.data.questions)) {
        return (
          <div className="my-6 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 text-left space-y-4">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black uppercase text-indigo-505 tracking-widest block">Short Answer Questions</span>
            </div>
            <div className="space-y-4">
              {block.data.questions.map((q: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="text-slate-705 dark:text-slate-300 text-sm sm:text-base font-semibold">
                    <span className="font-black mr-2 text-indigo-405">{q.qNum || (i + 1)}.</span>
                    {q.text || q.question}
                  </div>
                  <input 
                    type="text" 
                    disabled
                    placeholder="Type your answer here..."
                    className="px-3.5 py-2 w-full max-w-md border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-600 font-bold focus:outline-none rounded-xl text-xs sm:text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="my-6 p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-[2rem] border border-slate-100 dark:border-slate-800/65 text-left">
          <span className="text-[10px] font-black uppercase text-indigo-505 tracking-widest block mb-3">Short Answer Question</span>
          <div className="space-y-2">
            <div className="text-slate-705 dark:text-slate-300 text-sm sm:text-base font-semibold">
              {block.data.qNum || block.data.questionNumber ? <span className="text-indigo-405 font-black mr-2">{block.data.qNum || block.data.questionNumber}.</span> : ''}
              {block.data.question || block.data.text || block.data.content || ""}
            </div>
            <input 
              type="text" 
              disabled
              placeholder="Type your answer here..."
              className="px-3.5 py-2 w-full max-w-md border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-600 font-bold focus:outline-none rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>
      );
    }

    case 'matching':
    case 'matching-headings':
    case 'matching-information':
    case 'matching-features': {
      let prompts: string[] = [];
      let optionsList: string[] = [];
      
      if (Array.isArray(block.data.paragraphs)) {
        prompts = block.data.paragraphs.map((p: any) => p.name || p.text || "");
      } else if (Array.isArray(block.data.statements)) {
        prompts = block.data.statements.map((st: any) => st.text || "");
      } else if (typeof block.data.paragraphs === "string") {
        prompts = block.data.paragraphs.split('\n').filter(Boolean);
      } else if (typeof block.data.statements === "string") {
        prompts = block.data.statements.split('\n').filter(Boolean);
      } else if (typeof block.data.text === "string") {
        prompts = block.data.text.split('\n').filter(Boolean);
      } else if (typeof block.data.content === "string") {
        prompts = block.data.content.split('\n').filter(Boolean);
      }

      if (Array.isArray(block.data.headings)) {
        optionsList = block.data.headings;
      } else if (Array.isArray(block.data.options)) {
        optionsList = block.data.options;
      } else if (typeof block.data.headings === "string") {
        optionsList = block.data.headings.split('\n').filter(Boolean);
      } else if (typeof block.data.options === "string") {
        optionsList = block.data.options.split('\n').filter(Boolean);
      } else if (typeof block.data.passageText === "string") {
        optionsList = block.data.passageText.split('\n').filter(Boolean);
      } else if (typeof block.data.features === "string") {
        optionsList = block.data.features.split('\n').filter(Boolean);
      }

      return (
        <div className="my-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm text-left space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">{block.type.replace('-', ' ')}</span>
          </div>

          {optionsList.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-900">
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Available Keys / Headings list:</span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-350 text-xs sm:text-sm">
                {optionsList.map((opt, oIdx) => (
                  <li key={oIdx} className="font-semibold leading-relaxed">{opt}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {prompts.map((prompt, pIdx) => {
              let qNum = "";
              if (Array.isArray(block.data.paragraphs)) {
                const p = block.data.paragraphs[pIdx];
                if (p && p.qNum) qNum = `${p.qNum}. `;
              } else if (Array.isArray(block.data.statements)) {
                const st = block.data.statements[pIdx];
                if (st && st.qNum) qNum = `${st.qNum}. `;
              } else {
                let startQNum = block.data.startQNum || block.data.qNum || 1;
                if (block.id) {
                  const idMatch = block.id.match(/(\d+)/);
                  if (idMatch) {
                    startQNum = parseInt(idMatch[1], 10);
                  }
                }
                qNum = `${startQNum + pIdx}. `;
              }
              return (
                <div key={pIdx} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-3 border-b border-b-slate-100 dark:border-b-slate-800 last:border-0 last:pb-0 pt-3 first:pt-0">
                  <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold leading-relaxed">
                    <span className="text-indigo-400 font-extrabold mr-1">{qNum}</span>{prompt}
                  </span>
                  <select disabled className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-xs text-indigo-600 focus:outline-none w-full sm:w-48 appearance-none">
                    <option>Select Match...</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'academic-task1':
    case 'general-task1':
    case 'task2':
      return (
        <div className="my-6 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 space-y-4 text-left">
          <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-extrabold text-[9px] uppercase tracking-wider">
            IELTS Writing {block.type === 'task2' ? 'Task 2 (Essay)' : 'Task 1 (Report/Letter)'}
          </span>
          {block.data.title && <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{block.data.title}</h3>}
          <div className="p-4 bg-white dark:bg-slate-955 rounded-2xl border border-slate-150 dark:border-slate-800/50 space-y-3">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Writing Topic Prompt:</span>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-semibold">{block.data.prompt || block.data.text || ""}</p>
          </div>
        </div>
      );

    case 'part1':
    case 'cue-card':
    case 'part3':
      return (
        <div className="my-6 p-6 bg-slate-50/50 dark:bg-indigo-950/10 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-950/30 space-y-4 text-left">
          <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-305 font-extrabold text-[9px] uppercase tracking-wider">
            IELTS Speaking {block.type === 'part1' ? 'Part 1 (Intro)' : block.type === 'cue-card' ? 'Part 2 (Cue Card)' : 'Part 3 (Discussion)'}
          </span>
          {block.data.title && <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{block.data.title}</h3>}
          <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-indigo-50/30 dark:border-indigo-950/20 space-y-3">
            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block">Speaking Prompt:</span>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-semibold">
              {block.data.prompt || block.data.text || (Array.isArray(block.data.questions) ? block.data.questions.join("\n") : "")}
            </p>
          </div>
        </div>
      );

    case 'downloadable-resource':
      return (
        <div className="my-4 p-4 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-550/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <span className="font-extrabold text-xs">PDF</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-750 dark:text-slate-200">{block.data.title || "Study Resource File"}</h5>
              <p className="text-xs text-slate-400 dark:text-slate-500">{block.data.fileSize || "Attachment PDF file"}</p>
            </div>
          </div>
          <button disabled className="text-xs font-black text-indigo-650 dark:text-indigo-400 hover:underline">Download</button>
        </div>
      );

    case 'image':
      return (
        <div className="my-5 space-y-2">
          {block.data.url && (
            <img 
              src={block.data.url} 
              alt={block.data.caption || 'Course Image'} 
              className="w-full max-h-[500px] object-contain rounded-2xl border border-slate-100 dark:border-slate-800"
              referrerPolicy="no-referrer"
            />
          )}
          {block.data.caption && (
            <p className="text-center text-xs text-slate-500 font-semibold italic mt-1.5">
              {block.data.caption}
            </p>
          )}
        </div>
      );
    case 'video':
      return (
        <div className="my-5 space-y-2">
          {block.data.url && (
            block.data.url.includes('youtube.com') || block.data.url.includes('youtu.be') ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <iframe
                  src={block.data.url.replace('watch?v=', 'embed/')}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <video 
                src={block.data.url} 
                className="w-full rounded-2xl border border-slate-100 dark:border-slate-800"
                controls
              />
            )
          )}
          {block.data.caption && (
            <p className="text-center text-xs text-slate-500 font-semibold italic mt-1.5">
              {block.data.caption}
            </p>
          )}
        </div>
      );
    case 'audio':
      return (
        <div className="my-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-white/5 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Audio Player Channel</span>
          <audio src={block.data.url || ''} controls className="w-full" />
        </div>
      );
    case 'reading-passage':
      return (
        <div className="my-6 p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-850 text-left">
          <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block mb-2">Reading Passage</span>
          {block.data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 leading-tight">{block.data.title}</h3>
          )}
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{block.data.content || block.data.text}</p>
        </div>
      );
    case 'note':
    case 'tip':
    case 'band-descriptor': {
      const isTip = block.type === 'tip';
      const isBand = block.type === 'band-descriptor';
      const bgClass = isTip ? "from-yellow-50/50 to-amber-50/50 dark:from-amber-950/10 dark:to-yellow-950/10 border-amber-200/50 dark:border-amber-500/10" : isBand ? "from-purple-50/50 to-indigo-50/50 dark:from-purple-950/10 dark:to-indigo-950/10 border-purple-200/50 dark:border-purple-500/10" : "from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20 border-slate-200 dark:border-white/5";
      const badgeText = isTip ? "Exam Tip" : isBand ? "IELTS Band Descriptor Advice" : "Lecture Note";
      const badgeBg = isTip ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" : isBand ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300";
      return (
        <div className={`my-5 p-5 bg-gradient-to-r ${bgClass} rounded-2xl border flex flex-col gap-2 relative shadow-inner max-w-2xl mx-auto text-left`}>
          <div className="flex items-center">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeBg}`}>
              {badgeText}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mt-2">
            {block.data.text}
          </p>
        </div>
      );
    }
    case 'question-range':
      return (
        <div className="my-4 text-left border-l-4 border-indigo-500 pl-4 py-2 space-y-1">
          <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {block.data.range || block.data.text || "Questions Range"}
          </h4>
          {block.data.instruction && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-pre-wrap">
              {block.data.instruction}
            </p>
          )}
        </div>
      );
    case 'listening-section':
      return (
        <div className="my-4 text-left border-l-4 border-emerald-500 pl-4 py-1">
          <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{block.data.text}</h4>
        </div>
      );
    case 'table-completion':
      return (
        <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-left">
          <table className="w-full text-left border-collapse">
            {block.data.headers && block.data.headers.length > 0 && (
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5">
                  {block.data.headers.map((h: string, hIdx: number) => (
                    <th key={hIdx} className="p-4 text-xs font-black uppercase text-slate-555 tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.data.rows?.map((row: string[], rIdx: number) => (
                <tr key={rIdx} className="border-b border-slate-100 dark:border-white/5 last:border-b-0 hover:bg-slate-50/20 dark:hover:bg-slate-900/15">
                  {row.map((cell: string, cIdx: number) => {
                    const isBlank = cell.trim() === "____";
                    return (
                      <td key={cIdx} className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isBlank ? (
                          <input 
                            type="text" 
                            placeholder="Type answer..."
                            disabled
                            className="bg-transparent border-b border-dashed border-slate-400 text-center w-28 text-indigo-600 font-bold focus:outline-none"
                          />
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <div className="my-4 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-sm text-left">
          [{block.type} block rendered]
        </div>
      );
  }
}
