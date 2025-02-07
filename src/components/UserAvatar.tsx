
import { UserRound, Settings, LogOut, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProfileSettingsDialog } from "./profile/ProfileSettingsDialog";
import { useQuery } from "@tanstack/react-query";

const UserAvatar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return {
        display_name: "テストユーザー",
        email: "test@example.com",
        avatar_url: null
      };
    },
  });

  useEffect(() => {
    console.log("UserAvatar settings state changed:", {
      isSettingsOpen,
      profile: profile || "not loaded"
    });
  }, [isSettingsOpen, profile]);

  const handleLogout = async () => {
    try {
      navigate("/auth");
      toast.success("ログアウトしました");
    } catch (error) {
      toast.error("ログアウトに失敗しました");
    }
  };

  const handleFeedbackClick = () => {
    window.open('https://feedbackhub.lovable.app/services/deeef857-aa16-4897-abda-045e5b8c0a14', '_blank');
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name || "ユーザー"} />
              ) : (
                <AvatarFallback>
                  <UserRound className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.display_name || "ゲスト"}</p>
              <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => {
              console.log("Settings menu item clicked");
              setIsSettingsOpen(true);
            }}>
              <Settings className="mr-2 h-4 w-4" />
              アカウント設定
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFeedbackClick}>
              <MessageSquare className="mr-2 h-4 w-4" />
              機能要望はこちら
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={(open) => {
          console.log("ProfileSettingsDialog onOpenChange called:", { open, currentState: isSettingsOpen });
          setIsSettingsOpen(open);
        }}
      />
    </div>
  );
};

export default UserAvatar;
