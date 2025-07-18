import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="card-style p-8 rounded-xl shadow-custom-light max-w-sm w-full relative text-center">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-light transition duration-200"
          title="Close"
        >
          <X size={20} />
        </button>
        <AlertCircle size={48} className="text-warning-orange mx-auto mb-6" />
        <p className="text-lg text-text-light mb-8 font-semibold">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onConfirm}
            className="bg-error-red hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="bg-dark-card hover:bg-dark-bg text-text-light border border-dark-bg font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;