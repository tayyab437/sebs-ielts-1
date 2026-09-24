import { supabase } from "./supabaseClient";
import { safeGetItemAndParse, safeSetItem } from "./safeStorage";

export interface MembershipTier {
  id: string; // e.g. "free-trial", "pro-scholar", "mastery-ultimate"
  name: string; // "Free Trial", "Pro Scholar", "Mastery Ultimate"
  slug: string;
  tagline: string;
  description: string;
  price: number;
  priceDisplay: string; // "Free", "$49/mo", "PKR 25,000"
  billingCycle: "free" | "monthly" | "quarterly" | "yearly" | "lifetime";
  isDefaultFreeTier: boolean;
  isActive: boolean;
  badgeColor: string; // Tailwind class combo for badge
  accentColor: string; // Hex or theme color
  sortOrder: number;

  // Granular Course Access Controls
  accessAllCourses: boolean;
  allowedCourseIds: string[]; // Specific course IDs or slugs

  // Granular Mock Tests Access Controls
  accessAllMockTests: boolean;
  allowedMockTestIds: string[]; // Specific test IDs or slugs (e.g. "ielts-mock-2024-academic-01")
  allowedTestCategories: ("Academic" | "General Training" | "All")[];

  // Granular Practice Modules & Special Privileges
  accessAllPractice: boolean;
  allowedPracticeModules: ("writing" | "speaking" | "reading" | "listening" | "quizzes")[];
  
  // Feature Privileges
  hasAiEvaluation: boolean;
  hasLiveMeetings: boolean;
  hasCertificates: boolean;
  hasDownloadMaterials: boolean;
  hasPrioritySupport: boolean;

  // Marketing Bullet Points
  features: string[];

  created_at: string;
  updated_at: string;
}

export interface UserMembershipAssignment {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  tierId: string;
  tierName: string;
  status: "active" | "expired" | "canceled" | "trial";
  assignedAt: string;
  expiresAt?: string | null; // null = lifetime
  assignedBy?: string; // admin user or system
  notes?: string;
}

