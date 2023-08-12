import {
    MobilettoOrmObject,
    MobilettoOrmRepository,
    MobilettoOrmTypeDef,
    MobilettoOrmTypeDefConfig,
} from "mobiletto-orm";
import { MobilettoConnection, MobilettoMetadata } from "mobiletto-base";

export type MobilettoScanLock = MobilettoOrmObject & {
    lock: string;
    owner: string;
};

export const MobilettoScanLockTypeDefConfig: MobilettoOrmTypeDefConfig = {
    typeName: "scanLock",
    fields: {
        lock: { primary: true, type: "string" },
        owner: { index: true, type: "string" },
    },
};
export const MobilettoScanLockTypeDef = new MobilettoOrmTypeDef(MobilettoScanLockTypeDefConfig);

export type MobilettoScanData = {
    scheduled?: number;
    started?: number;
    promise?: Promise<void>;
    finished?: number;
    opCount?: number;
    errCount?: number;
    log?: string[];
    error?: Error | string | object;
};

export type MobilettoScan = {
    name: string;
    interval?: number;
    delay?: number;
    scan?: MobilettoScanData;
    history?: MobilettoScanData[];
};

export type MobilettoStorageScan = MobilettoScan & {
    source: MobilettoConnection;
    lockRepository: () => MobilettoOrmRepository<MobilettoScanLock>;
    visit: (meta: MobilettoMetadata) => Promise<unknown>;
    recursive?: boolean;
    ext?: string[];
};

export type MobilettoScanStatus = "pending" | "started" | "finished";

export type MobilettoScanObject = MobilettoOrmObject & {
    status: MobilettoScanStatus;
    owner?: string;
    started?: number;
    finished?: number;
    errorCount?: number;
};

export const MobilettoScanObjectTypeDefConfig: MobilettoOrmTypeDefConfig = {
    fields: {
        status: { index: true, values: ["pending", "started", "finished"], default: "pending" },
        owner: { required: false, type: "string", control: "label" },
        started: { required: false, type: "number", render: "datetime", control: "label" },
        finished: { required: false, type: "number", render: "datetime", control: "label" },
        errorCount: { required: false, type: "number", control: "label" },
    },
};

export type MobilettoOrmScan<T extends MobilettoScanObject> = MobilettoScan & {
    repository: () => MobilettoOrmRepository<T>;
    timeout?: number;
    pollInterval?: number;
    maxErrors?: number;
    visit: (obj: T) => Promise<unknown>;
};

export type MobilettoClock = {
    now: () => number;
};
