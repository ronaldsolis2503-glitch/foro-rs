'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import { parseJwt } from './google-auth'

export type UserProfile = {
  id: string
  name: string
  email: string
  handle: string
  initials: string
  avatarUrl?: string
  role: string
  experienceLevel: string
  location: string
  phone: string
  bio: string
  gear: string[]
  portfolioUrl: string
  reputation: number
  avatarTone: string
  joinedAt: string
  stats: {
    posts: number
    comments: number
    likes: number
  }
}

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', // Directora / DoP
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', // Filmmaker
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', // Editor / Colorista
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', // Productora
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80', // Diseñador de Sonido
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80', // Operador Steadicam
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', // Guionista
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80', // Director Ejecutivo
]

export function getUserAvatarUrl(user?: Partial<UserProfile> | null): string {
  if (!user) return DEFAULT_AVATARS[0]
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) return user.avatarUrl

  const seedString = user.id || user.handle || user.name || 'default'
  let hash = 0
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % DEFAULT_AVATARS.length
  return DEFAULT_AVATARS[index]
}

export type StoredUser = UserProfile & {
  passwordHash: string
}

export type RegisterData = {
  name: string
  handle: string
  email: string
  password: string
  phone: string
  role: string
  experienceLevel: string
  location: string
  bio: string
  gear: string[]
  portfolioUrl: string
}

type AuthContextType = {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isAuthModalOpen: boolean
  authTab: 'login' | 'register'
  viewingProfile: UserProfile | null
  isProfileModalOpen: boolean
  googleClientId: string
  setGoogleClientId: (id: string) => void
  openAuthModal: (tab?: 'login' | 'register') => void
  closeAuthModal: () => void
  openProfileModal: (profile?: UserProfile) => void
  closeProfileModal: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  incrementUserStats: (type: 'posts' | 'comments' | 'likes') => void
  logout: () => void
  loginWithGoogleCredential: (credentialToken: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogleOAuth: () => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SEEDED_USERS: StoredUser[] = [
  {
    id: 'usr-1',
    name: 'María Rodríguez',
    email: 'maria@forors.com',
    passwordHash: '123456',
    handle: '@mariar',
    initials: 'MR',
    role: 'Filmmaker & Editora',
    experienceLevel: 'Profesional',
    location: 'Madrid, España',
    phone: '+34 612 345 678',
    bio: 'Directora de fotografía y editora apasionada por la luz natural y el documental social. 8 años contando historias en pantalla.',
    gear: ['Sony FX3', 'Sony A7S III', 'DaVinci Resolve', 'Sigma Art 24-70mm'],
    portfolioUrl: 'https://vimeo.com',
    reputation: 284,
    avatarTone: 'from-fuchsia-500 to-orange-400',
    joinedAt: 'Marzo 2024',
    stats: { posts: 14, comments: 38, likes: 184 },
  },
  {
    id: 'usr-2',
    name: 'Carlos Mendoza',
    email: 'carlos@forors.com',
    passwordHash: '123456',
    handle: '@carlosm',
    initials: 'CM',
    role: 'Colorista Senior',
    experienceLevel: 'Máster',
    location: 'Buenos Aires, Argentina',
    phone: '+54 11 4567 8901',
    bio: 'Colorista profesional con más de 10 años en posproducción de videoclips y comerciales.',
    gear: ['DaVinci Resolve Studio', 'Tangente Wave Panel'],
    portfolioUrl: 'https://vimeo.com',
    reputation: 350,
    avatarTone: 'from-orange-400 to-amber-300',
    joinedAt: 'Enero 2024',
    stats: { posts: 8, comments: 29, likes: 119 },
  },
]

const SESSION_KEY = 'foro_rs_active_session'
const USERS_DB_KEY = 'foro_rs_registered_users_db'
const GOOGLE_CLIENT_ID_KEY = 'foro_rs_google_client_id'

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getStoredUsersDB(): StoredUser[] {
  if (typeof window === 'undefined') return SEEDED_USERS
  const raw = localStorage.getItem(USERS_DB_KEY)
  if (!raw) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(SEEDED_USERS))
    return SEEDED_USERS
  }
  try {
    return JSON.parse(raw)
  } catch {
    return SEEDED_USERS
  }
}

