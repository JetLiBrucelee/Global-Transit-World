import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import { useUser } from "@clerk/react";
import { cn } from "@/lib/utils";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Message {
  id: string;
  sender: "visitor" | "admin";
  body: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  status: "open" | "closed";
}

export default function ChatWidget() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firstMsg, setFirstMsg] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill from Clerk if signed in
  useEffect(() => {
    if (user) {
      setName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
      setEmail(user.primaryEmailAddress?.emailAddress ?? "");
    }
  }, [user]);

  // Restore conversation from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("stg_chat_conv");
    if (saved) {
      try {
        const conv = JSON.parse(saved) as Conversation;
        setConversation(conv);
        setStep("chat");
      } catch {}
    }
  }, []);

  // Poll for new messages
  useEffect(() => {
    if (!conversation || !open) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API}/chat/conversations/${conversation.id}/messages`);
        if (res.ok) {
          const msgs: Message[] = await res.json();
          setMessages(msgs);
          if (!open) setUnread(msgs.filter(m => m.sender === "admin").length);
        }
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversation, open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  async function startConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !firstMsg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorName: name.trim(), visitorEmail: email.trim(), message: firstMsg.trim() }),
      });
      if (!res.ok) throw new Error();
      const conv: Conversation = await res.json();
      setConversation(conv);
      sessionStorage.setItem("stg_chat_conv", JSON.stringify(conv));
      setStep("chat");
      setFirstMsg("");
    } catch {
      alert("Failed to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !conversation || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    try {
      const res = await fetch(`${API}/chat/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages(prev => [...prev, msg]);
      }
    } catch {} finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-border z-[9999] flex flex-col overflow-hidden"
          style={{ height: 480 }}>
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">STG Support</div>
              <div className="text-white/60 text-xs">We typically reply within minutes</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {step === "form" ? (
            <form onSubmit={startConversation} className="flex flex-col gap-3 p-4 flex-1">
              <p className="text-sm text-muted-foreground">Start a conversation with our support team.</p>
              <input
                className="border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input
                type="email"
                className="border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <textarea
                className="border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="How can we help you?"
                rows={4}
                value={firstMsg}
                onChange={e => setFirstMsg(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Start Chat
              </button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground pt-6">
                    Your conversation has started. We'll reply shortly.
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.sender === "visitor" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                      msg.sender === "visitor"
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
                    )}>
                      {msg.body}
                    </div>
                  </div>
                ))}
                {conversation?.status === "closed" && (
                  <div className="text-center text-xs text-muted-foreground py-2 border-t border-border">
                    This conversation has been closed by support.
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {/* Input */}
              {conversation?.status !== "closed" && (
                <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2 bg-white">
                  <input
                    className="flex-1 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Type a message…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 right-4 sm:right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 z-[9999]"
        aria-label="Open support chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
