'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, User, ShieldCheck, CheckCheck, RefreshCw, Crown, Search, Users, MessageSquare, AlertCircle, Check } from 'lucide-react'
import { useAuth, UserProfile, getUserAvatarUrl } from '@/lib/auth-context'

export type PrivateMessage = {
  id: string
  senderId: string
  senderName: string
  senderHandle: string
  senderInitials?: string
  senderTone?: string
  receiverId?: string
  recipientId?: string
  receiverName?: string
  recipientName?: string
  receiverHandle?: string
  receiverInitials?: string
  receiverTone?: string
  text: string
  timestamp: string
  isRead?: boolean
  readAt?: string | null
}

export function PrivateChatModal({
  isOpen,
  onClose,
  targetUser
}: {
  isOpen: boolean
  onClose: () => void
  targetUser?: Partial<UserProfile> | null
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [friendsList, setFriendsList] = useState<Partial<UserProfile>[]>([])
  const [relationshipStatus, setRelationshipStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [relationshipRequesterId, setRelationshipRequesterId] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)

  const [activePartner, setActivePartner] = useState<Partial<UserProfile>>({
    id: targetUser?.id || 'usr-sofia',
    name: targetUser?.name || 'Sofía Ramírez',
    handle: targetUser?.handle || '@sofiar',
    initials: targetUser?.initials || 'SR',
    avatarTone: targetUser?.avatarTone || 'from-amber-400 to-yellow-600',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (targetUser && targetUser.id) {
      setActivePartner(targetUser)
    }
  }, [targetUser])

  // Fetch real accepted friends list for the active user
  const fetchFriends = async () => {
    if (!user || !isOpen) return
    try {
      const res = await fetch(`/api/friends?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          const acceptedFriends: Partial<UserProfile>[] = data
            .filter((r: any) => r.status === 'accepted')
            .map((r: any) => {
              const isRequester = r.requesterId === user.id
              return {
                id: isRequester ? r.recipientId : r.requesterId,
                name: isRequester ? r.recipientName : r.requesterName,
                handle: isRequester ? r.recipientHandle : r.requesterHandle,
                initials: (isRequester ? r.recipientName : r.requesterName)?.slice(0, 2)?.toUpperCase() || 'RS',
                avatarTone: 'from-amber-400 to-yellow-600',
              }
            })
          setFriendsList(acceptedFriends)
        }
      }
    } catch (err) {
      console.error('Error fetching friends list:', err)
    }
  }

  // Check relationship status with active partner
  const fetchRelationshipStatus = async () => {
    if (!user || !activePartner.id) return
    try {
      const res = await fetch(`/api/friends?userId=${user.id}&targetUserId=${activePartner.id}`)
      if (res.ok) {
        const data = await res.json()
        setRelationshipStatus(data.status || 'none')
        if (data.relationship) {
          setRelationshipRequesterId(data.relationship.requesterId)
        }
      }
    } catch (err) {
      console.error('Error fetching relationship status:', err)
    }
  }

  const markMessagesAsRead = async () => {
    if (!user || !activePartner.id) return
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          partnerId: activePartner.id,
        }),
      })
    } catch {}
  }

  const fetchMessages = async () => {
    if (!user || !activePartner.id) return
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&partnerId=${activePartner.id}`)
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs: PrivateMessage[] = data.messages || []
        setMessages(fetchedMsgs)

        // If there are unread messages sent TO the active user in this thread, mark them as read
        const hasUnreadFromPartner = fetchedMsgs.some(
          m => (m.senderId === activePartner.id || m.senderHandle === activePartner.handle) && !m.isRead
        )
        if (hasUnreadFromPartner) {
          markMessagesAsRead()
        }
      }
    } catch (err) {
      console.error('Error fetching private messages:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
      fetchRelationshipStatus()
      fetchMessages()

      const interval = setInterval(() => {
        fetchMessages()
        fetchRelationshipStatus()
      }, 2500)

      return () => clearInterval(interval)
    }
  }, [isOpen, user, activePartner.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !activePartner.id) return

    // If no relationship exists yet, auto-create a communication request
    if (relationshipStatus === 'none') {
      try {
        await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterId: user.id,
            requesterName: user.name,
            requesterHandle: user.handle,
            requesterInitials: user.initials,
            requesterTone: user.avatarTone,
            recipientId: activePartner.id,
            action: 'request',
          }),
        })
        setRelationshipStatus('pending')
        setRelationshipRequesterId(user.id)
      } catch (err) {
        console.error('Error initiating connection request:', err)
      }
    }

    const newMessageData = {
      senderId: user.id,
      senderName: user.name,
      senderHandle: user.handle,
      senderInitials: user.initials,
      senderTone: user.avatarTone,
      receiverId: activePartner.id,
      recipientId: activePartner.id,
      receiverName: activePartner.name || 'Creador',
      recipientName: activePartner.name || 'Creador',
      receiverHandle: activePartner.handle || '@creador',
      receiverInitials: activePartner.initials || 'CR',
      receiverTone: activePartner.avatarTone || 'from-amber-400 to-yellow-600',
      text: inputText.trim(),
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessageData),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setInputText('')
      }
    } catch (err) {
      console.error('Error sending private message:', err)
    }
  }

  const handleAcceptCommunication = async () => {
    if (!user || !activePartner.id) return
    setLoadingAction(true)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          recipientId: activePartner.id,
          action: 'accept',
        }),
      })
      if (res.ok) {
        setRelationshipStatus('accepted')
        fetchFriends()
      }
    } catch (err) {
      console.error('Error accepting communication:', err)
    } finally {
      setLoadingAction(false)
    }
  }

  if (!isOpen) return null

  const filteredFriends = friendsList.filter(f =>
    f.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.handle?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const isIncomingPendingRequest = relationshipStatus === 'pending' && relationshipRequesterId !== user?.id
  const isOutgoingPendingRequest = relationshipStatus === 'pending' && relationshipRequesterId === user?.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl flex h-[80vh]">
        {/* Left Column: Friends List */}
        <div className="w-72 sm:w-80 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Amigos Agregados</h3>
            </div>
            <span className="rounded-full bg-amber-400/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {friendsList.length} amigos
            </span>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-zinc-800/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Buscar en amigos..."
                className="w-full rounded-xl bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white outline-none ring-1 ring-zinc-800 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Friends List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
            {filteredFriends.length > 0 ? (
              filteredFriends.map(friend => {
                const isActive = friend.id === activePartner.id
                return (
                  <button
                    key={friend.id}
                    onClick={() => setActivePartner(friend)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition hover:bg-zinc-900 ${
                      isActive ? 'bg-amber-400/10 border-l-4 border-l-amber-400' : 'bg-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={getUserAvatarUrl(friend)}
                        alt={friend.name}
                        className="size-10 rounded-full object-cover ring-1 ring-amber-400"
                      />
                      <div className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs text-white truncate">{friend.name}</p>
                        <span className="text-[9px] text-emerald-400 font-bold">Amigos</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{friend.handle}</p>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs italic">
                Aún no tienes amigos agregados. Envía o acepta solicitudes de comunicación.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation & Permission Banner */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-black/60">
            <div className="flex items-center gap-3">
              <img
                src={getUserAvatarUrl(activePartner)}
                alt={activePartner.name}
                className="size-10 rounded-full object-cover ring-1 ring-amber-400 shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">{activePartner.name}</h3>
                  <ShieldCheck className="size-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-amber-400 font-semibold">{activePartner.handle} · Chat Privado</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition border border-amber-500/30"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Incoming Permission Request Banner */}
          {isIncomingPendingRequest && (
            <div className="bg-amber-400/10 border-b border-amber-500/30 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertCircle className="size-4 text-amber-400 shrink-0" />
                <span>{activePartner.name} quiere comunicarse contigo mediante chat privado.</span>
              </div>
              <button
                disabled={loadingAction}
                onClick={handleAcceptCommunication}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-3.5 py-1.5 text-xs font-bold text-black shadow-md hover:opacity-90 transition"
              >
                <Check className="size-3.5" /> Permitir y Agregar Amigo
              </button>
            </div>
          )}

          {/* Outgoing Pending Request Banner */}
          {isOutgoingPendingRequest && (
            <div className="bg-zinc-850 border-b border-zinc-800 p-3 text-xs text-zinc-400 flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400 shrink-0" />
              <span>Solicitud de comunicación enviada. Esperando que {activePartner.name} permita el contacto...</span>
            </div>
          )}

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-zinc-950/80">
            {messages.length > 0 ? (
              messages.map(msg => {
                const isMine = msg.senderId === user?.id
                const senderDisplayName = isMine ? user?.name : (msg.senderName || activePartner.name)
                const senderDisplayHandle = isMine ? user?.handle : (msg.senderHandle || activePartner.handle)

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    {!isMine && (
                      <span className="text-[10px] font-bold text-amber-400 mb-0.5 px-1">
                        {senderDisplayName} ({senderDisplayHandle})
                      </span>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-md leading-relaxed ${
                        isMine
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-semibold'
                          : 'bg-zinc-800 text-white border border-zinc-700'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500 px-1">
                      <span>{msg.timestamp}</span>
                      {isMine && (
                        msg.isRead ? (
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <CheckCheck className="size-3" /> Visto
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-zinc-500 font-medium">
                            <Check className="size-3" /> Enviado
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="m-auto text-center text-zinc-500 text-xs italic py-8 max-w-sm">
                <Sparkles className="mx-auto size-6 text-amber-400 mb-2 opacity-60" />
                Inicia una conversación privada con {activePartner.name}. Se le enviará una notificación para que permita el contacto.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-zinc-800 bg-black/60 flex items-center gap-2">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendMessage()
              }}
              placeholder={`Enviar mensaje privado a ${activePartner.name}...`}
              className="flex-1 rounded-xl bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none ring-1 ring-amber-500/30 focus:ring-amber-400"
            />
            <button
              onClick={handleSendMessage}
              className="grid size-9 place-items-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-bold hover:opacity-90 transition shadow-md shrink-0"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
