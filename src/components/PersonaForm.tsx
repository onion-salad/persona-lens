import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PersonaFormProps {
  onSubmit: (formData: PersonaFormData) => void;
}

export interface PersonaFormData {
  targetGender: string;
  targetAge: string;
  targetIncome: string;
  serviceDescription: string;
  usageScene: string;
}

const PersonaForm = ({ onSubmit }: PersonaFormProps) => {
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
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>主なターゲットの性別</Label>
            <RadioGroup
              value={formData.targetGender}
              onValueChange={(value) =>
                setFormData({ ...formData, targetGender: value })
              }
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="gender-all" />
                <Label htmlFor="gender-all">指定なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male">男性</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female">女性</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>主なターゲットの年代</Label>
            <RadioGroup
              value={formData.targetAge}
              onValueChange={(value) =>
                setFormData({ ...formData, targetAge: value })
              }
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="age-all" />
                <Label htmlFor="age-all">指定なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10-20" id="age-10-20" />
                <Label htmlFor="age-10-20">10-20代</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30-40" id="age-30-40" />
                <Label htmlFor="age-30-40">30-40代</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="50-60" id="age-50-60" />
                <Label htmlFor="age-50-60">50-60代</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>主なターゲットの年収</Label>
            <RadioGroup
              value={formData.targetIncome}
              onValueChange={(value) =>
                setFormData({ ...formData, targetIncome: value })
              }
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="income-all" />
                <Label htmlFor="income-all">指定なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="income-low" />
                <Label htmlFor="income-low">〜400万円</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="middle" id="income-middle" />
                <Label htmlFor="income-middle">400-800万円</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="income-high" />
                <Label htmlFor="income-high">800万円〜</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceDescription">
              サービスの概要（どんなサービス・商品か）
            </Label>
            <Textarea
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={(e) =>
                setFormData({ ...formData, serviceDescription: e.target.value })
              }
              placeholder="例：オンラインヨガのサブスクリプションサービス"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usageScene">想定される利用シーン</Label>
            <Textarea
              id="usageScene"
              value={formData.usageScene}
              onChange={(e) =>
                setFormData({ ...formData, usageScene: e.target.value })
              }
              placeholder="例：在宅勤務の合間にリフレッシュしたい時、朝の準備時間を有効活用したい時"
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!formData.serviceDescription || !formData.usageScene}
          className="w-full"
        >
          ペルソナを生成
        </Button>
      </form>
    </Card>
  );
};

export default PersonaForm;