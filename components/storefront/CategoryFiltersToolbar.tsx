"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG"];

const SORT_OPTIONS = [
  { value: "mais_vendido", label: "Mais vendidos" },
  { value: "preco_crescente", label: "Menor preço" },
  { value: "preco_decrescente", label: "Maior preço" },
];

function setMultiValue(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  for (const value of values) {
    params.append(key, value);
  }
}

function readMultiValue(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function CategoryFiltersToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSizes = useMemo(
    () =>
      readMultiValue(searchParams, "size")
        .map((value) => value.toUpperCase())
        .filter((value, index, list) => list.indexOf(value) === index),
    [searchParams]
  );

  const selectedSort = useMemo(() => {
    const sort = (searchParams.get("sort") ?? "mais_vendido").toLowerCase();
    const exists = SORT_OPTIONS.some((option) => option.value === sort);
    return exists ? sort : "mais_vendido";
  }, [searchParams]);

  const updateQuery = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("color");
    updater(params);
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const toggleSize = (size: string) => {
    const next = new Set(selectedSizes);
    if (next.has(size)) {
      next.delete(size);
    } else {
      next.add(size);
    }

    updateQuery((params) => {
      setMultiValue(params, "size", Array.from(next));
      params.set("page", "1");
    });
  };

  const changeSort = (sort: string) => {
    updateQuery((params) => {
      params.set("sort", sort);
      params.set("page", "1");
    });
  };

  const hasActiveFilters =
    selectedSizes.length > 0 ||
    selectedSort !== "mais_vendido" ||
    searchParams.get("page") !== null;

  const clearFilters = () => {
    updateQuery((params) => {
      params.delete("color");
      params.delete("size");
      params.delete("sort");
      params.delete("page");
    });
  };

  return (
    <div className="w-full max-w-[860px]">
      <div className="grid gap-8 md:grid-cols-[1.25fr_auto_auto] md:items-end md:gap-8">

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
            Tamanho
          </p>
          <div className="flex flex-nowrap gap-3">
            {SIZE_OPTIONS.map((size) => (
              <label
                key={size}
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={() => toggleSize(size)}
                  className="h-4 w-4 cursor-pointer border-zinc-400"
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        <div className="md:pt-1 md:pl-4">
          <label
            htmlFor="sort-products"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-700"
          >
            Ordenar por
          </label>
          <select
            id="sort-products"
            value={selectedSort}
            onChange={(event) => changeSort(event.target.value)}
            className="h-7 w-full max-w-[220px] border border-zinc-300 px-3 text-sm text-zinc-900 outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:pt-6 md:justify-self-end">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="h-7 whitespace-nowrap bg-black px-4 text-xs font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
