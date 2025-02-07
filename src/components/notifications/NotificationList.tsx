import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export const NotificationList = () => {
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      // モックデータを返す
      return [
        {
          id: "1",
          content: "新機能が追加されました！",
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          content: "プロフィールを更新してください",
          created_at: new Date().toISOString()
        }
      ];
    },
  });

  if (!notifications?.length) {
    return (
      <div className="p-6 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          通知はありません
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="p-4">
        {notifications.map((notification) => (
          <Button
            key={notification.id}
            variant="ghost"
            className="w-full justify-start text-sm font-normal"
          >
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm">{notification.content}</p>
              <span className="text-xs text-muted-foreground">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};