/**
 * Encryption Service
 * Handles secure encryption and decryption of router credentials
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCODING = "hex";
const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 16;

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;

  if (!keyEnv) {
    console.warn(
      "[Encryption] No ENCRYPTION_KEY found in environment. Using default key (NOT SECURE FOR PRODUCTION)"
    );
    // Generate a consistent key from a default string for development
    return crypto.scryptSync("netguardpro-default-key", "salt", 32);
  }

  // If key is provided as hex string
  if (keyEnv.length === 64) {
    return Buffer.from(keyEnv, "hex");
  }

  // If key is provided as regular string, derive it
  return crypto.scryptSync(keyEnv, "salt", 32);
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, "utf8", ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = iv.toString(ENCODING) + authTag.toString(ENCODING) + encrypted;

    return combined;
  } catch (error) {
    console.error("[Encryption] Error encrypting data:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();

    // Extract IV, authTag, and encrypted data
    const iv = Buffer.from(encryptedData.substring(0, IV_LENGTH * 2), ENCODING);
    const authTag = Buffer.from(
      encryptedData.substring(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
      ENCODING
    );
    const encrypted = encryptedData.substring(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, ENCODING, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Encryption] Error decrypting data:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash a string using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = hashData(password);
  return crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(hash));
}

/**
 * Encrypt router credentials
 */
export function encryptRouterCredentials(username: string, password: string): string {
  const credentials = JSON.stringify({ username, password });
  return encryptData(credentials);
}

/**
 * Decrypt router credentials
 */
export function decryptRouterCredentials(
  encryptedCredentials: string
): { username: string; password: string } {
  const decrypted = decryptData(encryptedCredentials);
  return JSON.parse(decrypted);
}

/**
 * Generate a secure encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return "*".repeat(data.length);
  }
  const visible = data.substring(0, visibleChars);
  const masked = "*".repeat(data.length - visibleChars);
  return visible + masked;
}

/**
 * Verify encryption key strength
 */
export function verifyKeyStrength(): boolean {
  const key = getEncryptionKey();
  return key.length === 32; // 256 bits
}
