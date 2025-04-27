
"use client"

import { cn } from "@/lib/utils"
import { Brain, Home, Menu, X } from "lucide-react"
import { NavLink } from "react-router-dom"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    name: "ホーム",
    href: "/",
    icon: Home,
  },
  {
    name: "AI人格生成",
    href: "/persona/generate",
    icon: Brain,
    description: "AIによる人格生成とフィードバック",
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      {/* モバイル用メニューボタン */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      <div className={cn(
        "flex h-full flex-col gap-2 bg-background transition-all duration-300 ease-in-out",
        isMobile ? "fixed left-0 top-0 z-40 w-64 shadow-lg" : "relative w-64",
        isOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "w-0"
      )}>
        <div className="flex h-[60px] items-center border-b px-6">
          <span className="text-lg font-semibold">Persona Lens</span>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 py-2">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "transparent",
                  )
                }
                onClick={() => isMobile && setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  )}
                </div>
              </NavLink>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* モバイル用オーバーレイ */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
