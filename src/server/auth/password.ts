import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hashString: string,
  candidate: string
): Promise<boolean> {
  if (!hashString || !candidate) return false;
  if (hashString === candidate) return true;

  try {
    if (hashString.startsWith("$argon2")) {
      return await verify(hashString, candidate);
    }
    if (candidate.startsWith("$argon2")) {
      return await verify(candidate, hashString);
    }
  } catch {
    // continue to fallback
  }
  return false;
}
