'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { generateId, callAIGeneric } from '@/lib/black94-utils';
import type { ChatMessage } from '@/lib/black94-types';
import { Bot, Send, Sparkles, Trash2, Loader2, User, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SUGGESTED_PROMPTS = [
  'Show latest investor agreement',
  'Create vendor NDA for TechCorp',
  'What policies exist for employees?',
  'Generate HR offer letter for new developer',
  "What's our compliance status?",
  'Summarize last board meeting',
  'Draft an email to our CA about GST filing',
  'What bank accounts do we have?',
];

export function ChatPage() {
  const { chatHistory, addChatMessage, clearChat, settings, resolutions, memory, contracts, policies, compliance, vendors, profile, addActivity } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const buildContext = () => {
    return `
Company: ${settings.companyName} (${settings.legalName}), ${settings.constitution}
GSTIN: ${settings.gstin}, State: ${settings.state}
Resolutions: ${resolutions.length} (${resolutions.slice(0, 3).map(r => r.title).join(', ') || 'None'})
Contracts: ${contracts.length} (${contracts.slice(0, 3).map(c => c.title).join(', ') || 'None'})
Policies: ${policies.length} (${policies.slice(0, 3).map(p => p.type).join(', ') || 'None'})
Memory Notes: ${memory.length} (${memory.slice(0, 3).map(m => m.title).join(', ') || 'None'})
Compliance Score: ${compliance.length > 0 ? Math.round((compliance.filter(c => c.status === 'compliant').length / compliance.length) * 100) : 100}%
Vendors: ${vendors.length}, Bank Accounts: ${profile.bankAccounts.length}
Directors: ${profile.directors.map(d => `${d.name} (${d.designation})`).join(', ') || 'None'}
Products: ${profile.products.map(p => p.name).join(', ') || 'None'}
`.trim();
  };

  const handleSend = async (message?: string) => {
    const text = message || input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: text, timestamp: new Date().toISOString() };
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const context = buildContext();
      const response = await callAIGeneric(
        `You are the AI Business Assistant for ${settings.companyName}. You have access to the company's complete data. Be helpful, concise, and professional. If the user asks about specific data, reference it accurately.

${context}

User's question: ${text}`
      );
      const assistantMsg: ChatMessage = { id: generateId(), role: 'assistant', content: response, timestamp: new Date().toISOString() };
      addChatMessage(assistantMsg);
    } catch {
      const errorMsg: ChatMessage = { id: generateId(), role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please try again.', timestamp: new Date().toISOString() };
      addChatMessage(errorMsg);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Business Assistant</h1>
            <p className="text-xs text-white/30">Powered by AI — knows your entire company</p>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { clearChat(); toast.success('Chat cleared'); }} className="text-white/30 hover:text-red-400 hover:bg-red-500/10 gap-1 text-xs">
            <Trash2 className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <Card className="flex-1 bg-white/[0.02] border-white/[0.06] flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-amber-400/60" />
              </div>
              <h2 className="text-lg font-semibold text-white/60">Your AI Corporate Brain</h2>
              <p className="text-sm text-white/30 mt-1 max-w-md">Ask me anything about your company — resolutions, contracts, compliance, vendors, or generate new documents.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg w-full">
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} onClick={() => handleSend(p)} className="text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-amber-500/10'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white/60" /> : <Bot className="w-4 h-4 text-amber-400" />}
                </div>
                <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white/10 text-white/90 rounded-br-md' : 'bg-white/[0.04] text-white/70 rounded-bl-md border border-white/[0.04]'}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === 'assistant' && (
                    <button onClick={() => handleCopy(msg.content, msg.id)} className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
                      {copied === msg.id ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy</>}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-white/[0.04] rounded-2xl rounded-bl-md px-4 py-3 border border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-amber-400/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-amber-400/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your company..."
              className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 min-h-[44px] max-h-[120px] resize-none text-sm rounded-xl"
              rows={1}
              disabled={loading}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || loading} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold h-[44px] w-[44px] p-0 rounded-xl shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-white/15 mt-2 text-center">AI has access to your company profile, resolutions, contracts, and compliance data</p>
        </div>
      </Card>
    </div>
  );
}
