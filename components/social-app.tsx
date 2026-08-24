'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Bell, Bookmark, BriefcaseBusiness, Check, ChevronRight, Compass, Download, FileText,
  Heart, Home, Image as ImageIcon, MessageCircle, MoreHorizontal, Palette, Play, Plus,
  Search, Send, Settings, Sparkles, Star, UserPlus, Users, Video, Wrench, X, Zap, LogIn, Trash2,
  Maximize2, Link as LinkIcon, Globe, RefreshCw, CornerDownRight, Reply, ShieldCheck, MessageSquare, Flame, Volume2, Crown, User, ExternalLink, MapPin, Camera, Briefcase
} from 'lucide-react'
import { AuthProvider, useAuth, UserProfile, getUserAvatarUrl } from '@/lib/auth-context'

function Avatar({
  initials,
  tone,
  user,
  avatarUrl,
  small = false
}: {
  initials?: string
  tone?: string
  user?: Partial<UserProfile>
  avatarUrl?: string
  small?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const computedUrl = avatarUrl || getUserAvatarUrl(user || { initials, avatarTone: tone })

  if (computedUrl && !imgError) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full ring-2 ring-amber-500/40 shadow-md ${small ? 'size-9' : 'size-11'}`}>
        <img
          src={computedUrl}
          alt={user?.name || initials || 'Avatar'}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${tone || 'from-amber-400 to-yellow-600'} font-semibold text-black ring-2 ring-amber-500/30 ${small ? 'size-9 text-[11px]' : 'size-11 text-sm'}`}>
      {initials}
    </div>
  )
}
import { AuthModal } from '@/components/auth-modal'
import { ProfileModal } from '@/components/profile-modal'
import { PrivateChatModal } from '@/components/private-chat-modal'
import { NotificationsDropdown, NotificationRecord } from '@/components/notifications-dropdown'
import { FriendRequestsDropdown } from '@/components/friend-requests-dropdown'
import { StoriesBar } from '@/components/stories-bar'
import { UserMenu } from '@/components/user-menu'

type Section = 'Inicio' | 'Explorar' | 'Preguntas' | 'Showcase' | 'Recursos' | 'Colaboraciones' | 'Tutoriales' | 'Mi red' | 'Amigos' | 'Perfil'
type Filter = 'Para ti' | 'Preguntas' | 'Proyectos' | 'Recursos' | 'Tutoriales'

// Web Audio API Synthesizer Chime for Notifications
function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime) // Tone E5
    gain1.gain.setValueAtTime(0.18, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.25)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // Tone A5
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.1)
    osc2.stop(ctx.currentTime + 0.4)
  } catch (err) {
    console.error('Audio playback error:', err)
  }
}

export type CommentItem = {
  id: string
  authorName: string
  authorHandle: string
  authorInitials: string
  authorTone: string
  text: string
  time: string
  replyToId?: string
  replyToHandle?: string
  replyToName?: string
}

export type Post = {
  id: number
  type: Filter
  name: string
  handle: string
  initials: string
  tone: string
  time: string
  title: string
  text: string
  imageUrl?: string
  tags: string
  likes: number
  likedBy?: string[]
  commentsList: CommentItem[]
  gradient: string
  solved?: boolean
  authorProfile?: Partial<UserProfile>
}

const navItems: [typeof Home, Section][] = [
  [Home, 'Inicio'], [Compass, 'Explorar'], [MessageCircle, 'Preguntas'], [Video, 'Showcase'],
  [Palette, 'Recursos'], [BriefcaseBusiness, 'Colaboraciones'], [FileText, 'Tutoriales'], [Users, 'Amigos'], [User, 'Perfil']
]

const resources = [
  ['Cinematic Gold & Teal LUT', 'DaVinci Resolve · Color', '1.245', '4.9'],
  ['35mm Film Grain Essentials', 'Premiere Pro · Overlay', '894', '4.8'],
  ['Call Sheet Pro Executive', 'Producción · Template', '632', '4.7'],
  ['Hollywood Master SFX Pack', 'Audio · 120 archivos', '2.1k', '4.9']
]

const questions = [
  '¿Por qué mi S-Log3 tiene tanto ruido en sombras?',
  '¿Qué lentes recomiendan para interiores pequeños?',
  '¿Cómo igualo dos cámaras Sony diferentes?',
  '¿Cómo exportar 4K para Instagram sin compresión excesiva?'
]

function Sidebar({
  active,
  onSelect,
  onOpenChat
}: {
  active: Section
  onSelect: (section: Section) => void
  onOpenChat: () => void
}) {
  const { user, isAuthenticated, openAuthModal } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-4">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-black shadow-lg shadow-amber-500/20">
            <Crown className="size-5" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-white">
            foro<span className="text-amber-400">RS</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(([Icon, label]) => (
            <button
              key={label}
              onClick={() => {
                onSelect(label)
              }}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active === label
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon className="size-[19px]" />
              {label}
              {label === 'Amigos' && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-black shadow-sm">
                  Red
                </span>
              )}
            </button>
          ))}
        </nav>

        {isAuthenticated && user ? (
          <UserMenu />
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900/80 p-4 shadow-xl border border-amber-500/30 text-center">
            <Sparkles className="mx-auto size-6 text-amber-400" />
            <h3 className="text-xs font-bold text-white">Únete a Foro RS</h3>
            <p className="text-[11px] text-zinc-400">Comunidad profesional exclusiva de filmmakers.</p>
            <div className="flex flex-col gap-2 mt-1">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full rounded-xl bg-zinc-800 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition border border-zinc-700"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 py-2 text-xs font-bold text-black shadow-md transition hover:opacity-90"
              >
                Crear Cuenta Real
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function UniversalSearchDropdown({
  query,
  posts,
  onClose,
  onSelectUser,
  onSelectPost
}: {
  query: string
  posts: Post[]
  onClose: () => void
  onSelectUser: (user: Partial<UserProfile>) => void
  onSelectPost: (post: Post) => void
}) {
  const dynamicUsersMap = new Map<string, Partial<UserProfile>>()
  posts.forEach(p => {
    const uid = p.authorProfile?.id || p.handle
    if (uid && !dynamicUsersMap.has(uid)) {
      dynamicUsersMap.set(uid, p.authorProfile || {
        id: uid,
        name: p.name,
        handle: p.handle,
        initials: p.initials,
        avatarTone: p.tone,
        role: 'Filmmaker'
      })
    }
  })
  const allUsers = Array.from(dynamicUsersMap.values())

  const cleanQuery = query.toLowerCase().trim()

  const matchedUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(cleanQuery) ||
    u.handle?.toLowerCase().includes(cleanQuery) ||
    u.role?.toLowerCase().includes(cleanQuery) ||
    u.location?.toLowerCase().includes(cleanQuery)
  )

  const matchedPosts = posts.filter(p =>
    p.title?.toLowerCase().includes(cleanQuery) ||
    p.text?.toLowerCase().includes(cleanQuery) ||
    p.tags?.toLowerCase().includes(cleanQuery) ||
    p.name?.toLowerCase().includes(cleanQuery) ||
    p.type?.toLowerCase().includes(cleanQuery)
  )

  if (!cleanQuery) return null

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[75vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-amber-500/30 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 flex flex-col gap-4">
      {/* Users Results */}
      <div>
        <div className="flex items-center gap-1.5 px-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Users className="size-3.5" /> Creadores y Usuarios ({matchedUsers.length})
        </div>
        {matchedUsers.length > 0 ? (
          <div className="flex flex-col gap-1">
            {matchedUsers.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u)
                  onClose()
                }}
                className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-zinc-800 transition"
              >
                <img
                  src={getUserAvatarUrl(u)}
                  alt={u.name}
                  className="size-9 rounded-full object-cover ring-1 ring-amber-400 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-amber-400 font-medium truncate">{u.handle} · {u.role}</p>
                </div>
                <ChevronRight className="size-4 text-zinc-500" />
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs text-zinc-500 italic">Sin usuarios coincidentes</p>
        )}
      </div>

      <div className="border-t border-zinc-800" />

      {/* Posts Results */}
      <div>
        <div className="flex items-center gap-1.5 px-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <FileText className="size-3.5" /> Publicaciones y Proyectos ({matchedPosts.length})
        </div>
        {matchedPosts.length > 0 ? (
          <div className="flex flex-col gap-1">
            {matchedPosts.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPost(p)
                  onClose()
                }}
                className="flex items-start gap-3 rounded-xl p-2 text-left hover:bg-zinc-800 transition"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-400/10 text-amber-400 mt-0.5">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-white truncate">{p.title}</p>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">{p.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                      {p.type}
                    </span>
                    <span className="text-[9px] text-zinc-500">Por {p.name}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-zinc-500 self-center" />
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs text-zinc-500 italic">Sin publicaciones coincidentes</p>
        )}
      </div>
    </div>
  )
}

