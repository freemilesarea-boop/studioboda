import { requireStaff } from "@/lib/auth";
import { adminListFaq } from "@/lib/queries/faq";
import { type FaqCategory, type FaqItem } from "@/lib/types/db";
import { FaqAdmin, FaqItemRow } from "./FaqAdmin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · FAQ",
  robots: { index: false, follow: false },
};

export default async function AdminFaqPage() {
  await requireStaff();
  const { categories, items } = await adminListFaq();

  const groups = categories.map((category) => ({
    category,
    rows: items.filter((item) => item.category_id === category.id),
  }));
  const uncategorized = items.filter((item) => item.category_id == null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[22px] font-extrabold tracking-display text-ink-100">
          FAQ 관리
        </h1>
        <p className="mt-1 text-[13px] text-ink-50">
          자주 묻는 질문과 카테고리를 추가하고 편집합니다.
        </p>
      </div>

      <FaqAdmin categories={categories} />

      <div className="space-y-5">
        {groups.map(({ category, rows }) => (
          <div
            key={category.id}
            className="rounded-2xl border border-ink-15 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[15px] font-bold text-ink-100">
                {category.name}
                <span className="ml-2 text-[12px] font-normal text-ink-50">
                  순서 {category.sort_order}
                </span>
              </h2>
              <span className="text-[12px] text-ink-50">{rows.length}개</span>
            </div>
            <ItemList rows={rows} categories={categories} />
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div className="rounded-2xl border border-ink-15 bg-white p-5">
            <h2 className="font-display text-[15px] font-bold text-ink-100">
              미분류
            </h2>
            <ItemList rows={uncategorized} categories={categories} />
          </div>
        )}
      </div>
    </div>
  );
}

function ItemList({
  rows,
  categories,
}: {
  rows: FaqItem[];
  categories: FaqCategory[];
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 text-[13px] text-ink-50">등록된 항목이 없습니다.</p>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      {rows.map((item) => (
        <FaqItemRow key={item.id} item={item} categories={categories} />
      ))}
    </div>
  );
}
