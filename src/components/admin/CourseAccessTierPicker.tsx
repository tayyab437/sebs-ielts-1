import React, { useEffect, useState } from "react";
import { 
  fetchMembershipTiers, 
  MembershipTier, 
  DEFAULT_MEMBERSHIP_TIERS,
  syncCourseTierAccess,
  syncMockTestTierAccess
} from "@/src/lib/membershipService";
import { ShieldCheck, Sparkles, Check, Info, Lock, ChevronDown } from "lucide-react";

interface CourseAccessTierPickerProps {
  value?: string; // Current access tier name or id (e.g. "Free Trial Tier", "Pro Scholar", "Mastery Ultimate")
  allowedTierIds?: string[]; // Optional specific list of allowed tier IDs
  onChange: (accessTier: string, allowedTierIds?: string[]) => void;
  courseId?: string;
  isMockTest?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const CourseAccessTierPicker: React.FC<CourseAccessTierPickerProps> = ({
  value = "Free Trial Tier",
  allowedTierIds = [],
  onChange,
  courseId,
  isMockTest = false,
  disabled = false,
  className = "",
  label = "Membership & Access Level"
}) => {
  const [tiers, setTiers] = useState<MembershipTier[]>(DEFAULT_MEMBERSHIP_TIERS);
  const [selectedTierName, setSelectedTierName] = useState<string>(value || "Free Trial Tier");

  // Load live tiers from the Membership & Access single source of truth
  const loadTiers = async () => {
    try {
      const loaded = await fetchMembershipTiers();
      if (loaded && loaded.length > 0) {
        setTiers(loaded);

        // Normalize incoming value to match loaded tier name
        normalizeAndMatchSelected(loaded, value);
      }
    } catch (e) {
      console.warn("Could not load membership tiers in picker:", e);
    }
  };

  const normalizeAndMatchSelected = (tierList: MembershipTier[], curVal?: string) => {
    if (!curVal) {
      const defaultFree = tierList.find(t => t.isDefaultFreeTier) || tierList[0];
      setSelectedTierName(defaultFree?.name || "Free Trial Tier");
      return;
    }

    const lower = curVal.toLowerCase().trim();
    // Check if matches free
    if (lower === "free trial" || lower === "free trial tier" || lower === "free" || lower === "free-trial") {
      const defaultFree = tierList.find(t => t.isDefaultFreeTier) || tierList[0];
      setSelectedTierName(defaultFree?.name || "Free Trial Tier");
      return;
    }

    // Direct match by ID, name, or slug
    const matched = tierList.find(t => 
      t.name.toLowerCase() === lower || 
      t.id.toLowerCase() === lower ||
      (t.slug && t.slug.toLowerCase() === lower)
    );

    if (matched) {
      setSelectedTierName(matched.name);
    } else {
      setSelectedTierName(curVal);
    }
  };

  useEffect(() => {
    loadTiers();

    const handleUpdate = () => loadTiers();
    window.addEventListener("sebs_memberships_updated", handleUpdate);
    window.addEventListener("sebs_course_updated", handleUpdate);
    return () => {
      window.removeEventListener("sebs_memberships_updated", handleUpdate);
      window.removeEventListener("sebs_course_updated", handleUpdate);
    };
  }, [courseId, isMockTest]);

  useEffect(() => {
    if (value) {
      normalizeAndMatchSelected(tiers, value);
    }
  }, [value, tiers]);

  // Handle dropdown selection change
  const handleDropdownChange = async (newVal: string) => {
    if (disabled) return;

    setSelectedTierName(newVal);

    const targetTier = tiers.find(t => 
      t.name.toLowerCase() === newVal.toLowerCase() || 
      t.id.toLowerCase() === newVal.toLowerCase()
    );

    let calculatedAllowedIds: string[] = [];
    if (targetTier) {
      if (targetTier.isDefaultFreeTier || targetTier.price === 0) {
        calculatedAllowedIds = tiers.map(t => t.id); // All tiers can access free items
      } else {
        calculatedAllowedIds = tiers
          .filter(t => t.sortOrder >= targetTier.sortOrder || (isMockTest ? t.accessAllMockTests : t.accessAllCourses))
          .map(t => t.id);
      }
    }

    onChange(newVal, calculatedAllowedIds);

    // Bidirectional sync with Membership & Access catalog
    if (courseId) {
      try {
        if (isMockTest) {
          await syncMockTestTierAccess(courseId, [newVal]);
        } else {
          await syncCourseTierAccess(courseId, [newVal]);
        }
      } catch (err) {
        console.warn("Auto-sync error in CourseAccessTierPicker:", err);
      }
    }
  };

  // Find currently active tier object
  const currentTierObj = tiers.find(t => 
    t.name.toLowerCase() === selectedTierName.toLowerCase() ||
    (selectedTierName.toLowerCase().includes("free") && t.isDefaultFreeTier)
  ) || tiers.find(t => t.isDefaultFreeTier) || tiers[0];

  const isFreeLevel = currentTierObj?.isDefaultFreeTier || currentTierObj?.price === 0 || selectedTierName.toLowerCase().includes("free");

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#00a8cc]" />
          {label}
        </label>
        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> Synchronized with Memberships & Access
        </span>
      </div>

      {/* Styled Dropdown Select */}
      <div className="relative">
        <select
          disabled={disabled}
          value={selectedTierName}
          onChange={(e) => handleDropdownChange(e.target.value)}
          className={`w-full h-12 pl-4 pr-10 rounded-2xl border font-bold text-xs transition-all outline-none cursor-pointer appearance-none bg-white dark:bg-slate-900 ${
            isFreeLevel
              ? "border-emerald-300 dark:border-emerald-700/60 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20"
              : "border-sky-300 dark:border-sky-700/60 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-slate-400"}`}
        >
          {tiers.map((tier) => {
            const isFree = tier.isDefaultFreeTier || tier.price === 0;
            const priceTag = isFree ? "Free for All Candidates" : (tier.priceDisplay || `$${tier.price}/mo`);
            return (
              <option 
                key={`opt-tier-${tier.id}`} 
                value={tier.name}
                className="py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
              >
                {tier.name} — ({priceTag}) {isFree ? "🌟 Default Free Access" : ""}
              </option>
            );
          })}
        </select>
        
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Live Sync Status Banner */}
      <div className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
        isFreeLevel 
          ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" 
          : "bg-sky-50/70 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40"
      }`}>
        <div className="flex items-start gap-2.5">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isFreeLevel ? "bg-emerald-500 text-white" : "bg-[#00a8cc] text-white"
          }`}>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Assigned Tier: <span className={isFreeLevel ? "text-emerald-700 dark:text-emerald-300" : "text-[#00a8cc]"}>{currentTierObj?.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {isFreeLevel
                ? "This course is marked Free and is automatically accessible under Free Access in the Membership & Access manager."
                : `Candidates with "${currentTierObj?.name}" or higher tier memberships will have full access.`}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
            isFreeLevel 
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200" 
              : "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-200"
          }`}>
            {currentTierObj?.priceDisplay || "Free"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseAccessTierPicker;
