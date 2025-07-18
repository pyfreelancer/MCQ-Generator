import React, { useState } from 'react';
import { exportQuestionsJson } from '../api/api';
import LoadingSpinner from './LoadingSpinner';
import { Download, FileJson, FileText } from 'lucide-react';

const ExportOptions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleExportJson = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const blob = await exportQuestionsJson();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mcq_questions.json');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccessMessage('Questions exported successfully as JSON!');
    } catch (err) {
      setError(err.message || 'Failed to export questions as JSON.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    setError(null);
    setSuccessMessage(null);
    alert("PDF export is not yet implemented. This would typically require a backend endpoint to generate the PDF or a client-side PDF generation library.");
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold text-center text-text-light mb-8">Export Question Sets</h2>

      <div className="card-style p-8 rounded-xl shadow-custom-light mb-8 text-center">
        <p className="text-lg text-text-light mb-6">Choose an export format for your stored questions.</p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out text-lg w-full sm:w-auto"
            disabled={loading}
          >
            <FileJson size={24} className="mr-3" />
            {loading ? 'Exporting JSON...' : 'Export as JSON'}
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center bg-dark-card hover:bg-dark-bg text-text-light border border-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out text-lg w-full sm:w-auto"
            disabled={loading}
          >
            <FileText size={24} className="mr-3" />
            Export as PDF (Coming Soon)
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && (
        <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative mb-4 shadow-md" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-success-green border border-green-700 text-white px-4 py-3 rounded-lg relative mb-4 shadow-md" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline ml-2">{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;