import { Award, CheckCircle2, GraduationCap, ShieldCheck, Star, Users, History, Globe2, BookOpen, Clock, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,168,204,0.15),transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a8cc]/20 border border-[#00a8cc]/40 text-[#00a8cc] text-xs font-black uppercase tracking-widest">
            <History className="w-3.5 h-3.5" />
            Serving Since 1992
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
            About <span className="text-[#00a8cc]">SEB's Institute</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Over three decades of uncompromised excellence in IELTS preparation, linguistic fluency, and international academic coaching.
          </p>
        </div>
      </section>

      {/* Main Story & Core Values */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Intro Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00a8cc]">Our Legacy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              Pioneering English Mastery &amp; IELTS Band 8.5+ Training
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Established in 1992 by master linguistics trainer <strong>Syed Ejaz Bukhari</strong>, SEB's Institute has empowered over 35,000+ candidates worldwide to conquer IELTS Academic &amp; General Training hurdles with high confidence.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our core doctrine—<em>"We Teach English, Not Pinglish"</em>—emphasizes natural acoustic cadence, stress-timed rhythm, authentic intonation, and rigorous academic writing standards aligned with Cambridge, British Council, and IDP rubrics.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00a8cc]" />
              Key Milestones
            </h3>
            <ul className="space-y-4">
              {[
                { year: "1992", text: "Founded by Syed Ejaz Bukhari as an elite English linguistics academy." },
                { year: "2005", text: "Expanded into comprehensive IELTS Band 8.5 preparation & masterclasses." },
                { year: "2018", text: "Launched full digital exam simulators and split-screen mock testing suites." },
                { year: "2026", text: "Empowering global candidates across 45+ countries with AI evaluation." }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs">
                  <span className="font-mono font-black text-[#00a8cc] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                    {item.year}
                  </span>
                  <span className="text-slate-600 font-medium leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4 Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <GraduationCap className="w-6 h-6 text-[#00a8cc]" />,
              title: "35,000+ Scholars",
              desc: "Successfully trained and mentored for overseas higher education and immigration."
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
              title: "Band 8.5 Standard",
              desc: "Structured rubrics targeting Band 7.5 to 8.5+ in Listening, Reading, Writing, & Speaking."
            },
            {
              icon: <Clock className="w-6 h-6 text-amber-500" />,
              title: "30+ Years Trust",
              desc: "Continuous service since 1992 with deep pedagogical authority and verified outcomes."
            },
            {
              icon: <Globe2 className="w-6 h-6 text-indigo-500" />,
              title: "Global Reach",
              desc: "Scholars learning across UK, Canada, Australia, UAE, Saudi Arabia, and Pakistan."
            }
          ].map((pillar, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {pillar.icon}
              </div>
              <h4 className="text-base font-bold text-slate-900">{pillar.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Footer Block */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black uppercase">
            Ready to Begin Your IELTS Preparation?
          </h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Explore our practice mock tests, video masterclasses, and diagnostic evaluation tools.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/courses"
              className="px-6 py-3 rounded-xl bg-[#00a8cc] hover:bg-[#008ba8] text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
            >
              Explore Courses
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
