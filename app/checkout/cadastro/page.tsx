import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CheckoutGateCartSummary from "@/components/storefront/CheckoutGateCartSummary";
import CheckoutSignupAndPaymentClient from "@/components/storefront/CheckoutSignupAndPaymentClient";
import { authOptions } from "@/lib/auth";

export default async function CheckoutCadastroPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/checkout");
  }

  const params = searchParams ? await searchParams : undefined;
  const emailParam = params?.email;
  const initialEmail = Array.isArray(emailParam) ? emailParam[0] : emailParam;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 md:px-6 md:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <CheckoutGateCartSummary />
        <CheckoutSignupAndPaymentClient initialEmail={initialEmail} />
      </div>
    </main>
  );
}
