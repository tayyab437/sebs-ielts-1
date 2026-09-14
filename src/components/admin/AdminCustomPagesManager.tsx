import { useState, useEffect } from "react";
import { 
  CustomPage, 
  fetchCustomPages, 
  saveCustomPage, 
  deleteCustomPage 
} from "@/src/lib/customPages";
import RichTextEditor from "@/src/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Code2, 
  Globe, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Eye, 
  Save, 
  X, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminCustomPagesManager() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Editor Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentType, setContentType] = useState<"rich_text" | "html_css">("rich_text");
  const [content, setContent] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    const data = await fetchCustomPages();
    setPages(data);
    setLoading(false);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setContentType("rich_text");
    setContent("<h2>New Page Title</h2><p>Write your custom page content here...</p>");
    setHtmlCode(`<div className="my-custom-container">
  <h1>Custom HTML Heading</h1>
  <p>Write custom HTML and style it with the CSS box below.</p>
</div>`);
    setCssCode(`.my-custom-container {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 1rem;
}`);
    setMetaTitle("");
    setMetaDescription("");
    setIsPublished(true);
    setActiveTab("edit");
    setIsEditorOpen(true);
  };

  const handleEditPage = (page: CustomPage) => {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContentType(page.content_type || "rich_text");
    setContent(page.content || "");
    setHtmlCode(page.html_code || page.content || "");
    setCssCode(page.css_code || "");
    setMetaTitle(page.meta_title || "");
    setMetaDescription(page.meta_description || "");
    setIsPublished(page.is_published);
    setActiveTab("edit");
    setIsEditorOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // Auto-generate slug if editing new page or slug matches auto format
    if (!editingId) {
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(autoSlug);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Page title is required");
      return;
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    if (!cleanSlug) {
      toast.error("Valid page URL slug is required");
      return;
    }

    const pageToSave: CustomPage = {
      id: editingId || cleanSlug,
      title: title.trim(),
      slug: cleanSlug,
      content_type: contentType,
      content: contentType === "rich_text" ? content : htmlCode,
      html_code: htmlCode,
      css_code: cssCode,
      meta_title: metaTitle.trim() || `${title.trim()} | SEB's Institute`,
      meta_description: metaDescription.trim(),
      is_published: isPublished,
      created_at: editingId ? (pages.find(p => p.id === editingId)?.created_at || new Date().toISOString()) : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = await saveCustomPage(pageToSave);
    setPages(updatedList);
    setIsEditorOpen(false);
    toast.success(`Page "${title}" saved successfully!`);
  };

  const handleDelete = async (id: string, pageTitle: string) => {
    if (confirm(`Are you sure you want to delete custom page "${pageTitle}"?`)) {
      const updatedList = await deleteCustomPage(id);
      setPages(updatedList);
      toast.success(`Deleted page "${pageTitle}"`);
    }
  };

  const handleCopyLink = (pageSlug: string) => {
    const fullUrl = `${window.location.origin}/pages/${pageSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(pageSlug);
    toast.success("Page link copied to clipboard!");
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black italic tracking-tight uppercase">Custom Pages & HTML/CSS Builder</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Create custom landing pages, policies, guidelines, and branches using Rich Text or raw HTML & CSS code.
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          className="rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Create New Page
        </Button>
      </div>

      {/* Pages List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium text-xs">
          Loading Custom Pages...
        </div>
      ) : pages.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <Globe className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Custom Pages Found</h4>
          <p className="text-xs text-slate-500">Click the button above to build your first custom page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white text-base">{p.title}</span>
                    <Badge variant={p.is_published ? "default" : "secondary"} className={`text-[10px] font-bold ${p.is_published ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"}`}>
                      {p.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    /pages/{p.slug}
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 shrink-0">
                  {p.content_type === "html_css" ? (
                    <span className="flex items-center gap-1"><Code2 className="w-3 h-3 text-purple-500" /> HTML/CSS</span>
                  ) : (
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-blue-500" /> Rich Text</span>
                  )}
                </Badge>
              </div>

              {p.meta_description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                  {p.meta_description}
                </p>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <a
                    href={`/pages/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Page
                  </a>
                  <button
                    onClick={() => handleCopyLink(p.slug)}
                    className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white ml-2"
                  >
                    {copiedSlug === p.slug ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedSlug === p.slug ? "Copied" : "Copy Link"}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleEditPage(p)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(p.id, p.title)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic tracking-tight uppercase flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              {editingId ? `Edit Custom Page: ${title}` : "Create New Custom Page"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Build custom pages using either WYSIWYG Rich Text or full custom HTML & CSS code.
            </DialogDescription>
          </DialogHeader>

          {/* Tab Navigation (Edit vs Live Preview) */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setActiveTab("edit")}
                variant={activeTab === "edit" ? "default" : "outline"}
                className="h-8 text-xs font-bold rounded-xl"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Editor Mode
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab("preview")}
                variant={activeTab === "preview" ? "default" : "outline"}
                className="h-8 text-xs font-bold rounded-xl"
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> Live Preview
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status:</Label>
              <Button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                size="sm"
                className={`h-7 text-[11px] font-bold rounded-full ${isPublished ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
              >
                {isPublished ? "Published" : "Draft"}
              </Button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-5 py-2">
              {/* Page Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Page Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="E.g., About Us or Scholarships & Fee Waiver"
                    className="rounded-xl border font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Slug / Path *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">/pages/</span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="about-us"
                      className="rounded-xl border font-mono text-xs pl-16"
                    />
                  </div>
                </div>
              </div>

              {/* Content Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Content Editor Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setContentType("rich_text")}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${contentType === "rich_text" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-300 font-bold" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"}`}
                  >
                    <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase">Rich Text Editor</div>
                      <div className="text-[10px] opacity-70 font-normal">WYSIWYG formatting, headings, lists & media</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType("html_css")}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${contentType === "html_css" ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-300 font-bold" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"}`}
                  >
                    <Code2 className="w-5 h-5 text-purple-500 shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase">HTML & CSS Code Mode</div>
                      <div className="text-[10px] opacity-70 font-normal">Raw HTML markup & custom CSS stylesheet</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Content Editors */}
              {contentType === "rich_text" ? (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Page Body Content (Rich Text)</Label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Start drafting page content..."
                    className="min-h-[250px] rounded-2xl"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4" /> HTML Code Markup
                    </Label>
                    <textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      rows={8}
                      placeholder="<div className='p-6'><h1>Hello World</h1></div>"
                      className="w-full rounded-2xl border p-3 font-mono text-xs bg-slate-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4" /> Custom CSS Stylesheet
                    </Label>
                    <textarea
                      value={cssCode}
                      onChange={(e) => setCssCode(e.target.value)}
                      rows={5}
                      placeholder=".my-custom-card { border-radius: 1rem; background: #000; }"
                      className="w-full rounded-2xl border p-3 font-mono text-xs bg-slate-950 text-indigo-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* SEO Meta Data Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-500" /> Page SEO & Meta Tags
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Meta Title</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={`${title || "Page"} | SEB's Institute`}
                      className="rounded-xl border h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Meta Description</Label>
                    <Input
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Brief summary for Google search results..."
                      className="rounded-xl border h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Live Preview Mode */
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This is a live preview of how <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">/pages/{slug || "slug"}</code> will render to website visitors.
              </div>

              {contentType === "html_css" && cssCode && (
                <style dangerouslySetInnerHTML={{ __html: cssCode }} />
              )}

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 min-h-[300px]">
                <h1 className="text-2xl font-black mb-4 uppercase italic tracking-tight">{title || "Untitled Page"}</h1>
                {contentType === "html_css" ? (
                  <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
                ) : (
                  <div 
                    className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: content }} 
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditorOpen(false)}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider"
            >
              <Save className="w-4 h-4 mr-1.5" /> Save Custom Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
