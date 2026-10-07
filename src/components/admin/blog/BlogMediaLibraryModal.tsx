import React, { useEffect, useState } from 'react';
import { fetchAdminMedia, uploadAdminMedia, deleteAdminMedia } from '../../../lib/blogApi';
import type { BlogMedia } from '../../../types/blog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Image as ImageIcon, Upload, Search, Trash2, Check, AlertCircle } from 'lucide-react';

interface BlogMediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMedia?: (media: BlogMedia) => void;
}

export const BlogMediaLibraryModal: React.FC<BlogMediaLibraryModalProps> = ({
  open,
  onOpenChange,
  onSelectMedia
}) => {
  const [mediaList, setMediaList] = useState<BlogMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<BlogMedia | null>(null);
  const [uploadAltText, setUploadAltText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadMedia = () => {
    setLoading(true);
    fetchAdminMedia({ search, limit: 30 })
      .then((res) => {
        setMediaList(res.media);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load media');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const file = files[0];
      const uploaded = await uploadAdminMedia(file, uploadAltText || file.name, file.name);
      setMediaList((prev) => [uploaded, ...prev]);
      setSelectedItem(uploaded);
      setUploadAltText('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this image permanently from disk and media library?')) return;
    try {
      await deleteAdminMedia(id);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete media');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-left">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            SEB's Media Library & Asset Storage
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search images by filename or alt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-xs"
            />
          </div>

          <div className="sm:col-span-6 flex items-center gap-2">
            <Input
              placeholder="Alt text for new upload..."
              value={uploadAltText}
              onChange={(e) => setUploadAltText(e.target.value)}
              className="rounded-xl text-xs flex-1"
            />
            <label className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2 shrink-0">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
        </div>

        {/* Image Grid */}
        <div className="my-4 min-h-[300px] max-h-[420px] overflow-y-auto border border-slate-200 dark:border-white/10 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {loading ? (
            <div className="col-span-full py-20 text-center text-xs text-slate-400 font-bold">
              Loading library images...
            </div>
          ) : mediaList.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-2">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No media assets found in library.</p>
              <p className="text-[11px] text-slate-400">Upload JPEG, PNG, WebP, or SVG images above.</p>
            </div>
          ) : (
            mediaList.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer border-2 transition-all ${
                    isSelected ? 'border-primary ring-4 ring-primary/20 scale-95' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={item.file_url} alt={item.alt_text || item.title} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur p-1.5 text-[10px] text-white font-bold truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.original_filename}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Image Metadata Preview & Action */}
        {selectedItem && (
          <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <img src={selectedItem.file_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">{selectedItem.title || selectedItem.original_filename}</p>
                <p className="text-[10px] text-slate-500">URL: {selectedItem.file_url}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedItem.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
              {onSelectMedia && (
                <Button
                  onClick={() => {
                    onSelectMedia(selectedItem);
                    onOpenChange(false);
                  }}
                  className="bg-primary text-white font-bold text-xs rounded-xl px-5"
                >
                  Select This Asset
                </Button>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs font-bold">
            Close Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
