import Image from "next/image";
import Link from "next/link";
import CategoryCatalogClient from "@/components/storefront/CategoryCatalogClient";
import CategoryFiltersToolbar from "@/components/storefront/CategoryFiltersToolbar";

export const dynamic = "force-dynamic";

export default function OffersPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="relative h-[150px] overflow-hidden border-b border-zinc-200 md:h-[220px]">
        <Image
          src="/banners/banner%20demonstra%C3%A7%C3%A3o%20struf.png"
          alt="Banner da vitrine de ofertas"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.18em] text-white md:text-5xl">
            Ofertas
          </h1>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-5 md:px-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs text-zinc-500">
                <Link href="/" className="hover:text-zinc-900">
                  Inicio
                </Link>
                {" > "}
                <span className="text-zinc-700">Produtos</span>
                {" > "}
                <span className="font-medium text-zinc-900">Ofertas</span>
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-zinc-950">
                Produtos em oferta
              </h2>
            </div>
            <div className="lg:justify-self-end">
              <CategoryFiltersToolbar />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-8">
        <div className="mx-auto w-full max-w-[1800px] px-4 md:px-6">
          <CategoryCatalogClient onlyOffers />
        </div>
      </section>
    </main>
  );
}

