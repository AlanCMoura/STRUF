"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type ReactNode, useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatCellphone(value: string) {
  const digits = normalizePhoneDigits(value);

  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : "";
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 6) {
    return `(${ddd}) ${rest}`;
  }

  if (digits.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
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

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

function isValidCpf(value: string) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);

  const firstCheck = (() => {
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      sum += digits[i] * (10 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  })();

  const secondCheck = (() => {
    let sum = 0;
    for (let i = 0; i < 10; i += 1) {
      sum += digits[i] * (11 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  })();

  return firstCheck === digits[9] && secondCheck === digits[10];
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A11.5 11.5 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-4.1 4.5" />
      <path d="M6.3 6.8C3.7 8.5 2 12 2 12s3.5 6 10 6c1.2 0 2.3-.2 3.3-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H21m-3 0v2m-3-2v2" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c0-4.2 3.8-7 8-7s8 2.8 8 7" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 21s6-6.2 6-11a6 6 0 1 0-12 0c0 4.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="8" cy="18" r="1.8" />
      <circle cx="18" cy="18" r="1.8" />
    </svg>
  );
}

const BRAZIL_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Para" },
  { value: "PB", label: "Paraiba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-5 border-b border-zinc-200 pb-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
        <span className="text-zinc-700">{icon}</span>
        <span>{title}</span>
      </h2>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-900">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function CheckoutSignupAndPaymentClient({
  initialEmail,
  mode = "checkout",
  callbackUrl,
}: {
  initialEmail?: string;
  mode?: "checkout" | "register";
  callbackUrl?: string;
}) {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const isRegisterOnly = mode === "register";
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [confirmEmail, setConfirmEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [cpf, setCpf] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");

  const [shippingMethod, setShippingMethod] = useState<"pac" | "sedex">("pac");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const lastCepRequestedRef = useRef<string | null>(null);

  const inputClass =
    "h-9 w-full border border-zinc-300 px-3 text-xs text-zinc-900 outline-none";

  const shippingPrice = shippingMethod === "pac" ? 22.6 : 32.9;
  const totalWithShipping = useMemo(
    () => (isRegisterOnly ? subtotal : subtotal + shippingPrice),
    [isRegisterOnly, shippingPrice, subtotal]
  );

  const lookupCep = useCallback(
    async (
      rawCep?: string,
      options?: { showInvalidError?: boolean }
    ) => {
      const cepDigits = normalizeCepDigits(rawCep ?? zipCode);
      const showInvalidError = options?.showInvalidError ?? true;

      if (cepDigits.length !== 8) {
        if (showInvalidError) {
          setCepError("Informe um CEP valido com 8 digitos");
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
          setCepError("CEP nao encontrado");
          return;
        }

        setStreet(data.logradouro ?? "");
        setDistrict(data.bairro ?? "");
        setCity(data.localidade ?? "");
        setStateUf((data.uf ?? "").toUpperCase());

      } catch {
        setCepError("Nao foi possivel consultar o CEP");
      } finally {
        setIsCepLoading(false);
      }
    },
    [zipCode]
  );

  useEffect(() => {
    const cepDigits = normalizeCepDigits(zipCode);
    if (cepDigits.length !== 8) {
      return;
    }

    const timer = setTimeout(() => {
      void lookupCep(cepDigits, { showInvalidError: false });
    }, 250);

    return () => clearTimeout(timer);
  }, [zipCode, lookupCep]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isRegisterOnly) {
      if (!isHydrated) {
        setError("Carregando carrinho");
        return;
      }

      if (items.length === 0) {
        setError("Carrinho vazio");
        return;
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedConfirmEmail = confirmEmail.trim().toLowerCase();
    const normalizedCpf = normalizeCpf(cpf);
    const normalizedCellphone = normalizePhoneDigits(cellphone);
    const normalizedBirthDate = birthDate.trim();
    const normalizedZipCode = normalizeCepDigits(zipCode);
    const normalizedStreet = street.trim();
    const normalizedNumber = number.trim();
    const normalizedComplement = complement.trim();
    const normalizedDistrict = district.trim();
    const normalizedCity = city.trim();
    const normalizedState = stateUf.trim().toUpperCase();

    if (!fullName.trim() || !normalizedEmail || !password || !confirmPassword) {
      setError("Preencha os campos obrigatorios");
      return;
    }

    if (isRegisterOnly && !normalizedConfirmEmail) {
      setError("Confirme o e-mail");
      return;
    }

    if (isRegisterOnly && normalizedEmail !== normalizedConfirmEmail) {
      setError("Os e-mails nao coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no minimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }

    if (!normalizedCpf) {
      setError("CPF e obrigatorio");
      return;
    }

    if (!isValidCpf(normalizedCpf)) {
      setError("CPF invalido");
      return;
    }

    if (normalizedCellphone.length < 10) {
      setError("Celular invalido");
      return;
    }

    if (!normalizedBirthDate) {
      setError("Data de nascimento e obrigatoria");
      return;
    }

    if (
      normalizedZipCode.length !== 8 ||
      !normalizedStreet ||
      !normalizedNumber ||
      !normalizedDistrict ||
      !normalizedCity ||
      !normalizedState
    ) {
      setError("Preencha o endereço completo");
      return;
    }

    setIsSubmitting(true);

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: normalizedEmail,
          password,
          profile: {
            cpf: normalizedCpf,
            cellphone: normalizedCellphone,
            phone,
            sex,
            birthDate: normalizedBirthDate,
          },
          address: {
            zipCode: normalizedZipCode,
            street: normalizedStreet,
            number: normalizedNumber,
            complement: normalizedComplement,
            district: normalizedDistrict,
            city: normalizedCity,
            state: normalizedState,
          },
        }),
      });

      const registerPayload = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        throw new Error(registerPayload?.error?.message ?? "Falha no cadastro");
      }

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: isRegisterOnly ? safeCallbackUrl : "/checkout/cadastro",
      });

      if (signInResult?.error) {
        throw new Error("Conta criada, mas nao foi possivel autenticar");
      }

      if (isRegisterOnly) {
        router.push(signInResult?.url ?? safeCallbackUrl);
        return;
      }

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const checkoutPayload = await checkoutResponse.json().catch(() => ({}));
      if (!checkoutResponse.ok) {
        throw new Error(
          checkoutPayload?.error?.message ?? "Falha ao finalizar checkout"
        );
      }

      clearCart();
      router.push(
        `/sucesso?pedido=${encodeURIComponent(
          String(checkoutPayload?.orderId ?? "")
        )}&pagamento=${paymentMethod}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao finalizar compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegisterOnly) {
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="flex flex-col gap-1 md:flex-row md:items-end md:gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Cadastre-se
          </h1>
          <p className="text-sm text-zinc-600">Crie sua conta para acessar a loja.</p>
        </section>
        <section className="border border-zinc-200 bg-white p-5 md:p-6">
          <SectionTitle title="Dados para acesso" icon={<IconKey />} />
          <div className="grid gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">
            <Field label="E-mail" required>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Confirmar e-mail" required>
              <input
                type="email"
                required
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Crie uma senha" required>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-600 hover:text-zinc-900"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </Field>
            <Field label="Confirmar senha" required>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-600 hover:text-zinc-900"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </Field>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="border border-zinc-200 bg-white p-5 md:p-6">
            <SectionTitle title="Dados pessoais" icon={<IconUser />} />
            <div className="grid gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">
              <Field label="Nome completo" required>
                <input
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="CPF" required>
                <input required value={cpf} onChange={(event) => setCpf(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Celular" required>
                <input
                  required
                  inputMode="numeric"
                  maxLength={15}
                  value={cellphone}
                  onChange={(event) =>
                    setCellphone(formatCellphone(event.target.value))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Telefone fixo">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Sexo">
                <select value={sex} onChange={(event) => setSex(event.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="nao-informar">Prefiro nao informar</option>
                </select>
              </Field>
              <Field label="Data de nascimento" required>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white p-5 md:p-6">
            <SectionTitle title="Endereço" icon={<IconPin />} />
            <div className="grid gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">
              <div className="md:col-span-2">
                <Field label="CEP" required>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    value={zipCode}
                    onChange={(event) => {
                      const next = formatCep(event.target.value);
                      setZipCode(next);
                      if (normalizeCepDigits(next).length < 8) {
                        lastCepRequestedRef.current = null;
                      }
                      if (cepError) {
                        setCepError(null);
                      }
                    }}
                    onBlur={(event) => {
                      void lookupCep(event.target.value, { showInvalidError: true });
                    }}
                    className={`${inputClass} max-w-[180px]`}
                  />
                </Field>
                {cepError ? (
                  <p className="mt-2 text-xs text-red-700">{cepError}</p>
                ) : null}
              </div>
              <Field label="Endereco" required>
                <input required value={street} onChange={(event) => setStreet(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Número" required>
                <input required value={number} onChange={(event) => setNumber(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Complemento">
                <input
                  value={complement}
                  onChange={(event) => setComplement(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Bairro" required>
                <input
                  required
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Cidade" required>
                <input required value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Estado" required>
                <select required value={stateUf} onChange={(event) => setStateUf(event.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
        </div>

        {error ? (
          <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Ja possui conta?{" "}
            <Link href="/login" className="underline underline-offset-4">
              faca login
            </Link>
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Criar conta
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="border border-zinc-200 bg-white p-4 md:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_72px_120px] gap-4 bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-900">
          <div>Produtos</div>
          <div className="text-center">Qtd.</div>
          <div className="text-center">Preco</div>
        </div>

        <div className="divide-y divide-zinc-200 px-3 py-1">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="grid grid-cols-[minmax(0,1fr)_72px_120px] items-start gap-4 py-4 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{item.productName}</p>
                <p className="text-xs text-zinc-500">
                  Cod: <strong>{item.sku}</strong>
                </p>
                <p className="text-xs text-zinc-500">
                  {item.color} / {item.size}
                </p>
              </div>

              <p className="pt-1 text-center text-zinc-700">{item.quantity}</p>

              <p className="pt-1 text-center font-semibold text-zinc-900">
                {formatBRL(item.unitPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-50 px-3 py-3">
          <div className="ml-auto w-full max-w-[300px] space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Subtotal:</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Frete:</span>
              <strong>{formatBRL(shippingPrice)}</strong>
            </div>
            <div className="flex items-center justify-between text-[18px] font-bold leading-none text-zinc-900">
              <span>Total:</span>
              <span>{formatBRL(totalWithShipping)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_1fr_0.92fr]">
        <section className="border border-zinc-200 bg-white p-5 md:p-6">
          <div className="mb-5 border-b border-zinc-200 pb-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <span className="text-zinc-700">
                <IconUser />
              </span>
              <span>
                Novo cadastro ou{" "}
                <Link
                  href={
                    email.trim()
                      ? `/checkout/identificacao?email=${encodeURIComponent(email.trim())}`
                      : "/checkout/identificacao"
                  }
                  className="underline underline-offset-4"
                >
                  identifique-se
                </Link>
              </span>
            </h2>
          </div>
          <p className="mb-4 text-xs text-zinc-500">Campos com * sao obrigatorios.</p>

          <div className="space-y-4">
            <Field label="E-mail" required>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Crie uma senha" required>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-600 hover:text-zinc-900"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </Field>

              <Field label="Confirmar senha" required>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-600 hover:text-zinc-900"
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </Field>
            </div>

            <Field label="Nome completo" required>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="CPF" required>
                <input required value={cpf} onChange={(event) => setCpf(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Data de nascimento" required>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Celular" required>
                <input
                  required
                  inputMode="numeric"
                  maxLength={15}
                  value={cellphone}
                  onChange={(event) =>
                    setCellphone(formatCellphone(event.target.value))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Telefone fixo">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
              </Field>
            </div>

            <p className="text-xs text-zinc-600">
              Ja possui conta?{" "}
              <Link
                href={
                  email.trim()
                    ? `/checkout/identificacao?email=${encodeURIComponent(email.trim())}`
                    : "/checkout/identificacao"
                }
                className="underline underline-offset-4"
              >
                identifique-se
              </Link>
            </p>
          </div>
        </section>

        <section className="border border-zinc-200 bg-white p-5 md:p-6">
          <SectionTitle title="Entrega" icon={<IconTruck />} />

          <div className="space-y-4">
            <Field label="CEP" required>
              <input
                required
                inputMode="numeric"
                maxLength={9}
                value={zipCode}
                onChange={(event) => {
                  const next = formatCep(event.target.value);
                  setZipCode(next);
                  if (normalizeCepDigits(next).length < 8) {
                    lastCepRequestedRef.current = null;
                  }
                  if (cepError) {
                    setCepError(null);
                  }
                }}
                onBlur={(event) => {
                  void lookupCep(event.target.value, { showInvalidError: true });
                }}
                className={`${inputClass} max-w-[180px]`}
              />
            </Field>
            {cepError ? (
              <p className="text-xs text-red-700">{cepError}</p>
            ) : null}

            <div className="space-y-2 border-t border-zinc-200 pt-3">
              <label className="flex cursor-pointer items-center justify-between border border-zinc-200 px-3 py-2 text-xs">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shipping-method"
                    checked={shippingMethod === "pac"}
                    onChange={() => setShippingMethod("pac")}
                  />
                  PAC
                </span>
                <span className="font-semibold">{formatBRL(22.6)} / 8 dias</span>
              </label>

              <label className="flex cursor-pointer items-center justify-between border border-zinc-200 px-3 py-2 text-xs">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shipping-method"
                    checked={shippingMethod === "sedex"}
                    onChange={() => setShippingMethod("sedex")}
                  />
                  SEDEX
                </span>
                <span className="font-semibold">{formatBRL(32.9)} / 4 dias</span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_92px]">
              <Field label="Endereco" required>
                <input required value={street} onChange={(event) => setStreet(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Número" required>
                <input required value={number} onChange={(event) => setNumber(event.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Complemento">
              <input
                value={complement}
                onChange={(event) => setComplement(event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Bairro" required>
                <input
                  required
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Cidade" required>
                <input required value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Estado" required>
              <select required value={stateUf} onChange={(event) => setStateUf(event.target.value)} className={inputClass}>
                <option value="">Selecione</option>
                {BRAZIL_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <aside className="h-fit border border-zinc-200 bg-white p-5 md:p-6">
          <SectionTitle title="Pagamento" icon={<IconCard />} />

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-3 py-2 text-xs">
              <input
                type="radio"
                name="payment-checkout-signup"
                checked={paymentMethod === "pix"}
                onChange={() => setPaymentMethod("pix")}
                disabled={isSubmitting}
              />
              Pix
            </label>

            <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-3 py-2 text-xs">
              <input
                type="radio"
                name="payment-checkout-signup"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                disabled={isSubmitting}
              />
              Cartao
            </label>
          </div>

          {error ? (
            <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full cursor-pointer bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Finalizar compra
          </button>
        </aside>
      </div>
    </form>
  );
}
