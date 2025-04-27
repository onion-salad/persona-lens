import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    id: "project",
    name: "プロジェクト",
    description: "プロジェクトの基本情報を設定します",
    fields: ["projectName", "personaCount", "objective"],
  },
  {
    id: "target",
    name: "ターゲット",
    description: "ペルソナのターゲット層を設定します",
    fields: ["ageRange", "gender", "occupation", "location"],
  },
  {
    id: "attributes",
    name: "属性",
    description: "ペルソナの詳細な属性を設定します",
    fields: ["interests", "skills", "values", "lifestyle"],
  },
  {
    id: "scenario",
    name: "シナリオ",
    description: "利用シーンや課題を設定します",
    fields: ["painPoints", "goals", "usageScenarios"],
  },
  {
    id: "customize",
    name: "カスタマイズ",
    description: "生成するペルソナをカスタマイズします",
    fields: ["tone", "detail", "format"],
  },
]

export function CreatePersonaForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    projectName: "",
    personaCount: "5",
    objective: "",
    ageRange: { min: "20", max: "40" },
    gender: "all",
    occupation: "",
    location: "日本",
    interests: [],
    skills: [],
    values: [],
    lifestyle: "",
    painPoints: "",
    goals: "",
    usageScenarios: "",
    tone: "professional",
    detail: "high",
    format: "structured",
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">プロジェクト名</Label>
              <Input
                id="projectName"
                placeholder="例: ECサイトリニューアル"
                value={formData.projectName}
                onChange={(e) => updateFormData("projectName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaCount">生成するペルソナ数</Label>
              <Select
                value={formData.personaCount}
                onValueChange={(value) => updateFormData("personaCount", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5体</SelectItem>
                  <SelectItem value="10">10体</SelectItem>
                  <SelectItem value="15">15体</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">プロジェクトの目的</Label>
              <Textarea
                id="objective"
                placeholder="ペルソナを作成する目的を入力してください"
                value={formData.objective}
                onChange={(e) => updateFormData("objective", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>年齢層</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="20"
                  value={formData.ageRange.min}
                  onChange={(e) =>
                    updateFormData("ageRange", {
                      ...formData.ageRange,
                      min: e.target.value,
                    })
                  }
                  className="w-24"
                />
                <span>〜</span>
                <Input
                  type="number"
                  placeholder="40"
                  value={formData.ageRange.max}
                  onChange={(e) =>
                    updateFormData("ageRange", {
                      ...formData.ageRange,
                      max: e.target.value,
                    })
                  }
                  className="w-24"
                />
                <span>歳</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>性別</Label>
              <Tabs
                value={formData.gender}
                onValueChange={(value) => updateFormData("gender", value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="male">男性</TabsTrigger>
                  <TabsTrigger value="female">女性</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">職業カテゴリー</Label>
              <Input
                id="occupation"
                placeholder="例: エンジニア、デザイナー、マーケター"
                value={formData.occupation}
                onChange={(e) => updateFormData("occupation", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">地域</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => updateFormData("location", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="日本">日本</SelectItem>
                  <SelectItem value="アメリカ">アメリカ</SelectItem>
                  <SelectItem value="ヨーロッパ">ヨーロッパ</SelectItem>
                  <SelectItem value="アジア">アジア</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>興味・関心</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.interests.map((interest, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      const newInterests = formData.interests.filter(
                        (_, i) => i !== index
                      )
                      updateFormData("interests", newInterests)
                    }}
                  >
                    {interest} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="興味・関心を入力してEnter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    e.preventDefault()
                    updateFormData("interests", [
                      ...formData.interests,
                      e.currentTarget.value,
                    ])
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>スキル・経験</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      const newSkills = formData.skills.filter(
                        (_, i) => i !== index
                      )
                      updateFormData("skills", newSkills)
                    }}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="スキル・経験を入力してEnter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    e.preventDefault()
                    updateFormData("skills", [
                      ...formData.skills,
                      e.currentTarget.value,
                    ])
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>価値観</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.values.map((value, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      const newValues = formData.values.filter(
                        (_, i) => i !== index
                      )
                      updateFormData("values", newValues)
                    }}
                  >
                    {value} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="価値観を入力してEnter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    e.preventDefault()
                    updateFormData("values", [
                      ...formData.values,
                      e.currentTarget.value,
                    ])
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifestyle">ライフスタイル</Label>
              <Textarea
                id="lifestyle"
                placeholder="典型的な1日の過ごし方や生活習慣について"
                value={formData.lifestyle}
                onChange={(e) => updateFormData("lifestyle", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="painPoints">課題・ペインポイント</Label>
              <Textarea
                id="painPoints"
                placeholder="ターゲットが抱える課題や問題点"
                value={formData.painPoints}
                onChange={(e) => updateFormData("painPoints", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">目標・ゴール</Label>
              <Textarea
                id="goals"
                placeholder="達成したい目標や理想の状態"
                value={formData.goals}
                onChange={(e) => updateFormData("goals", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageScenarios">利用シーン</Label>
              <Textarea
                id="usageScenarios"
                placeholder="製品・サービスを利用する具体的なシーン"
                value={formData.usageScenarios}
                onChange={(e) => updateFormData("usageScenarios", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>ペルソナの性格・トーン</Label>
              <Tabs
                value={formData.tone}
                onValueChange={(value) => updateFormData("tone", value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="professional">プロフェッショナル</TabsTrigger>
                  <TabsTrigger value="casual">カジュアル</TabsTrigger>
                  <TabsTrigger value="balanced">バランス型</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label>詳細度</Label>
              <Tabs
                value={formData.detail}
                onValueChange={(value) => updateFormData("detail", value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="high">詳細</TabsTrigger>
                  <TabsTrigger value="medium">標準</TabsTrigger>
                  <TabsTrigger value="low">簡潔</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label>出力フォーマット</Label>
              <Tabs
                value={formData.format}
                onValueChange={(value) => updateFormData("format", value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="structured">構造化</TabsTrigger>
                  <TabsTrigger value="narrative">ストーリー形式</TabsTrigger>
                  <TabsTrigger value="mixed">ミックス</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].name}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 text-sm text-muted-foreground">
              ステップ {currentStep + 1} / {steps.length}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent(currentStep)}
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Button
              onClick={currentStep === steps.length - 1 ? () => {} : nextStep}
              disabled={false}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  生成を開始
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                <>
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 