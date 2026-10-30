import React, { useState, useEffect, useRef, useMemo, Fragment } from "react";
import {
  Clock,
  Fullscreen,
  Clipboard,
  Send,
  Menu,
  Share2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  Check,
  X,
  Eye,
  FileText,
  Trophy,
  Award,
  BarChart3,
  RefreshCw
} from "lucide-react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import RichTextEditor from "./RichTextEditor";
import { fetchSiteSettings, defaultSettings, sanitizeAssetUrl } from "@/src/lib/settings";
import { isAnswerMatch, parseMultiPromptAnswers } from "@/src/utils/questionFlattener";

interface IeltsTestViewProps {
  test: any;
  currentSectionIdx: number;
  setCurrentSectionIdx: (idx: number) => void;
  answers: Record<string, any>;
  setAnswers: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  timeLeft: number;
  handleFinishTest: () => void;
  handleQuitSession: () => void;
  formatTime: (seconds: number) => string;
}

export default function IeltsTestView({
  test,
  currentSectionIdx,
  setCurrentSectionIdx,
  answers,
  setAnswers,
  timeLeft,
  handleFinishTest,
  handleQuitSession,
  formatTime,
}: IeltsTestViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showSolutionsModal, setShowSolutionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReportResultModal, setShowReportResultModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");
  const [logoUrl, setLogoUrl] = useState(() => {
    return sanitizeAssetUrl(localStorage.getItem("site_logo_url"), defaultSettings.site_logo_url);
  });
  const [logoAlt, setLogoAlt] = useState(() => {
    return localStorage.getItem("site_logo_alt") || defaultSettings.site_logo_alt;
  });

  // Audio Player State for Listening
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Speaking Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [thinkTime, setThinkTime] = useState(3);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recordTimerRef = useRef<any>(null);

  // Sync Logo from Backend & Settings
  useEffect(() => {
    const syncLogo = () => {
      fetchSiteSettings()
        .then((settings) => {
          if (settings?.site_logo_url) {
            setLogoUrl(settings.site_logo_url);
          }
          if (settings?.site_logo_alt) {
            setLogoAlt(settings.site_logo_alt);
          }
        })
        .catch(() => {
          const local = localStorage.getItem("site_logo_url");
          if (local) {
            setLogoUrl(sanitizeAssetUrl(local, defaultSettings.site_logo_url));
          }
        });
    };
    syncLogo();
    window.addEventListener("storage", syncLogo);
    window.addEventListener("site_settings_updated", syncLogo);
    return () => {
      window.removeEventListener("storage", syncLogo);
      window.removeEventListener("site_settings_updated", syncLogo);
    };
  }, []);

  // Speaking countdown timer for "Time to Think"
  useEffect(() => {
    let t: any;
    if (thinkTime > 0) {
      t = setInterval(() => setThinkTime((p) => (p > 0 ? p - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [thinkTime, currentSectionIdx]);

  // Speaking Recording timer
  useEffect(() => {
    if (isRecording) {
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Mock saved audio recording
      setAudioUrl("mock_recording.mp3");
      const currentSec = test?.sections?.[currentSectionIdx];
      const qId = currentSec?.questions?.[0]?.id || `sec-${currentSectionIdx}`;
      setAnswers((prev) => ({ ...prev, [qId]: "Speaking response recorded." }));
    } else {
      setRecordDuration(0);
      setIsRecording(true);
    }
  };

  // Audio player controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const sectionsCount = test?.sections?.length || 0;
  const activeSecIdx = sectionsCount > 0 ? Math.min(Math.max(0, currentSectionIdx || 0), sectionsCount - 1) : 0;
  const currentSec = test?.sections?.[activeSecIdx];
  if (!currentSec && (!test?.sections || test.sections.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No test content loaded</h2>
        <p className="text-slate-500 max-w-md mb-6">This test module does not contain any questions or sections yet.</p>
        <button
          type="button"
          onClick={handleQuitSession}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleSectionSwitch = (idx: number) => {
    if (typeof setCurrentSectionIdx === "function") {
      setCurrentSectionIdx(idx);
    }
    const fsContainer = document.getElementById("full-screen-course");
    if (fsContainer) {
      fsContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const rawType = (currentSec?.type || test?.type || "reading").toLowerCase();
  const testType = rawType.includes("listen")
    ? "listening"
    : rawType.includes("writ")
    ? "writing"
    : rawType.includes("speak")
    ? "speaking"
    : "reading";

  // Comprehensive Flattening of Sub-Questions & Blanks for exact 1:1 mapping
  const allSections = test?.sections || [];

  const getQuestionSubItems = (q: any, blockIdx: number, baseQNum: number) => {
    const qType = (q.type || "MCQ").toUpperCase();
    const hasInlineBlank =
      (qType === "BLANK" || qType === "PASSAGE" || qType === "INLINE_BLANKS") &&
      typeof q.text === "string" &&
      (/_{2,}/.test(q.text) || q.text.toLowerCase().includes("[blank]"));

    if (hasInlineBlank || qType === "INLINE_BLANKS") {
      const rawText =
        typeof q.text === "string"
          ? q.text
          : Array.isArray(q.text)
          ? q.text.join("\n")
          : String(q.text || "");
      const parts = rawText.split(/_{2,}|\[BLANK\]/i);
      const blanksCount = Math.max(1, parts.length - 1);
      const correctCandidates =
        typeof q.correctAnswer === "string"
          ? q.correctAnswer.split(/[|\n]/)
          : Array.isArray(q.correctAnswer)
          ? q.correctAnswer
          : [String(q.correctAnswer || "")];

      return Array.from({ length: blanksCount }, (_, bIdx) => ({
        id: `${q.id}_${bIdx}`,
        parentQ: q,
        bIdx,
        subIndex: bIdx,
        qNum: baseQNum + bIdx,
        type: "INLINE_BLANKS",
        correctAnswer: (correctCandidates[bIdx] || correctCandidates[0] || "").trim(),
        explanation: q.explanation,
      }));
    }

    if (qType.includes("MATCHING")) {
      const prompts = (
        typeof q.text === "string"
          ? q.text
          : Array.isArray(q.text)
          ? q.text.join("\n")
          : String(q.text || "")
      )
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (prompts.length > 1) {
        const correctCandidates = parseMultiPromptAnswers(q.correctAnswer, prompts.length);

        return prompts.map((prompt, pIdx) => ({
          id: `${q.id}_${pIdx}`,
          parentQ: q,
          pIdx,
          subIndex: pIdx,
          qNum: baseQNum + pIdx,
          type: "MATCHING",
          promptText: prompt,
          options: q.options || [],
          correctAnswer: (correctCandidates[pIdx] || correctCandidates[0] || "").trim(),
          explanation: q.explanation,
        }));
      }
    }

    if (q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      return q.subQuestions.map((sq: any, sqIdx: number) => ({
        ...sq,
        id: sq.id || `${q.id}_${sqIdx}`,
        parentQ: q,
        subIndex: sqIdx,
        qNum: baseQNum + sqIdx,
        explanation: sq.explanation || q.explanation,
      }));
    }

    return [
      {
        ...q,
        id: q.id,
        parentQ: q,
        subIndex: 0,
        qNum: baseQNum,
        correctAnswer: q.correctAnswer,
        options: q.options,
        type: qType,
        explanation: q.explanation,
      },
    ];
  };

  const getSectionSubItems = (sec: any, startOffset: number) => {
    const items: any[] = [];
    let currentNum = startOffset + 1;
    (sec.questions || []).forEach((q: any, blockIdx: number) => {
      const subItems = getQuestionSubItems(q, blockIdx, currentNum);
      items.push(...subItems);
      currentNum += subItems.length;
    });
    return items;
  };

  const sectionSubItemsMap = useMemo(() => {
    const map: { [secIdx: number]: any[] } = {};
    let runningOffset = 0;
    allSections.forEach((sec: any, idx: number) => {
      const subItems = getSectionSubItems(sec, runningOffset);
      map[idx] = subItems;
      runningOffset += subItems.length;
    });
    return map;
  }, [allSections]);

  const allFlatQuestions = useMemo(() => {
    const list: any[] = [];
    Object.values(sectionSubItemsMap).forEach((items) => {
      list.push(...items);
    });
    return list;
  }, [sectionSubItemsMap]);

  const currentSectionSubItems = sectionSubItemsMap[activeSecIdx] || [];

  const isSubItemAnswered = (subItem: any): boolean => {
    if (!subItem) return false;
    const val =
      answers[subItem.id] ?? (subItem.subIndex === 0 ? answers[subItem.parentQ?.id] : undefined);
    return val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0);
  };

  const isSubItemCorrect = (subItem: any): boolean => {
    if (!subItem) return false;
    const val =
      answers[subItem.id] ?? (subItem.subIndex === 0 ? answers[subItem.parentQ?.id] : undefined);
    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
      return false;
    }
    const qType = (subItem.type || subItem.parentQ?.type || "MCQ").toUpperCase();

    // MCQ / True False / Yes No
    if (qType === "MCQ" || qType === "TF" || qType === "YN" || (!subItem.type && subItem.options)) {
      const correctStr = String(
        subItem.correctAnswer ||
          (subItem.options && subItem.correctIndex !== undefined
            ? subItem.options[subItem.correctIndex]
            : "")
      )
        .trim()
        .toLowerCase();
      const valStr = String(val).trim().toLowerCase();
      if (valStr === correctStr) return true;
      if (subItem.correctIndex !== undefined && subItem.options) {
        if (
          val === subItem.options[subItem.correctIndex] ||
          val === subItem.correctIndex ||
          valStr === String(subItem.correctIndex)
        )
          return true;
      }
      if (subItem.options && typeof val === "string" && val.length === 1) {
        const charCode = val.toUpperCase().charCodeAt(0) - 65;
        if (charCode >= 0 && charCode < subItem.options.length && charCode === subItem.correctIndex)
          return true;
      }
      return false;
    }

    // MULTI_MCQ
    if (qType === "MULTI_MCQ") {
      const studentList = Array.isArray(val) ? val : [val];
      if (subItem.correctIndexes && Array.isArray(subItem.correctIndexes) && subItem.options) {
        const correctOptions = subItem.correctIndexes.map((idx: number) => subItem.options[idx]);
        return (
          studentList.length === correctOptions.length &&
          studentList.every((x: string) => correctOptions.includes(x))
        );
      }
      if (subItem.correctAnswer) {
        const correctArr = Array.isArray(subItem.correctAnswer)
          ? subItem.correctAnswer
          : String(subItem.correctAnswer)
              .split(",")
              .map((x) => x.trim());
        return (
          studentList.length === correctArr.length &&
          studentList.every((x) => correctArr.includes(x))
        );
      }
      return false;
    }

    // MATCHING
    if (qType.includes("MATCHING")) {
      const qOpts = subItem.options || subItem.parentQ?.options || [];
      return isAnswerMatch(val, subItem.correctAnswer, qOpts);
    }

    // INLINE_BLANKS / TEXT / BLANK / PASSAGE
    const valStr = String(val).trim().toLowerCase();
    const correctCandidates = String(subItem.correctAnswer || "")
      .split(/[|,]/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    if (correctCandidates.length > 0) {
      return correctCandidates.some((c) => c === valStr);
    }

    return Boolean(val);
  };

  const getSubItemCorrectAnswerText = (subItem: any): string => {
    if (!subItem) return "";
    if (subItem.correctAnswer) {
      if (Array.isArray(subItem.correctAnswer)) return subItem.correctAnswer.join(", ");
      return String(subItem.correctAnswer);
    }
    if (
      subItem.correctIndex !== undefined &&
      subItem.options &&
      subItem.options[subItem.correctIndex]
    ) {
      return subItem.options[subItem.correctIndex];
    }
    if (subItem.correctIndexes && Array.isArray(subItem.correctIndexes) && subItem.options) {
      return subItem.correctIndexes.map((idx: number) => subItem.options[idx] || `${idx}`).join(", ");
    }
    return "See solutions key";
  };

  // Backward compatibility methods for block-level queries
  const isQuestionAnswered = (q: any): boolean => {
    const subItems = currentSectionSubItems.filter(
      (item) => item.parentQ === q || item.parentQ?.id === q.id || item.id === q.id
    );
    if (subItems.length > 0) {
      return subItems.some((s) => isSubItemAnswered(s));
    }
    const val = answers[q.id];
    return val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0);
  };

  const isQuestionCorrect = (q: any): boolean => {
    const subItems = currentSectionSubItems.filter(
      (item) => item.parentQ === q || item.parentQ?.id === q.id || item.id === q.id
    );
    if (subItems.length > 0) {
      return subItems.every((s) => isSubItemCorrect(s));
    }
    return isSubItemCorrect({ ...q, id: q.id, subIndex: 0 });
  };

  const getQuestionCorrectAnswer = (q: any): string => {
    const subItems = currentSectionSubItems.filter(
      (item) => item.parentQ === q || item.parentQ?.id === q.id || item.id === q.id
    );
    if (subItems.length > 1) {
      return subItems.map((s) => getSubItemCorrectAnswerText(s)).join(" | ");
    }
    return getSubItemCorrectAnswerText(subItems[0] || q);
  };

  const calculateTestStats = () => {
    const total = allFlatQuestions.length > 0 ? allFlatQuestions.length : 1;
    let correct = 0;
    let answered = 0;

    allFlatQuestions.forEach((subItem: any) => {
      if (isSubItemAnswered(subItem)) {
        answered += 1;
        if (isSubItemCorrect(subItem)) {
          correct += 1;
        }
      }
    });

    const incorrect = answered - correct;
    const skipped = total - answered;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    let bandScore = 3.5;
    if (percent >= 90) bandScore = 9.0;
    else if (percent >= 85) bandScore = 8.5;
    else if (percent >= 80) bandScore = 8.0;
    else if (percent >= 75) bandScore = 7.5;
    else if (percent >= 68) bandScore = 7.0;
    else if (percent >= 60) bandScore = 6.5;
    else if (percent >= 52) bandScore = 6.0;
    else if (percent >= 45) bandScore = 5.5;
    else if (percent >= 38) bandScore = 5.0;
    else if (percent >= 30) bandScore = 4.5;
    else if (percent >= 20) bandScore = 4.0;

    return { total, correct, incorrect, skipped, answered, percent, bandScore };
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    setShowSubmitConfirm(false);
    setShowReportResultModal(true);
    try {
      handleFinishTest();
    } catch (e) {}
  };

  const scrollToQuestion = (id: string) => {
    const el =
      document.getElementById(`question-card-${id}`) ||
      document.getElementById(`question-input-${id}`) ||
      document.getElementById(`question-card-${id.split("_")[0]}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement) {
        el.focus();
      }
    }
  };

  // Shared Header
  const renderHeader = () => (
    <header className="flex items-center justify-between px-4 sm:px-8 py-2.5 bg-white dark:bg-slate-900 shadow-xs border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors flex items-center justify-center border border-gray-200 dark:border-slate-700 cursor-pointer"
          title="Quit Test Session"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setShowExitConfirm(true)}
        >
          <img
            src={logoUrl || defaultSettings.site_logo_url}
            alt={logoAlt || "SEB's Institute Logo"}
            width={110}
            height={60}
            loading="eager"
            decoding="async"
            className="h-8 sm:h-9 w-auto object-contain dark:brightness-200 dark:invert transition-all duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== defaultSettings.site_logo_url && defaultSettings.site_logo_url) {
                target.src = defaultSettings.site_logo_url;
              }
            }}
          />
        </div>
      </div>

      {/* Clock Display */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
        <Clock
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            timeLeft < 300
              ? "text-red-500 animate-pulse"
              : timeLeft < 600
              ? "text-amber-500"
              : testType === "speaking"
              ? "text-rose-500"
              : testType === "listening"
              ? "text-sky-500"
              : "text-emerald-600"
          }`}
        />
        <span
          className={`text-lg sm:text-2xl font-black font-mono tracking-wider ${
            timeLeft < 300
              ? "text-red-600 animate-pulse"
              : timeLeft < 600
              ? "text-amber-600"
              : testType === "speaking"
              ? "text-rose-600 dark:text-rose-400"
              : testType === "listening"
              ? "text-sky-600 dark:text-sky-400"
              : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {(() => {
            const h = Math.floor(timeLeft / 3600);
            const m = Math.floor((timeLeft % 3600) / 60);
            const s = timeLeft % 60;
            return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
          })()}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleFullscreen}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Fullscreen className="w-5 h-5" />
        </button>

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
            title="Options Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Typography Size
                </p>
                <div className="flex bg-gray-100 dark:bg-slate-700/80 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setTextSize("sm")}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      textSize === "sm"
                        ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900"
                    }`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setTextSize("md")}
                    className={`flex-1 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      textSize === "md"
                        ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900"
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setTextSize("lg")}
                    className={`flex-1 py-1 rounded-lg text-base font-bold transition-all cursor-pointer ${
                      textSize === "lg"
                        ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900"
                    }`}
                  >
                    A+
                  </button>
                </div>
              </div>

              {isSubmitted && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowReportResultModal(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-3 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>Performance Report</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowSolutionsModal(true);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-700 flex items-center gap-3 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>See Solutions Key</span>
              </button>

              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-3 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Report Mistake</span>
              </button>

              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  navigator.clipboard?.writeText(window.location.href);
                  alert("Test link copied to clipboard!");
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
                <span>Share Test</span>
              </button>
            </div>
          )}
        </div>

        {/* Submit / View Report Button */}
        {!isSubmitted ? (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="bg-[#2d5a3f] hover:bg-[#1f402c] active:scale-95 text-white px-4 sm:px-6 py-2 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <span>Submit</span>
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowReportResultModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 sm:px-5 py-2 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 hover:ring-emerald-400 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Score Report (Band {calculateTestStats().bandScore.toFixed(1)})</span>
          </button>
        )}
      </div>
    </header>
  );

  // Upper Navigation Bar with Question Bubbles (Positioned directly below Header)
  const renderTopNav = () => {
    if (testType === "speaking") return null;

    const sections = test?.sections || [];
    if (sections.length === 0) return null;

    return (
      <div className="sticky top-[57px] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 py-2 px-4 sm:px-8 flex items-center justify-between gap-3 z-30 shadow-xs select-none">
        {/* Left: Current Section / Question Range Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {getSectionRangeText()}
          </span>
          <span className="hidden sm:inline text-xs font-semibold text-slate-400 dark:text-slate-500">
            ({currentSectionSubItems.filter((i: any) => isSubItemAnswered(i)).length}/{currentSectionSubItems.length} answered)
          </span>
        </div>

        {/* Right: Question Bubbles for Current Section */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 scrollbar-none justify-end">
          {currentSectionSubItems.map((subItem: any, idx: number) => {
            const isAnswered = isSubItemAnswered(subItem);
            const isCorrect = isSubItemCorrect(subItem);

            let bubbleStyle =
              "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:border-teal-500";
            if (isSubmitted) {
              if (isCorrect) {
                bubbleStyle = "bg-emerald-600 text-white border-emerald-600 shadow-sm";
              } else if (isAnswered) {
                bubbleStyle = "bg-rose-600 text-white border-rose-600 shadow-sm";
              } else {
                bubbleStyle =
                  "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700";
              }
            } else if (isAnswered) {
              bubbleStyle = "bg-teal-600 text-white border-teal-600 shadow-sm";
            }

            return (
              <button
                key={subItem.id || idx}
                onClick={() => scrollToQuestion(subItem.id)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer shrink-0 border ${bubbleStyle}`}
                title={`Question ${subItem.qNum}: ${
                  isSubmitted
                    ? isCorrect
                      ? "Correct"
                      : isAnswered
                      ? "Incorrect"
                      : "Unanswered"
                    : isAnswered
                    ? "Answered"
                    : "Unanswered"
                }`}
              >
                {subItem.qNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Bottom Navigation Bar with Sections / Parts
  const renderBottomNav = () => {
    if (testType === "speaking") return null;

    const sections = test?.sections || [];
    if (sections.length === 0) return null;

    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 py-2.5 px-4 sm:px-8 flex items-center justify-between gap-3 z-40 shadow-lg select-none">
        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {sections.map((sec: any, sIdx: number) => {
            const isActive = sIdx === activeSecIdx;
            const secItems = sectionSubItemsMap[sIdx] || [];
            const answeredInSec = secItems.filter((item: any) => isSubItemAnswered(item)).length;
            const correctInSec = secItems.filter((item: any) => isSubItemCorrect(item)).length;

            return (
              <button
                key={sec.id || sIdx}
                type="button"
                onClick={() => handleSectionSwitch(sIdx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-[#2d5a3f] text-white border-[#2d5a3f] shadow-md shadow-[#2d5a3f]/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                }`}
              >
                <span>{sec.title || `Part ${sIdx + 1}`}</span>
                {secItems.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSubmitted
                        ? "bg-white/20 text-white"
                        : isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {isSubmitted ? `${correctInSec}/${secItems.length} ✓` : `${answeredInSec}/${secItems.length}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section Navigation Helpers */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={activeSecIdx === 0}
            onClick={() => handleSectionSwitch(activeSecIdx - 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ← Previous Part
          </button>
          <button
            type="button"
            disabled={activeSecIdx >= sections.length - 1}
            onClick={() => handleSectionSwitch(activeSecIdx + 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Next Part →
          </button>
        </div>
      </footer>
    );
  };

  const getSectionRangeText = () => {
    const secItems = currentSectionSubItems || [];
    if (secItems.length === 0) {
      const fallbackLen = currentSec.questions?.length || 10;
      return `Questions 1-${fallbackLen}`;
    }
    const start = secItems[0].qNum;
    const end = secItems[secItems.length - 1].qNum;
    return start === end ? `Question ${start}` : `Questions ${start}-${end}`;
  };

  // Render individual question types
  const renderQuestionInput = (rawQ: any, i: number) => {
    if (!rawQ) return null;
    const payload = rawQ.data || {};
    const q = {
      ...payload,
      ...rawQ,
      text: rawQ.text || payload.text || payload.question || payload.statement || payload.prompt || "",
      options: (Array.isArray(rawQ.options) && rawQ.options.length > 0) ? rawQ.options : (Array.isArray(payload.options) ? payload.options : []),
      correctAnswer: rawQ.correctAnswer ?? payload.correctAnswer ?? payload.answers ?? payload.answer ?? payload.correct ?? "",
      sectionHeading: rawQ.sectionHeading || payload.sectionHeading || payload.title || payload.heading || "",
      sectionInstruction: rawQ.sectionInstruction || payload.sectionInstruction || payload.instruction || "",
      type: rawQ.type || payload.type || "MCQ"
    };

    const qType = (q.type || "MCQ").toUpperCase();
    const isAnswered = isQuestionAnswered(q);
    const isCorrect = isQuestionCorrect(q);
    const correctAnsText = getQuestionCorrectAnswer(q);

    const firstSubItem = currentSectionSubItems.find(
      (item: any) => item.parentQ === q || item.parentQ?.id === q.id || item.id === q.id
    );
    const qNumDisplay = q.qNum || (firstSubItem ? firstSubItem.qNum : i + 1);

    // WRITING task editor
    if (testType === "writing") {
      const getWordCount = (htmlStr: string) => {
        if (!htmlStr) return 0;
        const text = htmlStr.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
        return text ? text.split(/\s+/).filter(Boolean).length : 0;
      };

      const wordCount = getWordCount(answers[q.id] || "");
      const minWords = activeSecIdx === 0 ? 150 : 250;
      const isWordCountMet = wordCount >= minWords;

      return (
        <div key={q.id || i} id={`question-card-${q.id || i}`} className="h-full flex flex-col space-y-3">
          <div className="flex-1 w-full border border-gray-300 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-teal-500 bg-white dark:bg-slate-900 min-h-[420px] shadow-sm">
            <RichTextEditor
              value={answers[q.id] || ""}
              onChange={(val) => {
                if (!isSubmitted) setAnswers((prev) => ({ ...prev, [q.id]: val }));
              }}
              placeholder="Start typing your official essay response here..."
              className="flex-1 overflow-y-auto p-4"
            />
          </div>
          <div className="flex items-center justify-between px-2 text-xs font-bold">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                isWordCountMet
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
              }`}
            >
              Words: {wordCount} / {minWords} minimum
            </span>
            <span className="text-slate-400">Target Band: 7.0 - 9.0</span>
          </div>

          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black">
                <CheckCircle className="w-4 h-4" />
                <span>Writing Assessment Staged</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your response ({wordCount} words) meets the criteria for standard IELTS Academic task evaluation. Examiners grade on Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.
              </p>
            </div>
          )}
        </div>
      );
    }

    // MATCHING dropdown
    if (qType.includes("MATCHING")) {
      const rawText =
        typeof q.text === "string"
          ? q.text
          : Array.isArray(q.text)
          ? q.text.join("\n")
          : String(q.text || "");
      const prompts = rawText
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      return (
        <div
          key={q.id || i}
          id={`question-card-${q.id || i}`}
          className={`mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${
            isSubmitted
              ? isCorrect
                ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
          }`}
        >
          {q.sectionHeading && (
            <div className="mb-4 border-l-4 border-teal-500 pl-3.5 py-1 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl">
              <h3 className="font-black text-sm uppercase text-teal-800 dark:text-teal-300">
                {q.sectionHeading}
              </h3>
              {q.sectionInstruction && (
                <div className="text-gray-600 dark:text-slate-300 text-xs italic mt-1">
                  <Markdown rehypePlugins={[rehypeRaw]}>{q.sectionInstruction}</Markdown>
                </div>
              )}
            </div>
          )}

          {/* Options / Headings Block */}
          {q.options && q.options.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                Available Options / Headings:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {q.options.map((opt: string, optIdx: number) => (
                  <div
                    key={optIdx}
                    className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    <span className="font-black text-teal-600 dark:text-teal-400 shrink-0">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompts list */}
          {prompts.length > 1 ? (
            <div className="space-y-3">
              {prompts.map((prompt: string, pIdx: number) => {
                const subKey = `${q.id}_${pIdx}`;
                const subItem = currentSectionSubItems.find(
                  (item: any) => item.id === subKey || (item.parentQ?.id === q.id && item.pIdx === pIdx)
                );
                const subNum = subItem ? subItem.qNum : qNumDisplay + pIdx;
                const val = answers[subKey] ?? (pIdx === 0 ? answers[q.id] || "" : "");
                const isSubCorrect = isSubItemCorrect(
                  subItem || {
                    id: subKey,
                    parentQ: q,
                    subIndex: pIdx,
                    type: "MATCHING",
                    correctAnswer: q.correctAnswer,
                  }
                );
                const correctCandidate = subItem ? getSubItemCorrectAnswerText(subItem) : "";

                return (
                  <div
                    key={pIdx}
                    id={`question-card-${subKey}`}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all ${
                      isSubmitted
                        ? isSubCorrect
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {subNum}
                      </span>
                      <div className="font-bold text-gray-800 dark:text-slate-200 text-sm leading-relaxed">
                        <Markdown rehypePlugins={[rehypeRaw]}>{prompt}</Markdown>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        disabled={isSubmitted}
                        value={val}
                        onChange={(e) => {
                          const selectedVal = e.target.value;
                          setAnswers((prev) => ({
                            ...prev,
                            [subKey]: selectedVal,
                            ...(pIdx === 0 ? { [q.id]: selectedVal } : {}),
                          }));
                        }}
                        className={`border-2 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs min-w-[200px] ${
                          isSubmitted
                            ? isSubCorrect
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200"
                              : "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200"
                            : "border-teal-500/40 hover:border-teal-500 bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200"
                        }`}
                      >
                        <option value="" disabled>
                          -- Select match --
                        </option>
                        {(q.options || []).map((opt: string, oIdx: number) => (
                          <option key={oIdx} value={opt}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </option>
                        ))}
                      </select>
                      {isSubmitted && !isSubCorrect && correctCandidate && (
                        <span className="text-[11px] font-black px-2 py-1 rounded-lg bg-emerald-600 text-white shrink-0">
                          Key: {correctCandidate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span
                  className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                    isSubmitted ? (isCorrect ? "bg-emerald-600" : "bg-rose-600") : "bg-teal-600"
                  }`}
                >
                  {qNumDisplay}
                </span>
                <div className="font-bold text-gray-800 dark:text-slate-200 text-sm leading-relaxed">
                  <Markdown rehypePlugins={[rehypeRaw]}>
                    {q.text || "Match the corresponding heading"}
                  </Markdown>
                </div>
              </div>
              <select
                disabled={isSubmitted}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                className={`border-2 rounded-xl px-3 py-2 w-full sm:w-auto min-w-[220px] max-w-full text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs ${
                  isSubmitted
                    ? isCorrect
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200"
                      : "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200"
                    : "border-teal-500/40 hover:border-teal-500 bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200"
                }`}
              >
                <option value="" disabled>
                  -- Select option --
                </option>
                {(q.options || []).map((opt: string, oIdx: number) => (
                  <option key={oIdx} value={opt}>
                    {String.fromCharCode(65 + oIdx)}. {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isSubmitted && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
              <span
                className={
                  isCorrect
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              >
                {isCorrect ? "✓ Correct Match" : `✗ Incomplete or incorrect matches`}
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                Key: {correctAnsText}
              </span>
            </div>
          )}
        </div>
      );
    }

    // MULTI_MCQ Checkbox options
    if (qType === "MULTI_MCQ" && q.options && q.options.length > 0) {
      const currentSelected: string[] = Array.isArray(answers[q.id])
        ? answers[q.id]
        : answers[q.id]
        ? [answers[q.id]]
        : [];

      const handleMultiToggle = (opt: string) => {
        if (isSubmitted) return;
        setAnswers((prev) => {
          const list = Array.isArray(prev[q.id]) ? [...prev[q.id]] : prev[q.id] ? [prev[q.id]] : [];
          if (list.includes(opt)) {
            return { ...prev, [q.id]: list.filter((x: string) => x !== opt) };
          } else {
            return { ...prev, [q.id]: [...list, opt] };
          }
        });
      };

      return (
        <div
          key={q.id || i}
          id={`question-card-${q.id || i}`}
          className={`mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${
            isSubmitted
              ? isCorrect
                ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
              : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-xs"
          }`}
        >
          {q.sectionHeading && (
            <div className="mb-4 border-l-4 border-teal-500 pl-3.5 py-1 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl">
              <h3 className="font-black text-sm uppercase text-teal-800 dark:text-teal-300">
                {q.sectionHeading}
              </h3>
              {q.sectionInstruction && (
                <div className="text-gray-600 dark:text-slate-300 text-xs italic mt-1">
                  <Markdown rehypePlugins={[rehypeRaw]}>{q.sectionInstruction}</Markdown>
                </div>
              )}
            </div>
          )}
          <div className="flex items-start gap-3 mb-3">
            <span
              className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                isSubmitted ? (isCorrect ? "bg-emerald-600" : "bg-rose-600") : "bg-teal-600"
              }`}
            >
              {qNumDisplay}
            </span>
            <div className="font-bold text-gray-900 dark:text-white text-sm leading-relaxed">
              <Markdown rehypePlugins={[rehypeRaw]}>{q.text}</Markdown>
            </div>
          </div>
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-3 ml-9">
            (Select multiple answers)
          </p>
          <div className="space-y-2.5 ml-9">
            {q.options.map((opt: string, oIdx: number) => {
              const isChecked = currentSelected.includes(opt);
              const isOptionInCorrect = String(correctAnsText).toLowerCase().includes(opt.toLowerCase());

              let optionStyle = isChecked
                ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-bold"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300";

              if (isSubmitted) {
                if (isOptionInCorrect) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold";
                } else if (isChecked && !isOptionInCorrect) {
                  optionStyle =
                    "border-rose-500 bg-rose-100/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold";
                }
              }

              return (
                <label
                  key={oIdx}
                  onClick={() => handleMultiToggle(opt)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${optionStyle}`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0 mt-0.5 ${
                      isChecked
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase mr-1">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed flex-1">
                    <Markdown rehypePlugins={[rehypeRaw]}>{opt}</Markdown>
                  </div>
                  {isSubmitted && isOptionInCorrect && (
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      Correct Key
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {isSubmitted && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 ml-9 flex items-center justify-between text-xs font-bold">
              <span
                className={
                  isCorrect
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              >
                {isCorrect ? "✓ All correct options chosen" : "✗ Incomplete or incorrect selections"}
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                Key: {correctAnsText}
              </span>
            </div>
          )}
        </div>
      );
    }

    // MCQ Radio options
    if (q.options && q.options.length > 0) {
      return (
        <div
          key={q.id || i}
          id={`question-card-${q.id || i}`}
          className={`mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${
            isSubmitted
              ? isCorrect
                ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
              : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-xs"
          }`}
        >
          {q.sectionHeading && (
            <div className="mb-4 border-l-4 border-teal-500 pl-3.5 py-1 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl">
              <h3 className="font-black text-sm uppercase text-teal-800 dark:text-teal-300">
                {q.sectionHeading}
              </h3>
              {q.sectionInstruction && (
                <div className="text-gray-600 dark:text-slate-300 text-xs italic mt-1">
                  <Markdown rehypePlugins={[rehypeRaw]}>{q.sectionInstruction}</Markdown>
                </div>
              )}
            </div>
          )}
          <div className="flex items-start gap-3 mb-3">
            <span
              className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                isSubmitted ? (isCorrect ? "bg-emerald-600" : "bg-rose-600") : "bg-teal-600"
              }`}
            >
              {qNumDisplay}
            </span>
            <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-relaxed">
              <Markdown rehypePlugins={[rehypeRaw]}>{q.text}</Markdown>
            </div>
          </div>
          <div className="space-y-2.5 ml-9">
            {q.options.map((opt: string, oIdx: number) => {
              const isSelected = answers[q.id] === opt;
              const isThisCorrect =
                opt === q.correctAnswer ||
                (q.correctIndex !== undefined && oIdx === q.correctIndex) ||
                (q.correctAnswer &&
                  String(q.correctAnswer).trim().toLowerCase() === opt.trim().toLowerCase());

              let optionStyle = isSelected
                ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-bold shadow-xs"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300";

              if (isSubmitted) {
                if (isThisCorrect) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold";
                } else if (isSelected && !isThisCorrect) {
                  optionStyle =
                    "border-rose-500 bg-rose-100/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold";
                }
              }

              return (
                <label
                  key={oIdx}
                  onClick={() => {
                    if (!isSubmitted) setAnswers((prev) => ({ ...prev, [q.id]: opt }));
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${optionStyle}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs shrink-0 mt-0.5 ${
                      isSelected
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase mr-1">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed flex-1">
                    <Markdown rehypePlugins={[rehypeRaw]}>{opt}</Markdown>
                  </div>
                  {isSubmitted && isThisCorrect && (
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correct Key
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {isSubmitted && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 ml-9 flex items-center justify-between text-xs font-bold">
              <span
                className={
                  isCorrect
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              >
                {isCorrect ? "✓ Correct response" : `✗ Incorrect (Selected: ${answers[q.id] || "None"})`}
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                Key: {correctAnsText}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Default: Inline Blanks or Short Text Input
    const rawText =
      typeof q.text === "string"
        ? q.text
        : Array.isArray(q.text)
        ? q.text.join("\n")
        : String(q.text || "");
    const isInlineBlank = /_{2,}|\[blank\]/i.test(rawText);

    if (isInlineBlank) {
      const parts = rawText.split(/_{2,}|\[BLANK\]/i);

      return (
        <div
          key={q.id || i}
          id={`question-card-${q.id || i}`}
          className={`mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${
            isSubmitted
              ? isCorrect
                ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
              : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-xs"
          }`}
        >
          {q.sectionHeading && (
            <div className="mb-4 border-l-4 border-teal-500 pl-3.5 py-1 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl">
              <h3 className="font-black text-sm uppercase text-teal-800 dark:text-teal-300">
                {q.sectionHeading}
              </h3>
              {q.sectionInstruction && (
                <div className="text-gray-600 dark:text-slate-300 text-xs italic mt-1">
                  <Markdown rehypePlugins={[rehypeRaw]}>{q.sectionInstruction}</Markdown>
                </div>
              )}
            </div>
          )}

          <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-loose whitespace-pre-wrap">
            {parts.map((part: string, pIndex: number) => {
              if (pIndex === parts.length - 1) {
                return <span key={pIndex}>{part}</span>;
              }

              const subKey = `${q.id}_${pIndex}`;
              const subItem = currentSectionSubItems.find(
                (item: any) =>
                  item.id === subKey || (item.parentQ?.id === q.id && item.bIdx === pIndex)
              );
              const subNum = subItem ? subItem.qNum : qNumDisplay + pIndex;
              const val = answers[subKey] ?? (pIndex === 0 ? answers[q.id] || "" : "");
              const isSubCorrect = isSubItemCorrect(
                subItem || {
                  id: subKey,
                  parentQ: q,
                  subIndex: pIndex,
                  type: "INLINE_BLANKS",
                  correctAnswer: q.correctAnswer,
                }
              );
              const correctCandidate = subItem ? getSubItemCorrectAnswerText(subItem) : "";

              return (
                <Fragment key={pIndex}>
                  <span>{part}</span>
                  <span className="inline-flex items-center gap-1 mx-1.5 align-middle">
                    <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                      {subNum}
                    </span>
                    <input
                      id={`question-input-${subKey}`}
                      disabled={isSubmitted}
                      type="text"
                      className={`border-b-2 px-2.5 py-1 min-w-[130px] max-w-[220px] rounded-t-md focus:outline-none text-center font-bold text-sm transition-all inline-block ${
                        isSubmitted
                          ? isSubCorrect
                            ? "border-emerald-600 bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200"
                            : "border-rose-600 bg-rose-100/70 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200"
                          : "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 focus:border-teal-700 text-teal-950 dark:text-teal-200"
                      }`}
                      placeholder={`[${subNum}]`}
                      value={val}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setAnswers((prev) => ({
                          ...prev,
                          [subKey]: newVal,
                          ...(pIndex === 0 ? { [q.id]: newVal } : {}),
                        }));
                      }}
                    />
                    {isSubmitted && !isSubCorrect && correctCandidate && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                        Key: {correctCandidate}
                      </span>
                    )}
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div
        key={q.id || i}
        id={`question-card-${q.id || i}`}
        className={`mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${
          isSubmitted
            ? isCorrect
              ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
              : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
            : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-xs"
        }`}
      >
        {q.sectionHeading && (
          <div className="mb-4 border-l-4 border-teal-500 pl-3.5 py-1 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl">
            <h3 className="font-black text-sm uppercase text-teal-800 dark:text-teal-300">
              {q.sectionHeading}
            </h3>
            {q.sectionInstruction && (
              <div className="text-gray-600 dark:text-slate-300 text-xs italic mt-1">
                <Markdown rehypePlugins={[rehypeRaw]}>{q.sectionInstruction}</Markdown>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-3">
          <span
            className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
              isSubmitted ? (isCorrect ? "bg-emerald-600" : "bg-rose-600") : "bg-teal-600"
            }`}
          >
            {qNumDisplay}
          </span>
          <div className="flex-1">
            <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base mb-3 leading-relaxed">
              <Markdown rehypePlugins={[rehypeRaw]}>{q.text || "Write your answer"}</Markdown>
            </div>
            <input
              id={`question-input-${q.id || i}`}
              disabled={isSubmitted}
              type="text"
              className={`border-2 rounded-xl px-4 py-2 w-full max-w-sm text-sm font-bold focus:outline-none transition-all shadow-xs ${
                isSubmitted
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                    : "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200"
                  : "border-slate-300 dark:border-slate-700 hover:border-teal-500 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              }`}
              placeholder="Enter response here..."
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />

            {isSubmitted && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
                <span
                  className={
                    isCorrect
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }
                >
                  {isCorrect
                    ? "✓ Correct response"
                    : `✗ Incorrect (Your answer: ${answers[q.id] || "None"})`}
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                  Key: {correctAnsText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Split-pane helper for Reading & Writing
  const renderSplitPane = (leftContent: React.ReactNode, rightContent: React.ReactNode) => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)] p-4 sm:p-6 overflow-hidden">
      {/* Left Pane (Passage / Prompt) */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 overflow-y-auto h-full">
        {leftContent}
      </div>

      {/* Right Pane (Questions / Response) */}
      <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 overflow-y-auto h-full pb-10">
        {rightContent}
      </div>
    </div>
  );

  const renderReading = () => {
    return renderSplitPane(
      <div
        className={`prose dark:prose-invert max-w-none ${
          textSize === "sm" ? "prose-sm" : textSize === "lg" ? "prose-lg" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
            Academic Reading Passage
          </span>
          <span className="text-[10px] font-bold text-slate-400">Section {activeSecIdx + 1} of {allSections.length || 3}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">
          {currentSec.title || `Reading Passage ${activeSecIdx + 1}`}
        </h1>
        <p className="italic text-slate-500 text-xs sm:text-sm mb-6 border-l-2 border-emerald-500 pl-3">
          You should spend about 20 minutes on {getSectionRangeText()}, based on the passage below.
        </p>
        {currentSec.image && (
          <img src={currentSec.image} alt="Passage diagram" className="w-full mb-6 rounded-2xl border shadow-sm" />
        )}
        <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
          <Markdown rehypePlugins={[rehypeRaw]}>{currentSec.content || "Passage text goes here."}</Markdown>
        </div>
      </div>,
      <div className="h-full">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
          <h3 className="text-teal-700 dark:text-teal-400 font-black text-lg sm:text-xl">
            {getSectionRangeText()}
          </h3>
          <span className="text-xs font-bold text-slate-400">Computer Delivered Exam</span>
        </div>
        {currentSec.questions?.map((q: any, i: number) => renderQuestionInput(q, i))}
      </div>
    );
  };

  const renderWriting = () => {
    const q = currentSec.questions?.[0] || { id: currentSec.id || `writing-task-${activeSecIdx}` };
    const minWords = activeSecIdx === 0 ? 150 : 250;

    return renderSplitPane(
      <div
        className={`prose dark:prose-invert max-w-none ${
          textSize === "sm" ? "prose-sm" : textSize === "lg" ? "prose-lg" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
            Writing Task {activeSecIdx + 1}
          </span>
          <span className="text-[10px] font-bold text-slate-400">Min. {minWords} Words</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">
          {currentSec.title || `Writing Task ${activeSecIdx + 1}`}
        </h1>
        <p className="italic text-slate-500 text-xs sm:text-sm mb-6 border-l-2 border-amber-500 pl-3">
          You should spend about {activeSecIdx === 0 ? "20" : "40"} minutes on this task. Write at least {minWords} words.
        </p>
        <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans mb-6">
          <Markdown rehypePlugins={[rehypeRaw]}>{currentSec.content || "Writing task prompt."}</Markdown>
        </div>
        {currentSec.image && (
          <img src={currentSec.image} alt="Task diagram" className="w-full mb-6 rounded-2xl border p-2 bg-white" />
        )}
      </div>,
      <div className="h-full flex flex-col">{renderQuestionInput(q, 0)}</div>
    );
  };

  const renderSpeaking = () => {
    return (
      <div className="w-full min-h-[calc(100vh-70px)] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start pt-2 sm:pt-4 px-4 pb-6 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 text-center relative overflow-hidden mt-1">
          {/* Header Strip */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-2xl p-3.5 mb-6">
            <h3 className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-xs">
              Part {currentSectionIdx + 1}: {currentSec.title || "Introduction & Interview"}
            </h3>
            {thinkTime > 0 ? (
              <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black animate-pulse">
                Time to Think: 00:0{thinkTime}
              </div>
            ) : (
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black">
                Ready to Record
              </div>
            )}
          </div>

          <span className="text-rose-500 font-black text-xs uppercase tracking-widest block mb-2">
            Interview Question
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
            {currentSec.content || "What are the most popular forms of public transport in your hometown?"}
          </h2>

          {/* Mic Record Button with Pulse Waves */}
          <div className="relative inline-block mb-5">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
            )}
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer relative z-10 ${
                isRecording
                  ? "bg-rose-600 text-white scale-110 shadow-rose-500/40"
                  : "bg-white dark:bg-slate-800 border-4 border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700"
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="space-y-1">
            <p className="font-mono text-xl font-black text-slate-800 dark:text-slate-200">
              {isRecording
                ? `Recording: ${Math.floor(recordDuration / 60)}:${(recordDuration % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "Click microphone to start recording response"}
            </p>
            <p className="text-xs text-slate-400 font-semibold">
              Speak clearly into your device microphone. Maximum time: 2 minutes.
            </p>
          </div>

          {audioUrl && (
            <div className="mt-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle className="w-4 h-4" /> Response recorded and staged for AI Examiner grading
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderListening = () => {
    return (
      <div className="min-h-[calc(100vh-140px)] w-full bg-white dark:bg-slate-900 pb-32">
        {/* Sticky Audio Control Bar */}
        {currentSec.audio && (
          <audio
            ref={audioRef}
            src={currentSec.audio}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-8 py-3 flex items-center gap-3 sm:gap-5 sticky top-0 z-40 shadow-xs">
          <button
            onClick={() => skipTime(-10)}
            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-700 flex items-center justify-center text-white shadow-md transition-all cursor-pointer"
            title={isPlaying ? "Pause Audio" : "Play Audio"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </button>
          <button
            onClick={() => skipTime(10)}
            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-300 w-12">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, "0")}
          </span>

          {/* Interactive Scrub Slider */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />

          <span className="text-xs font-mono font-black text-slate-400 w-12 text-right">
            {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, "0")}
          </span>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer p-1"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-teal-600" />}
          </button>
        </div>

        {/* Listening Content / Questions Stream */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg">
              Listening Section {activeSecIdx + 1}
            </span>
            <span className="text-xs font-bold text-slate-400">{getSectionRangeText()}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6">
            {currentSec.title || `Part ${activeSecIdx + 1}`}
          </h2>

          {currentSec.content && (
            <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 prose dark:prose-invert max-w-none text-sm">
              <Markdown rehypePlugins={[rehypeRaw]}>{currentSec.content}</Markdown>
            </div>
          )}

          <div className="space-y-6">
            {currentSec.questions?.map((q: any, i: number) => renderQuestionInput(q, i))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {renderHeader()}
      {renderTopNav()}
      <main className="flex-1 w-full overflow-hidden relative pb-16">
        {testType === "reading" && renderReading()}
        {testType === "writing" && renderWriting()}
        {testType === "speaking" && renderSpeaking()}
        {testType === "listening" && renderListening()}
      </main>
      {renderBottomNav()}

      {/* Solutions Key Modal */}
      {showSolutionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-teal-600" /> Answer Solutions Key
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified answers & explanations for {currentSec?.title || `Section ${activeSecIdx + 1}`}
                </p>
              </div>
              <button
                onClick={() => setShowSolutionsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Section Tabs in Solutions Key */}
            {allSections.length > 1 && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                {allSections.map((s: any, idx: number) => (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => handleSectionSwitch(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeSecIdx === idx
                        ? "bg-teal-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {s.title || `Part ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 text-sm">
              {currentSectionSubItems.map((subItem: any, i: number) => {
                const isAnsCorrect = isSubItemCorrect(subItem);
                const isAnsProvided = isSubItemAnswered(subItem);
                const correctText = getSubItemCorrectAnswerText(subItem);
                const parentQ = subItem.parentQ;

                let questionDisplay = "";
                if (subItem.type === "INLINE_BLANKS") {
                  questionDisplay = `Fill blank #${subItem.bIdx + 1}: ${
                    parentQ?.sectionHeading || parentQ?.text?.slice(0, 80) || "Blank Completion"
                  }`;
                } else if (subItem.type === "MATCHING") {
                  questionDisplay = subItem.prompt || parentQ?.text || "Matching Item";
                } else {
                  questionDisplay = parentQ?.text || "Question";
                }
                questionDisplay = questionDisplay.replace(/<[^>]*>/g, "").trim();

                const userAns = Array.isArray(answers[subItem.id])
                  ? answers[subItem.id].join(", ")
                  : answers[subItem.id] || (subItem.bIdx === 0 || subItem.pIdx === 0 ? answers[parentQ?.id] : "") || "No answer recorded";

                return (
                  <div
                    key={subItem.id || i}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSubmitted
                        ? isAnsCorrect
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : isAnsProvided
                          ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Q{subItem.qNum}. {questionDisplay}
                      </p>
                      {isSubmitted && (
                        <span
                          className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md shrink-0 ${
                            isAnsCorrect
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : isAnsProvided
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {isAnsCorrect ? "Correct" : isAnsProvided ? "Incorrect" : "Skipped"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Your Response:</span>
                        <span
                          className={`font-bold ${
                            !isAnsProvided
                              ? "text-slate-400 italic"
                              : isSubmitted
                              ? isAnsCorrect
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                              : "text-slate-800 dark:text-white"
                          }`}
                        >
                          {userAns}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Official Solution Key:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {correctText}
                        </span>
                      </div>
                    </div>

                    {parentQ?.explanation && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-teal-600 dark:text-teal-400">Explanation: </span>
                        {parentQ.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Performance & Score Diagnostic Report Modal */}
      {showReportResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Official Score & Diagnostic Report
                  </h3>
                  <p className="text-xs text-slate-400">IELTS Academic Assessment Summary</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportResultModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Band Card */}
            {(() => {
              const stats = calculateTestStats();
              return (
                <div className="flex-1 overflow-y-auto pr-1 space-y-5">
                  {/* Hero Band Score Banner */}
                  <div className="p-6 rounded-3xl bg-linear-to-br from-[#2d5a3f] to-[#1c3928] text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                      <Award className="w-48 h-48" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full">
                        Overall Performance
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-black mt-2">
                        {stats.bandScore >= 7.5 ? "Superior Mastery" : stats.bandScore >= 6.5 ? "Competent User" : "Good Progress"}
                      </h4>
                      <p className="text-xs text-emerald-100/80 mt-1 max-w-[240px]">
                        Accuracy: {stats.percent}% ({stats.correct} of {stats.total} correct)
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white/15 backdrop-blur-xs rounded-2xl px-5 py-3 border border-white/20">
                      <span className="text-[10px] font-black uppercase text-emerald-200 tracking-wider">Band Score</span>
                      <span className="text-3xl sm:text-4xl font-black text-amber-300">
                        {stats.bandScore.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-bold text-white/80">out of 9.0</span>
                    </div>
                  </div>

                  {/* 3-Pillar Breakdown Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Correct</p>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.correct}</p>
                    </div>
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-center">
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Incorrect</p>
                      <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">{stats.incorrect}</p>
                    </div>
                    <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Skipped</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">{stats.skipped}</p>
                    </div>
                  </div>

                  {/* Section by Section Diagnostics */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">Section Analysis</h5>
                    <div className="space-y-2">
                      {allSections.map((sec: any, sIdx: number) => {
                        const secQuestions = sec.questions || [];
                        const secCorrect = secQuestions.filter((q: any) => isQuestionCorrect(q)).length;
                        const secTotal = secQuestions.length;
                        const secPercent = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;

                        return (
                          <div
                            key={sec.id || sIdx}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                                {sIdx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {sec.title || `Part ${sIdx + 1}`}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {secCorrect} of {secTotal} questions correct
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                              {secPercent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowReportResultModal(false);
                  setShowSolutionsModal(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>See Solutions Key</span>
              </button>
              <button
                onClick={() => {
                  setShowReportResultModal(false);
                  handleQuitSession();
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Done & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Mistake Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Report Mistake or Issue
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportSubmitted(false);
                  setReportText("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-teal-500 mx-auto" />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Thank you for your feedback</h4>
                <p className="text-xs text-slate-500">Our academic team will inspect and review this test item.</p>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSubmitted(false);
                    setReportText("");
                  }}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Please describe the typo, audio issue, or incorrect key in this question.
                </p>
                <textarea
                  rows={4}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe the issue here..."
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setReportSubmitted(true)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Leave Exam Session?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your ongoing test session will be suspended. You can resume your test attempt anytime from your dashboard.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  handleQuitSession();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Quit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Test Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mx-auto">
              <Send className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Submit Completed Test?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You have answered{" "}
              <span className="font-bold text-teal-600">
                {allFlatQuestions.filter((item: any) => isSubItemAnswered(item)).length}
              </span>{" "}
              out of{" "}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {allFlatQuestions.length}
              </span>{" "}
              total questions.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2.5 rounded-xl bg-[#2d5a3f] hover:bg-[#1f402c] text-white text-xs font-black shadow-md cursor-pointer"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
