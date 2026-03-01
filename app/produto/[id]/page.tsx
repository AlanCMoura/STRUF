import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import PdpPurchasePanel from "@/components/storefront/PdpPurchasePanel";
import { getProductById } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string | string[] }>;
}) {
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  const query = searchParams ? await searchParams : undefined;
  const fromParam = Array.isArray(query?.from) ? query?.from[0] : query?.from;
  const { id } = await params;
  const product = await getProductById(Number(id));

  if (!product) {
    notFound();
  }

  let cameFromHome = fromParam === "home";
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      cameFromHome = cameFromHome || refererUrl.pathname === "/";
    } catch {
      // ignore invalid referer
    }
  }

  const previewPanels = [
    { key: "principal", label: product.name },
    { key: "detalhe", label: product.category.name },
    { key: "textura", label: product.variants[0]?.color ?? "Cor" },
    { key: "acabamento", label: product.variants[0]?.size ?? "Tamanho" },
  ];

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6">
        <div className="mb-5 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">
            Home
          </Link>
          {" > "}
          {cameFromHome ? (
            <span className="text-zinc-900">{product.name}</span>
          ) : (
            <>
              <Link
                href={`/categoria/${product.category.slug}`}
                className="hover:text-zinc-900"
              >
                {product.category.name}
              </Link>
              {" > "}
              <span className="text-zinc-900">{product.name}</span>
            </>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {previewPanels.map((panel, index) => (
                <div
                  key={panel.key}
                  className="group relative aspect-[4/5] overflow-hidden bg-zinc-100"
                >
                  <div
                    className={`h-full w-full transition duration-300 group-hover:scale-[1.02] ${
                      index % 2 === 0
                        ? "bg-[linear-gradient(145deg,#e4e4e7,#d4d4d8)]"
                        : "bg-[linear-gradient(145deg,#d4d4d8,#c4c4c7)]"
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.28),transparent_44%,rgba(255,255,255,0.08))]" />
                  <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                    {panel.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="xl:ml-4">
            <PdpPurchasePanel
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                basePrice: product.basePrice,
                variants: product.variants,
              }}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
