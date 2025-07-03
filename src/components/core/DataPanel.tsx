import React from 'react';
import './DataPanel.css';

interface DataPanelProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  title,
  subtitle,
  children,
  className = '',
  variant = 'default',
  size = 'medium',
  animated = false
}) => {
  const sizeClasses = {
    small: 'data-panel-small',
    medium: 'data-panel-medium',
    large: 'data-panel-large'
  };

  const variantClasses = {
    default: '',
    primary: 'data-panel-primary',
    warning: 'data-panel-warning',
    danger: 'data-panel-danger',
    success: 'data-panel-success'
  };

  const panelClasses = [
    'data-panel',
    'glass-panel',
    sizeClasses[size],
    variantClasses[variant],
    animated ? 'holographic' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={panelClasses}>
      {(title || subtitle) && (
        <div className="data-panel-header">
          {title && <h3 className="data-panel-title display-text">{title}</h3>}
          {subtitle && <p className="data-panel-subtitle data-text">{subtitle}</p>}
        </div>
      )}
      <div className="data-panel-content">
        {children}
      </div>
      <div className="data-panel-corner data-panel-corner-tl" />
      <div className="data-panel-corner data-panel-corner-tr" />
      <div className="data-panel-corner data-panel-corner-bl" />
      <div className="data-panel-corner data-panel-corner-br" />
    </div>
  );
};