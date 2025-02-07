
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { toast } from "sonner";
import { saveApiKey, getApiKey } from "@/utils/apiKey";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSettingsDialog = ({ open, onOpenChange }: ProfileSettingsDialogProps) => {
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return {
        display_name: "テストユーザー",
        email: "test@example.com",
        avatar_url: null
      };
    },
    enabled: open,
  });

  useEffect(() => {
    if (profile && open) {
      console.log("ProfileSettingsDialog opened:", {
        profile,
        currentDisplayName: displayName,
        currentApiKey: apiKey ? "exists" : "not set"
      });
      setDisplayName(profile.display_name || "");
      setApiKey(getApiKey() || "");
    }
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (apiKey) {
        saveApiKey(apiKey);
      }
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("設定を更新しました");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("設定の更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
    console.log("ProfileSettingsDialog is loading");
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>プロフィール設定</DialogTitle>
          <DialogDescription>
            プロフィール情報とAPIキーを更新できます
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini APIキー</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="APIキーを入力"
            />
            <p className="text-sm text-gray-500">
              APIキーは
              <a 
                href="https://ai.google.dev/gemini-api/docs?hl=ja" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                こちら
              </a>
              から取得できます
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "更新中..." : "更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
