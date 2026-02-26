import Link from "next/link";
import { notFound } from "next/navigation";
import PdpPurchasePanel from "@/components/storefront/PdpPurchasePanel";
import { getProductById } from "@/lib/storefront";

export const dynamic = "force-dynamic";

function panelTone(index: number) {
  const tones = [
    "bg-zinc-100",
    "bg-zinc-200",
    "bg-zinc-900 text-white",
    "bg-zinc-50",
  ];
  return tones[index % tones.length];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(Number(id));

  if (!product) {
    notFound();
  }

  const previewPanels = [
    { label: "Look frontal", detail: product.name },
    { label: "Textura", detail: product.category.name },
    { label: "Detalhe", detail: product.variants[0]?.sku ?? "SKU" },
    { label: "Drop", detail: "Streetwear archive" },
  ];

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">
            Home
          </Link>{" "}
          /{" "}
          <Link
            href={`/categoria/${product.category.slug}`}
            className="hover:text-zinc-900"
          >
            {product.category.name}
          </Link>{" "}
          / <span className="text-zinc-900">{product.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {previewPanels.map((panel, index) => (
                <div
                  key={panel.label}
                  className={`relative grid aspect-square place-items-center overflow-hidden border border-zinc-200 p-6 ${panelTone(
                    index
                  )}`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
                  <div className="relative text-center">
                    <p className="text-xs uppercase tracking-[0.18em] opacity-70">
                      {panel.label}
                    </p>
                    <p className="mt-2 text-2xl font-black uppercase tracking-tight">
                      {panel.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-zinc-200 bg-zinc-50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-600">
                Descricao
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                {product.description ??
                  "Peca desenvolvida para compor o drop principal. Atualize este texto quando houver descricao editorial completa e fotos reais."}
              </p>
            </div>
          </section>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <PdpPurchasePanel
              product={{
                id: product.id,
                name: product.name,
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
