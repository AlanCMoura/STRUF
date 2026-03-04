import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type UpdateProfilePayload = {
  name?: string;
  email?: string;
  cpf?: string;
  cellphone?: string;
  sex?: string;
  birthDate?: string;
};

const ALLOWED_SEX = new Set(["feminino", "masculino", "nao-informar"]);

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCpf(value: string) {
  if (value.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(value)) {
    return false;
  }

  const digits = value.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += digits[i] * (10 - i);
  }
  const firstCheck = (sum * 10) % 11;
  if ((firstCheck === 10 ? 0 : firstCheck) !== digits[9]) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += digits[i] * (11 - i);
  }
  const secondCheck = (sum * 10) % 11;
  return (secondCheck === 10 ? 0 : secondCheck) === digits[10];
}

function normalizeBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return null;
  }

  return value;
}

export async function PUT(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "Usuario nao autenticado" },
          requestId,
        },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);
    const body = (await req.json()) as UpdateProfilePayload;

    const name = body?.name?.trim() ?? "";
    const email = body?.email?.trim().toLowerCase() ?? "";
    const cpf = onlyDigits(body?.cpf ?? "");
    const cellphone = onlyDigits(body?.cellphone ?? "");
    const sex = body?.sex?.trim().toLowerCase() ?? "";
    const birthDateRaw = body?.birthDate?.trim() ?? "";
    const birthDate = normalizeBirthDate(birthDateRaw);

    if (name.length < 3) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Nome invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Email invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!isValidCpf(cpf)) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "CPF invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!(cellphone.length === 10 || cellphone.length === 11)) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Celular invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_SEX.has(sex)) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Sexo invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Data de nascimento invalida" },
          requestId,
        },
        { status: 400 }
      );
    }

    const emailInUse = await query<{ id: number }>(
      `SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1`,
      [email, userId]
    );
    if (emailInUse.rows.length > 0) {
      return NextResponse.json(
        {
          error: { code: "EMAIL_IN_USE", message: "Este e-mail ja esta em uso" },
          requestId,
        },
        { status: 409 }
      );
    }

    const cpfInUse = await query<{ id: number }>(
      `SELECT id FROM users WHERE cpf = $1 AND id <> $2 LIMIT 1`,
      [cpf, userId]
    );
    if (cpfInUse.rows.length > 0) {
      return NextResponse.json(
        {
          error: { code: "CPF_IN_USE", message: "Este CPF ja esta em uso" },
          requestId,
        },
        { status: 409 }
      );
    }

    const updated = await query<{
      name: string;
      email: string;
      cpf: string;
      cellphone: string;
      sex: string;
      birth_date: string;
    }>(
      `
        UPDATE users
        SET
          name = $1,
          email = $2,
          cpf = $3,
          cellphone = $4,
          sex = $5,
          birth_date = $6
        WHERE id = $7
        RETURNING name, email, cpf, cellphone, sex, birth_date::text AS birth_date
      `,
      [name, email, cpf, cellphone, sex, birthDate, userId]
    );

    const row = updated.rows[0];
    log.info({ userId }, "Perfil atualizado");

    return NextResponse.json(
      {
        ok: true,
        data: {
          name: row.name,
          email: row.email,
          cpf: row.cpf,
          cellphone: row.cellphone,
          sex: row.sex,
          birthDate: row.birth_date.slice(0, 10),
        },
        requestId,
      },
      { status: 200 }
    );
  } catch (err) {
    log.error({ err }, "Erro ao atualizar perfil");
    return NextResponse.json(
      {
        error: { code: "UPDATE_PROFILE_FAILED", message: "Erro ao atualizar perfil" },
        requestId,
      },
      { status: 500 }
    );
  }
}
