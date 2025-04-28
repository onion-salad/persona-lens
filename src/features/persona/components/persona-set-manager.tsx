import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  MessageSquare,
  Calendar,
  Star,
  MoreHorizontal,
  Copy,
  Trash,
  Download,
  Share2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PersonaSet {
  id: string
  name: string
  description: string
  createdAt: Date
  personas: any[]
  feedbacks: any[]
  tags: string[]
  isFavorite?: boolean
}

interface PersonaSetManagerProps {
  onSelect: (set: PersonaSet) => void
  onDelete: (id: string) => void
  onDuplicate: (set: PersonaSet) => void
}

const mockPersonaSets: PersonaSet[] = [
  {
    id: "1",
    name: "20代女性ユーザー層",
    description: "ECサイトのメインターゲット層の分析",
    createdAt: new Date("2024-03-20"),
    personas: Array(100).fill(null), // 100体のペルソナ
    feedbacks: Array(300).fill(null), // 各ペルソナから3件のフィードバック
    tags: ["EC", "若年層", "女性"],
    isFavorite: true,
  },
  {
    id: "2",
    name: "ビジネスユーザー分析",
    description: "SaaSプロダクトのターゲット層の分析",
    createdAt: new Date("2024-03-19"),
    personas: Array(50).fill(null), // 50体のペルソナ
    feedbacks: Array(150).fill(null), // 各ペルソナから3件のフィードバック
    tags: ["SaaS", "ビジネス", "管理職"],
  },
]

export function PersonaSetManager({
  onSelect,
  onDelete,
  onDuplicate,
}: PersonaSetManagerProps) {
  const [personaSets, setPersonaSets] = useState<PersonaSet[]>(mockPersonaSets)
  const [selectedSet, setSelectedSet] = useState<PersonaSet | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = () => {
    if (selectedSet) {
      onDelete(selectedSet.id)
      setPersonaSets((prev) =>
        prev.filter((set) => set.id !== selectedSet.id)
      )
      setSelectedSet(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleFavorite = (setId: string) => {
    setPersonaSets((prev) =>
      prev.map((set) =>
        set.id === setId ? { ...set, isFavorite: !set.isFavorite } : set
      )
    )
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px]">
        <div className="grid gap-4">
          {personaSets.map((set) => (
            <motion.div
              key={set.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="hover:border-primary cursor-pointer transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {set.name}
                        {set.isFavorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </CardTitle>
                      <CardDescription>{set.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelect(set)}>
                          <Users className="h-4 w-4 mr-2" />
                          詳細を表示
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(set)}>
                          <Copy className="h-4 w-4 mr-2" />
                          複製
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFavorite(set.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          {set.isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          共有
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          エクスポート
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedSet(set)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{set.personas.length}体のペルソナ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{set.feedbacks.length}件のフィードバック</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {set.createdAt.toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {set.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ペルソナセットの削除</DialogTitle>
            <DialogDescription>
              このペルソナセットを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 