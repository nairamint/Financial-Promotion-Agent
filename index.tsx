/**
 * Application Entry Point with Environment Init
 * 
 * This file initializes the environment configuration before starting the React app.
 * CRITICAL: Environment validation happens here to fail fast if misconfigured.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadEnvironmentConfig } from './config/env';

// Initialize and validate environment configuration
try {
  const config = loadEnvironmentConfig();

  // Store audit secret key in global scope for service access
  // This avoids circular dependency issues with config/env.ts
  (globalThis as any).__AUDIT_SECRET_KEY__ = config.auditSecretKey;

  console.log('✅ Application environment validated successfully');
} catch (error) {
  console.error('❌ Failed to initialize application:', error);

  // Show user-friendly error in development
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; background: #fee; border: 2px solid #c00; border-radius: 8px;">
        <h1 style="color: #c00; margin-top: 0;">⚠️ Configuration Error</h1>
        <p><strong>The application could not start due to missing environment configuration.</strong></p>
        <p>${error instanceof Error ? error.message : String(error)}</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <h3>Setup Instructions:</h3>
        <ol>
          <li>Copy <code>.env.local.template</code> to <code>.env.local</code></li>
          <li>Fill in all required values (see template for details)</li>
          <li>Generate secure keys with: <code>openssl rand -hex 32</code></li>
          <li>Restart the development server</li>
        </ol>
      </div>
    `;
    throw error;
  }

  // In production, show generic error
  document.body.innerHTML = `
    <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
      <h1>Application Error</h1>
      <p>Please contact your system administrator.</p>
    </div>
  `;
  throw error;
}

// Start React application
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);