import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

// ステップの定義
const STEPS = [
  {
    id: 'project',
    title: 'プロジェクト情報',
    description: 'ペルソナを生成するプロジェクトの情報を入力してください',
  },
  {
    id: 'conditions',
    title: 'ペルソナ生成条件',
    description: '生成するペルソナの条件を設定してください',
  },
  {
    id: 'confirmation',
    title: '生成結果の確認',
    description: '生成されたペルソナの確認と保存を行います',
  },
]

export default function PersonaCreationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    targetMarket: '',
    personaCount: '10',
    ageRange: 'all',
    occupation: 'all',
    interests: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    // TODO: ペルソナ生成処理の実装
    console.log('Form submitted:', formData)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">プロジェクト名</Label>
              <Input
                id="projectName"
                placeholder="例: ECサイトリニューアル"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">プロジェクトの説明</Label>
              <Textarea
                id="projectDescription"
                placeholder="プロジェクトの目的や概要を入力してください"
                value={formData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetMarket">ターゲット市場</Label>
              <Input
                id="targetMarket"
                placeholder="例: 20-40代の働く女性"
                value={formData.targetMarket}
                onChange={(e) => handleInputChange('targetMarket', e.target.value)}
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personaCount">生成するペルソナ数</Label>
              <Select
                value={formData.personaCount}
                onValueChange={(value) => handleInputChange('personaCount', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ペルソナ数を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5体</SelectItem>
                  <SelectItem value="10">10体</SelectItem>
                  <SelectItem value="15">15体</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageRange">年齢層</Label>
              <Select
                value={formData.ageRange}
                onValueChange={(value) => handleInputChange('ageRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="年齢層を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">指定なし</SelectItem>
                  <SelectItem value="young">若年層（18-30歳）</SelectItem>
                  <SelectItem value="middle">中年層（31-50歳）</SelectItem>
                  <SelectItem value="senior">高年層（51歳以上）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">職業</Label>
              <Select
                value={formData.occupation}
                onValueChange={(value) => handleInputChange('occupation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="職業を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">指定なし</SelectItem>
                  <SelectItem value="office">会社員</SelectItem>
                  <SelectItem value="freelance">フリーランス</SelectItem>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">興味・関心事項</Label>
              <Textarea
                id="interests"
                placeholder="ペルソナの興味や関心事項を入力してください"
                value={formData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">プロジェクト情報</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">プロジェクト名</dt>
                  <dd>{formData.projectName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">説明</dt>
                  <dd>{formData.projectDescription}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">ターゲット市場</dt>
                  <dd>{formData.targetMarket}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">生成条件</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">ペルソナ数</dt>
                  <dd>{formData.personaCount}体</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">年齢層</dt>
                  <dd>{formData.ageRange}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">職業</dt>
                  <dd>{formData.occupation}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">興味・関心事項</dt>
                  <dd>{formData.interests}</dd>
                </div>
              </dl>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* プログレスインジケータ */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 ${
                index !== STEPS.length - 1 ? 'border-b-2' : ''
              } ${
                index <= currentStep ? 'border-primary' : 'border-muted'
              }`}
            >
              <div className="text-center">
                <div
                  className={`w-8 h-8 rounded-full mb-2 mx-auto flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="text-sm font-medium">{step.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* フォームカード */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              戻る
            </Button>
            <Button
              onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext}
            >
              {currentStep === STEPS.length - 1 ? 'ペルソナを生成' : '次へ'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 