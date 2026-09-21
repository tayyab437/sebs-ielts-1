import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Lock,
  Sparkles,
  HelpCircle,
  Clock,
  AlertCircle,
  Settings,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface VideoResolutionOption {
  id: string;
  label: string;
  description: string;
  badge?: string;
  ytQuality: string;
}

export const VIDEO_RESOLUTIONS: VideoResolutionOption[] = [
  { id: "Auto", label: "Auto", description: "Smart adaptive quality", badge: "Smart", ytQuality: "default" },
  { id: "1080p", label: "1080p", description: "Full HD • Highest clarity", badge: "1080p HD", ytQuality: "hd1080" },
  { id: "720p", label: "720p", description: "High Definition • Fast stream", badge: "720p HD", ytQuality: "hd720" },
  { id: "480p", label: "480p", description: "Standard Definition • Balanced", badge: "480p SD", ytQuality: "large" },
  { id: "360p", label: "360p", description: "Medium quality", badge: "360p", ytQuality: "medium" },
  { id: "240p", label: "240p", description: "Low data usage", badge: "240p", ytQuality: "small" },
  { id: "144p", label: "144p", description: "Data saver • Minimal bandwidth", badge: "144p", ytQuality: "tiny" },
];

export const getStoredResolution = (): string => {
  try {
    const saved = localStorage.getItem("sebs_course_video_resolution") || sessionStorage.getItem("sebs_course_video_resolution");
    if (saved && VIDEO_RESOLUTIONS.some(r => r.id === saved)) return saved;
  } catch (e) {}
  return "Auto";
};

export interface SecureVideoPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  initialDuration?: number | string;
  playbackRate?: number;
  onPlaybackRateChange?: (speed: number) => void;
  resolution?: string;
  onResolutionChange?: (resolution: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  checkpointMarkers?: { timestamp: number; label?: string }[];
  className?: string;
  showCustomControls?: boolean;
  seekToTime?: number | null;
}

export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
};

export const parseDurationSeconds = (dur: number | string | undefined | null): number => {
  if (typeof dur === "number" && !isNaN(dur) && dur > 0) return dur;
  if (!dur || typeof dur !== "string") return 0;
  const clean = dur.replace(/mins?|minutes?|secs?|seconds?|hrs?|hours?/gi, "").trim();
  const parts = clean.split(":").map((p) => parseFloat(p.trim())).filter((n) => !isNaN(n));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0] > 100 ? parts[0] : parts[0] * 60;
  }
  return 0;
};

