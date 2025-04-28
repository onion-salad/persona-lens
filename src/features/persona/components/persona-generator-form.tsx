import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { generatePersonas } from "@/lib/gemini/client"
import { PersonaCard } from "./persona-card"
import { PersonaLoading } from "./persona-loading"
import { samplePersonas } from "../mock/sample-personas"
import { PersonaComparison } from "./persona-comparison"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Download,
  Copy,
  Share2,
  MoreHorizontal,
  ArrowUpDown,
  Star,
  StarOff,
} from "lucide-react"

const formSchema = z.object({
  projectName: z.string().min(1, "プロジェクト名を入力してください"),
  productDescription: z.string().min(1, "製品/サービスの説明を入力してください"),
  targetAudience: z.object({
    ageRange: z.array(z.number()).length(2),
    genders: z.array(z.string()),
    occupations: z.array(z.string()),
    locations: z.array(z.string()),
    incomeLevel: z.string(),
  }),
  personalityTraits: z.array(z.string()),
  interests: z.array(z.string()),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  technicalLevel: z.number(),
  additionalContext: z.string().optional(),
  outputFormat: z.enum(["concise", "detailed", "structured"]),
  detailLevel: z.number(),
  personaCount: z.number().min(1).max(10),
})

type FormData = z.infer<typeof formSchema>

