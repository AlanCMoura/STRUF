import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/users");
  }
  if (session.user.role !== "admin") {
    redirect("/admin");
  }

  const createdAtColumnResult = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'created_at'
      ) AS exists
    `
  );

  const createdAtSelect = createdAtColumnResult.rows[0]?.exists
    ? "created_at::text AS created_at"
    : "NULL::text AS created_at";

  const usersResult = await query<UserRow>(
    `
      SELECT
        id,
        name,
        email,
        role,
        ${createdAtSelect}
      FROM users
      ORDER BY id DESC
      LIMIT 200
    `
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Usuarios</h2>
        <p className="text-sm text-zinc-600">
          Visualize os perfis de acesso (customer, manager, admin).
        </p>
      </div>

      <section className="overflow-hidden border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-900">
              {usersResult.rows.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 text-zinc-500">#{user.id}</td>
                  <td className="px-4 py-4">{user.name}</td>
                  <td className="px-4 py-4 text-zinc-700">{user.email}</td>
                  <td className="px-4 py-4 text-zinc-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex border border-zinc-300 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
