import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Minha conta</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Pagina protegida com getServerSession.
        </p>

        <div className="mt-6 rounded border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div>
            <strong>ID:</strong> {session.user.id}
          </div>
          <div>
            <strong>Nome:</strong> {session.user.name}
          </div>
          <div>
            <strong>Email:</strong> {session.user.email}
          </div>
          <div>
            <strong>Role:</strong> {session.user.role}
          </div>
        </div>
      </div>
    </main>
  );
}
