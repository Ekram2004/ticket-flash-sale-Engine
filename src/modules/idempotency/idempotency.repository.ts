import { db } from "../../db/pool.js";


export interface IdempotencyRow {
  idempotency_key: string;
  user_id: string;
  request_hash: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  response_code: number | null;
  response_body: any | null;
  expires_at: Date;
}

export class IdempotencyRepository {
  async tryClaimKey(
    key: string,
    userId: string,
    requestHash: string,
    ttlMinutes: number,
  ): Promise<{ success: boolean; row?: IdempotencyRow }> {
    const client = await db.connect();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    try {
      const result = await client.query<IdempotencyRow>(
        `INSERT INTO idempotency_keys (idempotency_key, user_id, request_hash, status, expires_at)
         VALUES ($1, $2, $3, 'PROCESSING', $4)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING *`,
        [key, userId, requestHash, expiresAt],
      );

      if (result.rowCount && result.rowCount > 0 && result.rows[0]) {
        return { success: true, row: result.rows[0] };
      }
      const existing = await client.query<IdempotencyRow>(
        `SELECT * FROM idempotency_keys WHERE idempotency_key = $1`,
        [key],
      );
      const existingRow = existing.rows[0];
      return existingRow
        ? { success: false, row: existingRow }
        : { success: false };
    } finally {
      client.release();
    }
  }

  async resolveKey(
    key: string,
    status: "COMPLETED" | "FAILED",
    responseCode: number,
    responseBody: any,
  ): Promise<void>{
      const client = await db.connect();
      try {
          await client.query(`UPDATE idempotency_keys
         SET status = $2, response_code = $3, response_body = $4
         WHERE idempotency_key = $1`, [key, status, responseCode, JSON.stringify(responseBody)]);
      } finally {
          client.release();
      }
    }
    
    async deleteKey(key: string): Promise<void>{
        const client = await db.connect();
        try {
            await client.query(`DELETE FROM idempotency_keys WHERE idempotency_key = $1`, [key]);
        } finally {
            client.release();
        }
    }
}