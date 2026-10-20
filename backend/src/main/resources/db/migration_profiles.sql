-- ========================================================
-- Supabase Auth + public.profiles 마이그레이션 스크립트
-- ========================================================

-- 1. 회원 프로필 테이블 생성 (public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(30) NOT NULL,
    user_tag VARCHAR(10) NOT NULL,
    profile_image TEXT,
    quiet_time_start TIME DEFAULT '21:00:00',
    quiet_time_end TIME DEFAULT '08:00:00',
    is_expire_warn_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_reaction_notice_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_profiles_nickname_tag UNIQUE (nickname, user_tag)
);

-- 2. 외래키 및 컬럼 타입 전환 (bigint -> UUID)
ALTER TABLE public.recipe DROP CONSTRAINT IF EXISTS fk_recipe_user;
ALTER TABLE public.user_ingredient DROP CONSTRAINT IF EXISTS fk_user_ing_user;
ALTER TABLE public.recipe_like DROP CONSTRAINT IF EXISTS fk_like_user;
ALTER TABLE public.scrap DROP CONSTRAINT IF EXISTS fk_scrap_user;
ALTER TABLE public.notification DROP CONSTRAINT IF EXISTS fk_notification_user;

ALTER TABLE public.recipe ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.user_ingredient ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.recipe_like ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.scrap ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.notification ALTER COLUMN user_id TYPE UUID USING NULL;

ALTER TABLE public.recipe ADD CONSTRAINT fk_recipe_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.user_ingredient ADD CONSTRAINT fk_user_ing_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_like ADD CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.scrap ADD CONSTRAINT fk_scrap_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notification ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Row Level Security (RLS) 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated USING ((select auth.uid()) = id);
