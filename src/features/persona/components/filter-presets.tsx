import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
import { Label } from "@/components/ui/label"
import { Bookmark, Plus, Star } from "lucide-react"

interface FilterPreset {
  id: string
  name: string
  filters: {
    gender: string
    ageRange: string
    occupation: string
  }
}

interface FilterPresetsProps {
  onApplyPreset: (filters: FilterPreset["filters"]) => void
}

const defaultPresets: FilterPreset[] = [
  {
    id: "young-female",
    name: "若年女性層",
    filters: {
      gender: "女性",
      ageRange: "young",
      occupation: "all",
    },
  },
  {
    id: "middle-manager",
    name: "中堅マネージャー",
    filters: {
      gender: "all",
      ageRange: "middle",
      occupation: "マネージャー",
    },
  },
]

export function FilterPresets({ onApplyPreset }: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>(defaultPresets)
  const [isAddingPreset, setIsAddingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [currentFilters, setCurrentFilters] = useState<FilterPreset["filters"]>({
    gender: "all",
    ageRange: "all",
    occupation: "all",
  })

  const handleSavePreset = () => {
    if (!newPresetName) return

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      filters: currentFilters,
    }

    setPresets((prev) => [...prev, newPreset])
    setNewPresetName("")
    setIsAddingPreset(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            プリセット
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onApplyPreset(preset.filters)}
            >
              <Star className="h-4 w-4 mr-2" />
              {preset.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsAddingPreset(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規プリセットを作成
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddingPreset} onOpenChange={setIsAddingPreset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フィルタープリセットの作成</DialogTitle>
            <DialogDescription>
              現在のフィルター設定をプリセットとして保存します
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">プリセット名</Label>
              <Input
                id="name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="例：若年女性層"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingPreset(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSavePreset} disabled={!newPresetName}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 