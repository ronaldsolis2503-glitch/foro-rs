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

// POST /api/posts/like - Toggle like on a post centrally
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { postId, userId } = body

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros: postId o userId' }, { status: 400 })
    }

    const posts = readPosts()
    const targetPostId = Number(postId)

    const updated = posts.map((p: any) => {
      if (p.id === targetPostId) {
        const likedBy: string[] = p.likedBy || []
        const userHasLiked = likedBy.includes(userId)

        const newLikedBy = userHasLiked
          ? likedBy.filter((id) => id !== userId)
          : [...likedBy, userId]

        const newLikesCount = Math.max(0, newLikedBy.length)

        return {
          ...p,
          likes: newLikesCount,
          likedBy: newLikedBy,
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
