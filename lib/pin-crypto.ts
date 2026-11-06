import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const COST = 32_768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;
const FORMAT = "scrypt";

function getPepper(): string {
  const pepper = process.env.DOC_PIN_PEPPER;
  if (!pepper || Buffer.byteLength(pepper) < 32) {
    throw new Error("DOC PIN pepper is not configured");
  }
  return pepper;
}

function validPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{6}$/.test(pin);
}

function derivePasswordInput(pin: string, pepper: string): Buffer {
  return createHmac("sha256", pepper).update(pin, "utf8").digest();
}

/**
 * Hash one six-digit personal DOC PIN. The returned encoded hash is intended
 * for a restricted backend store, never for a public API or browser response.
 * The raw PIN is never returned or persisted by this helper.
 */
export async function hashDocPin(pin: string): Promise<string> {
  if (!validPin(pin)) throw new Error("DOC PIN must contain exactly six digits");
  const pepper = getPepper();
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(derivePasswordInput(pin, pepper), salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAX_MEMORY,
  }) as Buffer;
  return [
    FORMAT,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

/**
 * Verify a six-digit PIN against the encoded scrypt record. Malformed records
 * and wrong PINs return false; missing pepper is a configuration error.
 */
export async function verifyDocPin(pin: string, encodedHash: string): Promise<boolean> {
  const pepper = getPepper();
  if (!validPin(pin) || typeof encodedHash !== "string" || encodedHash.length > 256) return false;
  const parts = encodedHash.split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== FORMAT ||
    parts[1] !== String(COST) ||
    parts[2] !== String(BLOCK_SIZE) ||
    parts[3] !== String(PARALLELIZATION) ||
    !/^[A-Za-z0-9_-]{22}$/.test(parts[4]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[5])
  ) return false;

  try {
    const salt = Buffer.from(parts[4], "base64url");
    const expected = Buffer.from(parts[5], "base64url");
    if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
    const actual = await scrypt(derivePasswordInput(pin, pepper), salt, KEY_LENGTH, {
      N: COST,
      r: BLOCK_SIZE,
      p: PARALLELIZATION,
      maxmem: MAX_MEMORY,
    }) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
