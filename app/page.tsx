import HomeHeroCarousel from "@/components/storefront/HomeHeroCarousel";
import ProductGrid from "@/components/storefront/ProductGrid";
import { getFeaturedProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedProducts(10);

  return (
    <main className="bg-white text-zinc-950">
      <section className="border-b border-zinc-200">
        <HomeHeroCarousel />
      </section>

      <section className="w-full py-10">
        <ProductGrid products={featured} source="home" />
      </section>
    </main>
  );
}
