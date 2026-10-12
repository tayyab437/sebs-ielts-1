// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (url?: string, key?: string) => {
  if (!url || !key) return true;
  const u = url.trim();
  const k = key.trim();
  if (u === "" || k === "") return true;
  if (u.includes("MY_SUPABASE_URL") || u.includes("placeholder")) return true;
  if (k.includes("MY_SUPABASE_ANON_KEY") || k.includes("placeholder")) return true;
  if (!u.startsWith("http://") && !u.startsWith("https://")) return true;
  return false;
};

const isValid = !isPlaceholder(supabaseUrl, supabaseAnonKey);

// Custom Chainable Query Builder for MySQL Proxy
class SupabaseQueryBuilder {
  private table: string;
  private selectFields: string = "*";
  private filters: { type: string; column: string; value: any }[] = [];
  private updateData: any = null;
  private upsertData: any = null;
  private insertData: any = null;
  private deleteFlag: boolean = false;
  private orderConfig: any = null;
  private limitCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = "*") {
    this.selectFields = fields;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  upsert(data: any) {
    this.upsertData = data;
    return this;
  }
  
  insert(data: any) {
    this.insertData = data;
    return this;
  }
  
  delete() {
    this.deleteFlag = true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }
  
  neq(column: string, value: any) {
    this.filters.push({ type: "neq", column, value });
    return this;
  }
  
  in(column: string, value: any[]) {
    this.filters.push({ type: "in", column, value });
    return this;
  }
  
  lt(column: string, value: any) {
    this.filters.push({ type: "lt", column, value });
    return this;
  }
  
  lte(column: string, value: any) {
    this.filters.push({ type: "lte", column, value });
    return this;
  }
  
  gt(column: string, value: any) {
    this.filters.push({ type: "gt", column, value });
    return this;
  }
  
  gte(column: string, value: any) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }
  
  contains(column: string, value: any) {
    this.filters.push({ type: "contains", column, value });
    return this;
  }

  or(value: string) {
    this.filters.push({ type: "or", column: "", value });
    return this;
  }
  
  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this.orderConfig = { column, ascending: options.ascending };
    return this;
  }
  
  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const res = await this.execute();
    if (res.error) throw res.error;
    return { data: res.data ? res.data[0] || null : null, error: null };
  }

  async maybeSingle() {
    const res = await this.execute();
    return { data: res.data ? res.data[0] || null : null, error: res.error };
  }

  then(onfulfilled?: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    const sessionStr = localStorage.getItem("mysql-session");
    let token = "";
    if (sessionStr) {
      try {
        token = JSON.parse(sessionStr).access_token || "";
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/mysql/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          table: this.table,
          selectFields: this.selectFields,
          filters: this.filters,
          updateData: this.updateData,
          upsertData: this.upsertData,
          insertData: this.insertData,
          deleteFlag: this.deleteFlag,
          orderConfig: this.orderConfig,
          limitCount: this.limitCount
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: new Error(errText) };
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return { data: [], error: null };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  }
}

// Custom Supabase Client Proxy
class SupabaseClientProxy {
  private _listeners: any[] = [];
  private _realClient: any = null;
  private _initRealClientPromise: Promise<any> | null = null;

