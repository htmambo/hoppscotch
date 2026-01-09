import * as fs from "node:fs/promises";
import * as crypto from "node:crypto";
import nacl from "tweetnacl";
import {
  BundleApiConfig,
  KeyPairInfo,
} from "./bundle-api.types";
import {
  KeyConfigurationError,
} from "./bundle-api.errors";

/**
 * Resolve and generate ed25519 key pair from various sources
 * Implements the same priority as Go webapp-server:
 * 1. BUNDLE_SIGNING_KEY (base64 64 bytes)
 * 2. BUNDLE_SIGNING_SEED (base64 32 bytes)
 * 3. BUNDLE_SIGNING_SECRET (string -> sha256 -> seed)
 * 4. BUNDLE_SIGNING_KEY_FILE (read key from file)
 */
export async function resolveKeyPair(config: BundleApiConfig): Promise<KeyPairInfo> {
  const { signing } = config;

  // Priority 1: Direct key (base64 64 bytes)
  if (signing.keyB64) {
    return resolveFromKey(signing.keyB64);
  }

  // Priority 2: Seed (base64 32 bytes)
  if (signing.seedB64) {
    return resolveFromSeed(signing.seedB64);
  }

  // Priority 3: Secret (string -> sha256 -> seed)
  if (signing.secret) {
    return resolveFromSecret(signing.secret);
  }

  // Priority 4: Key file
  if (signing.keyFile) {
    return resolveFromKeyFile(signing.keyFile);
  }

  throw new KeyConfigurationError(
    "No signing key source configured"
  );
}

/**
 * Resolve from base64 encoded secret key (64 bytes)
 */
function resolveFromKey(keyB64: string): KeyPairInfo {
  const keyBytes = base64ToUint8Array(keyB64);

  if (keyBytes.length !== 64) {
    throw new KeyConfigurationError(
      `Invalid key length: expected 64 bytes, got ${keyBytes.length}`
    );
  }

  // In tweetnacl, secret key format is [seed(32) || publicKey(32)]
  const secretKey = keyBytes;
  const publicKey = secretKey.slice(32);

  return { secretKey, publicKey };
}

/**
 * Resolve from base64 encoded seed (32 bytes)
 */
function resolveFromSeed(seedB64: string): KeyPairInfo {
  const seed = base64ToUint8Array(seedB64);

  if (seed.length !== 32) {
    throw new KeyConfigurationError(
      `Invalid seed length: expected 32 bytes, got ${seed.length}`
    );
  }

  // Generate key pair from seed
  const keyPair = nacl.sign.keyPair.fromSeed(seed);

  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Resolve from arbitrary secret string
 * Hash the secret with SHA-256 to get a 32-byte seed
 */
function resolveFromSecret(secret: string): KeyPairInfo {
  // Hash secret to get 32-byte seed
  const hash = crypto.createHash("sha256").update(secret).digest();
  const seed = new Uint8Array(hash);

  // Generate key pair from seed
  const keyPair = nacl.sign.keyPair.fromSeed(seed);

  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Resolve from key file (synchronous, should be called during init)
 */
async function resolveFromKeyFile(filePath: string): Promise<KeyPairInfo> {
  try {
    const keyB64 = await fs.readFile(filePath, "utf-8");
    return resolveFromKey(keyB64.trim());
  } catch (error) {
    throw new KeyConfigurationError(
      `Failed to read key file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Sign data using ed25519
 * @param data - Data to sign (as Uint8Array or Buffer)
 * @param secretKey - 64-byte ed25519 secret key
 * @returns 64-byte signature as base64 string
 */
export function signData(
  data: Uint8Array | Buffer,
  secretKey: Uint8Array
): string {
  const dataBytes = data instanceof Buffer ? new Uint8Array(data) : data;
  const signature = nacl.sign.detached(dataBytes, secretKey);

  if (signature.length !== 64) {
    throw new Error(`Invalid signature length: ${signature.length}`);
  }

  return Buffer.from(signature).toString("base64");
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = Buffer.from(base64, "base64").toString("binary");
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new KeyConfigurationError(
      `Invalid base64 encoding: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Export key provider utilities
 */
export const KeyProvider = {
  resolveKeyPair,
  signData,
};
