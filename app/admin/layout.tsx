import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "admin" && session.user.role !== "manager") {
    redirect("/");
  }

  return (
    <AdminShell
      user={{
        id: session.user.id,
        name: session.user.name ?? "Usuario",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}

