import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface PersonaGroupDialogProps {
  personas: any[]
  selectedPersonas: string[]
  onCreateGroup: (name: string, personaIds: string[]) => void
  trigger: React.ReactNode
}

export function PersonaGroupDialog({
  personas,
  selectedPersonas,
  onCreateGroup,
  trigger,
}: PersonaGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPersonas)

  const handleCreate = () => {
    if (groupName && selectedIds.length > 0) {
      onCreateGroup(groupName, selectedIds)
      setOpen(false)
      setGroupName("")
      setSelectedIds([])
    }
  }

  const togglePersona = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ペルソナグループの作成</DialogTitle>
          <DialogDescription>
            関連するペルソナをグループ化して管理できます
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">グループ名</Label>
            <Input
              id="name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例：20代女性ユーザー"
            />
          </div>
          <div className="grid gap-2">
            <Label>ペルソナの選択</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.includes(persona.id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => togglePersona(persona.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{persona.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {persona.age}歳・{persona.gender}・{persona.occupation}
                      </span>
                    </div>
                    {selectedIds.includes(persona.id) && (
                      <Badge variant="default">選択中</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleCreate} disabled={!groupName || selectedIds.length === 0}>
            グループを作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 