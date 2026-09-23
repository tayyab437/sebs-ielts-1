import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Share2, 
  Printer, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  GraduationCap, 
  Star, 
  Calendar,
  FileCheck,
  PlusCircle,
  Eye,
  Check,
  BookOpen,
  Lock,
  Unlock,
  ArrowRight,
  Flame,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { safeGetItemAndParse, safeSetItem } from "@/src/lib/safeStorage";
import CourseCompletionCelebrationModal from "@/src/components/courses/CourseCompletionCelebrationModal";
import OfficialAccreditedCertificate from "@/src/components/courses/OfficialAccreditedCertificate";

const SEB_RED_LOGO_URL = "https://i.ibb.co/gMgHC2YQ/01-logo-curve63-3.png";
const FALLBACK_LOGO_URL = "/sebs_official_logo_v2_1780389206872.png";

interface CertificateRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  issueDate: string;
  targetBand: string;
  verificationUrl?: string;
  issuedAt: string;
}

interface StudentCertificatesTabProps {
  userProfile: any;
  coursesList?: any[];
  completedLessons?: string[];
}

// The 3 official accredited certificates requested
const CORE_CERTIFICATE_TRACKS = [
  {
    courseId: "basic-english",
    certTitle: "Basic English Course Completion Certificate",
    courseTitle: "Basic English Course",
    category: "English Fundamentals",
    targetBand: "CEFR A1-B1 Foundation",
    totalLessons: 18,
    description: "Official certificate awarded upon completing foundational English grammar, sentence structures, vocabulary, and reading comprehension.",
    accentColor: "from-red-600 to-rose-700"
  },
  {
    courseId: "ielts-prep",
    certTitle: "IELTS Preparation Certificate",
    courseTitle: "IELTS Preparation Masterclass",
    category: "IELTS Academic & General",
    targetBand: "Band 8.0 - 9.0 (Expert Level)",
    totalLessons: 32,
    description: "Accredited certificate awarded upon completing all four IELTS modules: Academic Writing, Speaking, Reading, and Listening mastery.",
    accentColor: "from-red-700 to-red-900"
  },
  {
    courseId: "spoken-english",
    certTitle: "Spoken English Course Completion Certificate",
    courseTitle: "Spoken English & Fluency Course",
    category: "Spoken English & Fluency",
    targetBand: "Executive Fluency (C1-C2)",
    totalLessons: 24,
    description: "Accredited certificate awarded upon completing accent neutralization, spontaneous conversational prompts, and public speaking modules.",
    accentColor: "from-rose-600 to-red-800"
  }
];

