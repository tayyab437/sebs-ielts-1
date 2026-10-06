import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CustomPage, fetchCustomPageBySlug } from "@/src/lib/customPages";
import { Globe, Clock, ChevronRight, FileText, Code2, AlertCircle, Share2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CustomPageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (slug) {
      setLoading(true);
      fetchCustomPageBySlug(slug).then(foundPage => {
        if (isMounted) {
          setPage(foundPage);
          setLoading(false);
          
          if (foundPage) {
            const title = foundPage.meta_title || `${foundPage.title} | SEB's Institute`;
            const description = foundPage.meta_description || foundPage.title;
            const canonicalUrl = `https://sebsinstitute.com/pages/${foundPage.slug}`;
            const imageUrl = "https://sebsinstitute.com/ielts_prep_banner_1781330535098.jpg";

            // Update Meta Title & Description
            document.title = title;
            
            const setMeta = (attrName: "property" | "name", attrValue: string, contentValue: string) => {
              let tag = document.querySelector<HTMLMetaElement>(`meta[${attrName}='${attrValue}']`);
              if (!tag) {
                tag = document.createElement("meta");
                tag.setAttribute(attrName, attrValue);
                document.head.appendChild(tag);
              }
              tag.content = contentValue;
            };

            setMeta("name", "description", description);
            setMeta("property", "og:title", title);
            setMeta("property", "og:description", description);
            setMeta("property", "og:url", canonicalUrl);
            setMeta("property", "og:image", imageUrl);
            setMeta("property", "og:type", "website");
            setMeta("property", "og:site_name", "SEB's Institute");

            setMeta("name", "twitter:card", "summary_large_image");
            setMeta("name", "twitter:title", title);
            setMeta("name", "twitter:description", description);
            setMeta("name", "twitter:url", canonicalUrl);
            setMeta("name", "twitter:image", imageUrl);
          }
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Page link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !page) {
    return (
      <div className="min-h-[60vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-2/3" />
        <div className="space-y-4 pt-6">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!page || !page.is_published) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Page Not Found</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              The requested page <code className="text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">/{slug}</code> does not exist or has not been published yet.
            </p>
          </div>
          <Link to="/">
            <Button className="w-full rounded-2xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-left transition-colors duration-300">
      {/* Inject Custom CSS if HTML/CSS mode */}
      {page.content_type === "html_css" && page.css_code && (
        <style dangerouslySetInnerHTML={{ __html: page.css_code }} />
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-bold">{page.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-bold px-3 py-1 rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
              {page.content_type === "html_css" ? (
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> HTML / CSS Custom Page</span>
              ) : (
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Rich Text Document</span>
              )}
            </Badge>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="rounded-xl h-8 text-xs font-bold border-slate-200 dark:border-slate-800"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
              {copied ? "Copied" : "Share"}
            </Button>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase font-sans">
            {page.title}
          </h1>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Last updated: {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-500">/{page.slug}</span>
          </div>
        </div>

        {/* Page Main Content Body */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm min-h-[400px]">
          {page.content_type === "html_css" ? (
            <div 
              className="custom-html-container font-sans"
              dangerouslySetInnerHTML={{ __html: page.html_code || page.content }} 
            />
          ) : (
            <div 
              className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: page.content }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