  constructor() {
    // Listen for auth storage changes to sync tabs
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === "mysql-session") {
          const sessionStr = e.newValue;
          let session = null;
          if (sessionStr) {
            try { session = JSON.parse(sessionStr); } catch (e) {}
          }
          this._triggerAuthChange("SIGNED_IN", session);
        }
      });
    }
  }

  private async _ensureRealClient() {
    if (this._realClient) return this._realClient;
    if (!isValid) return null;
    if (!this._initRealClientPromise) {
      this._initRealClientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
        this._realClient = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
        return this._realClient;
      }).catch((e) => {
        console.warn("Could not dynamically load Supabase JS client:", e);
        return null;
      });
    }
    return this._initRealClientPromise;
  }

  auth = {
    signUp: async ({ email, password, options }: any) => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            firstName: options?.data?.first_name || "",
            lastName: options?.data?.last_name || "",
            role: options?.data?.role || "student"
          })
        });
        if (!res.ok) {
          const err = await res.json();
          return { data: { user: null }, error: new Error(err.error || "Signup failed") };
        }
        const data = await res.json();
        localStorage.setItem("mysql-session", JSON.stringify(data.session));
        localStorage.setItem("mock_user_logged_in", "true");
        localStorage.setItem("mock_user_email", email);
        localStorage.setItem("user_role", data.session.user.user_metadata.role);
        
        this._triggerAuthChange("SIGNED_IN", data.session);
        return { data: { user: data.session.user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },

    signInWithPassword: async ({ email, password }: any) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          const err = await res.json();
          return { data: { user: null }, error: new Error(err.error || "Login failed") };
        }
        const data = await res.json();
        localStorage.setItem("mysql-session", JSON.stringify(data.session));
        localStorage.setItem("mock_user_logged_in", "true");
        localStorage.setItem("mock_user_email", email);
        localStorage.setItem("user_role", data.session.user.user_metadata.role);

        this._triggerAuthChange("SIGNED_IN", data.session);
        return { data: { user: data.session.user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },

    signOut: async () => {
      localStorage.removeItem("mysql-session");
      localStorage.removeItem("mock_user_logged_in");
      localStorage.removeItem("mock_user_email");
      localStorage.removeItem("user_role");
      this._triggerAuthChange("SIGNED_OUT", null);
      return { error: null };
    },

    getUser: async () => {
      const sessionStr = localStorage.getItem("mysql-session");
      if (!sessionStr) {
        return { data: { user: null }, error: null };
      }
      try {
        const session = JSON.parse(sessionStr);
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            return { data: { user: data.user }, error: null };
          }
        }
      } catch (e) {}
      return { data: { user: null }, error: null };
    },

    getSession: async () => {
      const sessionStr = localStorage.getItem("mysql-session");
      if (!sessionStr) {
        return { data: { session: null }, error: null };
      }
      try {
        const session = JSON.parse(sessionStr);
        return { data: { session }, error: null };
      } catch (e) {
        return { data: { session: null }, error: null };
      }
    },

    onAuthStateChange: (callback: any) => {
      this._listeners.push(callback);
      
      const sessionStr = localStorage.getItem("mysql-session");
      let session = null;
      if (sessionStr) {
        try { session = JSON.parse(sessionStr); } catch (e) {}
      }
      setTimeout(() => {
        callback("INITIAL_SESSION", session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this._listeners = this._listeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  };

  private _triggerAuthChange(event: string, session: any) {
    this._listeners.forEach(l => {
      try { l(event, session); } catch (e) {}
    });
  }

  get storage() {
    if (this._realClient) {
      return this._realClient.storage;
    }
    // Lazy on-demand fallback: trigger real client if configured
    this._ensureRealClient();
    return {
      from: (bucket: string) => ({
        upload: async (path: string, file: any) => {
          const client = await this._ensureRealClient();
          if (client) {
            return client.storage.from(bucket).upload(path, file);
          }
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          if (this._realClient) {
            return this._realClient.storage.from(bucket).getPublicUrl(path);
          }
          return { data: { publicUrl: `https://via.placeholder.com/800x600?text=${encodeURIComponent(path)}` } };
        },
        remove: async (paths: string[]) => {
          const client = await this._ensureRealClient();
          if (client) {
            return client.storage.from(bucket).remove(paths);
          }
          return { data: paths, error: null };
        },
        list: async (path: string) => {
          const client = await this._ensureRealClient();
          if (client) {
            return client.storage.from(bucket).list(path);
          }
          return { data: [], error: null };
        }
      })
    };
  }

  from(table: string) {
    // Route all tables to the Hostinger MySQL database proxy
    return new SupabaseQueryBuilder(table);
  }

  channel(name: string) {
    if (this._realClient) {
      try {
        return this._realClient.channel(name);
      } catch (e) {
        console.warn("Real client channel setup failed, falling back to mock:", e);
      }
    }
    const mockChannel = {
      on: (event: string, filter: any, callback: any) => {
        return mockChannel;
      },
      subscribe: () => {
        return mockChannel;
      },
      unsubscribe: () => {
        return Promise.resolve();
      }
    };
    return mockChannel;
  }

  removeChannel(channel: any) {
    if (this._realClient) {
      try {
        return this._realClient.removeChannel(channel);
      } catch (e) {
        console.warn("Real client removeChannel failed, bypassing:", e);
      }
    }
    return Promise.resolve();
  }
}

export const supabase = new SupabaseClientProxy() as any;
