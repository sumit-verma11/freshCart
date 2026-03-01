"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { INutritionFacts } from "@/types";

interface Props {
  additionalInfo?: string;
  ingredients?:    string;
  allergyInfo?:    string;
  nutritionFacts?: INutritionFacts;
}

// Known nutrients in display order
const KNOWN_NUTRIENTS: Array<{ key: string; label: string; unit: string }> = [
  { key: "servingSize",   label: "Serving Size",    unit: "" },
  { key: "calories",      label: "Calories",        unit: "kcal" },
  { key: "protein",       label: "Protein",         unit: "g" },
  { key: "carbohydrates", label: "Carbohydrates",   unit: "g" },
  { key: "fat",           label: "Total Fat",       unit: "g" },
  { key: "saturatedFat",  label: "Saturated Fat",   unit: "g" },
  { key: "fiber",         label: "Dietary Fiber",   unit: "g" },
  { key: "sugar",         label: "Total Sugars",    unit: "g" },
  { key: "sodium",        label: "Sodium",          unit: "mg" },
];

export default function ProductTabs({
  additionalInfo,
  ingredients,
  allergyInfo,
  nutritionFacts,
}: Props) {
  // Build only the tabs that have content
  type Tab = { id: string; label: string; warn?: boolean };
  const tabs: Tab[] = [
    additionalInfo && { id: "info",        label: "Product Info" },
    ingredients    && { id: "ingredients", label: "Ingredients" },
    allergyInfo    && { id: "allergy",     label: "Allergy Info", warn: true },
    nutritionFacts && { id: "nutrition",   label: "Nutrition Facts" },
  ].filter(Boolean) as Tab[];

  const [active, setActive] = useState(tabs[0]?.id ?? "");

  if (tabs.length === 0) return null;

  // Extra nutrient rows (not in the known list)
  const knownKeys = new Set(KNOWN_NUTRIENTS.map((n) => n.key));
  const extraNutrients = nutritionFacts
    ? Object.entries(nutritionFacts).filter(([k, v]) => !knownKeys.has(k) && v !== undefined)
    : [];

  return (
    <div className="card overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border bg-gray-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold
                        whitespace-nowrap border-b-2 transition-all duration-150
                        ${active === tab.id
                          ? "border-primary text-primary bg-white"
                          : "border-transparent text-muted hover:text-dark hover:bg-white/60"
                        }`}
          >
            {tab.warn && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panels */}
      <div className="p-6">

        {/* Product Info */}
        {active === "info" && additionalInfo && (
          <div className="prose-sm max-w-none">
            <p className="text-muted leading-relaxed whitespace-pre-line">{additionalInfo}</p>
          </div>
        )}

        {/* Ingredients */}
        {active === "ingredients" && ingredients && (
          <p className="text-muted leading-relaxed">{ingredients}</p>
        )}

        {/* Allergy Info */}
        {active === "allergy" && allergyInfo && (
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-dark mb-2">Allergy Warning</p>
              <p className="text-muted leading-relaxed">{allergyInfo}</p>
            </div>
          </div>
        )}

        {/* Nutrition Facts */}
        {active === "nutrition" && nutritionFacts && (
          <div>
            <div className="border-4 border-dark rounded-xl overflow-hidden max-w-sm">
              {/* Header */}
              <div className="bg-dark text-white px-4 py-3">
                <p className="text-xl font-extrabold tracking-tight">Nutrition Facts</p>
                {nutritionFacts.servingSize && (
                  <p className="text-xs text-white/70 mt-0.5">
                    Serving size: {nutritionFacts.servingSize}
                  </p>
                )}
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {KNOWN_NUTRIENTS.filter((n) => n.key !== "servingSize").map(({ key, label, unit }) => {
                    const val = (nutritionFacts as Record<string, string | number | undefined>)[key];
                    if (val === undefined || val === null) return null;
                    const isCalories = key === "calories";
                    return (
                      <tr
                        key={key}
                        className={`border-t ${isCalories ? "border-t-4 border-dark" : "border-border"}`}
                      >
                        <td className={`px-4 py-2 ${isCalories ? "font-extrabold text-dark text-base" : "text-muted"}`}>
                          {label}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold text-dark
                                       ${isCalories ? "text-xl" : ""}`}>
                          {typeof val === "number"
                            ? `${val}${unit ? ` ${unit}` : ""}`
                            : val}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Extra nutrients */}
                  {extraNutrients.map(([key, val]) => (
                    <tr key={key} className="border-t border-border">
                      <td className="px-4 py-2 text-muted capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-dark">
                        {String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-3 border-t border-dark/20 bg-gray-50 text-xs text-muted">
                * % Daily Value based on a 2000 kcal diet
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
