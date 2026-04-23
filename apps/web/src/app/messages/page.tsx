'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/auth/login'); return; }

    Promise.all([
      api.getMe(token).catch(() => null),
      api.getConversations(token).catch(() => ({ items: [] })),
    ]).then(([me, convs]) => {
      if (!me) { router.push('/auth/login'); return; }
      setUserId(me.id);
      setConversations(convs.items || convs || []);
      setLoading(false);
    });
  }, [router]);

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const data = await api.getMessages(conv.id, token);
      setMessages(data.items || data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSending(true);
    try {
      const msg = await api.sendMessage(activeConv.id, newMsg.trim(), token);
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
      // Update last message in sidebar
      setConversations(prev =>
        prev.map(c => c.id === activeConv.id
          ? { ...c, lastMessage: msg, updatedAt: new Date().toISOString() }
          : c
        )
      );
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
    setSending(false);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">Yuklanir...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mesajlar</h1>

      <div className="border rounded-lg overflow-hidden flex" style={{ height: '70vh' }}>
        {/* Conversations sidebar */}
        <div className={`w-full sm:w-80 border-r flex-shrink-0 overflow-y-auto bg-white ${activeConv ? 'hidden sm:block' : ''}`}>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Hala hec bir mesaj yoxdur</div>
          ) : (
            conversations.map(conv => {
              const other = conv.buyer?.id === userId ? conv.seller : conv.buyer;
              const isActive = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${isActive ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-medium text-sm flex-shrink-0">
                      {(other?.profile?.firstName?.[0] || other?.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {other?.profile?.firstName || other?.email?.split('@')[0] || 'Istifadaci'}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(conv.updatedAt)}
                        </span>
                      </div>
                      {conv.listing && (
                        <p className="text-xs text-red-600 truncate">
                          {conv.listing.brandName} {conv.listing.modelName}
                        </p>
                      )}
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {conv.lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Mesaj oxumaq ucun sohbat secin
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="border-b px-4 py-3 flex items-center gap-3 bg-white">
                <button
                  onClick={() => setActiveConv(null)}
                  className="sm:hidden text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="font-medium text-sm">
                    {(() => {
                      const other = activeConv.buyer?.id === userId ? activeConv.seller : activeConv.buyer;
                      return other?.profile?.firstName || other?.email?.split('@')[0] || 'Istifadaci';
                    })()}
                  </p>
                  {activeConv.listing && (
                    <p className="text-xs text-gray-400">
                      {activeConv.listing.brandName} {activeConv.listing.modelName} - {Number(activeConv.listing.price).toLocaleString()} {activeConv.listing.currency}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg: any) => {
                  const isMine = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMine
                          ? 'bg-red-600 text-white rounded-br-md'
                          : 'bg-white border rounded-bl-md'
                      }`}>
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-red-200' : 'text-gray-300'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="border-t p-3 flex gap-2 bg-white">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Mesaj yazin..."
                  className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-red-300"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMsg.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  Gonder
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Dunən';
  if (diffDays < 7) return d.toLocaleDateString('az-AZ', { weekday: 'short' });
  return d.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
}
