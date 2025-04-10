"use client";
import { useState, useEffect } from "react";
import { Trash2, UploadCloud, ChevronUp, ChevronDown } from "lucide-react";

type ScreensaverImage = {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  order: number;
};

export default function ScreensaverManager() {
  const [images, setImages] = useState<ScreensaverImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    const res = await fetch('/api/screensaver');
    const data = await res.json();
    setImages(data);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      
      // Replace with your actual image upload API endpoint
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const { url } = await uploadRes.json();

      const imageRes = await fetch('/api/screensaver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: e.target.files[0].name,
          imageUrl: url,
          order: images.length,
        }),
      });

      if (imageRes.ok) {
        fetchImages();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }

  async function moveImage(index: number, direction: 'up' | 'down') {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    
    setImages(newImages);

    // Update orders in database
    const updates = newImages.map((img, idx) =>
      fetch('/api/screensaver', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...img, order: idx }),
      })
    );

    await Promise.all(updates);
  }

  async function toggleImageStatus(image: ScreensaverImage) {
    await fetch('/api/screensaver', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...image, isActive: !image.isActive }),
    });
    fetchImages();
  }

  async function deleteImage(id: string) {
    await fetch(`/api/screensaver?id=${id}`, { method: 'DELETE' });
    fetchImages();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Screensaver Images</h1>
      
      <div className="mb-6">
        <label className="block w-full max-w-xs cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Click to upload image</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
        </label>
      </div>

      <div className="space-y-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow ${
              !image.isActive && 'opacity-50'
            }`}
          >
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-32 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-medium">{image.title}</h3>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveImage(index, 'up')}
                disabled={index === 0}
                className={`p-1 rounded hover:bg-gray-100 ${
                  index === 0 ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => moveImage(index, 'down')}
                disabled={index === images.length - 1}
                className={`p-1 rounded hover:bg-gray-100 ${
                  index === images.length - 1 ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => toggleImageStatus(image)}
              className={`px-3 py-1 rounded ${
                image.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {image.isActive ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => deleteImage(image.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
