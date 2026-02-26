import Link from "next/link";

export const metadata = {
  title: "Quem Somos | Struf",
  description: "Conheça a história, o propósito e a identidade da Struf.",
};

export default function SobreNosPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">
            Home
          </Link>{" "}
          / <span className="text-zinc-900">Quem somos</span>
        </div>

        <h1 className="text-3xl font-black uppercase leading-none tracking-tight md:text-7xl">
          Quem Somos
        </h1>

        <article className="mt-4 max-w-6xl space-y-4 text-sm font-medium leading-7 text-zinc-700 md:text-base md:leading-8">
          <p>
            A Struf é uma empresa especializada na personalização de marcas, com
            inspiração na vida selvagem. Cada criação nasce da arte autoral de
            Filipe Prado Garcia, com desenhos feitos em freehand, carregados de
            autenticidade, identidade e personalidade.
          </p>

          <p>
            Mais do que design, a Struf tem um propósito. Nosso objetivo é
            construir parcerias ao redor do mundo que contribuam diretamente
            para a preservação da vida selvagem. Buscamos evoluir para a
            produção de tecidos e produtos ecológicos, que não causem impacto
            negativo aos animais e ao meio ambiente.
          </p>

          <p>
            Acreditamos em propósito com ação. Por isso, temos o ideal de nos
            unir a institutos e santuários de animais, fortalecendo projetos
            que realmente façam a diferença.
          </p>

          <p>
            Além da consciência ambiental, a Struf carrega uma estética
            marcante. Existe uma pegada swag, moderna e expressiva nas roupas —
            porque estilo também comunica atitude. É aquela presença de quem
            sabe se vestir e sabe quem é.
          </p>

          <p>
            Unindo propósito, identidade e estilo, a Struf não apenas constrói
            sua própria marca — ela ajuda outras empresas a encontrarem e
            expressarem a delas.
          </p>
          <p>
            Struf,
            <br />
            Moda selvagem.
          </p>
        </article>
      </section>
    </main>
  );
}
