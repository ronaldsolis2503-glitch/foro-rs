import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const FRIENDS_FILE = path.join(DATA_DIR, 'friends_relationships.json')
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json')

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(FRIENDS_FILE)) {
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify([]), 'utf-8')
  }
}

function readRelationships(): any[] {
  ensureDataDirectory()
  try {
    return JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeRelationships(relationships: any[]) {
  ensureDataDirectory()
  fs.writeFileSync(FRIENDS_FILE, JSON.stringify(relationships, null, 2), 'utf-8')
}

// GET /api/friends?userId=...&targetUserId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const targetUserId = searchParams.get('targetUserId')

  const all = readRelationships()

  if (userId && targetUserId) {
    const existing = all.find(
      (r: any) =>
        (r.requesterId === userId && r.recipientId === targetUserId) ||
        (r.requesterId === targetUserId && r.recipientId === userId)
    )
    if (existing) {
      return NextResponse.json({ status: existing.status, relationship: existing })
    }
    return NextResponse.json({ status: 'none' })
  }

  if (!userId) return NextResponse.json(all)

  const userRelationships = all.filter(
    (r: any) => r.requesterId === userId || r.recipientId === userId
  )
  return NextResponse.json(userRelationships)
}

// POST /api/friends - Send or Accept a Friend / Connection Request
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, requesterId, requesterName, requesterHandle, requesterInitials, requesterTone, recipientId, recipientName, recipientHandle, targetUserId } = body

    const reqId = requesterId || body.userId
    const recId = recipientId || targetUserId

    if (!reqId || !recId) {
      return NextResponse.json({ error: 'Faltan parámetros de usuarios' }, { status: 400 })
    }

    const all = readRelationships()

    if (action === 'request') {
      const existing = all.find(
        (r: any) =>
          (r.requesterId === reqId && r.recipientId === recId) ||
          (r.requesterId === recId && r.recipientId === reqId)
      )

      if (existing) {
        return NextResponse.json({ success: true, status: existing.status, relationship: existing, all })
      }

      const newRequest = {
        id: `rel-${Date.now()}`,
        requesterId: reqId,
        requesterName: requesterName || 'Creador',
        requesterHandle: requesterHandle || '@creador',
        recipientId: recId,
        recipientName: recipientName || 'Creador Target',
        recipientHandle: recipientHandle || '@target',
        status: 'pending', // 'pending' | 'accepted'
        type: 'message_and_friend',
        createdAt: new Date().toISOString(),
      }

      const updated = [...all, newRequest]
      writeRelationships(updated)

      // Create persistent notification for recipient
      let notifs: any[] = []
      try {
        if (fs.existsSync(NOTIFICATIONS_FILE)) {
          notifs = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'))
        }
      } catch {}

      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientId: recId,
        actorId: reqId,
        actorName: requesterName || 'Creador',
        actorHandle: requesterHandle || '@creador',
        actorInitials: requesterInitials || 'RS',
        actorTone: requesterTone || 'from-amber-400 to-yellow-600',
        type: 'FRIEND_REQUEST',
        entityType: 'USER',
        entityId: reqId,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      notifs.unshift(newNotif)
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2), 'utf-8')

      return NextResponse.json({ success: true, status: 'pending', relationship: newRequest, all: updated })
    }

    if (action === 'accept') {
      const updated = all.map((r: any) => {
        if (
          (r.requesterId === reqId && r.recipientId === recId) ||
          (r.requesterId === recId && r.recipientId === reqId)
        ) {
          return { ...r, status: 'accepted' }
        }
        return r
      })

      writeRelationships(updated)
      return NextResponse.json({ success: true, status: 'accepted', all: updated })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Error procesando solicitud de amistad' }, { status: 500 })
  }
}
