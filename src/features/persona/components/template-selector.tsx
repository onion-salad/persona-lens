import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Star, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Template {
  id: string
  name: string
  description: string
  tags: string[]
  data: any
  isFavorite?: boolean
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void
  onSave: (template: Omit<Template, "id">) => void
}

const defaultTemplates: Template[] = [
  {
    id: "1",
    name: "スタートアップ向け",
    description: "テクノロジー系スタートアップのユーザー層を分析するためのテンプレート",
    tags: ["テクノロジー", "B2B", "スタートアップ"],
    data: {
      // テンプレートのデータ構造
    },
    isFavorite: true,
  },
  {
    id: "2",
    name: "EC向け",
    description: "ECサイトのユーザー層を分析するためのテンプレート",
    tags: ["EC", "B2C", "オンラインショッピング"],
    data: {
      // テンプレートのデータ構造
    },
  },
]

export function TemplateSelector({ onSelect, onSave }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    tags: [] as string[],
  })

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  const handleSaveTemplate = () => {
    onSave({
      name: newTemplate.name,
      description: newTemplate.description,
      tags: newTemplate.tags,
      data: {}, // 現在のフォームデータを保存
    })
    setIsAddingTemplate(false)
    setNewTemplate({ name: "", description: "", tags: [] })
  }

  const toggleFavorite = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="テンプレートを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規テンプレート
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規テンプレートの作成</DialogTitle>
              <DialogDescription>
                現在の設定をテンプレートとして保存します
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">テンプレート名</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">説明</Label>
                <Input
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingTemplate(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSaveTemplate}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div
                className="p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                onClick={() => onSelect(template)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{template.name}</h3>
                      {template.isFavorite && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(template.id)
                    }}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        template.isFavorite
                          ? "fill-yellow-400 text-yellow-400"
                          : ""
                      }`}
                    />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 