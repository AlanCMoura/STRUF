import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/storefront/ProductGrid";
import { getCategories, getStoreProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([
    getCategories(),
    getStoreProducts({ categorySlug: slug }),
  ]);

  const category = categories.find((item) => item.slug === slug);
  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Catalogo por categoria
              </p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
                {category.name}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Navegue pelas pecas filtradas da categoria selecionada.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-900">
                Home
              </Link>{" "}
              / <span className="text-zinc-900">{category.name}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-white"
            >
              Mostrar filtros
            </button>
            <button
              type="button"
              className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-white"
            >
              Mais vendidos
            </button>
          </div>
        </div>
      </section>

      <section className="w-full py-8">
        <ProductGrid
          products={products}
          source="category"
          subtitle={`${products.length} produtos encontrados em ${category.name}.`}
        />
      </section>
    </main>
  );
}
