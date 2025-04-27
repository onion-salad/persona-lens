# Implementation Plan

## Phase 1: MVP (Minimum Viable Product)

### Core Modules

- [ ] **Environment Builder**: テンプレート選択、基本的な編集機能
- [ ] **Schema Synthesizer (AI)**: YAML から JSON Schema への自動生成（基本的なバリデーション）
- [ ] **Group Persona Setup**: 属性比率スライダー、プレビュー機能
- [ ] **Persona Generator**: Gemini API を利用した並列生成（10体程度）
- [ ] **Simulation Monitor**: Tick設定、終了条件設定、実行回数設定、基本的な実行UI
- [ ] **Results Dashboard**: KPI平均値グラフ表示、基本的なログ表示

### Infrastructure & Backend

- [ ] Supabase プロジェクトセットアップ (DB, Auth)
- [ ] Gemini API キー設定

### UI/UX

- [ ] 主要画面の基本的なレイアウト実装 (shadcn/ui)
- [ ] 直線的なユーザフローの実装

## Phase 2: Post-MVP Enhancements

- [ ] 結果ダッシュボードの強化（分散表示、ログドリルダウン）
- [ ] アクション可視化機能（Unsupported Action表示）
- [ ] コスト管理機能（残高バー、モデル自動切替）
- [ ] より多くの環境テンプレート追加
- [ ] ペルソナ属性の詳細設定

## Phase 3: Future Expansion

- [ ] リアルタイム 3D / WebGL ビュー
- [ ] アバター通話機能
- [ ] テンプレート/ペルソナマーケットプレイス
- [ ] 大規模シミュレーション対応 (Ray/GPU) 