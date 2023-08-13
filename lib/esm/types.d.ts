import { MobilettoOrmObject, MobilettoOrmRepository } from "mobiletto-orm";
import { MobilettoConnection, MobilettoMetadata } from "mobiletto-base";
import { MobilettoScan, MobilettoScanStatus } from "mobiletto-orm-scan-typedef";
export type MobilettoScanLock = MobilettoOrmObject & {
    lock: string;
    owner: string;
};
export type MobilettoStorageScan = MobilettoScan & {
    source: MobilettoConnection;
    lockRepository: () => MobilettoOrmRepository<MobilettoScanLock>;
    visit: (meta: MobilettoMetadata) => Promise<unknown>;
    recursive?: boolean;
    ext?: string[];
};
export type MobilettoScanObject = MobilettoOrmObject & {
    status: MobilettoScanStatus;
    owner?: string;
    started?: number;
    finished?: number;
    errorCount?: number;
};
export type MobilettoOrmScan<T extends MobilettoScanObject> = MobilettoScan & {
    repository: () => MobilettoOrmRepository<T>;
    timeout?: number;
    pollInterval?: number;
    maxErrors?: number;
    visit: (obj: T) => Promise<unknown>;
};
