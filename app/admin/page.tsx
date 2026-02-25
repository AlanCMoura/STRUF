import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "admin" && session.user.role !== "manager") {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
        <div className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Esta area e exclusiva para administradores.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Painel Admin</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Pagina protegida por role (admin-only).
        </p>
      </div>
    </main>
  );
}
