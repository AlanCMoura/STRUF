import Image from "next/image";
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
    images: string[];
    basePrice: number;
    currentPrice: number;
    isSaleActive: boolean;
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
  const hasAvailableStock = product.totalStock > 0;
  const primaryImage = product.images[0] ?? null;
  const secondaryImage = product.images[1] ?? null;
  const href =
    source === "home" ? `/produto/${product.id}?from=home` : `/produto/${product.id}`;

  return (
    <article className="group">
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className={`object-cover transition duration-500 ease-in-out ${
                  secondaryImage ? "opacity-100 group-hover:opacity-0" : "group-hover:scale-[1.03]"
                }`}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              />
              {secondaryImage ? (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} secundaria`}
                  fill
                  className="object-cover opacity-0 transition duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-[1.03]"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
              ) : null}
            </>
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${productAccent(
                product.id
              )} transition duration-300 group-hover:scale-[1.03]`}
              aria-label={product.name}
            />
          )}
        </div>

        <div className="mt-4 space-y-1 text-center">
          <h3 className="line-clamp-2 text-sm font-normal uppercase tracking-tight text-zinc-950 sm:text-base">
            {product.name}
          </h3>
          {hasAvailableStock ? (
            product.isSaleActive ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-zinc-400 line-through sm:text-base">
                  {formatBRL(product.basePrice)}
                </span>
                <span className="text-base font-medium text-zinc-950 sm:text-lg">
                  {formatBRL(product.currentPrice)}
                </span>
              </div>
            ) : (
              <div className="text-base font-normal text-zinc-950 sm:text-lg">
                {formatBRL(product.currentPrice)}
              </div>
            )
          ) : (
            <div className="text-sm font-normal uppercase tracking-tight text-zinc-950 sm:text-base">
              indisponivel
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
