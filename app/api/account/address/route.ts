import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type UpdateAddressPayload = {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
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
    const body = (await req.json()) as UpdateAddressPayload;

    const zipCode = onlyDigits(body?.zipCode ?? "");
    const street = body?.street?.trim() ?? "";
    const addressNumber = onlyDigits(body?.number ?? "");
    const complement = body?.complement?.trim() ?? "";
    const district = body?.district?.trim() ?? "";
    const city = body?.city?.trim() ?? "";
    const state = body?.state?.trim().toUpperCase() ?? "";

    if (zipCode.length !== 8) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "CEP invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (street.length < 3) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Rua invalida" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!addressNumber) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Numero invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (district.length < 2) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Bairro invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (city.length < 2) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Cidade invalida" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!STATE_OPTIONS.has(state)) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Estado invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    const updated = await query<{
      zip_code: string;
      street: string;
      address_number: string;
      complement: string | null;
      district: string;
      city: string;
      state: string;
    }>(
      `
        UPDATE users
        SET
          zip_code = $1,
          street = $2,
          address_number = $3,
          complement = $4,
          district = $5,
          city = $6,
          state = $7
        WHERE id = $8
        RETURNING
          zip_code,
          street,
          address_number,
          complement,
          district,
          city,
          state
      `,
      [zipCode, street, addressNumber, complement || null, district, city, state, userId]
    );

    const row = updated.rows[0];
    log.info({ userId }, "Endereco atualizado");

    return NextResponse.json(
      {
        ok: true,
        data: {
          zipCode: row.zip_code,
          street: row.street,
          number: row.address_number,
          complement: row.complement ?? "",
          district: row.district,
          city: row.city,
          state: row.state,
        },
        requestId,
      },
      { status: 200 }
    );
  } catch (err) {
    log.error({ err }, "Erro ao atualizar endereco");
    return NextResponse.json(
      {
        error: { code: "UPDATE_ADDRESS_FAILED", message: "Erro ao atualizar endereco" },
        requestId,
      },
      { status: 500 }
    );
  }
}
