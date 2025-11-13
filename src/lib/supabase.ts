// Adapter to provide the same function names used across the app
// This file now uses the MongoDB Realm client under the hood.
import { app } from "@/integrations/mongodb/client";

export const signUp = async (email: string, password: string, username: string) => {
  try {
    // register user via Realm Email/Password provider
    // Note: the Email/Password provider must be enabled in your Realm app
    // @ts-ignore - realm-web types
    await app.emailPasswordAuth.registerUser(email, password);

    // immediately log in the user
    // @ts-ignore Credentials type
    const credentials = (await import("realm-web")).Credentials.emailPassword(email, password);
    const user = await app.logIn(credentials);

    // create a profile document in MongoDB Atlas (if you want to store username)
    try {
      const mongodb = user.mongoClient("mongodb-atlas");
      const dbName = import.meta.env.VITE_MONGODB_DB_NAME || "connectify";
      const profiles = mongodb.db(dbName).collection("profiles");
      await profiles.insertOne({ user_id: user.id, username, avatar_url: null, created_at: new Date() });
    } catch (e) {
      // non-fatal; profile creation may fail if DB not configured
      console.warn("Failed to create profile document:", e);
    }

    return { data: { user }, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { Credentials } = await import("realm-web");
    const credentials = Credentials.emailPassword(email, password);
    const user = await app.logIn(credentials);
    return { data: { user }, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    if (app.currentUser) await app.currentUser.logOut();
    return { error: null };
  } catch (error: any) {
    return { error };
  }
};
