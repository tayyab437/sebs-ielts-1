import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Flame, 
  ShieldCheck, 
  PhoneCall,
  Download,
  BookOpen,
  Award,
  Users,
  FileText
} from 'lucide-react';
import { DEFAULT_PRICING_PLANS, pricingService, type PricingPlan } from '../../lib/pricingService';

export const IeltsEnrollmentBrochure: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Time remaining until upcoming Monday countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 10-Second High-Urgency Vibration state
  const [isVibrating, setIsVibrating] = useState(false);

  // Trigger red timer vibration every 10 seconds to create high-tension sense of urgency
  useEffect(() => {
    const vibrationInterval = setInterval(() => {
      setIsVibrating(true);
      const stopTimeout = setTimeout(() => {
        setIsVibrating(false);
      }, 900); // Vibrates intensely for 900ms every 10s
      return () => clearTimeout(stopTimeout);
    }, 10000);

    return () => clearInterval(vibrationInterval);
  }, []);

  // Calculate live time remaining until next Monday at 09:00 AM (resets dynamically every week)
  useEffect(() => {
    const calculateTimeUntilNextMonday = () => {
      const now = new Date();
      const nextMonday = new Date(now);
      const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      // Days until upcoming Monday
      let daysUntilMonday = (1 - currentDay + 7) % 7;
      
      // If today is Monday and it's already past 09:00 AM, target next week's Monday
      if (daysUntilMonday === 0 && now.getHours() >= 9) {
        daysUntilMonday = 7;
      }

      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);

      const diff = nextMonday.getTime() - now.getTime();
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeUntilNextMonday());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeUntilNextMonday());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync pricing plans dynamically from pricingService, preserving catalog order
  useEffect(() => {
    pricingService.getPlans()
      .then((loadedPlans) => {
        if (Array.isArray(loadedPlans) && loadedPlans.length >= 6) {
          // Sort by sort_order if available
          const sorted = [...loadedPlans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          setPlans(sorted);
        }
      })
      .catch(() => {});
  }, []);

  // WhatsApp enrollment link with exact default message format requested:
  // "i see your broucher about {} course in sebs website how can i get more information"
  const getEnrollWhatsAppUrl = (courseName: string) => {
    const phone = "923304541573";
    const text = `i see your broucher about ${courseName} course in sebs website how can i get more information`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const toggleExpand = (planId: string) => {
    setExpandedPlanId(prev => prev === planId ? null : planId);
  };

  const handleDownloadBrochure = (plan: PricingPlan) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${plan.name} — SEB's Institute Official Prospectus</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #0f172a; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #00a8cc; padding-bottom: 8px; margin-bottom: 4px; }
            .header-meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            .price { font-size: 24px; font-weight: bold; color: #00a8cc; margin: 12px 0; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            .batch-notice { background: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-weight: bold; color: #9f1239; }
            .cta { margin-top: 30px; padding: 20px; background: #0f172a; color: white; border-radius: 8px; }
            a { color: #38bdf8; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>SEB's Institute — Official Course Brochure</h1>
          <div class="header-meta">
            <strong>Program:</strong> ${plan.name} | <strong>Coach:</strong> Syed Ejaz Bukhari (Principal Instructor)<br/>
            <strong>Duration:</strong> ${plan.period} | <strong>Helpline:</strong> +92 330 4541573 | <strong>Website:</strong> sebsinstitute.com
          </div>
          <div class="batch-notice">
            ⏰ Next Batch Starts This Monday! Daily morning & evening live interactive sessions.
          </div>
          <div class="price">Tuition Fee: ${plan.priceDisplay}</div>
          <p><strong>Overview:</strong> ${plan.tagline}</p>
          <hr />
          <div class="box">
            <h3>Core Curriculum Modules & Pillars</h3>
            <ul>
              ${plan.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
          ${plan.detailedCurriculum ? `
            <div class="box">
              <h3>Detailed Syllabus (${plan.detailedCurriculum.duration})</h3>
              <p><strong>Methodology:</strong> ${plan.detailedCurriculum.method}</p>
              <p><strong>Target Candidate:</strong> ${plan.detailedCurriculum.bestFor}</p>
              <ul>
                ${plan.detailedCurriculum.mainFeatures.map(mf => `<li><strong>${mf.title}:</strong> ${mf.text}</li>`).join('')}
              </ul>
              ${plan.detailedCurriculum.outcomes ? `
                <h4>Key Student Outcomes:</h4>
                <ul>
                  ${plan.detailedCurriculum.outcomes.map(o => `<li>${o}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          ` : ''}
          <div class="cta">
            <h3>Direct Admissions & Seat Reservation</h3>
            <p>New cohort launches every Monday. For immediate registration, contact the admissions office on WhatsApp: <a href="${getEnrollWhatsAppUrl(plan.name)}">+92 330 4541573</a></p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 400);
    }
  };

  return (
    <aside 
      aria-label="IELTS & English Courses Enrollment Brochures"
      className="w-full space-y-8 text-left"
    >
      {/* Sidebar Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-white/10 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Official Course Brochures
            </h2>
          </div>
          <p className="text-[11px] text-slate-200 leading-snug">
            All 6 courses below feature independent prospectus details, Monday cohort countdowns, and direct WhatsApp enrollment.
          </p>
        </div>
        <div className="shrink-0 bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-300 block leading-none">Catalog</span>
          <span className="text-sm font-black text-amber-300">6 Courses</span>
        </div>
      </div>

      {/* Separate Brochure for Each of All 6 Courses Displayed One After Another */}
      <div className="space-y-8">
        {plans.map((plan, index) => {
          const isExpanded = expandedPlanId === plan.id;
          const whatsAppUrl = getEnrollWhatsAppUrl(plan.name);

          const isIelts = plan.category === 'ielts-writing' || plan.name.toLowerCase().includes('ielts');
          const isSpoken = plan.category === 'spoken';

          // Assign distinct visual accents for each brochure
          const brochureCode = `BROCHURE-EBM-0${index + 1}`;

          return (
            <section 
              key={plan.id}
              aria-label={`Official Brochure for ${plan.name}`}
              className={`bg-white dark:bg-slate-900 border rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative ${
                plan.isPopular 
                  ? 'border-primary ring-2 ring-primary/30 dark:ring-primary/40' 
                  : 'border-slate-200 dark:border-white/10'
              }`}
            >
              {/* Brochure Top Official Seal Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white px-5 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-[11px]">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-widest text-primary block leading-none">
                      SEB's Official Course Brochure
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {brochureCode} • {plan.period}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {plan.isPopular && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 fill-current" /> Top Pick
                    </span>
                  )}
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isIelts 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isIelts ? 'IELTS Track' : isSpoken ? 'Spoken English' : 'Diploma'}
                  </span>
                </div>
              </div>

              {/* Main Brochure Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Course Title */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                {/* Tuition Fee & Duration Pill */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                      Tuition & Enrollment
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block mt-0.5">
                      {plan.priceDisplay}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> EBM Certified
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium mt-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* What You Will Master (Curriculum Points) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      What This Course Covers:
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight text-[11.5px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expandable Syllabus & Curriculum */}
                {plan.detailedCurriculum && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(plan.id)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        {isExpanded ? 'Hide Detailed Course Syllabus' : 'View Full Syllabus & Module Topics'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                            Methodology & Pedagogy
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            {plan.detailedCurriculum.method} • {plan.detailedCurriculum.bestFor}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Core Modules ({plan.detailedCurriculum.duration}):
                          </span>
                          {plan.detailedCurriculum.mainFeatures.slice(0, 6).map((mf, mfIdx) => (
                            <div key={mfIdx} className="text-[11px] leading-snug">
                              <strong className="text-slate-900 dark:text-white font-bold">{mf.title}:</strong>{' '}
                              <span className="text-slate-600 dark:text-slate-400">{mf.text}</span>
                            </div>
                          ))}
                        </div>

                        {plan.detailedCurriculum.outcomes && (
                          <div className="pt-1 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                              Target Competencies Achieved:
                            </span>
                            <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                              {plan.detailedCurriculum.outcomes.slice(0, 4).map((outc, oIdx) => (
                                <li key={oIdx}>{outc}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleDownloadBrochure(plan)}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
                          >
                            <Download className="w-3.5 h-3.5" /> Print / Save Course Brochure PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBMERGED WHITE THEME COUNTDOWN TIMER WITH RED VIBRATING ACCENTS (Vibrates every 10 seconds without layout shift) */}
                <div 
                  className={`bg-white dark:bg-slate-900/90 rounded-2xl p-4 border-2 transition-colors duration-200 space-y-3 relative overflow-hidden ${
                    isVibrating 
                      ? 'border-red-600 ring-2 ring-red-500/30 shadow-md shadow-red-500/20' 
                      : 'border-red-500/30 dark:border-red-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        isVibrating 
                          ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/30' 
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <Flame className={`w-3.5 h-3.5 shrink-0 transition-transform ${isVibrating ? 'text-amber-300 scale-110' : 'text-red-600'}`} />
                      Time Running Out!
                    </span>
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" /> 
                      Next Batch: Monday
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight font-medium">
                    Limited to 15 students per cohort for direct 1-on-1 assessment with Syed Ejaz Bukhari. Time remaining to enroll for upcoming Monday:
                  </p>

                  {/* Red Vibrating 4-Unit Urgency Countdown Timer (Horizontal micro-vibration, zero vertical displacement) */}
                  <div className={`grid grid-cols-4 gap-2 text-center pt-0.5 ${isVibrating ? 'animate-vibrate-urgent' : ''}`}>
                    <div className={`bg-white dark:bg-slate-800/90 border-2 rounded-xl p-2 transition-colors shadow-sm ${
                      isVibrating ? 'border-red-600 ring-2 ring-red-500/30' : 'border-red-500/40 dark:border-red-500/50'
                    }`}>
                      <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 font-mono tabular-nums block leading-none tracking-tight">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 block mt-1">
                        Days
                      </span>
                    </div>

                    <div className={`bg-white dark:bg-slate-800/90 border-2 rounded-xl p-2 transition-colors shadow-sm ${
                      isVibrating ? 'border-red-600 ring-2 ring-red-500/30' : 'border-red-500/40 dark:border-red-500/50'
                    }`}>
                      <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 font-mono tabular-nums block leading-none tracking-tight">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 block mt-1">
                        Hours
                      </span>
                    </div>

                    <div className={`bg-white dark:bg-slate-800/90 border-2 rounded-xl p-2 transition-colors shadow-sm ${
                      isVibrating ? 'border-red-600 ring-2 ring-red-500/30' : 'border-red-500/40 dark:border-red-500/50'
                    }`}>
                      <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 font-mono tabular-nums block leading-none tracking-tight">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 block mt-1">
                        Mins
                      </span>
                    </div>

                    <div className={`bg-white dark:bg-slate-800/90 border-2 rounded-xl p-2 transition-colors shadow-sm ${
                      isVibrating ? 'border-red-600 ring-2 ring-red-500/30' : 'border-red-500/40 dark:border-red-500/50'
                    }`}>
                      <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 font-mono tabular-nums block leading-none tracking-tight">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 block mt-1">
                        Secs
                      </span>
                    </div>
                  </div>

                  {/* Urgency status message with permanently reserved height (Zero Layout Shift) */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider pt-0.5 min-h-[18px]">
                    <span className={`inline-block w-2 h-2 rounded-full transition-colors ${isVibrating ? 'bg-red-600 animate-ping' : 'bg-red-500'}`} />
                    <span className={`transition-colors ${isVibrating ? 'text-red-600 dark:text-red-400 font-black' : 'text-slate-600 dark:text-slate-400'}`}>
                      Admissions Closing — Seats Filling Fast For Monday!
                    </span>
                  </div>
                </div>

                {/* ENROLL NOW BUTTON (Direct to WhatsApp with the exact requested message) */}
                <div className="pt-2 space-y-1.5">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer text-center no-underline hover:scale-[1.01]"
                    title={`Enroll in ${plan.name} via WhatsApp`}
                  >
                    <MessageSquare className="w-4 h-4 fill-current shrink-0" />
                    <span>Enroll Now — Starts Monday</span>
                  </a>

                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                    Pre-fills: <span className="italic">"i see your broucher about {plan.name} course in sebs website how can i get more information"</span>
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Direct Admissions Helpline Contact Footer */}
      <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <PhoneCall className="w-4 h-4 text-primary" />
          <span>Need Help Deciding Between Courses?</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Speak directly with our academic admissions advisors for free counseling and band diagnostics.
        </p>
        <a 
          href="tel:+923304541573" 
          className="inline-block font-black text-primary text-sm hover:underline mt-1"
        >
          📞 +92 330 4541573
        </a>
      </div>
    </aside>
  );
};