export const getStoredPlaybackSpeed = (): number => {
  try {
    const saved = localStorage.getItem("sebs_course_playback_speed") || sessionStorage.getItem("sebs_course_playback_speed");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.25 && parsed <= 3) return parsed;
    }
  } catch (e) {}
  return 1;
};

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  url,
  title = "SEBS Premium IELTS Masterclass",
  poster,
  autoPlay = false,
  initialDuration,
  playbackRate: propPlaybackRate,
  onPlaybackRateChange,
  resolution: propResolution,
  onResolutionChange,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  onPause,
  onPlay,
  checkpointMarkers = [],
  className = "",
  showCustomControls = true,
  seekToTime,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const playerTimerRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const onPlaybackRateChangeRef = useRef(onPlaybackRateChange);
  const onResolutionChangeRef = useRef(onResolutionChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationChangeRef = useRef(onDurationChange);
  const onEndedRef = useRef(onEnded);
  const onPauseRef = useRef(onPause);
  const onPlayRef = useRef(onPlay);

  useEffect(() => {
    onPlaybackRateChangeRef.current = onPlaybackRateChange;
    onResolutionChangeRef.current = onResolutionChange;
    onTimeUpdateRef.current = onTimeUpdate;
    onDurationChangeRef.current = onDurationChange;
    onEndedRef.current = onEnded;
    onPauseRef.current = onPause;
    onPlayRef.current = onPlay;
  });

  const parsedInitDuration = parseDurationSeconds(initialDuration);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(parsedInitDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize playback rate from storage or prop to ensure cross-video consistency
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    if (propPlaybackRate && propPlaybackRate > 0) return propPlaybackRate;
    return getStoredPlaybackSpeed();
  });

  const playbackRateRef = useRef<number>(playbackRate);

  useEffect(() => {
    if (propPlaybackRate && propPlaybackRate > 0 && propPlaybackRate !== playbackRateRef.current) {
      setPlaybackRate(propPlaybackRate);
      playbackRateRef.current = propPlaybackRate;
    }
  }, [propPlaybackRate]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Initialize video resolution from storage or prop to ensure persistence
  const [resolution, setResolution] = useState<string>(() => {
    if (propResolution) return propResolution;
    return getStoredResolution();
  });

  const resolutionRef = useRef<string>(resolution);

  useEffect(() => {
    if (propResolution && propResolution !== resolutionRef.current) {
      setResolution(propResolution);
      resolutionRef.current = propResolution;
    }
  }, [propResolution]);

  useEffect(() => {
    resolutionRef.current = resolution;
  }, [resolution]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showResolutionMenu, setShowResolutionMenu] = useState(false);
  const [resolutionToast, setResolutionToast] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [actualQuality, setActualQuality] = useState<string>("");

  const currentTimeRef = useRef(0);
  const durationRef = useRef(parsedInitDuration || 0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync initial duration if updated from outside
  useEffect(() => {
    if (parsedInitDuration > 0 && duration === 0) {
      setDuration(parsedInitDuration);
      durationRef.current = parsedInitDuration;
    }
  }, [parsedInitDuration, duration]);

  const youtubeId = extractYouTubeVideoId(url);
  const isYouTube = !!youtubeId;

  // Selected quality option for embed URL initialization
  const selectedOpt = VIDEO_RESOLUTIONS.find((r) => r.id === resolution) || VIDEO_RESOLUTIONS[0];
  const vqQuery = selectedOpt.ytQuality !== "default" ? `&vq=${selectedOpt.ytQuality}` : "";

  // Masked URL generation for YouTube iframe:
  // Using standard youtube.com embed with enablejsapi=1 & vq quality parameter so YouTube loads at selected quality
  const maskedEmbedUrl = isYouTube
    ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${
        autoPlay ? 1 : 0
      }&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1${vqQuery}`
    : url;

  // PostMessage sender for YouTube iframe API commands
  const sendYouTubeCommand = useCallback(
    (command: string, args: any[] = []) => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current[command] === "function") {
        try {
          ytPlayerRef.current[command](...args);
          return;
        } catch (e) {}
      }
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: command,
              args: args,
            }),
            "*"
          );
        } catch (e) {}
      }
    },
    []
  );

  // Apply playbackRate and resolution whenever url or player changes
  useEffect(() => {
    const currentRate = playbackRateRef.current;
    const currentRes = resolutionRef.current;
    const opt = VIDEO_RESOLUTIONS.find((r) => r.id === currentRes) || VIDEO_RESOLUTIONS[0];

    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = currentRate;
      } catch (e) {}
    }
    if (isYouTube) {
      sendYouTubeCommand("setPlaybackRate", [currentRate]);
      sendYouTubeCommand("setPlaybackQuality", [opt.ytQuality]);
      sendYouTubeCommand("setPlaybackQualityRange", [opt.ytQuality, opt.ytQuality]);

      const t1 = setTimeout(() => {
        sendYouTubeCommand("setPlaybackRate", [playbackRateRef.current]);
        sendYouTubeCommand("setPlaybackQuality", [opt.ytQuality]);
      }, 350);
      const t2 = setTimeout(() => {
        sendYouTubeCommand("setPlaybackRate", [playbackRateRef.current]);
        sendYouTubeCommand("setPlaybackQuality", [opt.ytQuality]);
      }, 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [url, isYouTube, sendYouTubeCommand]);

  // Initialize YT API script if YouTube video
  useEffect(() => {
    if (!isYouTube || typeof window === "undefined") return;

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, [isYouTube]);

  // Connect YT.Player instance once available
  const initYtPlayer = useCallback(() => {
    if (ytPlayerRef.current || !iframeRef.current) return;
    if ((window as any).YT && (window as any).YT.Player) {
      try {
        ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
          events: {
            onReady: (e: any) => {
              try {
                const dur = e.target.getDuration();
                if (dur && !isNaN(dur) && dur > 0) {
                  setDuration(dur);
                  durationRef.current = dur;
                  if (onDurationChangeRef.current) onDurationChangeRef.current(dur);
                }
                if (typeof e.target.setPlaybackRate === "function") {
                  e.target.setPlaybackRate(playbackRateRef.current);
                }
                const opt = VIDEO_RESOLUTIONS.find((r) => r.id === resolutionRef.current) || VIDEO_RESOLUTIONS[0];
                if (typeof e.target.setPlaybackQuality === "function") {
                  e.target.setPlaybackQuality(opt.ytQuality);
                }
                if (typeof e.target.setPlaybackQualityRange === "function") {
                  e.target.setPlaybackQualityRange(opt.ytQuality, opt.ytQuality);
                }
                if (typeof e.target.getAvailableQualityLevels === "function") {
                  const levels = e.target.getAvailableQualityLevels();
                  if (Array.isArray(levels) && levels.length > 0) {
                    setAvailableQualities(levels);
                  }
                }
                if (typeof e.target.getPlaybackQuality === "function") {
                  const q = e.target.getPlaybackQuality();
                  if (q) setActualQuality(q);
                }
              } catch (err) {}
            },
            onPlaybackQualityChange: (e: any) => {
              try {
                if (e && e.data) {
                  setActualQuality(e.data);
                }
                if (typeof e.target.getAvailableQualityLevels === "function") {
                  const levels = e.target.getAvailableQualityLevels();
                  if (Array.isArray(levels) && levels.length > 0) {
                    setAvailableQualities(levels);
                  }
                }
              } catch (err) {}
            },
            onStateChange: (e: any) => {
              if (e.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
                try {
                  if (typeof e.target.setPlaybackRate === "function") {
                    e.target.setPlaybackRate(playbackRateRef.current);
                  }
                  const opt = VIDEO_RESOLUTIONS.find((r) => r.id === resolutionRef.current) || VIDEO_RESOLUTIONS[0];
                  if (typeof e.target.setPlaybackQuality === "function") {
                    e.target.setPlaybackQuality(opt.ytQuality);
                  }
                  if (typeof e.target.setPlaybackQualityRange === "function") {
                    e.target.setPlaybackQualityRange(opt.ytQuality, opt.ytQuality);
                  }
                  if (typeof e.target.getAvailableQualityLevels === "function") {
                    const levels = e.target.getAvailableQualityLevels();
                    if (Array.isArray(levels) && levels.length > 0) {
                      setAvailableQualities(levels);
                    }
                  }
                } catch (err) {}
                if (onPlayRef.current) onPlayRef.current();
              } else if (e.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
                if (onPauseRef.current) onPauseRef.current();
              } else if (e.data === 0) {
                setIsPlaying(false);
                if (onEndedRef.current) onEndedRef.current();
              } else if (e.data === 3) {
                setIsBuffering(true);
              }
            },
          },
        });
      } catch (e) {}
    }
  }, []);

  // Initialize and listen to YouTube postMessage events
  useEffect(() => {
    if (!isYouTube) return;

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        if (data && data.event === "infoDelivery" && data.info) {
          if (data.info.currentTime !== undefined && !isNaN(data.info.currentTime)) {
            const curTime = Number(data.info.currentTime);
            setCurrentTime(curTime);
            currentTimeRef.current = curTime;
            lastUpdateTimeRef.current = Date.now();
            if (onTimeUpdateRef.current) onTimeUpdateRef.current(curTime);
          }
          if (data.info.duration !== undefined && data.info.duration > 0 && !isNaN(data.info.duration)) {
            const dur = Number(data.info.duration);
            setDuration(dur);
            durationRef.current = dur;
            if (onDurationChangeRef.current) onDurationChangeRef.current(dur);
          }
          if (data.info.availableQualityLevels && Array.isArray(data.info.availableQualityLevels)) {
            setAvailableQualities(data.info.availableQualityLevels);
          }
          if (data.info.playbackQuality) {
            setActualQuality(data.info.playbackQuality);
          }
          if (data.info.playerState !== undefined) {
            // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
            if (data.info.playerState === 1) {
              setIsPlaying(true);
              setIsBuffering(false);
              if (onPlayRef.current) onPlayRef.current();
            } else if (data.info.playerState === 2) {
              setIsPlaying(false);
              setIsBuffering(false);
              if (onPauseRef.current) onPauseRef.current();
            } else if (data.info.playerState === 0) {
              setIsPlaying(false);
              if (onEndedRef.current) onEndedRef.current();
            } else if (data.info.playerState === 3) {
              setIsBuffering(true);
            }
          }
        }
      } catch (e) {
        // ignore non-youtube postmessages
      }
    };

    window.addEventListener("message", handleWindowMessage);

    // Continuous inquiry to YouTube player / postMessage
    const interval = setInterval(() => {
      if (!ytPlayerRef.current) {
        initYtPlayer();
      }

      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          if (typeof cur === "number" && !isNaN(cur)) {
            setCurrentTime(cur);
            currentTimeRef.current = cur;
            lastUpdateTimeRef.current = Date.now();
            if (onTimeUpdateRef.current) onTimeUpdateRef.current(cur);
          }
          const dur = ytPlayerRef.current.getDuration();
          if (typeof dur === "number" && !isNaN(dur) && dur > 0) {
            setDuration(dur);
            durationRef.current = dur;
            if (onDurationChangeRef.current) onDurationChangeRef.current(dur);
          }
          if (typeof ytPlayerRef.current.getPlaybackQuality === "function") {
            const q = ytPlayerRef.current.getPlaybackQuality();
            if (q) setActualQuality(q);
          }
          if (typeof ytPlayerRef.current.getAvailableQualityLevels === "function") {
            const levels = ytPlayerRef.current.getAvailableQualityLevels();
            if (Array.isArray(levels) && levels.length > 0) {
              setAvailableQualities(levels);
            }
          }
        } catch (e) {}
      } else if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: "listening" }), "*");
        } catch (e) {}
      }
    }, 250);
    playerTimerRef.current = interval;

    return () => {
      window.removeEventListener("message", handleWindowMessage);
      if (playerTimerRef.current) clearInterval(playerTimerRef.current);
    };
  }, [isYouTube, initYtPlayer]);

  // Fallback timer when playing to guarantee time display is never stuck
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // If we haven't received direct player events in 600ms, advance currentTime smoothly
      if (now - lastUpdateTimeRef.current >= 600) {
        const cur = currentTimeRef.current;
        const dur = durationRef.current;
        const max = dur > 0 ? dur : 3600;
        const next = cur + 0.25;

        if (next >= max) {
          setIsPlaying(false);
          currentTimeRef.current = max;
          setCurrentTime(max);
          if (onEndedRef.current) onEndedRef.current();
        } else {
          currentTimeRef.current = next;
          setCurrentTime(next);
          if (onTimeUpdateRef.current) onTimeUpdateRef.current(next);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isYouTube) {
      if (isPlaying) {
        sendYouTubeCommand("pauseVideo");
        setIsPlaying(false);
        if (onPauseRef.current) onPauseRef.current();
      } else {
        sendYouTubeCommand("playVideo");
        setIsPlaying(true);
        if (onPlayRef.current) onPlayRef.current();
      }
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        if (onPlayRef.current) onPlayRef.current();
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        if (onPauseRef.current) onPauseRef.current();
      }
    }
  };

  // Handle Seek
  const handleSeek = (newTime: number) => {
    const dur = durationRef.current;
    const clamped = Math.max(0, Math.min(dur > 0 ? dur : 3600, newTime));
    setCurrentTime(clamped);
    currentTimeRef.current = clamped;
    lastUpdateTimeRef.current = Date.now();
    if (onTimeUpdateRef.current) onTimeUpdateRef.current(clamped);

    if (isYouTube) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        try {
          ytPlayerRef.current.seekTo(clamped, true);
        } catch (e) {}
      }
      sendYouTubeCommand("seekTo", [clamped, true]);
    } else if (videoRef.current) {
      try {
        videoRef.current.currentTime = clamped;
      } catch (e) {}
    }
  };

  // Seek when seekToTime prop changes
  useEffect(() => {
    if (typeof seekToTime === "number" && !isNaN(seekToTime) && seekToTime >= 0) {
      handleSeek(seekToTime);
    }
  }, [seekToTime]);

  // Handle Volume Change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (isYouTube) {
      sendYouTubeCommand("setVolume", [newVolume * 100]);
      if (newVolume === 0) sendYouTubeCommand("mute");
      else sendYouTubeCommand("unMute");
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      handleVolumeChange(volume || 0.8);
    } else {
      setIsMuted(true);
      if (isYouTube) {
        sendYouTubeCommand("mute");
      } else if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  // Skip Forward/Backward
  const skipTime = (seconds: number) => {
    const target = Math.max(0, Math.min(duration || 3600, currentTime + seconds));
    handleSeek(target);
  };

  // Change Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    playbackRateRef.current = speed;
    setShowSpeedMenu(false);
    try {
      localStorage.setItem("sebs_course_playback_speed", speed.toString());
      sessionStorage.setItem("sebs_course_playback_speed", speed.toString());
    } catch (e) {}

    if (onPlaybackRateChangeRef.current) {
      onPlaybackRateChangeRef.current(speed);
    }

    if (isYouTube) {
      sendYouTubeCommand("setPlaybackRate", [speed]);
    } else if (videoRef.current) {
      try {
        videoRef.current.playbackRate = speed;
      } catch (e) {}
    }
  };

  // Change Resolution / Quality
  const handleResolutionChange = (option: VideoResolutionOption) => {
    setResolution(option.id);
    resolutionRef.current = option.id;
    setShowResolutionMenu(false);
    try {
      localStorage.setItem("sebs_course_video_resolution", option.id);
      sessionStorage.setItem("sebs_course_video_resolution", option.id);
    } catch (e) {}

    if (onResolutionChangeRef.current) {
      onResolutionChangeRef.current(option.id);
    }

    if (isYouTube) {
      const curTime = currentTimeRef.current;
      const curRate = playbackRateRef.current;
      const isCurrentlyPlaying = isPlaying;

      // 1. Direct API commands
      sendYouTubeCommand("setPlaybackQuality", [option.ytQuality]);
      sendYouTubeCommand("setPlaybackQualityRange", [option.ytQuality, option.ytQuality]);

      // 2. Force video engine to load target quality stream at current timestamp
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.setPlaybackQuality === "function") {
            ytPlayerRef.current.setPlaybackQuality(option.ytQuality);
          }
          if (typeof ytPlayerRef.current.setPlaybackQualityRange === "function") {
            ytPlayerRef.current.setPlaybackQualityRange(option.ytQuality, option.ytQuality);
          }
          if (isCurrentlyPlaying && typeof ytPlayerRef.current.loadVideoById === "function") {
            ytPlayerRef.current.loadVideoById({
              videoId: youtubeId,
              startSeconds: curTime,
              suggestedQuality: option.ytQuality,
            });
          } else if (typeof ytPlayerRef.current.cueVideoById === "function") {
            ytPlayerRef.current.cueVideoById({
              videoId: youtubeId,
              startSeconds: curTime,
              suggestedQuality: option.ytQuality,
            });
          }
          if (typeof ytPlayerRef.current.setPlaybackRate === "function") {
            setTimeout(() => {
              try {
                ytPlayerRef.current.setPlaybackRate(curRate);
              } catch (e) {}
            }, 100);
          }
        } catch (e) {}
      } else {
        const cmd = isCurrentlyPlaying ? "loadVideoById" : "cueVideoById";
        sendYouTubeCommand(cmd, [{
          videoId: youtubeId,
          startSeconds: curTime,
          suggestedQuality: option.ytQuality,
        }]);
        setTimeout(() => {
          sendYouTubeCommand("setPlaybackRate", [curRate]);
        }, 150);
      }
    }

    setResolutionToast(`Quality: ${option.label}${option.badge ? ` (${option.badge})` : ""}`);
    const timer = setTimeout(() => {
      setResolutionToast(null);
    }, 2200);
    return () => clearTimeout(timer);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const total = Math.floor(secs);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Block context menu (right click) and prevent copying or inspecting source
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSpeedMenu(false);
        setShowResolutionMenu(false);
      }}
      className={`relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden select-none border border-slate-800 shadow-2xl group ${className}`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      {/* Dynamic Resolution Feedback Toast */}
      {resolutionToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-indigo-500/40 text-white text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>{resolutionToast}</span>
        </div>
      )}
      {/* 1. Underlying Video / Embedded Frame */}
      {isYouTube ? (
        <div className="absolute inset-0 w-full h-full pointer-events-auto overflow-hidden">
          <iframe
            ref={iframeRef}
            src={maskedEmbedUrl}
            title={title}
            className="w-full h-full border-0 scale-[1.01] pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            tabIndex={-1}
            onContextMenu={handleContextMenu}
          />
        </div>
      ) : url && url.trim() ? (
        <video
          ref={videoRef}
          src={url}
          poster={poster}
          className="w-full h-full object-contain"
          onContextMenu={handleContextMenu}
          onError={() => {
            console.warn("Video source failed to load:", url);
          }}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            if (!isNaN(t)) {
              setCurrentTime(t);
              currentTimeRef.current = t;
              lastUpdateTimeRef.current = Date.now();
              if (onTimeUpdateRef.current) onTimeUpdateRef.current(t);
            }
          }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (d && !isNaN(d) && isFinite(d) && d > 0) {
              setDuration(d);
              durationRef.current = d;
              if (onDurationChangeRef.current) onDurationChangeRef.current(d);
            }
            try {
              e.currentTarget.playbackRate = playbackRateRef.current;
            } catch (err) {}
          }}
          onCanPlay={(e) => {
            try {
              e.currentTarget.playbackRate = playbackRateRef.current;
            } catch (err) {}
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (onEndedRef.current) onEndedRef.current();
          }}
          onPlay={(e) => {
            setIsPlaying(true);
            try {
              e.currentTarget.playbackRate = playbackRateRef.current;
            } catch (err) {}
            if (onPlayRef.current) onPlayRef.current();
          }}
          onPause={() => {
            setIsPlaying(false);
            if (onPauseRef.current) onPauseRef.current();
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6 text-center">
          <AlertCircle className="w-8 h-8 mb-2 text-slate-500" />
          <p className="text-xs font-semibold text-slate-300">Video Lecture Ready</p>
          <p className="text-[11px] text-slate-500 mt-1">Select a lesson from the syllabus or enter a valid media source.</p>
        </div>
      )}

      {/* 2. Top Privacy Shield (Permanently covers YouTube title, share button, and outbound links with elegant academic styling) */}
      <div
        className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent z-20 pointer-events-auto flex items-center justify-between px-4 sm:px-5"
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-[10px] font-medium backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Secure Stream</span>
          </div>
          <p className="text-xs font-medium text-slate-200 truncate max-w-[220px] sm:max-w-md">
            {title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900/80 text-slate-400 text-[10px] font-mono border border-slate-800">
            HD 1080p
          </span>
        </div>
      </div>

      {/* 3. Bottom-Right YouTube Watermark & Logo Shield */}
      <div
        className="absolute bottom-16 sm:bottom-14 right-3 z-20 pointer-events-auto"
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-[10px] font-medium text-slate-400">
          <span>SEBS Academy</span>
        </div>
      </div>

      {/* 4. Center Click Surface for Play/Pause */}
      <div
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
        onClick={togglePlay}
        onContextMenu={handleContextMenu}
      >
        {!isPlaying && (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all backdrop-blur-sm border border-white/20">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
          </div>
        )}
      </div>

      {/* 5. Custom Seamless Player Controls Bar */}
      {showCustomControls && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-3 sm:p-4 transition-opacity duration-300 pointer-events-auto ${
            isHovered || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
          onContextMenu={handleContextMenu}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Timeline Scrubber with Question Checkpoints */}
          <div
            className="relative group/bar py-2.5 -my-1 cursor-pointer select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const target = pos * (duration > 0 ? duration : 100);
              handleSeek(target);
            }}
          >
            {/* Timeline base track */}
            <div
              className="relative w-full h-1.5 group-hover/bar:h-2.5 bg-slate-800/80 rounded-full overflow-hidden transition-all pointer-events-none"
            >
              {/* Buffer Bar */}
              <div className="absolute top-0 left-0 bottom-0 bg-white/20 rounded-full" />
              {/* Progress Bar */}
              <div
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full transition-all duration-75"
                style={{
                  width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
                }}
              />
            </div>

            {/* Checkpoint Question Indicators */}
            {checkpointMarkers.map((marker, idx) => {
              const posPercent = duration > 0 ? (marker.timestamp / duration) * 100 : 0;
              if (posPercent <= 0 || posPercent > 100) return null;
              return (
                <div
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-200 shadow-md group-hover/bar:scale-125 transition-transform z-10"
                  style={{ left: `${posPercent}%` }}
                  title={`Question Checkpoint at ${formatTime(marker.timestamp)}: ${
                    marker.label || "Interactive Assessment"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeek(marker.timestamp);
                  }}
                />
              );
            })}
          </div>

          {/* Controls Bottom Row */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {/* Left Controls: Play, Skip, Volume, Time */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 sm:p-2 rounded-xl text-white hover:bg-white/10 active:scale-95 transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                )}
              </button>

              <button
                onClick={() => skipTime(-10)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => skipTime(10)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="Fast forward 10 seconds"
              >
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 group/vol ml-1">
                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-12 sm:w-16 h-1 accent-indigo-500 bg-slate-700 rounded-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>

              {/* Time Display */}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 text-[11px] sm:text-xs font-mono font-bold text-slate-200 ml-2 backdrop-blur-md shadow-inner tabular-nums select-none tracking-tight"
                title={`Playback Position: ${formatTime(currentTime)} / ${formatTime(duration)}`}
              >
                <Clock className="w-3 h-3 text-indigo-400 shrink-0 hidden sm:inline" />
                <span className="text-white font-bold">{formatTime(currentTime)}</span>
                <span className="text-slate-500 font-normal mx-0.5">/</span>
                <span className="text-slate-400 font-semibold">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Checkpoints Counter, Quality/Resolution, Speed, Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-2">
              {checkpointMarkers.length > 0 && (
                <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
                  <HelpCircle className="w-3 h-3" />
                  <span>{checkpointMarkers.length} Checkpoints</span>
                </div>
              )}

              {/* Resolution / Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(false);
                    setShowResolutionMenu(!showResolutionMenu);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold font-mono transition-all border border-white/5 hover:border-white/20 bg-slate-900/60"
                  title="Select Video Quality / Resolution"
                >
                  <Settings className="w-3 h-3 text-slate-400 group-hover:text-white shrink-0" />
                  <span>{resolution}</span>
                  {(resolution === "1080p" || resolution === "720p") && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-sans font-bold">
                      HD
                    </span>
                  )}
                </button>

                {showResolutionMenu && (
                  <div className="absolute bottom-full right-0 mb-2 p-1.5 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col gap-1 z-50 min-w-[220px] max-w-[270px] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/10 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Settings className="w-3 h-3 text-indigo-400" /> Quality
                      </span>
                      <span className="text-indigo-400 font-mono text-[9px]">
                        {actualQuality ? `Live: ${actualQuality.toUpperCase()}` : "All Resolutions"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
                      {VIDEO_RESOLUTIONS.map((opt) => {
                        const isSelected = resolution === opt.id;
                        const isStreamMatch = actualQuality && (
                          (opt.ytQuality === actualQuality) ||
                          (opt.id === "1080p" && actualQuality === "hd1080") ||
                          (opt.id === "720p" && actualQuality === "hd720") ||
                          (opt.id === "480p" && actualQuality === "large") ||
                          (opt.id === "360p" && actualQuality === "medium") ||
                          (opt.id === "240p" && actualQuality === "small") ||
                          (opt.id === "144p" && actualQuality === "tiny")
                        );
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleResolutionChange(opt)}
                            className={`flex items-center justify-between px-2.5 py-1.5 text-left rounded-xl transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-md font-bold"
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold font-mono">{opt.label}</span>
                                {opt.badge && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                      isSelected
                                        ? "bg-white/25 text-white"
                                        : opt.badge.includes("HD")
                                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                        : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    {opt.badge}
                                  </span>
                                )}
                                {isStreamMatch && !isSelected && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans font-medium">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] leading-tight truncate ${
                                  isSelected ? "text-indigo-100" : "text-slate-400"
                                }`}
                              >
                                {opt.description}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowResolutionMenu(false);
                    setShowSpeedMenu(!showSpeedMenu);
                  }}
                  className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold font-mono transition-all border border-white/5 hover:border-white/20 bg-slate-900/60"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 p-1.5 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col gap-0.5 z-50 min-w-[90px] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/10">
                      Speed
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`flex items-center justify-between px-2.5 py-1 text-left text-xs font-bold rounded-lg transition-colors ${
                          playbackRate === spd
                            ? "bg-indigo-600 text-white"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{spd}x</span>
                        {playbackRate === spd && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all border border-white/5 hover:border-white/20 bg-slate-900/60"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
