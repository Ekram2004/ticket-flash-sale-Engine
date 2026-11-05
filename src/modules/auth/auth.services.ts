import { type RegisterUserInput } from "./auth.schema.js";
import { type LoginUserInput } from "./auth.schema.js";
import { randomUUID } from "node:crypto";
import * as bcyrpt from 'bcrypt';
import { UserRepository, UserRepositoryError } from "./auth.repository.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  accessToken: string;
}

export class UserService {
  private userRespo = new UserRepository();
  private readonly saltRounds = 10;

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    const userId = randomUUID();
    const hasedPassword = await bcyrpt.hash(password, this.saltRounds);

    return this.userRespo.createUser(userId, name, email, hasedPassword);
  }

  async login(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const userRow = await this.userRespo.findUserByEmail(email);
    if (!userRow || !userRow.hashed_password) {
      throw new UserRepositoryError(401, "Invalid email or password");
    }
    const hasedPassword = userRow.hashed_password;
    const isMatch = await bcyrpt.compare(password, hasedPassword);
    if (!isMatch) {
      throw new UserRepositoryError(401, "Invalid email or password");
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is missing from configuration!",
      );
    }


    const accessToken = jwt.sign(
      {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
      },
      jwtSecret,
      { expiresIn: "1h" },
    );
    return {
      accessToken,
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
    };
  }
}

