import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminCreateCategoryForm from "@/components/admin/AdminCreateCategoryForm";
import AdminDeleteCategoryButton from "@/components/admin/AdminDeleteCategoryButton";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  products_count: number;
};

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/categories");
  }
  if (session.user.role !== "admin") {
    redirect("/admin");
  }

  const categoriesResult = await query<CategoryRow>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        COUNT(p.id)::int AS products_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Categorias</h2>
        <p className="text-sm text-zinc-600">Crie e mantenha as categorias da loja.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminCreateCategoryForm />

        <section className="overflow-hidden border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Produtos</th>
                  <th className="px-4 py-3">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-900">
                {categoriesResult.rows.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-4 text-zinc-500">#{category.id}</td>
                    <td className="px-4 py-4">{category.name}</td>
                    <td className="px-4 py-4 text-zinc-700">{category.slug}</td>
                    <td className="px-4 py-4">{category.products_count}</td>
                    <td className="px-4 py-4">
                      <AdminDeleteCategoryButton
                        categoryId={category.id}
                        disabled={category.products_count > 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
