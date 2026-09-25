"use client";

import { useMemo, useState } from "react";
import { addSelectionAction } from "@/lib/quotes/actions";
import { CATEGORIES_REQUIRING_QUANTITY, CATEGORY_LABEL, UNIT_LABEL } from "@/lib/quotes/labels";
import type { MaterialCategory, MaterialPrice } from "@prisma/client";

export function AddSelectionForm({ quoteId, spaceId, priceBook }: { quoteId: string; spaceId: string; priceBook: MaterialPrice[] }) {
  const [category, setCategory] = useState<MaterialCategory>(priceBook[0]?.category ?? "FLOORING");

  const categories = useMemo(() => Array.from(new Set(priceBook.map((m) => m.category))), [priceBook]);
  const optionsForCategory = useMemo(() => priceBook.filter((m) => m.category === category), [priceBook, category]);
  const needsQuantity = CATEGORIES_REQUIRING_QUANTITY.includes(category);
  const selectedUnit = optionsForCategory[0]?.unit;

  return (
    <form action={addSelectionAction} className="flex flex-wrap items-end gap-2 rounded-md bg-stone-50 p-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="spaceId" value={spaceId} />

      <div>
        <label className="block text-xs font-medium text-stone-500">Category</label>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as MaterialCategory)}
          className="mt-1 w-36 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500">Material</label>
        <select name="materialPriceId" required className="mt-1 w-56 rounded-md border border-stone-300 px-2 py-1.5 text-sm">
          {optionsForCategory.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (${m.unitCost}/{UNIT_LABEL[m.unit]})
            </option>
          ))}
        </select>
      </div>

      {needsQuantity && (
        <div>
          <label className="block text-xs font-medium text-stone-500">Qty {selectedUnit ? `(${UNIT_LABEL[selectedUnit]})` : ""}</label>
          <input
            name="quantityOverride"
            type="number"
            step="0.1"
            required
            className="mt-1 w-24 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}

      <button type="submit" className="rounded-md bg-stone-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-stone-900">
        + Add Material
      </button>
    </form>
  );
}
