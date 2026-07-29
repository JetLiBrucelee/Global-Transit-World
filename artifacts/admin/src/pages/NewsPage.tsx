import { useState } from 'react';
import {
  useListNews, useCreateNewsArticle, useUpdateNewsArticle, useDeleteNewsArticle,
  useListCmsContent, useUpsertCmsSection,
  getListNewsQueryKey, getListCmsContentQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['company_news', 'trade_updates', 'regulatory', 'technology', 'market_insights'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function NewsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'articles' | 'cms'>('articles');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ is_published: false, is_featured: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: news, isLoading } = useListNews();
  const { data: cms } = useListCmsContent();
  const createArticle = useCreateNewsArticle();
  const updateArticle = useUpdateNewsArticle();
  const deleteArticle = useDeleteNewsArticle();
  const upsertSection = useUpsertCmsSection();

  const articles = Array.isArray(news) ? news : (news as any)?.articles ?? [];
  const cmsSections = Array.isArray(cms) ? cms : [];

  function openCreate() {
    setEditing(null);
    setForm({ is_published: false, is_featured: false });
    setOpen(true);
  }

  function openEdit(a: any) {
    setEditing(a);
    setForm({ ...a });
    setOpen(true);
  }

  function handleSave() {
    const data = { ...form, slug: form.slug || slugify(form.title ?? '') };
    if (editing) {
      updateArticle.mutate({ id: editing.id, data }, {
        onSuccess: () => {
          toast({ title: 'Article updated' });
          qc.invalidateQueries({ queryKey: getListNewsQueryKey() });
          setOpen(false);
        },
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      });
    } else {
      createArticle.mutate({ data }, {
        onSuccess: () => {
          toast({ title: 'Article created' });
          qc.invalidateQueries({ queryKey: getListNewsQueryKey() });
          setOpen(false);
        },
        onError: () => toast({ title: 'Failed to create', variant: 'destructive' }),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteArticle.mutate({ id: deleteTarget }, {
      onSuccess: () => {
        toast({ title: 'Article deleted' });
        qc.invalidateQueries({ queryKey: getListNewsQueryKey() });
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">News & CMS</h1>
        {tab === 'articles' && (
          <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> New Article</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['articles', 'cms'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'articles' ? 'Articles' : 'CMS Sections'}
          </button>
        ))}
      </div>

      {tab === 'articles' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Title', 'Category', 'Status', 'Featured', 'Published', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              )) : articles.map((a: any) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-sm">{a.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{a.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.category?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{a.is_featured ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {a.published_at ? new Date(a.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a)} className="p-1 hover:bg-muted rounded"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteTarget(a.id)} className="p-1 hover:bg-red-50 hover:text-red-600 rounded"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && articles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No articles yet</div>
          )}
        </div>
      )}

      {tab === 'cms' && (
        <div className="space-y-3">
          {cmsSections.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
              No CMS sections found
            </div>
          ) : cmsSections.map((section: any) => (
            <div key={section.section} className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3 capitalize">{section.section?.replace('_', ' ')}</h3>
              <div className="space-y-2">
                {section.items?.map((item: any) => (
                  <div key={item.key} className="flex items-start gap-3">
                    <span className="text-xs text-muted-foreground w-32 flex-shrink-0 pt-1.5">{item.key}</span>
                    <div className="flex-1">
                      {(item.value?.length ?? 0) > 80 ? (
                        <Textarea
                          className="text-sm"
                          rows={2}
                          defaultValue={item.value ?? ''}
                          onBlur={e => {
                            if (e.target.value !== item.value) {
                              upsertSection.mutate(
                                { section: section.section, data: { section: section.section, items: [{ key: item.key, value: e.target.value }] } },
                                { onSuccess: () => { toast({ title: 'Saved' }); qc.invalidateQueries({ queryKey: getListCmsContentQueryKey() }); } }
                              );
                            }
                          }}
                        />
                      ) : (
                        <Input
                          className="h-8 text-sm"
                          defaultValue={item.value ?? ''}
                          onBlur={e => {
                            if (e.target.value !== item.value) {
                              upsertSection.mutate(
                                { section: section.section, data: { section: section.section, items: [{ key: item.key, value: e.target.value }] } },
                                { onSuccess: () => { toast({ title: 'Saved' }); qc.invalidateQueries({ queryKey: getListCmsContentQueryKey() }); } }
                              );
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Article' : 'New Article'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input className="h-8 text-sm mt-1" value={form.title ?? ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input className="h-8 text-sm mt-1 font-mono" value={form.slug ?? ''} onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  className="w-full h-8 text-sm mt-1 border border-input rounded-md px-2 bg-background"
                  value={form.category ?? ''}
                  onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Author</Label>
                <Input className="h-8 text-sm mt-1" value={form.author_name ?? ''} onChange={e => setForm((f: any) => ({ ...f, author_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Summary</Label>
              <Textarea className="text-sm mt-1" rows={2} value={form.summary ?? ''} onChange={e => setForm((f: any) => ({ ...f, summary: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Content</Label>
              <Textarea className="text-sm mt-1" rows={6} value={form.content ?? ''} onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_published ?? false} onChange={e => setForm((f: any) => ({ ...f, is_published: e.target.checked }))} className="rounded" />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_featured ?? false} onChange={e => setForm((f: any) => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
                Featured
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={createArticle.isPending || updateArticle.isPending}>
              {editing ? 'Save Changes' : 'Create Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
