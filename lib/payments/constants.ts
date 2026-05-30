// Single source of truth for the deposit (예약금) split.
// 예약금 30% / 잔금 70%. Used by quote creation, quote display, the customer
// payment page, PayApp charge amounts, contracts, and receipts so the split is
// consistent everywhere. Existing quotes keep their stored deposit_rate.
export const DEFAULT_DEPOSIT_RATE = 30;
