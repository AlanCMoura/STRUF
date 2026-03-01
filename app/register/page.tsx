import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CheckoutSignupAndPaymentClient from "@/components/storefront/CheckoutSignupAndPaymentClient";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    email?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const params = searchParams ? await searchParams : undefined;
  const callbackParam = params?.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam)
    ? callbackParam[0]
    : callbackParam;
  const emailParam = params?.email;
  const initialEmail = Array.isArray(emailParam) ? emailParam[0] : emailParam;

  if (session) {
    redirect(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 md:px-6 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <CheckoutSignupAndPaymentClient
          mode="register"
          callbackUrl={callbackUrl}
          initialEmail={initialEmail}
        />
      </div>
    </main>
  );
}
