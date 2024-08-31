import { MobilettoOrmObject, MobilettoOrmRepository } from "mobiletto-orm";
import { MobilettoConnection, MobilettoMetadata } from "mobiletto-base";
import { MobilettoScan, MobilettoScanStatus } from "mobiletto-orm-scan-typedef";

export type MobilettoScanLock = MobilettoOrmObject & {
    lock: string;
    owner: string;
};

export type MobilettoStorageScan<CALLER extends MobilettoOrmObject> = MobilettoScan<CALLER> & {
    source: MobilettoConnection;
    lockRepository: () => MobilettoOrmRepository<MobilettoScanLock, CALLER>;
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

export type MobilettoOrmScan<
    T extends MobilettoScanObject,
    CALLER extends MobilettoOrmObject,
> = MobilettoScan<CALLER> & {
    repository: () => MobilettoOrmRepository<T, CALLER>;
    timeout?: number;
    pollInterval?: number;
    maxErrors?: number;
    visit: (obj: T) => Promise<unknown>;
};
