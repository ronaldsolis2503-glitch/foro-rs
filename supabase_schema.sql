-- =========================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE PARA FORO RS
-- =========================================================

-- 1. Tabla de Perfiles de Usuario (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Filmmaker',
  experience_level TEXT DEFAULT 'Intermedio',
  location TEXT,
  phone TEXT,
  bio TEXT,
  gear TEXT[],
  portfolio_url TEXT,
  avatar_tone TEXT DEFAULT 'from-fuchsia-500 to-orange-400',
  reputation INTEGER DEFAULT 100,
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los perfiles son visibles públicamente"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger para crear automáticamente el perfil al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    handle,
    role,
    experience_level,
    location,
    phone,
    bio,
    gear,
    portfolio_url,
    avatar_tone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'handle', '@' || SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Filmmaker'),
    COALESCE(NEW.raw_user_meta_data->>'experience_level', 'Intermedio'),
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'bio',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'gear')), ARRAY[]::TEXT[]),
    NEW.raw_user_meta_data->>'portfolio_url',
    'from-fuchsia-500 to-orange-400'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabla de Publicaciones (posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'Preguntas',
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  tags TEXT,
  gradient TEXT DEFAULT 'from-fuchsia-950 via-rose-800 to-orange-700',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publicaciones visibles públicamente"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden crear publicaciones"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Tabla de Comentarios / Respuestas (comments)
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios visibles públicamente"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden comentar"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
