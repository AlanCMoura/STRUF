"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-sm">
        <Link href="/" className="text-base font-semibold text-zinc-900">
          Struf
        </Link>

        <nav className="flex items-center gap-3">
          {status === "authenticated" ? (
            <div className="group relative">
              <div className="fixed inset-0 z-0 hidden group-focus-within:block" />
              <button
                type="button"
                onClick={(event) => event.currentTarget.blur()}
                className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 text-zinc-700 hover:bg-zinc-50"
                aria-haspopup="true"
                aria-label="Menu da conta"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-zinc-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                </svg>
              </button>

              <div className="invisible absolute right-0 top-full z-10 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-56 rounded-xl border border-zinc-200 bg-white p-2 text-sm text-zinc-700 shadow-lg">
                  <div className="border-b border-zinc-100 px-3 pb-2 text-sm font-medium text-zinc-800">
                    {session?.user?.name ?? "Minha conta"}
                  </div>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-50"
                    onClick={(event) => event.currentTarget.blur()}
                  >
                    Minha conta
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-50"
                    onClick={(event) => event.currentTarget.blur()}
                  >
                    Meus pedidos
                  </Link>
                  <Link
                    href="/account/edit"
                    className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-50"
                    onClick={(event) => event.currentTarget.blur()}
                  >
                    Editar dados
                  </Link>
                  {session?.user?.role === "admin" ? (
                    <Link
                      href="/admin/managers/new"
                      className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-50"
                      onClick={(event) => event.currentTarget.blur()}
                    >
                      Cadastrar manager
                    </Link>
                  ) : null}
                  <div className="mt-2 border-t border-zinc-100 pt-2">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full rounded px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {session?.user?.role === "admin" ||
          session?.user?.role === "manager" ? (
            <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
              {session?.user?.role === "manager" ? "Manager" : "Admin"}
            </Link>
          ) : null}
          {status === "authenticated" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded border border-zinc-300 px-3 py-1 text-zinc-700 hover:bg-zinc-50"
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded border border-zinc-300 px-3 py-1 text-zinc-700 hover:bg-zinc-50"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
              >
                Cadastrar-se
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
