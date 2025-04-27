import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, Image as ImageIcon, Type, MousePointer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

type AdVariant = {
  headline: string
  visualUrl: string
  cta: string
  description: string
}

export function ABTestForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [adA, setAdA] = useState<AdVariant>({
    headline: "",
    visualUrl: "",
    cta: "",
    description: "",
  })
  const [adB, setAdB] = useState<AdVariant>({
    headline: "",
    visualUrl: "",
    cta: "",
    description: "",
  })
  const [testConfig, setTestConfig] = useState({
    projectName: "",
    industry: "ec",
    targetAge: { min: "20", max: "40" },
    targetGender: "all",
  })

  const steps = [
    {
      id: "config",
      name: "テスト設定",
      description: "プロジェクトとターゲットの設定",
    },
    {
      id: "variant-a",
      name: "広告A",
      description: "1つ目の広告バリエーション",
    },
    {
      id: "variant-b",
      name: "広告B",
      description: "2つ目の広告バリエーション",
    },
    {
      id: "review",
      name: "確認",
      description: "テスト内容の確認と実行",
    },
  ]

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

  const handleAdAChange = (field: keyof AdVariant, value: string) => {
    setAdA((prev) => ({ ...prev, [field]: value }))
  }

  const handleAdBChange = (field: keyof AdVariant, value: string) => {
    setAdB((prev) => ({ ...prev, [field]: value }))
  }

  const handleConfigChange = (field: string, value: any) => {
    setTestConfig((prev) => ({ ...prev, [field]: value }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">プロジェクト名</Label>
              <Input
                id="projectName"
                placeholder="例：夏季キャンペーンバナー"
                value={testConfig.projectName}
                onChange={(e) =>
                  handleConfigChange("projectName", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">業界</Label>
              <Select
                value={testConfig.industry}
                onValueChange={(value) => handleConfigChange("industry", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ec">EC</SelectItem>
                  <SelectItem value="finance">金融</SelectItem>
                  <SelectItem value="real-estate">不動産</SelectItem>
                  <SelectItem value="hr">人材</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ターゲット年齢</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="20"
                  value={testConfig.targetAge.min}
                  onChange={(e) =>
                    handleConfigChange("targetAge", {
                      ...testConfig.targetAge,
                      min: e.target.value,
                    })
                  }
                  className="w-24"
                />
                <span>〜</span>
                <Input
                  type="number"
                  placeholder="40"
                  value={testConfig.targetAge.max}
                  onChange={(e) =>
                    handleConfigChange("targetAge", {
                      ...testConfig.targetAge,
                      max: e.target.value,
                    })
                  }
                  className="w-24"
                />
                <span>歳</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ターゲット性別</Label>
              <Tabs
                value={testConfig.targetGender}
                onValueChange={(value) =>
                  handleConfigChange("targetGender", value)
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="male">男性</TabsTrigger>
                  <TabsTrigger value="female">女性</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )

      case 1:
      case 2:
        const currentAd = currentStep === 1 ? adA : adB
        const handleChange =
          currentStep === 1 ? handleAdAChange : handleAdBChange
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headline">ヘッドライン</Label>
              <Input
                id="headline"
                placeholder="例：期間限定20%OFF！"
                value={currentAd.headline}
                onChange={(e) => handleChange("headline", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visual">ビジュアル</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="visual"
                    placeholder="画像URL"
                    value={currentAd.visualUrl}
                    onChange={(e) => handleChange("visualUrl", e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {currentAd.visualUrl && (
                <div className="mt-2 aspect-video relative rounded-lg border bg-muted">
                  <ImageIcon className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta">CTA（行動喚起）</Label>
              <Input
                id="cta"
                placeholder="例：今すぐ購入"
                value={currentAd.cta}
                onChange={(e) => handleChange("cta", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明文</Label>
              <Textarea
                id="description"
                placeholder="商品・サービスの説明"
                value={currentAd.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>広告A</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>ヘッドライン</Label>
                      <p className="mt-1">{adA.headline}</p>
                    </div>
                    <div>
                      <Label>CTA</Label>
                      <p className="mt-1">{adA.cta}</p>
                    </div>
                    <div>
                      <Label>説明文</Label>
                      <p className="mt-1 text-sm">{adA.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>広告B</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>ヘッドライン</Label>
                      <p className="mt-1">{adB.headline}</p>
                    </div>
                    <div>
                      <Label>CTA</Label>
                      <p className="mt-1">{adB.cta}</p>
                    </div>
                    <div>
                      <Label>説明文</Label>
                      <p className="mt-1 text-sm">{adB.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
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
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              戻る
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button onClick={() => console.log("テスト開始")}>
                テストを開始
              </Button>
            ) : (
              <Button onClick={nextStep}>次へ</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 