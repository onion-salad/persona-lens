"use client"

// import { Sidebar } from "@/components/layouts/sidebar"
import { Header } from "@/components/layouts/header"
import { ReactNode } from "react"

interface RootLayoutProps {
  children: ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    // flex-col のみにして、サイドバー部分を削除
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      {/* <Sidebar /> */}
      {/* メインコンテンツが全幅になるように調整 */}
      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
