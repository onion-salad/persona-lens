import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface PersonaFormProps {
  onSubmit: (formData: PersonaFormData) => void;
  isLoading?: boolean;
}

export interface PersonaFormData {
  targetGender: string;
  targetAge: string;
  targetIncome: string;
  serviceDescription: string;
  usageScene: string;
}

const PersonaForm = ({ onSubmit, isLoading }: PersonaFormProps) => {
  const [formData, setFormData] = useState<PersonaFormData>({
    targetGender: "all",
    targetAge: "all",
    targetIncome: "all",
    serviceDescription: "",
    usageScene: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-8 shadow-lg bg-white/30 backdrop-blur-md border border-white/20">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-black">
              主なターゲットの性別
            </Label>
            <RadioGroup
              value={formData.targetGender}
              onValueChange={(value) =>
                setFormData({ ...formData, targetGender: value })
              }
              className="flex flex-wrap gap-6 mt-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="gender-all" className="border-black text-black" />
                <Label htmlFor="gender-all" className="text-gray-700 cursor-pointer hover:text-black">指定なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" className="border-black text-black" />
                <Label htmlFor="gender-male" className="text-gray-700 cursor-pointer hover:text-black">男性</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" className="border-black text-black" />
                <Label htmlFor="gender-female" className="text-gray-700 cursor-pointer hover:text-black">女性</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold text-black">
              主なターゲットの年代
            </Label>
            <RadioGroup
              value={formData.targetAge}
              onValueChange={(value) =>
                setFormData({ ...formData, targetAge: value })
              }
              className="flex flex-wrap gap-6 mt-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="age-all" className="border-black text-black" />
                <Label htmlFor="age-all" className="text-gray-700 cursor-pointer hover:text-black">指定なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10-20" id="age-10-20" className="border-black text-black" />
                <Label htmlFor="age-10-20" className="text-gray-700 cursor-pointer hover:text-black">10-20代</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30-40" id="age-30-40" className="border-black text-black" />
                <Label htmlFor="age-30-40" className="text-gray-700 cursor-pointer hover:text-black">30-40代</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="50-60" id="age-50-60" className="border-black text-black" />
                <Label htmlFor="age-50-60" className="text-gray-700 cursor-pointer hover:text-black">50-60代</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold text-black">
              主なターゲットの年収
            </Label>
            <RadioGroup
              value={formData.targetIncome}
              onValueChange={(value) =>
                setFormData({ ...formData, targetIncome: value })
              }
              className="flex flex-wrap gap-6 mt-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="income-all" className="border-black text-black" />
                <Label htmlFor="income-all" className="text-gray-700 cursor-pointer hover:text-black">指定なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="income-low" className="border-black text-black" />
                <Label htmlFor="income-low" className="text-gray-700 cursor-pointer hover:text-black">〜400万円</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="middle" id="income-middle" className="border-black text-black" />
                <Label htmlFor="income-middle" className="text-gray-700 cursor-pointer hover:text-black">400-800万円</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="income-high" className="border-black text-black" />
                <Label htmlFor="income-high" className="text-gray-700 cursor-pointer hover:text-black">800万円〜</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="serviceDescription" className="text-lg font-semibold text-black">
              サービスの概要（どんなサービス・商品か）
            </Label>
            <Textarea
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={(e) =>
                setFormData({ ...formData, serviceDescription: e.target.value })
              }
              placeholder="例：オンラインヨガのサブスクリプションサービス"
              className="min-h-[120px] resize-none bg-white/30 backdrop-blur-md border-white/20 focus:border-black focus:ring-black placeholder:text-gray-500 text-black"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="usageScene" className="text-lg font-semibold text-black">
              想定される利用シーン
            </Label>
            <Textarea
              id="usageScene"
              value={formData.usageScene}
              onChange={(e) =>
                setFormData({ ...formData, usageScene: e.target.value })
              }
              placeholder="例：在宅勤務の合間にリフレッシュしたい時、朝の準備時間を有効活用したい時"
              className="min-h-[120px] resize-none bg-white/30 backdrop-blur-md border-white/20 focus:border-black focus:ring-black placeholder:text-gray-500 text-black"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!formData.serviceDescription || !formData.usageScene || isLoading}
          className="w-full bg-black hover:bg-black/80 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              生成中...
            </>
          ) : (
            'ペルソナを生成'
          )}
        </Button>
      </form>
    </Card>
  );
};

export default PersonaForm;