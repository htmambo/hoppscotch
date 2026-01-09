import { Controller, Get, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { BundleApiService } from "./bundle-api.service";
import type { ApiResponse, PublicKeyInfo, BundleMetadata } from "./bundle-api.types";

/**
 * Bundle API Controller
 *
 * Provides three endpoints for desktop app to download bundle:
 * - GET /api/v1/key - Returns public key
 * - GET /api/v1/manifest - Returns bundle metadata and signature
 * - GET /api/v1/bundle - Returns bundle ZIP file
 *
 * IMPORTANT: This controller uses fixed path 'api/v1' (not Nest versioning)
 * to match desktop app plugin expectations.
 */
@Controller("api/v1")
export class BundleApiController {
  constructor(private readonly bundleApiService: BundleApiService) {}

  /**
   * GET /api/v1/key
   *
   * Returns the public key for signature verification
   *
   * Response format:
   * {
   *   "success": true,
   *   "data": { "key": "base64_32_bytes_public_key" }
   * }
   */
  @Get("key")
  getKey(): ApiResponse<PublicKeyInfo> {
    const publicKeyInfo = this.bundleApiService.getPublicKeyInfo();
    return {
      success: true,
      data: publicKeyInfo,
    };
  }

  /**
   * GET /api/v1/manifest
   *
   * Returns bundle metadata including signature
   *
   * Response format:
   * {
   *   "success": true,
   *   "data": {
   *     "version": "2025.12.1",
   *     "created_at": "2025-01-09T...",
   *     "signature": "base64_64_bytes_signature",
   *     "manifest": {
   *       "files": [...],
   *       "version": "2025.12.1"
   *     }
   *   }
   * }
   */
  @Get("manifest")
  getManifest(): ApiResponse<BundleMetadata> {
    const metadata = this.bundleApiService.getMetadata();
    return {
      success: true,
      data: metadata,
    };
  }

  /**
   * GET /api/v1/bundle
   *
   * Returns the bundle ZIP file
   *
   * Headers:
   * - Content-Type: application/zip
   * - Content-Length: <size>
   * - Content-Disposition: attachment; filename="bundle.zip"
   * - ETag: <sha256_hash>
   * - Cache-Control: public, max-age=3600
   */
  @Get("bundle")
  downloadBundle(@Res() res: Response): void {
    const bundleBytes = this.bundleApiService.getBundleBytes();

    // Calculate ETag (SHA-256 hash for cache validation)
    const crypto = require("node:crypto");
    const etag = crypto.createHash("sha256").update(bundleBytes).digest("hex");

    // Set headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", bundleBytes.length.toString());
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bundle.zip"'
    );
    res.setHeader("ETag", `"${etag}"`);
    res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache

    // Send response
    res.status(HttpStatus.OK).send(bundleBytes);
  }
}
