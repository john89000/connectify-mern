import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Loader2, Send, X } from "lucide-react";
import { auth, getMongo } from "@/integrations/mongodb/client";
import { toast } from "sonner";

interface CreatePostProps {
  onPostCreated: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session: user } } = await auth.getSession();
    if (user) {
      try {
        const mongodb = getMongo();
        const dbName = import.meta.env.VITE_MONGODB_DB_NAME || "connectify";
        const profiles = mongodb.db(dbName).collection("profiles");
        const data = await profiles.findOne({ user_id: user.id });
        setProfile(data);
      } catch (e) {
        console.warn("Failed to load profile:", e);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("File must be an image");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!selectedImage) return null;
    // As a simple fallback, encode the image as a data URL and store in the document.
    // For production you should use S3 or another object storage and store the URL here.
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(selectedImage as Blob);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage) {
      toast.error("Please write something or add an image");
      return;
    }

    setLoading(true);
    try {
      const { data: { session: user } } = await auth.getSession();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(user.id);
      }

      const mongodb = getMongo();
      const dbName = import.meta.env.VITE_MONGODB_DB_NAME || "connectify";
      const posts = mongodb.db(dbName).collection("posts");
      await posts.insertOne({
        user_id: user.id,
        content: content.trim() || "",
        image_url: imageUrl,
        likes: [],
        comments: [],
        created_at: new Date(),
      });

      toast.success("Post created!");
      setContent("");
      removeImage();
      onPostCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-gradient-primary text-white">
              {profile?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              maxLength={5000}
            />
            
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || (!content.trim() && !selectedImage)}
                className="bg-gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
