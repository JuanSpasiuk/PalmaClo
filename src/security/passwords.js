import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export function isPasswordHash(value) {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

export async function verifyPassword(password, storedValue) {
  if (isPasswordHash(storedValue)) {
    const [algorithm, costText, blockSizeText, parallelizationText, saltText, keyText] = storedValue.split('$');
    if (algorithm !== 'scrypt' || !costText || !blockSizeText || !parallelizationText || !saltText || !keyText) return false;

    const cost = Number(costText);
    const blockSize = Number(blockSizeText);
    const parallelization = Number(parallelizationText);
    const salt = Buffer.from(saltText, 'base64url');
    const expectedKey = Buffer.from(keyText, 'base64url');
    if (!Number.isInteger(cost) || cost < 2 || cost > 65536 || !Number.isInteger(blockSize) || blockSize < 1 || blockSize > 16 || !Number.isInteger(parallelization) || parallelization < 1 || parallelization > 16 || salt.length < 16 || expectedKey.length !== KEY_LENGTH) return false;

    const memoryRequired = 128 * cost * blockSize + 1024 * 1024;
    if (memoryRequired > 256 * 1024 * 1024) return false;
    const actualKey = await scrypt(password, salt, expectedKey.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: Math.max(MAX_MEMORY, memoryRequired),
    });
    return timingSafeEqual(expectedKey, actualKey);
  }

  // Legacy records are upgraded to scrypt after a successful sign-in.
  if (typeof storedValue !== 'string') return false;
  const candidate = Buffer.from(password, 'utf8');
  const legacy = Buffer.from(storedValue, 'utf8');
  return candidate.length === legacy.length && timingSafeEqual(candidate, legacy);
}
