import { useState } from "react"
import { AuthForm } from "@/features/auth/components/auth-form"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  return (
    <div className="container flex h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "アカウントにログイン" : "アカウントを作成"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "メールアドレスとパスワードでログインしてください"
              : "以下の情報を入力してアカウントを作成してください"}
          </p>
        </div>
        <AuthForm mode={mode} />
        <div className="text-center text-sm">
          {mode === "signin" ? (
            <p>
              アカウントをお持ちでない方は
              <Button
                variant="link"
                className="px-1"
                onClick={() => setMode("signup")}
              >
                新規登録
              </Button>
            </p>
          ) : (
            <p>
              すでにアカウントをお持ちの方は
              <Button
                variant="link"
                className="px-1"
                onClick={() => setMode("signin")}
              >
                ログイン
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 