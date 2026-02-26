import CartPageClient from "@/components/storefront/CartPageClient";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Carrinho de compras
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
            Revisar carrinho
          </h1>
        </div>

        <CartPageClient />
      </div>
    </main>
  );
}
