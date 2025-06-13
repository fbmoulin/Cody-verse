import React from 'react';
import { Toaster } from 'react-hot-toast';

const NotificationContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--surface-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-4)',
          fontSize: 'var(--text-sm)',
          maxWidth: '400px'
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'white'
          },
          style: {
            borderLeft: '4px solid var(--success)'
          }
        },
        error: {
          iconTheme: {
            primary: 'var(--error)',
            secondary: 'white'
          },
          style: {
            borderLeft: '4px solid var(--error)'
          }
        },
        loading: {
          iconTheme: {
            primary: 'var(--primary)',
            secondary: 'white'
          },
          style: {
            borderLeft: '4px solid var(--primary)'
          }
        }
      }}
    />
  );
};

export default NotificationContainer;