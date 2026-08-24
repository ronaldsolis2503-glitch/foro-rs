'use client'

import { useState, useEffect } from 'react'
import {
  X, UserPlus, Check, MessageSquare, Star, MapPin, Camera, Sparkles, Award, ShieldCheck, Briefcase, ExternalLink, Send, Crown
} from 'lucide-react'
import { useAuth, UserProfile } from '@/lib/auth-context'

export function ProfileModal({
  onOpenChatWith
}: {
  onOpenChatWith?: (user: Partial<UserProfile>) => void
}) {
  const { isProfileModalOpen, profileModalUser, closeProfileModal, user: currentUser } = useAuth()
  const [friendState, setFriendState] = useState<'none' | 'pending' | 'friends'>('none')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isProfileModalOpen && profileModalUser && currentUser) {
      fetchRelationship()
    }
  }, [isProfileModalOpen, profileModalUser, currentUser])

  const fetchRelationship = async () => {
    if (!currentUser || !profileModalUser) return
    try {
      const res = await fetch(`/api/friends?userId=${currentUser.id}&targetUserId=${profileModalUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setFriendState(data.status || 'none')
      }
    } catch (err) {
      console.error('Error fetching friend relationship:', err)
    }
  }

  const handleFriendAction = async (action: 'request' | 'accept') => {
    if (!currentUser || !profileModalUser) return
    setLoading(true)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId: profileModalUser.id,
          action,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setFriendState(data.status || 'pending')
      }
    } catch (err) {
      console.error('Error with friend action:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isProfileModalOpen || !profileModalUser) return null

  const isSelf = currentUser?.id === profileModalUser.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl">
        {/* Cover Header */}
        <div className="h-32 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black relative border-b border-amber-500/20">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <button
            onClick={closeProfileModal}
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-black/80 text-white hover:bg-black transition border border-amber-500/30"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Profile Card Details */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar Overlay */}
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="relative">
              <img
                src={getUserAvatarUrl(profileModalUser)}
                alt={profileModalUser.name}
                className="size-24 rounded-full object-cover ring-4 ring-zinc-900 shadow-xl border-2 border-amber-400"
              />
              <div className="absolute bottom-1 right-1 grid size-7 place-items-center rounded-full bg-amber-400 text-black shadow-md">
                <Crown className="size-4" />
              </div>
            </div>

            <div className="flex gap-2">
              {!isSelf && (
                <>
                  <button
                    onClick={() => {
                      closeProfileModal()
                      if (onOpenChatWith) onOpenChatWith(profileModalUser)
                    }}
                    className="rounded-xl bg-amber-400/10 border border-amber-500/30 p-2.5 text-amber-400 hover:bg-amber-400/20 transition"
                    title={`Enviar mensaje privado a ${profileModalUser.name}`}
                  >
                    <Send className="size-4" />
                  </button>

                  {friendState === 'friends' ? (
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-400">
                      <Check className="size-3.5" /> Conectados
                    </span>
                  ) : friendState === 'pending' ? (
                    <span className="flex items-center gap-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-300">
                      Solicitud Enviada
                    </span>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={() => handleFriendAction('request')}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 px-4 py-2 text-xs font-bold text-black shadow-md transition hover:opacity-90 disabled:opacity-50"
                    >
                      <UserPlus className="size-3.5" /> Solicitar Conexión
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{profileModalUser.name}</h2>
              <ShieldCheck className="size-5 text-amber-400" />
            </div>
            <p className="text-xs text-amber-400 font-semibold">{profileModalUser.handle} · {profileModalUser.role}</p>

            <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 text-zinc-500" /> {profileModalUser.location || 'Madrid, España'}
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="size-3.5 fill-current" /> {profileModalUser.reputation || 120} puntos
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-300">
              {profileModalUser.bio || 'Filmmaker y creador audiovisual. Especialista en cinematografía digital, iluminación de escena y flujo de trabajo DaVinci Resolve.'}
            </p>
          </div>

          {/* Gear Tags */}
          <div className="mt-4 border-t border-zinc-800 pt-3">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="size-3.5 text-amber-400" /> Equipo de Trabajo
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(profileModalUser.gear || ['Sony FX3', 'Sigma Cine 35mm T1.5', 'DaVinci Resolve Studio']).map(item => (
                <span key={item} className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-950 p-3 border border-amber-500/20 text-center">
            <div>
              <p className="text-lg font-bold text-amber-400">{profileModalUser.stats?.posts || 14}</p>
              <p className="text-[10px] text-zinc-500 font-semibold">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{profileModalUser.stats?.likes || 189}</p>
              <p className="text-[10px] text-zinc-500 font-semibold">Me Gusta</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{profileModalUser.stats?.comments || 42}</p>
              <p className="text-[10px] text-zinc-500 font-semibold">Respuestas</p>
            </div>
          </div>

          {/* Portfolio Link */}
          {profileModalUser.portfolioUrl && (
            <a
              href={profileModalUser.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-between rounded-xl bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition border border-zinc-700"
            >
              <span className="flex items-center gap-2">
                <Briefcase className="size-4 text-amber-400" /> Portafolio Profesional
              </span>
              <ExternalLink className="size-3.5 text-zinc-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
