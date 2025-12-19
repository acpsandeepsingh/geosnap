import PhotoGrid from '@/components/gallery/photo-grid';

export default function GalleryPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gallery</h1>
      <PhotoGrid />
    </div>
  );
}
