
"use client"

import { Sidebar } from "@/components/layouts/sidebar"
import { ReactNode } from "react"

interface RootLayoutProps {
  children: ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 md:p-6 w-full">
        {children}
      </main>
    </div>
  )
}
