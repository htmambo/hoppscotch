import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as fs from "node:fs/promises";
import {
  loadBundleApiConfig,
  validateBundleApiConfig,
} from "./bundle-api.config";
import {
  resolveKeyPair,
  signData,
} from "./key-provider";
import {
  BundleApiError,
  BundleNotFoundError,
  ManifestNotFoundError,
  InvalidManifestError,
  BundleTooLargeError,
} from "./bundle-api.errors";
import type {
  BundleApiConfig,
  PublicKeyInfo,
  BundleMetadata,
  BundleData,
  BuildManifest,
} from "./bundle-api.types";

/**
 * Bundle API Service
 *
 * Responsible for:
 * - Loading bundle.zip and manifest.json on startup
 * - Generating ed25519 signature for the bundle
 * - Providing metadata and file contents to the controller
 */
@Injectable()
export class BundleApiService implements OnModuleInit {
  private readonly logger = new Logger(BundleApiService.name);
  private config: BundleApiConfig;
  private bundleData: BundleData | null = null;

  constructor() {
    this.config = loadBundleApiConfig();
  }

  /**
   * Initialize service on module startup
   * - Validate configuration
   * - Load bundle files
   * - Generate signature
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log("Initializing Bundle API service...");

      // Validate configuration
      validateBundleApiConfig(this.config);
      this.logger.debug("Configuration validated");

      // Load bundle data
      await this.loadBundleData();
      this.logger.log(
        `Bundle loaded successfully: version=${this.bundleData.metadata.version}, ` +
        `size=${this.bundleData.zipBytes.length} bytes`
      );
    } catch (error) {
      this.logger.error("Failed to initialize Bundle API service", error);
      throw error;
    }
  }

  /**
   * Load bundle data from files
   */
  private async loadBundleData(): Promise<void> {
    const { zipPath, manifestPath, maxSizeBytes, version, signing } = this.config;

    // Load bundle.zip
    this.logger.debug(`Loading bundle from: ${zipPath}`);
    const zipBytes = await this.loadZipFile(zipPath, maxSizeBytes);

    // Load manifest.json
    this.logger.debug(`Loading manifest from: ${manifestPath}`);
    const buildManifest = await this.loadManifestFile(manifestPath);

    // Resolve signing key
    this.logger.debug("Resolving signing key");
    const keyPair = await resolveKeyPair(this.config);
    const publicKeyB64 = Buffer.from(keyPair.publicKey).toString("base64");

    // Sign the ZIP bytes
    this.logger.debug("Generating signature for bundle");
    const signature = signData(zipBytes, keyPair.secretKey);

    // Build metadata
    const metadata: BundleMetadata = {
      version: version || buildManifest.version,
      created_at: buildManifest.created_at,
      signature,
      manifest: {
        files: buildManifest.files,
        version: buildManifest.version,
      },
      properties: {},
    };

    // Cache bundle data
    this.bundleData = {
      zipBytes,
      metadata,
      publicKeyB64,
    };
  }

  /**
   * Load ZIP file with size validation
   */
  private async loadZipFile(
    path: string,
    maxSizeBytes: number
  ): Promise<Buffer> {
    try {
      const buffer = await fs.readFile(path);

      if (buffer.length > maxSizeBytes) {
        throw new BundleTooLargeError(buffer.length, maxSizeBytes);
      }

      return buffer;
    } catch (error) {
      if (error instanceof BundleApiError) {
        throw error;
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new BundleNotFoundError(path);
      }

      throw new BundleApiError(
        `Failed to read bundle: ${error instanceof Error ? error.message : "Unknown error"}`,
        "BUNDLE_READ_ERROR",
        error
      );
    }
  }

  /**
   * Load and parse manifest file
   */
  private async loadManifestFile(path: string): Promise<BuildManifest> {
    try {
      const content = await fs.readFile(path, "utf-8");
      const manifest = JSON.parse(content) as BuildManifest;

      // Validate basic structure
      if (!manifest.version || typeof manifest.version !== "string") {
        throw new InvalidManifestError({ error: "Missing or invalid version field" });
      }

      if (!manifest.created_at || typeof manifest.created_at !== "string") {
        throw new InvalidManifestError({ error: "Missing or invalid created_at field" });
      }

      if (!Array.isArray(manifest.files)) {
        throw new InvalidManifestError({ error: "Missing or invalid files array" });
      }

      return manifest;
    } catch (error) {
      if (error instanceof BundleApiError) {
        throw error;
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ManifestNotFoundError(path);
      }

      if (error instanceof SyntaxError) {
        throw new InvalidManifestError({ error: "Invalid JSON format" });
      }

      throw new BundleApiError(
        `Failed to read manifest: ${error instanceof Error ? error.message : "Unknown error"}`,
        "MANIFEST_READ_ERROR",
        error
      );
    }
  }

  /**
   * Get public key information
   */
  getPublicKeyInfo(): PublicKeyInfo {
    this.ensureInitialized();
    return { key: this.bundleData!.publicKeyB64 };
  }

  /**
   * Get bundle metadata
   */
  getMetadata(): BundleMetadata {
    this.ensureInitialized();
    return this.bundleData!.metadata;
  }

  /**
   * Get bundle ZIP bytes
   */
  getBundleBytes(): Buffer {
    this.ensureInitialized();
    return this.bundleData!.zipBytes;
  }

  /**
   * Check if service is initialized
   */
  private ensureInitialized(): void {
    if (!this.bundleData) {
      throw new BundleApiError(
        "Bundle API service not initialized",
        "SERVICE_NOT_INITIALIZED"
      );
    }
  }
}
