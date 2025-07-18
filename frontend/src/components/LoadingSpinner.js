import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-green mb-4"></div>
      <p className="text-text-secondary text-xl font-medium">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
