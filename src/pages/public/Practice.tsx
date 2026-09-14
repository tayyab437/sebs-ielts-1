import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  Mic, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Target, 
  Flame, 
  FileText, 
  Layers,
  ChevronRight,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PracticePageProps {
  isDashboardMode?: boolean;
}

export default function PracticePage({ isDashboardMode = false }: PracticePageProps) {
  const { skill } = useParams<{ skill?: string }>();
  const navigate = useNavigate();

  const validSkills = ["reading", "listening", "writing", "speaking"];
  const currentSkill = skill && validSkills.includes(skill.toLowerCase()) ? skill.toLowerCase() : "all";

  const handleSkillTabChange = (selected: string) => {
    const basePath = isDashboardMode ? "/dashboard/practice" : "/practice";
    if (selected === "all") {
      navigate(basePath);
    } else {
      navigate(`${basePath}/${selected}`);
    }
  };

  const skillModules = [
    {
      id: "reading",
      title: "IELTS Reading Master Practice",
      tag: "Academic & GT Passages",
      icon: <BookOpen className="w-5 h-5" />,
      color: "emerald",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
      description: "True/False/Not Given, Heading Matching, Summary Completion, and Multiple Choice questions with authentic passage timers.",
      topics: ["Academic Science & History", "General Training Workplace Texts", "Speed Skimming & Scanning Heuristics", "Vocabulary in Context"],
      testCount: "120+ Practice Passages",
      actionText: "Practice Reading",
      actionUrl: isDashboardMode ? "/dashboard/mock-tests?skill=Reading" : "/mock-tests?skill=Reading"
    },
    {
      id: "listening",
      title: "IELTS Listening Lab",
      tag: "British & Australian Accents",
      icon: <Headphones className="w-5 h-5" />,
      color: "blue",
      badgeColor: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
      description: "Sections 1 to 4 practice with audio controls, form completions, map labeling, and fast-paced conversational audio tracks.",
      topics: ["Form, Note & Table Filling", "Map & Diagram Labeling", "Multi-speaker Discussions", "Academic Lecture Monologues"],
      testCount: "95+ Audio Tracks",
      actionText: "Practice Listening",
      actionUrl: isDashboardMode ? "/dashboard/mock-tests?skill=Listening" : "/mock-tests?skill=Listening"
    },
    {
      id: "writing",
      title: "AI Writing Evaluator & Task Lab",
      tag: "Task 1 & Task 2",
      icon: <PenTool className="w-5 h-5" />,
      color: "amber",
      badgeColor: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
      description: "Real-time AI diagnostic feedback for Academic Reports, GT Letters, and Task 2 Opinion/Discussion Essays evaluated on 4 IELTS criteria.",
      topics: ["Graph & Chart Descriptors (Task 1)", "Formal & Semi-formal Letters", "Task 2 Thesis & Argument Structures", "Band 8.5 Lexical Upgrades"],
      testCount: "Unlimited AI Submissions",
      actionText: "Open Writing Evaluator",
      actionUrl: "/dashboard/writing"
    },
    {
      id: "speaking",
      title: "Speaking Simulator & Pronunciation Coach",
      tag: "Part 1, 2 & 3 Drills",
      icon: <Mic className="w-5 h-5" />,
      color: "rose",
      badgeColor: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
      description: "Interactive cue card practice, speech timer simulation, and AI pronunciation feedback for fluent, pinglish-free English articulation.",
      topics: ["Personal Introduction & Familiar Topics", "2-Minute Cue Card Presentation", "Abstract Analytical Discussion", "Fluency & Idiomatic Naturalness"],
      testCount: "60+ Speaking Cue Cards",
      actionText: "Launch Speaking Coach",
      actionUrl: "/dashboard/speaking"
    }
  ];

  const filteredModules = currentSkill === "all" 
    ? skillModules 
    : skillModules.filter(m => m.id === currentSkill);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Targeted Skill Modules</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            IELTS Practice & Training Portal
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Practice each IELTS exam component individually with focused diagnostic drills, instant feedback, and examiner grading criteria.
          </p>
        </div>

        {/* Skill Category Filter Tabs with Proper URLs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "All Skills", icon: <Layers className="w-4 h-4" /> },
            { id: "reading", label: "Reading", icon: <BookOpen className="w-4 h-4" /> },
            { id: "listening", label: "Listening", icon: <Headphones className="w-4 h-4" /> },
            { id: "writing", label: "Writing", icon: <PenTool className="w-4 h-4" /> },
            { id: "speaking", label: "Speaking", icon: <Mic className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = currentSkill === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSkillTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      {module.icon}
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${module.badgeColor}`}>
                        {module.tag}
                      </span>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {module.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {module.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Key Focus Areas:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {module.topics.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {module.testCount}
                </span>
                <Link to={module.actionUrl}>
                  <Button className="h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5">
                    <span>{module.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Full Mock Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800 shadow-xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg font-black uppercase tracking-wide text-emerald-400">
              Looking for Full-Length Computer Exams?
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Simulate the complete 2 hour 45 minute official IELTS exam with timed Reading, Listening, Writing, and Speaking.
            </p>
          </div>
          <Link to="/mock-tests" className="shrink-0">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow">
              Open Mock Test Library
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
