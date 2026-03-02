"use client";

import { useState } from "react";
import { Bell, Send, Users, User, Zap, ShoppingCart, Truck } from "lucide-react";

interface Template {
  icon:  React.ReactNode;
  label: string;
  title: string;
  body:  string;
  url:   string;
  tag:   string;
}

const TEMPLATES: Template[] = [
  {
    icon:  <Truck className="w-4 h-4" />,
    label: "Out for Delivery",
    title: "Your order is out for delivery! 🛵",
    body:  "Your FreshCart order is on its way. Track it in the app.",
    url:   "/orders",
    tag:   "delivery",
  },
  {
    icon:  <Zap className="w-4 h-4" />,
    label: "Flash Sale",
    title: "⚡ Flash Sale — Up to 30% OFF!",
    body:  "Hurry! Limited-time deals on fresh fruits & vegetables. Shop now.",
    url:   "/",
    tag:   "flash-sale",
  },
  {
    icon:  <ShoppingCart className="w-4 h-4" />,
    label: "Weekly Reminder",
    title: "🛒 Time to restock your groceries!",
    body:  "Your weekly essentials await. Free delivery on orders above ₹499.",
    url:   "/",
    tag:   "weekly-reminder",
  },
];

export default function AdminPushPage() {
  const [title,          setTitle]          = useState("");
  const [body,           setBody]           = useState("");
  const [url,            setUrl]            = useState("/");
  const [targetAll,      setTargetAll]      = useState(true);
  const [targetUserId,   setTargetUserId]   = useState("");
  const [sending,        setSending]        = useState(false);
  const [result,         setResult]         = useState<{ sent: number; failed: number } | null>(null);
  const [error,          setError]          = useState<string | null>(null);

  function applyTemplate(t: Template) {
    setTitle(t.title);
    setBody(t.body);
    setUrl(t.url);
    setResult(null);
    setError(null);
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/push", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title,
          body,
          url:          url || "/",
          targetUserId: targetAll ? undefined : targetUserId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ sent: data.sent, failed: data.failed });
      } else {
        setError(data.error ?? "Failed to send notifications");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          Push Notifications
        </h1>
        <p className="text-muted text-sm mt-1">
          Send notifications to subscribed users via Web Push
        </p>
      </div>

      {/* Templates */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Quick Templates
        </p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.tag}
              onClick={() => applyTemplate(t)}
              className="card p-3 text-left hover:border-primary transition-colors group"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-muted
                               group-hover:text-primary mb-1">
                {t.icon} {t.label}
              </span>
              <p className="text-xs text-dark line-clamp-2 leading-tight">{t.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-dark mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="input w-full"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-1.5">Body *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message"
            rows={3}
            className="input w-full resize-none"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-1.5">
            Link URL (optional)
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/orders, /search, /"
            className="input w-full font-mono text-sm"
          />
        </div>

        {/* Target */}
        <div>
          <p className="text-sm font-semibold text-dark mb-2">Target</p>
          <div className="flex gap-3">
            <button
              onClick={() => setTargetAll(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium
                          transition-colors
                          ${targetAll
                            ? "bg-primary text-white border-primary"
                            : "bg-white dark:bg-gray-800 text-muted border-border hover:border-primary"}`}
            >
              <Users className="w-4 h-4" /> All Users
            </button>
            <button
              onClick={() => setTargetAll(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium
                          transition-colors
                          ${!targetAll
                            ? "bg-primary text-white border-primary"
                            : "bg-white dark:bg-gray-800 text-muted border-border hover:border-primary"}`}
            >
              <User className="w-4 h-4" /> Specific User
            </button>
          </div>

          {!targetAll && (
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="MongoDB User ID"
              className="input w-full mt-3 font-mono text-sm"
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-success">
              ✅ Sent to {result.sent} device{result.sent !== 1 ? "s" : ""}
              {result.failed > 0 && (
                <span className="text-muted font-normal ml-2">
                  ({result.failed} expired subscription{result.failed !== 1 ? "s" : ""} removed)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {sending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
            : <><Send className="w-4 h-4" /> Send Notification</>
          }
        </button>
      </div>
    </div>
  );
}
