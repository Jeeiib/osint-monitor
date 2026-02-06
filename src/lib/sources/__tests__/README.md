# OSINT Monitor - Data Sources Unit Tests

This directory contains comprehensive unit tests for all OSINT Monitor data source integrations.

## Test Files

### 1. `usgs.test.ts` - USGS Earthquake Data
Tests the USGS earthquake data fetching and transformation.

**Coverage:**
- URL construction with different period/magnitude combinations
- GeoJSON to Earthquake mapping
- Coordinate swap verification (lng/lat → lat/lng)
- Error handling (404, 500, network failures)
- Edge cases (empty results, zero coordinates)

**Key Test Cases:**
- ✓ Default parameters (day, 2.5)
- ✓ Custom periods (hour, week, month)
- ✓ Magnitude levels (all, 1.0, 2.5, 4.5, significant)
- ✓ Correct coordinate transformation
- ✓ Null felt values
- ✓ Multiple features processing

### 2. `airplaneslive.test.ts` - Military Aircraft Tracking
Tests the Airplanes.live military aircraft API integration.

**Coverage:**
- API endpoint integration
- Country detection from ICAO hex codes (2-char and 1-char prefixes)
- Aircraft parsing and filtering (missing coords, on-ground)
- Unit conversions (feet→meters, knots→m/s, fpm→m/s)
- Field mapping and data transformation
- Military flag detection (dbFlags bit 0)

**Key Test Cases:**
- ✓ Country detection (USA, France, UK, Canada, Russia, unknown)
- ✓ Filtering out invalid aircraft (missing lat/lon, on ground)
- ✓ Unit conversions accuracy
- ✓ Callsign trimming
- ✓ Multiple aircraft processing

### 3. `gdelt-doc.test.ts` - GDELT Conflict Events
Tests the GDELT GEO 2.0 API integration for conflict tracking.

**Coverage:**
- API query construction with parameters
- HTML article extraction from feature properties
- HTML entity decoding
- URL domain extraction
- Article deduplication (Jaccard similarity > 0.5)
- GeoJSON feature mapping

**Key Test Cases:**
- ✓ Custom timespan and maxPoints parameters
- ✓ HTML entity decoding in titles
- ✓ Filtering gdeltproject.org links
- ✓ Deduplication keeps higher count articles
- ✓ Invalid URL domain handling
- ✓ Multiple features processing

### 4. `translate.test.ts` - Google Translate Integration
Tests the batch translation functionality using Google Translate API.

**Coverage:**
- Empty input handling
- HTML entity decoding before translation
- Single batch translation (< 4500 chars)
- Chunked translation (> 4500 chars)
- Separator-based text joining
- Error handling and fallback to decoded originals
- Chunk delays for rate limiting

**Key Test Cases:**
- ✓ HTML entity decoding
- ✓ Single batch with separator
- ✓ Multiple chunks with 10 text limit
- ✓ Delay between chunks (100ms)
- ✓ Error fallback to decoded texts
- ✓ Individual chunk error handling

## Running Tests

```bash
# Run all source tests
npm test -- src/lib/sources/__tests__/

# Run specific test file
npm test -- src/lib/sources/__tests__/usgs.test.ts

# Run in watch mode
npm run test:watch -- src/lib/sources/__tests__/

# Run with coverage
npm run test:coverage -- src/lib/sources/__tests__/
```

## Test Structure

All tests follow the same structure:

```typescript
describe("functionName", () => {
  beforeEach(() => {
    vi.restoreAllMocks(); // Clean up mocks before each test
  });

  describe("feature group", () => {
    it("should do something specific", async () => {
      // Arrange: Set up mock
      const mockFetch = vi.fn().mockResolvedValue({ ... });
      global.fetch = mockFetch;

      // Act: Call the function
      const result = await functionName();

      // Assert: Verify behavior
      expect(result).toEqual(...);
    });
  });
});
```

## Mock Strategy

All tests use `vi.fn()` to mock the global `fetch` function:

```typescript
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
global.fetch = mockFetch;
```

**Why not MSW?**
- These are pure functions with no DOM dependencies
- Direct fetch mocking is simpler and faster
- Tests are self-contained without external handler files
- Better for testing specific error conditions

## Test Coverage Goals

Each test file aims for:
- 100% line coverage
- 100% branch coverage
- All error paths tested
- All data transformations verified
- Edge cases covered

## Key Testing Patterns

### 1. URL Verification
```typescript
expect(mockFetch).toHaveBeenCalledWith(
  "https://api.example.com/endpoint",
  { next: { revalidate: 60 } }
);
```

### 2. Error Simulation
```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  status: 503,
});
await expect(fetchFunction()).rejects.toThrow("API error: 503");
```

### 3. Multiple Scenarios
```typescript
it("should handle valid and invalid items", async () => {
  const valid = createMockItem({ id: 1 });
  const invalid = createMockItem({ id: 2, lat: undefined });

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: [valid, invalid] }),
  });

  const result = await fetchFunction();

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(1);
});
```

## Common Issues

### Issue: Test timeout
**Solution:** Increase timeout in vitest.config.ts or use `vi.useFakeTimers()` for delay tests.

### Issue: Mock not working
**Solution:** Ensure `vi.restoreAllMocks()` is in `beforeEach()`.

### Issue: Type errors
**Solution:** Use proper TypeScript types for mock responses matching source file interfaces.

## Future Improvements

- [ ] Add integration tests with real API calls (optional, tagged)
- [ ] Add performance benchmarks for data transformations
- [ ] Add visual regression tests for error messages
- [ ] Add mutation testing to verify test quality

## Related Files

- Source files: `src/lib/sources/`
- Type definitions: `src/types/`
- Vitest config: `vitest.config.ts`
- Test setup: `src/tests/setup.ts`
