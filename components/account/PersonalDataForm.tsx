"use client";

import { useMemo, useState, type FormEvent } from "react";

type PersonalDataFormProps = {
  initialValues: {
    name: string;
    email: string;
    cpf: string;
    cellphone: string;
    sex: string;
    birthDate: string;
  };
  startInEditMode?: boolean;
};

type PersonalFormValues = {
  name: string;
  email: string;
  cpf: string;
  cellphone: string;
  sex: string;
  birthDate: string;
};

type PersonalErrors = Partial<Record<keyof PersonalFormValues, string>>;
type SaveNotice = {
  kind: "success" | "error";
  message: string;
};

type UpdateProfileSuccess = {
  ok: true;
  data: {
    name: string;
    email: string;
    cpf: string;
    cellphone: string;
    sex: string;
    birthDate: string;
  };
  requestId: string;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
  requestId?: string;
};

function getApiErrorMessage(payload: UpdateProfileSuccess | ApiErrorResponse | null) {
  if (!payload || !("error" in payload)) {
    return null;
  }
  return payload.error?.message ?? null;
}

const sexOptions = [
  { value: "", label: "Selecione" },
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "nao-informar", label: "Nao informar" },
];

function getSexLabel(value: string) {
  return sexOptions.find((option) => option.value === value)?.label ?? "Nao informado";
}

