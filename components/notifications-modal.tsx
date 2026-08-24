'use client'

import { useState, useEffect } from 'react'
import { Bell, Heart, MessageSquare, UserPlus, Star, Sparkles, X, CheckCircle, Eye, CheckCheck, UserCheck, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export type NotificationRecord = {
  id: string
  recipientId: string
  actorId: string
  actorName: string
  actorHandle: string
  actorInitials: string
  actorTone: string
  type: string        // e.g. 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY', 'FRIEND_REQUEST', 'NEW_FOLLOWER', 'SYSTEM_MESSAGE'
  entityType: string  // e.g. 'POST', 'COMMENT', 'USER', 'MESSAGE', 'RESOURCE', 'PROJECT'
  entityId: string | number
  isRead: boolean
  createdAt: string
  readAt?: string | null
}

export function NotificationsModal({
  isOpen,
  onClose,
  onUnreadCountChange,
  onNavigateToEntity
}: {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
  onNavigateToEntity?: (entityType: string, entityId: string | number) => void
}) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  // Fetch notifications from server API
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(user?.id || 'usr-1')}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        if (onUnreadCountChange) onUnreadCountChange(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 3500)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Mark all notifications as read (isRead = true)
  const handleMarkAllAsRead = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'usr-1', markAll: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(0)
        if (onUnreadCountChange) onUnreadCountChange(0)
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mark a single notification as read and navigate to entity
  const handleNotificationClick = async (notif: NotificationRecord) => {
    if (!notif.isRead) {
      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id || 'usr-1', notificationId: notif.id }),
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
          if (onUnreadCountChange) onUnreadCountChange(data.unreadCount || 0)
        }
      } catch (err) {
        console.error('Error marking notification as read:', err)
      }
    }

    if (onNavigateToEntity) {
      onNavigateToEntity(notif.entityType, notif.entityId)
      onClose()
    }
  }

  // Format dynamic text based on relational fields
  const renderNotificationText = (notif: NotificationRecord) => {
    switch (notif.type) {
      case 'POST_REACTION':
        return {
          icon: <Heart className="size-4 text-rose-500 fill-rose-500" />,
          title: `${notif.actorName} reaccionó a tu publicación`,
          desc: `Le dio "Me gusta" o "Útil" a tu publicación.`,
        }
      case 'POST_COMMENT':
        return {
          icon: <MessageCircle className="size-4 text-indigo-500" />,
          title: `${notif.actorName} comentó tu publicación`,
          desc: `Escribió un nuevo comentario técnico.`,
        }
      case 'COMMENT_REPLY':
        return {
          icon: <MessageSquare className="size-4 text-fuchsia-500" />,
          title: `${notif.actorName} respondió a tu comentario`,
          desc: `Mención directa: ↳ respondiendo a ${notif.actorHandle}`,
        }
      case 'FRIEND_REQUEST':
        return {
          icon: <UserPlus className="size-4 text-amber-500" />,
          title: `${notif.actorName} te envió una solicitud de amistad`,
          desc: `Desea conectarse en tu red profesional.`,
        }
      case 'NEW_FOLLOWER':
        return {
          icon: <UserCheck className="size-4 text-emerald-500" />,
          title: `${notif.actorName} comenzó a seguirte`,
          desc: `Ahora sigue tu trabajo y proyectos.`,
        }
      case 'SYSTEM_MESSAGE':
      default:
        return {
          icon: <Sparkles className="size-4 text-fuchsia-500" />,
          title: notif.actorName,
          desc: `Notificación del sistema Foro RS.`,
        }
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Hace un momento'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours} h`
    return `Hace ${Math.floor(hours / 24)} d`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="relative grid size-9 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-500">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-fuchsia-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                Notificaciones {unreadCount > 0 && <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] text-fuchsia-500">{unreadCount} no leídas</span>}
              </h3>
              <p className="text-[11px] text-muted-foreground">Sistema de eventos relacionales en vivo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-semibold text-fuchsia-500 hover:underline disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" /> Marcar todas como leídas
              </button>
            )}
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-muted/10">
          {notifications.length === 0 ? (
            <div className="my-auto text-center p-6 text-muted-foreground">
              <Bell className="mx-auto size-8 text-fuchsia-500/40 mb-2" />
              <p className="text-xs font-medium">No tienes notificaciones por el momento.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const { icon, title, desc } = renderNotificationText(notif)
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 rounded-2xl p-3 border transition cursor-pointer ${
                    notif.isRead
                      ? 'bg-card border-border/50 opacity-80'
                      : 'bg-fuchsia-500/5 border-fuchsia-500/30 ring-1 ring-fuchsia-500/20'
                  }`}
                >
                  <div className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${notif.actorTone || 'from-fuchsia-500 to-orange-400'} font-bold text-xs text-white shadow-sm`}>
                    {notif.actorInitials || 'RS'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                        {icon} {title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 ml-2">
                        {notif.isRead ? (
                          <span className="text-emerald-500 flex items-center gap-0.5">
                            <CheckCheck className="size-3" /> Leída
                          </span>
                        ) : (
                          <span className="text-fuchsia-500 font-bold flex items-center gap-0.5">
                            <Eye className="size-3" /> No leída
                          </span>
                        )}
                        · {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
