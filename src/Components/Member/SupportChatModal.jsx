import { useEffect, useRef, useState } from "react";
import { db } from "../../firebase";
import { onValue, orderByChild, limitToLast, push, query, ref } from "firebase/database";

export default function SupportChatModal({ open, onClose, uid }) {
  const [messages, setMessages] = useState([
    { role: 'system', text: 'Hi! This is a placeholder AI assistant. Ask anything about your maintenance.' }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const endpoint = import.meta.env.VITE_SUPPORT_CHAT_ENDPOINT;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Subscribe to chat thread for this user
  useEffect(() => {
    if (!open || !uid) return;
    const messagesRef = ref(db, `supportChats/${uid}/messages`);
    const q = query(messagesRef, orderByChild('createdAt'), limitToLast(50));
    const off = onValue(q, (snap) => {
      const val = snap.val() || {};
      const list = Object.values(val).sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
      if (list.length) setMessages(list);
    });
    return () => off();
  }, [open, uid]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    if (!uid) return;
    setSending(true);
    setInput("");
    const messagesRef = ref(db, `supportChats/${uid}/messages`);
    const createdAt = Date.now();
    // push user message
    await push(messagesRef, { role: 'user', text, createdAt });

    // Try optional AI endpoint if configured
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            message: text,
            history: messages.map(m => ({ role: m.role, content: m.text }))
          })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = (data && (data.reply || data.message || data.text)) || 'Thanks! A real AI will respond here soon.';
          await push(messagesRef, { role: 'assistant', text: reply, createdAt: Date.now() });
        } else {
          await push(messagesRef, { role: 'assistant', text: 'Assistant is temporarily unavailable. Please try again.', createdAt: Date.now() });
        }
      } catch {
        await push(messagesRef, { role: 'assistant', text: 'Network error reaching assistant. Please try again later.', createdAt: Date.now() });
      } finally {
        setSending(false);
      }
      return;
    }

    // Fallback: simple auto-reply
    await push(messagesRef, { role: 'assistant', text: 'Thanks! A real AI will respond here soon.', createdAt: Date.now() + 1 });
    setSending(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-md shadow p-4 text-white bg-[#1f2937] border border-[#374151]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">AI Support Chat</div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        <div className="h-64 overflow-y-auto space-y-2 p-2 bg-[#0f172a] rounded">
          {messages.map((m, i) => (
            <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-blue-600' : 'bg-[#2a3340]'}`}>{m.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={2} className="flex-1 rounded-md bg-[#0f172a] border border-[#374151] p-2 text-sm" placeholder="Type your message..." />
          <button onClick={send} disabled={sending} className="px-4 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white">{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
