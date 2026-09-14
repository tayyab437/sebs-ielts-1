import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  ArrowUpRight,
  Monitor,
  Video,
  FileText,
  Settings,
  ChevronRight,
  TrendingUp,
  Layout,
  Send
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherCourseDesigner() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setCourses(data || []);
      } else {
        const saved = localStorage.getItem("sebs_courses");
        setCourses(saved ? JSON.parse(saved) : [
          { id: "c-1", title: "IELTS Mastery Ultimate (Academic)", status: "Active", level: "Advanced", enrolled_count: 54, created_at: new Date().toISOString() },
          { id: "c-2", title: "Spoken English Premium Accelerator", status: "Draft", level: "Beginner", enrolled_count: 0, created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter(c => (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-indigo-500/10 blur-[100px] rounded-full -mr-20" />
        <div className="relative z-10 space-y-2">
          <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase font-black tracking-widest text-[9px] px-3 py-1">Faculty Curriculum Unit</Badge>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Course <span className="text-indigo-400">Architect</span></h2>
          <p className="text-slate-400 text-xs font-semibold max-w-md mt-4 leading-relaxed">Design specialized linguistic modules, manage syllabus structures and distribute learning content to candidates.</p>
        </div>
        <Button className="relative z-10 h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs shadow-xl border-none cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> Forge New Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <Card key={c.id} className="rounded-[2.5rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 p-8 hover:shadow-2xl transition-all group">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Layout className="w-6 h-6" />
                </div>
                <Badge variant={c.status === 'Active' ? 'default' : 'secondary'} className={`text-[9px] font-black uppercase tracking-widest ${c.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500/10'}`}>{c.status}</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-tight">{c.title}</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <TrendingUp className="w-3.5 h-3.5" /> {c.level} Level
                  <span className="opacity-20">|</span>
                  <BookOpen className="w-3.5 h-3.5" /> {c.enrolled_count || 0} Enrolled
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 h-11 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-[9px] cursor-pointer">
                  Manage Syllabus
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-100 dark:border-white/5 text-slate-400 group-hover:text-indigo-500 cursor-pointer">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
