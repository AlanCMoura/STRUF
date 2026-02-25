import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CreateManagerForm from "@/components/CreateManagerForm";

export default async function CreateManagerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/admin/managers/new");
  }

  if (session.user.role !== "admin") {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
        <div className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Apenas administradores podem cadastrar managers.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Cadastrar manager</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Crie um usuario com role manager.
        </p>
        <div className="mt-6">
          <CreateManagerForm />
        </div>
      </div>
    </main>
  );
}
