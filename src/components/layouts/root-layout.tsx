"use client"

// import { Sidebar } from "@/components/layouts/sidebar"
import { Header } from "@/components/layouts/header"
import { ReactNode } from "react"
import { useLocation } from 'react-router-dom';

interface RootLayoutProps {
  children: ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const showHeader = location.pathname !== '/persona-simulation';

  return (
    // flex-col のみにして、サイドバー部分を削除
    <div className="flex min-h-screen flex-col bg-white">
      {showHeader && <Header />}
      {/* <Sidebar /> */}
      {/* メインコンテンツが全幅になるように調整 - パディング削除 */}
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
