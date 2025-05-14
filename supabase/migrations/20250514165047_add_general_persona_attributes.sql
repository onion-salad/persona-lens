-- ペルソナのタイプを追加
ALTER TABLE public.expert_personas
ADD COLUMN persona_type TEXT CHECK (persona_type IN ('business_professional', 'general_consumer', 'specific_role', 'custom')) DEFAULT 'custom';

-- AIによるペルソナ概要説明を追加
ALTER TABLE public.expert_personas
ADD COLUMN description_by_ai TEXT;

-- 一般消費者向け属性
ALTER TABLE public.expert_personas
ADD COLUMN age_group TEXT CHECK (age_group IN ('child', 'teenager', '20s', '30s', '40s', '50s', '60s', '70s_and_above')),
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other')),
ADD COLUMN occupation_category TEXT,
ADD COLUMN interests TEXT[],
ADD COLUMN lifestyle TEXT,
ADD COLUMN family_structure TEXT,
ADD COLUMN location_type TEXT CHECK (location_type IN ('urban', 'suburban', 'rural')),
ADD COLUMN values_and_priorities TEXT[],
ADD COLUMN technology_literacy TEXT CHECK (technology_literacy IN ('high', 'medium', 'low'));

-- ビジネス専門家向け属性の調整
-- title, industry, position の NOT NULL 制約を削除
ALTER TABLE public.expert_personas
ALTER COLUMN title DROP NOT NULL,
ALTER COLUMN industry DROP NOT NULL,
ALTER COLUMN position DROP NOT NULL;

-- カスタム属性用のJSONBカラム
ALTER TABLE public.expert_personas
ADD COLUMN custom_attributes JSONB; 