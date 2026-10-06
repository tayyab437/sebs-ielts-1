import React from "react";
import { BookOpen, Headphones, PenTool, Mic, Sparkles, Volume2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSkillCoursePreset, SkillType } from "@/src/utils/courseSkillPresets";

interface CourseSkillConfigPanelProps {
  course: any;
  onChange: (updatedCourse: any) => void;
}

export default function CourseSkillConfigPanel({ course, onChange }: CourseSkillConfigPanelProps) {
  const currentSkill: SkillType = 
    course.category === "Reading" || course.course_type === "Reading" ? "Reading" :
    course.category === "Listening" || course.course_type === "Listening" ? "Listening" :
    course.category === "Writing" || course.course_type === "Writing" ? "Writing" :
    course.category === "Speaking" || course.course_type === "Speaking" ? "Speaking" : "Reading";

  const handleApplySkill = (skill: SkillType) => {
    const preset = getSkillCoursePreset(skill);
    onChange({
      ...course,
      category: preset.category,
      course_type: preset.course_type,
      skill_category: preset.skill_category,
      // Keep user's custom title/desc if already typed, otherwise prefill from preset
      title: course.title && course.title.trim() !== "" ? course.title : preset.title,
      description: course.description && course.description.trim() !== "" ? course.description : preset.description,
      level: course.level || preset.level,
      type: course.type || preset.type,
      difficulty: course.difficulty || preset.difficulty,
      // Merge platform configuration properties
      reading_passage_title: preset.reading_passage_title,
      reading_passage_type: preset.reading_passage_type,
      reading_target_time_minutes: preset.reading_target_time_minutes,
      reading_question_types: preset.reading_question_types,
      reading_passage_text: preset.reading_passage_text,
      listening_audio_url: preset.listening_audio_url,
      listening_accent_profile: preset.listening_accent_profile,
      listening_section_focus: preset.listening_section_focus,
      listening_question_types: preset.listening_question_types,
      listening_audio_transcript: preset.listening_audio_transcript,
      writing_task_type: preset.writing_task_type,
      writing_target_words: preset.writing_target_words,
      writing_prompt: preset.writing_prompt,
      writing_model_answer: preset.writing_model_answer,
      writing_rubrics_focus: preset.writing_rubrics_focus,
      speaking_part_stage: preset.speaking_part_stage,
      speaking_cue_card_prompt: preset.speaking_cue_card_prompt,
      speaking_prep_time_seconds: preset.speaking_prep_time_seconds,
      speaking_response_time_seconds: preset.speaking_response_time_seconds,
      speaking_focus_points: preset.speaking_focus_points,
      // If course has no modules yet, load blueprint
      modules: (!course.modules || course.modules.length === 0) ? preset.modules : course.modules,
    });
  };

  return (
    <div className="space-y-5 p-6 rounded-[2rem] bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-black italic uppercase tracking-wider text-slate-800 dark:text-white">
              IELTS Skill Focus & Platform Blueprint
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select the primary core module to apply specialized configuration fields, blueprints, and evaluation rubrics.
          </p>
        </div>

        <Badge variant="outline" className="w-fit text-[10px] font-black uppercase italic bg-primary/5 text-primary border-primary/20">
          Module: {currentSkill}
        </Badge>
      </div>

      {/* 4 Skill Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => handleApplySkill("Reading")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs transition-all cursor-pointer border ${
            currentSkill === "Reading"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>📖 Reading</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplySkill("Listening")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs transition-all cursor-pointer border ${
            currentSkill === "Listening"
              ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20 scale-[1.02]"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-sky-500/50"
          }`}
        >
          <Headphones className="w-4 h-4 text-sky-300" />
          <span>🎧 Listening</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplySkill("Writing")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs transition-all cursor-pointer border ${
            currentSkill === "Writing"
              ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 scale-[1.02]"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500/50"
          }`}
        >
          <PenTool className="w-4 h-4 text-amber-300" />
          <span>✍️ Writing</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplySkill("Speaking")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs transition-all cursor-pointer border ${
            currentSkill === "Speaking"
              ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 scale-[1.02]"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-rose-500/50"
          }`}
        >
          <Mic className="w-4 h-4 text-rose-300" />
          <span>🎙️ Speaking</span>
        </button>
      </div>

      {/* Dynamic Skill Platform Configurations */}
      {currentSkill === "Reading" && (
        <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-white/5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Reading Passage & Question Architecture
            </h5>
            <span className="text-[10px] text-slate-400 font-bold">Standard 20-min timed passage</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Passage Headline Title</Label>
              <Input
                value={course.reading_passage_title || ""}
                onChange={(e) => onChange({ ...course, reading_passage_title: e.target.value })}
                placeholder="e.g. The Architecture of Megacities and Urban Ecology"
                className="h-10 rounded-xl font-bold text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Recommended Time (Minutes)</Label>
              <Input
                type="number"
                value={course.reading_target_time_minutes || 20}
                onChange={(e) => onChange({ ...course, reading_target_time_minutes: Number(e.target.value) || 20 })}
                className="h-10 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black italic text-slate-400">Full Academic Reading Passage Text</Label>
            <textarea
              rows={4}
              value={course.reading_passage_text || ""}
              onChange={(e) => onChange({ ...course, reading_passage_text: e.target.value })}
              placeholder="Paste or write the complete reading passage text with paragraph breaks..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black italic text-slate-400">Target Question Types</Label>
            <div className="flex flex-wrap gap-1.5">
              {["True/False/Not Given", "Matching Headings", "Sentence Completion", "Summary Completion", "Multiple Choice", "Diagram Labelling"].map((qType) => {
                const types = course.reading_question_types || ["True/False/Not Given", "Matching Headings"];
                const isSelected = types.includes(qType);
                return (
                  <button
                    key={qType}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? types.filter((t: string) => t !== qType) : [...types, qType];
                      onChange({ ...course, reading_question_types: next });
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      isSelected ? "bg-emerald-600 text-white shadow-sm" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-emerald-500"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {qType}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentSkill === "Listening" && (
        <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-white/5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              Listening Audio Stream & Multi-Accent Setup
            </h5>
            <span className="text-[10px] text-slate-400 font-bold">4-Section IELTS Structure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Audio Track / Stream URL (MP3/WAV/OGG)</Label>
              <Input
                value={course.listening_audio_url || ""}
                onChange={(e) => onChange({ ...course, listening_audio_url: e.target.value })}
                placeholder="https://.../listening_track_section1.mp3"
                className="h-10 rounded-xl font-bold text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Accent Profile & Speaker Variety</Label>
              <select
                value={course.listening_accent_profile || "British Council RP, Australian & North American Mixed"}
                onChange={(e) => onChange({ ...course, listening_accent_profile: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold"
              >
                <option value="British Council RP, Australian & North American Mixed">British RP, Australian & North American (Standard)</option>
                <option value="British RP Only">British RP Only (Oxford/Cambridge)</option>
                <option value="Australian & New Zealand">Australian & New Zealand</option>
                <option value="North American (US & Canada)">North American (US & Canada)</option>
                <option value="Global Mixed Accents (Section 3-4)">Global Mixed Accents (Section 3-4)</option>
              </select>
            </div>
          </div>

          {/* Audio Player Test Preview */}
          {course.listening_audio_url && (
            <div className="p-3 bg-sky-50 dark:bg-sky-950/20 rounded-xl border border-sky-200/50 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-sky-600 shrink-0" />
              <audio controls src={course.listening_audio_url} className="w-full h-8" />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black italic text-slate-400">Audio Script / Dialogue Transcript</Label>
            <textarea
              rows={3}
              value={course.listening_audio_transcript || ""}
              onChange={(e) => onChange({ ...course, listening_audio_transcript: e.target.value })}
              placeholder="[Section 1: Social Context Enquiry]&#10;Advisor: Good morning, City Admissions...&#10;Student: Hello, I am calling about..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      )}

      {currentSkill === "Writing" && (
        <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-white/5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5" />
              Writing Task Prompt & Band 9 Blueprint
            </h5>
            <span className="text-[10px] text-slate-400 font-bold">4 Assessment Criteria: TA/TR, CC, LR, GRA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Writing Task Format</Label>
              <select
                value={course.writing_task_type || "Task 2 Academic Essay & Task 1 Visual Analysis"}
                onChange={(e) => onChange({ ...course, writing_task_type: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold"
              >
                <option value="Task 2 Academic Essay & Task 1 Visual Analysis">Task 1 Visual Analysis + Task 2 Essay</option>
                <option value="Task 2 Essay Mastery Only (250+ Words)">Task 2 Essay Mastery Only (250+ Words)</option>
                <option value="Task 1 Academic Charts, Maps & Process Diagrams">Task 1 Academic Charts, Maps & Process Diagrams</option>
                <option value="Task 1 GT Letters (Formal, Semi-Formal, Informal)">Task 1 GT Letters (Formal, Semi-Formal, Informal)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Target Word Count</Label>
              <Input
                type="number"
                value={course.writing_target_words || 250}
                onChange={(e) => onChange({ ...course, writing_target_words: Number(e.target.value) || 250 })}
                className="h-10 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black italic text-slate-400">Official Exam Task Prompt</Label>
            <textarea
              rows={2}
              value={course.writing_prompt || ""}
              onChange={(e) => onChange({ ...course, writing_prompt: e.target.value })}
              placeholder="e.g. Some people believe that university education should be free for all citizens..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black italic text-slate-400">Band 9 Sample Model Answer</Label>
            <textarea
              rows={3}
              value={course.writing_model_answer || ""}
              onChange={(e) => onChange({ ...course, writing_model_answer: e.target.value })}
              placeholder="Provide a comprehensive Band 9 response demonstrating high lexical resource and grammatical range..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      )}

      {currentSkill === "Speaking" && (
        <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-white/5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Speaking Interview Blueprint & Cue Card Drills
            </h5>
            <span className="text-[10px] text-slate-400 font-bold">Parts 1, 2 & 3 Interview Flow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Speaking Stage Focus</Label>
              <select
                value={course.speaking_part_stage || "Part 1, Part 2 Cue Card & Part 3 Abstract Discussion"}
                onChange={(e) => onChange({ ...course, speaking_part_stage: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold"
              >
                <option value="Part 1, Part 2 Cue Card & Part 3 Abstract Discussion">Full 3-Part Face-to-Face Simulation</option>
                <option value="Part 2 Individual Long Turn (Cue Cards Only)">Part 2 Individual Long Turn (Cue Cards Only)</option>
                <option value="Part 1 Introductory & Familiar Questions">Part 1 Introductory & Familiar Questions</option>
                <option value="Part 3 Abstract Analytical Discussion">Part 3 Abstract Analytical Discussion</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black italic text-slate-400">Response Timer (Sec)</Label>
              <Input
                type="number"
                value={course.speaking_response_time_seconds || 120}
                onChange={(e) => onChange({ ...course, speaking_response_time_seconds: Number(e.target.value) || 120 })}
                className="h-10 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black italic text-slate-400">Part 2 Cue Card Prompt & Bullet Points</Label>
            <textarea
              rows={3}
              value={course.speaking_cue_card_prompt || ""}
              onChange={(e) => onChange({ ...course, speaking_cue_card_prompt: e.target.value })}
              placeholder="Describe an ambition you have had for a long time.&#10;You should say:&#10;• What it is&#10;• Why you want to achieve it..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
