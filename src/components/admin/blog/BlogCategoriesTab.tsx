import React, { useEffect, useState } from 'react';
import { fetchAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../../../lib/blogApi';
import type { BlogCategory } from '../../../types/blog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Layers, Plus, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const BlogCategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState<Partial<BlogCategory>>({
    name: '',
    slug: '',
    description: '',
    seo_title: '',
    meta_description: '',
    is_active: true
  });
  const [error, setError] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    fetchAdminCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenModal = (category?: BlogCategory) => {
    setError(null);
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', seo_title: '', meta_description: '', is_active: true });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, formData);
      } else {
        await createAdminCategory(formData);
      }
      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteAdminCategory(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Category Taxonomy Manager</h2>
          <p className="text-xs text-slate-500">Organize curriculum topics, exam types, and subject tags.</p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-5 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">Loading categories...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/5 font-black uppercase text-[10px] tracking-wider text-slate-500">
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Articles Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-800 dark:text-slate-200">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-black text-slate-900 dark:text-white text-sm">{cat.name}</td>
                    <td className="p-4 font-mono text-slate-500">{cat.slug}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                    <td className="p-4 font-bold">{cat.post_count || 0}</td>
                    <td className="p-4">
                      {cat.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase">Active</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(cat)} className="h-8 px-2 text-primary font-bold">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="h-8 px-2 text-rose-600 font-bold">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 py-2 text-left">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Name *</label>
              <Input
                placeholder="e.g., IELTS Writing"
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
                  }));
                }}
                className="rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">URL Slug</label>
              <Input
                placeholder="e.g., ielts-writing"
                value={formData.slug || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Description</label>
              <Textarea
                placeholder="Category summary..."
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-xl text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-white font-bold rounded-xl">Save Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
