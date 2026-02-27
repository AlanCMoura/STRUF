import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CheckoutLoginAccessForm from "@/components/CheckoutLoginAccessForm";
import CheckoutIdentificationClient from "@/components/storefront/CheckoutIdentificationClient";
import CheckoutGateCartSummary from "@/components/storefront/CheckoutGateCartSummary";
import { authOptions } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  const params = searchParams ? await searchParams : undefined;
  const callbackParam = params?.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam)
    ? callbackParam[0]
    : callbackParam;
  const isCheckoutFlow = !!callbackUrl && callbackUrl.startsWith("/checkout");

  if (session) {
    redirect(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/");
  }

  if (isCheckoutFlow) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900 md:px-6 md:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-center text-2xl font-semibold md:text-3xl">
              Para continuar, informe seu e-mail
            </h1>
            <p className="mt-2 text-center text-sm text-zinc-600">
              Vamos verificar seu cadastro para seguir para o checkout.
            </p>

            <div className="mt-8">
              <CheckoutLoginAccessForm callbackUrl={callbackUrl} />
            </div>
          </div>

          <div className="mt-12">
            <CheckoutGateCartSummary />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 md:px-6 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <CheckoutIdentificationClient
          loginCallbackUrl={callbackUrl}
          signupPath={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
        />
      </div>
    </main>
  );
}
