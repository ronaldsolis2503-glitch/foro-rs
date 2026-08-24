'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'

export type UserProfile = {
  id: string
  name: string
  email: string
  handle: string
  initials: string
  role: string
  reputation: number
  avatarTone: string
}

type AuthContextType = {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isAuthModalOpen: boolean
  authTab: 'login' | 'register'
  openAuthModal: (tab?: 'login' | 'register') => void
  closeAuthModal: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { name: string; handle: string; email: string; password: string; role: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loginWithSocial: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER: UserProfile = {
  id: 'usr-1',
  name: 'María Rodríguez',
  email: 'maria@forors.com',
  handle: '@mariar',
  initials: 'MR',
  role: 'Filmmaker & Editora',
  reputation: 284,
  avatarTone: 'from-fuchsia-500 to-orange-400',
}

const LOCAL_STORAGE_KEY = 'foro_rs_current_user'

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USER)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')

  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const u = session.user
            const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario'
            const handle = u.user_metadata?.handle || `@${name.toLowerCase().replace(/\s+/g, '')}`
            setUser({
              id: u.id,
              name,
              email: u.email || '',
              handle,
              initials: getInitials(name),
              role: u.user_metadata?.role || 'Filmmaker',
              reputation: u.user_metadata?.reputation || 100,
              avatarTone: 'from-fuchsia-500 to-orange-400',
            })
          } else {
            setUser(null)
          }

          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const u = session.user
              const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario'
              const handle = u.user_metadata?.handle || `@${name.toLowerCase().replace(/\s+/g, '')}`
              setUser({
                id: u.id,
                name,
                email: u.email || '',
                handle,
                initials: getInitials(name),
                role: u.user_metadata?.role || 'Filmmaker',
                reputation: u.user_metadata?.reputation || 100,
                avatarTone: 'from-fuchsia-500 to-orange-400',
              })
            } else {
              setUser(null)
            }
          })
        } else {
          // Fallback to local storage or demo session
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
          if (saved) {
            try {
              setUser(JSON.parse(saved))
            } catch {
              setUser(DEMO_USER)
            }
          } else {
            setUser(DEMO_USER)
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

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { success: false, error: error.message }
      if (data.user) {
        closeAuthModal()
        return { success: true }
      }
      return { success: false, error: 'Ocurrió un error al iniciar sesión' }
    }

    // Local Auth simulation
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (!email.includes('@') || password.length < 4) {
      return { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
    }

    const name = email.split('@')[0]
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
    const loggedUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email,
      handle: `@${name.toLowerCase()}`,
      initials: getInitials(formattedName),
      role: 'Filmmaker',
      reputation: 150,
      avatarTone: 'from-violet-500 to-rose-500',
    }

    setUser(loggedUser)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loggedUser))
    closeAuthModal()
    return { success: true }
  }

  const register = async (data: {
    name: string
    handle: string
    email: string
    password: string
    role: string
  }): Promise<{ success: boolean; error?: string }> => {
    const formattedHandle = data.handle.startsWith('@') ? data.handle : `@${data.handle}`

    if (isSupabaseConfigured && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            handle: formattedHandle,
            role: data.role,
            reputation: 50,
          },
        },
      })

      if (error) return { success: false, error: error.message }
      if (authData.user) {
        closeAuthModal()
        return { success: true }
      }
      return { success: false, error: 'Error al registrar la cuenta.' }
    }

    // Local Auth simulation
    await new Promise((resolve) => setTimeout(resolve, 700))
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      handle: formattedHandle,
      initials: getInitials(data.name),
      role: data.role || 'Creador Audiovisual',
      reputation: 50,
      avatarTone: 'from-fuchsia-500 via-rose-500 to-orange-400',
    }

    setUser(newUser)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser))
    closeAuthModal()
    return { success: true }
  }

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  const loginWithSocial = async (provider: 'google' | 'github'): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) return { success: false, error: error.message }
      return { success: true }
    }

    // Local Auth simulation
    await new Promise((resolve) => setTimeout(resolve, 600))
    const providerName = provider === 'google' ? 'Google' : 'GitHub'
    const socialUser: UserProfile = {
      id: `usr-${provider}-${Date.now()}`,
      name: `Usuario de ${providerName}`,
      email: `user.${provider}@forors.com`,
      handle: `@${provider}_creator`,
      initials: provider === 'google' ? 'GO' : 'GH',
      role: 'Filmmaker',
      reputation: 200,
      avatarTone: provider === 'google' ? 'from-amber-400 to-rose-500' : 'from-slate-700 to-zinc-900',
    }

    setUser(socialUser)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(socialUser))
    closeAuthModal()
    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        loginWithSocial,
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
