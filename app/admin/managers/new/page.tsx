import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CreateManagerForm from "@/components/CreateManagerForm";

export default async function CreateManagerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/managers/new");
  }

  if (session.user.role !== "admin") {
    redirect("/admin");
  }

  return (
    <section className="mx-auto w-full max-w-xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Cadastrar manager</h2>
        <p className="text-sm text-zinc-600">
          Envie um convite para o novo manager definir senha e acessar o painel.
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-5">
        <CreateManagerForm />
      </div>
    </section>
  );
}
