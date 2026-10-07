"use client";

import { useState } from "react";
import { createQuoteAction } from "@/lib/quotes/actions";
import { PROJECT_TYPE_LABEL } from "@/lib/quotes/labels";
import { FeetInchesField } from "../FeetInchesField";
import type { ProjectType } from "@prisma/client";

export default function NewQuotePage() {
  const [projectType, setProjectType] = useState<ProjectType>("BATHROOM_REMODEL");
  const needsWallHeight = projectType !== "FLOORING";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-stone-900">New Quote</h1>
      <p className="mt-1 text-sm text-stone-500">
        Start with the customer and the first room. You can add more rooms, materials, and photos on the next screen.
      </p>

      <form action={createQuoteAction} className="mt-6 space-y-6 rounded-lg border border-stone-200 bg-white p-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-stone-900">Customer</legend>
          <Field label="Name" name="customerName" required />
          <Field label="Email" name="customerEmail" type="email" required />
          <Field label="Phone" name="customerPhone" type="tel" />
          <Field label="Address" name="customerAddress" />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-stone-900">Project</legend>
          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-stone-700">
              Project type
            </label>
            <select
              id="projectType"
              name="projectType"
              required
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {Object.entries(PROJECT_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-stone-900">First room / space</legend>
          <Field label="Name" name="spaceName" placeholder="e.g. Main Bathroom" required />
          <div className="flex flex-wrap gap-4">
            <FeetInchesField label="Length" feetName="lengthFt" inchesName="lengthIn" required />
            <FeetInchesField label="Width" feetName="widthFt" inchesName="widthIn" required />
            {needsWallHeight && (
              <FeetInchesField label="Wall height" feetName="heightFt" inchesName="heightIn" defaultFeet={8} />
            )}
          </div>
          {!needsWallHeight && (
            <p className="text-xs text-stone-400">
              Flooring jobs just need floor area — no wall height needed.
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Create Quote
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
