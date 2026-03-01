"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductGrid from "@/components/storefront/ProductGrid";

type ProductItem = {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  currentPrice: number;
  salePrice: number | null;
  onSale: boolean;
  saleEndsAt: string | null;
  isSaleActive: boolean;
  category: { id: number; name: string; slug: string };
  totalStock: number;
  variants: Array<{
    id: number;
    sku: string;
    size: string;
    color: string;
    stockQuantity: number;
  }>;
};

type ApiResponse = {
  items: ProductItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

export default function CategoryCatalogClient({
  categorySlug,
  onlyOffers = false,
}: {
  categorySlug?: string;
  onlyOffers?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPage = useMemo(() => {
    const parsed = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    if (!params.get("sort")) {
      params.set("sort", "mais_vendido");
    }
    if (!params.get("page")) {
      params.set("page", "1");
    }
    if (onlyOffers) {
      params.set("onSale", "true");
    } else {
      params.delete("onSale");
    }

    void fetch(`/api/products?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Falha ao buscar produtos");
        }
        const payload = (await response.json()) as ApiResponse;
        setData(payload);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setError("Nao foi possivel carregar os produtos desta categoria.");
      });

    return () => controller.abort();
  }, [categorySlug, onlyOffers, searchKey, searchParams]);

  const updateQuery = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const changePage = (page: number) => {
    const safePage = Math.max(1, page);
    updateQuery((params) => {
      params.set("page", String(safePage));
    });
  };

  const hasResults = (data?.items.length ?? 0) > 0;
  const hasNoResults = data !== null && data.items.length === 0;
  const showPagination = data !== null && hasResults;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {hasResults ? (
        <ProductGrid products={data?.items ?? []} source="category" />
      ) : null}

      {hasNoResults ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          Nenhum produto encontrado nesta seleção.
        </p>
      ) : null}

      {showPagination ? (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={() => changePage(selectedPage - 1)}
            disabled={!data?.pagination.hasPreviousPage}
            className="border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Pagina {data?.pagination.page ?? selectedPage} de {data?.pagination.totalPages ?? 1}
          </p>

          <button
            type="button"
            onClick={() => changePage(selectedPage + 1)}
            disabled={!data?.pagination.hasNextPage}
            className="border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proximo
          </button>
        </div>
      ) : null}
    </div>
  );
}
