import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ pedido?: string | string[]; pagamento?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const orderParam = params?.pedido;
  const paymentParam = params?.pagamento;
  const pedido = Array.isArray(orderParam) ? orderParam[0] : orderParam;
  const pagamento = Array.isArray(paymentParam) ? paymentParam[0] : paymentParam;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white md:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Pagamento aprovado
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Pedido confirmado
        </h1>
        <p className="mt-4 text-sm text-white/70">
          Obrigado pela compra. Seu pedido entrou na fila de separacao e voce
          recebera atualizacoes pelo painel.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/60">
              Numero do pedido
            </div>
            <div className="mt-2 text-2xl font-bold">
              {pedido ? `#${pedido}` : "Gerado no checkout"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/60">
              Pagamento
            </div>
            <div className="mt-2 text-2xl font-bold uppercase">
              {pagamento ?? "pix"}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/orders"
            className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Ver meus pedidos
          </Link>
          <Link
            href="/"
            className="rounded border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Voltar para a vitrine
          </Link>
        </div>
      </div>
    </main>
  );
}
