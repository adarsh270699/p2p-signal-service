import Ajv, { JSONSchemaType } from "ajv";
import { Transaction } from "./types";

const ajv = new Ajv();

const transactionSchema: any = {
    type: "object",
    properties: {
        event: { type: "string" },
        from: { type: "string" },
        to: { type: "string" },
        payload: {
            type: ["object", "null"],
            additionalProperties: true,
        },
    },
    required: ["event", "from", "to"],
    additionalProperties: true,
};

export const validateTransaction = ajv.compile(transactionSchema);
