import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import AccountShell from "@/components/account/AccountShell";
import AddressForm from "@/components/account/AddressForm";

type UserProfileRow = {
  id: number;
  name: string;
  email: string;
};

type UserAddressRow = {
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

export const dynamic = "force-dynamic";

export default async function AccountEnderecoPage({
  searchParams,
}: {
  searchParams?: Promise<{
    edit?: string | string[];
    addressId?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/endereco");
  }

  const userId = Number(session.user.id);
  const params = searchParams ? await searchParams : undefined;
  const editParam = params?.edit;
  const rawAddressId = Array.isArray(params?.addressId)
    ? params?.addressId[0]
    : params?.addressId;
  const parsedAddressId = rawAddressId ? Number.parseInt(rawAddressId, 10) : NaN;
  const editAddressId = Number.isFinite(parsedAddressId) ? parsedAddressId : null;
  const startInEditMode = Array.isArray(editParam)
    ? editParam.includes("1")
    : editParam === "1";

  const [profileResult, addressResult] = await Promise.all([
    query<UserProfileRow>(
      `
        SELECT id, name, email
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    ),
    query<UserAddressRow>(
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
    ),
  ]);

  const profile = profileResult.rows[0] ?? null;

  return (
    <AccountShell
      activeTab="endereco"
      userName={profile?.name ?? session.user.name ?? "cliente"}
      userEmail={profile?.email ?? session.user.email ?? ""}
    >
      <AddressForm
        initialAddresses={addressResult.rows.map((row) => ({
          id: row.id,
          label: row.label ?? "Endereco",
          zipCode: row.zip_code ?? "",
          street: row.street ?? "",
          number: row.address_number ?? "",
          complement: row.complement ?? "",
          district: row.district ?? "",
          city: row.city ?? "",
          state: row.state ?? "",
          isDefault: row.is_default,
        }))}
        startInEditMode={startInEditMode}
        editAddressId={editAddressId}
      />
    </AccountShell>
  );
}
