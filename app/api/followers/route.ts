import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const FOLLOWERS_FILE = path.join(DATA_DIR, 'followers_relationships.json')

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(FOLLOWERS_FILE)) {
    fs.writeFileSync(FOLLOWERS_FILE, JSON.stringify([]), 'utf-8')
  }
}

function readFollowers(): any[] {
  ensureDataDirectory()
  try {
    return JSON.parse(fs.readFileSync(FOLLOWERS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeFollowers(followers: any[]) {
  ensureDataDirectory()
  fs.writeFileSync(FOLLOWERS_FILE, JSON.stringify(followers, null, 2), 'utf-8')
}

// GET /api/followers?followerId=...&targetUserId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const followerId = searchParams.get('followerId')
  const targetUserId = searchParams.get('targetUserId')

  const all = readFollowers()

  if (followerId && targetUserId) {
    const isFollowing = all.some(
      (f: any) => f.followerId === followerId && f.targetUserId === targetUserId
    )
    const followersCount = all.filter((f: any) => f.targetUserId === targetUserId).length
    return NextResponse.json({ isFollowing, followersCount })
  }

  if (targetUserId) {
    const followersCount = all.filter((f: any) => f.targetUserId === targetUserId).length
    return NextResponse.json({ followersCount })
  }

  return NextResponse.json(all)
}

// POST /api/followers - Toggle Follow/Unfollow
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { followerId, followerName, followerHandle, followerInitials, followerTone, targetUserId } = body

    if (!followerId || !targetUserId) {
      return NextResponse.json({ error: 'Faltan IDs de usuario' }, { status: 400 })
    }

    let all = readFollowers()
    const existingIndex = all.findIndex(
      (f: any) => f.followerId === followerId && f.targetUserId === targetUserId
    )

    let isFollowing = false

    if (existingIndex >= 0) {
      // Unfollow
      all.splice(existingIndex, 1)
      isFollowing = false
    } else {
      // Follow
      const newFollow = {
        id: `flw-${Date.now()}`,
        followerId,
        followerName,
        followerHandle,
        targetUserId,
        createdAt: new Date().toISOString(),
      }
      all.push(newFollow)
      isFollowing = true

      // Create persistent notification for target user
      const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json')
      let notifs: any[] = []
      try {
        if (fs.existsSync(NOTIFICATIONS_FILE)) {
          notifs = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'))
        }
      } catch {}

      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientId: targetUserId,
        actorId: followerId,
        actorName: followerName || 'Creador',
        actorHandle: followerHandle || '@creador',
        actorInitials: followerInitials || 'RS',
        actorTone: followerTone || 'from-amber-400 to-yellow-600',
        type: 'NEW_FOLLOWER',
        entityType: 'USER',
        entityId: followerId,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      notifs.unshift(newNotif)
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2), 'utf-8')
    }

    writeFollowers(all)
    const followersCount = all.filter((f: any) => f.targetUserId === targetUserId).length

    return NextResponse.json({ isFollowing, followersCount })
  } catch (err) {
    return NextResponse.json({ error: 'Error procesando seguimiento' }, { status: 500 })
  }
}
