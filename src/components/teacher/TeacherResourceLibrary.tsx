import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  ExternalLink,
  Plus,
  BookOpen,
  FolderOpen,
  Download,
  Share2
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherResourceLibrary() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [newResource, setNewResource] = useState({ title: "", type: "PDF", url: "" });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setResources(data || []);
      } else {
        const saved = localStorage.getItem("sebs_resources");
        setResources(saved ? JSON.parse(saved) : [
          { id: "res-1", title: "Band 9 Vocabulary Formulas", type: "PDF", url: "#", created_at: new Date().toISOString() },
          { id: "res-2", title: "Speaking Cue Card Master Sheet", type: "DOC", url: "#", created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title.trim()) return;
    
    try {
      const payload = {
        title: newResource.title,
        type: newResource.type,
        url: newResource.url || "#",
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data, error } = await supabase.from("resources").insert([payload]).select();
        if (error) throw error;
        setResources([data[0], ...resources]);
      } else {
        const updated = [{ ...payload, id: `res-${Date.now()}` }, ...resources];
        setResources(updated);
        localStorage.setItem("sebs_resources", JSON.stringify(updated));
      }
      toast.success("Resource added successfully!");
      setIsUploading(false);
      setNewResource({ title: "", type: "PDF", url: "" });
    } catch (err) {
      toast.error("Failed to add resource");
    }
  };

  const deleteResource = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      if (supabase) await supabase.from("resources").delete().eq("id", id);
      const updated = resources.filter(r => r.id !== id);
      setResources(updated);
      if (!supabase) localStorage.setItem("sebs_resources", JSON.stringify(updated));
      toast.success("Resource removed");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filtered = resources.filter(r => (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">Resource <span className="text-indigo-500">Repository</span></h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Manage handouts, study guides and linguistic documents</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search documents..." className="pl-9 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-xs font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button onClick={() => setIsUploading(true)} className="rounded-xl h-11 px-6 bg-slate-900 text-white dark:bg-indigo-600 font-bold uppercase tracking-wider text-[10px] shrink-0 border-none cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> Add Resource
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isUploading && (
          <Card className="rounded-[2rem] border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 p-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-xs font-black uppercase italic mb-4">New Resource Entry</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <Input placeholder="Document Title" className="h-10 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} required />
              <div className="flex gap-2">
                <select className="h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 text-[10px] font-bold flex-1" value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})}>
                  <option value="PDF">PDF Document</option>
                  <option value="DOC">Word Doc</option>
                  <option value="LINK">External Link</option>
                </select>
                <Button type="submit" className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer">Save</Button>
              </div>
              <Button type="button" onClick={() => setIsUploading(false)} variant="ghost" className="w-full text-[10px] font-bold uppercase text-rose-500">Cancel</Button>
            </form>
          </Card>
        )}

        {filtered.map((res) => (
          <Card key={res.id} className="rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between hover:shadow-xl transition-all group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${res.type === 'PDF' ? 'bg-rose-500/10 text-rose-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase">{res.type}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase italic tracking-tight text-slate-800 dark:text-white line-clamp-2 leading-none">{res.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Logged {new Date(res.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
               <Button variant="outline" className="h-9 flex-1 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-[9px] font-black uppercase flex items-center gap-2 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors cursor-pointer">
                 <Download className="w-3.5 h-3.5" /> Handout
               </Button>
               <Button onClick={() => deleteResource(res.id)} variant="ghost" size="icon" className="h-9 w-9 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Trash2 className="w-3.5 h-3.5" />
               </Button>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && !isUploading && (
           <div className="col-span-full py-20 text-center space-y-4">
              <FolderOpen className="w-12 h-12 text-slate-200 mx-auto" />
              <h4 className="text-sm font-black uppercase italic text-slate-400">Library Vault Empty</h4>
              <p className="text-[10px] font-bold text-slate-500 max-w-xs mx-auto">Upload linguistic worksheets, mock patterns, and grammar formula sheets for student distribution.</p>
           </div>
        )}
      </div>
    </div>
  );
}
