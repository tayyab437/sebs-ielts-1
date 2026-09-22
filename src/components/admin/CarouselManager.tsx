import React, { useState, useEffect } from "react";
import { 
  CarouselSlide, 
  defaultCarouselSlides, 
  SiteSettings, 
  saveSiteSettings,
  fetchSiteSettings 
} from "@/src/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Save, 
  RotateCcw, 
  Clock, 
  Film, 
  Image as ImageIcon, 
  ExternalLink, 
  Sliders, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Link as LinkIcon,
  Play,
  Layers,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface CarouselManagerProps {
  initialSlides?: CarouselSlide[];
  initialTimer?: number;
  onSettingsSaved?: (slides: CarouselSlide[], timer: number) => void;
}

export const CarouselManager: React.FC<CarouselManagerProps> = ({
  initialSlides,
  initialTimer = 6.5,
  onSettingsSaved
}) => {
  const [slides, setSlides] = useState<CarouselSlide[]>(() => {
    if (initialSlides && initialSlides.length > 0) return initialSlides;
    try {
      const stored = localStorage.getItem("carousel_slides");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore fallback
    }
    return defaultCarouselSlides;
  });

  const [timer, setTimer] = useState<number>(() => {
    if (initialTimer) return initialTimer;
    const stored = localStorage.getItem("carousel_timer");
    return stored ? parseFloat(stored) : 6.5;
  });

  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideDraft, setSlideDraft] = useState<CarouselSlide | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Sync with server on mount so CarouselManager has latest published database settings
  useEffect(() => {
    let isMounted = true;
    fetchSiteSettings(true).then((settings) => {
      if (!isMounted) return;
      let slidesData = settings?.carousel_slides;
      if (typeof slidesData === "string") {
        try {
          slidesData = JSON.parse(slidesData);
        } catch (e) {}
      }
      if (Array.isArray(slidesData) && slidesData.length > 0) {
        setSlides(slidesData);
      }
      if (settings?.carousel_timer) {
        setTimer(Number(settings.carousel_timer) || 6.5);
      }
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  // Centralized persistence function that syncs state, database, and fires broadcast events
  const persistChanges = async (newSlides: CarouselSlide[], newTimer: number, successMsg?: string) => {
    setIsSaving(true);
    try {
      const payload: Partial<SiteSettings> = {
        carousel_slides: newSlides,
        carousel_timer: Number(newTimer) || 6.5
      };

      await saveSiteSettings(payload);

      try {
        localStorage.setItem("carousel_slides", JSON.stringify(newSlides));
        localStorage.setItem("carousel_timer", String(newTimer));
      } catch (storageErr) {
        console.warn("Storage quota note:", storageErr);
      }

      window.dispatchEvent(new CustomEvent("site_settings_updated", { detail: payload }));
      window.dispatchEvent(new Event("storage"));

      if (onSettingsSaved) {
        onSettingsSaved(newSlides, newTimer);
      }

      setLastSavedTime(new Date().toLocaleTimeString());

      if (successMsg) {
        toast.success(successMsg);
      }
      return true;
    } catch (err: any) {
      console.error("Failed to sync carousel settings:", err);
      toast.error("Failed to sync carousel settings. Check console logs.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Start adding a new slide
  const handleAddNewSlide = () => {
    const newSlide: CarouselSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "image",
      mediaUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
      mediaAlt: "Hero carousel slide banner",
      heading: "ACHIEVE YOUR HIGHEST BAND SCORE",
      subheading: "Personalized coaching, authentic practice tests, and certified guidance.",
      linkUrl: "/courses",
      buttonLink: "/courses",
      buttonText: "Explore Now",
      openInNewTab: false,
      customComponent: "none"
    };
    setSlideDraft(newSlide);
    setEditingSlideId("new");
  };

  // Start editing existing slide
  const handleStartEdit = (slide: CarouselSlide) => {
    setSlideDraft({
      ...slide,
      customComponent: "none",
      linkUrl: slide.linkUrl || slide.buttonLink || "/courses"
    });
    setEditingSlideId(slide.id);
  };

  // Move slide position up or down
  const handleMoveSlide = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSlides(updated);
    await persistChanges(updated, timer, "Slide reordered and updated on homepage!");
  };

  // Delete slide
  const handleDeleteSlide = async (id: string) => {
    if (slides.length <= 1) {
      toast.error("Carousel must have at least one slide.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this slide?")) {
      const updated = slides.filter(s => s.id !== id);
      setSlides(updated);
      if (editingSlideId === id) {
        setEditingSlideId(null);
        setSlideDraft(null);
      }
      await persistChanges(updated, timer, "Slide deleted and removed from homepage!");
    }
  };

  // Handle media file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slideDraft) return;

    // Detect type from mime
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setSlideDraft(prev => prev ? ({
          ...prev,
          type: isVideo ? "video" : "image",
          mediaUrl: reader.result as string
        }) : null);
        toast.success(`File converted to Base64 data (${isVideo ? "Video" : "Image"})`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Commit slide edit / add and IMMEDIATELY publish to homepage
  const handleSaveSlideDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideDraft) return;

    if (!slideDraft.mediaUrl.trim()) {
      toast.error("Slide media URL or uploaded asset is required.");
      return;
    }

    const finalizedSlide: CarouselSlide = {
      ...slideDraft,
      customComponent: "none",
      linkUrl: slideDraft.linkUrl?.trim() || undefined,
      buttonLink: slideDraft.linkUrl?.trim() || slideDraft.buttonLink?.trim() || "/courses"
    };

    let updatedSlides: CarouselSlide[];
    if (editingSlideId === "new") {
      updatedSlides = [...slides, finalizedSlide];
    } else {
      updatedSlides = slides.map(s => s.id === finalizedSlide.id ? finalizedSlide : s);
    }

    setSlides(updatedSlides);
    setEditingSlideId(null);
    setSlideDraft(null);

    await persistChanges(
      updatedSlides,
      timer,
      editingSlideId === "new" ? "New slide added and published to homepage!" : "Slide changes saved and published to homepage!"
    );
  };

  // Reset to initial default slides
  const handleResetToDefaults = async () => {
    if (window.confirm("Reset all carousel slides and timer back to factory default presets?")) {
      setSlides(defaultCarouselSlides);
      setTimer(6.5);
      setEditingSlideId(null);
      setSlideDraft(null);
      await persistChanges(defaultCarouselSlides, 6.5, "Carousel reset to default presets and published!");
    }
  };

  // Save all settings to LocalStorage & MySQL / Backend
  const handleSaveAll = async () => {
    await persistChanges(slides, timer, "All carousel slides & rotation timer published successfully to homepage!");
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview & Quick Configuration Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/30 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Dynamic Hero Carousel Configuration
            </h4>
          </div>
          <p className="text-xs text-slate-400">
            Control homepage slides, autoplay intervals, promotional CTA links, badges, and high-impact background images/videos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="rounded-xl border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold h-9"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Defaults
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddNewSlide}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wide h-9 px-4 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Slide
          </Button>
        </div>
      </div>

      {/* Auto-Slide Timer Setting */}
      <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <Label htmlFor="carousel-timer" className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                Slide Transition Timer (Seconds)
              </Label>
              <p className="text-[11px] text-slate-400">
                Duration each slide stays visible before rotating to the next. Set to 0 to disable auto-rotation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="carousel-timer"
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={timer}
              onChange={(e) => setTimer(parseFloat(e.target.value) || 0)}
              onBlur={() => {
                persistChanges(slides, timer, "Timer updated and saved to homepage!");
              }}
              className="w-24 h-9 font-mono font-bold text-center text-sm rounded-xl border border-slate-200 dark:border-white/10"
            />
            <span className="text-xs font-bold text-slate-400">sec</span>
          </div>
        </div>
      </div>

      {/* Slide Edit Form (if editing) */}
      {editingSlideId && slideDraft && (
        <form onSubmit={handleSaveSlideDraft} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/40 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                {editingSlideId === "new" ? "+" : "✎"}
              </span>
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                {editingSlideId === "new" ? "Create New Carousel Slide" : "Edit Carousel Slide"}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {lastSavedTime && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live
                </span>
              )}
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-blue-500 border-blue-500/30">
                {slideDraft.type === "video" ? "Video Background" : "Image Background"}
              </Badge>
            </div>
          </div>

          {/* Media Format */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Media Format
            </Label>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              <button
                type="button"
                onClick={() => setSlideDraft({ ...slideDraft, type: "image" })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  slideDraft.type === "image"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500"
                    : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Image
              </button>
              <button
                type="button"
                onClick={() => setSlideDraft({ ...slideDraft, type: "video" })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  slideDraft.type === "video"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500"
                    : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Video (MP4/WebM)
              </button>
            </div>
          </div>

          {/* Media URL & Direct Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{slideDraft.type === "video" ? "Video URL or File" : "Image URL or File"} *</span>
              <span className="text-[10px] text-slate-400 font-normal">Supports direct web URLs (HTTPS) or local file upload</span>
            </Label>
            <div className="flex gap-2">
              <Input
                required
                value={slideDraft.mediaUrl}
                onChange={(e) => setSlideDraft({ ...slideDraft, mediaUrl: e.target.value })}
                placeholder={slideDraft.type === "video" ? "https://site.com/video.mp4" : "https://images.unsplash.com/... or /banner.webp"}
                className="rounded-xl h-10 text-xs font-medium flex-1"
              />
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 px-3 text-xs font-bold border-slate-200 dark:border-white/10"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                </Button>
                <input
                  type="file"
                  accept={slideDraft.type === "video" ? "video/*" : "image/*"}
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Upload media file"
                />
              </div>
            </div>
          </div>

          {/* Media Preview Thumbnail */}
          {slideDraft.mediaUrl && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 h-32 bg-slate-950 flex items-center justify-center">
              {slideDraft.type === "video" ? (
                <video
                  src={slideDraft.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={slideDraft.mediaUrl}
                  alt={slideDraft.mediaAlt || "Preview"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/ielts_prep_banner_960.webp";
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                <span className="text-white text-xs font-black truncate drop-shadow">
                  {slideDraft.heading || "No headline set"}
                </span>
              </div>
            </div>
          )}

          {/* Carousel Slide Link Configuration (NEW) */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Carousel Slide Link (URL)
              </Label>
              <span className="text-[11px] text-slate-500 font-medium">Makes entire slide clickable</span>
            </div>

            <Input
              value={slideDraft.linkUrl ?? slideDraft.buttonLink ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSlideDraft({
                  ...slideDraft,
                  linkUrl: val,
                  buttonLink: val // Keep synced for compatibility
                });
              }}
              placeholder="e.g. /courses, /mock-tests, https://... or #contact"
              className="rounded-xl h-10 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <p>
                When visitors click on this carousel slide on the homepage, they will be navigated to this destination.
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <input
                  type="checkbox"
                  checked={!!slideDraft.openInNewTab}
                  onChange={(e) => setSlideDraft({ ...slideDraft, openInNewTab: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Open in new tab</span>
              </label>
            </div>
          </div>

          {/* Optional Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Headline / Main Title (Optional &bull; Use &quot;|&quot; for line break)
              </Label>
              <Input
                value={slideDraft.heading || ""}
                onChange={(e) => setSlideDraft({ ...slideDraft, heading: e.target.value })}
                placeholder="Leave blank for pure banner image, or type title..."
                className="rounded-xl h-10 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Subheading / Paragraph Description (Optional)
              </Label>
              <Input
                value={slideDraft.subheading || ""}
                onChange={(e) => setSlideDraft({ ...slideDraft, subheading: e.target.value })}
                placeholder="Optional supporting text..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingSlideId(null);
                setSlideDraft(null);
              }}
              className="rounded-xl h-10 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving & Publishing..." : "Save & Publish Slide"}
            </Button>
          </div>
        </form>
      )}

      {/* Slide List / Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Active Slide Stack ({slides.length})
          </h5>
          <span className="text-[11px] text-slate-400 italic">
            Drag or use arrows to reorder slide sequence
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {slides.map((slide, index) => {
            const isEditing = editingSlideId === slide.id;
            return (
              <div
                key={slide.id || index}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isEditing
                    ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-500/50"
                    : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
                }`}
              >
                {/* Media preview thumbnail & info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shrink-0">
                    {index + 1}
                  </div>

                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 shrink-0 relative">
                    {slide.type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-purple-400">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    ) : (
                      <img
                        src={slide.mediaUrl}
                        alt={slide.mediaAlt || "Slide"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/ielts_prep_banner_960.webp";
                        }}
                      />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono font-bold px-1 rounded">
                      {slide.type === "video" ? "MP4" : "IMG"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h6 className="font-black text-sm text-slate-800 dark:text-white truncate">
                        {slide.heading?.replace(/\|/g, " ") || "Untitled Slide"}
                      </h6>
                    </div>
                    {slide.subheading && (
                      <p className="text-[11px] text-slate-400 truncate max-w-md">
                        {slide.subheading}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-medium">
                      {(slide.linkUrl || slide.buttonLink) ? (
                        <span className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          Link: {slide.linkUrl || slide.buttonLink}
                          {slide.openInNewTab && <span className="text-[9px] text-slate-400 font-normal ml-0.5">(new tab)</span>}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No link assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Move Up/Down */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => handleMoveSlide(index, "up")}
                    className="h-8 w-8 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    title="Move slide earlier"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === slides.length - 1}
                    onClick={() => handleMoveSlide(index, "down")}
                    className="h-8 w-8 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    title="Move slide later"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {/* Edit */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(slide)}
                    className="h-8 px-3 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>

                  {/* Delete */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                    title="Delete slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Settings Action Button */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/5">
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full rounded-2xl h-12 bg-blue-600 hover:bg-blue-500 text-white font-black italic tracking-wide text-xs uppercase shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Synchronizing Carousel..." : "Save & Publish Carousel Settings"}
        </Button>
      </div>
    </div>
  );
};

export default CarouselManager;
