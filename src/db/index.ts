import { db } from './pool.js';
import fs from 'fs';
import path from 'path';



export async function runMigrations(): Promise<void>{
    const migrationsDir = path.join(process.cwd(), "migrations");

    try {
        if (!fs.existsSync(migrationsDir) || !fs.statSync(migrationsDir).isDirectory()) {
            throw new Error(
                `CRITICAL: The migrations directory is missing at "${migrationsDir}". ` +
                `Please create it manually during your project setup.`
            );
        }
    } catch (fsError) {
        throw new Error(
          `Failed to access migrations directory: ${(fsError as Error).message}`,
        );

    }
    const client = await db.connect();
    let destroyClient = false;


    try {
      await client.query(`CREATE TABLE IF NOT EXISTS _schema_migrations(
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMPTZ DEFAULT NOW()
            );
            `);

      const files = fs.readdirSync(migrationsDir).sort();

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const isSqlFile =
          file.endsWith(".sql") && fs.statSync(filePath).isFile();

        if (isSqlFile) {
          const checkRes = await client.query(
            "SELECT 1 FROM _schema_migrations WHERE filename = $1",
            [file],
          );
          if (checkRes.rowCount === 0) {
            const sql = fs.readFileSync(filePath, "utf-8").trim();
            if (sql.length === 0) {
              throw new Error(
                `Migration rejection: The script file "${file}" is completely empty.`,
              );
            }
            try {
              await client.query("BEGIN");
              await client.query(sql);
              await client.query(
                "INSERT INTO _schema_migrations(filename) VALUES ($1)",
                [file],
              );
              await client.query("COMMIT");
              console.log(`Successfully executed migration: ${file}`);
            } catch (fileError) {
              console.error(
                `Migration script [${file}] failed. Executing database rollback...`,
              );
              try {
                await client.query("ROLLBACK");
              } catch (rollbackError) {
                console.error(
                  "CRITICAL ERROR: Database transaction failed to rollback properly:",
                  rollbackError,
                );
                destroyClient = true;
              }

              throw fileError;
            }
          }
        }
      }
    } catch (error) {
      console.error("Migrations failed:", error);
      throw error;
    } finally {
      if (destroyClient) {
        client.release(
          new Error("Rollback failed; discard this database connection."),
        );

        console.warn("Database client was destroyed because rollback failed.");
      } else {
        client.release();
      }
    }
}