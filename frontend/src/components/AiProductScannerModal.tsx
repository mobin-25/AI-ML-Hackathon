import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, AlertCircle, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { createProduct } from '../api/client';
import type { Product } from '../types';

interface AiProductScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
  categories?: string[];
}

const DEFAULT_CATEGORIES = [
  'Electronics & Mobile',
  'Accessories',
  'Audio & Sound',
  'Pantry & Groceries',
  'Beverages',
  'Personal Care',
  'Office Supplies',
  'General Merchandise',
];

export const AiProductScannerModal: React.FC<AiProductScannerModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [mrp, setMrp] = useState<string>('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    stopCamera();
    setImages([]);
    setProductName('');
    setBrand('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setMrp('');
    setDescription('');
    setErrorMessage(null);
    setCameraError(null);
    setIsSubmitting(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle uploading multiple images from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same files can be chosen again if needed
    e.target.value = '';
  };

  // Handle opening live camera
  const handleOpenCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported on this browser or connection. Please use Upload Image.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access was denied or is unavailable. Please select images using Upload Image.');
      setIsCameraActive(false);
    }
  };

  // Capture snapshot from live camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImages((prev) => [...prev, dataUrl]);
    }
    stopCamera();
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit and create product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorMessage('Product Name is required.');
      return;
    }

    const priceNum = parseFloat(mrp);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Please enter a valid MRP greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const generatedSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await createProduct({
        product_id: generatedSku,
        product_name: productName.trim(),
        category: category || 'General',
        unit_cost: priceNum,
        current_stock: 20, // Initial stock default
        lead_time_days: 5,
        reorder_point: 5,
      });

      // Pass added product with any custom metadata
      const addedProduct = {
        ...res.data,
        brand: brand.trim() || 'SmartStock',
        description: description.trim(),
      };

      onProductAdded(addedProduct);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#191919] leading-tight">AI Product Scanner</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6125E8] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-[#6125E8]" />
                Auto-Catalog
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload multiple product images to auto-identify and add to inventory
            </p>
          </div>
          <button
            type="button"
            id="btn-ai-scan-close"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Pinned Footer Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Product Images Counter Header */}
            <div className="flex items-center justify-between">
              <span id="product-images-counter" className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                Product Images ({images.length})
              </span>
              <span className="text-[11px] text-gray-400">Multiple images supported</span>
            </div>

          {/* Live Camera Viewfinder (if active) */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center shadow-inner border border-purple-200">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-6 border border-white/40 rounded-xl pointer-events-none" />
              <div className="absolute bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-capture-snapshot"
                  onClick={handleCaptureSnapshot}
                  className="px-4 py-2 bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
                <button
                  type="button"
                  id="btn-cancel-camera"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div id="camera-error-message" className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Two Equal-Sized Image Selection Panels Side-by-Side */}
          {!isCameraActive && (
            <div className="grid grid-cols-2 gap-3.5">
              {/* Left Panel: Open Camera */}
              <button
                type="button"
                id="btn-open-camera"
                onClick={handleOpenCamera}
                className="group p-5 bg-purple-50/40 hover:bg-purple-50/80 border-2 border-dashed border-purple-200 hover:border-[#6125E8] rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-white shadow-2xs border border-purple-100 flex items-center justify-center text-[#6125E8] mb-2.5 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-[#6125E8] transition-colors">
                  Open Camera
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5">Capture product photo</span>
              </button>

              {/* Right Panel: Upload Image */}
              <button
                type="button"
                id="btn-upload-image"
                onClick={() => fileInputRef.current?.click()}
                className="group p-5 bg-purple-50/40 hover:bg-purple-50/80 border-2 border-dashed border-purple-200 hover:border-[#6125E8] rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-white shadow-2xs border border-purple-100 flex items-center justify-center text-[#6125E8] mb-2.5 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-[#6125E8] transition-colors">
                  Upload Image
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5">Select from gallery</span>
              </button>

              <input
                ref={fileInputRef}
                id="input-file-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Thumbnail Gallery Preview */}
          {images.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-gray-500">Selected Images:</span>
              <div id="image-previews-container" className="flex flex-wrap gap-2.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                {images.map((imgSrc, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                    <img src={imgSrc} alt={`Product preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Honest AI recognition disclaimer notice */}
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
            <Sparkles className="w-4 h-4 text-[#6125E8] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-purple-950">Manual Verification Mode: </span>
              {images.length > 0
                ? `${images.length} product ${images.length === 1 ? 'image' : 'images'} attached. Please enter or review the product details below.`
                : 'Attach product photos or enter details directly below to add to inventory.'}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Required Product Name */}
            <div>
              <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                id="input-product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name (e.g. Ergonomic Wireless Mouse)"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-gray-400 focus:outline-none focus:border-[#6125E8] focus:ring-1 focus:ring-[#6125E8] transition-all"
              />
            </div>

            {/* Brand and Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1.5">Brand</label>
                <input
                  type="text"
                  id="input-product-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Logitech, SmartStock"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-gray-400 focus:outline-none focus:border-[#6125E8] focus:ring-1 focus:ring-[#6125E8] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1.5">Category</label>
                <select
                  id="select-product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] focus:outline-none focus:border-[#6125E8] focus:ring-1 focus:ring-[#6125E8] transition-all cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* MRP (₹) Input */}
            <div>
              <label className="block text-xs font-semibold text-[#191919] mb-1.5">MRP (₹)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-semibold text-xs sm:text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="input-product-mrp"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-gray-400 focus:outline-none focus:border-[#6125E8] focus:ring-1 focus:ring-[#6125E8] transition-all"
                />
              </div>
            </div>

            {/* Full-width Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-[#191919] mb-1.5">Description</label>
              <textarea
                rows={3}
                id="textarea-product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description, specifications, or key features..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-gray-400 focus:outline-none focus:border-[#6125E8] focus:ring-1 focus:ring-[#6125E8] transition-all resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div id="ai-scan-error" className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          </div>

          {/* Pinned Bottom Actions: Cancel and purple Add Product (N images) button */}
          <div className="p-4 sm:px-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              id="btn-cancel-ai-scan"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-ai-scan"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#6125E8] hover:bg-[#521cc9] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Saving...' : `Add Product (${images.length} images)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
