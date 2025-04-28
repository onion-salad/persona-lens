"use client"

import { cn } from "@/lib/utils"
import { AnimatedList } from "@/components/ui/animated-list"
import { motion } from "framer-motion"

interface Item {
  name: string
  description: string
  icon: string
  color: string
  time: string
}

let notifications = [
  {
    name: "田中 美咲",
    description: "26歳・UI/UXデザイナー・東京在住",
    time: "たった今",
    icon: "👩‍💻",
    color: "#00C9A7",
  },
  {
    name: "鈴木 健一",
    description: "34歳・フリーランスエンジニア・大阪在住",
    time: "2秒前",
    icon: "👨‍💻",
    color: "#FFB800",
  },
  {
    name: "佐藤 優子",
    description: "42歳・マーケティングマネージャー・福岡在住",
    time: "5秒前",
    icon: "👩‍💼",
    color: "#FF3D71",
  },
  {
    name: "山田 太郎",
    description: "29歳・スタートアップCEO・名古屋在住",
    time: "8秒前",
    icon: "👨‍💼",
    color: "#1E86FF",
  },
  {
    name: "中村 花子",
    description: "31歳・プロダクトマネージャー・横浜在住",
    time: "12秒前",
    icon: "👩‍🎤",
    color: "#845EF7",
  },
  {
    name: "木村 隆",
    description: "38歳・データサイエンティスト・札幌在住",
    time: "15秒前",
    icon: "👨‍🔬",
    color: "#FF6B6B",
  },
]

notifications = Array.from({ length: 10 }, () => notifications).flat()

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        "bg-gray-50 border border-gray-200"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium text-gray-900">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal text-gray-600">{description}</p>
        </div>
      </div>
    </figure>
  )
}

export function NotificationList({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn("relative w-full space-y-8", className)}>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            <span>
              今この瞬間も、新しいAI人格が誕生し続けています
            </span>
          </h2>
          <p className="text-gray-600">
            世界中のあらゆる視点から、あなたのプロダクトを見つめています
          </p>
        </motion.div>
      </div>

      <div className={cn("relative flex h-[500px] w-full flex-col overflow-hidden p-2")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative flex h-[500px] flex-col overflow-hidden">
            <AnimatedList delay={800}>
              {notifications.slice(0, notifications.length / 3).map((item, idx) => (
                <Notification {...item} key={`col1-${idx}`} />
              ))}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white"></div>
          </div>
          <div className="relative flex h-[500px] flex-col overflow-hidden">
            <AnimatedList delay={1000}>
              {notifications.slice(notifications.length / 3, (notifications.length / 3) * 2).map((item, idx) => (
                <Notification {...item} key={`col2-${idx}`} />
              ))}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white"></div>
          </div>
          <div className="relative flex h-[500px] flex-col overflow-hidden">
            <AnimatedList delay={1200}>
              {notifications.slice((notifications.length / 3) * 2).map((item, idx) => (
                <Notification {...item} key={`col3-${idx}`} />
              ))}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 