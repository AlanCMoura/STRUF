import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    email?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const params = searchParams ? await searchParams : undefined;
  const callbackParam = params?.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam)
    ? callbackParam[0]
    : callbackParam;
  const emailParam = params?.email;
  const initialEmail = Array.isArray(emailParam) ? emailParam[0] : emailParam;

  if (session) {
    redirect(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Preencha os dados para se cadastrar.
        </p>
        <div className="mt-6">
          <RegisterForm callbackUrl={callbackUrl} initialEmail={initialEmail} />
        </div>
      </div>
    </main>
  );
}
