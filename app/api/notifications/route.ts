import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json')

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

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    const initialRecords: NotificationRecord[] = [
      {
        id: 'notif-101',
        recipientId: 'usr-1',
        actorId: 'usr-sofia',
        actorName: 'Sofía Ramírez',
        actorHandle: '@sofiar',
        actorInitials: 'SR',
        actorTone: 'from-violet-500 to-indigo-400',
        type: 'POST_REACTION',
        entityType: 'POST',
        entityId: 1,
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        readAt: null,
      },
      {
        id: 'notif-102',
        recipientId: 'usr-1',
        actorId: 'usr-carlos',
        actorName: 'Carlos Mendoza',
        actorHandle: '@carlosm',
        actorInitials: 'CM',
        actorTone: 'from-emerald-500 to-teal-400',
        type: 'COMMENT_REPLY',
        entityType: 'COMMENT',
        entityId: 'c-101',
        isRead: false,
        createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
        readAt: null,
      },
      {
        id: 'notif-103',
        recipientId: 'usr-1',
        actorId: 'usr-laura',
        actorName: 'Laura Gómez',
        actorHandle: '@laurag',
        actorInitials: 'LG',
        actorTone: 'from-amber-500 to-rose-400',
        type: 'FRIEND_REQUEST',
        entityType: 'USER',
        entityId: 'usr-laura',
        isRead: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        readAt: null,
      },
      {
        id: 'notif-104',
        recipientId: 'usr-1',
        actorId: 'system',
        actorName: 'Foro RS Team',
        actorHandle: '@forors',
        actorInitials: 'RS',
        actorTone: 'from-fuchsia-500 to-orange-400',
        type: 'SYSTEM_MESSAGE',
        entityType: 'SYSTEM',
        entityId: 'sys-1',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
    ]
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(initialRecords, null, 2), 'utf-8')
  }
}

function readNotifications(): NotificationRecord[] {
  ensureDataDirectory()
  try {
    return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeNotifications(notifications: NotificationRecord[]) {
  ensureDataDirectory()
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf-8')
}

// GET /api/notifications?userId=... - Fetch notifications and unreadCount
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  const all = readNotifications()

  // Filter notifications for current user or global system messages
  const userNotifs = all.filter(
    (n) => !userId || n.recipientId === userId || n.recipientId === 'usr-1' || n.recipientId === 'all'
  )

  const unreadCount = userNotifs.filter((n) => !n.isRead).length

  return NextResponse.json({
    success: true,
    notifications: userNotifs,
    unreadCount,
  })
}

// POST /api/notifications - Create a new notification event
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      recipientId,
      actorId,
      actorName,
      actorHandle,
      actorInitials,
      actorTone,
      type,
      entityType,
      entityId,
    } = body

    // Validation: Require recipientId, actorId, type, entityType
    if (!recipientId || !actorId || !type || !entityType) {
      return NextResponse.json({ error: 'Faltan parámetros relacionales obligatorios' }, { status: 400 })
    }

    // Rule: Don't generate notification if actor is the recipient
    if (actorId === recipientId) {
      return NextResponse.json({ success: false, reason: 'Actor y receptor son el mismo usuario' })
    }

    const all = readNotifications()

    // Prevent duplicate unread notification for exact same actor, recipient, type and entityId
    const existingUnread = all.find(
      (n) =>
        !n.isRead &&
        n.recipientId === recipientId &&
        n.actorId === actorId &&
        n.type === type &&
        n.entityId === entityId
    )

    if (existingUnread) {
      return NextResponse.json({ success: true, notification: existingUnread, unreadCount: all.filter(n => !n.isRead).length })
    }

    const newNotif: NotificationRecord = {
      id: `notif-${Date.now()}`,
      recipientId,
      actorId,
      actorName: actorName || 'Usuario',
      actorHandle: actorHandle || '@usuario',
      actorInitials: actorInitials || 'RS',
      actorTone: actorTone || 'from-fuchsia-500 to-orange-400',
      type,
      entityType,
      entityId: entityId || 'main',
      isRead: false,
      createdAt: new Date().toISOString(),
      readAt: null,
    }

    const updated = [newNotif, ...all]
    writeNotifications(updated)

    const userNotifs = updated.filter(
      (n) => n.recipientId === recipientId || n.recipientId === 'usr-1' || n.recipientId === 'all'
    )
    const unreadCount = userNotifs.filter((n) => !n.isRead).length

    return NextResponse.json({
      success: true,
      notification: newNotif,
      unreadCount,
      notifications: userNotifs,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark as read (isRead = true, readAt = now)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { userId, notificationId, markAll } = body

    const all = readNotifications()
    const nowStr = new Date().toISOString()

    const updated = all.map((n) => {
      if (markAll) {
        if (!userId || n.recipientId === userId || n.recipientId === 'usr-1' || n.recipientId === 'all') {
          return { ...n, isRead: true, readAt: n.readAt || nowStr }
        }
      } else if (notificationId && n.id === notificationId) {
        return { ...n, isRead: true, readAt: n.readAt || nowStr }
      }
      return n
    })

    writeNotifications(updated)

    const userNotifs = updated.filter(
      (n) => !userId || n.recipientId === userId || n.recipientId === 'usr-1' || n.recipientId === 'all'
    )
    const unreadCount = userNotifs.filter((n) => !n.isRead).length

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: userNotifs,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
