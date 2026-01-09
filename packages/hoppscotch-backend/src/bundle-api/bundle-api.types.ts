/**
 * Bundle API Types
 *
 * This file defines the types that match the desktop app plugin expectations.
 * Reference: packages/hoppscotch-desktop/plugin-workspace/tauri-plugin-appload/src/models.rs
 */

/**
 * Standard API response wrapper
 */
export type ApiResponse<T> =
  | { success: true; data: T; error?: null }
  | { success: false; error: string };

/**
 * Public key information
 * Corresponds to PublicKeyInfo in the desktop plugin
 */
export type PublicKeyInfo = {
  key: string; // base64 encoded 32-byte ed25519 public key
};

/**
 * Single file entry in the manifest
 */
export type ManifestFileEntry = {
  path: string; // relative path in bundle
  size: number; // file size in bytes
  hash: string; // base64 encoded 32-byte BLAKE3 hash of file content
  mime_type?: string | null;
};

/**
 * Manifest structure
 */
export type Manifest = {
  files: ManifestFileEntry[];
  version?: string | null;
};

/**
 * Complete bundle metadata
 * Corresponds to BundleMetadata in the desktop plugin
 */
export type BundleMetadata = {
  version: string;
  created_at: string; // ISO8601 datetime string
  signature: string; // base64 encoded 64-byte ed25519 signature
  manifest: Manifest;
  properties?: Record<string, string>; // optional metadata
};

/**
 * Build manifest (output from Rust bundler)
 * This is the structure of manifest.json created by webapp-bundler
 */
export type BuildManifest = {
  version: string;
  created_at: string; // ISO8601 datetime string
  files: ManifestFileEntry[];
};

/**
 * Bundle API configuration
 */
export type BundleApiConfig = {
  // Paths to bundle artifacts
  zipPath: string;
  manifestPath: string;

  // Version info
  version: string;

  // Maximum bundle size (to prevent memory issues)
  maxSizeBytes: number;

  // Signing key configuration (choose one)
  signing: {
    keyB64?: string; // base64 64-byte ed25519 secret key
    seedB64?: string; // base64 32-byte seed
    secret?: string; // arbitrary string (will be hashed to seed)
    keyFile?: string; // path to file containing key
  };

  // Display information (optional)
  displayName?: string; // Display name for the bundle
  title?: string; // Window title when loaded in desktop app
  description?: string; // Description of the bundle
};

/**
 * Key pair information
 */
export type KeyPairInfo = {
  publicKey: Uint8Array; // 32 bytes
  secretKey: Uint8Array; // 64 bytes
};

/**
 * Bundle data loaded into memory
 */
export type BundleData = {
  zipBytes: Buffer;
  metadata: BundleMetadata;
  publicKeyB64: string;
};
