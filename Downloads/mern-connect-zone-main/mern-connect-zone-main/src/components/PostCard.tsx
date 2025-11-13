import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { auth, getMongo } from "@/integrations/mongodb/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  useEffect(() => {
    checkIfLiked();
  }, [post.id]);

  const checkIfLiked = async () => {
    const { data: { session: user } } = await auth.getSession();
    if (user) {
      const liked = post.likes?.some((like: any) => like.user_id === user.id);
      setIsLiked(liked);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { session: user } } = await auth.getSession();
      if (!user) return;

      const mongodb = getMongo();
      const dbName = import.meta.env.VITE_MONGODB_DB_NAME || "connectify";
      const postsColl = mongodb.db(dbName).collection("posts");

      if (isLiked) {
        await postsColl.updateOne({ _id: post._id }, { $pull: { likes: { user_id: user.id } } });
        setLikesCount(prev => prev - 1);
      } else {
        await postsColl.updateOne({ _id: post._id }, { $push: { likes: { user_id: user.id, created_at: new Date() } } });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error: any) {
      toast.error("Failed to update like");
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={post.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-gradient-primary text-white">
              {post.profiles?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.profiles?.username || "Unknown"}</span>
              <span className="text-xs text-muted-foreground">
                @{post.profiles?.username || "unknown"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-lg object-cover max-h-96"
          />
        )}
        <div className="flex items-center gap-6 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={isLiked ? "text-red-500" : ""}
          >
            <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            {post.comments?.length || 0}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
