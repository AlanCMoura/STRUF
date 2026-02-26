"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/components/CartProvider";

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H10l-4 4v-4H6.5A2.5 2.5 0 0 1 4 12.5z" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l1.2 9.2a2 2 0 0 0 2 1.8h8.8a2 2 0 0 0 2-1.6L21 7H7" />
      <circle cx="10" cy="19" r="1.25" />
      <circle cx="18" cy="19" r="1.25" />
    </svg>
  );
}

const mainNav = [
  { href: "/categoria/streetwear", label: "Ver todos" },
  { href: "/categoria/streetwear", label: "Ofertas" },
  { href: "/categoria/streetwear", label: "Camisetas" },
  { href: "/categoria/streetwear", label: "Moletons" },
  { href: "/sobre-nos", label: "Quem somos" },
];

export default function Header() {
  const { data: session, status } = useSession();
  const { itemCount, isHydrated } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 px-4 py-4 md:px-6 md:py-6">
        <div className="flex min-w-[110px] items-center">
          <Link
            href="/"
            className="flex items-center justify-center leading-none text-black"
          >
            <Image
              src="/STRUF LOGO BLACK.png"
              alt="Struf logo"
              width={804}
              height={930}
              className="h-12 w-auto object-contain md:h-14"
              priority
            />
          </Link>
        </div>

        <nav className="hidden flex-1 items-start justify-start gap-7 pl-4 xl:flex ml-8">
          {mainNav.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-[13px] font-semibold uppercase tracking-wide text-black transition hover:text-zinc-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            className="rounded p-2 text-black hover:bg-zinc-100"
            aria-label="Atendimento"
          >
            <IconChat />
          </button>

          {status === "authenticated" ? (
            <div className="group relative">
              <button
                type="button"
                onClick={(event) => event.currentTarget.blur()}
                className="rounded p-2 text-black hover:bg-zinc-100"
                aria-label="Menu da conta"
              >
                <IconProfile />
              </button>

              <div className="invisible absolute right-0 top-full z-20 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-72 rounded-xl border border-zinc-200 bg-white p-2 text-sm text-zinc-700 shadow-xl">
                  <div className="border-b border-zinc-100 px-3 pb-2 text-sm font-semibold leading-snug text-zinc-900">
                    Ola {session?.user?.name ?? "visitante"}, Bem vindo(a)
                  </div>
                  <Link href="/account" className="block rounded px-3 py-2 hover:bg-zinc-50">
                    Minha conta
                  </Link>
                  <Link href="/orders" className="block rounded px-3 py-2 hover:bg-zinc-50">
                    Meus pedidos
                  </Link>
                  <Link href="/account/edit" className="block rounded px-3 py-2 hover:bg-zinc-50">
                    Editar dados
                  </Link>
                  {session?.user?.role === "admin" ? (
                    <Link
                      href="/admin/managers/new"
                      className="block rounded px-3 py-2 hover:bg-zinc-50"
                    >
                      Cadastrar manager
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <Link
                href="/login"
                className="block rounded p-2 text-black hover:bg-zinc-100"
                aria-label="Entrar"
              >
                <IconProfile />
              </Link>

              <div className="invisible absolute right-0 top-full z-20 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-72 rounded-xl border border-zinc-200 bg-white p-2 text-sm text-zinc-700 shadow-xl">
                  <div className="border-b border-zinc-100 px-3 pb-2 text-sm font-semibold leading-snug text-zinc-900">
                    Ola visitante, Bem vindo(a)
                  </div>
                  <Link href="/account" className="block rounded px-3 py-2 hover:bg-zinc-50">
                    Minha conta
                  </Link>
                  <Link href="/orders" className="block rounded px-3 py-2 hover:bg-zinc-50">
                    Meus pedidos
                  </Link>
                </div>
              </div>
            </div>
          )}

          <Link
            href="/carrinho"
            className="relative flex items-center gap-1 rounded p-2 text-black hover:bg-zinc-100"
            aria-label="Carrinho"
          >
            <IconCart />
            <span className="text-sm font-semibold">{isHydrated ? itemCount : 0}</span>
          </Link>

          {session?.user?.role === "admin" || session?.user?.role === "manager" ? (
            <Link
              href="/admin"
              className="hidden rounded border border-zinc-300 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-50 md:inline-flex"
            >
              {session.user.role === "manager" ? "Manager" : "Admin"}
            </Link>
          ) : null}

          {status === "authenticated" ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-1.5 text-sm text-zinc-700 hover:text-zinc-900"
            >
              Sair
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto border-t border-zinc-200 xl:hidden">
        <nav className="flex w-max items-center gap-4 px-4 py-3">
          {mainNav.map((item) => (
            <Link
              key={`mobile-${item.href}-${item.label}`}
              href={item.href}
              className="whitespace-nowrap text-[13px] font-semibold uppercase tracking-wide text-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
