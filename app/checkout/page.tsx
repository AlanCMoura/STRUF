import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CheckoutPageClient from "@/components/storefront/CheckoutPageClient";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

type CheckoutAddressRow = {
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

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/checkout");
  }

  const userId = Number(session.user.id);
  const addressesResult = await query<CheckoutAddressRow>(
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

  const addresses = addressesResult.rows.map((row) => ({
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
  }));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Checkout seguro
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
            Finalizar pedido
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Revise seu pedido e escolha a forma de pagamento.
          </p>
        </div>

        <CheckoutPageClient initialAddresses={addresses} />
      </div>
    </main>
  );
}
