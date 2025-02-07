import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyFormProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyForm = ({ onSubmit }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "エラー",
        description: "APIキーを入力してください",
        variant: "destructive",
      });
      return;
    }
    onSubmit(apiKey.trim());
    toast({
      title: "成功",
      description: "APIキーを保存しました",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">APIキーの設定</h1>
          <p className="text-gray-600 mt-2">
            サービスを利用するにはAPIキーが必要です
          </p>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              Gemini APIキーは
              <a 
                href="https://ai.google.dev/gemini-api/docs?hl=ja" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                こちら
              </a>
              から取得できます。リンク先の画面の右側に「Gemini APIキーを取得する」という青いボタンがあるためそちらをクリックしてください。
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              APIキー
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="APIキーを入力してください"
            />
          </div>
          <Button type="submit" className="w-full">
            保存して続ける
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ApiKeyForm;