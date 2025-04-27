import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"

interface ShortcutHelpDialogProps {
  trigger?: React.ReactNode
}

const shortcuts = [
  {
    key: "⌘/Ctrl + F",
    description: "検索",
  },
  {
    key: "⌘/Ctrl + Shift + F",
    description: "フィルター",
  },
  {
    key: "⌘/Ctrl + C",
    description: "選択したペルソナを比較",
  },
  {
    key: "⌘/Ctrl + E",
    description: "詳細表示/非表示",
  },
  {
    key: "Esc",
    description: "モーダルを閉じる",
  },
  {
    key: "Space",
    description: "ペルソナを選択",
  },
  {
    key: "↑/↓",
    description: "ペルソナ間を移動",
  },
]

export function ShortcutHelpDialog({ trigger }: ShortcutHelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Keyboard className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>キーボードショートカット</DialogTitle>
          <DialogDescription>
            以下のショートカットを使用して、より効率的に操作できます
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between"
            >
              <code className="relative rounded bg-muted px-[0.5rem] py-[0.3rem] font-mono text-sm">
                {shortcut.key}
              </code>
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 