import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type AddressPayload = {
  label?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  isDefault?: boolean;
};

type AddressData = {
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type AddressRow = {
  id: number;
  label: string | null;
  zip_code: string;
  street: string;
  address_number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  is_default: boolean;
};

const STATE_OPTIONS = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function mapAddress(row: AddressRow) {
  return {
    id: row.id,
    label: row.label ?? "Endereco",
    zipCode: row.zip_code,
    street: row.street,
    number: row.address_number,
    complement: row.complement ?? "",
    district: row.district,
    city: row.city,
    state: row.state,
    isDefault: row.is_default,
  };
}

function validate(payload: AddressPayload): { data: AddressData } | { error: string } {
  const label = payload.label?.trim() ?? "";
  const zipCode = onlyDigits(payload.zipCode ?? "");
  const street = payload.street?.trim() ?? "";
  const number = onlyDigits(payload.number ?? "");
  const complement = payload.complement?.trim() ?? "";
  const district = payload.district?.trim() ?? "";
  const city = payload.city?.trim() ?? "";
  const state = payload.state?.trim().toUpperCase() ?? "";
  const isDefault = payload.isDefault === true;

  if (label.length < 2) {
    return { error: "Apelido do endereco invalido" };
  }
  if (zipCode.length !== 8) {
    return { error: "CEP invalido" };
  }
  if (street.length < 3) {
    return { error: "Rua invalida" };
  }
  if (!number) {
    return { error: "Numero invalido" };
  }
  if (district.length < 2) {
    return { error: "Bairro invalido" };
  }
  if (city.length < 2) {
    return { error: "Cidade invalida" };
  }
  if (!STATE_OPTIONS.has(state)) {
    return { error: "Estado invalido" };
  }

  return {
    data: {
      label,
      zipCode,
      street,
      number,
      complement,
      district,
      city,
      state,
      isDefault,
    },
  };
}

export async function GET() {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Usuario nao autenticado" }, requestId },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    const result = await pool.query<AddressRow>(
      `
        SELECT
          id,
          label,
          zip_code,
          street,
          address_number,
          complement,
          district,
          city,
          state,
          is_default
        FROM user_addresses
        WHERE user_id = $1
        ORDER BY is_default DESC, id ASC
      `,
      [userId]
    );

    return NextResponse.json(
      {
        ok: true,
        data: result.rows.map(mapAddress),
        requestId,
      },
      { status: 200 }
    );
  } catch (err) {
    log.error({ err }, "Erro ao listar enderecos");
    return NextResponse.json(
      {
        error: { code: "LIST_ADDRESSES_FAILED", message: "Erro ao listar enderecos" },
        requestId,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Usuario nao autenticado" }, requestId },
        { status: 401 }
      );
    }

    const payload = (await req.json()) as AddressPayload;
    const parsed = validate(payload);
    if (!("data" in parsed)) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: parsed.error }, requestId },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const userId = Number(session.user.id);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const countResult = await client.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM user_addresses WHERE user_id = $1`,
        [userId]
      );
      const hasAddresses = Number(countResult.rows[0]?.total ?? 0) > 0;
      const makeDefault = data.isDefault || !hasAddresses;

      if (makeDefault) {
        await client.query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [
          userId,
        ]);
      }

      const createdResult = await client.query<AddressRow>(
        `
          INSERT INTO user_addresses (
            user_id,
            label,
            zip_code,
            street,
            address_number,
            complement,
            district,
            city,
            state,
            is_default
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING
            id,
            label,
            zip_code,
            street,
            address_number,
            complement,
            district,
            city,
            state,
            is_default
        `,
        [
          userId,
          data.label,
          data.zipCode,
          data.street,
          data.number,
          data.complement || null,
          data.district,
          data.city,
          data.state,
          makeDefault,
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          ok: true,
          data: mapAddress(createdResult.rows[0]),
          requestId,
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    log.error({ err }, "Erro ao criar endereco");
    return NextResponse.json(
      {
        error: { code: "CREATE_ADDRESS_FAILED", message: "Erro ao criar endereco" },
        requestId,
      },
      { status: 500 }
    );
  }
}
