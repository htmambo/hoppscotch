import { Module } from "@nestjs/common";
import { BundleApiController } from "./bundle-api.controller";
import { BundleApiService } from "./bundle-api.service";

/**
 * Bundle API Module
 *
 * Provides endpoints for desktop app to download and verify frontend bundle
 *
 * This module is independent and can be optionally enabled via environment:
 * - Set ENABLE_BUNDLE_API=true to enable
 * - Or rely on the fact that service will fail fast if bundle files are missing
 */
@Module({
  controllers: [BundleApiController],
  providers: [BundleApiService],
  exports: [BundleApiService],
})
export class BundleApiModule {}