export function PersonaGeneratorForm() {
  const [activeTab, setActiveTab] = useState("basic")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPersonas, setGeneratedPersonas] = useState<any[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    gender: "all",
    ageRange: "all",
    occupation: "all",
  })
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [sortBy, setSortBy] = useState<"age" | "name" | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [favorites, setFavorites] = useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      productDescription: "",
      targetAudience: {
        ageRange: [20, 60],
        genders: [],
        occupations: [],
        locations: [],
        incomeLevel: "middle",
      },
      personalityTraits: [],
      interests: [],
      painPoints: [],
      goals: [],
      technicalLevel: 3,
      additionalContext: "",
      outputFormat: "structured",
      detailLevel: 3,
      personaCount: 3,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true)
    try {
      const result = await generatePersonas(data)
      if (result.personas) {
        setGeneratedPersonas(result.personas)
      } else {
        console.error("Failed to generate personas:", result.error)
      }
    } catch (error) {
      console.error("Error generating personas:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const loadMockData = () => {
    setGeneratedPersonas(samplePersonas)
    setActiveTab("result")
  }

  const filteredPersonas = (generatedPersonas.length > 0 ? generatedPersonas : []).filter(
    (persona) => {
      const matchesSearch =
        searchQuery === "" ||
        persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesGender =
        filters.gender === "all" || persona.gender === filters.gender

      const matchesAge =
        filters.ageRange === "all" ||
        (filters.ageRange === "young" && persona.age < 30) ||
        (filters.ageRange === "middle" && persona.age >= 30 && persona.age < 50) ||
        (filters.ageRange === "senior" && persona.age >= 50)

      const matchesOccupation =
        filters.occupation === "all" ||
        persona.occupation.toLowerCase().includes(filters.occupation.toLowerCase())

      return matchesSearch && matchesGender && matchesAge && matchesOccupation
    }
  )

  // ソート関数
  const sortPersonas = (personas: any[]) => {
    if (!sortBy) return personas

    return [...personas].sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      const order = sortOrder === "asc" ? 1 : -1

      if (typeof aValue === "string") {
        return aValue.localeCompare(bValue) * order
      }
      return (aValue - bValue) * order
    })
  }

  // お気に入り切り替え
  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    )
  }

  // ペルソナの選択
  const togglePersonaSelection = (id: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  // クイックアクション
  const handleCopyPersona = (persona: any) => {
    navigator.clipboard.writeText(JSON.stringify(persona, null, 2))
  }

  const handleSharePersona = (persona: any) => {
    // シェア機能の実装（今回は省略）
    console.log("Share persona:", persona)
  }

  const handleDownloadPersona = (persona: any) => {
    const blob = new Blob([JSON.stringify(persona, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `persona-${persona.name}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // フィルタリングとソートを適用
  const displayedPersonas = sortPersonas(filteredPersonas)

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">基本設定</TabsTrigger>
          <TabsTrigger value="result">
            生成結果
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>プロジェクト名</FormLabel>
                      <FormControl>
                        <Input placeholder="新規Webサービス開発" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>製品/サービスの説明</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="製品やサービスの概要、特徴、目的などを入力してください"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">ターゲット設定</h3>
                <FormField
                  control={form.control}
                  name="targetAudience.ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年齢層</FormLabel>
                      <FormControl>
                        <Slider
                          min={15}
                          max={80}
                          step={1}
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value[0]}歳 〜 {field.value[1]}歳
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAudience.incomeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>収入レベル</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="収入レベルを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">低所得層</SelectItem>
                          <SelectItem value="middle">中所得層</SelectItem>
                          <SelectItem value="high">高所得層</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">出力設定</h3>
                <FormField
                  control={form.control}
                  name="outputFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出力形式</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="出力形式を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="concise">簡潔</SelectItem>
                          <SelectItem value="detailed">詳細</SelectItem>
                          <SelectItem value="structured">構造化</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="detailLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>詳細度</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value === 1
                          ? "最小限"
                          : field.value === 5
                          ? "非常に詳細"
                          : `レベル ${field.value}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personaCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生成数</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>{field.value}人</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isGenerating} className="flex-1">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "ペルソナを生成"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={loadMockData}>
                  サンプルを表示
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="result">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="名前、職業、場所で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>フィルター</SheetTitle>
                      <SheetDescription>
                        ペルソナの表示条件を設定します
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <FormLabel>性別</FormLabel>
                        <Select
                          value={filters.gender}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, gender: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="男性">男性</SelectItem>
                            <SelectItem value="女性">女性</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <FormLabel>年齢層</FormLabel>
                        <Select
                          value={filters.ageRange}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, ageRange: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="young">〜29歳</SelectItem>
                            <SelectItem value="middle">30〜49歳</SelectItem>
                            <SelectItem value="senior">50歳〜</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <FormLabel>職業</FormLabel>
                        <Select
                          value={filters.occupation}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, occupation: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="デザイナー">デザイナー</SelectItem>
                            <SelectItem value="マネージャー">マネージャー</SelectItem>
                            <SelectItem value="エンジニア">エンジニア</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortBy
                        ? `${sortBy === "age" ? "年齢" : "名前"}${
                            sortOrder === "asc" ? "↑" : "↓"
                          }`
                        : "ソート"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSortBy("name")
                      setSortOrder("asc")
                    }}>
                      名前（昇順）
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortBy("name")
                      setSortOrder("desc")
                    }}>
                      名前（降順）
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setSortBy("age")
                      setSortOrder("asc")
                    }}>
                      年齢（昇順）
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortBy("age")
                      setSortOrder("desc")
                    }}>
                      年齢（降順）
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedPersonas.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsComparing(true)}
                  >
                    {selectedPersonas.length}件を比較
                  </Button>
                )}
              </div>
            </div>
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: form.getValues("personaCount") }).map((_, i) => (
                    <PersonaLoading key={i} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {displayedPersonas.map((persona) => (
                    <div key={persona.id} className="relative group">
                      <PersonaCard
                        persona={persona}
                        onSelect={() => togglePersonaSelection(persona.id)}
                        isSelected={selectedPersonas.includes(persona.id)}
                        isExpanded={expandedPersonaId === persona.id}
                        onToggleExpand={() =>
                          setExpandedPersonaId(
                            expandedPersonaId === persona.id ? null : persona.id
                          )
                        }
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleFavorite(persona.id)}
                                >
                                  {favorites.includes(persona.id) ? (
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ) : (
                                    <StarOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {favorites.includes(persona.id)
                                  ? "お気に入りから削除"
                                  : "お気に入りに追加"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCopyPersona(persona)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                コピー
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSharePersona(persona)}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                共有
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownloadPersona(persona)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                ダウンロード
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
      {isComparing && (
        <PersonaComparison
          personas={displayedPersonas.filter((p) =>
            selectedPersonas.includes(p.id)
          )}
          onClose={() => {
            setIsComparing(false)
            setSelectedPersonas([])
          }}
        />
      )}
    </div>
  )
}