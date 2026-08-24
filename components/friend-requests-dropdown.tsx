'use client'

import { useState, useEffect, useRef } from 'react'
import { UserPlus, Check, X, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useAuth, UserProfile, getUserAvatarUrl } from '@/lib/auth-context'

export type FriendRelationship = {
  id: string
  requesterId: string
  requesterName: string
  requesterHandle: string
  recipientId: string
  recipientName: string
  recipientHandle: string
  status: 'pending' | 'accepted'
  createdAt: string
}

export function FriendRequestsDropdown({
  isOpen,
  onClose,
  onOpenProfile
}: {
  isOpen: boolean
  onClose: () => void
  onOpenProfile?: (user: Partial<UserProfile>) => void
}) {
  const { user } = useAuth()
  const [requests, setRequests] = useState<FriendRelationship[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchPendingRequests = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/friends?userId=${user.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          // Filter requests where current user is the RECIPIENT and status is 'pending'
          const pendingIncoming = data.filter(
            (r: any) => r.recipientId === user.id && r.status === 'pending'
          )
          setRequests(pendingIncoming)
        }
      }
    } catch (err) {
      console.error('Error fetching friend requests:', err)
    }
  }

  useEffect(() => {
    fetchPendingRequests()
    const interval = setInterval(fetchPendingRequests, 3500)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleAction = async (rel: FriendRelationship, action: 'accept' | 'reject') => {
    if (!user) return
    setLoadingId(rel.id)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: rel.requesterId,
          recipientId: user.id,
          action,
        }),
      })
      if (res.ok) {
        fetchPendingRequests()
      }
    } catch (err) {
      console.error('Error answering friend request:', err)
    } finally {
      setLoadingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 flex flex-col"
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-black/60">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
            <UserPlus className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Solicitudes de Amistad</h3>
            <p className="text-[10px] text-zinc-400">Peticiones de conexión pendientes</p>
          </div>
        </div>

        <span className="rounded-full bg-amber-400/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
          {requests.length} pendientes
        </span>
      </div>

      {/* Requests List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/40">
        {requests.length > 0 ? (
          requests.map(rel => {
            const requesterUser = {
              id: rel.requesterId,
              name: rel.requesterName,
              handle: rel.requesterHandle,
              initials: rel.requesterName?.slice(0, 2)?.toUpperCase() || 'RS',
            }

            return (
              <div key={rel.id} className="p-3.5 flex items-center justify-between gap-3 bg-zinc-900/90 hover:bg-zinc-850 transition">
                <button
                  onClick={() => {
                    onClose()
                    if (onOpenProfile) onOpenProfile(requesterUser)
                  }}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition"
                >
                  <img
                    src={getUserAvatarUrl(requesterUser)}
                    alt={rel.requesterName}
                    className="size-11 rounded-full object-cover ring-2 ring-amber-400/50 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate">{rel.requesterName}</p>
                    <p className="text-[10px] text-amber-400 font-medium truncate">{rel.requesterHandle}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Quiere conectar contigo</p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={loadingId === rel.id}
                    onClick={() => handleAction(rel, 'accept')}
                    className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-3 py-1.5 text-xs font-bold text-black shadow-md hover:opacity-90 transition disabled:opacity-50"
                  >
                    <Check className="size-3.5" /> Aceptar
                  </button>

                  <button
                    disabled={loadingId === rel.id}
                    onClick={() => handleAction(rel, 'reject')}
                    className="grid size-8 place-items-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition border border-zinc-700"
                    title="Rechazar"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-zinc-500 text-xs italic flex flex-col items-center gap-2">
            <Users className="size-7 text-amber-400 opacity-50" />
            No tienes solicitudes de amistad pendientes por responder.
          </div>
        )}
      </div>
    </div>
  )
}
