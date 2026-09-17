import { describe, expect, it } from "vitest";
import { isPublicIp, normalizeInputUrl, sameSiteHost } from "@/lib/scanner/network";

describe("scanner network guard", () => {
  it("normalizes a bare hostname to HTTPS", () => {
    expect(normalizeInputUrl("example.com/path").toString()).toBe("https://example.com/path");
  });

  it("rejects localhost and private addresses", () => {
    expect(() => normalizeInputUrl("http://localhost:3000")).toThrow();
    expect(() => normalizeInputUrl("http://127.0.0.1")).toThrow();
    expect(() => normalizeInputUrl("http://192.168.1.5")).toThrow();
    expect(() => normalizeInputUrl("http://10.1.2.3")).toThrow();
    expect(() => normalizeInputUrl("http://[::1]")).toThrow();
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeInputUrl("file:///etc/passwd")).toThrow();
    expect(() => normalizeInputUrl("ftp://example.com")).toThrow();
  });

  it("classifies representative public and non-public addresses", () => {
    expect(isPublicIp("8.8.8.8")).toBe(true);
    expect(isPublicIp("1.1.1.1")).toBe(true);
    expect(isPublicIp("100.64.0.1")).toBe(false);
    expect(isPublicIp("169.254.169.254")).toBe(false);
    expect(isPublicIp("198.51.100.2")).toBe(false);
    expect(isPublicIp("2001:db8::1")).toBe(false);
  });

  it("treats www and apex as the same site host", () => {
    expect(sameSiteHost("www.example.com", "example.com")).toBe(true);
    expect(sameSiteHost("example.com", "evil-example.com")).toBe(false);
  });
});
