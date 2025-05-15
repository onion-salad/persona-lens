-- ユーザーテーブル
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.users enable row level security;
create policy "ユーザーは自分のデータのみアクセス可能" on public.users
  for all using (auth.uid() = id);

-- 実行履歴テーブル
create table if not exists public.execution_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  target_gender text,
  target_age text,
  target_income text,
  service_description text,
  usage_scene text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.execution_history enable row level security;
create policy "ユーザーは自分の実行履歴のみアクセス可能" on public.execution_history
  for all using (auth.uid() = user_id);

-- ペルソナテーブル
create table if not exists public.expert_personas (
  id uuid default uuid_generate_v4() primary key,
  execution_id uuid references public.execution_history(id) on delete cascade,
  name text,
  age integer,
  gender text,
  occupation text,
  income text,
  interests text[],
  personality text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.expert_personas enable row level security;
create policy "ユーザーは関連する実行のペルソナにアクセス可能" on public.expert_personas
  for all using (
    exists (
      select 1 from public.execution_history
      where id = expert_personas.execution_id
      and user_id = auth.uid()
    )
  );

-- フィードバックテーブル
create table if not exists public.feedbacks (
  id uuid default uuid_generate_v4() primary key,
  persona_id uuid references public.expert_personas(id) on delete cascade,
  execution_id uuid references public.execution_history(id) on delete cascade,
  content text,
  rating integer,
  aspects jsonb, -- 評価の詳細（UI、UX、機能性など）
  suggestions text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.feedbacks enable row level security;
create policy "ユーザーは関連する実行のフィードバックにアクセス可能" on public.feedbacks
  for all using (
    exists (
      select 1 from public.execution_history
      where id = feedbacks.execution_id
      and user_id = auth.uid()
    )
  );

-- トリガー関数の作成
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- updated_atを自動更新するトリガーの設定
create trigger handle_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_updated_at
  before update on public.execution_history
  for each row
  execute function public.handle_updated_at(); 