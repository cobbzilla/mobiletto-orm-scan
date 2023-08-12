import { MobilettoOrmObject, MobilettoOrmRepository, MobilettoOrmTypeDef, MobilettoOrmTypeDefConfig } from "mobiletto-orm";
import { MobilettoConnection, MobilettoMetadata } from "mobiletto-base";
export type MobilettoScanLock = MobilettoOrmObject & {
    lock: string;
    owner: string;
};
export declare const MobilettoScanLockTypeDefConfig: MobilettoOrmTypeDefConfig;
export declare const MobilettoScanLockTypeDef: MobilettoOrmTypeDef;
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
export declare const MobilettoScanObjectTypeDefConfig: MobilettoOrmTypeDefConfig;
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
