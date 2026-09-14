import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Puzzle, 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Play,
  Copy,
  Layout,
  BookOpen,
  HelpCircle,
  FileQuestion,
  ChevronRight,
  Save,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function TeacherQuizWorkshop() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    duration_minutes: 30,
    course_id: "",
    questions: [] as any[]
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setQuizzes(data || []);
      } else {
        const saved = localStorage.getItem("sebs_quizzes");
        setQuizzes(saved ? JSON.parse(saved) : [
          { id: "q-1", title: "IELTS Reading: Skimming & Scanning Patterns", description: "Practice speed reading with academic texts", duration_minutes: 20, questions_count: 10, created_at: new Date().toISOString() },
          { id: "q-2", title: "Grammar Core: Modal Verbs in Argumentation", description: "Linguistic accuracy check for Band 8.0+", duration_minutes: 15, questions_count: 15, created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!newQuiz.title.trim()) return;
    try {
      const payload = {
        ...newQuiz,
        questions_count: 0,
        created_at: new Date().toISOString(),
      };
      if (supabase) {
        const { data, error } = await supabase.from("quizzes").insert([payload]).select();
        if (error) throw error;
        setQuizzes([data[0], ...quizzes]);
      } else {
        const id = `q-${Date.now()}`;
        const updated = [{ ...payload, id }, ...quizzes];
        setQuizzes(updated);
        localStorage.setItem("sebs_quizzes", JSON.stringify(updated));
      }
      toast.success("Quiz workshop session created!");
      setIsCreating(false);
      setNewQuiz({ title: "", description: "", duration_minutes: 30, course_id: "", questions: [] });
    } catch (err) {
      toast.error("Failed to build quiz");
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Permanently delete this assessment?")) return;
    try {
      if (supabase) await supabase.from("quizzes").delete().eq("id", id);
      const updated = quizzes.filter(q => q.id !== id);
      setQuizzes(updated);
      if (!supabase) localStorage.setItem("sebs_quizzes", JSON.stringify(updated));
      toast.success("Quiz purged");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filtered = quizzes.filter(q => (q.title || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">Assessment <span className="text-amber-500">Workshop</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Design diagnostic quizzes and mock evaluations</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="rounded-xl h-12 px-6 bg-slate-900 dark:bg-amber-600 text-white font-bold uppercase tracking-wider text-[10px] border-none shadow-lg cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> Forge New Quiz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((q) => (
          <Card key={q.id} className="rounded-[2.5rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 p-8 flex flex-col justify-between hover:shadow-2xl transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-10 -mt-10" />
             <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-start">
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                   <Puzzle className="w-6 h-6" />
                 </div>
                 <div className="flex gap-2">
                   <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest py-1">{q.duration_minutes}m</Badge>
                   <Button variant="ghost" size="icon" onClick={() => deleteQuiz(q.id)} className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="w-4 h-4" /></Button>
                 </div>
               </div>
               <div>
                  <h4 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-tight">{q.title}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-2 line-clamp-2 leading-relaxed">{q.description}</p>
               </div>
               <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5"><FileQuestion className="w-3.5 h-3.5" /> {q.questions_count || 0} Questions</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Public Access</span>
               </div>
             </div>
             <div className="mt-8 relative z-10 flex gap-3">
                <Button className="flex-1 h-11 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-[9px] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                   Enter Editor <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
                <Button variant="outline" className="h-11 px-4 rounded-2xl border-slate-100 dark:border-white/5 font-black uppercase tracking-widest text-[9px] cursor-pointer">
                   <Copy className="w-3.5 h-3.5" />
                </Button>
             </div>
          </Card>
        ))}

        {filtered.length === 0 && (
           <div className="col-span-full py-24 text-center space-y-4">
              <FileQuestion className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto" />
              <h4 className="text-lg font-black uppercase italic text-slate-400 tracking-tight">Workshop Surface Empty</h4>
              <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto leading-relaxed">Design specialized diagnostic assessments to track candidate linguistic progression and IELTS band readiness.</p>
           </div>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-3xl overflow-hidden p-12 text-left">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-10">Forge New <span className="text-amber-500">Evaluation</span></h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Workshop Title</Label>
                    <Input placeholder="e.g. Grammatical Range Level 8" className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none text-sm font-bold" value={newQuiz.title} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Diagnostic Objectives</Label>
                    <textarea placeholder="Outline the linguistic goals of this assessment..." className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none text-sm font-bold resize-none focus:outline-none" value={newQuiz.description} onChange={e => setNewQuiz({...newQuiz, description: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="h-14 rounded-2xl border-slate-100 dark:border-white/5 font-black uppercase tracking-widest text-[10px] cursor-pointer">Abandon</Button>
                    <Button onClick={createQuiz} className="h-14 rounded-2xl bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-900/20 cursor-pointer">Build Workshop</Button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
