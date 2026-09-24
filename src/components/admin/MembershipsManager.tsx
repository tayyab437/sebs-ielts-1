import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Crown,
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  Layout,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  CreditCard,
  Video,
  Award,
  FileText,
  AlertCircle,
  ChevronRight,
  Info,
  RefreshCw,
  Clock,
  Zap,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MembershipTier,
  UserMembershipAssignment,
  DEFAULT_MEMBERSHIP_TIERS,
  fetchMembershipTiers,
  saveMembershipTier,
  deleteMembershipTier,
  fetchUserMembershipAssignments,
  assignUserMembership
} from "@/src/lib/membershipService";
import { safeGetItemAndParse } from "@/src/lib/safeStorage";
import { fetchAllMediaCourses, mergeCoursesWithMedia } from "@/src/lib/mediaCourseAdapter";
import { supabase } from "@/src/lib/supabaseClient";

interface MembershipsManagerProps {
  allCoursesList?: any[];
  allMockTestsList?: any[];
  allUsersList?: any[];
}

export default function MembershipsManager({
  allCoursesList = [],
  allMockTestsList = [],
  allUsersList = []
}: MembershipsManagerProps) {
  // State
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserMembershipAssignment[]>([]);
  const [fetchedCourses, setFetchedCourses] = useState<any[]>([]);
  const [fetchedMockTests, setFetchedMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"tiers" | "assignments">("tiers");

  // Modal State for Tier Editing/Creation
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [editorSubTab, setEditorSubTab] = useState<"basic" | "courses" | "tests" | "features">("basic");

  // Modal State for Assigning User
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetUser, setAssignTargetUser] = useState<any>(null);
  const [selectedTierForAssign, setSelectedTierForAssign] = useState<string>("");
  const [assignExpiryType, setAssignExpiryType] = useState<"lifetime" | "custom">("lifetime");
  const [assignCustomExpiry, setAssignCustomExpiry] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState<string>("");
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Catalog Sources (Aggregating ONLY genuine courses from actual database & media suite)
  const catalogCourses = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    const addCourse = (c: any) => {
      if (!c) return;
      const cid = String(c.id || "").trim();
      if (!cid || seenIds.has(cid)) return;
      seenIds.add(cid);

      list.push({
        id: cid,
        title: c.title || c.name || "Untitled Course",
        type: c.type || c.course_type || c.category || "Curriculum",
        level: c.level || c.difficulty || "All Bands",
        isMediaCourse: Boolean(c.isMediaCourse)
      });
    };

    // 1. Merge passed courses from AdminDashboard
    if (Array.isArray(allCoursesList) && allCoursesList.length > 0) {
      allCoursesList.forEach(addCourse);
    }

    // 2. Merge dynamically fetched courses
    if (Array.isArray(fetchedCourses) && fetchedCourses.length > 0) {
      fetchedCourses.forEach(addCourse);
    }

    // 3. Merge local storage courses only if valid
    try {
      const local = safeGetItemAndParse<any[]>("mock_courses", []);
      if (Array.isArray(local)) {
        local.forEach(addCourse);
      }
    } catch {}

    return list;
  }, [allCoursesList, fetchedCourses]);

  // Catalog Sources (Aggregating ONLY genuine mock tests from examination desk & database)
  const catalogMockTests = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    const addTest = (t: any) => {
      if (!t) return;
      const tid = String(t.id || "").trim();
      if (!tid || seenIds.has(tid)) return;
      seenIds.add(tid);

      list.push({
        id: tid,
        title: t.name || t.title || "Full IELTS Mock Exam",
        category: t.exam_category || t.category || (String(t.title || t.name || "").includes("GT") || String(t.title || t.name || "").includes("General") ? "General Training" : "Academic"),
        year: t.test_year || t.year || "2026"
      });
    };

    // 1. Merge passed mock tests from AdminDashboard
    if (Array.isArray(allMockTestsList) && allMockTestsList.length > 0) {
      allMockTestsList.forEach(addTest);
    }

    // 2. Merge dynamically fetched mock tests
    if (Array.isArray(fetchedMockTests) && fetchedMockTests.length > 0) {
      fetchedMockTests.forEach(addTest);
    }

    // 3. Merge local storage mock tests only if valid
    try {
      const local = safeGetItemAndParse<any[]>("mock_tests", []);
      if (Array.isArray(local)) {
        local.forEach(addTest);
      }
    } catch {}

    return list;
  }, [allMockTestsList, fetchedMockTests]);

  // Combined Students / Users list
  const catalogUsers = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();

    if (Array.isArray(allUsersList) && allUsersList.length > 0) {
      allUsersList.forEach((u, idx) => {
        const uid = String(u.id || u.user_id || `user-raw-${idx}`).trim();
        const uemail = (u.email || u.user_email || `user-${idx}@candidate.com`).trim().toLowerCase();
        
        if (!seenIds.has(uid) && !seenEmails.has(uemail)) {
          seenIds.add(uid);
          seenEmails.add(uemail);
          list.push({
            id: uid,
            email: uemail,
            name: u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : (u.name || u.full_name || "Student"),
            plan: u.plan || "Free Trial Tier",
            role: u.role || "student",
            created_at: u.created_at || new Date().toISOString()
          });
        }
      });
    }

    // Merge from local assignments
    userAssignments.forEach((a, idx) => {
      const aid = String(a.userId || `assign-u-${idx}`).trim();
      const aemail = (a.userEmail || `user-assign-${idx}@candidate.com`).trim().toLowerCase();

      if (!seenIds.has(aid) && !seenEmails.has(aemail)) {
        seenIds.add(aid);
        seenEmails.add(aemail);
        list.push({
          id: aid,
          email: aemail,
          name: a.userName || "Student",
          plan: a.tierName,
          role: "student",
          created_at: a.assignedAt
        });
      }
    });

    // Default test users if empty
    if (list.length === 0) {
      list.push(
        { id: "usr-01", email: "candidate.scholar@example.com", name: "Ahmed Raza", plan: "Free Trial Tier", role: "student" },
        { id: "usr-02", email: "fatima.ielts@example.com", name: "Fatima Noor", plan: "Pro Scholar", role: "student" },
        { id: "usr-03", email: "tariq.academic@example.com", name: "Tariq Mahmood", plan: "Mastery Ultimate", role: "student" }
      );
    }

    return list;
  }, [allUsersList, userAssignments]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const loadedTiers = await fetchMembershipTiers();
      setTiers(loadedTiers);
      const loadedAssignments = await fetchUserMembershipAssignments();
      setUserAssignments(loadedAssignments);

      // 1. Fetch real courses & media courses
      try {
        const mediaCourses = await fetchAllMediaCourses();
        let dbCourses: any[] = [];
        try {
          const res = await fetch("/api/mysql/courses");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) dbCourses = data;
          }
        } catch (e) {}

        if (dbCourses.length === 0 && supabase) {
          try {
            const { data } = await supabase.from("courses").select("*");
            if (data && Array.isArray(data)) dbCourses = data;
          } catch (e) {}
        }
        const mergedCourses = mergeCoursesWithMedia(dbCourses, mediaCourses);
        setFetchedCourses(mergedCourses);
      } catch (e) {
        console.warn("Could not fetch extra courses for memberships:", e);
      }

      // 2. Fetch real mock tests
      try {
        let dbTests: any[] = [];
        try {
          const res = await fetch("/api/mysql/mock_tests");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) dbTests = data;
          }
        } catch (e) {}

        if (dbTests.length === 0 && supabase) {
          try {
            const { data } = await supabase.from("mock_tests").select("*");
            if (data && Array.isArray(data)) dbTests = data;
          } catch (e) {}
        }
        setFetchedMockTests(dbTests);
      } catch (e) {
        console.warn("Could not fetch extra mock tests for memberships:", e);
      }
    } catch (err) {
      console.error("Error loading memberships:", err);
      toast.error("Failed to load membership tiers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("sebs_memberships_updated", loadData);
    window.addEventListener("sebs_user_membership_changed", loadData);
    return () => {
      window.removeEventListener("sebs_memberships_updated", loadData);
      window.removeEventListener("sebs_user_membership_changed", loadData);
    };
  }, []);

  // Stats calculation
  const totalTiers = tiers.length;
  const defaultTier = tiers.find(t => t.isDefaultFreeTier) || tiers[0];
  const paidTiersCount = tiers.filter(t => t.price > 0).length;

  // Actions: Create New Tier
  const handleOpenCreateTier = () => {
    const newTier: MembershipTier = {
      id: `tier-${Date.now()}`,
      name: "New Membership Level",
      slug: `tier-${Date.now()}`,
      tagline: "Custom access tier for specific candidate cohorts",
      description: "Define custom courses, tests, and module permissions for this level.",
      price: 29,
      priceDisplay: "$29 / month",
      billingCycle: "monthly",
      isDefaultFreeTier: false,
      isActive: true,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
      accentColor: "#6366f1",
      sortOrder: tiers.length + 1,
      accessAllCourses: false,
      allowedCourseIds: [],
      accessAllMockTests: false,
      allowedMockTestIds: [],
      allowedTestCategories: ["Academic", "General Training"],
      accessAllPractice: true,
      allowedPracticeModules: ["writing", "reading", "speaking", "listening"],
      hasAiEvaluation: true,
      hasLiveMeetings: false,
      hasCertificates: true,
      hasDownloadMaterials: true,
      hasPrioritySupport: false,
      features: [
        "Curated IELTS Course Syllabus",
        "Timed Computerized Mock Tests",
        "Instant Automated Score Breakdown",
        "Student Progress Tracking"
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingTier(newTier);
    setEditorSubTab("basic");
    setIsEditorOpen(true);
  };

  // Actions: Edit Existing Tier
  const handleOpenEditTier = (tier: MembershipTier) => {
    setEditingTier({ 
      ...tier, 
      allowedCourseIds: Array.isArray(tier.allowedCourseIds) ? [...tier.allowedCourseIds] : [],
      allowedMockTestIds: Array.isArray(tier.allowedMockTestIds) ? [...tier.allowedMockTestIds] : []
    });
    setEditorSubTab("basic");
    setIsEditorOpen(true);
  };

  // Actions: Save Tier Changes
  const handleSaveTier = async () => {
    if (!editingTier) return;
    if (!editingTier.name.trim()) {
      toast.error("Membership Level name is required.");
      return;
    }

    try {
      const updated = await saveMembershipTier(editingTier);
      setTiers(updated);
      setIsEditorOpen(false);
      setEditingTier(null);
      toast.success(`Membership Level "${editingTier.name}" saved successfully!`);
    } catch (e) {
      toast.error("Failed to save membership tier.");
    }
  };

  // Actions: Set as Default Free Tier
  const handleSetDefaultFreeTier = async (tier: MembershipTier) => {
    try {
      const updatedTier = { ...tier, isDefaultFreeTier: true, price: 0, priceDisplay: "Free", billingCycle: "free" as const };
      const updated = await saveMembershipTier(updatedTier);
      setTiers(updated);
      toast.success(`"${tier.name}" is now set as the Default Free Tier for new candidates!`);
    } catch {
      toast.error("Failed to update default free tier.");
    }
  };

  // Actions: Delete Tier
  const handleDeleteTier = async (tier: MembershipTier) => {
    if (tier.isDefaultFreeTier) {
      toast.error("Cannot delete the Default Free Tier. Set another tier as default first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the "${tier.name}" membership tier?`)) {
      return;
    }

    try {
      const updated = await deleteMembershipTier(tier.id);
      setTiers(updated);
      toast.success(`Membership tier "${tier.name}" deleted.`);
    } catch {
      toast.error("Failed to delete tier.");
    }
  };

  // Actions: Reset to Default Tiers
  const handleResetDefaults = async () => {
    if (!confirm("Reset membership tiers back to the factory defaults (Free Trial, Pro Scholar, Mastery Ultimate)?")) {
      return;
    }
    try {
      localStorage.setItem("sebs_membership_tiers", JSON.stringify(DEFAULT_MEMBERSHIP_TIERS));
      setTiers(DEFAULT_MEMBERSHIP_TIERS);
      toast.success("Membership tiers reset to defaults.");
    } catch {
      toast.error("Failed to reset defaults.");
    }
  };

  // Actions: Assign User Membership Modal
  const handleOpenAssignModal = (user?: any) => {
    if (user) {
      setAssignTargetUser(user);
      const userAssignment = userAssignments.find(a => a.userId === user.id || a.userEmail.toLowerCase() === user.email.toLowerCase());
      const currentTierId = userAssignment ? userAssignment.tierId : (tiers.find(t => t.name === user.plan)?.id || defaultTier?.id || "free-trial");
      setSelectedTierForAssign(currentTierId);
      if (userAssignment?.expiresAt) {
        setAssignExpiryType("custom");
        setAssignCustomExpiry(userAssignment.expiresAt.split("T")[0]);
      } else {
        setAssignExpiryType("lifetime");
        setAssignCustomExpiry("");
      }
      setAssignNotes(userAssignment?.notes || "");
    } else {
      setAssignTargetUser(null);
      setSelectedTierForAssign(defaultTier?.id || "free-trial");
      setAssignExpiryType("lifetime");
      setAssignCustomExpiry("");
      setAssignNotes("");
    }
    setUserSearchTerm("");
    setIsAssignModalOpen(true);
  };

  // Actions: Submit User Membership Assignment
  const handleSaveUserAssignment = async () => {
    if (!assignTargetUser) {
      toast.error("Please select a student to assign membership to.");
      return;
    }
    if (!selectedTierForAssign) {
      toast.error("Please choose a membership level.");
      return;
    }

    const expiresAt = assignExpiryType === "custom" && assignCustomExpiry
      ? new Date(assignCustomExpiry).toISOString()
      : null;

    try {
      const assignment = await assignUserMembership(
        assignTargetUser.id,
        assignTargetUser.email,
        selectedTierForAssign,
        {
          userName: assignTargetUser.name,
          expiresAt,
          notes: assignNotes,
          assignedBy: "Admin Console"
        }
      );

      const refreshed = await fetchUserMembershipAssignments();
      setUserAssignments(refreshed);
      setIsAssignModalOpen(false);
      toast.success(`Successfully assigned ${assignment.tierName} to ${assignTargetUser.name || assignTargetUser.email}!`);
    } catch (e) {
      toast.error("Failed to assign membership tier.");
    }
  };

  // Quick Change User Membership from Table
  const handleQuickChangeUserTier = async (user: any, newTierId: string) => {
    try {
      const assignment = await assignUserMembership(
        user.id,
        user.email,
        newTierId,
        {
          userName: user.name,
          expiresAt: null,
          notes: "Quick switch from Memberships Manager",
          assignedBy: "Admin Console"
        }
      );
      const refreshed = await fetchUserMembershipAssignments();
      setUserAssignments(refreshed);
      toast.success(`Updated ${user.name || user.email} to ${assignment.tierName}`);
    } catch {
      toast.error("Failed to change user tier.");
    }
  };

  // Filtered Tiers and Users
  const filteredTiers = useMemo(() => {
    return tiers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tiers, searchQuery]);

  const filteredUsers = useMemo(() => {
    return catalogUsers.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.plan && u.plan.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [catalogUsers, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            Memberships &amp; Access Control Desk
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Membership Levels &amp; Course Entitlements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Create membership tiers, configure granular course/test access permissions, establish free trial privileges, and assign membership levels to students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleResetDefaults}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold h-10 border-slate-200 dark:border-white/10 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Defaults
          </Button>
          <Button
            onClick={() => handleOpenAssignModal()}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold h-10 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 mr-1.5 text-[#00a8cc]" />
            Assign Student
          </Button>
          <Button
            onClick={handleOpenCreateTier}
            size="sm"
            className="rounded-xl text-xs font-black h-10 bg-[#00a8cc] hover:bg-[#008ba8] text-white shadow-md shadow-cyan-500/20 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Membership Level
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tiers</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalTiers}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{paidTiersCount} paid tiers + 1 free trial</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Free Tier</span>
            <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-slate-900 dark:text-white truncate">
            {defaultTier?.name || "Free Trial"}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Auto-granted on signup</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Courses in Catalog</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-[#00a8cc] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{catalogCourses.length}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Ready for tier assignment</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mock Tests in Catalog</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Layout className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{catalogMockTests.length}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Academic &amp; GT test papers</p>
        </Card>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "tiers"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Membership Levels ({tiers.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "assignments"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Student Entitlements ({catalogUsers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={activeTab === "tiers" ? "Search membership levels..." : "Search students or email..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs font-bold"
          />
        </div>
      </div>

      {/* TAB 1: MEMBERSHIP TIERS CARDS */}
      {activeTab === "tiers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTiers.map((tier) => {
            const memberCount = catalogUsers.filter(u => {
              const uTier = userAssignments.find(a => a.userId === u.id || a.userEmail.toLowerCase() === u.email.toLowerCase())?.tierId;
              if (uTier) return uTier === tier.id;
              return (u.plan || "").toLowerCase().includes(tier.name.toLowerCase()) || (tier.isDefaultFreeTier && (!u.plan || u.plan === "Free Trial"));
            }).length;

            return (
              <Card
                key={tier.id}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Top Header */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tier.badgeColor}`}>
                          {tier.name}
                        </span>
                        {tier.isDefaultFreeTier && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                            Default Free
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">{tier.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{tier.tagline}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-slate-900 dark:text-white">{tier.priceDisplay}</div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {tier.billingCycle}
                      </span>
                    </div>
                  </div>

                  {/* Access Breakdown Badges */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#00a8cc]" /> Courses Access
                      </span>
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        {tier.accessAllCourses ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> All ({catalogCourses.length})
                          </span>
                        ) : (
                          `${tier.allowedCourseIds?.length || 0} Selected`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <Layout className="w-3.5 h-3.5 text-indigo-500" /> Mock Tests Access
                      </span>
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        {tier.accessAllMockTests ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> All ({catalogMockTests.length})
                          </span>
                        ) : (
                          `${tier.allowedMockTestIds?.length || 0} Selected`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Score Evaluation
                      </span>
                      <span className={`font-black ${tier.hasAiEvaluation ? "text-emerald-600" : "text-slate-400"}`}>
                        {tier.hasAiEvaluation ? "Enabled" : "Locked"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-teal-500" /> Live Interactive Rooms
                      </span>
                      <span className={`font-black ${tier.hasLiveMeetings ? "text-emerald-600" : "text-slate-400"}`}>
                        {tier.hasLiveMeetings ? "Enabled" : "Locked"}
                      </span>
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Included Features:</span>
                    <ul className="space-y-1">
                      {(tier.features || []).slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{memberCount} Candidates</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!tier.isDefaultFreeTier && (
                      <Button
                        onClick={() => handleSetDefaultFreeTier(tier)}
                        variant="ghost"
                        size="sm"
                        title="Make Default Free Tier"
                        className="h-8 px-2 text-[11px] font-bold text-slate-600 hover:text-emerald-600 rounded-lg cursor-pointer"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      onClick={() => handleOpenEditTier(tier)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-lg text-xs font-bold border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1 text-[#00a8cc]" />
                      Edit Access
                    </Button>
                    {!tier.isDefaultFreeTier && (
                      <Button
                        onClick={() => handleDeleteTier(tier)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: STUDENT ENTITLEMENTS TABLE */}
      {activeTab === "assignments" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                Candidate Membership Directory
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Instantly upgrade, downgrade, or reassign membership tiers for individual students.
              </CardDescription>
            </div>

            <Button
              onClick={() => handleOpenAssignModal()}
              size="sm"
              className="rounded-xl text-xs font-black h-9 bg-[#00a8cc] hover:bg-[#008ba8] text-white shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Assign Membership to User
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="px-6 py-3.5">Candidate / Student</th>
                  <th className="px-6 py-3.5">Current Membership Level</th>
                  <th className="px-6 py-3.5">Access Duration / Expiry</th>
                  <th className="px-6 py-3.5">Quick Switch Tier</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredUsers.map((user, uIdx) => {
                  const assignment = userAssignments.find(a => a.userId === user.id || a.userEmail.toLowerCase() === user.email.toLowerCase());
                  const currentTier = tiers.find(t => t.id === assignment?.tierId) || tiers.find(t => t.name.toLowerCase() === (user.plan || "").toLowerCase()) || defaultTier;

                  return (
                    <tr key={`user-table-row-${user.id || user.email || uIdx}-${uIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                            {user.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{user.name}</div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentTier?.badgeColor || "bg-slate-100 text-slate-700"}`}>
                          <Crown className="w-3 h-3" />
                          {currentTier?.name || "Free Trial"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {assignment?.expiresAt ? (
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Expires: {new Date(assignment.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Lifetime / Ongoing
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={currentTier?.id || "free-trial"}
                          onChange={(e) => handleQuickChangeUserTier(user, e.target.value)}
                          className="h-8 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-[#00a8cc] outline-none"
                        >
                          {tiers.map((t, tIdx) => (
                            <option key={`quick-tier-${t.id || tIdx}-${uIdx}`} value={t.id}>
                              {t.name} ({t.priceDisplay})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleOpenAssignModal(user)}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold text-[#00a8cc] hover:text-[#008ba8] hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg cursor-pointer"
                        >
                          Manage Access
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: TIER EDITOR (GRANULAR ACCESS CONFIGURATION) */}
      {isEditorOpen && editingTier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {editingTier.id.startsWith("tier-") ? "Create Membership Level" : `Edit "${editingTier.name}" Access`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Configure pricing, default free status, and granular course and test unlock rules.
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              {[
                { id: "basic", label: "Level Details & Pricing", icon: CreditCard },
                { id: "courses", label: "Assigned Courses", icon: BookOpen },
                { id: "tests", label: "Assigned Mock Tests", icon: Layout },
                { id: "features", label: "Privileges & Perks", icon: Sparkles },
              ].map((st) => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    onClick={() => setEditorSubTab(st.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      editorSubTab === st.id
                        ? "bg-[#00a8cc] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Container (Scrollable) */}
            <div className="overflow-y-auto space-y-6 flex-1 pr-1">
              {/* SUBTAB: BASIC DETAILS */}
              {editorSubTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Level Name *</label>
                      <Input
                        value={editingTier.name}
                        onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                        placeholder="e.g. Pro Scholar, Mastery Ultimate, VIP Cohort"
                        className="rounded-xl font-bold text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Display Text</label>
                      <Input
                        value={editingTier.priceDisplay}
                        onChange={(e) => setEditingTier({ ...editingTier, priceDisplay: e.target.value })}
                        placeholder="e.g. Free, $49 / month, PKR 25,000"
                        className="rounded-xl font-bold text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Numeric Price Value ($ / PKR)</label>
                      <Input
                        type="number"
                        value={editingTier.price}
                        onChange={(e) => setEditingTier({ ...editingTier, price: parseFloat(e.target.value) || 0 })}
                        className="rounded-xl font-bold text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Interval</label>
                      <select
                        value={editingTier.billingCycle}
                        onChange={(e) => setEditingTier({ ...editingTier, billingCycle: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="free">Free / Gratis</option>
                        <option value="monthly">Monthly Subscription</option>
                        <option value="quarterly">Quarterly (3 Months)</option>
                        <option value="yearly">Yearly (12 Months)</option>
                        <option value="lifetime">Lifetime / One-time</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketing Tagline</label>
                    <Input
                      value={editingTier.tagline}
                      onChange={(e) => setEditingTier({ ...editingTier, tagline: e.target.value })}
                      placeholder="Short 1-line promotional hook"
                      className="rounded-xl font-bold text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                    <textarea
                      value={editingTier.description}
                      onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                      rows={2}
                      placeholder="Detailed explanation of target candidates and outcomes."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTier.isDefaultFreeTier}
                        onChange={(e) => setEditingTier({
                          ...editingTier,
                          isDefaultFreeTier: e.target.checked,
                          price: e.target.checked ? 0 : editingTier.price,
                          priceDisplay: e.target.checked ? "Free" : editingTier.priceDisplay,
                          billingCycle: e.target.checked ? "free" : editingTier.billingCycle
                        })}
                        className="w-4 h-4 rounded text-[#00a8cc]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Make this the Default Free Tier</div>
                        <div className="text-[11px] text-slate-400">Every new student registering an account will automatically receive this tier's privileges.</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTier.isActive}
                        onChange={(e) => setEditingTier({ ...editingTier, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-[#00a8cc]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Active Tier Status</div>
                        <div className="text-[11px] text-slate-400">Allow candidates to view and upgrade to this tier.</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* SUBTAB: COURSES ACCESS */}
              {editorSubTab === "courses" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-sky-900 dark:text-sky-300">Course Library Access Strategy</h4>
                      <p className="text-[11px] text-sky-700 dark:text-sky-400">Unlock entire course catalog or restrict to specific selected masterclasses.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-800">
                      <input
                        type="checkbox"
                        checked={editingTier.accessAllCourses}
                        onChange={(e) => setEditingTier({ ...editingTier, accessAllCourses: e.target.checked })}
                        className="w-4 h-4 text-[#00a8cc]"
                      />
                      <span className="text-xs font-black text-slate-900 dark:text-white">Unlock ALL Courses</span>
                    </label>
                  </div>

                  {!editingTier.accessAllCourses && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Select Allowed Courses ({editingTier.allowedCourseIds?.length || 0} selected)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTier({ ...editingTier, allowedCourseIds: catalogCourses.map(c => c.id) })}
                            className="text-[11px] text-[#00a8cc] font-bold hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setEditingTier({ ...editingTier, allowedCourseIds: [] })}
                            className="text-[11px] text-rose-500 font-bold hover:underline cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      {catalogCourses.length === 0 ? (
                        <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                          <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No courses currently found in catalog</div>
                          <div className="text-[11px] text-slate-400 mt-1">Create or publish courses in the Course Visualizer or Media Suite to assign them here.</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                          {catalogCourses.map((c) => {
                            const isChecked = editingTier.allowedCourseIds?.includes(c.id);
                            return (
                              <label
                                key={`course-pick-${c.id}`}
                                className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? "border-[#00a8cc] bg-sky-50/50 dark:bg-sky-950/20"
                                    : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const current = editingTier.allowedCourseIds || [];
                                    const updated = e.target.checked
                                      ? [...current, c.id]
                                      : current.filter(id => id !== c.id);
                                    setEditingTier({ ...editingTier, allowedCourseIds: updated });
                                  }}
                                  className="w-4 h-4 mt-0.5 rounded text-[#00a8cc]"
                                />
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{c.title}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{c.type} • {c.level}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: MOCK TESTS ACCESS */}
              {editorSubTab === "tests" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300">Mock Examinations Access Strategy</h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400">Grant full testing suite access or restrict to introductory mock test papers.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-800">
                      <input
                        type="checkbox"
                        checked={editingTier.accessAllMockTests}
                        onChange={(e) => setEditingTier({ ...editingTier, accessAllMockTests: e.target.checked })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-xs font-black text-slate-900 dark:text-white">Unlock ALL Mock Tests</span>
                    </label>
                  </div>

                  {!editingTier.accessAllMockTests && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Select Allowed Mock Tests ({editingTier.allowedMockTestIds?.length || 0} selected)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTier({ ...editingTier, allowedMockTestIds: catalogMockTests.map(t => t.id) })}
                            className="text-[11px] text-[#00a8cc] font-bold hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setEditingTier({ ...editingTier, allowedMockTestIds: [] })}
                            className="text-[11px] text-rose-500 font-bold hover:underline cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      {catalogMockTests.length === 0 ? (
                        <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                          <Layout className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No mock examinations found</div>
                          <div className="text-[11px] text-slate-400 mt-1">Create test papers in the Examination Desk to configure individual access rules.</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                          {catalogMockTests.map((t) => {
                            const isChecked = editingTier.allowedMockTestIds?.includes(t.id);
                            return (
                              <label
                                key={`mock-pick-${t.id}`}
                                className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                    : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const current = editingTier.allowedMockTestIds || [];
                                    const updated = e.target.checked
                                      ? [...current, t.id]
                                      : current.filter(id => id !== t.id);
                                    setEditingTier({ ...editingTier, allowedMockTestIds: updated });
                                  }}
                                  className="w-4 h-4 mt-0.5 rounded text-indigo-600"
                                />
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{t.title}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{t.category} • Year {t.year}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: PRIVILEGES & PERKS */}
              {editorSubTab === "features" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase text-slate-400 block">Advanced Capability Toggles</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "hasAiEvaluation", label: "AI Essay Evaluation & Scoring", desc: "Automated IELTS Band scoring and grammar feedback" },
                        { key: "hasLiveMeetings", label: "Google Meet & Live Cohort Calling", desc: "Join scheduled virtual classes with instructors" },
                        { key: "hasCertificates", label: "Official Verified Certificate", desc: "Award accredited certificates upon module completion" },
                        { key: "hasDownloadMaterials", label: "Download Audio & Transcripts", desc: "Access candidate offline reference packages" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(editingTier as any)[item.key]}
                            onChange={(e) => setEditingTier({ ...editingTier, [item.key]: e.target.checked })}
                            className="w-4 h-4 mt-0.5 text-[#00a8cc]"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                            <div className="text-[10px] text-slate-400">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-400">Marketing Perks Bullets</span>
                      <button
                        type="button"
                        onClick={() => setEditingTier({
                          ...editingTier,
                          features: [...(editingTier.features || []), "New Feature Highlight"]
                        })}
                        className="text-[11px] font-bold text-[#00a8cc] hover:underline cursor-pointer"
                      >
                        + Add Bullet
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingTier.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={feat}
                            onChange={(e) => {
                              const updated = [...editingTier.features];
                              updated[idx] = e.target.value;
                              setEditingTier({ ...editingTier, features: updated });
                            }}
                            className="rounded-xl text-xs h-9 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingTier.features.filter((_, i) => i !== idx);
                              setEditingTier({ ...editingTier, features: updated });
                            }}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTier}
                className="rounded-xl text-xs font-black h-10 px-6 bg-[#00a8cc] hover:bg-[#008ba8] text-white shadow-md shadow-cyan-500/20 cursor-pointer border-none"
              >
                Save Membership Level
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN MEMBERSHIP TO USER */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00a8cc]" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Assign Student Membership
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Grant or upgrade access privileges for a specific candidate.
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Target User */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Student *</label>
                {assignTargetUser ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{assignTargetUser.name}</div>
                      <div className="text-[11px] text-slate-400">{assignTargetUser.email}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignTargetUser(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search student by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="rounded-xl font-bold text-xs h-10"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-100 dark:border-white/5 p-1 rounded-2xl">
                      {catalogUsers
                        .filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
                        .map((u, uIdx) => (
                          <div
                            key={`assign-search-user-${u.id || u.email || uIdx}-${uIdx}`}
                            onClick={() => setAssignTargetUser(u)}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Select Tier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Membership Level to Grant *</label>
                <select
                  value={selectedTierForAssign}
                  onChange={(e) => setSelectedTierForAssign(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {tiers.map((t, tIdx) => (
                    <option key={`assign-tier-opt-${t.id || tIdx}-${tIdx}`} value={t.id}>
                      {t.name} — {t.priceDisplay} ({t.accessAllCourses ? "All Courses" : `${t.allowedCourseIds?.length || 0} Courses`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Duration &amp; Expiry</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignExpiryType("lifetime")}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      assignExpiryType === "lifetime"
                        ? "border-[#00a8cc] bg-sky-50 dark:bg-sky-950/20 text-[#00a8cc]"
                        : "border-slate-200 dark:border-white/10 text-slate-600"
                    }`}
                  >
                    Unlimited / Lifetime
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignExpiryType("custom")}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      assignExpiryType === "custom"
                        ? "border-[#00a8cc] bg-sky-50 dark:bg-sky-950/20 text-[#00a8cc]"
                        : "border-slate-200 dark:border-white/10 text-slate-600"
                    }`}
                  >
                    Set Expiration Date
                  </button>
                </div>

                {assignExpiryType === "custom" && (
                  <Input
                    type="date"
                    value={assignCustomExpiry}
                    onChange={(e) => setAssignCustomExpiry(e.target.value)}
                    className="rounded-xl font-bold text-xs h-10 mt-2"
                  />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Internal Admin Note (Optional)</label>
                <Input
                  placeholder="e.g. Granted for Band 8.5 scholarship, sponsored by campus"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUserAssignment}
                className="rounded-xl text-xs font-black h-10 px-6 bg-[#00a8cc] hover:bg-[#008ba8] text-white shadow-md shadow-cyan-500/20 cursor-pointer border-none"
              >
                Grant Membership
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
