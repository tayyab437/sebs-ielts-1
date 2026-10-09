import React, { useState, useEffect } from "react";
import { 
  NOUNS_WORKSHEET, 
  ADJECTIVES_ADVERBS_VERBS_WORKSHEET,
  NOUN_SUFFIX_COLUMNS, 
  NOUN_TYPES_CONFIG, 
  NOUN_CHALLENGE_CONFIG,
  ADJECTIVE_SUFFIX_COLUMNS,
  ADVERBS_VERBS_SUFFIX_COLUMNS,
  ADVERBS_CONTEXT_CONFIG,
  evaluateWorksheetSubmission,
  saveWorksheetDraft,
  getWorksheetDraft,
  saveWorksheetSubmission,
  getWorksheetSubmission,
  getLoggedInStudentInfo
} from "@/src/lib/worksheetService";
import { supabase } from "@/src/lib/supabaseClient";
import { fetchSiteSettings, sanitizeAssetUrl, defaultSettings } from "@/src/lib/settings";
import { WorksheetEvaluationResult, WorksheetSubmission } from "@/src/types/worksheet";
import { 
  X, Check, Sparkles, Award, ChevronLeft, ChevronRight, 
  Save, RotateCcw, AlertCircle, FileCheck, CheckCircle2, 
  Layers, ShieldCheck, HelpCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface InteractiveWorksheetViewerProps {
  worksheetType?: "nouns_suffixes" | "adjectives_adverbs_verbs" | string;
  resourceTitle?: string;
  episodeId?: string;
  courseId?: string;
  studentId?: string;
  studentName?: string;
  onClose: () => void;
  onSubmitted?: (evaluation: WorksheetEvaluationResult) => void;
}

export default function InteractiveWorksheetViewer({
  worksheetType = "nouns_suffixes",
  resourceTitle,
  episodeId = "ep-default",
  courseId = "course-default",
  studentId = "std-current",
  studentName,
  onClose,
  onSubmitted
}: InteractiveWorksheetViewerProps) {
  const isNouns = worksheetType.includes("noun") || worksheetType === "nouns_suffixes" || !worksheetType.includes("adj");
  const worksheetMeta = isNouns ? NOUNS_WORKSHEET : ADJECTIVES_ADVERBS_VERBS_WORKSHEET;
  const activeWorksheetId = isNouns ? "nouns_suffixes" : "adjectives_adverbs_verbs";

  const [activePage, setActivePage] = useState<number>(1);
  
  // Official SEBS Logo state
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return sanitizeAssetUrl(localStorage.getItem("site_logo_url"), defaultSettings.site_logo_url);
  });

  useEffect(() => {
    const syncLogo = (e?: any) => {
      if (e?.detail?.site_logo_url) {
        setLogoUrl(sanitizeAssetUrl(e.detail.site_logo_url, defaultSettings.site_logo_url));
      } else {
        const stored = localStorage.getItem("site_logo_url");
        if (stored) {
          setLogoUrl(sanitizeAssetUrl(stored, defaultSettings.site_logo_url));
        }
      }
    };
    window.addEventListener("site_settings_updated", syncLogo);
    return () => {
      window.removeEventListener("site_settings_updated", syncLogo);
    };
  }, []);

  // Auto-resolve initial student name
  const [nameField, setNameField] = useState<string>(() => {
    if (studentName && studentName !== "Student Candidate" && studentName !== "Candidate") {
      return studentName;
    }
    const logged = getLoggedInStudentInfo();
    return logged.name || studentName || "";
  });

  const [dateField, setDateField] = useState<string>(() => new Date().toLocaleDateString("en-GB"));
  
  // Worksheet state answers
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<WorksheetEvaluationResult | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState<boolean>(false);
  const [isSavedDraft, setIsSavedDraft] = useState<boolean>(false);

  // Auto-detect and sync logged in student name from auth & profile
  useEffect(() => {
    const fetchCurrentStudentIdentity = async () => {
      // 1. Check local storage credentials first
      const stored = getLoggedInStudentInfo();
      if (stored.name && (!nameField || nameField === "Student Candidate" || nameField === "Candidate")) {
        setNameField(stored.name);
      }

      // 2. Fetch authenticated Supabase session if available
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            let detected = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim() : "");

            if (!detected) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, full_name, name')
                .eq('id', user.id)
                .maybeSingle();

              if (profile) {
                detected = profile.full_name || 
                           profile.name || 
                           (profile.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : "");
              }
            }

            if (!detected && user.email) {
              detected = user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
            }

            if (detected) {
              setNameField(prev => (!prev || prev === "Student Candidate" || prev === "Candidate" ? detected : prev));
            }
          }
        } catch (err) {
          console.warn("Async user detection in worksheet:", err);
        }
      }
    };

    fetchCurrentStudentIdentity();
  }, []);

  // Load existing submission or draft
  useEffect(() => {
    const logged = getLoggedInStudentInfo();
    const effectiveStudentId = studentId && studentId !== "std-current" ? studentId : (logged.id || "std-current");

    const existingSubmission = getWorksheetSubmission(activeWorksheetId, effectiveStudentId);
    if (existingSubmission && existingSubmission.status === "submitted" && existingSubmission.evaluation) {
      setAnswers(existingSubmission.answers || {});
      setEvaluation(existingSubmission.evaluation);
      if (existingSubmission.studentName && existingSubmission.studentName !== "Student Candidate" && existingSubmission.studentName !== "Candidate") {
        setNameField(existingSubmission.studentName);
      } else if (logged.name) {
        setNameField(logged.name);
      }
      if (existingSubmission.date) setDateField(existingSubmission.date);
      return;
    }

    const draft = getWorksheetDraft(activeWorksheetId, effectiveStudentId);
    if (draft && draft.answers) {
      setAnswers(draft.answers);
      if (draft.studentName && draft.studentName !== "Student Candidate" && draft.studentName !== "Candidate") {
        setNameField(draft.studentName);
      } else if (logged.name) {
        setNameField(logged.name);
      }
      if (draft.date) setDateField(draft.date);
    }
  }, [activeWorksheetId, studentId]);

  // Handle cell/input changes
  const handleInputChange = (fieldKey: string, value: any) => {
    if (evaluation) return; // Read-only if already submitted
    setAnswers(prev => ({ ...prev, [fieldKey]: value }));
    setIsSavedDraft(false);
  };

  const handleSuffixRowChange = (suffixKey: string, rowIndex: number, value: string) => {
    if (evaluation) return;
    const currentList = Array.isArray(answers[suffixKey]) ? [...answers[suffixKey]] : ["", "", "", ""];
    currentList[rowIndex] = value;
    setAnswers(prev => ({ ...prev, [suffixKey]: currentList }));
    setIsSavedDraft(false);
  };

  // Save Draft
  const handleSaveDraft = () => {
    saveWorksheetDraft(activeWorksheetId, episodeId, courseId, studentId, nameField, answers);
    setIsSavedDraft(true);
    toast.success("Worksheet progress saved as draft!");
  };

  // Submit and evaluate
  const handleSubmitWorksheet = () => {
    setIsSubmitting(true);

    try {
      const evalResult = evaluateWorksheetSubmission(
        activeWorksheetId,
        answers,
        nameField || "Candidate",
        studentId
      );

      const submission: WorksheetSubmission = {
        id: evalResult.submissionId,
        worksheetId: activeWorksheetId,
        episodeId,
        courseId,
        studentId,
        studentName: nameField || "Candidate",
        date: dateField,
        answers,
        evaluation: evalResult,
        status: "submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveWorksheetSubmission(submission);
      setEvaluation(evalResult);
      setShowEvaluationModal(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (onSubmitted) {
        onSubmitted(evalResult);
      }

      toast.success(`Worksheet Evaluated! Total Score: ${evalResult.totalScore}/100 Marks (${evalResult.grade})`);
    } catch (err: any) {
      console.error("Evaluation error:", err);
      toast.error("Evaluation error: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retake Worksheet
  const handleRetake = () => {
    setEvaluation(null);
    setAnswers({});
    setShowEvaluationModal(false);
    localStorage.removeItem(`worksheet_sub_${activeWorksheetId}_${studentId}`);
    localStorage.removeItem(`worksheet_draft_${activeWorksheetId}_${studentId}`);
    setIsSavedDraft(false);
    toast.success("Worksheet reset! You can now edit your answers and re-submit for evaluation.");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-between overflow-hidden animate-in fade-in duration-200">
      
      {/* TOP WORKSPACE NAVIGATION BAR */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center shrink-0">
            <img
              src={logoUrl || defaultSettings.site_logo_url}
              alt="SEBS Official Logo"
              width={160}
              height={87}
              className="h-11 sm:h-14 w-auto max-h-14 object-contain filter drop-shadow-sm transition-all"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== defaultSettings.site_logo_url) {
                  target.src = defaultSettings.site_logo_url;
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                {resourceTitle || worksheetMeta.title}
              </span>
            </div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{worksheetMeta.workshopTitle}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-normal">{worksheetMeta.title}</span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Page Switcher */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setActivePage(1)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activePage === 1 
                  ? "bg-rose-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Page 1
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activePage === 2 
                  ? "bg-rose-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Page 2
            </button>
          </div>

          {evaluation ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowEvaluationModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-8 rounded-xl shadow-sm cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                Score: {evaluation.totalScore}/100 ({evaluation.grade.split(" ")[0]})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="border-rose-500/50 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-300 hover:border-rose-600 text-xs font-bold h-8 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-8 rounded-xl cursor-pointer gap-1"
              >
                <Save className="w-3.5 h-3.5 text-slate-400" />
                {isSavedDraft ? "Saved" : "Save Draft"}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitWorksheet}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-8 rounded-xl px-4 shadow-md hover:shadow-rose-600/20 cursor-pointer gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                {isSubmitting ? "Evaluating..." : "Submit Worksheet"}
              </Button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="Close Worksheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN DOCUMENT CANVAS AREA */}
      <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center custom-scrollbar">
        
        {/* A4 / 8.5x11 PDF REPLICA SHEET CONTAINER */}
        <div 
          className="w-full max-w-[850px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 min-h-[1100px] flex flex-col justify-between p-8 sm:p-12 relative select-text"
          style={{ fontFamily: 'var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)' }}
        >
          {/* HEADER SECTION (EXACT REPLICA OF SEBS PDF) */}
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-slate-150 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#c5221f] tracking-tight">
                  SEBS Institute
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                  {worksheetMeta.workshopTitle} {isNouns ? "" : (activePage === 1 ? "1/2" : "2/2")}
                </p>
              </div>

              {/* Official SEBS Oval Logo Badge */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">
                  <img
                    src={logoUrl || defaultSettings.site_logo_url}
                    alt="SEBS Institute Official Logo"
                    className="h-14 sm:h-16 w-auto max-w-[170px] sm:max-w-[210px] object-contain drop-shadow-xs"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== defaultSettings.site_logo_url) {
                        target.src = defaultSettings.site_logo_url;
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TITLE & META SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#c5221f] uppercase tracking-wider block">
                  Practice Sheet
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {isNouns 
                    ? (activePage === 1 ? "Nouns" : "Types of Nouns") 
                    : (activePage === 1 ? "Adjectives, Adverbs & Verbs" : "Adverbs & Verbs")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  {isNouns 
                    ? (activePage === 1 ? "Word formation through common suffixes." : "Identify, classify and use nouns in context.") 
                    : (activePage === 1 ? "Word formation through common suffixes" : "Continue the suffix practice, then apply adverbs in context.")}
                </p>
              </div>

              {/* Name & Date Inputs */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span>Name:</span>
                  <input
                    type="text"
                    value={nameField}
                    onChange={(e) => setNameField(e.target.value)}
                    disabled={!!evaluation}
                    className="border-b border-slate-400 bg-transparent px-1.5 py-0.5 min-w-[130px] sm:min-w-[180px] focus:border-[#c5221f] focus:outline-none font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Date:</span>
                  <input
                    type="text"
                    value={dateField}
                    onChange={(e) => setDateField(e.target.value)}
                    disabled={!!evaluation}
                    className="border-b border-slate-400 bg-transparent px-1 py-0.5 w-24 focus:border-[#c5221f] focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* RED CALLOUT BANNER */}
            <div className="border border-[#c5221f]/30 bg-rose-50/50 rounded-xl p-3 sm:px-4 text-xs sm:text-sm text-slate-800 flex items-center gap-2">
              <span className="font-bold text-[#c5221f] shrink-0">Direction:</span>
              <span className="font-medium">
                {isNouns
                  ? "Write NOUNS with the help of the given suffixes. Use each column for correct examples."
                  : "Write ADJECTIVES, ADVERBS & VERBS with the help of given suffixes."}
              </span>
            </div>

            {/* ========================================================================= */}
            {/* WORKSHEET 1 (NOUNS) - PAGE 1: SUFFIX FORMATION GRID (4 COLS x 3 SECTIONS) */}
            {/* ========================================================================= */}
            {isNouns && activePage === 1 && (
              <div className="space-y-6 pt-2">
                {/* Section Header with Solid Red Badge */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-[#c5221f] text-white text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
                    NOUN FORMATION
                  </span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-300/80 px-2.5 py-1 rounded-md shadow-2xs">
                    Build as many correct nouns as you can in each column.
                  </span>
                </div>

                {/* Suffix Form Table Grid (4 columns across 3 block rows) */}
                <div className="space-y-6">
                  {/* Block Row 1: -ness, -ment, -tion, -sion */}
                  {/* Block Row 2: -ity, -ance, -ence, -ship */}
                  {/* Block Row 3: -hood, -dom, -er / -or, -ist */}
                  {[
                    NOUN_SUFFIX_COLUMNS.slice(0, 4),
                    NOUN_SUFFIX_COLUMNS.slice(4, 8),
                    NOUN_SUFFIX_COLUMNS.slice(8, 12)
                  ].map((rowCols, blockIdx) => (
                    <div key={blockIdx} className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                      {/* Column Header Row */}
                      <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-300 text-center text-xs font-black text-slate-800 py-2">
                        {rowCols.map((col) => (
                          <div key={col.suffix} className="border-r last:border-r-0 border-slate-300 px-2">
                            {col.label}
                          </div>
                        ))}
                      </div>

                      {/* 4 Rows of Input Lines per Column */}
                      {[0, 1, 2, 3].map((rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-4 border-b last:border-b-0 border-slate-200">
                          {rowCols.map((col) => {
                            const suffixKey = `suffix_${col.suffix}`;
                            const userList = Array.isArray(answers[suffixKey]) ? answers[suffixKey] : [];
                            const val = userList[rowIdx] || "";
                            const feedback = evaluation?.fieldFeedbacks[suffixKey];

                            return (
                              <div key={col.suffix} className="border-r last:border-r-0 border-slate-200 p-1.5 relative group">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleSuffixRowChange(suffixKey, rowIdx, e.target.value)}
                                  disabled={!!evaluation}
                                  className={`w-full text-xs font-semibold text-slate-800 px-2 py-1.5 bg-transparent rounded focus:bg-rose-50/50 focus:outline-none focus:ring-1 focus:ring-[#c5221f] transition-all ${
                                    evaluation 
                                      ? (feedback?.isCorrect ? "text-emerald-700 bg-emerald-50/40" : "text-rose-700 bg-rose-50/40")
                                      : ""
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* WORKSHEET 1 (NOUNS) - PAGE 2: TYPES OF NOUNS & NOUN CHALLENGE              */}
            {/* ========================================================================= */}
            {isNouns && activePage === 2 && (
              <div className="space-y-6 pt-2">
                {/* SECTION 1: COMMON NOUN TYPES TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-[#c5221f] text-white text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
                      COMMON NOUN TYPES
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-300/80 px-2.5 py-1 rounded-md shadow-2xs">
                      Read the note, add your own example, then use it in a sentence.
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                          <th className="p-2.5 w-[20%] border-r border-slate-300">Noun Type</th>
                          <th className="p-2.5 w-[36%] border-r border-slate-300">What it means</th>
                          <th className="p-2.5 w-[20%] border-r border-slate-300">Your example</th>
                          <th className="p-2.5 w-[24%]">Use it in a sentence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {NOUN_TYPES_CONFIG.map((row, rIdx) => {
                          const exKey = `type_ex_${row.id}`;
                          const sentKey = `type_sent_${row.id}`;
                          const exVal = answers[exKey] || "";
                          const sentVal = answers[sentKey] || "";
                          const rowFeedback = evaluation?.fieldFeedbacks[`type_${row.id}`];

                          return (
                            <tr key={row.id} className="border-b last:border-b-0 border-slate-200 hover:bg-slate-50/40">
                              <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200 align-top">
                                {row.nounType}
                              </td>
                              <td className="p-2.5 text-slate-600 border-r border-slate-200 align-top leading-relaxed text-[11px]">
                                <div>{row.definition}</div>
                                <div className="text-slate-400 italic mt-0.5">Example: {row.examples}</div>
                              </td>
                              <td className="p-2 border-r border-slate-200 align-top">
                                <input
                                  type="text"
                                  value={exVal}
                                  onChange={(e) => handleInputChange(exKey, e.target.value)}
                                  disabled={!!evaluation}
                                  className="w-full text-xs font-semibold px-2 py-1 bg-slate-50/80 border border-slate-200 rounded focus:bg-white focus:border-[#c5221f] focus:outline-none"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <textarea
                                  value={sentVal}
                                  onChange={(e) => handleInputChange(sentKey, e.target.value)}
                                  disabled={!!evaluation}
                                  rows={2}
                                  className="w-full text-xs font-medium px-2 py-1 bg-slate-50/80 border border-slate-200 rounded focus:bg-white focus:border-[#c5221f] focus:outline-none resize-none leading-tight"
                                />
                                {rowFeedback && (
                                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                    ✓ Score: {rowFeedback.score}/{rowFeedback.maxScore}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 2: NOUN CHALLENGE */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-[#c5221f] text-white text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
                      NOUN CHALLENGE
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-300/80 px-2.5 py-1 rounded-md shadow-2xs">
                      Turn each base word into a noun. Write the noun and the suffix used.
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {NOUN_CHALLENGE_CONFIG.map((ch) => {
                        const fieldKey = `ch_${ch.baseWord}`;
                        const val = answers[fieldKey] || "";
                        const itemFeedback = evaluation?.fieldFeedbacks[fieldKey];

                        return (
                          <div key={ch.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                            <div className="font-bold text-xs text-slate-900">{ch.baseWord}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <span>Noun:</span>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                disabled={!!evaluation}
                                className={`w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold focus:border-[#c5221f] focus:outline-none ${
                                  evaluation 
                                    ? (itemFeedback?.isCorrect ? "text-emerald-700 bg-emerald-50 border-emerald-400" : "text-rose-700 bg-rose-50 border-rose-400")
                                    : ""
                                }`}
                              />
                            </div>
                            {itemFeedback && !itemFeedback.isCorrect && (
                              <div className="text-[9px] text-rose-600 font-bold">
                                Key: {ch.expectedNouns[0]} ({ch.suffix})
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: URDU LEARNING REFLECTION */}
                <div className="space-y-2 pt-2 bg-slate-50/80 border-2 border-slate-300/90 rounded-xl p-3.5 sm:p-4 shadow-xs">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Share your learning in Urdu:
                    </span>
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200/90 px-2.5 py-1 rounded-md shadow-2xs">
                      اردو میں اپنے تاثرات اور خلاصہ لکھیں
                    </span>
                  </label>
                  <Textarea
                    value={answers["urdu_reflection"] || ""}
                    onChange={(e) => handleInputChange("urdu_reflection", e.target.value)}
                    disabled={!!evaluation}
                    placeholder="یہاں اپنے تاثرات تحریر کریں..."
                    className="text-xs sm:text-sm bg-white border-2 border-slate-300 rounded-lg min-h-[75px] text-right font-medium text-slate-900 shadow-inner focus:border-[#c5221f] focus:ring-2 focus:ring-[#c5221f]/20 transition-all placeholder:text-slate-400"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* WORKSHEET 2 (ADJECTIVES, ADVERBS & VERBS) - PAGE 1 & 2                    */}
            {/* ========================================================================= */}
            {!isNouns && activePage === 1 && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-[#c5221f] text-white text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
                    ADJECTIVES
                  </span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-300/80 px-2.5 py-1 rounded-md shadow-2xs">
                    Build as many correct words as you can in each column.
                  </span>
                </div>

                <div className="space-y-6">
                  {[
                    ADJECTIVE_SUFFIX_COLUMNS.slice(0, 4),
                    ADJECTIVE_SUFFIX_COLUMNS.slice(4, 8),
                    ADJECTIVE_SUFFIX_COLUMNS.slice(8, 12)
                  ].map((rowCols, blockIdx) => (
                    <div key={blockIdx} className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                      <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-300 text-center text-xs font-black text-slate-800 py-2">
                        {rowCols.map((col) => (
                          <div key={col.suffix} className="border-r last:border-r-0 border-slate-300 px-2">
                            {col.label}
                          </div>
                        ))}
                      </div>
                      {[0, 1, 2, 3].map((rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-4 border-b last:border-b-0 border-slate-200">
                          {rowCols.map((col) => {
                            const suffixKey = `adj_suffix_${col.suffix}`;
                            const userList = Array.isArray(answers[suffixKey]) ? answers[suffixKey] : [];
                            const val = userList[rowIdx] || "";

                            return (
                              <div key={col.suffix} className="border-r last:border-r-0 border-slate-200 p-1.5">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleSuffixRowChange(suffixKey, rowIdx, e.target.value)}
                                  disabled={!!evaluation}
                                  className="w-full text-xs font-semibold text-slate-800 px-2 py-1.5 bg-transparent rounded focus:bg-rose-50/50 focus:outline-none focus:ring-1 focus:ring-[#c5221f]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isNouns && activePage === 2 && (
              <div className="space-y-6 pt-2">
                {/* ADVERBS & VERBS SUFFIXES */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#c5221f] text-white text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
                      ADVERBS & VERBS
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                    <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-300 text-center text-xs font-black text-slate-900 py-1.5">
                      <div className="border-r border-slate-300">ADVERBS</div>
                      <div>VERBS</div>
                    </div>
                    <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-300 text-center text-xs font-bold text-slate-800 py-1.5">
                      {ADVERBS_VERBS_SUFFIX_COLUMNS.map((col) => (
                        <div key={col.suffix} className="border-r last:border-r-0 border-slate-300">
                          {col.suffix}
                        </div>
                      ))}
                    </div>
                    {[0, 1, 2, 3].map((rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-4 border-b last:border-b-0 border-slate-200">
                        {ADVERBS_VERBS_SUFFIX_COLUMNS.map((col) => {
                          const suffixKey = `av_suffix_${col.suffix}`;
                          const userList = Array.isArray(answers[suffixKey]) ? answers[suffixKey] : [];
                          const val = userList[rowIdx] || "";

                          return (
                            <div key={col.suffix} className="border-r last:border-r-0 border-slate-200 p-1.5">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleSuffixRowChange(suffixKey, rowIdx, e.target.value)}
                                disabled={!!evaluation}
                                className="w-full text-xs font-semibold text-slate-800 px-2 py-1.5 bg-transparent rounded focus:bg-rose-50/50 focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* MOST COMMON ADVERBS TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-[#c5221f] text-white text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
                      MOST COMMON ADVERBS
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-300/80 px-2.5 py-1 rounded-md shadow-2xs">
                      Use the notes, write your own sentences, and complete the final column.
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                          <th className="p-2.5 w-[30%] border-r border-slate-300">Most common Adverbs</th>
                          <th className="p-2.5 w-[45%] border-r border-slate-300">Use them in sentences</th>
                          <th className="p-2.5 w-[25%]">Pick from the box</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ADVERBS_CONTEXT_CONFIG.map((adv) => {
                          const sentKey = `adv_sent_${adv.id}`;
                          const catKey = `adv_cat_${adv.id}`;

                          return (
                            <tr key={adv.id} className="border-b last:border-b-0 border-slate-200">
                              <td className="p-2.5 border-r border-slate-200 align-top">
                                <div className="font-bold text-slate-900">{adv.adverbType}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{adv.definition}</div>
                                <div className="text-[10px] text-slate-400 italic mt-0.5">{adv.examples}</div>
                              </td>
                              <td className="p-2 border-r border-slate-200 align-top">
                                <textarea
                                  value={answers[sentKey] || ""}
                                  onChange={(e) => handleInputChange(sentKey, e.target.value)}
                                  disabled={!!evaluation}
                                  rows={2}
                                  className="w-full text-xs font-medium px-2 py-1 bg-slate-50/80 border border-slate-200 rounded focus:bg-white focus:border-[#c5221f] focus:outline-none resize-none leading-tight"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <select
                                  value={answers[catKey] || ""}
                                  onChange={(e) => handleInputChange(catKey, e.target.value)}
                                  disabled={!!evaluation}
                                  className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#c5221f] focus:outline-none"
                                >
                                  <option value="">Select category...</option>
                                  {adv.categoryOptions?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* URDU REFLECTION */}
                <div className="space-y-2 pt-2 bg-slate-50/80 border-2 border-slate-300/90 rounded-xl p-3.5 sm:p-4 shadow-xs">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Share your learning in Urdu:
                    </span>
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200/90 px-2.5 py-1 rounded-md shadow-2xs">
                      اردو میں اپنے تاثرات اور خلاصہ لکھیں
                    </span>
                  </label>
                  <Textarea
                    value={answers["urdu_reflection"] || ""}
                    onChange={(e) => handleInputChange("urdu_reflection", e.target.value)}
                    disabled={!!evaluation}
                    placeholder="یہاں اپنے تاثرات تحریر کریں..."
                    className="text-xs sm:text-sm bg-white border-2 border-slate-300 rounded-lg min-h-[75px] text-right font-medium text-slate-900 shadow-inner focus:border-[#c5221f] focus:ring-2 focus:ring-[#c5221f]/20 transition-all placeholder:text-slate-400"
                    dir="rtl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FOOTER (EXACT REPLICA OF SEBS PDF FOOTER) */}
          <div className="pt-4 pb-4 px-5 border-t-2 border-slate-300 mt-8 bg-slate-100/90 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-800 shadow-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <a href="https://www.syedejazbukhari.com" target="_blank" rel="noreferrer" className="text-slate-800 hover:text-[#c5221f] font-semibold underline-offset-2 hover:underline transition-colors">
                www.syedejazbukhari.com
              </a>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <a href="https://www.sebsinstitute.com" target="_blank" rel="noreferrer" className="text-slate-800 hover:text-[#c5221f] font-semibold underline-offset-2 hover:underline transition-colors">
                www.sebsinstitute.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-[11px] font-semibold">Official Contact:</span>
              <span className="font-mono text-[#c5221f] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/80 font-black tracking-wide shadow-2xs">
                +92 333 4541573
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FLOATING BAR WITH SUBMIT & PAGE CONTROLS */}
      <div className="w-full bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-white shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Interactive Worksheet • Protected Learning Content</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Page {activePage} of 2</span>
            <button
              onClick={() => setActivePage(p => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage(p => Math.min(2, p + 1))}
              disabled={activePage === 2}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {evaluation ? (
            <Button
              onClick={handleRetake}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 h-9 rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Worksheet
            </Button>
          ) : (
            <Button
              onClick={handleSubmitWorksheet}
              disabled={isSubmitting}
              className="bg-[#c5221f] hover:bg-rose-700 text-white text-xs font-bold px-5 h-9 rounded-xl shadow-lg cursor-pointer"
            >
              <FileCheck className="w-4 h-4 mr-1.5" />
              {isSubmitting ? "Evaluating..." : "Submit & Evaluate Worksheet"}
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EVALUATION & SCORECARD MODAL DIALOG                                       */}
      {/* ========================================================================= */}
      {showEvaluationModal && evaluation && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header with Score Gradient */}
            <div className="bg-gradient-to-r from-[#c5221f] to-rose-700 p-6 text-white text-center relative">
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Award className="w-8 h-8 text-amber-300" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full text-rose-100">
                Official Worksheet Evaluation
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {evaluation.totalScore} <span className="text-lg font-normal text-rose-200">/ 100 Marks</span>
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="bg-white text-rose-700 text-xs font-black px-3 py-1 rounded-xl shadow-xs">
                  {evaluation.grade}
                </span>
                <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-xl">
                  {evaluation.bandScore}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Executive Feedback
                </h4>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {evaluation.overallSummary}
                </p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-1.5">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                  </div>
                  <ul className="space-y-1 pl-1">
                    {evaluation.strengths.map((str, i) => (
                      <li key={i} className="text-emerald-700 dark:text-emerald-400 text-[11px] flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1.5">
                  <div className="font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Next Steps
                  </div>
                  <ul className="space-y-1 pl-1">
                    {evaluation.improvements.map((imp, i) => (
                      <li key={i} className="text-amber-700 dark:text-amber-400 text-[11px] flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Instructor Verification Note */}
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  SEB
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-400">
                    Syed Ejaz Bukhari • Principal IELTS Director
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 italic mt-0.5 leading-relaxed">
                    "{evaluation.instructorFeedbackNotes}"
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Submission Saved • ID: {evaluation.submissionId.slice(0, 12)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetake}
                  className="text-xs rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEvaluationModal(false)}
                  className="text-xs rounded-xl"
                >
                  Review On Sheet
                </Button>
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  Done & Continue Lesson
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
