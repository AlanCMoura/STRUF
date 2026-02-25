import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import pg from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";
const databaseUrl = process.env.DATABASE_URL;
const saltRounds = Number(process.env.SALT_ROUNDS ?? 12);

if (!databaseUrl) {
  console.error("DATABASE_URL nao configurada");
  process.exit(1);
}

if (!email || !password) {
  console.error("Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de rodar o script");
  process.exit(1);
}

async function run() {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const result = await client.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            password = EXCLUDED.password,
            role = 'admin'
      RETURNING id
      `,
      [name, email.toLowerCase(), passwordHash]
    );

    console.log(`Admin criado/atualizado: id ${result.rows[0].id}`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Erro ao criar admin", err);
  process.exit(1);
});
