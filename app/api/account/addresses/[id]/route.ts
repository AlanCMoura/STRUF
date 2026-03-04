import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { PoolClient } from "pg";
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

async function ensureDefaultAddress(client: PoolClient, userId: number) {
  const defaultResult = await client.query<{ id: number }>(
    `
      SELECT id
      FROM user_addresses
      WHERE user_id = $1 AND is_default = true
      LIMIT 1
    `,
    [userId]
  );

  if (defaultResult.rows.length > 0) {
    return;
  }

  await client.query(
    `
      UPDATE user_addresses
      SET is_default = true
      WHERE id = (
        SELECT id
        FROM user_addresses
        WHERE user_id = $1
        ORDER BY id ASC
        LIMIT 1
      )
    `,
    [userId]
  );
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const addressId = Number.parseInt(id, 10);
    if (!Number.isFinite(addressId) || addressId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_ADDRESS_ID", message: "Endereco invalido" }, requestId },
        { status: 400 }
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

      const found = await client.query<{ id: number }>(
        `SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [addressId, userId]
      );
      if (found.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: { code: "ADDRESS_NOT_FOUND", message: "Endereco nao encontrado" }, requestId },
          { status: 404 }
        );
      }

      if (data.isDefault) {
        await client.query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [
          userId,
        ]);
      }

      const updated = await client.query<AddressRow>(
        `
          UPDATE user_addresses
          SET
            label = $1,
            zip_code = $2,
            street = $3,
            address_number = $4,
            complement = $5,
            district = $6,
            city = $7,
            state = $8,
            is_default = $9,
            updated_at = NOW()
          WHERE id = $10
            AND user_id = $11
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
          data.label,
          data.zipCode,
          data.street,
          data.number,
          data.complement || null,
          data.district,
          data.city,
          data.state,
          data.isDefault,
          addressId,
          userId,
        ]
      );

      await ensureDefaultAddress(client, userId);

      const refreshed = await client.query<AddressRow>(
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
          WHERE id = $1 AND user_id = $2
          LIMIT 1
        `,
        [addressId, userId]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          ok: true,
          data: mapAddress(refreshed.rows[0] ?? updated.rows[0]),
          requestId,
        },
        { status: 200 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const addressId = Number.parseInt(id, 10);
    if (!Number.isFinite(addressId) || addressId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_ADDRESS_ID", message: "Endereco invalido" }, requestId },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const ownedAddress = await client.query<{ id: number }>(
        `
          SELECT id
          FROM user_addresses
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [addressId, userId]
      );

      if (ownedAddress.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: { code: "ADDRESS_NOT_FOUND", message: "Endereco nao encontrado" }, requestId },
          { status: 404 }
        );
      }

      const countBeforeDelete = await client.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM user_addresses
          WHERE user_id = $1
        `,
        [userId]
      );

      if (Number(countBeforeDelete.rows[0]?.total ?? 0) <= 1) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error: {
              code: "MINIMUM_ONE_ADDRESS_REQUIRED",
              message: "O usuario precisa manter pelo menos 1 endereco",
            },
            requestId,
          },
          { status: 409 }
        );
      }

      await client.query<{ is_default: boolean }>(
        `
          DELETE FROM user_addresses
          WHERE id = $1
            AND user_id = $2
          RETURNING is_default
        `,
        [addressId, userId]
      );

      await ensureDefaultAddress(client, userId);
      await client.query("COMMIT");

      return NextResponse.json({ ok: true, requestId }, { status: 200 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    log.error({ err }, "Erro ao excluir endereco");
    return NextResponse.json(
      {
        error: { code: "DELETE_ADDRESS_FAILED", message: "Erro ao excluir endereco" },
        requestId,
      },
      { status: 500 }
    );
  }
}
