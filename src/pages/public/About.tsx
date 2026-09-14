import React from "react";
import { Link } from "react-router-dom";
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Globe, 
  GraduationCap, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  Users, 
  ArrowRight,
  Clock,
  Target,
  FileCheck,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Hero Header Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Syed Ejaz Bukhari • IELTS Master Mentor</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Empowering Global Scholars with <span className="text-emerald-600 dark:text-emerald-400">Band 8.5+ Precision</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            SEB's Institute (Global Language Academy) is the leading specialized training portal for IELTS Academic, General Training, and executive spoken English fluency.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link to="/courses">
              <Button className="h-12 px-7 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                Explore All Courses <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/mock-tests">
              <Button variant="outline" className="h-12 px-7 rounded-xl font-black text-xs uppercase tracking-wider border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900">
                Take Mock Test
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Academic Values & Metrics */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {[
            { metric: "34,000+", label: "Successful Scholars", desc: "Across 48+ countries globally" },
            { metric: "Band 8.5", label: "Top IELTS Score", desc: "Achieved by our flagship students" },
            { metric: "100%", label: "Live Interactive Format", desc: "Direct coaching with master trainers" },
            { metric: "24/7", label: "AI Practice Suite", desc: "Instant writing & speaking evaluations" },
          ].map((stat, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{stat.metric}</div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">{stat.label}</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* The Director's Message */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative border border-slate-200 dark:border-slate-700 shadow-md">
                <img 
                  src="/ielts_prep_banner_1781330535098.jpg" 
                  alt="Syed Ejaz Bukhari & SEB's Institute" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
                  <div>
                    <h3 className="text-white font-extrabold text-base">Syed Ejaz Bukhari</h3>
                    <p className="text-emerald-400 text-xs font-medium">Founder & Principal Master Trainer</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Our Teaching Methodology</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                “We Teach Real English, Not Pinglish”
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                At SEB’s Institute, we discard mechanical memorization and generic templates. We teach candidates how the IELTS examiners think, how criterion-based grading is calculated across Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Every candidate is provided with granular diagnostics, active speaking drills, high-frequency academic vocabulary structures, and real-time computer-delivered simulation exams.
              </p>

              <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cambridge Certified Materials
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1-on-1 Speaking Evaluation
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Official Partner Format
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Admissions Contact Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black">Ready to Begin Your IELTS Journey?</h3>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium">Book a complimentary consultation with our academic admissions counselors today.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/contact">
              <Button className="bg-white hover:bg-slate-100 text-emerald-800 font-extrabold text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow">
                Contact Admissions
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="border-white/40 hover:bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider px-6 h-11 rounded-xl">
                View Tuition Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
