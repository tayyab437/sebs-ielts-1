import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  HelpCircle, 
  ChevronDown, 
  Plus,
  Minus,
  ShieldCheck, 
  Award, 
  Users, 
  Zap,
  Target,
  Clock,
  Coins,
  TrendingUp,
  AudioLines,
  MessageSquare,
  Send,
  X,
  GraduationCap,
  Globe,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pricingService, PricingPlan } from "@/src/lib/pricingService";

interface FAQItem {
  question: string;
  answer: string;
}

interface SuccessStory {
  name: string;
  country: string;
  initialScore: number;
  finalScore: number;
  planUsed: string;
  quote: string;
  image: string;
  targetUniversity: string;
}

const successStories: SuccessStory[] = [
  {
    name: "Amara Okeke",
    country: "Nigeria",
    initialScore: 5.5,
    finalScore: 7.5,
    planUsed: "Pro Premium",
    targetUniversity: "University of Toronto",
    quote: "The speech evaluation tool was a complete game-changer. Correcting my diphthongs and word pronunciation stress at 2 AM with instant AI analysis got me a 7.5 in Speaking!",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80"
  },
  {
    name: "Wei Zhang",
    country: "China",
    initialScore: 6.0,
    finalScore: 8.0,
    planUsed: "Mastery Ultimate",
    targetUniversity: "Oxford University",
    quote: "The combination of the unlimited writing grader AI with 1-on-1 certified live expert mock sessions was incredibly effective. Bypassed my score plateau in 6 weeks.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80"
  },
  {
    name: "Sophia Martinez",
    country: "Mexico",
    initialScore: 5.0,
    finalScore: 7.0,
    planUsed: "Pro Premium",
    targetUniversity: "University of Melbourne",
    quote: "I struggled heavily with Cohesion and Task Achievement in Writing Task 2. The structural analyzer pointed out repeated vocab gaps and grammar flaws. Recommended!",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80"
  }
];

