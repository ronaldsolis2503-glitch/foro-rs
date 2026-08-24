'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, Sparkles, User, UserPlus, X, Briefcase, AtSign, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const ROLES = [
  'Filmmaker / Creador',
  'Director de Fotografía',
  'Editor / Colorista',
  'Director / Guionista',
  'Productor / Producción',
  'Diseñador de Sonido / Audio',
  'Estudiante de Cine / Aficionado',
]

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authTab, openAuthModal, login, register, loginWithSocial } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isAuthModalOpen) return null

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    const res = await login(email, password)
    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Error al iniciar sesión.')
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa los campos obligatorios.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    const cleanHandle = handle.trim() ? (handle.startsWith('@') ? handle : `@${handle}`) : `@${name.toLowerCase().replace(/\s+/g, '')}`

    const res = await register({
      name,
      email,
      password,
      handle: cleanHandle,
      role,
    })
    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Error al registrar tu cuenta.')
    }
  }

  const handleSocialClick = async (provider: 'google' | 'github') => {
    setErrorMsg('')
    setLoading(true)
    const res = await loginWithSocial(provider)
    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || `Error al ingresar con ${provider}.`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border/80 shadow-2xl shadow-fuchsia-500/10">
        {/* Header Decorator */}
        <div className="relative bg-gradient-to-r from-fuchsia-600 via-rose-600 to-orange-500 p-6 text-white">
          <button
            onClick={closeAuthModal}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/20 text-white hover:bg-black/40 transition"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Sparkles className="size-6 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight">
                foro<span className="text-orange-200">RS</span>
              </span>
              <p className="text-xs text-white/80 font-medium">La comunidad de filmmakers y creadores</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border bg-muted/30">
          <button
            onClick={() => {
              openAuthModal('login')
              setErrorMsg('')
            }}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              authTab === 'login'
                ? 'border-fuchsia-500 text-fuchsia-500 bg-background/50'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              openAuthModal('register')
              setErrorMsg('')
            }}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              authTab === 'register'
                ? 'border-fuchsia-500 text-fuchsia-500 bg-background/50'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        <div className="p-6">
          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-600">
              {successMsg}
            </div>
          )}

          {/* Social Auth Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialClick('google')}
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card py-2.5 px-4 text-xs font-semibold hover:bg-muted transition shadow-sm disabled:opacity-50"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continuar con Google
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialClick('github')}
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card py-2.5 px-4 text-xs font-semibold hover:bg-muted transition shadow-sm disabled:opacity-50"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continuar con GitHub
            </button>
          </div>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              O con tu correo
            </span>
          </div>

          {/* Form */}
          {authTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Correo o usuario</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@forors.com"
                    required
                    className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('Función de recuperación simulada: Ingresa con tu correo.')}
                    className="text-[11px] font-medium text-fuchsia-500 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-9 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 py-3 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Iniciar Sesión <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Nombre completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sofia Ramírez"
                    required
                    className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Usuario (@handle)</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="sofiar"
                      className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Rol o Especialidad</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-2 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Correo electrónico *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sofia@filmmaker.com"
                    required
                    className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-9 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 py-3 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <UserPlus className="size-4" /> Crear Cuenta Gratis
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
