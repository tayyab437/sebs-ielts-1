export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content_type: "rich_text" | "html_css";
  content: string; // Rich text / markdown / HTML content
  html_code?: string;
  css_code?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const defaultCustomPages: CustomPage[] = [
  {
    id: "about-us",
    title: "About SEB's Institute",
    slug: "about-us",
    content_type: "rich_text",
    content: `
      <h2>Welcome to SEB's Institute</h2>
      <p>Founded and led by <strong>Syed Ejaz Bukhari</strong>, SEB's Institute is a world-class English language training academy specializing in <strong>IELTS Academic, General Training, Spoken English Mastery</strong>, and advanced communication skills.</p>
      <h3>Our Core Pillars</h3>
      <ul>
        <li><strong>Structural Fluency:</strong> Mastering sentence patterns, grammar precision, and articulation.</li>
        <li><strong>Authentic Testing Simulators:</strong> Real exam interface practice based on official British Council & IDP standards.</li>
        <li><strong>Personalized Feedback:</strong> AI-powered writing evaluation and direct mentorship from expert coaches.</li>
      </ul>
      <p>Join thousands of successful scholars who have achieved Band 7.5+ and transformed their global academic and career opportunities.</p>
    `,
    meta_title: "About SEB's Institute | Syed Ejaz Bukhari",
    meta_description: "Learn about SEB's Institute, premier IELTS coaching academy led by Syed Ejaz Bukhari.",
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "faq",
    title: "Frequently Asked Questions (FAQ)",
    slug: "faq",
    content_type: "rich_text",
    content: `
      <h2>Frequently Asked Questions</h2>
      <h3>1. What courses are offered at SEB's Institute?</h3>
      <p>We offer specialized training in IELTS Academic, IELTS General Training, Spoken English Fluency, PTE Academic, and AI-driven Writing Evaluation.</p>
      <h3>2. Are live online classes available?</h3>
      <p>Yes! We offer live interactive classes with Syed Ejaz Bukhari and certified faculty, alongside 24/7 access to our mock test practice portal.</p>
      <h3>3. How do AI mock tests work?</h3>
      <p>Students can take full-length Listening, Reading, Writing, and Speaking practice tests under timed exam conditions with instant AI band scores and detailed analytical feedback.</p>
    `,
    meta_title: "FAQ & Student Support | SEB's Institute",
    meta_description: "Find answers to common questions about IELTS classes, live schedules, mock test access, and fees.",
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const STORAGE_KEY = "sebs_custom_pages";

export async function fetchCustomPages(): Promise<CustomPage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading custom pages from storage:", err);
  }
  saveAllCustomPages(defaultCustomPages);
  return defaultCustomPages;
}

export async function fetchCustomPageBySlug(slug: string): Promise<CustomPage | null> {
  const pages = await fetchCustomPages();
  const cleanSlug = slug.toLowerCase().trim().replace(/^\/+|\/+$/g, "");
  return pages.find(p => p.slug.toLowerCase().trim() === cleanSlug) || null;
}

export async function saveCustomPage(page: CustomPage): Promise<CustomPage[]> {
  const pages = await fetchCustomPages();
  const index = pages.findIndex(p => p.id === page.id || p.slug === page.slug);
  const updatedPage = {
    ...page,
    updated_at: new Date().toISOString(),
  };
  
  let newPagesList: CustomPage[];
  if (index >= 0) {
    newPagesList = [...pages];
    newPagesList[index] = updatedPage;
  } else {
    newPagesList = [updatedPage, ...pages];
  }
  
  saveAllCustomPages(newPagesList);
  return newPagesList;
}

export async function deleteCustomPage(id: string): Promise<CustomPage[]> {
  const pages = await fetchCustomPages();
  const newPagesList = pages.filter(p => p.id !== id);
  saveAllCustomPages(newPagesList);
  return newPagesList;
}

function saveAllCustomPages(pages: CustomPage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Error writing custom pages to storage:", err);
  }
}
