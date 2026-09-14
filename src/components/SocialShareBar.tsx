import { useState } from "react";
import { Share2, Check, Copy, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SocialShareBarProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function SocialShareBar({
  url = "https://sebsinstitute.com/",
  title = "SEB's Institute | IELTS Band 8.5 & Spoken English Preparation",
  description = "Achieve your dream IELTS Band 8.5+ with authentic computer-delivered mock tests, AI score evaluation, and live coaching by Syed Ejaz Bukhari.",
  className = ""
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(`${title} — ${description}`);

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.088.072.19.014.305-.058.115-.087.187-.173.289l-.26.309c-.087.098-.178.204-.076.379.102.175.454.748.974 1.211.669.595 1.233.78 1.408.868.175.088.277.073.38-.044.103-.117.444-.517.562-.693.118-.175.236-.146.396-.088.16.058 1.014.478 1.187.565.173.087.289.13.332.204.043.073.043.421-.101.826z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodedSummary}%20${encodedUrl}`,
      color: "bg-[#25D366] hover:bg-[#1EBE5D] text-white",
      label: "Share via WhatsApp"
    },
    {
      name: "Facebook",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-[#1877F2] hover:bg-[#0d65d9] text-white",
      label: "Share on Facebook"
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "bg-[#0A66C2] hover:bg-[#084e96] text-white",
      label: "Share on LinkedIn"
    },
    {
      name: "X (Twitter)",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700",
      label: "Share on X"
    },
    {
      name: "Telegram",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.968z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-[#229ED9] hover:bg-[#1c84b7] text-white",
      label: "Share on Telegram"
    }
  ];

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Native share error:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className={`w-full py-6 px-4 sm:px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Explanatory text */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-[#00a8cc] flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recommend SEB's Institute to Friends &amp; Study Groups
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share free IELTS mock test papers, AI band evaluations, and live lessons.
            </p>
          </div>
        </div>

        {/* Right: Sharing Buttons Plugin */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {shareLinks.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-transform active:scale-95 ${item.color}`}
              aria-label={item.label}
              title={item.label}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.name}</span>
            </a>
          ))}

          {/* Native Share button (if supported) or Copy Link */}
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs transition-all cursor-pointer"
            aria-label="Copy page URL link"
            title="Copy page URL link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
