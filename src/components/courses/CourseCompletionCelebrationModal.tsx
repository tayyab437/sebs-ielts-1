import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { 
  Trophy, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Share2, 
  FileText, 
  X, 
  Printer, 
  Star, 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Flame,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { safeGetItemAndParse, safeSetItem } from "@/src/lib/safeStorage";
import OfficialAccreditedCertificate from "./OfficialAccreditedCertificate";

export interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseId?: string;
  totalLectures: number;
  studentName?: string;
  category?: string;
}

export default function CourseCompletionCelebrationModal({
  isOpen,
  onClose,
  courseTitle,
  courseId = "general-course",
  totalLectures = 1,
  studentName = "",
  category = "IELTS Academic & General"
}: CourseCompletionModalProps) {
  const [viewState, setViewState] = useState<"celebration" | "requestForm" | "certificatePreview">("celebration");
  
  // Check if certificate for this course was already claimed
  const existingCertificate = React.useMemo(() => {
    if (!isOpen) return null;
    try {
      const certs = safeGetItemAndParse<any[]>("student_certificates", []);
      if (!Array.isArray(certs)) return null;
      return certs.find(
        c => (courseId && c.courseId === courseId) ||
             (c.courseTitle && courseTitle && c.courseTitle.toLowerCase().trim() === courseTitle.toLowerCase().trim()) ||
             (c.courseTitle && courseTitle && (
                c.courseTitle.toLowerCase().includes(courseTitle.toLowerCase()) || 
                courseTitle.toLowerCase().includes(c.courseTitle.toLowerCase())
             )) ||
             (courseId === "ielts-prep" && c.courseTitle && c.courseTitle.toLowerCase().includes("ielts")) ||
             (courseId === "basic-english" && c.courseTitle && c.courseTitle.toLowerCase().includes("basic")) ||
             (courseId === "spoken-english" && c.courseTitle && c.courseTitle.toLowerCase().includes("spoken"))
      ) || null;
    } catch {
      return null;
    }
  }, [isOpen, courseId, courseTitle]);

  const isAlreadyClaimed = !!existingCertificate;

  const [fullName, setFullName] = useState(() => {
    try {
      const profile = safeGetItemAndParse<any>("student_profile", {});
      return studentName || profile.full_name || profile.name || "IELTS Candidate";
    } catch {
      return studentName || "IELTS Candidate";
    }
  });
  const [targetBand, setTargetBand] = useState("Band 8.0 - 9.0 (Expert Level)");
  const [certId, setCertId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti on modal open and populate certificate data
  useEffect(() => {
    if (isOpen) {
      if (existingCertificate) {
        // Populate directly from the existing claimed certificate
        setFullName(existingCertificate.studentName || studentName || "IELTS Candidate");
        setTargetBand(existingCertificate.targetBand || "Band 8.0 - 9.0 (Expert Level)");
        setCertId(existingCertificate.id);
        setIssueDate(existingCertificate.issueDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
      } else {
        const today = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        setIssueDate(today);
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setCertId(`SEB-${Date.now().toString().slice(-4)}-${randomCode}`);
      }

      setViewState("celebration");

      // Multi-stage confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 300);
      } catch (e) {
        console.error("Confetti error", e);
      }
    }
  }, [isOpen, existingCertificate]);

  const handleGenerateCertificate = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name for the certificate");
      return;
    }
    setIsSubmitting(true);
    
    setTimeout(() => {
      // Save issued certificate to local storage for the student
      try {
        const existingCerts = safeGetItemAndParse<any[]>("student_certificates", []);
        const newCert = {
          id: certId,
          courseId,
          courseTitle,
          studentName: fullName.trim(),
          issueDate,
          targetBand,
          verificationUrl: window.location.href,
          issuedAt: new Date().toISOString()
        };
        safeSetItem("student_certificates", JSON.stringify([newCert, ...existingCerts.filter(c => c.id !== certId)]));
        
        // Dispatch event for dashboard update
        window.dispatchEvent(new CustomEvent("certificate_issued", { detail: newCert }));
      } catch (e) {}

      setIsSubmitting(false);
      setViewState("certificatePreview");
      
      // Secondary confetti
      try {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 }
        });
      } catch {}

      toast.success("Certificate Issued Successfully!", {
        description: `Your official verified certificate for "${courseTitle}" is now ready to download.`
      });
    }, 600);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/courses?cert_verify=${certId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Certificate Verification link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="course-completion-celebration-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`relative w-full ${viewState === "certificatePreview" ? "max-w-4xl" : "max-w-2xl"} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-white transition-all duration-300`}
        >
          {/* Header decorative bar */}
          <div className="h-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-800 w-full" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. CELEBRATION VIEW */}
          {viewState === "celebration" && (
            <div className="p-6 sm:p-10 flex flex-col items-center text-center space-y-6">
              
              {/* Animated Trophy Banner */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 flex items-center justify-center shadow-xl shadow-red-600/25 rotate-3 hover:rotate-0 transition-transform">
                  <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="absolute -top-2 -left-2 bg-red-800 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-900 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2 max-w-lg">
                {isAlreadyClaimed ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Certificate Already Claimed & Unlocked</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-wider border border-red-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>100% Course Completed</span>
                  </div>
                )}
                
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isAlreadyClaimed ? "Certificate Ready & Verified" : "Outstanding Achievement!"}
                </h2>
                
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAlreadyClaimed ? (
                    <>
                      Your official accredited certificate for <span className="text-red-700 dark:text-red-400 font-bold">"{courseTitle}"</span> was issued to <strong className="text-slate-900 dark:text-white font-bold">{fullName}</strong> on <span className="font-semibold text-slate-800 dark:text-slate-200">{issueDate}</span> (ID: <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400">{certId}</span>).
                    </>
                  ) : (
                    <>
                      Congratulations! You have completed all <strong className="text-slate-900 dark:text-white font-bold">{totalLectures} lectures</strong> of{" "}
                      <span className="text-red-700 dark:text-red-400 font-bold">"{courseTitle}"</span>.
                    </>
                  )}
                </p>
              </div>

              {/* Highlights & Stats Grid */}
              <div className="w-full grid grid-cols-3 gap-3 py-2">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lectures</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {totalLectures} / {totalLectures}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">All Cleared</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bonus XP</div>
                  <div className="text-lg sm:text-xl font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>+500 XP</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mastery Award</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Certificate</div>
                  <div className={`text-lg sm:text-xl font-black ${isAlreadyClaimed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'} mt-0.5`}>
                    {isAlreadyClaimed ? "Claimed" : "Ready"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isAlreadyClaimed ? "Issued & Valid" : "Accredited"}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                {isAlreadyClaimed ? (
                  <button
                    type="button"
                    id="celebration-view-claimed-cert-btn"
                    onClick={() => setViewState("certificatePreview")}
                    className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/25 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Award className="w-5 h-5 text-amber-300" />
                    <span>View Claimed Certificate</span>
                    <Check className="w-4 h-4 ml-1 text-emerald-200" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="celebration-request-certificate-btn"
                    onClick={() => setViewState("requestForm")}
                    className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-700 via-red-800 to-rose-900 hover:from-red-800 hover:to-red-950 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-red-900/25 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Award className="w-5 h-5" />
                    <span>Claim Certificate</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* 2. REQUEST CERTIFICATE FORM VIEW */}
          {viewState === "requestForm" && (
            <div className="p-6 sm:p-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${isAlreadyClaimed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-700 dark:text-red-400'} flex items-center justify-center`}>
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAlreadyClaimed ? "Certificate Already Claimed" : "Claim Official Certificate"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAlreadyClaimed 
                      ? "This certificate has already been issued. You can view or update details below." 
                      : "Verify the details below to generate your SEB's Institute Certificate of Completion."}
                  </p>
                </div>
              </div>

              {isAlreadyClaimed && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block mb-0.5">Certificate is Active & Unlocked</span>
                    Already issued to <strong className="font-bold">{fullName}</strong> for <strong>"{courseTitle}"</strong> (Verification ID: <span className="font-mono font-bold">{certId}</span>).
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Student Full Name (As printed on Certificate)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your official full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Course Completed
                    </label>
                    <input
                      type="text"
                      value={courseTitle}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm cursor-not-allowed font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Targeted Band / Level
                    </label>
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                      <option value="Band 8.0 - 9.0 (Expert Level)">Band 8.0 - 9.0 (Expert Level)</option>
                      <option value="Band 7.0 - 7.5 (Good User)">Band 7.0 - 7.5 (Good User)</option>
                      <option value="Band 6.5 - 7.0 (Competent)">Band 6.5 - 7.0 (Competent)</option>
                      <option value="Executive Fluency (C1-C2)">Executive English Fluency (C1-C2)</option>
                      <option value="CEFR A1-B1 Foundation">CEFR A1-B1 Foundation</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-xs text-red-900 dark:text-red-300">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-red-700 dark:text-red-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Authentic Verification Code:</span> Your certificate includes a verifiable ID (<span className="font-mono">{certId}</span>) signed by Founder <span className="font-bold">Syed Ejaz Bukhari</span> and linked to SEB’s accreditation records.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewState("celebration")}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Back
                </button>
                {isAlreadyClaimed && (
                  <button
                    type="button"
                    onClick={() => setViewState("certificatePreview")}
                    className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>View Certificate</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateCertificate}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-rose-900 hover:from-red-800 hover:to-red-950 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-red-900/25 active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAlreadyClaimed ? "Updating..." : "Generating..."}</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>{isAlreadyClaimed ? "Update & Re-Issue" : "Generate & Issue Certificate"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. CERTIFICATE PREVIEW & DOWNLOAD VIEW */}
          {viewState === "certificatePreview" && (
            <div className="p-4 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Official Certificate Issued
                    </h3>
                    <p className="text-[11px] text-slate-500">ID: {certId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy verification link"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Share"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Certificate Frame */}
              <div ref={certRef}>
                <OfficialAccreditedCertificate
                  certificate={{
                    id: certId,
                    courseTitle: courseTitle,
                    studentName: fullName,
                    issueDate: issueDate,
                    targetBand: targetBand,
                    category: category
                  }}
                />
              </div>

              {/* Bottom navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setViewState("requestForm")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Edit Name / Details
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
