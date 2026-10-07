export function FeetInchesField({
  label,
  feetName,
  inchesName,
  defaultFeet,
  defaultInches,
  required,
}: {
  label: string;
  feetName: string;
  inchesName: string;
  defaultFeet?: number;
  defaultInches?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            name={feetName}
            type="number"
            inputMode="numeric"
            step={1}
            min={0}
            required={required}
            defaultValue={defaultFeet}
            className="w-16 rounded-md border border-stone-300 px-2 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="text-sm text-stone-500">ft</span>
        </div>
        <div className="flex items-center gap-1">
          <select
            name={inchesName}
            defaultValue={defaultInches ?? 0}
            className="w-16 rounded-md border border-stone-300 px-2 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <span className="text-sm text-stone-500">in</span>
        </div>
      </div>
    </div>
  );
}
