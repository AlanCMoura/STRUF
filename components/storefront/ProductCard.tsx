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
  source?: "home" | "category";
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

export default function ProductCard({
  product,
  source,
  highlight,
}: ProductCardProps) {
  void highlight;
  const href =
    source === "home" ? `/produto/${product.id}?from=home` : `/produto/${product.id}`;

  return (
    <article className="group">
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
          <div
            className={`h-full w-full bg-gradient-to-br ${productAccent(
              product.id
            )} transition duration-300 group-hover:scale-[1.03]`}
            aria-label={product.name}
          />
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