function saveUsersDB(users: StoredUser[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users))
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [googleClientId, setGoogleClientIdState] = useState<string>('')

  useEffect(() => {
    async function initAuth() {
      try {
        const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
        const storedClientId = localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || ''
        setGoogleClientIdState(envClientId || storedClientId)

        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const u = session.user
            const meta = u.user_metadata || {}
            const name = meta.full_name || u.email?.split('@')[0] || 'Usuario Google'
            const handle = meta.handle || `@${name.toLowerCase().replace(/\s+/g, '')}`

            setUser({
              id: u.id,
              name,
              email: u.email || '',
              handle,
              initials: getInitials(name),
              role: meta.role || 'Filmmaker',
              experienceLevel: meta.experience_level || meta.experienceLevel || 'Intermedio',
              location: meta.location || 'Cuenta de Google Verificada',
              phone: meta.phone || '',
              bio: meta.bio || 'Creador en Foro RS autenticado con Google',
              gear: meta.gear || ['Sony FX3', 'DaVinci Resolve'],
              portfolioUrl: meta.portfolio_url || meta.portfolioUrl || '',
              reputation: meta.reputation || 100,
              avatarTone: 'from-fuchsia-500 to-orange-400',
              joinedAt: 'Agosto 2026',
              stats: meta.stats || { posts: 1, comments: 2, likes: 5 },
            })
          } else {
            setUser(null)
          }

          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const u = session.user
              const meta = u.user_metadata || {}
              const name = meta.full_name || u.email?.split('@')[0] || 'Usuario Google'
              const handle = meta.handle || `@${name.toLowerCase().replace(/\s+/g, '')}`

              setUser({
                id: u.id,
                name,
                email: u.email || '',
                handle,
                initials: getInitials(name),
                role: meta.role || 'Filmmaker',
                experienceLevel: meta.experience_level || meta.experienceLevel || 'Intermedio',
                location: meta.location || 'Cuenta de Google Verificada',
                phone: meta.phone || '',
                bio: meta.bio || 'Creador en Foro RS autenticado con Google',
                gear: meta.gear || ['Sony FX3'],
                portfolioUrl: meta.portfolio_url || meta.portfolioUrl || '',
                reputation: meta.reputation || 100,
                avatarTone: 'from-fuchsia-500 to-orange-400',
                joinedAt: 'Agosto 2026',
                stats: meta.stats || { posts: 1, comments: 2, likes: 5 },
              })
            } else {
              setUser(null)
            }
          })
        } else {
          getStoredUsersDB()
          const savedSession = localStorage.getItem(SESSION_KEY)
          if (savedSession) {
            try {
              setUser(JSON.parse(savedSession))
            } catch {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const setGoogleClientId = (id: string) => {
    setGoogleClientIdState(id)
    localStorage.setItem(GOOGLE_CLIENT_ID_KEY, id)
  }

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const openProfileModal = (targetProfile?: UserProfile) => {
    setViewingProfile(targetProfile || user || SEEDED_USERS[0])
    setIsProfileModalOpen(true)
  }

  const closeProfileModal = () => {
    setIsProfileModalOpen(false)
    setViewingProfile(null)
  }

  const login = async (emailOrHandle: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanInput = emailOrHandle.trim().toLowerCase()

    // 1. Try local storage DB first for instant response
    const db = getStoredUsersDB()
    const foundUser = db.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.handle.toLowerCase() === cleanInput ||
        u.handle.toLowerCase() === `@${cleanInput}`
    )

    if (foundUser) {
      if (foundUser.passwordHash !== password) {
        return {
          success: false,
          error: 'La contraseña ingresada es incorrecta. Por favor verifica tus datos.',
        }
      }
      const { passwordHash, ...sessionProfile } = foundUser
      setUser(sessionProfile)
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionProfile))
      closeAuthModal()
      return { success: true }
    }

    // 2. Fallback to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password,
      })
      if (error) return { success: false, error: error.message }
      if (data.user) {
        closeAuthModal()
        return { success: true }
      }
    }

    return {
      success: false,
      error: `No existe ninguna cuenta registrada con "${emailOrHandle}". ¡Crea tu cuenta gratis en la pestaña Registrarse!`,
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const formattedHandle = data.handle.trim().startsWith('@')
      ? data.handle.trim()
      : `@${data.handle.trim()}`
    const cleanEmail = data.email.trim().toLowerCase()

    await new Promise((resolve) => setTimeout(resolve, 300))

    const db = getStoredUsersDB()
    const duplicateEmail = db.find((u) => u.email.toLowerCase() === cleanEmail)
    if (duplicateEmail) {
      return { success: false, error: `El correo "${cleanEmail}" ya está registrado. Por favor inicia sesión.` }
    }

    const duplicateHandle = db.find((u) => u.handle.toLowerCase() === formattedHandle.toLowerCase())
    if (duplicateHandle) {
      return { success: false, error: `El usuario "${formattedHandle}" ya está en uso. Elige otro handle.` }
    }

    const newStoredUser: StoredUser = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.password,
      handle: formattedHandle,
      initials: getInitials(data.name),
      role: data.role || 'Filmmaker / Creador',
      experienceLevel: data.experienceLevel || 'Intermedio',
      location: data.location.trim() || 'Latinoamérica',
      phone: data.phone.trim(),
      bio: data.bio.trim() || 'Creador audiovisual en Foro RS.',
      gear: data.gear.length ? data.gear : ['Cámara Mirrorless', 'NLE Software'],
      portfolioUrl: data.portfolioUrl.trim(),
      reputation: 100,
      avatarTone: 'from-amber-400 via-yellow-500 to-amber-600',
      joinedAt: 'Hoy',
      stats: { posts: 0, comments: 0, likes: 0 },
    }

    const updatedDB = [...db, newStoredUser]
    saveUsersDB(updatedDB)

    const { passwordHash, ...sessionProfile } = newStoredUser
    setUser(sessionProfile)
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionProfile))

    // Optional background sync with Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            handle: formattedHandle,
            role: data.role,
          },
        },
      }).catch(() => {})
    }

    closeAuthModal()
    return { success: true }
  }

  // Real Google Sign-In with JWT Credential (Token from Google Identity Services)
  const loginWithGoogleCredential = async (credentialToken: string): Promise<{ success: boolean; error?: string }> => {
    const payload = parseJwt(credentialToken)
    if (!payload || !payload.email) {
      return { success: false, error: 'Token de respuesta de Google inválido.' }
    }

    const googleEmail = payload.email.toLowerCase()
    const googleName = payload.name || payload.given_name || googleEmail.split('@')[0]
    const googleHandle = `@${googleEmail.split('@')[0].replace(/[^a-z0-9_]/g, '')}`

    const googleUser: UserProfile = {
      id: `usr-google-${payload.sub || Date.now()}`,
      name: googleName,
      email: googleEmail,
      handle: googleHandle,
      initials: getInitials(googleName),
      role: 'Filmmaker / Creador Digital',
      experienceLevel: 'Profesional',
      location: 'Cuenta de Google Verificada',
      phone: '',
      bio: 'Perfil verificado y autenticado directamente mediante Google OAuth2.',
      gear: ['Sony FX3', 'DaVinci Resolve Studio'],
      portfolioUrl: 'https://vimeo.com',
      reputation: 250,
      avatarTone: 'from-amber-400 via-rose-500 to-fuchsia-500',
      joinedAt: 'Hoy',
      stats: { posts: 0, comments: 0, likes: 0 },
    }

    const db = getStoredUsersDB()
    const existingIndex = db.findIndex((u) => u.email.toLowerCase() === googleEmail)
    if (existingIndex >= 0) {
      const { passwordHash, ...existing } = db[existingIndex]
      setUser(existing)
      localStorage.setItem(SESSION_KEY, JSON.stringify(existing))
    } else {
      const storedGoogleUser: StoredUser = { ...googleUser, passwordHash: 'google_oauth_token' }
      saveUsersDB([...db, storedGoogleUser])
      setUser(googleUser)
      localStorage.setItem(SESSION_KEY, JSON.stringify(googleUser))
    }

    closeAuthModal()
    return { success: true }
  }

  const loginWithGoogleOAuth = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    }

    return { success: false, error: 'NO_CLIENT_ID' }
  }

  const updateProfile = async (updated: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No hay usuario autenticado' }

    const updatedUser: UserProfile = { ...user, ...updated }
    setUser(updatedUser)
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))

    const db = getStoredUsersDB()
    const updatedDB = db.map((u) => (u.id === user.id ? { ...u, ...updated } : u))
    saveUsersDB(updatedDB)

    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').update(updated).eq('id', user.id)
    }

    return { success: true }
  }

  const incrementUserStats = (type: 'posts' | 'comments' | 'likes') => {
    if (!user) return
    const newStats = {
      ...user.stats,
      [type]: (user.stats[type] || 0) + 1,
    }
    const updatedUser: UserProfile = {
      ...user,
      reputation: user.reputation + (type === 'posts' ? 15 : type === 'comments' ? 5 : 2),
      stats: newStats,
    }
    setUser(updatedUser)
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))

    const db = getStoredUsersDB()
    const updatedDB = db.map((u) => (u.id === user.id ? { ...u, ...updatedUser } : u))
    saveUsersDB(updatedDB)
  }

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authTab,
        viewingProfile,
        isProfileModalOpen,
        googleClientId,
        setGoogleClientId,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        login,
        register,
        updateProfile,
        incrementUserStats,
        logout,
        loginWithGoogleCredential,
        loginWithGoogleOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
