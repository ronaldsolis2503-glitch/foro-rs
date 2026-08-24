import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const POSTS_FILE = path.join(DATA_DIR, 'public_posts.json')

function readPosts(): any[] {
  if (!fs.existsSync(POSTS_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writePosts(posts: any[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8')
}

// POST /api/posts/comment - Add a public general or specific comment centrally
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      postId,
      commentText,
      authorName,
      authorHandle,
      authorInitials,
      authorTone,
      replyToId,
      replyToHandle,
      replyToName
    } = body

    if (!postId || !commentText) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const posts = readPosts()
    const newComment = {
      id: `comment-${Date.now()}`,
      authorName: authorName || 'Creador',
      authorHandle: authorHandle || '@creador',
      authorInitials: authorInitials || 'CR',
      authorTone: authorTone || 'from-fuchsia-500 to-orange-400',
      text: commentText,
      time: 'Hace un momento',
      replyToId: replyToId || null,
      replyToHandle: replyToHandle || null,
      replyToName: replyToName || null,
    }

    const updated = posts.map((p: any) => {
      if (p.id === Number(postId)) {
        return {
          ...p,
          commentsList: [...(p.commentsList || []), newComment],
        }
      }
      return p
    })

    writePosts(updated)
    return NextResponse.json({ success: true, posts: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE /api/posts/comment - Remove a comment centrally
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = Number(searchParams.get('postId'))
    const commentId = searchParams.get('commentId')

    if (!postId || !commentId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const posts = readPosts()
    const updated = posts.map((p: any) => {
      if (p.id === postId) {
        return {
          ...p,
          commentsList: (p.commentsList || []).filter((c: any) => c.id !== commentId),
        }
      }
      return p
    })

    writePosts(updated)
    return NextResponse.json({ success: true, posts: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
