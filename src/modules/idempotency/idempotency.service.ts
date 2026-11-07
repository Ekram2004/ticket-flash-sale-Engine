import { createHash } from "node:crypto";
import {
  IdempotencyRepository,
  type IdempotencyRow,
} from "./idempotency.repository.js";

export class IdempotencyService {
  private repo = new IdempotencyRepository();
    private readonly DEFAULT_TTL_MINUTES = 1440; 
    
  generateRequestHash(body: any): string {
    const jsonString = JSON.stringify(body || {});
    return createHash("sha256").update(jsonString).digest("hex");
  }

  async handleIdempotentExecution(
    key: string,
    userId: string,
    requestBody: any,
  ): Promise<{
    action: "PROCEED" | "RETRY_LATER" | "RESPOND_CACHED";
    code?: number;
    body?: any;
  }> {
    const hash = this.generateRequestHash(requestBody);
    const lockAttempt = await this.repo.tryClaimKey(
      key,
      userId,
      hash,
      this.DEFAULT_TTL_MINUTES,
    );

    if (lockAttempt.success) {
      return { action: "PROCEED" };
    }

    const record = lockAttempt.row;
    if (!record) {
      return { action: "PROCEED" };
    }


    if (record.request_hash !== hash) {
      return {
        action: "RESPOND_CACHED",
        code: 422,
        body: {
          error: "Unprocessable Entity",
          message: "Idempotency key signature mismatch across payloads.",
        },
      };
    }

    
    if (record.status === "PROCESSING") {
      return { action: "RETRY_LATER" };
    }

    
    return {
      action: "RESPOND_CACHED",
      code: record.response_code ?? 200,
      body: record.response_body,
    };
  }

  async finalize(
    key: string,
    status: "COMPLETED" | "FAILED",
    code: number,
    body: any,
  ): Promise<void> {
    await this.repo.resolveKey(key, status, code, body);
  }

  async abortLock(key: string): Promise<void> {
    await this.repo.deleteKey(key);
  }
}
