import { vi } from "vitest";
import messages from "../../messages/fr.json";

type Messages = Record<string, Record<string, string>>;

function getNestedValue(obj: Messages, namespace: string, key: string): string {
  const ns = obj[namespace];
  if (!ns) return `${namespace}.${key}`;
  return ns[key] ?? `${namespace}.${key}`;
}

function createTranslator(namespace: string) {
  return (key: string, values?: Record<string, string | number>) => {
    let result = getNestedValue(messages as unknown as Messages, namespace, key);
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        result = result.replace(`{${k}}`, String(v));
      }
    }
    return result;
  };
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => createTranslator(namespace),
  useLocale: () => "fr",
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
