"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type CategoryOption = {
  id: number;
  name: string;
};

type ProductOption = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  basePrice: number;
  onSale: boolean;
  salePrice: number | null;
  saleEndsAt: string | null;
  images: string[];
};

type VariantOption = {
  id: number;
  productId: number;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
};

type VariantDraft = {
  sku: string;
  size: string;
  color: string;
  stockQuantity: string;
};

type AdminProductsPanelProps = {
  initialProducts: ProductOption[];
  categories: CategoryOption[];
  initialVariants: VariantOption[];
};

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG"] as const;

type TabKey = "manage" | "create" | "product" | "variants";

function toDatetimeLocal(iso: string | null) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const tzOffset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 16);
}

function normalizeFiles(fileList: File[] | FileList) {
  return Array.from(fileList)
    .filter((file) => file.type.startsWith("image/"))
    .slice(0, 4);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function moveImageToPosition<T>(items: T[], fromIndex: number, toIndex: 0 | 1) {
  if (fromIndex < 0 || fromIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [selectedItem] = next.splice(fromIndex, 1);
  next.splice(Math.min(toIndex, next.length), 0, selectedItem);
  return next.slice(0, 4);
}

export default function AdminProductsPanel({
  initialProducts,
  categories,
  initialVariants,
}: AdminProductsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("manage");
  const [products, setProducts] = useState(initialProducts);
  const [variants, setVariants] = useState(initialVariants);
  const [selectedProductId, setSelectedProductId] = useState<number>(
    initialProducts[0]?.id ?? 0
  );

  const [name, setName] = useState(initialProducts[0]?.name ?? "");
  const [description, setDescription] = useState(initialProducts[0]?.description ?? "");
  const [basePrice, setBasePrice] = useState(String(initialProducts[0]?.basePrice ?? ""));
  const [categoryId, setCategoryId] = useState<number>(
    initialProducts[0]?.categoryId ?? categories[0]?.id ?? 0
  );
  const [onSale, setOnSale] = useState(initialProducts[0]?.onSale ?? false);
  const [salePrice, setSalePrice] = useState(
    initialProducts[0]?.salePrice !== null && initialProducts[0]?.salePrice !== undefined
      ? String(initialProducts[0].salePrice)
      : ""
  );
  const [saleEndsAt, setSaleEndsAt] = useState(
    toDatetimeLocal(initialProducts[0]?.saleEndsAt ?? null)
  );

  const [currentImages, setCurrentImages] = useState<string[]>(
    (initialProducts[0]?.images ?? []).slice(0, 4)
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createBasePrice, setCreateBasePrice] = useState("");
  const [createCategoryId, setCreateCategoryId] = useState<number>(categories[0]?.id ?? 0);
  const [createOnSale, setCreateOnSale] = useState(false);
  const [createSalePrice, setCreateSalePrice] = useState("");
  const [createSaleEndsAt, setCreateSaleEndsAt] = useState("");
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [isDraggingCreateFiles, setIsDraggingCreateFiles] = useState(false);

  const [variantDrafts, setVariantDrafts] = useState<Record<number, VariantDraft>>({});
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantSize, setNewVariantSize] = useState<(typeof SIZE_OPTIONS)[number]>("P");
  const [newVariantColor, setNewVariantColor] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("0");

  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [updatingVariantIds, setUpdatingVariantIds] = useState<number[]>([]);
  const [deletingVariantIds, setDeletingVariantIds] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const selectedProductVariants = useMemo(
    () =>
      variants
        .filter((variant) => variant.productId === selectedProductId)
        .sort((a, b) => a.id - b.id),
    [variants, selectedProductId]
  );

  const openProductEditor = (productId: number, tab: "product" | "variants" = "product") => {
    setSelectedProductId(productId);
    setActiveTab(tab);
    setMessage(null);
    setError(null);
  };

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    setName(selectedProduct.name);
    setDescription(selectedProduct.description ?? "");
    setBasePrice(String(selectedProduct.basePrice ?? ""));
    setCategoryId(selectedProduct.categoryId);
    setOnSale(selectedProduct.onSale);
    setSalePrice(
      selectedProduct.salePrice !== null && selectedProduct.salePrice !== undefined
        ? String(selectedProduct.salePrice)
        : ""
    );
    setSaleEndsAt(toDatetimeLocal(selectedProduct.saleEndsAt ?? null));
    setCurrentImages((selectedProduct.images ?? []).slice(0, 4));
    setSelectedFiles([]);
    setMessage(null);
    setError(null);
  }, [selectedProduct]);

  useEffect(() => {
    const nextDrafts: Record<number, VariantDraft> = {};
    for (const variant of selectedProductVariants) {
      nextDrafts[variant.id] = {
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        stockQuantity: String(variant.stockQuantity),
      };
    }
    setVariantDrafts(nextDrafts);
  }, [selectedProductVariants]);

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles]
  );
  const createPreviewUrls = useMemo(
    () => createFiles.map((file) => URL.createObjectURL(file)),
    [createFiles]
  );

  useEffect(() => {
    return () => {
      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      for (const url of createPreviewUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [createPreviewUrls]);

  const imageSources = selectedFiles.length > 0 ? previewUrls : currentImages;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  const openCreateFilePicker = () => {
    createFileInputRef.current?.click();
  };

  const setFiles = (files: File[] | FileList) => {
    const nextFiles = normalizeFiles(files);
    setSelectedFiles(nextFiles);
  };
  const setCreateUploadFiles = (files: File[] | FileList) => {
    const nextFiles = normalizeFiles(files);
    setCreateFiles(nextFiles);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files ?? []);
  };
  const handleCreateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCreateUploadFiles(event.target.files ?? []);
  };

  const removeImageAt = (index: number) => {
    if (selectedFiles.length > 0) {
      setSelectedFiles((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
      return;
    }

    setCurrentImages((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const setEditImageRole = (index: number, role: 0 | 1) => {
    if (selectedFiles.length > 0) {
      setSelectedFiles((previous) => moveImageToPosition(previous, index, role));
      return;
    }

    setCurrentImages((previous) => moveImageToPosition(previous, index, role));
  };

  const removeCreateImageAt = (index: number) => {
    setCreateFiles((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const setCreateImageRole = (index: number, role: 0 | 1) => {
    setCreateFiles((previous) => moveImageToPosition(previous, index, role));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (event.dataTransfer.files.length === 0) {
      return;
    }
    setFiles(event.dataTransfer.files);
  };
  const handleCreateDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingCreateFiles(false);
    if (event.dataTransfer.files.length === 0) {
      return;
    }
    setCreateUploadFiles(event.dataTransfer.files);
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedProductId) {
      setError("Selecione um produto");
      return;
    }

    const parsedBasePrice = Number(basePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
      setError("Preco base invalido");
      return;
    }

    if (onSale) {
      const parsedSalePrice = Number(salePrice);
      if (!Number.isFinite(parsedSalePrice) || parsedSalePrice <= 0) {
        setError("Preco promocional invalido");
        return;
      }
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("basePrice", String(parsedBasePrice));
      formData.append("categoryId", String(categoryId));
      formData.append("onSale", String(onSale));
      formData.append("salePrice", onSale ? salePrice : "");
      formData.append("saleEndsAt", onSale ? saleEndsAt : "");
      formData.append("existingImages", JSON.stringify(currentImages.slice(0, 4)));

      for (const file of selectedFiles.slice(0, 4)) {
        formData.append("images", file);
      }

      const response = await fetch(`/api/admin/products/${selectedProductId}`, {
        method: "PUT",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao atualizar produto");
      }

      const updated = payload.product as ProductOption;

      setProducts((previous) =>
        previous.map((product) => (product.id === updated.id ? updated : product))
      );
      setCurrentImages((updated.images ?? []).slice(0, 4));
      setSelectedFiles([]);
      setMessage("Produto atualizado com sucesso.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao atualizar produto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsedBasePrice = Number(createBasePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
      setError("Preco base invalido");
      return;
    }

    if (!createName.trim()) {
      setError("Nome do produto e obrigatorio");
      return;
    }

    if (!createCategoryId) {
      setError("Selecione uma categoria");
      return;
    }

    if (createOnSale) {
      const parsedSalePrice = Number(createSalePrice);
      if (!Number.isFinite(parsedSalePrice) || parsedSalePrice <= 0) {
        setError("Preco promocional invalido");
        return;
      }
    }

    setIsCreatingProduct(true);

    try {
      const formData = new FormData();
      formData.append("name", createName.trim());
      formData.append("description", createDescription.trim());
      formData.append("basePrice", String(parsedBasePrice));
      formData.append("categoryId", String(createCategoryId));
      formData.append("onSale", String(createOnSale));
      formData.append("salePrice", createOnSale ? createSalePrice : "");
      formData.append("saleEndsAt", createOnSale ? createSaleEndsAt : "");

      for (const file of createFiles.slice(0, 4)) {
        formData.append("images", file);
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao criar produto");
      }

      const created = payload.product as ProductOption;
      setProducts((previous) => [created, ...previous]);
      setSelectedProductId(created.id);
      setActiveTab("manage");

      setCreateName("");
      setCreateDescription("");
      setCreateBasePrice("");
      setCreateCategoryId(categories[0]?.id ?? 0);
      setCreateOnSale(false);
      setCreateSalePrice("");
      setCreateSaleEndsAt("");
      setCreateFiles([]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Falha ao criar produto");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const createVariant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedProductId) {
      setError("Selecione um produto");
      return;
    }

    const parsedStock = Number(newVariantStock);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setError("Estoque da variacao invalido");
      return;
    }

    if (!newVariantSku.trim() || !newVariantColor.trim()) {
      setError("Informe SKU e cor da variacao");
      return;
    }

    setIsCreatingVariant(true);

    try {
      const response = await fetch(`/api/admin/products/${selectedProductId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newVariantSku.trim(),
          size: newVariantSize,
          color: newVariantColor.trim(),
          stockQuantity: Math.trunc(parsedStock),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao criar variacao");
      }

      const created = payload.variant as VariantOption;
      setVariants((previous) => [...previous, created]);
      setNewVariantSku("");
      setNewVariantColor("");
      setNewVariantStock("0");
      setMessage("Variacao criada com sucesso.");
      setActiveTab("variants");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Falha ao criar variacao");
    } finally {
      setIsCreatingVariant(false);
    }
  };

  const saveVariant = async (variantId: number) => {
    const draft = variantDrafts[variantId];
    if (!draft) {
      return;
    }

    const parsedStock = Number(draft.stockQuantity);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setError("Estoque da variacao invalido");
      return;
    }

    setUpdatingVariantIds((previous) => [...previous, variantId]);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: draft.sku,
          size: draft.size,
          color: draft.color,
          stockQuantity: Math.trunc(parsedStock),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao atualizar variacao");
      }

      const updated = payload.variant as VariantOption;
      setVariants((previous) =>
        previous.map((variant) => (variant.id === updated.id ? updated : variant))
      );
      setMessage("Variacao atualizada.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Falha ao atualizar variacao");
    } finally {
      setUpdatingVariantIds((previous) => previous.filter((id) => id !== variantId));
    }
  };

  const deleteVariant = async (variantId: number) => {
    if (!window.confirm("Deseja excluir esta variacao?")) {
      return;
    }

    setDeletingVariantIds((previous) => [...previous, variantId]);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao excluir variacao");
      }

      setVariants((previous) => previous.filter((variant) => variant.id !== variantId));
      setMessage("Variacao excluida.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Falha ao excluir variacao");
    } finally {
      setDeletingVariantIds((previous) => previous.filter((id) => id !== variantId));
    }
  };

  return (
    <div className="border border-zinc-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Gestao de produtos</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Cadastre produtos, edite imagens e gerencie variacoes (SKU, cor, tamanho e estoque).
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("manage")}
          className={`h-10 px-4 text-sm font-semibold ${
            activeTab === "manage"
              ? "bg-black text-white"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          Gerenciar produtos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`h-10 px-4 text-sm font-semibold ${
            activeTab === "create"
              ? "bg-black text-white"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          Novo produto
        </button>
      </div>

      {activeTab === "product" || activeTab === "variants" ? (
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-zinc-700">Produto</label>
          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(Number(event.target.value))}
            className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {activeTab === "product" || activeTab === "variants" ? (
        <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("product")}
            className={`h-10 px-4 text-sm font-semibold ${
              activeTab === "product"
                ? "bg-black text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Dados do produto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("variants")}
            className={`h-10 px-4 text-sm font-semibold ${
              activeTab === "variants"
                ? "bg-black text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Cadastro de variacoes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manage")}
            className="h-10 border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Voltar para lista
          </button>
        </div>
      ) : null}

      {activeTab === "manage" ? (
        <div className="mt-6 overflow-hidden border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Preco</th>
                  <th className="px-4 py-3">Oferta</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-900">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const categoryName =
                      categories.find((category) => category.id === product.categoryId)?.name ?? "-";

                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-3 text-zinc-500">#{product.id}</td>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-zinc-700">{categoryName}</td>
                        <td className="px-4 py-3">
                          {product.onSale && product.salePrice !== null
                            ? formatCurrency(product.salePrice)
                            : formatCurrency(product.basePrice)}
                        </td>
                        <td className="px-4 py-3">
                          {product.onSale ? (
                            <span className="inline-flex border border-zinc-300 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
                              Ativa
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openProductEditor(product.id, "product")}
                              className="h-9 border border-zinc-300 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => openProductEditor(product.id, "variants")}
                              className="h-9 border border-zinc-300 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100"
                            >
                              Variacoes
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "create" ? (
        <form onSubmit={handleCreateProduct} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">Nome</label>
              <input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">Categoria</label>
              <select
                value={createCategoryId}
                onChange={(event) => setCreateCategoryId(Number(event.target.value))}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">Preco base</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={createBasePrice}
                onChange={(event) => setCreateBasePrice(event.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={createOnSale}
                  onChange={(event) => setCreateOnSale(event.target.checked)}
                />
                Produto em oferta
              </label>
            </div>

            {createOnSale ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Preco promocional
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createSalePrice}
                    onChange={(event) => setCreateSalePrice(event.target.value)}
                    className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">Oferta ate</label>
                  <input
                    type="datetime-local"
                    value={createSaleEndsAt}
                    onChange={(event) => setCreateSaleEndsAt(event.target.value)}
                    className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">Descricao</label>
            <textarea
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              rows={4}
              className="w-full border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-700">Imagens (maximo 4)</label>

            <div
              role="button"
              tabIndex={0}
              onClick={openCreateFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openCreateFilePicker();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingCreateFiles(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingCreateFiles(false);
              }}
              onDrop={handleCreateDrop}
              className={`grid min-h-[120px] place-items-center border border-dashed px-4 text-center transition ${
                isDraggingCreateFiles
                  ? "border-black bg-zinc-100"
                  : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100"
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-800">Arraste as imagens aqui</p>
                <p className="text-xs text-zinc-500">ou clique para selecionar arquivos</p>
              </div>
            </div>

            <input
              ref={createFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleCreateFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <span>Imagem 1 = vitrine. Imagem 2 = secundaria.</span>
              {createFiles.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setCreateFiles([])}
                  className="underline underline-offset-2 hover:text-zinc-800"
                >
                  Limpar selecao
                </button>
              ) : null}
            </div>
          </div>

          {createPreviewUrls.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-4">
              {createPreviewUrls.map((src, index) => (
                <div key={`${src}-${index}`} className="border border-zinc-200 bg-zinc-50">
                  <div className="relative">
                    <Image
                      src={src}
                      alt={`Preview novo produto ${index + 1}`}
                      width={320}
                      height={400}
                      className="h-44 w-full object-cover"
                      unoptimized
                    />
                    {index === 0 ? (
                      <span className="absolute left-2 top-2 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Vitrine
                      </span>
                    ) : null}
                    {index === 1 ? (
                      <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-900">
                        Secundaria
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-2 py-2">
                    <p className="text-xs text-zinc-600">{`Imagem ${index + 1}`}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCreateImageRole(index, 0)}
                        className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
                      >
                        Vitrine
                      </button>
                      {createPreviewUrls.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setCreateImageRole(index, 1)}
                          className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
                        >
                          Secundaria
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeCreateImageAt(index)}
                        className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma imagem selecionada.</p>
          )}

          {isCreatingProduct ? <p className="text-sm text-zinc-500">Criando produto...</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isCreatingProduct}
            className="h-11 cursor-pointer bg-black px-6 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cadastrar produto
          </button>
        </form>
      ) : null}

      {activeTab === "product" ? (
        <form onSubmit={handleSaveProduct} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">Nome</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">Categoria</label>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(Number(event.target.value))}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">Preco base</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={(event) => setOnSale(event.target.checked)}
                />
                Produto em oferta
              </label>
            </div>

            {onSale ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Preco promocional
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(event) => setSalePrice(event.target.value)}
                    className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">Oferta ate</label>
                  <input
                    type="datetime-local"
                    value={saleEndsAt}
                    onChange={(event) => setSaleEndsAt(event.target.value)}
                    className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">Descricao</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-700">Imagens (maximo 4)</label>

            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingFiles(false);
              }}
              onDrop={handleDrop}
              className={`grid min-h-[120px] place-items-center border border-dashed px-4 text-center transition ${
                isDraggingFiles
                  ? "border-black bg-zinc-100"
                  : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100"
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-800">Arraste as imagens aqui</p>
                <p className="text-xs text-zinc-500">ou clique para selecionar arquivos</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <span>Imagem 1 = vitrine. Imagem 2 = secundaria.</span>
              {selectedFiles.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="underline underline-offset-2 hover:text-zinc-800"
                >
                  Desfazer upload selecionado
                </button>
              ) : null}
            </div>
          </div>

          {imageSources.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-4">
              {imageSources.map((src, index) => (
                <div key={`${src}-${index}`} className="border border-zinc-200 bg-zinc-50">
                  <div className="relative">
                    <Image
                      src={src}
                      alt={`Preview ${index + 1}`}
                      width={320}
                      height={400}
                      className="h-44 w-full object-cover"
                      unoptimized={src.startsWith("blob:")}
                    />
                    {index === 0 ? (
                      <span className="absolute left-2 top-2 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Vitrine
                      </span>
                    ) : null}
                    {index === 1 ? (
                      <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-900">
                        Secundaria
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-2 py-2">
                    <p className="text-xs text-zinc-600">{`Imagem ${index + 1}`}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditImageRole(index, 0)}
                        className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
                      >
                        Vitrine
                      </button>
                      {imageSources.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setEditImageRole(index, 1)}
                          className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
                        >
                          Secundaria
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeImageAt(index)}
                        className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma imagem cadastrada para este produto.</p>
          )}

          {isSaving ? <p className="text-sm text-zinc-500">Salvando produto...</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="h-11 cursor-pointer bg-black px-6 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar produto
          </button>
        </form>
      ) : null}

      {activeTab === "variants" ? (
        <div className="mt-6 space-y-5">
          <form onSubmit={createVariant} className="space-y-3 border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Nova variacao
            </h2>

            <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_1fr_0.7fr_auto]">
              <input
                value={newVariantSku}
                onChange={(event) => setNewVariantSku(event.target.value.toUpperCase())}
                placeholder="SKU"
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />

              <select
                value={newVariantSize}
                onChange={(event) =>
                  setNewVariantSize(event.target.value as (typeof SIZE_OPTIONS)[number])
                }
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              >
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <input
                value={newVariantColor}
                onChange={(event) => setNewVariantColor(event.target.value)}
                placeholder="Cor"
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />

              <input
                type="number"
                min="0"
                value={newVariantStock}
                onChange={(event) => setNewVariantStock(event.target.value)}
                placeholder="Estoque"
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
              />

              <button
                type="submit"
                disabled={isCreatingVariant}
                className="h-10 bg-black px-4 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Adicionar
              </button>
            </div>
          </form>

          <section className="overflow-hidden border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Tamanho</th>
                    <th className="px-4 py-3">Cor</th>
                    <th className="px-4 py-3">Estoque</th>
                    <th className="px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-900">
                  {selectedProductVariants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                        Nenhuma variacao cadastrada para este produto.
                      </td>
                    </tr>
                  ) : (
                    selectedProductVariants.map((variant) => {
                      const draft = variantDrafts[variant.id] ?? {
                        sku: variant.sku,
                        size: variant.size,
                        color: variant.color,
                        stockQuantity: String(variant.stockQuantity),
                      };

                      const isUpdating = updatingVariantIds.includes(variant.id);
                      const isDeleting = deletingVariantIds.includes(variant.id);

                      return (
                        <tr key={variant.id}>
                          <td className="px-4 py-3 text-zinc-500">#{variant.id}</td>
                          <td className="px-4 py-3">
                            <input
                              value={draft.sku}
                              onChange={(event) =>
                                setVariantDrafts((previous) => ({
                                  ...previous,
                                  [variant.id]: {
                                    ...draft,
                                    sku: event.target.value.toUpperCase(),
                                  },
                                }))
                              }
                              className="h-9 w-full min-w-[180px] border border-zinc-300 px-2 text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={draft.size}
                              onChange={(event) =>
                                setVariantDrafts((previous) => ({
                                  ...previous,
                                  [variant.id]: {
                                    ...draft,
                                    size: event.target.value,
                                  },
                                }))
                              }
                              className="h-9 min-w-[90px] border border-zinc-300 px-2 text-sm outline-none"
                            >
                              {SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={draft.color}
                              onChange={(event) =>
                                setVariantDrafts((previous) => ({
                                  ...previous,
                                  [variant.id]: {
                                    ...draft,
                                    color: event.target.value,
                                  },
                                }))
                              }
                              className="h-9 w-full min-w-[120px] border border-zinc-300 px-2 text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={draft.stockQuantity}
                              onChange={(event) =>
                                setVariantDrafts((previous) => ({
                                  ...previous,
                                  [variant.id]: {
                                    ...draft,
                                    stockQuantity: event.target.value,
                                  },
                                }))
                              }
                              className="h-9 w-24 border border-zinc-300 px-2 text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void saveVariant(variant.id)}
                                disabled={isUpdating || isDeleting}
                                className="h-9 border border-zinc-300 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteVariant(variant.id)}
                                disabled={isUpdating || isDeleting}
                                className="h-9 border border-zinc-300 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