function Header({
  onSelect,
  onOpenChat,
  onToggleNotifications,
  isNotifOpen,
  onCloseNotifications,
  unreadNotifCount = 0,
  onUnreadCountChange,
  onNavigateToEntity,
  posts,
  onSelectUser,
  onSelectPost
}: {
  onSelect: (section: Section) => void
  onOpenChat: () => void
  onToggleNotifications: () => void
  isNotifOpen: boolean
  onCloseNotifications: () => void
  unreadNotifCount?: number
  onUnreadCountChange?: (count: number) => void
  onNavigateToEntity?: (entityType: string, entityId: string | number, actorId?: string, actorHandle?: string, notif?: NotificationRecord) => void
  posts: Post[]
  onSelectUser: (user: Partial<UserProfile>) => void
  onSelectPost: (post: Post) => void
}) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFriendReqOpen, setIsFriendReqOpen] = useState(false)
  const [pendingReqCount, setPendingReqCount] = useState(0)

  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    if (user) {
      const fetchCounters = async () => {
        try {
          const res = await fetch(`/api/friends?userId=${user.id}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              const pending = data.filter((r: any) => r.recipientId === user.id && r.status === 'pending')
              setPendingReqCount(pending.length)
            }
          }
          const msgRes = await fetch(`/api/messages?userId=${user.id}`, { cache: 'no-store' })
          if (msgRes.ok) {
            const msgData = await msgRes.json()
            setUnreadMessageCount(msgData.unreadCount || 0)
          }
        } catch {}
      }
      fetchCounters()
      const interval = setInterval(fetchCounters, 3500)
      return () => clearInterval(interval)
    }
  }, [user])

  return (
    <header className="sticky top-0 z-20 border-b border-amber-500/20 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-black">
            <Crown className="size-4" />
          </div>
          <span className="font-serif text-xl font-bold text-white">
            foro<span className="text-amber-400">RS</span>
          </span>
        </div>

        <div className="hidden items-center gap-2 text-sm font-medium text-zinc-300 md:flex">
          <Crown className="size-4 text-amber-400" /> Comunidad profesional de filmmakers y creadores
        </div>

        {/* Universal Search Bar */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <input
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(Boolean(e.target.value.trim()))
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true)
            }}
            placeholder="Buscar por usuario (@handle) o publicación..."
            className="w-full rounded-2xl bg-zinc-900/90 py-2 pl-10 pr-8 text-xs text-white outline-none ring-1 ring-amber-500/30 focus:ring-2 focus:ring-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setIsSearchOpen(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          )}

          {isSearchOpen && (
            <UniversalSearchDropdown
              query={searchQuery}
              posts={posts}
              onClose={() => setIsSearchOpen(false)}
              onSelectUser={onSelectUser}
              onSelectPost={onSelectPost}
            />
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Private Chat Direct Launcher Button */}
          <div className="relative">
            <button
              aria-label="Abrir Mensajes Privados"
              title="Mensajes Privados"
              onClick={onOpenChat}
              className="relative rounded-xl bg-amber-400/10 border border-amber-500/30 p-2.5 text-amber-400 hover:bg-amber-400/20 transition"
            >
              <Send className="size-4" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-extrabold text-black shadow-sm ring-2 ring-black">
                  {unreadMessageCount}
                </span>
              )}
            </button>
          </div>

          {/* Friend Requests Dropdown Launcher */}
          <div className="relative">
            <button
              aria-label="Solicitudes de Amistad"
              title="Solicitudes de Amistad"
              onClick={() => {
                onCloseNotifications()
                setIsFriendReqOpen(!isFriendReqOpen)
              }}
              className="relative rounded-xl p-2.5 text-zinc-300 hover:bg-zinc-900 transition"
            >
              <UserPlus className="size-5 text-amber-400" />
              {pendingReqCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-extrabold text-black shadow-sm ring-2 ring-black">
                  {pendingReqCount}
                </span>
              )}
            </button>

            <FriendRequestsDropdown
              isOpen={isFriendReqOpen}
              onClose={() => setIsFriendReqOpen(false)}
              onOpenProfile={onSelectUser}
            />
          </div>

          {/* Facebook-Style Floating Notifications Dropdown Launcher */}
          <div className="relative">
            <button
              aria-label="Notificaciones"
              onClick={() => {
                setIsFriendReqOpen(false)
                onToggleNotifications()
              }}
              className="relative rounded-xl p-2.5 text-zinc-300 hover:bg-zinc-900 transition"
            >
              <Bell className="size-5" />
              {unreadNotifCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-extrabold text-black shadow-sm ring-2 ring-black">
                  {unreadNotifCount}
                </span>
              ) : (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-400/40 ring-2 ring-black" />
              )}
            </button>

            <NotificationsDropdown
              isOpen={isNotifOpen}
              onClose={onCloseNotifications}
              onUnreadCountChange={onUnreadCountChange}
              onNavigateToEntity={onNavigateToEntity}
            />
          </div>

          <UserMenu compact />
        </div>
      </div>
    </header>
  )
}

function Composer({
  onPost,
  onOpenProfile
}: {
  onPost: (title: string, text: string, type: Filter, imageUrl?: string) => void
  onOpenProfile: (profile: Partial<UserProfile>) => void
}) {
  const { user, isAuthenticated, openAuthModal } = useAuth()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [type, setType] = useState<Filter>('Preguntas')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida (JPG, PNG, WEBP).')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    if (!text.trim() && !imageUrl) return
    onPost(title.trim() || text.slice(0, 45) + '...', text, type, imageUrl || undefined)
    setTitle('')
    setText('')
    setImageUrl('')
    setShowUrlInput(false)
  }

  return (
    <section className="rounded-2xl bg-zinc-900/90 p-5 shadow-xl border border-amber-500/30 border-l-4 border-l-amber-400">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['Preguntas', 'Proyectos', 'Recursos', 'Tutoriales'] as Filter[]).map(item => (
            <button
              key={item}
              onClick={() => setType(item)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                type === item
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-bold shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (user) onOpenProfile(user)
          }}
          className="hover:opacity-80 transition"
        >
          <Avatar
            initials={user?.initials || 'RS'}
            tone={user?.avatarTone || 'from-amber-400 to-yellow-600'}
          />
        </button>

        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isAuthenticated ? "Título de tu publicación (sólo tú podrás eliminarla)..." : "Inicia sesión para redactar..."}
            className="w-full bg-transparent text-sm font-semibold outline-none text-white placeholder:text-zinc-500 border-b border-zinc-800 pb-1.5 focus:border-amber-400/60"
          />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={isAuthenticated ? "Escribe tu publicación pública..." : "Inicia sesión para publicar..."}
            rows={3}
            className="min-h-20 w-full resize-none bg-transparent pt-1 text-xs text-zinc-200 outline-none placeholder:text-zinc-500"
          />

          {imageUrl && (
            <div className="relative mt-2 overflow-hidden rounded-2xl border border-zinc-700 group max-h-72">
              <img src={imageUrl} alt="Imagen adjunta" className="w-full h-full object-cover rounded-2xl max-h-72" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/80 text-white hover:bg-black transition"
                title="Quitar imagen"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {showUrlInput && !imageUrl && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="url"
                placeholder="Pega la URL de una imagen (https://...)"
                className="flex-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs text-white outline-none ring-1 ring-amber-500/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement
                    if (target.value.trim()) setImageUrl(target.value.trim())
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-xs text-zinc-400 hover:underline"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition border border-zinc-700"
          >
            <ImageIcon className="size-4 text-emerald-400" /> Adjuntar Imagen
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition"
          >
            <LinkIcon className="size-3.5 text-amber-400" /> Link de Imagen
          </button>
        </div>

        {isAuthenticated ? (
          <button
            disabled={!text.trim() && !imageUrl}
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-black shadow-md shadow-amber-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publicar al Feed
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-2 text-xs font-bold text-black shadow-md transition hover:opacity-90"
          >
            <LogIn className="size-3.5" /> Iniciar sesión para publicar
          </button>
        )}
      </div>
    </section>
  )
}

function PostCard({
  post,
  onLikeToggle,
  onAddComment,
  onDeletePost,
  onOpenChatWith,
  onOpenProfile
}: {
  post: Post
  onLikeToggle: (postId: number) => void
  onAddComment: (postId: number, commentText: string, replyTo?: { id: string; handle: string; name: string }) => void
  onDeletePost: (postId: number) => void
  onOpenChatWith: (target: Partial<UserProfile>) => void
  onOpenProfile?: (profile: Partial<UserProfile>) => void
}) {
  const { user, isAuthenticated, openAuthModal } = useAuth()
  const [saved, setSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)

  const [replyTarget, setReplyTarget] = useState<{ id: string; handle: string; name: string } | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const isOwner = Boolean(
    user &&
    (post.authorProfile?.id === user.id ||
     post.handle === user.handle ||
     post.authorProfile?.handle === user.handle)
  )
  const hasUserLiked = Boolean(user && post.likedBy && post.likedBy.includes(user.id))

  const targetAuthorId = post.authorProfile?.id || post.handle
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)

  useEffect(() => {
    if (user && targetAuthorId && !isOwner) {
      fetch(`/api/followers?followerId=${user.id}&targetUserId=${targetAuthorId}`)
        .then(res => res.json())
        .then(data => setIsFollowingAuthor(Boolean(data.isFollowing)))
        .catch(() => {})
    }
  }, [user, targetAuthorId, isOwner])

  const handleFollowAuthorToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    if (!user || !targetAuthorId) return
    setLoadingFollow(true)
    try {
      const res = await fetch('/api/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: user.id,
          followerName: user.name,
          followerHandle: user.handle,
          followerInitials: user.initials,
          followerTone: user.avatarTone,
          targetUserId: targetAuthorId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowingAuthor(data.isFollowing)
      }
    } catch (err) {
      console.error('Error toggling follow from PostCard:', err)
    } finally {
      setLoadingFollow(false)
    }
  }

  const handleAction = (action: () => void) => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    action()
  }

  const handleAuthorClick = () => {
    const profileToOpen = post.authorProfile || {
      id: post.handle,
      name: post.name,
      handle: post.handle,
      initials: post.initials,
      avatarTone: post.tone,
      role: 'Filmmaker',
    }
    if (onOpenProfile) onOpenProfile(profileToOpen)
  }

  const handleSendComment = () => {
    if (!commentInput.trim()) return
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    onAddComment(post.id, commentInput.trim(), replyTarget || undefined)
    setCommentInput('')
    setReplyTarget(null)
  }

  const startReplyToSpecific = (comment: CommentItem) => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    setShowComments(true)
    setReplyTarget({
      id: comment.id,
      handle: comment.authorHandle,
      name: comment.authorName,
    })
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 100)
  }

  return (
    <article
      id={`post-${post.id}`}
      className="overflow-hidden rounded-2xl bg-zinc-900/90 shadow-xl border border-amber-500/20 transition hover:border-amber-500/40 scroll-mt-20"
    >
      <div className="flex items-center gap-3 p-4">
        <button onClick={handleAuthorClick} className="hover:opacity-80 transition text-left">
          <Avatar initials={post.initials} tone={post.tone} />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={handleAuthorClick} className="text-left font-semibold text-sm text-white hover:underline block truncate">
            {post.name}
          </button>
          <p className="text-xs text-zinc-400">{post.handle} · {post.time}</p>
        </div>

        {/* Direct Actions with Author (Seguir/Siguiendo & Chat Privado) */}
        {!isOwner && (
          <div className="flex items-center gap-2">
            <button
              disabled={loadingFollow}
              onClick={handleFollowAuthorToggle}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                isFollowingAuthor
                  ? 'bg-zinc-800 text-amber-400 border border-amber-500/40 hover:bg-zinc-750'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black hover:opacity-90'
              }`}
            >
              {isFollowingAuthor ? <Check className="size-3.5" /> : <UserPlus className="size-3.5" />}
              <span>{isFollowingAuthor ? 'Siguiendo' : 'Seguir'}</span>
            </button>

            <button
              onClick={() =>
                onOpenChatWith({
                  id: post.authorProfile?.id || post.handle,
                  name: post.name,
                  handle: post.handle,
                  initials: post.initials,
                  avatarTone: post.tone,
                })
              }
              className="rounded-xl bg-amber-400/10 border border-amber-500/30 p-2 text-amber-400 hover:bg-amber-400/20 transition"
              title={`Enviar mensaje privado a ${post.name}`}
            >
              <Send className="size-3.5" />
            </button>
          </div>
        )}

        {isOwner && (
          <button
            onClick={() => onDeletePost(post.id)}
            title="Eliminar mi publicación"
            className="flex items-center gap-1 rounded-xl bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        )}
      </div>

      <div className={`relative flex min-h-36 items-end bg-gradient-to-br ${post.gradient || 'from-zinc-950 via-zinc-900 to-black'} p-6 sm:min-h-44 border-y border-amber-500/10`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative">
          <span className="mb-2 inline-flex rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            {post.type}
          </span>
          <p className="max-w-lg font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
            {post.title}
          </p>
        </div>
      </div>

      {post.imageUrl && (
        <div className="relative overflow-hidden bg-black group cursor-pointer" onClick={() => setShowLightbox(true)}>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-auto max-h-[480px] object-cover transition group-hover:opacity-90"
          />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/80 border border-amber-500/30 p-2 text-amber-400 opacity-0 group-hover:opacity-100 transition">
            <Maximize2 className="size-4" />
          </div>
        </div>
      )}

      {showLightbox && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition border border-amber-500/30"
          >
            <X className="size-5" />
          </button>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-amber-500/20"
          />
        </div>
      )}

      <div className="p-4">
        {post.text && <p className="text-sm leading-6 text-zinc-200 whitespace-pre-line">{post.text}</p>}
        <p className="mt-2 text-sm font-medium text-amber-400">{post.tags}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-amber-400 flex items-center gap-1">
            <Heart className="size-3.5 fill-current" /> {post.likes || 0} me gusta
          </span>
          <span>{post.commentsList ? post.commentsList.length : 0} respuestas</span>
        </div>

        {/* Action Bar */}
        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2">
          <button
            onClick={() =>
              handleAction(() => {
                onLikeToggle(post.id)
              })
            }
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:bg-amber-400/10 ${
              hasUserLiked ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'
            }`}
          >
            <Heart className={`size-[18px] transition-transform active:scale-125 ${hasUserLiked ? 'fill-current text-amber-400' : ''}`} />
            {hasUserLiked ? 'Te gusta' : 'Me gusta'}
          </button>

          <button
            onClick={() =>
              handleAction(() => {
                setShowComments(!showComments)
                setReplyTarget(null)
              })
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <MessageCircle className="size-[18px]" /> Responder ({post.commentsList ? post.commentsList.length : 0})
          </button>

          <button
            onClick={() => handleAction(() => setSaved(!saved))}
            aria-label="Guardar publicación"
            className={`rounded-lg p-2 hover:bg-zinc-800 ${saved ? 'text-amber-400' : 'text-zinc-400'}`}
          >
            <Bookmark className={`size-[18px] ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800 pt-3">
            {post.commentsList && post.commentsList.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                {post.commentsList.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex gap-2.5 rounded-xl p-3 border text-xs transition ${
                      comment.replyToHandle
                        ? 'ml-5 bg-amber-400/5 border-amber-500/20'
                        : 'bg-zinc-850/60 border-zinc-800'
                    }`}
                  >
                    <button
                      onClick={() =>
                        onOpenProfile &&
                        onOpenProfile({
                          name: comment.authorName,
                          handle: comment.authorHandle,
                          initials: comment.authorInitials,
                          avatarTone: comment.authorTone,
                        })
                      }
                      className="hover:opacity-80 transition text-left"
                    >
                      <Avatar initials={comment.authorInitials} tone={comment.authorTone} small />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() =>
                              onOpenProfile &&
                              onOpenProfile({
                                name: comment.authorName,
                                handle: comment.authorHandle,
                                initials: comment.authorInitials,
                                avatarTone: comment.authorTone,
                              })
                            }
                            className="font-semibold text-white hover:underline text-left"
                          >
                            {comment.authorName}
                          </button>
                          <span className="text-[10px] text-zinc-400">{comment.authorHandle}</span>
                          {comment.replyToHandle && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                              <CornerDownRight className="size-3" /> respondiendo a {comment.replyToHandle}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">{comment.time}</span>
                      </div>

                      <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{comment.text}</p>

                      <div className="mt-2 flex items-center gap-3 border-t border-zinc-800 pt-1.5">
                        <button
                          onClick={() => startReplyToSpecific(comment)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:underline"
                        >
                          <Reply className="size-3" /> Responder a {comment.authorName.split(' ')[0]}
                        </button>

                        <button
                          onClick={() =>
                            onOpenChatWith({
                              name: comment.authorName,
                              handle: comment.authorHandle,
                              initials: comment.authorInitials,
                              avatarTone: comment.authorTone,
                            })
                          }
                          className="rounded-lg p-1 text-amber-400 hover:bg-amber-400/10 transition"
                          title={`Enviar mensaje privado a ${comment.authorName}`}
                        >
                          <Send className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-1">Aún no hay respuestas. Sé la primera persona en responder.</p>
            )}

            {/* Comment Form */}
            <div className="flex flex-col gap-1.5 pt-1">
              {replyTarget ? (
                <div className="flex items-center justify-between rounded-xl bg-amber-400/10 px-3 py-1.5 border border-amber-500/30 text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <CornerDownRight className="size-3.5" /> Respondiendo específicamente a {replyTarget.name} ({replyTarget.handle})
                  </span>
                  <button
                    onClick={() => setReplyTarget(null)}
                    className="rounded-full p-1 hover:bg-amber-400/20 text-amber-400 transition"
                    title="Cambiar a respuesta general"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium px-1">
                  <MessageCircle className="size-3 text-amber-400" /> Respuesta general a la publicación
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={commentInputRef}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendComment()
                  }}
                  placeholder={
                    isAuthenticated
                      ? replyTarget
                        ? `Escribe tu respuesta a ${replyTarget.name}...`
                        : "Escribe una respuesta técnica general..."
                      : "Inicia sesión para responder..."
                  }
                  className="min-w-0 flex-1 rounded-xl bg-zinc-850 px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-amber-400 border border-zinc-800"
                />
                <button
                  onClick={handleSendComment}
                  aria-label="Enviar respuesta"
                  className="grid size-8 place-items-center rounded-lg bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:opacity-90 transition shadow-sm font-bold"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

function UserProfileSection({
  profile,
  onOpenChatWith,
  posts,
  onLikeToggle,
  onAddComment,
  onDeletePost
}: {
  profile: Partial<UserProfile>
  onOpenChatWith: (target: Partial<UserProfile>) => void
  posts: Post[]
  onLikeToggle: (postId: number) => void
  onAddComment: (postId: number, text: string, replyTo?: any) => void
  onDeletePost: (postId: number) => void
}) {
  const { user: currentUser } = useAuth()
  const [friendState, setFriendState] = useState<'none' | 'pending' | 'friends'>('none')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const isSelf = currentUser?.id === profile.id

  useEffect(() => {
    if (profile.id) {
      // Fetch follow relationship
      const followerIdParam = currentUser ? currentUser.id : ''
      fetch(`/api/followers?followerId=${followerIdParam}&targetUserId=${profile.id}`)
        .then(res => res.json())
        .then(data => {
          setIsFollowing(Boolean(data.isFollowing))
          setFollowersCount(data.followersCount || 0)
        })
        .catch(() => {})

      // Fetch friend relationship
      if (currentUser && !isSelf) {
        fetch(`/api/friends?userId=${currentUser.id}&targetUserId=${profile.id}`)
          .then(res => res.json())
          .then(data => setFriendState(data.status || 'none'))
          .catch(() => {})
      }
    }
  }, [currentUser, profile.id, isSelf])

  const handleFollowToggle = async () => {
    if (!currentUser || !profile.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentUser.id,
          followerName: currentUser.name,
          followerHandle: currentUser.handle,
          followerInitials: currentUser.initials,
          followerTone: currentUser.avatarTone,
          targetUserId: profile.id,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
        setFollowersCount(data.followersCount)
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendAction = async (action: 'request' | 'accept') => {
    if (!currentUser || !profile.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: currentUser.id,
          requesterName: currentUser.name,
          requesterHandle: currentUser.handle,
          requesterInitials: currentUser.initials,
          requesterTone: currentUser.avatarTone,
          recipientId: profile.id,
          action,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setFriendState(data.status || 'pending')
      }
    } catch (err) {
      console.error('Error in friend action:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter posts created by this user
  const userPosts = posts.filter(
    p => p.authorProfile?.id === profile.id || p.handle === profile.handle
  )

  return (
    <section className="flex flex-col gap-6">
      {/* Profile Header Card */}
      <div className="overflow-hidden rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl">
        {/* Cover Banner */}
        <div className="h-44 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black relative border-b border-amber-500/20">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="rounded-full bg-amber-400/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
              {profile.role || 'Filmmaker Profesional'}
            </span>
          </div>
        </div>

        {/* Details & Actions */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-16 mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              <img
                src={getUserAvatarUrl(profile)}
                alt={profile.name || 'Perfil'}
                className="size-28 rounded-full object-cover ring-4 ring-zinc-900 shadow-2xl border-2 border-amber-400"
              />
              <div className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full bg-amber-400 text-black shadow-lg">
                <Crown className="size-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isSelf && (
                <>
                  {/* Follow / Following Button */}
                  <button
                    disabled={loading}
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                      isFollowing
                        ? 'bg-zinc-800 text-amber-400 border border-amber-500/40 hover:bg-zinc-700'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black hover:opacity-90'
                    }`}
                  >
                    {isFollowing ? <Check className="size-4" /> : <UserPlus className="size-4" />}
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>

                  {/* Friend / Connection Request Button */}
                  {friendState === 'friends' ? (
                    <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-400">
                      <Check className="size-4" /> Amigos
                    </span>
                  ) : friendState === 'pending' ? (
                    <span className="flex items-center gap-1 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-300">
                      Solicitud Enviada
                    </span>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={() => handleFriendAction('request')}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400/10 border border-amber-500/30 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-400/20 transition"
                    >
                      <UserPlus className="size-4" /> Solicitar Amistad
                    </button>
                  )}

                  {/* Private Chat Button */}
                  <button
                    onClick={() => onOpenChatWith(profile)}
                    className="rounded-xl bg-zinc-800 border border-zinc-700 p-2.5 text-amber-400 hover:bg-zinc-700 transition"
                    title={`Enviar mensaje privado a ${profile.name}`}
                  >
                    <Send className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <ShieldCheck className="size-6 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-amber-400">{profile.handle} · {profile.role}</p>

            <div className="mt-3 flex items-center gap-5 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-zinc-500" /> {profile.location || 'Madrid, España'}
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="size-4 fill-current" /> {profile.reputation || 120} puntos de reputación
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300 max-w-2xl">
              {profile.bio || 'Filmmaker y creador audiovisual. Especialista en cinematografía digital, dirección de fotografía, iluminación y corrección de color profesional.'}
            </p>
          </div>

          {/* Gear Grid */}
          <div className="mt-5 border-t border-zinc-800 pt-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Camera className="size-4 text-amber-400" /> Equipamiento Técnico
            </p>
            <div className="flex flex-wrap gap-2">
              {(profile.gear || ['Sony FX3', 'Sigma Cine 35mm T1.5', 'DaVinci Resolve Studio']).map(item => (
                <span key={item} className="rounded-full bg-zinc-850 border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-zinc-950 p-4 border border-amber-500/20 text-center">
            <div>
              <p className="text-xl font-bold text-amber-400">{userPosts.length}</p>
              <p className="text-xs text-zinc-500 font-semibold">Publicaciones</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-400">{profile.stats?.likes || 189}</p>
              <p className="text-xs text-zinc-500 font-semibold">Me Gusta Recibidos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-400">{profile.stats?.comments || 42}</p>
              <p className="text-xs text-zinc-500 font-semibold">Respuestas Dadas</p>
            </div>
          </div>

          {/* External Portfolio */}
          {profile.portfolioUrl && (
            <a
              href={profile.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-between rounded-xl bg-zinc-800/80 px-4 py-3 text-xs font-semibold text-white hover:bg-zinc-800 transition border border-zinc-700"
            >
              <span className="flex items-center gap-2">
                <Briefcase className="size-4 text-amber-400" /> Portafolio Profesional Online
              </span>
              <ExternalLink className="size-4 text-zinc-400" />
            </a>
          )}
        </div>
      </div>

      {/* User's Publications Section */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="size-5 text-amber-400" /> Publicaciones de {profile.name} ({userPosts.length})
          </h3>
        </div>

        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={onLikeToggle}
              onAddComment={onAddComment}
              onDeletePost={onDeletePost}
              onOpenChatWith={onOpenChatWith}
            />
          ))
        ) : (
          <div className="rounded-2xl bg-zinc-900/60 p-8 text-center border border-zinc-800 text-zinc-400 text-xs italic">
            Este usuario aún no ha realizado publicaciones en el feed público.
          </div>
        )}
      </div>
    </section>
  )
}

function SuggestedFriendsWidget({
  posts = [],
  onOpenProfile
}: {
  posts?: Post[]
  onOpenProfile: (p: Partial<UserProfile>) => void
}) {
  const { user } = useAuth()
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const [followedIds, setFollowedIds] = useState<string[]>([])
  const [friendsList, setFriendsList] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetch(`/api/friends?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFriendsList(data)
        })
        .catch(() => {})
    }
  }, [user])

  // Extract unique authors from real posts excluding current user & existing friends
  const candidateMap = new Map<string, Partial<UserProfile>>()
  posts.forEach(p => {
    const authorId = p.authorProfile?.id || p.handle
    const authorHandle = p.handle
    if (
      user &&
      authorId !== user.id &&
      authorHandle !== user.handle &&
      !candidateMap.has(authorId)
    ) {
      const isAlreadyFriend = friendsList.some(
        f => (f.requesterId === authorId || f.recipientId === authorId) && f.status === 'accepted'
      )
      if (!isAlreadyFriend) {
        candidateMap.set(authorId, p.authorProfile || {
          id: authorId,
          name: p.name,
          handle: p.handle,
          initials: p.initials,
          avatarTone: p.tone,
          role: 'Filmmaker'
        })
      }
    }
  })

  const suggestions = Array.from(candidateMap.values())

  const handleConnect = async (targetId: string, name: string) => {
    if (!user) return
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          requesterName: user.name,
          requesterHandle: user.handle,
          requesterInitials: user.initials,
          requesterTone: user.avatarTone,
          recipientId: targetId,
          action: 'request',
        }),
      })
      setRequestedIds(prev => [...prev, targetId])
    } catch (err) {
      console.error('Error connecting:', err)
    }
  }

  const handleFollow = async (targetId: string) => {
    if (!user) return
    try {
      await fetch('/api/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: user.id,
          followerName: user.name,
          followerHandle: user.handle,
          followerInitials: user.initials,
          followerTone: user.avatarTone,
          targetUserId: targetId,
        }),
      })
      setFollowedIds(prev => [...prev, targetId])
    } catch (err) {
      console.error('Error following:', err)
    }
  }

  return (
    <section className="rounded-3xl bg-zinc-900/90 border border-amber-500/20 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-amber-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">Sugerencias de Amistad</h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-semibold">Reales</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {suggestions.length > 0 ? (
          suggestions.map((s) => {
            const isRequested = Boolean(s.id && requestedIds.includes(s.id))
            const isFollowed = Boolean(s.id && followedIds.includes(s.id))

            return (
              <div key={s.id} className="flex items-center justify-between gap-3 border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                <button onClick={() => onOpenProfile(s)} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition text-left">
                  <Avatar initials={s.initials || 'RS'} tone={s.avatarTone || 'from-amber-400 to-yellow-600'} user={s} small />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate">{s.name}</p>
                    <p className="text-[10px] text-amber-400 truncate">{s.handle} · {s.role || 'Filmmaker'}</p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={isRequested}
                    onClick={() => s.id && s.name && handleConnect(s.id, s.name)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                      isRequested
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:opacity-90'
                    }`}
                  >
                    {isRequested ? 'Solicitado' : 'Conectar'}
                  </button>

                  <button
                    disabled={isFollowed}
                    onClick={() => s.id && handleFollow(s.id)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition border ${
                      isFollowed
                        ? 'bg-zinc-850 text-amber-400 border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                    }`}
                  >
                    {isFollowed ? 'Siguiendo' : 'Seguir'}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-4 text-center text-zinc-500 text-xs italic">
            No hay más sugerencias de nuevos creadores por el momento. ¡Crea publicaciones o invita a tus colegas a unirse a Foro RS!
          </div>
        )}
      </div>
    </section>
  )
}

function MyNetworkSection({
  posts = [],
  onOpenChatWith,
  onOpenProfile
}: {
  posts?: Post[]
  onOpenChatWith: (user: Partial<UserProfile>) => void
  onOpenProfile: (user: Partial<UserProfile>) => void
}) {
  const { user } = useAuth()
  const [realFriends, setRealFriends] = useState<Partial<UserProfile>[]>([])

  useEffect(() => {
    if (user) {
      fetch(`/api/friends?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const accepted = data
              .filter((r: any) => r.status === 'accepted')
              .map((r: any) => {
                const isRequester = r.requesterId === user.id
                return {
                  id: isRequester ? r.recipientId : r.requesterId,
                  name: isRequester ? r.recipientName : r.requesterName,
                  handle: isRequester ? r.recipientHandle : r.requesterHandle,
                  initials: (isRequester ? r.recipientName : r.requesterName)?.slice(0, 2)?.toUpperCase() || 'RS',
                  avatarTone: 'from-amber-400 to-yellow-600',
                  role: 'Filmmaker Conectado',
                  location: 'Comunidad Foro RS',
                }
              })
            setRealFriends(accepted)
          }
        })
        .catch(() => {})
    }
  }, [user])

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="size-6 text-amber-400" /> Mi Red de Contactos y Amigos
        </h2>
        <p className="text-sm text-zinc-400">Conexiones profesionales confirmadas y hilos de conversaciones en vivo.</p>
      </div>

      {realFriends.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {realFriends.map(friend => (
            <div key={friend.id} className="rounded-2xl bg-zinc-900 p-4 border border-amber-500/20 shadow-xl flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <button onClick={() => onOpenProfile(friend)} className="hover:opacity-80 transition">
                  <Avatar initials={friend.initials || 'RS'} tone={friend.avatarTone || 'from-amber-400 to-yellow-600'} />
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => onOpenProfile(friend)} className="font-bold text-sm text-white hover:underline block truncate text-left">
                    {friend.name}
                  </button>
                  <p className="text-xs text-amber-400 font-semibold">{friend.handle} · {friend.role}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">{friend.location}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-3">
                <button
                  onClick={() => onOpenChatWith(friend)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 py-2 text-xs font-bold text-black shadow-md hover:opacity-90 transition"
                >
                  <Send className="size-3.5" /> Iniciar Chat
                </button>
                <button
                  onClick={() => onOpenProfile(friend)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-900/60 p-8 text-center border border-zinc-800 text-zinc-400 text-xs italic">
          Aún no tienes amigos agregados en tu lista. Revisa las sugerencias de abajo para enviar solicitudes de amistad y conectar.
        </div>
      )}

      <div className="mt-4">
        <SuggestedFriendsWidget posts={posts} onOpenProfile={onOpenProfile} />
      </div>
    </section>
  )
}

function ResourceHub() {
  const { openAuthModal, isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const filtered = resources.filter(r => r[0].toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Centro de recursos</h2>
          <p className="text-sm text-zinc-400">Herramientas y assets para elevar tu próximo proyecto.</p>
        </div>
        <button
          onClick={() => {
            if (!isAuthenticated) openAuthModal('login')
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-3.5 py-2 text-xs font-bold text-black hover:opacity-90 transition shadow-md"
        >
          <Plus className="size-4" /> Subir recurso
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar LUTs, presets, plugins..."
          className="w-full rounded-xl bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none ring-1 ring-amber-500/20 focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {['Todos', 'LUTs', 'Plugins', 'Presets', 'SFX', 'Templates'].map((item, i) => (
          <button
            key={item}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              i === 0 ? 'bg-amber-400 text-black font-bold' : 'bg-zinc-850 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(([name, meta, downloads, rating]) => (
          <div key={name} className="rounded-2xl bg-zinc-900 p-4 ring-1 ring-amber-500/20 border border-amber-500/10">
            <div className="mb-4 grid aspect-[1.8] place-items-center rounded-xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-amber-400 border border-amber-500/20">
              <Wrench className="size-8 opacity-80" />
            </div>
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="mt-1 text-xs text-zinc-400">{meta}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="size-3.5 fill-current" /> {rating}
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Download className="size-3.5" /> {downloads}
              </span>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal('login')
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 text-zinc-200 py-2 text-xs font-semibold hover:bg-amber-400 hover:text-black transition"
            >
              <Download className="size-3.5" /> Descargar
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function QuestionsHub() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Preguntas de la comunidad</h2>
        <p className="text-sm text-zinc-400">Resuelve dudas técnicas y comparte tu flujo de trabajo.</p>
      </div>
      {questions.map((q, i) => (
        <div key={q} className="flex items-center gap-4 rounded-2xl bg-zinc-900 p-4 ring-1 ring-amber-500/20 hover:border-amber-400/50 transition cursor-pointer border border-zinc-800">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
            <MessageCircle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-white">{q}</h3>
            <p className="mt-1 text-xs text-zinc-400">{i * 7 + 4} respuestas · {i === 0 ? 'En tendencia' : 'Hace 2 h'}</p>
          </div>
          {i === 0 && (
            <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-400 sm:flex">
              <Check className="size-3" /> Resuelta
            </span>
          )}
          <ChevronRight className="size-4 text-zinc-500" />
        </div>
      ))}
    </section>
  )
}

function RightRail({
  onRefresh,
  onOpenProfile
}: {
  onRefresh: () => void
  onOpenProfile: (profile: Partial<UserProfile>) => void
}) {
  const { user } = useAuth()

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-6 flex flex-col gap-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            aria-label="Buscar en Foro RS"
            placeholder="Buscar por equipo, DoP, color..."
            className="w-full rounded-2xl bg-zinc-900 py-3 pl-11 pr-4 text-sm text-white outline-none ring-1 ring-amber-500/20 focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <section
          onClick={() => user && onOpenProfile(user)}
          className="rounded-2xl bg-zinc-900 p-5 shadow-xl ring-1 ring-amber-500/20 border border-amber-500/20 cursor-pointer hover:border-amber-400/50 transition"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-white">Tu reputación</h2>
            <Star className="size-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-amber-400">{user ? user.reputation : 0}</p>
            <p className="mb-1 text-xs text-zinc-400">puntos</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600" />
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {user ? `${user.role} · Ver Apartado Perfil` : 'Inicia sesión para ganar puntos'}
          </p>
        </section>

        {/* Suggested Friends Widget */}
        <SuggestedFriendsWidget onOpenProfile={onOpenProfile} />

        <section className="rounded-2xl bg-zinc-900 p-4 ring-1 ring-amber-500/20 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="size-3.5 text-emerald-400" /> Servidor Central de Posts
              </p>
              <p className="text-[11px] text-zinc-400">Historias, chat privado y notificaciones</p>
            </div>
            <button
              onClick={onRefresh}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              title="Actualizar posts del servidor"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 text-white border border-amber-500/20">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Temas activos
            </span>
          </div>
          {[
            ['#Cinematografía', '2.4 mil'],
            ['#EdiciónDeVideo', '1.8 mil'],
            ['#GuionYDirección', '956']
          ].map(([tag, count]) => (
            <div key={tag} className="flex items-center justify-between border-b border-zinc-800 py-2 last:border-0">
              <p className="text-sm font-semibold text-amber-300">{tag}</p>
              <p className="text-xs text-zinc-500">{count}</p>
            </div>
          ))}
        </section>
      </div>
    </aside>
  )
}

function MainContent() {
  const { user, incrementUserStats, openAuthModal, isAuthenticated } = useAuth()
  const [active, setActive] = useState<Section>('Inicio')
  const [filter, setFilter] = useState<Filter>('Para ti')
  const [feed, setFeed] = useState<Post[]>([])
  const [toast, setToast] = useState('')

  // Viewed User Profile State for Dedicated Section
  const [viewedProfile, setViewedProfile] = useState<Partial<UserProfile>>({
    id: user?.id || 'usr-sofia',
    name: user?.name || 'Sofía Ramírez',
    handle: user?.handle || '@sofiar',
    initials: user?.initials || 'SR',
    avatarTone: user?.avatarTone || 'from-amber-400 to-yellow-600',
    role: user?.role || 'Director de Fotografía',
    bio: user?.bio || 'Filmmaker y creadora audiovisual. Especialista en cinematografía digital, iluminación de escena y corrección de color.',
    gear: user?.gear || ['Sony FX3', 'Sigma Cine 35mm T1.5', 'DaVinci Resolve Studio'],
    reputation: user?.reputation || 150,
  })

  // Private Chat Modal State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatTargetUser, setChatTargetUser] = useState<Partial<UserProfile> | null>(null)

  // Notifications Dropdown & Real Unread Count State
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0)
  const prevUnreadCountRef = useRef<number>(-1)

  const openPrivateChat = (target?: Partial<UserProfile> | null) => {
    if (!user) {
      openAuthModal('login')
      return
    }
    setChatTargetUser(target || null)
    setIsChatOpen(true)
  }

  // Navigate to Dedicated Profile Section
  const navigateToUserProfile = (profile: Partial<UserProfile>) => {
    setViewedProfile(profile)
    setActive('Perfil')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fetchGlobalPosts = async () => {
    try {
      const res = await fetch('/api/posts', { cache: 'no-store' })
      if (res.ok) {
        const postsData = await res.json()
        setFeed(postsData)
      }
    } catch (err) {
      console.error('Error fetching central posts API:', err)
    }
  }

  // Poll notifications specifically for the current active profile owner
  const fetchNotificationsForOwner = async () => {
    try {
      const targetUserId = user?.id || 'usr-1'
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(targetUserId)}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const currentUnread = data.unreadCount || 0
        setUnreadNotifCount(currentUnread)

        // Real-Time Notification Event for the Profile Owner: Play sound & display toast when new unread notification arrives!
        if (prevUnreadCountRef.current !== -1 && currentUnread > prevUnreadCountRef.current) {
          playNotificationSound()
          notify(`🔔 ¡Tienes una nueva notificación en tu perfil! (${currentUnread} sin leer)`)
        }
        prevUnreadCountRef.current = currentUnread
      }
    } catch (err) {
      console.error('Error polling notifications for profile owner:', err)
    }
  }

  useEffect(() => {
    fetchGlobalPosts()
    fetchNotificationsForOwner()

    const postsInterval = setInterval(fetchGlobalPosts, 3500)
    const notifInterval = setInterval(fetchNotificationsForOwner, 3000)

    return () => {
      clearInterval(postsInterval)
      clearInterval(notifInterval)
    }
  }, [user])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const visiblePosts = useMemo(
    () => (filter === 'Para ti' ? feed : feed.filter(post => post.type === filter)),
    [feed, filter]
  )

  const select = (section: Section) => {
    if (section === 'Perfil') {
      if (user) {
        navigateToUserProfile(user)
      } else {
        openAuthModal('login')
      }
      return
    }
    setActive(section)
    notify(`${section} seleccionado`)
  }

  // Intelligent Navigation Engine: Directs user to target entity
  const handleNavigateFromNotification = (
    entityType: string,
    entityId: string | number,
    actorId?: string,
    actorHandle?: string,
    notif?: NotificationRecord
  ) => {
    if (
      entityType === 'POST' ||
      notif?.type === 'POST_REACTION' ||
      notif?.type === 'POST_COMMENT' ||
      notif?.type === 'COMMENT_REPLY'
    ) {
      setActive('Inicio')
      setFilter('Para ti')
      setTimeout(() => {
        const targetId = `post-${entityId}`
        const el = document.getElementById(targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'transition-all', 'duration-300')
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-400', 'shadow-2xl')
          }, 3500)
        }
      }, 250)
    } else if (
      entityType === 'USER' ||
      notif?.type === 'FRIEND_REQUEST' ||
      notif?.type === 'NEW_FOLLOWER'
    ) {
      navigateToUserProfile({
        id: actorId || 'usr-sofia',
        name: notif?.actorName || 'Creador',
        handle: actorHandle || '@creador',
        initials: notif?.actorInitials || 'RS',
        avatarTone: notif?.actorTone || 'from-amber-400 to-yellow-600',
      })
    } else if (entityType === 'MESSAGE' || notif?.type === 'NEW_MESSAGE') {
      openPrivateChat({
        id: actorId || 'usr-sofia',
        name: notif?.actorName || 'Creador',
        handle: actorHandle || '@creador',
        initials: notif?.actorInitials || 'RS',
        avatarTone: notif?.actorTone || 'from-amber-400 to-yellow-600',
      })
    } else if (entityType === 'RESOURCE') {
      setActive('Recursos')
    }
  }

  const createPost = async (title: string, text: string, type: Filter, imageUrl?: string) => {
    const newPostName = user ? user.name : 'Creador Anónimo'
    const newPostHandle = user ? user.handle : '@creador'
    const newPostInitials = user ? user.initials : 'CA'
    const newPostTone = user ? user.avatarTone : 'from-amber-400 to-yellow-600'

    const gradients = [
      'from-zinc-950 via-zinc-900 to-black',
      'from-amber-950/40 via-zinc-900 to-black',
      'from-neutral-900 via-stone-900 to-zinc-950',
    ]
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)]

    const newPostData = {
      type,
      name: newPostName,
      handle: newPostHandle,
      initials: newPostInitials,
      tone: newPostTone,
      title: title || (type === 'Preguntas' ? 'Nueva consulta técnica' : `Aporte de ${newPostName}`),
      text,
      imageUrl,
      tags: `#${type.toLowerCase()} #filmmaking`,
      gradient: randomGradient,
      authorProfile: user || undefined,
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.posts) setFeed(result.posts)
      }
    } catch (err) {
      console.error('Error posting to central API:', err)
    }

    incrementUserStats('posts')
    notify('Publicación enviada al servidor')
  }

  const handleLikeToggle = async (postId: number) => {
    if (!user) {
      openAuthModal('login')
      return
    }

    const targetPost = feed.find(p => p.id === postId)
    const isLiking = !targetPost?.likedBy?.includes(user.id)

    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.posts) setFeed(result.posts)
      }

      const postOwnerId = targetPost?.authorProfile?.id || targetPost?.handle || 'usr-1'

      // Save real notification targeting post owner in backend DB
      if (isLiking && user.id !== postOwnerId) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: postOwnerId,
            actorId: user.id,
            actorName: user.name,
            actorHandle: user.handle,
            actorInitials: user.initials,
            actorTone: user.avatarTone,
            type: 'POST_REACTION',
            entityType: 'POST',
            entityId: postId,
          }),
        })

        notify(`❤️ Le diste Me Gusta a la publicación de ${targetPost?.name || 'autor'}`)
      } else {
        notify(isLiking ? '❤️ Le diste Me Gusta' : 'Me Gusta eliminado')
      }
    } catch (err) {
      console.error('Error toggling like:', err)
    }

    incrementUserStats('likes')
  }

  const handleAddComment = async (
    postId: number,
    commentText: string,
    replyTo?: { id: string; handle: string; name: string }
  ) => {
    if (!user) return
    const commentPayload = {
      postId,
      commentText,
      authorName: user.name,
      authorHandle: user.handle,
      authorInitials: user.initials,
      authorTone: user.avatarTone,
      replyToId: replyTo?.id,
      replyToHandle: replyTo?.handle,
      replyToName: replyTo?.name,
    }

    try {
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentPayload),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.posts) setFeed(result.posts)
      }

      // Identify author of the post
      const targetPost = feed.find(p => p.id === postId)
      const postOwnerId = targetPost?.authorProfile?.id || targetPost?.handle || 'usr-1'

      // Save persistent notification for recipient post author
      if (user.id !== postOwnerId) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: postOwnerId,
            actorId: user.id,
            actorName: user.name,
            actorHandle: user.handle,
            actorInitials: user.initials,
            actorTone: user.avatarTone,
            type: replyTo ? 'COMMENT_REPLY' : 'POST_COMMENT',
            entityType: replyTo ? 'COMMENT' : 'POST',
            entityId: postId,
          }),
        })
      }

      notify(
        replyTo
          ? `💬 Respuesta enviada a ${replyTo.name}`
          : `💬 Comentario enviado al autor ${targetPost?.name || ''}`
      )
    } catch (err) {
      console.error('Error sending comment to central API:', err)
    }

    incrementUserStats('comments')
  }

  const handleDeletePost = async (postId: number) => {
    if (!user) {
      openAuthModal('login')
      return
    }
    try {
      const res = await fetch(
        `/api/posts?id=${postId}&userId=${encodeURIComponent(user.id)}&userHandle=${encodeURIComponent(user.handle)}`,
        { method: 'DELETE' }
      )
      const result = await res.json()
      if (res.ok && result.posts) {
        setFeed(result.posts)
        notify('Publicación eliminada correctamente por su dueño')
      } else {
        notify(result.error || 'Solo el dueño de la publicación puede eliminarla')
      }
    } catch (err) {
      console.error('Error deleting post from central API:', err)
    }
  }

  const handleSelectPostFromSearch = (post: Post) => {
    setActive('Inicio')
    setFilter('Para ti')
    setTimeout(() => {
      const el = document.getElementById(`post-${post.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'transition-all', 'duration-300')
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-amber-400', 'shadow-2xl')
        }, 3500)
      }
    }, 250)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSelect={select}
        onOpenChat={() => openPrivateChat()}
        onToggleNotifications={() => setIsNotifOpen(!isNotifOpen)}
        isNotifOpen={isNotifOpen}
        onCloseNotifications={() => setIsNotifOpen(false)}
        unreadNotifCount={unreadNotifCount}
        onUnreadCountChange={(count) => setUnreadNotifCount(count)}
        onNavigateToEntity={handleNavigateFromNotification}
        posts={feed}
        onSelectUser={(u) => navigateToUserProfile(u)}
        onSelectPost={(p) => handleSelectPostFromSearch(p)}
      />

      <div className="mx-auto flex max-w-[1320px] gap-8 px-4 py-6 sm:px-6">
        <Sidebar active={active} onSelect={select} onOpenChat={() => openPrivateChat()} />

        <main className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            {active === 'Perfil' ? (
              <UserProfileSection
                profile={viewedProfile}
                onOpenChatWith={(target) => openPrivateChat(target)}
                posts={feed}
                onLikeToggle={handleLikeToggle}
                onAddComment={handleAddComment}
                onDeletePost={handleDeletePost}
              />
            ) : active === 'Amigos' || active === 'Mi red' ? (
              <MyNetworkSection
                posts={feed}
                onOpenChatWith={(target) => openPrivateChat(target)}
                onOpenProfile={(p) => navigateToUserProfile(p)}
              />
            ) : active === 'Recursos' ? (
              <ResourceHub />
            ) : active === 'Preguntas' ? (
              <QuestionsHub />
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-amber-400">Comunidad Foro RS</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Crea. Aprende. Comparte. Colabora.</h1>
                  <p className="mt-1 text-sm text-zinc-400">Red social profesional para filmmakers y creadores de la industria audiovisual.</p>
                </div>

                {/* STORIES CAROUSEL BAR */}
                <StoriesBar />

                <Composer
                  onPost={createPost}
                  onOpenProfile={(p) => navigateToUserProfile(p)}
                />

                <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {(['Para ti', 'Preguntas', 'Proyectos', 'Recursos', 'Tutoriales'] as Filter[]).map(item => (
                      <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                          filter === item ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-400'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {visiblePosts.length ? (
                  visiblePosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLikeToggle={handleLikeToggle}
                      onAddComment={handleAddComment}
                      onDeletePost={handleDeletePost}
                      onOpenChatWith={(target) => openPrivateChat(target)}
                      onOpenProfile={(profile) => navigateToUserProfile(profile)}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl bg-zinc-900/60 p-12 text-center ring-1 ring-amber-500/20 border border-zinc-800">
                    <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-400/10 text-amber-400 mb-4 shadow-inner">
                      <Crown className="size-8" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Plataforma Completa para Filmmakers</h2>
                    <p className="mt-1.5 text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      Historias, perfiles profesionales, solicitudes de amistad, chat privado en vivo y servidor centralizado.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                      {isAuthenticated ? (
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:opacity-90 transition"
                        >
                          Crear mi Publicación
                        </button>
                      ) : (
                        <button
                          onClick={() => openAuthModal('register')}
                          className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:opacity-90 transition"
                        >
                          Registrarme y Publicar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <RightRail
          onRefresh={fetchGlobalPosts}
          onOpenProfile={(p) => navigateToUserProfile(p)}
        />
      </div>

      {/* Floating Animated Toast Notification */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-zinc-900 border border-amber-500/40 px-5 py-3 text-xs font-semibold text-white shadow-2xl shadow-amber-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <div className="grid size-8 place-items-center rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
            <Volume2 className="size-4 animate-pulse" />
          </div>
          <span>{toast}</span>
        </div>
      )}

      <AuthModal />
      <ProfileModal onOpenChatWith={(target) => openPrivateChat(target)} />
      <PrivateChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetUser={chatTargetUser}
      />
    </div>
  )
}

export function SocialApp() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}

export default SocialApp
