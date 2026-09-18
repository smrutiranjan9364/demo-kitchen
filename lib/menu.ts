export type MenuOption = { id: string; label: string; price: number };
export type Selection = {
  variantId?: string;
  addonIds?: string[];
  instructions?: string;
};
export function cartKey(item: { id: string } & Selection) {
  return JSON.stringify([
    item.id,
    item.variantId ?? "",
    [...(item.addonIds ?? [])].sort(),
    item.instructions ?? "",
  ]);
}
export function parseOptions(value: unknown): MenuOption[] {
  if (typeof value !== "string" || !value.trim()) return [];
  const lines = value.trim().split("\n");
  if (lines.length > 20) throw new Error("Use at most 20 options.");
  return lines.map((line, i) => {
    const [label, amount, ...extra] = line.split("|").map((v) => v.trim());
    const price = Number(amount);
    if (
      !label ||
      label.length > 60 ||
      !amount ||
      extra.length ||
      !Number.isInteger(price) ||
      price < 0 ||
      price > 10000
    )
      throw new Error(
        "Enter each option as Name | extra price, for example Large | 50.",
      );
    return {
      id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
      label,
      price,
    };
  });
}
export function optionsText(options: MenuOption[] = []) {
  return options.map((o) => `${o.label} | ${o.price}`).join("\n");
}
