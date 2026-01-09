/**
 * Bundle API custom errors
 */

export class BundleApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "BundleApiError";
  }
}

export class BundleNotFoundError extends BundleApiError {
  constructor(path: string) {
    super(
      `Bundle file not found: ${path}`,
      "BUNDLE_NOT_FOUND",
      { path }
    );
    this.name = "BundleNotFoundError";
  }
}

export class ManifestNotFoundError extends BundleApiError {
  constructor(path: string) {
    super(
      `Manifest file not found: ${path}`,
      "MANIFEST_NOT_FOUND",
      { path }
    );
    this.name = "ManifestNotFoundError";
  }
}

export class InvalidManifestError extends BundleApiError {
  constructor(details: unknown) {
    super(
      "Invalid manifest format",
      "INVALID_MANIFEST",
      details
    );
    this.name = "InvalidManifestError";
  }
}

export class BundleTooLargeError extends BundleApiError {
  constructor(actualSize: number, maxSize: number) {
    super(
      `Bundle size ${actualSize} bytes exceeds maximum ${maxSize} bytes`,
      "BUNDLE_TOO_LARGE",
      { actualSize, maxSize }
    );
    this.name = "BundleTooLargeError";
  }
}

export class KeyConfigurationError extends BundleApiError {
  constructor(message: string) {
    super(
      `Key configuration error: ${message}`,
      "KEY_CONFIG_ERROR"
    );
    this.name = "KeyConfigurationError";
  }
}

export class SignatureError extends BundleApiError {
  constructor(message: string) {
    super(
      `Signature generation failed: ${message}`,
      "SIGNATURE_ERROR"
    );
    this.name = "SignatureError";
  }
}
