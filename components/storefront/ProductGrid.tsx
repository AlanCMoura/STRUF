import ProductCard from "@/components/storefront/ProductCard";

type ProductGridItem = Parameters<typeof ProductCard>[0]["product"];

export default function ProductGrid({
  products,
  title,
  subtitle,
}: {
  products: ProductGridItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="space-y-8">
      {title ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-950">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
          Nenhum produto encontrado nesta selecao.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={index < 2 ? "drop" : index % 3 === 0 ? "sale" : "new"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
