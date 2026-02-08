"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const locales: Locale[] = ["fr", "en"];

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(locale: Locale) {
    router.replace(pathname, { locale });
  }

  return (
    <div className="flex items-center rounded-md border border-white/5 bg-slate-800/50">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
            locale === currentLocale
              ? "bg-slate-700 text-slate-200"
              : "text-slate-500 hover:text-slate-300"
          } ${locale === "fr" ? "rounded-l-md" : "rounded-r-md"}`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
