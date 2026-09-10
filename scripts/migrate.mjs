/**
 * Terminal migration runner for the Lilac Supabase project.
 *
 * SETUP (once):
 *   1. Supabase dashboard → Project Settings → Database → Connection string.
 *      Copy the "Session pooler" URI (port 5432) — it works over IPv4 and
 *      supports DDL. Do NOT use the "Transaction pooler" (port 6543).
 *   2. Add it to .env.local:
 *        DATABASE_URL=postgresql://postgres.<ref>:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
 *
 * USAGE:
 *   npm run db:migrate            apply every pending migration, in order
 *   npm run db:migrate:status     list applied / pending, apply nothing
 *   npm run db:migrate:baseline 0005_ads
 *                                 mark 0001..0005 as applied WITHOUT running
 *                                 them — use this once if the DB was migrated
 *                                 by hand before this runner existed
 *
 * Each migration runs inside its own transaction and is recorded in
 * public.schema_migrations; a failure rolls that migration back and stops.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");

// Load DATABASE_URL from .env.local if it isn't already in the environment.
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on the real environment */
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL.\n" +
      "Add your Supabase connection string to .env.local (see the header of this file):\n" +
      "  DATABASE_URL=postgresql://postgres.<ref>:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const cmd = args[0] ?? "up";

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ version: f.replace(/\.sql$/, ""), file: path.join(MIGRATIONS_DIR, f) }));
}

function resolveVersion(all, input) {
  if (!input) throw new Error("a migration version is required (e.g. 0005_ads)");
  const hit = all.find((m) => m.version === input || m.version.startsWith(input));
  if (!hit) throw new Error(`no migration matches "${input}"`);
  return hit.version;
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase-managed cert; connection is still encrypted
});

async function main() {
  const host = (() => {
    try {
      const u = new URL(DATABASE_URL);
      return `${u.hostname}:${u.port || 5432}${u.pathname}`;
    } catch {
      return "(unparseable DATABASE_URL)";
    }
  })();
  console.log(`→ ${host}\n`);

  await client.connect();
  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        version    text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const all = listMigrations();
    const applied = new Set(
      (await client.query("select version from public.schema_migrations")).rows.map((r) => r.version),
    );

    if (cmd === "status") {
      for (const m of all) {
        console.log(`  ${applied.has(m.version) ? "applied " : "PENDING "}  ${m.version}`);
      }
      return;
    }

    if (cmd === "baseline") {
      const target = resolveVersion(all, args[1]);
      for (const m of all) {
        if (!applied.has(m.version)) {
          await client.query(
            "insert into public.schema_migrations (version) values ($1) on conflict do nothing",
            [m.version],
          );
          console.log(`  marked applied (not run):  ${m.version}`);
        }
        if (m.version === target) break;
      }
      console.log("\nBaseline set. `npm run db:migrate` will apply anything newer.");
      return;
    }

    if (cmd === "up") {
      const pending = all.filter((m) => !applied.has(m.version));
      if (pending.length === 0) {
        console.log("Up to date — no pending migrations.");
        return;
      }
      for (const m of pending) {
        process.stdout.write(`  applying  ${m.version} ... `);
        try {
          await client.query("begin");
          await client.query(readFileSync(m.file, "utf8"));
          await client.query("insert into public.schema_migrations (version) values ($1)", [
            m.version,
          ]);
          await client.query("commit");
          console.log("ok");
        } catch (err) {
          await client.query("rollback").catch(() => {});
          console.log("FAILED\n");
          console.error(`${err.message}\n`);
          console.error("Stopped. Fix the migration and re-run `npm run db:migrate`.");
          process.exitCode = 1;
          return;
        }
      }
      console.log(`\nApplied ${pending.length} migration(s).`);
      return;
    }

    throw new Error(`unknown command "${cmd}" — use: up | status | baseline <version>`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
