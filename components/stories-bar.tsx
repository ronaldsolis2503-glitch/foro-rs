'use client'

import { useState } from 'react'
import { Plus, Sparkles, X, Heart, Eye, Crown } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export type StoryItem = {
  id: string
  creatorName: string
  creatorHandle: string
  creatorInitials: string
  avatarTone: string
  title: string
  imageUrl: string
  timeAgo: string
  views: number
}

export function StoriesBar() {
  const { user, isAuthenticated, openAuthModal } = useAuth()
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null)

  const demoStories: StoryItem[] = [
    {
      id: 'story-1',
      creatorName: 'Sofía Ramírez',
      creatorHandle: '@sofiar',
      creatorInitials: 'SR',
      avatarTone: 'from-amber-400 to-yellow-600',
      title: 'Prueba de exposición S-Log3 en exteror 4K',
      imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'Hace 2h',
      views: 342,
    },
    {
      id: 'story-2',
      creatorName: 'Carlos Mendoza',
      creatorHandle: '@carlosm',
      creatorInitials: 'CM',
      avatarTone: 'from-amber-500 to-yellow-500',
      title: 'Graduación de color DaVinci Node Tree',
      imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'Hace 4h',
      views: 518,
    },
    {
      id: 'story-3',
      creatorName: 'Laura Gómez',
      creatorHandle: '@laurag',
      creatorInitials: 'LG',
      avatarTone: 'from-yellow-400 to-amber-600',
      title: 'Detrás de cámaras rodaje comercial 4K',
      imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'Hace 6h',
      views: 890,
    },
    {
      id: 'story-4',
      creatorName: 'Mateo Peña',
      creatorHandle: '@mateop',
      creatorInitials: 'MP',
      avatarTone: 'from-amber-300 to-yellow-500',
      title: 'Prueba de lente Sigma Cine 35mm T1.5',
      imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'Hace 8h',
      views: 215,
    },
  ]

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {/* Add Story Button */}
        <button
          onClick={() => {
            if (!isAuthenticated) openAuthModal('login')
          }}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div className="relative grid size-14 place-items-center rounded-full bg-zinc-900 border-2 border-dashed border-amber-400/60 p-0.5 group-hover:scale-105 transition">
            <div className="grid size-full place-items-center rounded-full bg-zinc-850 text-amber-400 font-bold">
              <Plus className="size-5" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400">Tu historia</span>
        </button>

        {/* Stories List */}
        {demoStories.map(story => (
          <button
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-1.5 shrink-0 group text-left"
          >
            <div className="rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 group-hover:scale-105 transition shadow-lg shadow-amber-500/10">
              <div className={`grid size-13 place-items-center rounded-full bg-gradient-to-br ${story.avatarTone} font-bold text-xs text-black ring-2 ring-black`}>
                {story.creatorInitials}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-zinc-200 truncate max-w-16">
              {story.creatorName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-black border border-amber-500/30 shadow-2xl flex flex-col h-[75vh]">
            {/* Top Progress Bar */}
            <div className="absolute top-3 inset-x-4 z-20 flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full bg-amber-400 animate-pulse" />
              </div>
            </div>

            {/* Story Header */}
            <div className="absolute top-6 inset-x-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`grid size-8 place-items-center rounded-full bg-gradient-to-br ${activeStory.avatarTone} text-xs font-bold text-black ring-1 ring-amber-400`}>
                  {activeStory.creatorInitials}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{activeStory.creatorName}</p>
                  <p className="text-[10px] text-zinc-300">{activeStory.timeAgo}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveStory(null)}
                className="grid size-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition border border-amber-500/30"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Story Image */}
            <div className="relative flex-1 bg-zinc-950">
              <img
                src={activeStory.imageUrl}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

              {/* Title & Views Overlay */}
              <div className="absolute bottom-6 inset-x-4 z-20">
                <p className="font-serif text-lg font-bold text-white leading-snug">
                  {activeStory.title}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5 text-amber-400" /> {activeStory.views} visualizaciones
                  </span>
                  <button className="flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md hover:bg-amber-400/30 transition">
                    <Heart className="size-3.5 text-amber-400 fill-amber-400" /> Reaccionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
