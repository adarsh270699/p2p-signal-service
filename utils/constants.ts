export const TRANSACTION_EVENTS = [
    "init-transfer-sender",
    "init-transfer-receiver",
    "offer",
    "answer",
    "add-ice-candidates",
] as const;

export type TransactionEvent = (typeof TRANSACTION_EVENTS)[number];
