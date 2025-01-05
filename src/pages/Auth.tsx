import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/steps");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Persona Lens</h2>
          <p className="mt-2 text-gray-600">アカウントにログインして始めましょう</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "ログイン",
                loading_button_label: "ログイン中...",
                social_provider_text: "でログイン",
                link_text: "アカウントをお持ちの方はこちら",
              },
              sign_up: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "アカウント作成",
                loading_button_label: "アカウント作成中...",
                social_provider_text: "でアカウント作成",
                link_text: "アカウントをお持ちでない方はこちら",
              },
              forgotten_password: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "パスワードリセットメールを送信",
                loading_button_label: "送信中...",
                link_text: "パスワードをお忘れの方はこちら",
              },
              update_password: {
                password_label: "新しいパスワード",
                button_label: "パスワードを更新",
                loading_button_label: "更新中...",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AuthPage;