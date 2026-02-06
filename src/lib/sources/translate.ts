const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

interface TranslateResult {
  translatedText: string;
  detectedLang: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

async function translateSingle(text: string, targetLang: string): Promise<TranslateResult> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLang,
    dt: "t",
    q: text,
  });

  const response = await fetch(`${TRANSLATE_URL}?${params}`);
  if (!response.ok) {
    return { translatedText: text, detectedLang: "unknown" };
  }

  const data = await response.json();

  // Response format: [[["translated text","original text",null,null,null],...],null,"detected_lang"]
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return { translatedText: text, detectedLang: "unknown" };
  }

  const translated = data[0]
    .map((segment: [string]) => segment[0])
    .join("");
  const detectedLang = data[2] || "unknown";

  return { translatedText: translated, detectedLang: String(detectedLang) };
}

export async function translateBatch(
  texts: string[],
  targetLang: string = "fr"
): Promise<string[]> {
  if (texts.length === 0) return [];

  // Decode HTML entities first
  const decoded = texts.map(decodeHtmlEntities);

  // Join all texts with a unique separator for batch translation
  const separator = " ||| ";
  const combined = decoded.join(separator);

  // Google Translate has a ~5000 char limit per request
  // If combined text is too long, split into chunks
  if (combined.length <= 4500) {
    try {
      const result = await translateSingle(combined, targetLang);
      return result.translatedText.split(separator).map((t) => t.trim());
    } catch {
      return decoded;
    }
  }

  // Split into chunks for large batches
  const results: string[] = [];
  const chunkSize = 10;

  for (let i = 0; i < decoded.length; i += chunkSize) {
    const chunk = decoded.slice(i, i + chunkSize);
    const chunkCombined = chunk.join(separator);

    try {
      const result = await translateSingle(chunkCombined, targetLang);
      const translated = result.translatedText.split(separator).map((t) => t.trim());
      results.push(...translated);
    } catch {
      results.push(...chunk);
    }

    // Small delay between chunks to avoid rate limiting
    if (i + chunkSize < decoded.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return results;
}
