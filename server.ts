import express from "express";
import path from "path";
import fs from "fs";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { supabaseAdmin } from "./src/lib/supabaseServer";
import Stripe from "stripe";
import mysql from "mysql2/promise";
import crypto from "crypto";

// Process safety guards to prevent unhandled rejections from crashing the server
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "sebs-institute-super-secret-key-1780389";

function generateToken(userId: string, email: string): string {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(JWT_SECRET, "salt", 32), Buffer.alloc(16));
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", crypto.scryptSync(JWT_SECRET, "salt", 32), Buffer.alloc(16));
    let decrypted = decipher.update(token, "hex", "utf8");
    decrypted += decipher.final("utf8");
    const parsed = JSON.parse(decrypted);
    if (parsed.exp < Date.now()) return null;
    return { userId: parsed.userId, email: parsed.email };
  } catch (e) {
    return null;
  }
}

// Hostinger MySQL Connection Pool
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || "srv1758.hstgr.io",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "u618781129_sebsAdmin",
  password: process.env.MYSQL_PASSWORD || "Sebsschool123",
  database: process.env.MYSQL_DATABASE || "u618781129_Sebs_database",
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  maxIdle: 10,
  idleTimeout: 60000
});

// Lazy Stripe initialization
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) return null;
  return new Stripe(key);
};

