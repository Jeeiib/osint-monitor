import { describe, it, expect, beforeEach, vi } from "vitest";
import { translateBatch } from "../translate";

describe("translateBatch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockTranslateResponse = (
    translatedText: string,
    detectedLang = "en"
  ) => {
    // Google Translate API response format
    return [
      [[translatedText, "original", null, null, null]],
      null,
      detectedLang,
    ];
  };

  describe("empty input handling", () => {
    it("should return empty array for empty input", async () => {
      const result = await translateBatch([]);

      expect(result).toEqual([]);
    });
  });

  describe("HTML entity decoding", () => {
    it("should decode HTML entities before translation", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse("Biden's \"New Deal\" & Policy"),
      });
      global.fetch = mockFetch;

      const texts = ['Biden&apos;s &quot;New Deal&quot; &amp; Policy'];
      await translateBatch(texts, "fr");

      // URLSearchParams encodes differently than encodeURIComponent (+ for spaces)
      const calledUrl = mockFetch.mock.calls[0][0];
      const url = new URL(calledUrl);
      expect(url.searchParams.get("q")).toBe('Biden\'s "New Deal" & Policy');
    });

    it("should decode various HTML entities", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse("Test <tag> 'quoted'"),
      });
      global.fetch = mockFetch;

      const texts = ["Test &lt;tag&gt; &#39;quoted&#39;"];
      await translateBatch(texts, "fr");

      const calledUrl = mockFetch.mock.calls[0][0];
      const url = new URL(calledUrl);
      expect(url.searchParams.get("q")).toBe("Test <tag> 'quoted'");
    });

    it("should decode all common HTML entities", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse("Result"),
      });
      global.fetch = mockFetch;

      const texts = [
        "&quot;&apos;&amp;&lt;&gt;&#39;&#x27;&#x2F;",
      ];
      await translateBatch(texts, "fr");

      const calledUrl = mockFetch.mock.calls[0][0];
      const url = new URL(calledUrl);
      expect(url.searchParams.get("q")).toBe("\"'&<>''/" );
    });
  });

  describe("single batch translation (short texts)", () => {
    it("should translate single short text", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse("Bonjour le monde", "en"),
      });
      global.fetch = mockFetch;

      const result = await translateBatch(["Hello world"], "fr");

      expect(result).toEqual(["Bonjour le monde"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("client=gtx");
      expect(calledUrl).toContain("sl=auto");
      expect(calledUrl).toContain("tl=fr");
      expect(calledUrl).toContain("dt=t");
    });

    it("should translate multiple short texts in single batch", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse(
            "Bonjour ||| Au revoir ||| Merci",
            "en"
          ),
      });
      global.fetch = mockFetch;

      const result = await translateBatch(
        ["Hello", "Goodbye", "Thank you"],
        "fr"
      );

      expect(result).toEqual(["Bonjour", "Au revoir", "Merci"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should use separator to join texts", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse("Un ||| Deux ||| Trois", "en"),
      });
      global.fetch = mockFetch;

      const result = await translateBatch(["One", "Two", "Three"], "fr");

      // Check that texts were joined with separator
      const calledUrl = mockFetch.mock.calls[0][0];
      const url = new URL(calledUrl);
      expect(url.searchParams.get("q")).toBe("One ||| Two ||| Three");
      expect(result).toEqual(["Un", "Deux", "Trois"]);
    });

    it("should trim translated results", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse("  Un  |||  Deux  |||  Trois  ", "en"),
      });
      global.fetch = mockFetch;

      const result = await translateBatch(["One", "Two", "Three"], "fr");

      expect(result).toEqual(["Un", "Deux", "Trois"]);
    });

    it("should handle default target language (fr)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse("Bonjour", "en"),
      });
      global.fetch = mockFetch;

      await translateBatch(["Hello"]);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("tl=fr");
    });

    it("should use custom target language", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse("Hola", "en"),
      });
      global.fetch = mockFetch;

      await translateBatch(["Hello"], "es");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("tl=es");
    });
  });

  describe("chunked translation (long texts)", () => {
    it("should split into chunks when exceeding 4500 chars", async () => {
      // Create 20 texts of 250 chars each = 5000 chars total (> 4500)
      const longTexts = Array.from({ length: 20 }, (_, i) =>
        `Text ${i} ${"x".repeat(240)}`
      );

      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        // Return chunk 1 or chunk 2
        const response =
          callCount === 1
            ? Array.from({ length: 10 }, (_, i) => `Texte ${i}`).join(" ||| ")
            : Array.from({ length: 10 }, (_, i) =>
                `Texte ${i + 10}`
              ).join(" ||| ");
        return {
          ok: true,
          json: async () => createMockTranslateResponse(response, "en"),
        };
      });
      global.fetch = mockFetch;

      const result = await translateBatch(longTexts, "fr");

      // Should have made 2 calls (2 chunks of 10)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(20);
      expect(result[0]).toContain("Texte 0");
      expect(result[10]).toContain("Texte 10");
      expect(result[19]).toContain("Texte 19");
    });

    it("should process chunks of 10 texts", async () => {
      // Create 25 texts to get 3 chunks
      const texts = Array.from({ length: 25 }, (_, i) => `${"x".repeat(200)}`);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse(
            Array.from({ length: 10 }, () => "y".repeat(200)).join(" ||| "),
            "en"
          ),
      });
      global.fetch = mockFetch;

      await translateBatch(texts, "fr");

      // Should make 3 calls: 10 + 10 + 5
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle delay between chunks", async () => {
      vi.useFakeTimers();

      const texts = Array.from({ length: 20 }, () => "x".repeat(250));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse(
            Array.from({ length: 10 }, () => "y").join(" ||| "),
            "en"
          ),
      });
      global.fetch = mockFetch;

      const promise = translateBatch(texts, "fr");

      // Fast forward past the delay
      await vi.advanceTimersByTimeAsync(100);

      await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("should not delay after last chunk", async () => {
      const texts = Array.from({ length: 10 }, () => "x".repeat(250));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse(
            Array.from({ length: 10 }, () => "y").join(" ||| "),
            "en"
          ),
      });
      global.fetch = mockFetch;

      const startTime = Date.now();
      await translateBatch(texts, "fr");
      const duration = Date.now() - startTime;

      // Should complete quickly without delay (< 50ms)
      expect(duration).toBeLessThan(50);
    });
  });

  describe("error handling", () => {
    it("should return decoded texts on API error (non-ok response)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const result = await translateBatch(["Hello", "World"], "fr");

      // Should return original decoded texts as fallback
      expect(result).toEqual(["Hello", "World"]);
    });

    it("should return decoded texts on fetch rejection", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await translateBatch(["Hello", "World"], "fr");

      expect(result).toEqual(["Hello", "World"]);
    });

    it("should return decoded texts on invalid response format", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: "format" }),
      });

      const result = await translateBatch(["Hello", "World"], "fr");

      expect(result).toEqual(["Hello", "World"]);
    });

    it("should return decoded texts with HTML entities on error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await translateBatch(
        ["Biden&apos;s &quot;Plan&quot;"],
        "fr"
      );

      // Should return decoded version
      expect(result).toEqual(['Biden\'s "Plan"']);
    });

    it("should handle chunk errors individually", async () => {
      const texts = Array.from({ length: 20 }, (_, i) => `Text ${i} ${"x".repeat(240)}`);

      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First chunk succeeds
          return {
            ok: true,
            json: async () =>
              createMockTranslateResponse(
                Array.from({ length: 10 }, (_, i) => `Texte ${i}`).join(
                  " ||| "
                ),
                "en"
              ),
          };
        } else {
          // Second chunk fails
          throw new Error("API error");
        }
      });
      global.fetch = mockFetch;

      const result = await translateBatch(texts, "fr");

      // First 10 should be translated, last 10 should be original (decoded)
      expect(result).toHaveLength(20);
      expect(result[0]).toContain("Texte 0");
      expect(result[10]).toContain("Text 10"); // Original text
    });
  });

  describe("edge cases", () => {
    it("should handle texts exactly at 4500 char limit", async () => {
      // Create texts that total exactly 4500 chars
      const separator = " ||| ";
      const separatorLength = separator.length * 4; // 4 separators for 5 texts
      const textLength = Math.floor((4500 - separatorLength) / 5);
      const texts = Array.from({ length: 5 }, () => "x".repeat(textLength));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          createMockTranslateResponse(
            Array.from({ length: 5 }, () => "y".repeat(textLength)).join(
              " ||| "
            ),
            "en"
          ),
      });
      global.fetch = mockFetch;

      await translateBatch(texts, "fr");

      // Should make single call (exactly at limit)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle texts just over 4500 char limit", async () => {
      // combined = "xx...xx ||| xx...xx" where total > 4500
      // In chunking mode, chunk size is 10 so 2 texts fit in 1 chunk
      const texts = ["x".repeat(2250), "x".repeat(2251)];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse("y".repeat(2250) + " ||| " + "y".repeat(2251), "en"),
      });
      global.fetch = mockFetch;

      await translateBatch(texts, "fr");

      // Over 4500 triggers chunking, but 2 texts < chunk size 10, so still 1 call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle many texts requiring multiple chunks", async () => {
      // 15 texts of 350 chars: combined > 4500, needs 2 chunks (10 + 5)
      const texts = Array.from({ length: 15 }, () => "x".repeat(350));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse(
          Array.from({ length: 10 }, () => "y".repeat(350)).join(" ||| "),
          "en"
        ),
      });
      global.fetch = mockFetch;

      await translateBatch(texts, "fr");

      // 15 texts split into chunks of 10: 2 calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle empty strings in input", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createMockTranslateResponse(" |||  ||| ", "en"),
      });
      global.fetch = mockFetch;

      const result = await translateBatch(["", "", ""], "fr");

      expect(result).toEqual(["", "", ""]);
    });
  });
});
