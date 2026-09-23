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

export const defaultCustomPages: CustomPage[] = [];

const STORAGE_KEY = "sebs_custom_pages";

export async function fetchCustomPages(): Promise<CustomPage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy default pages that the user removed
        const filtered = parsed.filter((p: CustomPage) => p.id !== "about-us" && p.slug !== "about-us" && p.id !== "faq" && p.slug !== "faq");
        if (filtered.length !== parsed.length) {
          saveAllCustomPages(filtered);
        }
        return filtered;
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
