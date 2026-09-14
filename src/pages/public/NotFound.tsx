import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  ArrowLeft, 
  Compass, 
  Phone, 
  Sparkles,
  Search,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Visual 404 Badge */}
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xl">
            <Compass className="w-12 h-12 sm:w-14 sm:h-14 animate-spin-slow" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-full border border-slate-700 shadow">
            404
          </div>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            The page or resource you are looking for might have been moved, renamed, or does not exist on the SEB's Institute portal.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Link to="/">
            <Button className="h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>

        {/* Quick Discovery Directory Cards */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-900">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            Popular Academic Portals
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Link
              to="/courses"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs mb-1">
                <BookOpen className="w-4 h-4" />
                <span>IELTS Courses</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Structured video courses & 1v1 coaching
              </p>
            </Link>

            <Link
              to="/mock-tests"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#00a8cc] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 text-[#00a8cc] font-extrabold text-xs mb-1">
                <FileText className="w-4 h-4" />
                <span>Mock Tests</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Full-length timed computer exams
              </p>
            </Link>

            <Link
              to="/contact"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs mb-1">
                <Phone className="w-4 h-4" />
                <span>Admissions</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Direct academic counseling support
              </p>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
