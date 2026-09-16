import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Globe, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    targetBand: "7.5",
    programInterest: "IELTS Preparation",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in your name and email.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Admissions Query Submitted!", {
        description: "An academic counselor from SEB's Institute will contact you via WhatsApp and Email within 12 business hours."
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        targetBand: "7.5",
        programInterest: "IELTS Preparation",
        message: ""
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Header Banner */}
      <section className="relative py-14 lg:py-20 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" />
            <span>Admissions & Student Advisory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Get in Touch with <span className="text-emerald-600 dark:text-emerald-400">SEB's Institute</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Have questions regarding upcoming batches, mock test plans, 1-on-1 speaking evaluations, or customized study roadmaps? Speak directly with our team.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Direct Contacts */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Direct Channels
              </h2>

              <div className="space-y-4">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/923176369458"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100/70 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">WhatsApp Admissions</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">+92 317 6369458</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Instant response for batch schedules</p>
                  </div>
                </a>

                {/* Direct Query Phone */}
                <a
                  href="tel:+923176369458"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Direct Helpline</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">+92 317 6369458</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mon – Sat: 9:00 AM – 9:00 PM PKT</p>
                  </div>
                </a>

                {/* Campus Address & Location */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Academic Campus Address</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      Executive Sector F-8/3, Blue Area Academic Zone
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Islamabad 44000, Pakistan</p>
                  </div>
                </div>

                {/* Campus Details */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Global Virtual Campus</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Online Digital Portal</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live Interactive Video Classrooms 24/7</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted & confidential student inquiries</span>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">Quick Academic Links</h3>
              <ul className="space-y-2 text-xs font-bold text-slate-300">
                <li>
                  <Link to="/courses" className="hover:text-emerald-400 flex items-center justify-between">
                    <span>Browse All Active Batches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
                <li>
                  <Link to="/mock-tests" className="hover:text-emerald-400 flex items-center justify-between">
                    <span>Take Diagnostic Mock Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-emerald-400 flex items-center justify-between">
                    <span>View Tuition & Packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Admission Query Form */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Submit Academic Query
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fill in your academic profile below to receive customized recommendations.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali Raza"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Target Band Score
                    </label>
                    <select
                      value={formData.targetBand}
                      onChange={(e) => setFormData({ ...formData, targetBand: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="6.5">Band 6.5</option>
                      <option value="7.0">Band 7.0</option>
                      <option value="7.5">Band 7.5</option>
                      <option value="8.0">Band 8.0</option>
                      <option value="8.5">Band 8.5+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Course / Program of Interest
                  </label>
                  <select
                    value={formData.programInterest}
                    onChange={(e) => setFormData({ ...formData, programInterest: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="IELTS Preparation">IELTS Preparation (Academic & General)</option>
                    <option value="Spoken English Mastery">Spoken English & Pronunciation Fluency</option>
                    <option value="Writing Skills Masterclass">Writing Skills & Task Evaluation</option>
                    <option value="PTE Masterclass">PTE Academic Masterclass</option>
                    <option value="Mock Test Package">Computer-Delivered Mock Test Suite</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Message / Current Level Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your previous IELTS attempts, exam timeline, or specific target areas..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
                  {isSubmitting ? "Submitting Inquiry..." : "Submit Admissions Request"}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
