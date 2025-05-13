import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

let supabaseUrl: string | undefined
let supabaseAnonKey: string | undefined

// Node.js環境かどうかを判定 (一例)
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

if (isNode) {
  // Node.js環境: process.env から環境変数を取得
  // Mastra/Node.jsで .env ファイルを読み込むには dotenv のようなライブラリが必要になる場合があります。
  // もし .env.development を使いたい場合、Mastraの起動スクリプトやDockerfileで
  // dotenv を使って読み込む処理を追加するか、実行時に直接環境変数を設定します。
  // ここでは、環境変数が直接Nodeのプロセスに設定されていることを期待します。
  supabaseUrl = process.env.VITE_SUPABASE_URL
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
} else {
  // ブラウザ環境 (Vite): import.meta.env から取得
  // @ts-ignore
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  // @ts-ignore
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 認証状態の変更を監視するフック
export const subscribeToAuthChanges = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event as 'SIGNED_IN' | 'SIGNED_OUT', session)
  })
} 