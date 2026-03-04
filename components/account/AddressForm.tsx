"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

type AddressItem = {
  id: number;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type AddressFormProps = {
  initialAddresses: AddressItem[];
  startInEditMode?: boolean;
  editAddressId?: number | null;
};

type AddressFormValues = {
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type AddressErrors = Partial<Record<keyof AddressFormValues, string>>;
type SaveNotice = {
  kind: "success" | "error";
  message: string;
};

type AddressApiSuccess = {
  ok: true;
  data: AddressItem;
  requestId?: string;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
  requestId?: string;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

const STATE_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeCepDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value: string) {
  const digits = normalizeCepDigits(value);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeAddress(item: AddressItem): AddressItem {
  return {
    ...item,
    label: item.label || "Endereco",
    zipCode: onlyDigits(item.zipCode).slice(0, 8),
    number: onlyDigits(item.number),
    state: (item.state || "").toUpperCase(),
    complement: item.complement || "",
  };
}

function sortAddresses(items: AddressItem[]) {
  return [...items].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.id - b.id;
  });
}

function buildEmptyValues(isFirstAddress: boolean): AddressFormValues {
  return {
    label: "Principal",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "SP",
    isDefault: isFirstAddress,
  };
}

function toFormValues(item: AddressItem): AddressFormValues {
  return {
    label: item.label,
    zipCode: item.zipCode,
    street: item.street,
    number: item.number,
    complement: item.complement,
    district: item.district,
    city: item.city,
    state: item.state,
    isDefault: item.isDefault,
  };
}

function getApiErrorMessage(payload: AddressApiSuccess | ApiErrorResponse | null) {
  if (!payload || !("error" in payload)) {
    return null;
  }
  return payload.error?.message ?? null;
}

export default function AddressForm({
  initialAddresses,
  startInEditMode = false,
  editAddressId = null,
}: AddressFormProps) {
  const normalizedInitialAddresses = useMemo(
    () => sortAddresses(initialAddresses.map(normalizeAddress)),
    [initialAddresses]
  );

  const initialAddressForEdit =
    (editAddressId
      ? normalizedInitialAddresses.find((address) => address.id === editAddressId)
      : undefined) ??
    normalizedInitialAddresses.find((address) => address.isDefault) ??
    normalizedInitialAddresses[0] ??
    null;

  const initialMode: "list" | "create" | "edit" = startInEditMode
    ? initialAddressForEdit
      ? "edit"
      : "create"
    : "list";

  const [addresses, setAddresses] = useState<AddressItem[]>(normalizedInitialAddresses);
  const [mode, setMode] = useState<"list" | "create" | "edit">(initialMode);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(
    initialMode === "edit" ? initialAddressForEdit?.id ?? null : null
  );
  const [formValues, setFormValues] = useState<AddressFormValues>(() => {
    if (initialMode === "edit" && initialAddressForEdit) {
      return toFormValues(initialAddressForEdit);
    }
    return buildEmptyValues(normalizedInitialAddresses.length === 0);
  });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const [, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const lastCepRequestedRef = useRef<string | null>(null);

  const editableInputClass =
    "block h-10 w-full border-b border-zinc-300 bg-transparent px-0 text-zinc-900 outline-none";

  const clearFieldError = (field: keyof AddressFormValues) => {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const clearAddressAutofillErrors = () => {
    setErrors((previous) => {
      const next = { ...previous };
      delete next.street;
      delete next.district;
      delete next.city;
      delete next.state;
      return next;
    });
  };

  const lookupCep = useCallback(
    async (rawCep?: string, options?: { showInvalidError?: boolean }) => {
      const cepDigits = normalizeCepDigits(rawCep ?? formValues.zipCode);
      const showInvalidError = options?.showInvalidError ?? true;

      if (cepDigits.length !== 8) {
        if (showInvalidError) {
          setCepError("Informe um CEP valido com 8 digitos.");
        }
        return;
      }

      if (lastCepRequestedRef.current === cepDigits) {
        return;
      }

      setCepError(null);
      setIsCepLoading(true);
      lastCepRequestedRef.current = cepDigits;

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Falha ao consultar CEP");
        }

        const data = (await response.json()) as ViaCepResponse;

        if (data.erro) {
          setCepError("CEP nao encontrado.");
          return;
        }

        clearAddressAutofillErrors();
        setFormValues((previous) => ({
          ...previous,
          street: data.logradouro ?? "",
          district: data.bairro ?? "",
          city: data.localidade ?? "",
          state: (data.uf ?? "").toUpperCase() || previous.state,
        }));
      } catch {
        setCepError("Nao foi possivel consultar o CEP.");
      } finally {
        setIsCepLoading(false);
      }
    },
    [formValues.zipCode]
  );

  const validateForm = () => {
    const nextErrors: AddressErrors = {};

    if (formValues.label.trim().length < 2) {
      nextErrors.label = "Informe um apelido para o endereco.";
    }

    if (formValues.zipCode.length !== 8) {
      nextErrors.zipCode = "CEP invalido.";
    }

    if (formValues.street.trim().length < 3) {
      nextErrors.street = "Informe uma rua valida.";
    }

    if (!formValues.number.trim() || !/^\d+$/.test(formValues.number.trim())) {
      nextErrors.number = "Numero deve conter apenas digitos.";
    }

    if (formValues.district.trim().length < 2) {
      nextErrors.district = "Informe um bairro valido.";
    }

    if (formValues.city.trim().length < 2) {
      nextErrors.city = "Informe uma cidade valida.";
    }

    if (!STATE_OPTIONS.includes(formValues.state)) {
      nextErrors.state = "Selecione um estado valido.";
    }

    return nextErrors;
  };

  const openCreateMode = () => {
    setMode("create");
    setEditingAddressId(null);
    setFormValues(buildEmptyValues(addresses.length === 0));
    setErrors({});
    setSaveNotice(null);
    setCepError(null);
    lastCepRequestedRef.current = null;
  };

  const openEditMode = (address: AddressItem) => {
    setMode("edit");
    setEditingAddressId(address.id);
    setFormValues(toFormValues(address));
    setErrors({});
    setSaveNotice(null);
    setCepError(null);
    lastCepRequestedRef.current = null;
  };

  const closeEditor = () => {
    setMode("list");
    setEditingAddressId(null);
    setErrors({});
    setSaveNotice(null);
    setCepError(null);
    lastCepRequestedRef.current = null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const isEditing = mode === "edit" && editingAddressId !== null;
    const endpoint = isEditing
      ? `/api/account/addresses/${editingAddressId}`
      : "/api/account/addresses";
    const method = isEditing ? "PUT" : "POST";

    setIsSaving(true);
    setSaveNotice(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formValues.label.trim(),
          zipCode: formValues.zipCode,
          street: formValues.street.trim(),
          number: formValues.number.trim(),
          complement: formValues.complement.trim(),
          district: formValues.district.trim(),
          city: formValues.city.trim(),
          state: formValues.state,
          isDefault: formValues.isDefault,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AddressApiSuccess
        | ApiErrorResponse
        | null;

      if (!response.ok || !payload || !("ok" in payload)) {
        setSaveNotice({
          kind: "error",
          message: getApiErrorMessage(payload) ?? "Nao foi possivel salvar o endereco.",
        });
        return;
      }

      const normalized = normalizeAddress(payload.data);
      setAddresses((previous) => {
        const next = isEditing
          ? previous.map((item) => (item.id === normalized.id ? normalized : item))
          : [...previous, normalized];

        if (!normalized.isDefault) {
          return sortAddresses(next);
        }

        return sortAddresses(
          next.map((item) => ({
            ...item,
            isDefault: item.id === normalized.id,
          }))
        );
      });

      setMode("list");
      setEditingAddressId(null);
      setErrors({});
      setSaveNotice({
        kind: "success",
        message: isEditing
          ? "Endereco atualizado com sucesso."
          : "Endereco cadastrado com sucesso.",
      });
    } catch {
      setSaveNotice({ kind: "error", message: "Nao foi possivel salvar o endereco." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (addresses.length <= 1) {
      setSaveNotice({
        kind: "error",
        message: "Voce precisa manter pelo menos 1 endereco cadastrado.",
      });
      return;
    }

    if (!confirm("Deseja excluir este endereco?")) {
      return;
    }

    setIsSaving(true);
    setSaveNotice(null);

    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(payload?.error?.message ?? "Falha ao excluir endereco");
      }

      setAddresses((previous) => sortAddresses(previous.filter((item) => item.id !== addressId)));
      setSaveNotice({ kind: "success", message: "Endereco removido com sucesso." });
    } catch {
      setSaveNotice({ kind: "error", message: "Nao foi possivel excluir o endereco." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    setIsSaving(true);
    setSaveNotice(null);

    try {
      const response = await fetch(`/api/account/addresses/${addressId}/default`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(payload?.error?.message ?? "Falha ao definir endereco principal");
      }

      setAddresses((previous) =>
        sortAddresses(
          previous.map((item) => ({
            ...item,
            isDefault: item.id === addressId,
          }))
        )
      );
      setSaveNotice({ kind: "success", message: "Endereco principal atualizado." });
    } catch {
      setSaveNotice({
        kind: "error",
        message: "Nao foi possivel definir o endereco principal.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isEditorMode = mode === "create" || mode === "edit";

  useEffect(() => {
    if (!isEditorMode) {
      return;
    }

    const cepDigits = normalizeCepDigits(formValues.zipCode);
    if (cepDigits.length !== 8) {
      return;
    }

    const timer = setTimeout(() => {
      void lookupCep(cepDigits, { showInvalidError: false });
    }, 250);

    return () => clearTimeout(timer);
  }, [formValues.zipCode, isEditorMode, lookupCep]);

  return (
    <div className="border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-zinc-900">Meus enderecos</h2>

        {isEditorMode ? (
          <div className="flex min-w-[190px] items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditor}
              disabled={isSaving}
              className="inline-flex h-8 cursor-pointer items-center border border-zinc-300 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="address-book-form"
              disabled={isSaving}
              className="inline-flex h-8 cursor-pointer items-center bg-black px-3 text-xs font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openCreateMode}
            className="inline-flex h-8 cursor-pointer items-center bg-black px-3 text-xs font-black uppercase tracking-wide text-white"
          >
            Novo endereco
          </button>
        )}
      </header>

      {saveNotice ? (
        <div
          className={`mx-5 mt-4 flex items-center justify-between border px-3 py-1.5 text-xs ${
            saveNotice.kind === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          <span>{saveNotice.message}</span>
          <button
            type="button"
            onClick={() => setSaveNotice(null)}
            className="cursor-pointer text-sm leading-none opacity-50 transition hover:opacity-80"
            aria-label="Fechar aviso"
          >
            x
          </button>
        </div>
      ) : null}

      {isEditorMode ? (
        <form
          id="address-book-form"
          className="grid gap-x-6 gap-y-3 p-5 md:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">
              Apelido do endereco
            </span>
            <input
              value={formValues.label}
              onChange={(event) => {
                clearFieldError("label");
                setFormValues((previous) => ({ ...previous, label: event.target.value }));
              }}
              className={editableInputClass}
            />
            {errors.label ? <p className="text-xs text-red-700">{errors.label}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">CEP</span>
            <input
              value={formatCep(formValues.zipCode)}
              onChange={(event) => {
                clearFieldError("zipCode");
                setCepError(null);
                lastCepRequestedRef.current = null;
                setFormValues((previous) => ({
                  ...previous,
                  zipCode: normalizeCepDigits(event.target.value),
                }));
              }}
              inputMode="numeric"
              className={editableInputClass}
            />
            {errors.zipCode ? <p className="text-xs text-red-700">{errors.zipCode}</p> : null}
            {cepError ? <p className="text-xs text-red-700">{cepError}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Rua</span>
            <input
              value={formValues.street}
              onChange={(event) => {
                clearFieldError("street");
                setFormValues((previous) => ({ ...previous, street: event.target.value }));
              }}
              className={editableInputClass}
            />
            {errors.street ? <p className="text-xs text-red-700">{errors.street}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Numero</span>
            <input
              value={formValues.number}
              onChange={(event) => {
                clearFieldError("number");
                setFormValues((previous) => ({
                  ...previous,
                  number: onlyDigits(event.target.value),
                }));
              }}
              inputMode="numeric"
              className={editableInputClass}
            />
            {errors.number ? <p className="text-xs text-red-700">{errors.number}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Complemento</span>
            <input
              value={formValues.complement}
              onChange={(event) =>
                setFormValues((previous) => ({ ...previous, complement: event.target.value }))
              }
              className={editableInputClass}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Bairro</span>
            <input
              value={formValues.district}
              onChange={(event) => {
                clearFieldError("district");
                setFormValues((previous) => ({ ...previous, district: event.target.value }));
              }}
              className={editableInputClass}
            />
            {errors.district ? <p className="text-xs text-red-700">{errors.district}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Cidade</span>
            <input
              value={formValues.city}
              onChange={(event) => {
                clearFieldError("city");
                setFormValues((previous) => ({ ...previous, city: event.target.value }));
              }}
              className={editableInputClass}
            />
            {errors.city ? <p className="text-xs text-red-700">{errors.city}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Estado</span>
            <select
              value={formValues.state || STATE_OPTIONS[0]}
              onChange={(event) => {
                clearFieldError("state");
                setFormValues((previous) => ({ ...previous, state: event.target.value }));
              }}
              className={`${editableInputClass} w-[92px]`}
            >
              {STATE_OPTIONS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state ? <p className="text-xs text-red-700">{errors.state}</p> : null}
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={formValues.isDefault}
              onChange={(event) =>
                setFormValues((previous) => ({
                  ...previous,
                  isDefault: event.target.checked,
                }))
              }
            />
            <span>Definir como endereco principal</span>
          </label>
        </form>
      ) : (
        <div className="space-y-4 p-5">
          {addresses.length === 0 ? (
            <div className="grid min-h-[240px] place-items-center border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
              <div>
                <p>Nenhum endereco cadastrado.</p>
                <button
                  type="button"
                  onClick={openCreateMode}
                  className="mt-4 inline-flex h-9 cursor-pointer items-center bg-black px-4 text-xs font-black uppercase tracking-wide text-white"
                >
                  Adicionar endereco
                </button>
              </div>
            </div>
          ) : (
            addresses.map((address) => (
              <article key={address.id} className="border border-zinc-200 bg-zinc-50 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900">{address.label}</p>
                      {address.isDefault ? (
                        <span className="border border-zinc-300 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600">
                          Principal
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-zinc-800">
                      {address.street}, {address.number}
                      {address.complement ? `, ${address.complement}` : ""}
                    </p>
                    <p className="text-zinc-600">
                      {address.district} - {address.city}/{address.state}
                    </p>
                    <p className="text-zinc-600">CEP {address.zipCode}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditMode(address)}
                      className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-700 underline underline-offset-2"
                    >
                      Editar
                    </button>
                    {!address.isDefault ? (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSetDefault(address.id)}
                        className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-700 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Tornar principal
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={isSaving || addresses.length <= 1}
                      onClick={() => handleDelete(address.id)}
                      className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-red-700 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}

          {addresses.length === 1 ? (
            <p className="text-xs text-zinc-500">
              Mantenha ao menos 1 endereco cadastrado.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
