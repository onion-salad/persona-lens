import { motion } from "framer-motion"
import {
  User,
  MapPin,
  Briefcase,
  Users as Family,
  BookOpen,
  Heart,
  Calendar,
  Laptop,
  ShoppingBag,
  Target,
  Link2,
  Star,
  StarOff,
  MoreHorizontal,
  Copy,
  Share2,
  Download,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PersonaCardProps {
  persona: {
    id: string
    name: string
    age: number
    gender: string
    occupation: string
    location: string
    family: string
    background: string
    personality: string
    dailyLife: string
    techUsage: string
    consumptionBehavior: string
    goalsAndChallenges: string
    relationToProduct: string
  }
  onSelect?: () => void
  isSelected?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
  onToggleFavorite?: () => void
  isFavorite?: boolean
  onCopy?: () => void
  onShare?: () => void
  onDownload?: () => void
  isDragging?: boolean
}

export function PersonaCard({
  persona,
  onSelect,
  isSelected,
  isExpanded,
  onToggleExpand,
  onToggleFavorite,
  isFavorite,
  onCopy,
  onShare,
  onDownload,
  isDragging,
}: PersonaCardProps) {
  const sections = [
    {
      icon: BookOpen,
      title: "経歴",
      content: persona.background,
    },
    {
      icon: Heart,
      title: "性格特性",
      content: persona.personality,
    },
    {
      icon: Calendar,
      title: "日常生活",
      content: persona.dailyLife,
    },
    {
      icon: Laptop,
      title: "技術利用",
      content: persona.techUsage,
    },
    {
      icon: ShoppingBag,
      title: "消費行動",
      content: persona.consumptionBehavior,
    },
    {
      icon: Target,
      title: "目標と課題",
      content: persona.goalsAndChallenges,
    },
    {
      icon: Link2,
      title: "製品との関係",
      content: persona.relationToProduct,
    },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`
          transition-all duration-200 
          ${onSelect ? 'cursor-pointer hover:border-primary' : ''} 
          ${isSelected ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''}
          ${isDragging ? 'shadow-lg scale-105' : ''}
        `}
        onClick={onSelect}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {persona.name}
              </CardTitle>
              <CardDescription className="mt-1.5">
                <div className="flex items-center gap-4">
                  <span>{persona.age}歳・{persona.gender}</span>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {persona.location}
                  </div>
                </div>
              </CardDescription>
            </div>
            {isSelected && (
              <Badge variant="default" className="ml-2">
                選択中
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{persona.occupation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Family className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{persona.family}</span>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <section.icon className="h-4 w-4 text-muted-foreground" />
                    {section.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
        <div className="px-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite()
                      }}
                    >
                      {isFavorite ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {(onCopy || onShare || onDownload) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {onCopy && (
                    <DropdownMenuItem onClick={onCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      コピー
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem onClick={onShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      共有
                    </DropdownMenuItem>
                  )}
                  {onDownload && (
                    <DropdownMenuItem onClick={onDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      ダウンロード
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {onToggleExpand && (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
            >
              {isExpanded ? "折りたたむ" : "詳細を表示"}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
} 