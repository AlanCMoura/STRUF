import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { authOptions } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  const params = searchParams ? await searchParams : undefined;
  const callbackParam = params?.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam)
    ? callbackParam[0]
    : callbackParam;

  if (session) {
    redirect(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Use seu email e senha para acessar.
        </p>
        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <div className="mt-6">
          <Link
            href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="flex w-full items-center justify-center rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Cadastrar-se
          </Link>
        </div>
      </div>
    </main>
  );
}
