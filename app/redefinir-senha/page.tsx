import ActivateForm from "@/components/ActivateForm";

export const dynamic = "force-dynamic";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Redefinir senha</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Crie uma nova senha para acessar sua conta.
        </p>
        <div className="mt-6">
          {token ? (
            <ActivateForm token={token} />
          ) : (
            <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Token invalido ou ausente.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