export const DEFAULT_MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "free-trial",
    name: "Free Trial Tier",
    slug: "free-trial",
    tagline: "Explore core sample IELTS mock tests and introductory lectures",
    description: "Standard free access granted to all newly registered candidate accounts.",
    price: 0,
    priceDisplay: "Free",
    billingCycle: "free",
    isDefaultFreeTier: true,
    isActive: true,
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300",
    accentColor: "#64748b",
    sortOrder: 1,
    accessAllCourses: false,
    allowedCourseIds: [],
    accessAllMockTests: false,
    allowedMockTestIds: [],
    allowedTestCategories: ["Academic", "General Training"],
    accessAllPractice: false,
    allowedPracticeModules: ["writing", "reading"],
    hasAiEvaluation: false,
    hasLiveMeetings: false,
    hasCertificates: false,
    hasDownloadMaterials: false,
    hasPrioritySupport: false,
    features: [
      "Access to Free Sample Mock Tests",
      "Introductory IELTS Strategy Masterclasses",
      "Instant Automated Answer Key Checking",
      "Candidate Profile & Band Goal Setting"
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "pro-scholar",
    name: "Pro Scholar",
    slug: "pro-scholar",
    tagline: "Comprehensive test suite with AI grading & full practice packs",
    description: "Designed for serious candidates aiming for Band 7.5 to 8.5 in Academic or GT.",
    price: 49,
    priceDisplay: "$49 / month",
    billingCycle: "monthly",
    isDefaultFreeTier: false,
    isActive: true,
    badgeColor: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300",
    accentColor: "#00a8cc",
    sortOrder: 2,
    accessAllCourses: true,
    allowedCourseIds: [],
    accessAllMockTests: true,
    allowedMockTestIds: [],
    allowedTestCategories: ["Academic", "General Training", "All"],
    accessAllPractice: true,
    allowedPracticeModules: ["writing", "speaking", "reading", "listening", "quizzes"],
    hasAiEvaluation: true,
    hasLiveMeetings: false,
    hasCertificates: true,
    hasDownloadMaterials: true,
    hasPrioritySupport: false,
    features: [
      "All Authentic 2024-2028 Mock Examinations",
      "Unlimited Computerized Split-Screen Tests",
      "Instant AI Essay Band Scoring & Grammar Feedback",
      "Audio Recordings Transcripts & Answer Keys",
      "Course Completion Digital Certificate"
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "mastery-ultimate",
    name: "Mastery Ultimate",
    slug: "mastery-ultimate",
    tagline: "Complete unrestricted all-access pass to all courses, media & live classes",
    description: "Full institutional tier with live interactive rooms, 1-on-1 speaking, and full catalog.",
    price: 129,
    priceDisplay: "$129 / month",
    billingCycle: "monthly",
    isDefaultFreeTier: false,
    isActive: true,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
    accentColor: "#f59e0b",
    sortOrder: 3,
    accessAllCourses: true,
    allowedCourseIds: [],
    accessAllMockTests: true,
    allowedMockTestIds: [],
    allowedTestCategories: ["Academic", "General Training", "All"],
    accessAllPractice: true,
    allowedPracticeModules: ["writing", "speaking", "reading", "listening", "quizzes"],
    hasAiEvaluation: true,
    hasLiveMeetings: true,
    hasCertificates: true,
    hasDownloadMaterials: true,
    hasPrioritySupport: true,
    features: [
      "Unrestricted Access to ALL Courses & Media Suites",
      "Unlimited Mock Examinations & Diagnostics",
      "AI Conversation Coach Clara Real-Time Voice",
      "Interactive Google Meet & Live Cohorts Access",
      "Official Verified Accredited Certificate with QR Code",
      "1-on-1 Teacher Feedback & Priority Assessment"
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  }
];

const STORAGE_KEY_TIERS = "sebs_membership_tiers";
const STORAGE_KEY_ASSIGNMENTS = "sebs_user_memberships";

/**
 * Fetches all membership tiers, fallback to defaults
 */
export async function fetchMembershipTiers(): Promise<MembershipTier[]> {
  try {
    // 1. Check database if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("membership_tiers")
          .select("*")
          .order("sortOrder", { ascending: true });
        
        if (!error && data && data.length > 0) {
          safeSetItem(STORAGE_KEY_TIERS, JSON.stringify(data));
          return data as MembershipTier[];
        }
      } catch {}
    }

    // 2. Check local storage
    const local = safeGetItemAndParse<MembershipTier[]>(STORAGE_KEY_TIERS, []);
    if (local && local.length > 0) {
      return local;
    }
  } catch (e) {
    console.warn("Could not fetch membership tiers:", e);
  }

  // Fallback to default tiers
  safeSetItem(STORAGE_KEY_TIERS, JSON.stringify(DEFAULT_MEMBERSHIP_TIERS));
  return DEFAULT_MEMBERSHIP_TIERS;
}

/**
 * Saves or updates a membership tier and synchronizes associated courses
 */
