import React, { useState, useRef, useEffect } from 'react';
import { Barcode, X, Search, Camera, AlertCircle, CheckCircle2, VideoOff } from 'lucide-react';
import type { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductSelect?: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductSelect,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream on unmount or close
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setBarcodeInput('');
      setSearchError(null);
      setMatchedProduct(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartScanner = async () => {
    setCameraError(null);
    setSearchError(null);
    setMatchedProduct(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Please use manual barcode lookup below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsScanning(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access was denied or is unavailable. You can still look up products using the manual search below.');
      setIsScanning(false);
    }
  };

  const handleSearch = (codeToSearch?: string) => {
    const query = (codeToSearch ?? barcodeInput).trim();
    if (!query) {
      setSearchError('Please enter a barcode or SKU number.');
      setMatchedProduct(null);
      return;
    }

    setSearchError(null);
    const qLower = query.toLowerCase();

    // Look for matching product by barcode, SKU / product_id, or exact name
    const found = products.find(
      (p) =>
        p.product_id.toLowerCase() === qLower ||
        ((p as any).barcode && String((p as any).barcode).toLowerCase() === qLower) ||
        p.product_name.toLowerCase() === qLower ||
        p.product_id.toLowerCase().includes(qLower)
    );

    if (found) {
      setMatchedProduct(found);
      setSearchError(null);
      if (onProductSelect) {
        onProductSelect(found);
      }
    } else {
      setMatchedProduct(null);
      setSearchError(`No product found matching barcode "${query}". Please check the number or add it to inventory.`);
    }
  };

  const handleSimulateScan = (mockCode: string) => {
    setBarcodeInput(mockCode);
    handleSearch(mockCode);
    stopCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
              <Barcode className="w-6 h-6 text-[#F97316]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#191919] leading-tight">Barcode Scanner</h3>
              <p className="text-xs text-gray-500 mt-0.5">Scan a product barcode or enter it manually to lookup</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-barcode-close"
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Camera Viewfinder (if scanning) */}
          {isScanning ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center shadow-inner border border-gray-200">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Laser scan animation overlay */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-28 border-2 border-[#6125E8] rounded-xl pointer-events-none flex items-center justify-center bg-[#6125E8]/10 shadow-[0_0_15px_rgba(97,37,232,0.3)]">
                <div className="w-full h-0.5 bg-[#6125E8] shadow-[0_0_8px_#6125E8] animate-pulse" />
              </div>
              <span className="absolute bottom-3 text-[11px] font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                Align barcode within frame
              </span>
              <button
                type="button"
                id="btn-stop-camera"
                onClick={stopCamera}
                className="absolute top-3 right-3 text-white bg-black/60 hover:bg-black/80 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
              >
                Stop Camera
              </button>
            </div>
          ) : (
            /* Full-width purple Start Barcode Scanner button */
            <button
              type="button"
              id="btn-start-barcode-scanner"
              onClick={handleStartScanner}
              className="w-full py-3 bg-[#6125E8] hover:bg-[#521cc9] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Start Barcode Scanner</span>
            </button>
          )}

          {/* Camera Error / Warning notice */}
          {cameraError && (
            <div id="barcode-camera-error" className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <VideoOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Camera Unavailable</p>
                <p className="mt-0.5 text-amber-700">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Quick barcode simulation selector for convenience */}
          {isScanning && products.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-600 mb-2">Simulate detecting an item:</p>
              <div className="flex flex-wrap gap-1.5">
                {products.slice(0, 3).map((p) => (
                  <button
                    key={p.product_id}
                    type="button"
                    onClick={() => handleSimulateScan(p.product_id)}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-purple-50 text-[#6125E8] border border-purple-200 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Scan {p.product_id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Centered OR ENTER MANUALLY divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              OR ENTER MANUALLY
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Barcode number input field + Purple Search button beside input */}
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Barcode className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="input-barcode-number"
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="Enter barcode number (e.g. SKU-101)..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#6125E8] focus:ring-1 focus:ring-[#6125E8] transition-all"
                />
              </div>
              <button
                type="submit"
                id="btn-barcode-search"
                className="px-5 py-2.5 bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Search Result: Error */}
          {searchError && (
            <div id="barcode-search-error" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Product Not Found</p>
                <p className="mt-0.5 text-rose-700">{searchError}</p>
              </div>
            </div>
          )}

          {/* Search Result: Matched Product Card */}
          {matchedProduct && (
            <div id="barcode-matched-card" className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Barcode Matched</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#191919] mt-1">{matchedProduct.product_name}</h4>
                  <p className="text-[11px] text-gray-500">
                    SKU: {matchedProduct.product_id} • Category: {matchedProduct.category || 'General'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#191919]">₹{matchedProduct.unit_cost.toFixed(2)}</span>
                  <p className="text-[11px] text-gray-500">{matchedProduct.current_stock} in stock</p>
                </div>
              </div>
              <div className="pt-2 border-t border-purple-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Confirm & View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
