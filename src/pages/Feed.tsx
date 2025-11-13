import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getMongo } from "@/integrations/mongodb/client";
import { Navbar } from "@/components/Navbar";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes: { id: string; user_id: string }[];
  comments: { id: string }[];
}

const Feed = () => {
  const [session, setSession] = useState<any | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const subscription = auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      // Use MongoDB Atlas (via Realm) to fetch posts. Ensure VITE_REALM_APP_ID and VITE_MONGODB_DB_NAME are set.
      const mongodb = getMongo();
      const dbName = import.meta.env.VITE_MONGODB_DB_NAME || "connectify";
      const postsColl = mongodb.db(dbName).collection("posts");
      // simple find — adapt as needed for your schema
      const data = await postsColl.find({}, { sort: { created_at: -1 }, limit: 200 });
      setPosts((data as unknown) as Post[]);
    } catch (error: any) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  if (!session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <CreatePost onPostCreated={fetchPosts} />
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feed;
