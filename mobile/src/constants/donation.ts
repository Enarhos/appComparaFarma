export const DONATION_CONFIG = {
  threshold: 1000,
  amounts: [1000, 3000, 5000] as const,
  urls: {
    1000: "https://khipu.com/payment/process/5Jxso",
    3000: "https://khipu.com/payment/process/rkHAZ",
    5000: "https://khipu.com/payment/process/qzd92",
  } as Record<number, string>,
  otherAmountUrl: "https://khipu.com/payment/process/dAwLD",
};
