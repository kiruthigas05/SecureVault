import bcrypt from 'bcryptjs';

export class HashingService {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hashes user authentication password with a secure salt.
   * Plaintext passwords are never stored.
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares an incoming password with the stored hash using constant-time comparison.
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
