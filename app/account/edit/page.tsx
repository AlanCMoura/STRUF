import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function EditAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/account/edit");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Editar dados
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Placeholder de tela para edicao de cadastro. Pode ser ligada a uma
            rota de update futuramente.
          </p>

          <form className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
                Nome
              </label>
              <input
                defaultValue={session.user.name ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
                Email
              </label>
              <input
                defaultValue={session.user.email ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Salvar (mock)
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
