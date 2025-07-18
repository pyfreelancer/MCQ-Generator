import React, { useState, useEffect } from 'react';
import { uploadDocumentAndGenerateMCQs, getUploadedDocuments } from '../api/api';
import LoadingSpinner from './LoadingSpinner';
import { Upload, FileText, FolderOpen } from 'lucide-react';

const DocumentUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [numQuestionsPerChunk, setNumQuestionsPerChunk] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(true);
  const [fetchDocsError, setFetchDocsError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setFetchingDocs(true);
    setFetchDocsError(null);
    try {
      const docs = await getUploadedDocuments();
      setUploadedDocuments(docs);
    } catch (err) {
      setFetchDocsError(err.message || 'Failed to fetch uploaded documents.');
    } finally {
      setFetchingDocs(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!selectedFile) {
      setError('Please select a file to upload.');
      setLoading(false);
      return;
    }

    try {
      const uploadedDoc = await uploadDocumentAndGenerateMCQs(
        selectedFile,
        numQuestionsPerChunk,
        difficulty,
        category
      );
      setSuccessMessage(`Document "${uploadedDoc.filename}" uploaded successfully! MCQs are being generated in the background.`);
      setSelectedFile(null); // Clear selected file input
      e.target.reset(); // Resets the form, including file input
      fetchDocuments(); // Refresh the list of uploaded documents
    } catch (err) {
      setError(err.message || 'An unknown error occurred during document upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold text-center text-text-light mb-8">Upload Document for MCQ Generation</h2>

      <form onSubmit={handleSubmit} className="card-style p-8 rounded-xl shadow-custom-light mb-8">
        <div className="mb-5">
          <label htmlFor="documentFile" className="block text-text-light text-sm font-semibold mb-2">
            Select Document (PDF, TXT, DOCX):
          </label>
          <input
            type="file"
            id="documentFile"
            // Re-typed this className attribute to remove any hidden characters
            className="block w-full text-sm text-text-light
                       file:mr-4 file:py-2.5 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-semibold
                       file:bg-accent-green file:text-dark-bg
                       hover:file:bg-emerald-600 transition duration-200
                       cursor-pointer shadow-sm"
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx"
            required
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-text-secondary">Selected: <span className="font-medium">{selectedFile.name}</span></p>
          )}
        </div>

        <div className="mb-5">
          <label htmlFor="numQuestionsPerChunk" className="block text-text-light text-sm font-semibold mb-2">
            MCQs per Chunk (for AI generation):
          </label>
          <input
            type="number"
            id="numQuestionsPerChunk"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={numQuestionsPerChunk}
            onChange={(e) => setNumQuestionsPerChunk(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
            min="1"
            max="5"
            required
          />
        </div>

        <div className="mb-5">
          <label htmlFor="docDifficulty" className="block text-text-light text-sm font-semibold mb-2">
            Difficulty for generated MCQs:
          </label>
          <select
            id="docDifficulty"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="docCategory" className="block text-text-light text-sm font-semibold mb-2">
            Category (Optional, for generated MCQs):
          </label>
          <input
            type="text"
            id="docCategory"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Physics, Literature"
          />
        </div>

        <button
          type="submit"
          className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out w-full text-lg"
          disabled={loading}
        >
          {loading ? 'Uploading & Generating...' : 'Upload Document'}
        </button>
      </form>

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

      <div className="mt-8">
        <h3 className="text-2xl font-bold text-text-light mb-6 text-center">Uploaded Documents</h3>
        {fetchingDocs ? (
          <LoadingSpinner />
        ) : fetchDocsError ? (
          <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative my-4 shadow-md" role="alert">
            <strong className="font-bold">Error fetching documents!</strong>
            <span className="block sm:inline ml-2">{fetchDocsError}</span>
          </div>
        ) : uploadedDocuments.length === 0 ? (
          <p className="text-center text-text-secondary text-lg py-8">No documents uploaded yet.</p>
        ) : (
          <div className="grid gap-4">
            {uploadedDocuments.map((doc) => (
              <div key={doc._id} className="card-style p-4 rounded-xl shadow-custom-light flex justify-between items-center hover:shadow-custom-medium transition duration-200">
                <div className="flex items-center">
                  <FileText size={20} className="text-accent-green mr-3" />
                  <div>
                    <p className="font-semibold text-text-light text-lg">{doc.filename}</p>
                    <p className="text-sm text-text-secondary">
                      Uploaded: {new Date(doc.upload_date).toLocaleDateString()} at {new Date(doc.upload_date).toLocaleTimeString()} ({Math.round(doc.file_size / 1024)} KB)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;