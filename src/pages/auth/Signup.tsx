import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { GraduationCap, ArrowRight, Github, Mail, CheckCircle2, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchSiteSettings, sanitizeAssetUrl, defaultSettings } from "../../lib/settings";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("student"); // "student" or "teacher"
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [logoUrl, setLogoUrl] = useState(() => sanitizeAssetUrl(localStorage.getItem("site_logo_url"), defaultSettings.site_logo_url));
  const [logoAlt, setLogoAlt] = useState(() => localStorage.getItem("site_logo_alt") || defaultSettings.site_logo_alt);

  useEffect(() => {
    // Fetch global settings
    fetchSiteSettings().then(settings => {
      if (settings.site_logo_url) setLogoUrl(settings.site_logo_url);
      if (settings.site_logo_alt) setLogoAlt(settings.site_logo_alt);
    }).catch(err => {
      console.warn("Could not fetch global settings on Signup Page:", err);
    });

    const syncLogo = () => {
      setLogoUrl(sanitizeAssetUrl(localStorage.getItem("site_logo_url"), defaultSettings.site_logo_url));
      setLogoAlt(localStorage.getItem("site_logo_alt") || defaultSettings.site_logo_alt);
    };
    window.addEventListener("storage", syncLogo);
    window.addEventListener("site_settings_updated", syncLogo);
    return () => {
      window.removeEventListener("storage", syncLogo);
      window.removeEventListener("site_settings_updated", syncLogo);
    };
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save developer settings role in localStorage as a bulletproof override reference
    localStorage.setItem("user_role", role);

    if (!supabase) {
      // High fidelity offline sandbox registration fallback
      setTimeout(() => {
        const mockProfile = {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          email: email,
          role: role,
          streak: 1,
          xp: 150,
          target_band: "8.5",
          predicted_band: "7.0",
          last_lesson: "Introduction Orientation",
          avatar_url: ""
        };
        localStorage.setItem(role === "teacher" ? "teacher_profile" : "student_profile", JSON.stringify(mockProfile));
        localStorage.setItem("mock_user_logged_in", "true");
        localStorage.setItem("mock_user_email", email);
        
        setIsLoading(false);
        toast.success("Account Created (Offline Sandbox Sandbox Mode)!", {
          description: `Registered as ${role === 'teacher' ? 'Teacher' : 'Student'} successfully!`
        });
        navigate("/dashboard");
      }, 1000);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          }
        }
      });

      if (error) throw error;
      if (data.user) {
        // Also update profiles table with our explicit role state
        try {
          await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id, 
              first_name: firstName, 
              last_name: lastName, 
              role: role,
              email: email
            });
        } catch (dbErr) {
          console.warn("Could not save explicit role in profiles table directly:", dbErr);
        }

        const params = new URLSearchParams(window.location.search);
        const planParam = params.get("plan");
        if (planParam) {
          let mappedPlan = "Free Trial";
          if (planParam === "4-weeks-ielts-prep") mappedPlan = "SEB’s IELTS General Training Course Based on EBM";
          else if (planParam === "4-weeks-ielts-academic") mappedPlan = "SEB’s IELTS Academic Course Based on EBM";
          else if (planParam === "1-month-spoken-english") mappedPlan = "1 Month Spoken English";
          else if (planParam === "1-month-writing-focus") mappedPlan = "1 Month Writing Focus";
          else if (planParam === "2-month-spoken-english") mappedPlan = "2 Month Spoken English";
          else if (planParam === "6-month-spoken-english") mappedPlan = "SEB’s 6-Month Spoken English + AI Skills Program";
          else if (planParam === "pro-premium") mappedPlan = "Pro Premium";
          else if (planParam === "mastery-ultimate") mappedPlan = "Mastery Ultimate";

          try {
            await supabase
              .from('profiles')
              .update({ plan: mappedPlan })
              .eq('id', data.user.id);
          } catch (e) {
            console.warn("Failed setting plan on initial profile creation:", e);
          }
          navigate(`/dashboard?trigger_checkout=${planParam}`);
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      let friendlyMsg = error.message || "";
      
      const isDatabaseTriggerError = friendlyMsg.toLowerCase().includes("saving new user") || 
                                     friendlyMsg.toLowerCase().includes("database error") ||
                                     friendlyMsg.toLowerCase().includes("profile") ||
                                     friendlyMsg.toLowerCase().includes("column");

      if (isDatabaseTriggerError) {
        toast.error("Supabase Database Error!", {
          description: "This is caused by a missing 'role' column on your 'profiles' table. To fix, go to your Supabase SQL Editor and run: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;",
          duration: 15000
        });
        
        // Activate Sandbox fallback so the user is completely unblocked
        console.warn("Supabase Signup failed with database trigger error, activating Sandbox fallback:", error);
        
        const mockProfile = {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          email: email,
          role: role,
          streak: 1,
          xp: 150,
          target_band: "8.5",
          predicted_band: "7.0",
          last_lesson: "Introduction Orientation",
          avatar_url: ""
        };
        localStorage.setItem(role === "teacher" ? "teacher_profile" : "student_profile", JSON.stringify(mockProfile));
        localStorage.setItem("mock_user_logged_in", "true");
        localStorage.setItem("mock_user_email", email);
        localStorage.setItem("user_role", role);
        
        toast.info("Unblocked: Entered local Sandbox mode so you can test immediately!", {
          description: `Logged in offline as ${role === 'teacher' ? 'Teacher' : 'Student'} successfully.`,
          duration: 8000
        });
        
        const params = new URLSearchParams(window.location.search);
        const planParam = params.get("plan");
        if (planParam) {
          navigate(`/dashboard?trigger_checkout=${planParam}`);
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (friendlyMsg && (friendlyMsg.includes("Failed to fetch") || friendlyMsg.toLowerCase().includes("fetch") || friendlyMsg.includes("network"))) {
        console.warn("Supabase Signup failed, activating Sandbox fallback:", error);
        
        const mockProfile = {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          email: email,
          role: role,
          streak: 1,
          xp: 150,
          target_band: "8.5",
          predicted_band: "7.0",
          last_lesson: "Introduction Orientation",
          avatar_url: ""
        };
        localStorage.setItem(role === "teacher" ? "teacher_profile" : "student_profile", JSON.stringify(mockProfile));
        localStorage.setItem("mock_user_logged_in", "true");
        localStorage.setItem("mock_user_email", email);
        localStorage.setItem("user_role", role);
        
        toast.info("Database Unreachable: Account created in local Sandbox mode!", {
          description: `Logged in offline as ${role === 'teacher' ? 'Teacher' : 'Student'} successfully.`
        });
        
        const params = new URLSearchParams(window.location.search);
        const planParam = params.get("plan");
        if (planParam) {
          navigate(`/dashboard?trigger_checkout=${planParam}`);
        } else {
          navigate("/dashboard");
        }
        return;
      }
      alert(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Brand & Social Proof */}
        <div className="hidden md:block space-y-12">
          <div>
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <img 
                src={logoUrl} 
                alt={logoAlt} 
                width={180}
                height={98}
                loading="eager"
                decoding="async"
                className="h-16 w-auto object-contain mix-blend-multiply" 
                referrerPolicy="no-referrer" 
              />
              <span className="text-3xl font-bold tracking-tight text-primary">Institute</span>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-primary leading-tight">
              Start Your Personalized <br />Roadmap to Band 8+
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Join 1M+ students who have transformed their preparation with our AI ecosystem.
            </p>
          </div>

          <div className="space-y-6">
            {[
              "Personalized Academic Study Plan",
              "Comprehensive IELTS Coaching",
              "Expert Writing & Speaking Evaluations",
              "Access to Full Mock Tests Library"
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <span className="font-medium text-primary/80 group-hover:text-primary transition-colors">{text}</span>
              </div>
            ))}
          </div>

          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative shadow-2xl shadow-primary/20 rounded-[2rem]">
            <CardContent className="p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current text-accent" />)}
              </div>
              <p className="text-lg italic font-medium leading-relaxed mb-6">
                "I improved my writing from Band 6.0 to 7.5 in just 3 weeks. The AI feedback is ridiculously accurate."
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20"></div>
                <div>
                  <div className="font-bold">Sarah Williams</div>
                  <div className="text-xs opacity-70 uppercase tracking-widest font-bold italic">Achieved Band 8.5</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/50 shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="space-y-1 pb-8 bg-muted/30 border-b border-border/50">
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Join the elite circle of IELTS achievers today.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-6 pt-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 italic">First Name</label>
                      <Input 
                        placeholder="John" 
                        className="rounded-xl h-12 border-border/50" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 italic">Last Name</label>
                      <Input 
                        placeholder="Doe" 
                        className="rounded-xl h-12 border-border/50" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 italic">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="name@example.com" 
                      className="rounded-xl h-12 border-border/50" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 italic">Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="rounded-xl h-12 border-border/50" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Account Role Selector */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 italic">I want to register as:</label>
                    <div className="grid grid-cols-2 gap-3 select-none">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                          role === "student"
                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                            : "border-border hover:border-slate-450 text-muted-foreground bg-transparent cursor-pointer"
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wide">Academic Student</span>
                        <span className="text-[9.5px] leading-tight font-semibold text-slate-400 block pb-1">Submit practices & take mock exams</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("teacher")}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                          role === "teacher"
                            ? "border-emerald-500 bg-emerald-500/5 text-emerald-650 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                            : "border-border hover:border-slate-450 text-muted-foreground bg-transparent cursor-pointer"
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wide">IELTS Instructor</span>
                        <span className="text-[9.5px] leading-tight font-semibold text-slate-400 block pb-1">Evaluate user submissions & live tutor</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col bg-muted/5 border-t border-border/50 pt-8">
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-13 rounded-xl text-md font-bold tracking-tight shadow-xl shadow-primary/20 group" 
                  size="lg"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline italic font-bold">Sign In</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
