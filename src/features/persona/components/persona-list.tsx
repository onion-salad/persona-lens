
"use client"

import { cn } from "@/lib/utils"
import { AnimatedList } from "@/components/ui/animated-list"
import { Brain, User2, Sparkles, Zap } from "lucide-react"

interface Persona {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  time: string
  traits: string[]
}

const personas: Persona[] = Array.from({ length: 20 }, (_, i) => ({
  id: `persona-${i + 1}`,
  name: `AI Persona ${i + 1}`,
  description: "製品開発に関心を持つテクノロジー愛好家",
  icon: [<Brain />, <User2 />, <Sparkles />, <Zap />][i % 4],
  color: [
    "rgba(59, 130, 246, 0.1)", // primary
    "rgba(168, 85, 247, 0.1)", // purple
    "rgba(236, 72, 153, 0.1)", // pink
    "rgba(234, 179, 8, 0.1)", // yellow
  ][i % 4],
  time: `${Math.floor(Math.random() * 60)}分前`,
  traits: ["創造的", "分析的", "好奇心旺盛", "技術志向"].sort(() => Math.random() - 0.5).slice(0, 2),
}))

const PersonaCard = ({ name, description, icon, color, time, traits }: Persona) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]"
      )}
    >
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden mt-2 sm:mt-0">
          <figcaption className="flex flex-row items-center justify-between whitespace-pre text-lg font-medium dark:text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </figcaption>
          <p className="text-sm font-normal text-muted-foreground">
            {description}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {traits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}

export function PersonaList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[600px] w-full flex-col overflow-hidden p-2",
        className
      )}
    >
      <AnimatedList className="px-2 md:px-4">
        {personas.map((persona) => (
          <PersonaCard key={persona.id} {...persona} />
        ))}
      </AnimatedList>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background" />
    </div>
  )
}