export const getWhatsAppEnrollmentLink = (planName: string, priceDisplay: string) => {
  const phone = "923304541573";
  const text = `Hello SEBS Institute! I would like to enroll in the "${planName}" course (${priceDisplay}). Please provide course schedules and guide me on the enrollment process.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

export default function PricingPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | "spoken" | "ielts-writing">("all");
  const [currentScore, setCurrentScore] = useState<number>(5.5);
  const [targetScore, setTargetScore] = useState<number>(7.5);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Dynamic Pricing plans from database / localStorage
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    async function loadPricingPlans() {
      setIsLoadingPlans(true);
      try {
        const loadedPlans = await pricingService.getPlans();
        setPlans(loadedPlans);
      } catch (err) {
        console.error("Pricing: Error retrieving plans", err);
      } finally {
        setIsLoadingPlans(false);
      }
    }

    loadPricingPlans();

    // Re-trigger if customized/saved inside AdminDashboard
    const handleSync = () => {
      loadPricingPlans();
    };
    window.addEventListener("storage_pricing_updated", handleSync);
    return () => {
      window.removeEventListener("storage_pricing_updated", handleSync);
    };
  }, []);

  // Track currently selected course plan for the detailed curriculum modal
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);

  // Floating Sales/Support Form state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("Pro Premium Plan Question");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportEmail || !supportMessage) return;
    
    setIsSubmittingSupport(true);
    setTimeout(() => {
      setIsSubmittingSupport(false);
      setSupportSubmitted(true);
    }, 1200);
  };

  const handleCloseSupport = () => {
    setIsSupportOpen(false);
    // Reset form after a small delay to avoid flicker
    setTimeout(() => {
      setSupportName("");
      setSupportEmail("");
      setSupportSubject("Pro Premium Plan Question");
      setSupportMessage("");
      setSupportSubmitted(false);
    }, 300);
  };

  const faqs: FAQItem[] = [
    {
      question: "How accurate is the SEBS Institute AI marking engine?",
      answer: "Our specialized evaluation models are trained on tens of thousands of official, hand-graded IELTS exam papers. The AI matches official grading criteria (Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range) with a typical accuracy variance of under 0.5 band score points relative to native human examiners."
    },
    {
      question: "Can I upgrade, downgrade or cancel my plan anytime?",
      answer: "Yes, absolutely! All subscriptions can be modified or canceled anytime directly from your student dashboard settings. If you cancel, you will maintain complete premium privileges until the end of your current active billing cycle."
    },
    {
      question: "How do the 1-on-1 live zoom tutoring practice sessions work?",
      answer: "In the Mastery Ultimate tier, you will receive tutor credits monthly. You can book fully customized 20-minute live speaking mock tests with our certified IELTS experts anytime using our calendar scheduler. You'll receive real-time, comprehensive feedback matching official speaking test formats."
    },
    {
      question: "Do you offer a money-back guarantee?",
      answer: "Yes. We offer a 7-day no-questions-asked money-back guarantee. If you are not fully satisfied with our AI-driven study resources, simply write to our support team within 7 days of your purchase, and we will initiate a complete refund."
    },
    {
      question: "What languages does the Voice analysis and speech recognition support?",
      answer: "The courses, transcribing feeds, and speaking evaluation engines are specifically optimized for English pronunciation correction, supporting a wide spectrum of international student accents."
    }
  ];

  // Dynamic band score prep estimator calculation
  const bandDifference = Math.max(0, targetScore - currentScore);
  const estimatedWeeksRequired = Math.ceil(bandDifference * 8); // Roughly 8 weeks per 1.0 band score improvement
  const recommendedPlan = bandDifference > 1.5 ? "4 Weeks IELTS Prep" : bandDifference > 0 ? "1 Month Writing Focus" : "Free Trial";

  // Difficulty gap and cost analysis calculations
  const difficultyGapText = 
    bandDifference === 0 ? "Target Achieved" :
    bandDifference <= 0.5 ? "Low Difficulty Gap (0.5 Bands)" :
    bandDifference <= 1.0 ? "Moderate Difficulty Gap (1.0 Bands)" :
    bandDifference <= 2.0 ? "Significant Difficulty Gap (1.5 - 2.0 Bands)" :
    "High Intensity Expert Gap (2.5+ Bands)";

  const difficultyGapBadgeColor = 
    bandDifference === 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
    bandDifference <= 1.0 ? "bg-sky-500/10 text-sky-600" :
    "bg-rose-500/10 text-rose-600 dark:text-rose-400";

  // Average physical IELTS test costs PKR 55,000. Underprepared students take it on average multiple times.
  const physicalRetakesNeeded = bandDifference === 0 ? 0 : Math.max(1, Math.ceil(bandDifference / 0.5));
  const traditionalCost = physicalRetakesNeeded * 55000;

  // Smart prep estimated cost calculation using standard PKR courses
  const pkrsRate = recommendedPlan === "4 Weeks IELTS Prep" ? 44000 :
                   recommendedPlan === "1 Month Writing Focus" ? 35000 : 0;
  const durationMonths = Math.max(1, Math.ceil(estimatedWeeksRequired / 4));
  const smartPrepCost = pkrsRate;
  const costSavings = Math.max(0, traditionalCost - smartPrepCost);

  // Framer motion stagering constants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="pricing-page-main-content bg-slate-50 dark:bg-slate-950 min-h-screen pt-10 pb-20">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1600px] h-[500px] pointer-events-none overflow-hidden opacity-30 select-none">
        <div className="absolute top-12 left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-24 right-10 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge className="bg-primary/15 text-primary text-xs font-black uppercase tracking-wider px-3 py-1 border-none rounded-full">
            Pricing Plans & Estimator
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Invest in your future. <br className="hidden sm:inline" />
            Achieve your <span className="text-primary underline decoration-primary/20 underline-offset-8">target Band Score</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Choose a plan tailored to your timeline. Unlock unlimited AI essay marking, speech analysis, and real simulated interactive mock tests.
          </p>

          {/* Course Category Switcher Toggle */}
          <div className="pt-6 flex justify-center">
            <div className="bg-slate-205/60 dark:bg-slate-900/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-250 dark:border-white/5 shadow-sm">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeCategory === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-900/5"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                All Programs
              </button>
              <button
                onClick={() => setActiveCategory("ielts-writing")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeCategory === "ielts-writing"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-900/5"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                IELTS & Writing Focus
              </button>
              <button
                onClick={() => setActiveCategory("spoken")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeCategory === "spoken"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-900/5"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Spoken English
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Pricing Cards Grid */}
        {isLoadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-24 justify-center">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex h-96 p-8 border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 rounded-[2rem] flex-col justify-between animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-slate-250 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-250 dark:bg-slate-800 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-250 dark:bg-slate-800 rounded w-5/6"></div>
                  <div className="h-10 bg-slate-250 dark:bg-slate-800 rounded w-1/2 pt-4"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-250 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-250 dark:bg-slate-800 rounded w-5/6"></div>
                  <div className="h-10 bg-slate-250 dark:bg-slate-800 rounded w-full rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="pricing-card-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-24 justify-center"
          >
            {plans
              .filter((plan) => activeCategory === "all" || plan.category === activeCategory)
              .map((plan, index) => {
                return (
                  <motion.div
                    key={plan.name}
                    variants={cardVariants}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -8,
                      boxShadow: "0 25px 50px -12px rgb(99 102 241 / 0.12)"
                    }}
                    className="flex h-full"
                  >
                    <Card 
                      className={`relative flex flex-col justify-between overflow-hidden rounded-[2rem] border w-full bg-white dark:bg-slate-900/50 ${plan.accent}`}
                    >
                    {plan.isPopular && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase tracking-widest font-black px-6 py-1.5 rounded-bl-[1.25rem] shadow-sm flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" /> Most Popular
                      </div>
                    )}

                    <CardHeader className="p-8 pb-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-primary/80 dark:text-primary/95 tracking-widest block">
                          {plan.category === "spoken" ? "Spoken English Series" : "IELTS & Writing Series"}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                          {plan.name}
                          {plan.isPopular && <Sparkles className="w-4 h-4 text-purple-500" />}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{plan.tagline}</p>
                      </div>

                      <div className="pt-6 pb-2 flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {plan.priceDisplay}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/{plan.period}</span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed pt-2">
                        {plan.description}
                      </p>
                    </CardHeader>

                    <CardContent className="p-8 pt-0 flex-grow flex flex-col justify-between">
                      <div className="border-t border-slate-100 dark:border-white/5 my-6 pt-6 space-y-4">
                        {plan.detailedCurriculum?.outcomes && plan.detailedCurriculum.outcomes.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-widest leading-none flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5" /> Key Learning Outcomes:
                            </p>
                            <ul className="space-y-2.5">
                              {plan.detailedCurriculum.outcomes.slice(0, 4).map((outcome, oIdx) => (
                                <li key={oIdx} className="flex items-start gap-2">
                                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-0.5 rounded shrink-0 mt-0.5">
                                    <Sparkles className="w-3 h-3" />
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                                    {outcome}
                                  </span>
                                </li>
                              ))}
                              {plan.detailedCurriculum.outcomes.length > 4 && (
                                <li className="text-[10px] font-bold text-slate-400 dark:text-slate-500 pl-5 list-none italic">
                                  + {plan.detailedCurriculum.outcomes.length - 4} more outcomes in curriculum profile
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 block tracking-widest leading-none">
                              Course inclusions:
                            </p>
                            <ul className="space-y-3.5">
                              {plan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2.5">
                                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-0.5 rounded-md shrink-0 mt-0.5">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <button 
                          onClick={() => setSelectedPlanForModal(plan)}
                          className={`w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent shadow ${
                            plan.isPopular 
                              ? "bg-primary hover:bg-primary/95 text-white shadow-primary/10" 
                              : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950"
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" /> View Full Curriculum
                        </button>
                        
                        <a 
                          href={getWhatsAppEnrollmentLink(plan.name, plan.priceDisplay)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full block"
                        >
                          <Button 
                            className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" /> Quick WhatsApp Enroll
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}


        {/* Dynamic Interactive Band Improvement & Cost-Effectiveness Calculator */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 mb-24 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Input fields panel */}
            <div className="lg:col-span-7 space-y-6">
              <Badge className="bg-primary/10 text-primary border-none select-none font-black text-[10px] tracking-widest py-1 uppercase">
                Band Improvement Calculator
              </Badge>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Calculate Your Target Roadmap & Savings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Bridge your IELTS prep difficulty gap. Based on typical student retake patterns, see how our customized AI curriculum delivers results at a fraction of traditional retry fees.
                </p>
              </div>

              {/* Sliders selectors */}
              <div className="space-y-8 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">My Current Mock Test Band:</span>
                    <span className="text-primary font-black bg-primary/10 px-2.5 py-1 rounded-lg">Band {currentScore.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="4.5"
                    max="9.0"
                    step="0.5"
                    value={currentScore}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentScore(val);
                      if (val > targetScore) setTargetScore(val);
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>4.5 (Intermediate)</span>
                    <span>6.5 (Competent)</span>
                    <span>8.5 (Very Good)</span>
                    <span>9.0 (Expert)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Target Band Desired:</span>
                    <span className="text-emerald-500 font-black bg-emerald-500/10 px-2.5 py-1 rounded-lg">Band {targetScore.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(4.5, currentScore)}
                    max="9.0"
                    step="0.5"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Target Goal must be ≥ Current score</span>
                    <span>9.0 (Perfect Score)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations results panel */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-[2rem] border border-slate-150 dark:border-white/5 space-y-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 italic">
                <Target className="w-4 h-4 text-primary animate-pulse" /> Diagnostic & Savings Report
              </span>

              {bandDifference === 0 ? (
                <div className="space-y-3 text-center py-6">
                  <Award className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="text-sm font-black text-slate-900 dark:text-white">Your Target is Already Achieved!</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Maintain your level through periodic simulated practice examinations inside our <b>academic preparation materials</b>.
                  </p>
                  <Link to="/courses">
                    <Button className="w-full mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl h-10 font-bold text-xs uppercase tracking-wider">
                      Explore Free Lessons
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Difficulty Gap</p>
                      <p className="text-xl font-black text-primary mt-1.5 leading-none">+{bandDifference.toFixed(1)} Band</p>
                      <span className="text-[8px] text-slate-400 font-semibold italic block mt-1">{difficultyGapText}</span>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Est. Smart Path</p>
                      <p className="text-xl font-black text-emerald-500 mt-1.5 leading-none">{estimatedWeeksRequired} Weeks</p>
                      <span className="text-[8px] text-slate-400 font-semibold block mt-1">({durationMonths} Months)</span>
                    </div>
                  </div>

                  {/* High Fidelity Cost Comparison details */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 space-y-3.5 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" /> Cost-Effectiveness Comparison
                    </p>
                    
                    <div className="space-y-2 text-xs font-semibold text-slate-650 dark:text-slate-350">
                      <div className="flex justify-between items-center">
                        <span>Traditional retake cycles ({physicalRetakesNeeded} attempts):</span>
                        <span className="text-red-500 tracking-tight font-black">PKR {traditionalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Smart {recommendedPlan} prep fee:</span>
                        <span className="text-emerald-500 tracking-tight font-black">PKR {smartPrepCost.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Money Saved:</span>
                      <span className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg font-black flex items-center gap-1 shadow-sm">
                        <TrendingUp className="w-3 h-3" /> Save PKR {costSavings.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Package details */}
                  <div className="space-y-1.5 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Highly Recommended Plan</p>
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-current text-indigo-500" /> {recommendedPlan}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic font-semibold leading-relaxed">
                      {recommendedPlan === "4 Weeks IELTS Prep" 
                        ? "Since you seek a large score leap, live mock trials and feedback from real human mentors are highly advised to smooth lexical errors." 
                        : "Your target score is highly realistic. Continuous writing checks and instant automated guidance inside our Writing Focus cohort will get you across the finish line."}
                    </p>
                  </div>

                  <a 
                    href={getWhatsAppEnrollmentLink(
                      recommendedPlan,
                      recommendedPlan === "4 Weeks IELTS Prep" ? "PKR 44,000" : "PKR 35,000"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-150 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider h-11 rounded-xl shadow-md">
                      Claim Your Cost-Effective Plan
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Success Stories Section */}
        <section className="mb-24">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-3.5 py-1 text-[10px] tracking-widest uppercase font-black">
              Alumni Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Real Students. Premium Results.
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Discover how IELTS aspirants worldwide leveraged our targeted AI test feedback and certification courses to exceed their university entry benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, sIdx) => (
              <motion.div
                key={sIdx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: sIdx * 0.15 }}
                whileHover={{ 
                  scale: 1.03, 
                  y: -6,
                  boxShadow: "0 20px 40px -15px rgb(16 185 129 / 0.1)"
                }}
                className="bg-white dark:bg-slate-900/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden shadow-sm hover:border-emerald-500/20 dark:hover:border-emerald-500/10 group transition-all duration-300"
              >
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

                <div className="space-y-4">
                  {/* Student description head */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={story.image} 
                        alt={story.name} 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 p-0.5 group-hover:border-emerald-500/80 transition-colors shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-950 p-1 rounded-full shadow-md text-xs">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{story.name}</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-450 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span>{story.country}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-350" />
                        <span className="text-primary font-black">{story.planUsed}</span>
                      </p>
                    </div>
                  </div>

                  {/* Band increase showcase */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Band score jump</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-slate-500 line-through dark:text-slate-400">Band {story.initialScore}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-black text-emerald-650 dark:text-emerald-400">Band {story.finalScore}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-500 text-white rounded-xl px-2.5 py-1.5 text-center shrink-0">
                      <p className="text-[9px] font-black leading-none">+{story.finalScore - story.initialScore} Band</p>
                    </div>
                  </div>

                  {/* Student quote feedback */}
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic leading-relaxed pt-2">
                    "{story.quote}"
                  </p>
                </div>

                {/* Target University milestone */}
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 mt-5 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wide leading-none">
                    Targeted: {story.targetUniversity}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Guarantee Banner Badge */}
        <section className="bg-gradient-to-r from-slate-900 via-primary to-indigo-950 p-[1px] rounded-[2.5rem] mb-24 shadow-lg shadow-indigo-550/10">
          <div className="bg-slate-950 dark:bg-slate-950 rounded-[2.5rem] p-8 md:p-12 text-center text-white space-y-6">
            <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" style={{ animationDuration: '3s' }} />
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Our 100% Score Success Guarantee</h2>
            <p className="text-xs md:text-sm text-slate-350 max-w-2xl mx-auto font-medium leading-relaxed">
              We stand fully behind our preparation courses, writing graders, speech evaluation software, and teachers. If you diligently stick to your customized smart study plan and fail to improve your overall IELTS band score, we will issue a <span className="bg-white/10 text-emerald-300 font-black px-1.5 py-0.5 rounded">100% complete refund</span> with zero tedious questions.
            </p>
          </div>
        </section>


        {/* FAQs list elements - Collapsed by default with smooth Accordion transition */}
        <section className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" /> Frequently Asked Questions
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold italic">Got questions regarding the academic or general training packages? We have answered everything below.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="faq-item-container bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all shadow-sm hover:border-slate-300/60 dark:hover:border-white/10 cursor-pointer"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <button
                    className="w-full flex items-center justify-between text-left gap-4 font-black text-xs md:text-sm text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <span>{faq.question}</span>
                    <span className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-450 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-4">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Floating Action Button for Sales / Support Inquiries */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.a
          href={`https://wa.me/923304541573?text=${encodeURIComponent("Hello SEBS Institute! I need assistance regarding your courses and admission details. Please guide me.")}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary hover:bg-primary/95 text-white pl-4 pr-5 py-3.5 rounded-full shadow-lg shadow-primary/20 flex items-center gap-2 font-black text-xs uppercase tracking-wider cursor-pointer outline-none transition-all inline-flex"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <MessageSquare className="w-4 h-4" />
          <span>Chat with Support</span>
        </motion.a>
      </div>

      {/* Floating Support Form Dialog Overlay */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSupport}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-lg p-6 md:p-8 relative shadow-2xl overflow-hidden z-10"
            >
              {/* Cover Glow badge */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="space-y-1">
                  <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black tracking-widest uppercase">
                    Support Desk
                  </Badge>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
                    Pre-Sales & Academic Advisory
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Have questions about the plans, course curriculum or customized training? Leave a ticket and our tutors will reach out in <span className="text-primary font-black">15 minutes</span>.
                  </p>
                </div>
                <button
                  onClick={handleCloseSupport}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <AnimatePresence mode="wait">
                {supportSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="w-16 h-16 bg-emerald-550/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                      <Check className="w-8 h-8" />
                    </div>

                    <div className="space-y-1 max-w-xs mx-auto">
                      <p className="text-sm font-black text-slate-900 dark:text-white">Ticket Filed Successfully!</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Thank you for your message. One of our senior certified IELTS instructors will email you shortly at <span className="text-primary font-black italic">{supportEmail}</span>.
                      </p>
                    </div>

                    <Button 
                      onClick={handleCloseSupport}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase px-6 h-10 rounded-xl"
                    >
                      Done, Thank you
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSupportSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 text-xs font-semibold"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-705 dark:text-slate-300">My Name</label>
                        <input
                          type="text"
                          required
                          value={supportName}
                          onChange={(e) => setSupportName(e.target.value)}
                          placeholder="Elizabeth Proctor"
                          className="w-full h-10 px-3 rounded-xl border border-slate-205 dark:border-white/15 bg-slate-50 dark:bg-slate-950 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-colors text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-705 dark:text-slate-300">My Email Address</label>
                        <input
                          type="email"
                          required
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          placeholder="elizabeth@example.com"
                          className="w-full h-10 px-3 rounded-xl border border-slate-205 dark:border-white/15 bg-slate-50 dark:bg-slate-950 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-colors text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-705 dark:text-slate-300">Subject of Sales Inquiry</label>
                      <select
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-205 dark:border-white/15 bg-slate-50 dark:bg-slate-950 dark:text-white outline-none focus:border-primary transition-colors text-xs font-medium"
                      >
                        <option value="Pro Premium Plan Question">Questions regarding Pro Premium (AI checkoffs)</option>
                        <option value="Mastery Ultimate live Zoom sessions">Mastery Ultimate package (1-on-1 tutoring)</option>
                        <option value="School & Class special discounts">Academic organization / School-wide discounts</option>
                        <option value="Billing & Support Assistance">Billing issues / Payment options</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-705 dark:text-slate-300">Message Details</label>
                      <textarea
                        required
                        rows={4}
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Hi! I am targeting University of Toronto but stuck at Speaking Band 6.0. Does this package guarantee a full refund if my score doesn't rise to 7.0?..."
                        className="w-full p-3 rounded-xl border border-slate-205 dark:border-white/15 bg-slate-50 dark:bg-slate-950 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-colors text-xs font-medium resize-none leading-relaxed animate-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingSupport}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-black text-xs uppercase tracking-widest h-11 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/10"
                    >
                      {isSubmittingSupport ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Establishing Connection...
                        </span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Submit Sales Inquiry
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Course Curriculum Modal */}
      <AnimatePresence>
        {selectedPlanForModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            
            {/* Dark glass backdrop layout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlanForModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-3xl p-6 md:p-9 relative shadow-2xl overflow-hidden z-10 max-h-[85vh] overflow-y-auto"
            >
              {/* Corner ambient glow decoration */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button Trigger */}
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Core Contents */}
              <div className="space-y-6">
                <div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] uppercase tracking-widest font-black py-1 px-3 mb-2 rounded-full">
                    Official Course Profile
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                    {selectedPlanForModal.name}
                    {selectedPlanForModal.isPopular && <Flame className="w-5 h-5 text-primary fill-current" />}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    {selectedPlanForModal.tagline}
                  </p>
                </div>

                {/* Sub Metadata Strip Information Box */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-primary" /> Duration
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-205">
                      {selectedPlanForModal.detailedCurriculum?.duration || selectedPlanForModal.period}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-purple-500" /> Syllabus
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-205">
                      {selectedPlanForModal.detailedCurriculum?.method || "Custom"}
                    </p>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5">
                      <Coins className="w-3 h-3 text-emerald-500" /> Cost
                    </span>
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedPlanForModal.priceDisplay} <span className="text-[10px] text-slate-400 font-normal">({selectedPlanForModal.period})</span>
                    </p>
                  </div>
                </div>

                {/* Focus / Ideal For Box */}
                <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Course Focus:</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedPlanForModal.detailedCurriculum?.focus}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Best For:</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedPlanForModal.detailedCurriculum?.bestFor}
                    </p>
                  </div>
                </div>

                {/* Features & Course Layout List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" /> Core Program Curriculum ({selectedPlanForModal.detailedCurriculum?.mainFeatures?.length || 0} Modules)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {selectedPlanForModal.detailedCurriculum?.mainFeatures?.map((f: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 hover:border-emerald-500/20 dark:hover:border-emerald-500/10 transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
                            {f.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed pl-6">
                          {f.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Outcomes Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> Target Program Learning Outcomes
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-emerald-500/[0.02] dark:bg-emerald-555/[0.01] border border-emerald-550/10 rounded-2xl p-4">
                    {selectedPlanForModal.detailedCurriculum?.outcomes?.map((outcome: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-0.5 rounded-md shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="leading-tight">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action Bar inside Modal */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Instant registration available via WhatsApp</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Secure seat & claim PKR cash rate bonus</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto shrink-0">
                    <button 
                      onClick={() => setSelectedPlanForModal(null)}
                      className="px-4 h-11 rounded-xl text-xs font-extrabold text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-200 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 sm:w-auto w-1/3 cursor-pointer"
                    >
                      Close Profile
                    </button>
                    <a 
                      href={getWhatsAppEnrollmentLink(selectedPlanForModal.name, selectedPlanForModal.priceDisplay)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sm:w-auto w-2/3"
                    >
                      <Button 
                        className="w-full sm:px-6 h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all leading-none"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" /> Register via WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
