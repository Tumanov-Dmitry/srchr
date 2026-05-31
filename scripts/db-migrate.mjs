import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"
import pg from "pg"

const { Client } = pg
const migrationsDir = path.join(process.cwd(), "supabase", "migrations")

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8")

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith("#")) continue

      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex === -1) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
}

await loadEnvFile(path.join(process.cwd(), ".env.local"))
await loadEnvFile(path.join(process.cwd(), ".env"))

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function getMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort()
}

async function ensureMigrationsTable() {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `)
}

async function getAppliedVersions() {
  const result = await client.query("select version from public.schema_migrations")
  return new Set(result.rows.map((row) => row.version))
}

async function applyMigration(fileName) {
  const sql = await fs.readFile(path.join(migrationsDir, fileName), "utf8")

  await client.query("begin")
  try {
    await client.query(sql)
    await client.query(
      "insert into public.schema_migrations(version) values ($1)",
      [fileName],
    )
    await client.query("commit")
    console.log(`Applied ${fileName}`)
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function main() {
  await client.connect()
  try {
    await ensureMigrationsTable()
    const appliedVersions = await getAppliedVersions()
    const migrationFiles = await getMigrationFiles()
    const pendingFiles = migrationFiles.filter((file) => !appliedVersions.has(file))

    if (pendingFiles.length === 0) {
      console.log("No pending migrations")
      return
    }

    for (const fileName of pendingFiles) {
      await applyMigration(fileName)
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
