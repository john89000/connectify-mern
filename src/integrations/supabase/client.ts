// Supabase client stub
// Supabase has been removed from this project and replaced by MongoDB Realm.
// This stub prevents build errors if any file still imports the old path.

export const supabase = {
  auth: {
    onAuthStateChange: (_cb: any) => ({ unsubscribe: () => {} }),
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
  },
  from: (_table: string) => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
  }),
  storage: {
    from: (_bucket: string) => ({
      upload: async () => ({ error: new Error("Storage is not available; use S3 or other storage with MongoDB setup") }),
      getPublicUrl: (_: string) => ({ data: { publicUrl: null } }),
    }),
  },
};