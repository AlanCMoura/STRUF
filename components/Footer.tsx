import Link from "next/link";

const CONTACT_PHONE = "(13) 98225-8943";
const CONTACT_PHONE_LINK = "5513982258943";
const CONTACT_EMAIL = "strufdesigns@gmail.com";
const INSTAGRAM_URL = "https://instagram.com/strufactory";

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col items-center text-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Instagram da Struf"
            className="inline-flex h-10 w-10 items-center justify-center text-white transition hover:text-white/70"
          >
            <InstagramIcon />
          </a>

          <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <Link
              href="/sobre-nos"
              className="text-sm font-semibold uppercase tracking-wide text-white hover:text-white/75"
            >
              Quem somos
            </Link>
            <Link
              href="/fundadores"
              className="text-sm font-semibold uppercase tracking-wide text-white hover:text-white/75"
            >
              Conheça os fundadores
            </Link>
          </nav>

          <div className="mt-10 space-y-3 text-sm">
            <a
              href={`tel:+${CONTACT_PHONE_LINK}`}
              className="block font-medium text-white hover:text-white/75"
            >
              {CONTACT_PHONE}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block font-medium text-white hover:text-white/75"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <p className="mt-10 text-xs text-white/45">
            &copy; {new Date().getFullYear()} Struf. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
