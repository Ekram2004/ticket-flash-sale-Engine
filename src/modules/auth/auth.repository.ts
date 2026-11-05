import { db } from "../../db/pool.js";


export class UserRepositoryError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "UserRepositoryError";
    }
}

export interface UserDbRow {
  id: string;
  email: string;
  name: string;
  role: string;
  hashed_password: string;
}

export class UserRepository {
  private readonly EMAIL_CONSTRAINT_NAME = "users_email_key";

  async createUser(
    userId: string,
    name: string,
    email: string,
    hashedPassword: string,
  ): Promise<string> {
    const client = await db.connect();
    try {
      await client.query(
        `INSERT INTO users (id, name, email, hashed_password)VALUES($1, $2, $3, $4)`,
        [userId, name, email, hashedPassword],
      );
      return userId;
    } catch (error:any) {
      if (
        error.code === "23505" &&
        error.constraint === this.EMAIL_CONSTRAINT_NAME
      ) {
        throw new UserRepositoryError(409, "Email already registered");
      }

      throw new UserRepositoryError(
        500,
        "Internal server error during user creation",
      );

    } finally {
      client.release();
    }
  }
  async findUserByEmail(email: string): Promise<UserDbRow | null> {
    const client = await db.connect();

    try {
      const result = await client.query(
        `SELECT id, name, email, role, hashed_password FROM users WHERE email = $1`,
        [email],
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new UserRepositoryError(
        500,
        "Internal server error during user lookup",
      );
    } finally {
      client.release();
    }
  }
}

