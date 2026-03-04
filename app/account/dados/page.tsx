import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import AccountShell from "@/components/account/AccountShell";
import PersonalDataForm from "@/components/account/PersonalDataForm";

type UserProfileRow = {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  cellphone: string | null;
  sex: string | null;
  birth_date: string | null;
};

function formatDocument(value: string | null) {
  if (!value) {
    return "";
  }
  if (value.length !== 11) {
    return value;
  }
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(value: string | null) {
  if (!value) {
    return "";
  }

  if (value.length === 11) {
    return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (value.length === 10) {
    return value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value;
}

export const dynamic = "force-dynamic";

export default async function AccountDadosPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/dados");
  }

  const userId = Number(session.user.id);
  const params = searchParams ? await searchParams : undefined;
  const editParam = params?.edit;
  const startInEditMode = Array.isArray(editParam)
    ? editParam.includes("1")
    : editParam === "1";

  const profileResult = await query<UserProfileRow>(
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
  );

  const profile = profileResult.rows[0] ?? null;
  const birthDate = profile?.birth_date ? profile.birth_date.slice(0, 10) : "";

  return (
    <AccountShell
      activeTab="dados"
      userName={profile?.name ?? session.user.name ?? "cliente"}
      userEmail={profile?.email ?? session.user.email ?? ""}
    >
      <article className="border border-zinc-200 bg-white">
        <PersonalDataForm
          initialValues={{
            name: profile?.name ?? session.user.name ?? "",
            email: profile?.email ?? session.user.email ?? "",
            cpf: formatDocument(profile?.cpf ?? null),
            cellphone: formatPhone(profile?.cellphone ?? null),
            sex: profile?.sex ?? "",
            birthDate,
          }}
          startInEditMode={startInEditMode}
        />
      </article>
    </AccountShell>
  );
}
