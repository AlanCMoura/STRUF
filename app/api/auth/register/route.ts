import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getLogger } from "@/lib/logger";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  profile?: {
    cpf?: string;
    cellphone?: string;
    phone?: string;
    sex?: string;
    birthDate?: string;
  };
  address?: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    reference?: string;
    district?: string;
    city?: string;
    state?: string;
  };
};

const ALLOWED_SEX = new Set(["feminino", "masculino", "nao-informar"]);

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeCpf(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length > 0 ? digitsOnly : null;
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length > 0 ? digitsOnly : null;
}

function normalizeBirthDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return "INVALID";
  }
  return normalized;
}

function isValidCpf(value: string) {
  if (value.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(value)) {
    return false;
  }

  const digits = value.split("").map(Number);

  const firstCheck = (() => {
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      sum += digits[i] * (10 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  })();

  const secondCheck = (() => {
    let sum = 0;
    for (let i = 0; i < 10; i += 1) {
      sum += digits[i] * (11 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  })();

  return firstCheck === digits[9] && secondCheck === digits[10];
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const body = (await req.json()) as RegisterPayload;
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";
    const cpf = normalizeCpf(body?.profile?.cpf);
    const cellphone = normalizePhone(body?.profile?.cellphone);
    const phone = normalizePhone(body?.profile?.phone);
    const sex = toNullableString(body?.profile?.sex);
    const birthDate = normalizeBirthDate(body?.profile?.birthDate);

    const zipCode = toNullableString(body?.address?.zipCode);
    const street = toNullableString(body?.address?.street);
    const addressNumber = toNullableString(body?.address?.number);
    const complement = toNullableString(body?.address?.complement);
    const addressReference = toNullableString(body?.address?.reference);
    const district = toNullableString(body?.address?.district);
    const city = toNullableString(body?.address?.city);
    const state = toNullableString(body?.address?.state)?.toUpperCase() ?? null;

    if (!name || !email || !password || password.length < 6) {
      log.warn({ email }, "Cadastro invalido: dados insuficientes");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Nome, email e senha (min 6) sao obrigatorios",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!cpf) {
      log.warn({ email }, "Cadastro invalido: CPF obrigatorio");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "CPF e obrigatorio",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!isValidCpf(cpf)) {
      log.warn({ email }, "Cadastro invalido: CPF invalido");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "CPF invalido",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!cellphone || cellphone.length < 10) {
      log.warn({ email }, "Cadastro invalido: celular obrigatorio");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Celular obrigatorio e deve ser valido",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!birthDate || birthDate === "INVALID") {
      log.warn({ email }, "Cadastro invalido: data de nascimento obrigatoria");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Data de nascimento obrigatoria (YYYY-MM-DD)",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (
      !zipCode ||
      !street ||
      !addressNumber ||
      !complement ||
      !district ||
      !city ||
      !state
    ) {
      log.warn({ email }, "Cadastro invalido: endereco incompleto");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Endereco completo obrigatorio (Referencia opcional)",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (sex && !ALLOWED_SEX.has(sex)) {
      log.warn({ email, sex }, "Cadastro invalido: sexo fora do padrao");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Campo sex invalido",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (state && state.length !== 2) {
      log.warn({ email, state }, "Cadastro invalido: UF invalida");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Estado deve ter 2 caracteres (UF)",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const existing = await query<{ id: number }>(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      log.warn({ email }, "Cadastro invalido: email ja cadastrado");
      return NextResponse.json(
        {
          error: {
            code: "EMAIL_IN_USE",
            message: "Email ja cadastrado",
          },
          requestId,
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const result = await query<{ id: number }>(
      `INSERT INTO users (
         name,
         email,
         password,
         role,
         cpf,
         cellphone,
         phone,
         sex,
         birth_date,
         zip_code,
         street,
         address_number,
         complement,
         address_reference,
         district,
         city,
         state
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15, $16, $17
       )
       RETURNING id`,
      [
        name,
        email,
        passwordHash,
        "customer",
        cpf,
        cellphone,
        phone,
        sex,
        birthDate,
        zipCode,
        street,
        addressNumber,
        complement,
        addressReference,
        district,
        city,
        state,
      ]
    );

    const userId = result.rows[0]?.id;
    log.info({ userId }, "Usuario criado");

    return NextResponse.json({ ok: true, userId, requestId }, { status: 201 });
  } catch (err) {
    const dbErr = err as { code?: string; constraint?: string };
    if (dbErr?.code === "23505" && dbErr?.constraint === "users_cpf_unique_idx") {
      log.warn({ err }, "Cadastro invalido: CPF ja cadastrado");
      return NextResponse.json(
        {
          error: {
            code: "CPF_IN_USE",
            message: "CPF ja cadastrado",
          },
          requestId,
        },
        { status: 409 }
      );
    }

    log.error({ err }, "Erro ao registrar usuario");
    return NextResponse.json(
      {
        error: {
          code: "REGISTER_FAILED",
          message: "Erro ao registrar usuario",
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
