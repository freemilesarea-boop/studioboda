export function maskPII(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/\b\d{3}-\d{3,4}-\d{4}\b/g, "[전화번호]")
    .replace(/\b\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g, "[전화번호]")
    .replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      "[이메일]",
    )
    .replace(/\b\d{6}-\d{7}\b/g, "[주민번호]")
    .replace(/\b\d{3}-\d{2}-\d{5}\b/g, "[사업자등록번호]")
    .replace(/카드[ ]?번호[: ]+[\d -]{12,19}/gi, "[카드번호]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[카드번호]");
}

export function maskPIIArray(input: (string | null | undefined)[]): string[] {
  return input.filter((s): s is string => typeof s === "string").map(maskPII);
}
