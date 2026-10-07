"use client";

import { useMemo, useState } from "react";
import { addSelectionAction } from "@/lib/quotes/actions";
import { CATEGORIES_REQUIRING_QUANTITY, CATEGORY_LABEL, UNIT_LABEL } from "@/lib/quotes/labels";
import { computeAutoQuantity } from "@/lib/estimate/engine";
import type { SpaceInput } from "@/lib/estimate/types";
import type { MaterialCategory, MaterialPrice } from "@prisma/client";

const round1 = (n: number) => Math.round(n * 10) / 10;

export function AddSelectionForm({
  quoteId,
  spaceId,
  space,
  priceBook,
}: {
  quoteId: string;
  spaceId: string;
  space: SpaceInput;
  priceBook: MaterialPrice[];
}) {
  const [category, setCategory] = useState<MaterialCategory>(priceBook[0]?.category ?? "FLOORING");
  const [materialPriceId, setMaterialPriceId] = useState<string>(priceBook.find((m) => m.category === category)?.id ?? "");
  const [typedQuantity, setTypedQuantity] = useState<string>("");

  const categories = useMemo(() => Array.from(new Set(priceBook.map((m) => m.category))), [priceBook]);
  const optionsForCategory = useMemo(() => priceBook.filter((m) => m.category === category), [priceBook, category]);
  const selectedMaterial = optionsForCategory.find((m) => m.id === materialPriceId) ?? optionsForCategory[0];
  const needsQuantity = CATEGORIES_REQUIRING_QUANTITY.includes(category);

  function handleCategoryChange(next: MaterialCategory) {
    setCategory(next);
    setMaterialPriceId(priceBook.find((m) => m.category === next)?.id ?? "");
    setTypedQuantity("");
  }

  const wasteFactorPercent = selectedMaterial?.wasteFactorPercent ?? 0;

  // Auto-derivable categories: show the computed area/length live, already
  // padded for waste, so the contractor sees exactly what the estimate will
  // use before adding the material.
  const autoBaseQuantity = !needsQuantity ? computeAutoQuantity(category, space) : null;
  const autoQuantityWithWaste = autoBaseQuantity !== null ? autoBaseQuantity * (1 + wasteFactorPercent / 100) : null;

  // Manual-entry categories: pad whatever the contractor typed, live, so the
  // same "order extra for cuts/breakage" logic applies there too.
  const typedBase = Number(typedQuantity);
  const typedWithWaste = needsQuantity && Number.isFinite(typedBase) && typedBase > 0 ? typedBase * (1 + wasteFactorPercent / 100) : null;

  return (
    <form
      action={addSelectionAction}
      className="flex flex-col gap-3 rounded-md bg-stone-50 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2"
    >
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="spaceId" value={spaceId} />

      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-stone-500">Category</label>
        <select
          name="category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as MaterialCategory)}
          className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:w-36 sm:py-1.5"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-stone-500">Material</label>
        <select
          name="materialPriceId"
          required
          value={materialPriceId}
          onChange={(e) => setMaterialPriceId(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:w-56 sm:py-1.5"
        >
          {optionsForCategory.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (${m.unitCost}/{UNIT_LABEL[m.unit]})
            </option>
          ))}
        </select>
      </div>

      {needsQuantity ? (
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-stone-500">
            Qty {selectedMaterial ? `(${UNIT_LABEL[selectedMaterial.unit]})` : ""}
          </label>
          <input
            name="quantityOverride"
            type="number"
            step="0.1"
            required
            value={typedQuantity}
            onChange={(e) => setTypedQuantity(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:w-24 sm:py-1.5"
          />
          {typedWithWaste !== null && (
            <p className="mt-1 text-xs text-stone-500">
              Order ≈ <span className="font-semibold text-stone-700">{round1(typedWithWaste)}</span> ({wasteFactorPercent}% extra for cuts/breakage)
            </p>
          )}
        </div>
      ) : (
        autoQuantityWithWaste !== null && (
          <div className="w-full text-xs text-stone-500 sm:w-auto">
            <p>
              From room size: <span className="font-semibold text-stone-700">{round1(autoQuantityWithWaste)} {selectedMaterial ? UNIT_LABEL[selectedMaterial.unit] : ""}</span>
              {" "}needed
            </p>
            <p className="text-stone-400">
              ({round1(autoBaseQuantity ?? 0)} actual + {wasteFactorPercent}% for cuts/breakage)
            </p>
          </div>
        )
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900 sm:w-auto sm:py-1.5"
      >
        + Add Material
      </button>
    </form>
  );
}
