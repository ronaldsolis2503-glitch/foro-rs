'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Eye, EyeOff, Lock, Mail, Sparkles, User, UserPlus, X, Briefcase, AtSign, ArrowRight,
  Phone, MapPin, Camera, Globe, ChevronLeft, Check, Award, ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { loadGoogleScript } from '@/lib/google-auth'

const ROLES = [
  'Filmmaker / Creador',
  'Director de Fotografía',
  'Editor / Colorista',
  'Director / Guionista',
  'Productor / Producción',
  'Diseñador de Sonido / Audio',
  'Estudiante de Cine / Aficionado',
]

const EXPERIENCE_LEVELS = ['Principiante', 'Intermedio', 'Profesional', 'Máster']

const POPULAR_GEAR = [
  'Sony FX3', 'Sony A7S III', 'BMD Pocket 6K', 'RED Komodo', 'Canon C70',
  'DaVinci Resolve', 'Premiere Pro', 'Final Cut Pro', 'Sigma Art 24-70', 'Aputure Light'
]

export function AuthModal() {
  const {
    isAuthModalOpen, closeAuthModal, authTab, openAuthModal,
    login, register, loginWithGoogleCredential, loginWithGoogleOAuth,
    googleClientId, setGoogleClientId
  } = useAuth()

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Real Google Auth state
  const googleBtnContainerRef = useRef<HTMLDivElement>(null)
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false)
  const [showClientIdInput, setShowClientIdInput] = useState(false)
  const [tempClientId, setTempClientId] = useState('')

  // Registration Multi-step state
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [experienceLevel, setExperienceLevel] = useState('Intermedio')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [selectedGear, setSelectedGear] = useState<string[]>(['Sony FX3', 'DaVinci Resolve'])
  const [customGearInput, setCustomGearInput] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Load Google Script
  useEffect(() => {
    if (!isAuthModalOpen) return
    loadGoogleScript().then((success) => {
      setGoogleScriptLoaded(success)
    })
  }, [isAuthModalOpen])

  // Initialize Real Google Button
  useEffect(() => {
    if (isAuthModalOpen && googleScriptLoaded && window.google?.accounts?.id) {
      const activeClientId = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

      if (activeClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: (response: any) => {
              if (response?.credential) {
                loginWithGoogleCredential(response.credential)
              }
            },
          })

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = ''
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              locale: 'es',
            })
          }
        } catch (err) {
          console.error('Error initializing Google GIS:', err)
        }
      }
    }
  }, [isAuthModalOpen, googleScriptLoaded, googleClientId])

  if (!isAuthModalOpen) return null

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

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

  const handleGoogleClick = async () => {
    setErrorMsg('')
    setLoading(true)

    const res = await loginWithGoogleOAuth()
    setLoading(false)

    if (!res.success) {
      if (res.error === 'NO_CLIENT_ID') {
        setShowClientIdInput(true)
      } else {
        setErrorMsg(res.error || 'Error al conectar con Google.')
      }
    }
  }

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault()
    if (tempClientId.trim()) {
      setGoogleClientId(tempClientId.trim())
      setShowClientIdInput(false)
      setErrorMsg('Client ID guardado. Haz clic en "Continuar con Google" para conectar con Google.')
    }
  }

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa Nombre, Correo y Contraseña.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setStep(2)
  }

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(3)
  }

  const handleRegisterFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const cleanHandle = handle.trim() ? (handle.startsWith('@') ? handle : `@${handle}`) : `@${name.toLowerCase().replace(/\s+/g, '')}`

    const res = await register({
      name,
      email,
      password,
      handle: cleanHandle,
      phone,
      role,
      experienceLevel,
      location,
      bio,
      gear: selectedGear,
      portfolioUrl,
    })
    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Error al registrar tu cuenta.')
    }
  }

  const toggleGear = (item: string) => {
    if (selectedGear.includes(item)) {
      setSelectedGear(selectedGear.filter(g => g !== item))
    } else {
      setSelectedGear([...selectedGear, item])
    }
  }

  const addCustomGear = () => {
    if (customGearInput.trim() && !selectedGear.includes(customGearInput.trim())) {
      setSelectedGear([...selectedGear, customGearInput.trim()])
      setCustomGearInput('')
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border/80 shadow-2xl shadow-fuchsia-500/10 z-10">
        {/* Header Decorator */}
        <div className="relative bg-gradient-to-r from-fuchsia-600 via-rose-600 to-orange-500 p-5 text-white">
          <button
            onClick={closeAuthModal}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/20 text-white hover:bg-black/40 transition"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight">
                foro<span className="text-orange-200">RS</span>
              </span>
              <p className="text-xs text-white/80 font-medium">Plataforma y Red de Filmmakers</p>
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
            Crear Cuenta Real
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {/* Error message */}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Config Google Client ID Input if requested */}
          {showClientIdInput && (
            <form onSubmit={handleSaveClientId} className="mb-5 rounded-2xl bg-muted/40 p-4 border border-border text-left">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="size-4 text-fuchsia-500" />
                <h4 className="text-xs font-bold">Conexión con Google OAuth Real</h4>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Ingresa tu <strong>Google Client ID</strong> de Google Cloud Console para abrir la ventana oficial de inicio de sesión de Google (<code>accounts.google.com</code>):
              </p>
              <input
                type="text"
                value={tempClientId}
                onChange={(e) => setTempClientId(e.target.value)}
                placeholder="Ej. 123456789-abc.apps.googleusercontent.com"
                className="w-full rounded-xl bg-background p-2.5 text-xs outline-none ring-1 ring-border mb-2 font-mono"
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowClientIdInput(false)}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  Omitir por ahora
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-600 transition"
                >
                  Guardar y Conectar con Google
                </button>
              </div>
            </form>
          )}

          {authTab === 'login' ? (
            <div>
              {/* Single Social Auth Button: REAL Google GIS Button / Trigger */}
              <div className="flex flex-col items-center gap-2.5">
                {googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <div ref={googleBtnContainerRef} className="min-h-[44px] flex justify-center w-full" />
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleClick}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 px-4 text-xs font-semibold hover:bg-muted transition shadow-sm disabled:opacity-50 hover:border-fuchsia-500/50"
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
                    Continuar con Google Real
                  </button>
                )}
              </div>

              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  O con tu correo
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Correo electrónico o usuario</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Contraseña</label>
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

                <div className="mt-2 rounded-xl bg-muted/40 p-3 border border-border/60 text-[11px] text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">💡 Cuentas de prueba pre-registradas:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('maria@forors.com')
                        setPassword('123456')
                      }}
                      className="rounded-lg bg-card px-2 py-1 font-medium border border-border hover:bg-muted"
                    >
                      Autocompletar @mariar (123456)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('carlos@forors.com')
                        setPassword('123456')
                      }}
                      className="rounded-lg bg-card px-2 py-1 font-medium border border-border hover:bg-muted"
                    >
                      Autocompletar @carlosm (123456)
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {/* Step Progress Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                  <span>Paso {step} de 3</span>
                  <span>
                    {step === 1 ? '1. Datos de Cuenta' : step === 2 ? '2. Perfil Profesional' : '3. Ubicación y Bio'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-fuchsia-500' : 'bg-muted'}`} />
                  <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-fuchsia-500' : 'bg-muted'}`} />
                  <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-fuchsia-500' : 'bg-muted'}`} />
                </div>
              </div>

              {/* Step 1: Account Credentials */}
              {step === 1 && (
                <form onSubmit={handleStep1Next} className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">Nombre completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Sofía Ramírez"
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
                      <label className="mb-1 block text-xs font-semibold text-foreground">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+34 600 000 000"
                          className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                        />
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
                        placeholder="sofia@filmmaking.com"
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
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 py-3 text-xs font-semibold text-white shadow-lg transition hover:opacity-95"
                  >
                    Siguiente: Perfil Profesional <ArrowRight className="size-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Professional Details & Gear */}
              {step === 2 && (
                <form onSubmit={handleStep2Next} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground">Rol o Especialidad *</label>
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

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground">Nivel de Experiencia</label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-2 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                        >
                          {EXPERIENCE_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">Portafolio / Vimeo / Instagram</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://vimeo.com/tucanal"
                        className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Equipos y Software que utilizas
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {POPULAR_GEAR.map((item) => {
                        const active = selectedGear.includes(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleGear(item)}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                              active
                                ? 'bg-fuchsia-500 text-white shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {active && <Check className="size-3" />}
                            {item}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customGearInput}
                        onChange={(e) => setCustomGearInput(e.target.value)}
                        placeholder="Agregar otro equipo (ej. RED V-Raptor)"
                        className="flex-1 rounded-xl bg-muted/50 py-2 pl-3 pr-3 text-xs outline-none ring-1 ring-border"
                      />
                      <button
                        type="button"
                        onClick={addCustomGear}
                        className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold hover:bg-muted/80"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 px-4 text-xs font-semibold hover:bg-muted"
                    >
                      <ChevronLeft className="size-4" /> Atrás
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 py-3 text-xs font-semibold text-white shadow-lg transition hover:opacity-95"
                    >
                      Siguiente: Ubicación y Bio <ArrowRight className="size-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Location & Bio */}
              {step === 3 && (
                <form onSubmit={handleRegisterFinalSubmit} className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">Ciudad / País</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ej. Madrid, España o Ciudad de México"
                        className="w-full rounded-xl bg-muted/50 py-2.5 pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">Biografía o Presentación</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntale a la comunidad sobre tu experiencia audiovisual, proyectos actuales o lo que te apasiona..."
                      rows={3}
                      className="w-full resize-none rounded-xl bg-muted/50 p-3 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-fuchsia-500"
                    />
                  </div>

                  <div className="rounded-xl bg-muted/30 p-3 border border-border text-[11px] text-muted-foreground leading-relaxed">
                    Al crear tu cuenta en <strong>Foro RS</strong>, aceptas formar parte de la comunidad de filmmakers y compartir experiencias respetando las pautas de colaboración.
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 px-4 text-xs font-semibold hover:bg-muted"
                    >
                      <ChevronLeft className="size-4" /> Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 py-3 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <UserPlus className="size-4" /> Finalizar Registro Real
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
