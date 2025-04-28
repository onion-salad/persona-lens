import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, LayoutDashboard, Plus } from "lucide-react"

const navigation = [
  {
    name: "ホーム",
    href: "/",
    icon: Home,
  },
  {
    name: "ダッシュボード",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "ペルソナ作成",
    href: "/create-persona",
    icon: Plus,
  },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href
        return (
          <Button
            key={item.name}
            asChild
            variant={isActive ? "default" : "ghost"}
            className={cn(
              "h-9 px-4",
              isActive
                ? ""
                : "text-muted-foreground hover:text-primary hover:bg-muted"
            )}
          >
            <Link to={item.href} className="flex items-center space-x-2">
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          </Button>
        )
      })}
    </nav>
  )
} 