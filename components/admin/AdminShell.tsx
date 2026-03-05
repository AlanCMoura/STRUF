"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type AdminRole = "admin" | "manager";

type AdminShellProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  roles: AdminRole[];
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "manager"] },
  { href: "/admin/products", label: "Produtos", roles: ["admin", "manager"] },
  { href: "/admin/orders", label: "Pedidos", roles: ["admin", "manager"] },
  { href: "/admin/users", label: "Usuarios", roles: ["admin"] },
  { href: "/admin/categories", label: "Categorias", roles: ["admin"] },
  { href: "/admin/managers/new", label: "Managers", roles: ["admin"] },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/admin") {
    return currentPath === "/admin";
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const roleLabel = user.role === "admin" ? "Administrador" : "Manager";
  const availableItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-200 bg-white p-5 lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-200 pb-4">
            <Link href="/admin" className="inline-flex items-center gap-3">
              <Image
                src="/STRUF LOGO BLACK.png"
                alt="Struf"
                width={56}
                height={64}
                className="h-12 w-auto object-contain"
                priority
              />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Admin
              </span>
            </Link>

            <p className="mt-3 text-lg font-semibold text-zinc-900">{user.name}</p>
            <p className="text-sm text-zinc-600">{user.email}</p>
            <p className="mt-2 inline-flex border border-zinc-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
              {roleLabel}
            </p>
          </div>

          <nav className="mt-4 space-y-1">
            {availableItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-sm transition ${
                    active
                      ? "border border-zinc-300 bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-2">
            <Link
              href="/"
              className="block border border-zinc-300 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100"
            >
              Voltar para loja
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100"
            >
              Sair
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-zinc-200 bg-white px-5 py-4">
            <p className="text-sm text-zinc-500">Painel de gerenciamento</p>
            <h1 className="text-xl font-semibold text-zinc-900">Plataforma Admin Struf</h1>
          </header>

          <main className="flex-1 p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
