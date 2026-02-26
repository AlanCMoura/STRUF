import ProductGrid from "@/components/storefront/ProductGrid";
import { getFeaturedProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedProducts(10);

  return (
    <main className="bg-white text-zinc-950">
      <section className="border-b border-zinc-200 bg-black text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="relative overflow-hidden border border-white/10 bg-zinc-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(circle_at_82%_30%,rgba(255,255,255,0.05),transparent_60%)]" />
            <div className="absolute inset-y-0 left-[12%] w-px bg-white/10" />
            <div className="absolute inset-y-0 right-[12%] w-px bg-white/10" />

            <div className="relative grid min-h-[380px] place-items-center px-6 py-12 md:min-h-[580px]">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                  Struf
                </p>
                <h1 className="mt-4 text-5xl font-black uppercase leading-none tracking-tight md:text-7xl">
                  New Drop
                </h1>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/45">
                  Streetwear catalog
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-10 md:px-6">
        <ProductGrid products={featured} />
      </section>
    </main>
  );
}