function formatBirthDateDisplay(value: string) {
  if (!value) {
    return "Nao informado";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCellphone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCpf(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const values = digits.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += values[i] * (10 - i);
  }
  const firstCheck = (sum * 10) % 11;
  if ((firstCheck === 10 ? 0 : firstCheck) !== values[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += values[i] * (11 - i);
  }
  const secondCheck = (sum * 10) % 11;
  return (secondCheck === 10 ? 0 : secondCheck) === values[10];
}

function normalizeInitialValues(initialValues: PersonalDataFormProps["initialValues"]): PersonalFormValues {
  return {
    name: initialValues.name ?? "",
    email: initialValues.email ?? "",
    cpf: formatCpf(initialValues.cpf ?? ""),
    cellphone: formatCellphone(initialValues.cellphone ?? ""),
    sex: initialValues.sex ?? "",
    birthDate: initialValues.birthDate ?? "",
  };
}

export default function PersonalDataForm({
  initialValues,
  startInEditMode = false,
}: PersonalDataFormProps) {
  const initialFormValues = useMemo(() => normalizeInitialValues(initialValues), [initialValues]);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [savedValues, setSavedValues] = useState<PersonalFormValues>(initialFormValues);
  const [formValues, setFormValues] = useState<PersonalFormValues>(initialFormValues);
  const [errors, setErrors] = useState<PersonalErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const [passwordResetMessage, setPasswordResetMessage] = useState<string | null>(null);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);

  const editableInputClass =
    "h-10 w-full border-b border-zinc-300 bg-transparent px-0 text-zinc-900 outline-none";
  const readonlyInputClass =
    "h-10 w-full border-b border-transparent bg-transparent px-0 text-zinc-900 outline-none";

  const clearFieldError = (field: keyof PersonalFormValues) => {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: PersonalErrors = {};

    if (formValues.name.trim().length < 3) {
      nextErrors.name = "Informe um nome valido.";
    }

    if (!isValidEmail(formValues.email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (!isValidCpf(formValues.cpf)) {
      nextErrors.cpf = "CPF invalido.";
    }

    const cellphoneDigits = onlyDigits(formValues.cellphone);
    if (!(cellphoneDigits.length === 10 || cellphoneDigits.length === 11)) {
      nextErrors.cellphone = "Celular invalido.";
    }

    if (!formValues.sex) {
      nextErrors.sex = "Selecione uma opcao.";
    }

    if (!formValues.birthDate) {
      nextErrors.birthDate = "Informe a data de nascimento.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parsed = new Date(`${formValues.birthDate}T00:00:00`);
      if (Number.isNaN(parsed.getTime()) || parsed > today) {
        nextErrors.birthDate = "Data de nascimento invalida.";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    setSaveNotice(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          cpf: formValues.cpf,
          cellphone: formValues.cellphone,
          sex: formValues.sex,
          birthDate: formValues.birthDate,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | UpdateProfileSuccess
        | ApiErrorResponse
        | null;

      if (!response.ok || !payload || !("ok" in payload)) {
        setSaveNotice({
          kind: "error",
          message: getApiErrorMessage(payload) ?? "Nao foi possivel salvar os dados.",
        });
        return;
      }

      const normalized = normalizeInitialValues({
        name: payload.data.name,
        email: payload.data.email,
        cpf: payload.data.cpf,
        cellphone: payload.data.cellphone,
        sex: payload.data.sex,
        birthDate: payload.data.birthDate,
      });

      setSavedValues(normalized);
      setFormValues(normalized);
      setErrors({});
      setIsEditing(false);
      setSaveNotice({ kind: "success", message: "Dados da conta alterados com sucesso." });
    } catch {
      setSaveNotice({ kind: "error", message: "Nao foi possivel salvar os dados." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormValues(savedValues);
    setErrors({});
    setSaveNotice(null);
    setIsEditing(false);
  };

  const handleRequestPasswordReset = async () => {
    const email = formValues.email.trim().toLowerCase();
    if (!email) {
      setPasswordResetError("Informe seu e-mail para alterar a senha.");
      setPasswordResetMessage(null);
      return;
    }

    setIsRequestingPasswordReset(true);
    setPasswordResetError(null);
    setPasswordResetMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Falha ao solicitar redefinicao");
      }

      setPasswordResetMessage("Enviamos um link para redefinir sua senha no e-mail cadastrado.");
    } catch {
      setPasswordResetError("Nao foi possivel solicitar a redefinicao agora.");
    } finally {
      setIsRequestingPasswordReset(false);
    }
  };

  return (
    <div>
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-zinc-900">Dados e preferências</h2>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="cursor-pointer text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            Editar
          </button>
        ) : (
          <div className="flex min-w-[170px] items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex h-8 cursor-pointer items-center border border-zinc-300 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="personal-data-form"
              disabled={isSaving}
              className="inline-flex h-8 cursor-pointer items-center bg-black px-3 text-xs font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
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

      <form
        id="personal-data-form"
        className="grid min-h-[328px] gap-x-6 gap-y-3 p-5 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <label className="space-y-1 text-sm">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">Nome</span>
          <input
            value={formValues.name}
            onChange={(event) => {
              clearFieldError("name");
              setFormValues((previous) => ({ ...previous, name: event.target.value }));
            }}
            readOnly={!isEditing}
            className={isEditing ? editableInputClass : readonlyInputClass}
          />
          {errors.name ? <p className="text-xs text-red-700">{errors.name}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">Email</span>
          <input
            type="email"
            value={formValues.email}
            onChange={(event) => {
              clearFieldError("email");
              setFormValues((previous) => ({ ...previous, email: event.target.value }));
            }}
            readOnly={!isEditing}
            className={isEditing ? editableInputClass : readonlyInputClass}
          />
          {errors.email ? <p className="text-xs text-red-700">{errors.email}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">CPF</span>
          <input
            value={formValues.cpf}
            onChange={(event) => {
              clearFieldError("cpf");
              setFormValues((previous) => ({ ...previous, cpf: formatCpf(event.target.value) }));
            }}
            readOnly={!isEditing}
            inputMode="numeric"
            className={isEditing ? editableInputClass : readonlyInputClass}
          />
          {errors.cpf ? <p className="text-xs text-red-700">{errors.cpf}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">Celular</span>
          <input
            value={formValues.cellphone}
            onChange={(event) => {
              clearFieldError("cellphone");
              setFormValues((previous) => ({
                ...previous,
                cellphone: formatCellphone(event.target.value),
              }));
            }}
            readOnly={!isEditing}
            inputMode="numeric"
            className={isEditing ? editableInputClass : readonlyInputClass}
          />
          {errors.cellphone ? <p className="text-xs text-red-700">{errors.cellphone}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">Sexo</span>
          {isEditing ? (
            <select
              value={formValues.sex}
              onChange={(event) => {
                clearFieldError("sex");
                setFormValues((previous) => ({ ...previous, sex: event.target.value }));
              }}
              className={editableInputClass}
            >
              {sexOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="pt-1 text-sm text-zinc-900">{getSexLabel(formValues.sex)}</p>
          )}
          {errors.sex ? <p className="text-xs text-red-700">{errors.sex}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">Data de nascimento</span>
          {isEditing ? (
            <input
              type="date"
              value={formValues.birthDate}
              onChange={(event) => {
                clearFieldError("birthDate");
                setFormValues((previous) => ({ ...previous, birthDate: event.target.value }));
              }}
              className={editableInputClass}
            />
          ) : (
            <p className="pt-1 text-sm text-zinc-900">
              {formatBirthDateDisplay(formValues.birthDate)}
            </p>
          )}
          {errors.birthDate ? <p className="text-xs text-red-700">{errors.birthDate}</p> : null}
        </label>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleRequestPasswordReset}
            disabled={isRequestingPasswordReset}
            className="cursor-pointer text-sm font-medium text-zinc-700 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Alterar minha senha
          </button>
          {passwordResetError ? (
            <p className="mt-2 text-xs text-red-700">{passwordResetError}</p>
          ) : null}
          {passwordResetMessage ? (
            <p className="mt-2 text-xs text-emerald-700">{passwordResetMessage}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
