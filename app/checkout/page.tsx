import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CheckoutPageClient from "@/components/storefront/CheckoutPageClient";
import { authOptions } from "@/lib/auth";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/checkout");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Checkout seguro
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
            Finalizar pedido
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Endereco, frete e forma de pagamento em uma unica etapa.
          </p>
        </div>

        <CheckoutPageClient />
      </div>
    </main>
  );
}
