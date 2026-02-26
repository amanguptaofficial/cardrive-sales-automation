import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api.js';
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CSVUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/csv/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/csv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUploadResult(data.data);
      toast.success(`Successfully imported ${data.data.imported} leads`);
      if (data.data.errors > 0) {
        toast.error(`${data.data.errors} rows had errors`);
      }
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload CSV');
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    uploadMutation.mutate(file);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            CSV Lead Upload
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload leads in bulk via CSV file. AI will automatically process and respond.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-accent transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <span className="text-accent font-medium">Click to upload</span> or drag and drop
            </div>
            <p className="text-sm text-gray-500">CSV file only (max 5MB)</p>
          </label>
        </div>

        {file && (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        {uploadResult && (
          <div className={`rounded-lg p-4 ${
            uploadResult.errors > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              {uploadResult.errors > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  uploadResult.errors > 0 ? 'text-yellow-900' : 'text-green-900'
                }`}>
                  Import Complete
                </p>
                <p className={`text-sm mt-1 ${
                  uploadResult.errors > 0 ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  {uploadResult.imported} leads imported successfully
                  {uploadResult.errors > 0 && ` • ${uploadResult.errors} rows had errors`}
                </p>
                {uploadResult.errorDetails && uploadResult.errorDetails.length > 0 && (
                  <div className="mt-2 text-xs text-yellow-700">
                    <p className="font-medium">Error Details:</p>
                    <ul className="list-disc list-inside mt-1">
                      {uploadResult.errorDetails.slice(0, 5).map((err, idx) => (
                        <li key={idx}>Row {err.row}: {err.error}</li>
                      ))}
                      {uploadResult.errorDetails.length > 5 && (
                        <li>... and {uploadResult.errorDetails.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload & Process Leads
            </>
          )}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">How it works:</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download the CSV template</li>
            <li>Fill in your lead information</li>
            <li>Upload the CSV file</li>
            <li>AI will automatically score and respond to each lead</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;
