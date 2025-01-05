import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const UserAvatar = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setDisplayName(profile.display_name);
        }
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={displayName || "ユーザー"} />
        ) : (
          <AvatarFallback>
            <UserRound className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
};

export default UserAvatar;