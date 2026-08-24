'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bell, CheckCircle2, MessageCircle, Heart, UserPlus, FileText, Check, Sparkles, Filter as FilterIcon, Crown
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export type NotificationRecord = {
  id: string
  recipientId: string
  actorId: string
  actorName: string
  actorHandle: string
  actorInitials: string
  actorTone: string
  type: 'POST_REACTION' | 'POST_COMMENT' | 'COMMENT_REPLY' | 'FRIEND_REQUEST' | 'NEW_FOLLOWER' | 'NEW_MESSAGE'
  entityType: 'POST' | 'COMMENT' | 'USER' | 'MESSAGE' | 'RESOURCE'
  entityId: string | number
  isRead: boolean
  createdAt: string
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
  onNavigateToEntity
}: {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
  onNavigateToEntity?: (entityType: string, entityId: string | number, actorId?: string, actorHandle?: string, notif?: NotificationRecord) => void
}) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const targetUserId = user?.id || 'usr-1'
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(targetUserId)}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        if (onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount || 0)
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  const handleMarkAsRead = async (notifId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        if (onUnreadCountChange) onUnreadCountChange(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const targetUserId = user?.id || 'usr-1'
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, markAll: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        if (onUnreadCountChange) onUnreadCountChange(0)
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err)
    }
  }

  const getNotifText = (notif: NotificationRecord) => {
    switch (notif.type) {
      case 'POST_REACTION':
        return 'reaccionó con Me Gusta a tu publicación'
      case 'POST_COMMENT':
        return 'comentó en tu publicación profesional'
      case 'COMMENT_REPLY':
        return 'respondió específicamente a tu comentario'
      case 'FRIEND_REQUEST':
        return 'te envió una solicitud de amistad'
      case 'NEW_FOLLOWER':
        return 'comenzó a seguir tu perfil'
      case 'NEW_MESSAGE':
        return 'te envió un mensaje privado directo'
      default:
        return 'interactuó contigo'
    }
  }

  const getNotifIcon = (type: NotificationRecord['type']) => {
    switch (type) {
      case 'POST_REACTION':
        return <Heart className="size-3 text-amber-400 fill-amber-400" />
      case 'POST_COMMENT':
      case 'COMMENT_REPLY':
        return <MessageCircle className="size-3 text-amber-400 fill-amber-400" />
      case 'FRIEND_REQUEST':
      case 'NEW_FOLLOWER':
        return <UserPlus className="size-3 text-amber-400" />
      case 'NEW_MESSAGE':
        return <Sparkles className="size-3 text-amber-400" />
      default:
        return <Bell className="size-3 text-amber-400" />
    }
  }

  if (!isOpen) return null

  const filteredNotifs = filterTab === 'unread' ? notifications.filter(n => !n.isRead) : notifications
  const unreadTotal = notifications.filter(n => !n.isRead).length

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-amber-500/30 shadow-2xl shadow-black z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-black/60">
        <div className="flex items-center gap-2">
          <Crown className="size-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">Notificaciones</h3>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-black">
              {unreadTotal} nuevas
            </span>
          )}
        </div>

        {unreadTotal > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline"
          >
            <CheckCircle2 className="size-3.5" /> Marcar todas leídas
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
        <button
          onClick={() => setFilterTab('all')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            filterTab === 'all'
              ? 'bg-amber-400 text-black font-bold'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilterTab('unread')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            filterTab === 'unread'
              ? 'bg-amber-400 text-black font-bold'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          No leídas ({unreadTotal})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/80">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) handleMarkAsRead(notif.id)
                if (onNavigateToEntity) {
                  onNavigateToEntity(notif.entityType, notif.entityId, notif.actorId, notif.actorHandle, notif)
                }
                onClose()
              }}
              className={`flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-zinc-800/80 ${
                !notif.isRead ? 'bg-amber-400/5' : 'bg-transparent'
              }`}
            >
              {/* Actor Avatar */}
              <div className="relative shrink-0">
                <div className={`grid size-10 place-items-center rounded-full bg-gradient-to-br ${notif.actorTone || 'from-amber-400 to-yellow-600'} text-xs font-bold text-black ring-1 ring-amber-400`}>
                  {notif.actorInitials}
                </div>
                <div className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-zinc-900 border border-amber-500/30">
                  {getNotifIcon(notif.type)}
                </div>
              </div>

              {/* Text Body */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-200 leading-snug">
                  <span className="font-bold text-white">{notif.actorName}</span>{' '}
                  {getNotifText(notif)}
                </p>
                <span className="mt-1 block text-[10px] text-zinc-400">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Unread Dot */}
              {!notif.isRead && (
                <div className="size-2 rounded-full bg-amber-400 shrink-0 mt-2 shadow-sm" />
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zinc-500 text-xs italic">
            No tienes notificaciones en este filtro.
          </div>
        )}
      </div>
    </div>
  )
}
