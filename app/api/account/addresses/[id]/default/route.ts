import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getLogger } from "@/lib/logger";

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

export async function PATCH(
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

      await client.query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [
        userId,
      ]);

      const updated = await client.query<AddressRow>(
        `
          UPDATE user_addresses
          SET is_default = true, updated_at = NOW()
          WHERE id = $1
            AND user_id = $2
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
        [addressId, userId]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          ok: true,
          data: mapAddress(updated.rows[0]),
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
    log.error({ err }, "Erro ao definir endereco principal");
    return NextResponse.json(
      {
        error: {
          code: "SET_DEFAULT_ADDRESS_FAILED",
          message: "Erro ao definir endereco principal",
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