export async function saveMembershipTier(tier: MembershipTier): Promise<MembershipTier[]> {
  const tiers = await fetchMembershipTiers();
  const existingIdx = tiers.findIndex(t => t.id === tier.id);
  
  const updatedTier: MembershipTier = {
    ...tier,
    updated_at: new Date().toISOString(),
  };

  let newTiers: MembershipTier[];
  if (existingIdx >= 0) {
    newTiers = [...tiers];
    // If setting as default free tier, unset others
    if (updatedTier.isDefaultFreeTier) {
      newTiers = newTiers.map(t => ({
        ...t,
        isDefaultFreeTier: t.id === updatedTier.id
      }));
    }
    newTiers[existingIdx] = updatedTier;
  } else {
    // If setting as default free tier, unset others
    if (updatedTier.isDefaultFreeTier) {
      newTiers = tiers.map(t => ({ ...t, isDefaultFreeTier: false }));
    } else {
      newTiers = [...tiers];
    }
    newTiers.push(updatedTier);
  }

  safeSetItem(STORAGE_KEY_TIERS, JSON.stringify(newTiers));

  // Sync to database if available
  if (supabase) {
    try {
      await supabase.from("membership_tiers").upsert(updatedTier);
    } catch (e) {
      console.warn("Could not sync membership tier to Supabase:", e);
    }
  }

  // Synchronize courses and mock tests assigned to this tier
  try {
    const isFreeTier = Boolean(updatedTier.isDefaultFreeTier || updatedTier.price === 0);
    const tierAccessLabel = isFreeTier ? (updatedTier.name || "Free Trial Tier") : updatedTier.name;
    const allowedIds = Array.isArray(updatedTier.allowedCourseIds) ? updatedTier.allowedCourseIds : [];
    const allowedTestIds = Array.isArray(updatedTier.allowedMockTestIds) ? updatedTier.allowedMockTestIds : [];

    // Find fallback paid tier name if courses are removed from free tier
    const fallbackPaidTier = newTiers.find(t => !t.isDefaultFreeTier && t.price > 0)?.name || "Pro Scholar";

    // 1. Update localStorage courses
    const localCourses = safeGetItemAndParse<any[]>("mock_courses", []);
    let modifiedCourses = false;
    const syncedLocalCourses = localCourses.map(c => {
      const isIncluded = allowedIds.some(id => String(id).toLowerCase() === String(c.id).toLowerCase());
      if (isIncluded) {
        modifiedCourses = true;
        return {
          ...c,
          access_tier: tierAccessLabel,
          is_free: isFreeTier
        };
      } else if (isFreeTier) {
        // If this course was removed from the free tier and had a free tag, reassign it to paid tier
        const currentLabel = String(c.access_tier || "").toLowerCase();
        if (currentLabel.includes("free") || c.is_free === true) {
          modifiedCourses = true;
          return {
            ...c,
            access_tier: fallbackPaidTier,
            is_free: false
          };
        }
      }
      return c;
    });

    if (modifiedCourses) {
      safeSetItem("mock_courses", JSON.stringify(syncedLocalCourses));
      safeSetItem("designer_courses", JSON.stringify(syncedLocalCourses));
    }

    // 2. Update localStorage mock tests
    const localTests = safeGetItemAndParse<any[]>("mock_tests", []);
    let modifiedTests = false;
    const syncedLocalTests = localTests.map(t => {
      const isIncluded = allowedTestIds.some(id => String(id).toLowerCase() === String(t.id).toLowerCase());
      if (isIncluded) {
        modifiedTests = true;
        return {
          ...t,
          access_tier: tierAccessLabel,
          is_free: isFreeTier
        };
      } else if (isFreeTier) {
        const currentLabel = String(t.access_tier || "").toLowerCase();
        if (currentLabel.includes("free") || t.is_free === true) {
          modifiedTests = true;
          return {
            ...t,
            access_tier: fallbackPaidTier,
            is_free: false
          };
        }
      }
      return t;
    });

    if (modifiedTests) {
      safeSetItem("mock_tests", JSON.stringify(syncedLocalTests));
    }

    // 3. Update Supabase courses and tests if available
    if (supabase) {
      if (allowedIds.length > 0) {
        for (const cId of allowedIds) {
          await supabase
            .from("courses")
            .update({ 
              access_tier: tierAccessLabel,
              is_free: isFreeTier 
            })
            .eq("id", cId);
        }
      }
      if (allowedTestIds.length > 0) {
        for (const tId of allowedTestIds) {
          await supabase
            .from("mock_tests")
            .update({ 
              access_tier: tierAccessLabel,
              is_free: isFreeTier 
            })
            .eq("id", tId);
        }
      }
    }
  } catch (syncCourseErr) {
    console.warn("Notice: Content sync from membership tier:", syncCourseErr);
  }

  window.dispatchEvent(new Event("sebs_memberships_updated"));
  window.dispatchEvent(new Event("sebs_course_updated"));
  return newTiers;
}

/**
 * Deletes a membership tier
 */
