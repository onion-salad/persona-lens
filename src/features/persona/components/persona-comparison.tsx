import { motion } from "framer-motion"
import { X, ArrowLeft, ArrowRight, Download } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface PersonaComparisonProps {
  personas: any[]
  onClose: () => void
}

export function PersonaComparison({ personas, onClose }: PersonaComparisonProps) {
  const sections = [
    { key: "age", label: "年齢" },
    { key: "gender", label: "性別" },
    { key: "occupation", label: "職業" },
    { key: "location", label: "居住地" },
    { key: "family", label: "家族構成" },
    { key: "background", label: "経歴" },
    { key: "personality", label: "性格特性" },
    { key: "dailyLife", label: "日常生活" },
    { key: "techUsage", label: "技術利用" },
    { key: "consumptionBehavior", label: "消費行動" },
    { key: "goalsAndChallenges", label: "目標と課題" },
    { key: "relationToProduct", label: "製品との関係" },
  ]

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>ペルソナ比較</SheetTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                エクスポート
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>
            選択したペルソナの特徴を比較します
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-full mt-6">
          <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {/* ヘッダー行 */}
            <div className="sticky top-0 bg-background z-10">
              <div className="h-20" />
            </div>
            {personas.map((persona) => (
              <div key={persona.id} className="sticky top-0 bg-background z-10">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">{persona.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>{persona.age}歳</span>
                    <Badge variant="secondary" className="text-xs">
                      {persona.gender}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {/* 比較行 */}
            {sections.map((section) => (
              <>
                <div key={section.key} className="font-medium py-4 border-t">
                  {section.label}
                </div>
                {personas.map((persona) => (
                  <div key={`${persona.id}-${section.key}`} className="py-4 border-t">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {persona[section.key]}
                    </p>
                  </div>
                ))}
              </>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 