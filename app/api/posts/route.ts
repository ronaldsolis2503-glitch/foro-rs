import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File path for central server-side persistent database
const DATA_DIR = path.join(process.cwd(), '.data')
const POSTS_FILE = path.join(DATA_DIR, 'public_posts.json')

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([]), 'utf-8')
  }
}

function readPosts(): any[] {
  ensureDataDirectory()
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

function writePosts(posts: any[]) {
  ensureDataDirectory()
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8')
}

// GET /api/posts - Fetch all public posts for all users
export async function GET() {
  const posts = readPosts()
  return NextResponse.json(posts)
}

// POST /api/posts - Publish a new public post for everyone to see
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const posts = readPosts()

    const newPost = {
      id: body.id || Date.now(),
      type: body.type || 'Preguntas',
      name: body.name || 'Creador',
      handle: body.handle || '@creador',
      initials: body.initials || 'CR',
      tone: body.tone || 'from-fuchsia-500 to-orange-400',
      time: 'Hace un momento',
      title: body.title,
      text: body.text,
      imageUrl: body.imageUrl || null,
      tags: body.tags || '#filmmaking',
      likes: 0,
      likedBy: [],
      commentsList: [],
      gradient: body.gradient || 'from-indigo-950 via-purple-800 to-fuchsia-700',
      authorProfile: body.authorProfile || null,
      createdAt: new Date().toISOString(),
    }

    const updated = [newPost, ...posts]
    writePosts(updated)

    return NextResponse.json({ success: true, posts: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE /api/posts - Remove a post centrally ONLY if the requester is the owner
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get('id')
    const userId = searchParams.get('userId')
    const userHandle = searchParams.get('userHandle')

    if (!idParam) return NextResponse.json({ error: 'Missing post id' }, { status: 400 })

    const postId = Number(idParam)
    const posts = readPosts()

    const targetPost = posts.find((p: any) => p.id === postId)
    if (!targetPost) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 })
    }

    // Strict Ownership Enforcement: Only the author/owner can delete their post
    const isOwner =
      (userId && targetPost.authorProfile?.id === userId) ||
      (userHandle && targetPost.handle === userHandle) ||
      (userHandle && targetPost.authorProfile?.handle === userHandle)

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Solo el dueño de la publicación puede eliminarla' },
        { status: 403 }
      )
    }

    const updated = posts.filter((p: any) => p.id !== postId)
    writePosts(updated)

    return NextResponse.json({ success: true, posts: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
