// Single source of truth for the deposit (예약금) split.
// 예약금 30% / 잔금 70%. Used by quote creation, quote display, the customer
// payment page, PayApp charge amounts, contracts, and receipts so the split is
// consistent everywhere.
export const DEFAULT_DEPOSIT_RATE = 30;

/**
 * Policy: the deposit is uniformly 30%. Legacy quotes stored 10% (or null)
 * must be treated as 30% everywhere (display + charge). A non-legacy custom
 * rate (e.g. a negotiated 50%) is preserved.
 */
export function effectiveDepositRate(
  storedRate: number | null | undefined,
): number {
  if (storedRate == null || storedRate <= 0 || storedRate === 10) {
    return DEFAULT_DEPOSIT_RATE;
  }
  return storedRate;
}

export type DepositSplit = {
  rate: number;
  deposit: number;
  balance: number;
};

/** Compute the 예약금/잔금 split from a total + (possibly legacy) stored rate. */
export function depositSplit(
  total: number,
  storedRate?: number | null,
): DepositSplit {
  const rate = effectiveDepositRate(storedRate);
  const deposit = Math.round((total * rate) / 100);
  return { rate, deposit, balance: total - deposit };
}
