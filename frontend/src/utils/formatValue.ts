import { VarValue } from "../types/execution";

export function formatValue(v: VarValue, depth = 0): string {
  if (!v) return "None";
  if (depth > 3) return "...";

  switch (v.type) {
    case "NoneType":
      return "None";
    case "bool":
      return v.value ? "True" : "False";
    case "int":
    case "float":
      return String(v.value);
    case "str":
      return `"${v.value}"`;
    case "function":
      return String(v.value);
    case "class":
      return String(v.value);
    case "list": {
      if (v.circular) return "[…circular…]";
      const items = (v.items ?? []).map((i) => formatValue(i, depth + 1)).join(", ");
      const suffix = v.truncated ? `, …(${v.length})` : "";
      return `[${items}${suffix}]`;
    }
    case "tuple": {
      const items = (v.items ?? []).map((i) => formatValue(i, depth + 1)).join(", ");
      return `(${items})`;
    }
    case "set": {
      const items = (v.items ?? []).map((i) => formatValue(i, depth + 1)).join(", ");
      return `{${items}}`;
    }
    case "dict": {
      if (v.circular) return "{…circular…}";
      const pairs = (v.pairs ?? [])
        .map((p) => `${formatValue(p.key, depth + 1)}: ${formatValue(p.value, depth + 1)}`)
        .join(", ");
      const suffix = v.truncated ? `, …(${v.length})` : "";
      return `{${pairs}${suffix}}`;
    }
    default:
      return v.value !== undefined ? String(v.value) : `<${v.type}>`;
  }
}

export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    int: "#7dd3fc",
    float: "#a5f3fc",
    str: "#86efac",
    bool: "#fde68a",
    NoneType: "#9ca3af",
    list: "#c4b5fd",
    tuple: "#d8b4fe",
    set: "#f9a8d4",
    dict: "#fb923c",
    function: "#67e8f9",
    class: "#67e8f9",
  };
  return map[type] ?? "#e2e8f0";
}