import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { uploadCsvFile } from '../api/client';

export const Import: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'inventory' | 'sales'>('inventory');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ message: string; processed: number; isDemo: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a valid .csv file format.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await uploadCsvFile(selectedFile, importType);
      setResult({
        message: res.data.message,
        processed: res.data.processed,
        isDemo: res.isDemo,
      });
    } catch (err: any) {
      setError(err.message || 'Error parsing CSV upload.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleInventoryCsv = () => {
    const csvContent =
      'product_id,product_name,current_stock,lead_time_days,unit_cost,category\n' +
      'SKU-201,Wireless Bluetooth Earbuds,45,6,35.00,Electronics\n' +
      'SKU-202,Smart Fitness Band,12,7,24.50,Wearables\n' +
      'SKU-203,Quick Charge Powerbank 20000mAh,8,5,29.90,Accessories\n' +
      'SKU-204,Braided Type-C Fast Cable,120,3,4.00,Accessories\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'smartstock_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          CSV Batch Data Ingestion
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Import bulk stock counts and past retail sales to calibrate demand forecasting models.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        
        {/* Dataset Type Selector */}
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Dataset Target:</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setImportType('inventory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                importType === 'inventory'
                  ? 'bg-[#FF642B] text-white shadow-2xs'
                  : 'bg-[#F4F6FA] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Inventory Levels (SKUs)
            </button>
            <button
              type="button"
              onClick={() => setImportType('sales')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                importType === 'sales'
                  ? 'bg-[#FF642B] text-white shadow-2xs'
                  : 'bg-[#F4F6FA] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Historical Sales Records
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#FF642B] rounded-2xl p-8 text-center transition-colors bg-[#F8FAFC]">
          <UploadCloud className="w-12 h-12 text-[#FF642B] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">
            {selectedFile ? selectedFile.name : 'Select or drag your CSV file here'}
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            Accepts UTF-8 encoded .csv files with standard header rows.
          </p>

          <label className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#FF642B] text-xs font-bold text-[#0F172A] cursor-pointer shadow-2xs transition-colors">
            <span>Browse CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{result.message}</span>
            </div>
            <p className="text-xs text-emerald-700 pl-7">
              {result.isDemo
                ? 'Validated schema against demo inventory contracts. Ready for live ingestion when FastAPI backend is connected.'
                : 'Processed through live backend endpoint.'}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={downloadSampleInventoryCsv}
            className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 focus:outline-none"
          >
            <Download className="w-4 h-4 text-[#FF642B]" />
            <span>Download Sample CSV Template</span>
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-3 bg-[#FF642B] hover:bg-[#E8531C] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Validating Data...</span>
              </>
            ) : (
              <>
                <span>Validate & Ingest CSV</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Expected Schema Reference */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
          Agreed API Schema Specification (Team Contract)
        </h3>
        <p className="text-xs text-[#64748B]">
          These schema columns are synchronized with Mobin's FastAPI backend and Parth's validation test suite:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <strong className="text-[#FF642B] font-sans block text-xs">Inventory CSV Columns:</strong>
            <div>product_id (string, unique)</div>
            <div>product_name (string)</div>
            <div>current_stock (integer, &gt;= 0)</div>
            <div>lead_time_days (integer, &gt;= 1)</div>
            <div>unit_cost (float, &gt;= 0)</div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <strong className="text-[#FF642B] font-sans block text-xs">Sales CSV Columns:</strong>
            <div>product_id (string)</div>
            <div>date (YYYY-MM-DD)</div>
            <div>quantity_sold (integer, &gt;= 0)</div>
          </div>
        </div>
      </div>

    </div>
  );
};