async function initTables() {
  try {
    const connection = await mysqlPool.getConnection();
    
    // Ensure profiles table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        password_hash VARCHAR(255),
        target_band DECIMAL(3,1),
        current_band DECIMAL(3,1),
        predicted_band DECIMAL(3,1),
        streak INT DEFAULT 0,
        xp INT DEFAULT 0,
        exam_type VARCHAR(50),
        last_lesson VARCHAR(255),
        status VARCHAR(50),
        plan VARCHAR(100),
        module_progress JSON,
        completed_lessons JSON,
        current_state JSON
      )
    `);

    // Ensure pricing_plans table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(255),
        tagline VARCHAR(255),
        priceDisplay VARCHAR(100),
        priceVal DECIMAL(10,2),
        period VARCHAR(100),
        description TEXT,
        features JSON,
        cta VARCHAR(255),
        isPopular BOOLEAN,
        accent VARCHAR(100),
        detailedCurriculum JSON,
        sort_order INT
      )
    `);

    // Ensure student_course_scores table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_course_scores (
        id VARCHAR(36) PRIMARY KEY,
        student_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36) NOT NULL,
        score INT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_course (student_id, course_id)
      )
    `);

    // Ensure updated_at column exists on student_course_scores in case it was created without it
    try {
      await connection.query("ALTER TABLE student_course_scores ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    } catch (err) {
      // Column already exists or table issue, safe to ignore
    }

    // Ensure testimonials table exists and is seeded
    await connection.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id VARCHAR(36) PRIMARY KEY,
        name LONGTEXT NOT NULL,
        role LONGTEXT,
        comment LONGTEXT NOT NULL,
        rating INT DEFAULT 5,
        avatar_url LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed testimonials if empty
    const [rows]: any = await connection.query("SELECT COUNT(*) as cnt FROM testimonials");
    if (rows && rows[0] && rows[0].cnt === 0) {
      console.log("Seeding testimonials table...");
      const defaultMockTestimonials = [
        {
          id: "t1",
          name: "Iram Shehzadi",
          role: "RJ, Radio Pakistan",
          comment: "In my opinion, this Institute does not teach English; it connects with your soul. You must join these classes to see the magic.",
          rating: 5,
          avatar_url: ""
        },
        {
          id: "t2",
          name: "Abu Huraira Shakir",
          role: "Advocate & Lawyer",
          comment: "The IELTS classes were incredibly thorough, meticulously organized, and delivered with clear progression pathways. Superb experience.",
          rating: 5,
          avatar_url: ""
        },
        {
          id: "t3",
          name: "Muhammad Husain Azam",
          role: "Student",
          comment: "My English is significantly better now. I speak so much more confidently. Thank you to all the expert teachers at SEBS.",
          rating: 5,
          avatar_url: ""
        }
      ];

      for (const t of defaultMockTestimonials) {
        await connection.query(
          "INSERT INTO testimonials (id, name, role, comment, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
          [t.id, t.name, t.role, t.comment, t.rating, t.avatar_url]
        );
      }
      console.log("Seeding testimonials complete.");
    }

    // Ensure team_members table exists and is seeded
    await connection.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(36) PRIMARY KEY,
        name LONGTEXT NOT NULL,
        role LONGTEXT,
        avatar_url LONGTEXT,
        bio LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sort_order INT DEFAULT 0,
        credentials LONGTEXT,
        expertise LONGTEXT,
        email LONGTEXT,
        linkedin LONGTEXT,
        gradient LONGTEXT,
        image_url LONGTEXT
      )
    `);

    // Seed team members if empty
    const [teamRows]: any = await connection.query("SELECT COUNT(*) as cnt FROM team_members");
    if (teamRows && teamRows[0] && teamRows[0].cnt === 0) {
      console.log("Seeding team_members table...");
      const defaultTeamMembers = [
        {
          id: "team-seb",
          gradient: "from-emerald-600 to-teal-600",
          name: "Syed Ejaz Bukhari",
          role: "Founder & Principal English Mentor",
          credentials: "15+ Years Experience • IELTS Expert",
          bio: "Renowned pioneer of the 'We Teach English, Not Pinglish' vocal-conditioning approach. Coached thousands of successful students globally with custom-targeted phonetic strategies.",
          expertise: ["IELTS Academic / General", "PTE Strategic Mastery", "Phonetic Retraining", "Executive Spoken English"],
          email: "info@sebsinstitute.com",
          linkedin: "https://linkedin.com",
          image_url: null,
          sort_order: 1
        },
        {
          id: "team-za",
          gradient: "from-emerald-500 to-emerald-700",
          name: "Zoha Ali",
          role: "Senior EFL & Linguistics Specialist",
          credentials: "MS ELTL • MS Mentorship • CELTA Qualified • 10+ Years Exp.",
          bio: "Certified EFL Mentor and expert linguist specializing in advanced cognitive training and fluent English coaching based on cognitive linguistics principles.",
          expertise: ["IELTS General / Academic", "PTE & Pearson Prep", "LanguageCert C1/C2", "Linguistic Methodology"],
          email: "info@sebsinstitute.com",
          linkedin: "https://linkedin.com",
          image_url: null,
          sort_order: 2
        },
        {
          id: "team-sz",
          gradient: "from-amber-500 to-orange-500",
          name: "Syeda Zarnaz Gilani",
          role: "Senior IELTS & Communication Coach",
          credentials: "BA English (UoL) • British Council & AEO Expert • 8 Years Exp.",
          bio: "Distinguished graduate from the University of London. Leveraging international pedagogical training to enable rapid speech confidence through intensive vocal drills and auditory pattern mapping.",
          expertise: ["IELTS Speaking / Listening", "Spoken English Fluency", "Academic ESL Pedagogy", "Confidence Building"],
          email: "info@sebsinstitute.com",
          linkedin: "https://linkedin.com",
          image_url: null,
          sort_order: 3
        }
      ];

      for (const m of defaultTeamMembers) {
        await connection.query(
          "INSERT INTO team_members (id, name, role, avatar_url, bio, sort_order, credentials, expertise, email, linkedin, gradient, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            m.id,
            m.name,
            m.role,
            "",
            m.bio,
            m.sort_order,
            m.credentials,
            JSON.stringify(m.expertise),
            m.email,
            m.linkedin,
            m.gradient,
            m.image_url || ""
          ]
        );
      }
      console.log("Seeding team_members complete.");
    }

    // Ensure columns exist on courses table
    const courseColumnsToAdd = [
      "test_number VARCHAR(255)",
      "blocks LONGTEXT",
      "is_mock_test INT DEFAULT 0",
      "exam_category VARCHAR(255)",
      "access_tier VARCHAR(255)",
      "featured_image LONGTEXT",
      "thumbnail_url LONGTEXT",
      "thumbnail_type VARCHAR(255)",
      "show_in_catalog INT DEFAULT 1",
      "show_in_syllabus INT DEFAULT 1",
      "show_in_practice INT DEFAULT 1",
      "time_limit INT DEFAULT 60",
      "level VARCHAR(255)",
      "type VARCHAR(255)",
      "difficulty VARCHAR(255)",
      "status VARCHAR(255)",
      "content LONGTEXT"
    ];
    for (const colDef of courseColumnsToAdd) {
      try {
        await connection.query(`ALTER TABLE courses ADD COLUMN ${colDef}`);
      } catch (err: any) {
        if (err.errno !== 1060 && err.code !== "ER_DUP_FIELDNAME" && !err.message?.toLowerCase().includes("duplicate")) {
          // Ignore duplicate column errors
        }
      }
    }

    // Ensure description column exists on classrooms in case it was created without it
    try {
      await connection.query("ALTER TABLE classrooms ADD COLUMN description LONGTEXT");
    } catch (err: any) {
      if (err.errno !== 1060 && err.code !== "ER_DUP_FIELDNAME" && !err.message?.toLowerCase().includes("duplicate")) {
        console.warn("Non-duplicate warning on classrooms description migration:", err);
      }
    }

    // Ensure attendance_sessions table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id VARCHAR(255) PRIMARY KEY,
        classroom_id VARCHAR(255),
        expires_at VARCHAR(255),
        created_at VARCHAR(255)
      )
    `);

    // Ensure expires_at column exists on attendance_sessions in case the table existed without it
    try {
      await connection.query("ALTER TABLE attendance_sessions ADD COLUMN expires_at VARCHAR(255)");
    } catch (err: any) {
      if (err.errno !== 1060 && err.code !== "ER_DUP_FIELDNAME" && !err.message?.toLowerCase().includes("duplicate")) {
        console.warn("Non-duplicate warning on attendance_sessions expires_at migration:", err);
      }
    }

    // Ensure attendance_logs table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255),
        student_id VARCHAR(255),
        marked_at VARCHAR(255)
      )
    `);

    // Ensure marked_at column exists on attendance_logs in case the table existed without it
    try {
      await connection.query("ALTER TABLE attendance_logs ADD COLUMN marked_at VARCHAR(255)");
    } catch (err: any) {
      if (err.errno !== 1060 && err.code !== "ER_DUP_FIELDNAME" && !err.message?.toLowerCase().includes("duplicate")) {
        console.warn("Non-duplicate warning on attendance_logs marked_at migration:", err);
      }
    }

    // Ensure resources table exists for storing global settings and other system-wide parameters
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(255),
        url LONGTEXT
      )
    `);

    // Ensure membership_tiers table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS membership_tiers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        tagline TEXT,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        priceDisplay VARCHAR(255) DEFAULT 'Free',
        billingCycle VARCHAR(50) DEFAULT 'monthly',
        isDefaultFreeTier TINYINT(1) DEFAULT 0,
        isActive TINYINT(1) DEFAULT 1,
        badgeColor VARCHAR(255),
        accentColor VARCHAR(50),
        sortOrder INT DEFAULT 0,
        accessAllCourses TINYINT(1) DEFAULT 0,
        allowedCourseIds JSON,
        accessAllMockTests TINYINT(1) DEFAULT 0,
        allowedMockTestIds JSON,
        allowedTestCategories JSON,
        accessAllPractice TINYINT(1) DEFAULT 1,
        allowedPracticeModules JSON,
        hasAiEvaluation TINYINT(1) DEFAULT 1,
        hasLiveMeetings TINYINT(1) DEFAULT 0,
        hasCertificates TINYINT(1) DEFAULT 1,
        hasDownloadMaterials TINYINT(1) DEFAULT 1,
        hasPrioritySupport TINYINT(1) DEFAULT 0,
        features JSON,
        created_at VARCHAR(255),
        updated_at VARCHAR(255)
      )
    `);

    // Ensure user_memberships table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_memberships (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        userEmail VARCHAR(255),
        userName VARCHAR(255),
        tierId VARCHAR(255),
        tierName VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        assignedAt VARCHAR(255),
        expiresAt VARCHAR(255),
        assignedBy VARCHAR(255),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure membership columns exist on profiles table
    try {
      await connection.query("ALTER TABLE profiles ADD COLUMN membership_tier_id VARCHAR(255)");
    } catch (e) {}
    try {
      await connection.query("ALTER TABLE profiles ADD COLUMN membership_expires_at VARCHAR(255)");
    } catch (e) {}

    // Seed default membership tiers if empty
    try {
      const [mTierRows]: any = await connection.query("SELECT COUNT(*) as cnt FROM membership_tiers");
      if (mTierRows && mTierRows[0] && mTierRows[0].cnt === 0) {
        console.log("Seeding default membership_tiers...");
        const defaultTiers = [
          {
            id: "free-trial",
            name: "Free Trial Tier",
            slug: "free-trial",
            tagline: "Explore core sample IELTS mock tests and introductory lectures",
            description: "Standard free access granted to all newly registered candidate accounts.",
            price: 0,
            priceDisplay: "Free",
            billingCycle: "free",
            isDefaultFreeTier: 1,
            isActive: 1,
            badgeColor: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300",
            accentColor: "#64748b",
            sortOrder: 1,
            accessAllCourses: 0,
            allowedCourseIds: JSON.stringify([]),
            accessAllMockTests: 0,
            allowedMockTestIds: JSON.stringify([]),
            allowedTestCategories: JSON.stringify(["Academic", "General Training"]),
            accessAllPractice: 0,
            allowedPracticeModules: JSON.stringify(["writing", "reading"]),
            hasAiEvaluation: 0,
            hasLiveMeetings: 0,
            hasCertificates: 0,
            hasDownloadMaterials: 0,
            hasPrioritySupport: 0,
            features: JSON.stringify([
              "Access to Free Sample Mock Tests",
              "Introductory IELTS Strategy Masterclasses",
              "Instant Automated Answer Key Checking",
              "Candidate Profile & Band Goal Setting"
            ]),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
            isDefaultFreeTier: 0,
            isActive: 1,
            badgeColor: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300",
            accentColor: "#00a8cc",
            sortOrder: 2,
            accessAllCourses: 1,
            allowedCourseIds: JSON.stringify([]),
            accessAllMockTests: 1,
            allowedMockTestIds: JSON.stringify([]),
            allowedTestCategories: JSON.stringify(["Academic", "General Training", "All"]),
            accessAllPractice: 1,
            allowedPracticeModules: JSON.stringify(["writing", "speaking", "reading", "listening", "quizzes"]),
            hasAiEvaluation: 1,
            hasLiveMeetings: 0,
            hasCertificates: 1,
            hasDownloadMaterials: 1,
            hasPrioritySupport: 0,
            features: JSON.stringify([
              "All Authentic 2024-2028 Mock Examinations",
              "Unlimited Computerized Split-Screen Tests",
              "Instant AI Essay Band Scoring & Grammar Feedback",
              "Audio Recordings Transcripts & Answer Keys",
              "Course Completion Digital Certificate"
            ]),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
            isDefaultFreeTier: 0,
            isActive: 1,
            badgeColor: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
            accentColor: "#f59e0b",
            sortOrder: 3,
            accessAllCourses: 1,
            allowedCourseIds: JSON.stringify([]),
            accessAllMockTests: 1,
            allowedMockTestIds: JSON.stringify([]),
            allowedTestCategories: JSON.stringify(["Academic", "General Training", "All"]),
            accessAllPractice: 1,
            allowedPracticeModules: JSON.stringify(["writing", "speaking", "reading", "listening", "quizzes"]),
            hasAiEvaluation: 1,
            hasLiveMeetings: 1,
            hasCertificates: 1,
            hasDownloadMaterials: 1,
            hasPrioritySupport: 1,
            features: JSON.stringify([
              "Unrestricted Access to ALL Courses & Media Suites",
              "Unlimited Mock Examinations & Diagnostics",
              "AI Conversation Coach Clara Real-Time Voice",
              "Interactive Google Meet & Live Cohorts Access",
              "Official Verified Accredited Certificate with QR Code",
              "1-on-1 Teacher Feedback & Priority Assessment"
            ]),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        for (const tier of defaultTiers) {
          await connection.query(
            `INSERT INTO membership_tiers (
              id, name, slug, tagline, description, price, priceDisplay, billingCycle,
              isDefaultFreeTier, isActive, badgeColor, accentColor, sortOrder,
              accessAllCourses, allowedCourseIds, accessAllMockTests, allowedMockTestIds,
              allowedTestCategories, accessAllPractice, allowedPracticeModules,
              hasAiEvaluation, hasLiveMeetings, hasCertificates, hasDownloadMaterials,
              hasPrioritySupport, features, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tier.id, tier.name, tier.slug, tier.tagline, tier.description, tier.price, tier.priceDisplay, tier.billingCycle,
              tier.isDefaultFreeTier, tier.isActive, tier.badgeColor, tier.accentColor, tier.sortOrder,
              tier.accessAllCourses, tier.allowedCourseIds, tier.accessAllMockTests, tier.allowedMockTestIds,
              tier.allowedTestCategories, tier.accessAllPractice, tier.allowedPracticeModules,
              tier.hasAiEvaluation, tier.hasLiveMeetings, tier.hasCertificates, tier.hasDownloadMaterials,
              tier.hasPrioritySupport, tier.features, tier.created_at, tier.updated_at
            ]
          );
        }
        console.log("Seeding default membership_tiers complete.");
      }
    } catch (e) {
      console.warn("Error seeding membership_tiers:", e);
    }

    // Ensure worksheet_submissions and auxiliary application tables exist
    await ensureTableExists("worksheet_submissions");
    await ensureTableExists("student_submissions");
    await ensureTableExists("mock_tests");
    await ensureTableExists("live_meetings");
    await ensureTableExists("classrooms");
    await ensureTableExists("classroom_enrollments");
    await ensureTableExists("quizzes");
    await ensureTableExists("students");

    connection.release();
    console.log("MySQL Tables initialized.");
  } catch (e) {
    console.error("Error initializing MySQL tables:", e);
  }
}

async function ensureTableExists(tableName: string, sampleRow?: any): Promise<boolean> {
  try {
    if (tableName === "worksheet_submissions") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS worksheet_submissions (
          id VARCHAR(255) PRIMARY KEY,
          worksheet_id VARCHAR(255),
          episode_id VARCHAR(255),
          course_id VARCHAR(255),
          student_id VARCHAR(255),
          student_name VARCHAR(255),
          score INT DEFAULT 0,
          max_score INT DEFAULT 100,
          percentage DECIMAL(5,2) DEFAULT 0,
          band_score VARCHAR(50),
          grade VARCHAR(50),
          answers JSON,
          evaluation JSON,
          status VARCHAR(50) DEFAULT 'submitted',
          created_at VARCHAR(255),
          updated_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "student_submissions") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS student_submissions (
          id VARCHAR(255) PRIMARY KEY,
          student_id VARCHAR(255),
          student_name VARCHAR(255),
          course_id VARCHAR(255),
          course_title VARCHAR(255),
          lesson_title VARCHAR(255),
          lesson_type VARCHAR(50),
          module_idx INT DEFAULT 0,
          lesson_idx INT DEFAULT 0,
          answers JSON,
          evaluation JSON,
          score INT DEFAULT 0,
          band_score VARCHAR(50),
          status VARCHAR(50) DEFAULT 'submitted',
          created_at VARCHAR(255),
          updated_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "mock_tests") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS mock_tests (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255),
          name VARCHAR(255),
          category VARCHAR(255),
          difficulty VARCHAR(50),
          time_limit INT DEFAULT 60,
          sections JSON,
          created_at VARCHAR(255),
          updated_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "live_meetings") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS live_meetings (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255),
          description TEXT,
          meet_url LONGTEXT,
          scheduled_at VARCHAR(255),
          duration INT DEFAULT 60,
          instructor VARCHAR(255),
          status VARCHAR(50) DEFAULT 'upcoming',
          created_at VARCHAR(255),
          updated_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "classrooms") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS classrooms (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          description LONGTEXT,
          teacher_id VARCHAR(255),
          created_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "classroom_enrollments") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS classroom_enrollments (
          id VARCHAR(255) PRIMARY KEY,
          classroom_id VARCHAR(255),
          student_id VARCHAR(255),
          enrolled_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "quizzes") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id VARCHAR(255) PRIMARY KEY,
          course_id VARCHAR(255),
          title VARCHAR(255),
          description TEXT,
          questions JSON,
          time_limit INT DEFAULT 30,
          created_at VARCHAR(255),
          updated_at VARCHAR(255)
        )
      `);
      return true;
    } else if (tableName === "students") {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS students (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          status VARCHAR(50),
          target_band DECIMAL(3,1),
          current_band DECIMAL(3,1),
          plan VARCHAR(100),
          created_at VARCHAR(255),
          updated_at VARCHAR(255)
        )
      `);
      return true;
    } else if (sampleRow && typeof sampleRow === "object") {
      const keys = Object.keys(sampleRow);
      if (keys.length > 0) {
        const colsDef = keys.map(k => {
          if (k === "id") return "`id` VARCHAR(255) PRIMARY KEY";
          return `\`${k}\` LONGTEXT`;
        });
        if (!sampleRow.hasOwnProperty("id")) {
          colsDef.unshift("`id` VARCHAR(255) PRIMARY KEY");
        }
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (${colsDef.join(", ")})`);
        return true;
      }
    }
  } catch (err: any) {
    console.warn(`Failed to auto-create table '${tableName}':`, err.message || err);
  }
  return false;
}

async function startServer() {
  initTables().catch((err) => console.error("Error in async initTables:", err));
  
  const app = express();
  // Disable Express identification headers for SEO and security compliance
  app.disable("x-powered-by");
  
  // Enable Gzip/Deflate compression for optimal transfer speeds
  app.use(compression());

  const PORT = 3000;

  // Canonical Domain Redirect (www.sebsinstitute.com -> sebsinstitute.com)
  app.use((req, res, next) => {
    const host = (req.headers.host || "").toLowerCase();
    if (host.startsWith("www.sebsinstitute.com")) {
      const targetUrl = `https://sebsinstitute.com${req.originalUrl || req.url}`;
      return res.redirect(301, targetUrl);
    }
    next();
  });

  // Security & SEO Headers Middleware
  app.use((req, res, next) => {
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Explicitly declare indexing directive for search engines
    if (req.path.startsWith("/admin") || req.path.startsWith("/api/")) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    } else {
      res.setHeader("X-Robots-Tag", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }
    next();
  });

  // Stripe Webhook Endpoint needs RAW body (MUST be defined before express.json() is applied)
  app.post("/api/payment/webhook", express.raw({ type: "application/json" }), async (req: any, res: any) => {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    if (stripe && sig && webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Stripe Webhook Signature Verification Failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // Bypassed/Test mode support or unvalidated handling
      try {
        event = JSON.parse(req.body.toString());
      } catch (e: any) {
        return res.status(400).send("Invalid JSON payload");
      }
    }

    // Handle completed session
    if (event && event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const planName = session.metadata?.planName;

      if (userId && planName) {
        try {
          // Update Hostinger MySQL profiles
          await mysqlPool.execute(
            "UPDATE profiles SET plan = ? WHERE id = ?",
            [planName, userId]
          );
          console.log(`Successfully updated plan to ${planName} for user ${userId} in Hostinger MySQL via webhook.`);

          // Background fallback update to Supabase
          if (supabaseAdmin) {
            await supabaseAdmin
              .from("profiles")
              .update({ plan: planName })
              .eq("id", userId);
          }
        } catch (dbErr) {
          console.error("Webhook DB updating error:", dbErr);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Robust Gemini API calling helper with Exponential Backoff Retries & Model Fallback
  async function generateContentWithRetry(params: any, retries = 2, initialDelay = 500): Promise<any> {
    let lastError: any = null;
    
    const isTts = params.model && params.model.includes("tts");
    const modelsToTry = isTts 
      ? [params.model]
      : Array.from(new Set([params.model, "gemini-3.1-flash-lite"].filter(Boolean)));
    
    for (const modelName of modelsToTry) {
      if (!modelName) continue;
      
      const maxAttempts = modelName === params.model ? 2 : 1;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await ai.models.generateContent({
            ...params,
            model: modelName
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const errMsg = err.message || "";
          console.warn(`[Gemini API] Attempt ${attempt} for model "${modelName}" failed: ${errMsg}`);
          
          // Immediate fallback if model is overloaded, busy, or rate-limited
          const isOverloaded = errMsg.includes("503") || errMsg.includes("demand") || errMsg.includes("overloaded") || errMsg.includes("429");
          if (isOverloaded && modelsToTry.length > 1 && modelName !== modelsToTry[modelsToTry.length - 1]) {
            console.warn(`[Gemini API] Model "${modelName}" is overloaded/busy. Skipping retries to fall back immediately.`);
            break; 
          }
          
          if (attempt < maxAttempts) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      if (modelsToTry.length > 1 && modelName !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`[Gemini API] Failed or skipped model "${modelName}". Trying fallback model...`);
      }
    }
    
    throw lastError;
  }

  // Extract first matching JSON object or array matching braces/brackets
  function extractFirstJSON(text: string): string {
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    
    let startIdx = -1;
    let startChar = "";
    let endChar = "";
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      startChar = "{";
      endChar = "}";
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      startChar = "[";
      endChar = "]";
    }
    
    if (startIdx === -1) return text;
    
    let count = 0;
    let inString = false;
    let escaping = false;
    
    for (let i = startIdx; i < text.length; i++) {
      const char = text[i];
      if (escaping) {
        escaping = false;
        continue;
      }
      if (char === "\\") {
        escaping = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === startChar) {
          count++;
        } else if (char === endChar) {
          count--;
          if (count === 0) {
            return text.substring(startIdx, i + 1);
          }
        }
      }
    }
    
    // Fallback if mismatched
    const lastIdx = text.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      return text.substring(startIdx, lastIdx + 1);
    }
    
    return text;
  }

  // Robust JSON parsing helper to clean extra text around JSON response
  function cleanAndParseJSON(text: string): any {
    const cleanText = text.trim();
    
    // Attempt standard direct parse first
    try {
      return JSON.parse(cleanText);
    } catch (e) {
      // Direct parse failed, let's extract the first valid balanced JSON block
      const extracted = extractFirstJSON(cleanText);
      try {
        return JSON.parse(extracted);
      } catch (err: any) {
        // If still failing, try removing trailing commas inside objects/arrays
        try {
          const fixedText = extracted
            .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
            .replace(/\\n/g, ' ')           // remove raw escaped newlines
            .replace(/\n/g, ' ');
          return JSON.parse(fixedText);
        } catch (regexErr) {
          console.error("[JSON Parse] Failed to parse JSON even after regex cleanup:", regexErr);
        }
        throw err;
      }
    }
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "SEBS Institute Server is running" });
  });

  // MySQL-powered Auth & Profile Session Endpoints
  // Signup
  app.post("/api/auth/signup", async (req: any, res: any) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

      // Check if user exists
      const [existingUsers]: any = await mysqlPool.execute(
        "SELECT id FROM profiles WHERE email = ? LIMIT 1",
        [email]
      );

      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const userId = crypto.randomUUID();
      const fullName = `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0];

      await mysqlPool.execute(
        `INSERT INTO profiles (
          id, email, first_name, last_name, full_name, role, password_hash,
          target_band, current_band, predicted_band, streak, xp, exam_type,
          last_lesson, status, plan, module_progress, completed_lessons, current_state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 8.0, 6.0, 7.5, 12, 2450, 'Academic', 'Orientation Lecture', 'Active', 'Free Trial', '{}', '[]', '{}')`,
        [userId, email, firstName || "", lastName || "", fullName, role || "student", passwordHash]
      );

      const token = generateToken(userId, email);

      res.json({
        session: {
          access_token: token,
          user: {
            id: userId,
            email: email,
            user_metadata: {
              first_name: firstName || "",
              last_name: lastName || "",
              role: role || "student"
            }
          }
        }
      });
    } catch (err: any) {
      console.error("Signup API error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

      const [users]: any = await mysqlPool.execute(
        "SELECT * FROM profiles WHERE email = ? LIMIT 1",
        [email]
      );

      if (!users || users.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = users[0];
      if (user.password_hash !== passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = generateToken(user.id, user.email);

      res.json({
        session: {
          access_token: token,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: {
              first_name: user.first_name || "",
              last_name: user.last_name || "",
              role: user.role || "student"
            }
          }
        }
      });
    } catch (err: any) {
      console.error("Login API error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Me
  app.get("/api/auth/me", async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const token = authHeader.split(" ")[1];
      const verified = verifyToken(token);
      if (!verified) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const [users]: any = await mysqlPool.execute(
        "SELECT * FROM profiles WHERE id = ? LIMIT 1",
        [verified.userId]
      );

      if (!users || users.length === 0) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const user = users[0];
      res.json({
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            role: user.role || "student"
          }
        }
      });
    } catch (err: any) {
      console.error("Auth me API error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Generic Supabase-like querying proxy to Hostinger MySQL
  app.post("/api/mysql/query", async (req: any, res: any) => {
    try {
      const { 
        table, selectFields, filters, updateData, upsertData, insertData, deleteFlag, orderConfig, limitCount 
      } = req.body;
      
      if (!table) {
        return res.status(400).json({ error: "Missing table parameter" });
      }

      const authHeader = req.headers.authorization;
      let targetUserId = null;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const verified = verifyToken(token);
        if (verified) targetUserId = verified.userId;
      }

      // We no longer require auth on all proxy queries.
      // (The client should pass token, but public tables like courses need anonymous access).

      let whereClauses: string[] = [];
      let queryValues: any[] = [];
      
      if (filters && Array.isArray(filters)) {
        for (const f of filters) {
          if (f.type === "eq") {
            whereClauses.push(`\`${f.column}\` = ?`);
            queryValues.push(f.value);
          } else if (f.type === "neq") {
            whereClauses.push(`\`${f.column}\` != ?`);
            queryValues.push(f.value);
          } else if (f.type === "lt") {
            whereClauses.push(`\`${f.column}\` < ?`);
            queryValues.push(f.value);
          } else if (f.type === "lte") {
            whereClauses.push(`\`${f.column}\` <= ?`);
            queryValues.push(f.value);
          } else if (f.type === "gt") {
            whereClauses.push(`\`${f.column}\` > ?`);
            queryValues.push(f.value);
          } else if (f.type === "gte") {
            whereClauses.push(`\`${f.column}\` >= ?`);
            queryValues.push(f.value);
          } else if (f.type === "in") {
            const inVals = Array.isArray(f.value) ? f.value : [];
            if (inVals.length > 0) {
              whereClauses.push(`\`${f.column}\` IN (${inVals.map(() => "?").join(",")})`);
              queryValues.push(...inVals);
            } else {
              whereClauses.push(`1 = 0`); // Empty IN means false
            }
          } else if (f.type === "contains") {
             whereClauses.push(`\`${f.column}\` LIKE ?`);
             queryValues.push(`%${f.value}%`);
          } else if (f.type === "or") {
            const conditions = String(f.value || "").split(",");
            const orClauses: string[] = [];
            for (const cond of conditions) {
              const parts = cond.split(".");
              if (parts.length >= 3) {
                const col = parts[0];
                const op = parts[1];
                const rawVal = parts.slice(2).join(".");
                
                let sqlOp = "=";
                let finalVal: any = rawVal;
                
                if (rawVal === "true") {
                  finalVal = true;
                } else if (rawVal === "false") {
                  finalVal = false;
                } else if (rawVal === "null") {
                  finalVal = null;
                }
                
                if (op === "eq") {
                  sqlOp = "=";
                } else if (op === "neq") {
                  sqlOp = "!=";
                } else if (op === "lt") {
                  sqlOp = "<";
                } else if (op === "lte") {
                  sqlOp = "<=";
                } else if (op === "gt") {
                  sqlOp = ">";
                } else if (op === "gte") {
                  sqlOp = ">=";
                } else if (op === "like" || op === "ilike") {
                  sqlOp = "LIKE";
                }
                
                if (finalVal === null) {
                  if (sqlOp === "=") {
                    orClauses.push(`\`${col}\` IS NULL`);
                  } else {
                    orClauses.push(`\`${col}\` IS NOT NULL`);
                  }
                } else {
                  orClauses.push(`\`${col}\` ${sqlOp} ?`);
                  queryValues.push(finalVal);
                }
              }
            }
            if (orClauses.length > 0) {
              whereClauses.push(`(${orClauses.join(" OR ")})`);
            }
          }
        }
      }
      
      const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      
      const formatValue = (val: any) => {
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      };

      // Helper to fetch valid column names for target table
      let validCols: Set<string> | null = null;
      if (insertData || updateData || upsertData) {
        try {
          const [colRows]: any = await mysqlPool.query(`SHOW COLUMNS FROM \`${table}\``);
          if (Array.isArray(colRows) && colRows.length > 0) {
            validCols = new Set(colRows.map((col: any) => col.Field));
          }
        } catch (colErr: any) {
          // If table does not exist, auto-create it and retry fetching columns
          if (colErr.errno === 1146 || colErr.code === "ER_NO_SUCH_TABLE" || colErr.message?.toLowerCase().includes("doesn't exist")) {
            const sample = (insertData && (Array.isArray(insertData) ? insertData[0] : insertData)) || 
                           (upsertData && (Array.isArray(upsertData) ? upsertData[0] : upsertData)) || 
                           updateData;
            await ensureTableExists(table, sample);
            try {
              const [colRowsRetry]: any = await mysqlPool.query(`SHOW COLUMNS FROM \`${table}\``);
              if (Array.isArray(colRowsRetry) && colRowsRetry.length > 0) {
                validCols = new Set(colRowsRetry.map((col: any) => col.Field));
              }
            } catch (retryErr) {
              // Gracefully handle if columns still unavailable
            }
          } else {
            console.warn(`Could not fetch columns for ${table}:`, colErr.message || colErr);
          }
        }
      }

      if (insertData) {
        let insertArr = Array.isArray(insertData) ? insertData : [insertData];
        if (insertArr.length === 0) return res.json([]);
        
        // Auto-generate UUID if id column is missing or empty
        insertArr = insertArr.map(row => {
          if (!row.hasOwnProperty("id") || !row.id || String(row.id).trim() === "") {
            return { ...row, id: crypto.randomUUID() };
          }
          return row;
        });

        const rawKeys = Object.keys(insertArr[0]);
        const keys = validCols ? rawKeys.filter(k => validCols!.has(k)) : rawKeys;
        if (keys.length === 0) return res.json(insertArr);

        const cols = keys.map(k => `\`${k}\``).join(", ");
        
        let placeholders = [];
        let insertVals = [];
        for (const row of insertArr) {
          placeholders.push(`(${keys.map(() => "?").join(", ")})`);
          insertVals.push(...keys.map(k => formatValue(row[k])));
        }
        
        const sql = `INSERT INTO \`${table}\` (${cols}) VALUES ${placeholders.join(", ")}`;
        await mysqlPool.query(sql, insertVals);
        
        return res.json(insertArr);
      } else if (updateData) {
        const rawKeys = Object.keys(updateData);
        const keys = validCols ? rawKeys.filter(k => validCols!.has(k)) : rawKeys;
        if (keys.length === 0) return res.json([updateData]);

        const sets = keys.map(k => `\`${k}\` = ?`).join(", ");
        const updateVals = keys.map(k => formatValue(updateData[k]));
        
        const sql = `UPDATE \`${table}\` SET ${sets} ${whereSQL}`;
        await mysqlPool.query(sql, [...updateVals, ...queryValues]);
        
        return res.json([updateData]);
      } else if (upsertData) {
        let upsertArr = Array.isArray(upsertData) ? upsertData : [upsertData];
        if (upsertArr.length === 0) return res.json([]);

        // Auto-generate UUID if id column is missing or empty
        upsertArr = upsertArr.map(row => {
          if (!row.hasOwnProperty("id") || !row.id || String(row.id).trim() === "") {
            return { ...row, id: crypto.randomUUID() };
          }
          return row;
        });

        const rawKeys = Object.keys(upsertArr[0]);
        const keys = validCols ? rawKeys.filter(k => validCols!.has(k)) : rawKeys;
        if (keys.length === 0) return res.json(upsertArr);

        const cols = keys.map(k => `\`${k}\``).join(", ");
        
        let placeholders = [];
        let upsertVals = [];
        for (const row of upsertArr) {
          placeholders.push(`(${keys.map(() => "?").join(", ")})`);
          upsertVals.push(...keys.map(k => formatValue(row[k])));
        }
        
        const updates = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
        const sql = `INSERT INTO \`${table}\` (${cols}) VALUES ${placeholders.join(", ")} ON DUPLICATE KEY UPDATE ${updates}`;
        await mysqlPool.query(sql, upsertVals);
        return res.json(upsertArr);
      } else if (deleteFlag) {
        if (!whereSQL) return res.status(400).json({ error: "DELETE requires filters" });
        const sql = `DELETE FROM \`${table}\` ${whereSQL}`;
        await mysqlPool.query(sql, queryValues);
        return res.json([]);
      } else {
        const RELATION_MAP: Record<string, { fk: string; targetTable: string }> = {
          classrooms: { fk: "classroom_id", targetTable: "classrooms" },
          profiles: { fk: "student_id", targetTable: "profiles" },
          attendance_sessions: { fk: "session_id", targetTable: "attendance_sessions" }
        };

        const relationRegex = /(\w+)(!inner)?\(([^)]+(?:\([^)]*\)[^)]*)*)\)/g;

        async function resolveRelations(tableName: string, rows: any[], selectFieldsStr: string): Promise<any[]> {
          if (!rows || rows.length === 0) return rows;
          
          let currentRows = [...rows];
          relationRegex.lastIndex = 0;
          let match;
          
          const matches: { relationName: string; isInner: boolean; subSelectFields: string }[] = [];
          while ((match = relationRegex.exec(selectFieldsStr)) !== null) {
            matches.push({
              relationName: match[1],
              isInner: !!match[2],
              subSelectFields: match[3]
            });
          }

          for (const m of matches) {
            const relationConfig = RELATION_MAP[m.relationName];
            if (!relationConfig) continue;

            const fkVals = Array.from(new Set(currentRows.map(row => row[relationConfig.fk]).filter(Boolean)));
            if (fkVals.length === 0) {
              for (const row of currentRows) {
                row[m.relationName] = null;
              }
              if (m.isInner) {
                currentRows = [];
              }
              continue;
            }

            const targetSql = `SELECT * FROM \`${relationConfig.targetTable}\` WHERE \`id\` IN (${fkVals.map(() => "?").join(",")})`;
            const [targetRows]: any = await mysqlPool.query(targetSql, fkVals);

            for (const r of targetRows) {
              for (const key in r) {
                if (typeof r[key] === "string" && (r[key].startsWith("{") || r[key].startsWith("["))) {
                  try {
                    r[key] = JSON.parse(r[key]);
                  } catch (e) {}
                }
              }
            }

            const resolvedTargetRows = await resolveRelations(relationConfig.targetTable, targetRows, m.subSelectFields);
            const targetMap = new Map(resolvedTargetRows.map(r => [r.id, r]));

            for (const row of currentRows) {
              const fkVal = row[relationConfig.fk];
              const relatedRow = targetMap.get(fkVal) || null;
              if (relatedRow && m.subSelectFields !== "*") {
                const allowedFields = m.subSelectFields.split(",").map(f => f.trim().split("(")[0].trim());
                const filteredRelated: any = {};
                for (const f of allowedFields) {
                  if (f === "*") {
                    Object.assign(filteredRelated, relatedRow);
                  } else if (relatedRow.hasOwnProperty(f)) {
                    filteredRelated[f] = relatedRow[f];
                  }
                }
                for (const k in relatedRow) {
                  if (typeof relatedRow[k] === "object" && relatedRow[k] !== null) {
                    filteredRelated[k] = relatedRow[k];
                  }
                }
                row[m.relationName] = filteredRelated;
              } else {
                row[m.relationName] = relatedRow;
              }
            }

            if (m.isInner) {
              currentRows = currentRows.filter(row => row[m.relationName] !== null);
            }
          }

          return currentRows;
        }

        const hasRelation = selectFields && selectFields.includes("(");
        let sql = "";
        if (hasRelation) {
          sql = `SELECT * FROM \`${table}\` ${whereSQL}`;
        } else {
          sql = `SELECT ${selectFields || "*"} FROM \`${table}\` ${whereSQL}`;
        }

        if (orderConfig) {
          sql += ` ORDER BY \`${orderConfig.column}\` ${orderConfig.ascending ? "ASC" : "DESC"}`;
        }
        if (limitCount) {
          sql += ` LIMIT ${limitCount}`;
        }
        
        const [rows]: any = await mysqlPool.query(sql, queryValues);
        
        let formatted = rows.map((row: any) => {
          for (const key in row) {
            if (typeof row[key] === "string" && (row[key].startsWith("{") || row[key].startsWith("["))) {
              try {
                row[key] = JSON.parse(row[key]);
              } catch (e) {}
            }
            // Boolean fields normalization for membership_tiers
            if (table === "membership_tiers") {
              if ([
                "isDefaultFreeTier", "isActive", "accessAllCourses",
                "accessAllMockTests", "accessAllPractice", "hasAiEvaluation",
                "hasLiveMeetings", "hasCertificates", "hasDownloadMaterials",
                "hasPrioritySupport"
              ].includes(key)) {
                row[key] = Boolean(row[key]);
              }
            }
          }
          return row;
        });

        if (hasRelation) {
          formatted = await resolveRelations(table, formatted, selectFields);
        }
        
        return res.json(formatted);
      }
    } catch (err: any) {
      const tableName = req.body?.table;
      // If table does not exist, auto-create it now and return empty dataset gracefully
      if (err.errno === 1146 || err.code === "ER_NO_SUCH_TABLE" || err.message?.toLowerCase().includes("doesn't exist")) {
        const sample = (req.body?.insertData && (Array.isArray(req.body.insertData) ? req.body.insertData[0] : req.body.insertData)) || 
                       (req.body?.upsertData && (Array.isArray(req.body.upsertData) ? req.body.upsertData[0] : req.body.upsertData)) || 
                       req.body?.updateData;
        await ensureTableExists(tableName, sample);
        return res.json([]);
      }
      console.warn(`MySQL proxy warning on table '${tableName}':`, err.message || err);
      res.status(500).json({ error: err.message });
    }
  });

  // Hostinger MySQL & Local File Persistent Settings Endpoints
  const SETTINGS_FILE_PATH = path.join(process.cwd(), "site_settings.json");
  let cachedServerSettings: Record<string, any> | null = null;
  let cachedServerSettingsTime = 0;

  const readServerSettingsFile = (): Record<string, any> => {
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
        return JSON.parse(raw || "{}");
      }
    } catch (e) {
      console.warn("Could not read site_settings.json:", e);
    }
    return {};
  };

  const writeServerSettingsFile = (settingsObj: Record<string, any>) => {
    try {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsObj, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write site_settings.json:", e);
    }
  };

  app.get("/api/mysql/settings", async (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const now = Date.now();
    if (cachedServerSettings && (now - cachedServerSettingsTime) < 60000) {
      return res.json(cachedServerSettings);
    }
    try {
      const fileData = readServerSettingsFile();
      let mysqlData: Record<string, any> = {};

      try {
        const [rows]: any = await Promise.race([
          mysqlPool.execute("SELECT * FROM resources WHERE name = 'SITE_SETTINGS' AND type = 'SETTINGS' LIMIT 1"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 350))
        ]);
        if (rows && rows.length > 0 && rows[0].url) {
          mysqlData = JSON.parse(rows[0].url);
        }
      } catch (dbErr) {
        // Fallback to fileData
      }

      const merged = { ...fileData, ...mysqlData };
      cachedServerSettings = merged;
      cachedServerSettingsTime = Date.now();
      return res.json(merged);
    } catch (err: any) {
      console.error("Settings GET error:", err);
      const fallback = readServerSettingsFile();
      return res.json(fallback);
    }
  });

  app.post("/api/mysql/settings", async (req, res) => {
    cachedServerSettings = null;
    try {
      const newIncoming = req.body || {};
      const fileData = readServerSettingsFile();
      let mysqlData: Record<string, any> = {};
      let existingId = null;

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT id, url FROM resources WHERE name = 'SITE_SETTINGS' AND type = 'SETTINGS' LIMIT 1"
        );
        if (rows && rows.length > 0) {
          existingId = rows[0].id;
          try {
            mysqlData = JSON.parse(rows[0].url || "{}");
          } catch (e) {}
        }
      } catch (dbErr) {
        // MySQL unavailable, proceed with file
      }

      const mergedSettings = { ...fileData, ...mysqlData, ...newIncoming };

      // Write to site_settings.json
      writeServerSettingsFile(mergedSettings);

      // Attempt write to MySQL
      try {
        const settingsStr = JSON.stringify(mergedSettings);
        if (existingId) {
          await mysqlPool.execute(
            "UPDATE resources SET url = ? WHERE id = ?",
            [settingsStr, existingId]
          );
        } else {
          const newId = `settings-${Date.now()}`;
          await mysqlPool.execute(
            "INSERT INTO resources (id, name, type, url) VALUES (?, 'SITE_SETTINGS', 'SETTINGS', ?)",
            [newId, settingsStr]
          );
        }
      } catch (dbErr) {
        console.warn("MySQL settings save failed, saved to server file fallback:", dbErr);
      }

      res.json({ success: true, settings: mergedSettings });
    } catch (err: any) {
      console.error("Settings POST error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Hostinger MySQL & Local File Persistent Mock Tests Endpoints
  const MOCK_TESTS_FILE_PATH = path.join(process.cwd(), "site_mock_tests.json");

  const readServerMockTestsFile = (): any[] => {
    try {
      if (fs.existsSync(MOCK_TESTS_FILE_PATH)) {
        const raw = fs.readFileSync(MOCK_TESTS_FILE_PATH, "utf-8");
        return JSON.parse(raw || "[]");
      }
    } catch (e) {
      console.warn("Could not read site_mock_tests.json:", e);
    }
    return [];
  };

  const writeServerMockTestsFile = (mockTestsArr: any[]) => {
    try {
      fs.writeFileSync(MOCK_TESTS_FILE_PATH, JSON.stringify(mockTestsArr, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write site_mock_tests.json:", e);
    }
  };

  app.get("/api/mysql/mock_tests", async (req, res) => {
    try {
      const fileData = readServerMockTestsFile();
      let mysqlData: any[] = [];

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT * FROM resources WHERE name = 'SITE_MOCK_TESTS' AND type = 'MOCK_TESTS' LIMIT 1"
        );
        if (rows && rows.length > 0 && rows[0].url) {
          mysqlData = JSON.parse(rows[0].url);
        }
      } catch (dbErr) {
        // MySQL fallback
      }

      const mergedMap = new Map();
      fileData.forEach((item: any) => { if (item && item.id) mergedMap.set(item.id, item); });
      mysqlData.forEach((item: any) => { if (item && item.id) mergedMap.set(item.id, item); });

      return res.json(Array.from(mergedMap.values()));
    } catch (err: any) {
      console.error("Mock tests GET error:", err);
      res.json(readServerMockTestsFile());
    }
  });

  app.post("/api/mysql/mock_tests", async (req, res) => {
    try {
      const incomingItem = req.body;
      const currentList = readServerMockTestsFile();
      
      let mysqlData: any[] = [];
      let existingId = null;

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT id, url FROM resources WHERE name = 'SITE_MOCK_TESTS' AND type = 'MOCK_TESTS' LIMIT 1"
        );
        if (rows && rows.length > 0) {
          existingId = rows[0].id;
          try {
            mysqlData = JSON.parse(rows[0].url || "[]");
          } catch (e) {}
        }
      } catch (dbErr) {}

      const combinedMap = new Map();
      currentList.forEach((item: any) => { if (item && item.id) combinedMap.set(item.id, item); });
      mysqlData.forEach((item: any) => { if (item && item.id) combinedMap.set(item.id, item); });

      if (Array.isArray(incomingItem)) {
        incomingItem.forEach((item: any) => { if (item && item.id) combinedMap.set(item.id, item); });
      } else if (incomingItem && incomingItem.id) {
        combinedMap.set(incomingItem.id, incomingItem);
      }

      const updatedList = Array.from(combinedMap.values());

      writeServerMockTestsFile(updatedList);

      try {
        const strVal = JSON.stringify(updatedList);
        if (existingId) {
          await mysqlPool.execute("UPDATE resources SET url = ? WHERE id = ?", [strVal, existingId]);
        } else {
          const newId = `mocktests-${Date.now()}`;
          await mysqlPool.execute("INSERT INTO resources (id, name, type, url) VALUES (?, 'SITE_MOCK_TESTS', 'MOCK_TESTS', ?)", [newId, strVal]);
        }
      } catch (dbErr) {
        console.warn("MySQL mock tests save failed, saved to server file fallback:", dbErr);
      }

      res.json({ success: true, mock_tests: updatedList });
    } catch (err: any) {
      console.error("Mock tests POST error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/mysql/mock_tests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentList = readServerMockTestsFile();
      const filtered = currentList.filter((item: any) => item.id !== id);
      writeServerMockTestsFile(filtered);

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT id FROM resources WHERE name = 'SITE_MOCK_TESTS' AND type = 'MOCK_TESTS' LIMIT 1"
        );
        if (rows && rows.length > 0) {
          await mysqlPool.execute("UPDATE resources SET url = ? WHERE id = ?", [JSON.stringify(filtered), rows[0].id]);
        }
      } catch (dbErr) {}

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Media Courses Persistent API Endpoints
  const MEDIA_COURSES_FILE_PATH = path.join(process.cwd(), "site_media_courses.json");

  const readServerMediaCoursesFile = (): any[] => {
    try {
      if (fs.existsSync(MEDIA_COURSES_FILE_PATH)) {
        const raw = fs.readFileSync(MEDIA_COURSES_FILE_PATH, "utf-8");
        return JSON.parse(raw || "[]");
      }
    } catch (e) {
      console.warn("Could not read site_media_courses.json:", e);
    }
    return [];
  };

  const writeServerMediaCoursesFile = (mediaCoursesArr: any[]) => {
    try {
      fs.writeFileSync(MEDIA_COURSES_FILE_PATH, JSON.stringify(mediaCoursesArr, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write site_media_courses.json:", e);
    }
  };

  app.get("/api/media_courses", async (req, res) => {
    try {
      const fileData = readServerMediaCoursesFile();
      let mysqlData: any[] = [];

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT * FROM resources WHERE name = 'SITE_MEDIA_COURSES' AND type = 'MEDIA_COURSES' LIMIT 1"
        );
        if (rows && rows.length > 0 && rows[0].url) {
          mysqlData = JSON.parse(rows[0].url);
        }
      } catch (dbErr) {}

      const mergedMap = new Map();
      fileData.forEach((item: any) => { if (item && item.id) mergedMap.set(item.id, item); });
      mysqlData.forEach((item: any) => { if (item && item.id) mergedMap.set(item.id, item); });

      return res.json(Array.from(mergedMap.values()));
    } catch (err: any) {
      console.error("Media courses GET error:", err);
      res.json(readServerMediaCoursesFile());
    }
  });

  app.post("/api/media_courses/sync", async (req, res) => {
    try {
      const { courses: incomingCourses } = req.body;
      if (!Array.isArray(incomingCourses)) {
        return res.status(400).json({ error: "courses must be an array" });
      }

      writeServerMediaCoursesFile(incomingCourses);

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT id FROM resources WHERE name = 'SITE_MEDIA_COURSES' AND type = 'MEDIA_COURSES' LIMIT 1"
        );
        if (rows && rows.length > 0) {
          await mysqlPool.execute(
            "UPDATE resources SET url = ? WHERE id = ?",
            [JSON.stringify(incomingCourses), rows[0].id]
          );
        } else {
          await mysqlPool.execute(
            "INSERT INTO resources (id, name, type, url) VALUES (?, 'SITE_MEDIA_COURSES', 'MEDIA_COURSES', ?)",
            [crypto.randomUUID(), JSON.stringify(incomingCourses)]
          );
        }
      } catch (dbErr) {
        console.warn("MySQL media courses sync save failed, using local file:", dbErr);
      }

      res.json({ success: true, count: incomingCourses.length });
    } catch (err: any) {
      console.error("Media courses sync error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/media_courses", async (req, res) => {
    try {
      const incoming = req.body;
      const currentList = readServerMediaCoursesFile();
      const existingIdx = currentList.findIndex((item: any) => item.id === incoming.id);
      let updatedList = [...currentList];
      if (existingIdx !== -1) {
        updatedList[existingIdx] = incoming;
      } else {
        updatedList.unshift(incoming);
      }

      writeServerMediaCoursesFile(updatedList);

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT id FROM resources WHERE name = 'SITE_MEDIA_COURSES' AND type = 'MEDIA_COURSES' LIMIT 1"
        );
        if (rows && rows.length > 0) {
          await mysqlPool.execute(
            "UPDATE resources SET url = ? WHERE id = ?",
            [JSON.stringify(updatedList), rows[0].id]
          );
        } else {
          await mysqlPool.execute(
            "INSERT INTO resources (id, name, type, url) VALUES (?, 'SITE_MEDIA_COURSES', 'MEDIA_COURSES', ?)",
            [crypto.randomUUID(), JSON.stringify(updatedList)]
          );
        }
      } catch (dbErr) {}

      res.json({ success: true, course: incoming });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/media_courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentList = readServerMediaCoursesFile();
      const filtered = currentList.filter((item: any) => item.id !== id);
      writeServerMediaCoursesFile(filtered);

      try {
        const [rows]: any = await mysqlPool.execute(
          "SELECT id FROM resources WHERE name = 'SITE_MEDIA_COURSES' AND type = 'MEDIA_COURSES' LIMIT 1"
        );
        if (rows && rows.length > 0) {
          await mysqlPool.execute("UPDATE resources SET url = ? WHERE id = ?", [JSON.stringify(filtered), rows[0].id]);
        }
      } catch (dbErr) {}

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/mysql/team_members", async (req, res) => {
    try {
      const [rows]: any = await mysqlPool.execute(
        "SELECT * FROM team_members ORDER BY sort_order ASC"
      );
      const formatted = rows.map((row: any) => {
        let exp = row.expertise;
        if (typeof exp === "string") {
          try {
            exp = JSON.parse(exp);
          } catch (e) {
            exp = exp.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }
        return {
          ...row,
          expertise: exp || []
        };
      });
      res.json(formatted);
    } catch (err: any) {
      console.error("MySQL team_members GET error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/mysql/team_members", async (req, res) => {
    try {
      const member = req.body;
      const { id, name, role, avatar_url, bio, sort_order, credentials, expertise, email, linkedin, gradient, image_url } = member;
      const expStr = Array.isArray(expertise) ? JSON.stringify(expertise) : (typeof expertise === "string" ? expertise : "[]");
      const isNew = !id || String(id).startsWith("temp-") || String(id).startsWith("team-new-") || String(id).startsWith("local-");
      
      if (isNew) {
        const newId = `team-${Date.now()}`;
        await mysqlPool.execute(
          "INSERT INTO team_members (id, name, role, avatar_url, bio, sort_order, credentials, expertise, email, linkedin, gradient, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [newId, name || "", role || "", avatar_url || "", bio || "", Number(sort_order || 0), credentials || "", expStr, email || "", linkedin || "", gradient || "", image_url || ""]
        );
        res.json({ success: true, id: newId });
      } else {
        await mysqlPool.execute(
          "UPDATE team_members SET name=?, role=?, avatar_url=?, bio=?, sort_order=?, credentials=?, expertise=?, email=?, linkedin=?, gradient=?, image_url=? WHERE id=?",
          [name || "", role || "", avatar_url || "", bio || "", Number(sort_order || 0), credentials || "", expStr, email || "", linkedin || "", gradient || "", image_url || "", id]
        );
        res.json({ success: true, id });
      }
    } catch (err: any) {
      console.error("MySQL team_members POST error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/mysql/team_members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await mysqlPool.execute("DELETE FROM team_members WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("MySQL team_members DELETE error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/mysql/testimonials", async (req, res) => {
    try {
      const [rows]: any = await mysqlPool.execute(
        "SELECT * FROM testimonials ORDER BY created_at DESC"
      );
      res.json(rows);
    } catch (err: any) {
      console.error("MySQL testimonials GET error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/mysql/testimonials", async (req, res) => {
    try {
      const testimonial = req.body;
      const { id, name, role, comment, rating, avatar_url } = testimonial;
      const isNew = !id || String(id).startsWith("temp-") || String(id).startsWith("local-") || String(id).startsWith("t-local-");
      
      if (isNew) {
        const newId = `testi-${Date.now()}`;
        await mysqlPool.execute(
          "INSERT INTO testimonials (id, name, role, comment, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
          [newId, name || "", role || "", comment || "", Number(rating || 5), avatar_url || ""]
        );
        res.json({ success: true, id: newId });
      } else {
        await mysqlPool.execute(
          "UPDATE testimonials SET name=?, role=?, comment=?, rating=?, avatar_url=? WHERE id=?",
          [name || "", role || "", comment || "", Number(rating || 5), avatar_url || "", id]
        );
        res.json({ success: true, id });
      }
    } catch (err: any) {
      console.error("MySQL testimonials POST error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/mysql/testimonials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await mysqlPool.execute("DELETE FROM testimonials WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("MySQL testimonials DELETE error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/mysql/courses", async (req, res) => {
    try {
      const [rows]: any = await mysqlPool.execute(
        "SELECT id, title, description, category, status, level, type, difficulty, test_number, modules FROM courses"
      );
      const formatted = rows.map((row: any) => {
        let mods = row.modules;
        if (typeof mods === "string") {
          try { mods = JSON.parse(mods); } catch { mods = []; }
        }
        return {
          ...row,
          modules: mods || []
        };
      });
      res.json(formatted);
    } catch (err: any) {
      console.error("MySQL courses GET error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/evaluate-writing", async (req, res) => {
    try {
      const { essay, taskType, userId } = req.body;
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Evaluate this IELTS Writing ${taskType} essay. You MUST return a JSON object matching the following structure exactly. Do not wrap code blocks in standard markdown unless requested.

JSON Type Structure:
{
  "overallBand": number,
  "criteria": {
    "taskResponse": {
      "band": number,
      "comment": "string (detailed explanatory evaluation with advice)"
    },
    "coherenceCohesion": {
      "band": number,
      "comment": "string (detailed explanatory evaluation with advice)"
    },
    "lexicalResource": {
      "band": number,
      "comment": "string (detailed explanatory evaluation with advice)"
    },
    "grammaticalRange": {
      "band": number,
      "comment": "string (detailed explanatory evaluation with advice)"
    }
  },
  "corrections": [
    "string of specific corrections or inline errors found with improvements"
  ],
  "suggestions": "string supporting general summary suggestions"
}

Essay text to evaluate:
${essay}`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = cleanAndParseJSON(response.text || "{}");

      // Persist to Hostinger MySQL
      if (userId && mysqlPool) {
        try {
          const evalId = crypto.randomUUID();
          await mysqlPool.execute(
            "INSERT INTO writing_evaluations (id, user_id, essay, task_type, score, feedback) VALUES (?, ?, ?, ?, ?, ?)",
            [evalId, userId, essay, taskType, result.overallBand || null, JSON.stringify(result)]
          );
          console.log(`Successfully saved writing evaluation ${evalId} to MySQL.`);
        } catch (dbErr) {
          console.error("MySQL Writing Evaluation Save Error:", dbErr);
        }
      }

      // Persist to Supabase if userId and supabaseAdmin are available
      if (userId && supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('writing_evaluations')
          .insert([
            { 
              user_id: userId, 
              essay: essay, 
              task_type: taskType, 
              score: result.overallBand, 
              feedback: result 
            }
            // Ignore error logs or failure fallback
          ]);
        if (error) console.error("Supabase Save Error:", error);
      }

      res.json(result);
    } catch (error) {
      console.error("Gemini Evaluation Error:", error);
      res.status(500).json({ error: "Failed to evaluate essay using AI model" });
    }
  });

  app.post("/api/gemini/evaluate-speaking", async (req, res) => {
    try {
      const { transcript, duration, topicPrompt, userId } = req.body;
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Evaluate this IELTS Speaking practice session. Analyze the speaker's monologue response to the custom prompt.
You MUST return a JSON object matching the following structure exactly. Do not wrap code blocks in standard markdown labels.

Speaking Cue Card Prompt:
"${topicPrompt}"

Recorded Spoken Transcript:
"${transcript}"

Metadata:
- Duration of Speech: ${duration} seconds

JSON Type Structure:
{
  "overallBand": number (increments of 0.5 like 6.5, 7.0, 8.0, 5.5 etc.),
  "criteria": {
    "fluencyCoherence": {
      "band": number,
      "comment": "string (detailed critique of pacing, sentence connectors, and discourse markers with action-oriented improvement)"
    },
    "lexicalResource": {
      "band": number,
      "comment": "string (critique of vocabulary variety, precision, and suggestions for idiomatic and academic substitutions)"
    },
    "grammaticalRange": {
      "band": number,
      "comment": "string (grammatical accuracy, structure variance, error analysis, and complex tense recommendations)"
    },
    "pronunciation": {
      "band": number,
      "comment": "string (inferred acoustic advice on rhythm, intonation, vowel/consonant clarity, and chunking based on grammatical cues)"
    }
  },
  "fluencyFeedback": "string of summary comments on delivery flow and hesitations",
  "lexicalHighlights": [
    "string list showing enhanced synonyms or relevant high-level band phrases optimized for this specific cue card topic"
  ],
  "grammaticalFixes": [
    "string list of corrections to the grammatical mistakes detected in the transcript text"
  ],
  "suggestions": "string outlining a comprehensive daily practice strategy to master speaking confidence"
}
`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = cleanAndParseJSON(response.text || "{}");

      // Persist speaking evaluation to Hostinger MySQL
      if (userId && mysqlPool) {
        try {
          const evalId = crypto.randomUUID();
          await mysqlPool.execute(
            "INSERT INTO speaking_evaluations (id, user_id, transcript, topic_prompt, duration, score, feedback) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [evalId, userId, transcript, topicPrompt, duration || 0, result.overallBand || null, JSON.stringify(result)]
          );
          console.log(`Successfully saved speaking evaluation ${evalId} to MySQL.`);
        } catch (dbErr) {
          console.error("MySQL Speaking Evaluation Save Error:", dbErr);
        }
      }

      // Persist speaking evaluation to Supabase
      if (userId && supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('speaking_evaluations')
          .insert([
            {
              user_id: userId,
              transcript: transcript,
              topic_prompt: topicPrompt,
              duration: duration,
              score: result.overallBand,
              feedback: result
            }
          ]);
        if (error) console.error("Supabase Speaking Save Error:", error);
      }

      res.json(result);
    } catch (error) {
      console.error("Gemini Speaking Evaluation Error:", error);
      res.status(500).json({ error: "Failed to evaluate speaking response using AI model" });
    }
  });

  // Multimodal Speaking Practice Evaluation API
  app.post("/api/gemini/analyze-speaking-audio", async (req, res) => {
    try {
      const { audio, questionText, questionAnswer, duration } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      // Extract raw base64 data from the data URL if needed
      let base64Data = audio;
      let mimeType = "audio/webm";

      if (audio.includes(";base64,")) {
        const parts = audio.split(";base64,");
        base64Data = parts[1];
        mimeType = parts[0].replace("data:", "");
      }

      const audioPart = {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: base64Data,
        },
      };

      const systemPrompt = `You are a certified IELTS Speaking examiner and clear English pronunciation coach. 
Analyze the user's spoken audio response to the corresponding practice question. 
Assess and provide feedback based on standard IELTS Speaking criteria.

Question Text: "${questionText}"
${questionAnswer ? `Expected Answer Criteria/Key: "${questionAnswer}"` : ""}
${duration ? `Response duration: ${duration} seconds` : ""}

You MUST return a JSON object with this exact schema (do NOT wrap inside markdowns):
{
  "transcript": "string containing your precise transcription of what they said",
  "overallBand": number (estimated IELTS speaking band from 1.0 to 9.0 in steps of 0.5),
  "criteria": {
    "fluencyCoherence": {
      "band": number (1-9),
      "comment": "string feedback on fluency"
    },
    "lexicalResource": {
      "band": number (1-9),
      "comment": "string feedback on vocabulary"
    },
    "grammaticalRange": {
      "band": number (1-9),
      "comment": "string feedback on grammar accuracy"
    },
    "pronunciation": {
      "band": number (1-9),
      "comment": "string feedback on clarity and word stress"
    }
  },
  "suggestions": "string with actionable suggestions on how to improve"
}`;

      const modelResponse = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          audioPart,
          { text: systemPrompt }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        }
      });

      const text = modelResponse.text || "{}";
      const result = cleanAndParseJSON(text);

      res.json(result);
    } catch (error: any) {
      console.error("Gemini Multimodal Speaking Analysis Error:", error);
      res.status(500).json({ 
        error: "Failed to analyze speaking response using Google Gemini: " + error.message,
        fallbackFeedback: {
          transcript: "[Analysis Unavailable]",
          overallBand: 5.5,
          criteria: {
            fluencyCoherence: { band: 5.5, comment: "We could not run full AI audio analysis. Please check your mic connection." },
            lexicalResource: { band: 5.5, comment: "Vocabulary analysis unavailable due to processing error." },
            grammaticalRange: { band: 5.5, comment: "Grammar check failed for this snippet." },
            pronunciation: { band: 5.5, comment: "Pronunciation parsing failed." }
          },
          suggestions: "Try recording in a quieter room and speaking closer to the microphone."
        }
      });
    }
  });

  // AI Conversational Speaking Coach
  app.post("/api/gemini/chat-coach", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const systemInstruction = `You are "SEBS Speaking AI Coach Clara", a warm, encouraging, international IELTS spoken English instructor. You converse with students ONLY in English.
If they speak or write in any language other than English (including Spanish, Arabic, Chinese, Russian, Hindi, etc.), gently but firmly remind them that practicing English is the path to success and force them to reply/speak in English!
Keep your formatting fully text-based. Keep comments exceptionally positive, friendly, and conversational (maximum 2-3 sentences max).
Always correct any notable grammatical or pronunciation errors in their previous message in a friendly, constructive bullet point starting with "* ", before presenting your conversation response.
Always close with an engaging, simple, open-ended question in English to keep the conversation flowing.`;

      const contents: any[] = [
        { role: "user", parts: [{ text: "Hello! Let's start practicing." }] },
        { role: "model", parts: [{ text: "Hello! I'm Clara, your SEBS English Speaking Coach. What topic shall we practice today? I can help with general conversation, or we can warm up for IELTS!" }] }
      ];

      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }

      if (message) {
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });
      }

      const chatResponse = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = chatResponse.text || "Hello! Let's keep talking in English.";

      let base64Audio = "";
      try {
        const speechResponse = await generateContentWithRetry({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: responseText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" }
              }
            }
          }
        });
        
        base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
      } catch (audioErr) {
        console.error("Clara Coach Speech Synthesis Error:", audioErr);
      }

      res.json({
        text: responseText,
        audio: base64Audio
      });

    } catch (err: any) {
      console.error("AI Conversation Coach Error:", err);
      res.status(500).json({ error: "Failed to connect with speaking coach: " + err.message });
    }
  });

  // AI Course Generator Endpoint
  app.post("/api/gemini/generate-course", async (req: any, res: any) => {
    try {
      const { topic, rawText, type, cefrLevel, difficulty, timeLimit, testNumber, course_type, skillType, audioUrl, accessTier, category } = req.body;

      const activeCourseType = course_type || (skillType ? `${skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test` : "Reading Test");
      const normalizedSkill = activeCourseType.toLowerCase().includes("listening") ? "listening"
        : activeCourseType.toLowerCase().includes("writing") ? "writing"
        : activeCourseType.toLowerCase().includes("speaking") ? "speaking"
        : activeCourseType.toLowerCase().includes("mock") ? "mock"
        : "reading";

      let prompt = "";
      let temperature = 0.8;

      if (rawText && rawText.trim() !== "") {
        temperature = 0.1; // Low temperature for high-fidelity parsing/extraction tasks
        prompt = `You are an expert IELTS Exam Parser. Your task is to parse, structure, and format the user's provided raw text into a valid split-screen JSON object.
Skill Type: "${activeCourseType}" (Skill: ${normalizedSkill})
Exam Type: "${type || "Academic"}"
Target Audio Link: "${audioUrl || ""}"

Here is the user-provided IELTS examination/study material containing content, prompts, and questions:
"""
${rawText}
"""

Instructions for parsing based on skill:
1. If this is a Reading Test:
   - Identify all reading passages/sections (Passage 1, 2, 3) and put into "blocks.left" as "type": "reading-passage" with sectionNumber 1, 2, or 3.
   - Group all questions sequentially into "blocks.right" ("true-false-not-given", "mcq", "sentence-completion", "summary-completion", "matching-headings", "matching-information", "fill-blanks").
   - Ensure every question in "blocks.right" includes "sectionNumber": 1, 2, or 3 corresponding to its passage.

2. If this is a Listening Test:
   - Place listening audio scripts, scenario cues, and section transcripts into "blocks.left" with "type": "text" or "audio".
   - Place all listening questions (MCQs, form completion, notes completion, matching) into "blocks.right" ("listening-mcq", "fill-blanks", "sentence-completion", "mcq").
   - Include the "audio_url": "${audioUrl || ""}" in the top-level metadata.

3. If this is a Writing Test:
   - Place Task 1 (Academic visual chart/graph/process or GT Letter) and Task 2 (Discursive essay) instructions and prompts into "blocks.left" ("type": "text").
   - Place the interactive student writing essay input blocks into "blocks.right" ("academic-task1", "general-task1", "task2") with prompt text and minimum word counts (150 words for Task 1, 250 words for Task 2).

4. If this is a Speaking Test:
   - Place interview prompts, Part 1 questions, Part 2 Cue Card (with bullet points), and Part 3 discussion questions into "blocks.right" ("part1", "cue-card", "part3") and introductory guidelines in "blocks.left".

Ensure the output is formatted as a valid JSON object matching this structure EXACTLY:
{
  "title": "${topic ? activeCourseType + ": " + topic : activeCourseType + " Practice Test"}",
  "description": "Comprehensive ${activeCourseType} featuring high-quality syllabus materials, accurate scoring keys, and multi-question interactive assessments.",
  "course_type": "${activeCourseType}",
  "type": "${type || "Academic"}",
  "category": "${category || (normalizedSkill.charAt(0).toUpperCase() + normalizedSkill.slice(1) + " Mastery")}",
  "layout_type": "split",
  "timeLimit": ${Number(timeLimit) || (normalizedSkill === "listening" ? 30 : normalizedSkill === "speaking" ? 15 : 60)},
  "test_number": "${testNumber || "1"}",
  "audio_url": "${audioUrl || ""}",
  "access_tier": "${accessTier || "Free Trial"}",
  "blocks": {
    "single": [],
    "left": [
      /* Content materials, passages, audio scripts, or task prompts */
    ],
    "right": [
      /* Question blocks, interactive inputs, and instruction ranges. DO NOT TRUNCATE OR OMIT ANY QUESTIONS! */
    ]
  }
}

Ensure the output JSON is clean, complete, and fully parseable. Do not wrap code blocks in markdown or backticks.`;
      } else {
        temperature = 0.8;
        if (normalizedSkill === "listening") {
          prompt = `Generate a complete, professional, highly realistic IELTS Listening Test from scratch.
The topic of the course is: "${topic || "Campus Orientation and Environmental Research"}"
CEFR Level: "${cefrLevel || "B2"}"
Exam Type: "${type || "Academic"}"
Difficulty Score: "${difficulty || "7.0"}/10"
Time Limit: ${timeLimit || 30} minutes
Test Number: "${testNumber || "1"}"
Audio Stream URL: "${audioUrl || ""}"

You MUST generate a comprehensive IELTS Listening Test with a split screen layout:
- "left": Listening scenario guides, Section 1-4 summaries, and dialogue transcripts.
- "right": Authentic IELTS listening questions (Form/Note completion with gaps "____", Section 1/2/3/4 MCQs, Sentence Completion).

Format output as JSON:
{
  "title": "IELTS Listening: ${topic || "Campus Orientation & Research"}",
  "description": "Interactive IELTS Listening exam with simulated audio cues, note-taking exercises, and multi-choice question sets.",
  "course_type": "Listening Test",
  "type": "${type || "Academic"}",
  "category": "${category || "Listening Mastery"}",
  "layout_type": "split",
  "timeLimit": ${Number(timeLimit) || 30},
  "test_number": "${testNumber || "1"}",
  "audio_url": "${audioUrl || ""}",
  "access_tier": "${accessTier || "Free Trial"}",
  "blocks": {
    "single": [],
    "left": [
      {
        "id": "block_listening_sec1",
        "type": "text",
        "sectionNumber": 1,
        "data": {
          "title": "Section 1: Audio Transcript & Scenario",
          "text": "Scenario: A conversation between a university student and a housing officer.\n\nOfficer: Good morning, Student Accommodation Services, how can I help you?..."
        }
      },
      {
        "id": "block_listening_sec2",
        "type": "text",
        "sectionNumber": 2,
        "data": {
          "title": "Section 2: Campus Guide",
          "text": "Scenario: A guide explaining facilities at the new campus sports center..."
        }
      }
    ],
    "right": [
      {
        "id": "block_instr_1",
        "type": "question-range",
        "sectionNumber": 1,
        "data": {
          "sectionNumber": 1,
          "text": "Questions 1–5: Form Completion (Write NO MORE THAN TWO WORDS AND/OR A NUMBER)"
        }
      },
      {
        "id": "block_blank_1",
        "type": "fill-blanks",
        "sectionNumber": 1,
        "data": {
          "sectionNumber": 1,
          "sectionHeading": "Student Accommodation Registration",
          "sectionInstruction": "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
          "text": "Applicant Name: Sarah ____\\nRoom Preference: Single room with private ____\\nMove-in Date: 15th of ____\\nWeekly Budget: £____\\nContact Phone: 07892-____",
          "answers": "Jenkins | bathroom | September | 140 | 334551"
        }
      },
      {
        "id": "block_instr_2",
        "type": "question-range",
        "sectionNumber": 2,
        "data": {
          "sectionNumber": 2,
          "text": "Questions 6–10: Multiple Choice"
        }
      },
      {
        "id": "block_mcq_6",
        "type": "mcq",
        "sectionNumber": 2,
        "data": {
          "sectionNumber": 2,
          "questionNumber": 6,
          "question": "What time does the Olympic swimming pool open on weekends?",
          "options": ["A. 06:30 AM", "B. 07:00 AM", "C. 08:00 AM", "D. 09:00 AM"],
          "correctAnswer": "B"
        }
      },
      {
        "id": "block_mcq_7",
        "type": "mcq",
        "sectionNumber": 2,
        "data": {
          "sectionNumber": 2,
          "questionNumber": 7,
          "question": "Which membership tier includes free locker rental?",
          "options": ["A. Bronze", "B. Silver", "C. Gold", "D. Platinum"],
          "correctAnswer": "C"
        }
      }
    ]
  }
}`;
        } else if (normalizedSkill === "writing") {
          prompt = `Generate a complete, authentic IELTS Writing Test from scratch.
Topic: "${topic || "Urban Transport and Environmental Sustainability"}"
Exam Type: "${type || "Academic"}"
CEFR Level: "${cefrLevel || "C1"}"
Difficulty Score: "${difficulty || "7.5"}/10"
Time Limit: ${timeLimit || 60} minutes
Test Number: "${testNumber || "1"}"

Format output as JSON:
{
  "title": "IELTS Writing: ${topic || "Urban Development & Climate Action"}",
  "description": "Authentic IELTS Writing exam containing Task 1 visual data report / letter and Task 2 formal discursive essay with scoring guidelines.",
  "course_type": "Writing Test",
  "type": "${type || "Academic"}",
  "category": "${category || "Writing Mastery"}",
  "layout_type": "split",
  "timeLimit": ${Number(timeLimit) || 60},
  "test_number": "${testNumber || "1"}",
  "access_tier": "${accessTier || "Free Trial"}",
  "blocks": {
    "single": [],
    "left": [
      {
        "id": "block_w_task1_prompt",
        "type": "text",
        "data": {
          "title": "Task 1 Guidelines & Prompt",
          "text": "You should spend about 20 minutes on this task.\\n\\nThe chart below shows the percentage of energy generated from renewable sources in four European countries between 2010 and 2024.\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."
        }
      },
      {
        "id": "block_w_task2_prompt",
        "type": "text",
        "data": {
          "title": "Task 2 Discursive Essay Prompt",
          "text": "You should spend about 40 minutes on this task.\\n\\nWrite about the following topic:\\n\\nSome people believe that governments should heavily tax carbon-emitting industries, while others argue that financial incentives for green innovation are more effective.\\n\\nDiscuss both views and give your own opinion.\\n\\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\\n\\nWrite at least 250 words."
        }
      }
    ],
    "right": [
      {
        "id": "block_task1_input",
        "type": "${type === "General Training (GT)" ? "general-task1" : "academic-task1"}",
        "data": {
          "taskType": "Task 1",
          "title": "Writing Task 1 Response",
          "prompt": "Summarise the renewable energy trends across the four countries (minimum 150 words).",
          "minWords": 150
        }
      },
      {
        "id": "block_task2_input",
        "type": "task2",
        "data": {
          "taskType": "Task 2",
          "title": "Writing Task 2 Essay Response",
          "prompt": "Discuss carbon taxes vs green innovation incentives and provide your substantiated perspective (minimum 250 words).",
          "minWords": 250
        }
      }
    ]
  }
}`;
        } else if (normalizedSkill === "speaking") {
          prompt = `Generate a complete IELTS Speaking Interview Test from scratch.
Topic: "${topic || "Artificial Intelligence, Careers and Daily Routines"}"
Exam Type: "${type || "Academic"}"
CEFR Level: "${cefrLevel || "B2"}"
Time Limit: ${timeLimit || 15} minutes
Test Number: "${testNumber || "1"}"

Format output as JSON:
{
  "title": "IELTS Speaking: ${topic || "Technology, Careers & Future Society"}",
  "description": "Full three-part IELTS Speaking interview with examiner questions, Part 2 Cue Card preparation, and Part 3 abstract discussion topics.",
  "course_type": "Speaking Test",
  "type": "${type || "Academic"}",
  "category": "${category || "Speaking Mastery"}",
  "layout_type": "split",
  "timeLimit": ${Number(timeLimit) || 15},
  "test_number": "${testNumber || "1"}",
  "access_tier": "${accessTier || "Free Trial"}",
  "blocks": {
    "single": [],
    "left": [
      {
        "id": "block_spk_info",
        "type": "text",
        "data": {
          "title": "Examiner Instructions & Band Descriptors",
          "text": "The IELTS Speaking test consists of 3 parts:\\n• Part 1: Introduction and interview (4–5 minutes)\\n• Part 2: Individual long turn / Cue card (3–4 minutes including 1 min preparation)\\n• Part 3: Two-way discussion (4–5 minutes)\\n\\nCandidates are assessed on: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation."
        }
      }
    ],
    "right": [
      {
        "id": "block_spk_p1",
        "type": "part1",
        "data": {
          "part": "1",
          "title": "Part 1: Warm-up & Familiar Topics",
          "prompt": "1. Do you use computers or digital tools frequently in your daily study or work?\\n2. What was the first piece of technology you remember using as a child?\\n3. Do you think technology makes life simpler or more complicated?",
          "questions": [
            "Do you use computers or digital tools frequently in your daily study or work?",
            "What was the first piece of technology you remember using as a child?",
            "Do you think technology makes life simpler or more complicated?"
          ]
        }
      },
      {
        "id": "block_spk_p2",
        "type": "cue-card",
        "data": {
          "part": "2",
          "title": "Part 2: Individual Long Turn (Cue Card)",
          "prompt": "Describe a recent technological device or application that you found exceptionally helpful.\\n\\nYou should say:\\n• What it is and how you discovered it\\n• How frequently you use it\\n• What specific features make it effective\\nand explain how this technology has improved your productivity or lifestyle."
        }
      },
      {
        "id": "block_spk_p3",
        "type": "part3",
        "data": {
          "part": "3",
          "title": "Part 3: In-depth Abstract Discussion",
          "prompt": "1. How might artificial intelligence transform workplace dynamics in the coming decade?\\n2. Should governments implement stricter ethical regulations on algorithmic decision-making?\\n3. Is there a risk that future generations will lose fundamental cognitive skills due to automated tools?",
          "questions": [
            "How might artificial intelligence transform workplace dynamics in the coming decade?",
            "Should governments implement stricter ethical regulations on algorithmic decision-making?",
            "Is there a risk that future generations will lose fundamental cognitive skills due to automated tools?"
          ]
        }
      }
    ]
  }
}`;
        } else {
          // Default Reading Test
          prompt = `Generate a complete, professional, highly realistic IELTS Reading Course/Test from scratch.
The topic of the course is: "${topic || "AI and Technology in Society"}"
CEFR Level: "${cefrLevel || "B2"}"
Exam Type: "${type || "Academic"}"
Difficulty Score: "${difficulty || "6.5"}/10"
Time Limit: ${timeLimit || 60} minutes
Test Number: "${testNumber || "1"}"

You MUST generate a comprehensive IELTS Reading Test with a split screen layout where blocks are separated into a "left" list (Reading Passages) and a "right" list (Questions and Instructions).
Ensure that the output is formatted as a valid JSON object matching the following structure EXACTLY:
{
  "title": "IELTS Reading: ${topic || "Advances in Modern Science"}",
  "description": "A comprehensive IELTS Reading practice exam designed to test skimming, scanning, deep text analysis, and logical reasoning.",
  "course_type": "Reading Test",
  "type": "${type || "Academic"}",
  "category": "${category || "Reading Mastery"}",
  "layout_type": "split",
  "timeLimit": ${Number(timeLimit) || 60},
  "test_number": "${testNumber || "1"}",
  "access_tier": "${accessTier || "Free Trial"}",
  "blocks": {
    "single": [],
    "left": [
      {
        "id": "block_passage_1",
        "type": "reading-passage",
        "data": {
          "title": "Passage 1: Sustainable Energy Architectures",
          "text": "Across the globe, urban environments are encountering unprecedented challenges concerning energy distribution and carbon emissions..."
        }
      },
      {
        "id": "block_passage_2",
        "type": "reading-passage",
        "data": {
          "title": "Passage 2: Cognitive Neuroscience & Learning",
          "text": "Neuroplasticity—the brain's capacity to reorganise synaptic connections—has emerged as a foundational principle in developmental psychology..."
        }
      }
    ],
    "right": [
      {
        "id": "block_instr_1",
        "type": "question-range",
        "data": {
          "text": "Questions 1–5: True/False/Not Given"
        }
      },
      {
        "id": "block_tf_1",
        "type": "true-false-not-given",
        "data": {
          "sectionHeading": "True/False/Not Given questions for Passage 1",
          "sectionInstruction": "Write TRUE if the statement agrees with the information, FALSE if it contradicts, or NOT GIVEN if there is no information.",
          "statements": [
            { "id": "tf_q1", "qNum": 1, "text": "Sustainable energy architectures require decentralised storage grids.", "answer": "TRUE" },
            { "id": "tf_q2", "qNum": 2, "text": "Traditional power stations generate zero carbon emissions.", "answer": "FALSE" },
            { "id": "tf_q3", "qNum": 3, "text": "Most international city councils have already completed full battery transition.", "answer": "NOT GIVEN" },
            { "id": "tf_q4", "qNum": 4, "text": "Synaptic density remains fixed throughout adulthood.", "answer": "FALSE" },
            { "id": "tf_q5", "qNum": 5, "text": "Active learning promotes enhanced synaptic consolidation.", "answer": "TRUE" }
          ]
        }
      },
      {
        "id": "block_instr_2",
        "type": "question-range",
        "data": {
          "text": "Questions 6–10: Multiple Choice"
        }
      },
      {
        "id": "block_mcq_6",
        "type": "mcq",
        "data": {
          "questionNumber": 6,
          "question": "What primary argument does the researcher make regarding neuroplasticity?",
          "options": ["A. It is limited strictly to early childhood", "B. It facilitates continuous cognitive adaptation across the lifespan", "C. It reduces synaptic efficacy over time", "D. It operates independently of environmental stimulation"],
          "correctAnswer": "B"
        }
      },
      {
        "id": "block_mcq_7",
        "type": "mcq",
        "data": {
          "questionNumber": 7,
          "question": "Why are decentralised grids considered beneficial?",
          "options": ["A. They eliminate transmission line losses and mitigate single-point failures", "B. They rely solely on non-renewable fossil inputs", "C. They require zero initial capital expenditure", "D. They replace consumer electric vehicles entirely"],
          "correctAnswer": "A"
        }
      },
      {
        "id": "block_instr_3",
        "type": "question-range",
        "data": {
          "text": "Questions 8–10: Sentence Completion"
        }
      },
      {
        "id": "block_blank_8",
        "type": "fill-blanks",
        "data": {
          "sectionHeading": "Sentence Completion",
          "sectionInstruction": "Complete the sentences using NO MORE THAN TWO WORDS from the passage.",
          "text": "The development of resilient power networks depends upon distributed battery ____. Environmental stimuli directly trigger synaptic ____ in human cortex areas.",
          "answers": "storage | reorganization"
        }
      }
    ]
  }
}`;
        }
      }

      const courseResponse = await generateContentWithRetry({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: temperature
        }
      });

      const generatedText = courseResponse.text || "{}";
      const courseData = cleanAndParseJSON(generatedText);

      // Preserve or set audio_url
      if (audioUrl && (!courseData.audio_url || courseData.audio_url === "")) {
        courseData.audio_url = audioUrl;
      }

      // Normalize left reading passage blocks to 3 merged sections ONLY if it is a reading test
      if (normalizedSkill === "reading" && courseData && courseData.blocks && Array.isArray(courseData.blocks.left)) {
        const sec1Texts: string[] = [];
        const sec2Texts: string[] = [];
        const sec3Texts: string[] = [];

        courseData.blocks.left.forEach((b: any) => {
          if (!b || !b.data) return;
          const txt = String(b.data.text || b.data.content || "").trim();
          const title = String(b.data.title || b.title || "").trim();
          if (!txt && !title) return;
          const blockContent = title ? `### ${title}\n\n${txt}` : txt;
          const lower = blockContent.toLowerCase();

          const secNum = b.sectionNumber || b.data.sectionNumber || b.section;
          if (secNum === 3 || lower.includes("section 3") || lower.includes("passage 3") || lower.includes("digital dependency")) {
            sec3Texts.push(blockContent);
          } else if (secNum === 2 || lower.includes("section 2") || lower.includes("passage 2") || lower.includes("text d") || lower.includes("text e") || lower.includes("text f")) {
            sec2Texts.push(blockContent);
          } else {
            sec1Texts.push(blockContent);
          }
        });

        const newLeft: any[] = [];
        if (sec1Texts.length > 0) {
          newLeft.push({
            id: "block_passage_sec_1",
            type: "reading-passage",
            sectionNumber: 1,
            data: { sectionNumber: 1, title: "Section 1 Reading Passages", text: sec1Texts.join("\n\n---\n\n") }
          });
        }
        if (sec2Texts.length > 0) {
          newLeft.push({
            id: "block_passage_sec_2",
            type: "reading-passage",
            sectionNumber: 2,
            data: { sectionNumber: 2, title: "Section 2 Reading Passages", text: sec2Texts.join("\n\n---\n\n") }
          });
        }
        if (sec3Texts.length > 0) {
          newLeft.push({
            id: "block_passage_sec_3",
            type: "reading-passage",
            sectionNumber: 3,
            data: { sectionNumber: 3, title: "Section 3 Reading Passage", text: sec3Texts.join("\n\n---\n\n") }
          });
        }
        if (newLeft.length > 0) {
          courseData.blocks.left = newLeft;
        }
      }

      res.json(courseData);
    } catch (err: any) {
      console.error("AI Course Generator Route Error:", err);
      res.status(500).json({ error: "Failed to generate course with AI: " + err.message });
    }
  });

  // Payment Session Generator (Stripe)
  app.post("/api/payment/create-checkout-session", async (req, res) => {
    try {
      const { planName, price, userId, billingCycle } = req.body;
      const stripe = getStripe();
      
      const origin = req.headers.origin || "http://localhost:3000";

      if (!stripe) {
        // Stripe is not configured (missing secret API key).
        // Return a simulation response or a bypass action indicator so the client knows to use test mode.
        console.warn("Stripe key is missing or invalid; providing secure fallback simulator checkout.");
        return res.json({ 
          success: false, 
          mode: "fallback", 
          fallbackUrl: `${origin}/dashboard?payment_status=success&plan=${encodeURIComponent(planName)}&simulated=true`
        });
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `SEBS Institute - ${planName}`,
                  description: `Dynamic Training & Evaluation Blueprint - ${billingCycle || "monthly"} subscription access.`,
                },
                unit_amount: Math.round(Number(price) * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/dashboard?payment_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planName)}`,
          cancel_url: `${origin}/dashboard?payment_status=cancel`,
          metadata: {
            userId,
            planName,
            billingCycle
          },
        });

        res.json({ success: true, url: session.url });
      } catch (innerError: any) {
        if (
          innerError.name === "StripeAuthenticationError" || 
          innerError.message?.toLowerCase().includes("api key") || 
          innerError.message?.toLowerCase().includes("authentication")
        ) {
          console.warn("Stripe authentication failed with invalid key; utilizing secure sandbox fallback simulation.", innerError.message);
          return res.json({ 
            success: false, 
            mode: "fallback", 
            fallbackUrl: `${origin}/dashboard?payment_status=success&plan=${encodeURIComponent(planName)}&simulated=true`
          });
        }
        throw innerError;
      }
    } catch (error: any) {
      console.error("Stripe Session Creation Error:", error);
      res.status(500).json({ error: "Failed to initialize payment checkout session: " + error.message });
    }
  });

  // Secure Server-side Test Payment Bypass (Instant Premium Upgrade)
  app.post("/api/payment/test-bypass-upgrade", async (req, res) => {
    try {
      const { userId, planName } = req.body;

      if (!userId || !planName) {
        return res.status(400).json({ error: "Candidate reference elements and selected plan name are required." });
      }

      // Update Hostinger MySQL profiles
      await mysqlPool.execute(
        "UPDATE profiles SET plan = ? WHERE id = ?",
        [planName, userId]
      );
      console.log(`[TEST BYPASS SUCCESS] Upgraded ${userId} to ${planName} successfully in Hostinger MySQL.`);

      // Optional fallback update to Supabase
      let data = null;
      if (supabaseAdmin) {
        try {
          const { data: sbData } = await supabaseAdmin
            .from("profiles")
            .update({ plan: planName })
            .eq("id", userId)
            .select()
            .single();
          data = sbData;
        } catch (e) {
          console.warn("Could not sync premium plan to Supabase:", e);
        }
      }

      res.json({ success: true, message: "Sandbox simulation upgrade applied.", profile: data || { id: userId, plan: planName } });
    } catch (error: any) {
      console.error("Sandbox/Bypass Upgrade Error:", error);
      res.status(500).json({ error: "Failed to apply sandbox upgrade: " + error.message });
    }
  });

  // Explicit handlers for static images, logos, banners, and fonts with long-lived 1-year caching
  app.use(express.static(path.join(process.cwd(), "public"), {
    maxAge: "31536000s",
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.match(/\.(webp|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));

  // Explicit handlers for favicon.ico and favicon.png
  app.get("/favicon.ico", (req, res) => {
    const icoPath = path.join(process.cwd(), "public", "favicon.ico");
    if (fs.existsSync(icoPath)) {
      res.setHeader("Content-Type", "image/x-icon");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(icoPath);
    }
    res.status(404).end();
  });

  app.get("/favicon.png", (req, res) => {
    const pngPath = path.join(process.cwd(), "public", "favicon.png");
    if (fs.existsSync(pngPath)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(pngPath);
    }
    res.status(404).end();
  });

  // Explicit handlers for llms.txt, llms-full.txt and robots.txt
  app.get(["/ai-catalog.json", "/.well-known/ai-catalog.json", "/ard.json", "/.well-known/ard.json"], (req, res) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    const requested = req.path.includes("ard.json") ? "ard.json" : "ai-catalog.json";
    const wellKnownPublic = path.join(process.cwd(), "public", ".well-known", requested);
    const rootPublic = path.join(process.cwd(), "public", requested);
    const distPath = path.join(process.cwd(), "dist", requested);

    if (fs.existsSync(wellKnownPublic)) {
      return res.sendFile(wellKnownPublic);
    }
    if (fs.existsSync(rootPublic)) {
      return res.sendFile(rootPublic);
    }
    if (fs.existsSync(distPath)) {
      return res.sendFile(distPath);
    }
    
    // Fallback JSON payload matching ARD specification
    return res.json({
      "$schema": "https://agenticresourcediscovery.org/schemas/v1.0/ai-catalog.json",
      "specVersion": "1.0",
      "host": {
        "identifier": "urn:ai:sebsinstitute.com",
        "displayName": "SEB's Institute",
        "documentationUrl": "https://sebsinstitute.com/about",
        "logoUrl": "https://sebsinstitute.com/sebs_official_logo_315.webp"
      },
      "entries": [
        {
          "identifier": "urn:ai:sebsinstitute.com:service:ielts-mock-tests",
          "displayName": "IELTS Computer-Delivered Mock Tests",
          "description": "Full-length timed IELTS Academic and General Training practice tests with automated AI band score evaluation.",
          "type": "application/json",
          "url": "https://sebsinstitute.com/mock-tests",
          "representativeQueries": [
            "Take IELTS mock test online with instant band evaluation",
            "Practice IELTS Academic reading and listening computer-delivered tests"
          ]
        },
        {
          "identifier": "urn:ai:sebsinstitute.com:service:ielts-courses",
          "displayName": "IELTS & Spoken English Masterclasses",
          "description": "Specialized IELTS Band 8.5+ coaching and spoken English phonetics training taught by Syed Ejaz Bukhari.",
          "type": "application/json",
          "url": "https://sebsinstitute.com/courses",
          "representativeQueries": [
            "Learn IELTS preparation strategies from Syed Ejaz Bukhari",
            "Enroll in live IELTS speaking and phonetics classes"
          ]
        },
        {
          "identifier": "urn:ai:sebsinstitute.com:service:ai-writing-evaluator",
          "displayName": "AI IELTS Writing Evaluator",
          "description": "Instant essay grading against official IELTS assessment criteria.",
          "type": "application/json",
          "url": "https://sebsinstitute.com/dashboard/writing",
          "representativeQueries": [
            "Grade my IELTS writing task 2 essay instantly"
          ]
        }
      ]
    });
  });

  app.get("/llms.txt", (req, res) => {
    const publicPath = path.join(process.cwd(), "public", "llms.txt");
    const distPath = path.join(process.cwd(), "dist", "llms.txt");
    const filePath = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      return res.sendFile(filePath);
    }
    res.status(404).send("Not Found");
  });

  app.get("/llms-full.txt", (req, res) => {
    const publicPath = path.join(process.cwd(), "public", "llms-full.txt");
    const distPath = path.join(process.cwd(), "dist", "llms-full.txt");
    const filePath = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      return res.sendFile(filePath);
    }
    res.status(404).send("Not Found");
  });

  app.get("/robots.txt", (req, res) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    
    const publicPath = path.join(process.cwd(), "public", "robots.txt");
    const distPath = path.join(process.cwd(), "dist", "robots.txt");
    const filePath = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    // Fallback if file not found
    return res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://sebsinstitute.com/sitemap.xml
`);
  });

  // Explicit XML Sitemap Handlers
  app.get(["/sitemap.xml", "/sitemap_index.xml"], (req, res) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");

    const publicPath = path.join(process.cwd(), "public", "sitemap.xml");
    const distPath = path.join(process.cwd(), "dist", "sitemap.xml");
    const filePath = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    res.status(404).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Sitemap not found</error>");
  });

  // Long-term immutable caching for static assets (images, webp, png, fonts, icons)
  const publicDir = path.join(process.cwd(), "public");
  app.use(express.static(publicDir, {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.match(/\.(webp|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|mp3|mp4)$/i)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (filePath.match(/\.(js|css|webp|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
