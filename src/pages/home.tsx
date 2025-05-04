import { motion } from "framer-motion"
import { Globe } from "@/components/ui/globe"
import type { COBEOptions } from "cobe"
import { Button } from "@/components/ui/button"
import { Sparkles, BrainCircuit, Settings, ClipboardList, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { NotificationList } from "@/components/ui/notification-list"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// 白背景用の Globe 設定
const WHITE_GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0, // ダークモード無効
  diffuse: 0.8, // 光の拡散具合を調整
  mapSamples: 16000,
  mapBrightness: 0.8, // 明るさを少し抑える
  baseColor: [0.9, 0.9, 0.9], // ベースカラーを明るいグレーに
  markerColor: [0.3, 0.3, 0.3], // マーカーの色を濃いグレーに
  glowColor: [0.8, 0.8, 0.8], // グローの色を明るいグレーに
  markers: [], // この配列を空にする
};

export function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-gray-900">
      {/* 背景グラデーション */}
      {/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" /> */}
      
      <div className="container mx-auto flex flex-col items-center px-4 py-8">
        <div className="relative w-full max-w-6xl">
          {/* ヒーローセクション */}
          <div className="mb-16 grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col justify-center space-y-6 text-center md:text-left">
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm backdrop-blur-sm mx-auto md:mx-0"
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5 text-gray-600" />
                  <span className="text-gray-600">AI Research Project</span>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight md:text-6xl text-gray-900"
                >
                  <span>無限の人格</span>
                  <br />
                  を創造する
                </motion.h1>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-[600px] text-lg md:text-xl text-gray-600 mx-auto md:mx-0"
              >
                AIが生み出す80億人を超える多様なペルソナ。<br className="hidden sm:block" />あなたのプロダクトをかつてない視点で検証します。</motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }} // delay を 0.3 に変更
                className="mb-8 flex justify-center md:justify-start" // mt-12削除, mb-8 に, レスポンシブな左寄せ追加
              >
                {/* ボタンデザインをモノクロに、さらに大きく */}
                <Button size="lg" className="group px-10 py-7 text-xl font-semibold bg-gray-900 text-white hover:bg-gray-700 shadow-lg transition duration-300 ease-in-out transform hover:scale-105 rounded-lg" asChild>
                  <Link to="/persona-simulation">
                    無料でペルソナ生成を開始
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform duration-300 ease-in-out group-hover:translate-x-1" /> {/* アイコンも少し大きく、マージン調整 */}
                  </Link>
                </Button>
              </motion.div>
            </div>
            <div className="relative flex items-center justify-center">
              <Globe
                className="h-[280px] w-[280px] sm:h-[350px] sm:w-[350px] md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px]"
                config={WHITE_GLOBE_CONFIG}
              />
              {/* デコレーション */}
              {/* <div className="absolute -inset-4 -z-10 animate-pulse rounded-full bg-gray-200/30 blur-3xl" />
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gray-200/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gray-200/20 blur-3xl" /> */}
            </div>
          </div>

          {/* 通知リスト */}
          <div className="mt-0 overflow-hidden">
             <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">ペルソナ生成履歴</h2>
            <NotificationList />
          </div>
        </div>
      </div>
    </div>
  )
}