export async function deleteMembershipTier(tierId: string): Promise<MembershipTier[]> {
  const tiers = await fetchMembershipTiers();
  const filtered = tiers.filter(t => t.id !== tierId);
  
  safeSetItem(STORAGE_KEY_TIERS, JSON.stringify(filtered));

  if (supabase) {
    try {
      await supabase.from("membership_tiers").delete().eq("id", tierId);
    } catch (e) {
      console.warn("Could not delete membership tier from Supabase:", e);
    }
  }

  window.dispatchEvent(new Event("sebs_memberships_updated"));
  return filtered;
}

/**
 * Fetches all user membership assignments
 */
export async function fetchUserMembershipAssignments(): Promise<UserMembershipAssignment[]> {
  try {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("user_memberships")
          .select("*");
        if (!error && data && data.length > 0) {
          safeSetItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(data));
          return data as UserMembershipAssignment[];
        }
      } catch {}
    }

    const local = safeGetItemAndParse<UserMembershipAssignment[]>(STORAGE_KEY_ASSIGNMENTS, []);
    return local || [];
  } catch (e) {
    console.warn("Could not fetch user memberships:", e);
    return [];
  }
}

/**
 * Assigns or updates a user's membership tier
 */
export async function assignUserMembership(
  userId: string,
  userEmail: string,
  tierId: string,
  options?: {
    userName?: string;
    expiresAt?: string | null;
    notes?: string;
    assignedBy?: string;
  }
): Promise<UserMembershipAssignment> {
  const tiers = await fetchMembershipTiers();
  const targetTier = tiers.find(t => t.id === tierId) || tiers[0] || DEFAULT_MEMBERSHIP_TIERS[0];

  const assignments = await fetchUserMembershipAssignments();
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  
  const existingIdx = assignments.findIndex(
    a => (a.userId && a.userId === userId) || (a.userEmail && a.userEmail.toLowerCase() === cleanEmail)
  );

  const assignmentRecord: UserMembershipAssignment = {
    id: existingIdx >= 0 ? assignments[existingIdx].id : `assign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userEmail: cleanEmail,
    userName: options?.userName || (existingIdx >= 0 ? assignments[existingIdx].userName : "Student"),
    tierId: targetTier.id,
    tierName: targetTier.name,
    status: "active",
    assignedAt: new Date().toISOString(),
    expiresAt: options?.expiresAt !== undefined ? options.expiresAt : null,
    assignedBy: options?.assignedBy || "Administrator",
    notes: options?.notes || "Assigned by Administrator"
  };

  let newAssignments: UserMembershipAssignment[];
  if (existingIdx >= 0) {
    newAssignments = [...assignments];
    newAssignments[existingIdx] = assignmentRecord;
  } else {
    newAssignments = [assignmentRecord, ...assignments];
  }

  safeSetItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(newAssignments));

  // Sync to local student profile if current active user
  try {
    const currentProfile = safeGetItemAndParse<any>("student_profile", null);
    if (currentProfile && (currentProfile.id === userId || currentProfile.email?.toLowerCase() === cleanEmail)) {
      currentProfile.plan = targetTier.name;
      currentProfile.membership_tier_id = targetTier.id;
      currentProfile.membership_expires_at = assignmentRecord.expiresAt;
      safeSetItem("student_profile", JSON.stringify(currentProfile));
    }
  } catch {}

  // Sync to database profiles/user_memberships
  if (supabase) {
    try {
      await supabase.from("user_memberships").upsert(assignmentRecord);
      if (userId) {
        await supabase.from("profiles").update({
          plan: targetTier.name,
          membership_tier_id: targetTier.id,
          membership_expires_at: assignmentRecord.expiresAt
        }).eq("id", userId);
      }
    } catch (e) {
      console.warn("Could not sync user membership to Supabase:", e);
    }
  }

  window.dispatchEvent(new CustomEvent("sebs_user_membership_changed", { detail: assignmentRecord }));
  window.dispatchEvent(new Event("storage"));
  return assignmentRecord;
}

/**
 * Retrieves the active membership tier for a given user or userProfile
 */
export function getUserActiveMembershipTier(
  userProfile?: any,
  tiers: MembershipTier[] = DEFAULT_MEMBERSHIP_TIERS
): MembershipTier {
  if (!tiers || tiers.length === 0) tiers = DEFAULT_MEMBERSHIP_TIERS;
  
  const defaultTier = tiers.find(t => t.isDefaultFreeTier) || tiers[0] || DEFAULT_MEMBERSHIP_TIERS[0];
  if (!userProfile) return defaultTier;

  // Admin or teacher roles have master unrestricted access
  if (userProfile.role === "admin" || userProfile.role === "teacher" || userProfile.role === "super_admin") {
    return {
      ...DEFAULT_MEMBERSHIP_TIERS[2], // Mastery Ultimate privileges
      id: "admin-unlimited",
      name: "Administrator Unlimited",
      accessAllCourses: true,
      accessAllMockTests: true,
      accessAllPractice: true,
      hasAiEvaluation: true,
      hasLiveMeetings: true,
      hasCertificates: true,
      hasDownloadMaterials: true,
      hasPrioritySupport: true
    };
  }

  const tierId = userProfile.membership_tier_id;
  const planName = (userProfile.plan || "").toLowerCase();

  if (tierId) {
    const matched = tiers.find(t => t.id === tierId);
    if (matched) return matched;
  }

  if (planName) {
    if (planName.includes("mastery") || planName.includes("ultimate")) {
      const matched = tiers.find(t => t.id === "mastery-ultimate" || t.name.toLowerCase().includes("mastery"));
      if (matched) return matched;
    }
    if (planName.includes("pro") || planName.includes("premium") || planName.includes("scholar")) {
      const matched = tiers.find(t => t.id === "pro-scholar" || t.name.toLowerCase().includes("pro"));
      if (matched) return matched;
    }
  }

  return defaultTier;
}

/**
 * Synchronizes a course's access across all membership tiers
 */
export async function syncCourseTierAccess(
  courseId: string,
  targetTierIdsOrNames: string[]
): Promise<MembershipTier[]> {
  if (!courseId) return await fetchMembershipTiers();
  
  const tiers = await fetchMembershipTiers();
  const normalizedTargets = targetTierIdsOrNames.map(t => t.toLowerCase().trim());
  
  const isFreeOrAll = normalizedTargets.some(t => 
    t === "free" || t === "free trial" || t === "free-trial" || t === "all" || t === "everyone"
  );

  const updatedTiers = tiers.map(tier => {
    // If the tier grants master access to all courses, it already covers it
    if (tier.accessAllCourses) {
      return tier;
    }

    const tierIdMatch = normalizedTargets.includes(tier.id.toLowerCase());
    const tierNameMatch = normalizedTargets.includes(tier.name.toLowerCase());
    const tierSlugMatch = tier.slug ? normalizedTargets.includes(tier.slug.toLowerCase()) : false;
    const shouldHaveAccess = isFreeOrAll || tierIdMatch || tierNameMatch || tierSlugMatch;

    const currentAllowed = Array.isArray(tier.allowedCourseIds) ? tier.allowedCourseIds : [];
    const exists = currentAllowed.some(id => id.toLowerCase() === courseId.toLowerCase());

    if (shouldHaveAccess && !exists) {
      return {
        ...tier,
        allowedCourseIds: [...currentAllowed, courseId],
        updated_at: new Date().toISOString()
      };
    } else if (!shouldHaveAccess && exists) {
      return {
        ...tier,
        allowedCourseIds: currentAllowed.filter(id => id.toLowerCase() !== courseId.toLowerCase()),
        updated_at: new Date().toISOString()
      };
    }

    return tier;
  });

  safeSetItem(STORAGE_KEY_TIERS, JSON.stringify(updatedTiers));

  // Sync to database if available
  if (supabase) {
    try {
      for (const tier of updatedTiers) {
        await supabase.from("membership_tiers").upsert(tier);
      }
    } catch (e) {
      console.warn("Could not sync updated tier course access to Supabase:", e);
    }
  }

  // Also ensure course record in mock_courses / Supabase has the exact matching access_tier label
  try {
    const matchedTier = tiers.find(t => 
      normalizedTargets.includes(t.id.toLowerCase()) || 
      normalizedTargets.includes(t.name.toLowerCase()) ||
      (t.isDefaultFreeTier && isFreeOrAll)
    );
    const assignedLabel = matchedTier ? matchedTier.name : (isFreeOrAll ? "Free Trial Tier" : targetTierIdsOrNames[0] || "Free Trial Tier");
    const isFree = isFreeOrAll || Boolean(matchedTier?.isDefaultFreeTier);

    const localCourses = safeGetItemAndParse<any[]>("mock_courses", []);
    const updatedLocal = localCourses.map(c => {
      if (String(c.id).toLowerCase() === String(courseId).toLowerCase()) {
        return { ...c, access_tier: assignedLabel, is_free: isFree };
      }
      return c;
    });
    safeSetItem("mock_courses", JSON.stringify(updatedLocal));
    safeSetItem("designer_courses", JSON.stringify(updatedLocal));

    if (supabase) {
      await supabase
        .from("courses")
        .update({ access_tier: assignedLabel, is_free: isFree })
        .eq("id", courseId);
    }
  } catch (cErr) {
    console.warn("Notice: Course record sync in syncCourseTierAccess:", cErr);
  }

  window.dispatchEvent(new Event("sebs_memberships_updated"));
  window.dispatchEvent(new Event("sebs_course_updated"));
  return updatedTiers;
}

/**
 * Synchronizes a mock test's access across all membership tiers
 */
export async function syncMockTestTierAccess(
  testId: string,
  targetTierIdsOrNames: string[]
): Promise<MembershipTier[]> {
  if (!testId) return await fetchMembershipTiers();

  const tiers = await fetchMembershipTiers();
  const normalizedTargets = targetTierIdsOrNames.map(t => t.toLowerCase().trim());

  const isFreeOrAll = normalizedTargets.some(t => 
    t === "free" || t === "free trial" || t === "free-trial" || t === "all" || t === "everyone"
  );

  const updatedTiers = tiers.map(tier => {
    if (tier.accessAllMockTests) {
      return tier;
    }

    const tierIdMatch = normalizedTargets.includes(tier.id.toLowerCase());
    const tierNameMatch = normalizedTargets.includes(tier.name.toLowerCase());
    const tierSlugMatch = tier.slug ? normalizedTargets.includes(tier.slug.toLowerCase()) : false;
    const shouldHaveAccess = isFreeOrAll || tierIdMatch || tierNameMatch || tierSlugMatch;

    const currentAllowed = Array.isArray(tier.allowedMockTestIds) ? tier.allowedMockTestIds : [];
    const exists = currentAllowed.some(id => id.toLowerCase() === testId.toLowerCase());

    if (shouldHaveAccess && !exists) {
      return {
        ...tier,
        allowedMockTestIds: [...currentAllowed, testId],
        updated_at: new Date().toISOString()
      };
    } else if (!shouldHaveAccess && exists) {
      return {
        ...tier,
        allowedMockTestIds: currentAllowed.filter(id => id.toLowerCase() !== testId.toLowerCase()),
        updated_at: new Date().toISOString()
      };
    }

    return tier;
  });

  safeSetItem(STORAGE_KEY_TIERS, JSON.stringify(updatedTiers));

  if (supabase) {
    try {
      for (const tier of updatedTiers) {
        await supabase.from("membership_tiers").upsert(tier);
      }
    } catch (e) {
      console.warn("Could not sync updated tier mock test access to Supabase:", e);
    }
  }

  window.dispatchEvent(new Event("sebs_memberships_updated"));
  return updatedTiers;
}

/**
 * Gets tier IDs that currently grant access to a specific course
 */
export function getTiersForCourse(
  courseId: string,
  courseObj?: any,
  tiers: MembershipTier[] = DEFAULT_MEMBERSHIP_TIERS
): { tiers: MembershipTier[]; tierIds: string[]; isFreeForAll: boolean } {
  const matchingTiers: MembershipTier[] = [];
  const matchingIds: string[] = [];

  const rawAccessTier = (courseObj?.access_tier || "").toLowerCase();
  const allowedTiersArray: string[] = Array.isArray(courseObj?.allowed_tiers)
    ? courseObj.allowed_tiers.map((s: any) => String(s).toLowerCase())
    : [];

  const isFree = 
    courseObj?.is_free === true ||
    rawAccessTier === "free trial" ||
    rawAccessTier === "free" ||
    rawAccessTier === "free-trial" ||
    rawAccessTier === "everyone" ||
    courseObj?.price === 0;

  for (const tier of tiers) {
    const isGranted = 
      isFree ||
      tier.accessAllCourses ||
      (tier.allowedCourseIds && tier.allowedCourseIds.some(id => id.toLowerCase() === courseId.toLowerCase())) ||
      (rawAccessTier && (rawAccessTier === tier.id.toLowerCase() || rawAccessTier === tier.name.toLowerCase() || (tier.slug && rawAccessTier === tier.slug.toLowerCase()))) ||
      allowedTiersArray.includes(tier.id.toLowerCase()) ||
      allowedTiersArray.includes(tier.name.toLowerCase());

    if (isGranted) {
      matchingTiers.push(tier);
      matchingIds.push(tier.id);
    }
  }

  return {
    tiers: matchingTiers,
    tierIds: matchingIds,
    isFreeForAll: isFree
  };
}

/**
 * Access Verifiers
 */
export function canAccessCourse(
  courseId: string,
  userProfile: any,
  tiers?: MembershipTier[],
  courseObj?: any
): {
  granted: boolean;
  reason?: string;
  requiredTier?: string;
} {
  // Master override for admins/teachers ONLY IF NOT deliberately evaluating candidate/student plan
  if (!userProfile?.forcePlanCheck && (userProfile?.role === "admin" || userProfile?.role === "teacher" || userProfile?.role === "super_admin")) {
    return { granted: true };
  }

  const allTiers = tiers && tiers.length > 0 ? tiers : DEFAULT_MEMBERSHIP_TIERS;
  const userTier = getUserActiveMembershipTier(userProfile, allTiers);
  const isUserFreeTier = Boolean(userTier.isDefaultFreeTier || userTier.price === 0);

  // 1. If user's tier has blanket access to ALL courses (e.g. Mastery Ultimate)
  if (userTier.accessAllCourses) {
    return { granted: true };
  }

  // 2. If this course is explicitly in the user's tier allowed list
  if (courseId && Array.isArray(userTier.allowedCourseIds)) {
    const isExplicitlyAllowedInTier = userTier.allowedCourseIds.some(
      id => String(id).toLowerCase() === String(courseId).toLowerCase()
    );
    if (isExplicitlyAllowedInTier) {
      return { granted: true };
    }
  }

  // 3. For users on a Free Tier:
  // If not granted by accessAllCourses or allowedCourseIds above, free tier CANNOT access it!
  if (isUserFreeTier) {
    return {
      granted: false,
      reason: `This course is not included in the ${userTier.name || "Free Trial"} membership. Please upgrade to access.`,
      requiredTier: courseObj?.access_tier || "Pro Scholar"
    };
  }

  // 4. For Paid tiers, evaluate course's required access tier / compatibility
  const rawAccessTier = String(courseObj?.access_tier || "").toLowerCase().trim();
  if (rawAccessTier) {
    const isDirectTierMatch = 
      rawAccessTier === userTier.id.toLowerCase() ||
      rawAccessTier === userTier.name.toLowerCase() ||
      (userTier.slug && rawAccessTier === userTier.slug.toLowerCase());

    if (isDirectTierMatch) {
      return { granted: true };
    }

    // Rank-based compatibility: Mastery Ultimate gets access to Pro Scholar / Pro Premium
    const userPlanName = (userTier.name || userProfile?.plan || "").toLowerCase();
    if (
      (userPlanName.includes("mastery") || userPlanName.includes("ultimate")) &&
      (rawAccessTier.includes("pro") || rawAccessTier.includes("scholar") || rawAccessTier.includes("premium"))
    ) {
      return { granted: true };
    }
  }

  // 5. Check course's allowed_tiers array if any
  if (courseObj?.allowed_tiers && Array.isArray(courseObj.allowed_tiers)) {
    const allowedTiers = courseObj.allowed_tiers.map((t: any) => String(t).toLowerCase());
    if (
      allowedTiers.includes(userTier.id.toLowerCase()) ||
      allowedTiers.includes(userTier.name.toLowerCase()) ||
      (userTier.slug && allowedTiers.includes(userTier.slug.toLowerCase()))
    ) {
      return { granted: true };
    }
  }

  return {
    granted: false,
    reason: `This course requires an upgraded membership level (${userTier.name} does not include access).`,
    requiredTier: courseObj?.access_tier || "Pro Scholar"
  };
}

export function canAccessMockTest(
  testId: string,
  category: string = "Academic",
  userProfile: any,
  tiers?: MembershipTier[],
  testObj?: any
): {
  granted: boolean;
  reason?: string;
  requiredTier?: string;
} {
  if (!userProfile?.forcePlanCheck && (userProfile?.role === "admin" || userProfile?.role === "teacher" || userProfile?.role === "super_admin")) {
    return { granted: true };
  }

  const allTiers = tiers && tiers.length > 0 ? tiers : DEFAULT_MEMBERSHIP_TIERS;
  const userTier = getUserActiveMembershipTier(userProfile, allTiers);
  const isUserFreeTier = Boolean(userTier.isDefaultFreeTier || userTier.price === 0);

  // 1. Blanket access
  if (userTier.accessAllMockTests) {
    return { granted: true };
  }

  // 2. Explicitly in tier's allowed list
  if (testId && Array.isArray(userTier.allowedMockTestIds)) {
    const isExplicitlyAllowedInTier = userTier.allowedMockTestIds.some(
      id => String(id).toLowerCase() === String(testId).toLowerCase()
    );
    if (isExplicitlyAllowedInTier) {
      return { granted: true };
    }
  }

  // 3. For users on Free Tier:
  if (isUserFreeTier) {
    return {
      granted: false,
      reason: `Full authentic mock examination is not included in ${userTier.name || "Free Trial"}. Please upgrade to access.`,
      requiredTier: testObj?.access_tier || "Pro Scholar"
    };
  }

  // 4. Paid tier compatibility
  const rawAccessTier = String(testObj?.access_tier || "").toLowerCase().trim();
  if (rawAccessTier) {
    if (
      rawAccessTier === userTier.id.toLowerCase() ||
      rawAccessTier === userTier.name.toLowerCase() ||
      (userTier.slug && rawAccessTier === userTier.slug.toLowerCase())
    ) {
      return { granted: true };
    }

    const userPlanName = (userTier.name || userProfile?.plan || "").toLowerCase();
    if (
      (userPlanName.includes("mastery") || userPlanName.includes("ultimate")) &&
      (rawAccessTier.includes("pro") || rawAccessTier.includes("scholar") || rawAccessTier.includes("premium"))
    ) {
      return { granted: true };
    }
  }

  if (testObj?.allowed_tiers && Array.isArray(testObj.allowed_tiers)) {
    const allowedTiers = testObj.allowed_tiers.map((t: any) => String(t).toLowerCase());
    if (
      allowedTiers.includes(userTier.id.toLowerCase()) ||
      allowedTiers.includes(userTier.name.toLowerCase()) ||
      (userTier.slug && allowedTiers.includes(userTier.slug.toLowerCase()))
    ) {
      return { granted: true };
    }
  }

  return {
    granted: false,
    reason: `Authentic full examination paper requires an upgraded membership level.`,
    requiredTier: testObj?.access_tier || "Pro Scholar"
  };
}

export function canAccessPracticeModule(
  moduleType: "writing" | "speaking" | "reading" | "listening" | "quizzes",
  userProfile: any,
  tiers?: MembershipTier[]
): {
  granted: boolean;
  reason?: string;
  requiredTier?: string;
} {
  const tier = getUserActiveMembershipTier(userProfile, tiers);
  
  if (tier.accessAllPractice) {
    return { granted: true };
  }

  if (tier.allowedPracticeModules && tier.allowedPracticeModules.includes(moduleType)) {
    return { granted: true };
  }

  return {
    granted: false,
    reason: `This practice module is part of the Pro Scholar syllabus.`,
    requiredTier: "Pro Scholar"
  };
}
