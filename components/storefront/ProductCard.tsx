import Link from "next/link";

type CardVariant = {
  id: number;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
};

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    description: string | null;
    basePrice: number;
    category: { name: string; slug: string };
    totalStock: number;
    variants: CardVariant[];
  };
  highlight?: "sale" | "new" | "drop";
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function productAccent(productId: number) {
  const accents = [
    "from-zinc-900 to-zinc-700",
    "from-neutral-100 to-zinc-300",
    "from-zinc-800 to-zinc-500",
    "from-zinc-950 to-zinc-400",
  ];
  return accents[productId % accents.length];
}

export default function ProductCard({ product, highlight }: ProductCardProps) {
  const firstVariant = product.variants[0];
  const label =
    highlight === "sale"
      ? "SALE"
      : highlight === "drop"
        ? "DROP"
        : highlight === "new"
          ? "NOVO"
          : null;

  return (
    <article className="group">
      <Link href={`/produto/${product.id}`} className="block">
        <div className="relative overflow-hidden border border-zinc-200 bg-zinc-100">
          {label ? (
            <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[11px] font-semibold tracking-wide text-white">
              {label}
            </span>
          ) : null}

          <div className="grid aspect-square place-items-center bg-zinc-100 p-6 sm:p-8">
            <div
              className={`relative h-full w-full border border-zinc-200 bg-gradient-to-br ${productAccent(
                product.id
              )} transition duration-300 group-hover:scale-[1.01]`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.18),transparent_35%,rgba(255,255,255,0.08))]" />
              <div className="absolute inset-x-6 bottom-6 h-3 bg-black/20 blur-md" />

              <div className="relative flex h-full flex-col justify-between p-5 text-white sm:p-6">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/80">
                  <span>{product.category.name}</span>
                  <span>{firstVariant?.size ?? "-"}</span>
                </div>

                <div className="mx-auto w-full max-w-[82%] border border-white/15 bg-black/10 px-4 py-5 text-center backdrop-blur-[1px]">
                  <p className="text-xl font-black uppercase leading-tight tracking-tight sm:text-2xl">
                    {product.name.split(" ").slice(0, 3).join(" ")}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/80">
                    {firstVariant ? `${firstVariant.color} - SKU ${firstVariant.sku}` : "Sem variacao"}
                  </p>
                </div>

                <div className="text-[11px] uppercase tracking-[0.18em] text-white/75">
                  {product.totalStock > 0 ? "Disponivel" : "Esgotado"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1 text-center">
          <h3 className="line-clamp-2 text-base font-medium uppercase tracking-tight text-zinc-950 sm:text-lg">
            {product.name}
          </h3>
          <div className="text-lg font-medium text-zinc-950 sm:text-xl">
            {formatBRL(product.basePrice)}
          </div>
        </div>
      </Link>
    </article>
  );
}
