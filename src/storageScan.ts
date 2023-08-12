import { MobilettoMetadata, MobilettoVisitor, rand } from "mobiletto-base";
import { MobilettoOrmRepository } from "mobiletto-orm";
import { MobilettoScanLock, MobilettoStorageScan } from "./types.js";
import { MobilettoScanner } from "./scanner.js";
import { countScanOp, countScanError } from "./scan.js";

const acquireLock = async (
    scanner: MobilettoScanner,
    scan: MobilettoStorageScan,
): Promise<MobilettoScanLock | null> => {
    const lockRepo: MobilettoOrmRepository<MobilettoScanLock> = scan.lockRepository();
    const lock: MobilettoScanLock = {
        lock: scan.source.info().canonicalName(),
        owner: `${scanner.name}_${rand(16)}`,
    };
    const existing = await lockRepo.safeFindById(lock.lock);
    if (existing != null) {
        return null;
    } else {
        const created = await lockRepo.create(lock);
        const confirmed = await lockRepo.safeFindById(lock.lock);
        if (!confirmed || created.owner !== confirmed.owner) {
            return null;
        }
        return confirmed;
    }
};

const releaseLock = async (scan: MobilettoStorageScan, lock: MobilettoScanLock) => {
    const lockRepo: MobilettoOrmRepository<MobilettoScanLock> = scan.lockRepository();
    const existing = await lockRepo.safeFindById(lock.lock);
    if (!existing) {
        throw new Error(`releaseLock: lock disappeared: ${lock.lock}`);
    }
    await lockRepo.remove(lock);
};

const fileExt = (path: string) => {
    if (!path) return "";
    const lastDot = path.lastIndexOf(".");
    return lastDot === -1 || lastDot === path.length - 1 ? "" : path.substring(lastDot + 1);
};

export const storageScan = async (scanner: MobilettoScanner, scan: MobilettoStorageScan) => {
    if (scanner.stopping) return scan;
    let lock: MobilettoScanLock | null = null;
    try {
        lock = await acquireLock(scanner, scan);
        if (!lock) {
            return;
        }
        const visitor: MobilettoVisitor = async (meta: MobilettoMetadata) => {
            if (scanner.stopping) {
                throw new Error(`${scan.name}: scanner stopping: aborting visit to ${meta.name}`);
            }
            if (!scan.ext || scan.ext.includes(fileExt(meta.name))) {
                try {
                    await scan.visit(meta);
                    if (!scanner.stopping) {
                        countScanOp(scan);
                    }
                } catch (e) {
                    if (!scanner.stopping) {
                        countScanError(scan, `visitor(${meta.name}): error ${e}`);
                    }
                }
            }
        };
        const recursive = scan.recursive !== false;
        await scan.source.list("", { recursive, visitor });
        return true;
    } finally {
        if (lock) await releaseLock(scan, lock);
    }
};
