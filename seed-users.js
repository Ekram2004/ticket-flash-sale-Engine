import { db } from "./src/db/index.ts";
import fs from "node:fs";

async function seed() {
  const userIds = JSON.parse(fs.readFileSync("./virtual-users.json", "utf8"));

  if (!Array.isArray(userIds) || userIds.length !== 5000) {
    throw new Error("Expected exactly 5,000 user IDs.");
  }

  if (new Set(userIds).size !== userIds.length) {
    throw new Error("Duplicate user IDs found in dataset.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO users
        (id, name, email, hashed_password, account_status, role)
       SELECT
        id,
        'User_' || LEFT(id::text, 8),
        id::text || '@test.com',
        'password_hash',
        'active',
        'user'
       FROM UNNEST($1::uuid[]) AS id
       ON CONFLICT DO NOTHING`,
      [userIds],
    );

    await client.query("COMMIT");

    console.log(`Users inserted: ${result.rowCount}`);

    const verification = await client.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE id = ANY($1::uuid[])`,
      [userIds],
    );

    console.log(`Verified users in database: ${verification.rows[0].total}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

seed().catch(() => (process.exitCode = 1));
