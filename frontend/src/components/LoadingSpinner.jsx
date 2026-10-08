import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center p-4 ${className}`}>
      <div 
        className={`spinner-border text-primary ${sizeClasses[size]}`} 
        role="status"
        style={{ 
          borderColor: '#e1306c transparent #e1306c transparent',
          animationDuration: '0.8s'
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <p className="mt-3 mb-0 text-muted fw-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;