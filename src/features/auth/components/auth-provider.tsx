import { ReactNode, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase/client"
import { useAuthStore } from "../store/auth-store"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated)

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)

      if (event === "SIGNED_IN") {
        navigate("/dashboard")
      } else if (event === "SIGNED_OUT") {
        navigate("/auth")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, setUser, setIsAuthenticated])

  return <>{children}</>
} 