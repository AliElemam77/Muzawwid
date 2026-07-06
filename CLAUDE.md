# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A client-side, browser-only tool that converts arbitrary product spreadsheets (`.xlsx` / `.xls` / `.csv`) into Salla's **exact** product-import template. All parsing, mapping, and workbook generation happen in the browser (via `xlsx`/SheetJS) — there is no backend. The UI is Arabic, RTL (`index.html` sets `dir="rtl" lang="ar"`).

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b` typecheck then `vite build`
- `pnpm test` — run Vitest once (`vitest run`)
- `pnpm vitest run src/lib/salla.test.ts` — run a single test file
- `pnpm vitest run -t "exactly 40 headers"` — run a single test by name

There is no separate lint step; type strictness is enforced by `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`) during `pnpm build`.

## Data pipeline

The transform is a one-directional pipeline through `src/lib/`. Understanding these four files in order is the fastest way to be productive:

1. **`reader.ts`** — `readWorkbook(file)` parses an uploaded file into `SourceWorkbook` → `SourceSheet[]`. Every cell is coerced to a trimmed string; the first non-empty row is treated as headers; empty/duplicate headers are auto-named (`عمود N`, `header (2)`) so mapping keys stay unique.
2. **`automap.ts`** — `autoMap(headers)` produces an initial `MappingConfig` by fuzzy keyword-matching source headers (Arabic + English) to Salla fields. `norm()` strips Arabic diacritics and normalizes alef/taa-marbuta for loose matching. Images and options are claimed first, then simple fields. Everything it guesses is meant to be user-editable in the UI.
3. **`build.ts`** — `buildRows(sheet, config)` is the core. It turns each source row into one **parent product row** (`النوع = منتج`) plus zero-or-more **variant option rows** (`النوع = خيار`) via a **cartesian product** of the option columns (`optionCombos`). Also holds `validate(rows)` (returns Arabic error/warning issues) and value cleaners (`cleanPrice`, `splitValues`).
4. **`salla.ts`** — the output-schema authority and workbook writer. `buildSallaWorkbook(rows)` lays out the SheetJS workbook; `downloadWorkbook` triggers the `.xlsx` download.

`types.ts` defines the serializable `MappingConfig` (savable as a `Preset`) — `fields`, `imageColumns`, `sku`, `options` (max 3), and `defaults`.

## Salla output schema — do not break these invariants

`salla.ts` encodes Salla's template exactly; these are hard requirements, and `salla.test.ts` guards them:

- **Exactly 40 headers** in `SALLA_HEADERS`, in the exact order given.
- **The first header `'النوع '` has an intentional trailing space** — do not trim or "fix" it.
- The workbook must contain **exactly one sheet**, named `SHEET_NAME` (`'Salla Products Template Sheet'`). `buildSallaWorkbook` defensively overwrites `wb.SheetNames`/`wb.Sheets` to guarantee this.
- Row 1 (A1) is the section label `بيانات المنتج`; row 2 is the 40 headers; data rows start at row 3.
- Every data row is emitted with all 40 columns (missing keys → empty string).

Variant/option encoding:

- Up to **3 option groups**, each occupying 4 repeating columns (`[n] الاسم / النوع / القيمة / الصورة / اللون`) — see `optionGroupCols(n)`.
- On the **parent** row, `[n] القيمة` must hold `OPTION_VALUE_PLACEHOLDER` (a literal instructional Arabic string), never a real value.
- Real option values go on the child `خيار` rows; color options additionally fill the swatch column when a value looks like hex (`isHex`).
- Weight is required on **both** product and option rows; `applyDefaults` fills empty required cells (`productType`, `requiresShipping`, `taxable`, `weight`, `weightUnit`) per row.

When referring to Salla fields in code, use the `F` map in `salla.ts` rather than raw Arabic string literals.

## UI layer

`src/App.tsx` orchestrates the 3-step flow (upload → map → export) and owns all state: `workbook`, selected `sheetName`, the `MappingConfig`, and saved `presets`. Output rows and validation are recomputed with `useMemo` on every mapping change, so the preview and validation summary are live. Selecting a file (or a different sheet) re-runs `autoMap` on that sheet's headers.

Presentational components live in `src/components/` and are deliberately thin — they hold no business logic, only render config and emit changes upward:
- `Uploader`, `SourcePreview` (step 1), `MappingPanel` + its sub-editors `FieldMapper` / `ImageMerge` / `SkuGenerator` / `OptionsEditor` / `DefaultsEditor`, `PresetBar` (step 2), `OutputPreview` + `ValidationSummary` (step 3).
- `ui.tsx` holds shared Tailwind primitives (`Select`, `TextInput`, `Button`, `Card`, `Label`) — reuse these rather than restyling raw elements so controls stay consistent.
- `src/lib/presets.ts` persists mapping presets to `localStorage` (key `sheet-to-salla:presets`); all reads are exception-safe.

`SIMPLE_FIELDS` in `MappingPanel.tsx` is the curated list of directly-mapped Salla fields; it intentionally **excludes** image, SKU, the option-group columns, and the five default-driven fields, since those have dedicated editors. Add new simple fields there.

Tests: `salla.test.ts` guards the output-schema invariants; `build.test.ts` covers the `buildRows`/`validate` transform (variant expansion, price cleaning, required-weight, orphan detection).
