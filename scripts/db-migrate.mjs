import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"
import pg from "pg"

const { Client } = pg
const migrationsDir = path.join(process.cwd(), "supabase", "migrations")
const dockerContainer = process.env.SUPABASE_DB_CONTAINER ?? "supabase-db"
const dockerDb = process.env.SUPABASE_DB_NAME ?? "postgres"
const dockerUser = process.env.SUPABASE_DB_USER ?? "postgres"

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

async function getMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort()
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function runDockerPsql(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-i",
        dockerContainer,
        "psql",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        dockerUser,
        "-d",
        dockerDb,
        ...args,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    )

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", reject)

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout)
        return
      }

      reject(new Error(stderr || stdout || `docker psql exited with ${code}`))
    })

    if (input) {
      child.stdin.end(input)
    } else {
      child.stdin.end()
    }
  })
}

async function runDockerQuery(sql) {
  return runDockerPsql(["-At", "-c", sql])
}

async function ensureMigrationsTableWithClient(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `)
}

async function getAppliedVersionsWithClient(client) {
  const result = await client.query("select version from public.schema_migrations")
  return new Set(result.rows.map((row) => row.version))
}

async function applyMigrationWithClient(client, fileName) {
  const sql = await fs.readFile(path.join(migrationsDir, fileName), "utf8")

  await client.query("begin")
  try {
    await client.query(sql)
    await client.query(
      "insert into public.schema_migrations(version) values ($1) on conflict do nothing",
      [fileName],
    )
    await client.query("commit")
    console.log(`Applied ${fileName}`)
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function runPgMigrations(migrationFiles) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()
  try {
    await ensureMigrationsTableWithClient(client)
    const appliedVersions = await getAppliedVersionsWithClient(client)
    const pendingFiles = migrationFiles.filter((file) => !appliedVersions.has(file))

    if (pendingFiles.length === 0) {
      console.log("No pending migrations")
      return
    }

    for (const fileName of pendingFiles) {
      await applyMigrationWithClient(client, fileName)
    }
  } finally {
    await client.end()
  }
}

async function ensureMigrationsTableWithDocker() {
  await runDockerQuery(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `)
}

async function getAppliedVersionsWithDocker() {
  const output = await runDockerQuery("select version from public.schema_migrations")

  return new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  )
}

async function applyMigrationWithDocker(fileName) {
  const sql = await fs.readFile(path.join(migrationsDir, fileName), "utf8")
  const migrationSql = `
begin;
${sql}
insert into public.schema_migrations(version)
values (${sqlLiteral(fileName)})
on conflict do nothing;
commit;
`

  await runDockerPsql([], migrationSql)
  console.log(`Applied ${fileName}`)
}

async function runDockerMigrations(migrationFiles) {
  console.log(`Using docker postgres container: ${dockerContainer}`)

  await ensureMigrationsTableWithDocker()
  const appliedVersions = await getAppliedVersionsWithDocker()
  const pendingFiles = migrationFiles.filter((file) => !appliedVersions.has(file))

  if (pendingFiles.length === 0) {
    console.log("No pending migrations")
    return
  }

  for (const fileName of pendingFiles) {
    await applyMigrationWithDocker(fileName)
  }
}

function shouldFallbackToDocker(error) {
  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes("Tenant or user not found") ||
    message.includes("Invalid URL") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("DATABASE_URL is not configured")
  )
}

async function main() {
  await loadEnvFile(path.join(process.cwd(), ".env.local"))
  await loadEnvFile(path.join(process.cwd(), ".env"))

  const migrationFiles = await getMigrationFiles()

  try {
    await runPgMigrations(migrationFiles)
  } catch (error) {
    if (!shouldFallbackToDocker(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : String(error)
    console.warn(`DATABASE_URL migration failed: ${message}`)
    console.warn("Falling back to local Docker Postgres migration.")
    await runDockerMigrations(migrationFiles)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
