// bcryptjs wrappers (design rules 2-3): the only place passwords are hashed
// or compared. Plain passwords must never leave these functions.
import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// Compared against when the email is unknown, so the response time does not
// reveal whether the account exists (design §6, no enumeration).
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);
