import { MobilettoOrmTypeDef, } from "mobiletto-orm";
export const MobilettoScanLockTypeDefConfig = {
    typeName: "scanLock",
    fields: {
        lock: { primary: true, type: "string" },
        owner: { index: true, type: "string" },
    },
};
export const MobilettoScanLockTypeDef = new MobilettoOrmTypeDef(MobilettoScanLockTypeDefConfig);
export const MobilettoScanObjectTypeDefConfig = {
    fields: {
        status: { index: true, values: ["pending", "started", "finished"], default: "pending" },
        owner: { required: false, type: "string", control: "label" },
        started: { required: false, type: "number", render: "datetime", control: "label" },
        finished: { required: false, type: "number", render: "datetime", control: "label" },
        errorCount: { required: false, type: "number", control: "label" },
    },
};
