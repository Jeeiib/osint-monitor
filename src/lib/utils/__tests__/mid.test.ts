import { getCountryFromMMSI, getVesselFinderUrl } from "../mid";

describe("getCountryFromMMSI", () => {
  it("decodes Germany from MID 211", () => {
    const result = getCountryFromMMSI(211000000);
    expect(result).toEqual({
      country: "Germany",
      code: "DE",
      flag: "\u{1F1E9}\u{1F1EA}",
    });
  });

  it("decodes France from MID 226", () => {
    const result = getCountryFromMMSI(226123456);
    expect(result).toEqual({
      country: "France",
      code: "FR",
      flag: "\u{1F1EB}\u{1F1F7}",
    });
  });

  it("decodes USA from MID 338", () => {
    const result = getCountryFromMMSI(338999999);
    expect(result).toEqual({
      country: "USA",
      code: "US",
      flag: "\u{1F1FA}\u{1F1F8}",
    });
  });

  it("decodes USA from MID 366-369", () => {
    expect(getCountryFromMMSI(366000000)?.code).toBe("US");
    expect(getCountryFromMMSI(367000000)?.code).toBe("US");
    expect(getCountryFromMMSI(368000000)?.code).toBe("US");
    expect(getCountryFromMMSI(369000000)?.code).toBe("US");
  });

  it("decodes UK from MID 232-235", () => {
    expect(getCountryFromMMSI(232000000)?.code).toBe("GB");
    expect(getCountryFromMMSI(235000000)?.code).toBe("GB");
  });

  it("decodes China from MID 412-414", () => {
    expect(getCountryFromMMSI(412000000)?.code).toBe("CN");
    expect(getCountryFromMMSI(414000000)?.code).toBe("CN");
  });

  it("decodes Panama from MID 351-357", () => {
    expect(getCountryFromMMSI(351000000)?.code).toBe("PA");
    expect(getCountryFromMMSI(357000000)?.code).toBe("PA");
  });

  it("decodes Liberia from MID 636-637", () => {
    expect(getCountryFromMMSI(636000000)?.code).toBe("LR");
    expect(getCountryFromMMSI(637000000)?.code).toBe("LR");
  });

  it("decodes Marshall Islands from MID 538", () => {
    expect(getCountryFromMMSI(538000000)?.code).toBe("MH");
  });

  it("returns null for unknown MID", () => {
    expect(getCountryFromMMSI(999000000)).toBeNull();
  });

  it("returns null for invalid MMSI (too short)", () => {
    expect(getCountryFromMMSI(12345)).toBeNull();
  });

  it("handles edge case: MID 0 (invalid)", () => {
    expect(getCountryFromMMSI(0)).toBeNull();
  });
});

describe("getVesselFinderUrl", () => {
  it("builds correct URL from MMSI", () => {
    expect(getVesselFinderUrl(211000000)).toBe(
      "https://www.vesselfinder.com/vessels/details/211000000"
    );
  });

  it("handles various MMSI numbers", () => {
    expect(getVesselFinderUrl(338999999)).toBe(
      "https://www.vesselfinder.com/vessels/details/338999999"
    );
  });
});
