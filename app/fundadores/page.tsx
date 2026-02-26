export const metadata = {
  title: "Fundadores | Struf",
  description: "Conheca os fundadores da Struf.",
};

export default function FundadoresPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="border-b border-zinc-200 bg-black text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
            Struf
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-6xl">
            Conheca os fundadores
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/70 md:text-base">
            Espaco dedicado para apresentar a historia, fotos e trajetoria dos fundadores da Struf.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="border border-zinc-200 bg-zinc-50 p-6 md:p-8">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Conteudo em construcao
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-700 md:text-base">
            Esta pagina foi separada da aba Quem somos para receber conteudo proprio sobre os fundadores. Quando voce tiver os textos e imagens, eu posso montar o layout completo.
          </p>
        </div>
      </section>
    </main>
  );
}
