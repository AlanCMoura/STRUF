import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getUserOrders } from "@/lib/storefront";
import AccountShell from "@/components/account/AccountShell";

type UserProfileRow = {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  cellphone: string | null;
  sex: string | null;
  birth_date: string | null;
};

type UserAddressRow = {
  id: number;
  label: string | null;
  zip_code: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  is_default: boolean;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDocument(value: string | null) {
  if (!value) {
    return "Nao informado";
  }
  if (value.length !== 11) {
    return value;
  }
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  if (value.length === 11) {
    return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (value.length === 10) {
    return value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value;
}

function formatBirthDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  const dateOnly = value.slice(0, 10);
  const parsed = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Nao informado";
  }

  return parsed.toLocaleDateString("pt-BR");
}

function buildAddressLabel(address: UserAddressRow | null) {
  if (!address) {
    return null;
  }

  if (
    !address.street ||
    !address.address_number ||
    !address.district ||
    !address.city ||
    !address.state ||
    !address.zip_code
  ) {
    return null;
  }

  const firstLine = `${address.street}, ${address.address_number}`;
  const secondLine = `${address.district} - ${address.city}/${address.state}`;
  const thirdLine = `CEP ${address.zip_code}`;
  const complement = address.complement ? `, ${address.complement}` : "";

  return {
    id: address.id,
    label: address.label ?? "Endereco",
    firstLine: `${firstLine}${complement}`,
    secondLine,
    thirdLine,
  };
}

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  const userId = Number(session.user.id);

  const [profileResult, addressResult, orders] = await Promise.all([
    query<UserProfileRow>(
      `
        SELECT
          id,
          name,
          email,
          cpf,
          cellphone,
          sex,
          birth_date::text AS birth_date
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
    getUserOrders(userId),
  ]);

  const profile = profileResult.rows[0] ?? null;
  const defaultAddressRow =
    addressResult.rows.find((address) => address.is_default) ?? addressResult.rows[0] ?? null;
  const address = buildAddressLabel(defaultAddressRow);
  const recentOrders = orders.slice(0, 3);

  return (
    <AccountShell
      activeTab="home"
      userName={profile?.name ?? session.user.name ?? "cliente"}
      userEmail={profile?.email ?? session.user.email ?? ""}
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="border border-zinc-200 bg-white">
            <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-zinc-900">Meus pedidos</h2>
              <Link href="/account/pedidos" className="text-sm underline underline-offset-2">
                Exibir todos
              </Link>
            </header>

            {recentOrders.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center px-6 text-center text-sm text-zinc-500">
                Voce ainda nao tem pedidos.
              </div>
            ) : (
              <ul className="space-y-3 p-4">
                {recentOrders.map((order) => (
                  <li key={order.id} className="border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">Pedido #{order.id}</p>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {order.status}
                        </p>
                      </div>
                      <p className="font-semibold text-zinc-900">{formatBRL(order.totalAmount)}</p>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">{formatDate(order.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="border border-zinc-200 bg-white">
            <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-zinc-900">Meus enderecos</h2>
              <Link
                href={
                  defaultAddressRow
                    ? `/account/endereco?edit=1&addressId=${defaultAddressRow.id}`
                    : "/account/endereco?edit=1"
                }
                className="cursor-pointer text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
              >
                Editar
              </Link>
            </header>

            {address ? (
              <div className="space-y-2 p-4 text-sm text-zinc-700">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{address.label}</p>
                <p className="font-semibold text-zinc-900">{address.firstLine}</p>
                <p>{address.secondLine}</p>
                <p>{address.thirdLine}</p>
                <p className="pt-1 text-xs text-zinc-500">
                  {addressResult.rows.length} endereco(s) cadastrado(s)
                </p>
              </div>
            ) : (
              <div className="grid min-h-[260px] place-items-center px-6 text-center text-sm text-zinc-500">
                Nenhum endereco cadastrado.
              </div>
            )}
          </article>
        </div>

        <article className="border border-zinc-200 bg-white">
          <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-zinc-900">Dados e preferencias</h2>
            <Link
              href="/account/dados?edit=1"
              className="cursor-pointer text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Editar
            </Link>
          </header>

          <div className="grid gap-4 p-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Nome</p>
              <p className="mt-1 text-zinc-900">{profile?.name ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
              <p className="mt-1 text-zinc-900">{profile?.email ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">CPF</p>
              <p className="mt-1 text-zinc-900">{formatDocument(profile?.cpf ?? null)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Celular</p>
              <p className="mt-1 text-zinc-900">{formatPhone(profile?.cellphone ?? null)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Sexo</p>
              <p className="mt-1 capitalize text-zinc-900">
                {profile?.sex?.replace("-", " ") ?? "Nao informado"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Data de nascimento</p>
              <p className="mt-1 text-zinc-900">{formatBirthDate(profile?.birth_date ?? null)}</p>
            </div>
          </div>
        </article>
      </div>
    </AccountShell>
  );
}
