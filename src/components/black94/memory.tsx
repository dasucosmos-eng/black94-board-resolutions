'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, callAIGeneric, MEMORY_CATEGORIES, formatDate } from '@/lib/black94-utils';
import type { MemoryEntry } from '@/lib/black94-types';
import { Brain, Plus, Trash2, Search, Filter, Sparkles, Loader2, Calendar, Tag, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function MemoryPage() {
  const { memory, addMemory, updateMemory, deleteMemory, callAIGeneric, addActivity } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [aiSearch, setAiSearch] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'General Notes', content: '', tags: '' });

  const filtered = useMemo(() => memory.filter(m => {
    if (filterCat !== 'all' && m.category !== filterCat) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.content.toLowerCase().includes(search.toLowerCase()) && !m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [memory, filterCat, search]);

  const handleSave = () => {
    if (!form.title || !form.content) { toast.error('Fill in required fields'); return; }
    const entry: MemoryEntry = {
      id: generateId(), title: form.title, category: form.category, content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addMemory(entry);
    addActivity('Memory Added', `"${form.title}"`, 'memory');
    toast.success('Memory entry saved');
    setForm({ title: '', category: 'General Notes', content: '', tags: '' });
    setShowForm(false);
  };

  const handleAiSearch = async () => {
    if (!aiSearch.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const memoryContext = memory.map(m => `[${m.category}] ${m.title}: ${m.content}`).join('\n');
      const result = await callAIGeneric(`Based on the company memory below, answer the question:\n\nCompany Memory:\n${memoryContext || 'No memories stored yet.'}\n\nQuestion: ${aiSearch}\n\nAnswer concisely.`);
      setAiResult(result);
    } catch { toast.error('AI search failed'); }
    setAiLoading(false);
  };

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";
  const labelCls = "text-white/60 text-xs font-medium";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Company Memory</h1>
          <p className="text-sm text-white/40">{memory.length} entries in knowledge base</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Entry'}
        </Button>
      </div>

      {/* AI Search */}
      <Card className="bg-gradient-to-br from-amber-500/[0.04] to-transparent border-amber-500/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-400" /> Ask AI about your company memory
          </div>
          <div className="flex gap-2">
            <Input value={aiSearch} onChange={e => setAiSearch(e.target.value)} placeholder="e.g., What did we decide about the bank account?" className={`flex-1 ${inputCls}`} onKeyDown={e => e.key === 'Enter' && handleAiSearch()} />
            <Button onClick={handleAiSearch} disabled={aiLoading || !aiSearch.trim()} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1 text-xs shrink-0">
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Search
            </Button>
          </div>
          {aiResult && <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] text-sm text-white/60 whitespace-pre-wrap">{aiResult}</div>}
        </CardContent>
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-3"><CardTitle className="text-white text-base">New Memory Entry</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className={labelCls}>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><Label className={labelCls}>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">{MEMORY_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white/70">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className={labelCls}>Content *</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className={`${inputCls} min-h-[100px] resize-y`} /></div>
            <div className="space-y-1.5"><Label className={labelCls}>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={inputCls} placeholder="bank, important, decision" /></div>
            <Button onClick={handleSave} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm"><Plus className="w-4 h-4" /> Save Entry</Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" /><Input placeholder="Search memory..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-9 ${inputCls}`} /></div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent className="bg-[#111] border-white/10"><SelectItem value="all" className="text-white/70">All Categories</SelectItem>{MEMORY_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white/70">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><Brain className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No memory entries found</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <Card key={m.id} className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">{m.category}</Badge>
                      {m.tags?.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="bg-white/5 text-white/30 text-[10px]">{t}</Badge>)}
                    </div>
                    <h3 className="text-white font-medium text-sm">{m.title}</h3>
                    <p className="text-white/40 text-xs mt-1 line-clamp-2">{m.content}</p>
                    <p className="text-[10px] text-white/20 mt-2">{formatDate(m.date)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { deleteMemory(m.id); toast.success('Deleted'); }} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 shrink-0"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
