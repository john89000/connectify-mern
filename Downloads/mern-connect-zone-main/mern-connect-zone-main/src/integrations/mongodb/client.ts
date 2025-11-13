import * as Realm from "realm-web";

const APP_ID = import.meta.env.VITE_REALM_APP_ID || "";

// Initialize Realm App (client-side). Ensure VITE_REALM_APP_ID is set in your .env
export const app = new Realm.App({ id: APP_ID });

// Lightweight helpers to approximate the small subset of Supabase auth API used by the app
export const auth = {
  // Calls callback immediately with current state and returns a noop unsubscribe
  onAuthStateChange: (cb: (event: string, session: any) => void) => {
    const user = app.currentUser;
    const session = user || null;
    cb(user ? "SIGNED_IN" : "SIGNED_OUT", session);
    return { unsubscribe: () => {} };
  },

  getSession: async () => {
    return { data: { session: app.currentUser || null } };
  },
};

// Convenience function to get the MongoDB Atlas client for the logged-in user
export const getMongo = () => {
  if (!app.currentUser) throw new Error("No current user. Authenticate first.");
  return app.currentUser.mongoClient("mongodb-atlas");
};

// Basic email/password helpers
export const signUpWithEmail = async (email: string, password: string) => {
  // register user (realm email/password provider must be enabled)
  // @ts-ignore
  await app.emailPasswordAuth.registerUser(email, password);
  // then login
  // @ts-ignore
  const { Credentials } = await import("realm-web");
  const credentials = Credentials.emailPassword(email, password);
  const user = await app.logIn(credentials);
  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  // @ts-ignore
  const { Credentials } = await import("realm-web");
  const credentials = Credentials.emailPassword(email, password);
  const user = await app.logIn(credentials);
  return user;
};

export const signOut = async () => {
  if (app.currentUser) await app.currentUser.logOut();
};

export default app;
