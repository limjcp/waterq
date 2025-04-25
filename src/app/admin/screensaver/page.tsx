"use client";
import { useState, useEffect } from "react";
import { Trash2, UploadCloud, ChevronUp, ChevronDown, X } from "lucide-react";
import Button from "@/components/Button";

type ScreensaverImage = {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  order: number;
};

type UploadFormState = {
  file: File | null;
  title: string;
  isActive: boolean;
  previewUrl: string;
};

export default function ScreensaverManager() {
  const [images, setImages] = useState<ScreensaverImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadFormState>({
    file: null,
    title: "",
    isActive: true,
    previewUrl: "",
  });

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    const res = await fetch("/api/screensaver");
    const data = await res.json();
    setImages(data);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);
    setUploadForm({
      file,
      title: file.name,
      isActive: true,
      previewUrl,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadForm.file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { url } = await uploadRes.json();

      const imageRes = await fetch("/api/screensaver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadForm.title,
          imageUrl: url,
          isActive: uploadForm.isActive,
          order: images.length,
        }),
      });

      if (imageRes.ok) {
        fetchImages();
        setIsModalOpen(false);
        setUploadForm({
          file: null,
          title: "",
          isActive: true,
          previewUrl: "",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  }

  async function moveImage(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newImages[index], newImages[swapIndex]] = [
      newImages[swapIndex],
      newImages[index],
    ];

    setImages(newImages);

    // Update orders in database
    const updates = newImages.map((img, idx) =>
      fetch("/api/screensaver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...img, order: idx }),
      })
    );

    await Promise.all(updates);
  }

  async function toggleImageStatus(image: ScreensaverImage) {
    await fetch("/api/screensaver", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...image, isActive: !image.isActive }),
    });
    fetchImages();
  }

  async function deleteImage(id: string) {
    await fetch(`/api/screensaver?id=${id}`, { method: "DELETE" });
    fetchImages();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Screensaver Images</h1>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          variant="primary"
          size="md"
        >
          Add New Image
        </Button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload New Image</h2>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="danger"
                size="sm"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    {uploadForm.previewUrl ? (
                      <img
                        src={uploadForm.previewUrl}
                        alt="Preview"
                        className="mx-auto max-h-48 object-contain"
                      />
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-8 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to select image
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </div>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={uploadForm.isActive}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="danger"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!uploadForm.file || uploading}
                  variant="success"
                  size="md"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border border-sky-100 rounded-lg shadow">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full bg-white">
            <thead className="sticky top-0 bg-sky-50 z-10">
              <tr className="bg-sky-50">
                <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                  Image
                </th>
                <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                  Title
                </th>
                <th className="py-3 px-4 text-center font-medium text-sky-700 border-b">
                  Order
                </th>
                <th className="py-3 px-4 text-center font-medium text-sky-700 border-b">
                  Status
                </th>
                <th className="py-3 px-4 text-right font-medium text-sky-700 border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {images.length > 0 ? (
                images.map((image, index) => (
                  <tr
                    key={image.id}
                    className={`border-b border-sky-50 hover:bg-sky-50 ${
                      !image.isActive && "opacity-50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{image.title}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <Button
                          onClick={() => moveImage(index, "up")}
                          disabled={index === 0}
                          variant="secondary"
                          size="sm"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </Button>
                        <Button
                          onClick={() => moveImage(index, "down")}
                          disabled={index === images.length - 1}
                          variant="secondary"
                          size="sm"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => toggleImageStatus(image)}
                        variant={image.isActive ? "success" : "secondary"}
                        size="sm"
                      >
                        {image.isActive ? "Active" : "Inactive"}
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => deleteImage(image.id)}
                        variant="danger"
                        size="sm"
                        title="Delete Image"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sky-600">
                    No images found. Upload your first screensaver image!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