export default function StudentCertificatesTab({
  userProfile,
  coursesList = [],
  completedLessons = []
}: StudentCertificatesTabProps) {
  const [certificates, setCertificates] = useState<CertificateRecord[]>(() => {
    return safeGetItemAndParse<CertificateRecord[]>("student_certificates", []);
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimCourse, setClaimCourse] = useState<{ id: string; title: string; totalLessons: number; targetBand: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unlocked" | "locked">("all");

  const studentName = userProfile?.full_name || userProfile?.name || "IELTS Candidate";

  // Sync certificates when new ones are issued
  useEffect(() => {
    const handleCertIssued = () => {
      const updated = safeGetItemAndParse<CertificateRecord[]>("student_certificates", []);
      setCertificates(updated);
    };

    window.addEventListener("certificate_issued", handleCertIssued);
    return () => window.removeEventListener("certificate_issued", handleCertIssued);
  }, []);

  const handleCopyLink = (cert: CertificateRecord) => {
    const url = `${window.location.origin}/courses?cert_verify=${cert.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(cert.id);
    toast.success("Certificate verification link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Exclusively map the 3 certificates requested
  const tracksWithStatus = React.useMemo(() => {
    return CORE_CERTIFICATE_TRACKS.map((track) => {
      // Find issued certificate if any
      const existingCert = certificates.find(
        c => c.courseId === track.courseId || 
             c.courseTitle.toLowerCase().trim() === track.certTitle.toLowerCase().trim() ||
             c.courseTitle.toLowerCase().includes(track.courseId)
      );

      // Calculate completed lessons for this course
      const completedForTrack = completedLessons.filter(
        id => {
          const lowerId = id.toLowerCase();
          if (track.courseId === "basic-english") {
            return lowerId.includes("basic") || lowerId.includes("grammar");
          }
          if (track.courseId === "ielts-prep") {
            return lowerId.includes("ielts") || lowerId.includes("prep") || lowerId.startsWith("lec-") || lowerId.startsWith("lesson-");
          }
          if (track.courseId === "spoken-english") {
            return lowerId.includes("spoken") || lowerId.includes("speak") || lowerId.includes("fluency");
          }
          return lowerId.includes(track.courseId);
        }
      ).length;

      const isCompleted = existingCert !== undefined || (completedForTrack >= track.totalLessons && track.totalLessons > 0);
      const progressPercent = isCompleted ? 100 : Math.min(Math.round((completedForTrack / track.totalLessons) * 100), 95);

      return {
        ...track,
        isUnlocked: isCompleted,
        progressPercent,
        completedCount: isCompleted ? track.totalLessons : completedForTrack,
        certificateData: existingCert || {
          id: `SEB-${Date.now().toString().slice(-4)}-${track.courseId.slice(0, 4).toUpperCase()}`,
          courseId: track.courseId,
          courseTitle: track.certTitle,
          studentName: studentName,
          issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          targetBand: track.targetBand,
          issuedAt: new Date().toISOString()
        }
      };
    });
  }, [certificates, completedLessons, studentName]);

  // Filtered tracks
  const filteredTracks = tracksWithStatus.filter(t => {
    const matchesSearch = 
      t.certTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === "unlocked") return t.isUnlocked;
    if (activeFilter === "locked") return !t.isUnlocked;
    return true;
  });

  const unlockedCount = tracksWithStatus.filter(t => t.isUnlocked).length;
  const lockedCount = tracksWithStatus.filter(t => !t.isUnlocked).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* RED THEME HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] text-white p-6 sm:p-10 shadow-2xl shadow-red-950/20 border border-red-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shadow-md">
                <img 
                  src={SEB_RED_LOGO_URL} 
                  alt="SEB Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
                  }}
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black uppercase tracking-widest text-red-100 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-red-200" />
                <span>SEB's International Institute Accreditation</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
              Official Course Certificates
            </h2>
            
            <p className="text-red-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Complete each specialized course to unlock your authentic, accredited Certificate of Completion signed by Founder <strong className="text-white font-bold">Syed Ejaz Bukhari</strong>.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-red-200 font-bold">
              <span className="flex items-center gap-1.5 bg-red-950/40 px-3 py-1 rounded-full border border-red-700/50">
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{unlockedCount} Unlocked</span>
              </span>
              <span className="flex items-center gap-1.5 bg-red-950/40 px-3 py-1 rounded-full border border-red-700/50">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lockedCount} Locked (In Progress)</span>
              </span>
              <span className="flex items-center gap-1.5 bg-red-950/40 px-3 py-1 rounded-full border border-red-700/50">
                <Award className="w-3.5 h-3.5 text-rose-300" />
                <span>ISO 9001:2015 Certified</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              id="claim-custom-certificate-btn"
              onClick={() => {
                setClaimCourse({
                  id: "ielts-prep",
                  title: "IELTS Preparation Certificate",
                  totalLessons: 32,
                  targetBand: "Band 8.0 - 9.0 (Expert Level)"
                });
                setIsClaimModalOpen(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-white text-red-900 hover:bg-red-50 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white"
            >
              <PlusCircle className="w-4 h-4 text-red-700" />
              <span>Claim Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER TABS AND SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-red-700 text-white shadow-md shadow-red-700/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Tracks ({tracksWithStatus.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unlocked")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "unlocked"
                ? "bg-red-700 text-white shadow-md shadow-red-700/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Unlocked ({unlockedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("locked")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "locked"
                ? "bg-red-700 text-white shadow-md shadow-red-700/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Locked ({lockedCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificate tracks..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-red-600 shadow-xs"
          />
        </div>
      </div>

      {/* TRACKS / CERTIFICATES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTracks.map((track) => {
          const isUnlocked = track.isUnlocked;

          return (
            <motion.div
              key={track.courseId}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl p-6 transition-all flex flex-col justify-between space-y-6 overflow-hidden ${
                isUnlocked 
                  ? "bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 shadow-md hover:shadow-2xl hover:border-red-500" 
                  : "bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 opacity-95 shadow-xs"
              }`}
            >
              {/* Top Accent Ribbon for Unlocked vs Locked */}
              <div 
                className={`absolute top-0 left-0 right-0 h-2 ${
                  isUnlocked ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-800" : "bg-slate-300 dark:bg-slate-700"
                }`} 
              />

              <div className="space-y-4">
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/40 p-2 flex items-center justify-center shadow-xs">
                      <img 
                        src={SEB_RED_LOGO_URL} 
                        alt="SEB Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400">
                        {track.category}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        SEB's International Institute
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isUnlocked ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>UNLOCKED</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black border border-amber-500/20">
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOCKED</span>
                    </div>
                  )}
                </div>

                {/* Certificate Name & Course Info */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {track.certTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {track.description}
                  </p>
                </div>

                {/* Progress / Details Card */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Target Proficiency</span>
                    <strong className="text-red-700 dark:text-red-400 font-bold">{track.targetBand}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Signatory Authority</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Syed Ejaz Bukhari</span>
                  </div>

                  {/* Course Completion Progress Bar */}
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {isUnlocked ? "Curriculum Completed" : "Course Progress"}
                      </span>
                      <span className="font-mono font-black text-red-700 dark:text-red-400">
                        {track.completedCount} / {track.totalLessons} Lectures ({track.progressPercent}%)
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isUnlocked 
                            ? "bg-gradient-to-r from-red-600 to-emerald-500" 
                            : "bg-gradient-to-r from-amber-500 to-red-600"
                        }`}
                        style={{ width: `${track.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {isUnlocked && (
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>Registration ID</span>
                      <span className="font-mono text-red-800 dark:text-red-400 font-bold text-[11px]">
                        {track.certificateData.id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isUnlocked ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCert(track.certificateData)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-rose-900 hover:from-red-800 hover:to-red-950 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-900/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Print</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(track.certificateData)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Copy Verification Link"
                    >
                      {copiedId === track.certificateData.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Link
                      to="/courses"
                      className="w-full flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Complete Course</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setClaimCourse({
                          id: track.courseId,
                          title: track.certTitle,
                          totalLessons: track.totalLessons,
                          targetBand: track.targetBand
                        });
                        setIsClaimModalOpen(true);
                      }}
                      className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
                      title="Claim & Generate"
                    >
                      Claim Now
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FULL CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8 space-y-6 my-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center p-1.5 border border-red-200">
                  <img 
                    src={SEB_RED_LOGO_URL} 
                    alt="SEB Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Official Certificate Preview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registration No: <span className="font-mono font-bold text-red-700">{selectedCert.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-red-700/25"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Red Themed Accredited Certificate View */}
            <div className="w-full">
              <OfficialAccreditedCertificate certificate={selectedCert} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleCopyLink(selectedCert)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Shareable Link</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CLAIM CERTIFICATE MODAL */}
      {isClaimModalOpen && (
        <CourseCompletionCelebrationModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          courseTitle={claimCourse?.title || "IELTS Preparation Certificate"}
          courseId={claimCourse?.id || "ielts-prep"}
          totalLectures={claimCourse?.totalLessons || 32}
          studentName={studentName}
          category="SEB's International Institute"
        />
      )}

    </div>
  );
}
