import { plainToInstance } from "class-transformer";
import { IsString, IsNumber, IsOptional, validateSync } from "class-validator";
import { BundleApiConfig } from "./bundle-api.types";

/**
 * Environment variables for Bundle API
 */
export class BundleApiEnv {
  // Path to bundle.zip file
  @IsString()
  BUNDLE_ZIP_PATH: string;

  // Path to manifest.json file
  @IsString()
  BUNDLE_MANIFEST_PATH: string;

  // Bundle version (should match manifest.json.version)
  @IsString()
  @IsOptional()
  BUNDLE_VERSION?: string;

  // Maximum bundle size in bytes (default: 50MB)
  @IsNumber()
  @IsOptional()
  BUNDLE_MAX_SIZE_BYTES?: number;

  // Signing key (choose one approach)
  @IsString()
  @IsOptional()
  BUNDLE_SIGNING_KEY?: string; // base64 64-byte ed25519 secret key

  @IsString()
  @IsOptional()
  BUNDLE_SIGNING_SEED?: string; // base64 32-byte seed

  @IsString()
  @IsOptional()
  BUNDLE_SIGNING_SECRET?: string; // arbitrary string

  @IsString()
  @IsOptional()
  BUNDLE_SIGNING_KEY_FILE?: string; // path to key file

  // Bundle display information
  @IsString()
  @IsOptional()
  BUNDLE_DISPLAY_NAME?: string; // Display name for the bundle

  @IsString()
  @IsOptional()
  BUNDLE_TITLE?: string; // Window title when loaded in desktop app

  @IsString()
  @IsOptional()
  BUNDLE_DESCRIPTION?: string; // Description of the bundle
}

/**
 * Load and validate Bundle API configuration from environment variables
 */
export function loadBundleApiConfig(): BundleApiConfig {
  // Get environment variables with defaults
  const env = process.env;

  const config: BundleApiConfig = {
    zipPath: env.BUNDLE_ZIP_PATH || "/dist/backend/bundle/bundle.zip",
    manifestPath:
      env.BUNDLE_MANIFEST_PATH || "/dist/backend/bundle/manifest.json",
    version: env.BUNDLE_VERSION || env.WEBAPP_BUNDLE_VERSION || "dev",
    maxSizeBytes:
      parseInt(env.BUNDLE_MAX_SIZE_BYTES || "", 10) || 50 * 1024 * 1024, // 50MB
    signing: {
      keyB64: env.BUNDLE_SIGNING_KEY,
      seedB64: env.BUNDLE_SIGNING_SEED,
      secret: env.BUNDLE_SIGNING_SECRET,
      keyFile: env.BUNDLE_SIGNING_KEY_FILE,
    },
    displayName: env.BUNDLE_DISPLAY_NAME,
    title: env.BUNDLE_TITLE,
    description: env.BUNDLE_DESCRIPTION,
  };

  return config;
}

/**
 * Validate configuration
 * Throws an error if configuration is invalid
 */
export function validateBundleApiConfig(config: BundleApiConfig): void {
  // Check if at least one signing method is provided
  const hasKey = !!config.signing.keyB64;
  const hasSeed = !!config.signing.seedB64;
  const hasSecret = !!config.signing.secret;
  const hasKeyFile = !!config.signing.keyFile;

  if (!hasKey && !hasSeed && !hasSecret && !hasKeyFile) {
    throw new Error(
      "Bundle API signing key not configured. Please set one of: " +
        "BUNDLE_SIGNING_KEY, BUNDLE_SIGNING_SEED, BUNDLE_SIGNING_SECRET, or BUNDLE_SIGNING_KEY_FILE"
    );
  }

  // Validate paths
  if (!config.zipPath) {
    throw new Error("BUNDLE_ZIP_PATH must be configured");
  }

  if (!config.manifestPath) {
    throw new Error("BUNDLE_MANIFEST_PATH must be configured");
  }
}
