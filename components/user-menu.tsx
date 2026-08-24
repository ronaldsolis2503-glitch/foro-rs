'use client'

import React, { useState, useRef, useEffect } from 'react'
import { LogIn, LogOut, User, Settings, Star, ChevronDown, UserPlus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

function Avatar({ initials, tone, small = false }: { initials: string; tone: string; small?: boolean }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${tone} font-semibold text-white ring-2 ring-background ${
        small ? 'size-9 text-[11px]' : 'size-11 text-sm'
      }`}
    >
      {initials}
    </div>
  )
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, isAuthenticated, openAuthModal, openProfileModal, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openAuthModal('login')}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
        >
          <LogIn className="size-3.5" /> Iniciar sesión
        </button>
        <button
          onClick={() => openAuthModal('register')}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/20 hover:opacity-90 transition"
        >
          <UserPlus className="size-3.5" /> Registrarse
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 rounded-full ring-2 ring-fuchsia-500/30 transition hover:ring-fuchsia-500"
          aria-label="Menú de usuario"
        >
          <Avatar initials={user.initials} tone={user.avatarTone} small />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-border bg-card p-2 shadow-xl ring-1 ring-border/50">
            <div className="flex items-center gap-3 border-b border-border p-3">
              <Avatar initials={user.initials} tone={user.avatarTone} small />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{user.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.handle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-0.5 p-1">
              <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-foreground">
                <span>Reputación</span>
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="size-3 fill-current" /> {user.reputation}
                </span>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false)
                  openProfileModal()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition"
              >
                <User className="size-4 text-fuchsia-500" /> Mi Perfil Real
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition"
              >
                <Settings className="size-4" /> Configuración
              </button>

              <div className="my-1 border-t border-border" />

              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="size-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        onClick={() => openProfileModal()}
        className="flex w-full items-center justify-between rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Avatar initials={user.initials} tone={user.avatarTone} small />
          <div className="text-left">
            <p className="text-sm font-semibold truncate max-w-[130px]">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[130px]">{user.role}</p>
          </div>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
    </div>
  )
}
