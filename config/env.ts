/**
 * Environment Configuration & Validation
 * 
 * This module provides type-safe access to environment variables and validates
 * that all required configuration is present before the application starts.
 * 
 * CRITICAL: This module will throw an error if required environment variables
 * are missing, preventing the application from starting in an invalid state.
 */

// Environment variable schema
interface EnvironmentConfig {
  // API Keys
  geminiApiKey: string;
  fcaRegisterApiKey?: string;
  
  // Google Cloud Platform
  gcpProjectId: string;
  gcsAuditBucket: string;
  gcsRetentionYears: number;
  
  // Cryptographic Keys
  auditSecretKey: string;
  auditBackupKey?: string;
  
  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  
  // Optional: Monitoring
  sentryDsn?: string;
  gaTrackingId?: string;
}

/**
 * Validates that a required environment variable is present
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value === 'your_' + key.toLowerCase() + '_here') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please ensure .env.local is configured correctly.\n` +
      `See .env.local.template for reference.`
    );
  }
  return value;
}

/**
 * Gets an optional environment variable
 */
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Validates cryptographic key format
 */
function validateKeyFormat(key: string, name: string): void {
  // Keys should be hex strings of at least 32 characters (16 bytes)
  if (key.length < 32) {
    throw new Error(
      `${name} must be at least 32 characters long (16 bytes).\n` +
      `Generate with: openssl rand -hex 32`
    );
  }
  
  // Check if it's a hex string
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    console.warn(
      `Warning: ${name} should be a hexadecimal string.\n` +
      `Generate with: openssl rand -hex 32`
    );
  }
}

/**
 * Load and validate environment configuration
 * This function is called at application startup
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // Only validate in non-test environments
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  // In test mode, use mock values
  if (isTest) {
    return {
      geminiApiKey: 'test-gemini-key',
      gcpProjectId: 'test-project',
      gcsAuditBucket: 'test-bucket',
      gcsRetentionYears: 7,
      auditSecretKey: '0'.repeat(64), // 64 char hex string
      nodeEnv: 'test',
    };
  }
  
  try {
    // Required variables
    const geminiApiKey = requireEnv('GEMINI_API_KEY');
    const gcpProjectId = requireEnv('GCP_PROJECT_ID');
    const gcsAuditBucket = requireEnv('GCS_AUDIT_BUCKET');
    const auditSecretKey = requireEnv('AUDIT_SECRET_KEY');
    
    // Validate cryptographic keys
    validateKeyFormat(auditSecretKey, 'AUDIT_SECRET_KEY');
    
    const auditBackupKey = getEnv('AUDIT_BACKUP_KEY');
    if (auditBackupKey) {
      validateKeyFormat(auditBackupKey, 'AUDIT_BACKUP_KEY');
      
      // Ensure backup key is different from primary
      if (auditBackupKey === auditSecretKey) {
        throw new Error('AUDIT_BACKUP_KEY must be different from AUDIT_SECRET_KEY');
      }
    }
    
    // Optional variables
    const fcaRegisterApiKey = getEnv('FCA_REGISTER_API_KEY');
    const sentryDsn = getEnv('SENTRY_DSN');
    const gaTrackingId = getEnv('GA_TRACKING_ID');
    
    // Parse retention years
    const retentionYears = parseInt(getEnv('GCS_BUCKET_RETENTION_YEARS', '7'), 10);
    if (isNaN(retentionYears) || retentionYears < 7) {
      throw new Error('GCS_BUCKET_RETENTION_YEARS must be at least 7 for SYSC 9 compliance');
    }
    
    const config: EnvironmentConfig = {
      geminiApiKey,
      fcaRegisterApiKey: fcaRegisterApiKey || undefined,
      gcpProjectId,
      gcsAuditBucket,
      gcsRetentionYears: retentionYears,
      auditSecretKey,
      auditBackupKey: auditBackupKey || undefined,
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      sentryDsn: sentryDsn || undefined,
      gaTrackingId: gaTrackingId || undefined,
    };
    
    // Log configuration status (without secrets)
    if (isDevelopment) {
      console.log('✅ Environment configuration loaded:');
      console.log(`   - Node Environment: ${config.nodeEnv}`);
      console.log(`   - GCP Project: ${config.gcpProjectId}`);
      console.log(`   - Audit Bucket: ${config.gcsAuditBucket}`);
      console.log(`   - Retention: ${config.gcsRetentionYears} years`);
      console.log(`   - Gemini API: ${config.geminiApiKey ? 'Configured ✓' : 'Missing ✗'}`);
      console.log(`   - Audit Key: ${config.auditSecretKey ? 'Configured ✓' : 'Missing ✗'}`);
      console.log(`   - Backup Key: ${config.auditBackupKey ? 'Configured ✓' : 'Not set'}`);
    }
    
    return config;
    
  } catch (error) {
    console.error('\n❌ Environment Configuration Error:\n');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\n📝 Setup Instructions:');
    console.error('   1. Copy .env.local.template to .env.local');
    console.error('   2. Fill in all required values');
    console.error('   3. Generate secure keys with: openssl rand -hex 32\n');
    
    // In development, provide helpful error
    if (isDevelopment) {
      throw error;
    }
    
    // In production, fail fast
    process.exit(1);
  }
}

// Singleton instance
let config: EnvironmentConfig | null = null;

/**
 * Get the current environment configuration
 * Loads and validates on first access
 */
export function getConfig(): EnvironmentConfig {
  if (!config) {
    config = loadEnvironmentConfig();
  }
  return config;
}

/**
 * Get a specific configuration value (type-safe)
 */
export function getConfigValue<K extends keyof EnvironmentConfig>(
  key: K
): EnvironmentConfig[K] {
  return getConfig()[key];
}

// Export for testing
export const __resetConfig = () => {
  config = null;
};
