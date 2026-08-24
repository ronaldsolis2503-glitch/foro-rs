import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const MESSAGES_FILE = path.join(DATA_DIR, 'private_messages.json')

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]), 'utf-8')
  }
}

function readMessages(): any[] {
  ensureDataDirectory()
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeMessages(messages: any[]) {
  ensureDataDirectory()
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8')
}

// GET /api/messages?userId=...&targetUserId=... (or partnerId=...)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const targetUserId = searchParams.get('targetUserId') || searchParams.get('partnerId')

  const allMessages = readMessages()

  if (!userId) {
    return NextResponse.json({ messages: allMessages, unreadCount: 0, allMessages })
  }

  // Filter messages involving the requesting user
  const userMessages = allMessages.filter(
    (m: any) =>
      m.senderId === userId ||
      m.receiverId === userId ||
      m.recipientId === userId ||
      m.senderHandle === userId ||
      m.receiverHandle === userId
  )

  // Calculate total unread messages sent TO this user
  const unreadCount = userMessages.filter(
    (m: any) => (m.receiverId === userId || m.recipientId === userId) && !m.isRead
  ).length

  if (targetUserId) {
    const thread = userMessages.filter(
      (m: any) =>
        (m.senderId === userId && (m.receiverId === targetUserId || m.recipientId === targetUserId || m.receiverHandle === targetUserId)) ||
        ((m.senderId === targetUserId || m.senderHandle === targetUserId) && (m.receiverId === userId || m.recipientId === userId))
    )
    return NextResponse.json({ messages: thread, unreadCount, allMessages })
  }

  return NextResponse.json({ messages: userMessages, unreadCount, allMessages })
}

// POST /api/messages - Send a direct private message
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      senderId,
      senderName,
      senderHandle,
      senderInitials,
      senderTone,
      text
    } = body

    const recId = body.receiverId || body.recipientId || body.targetUserId
    const recName = body.receiverName || body.recipientName || 'Destinatario'
    const recHandle = body.receiverHandle || body.recipientHandle || `@${recName.toLowerCase().replace(/\s+/g, '')}`
    const recInitials = body.receiverInitials || body.recipientInitials || recName?.slice(0, 2)?.toUpperCase() || 'DES'
    const recTone = body.receiverTone || body.recipientTone || 'from-amber-400 to-yellow-600'

    if (!senderId || !recId || !text?.trim()) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (senderId, receiverId/recipientId, text)' }, { status: 400 })
    }

    const allMessages = readMessages()
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId,
      senderName: senderName || 'Usuario',
      senderHandle: senderHandle || '@usuario',
      senderInitials: senderInitials || 'US',
      senderTone: senderTone || 'from-amber-400 to-yellow-600',
      receiverId: recId,
      recipientId: recId,
      receiverName: recName,
      recipientName: recName,
      receiverHandle: recHandle,
      receiverInitials: recInitials,
      receiverTone: recTone,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isRead: false,
      readAt: null,
    }

    const updated = [...allMessages, newMessage]
    writeMessages(updated)

    // Generate persistent notification for recipient if not self
    if (senderId !== recId) {
      const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json')
      let notifs: any[] = []
      try {
        if (fs.existsSync(NOTIFICATIONS_FILE)) {
          notifs = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'))
        }
      } catch {}

      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientId: recId,
        actorId: senderId,
        actorName: senderName || 'Creador',
        actorHandle: senderHandle || '@creador',
        actorInitials: senderInitials || 'RS',
        actorTone: senderTone || 'from-amber-400 to-yellow-600',
        type: 'NEW_MESSAGE',
        entityType: 'MESSAGE',
        entityId: newMessage.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      }

      notifs.unshift(newNotif)
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2), 'utf-8')
    }

    // Return the thread for the current active conversation
    const thread = updated.filter(
      (m: any) =>
        (m.senderId === senderId && (m.receiverId === recId || m.recipientId === recId)) ||
        ((m.senderId === recId || m.senderHandle === recId) && (m.receiverId === senderId || m.recipientId === senderId))
    )

    const unreadCount = updated.filter(
      (m: any) => (m.receiverId === senderId || m.recipientId === senderId) && !m.isRead
    ).length

    return NextResponse.json({ success: true, message: newMessage, messages: thread, unreadCount, allMessages: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PATCH /api/messages - Mark thread messages as READ ("Visto")
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { userId, partnerId } = body

    if (!userId || !partnerId) {
      return NextResponse.json({ error: 'Faltan parámetros userId y partnerId' }, { status: 400 })
    }

    const allMessages = readMessages()
    let updatedCount = 0

    const updatedMessages = allMessages.map((m: any) => {
      const isRecipientOfMsg = m.receiverId === userId || m.recipientId === userId
      const isSenderPartner = m.senderId === partnerId || m.senderHandle === partnerId

      if (isRecipientOfMsg && isSenderPartner && !m.isRead) {
        updatedCount++
        return {
          ...m,
          isRead: true,
          readAt: new Date().toISOString(),
        }
      }
      return m
    })

    if (updatedCount > 0) {
      writeMessages(updatedMessages)
    }

    return NextResponse.json({ success: true, updatedCount })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
