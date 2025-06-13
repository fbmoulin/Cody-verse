import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const NotificationContainer = () => {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#111827' : '#FFFFFF',
          color: isDark ? '#F9FAFB' : '#111827',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: isDark 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          style: {
            borderLeft: '4px solid #10B981',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: isDark ? '#111827' : '#FFFFFF',
          },
        },
        error: {
          style: {
            borderLeft: '4px solid #EF4444',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: isDark ? '#111827' : '#FFFFFF',
          },
        },
        loading: {
          style: {
            borderLeft: '4px solid #4F46E5',
          },
          iconTheme: {
            primary: '#4F46E5',
            secondary: isDark ? '#111827' : '#FFFFFF',
          },
        },
      }}
    />
  );
};

export default NotificationContainer;