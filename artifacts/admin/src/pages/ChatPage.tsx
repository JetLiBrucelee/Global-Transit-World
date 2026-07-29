import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, CheckCircle, XCircle, RefreshCw, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/admin$/, "") + "/api";

interface Conversation {
  id: string;
  visitorName: string;
  visitorEmail: string;
  status: "open" | "closed";
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  sender: "visitor" | "admin";
  body: string;
  createdAt: string;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedConv = conversations.find(c => c.id === selected) ?? null;

  async function loadConversations() {
    try {
      const data: Conversation[] = await apiFetch("/chat/conversations");
      setConversations(data);
    } catch {} finally {
      setLoadingConvs(false);
    }
  }

  async function loadMessages(convId: string) {
    try {
      const data: Message[] = await apiFetch(`/chat/conversations/${convId}/messages`);
      setMessages(data);
    } catch {}
  }

  async function markRead(convId: string) {
    try {
      await apiFetch(`/chat/conversations/${convId}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: true }),
      });
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, isRead: true } : c));
    } catch {}
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected);
    markRead(selected);
    pollRef.current = setInterval(() => loadMessages(selected), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    const body = reply.trim();
    setReply("");
    try {
      const msg: Message = await apiFetch(`/chat/conversations/${selected}/reply`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages(prev => [...prev, msg]);
    } catch {
      setReply(body);
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!selectedConv) return;
    const newStatus = selectedConv.status === "open" ? "closed" : "open";
    try {
      await apiFetch(`/chat/conversations/${selectedConv.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, status: newStatus } : c));
    } catch {}
  }

  const unreadCount = conversations.filter(c => !c.isRead && c.status === "open").length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-white">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Support Conversations</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          <button onClick={loadConversations} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loadingConvs && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingConvs && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Customer chats will appear here</p>
            </div>
          )}
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv.id)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
                selected === conv.id && "bg-slate-100",
                !conv.isRead && conv.status === "open" && "border-l-2 border-l-secondary"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!conv.isRead && conv.status === "open" && (
                      <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{conv.visitorName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{conv.visitorEmail}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant={conv.status === "open" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {conv.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat view */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Select a conversation</p>
            <p className="text-sm text-muted-foreground/60">Choose a conversation from the left to start replying</p>
          </div>
        ) : (
          <>
            {/* Conv header */}
            <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{selectedConv?.visitorName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    Started {selectedConv ? formatDistanceToNow(new Date(selectedConv.createdAt), { addSuffix: true }) : ""}
                    &nbsp;·&nbsp;{selectedConv?.visitorEmail}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleStatus}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors",
                  selectedConv?.status === "open"
                    ? "text-red-600 border-red-200 hover:bg-red-50"
                    : "text-green-600 border-green-200 hover:bg-green-50"
                )}
              >
                {selectedConv?.status === "open"
                  ? <><XCircle size={13} /> Close conversation</>
                  : <><CheckCircle size={13} /> Reopen</>
                }
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">No messages yet</div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.sender === "admin" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-xl px-4 py-2.5 text-sm",
                    msg.sender === "admin"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
                  )}>
                    <p>{msg.body}</p>
                    <p className={cn("text-[10px] mt-1", msg.sender === "admin" ? "text-white/60" : "text-muted-foreground")}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            {selectedConv?.status === "open" ? (
              <form onSubmit={sendReply} className="bg-white border-t border-border p-4 flex gap-3">
                <input
                  className="flex-1 border border-input rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Type your reply…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </form>
            ) : (
              <div className="bg-white border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
                This conversation is closed. Reopen it to reply.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
