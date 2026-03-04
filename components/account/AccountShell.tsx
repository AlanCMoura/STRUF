import Link from "next/link";
import type { ReactNode } from "react";
import SignOutButton from "@/components/account/SignOutButton";

type AccountTab = "home" | "dados" | "pedidos" | "endereco";

type AccountShellProps = {
  activeTab: AccountTab;
  userName: string;
  userEmail: string;
  children: ReactNode;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 10.8 12 4l9 6.8" />
      <path d="M6 9.8V20h12V9.8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c0-4.2 3.8-7 8-7s8 2.8 8 7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 4 7l8 4 8-4-8-4z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s6-6.2 6-11a6 6 0 1 0-12 0c0 4.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 4H5v16h5" />
      <path d="M14 12H4" />
      <path d="m11 9 3 3-3 3" />
      <path d="M19 4h-4v16h4" />
    </svg>
  );
}

const navItems: Array<{ key: AccountTab; href: string; label: string; icon: ReactNode }> = [
  { key: "home", href: "/account", label: "Home", icon: <HomeIcon /> },
  {
    key: "dados",
    href: "/account/dados",
    label: "Dados e preferencias",
    icon: <UserIcon />,
  },
  { key: "pedidos", href: "/account/pedidos", label: "Meus pedidos", icon: <BoxIcon /> },
  {
    key: "endereco",
    href: "/account/endereco",
    label: "Meus enderecos",
    icon: <PinIcon />,
  },
];

export default function AccountShell({
  activeTab,
  userName,
  userEmail,
  children,
}: AccountShellProps) {
  const firstName = userName.split(" ")[0] || "cliente";

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950 md:px-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-zinc-200 text-xl font-semibold text-zinc-600">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black leading-none text-zinc-900">
                    Ola, {firstName}
                  </p>
                  <p className="text-sm text-zinc-700">{userEmail}</p>
                </div>
              </div>
            </section>

            <nav className="border border-zinc-200 bg-white">
              <ul>
                {navItems.map((item) => {
                  const isActive = item.key === activeTab;

                  return (
                    <li key={item.key} className="border-b border-zinc-200 last:border-b-0">
                      <Link
                        href={item.href}
                        className={`flex cursor-pointer items-center gap-2 py-4 text-sm transition ${
                          isActive
                            ? "border-l-4 border-zinc-900 bg-zinc-100 px-4 font-semibold text-zinc-900"
                            : "px-5 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <SignOutButton
                    className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm text-zinc-700 transition hover:text-zinc-900"
                  >
                    <LogoutIcon />
                    Sair
                  </SignOutButton>
                </li>
              </ul>
            </nav>
          </aside>

          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
