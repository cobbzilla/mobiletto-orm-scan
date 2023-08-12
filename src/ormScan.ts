import { MobilettoOrmRepository } from "mobiletto-orm";
import { logger, rand } from "mobiletto-base";
import { MobilettoOrmScan, MobilettoScanObject } from "./types.js";
import { MobilettoScanner } from "./scanner.js";
import { sleep } from "./constants.js";
import { countScanOp, countScanError } from "./scan.js";

export const DEFAULT_ORM_SCAN_TIMEOUT = 60 * 1000;
export const DEFAULT_ORM_SCAN_POLL_INTERVAL = 10 * 1000;
export const DEFAULT_ORM_SCAN_MAX_ERRORS = 3;

const nextOrmObject = <T extends MobilettoScanObject>(
    repo: MobilettoOrmRepository<T>,
    scan: MobilettoOrmScan<T>,
): Promise<T | null> => {
    const maxErrors = scan.maxErrors ? scan.maxErrors : DEFAULT_ORM_SCAN_MAX_ERRORS;
    return repo.safeFindFirstBy("status", "pending", {
        predicate: (s) => typeof s.errorCount === "undefined" || s.errorCount == null || s.errorCount < maxErrors,
    });
};

const objDesc = <T extends MobilettoScanObject>(repo: MobilettoOrmRepository<T>, obj: T) =>
    `${repo.typeDef.typeName}:${repo.typeDef.id(obj)}`;

export const ormScan = async <T extends MobilettoScanObject>(scanner: MobilettoScanner, scan: MobilettoOrmScan<T>) => {
    if (scanner.stopping) {
        logger.info(`ormScan scanner=${scanner.name} scanner.stopping=${scanner.stopping} returning`);
        return;
    }
    const repo: MobilettoOrmRepository<T> = scan.repository();
    const scanTimeout = scan.timeout ? scan.timeout : DEFAULT_ORM_SCAN_TIMEOUT;
    const pollInterval = scan.pollInterval ? scan.pollInterval : DEFAULT_ORM_SCAN_POLL_INTERVAL;
    let timeoutStart = scanner.now();
    let rollback: T | null = null;
    let updated: T | null = null;
    while (scanner.now() - timeoutStart < scanTimeout) {
        if (scanner.stopping) break;
        const obj: T | null = await nextOrmObject(repo, scan);
        // console.log(`ormScan: nextOrmObject returned: ${obj ? objDesc(repo, obj) : "null"}`);
        if (scanner.stopping) break;
        if (!obj) {
            await sleep(pollInterval);
            continue;
        }
        obj.status = "started";
        obj.started = scanner.now();
        obj.owner = `${scanner.name}_${rand(16)}`;
        try {
            rollback = obj;
            updated = await repo.update(obj);
            if (updated.owner !== obj.owner) {
                if (scanner.stopping) break;
                countScanError(scan, `error locking ${objDesc(repo, obj)}: found other owner: ${updated.owner}`);
                continue;
            }

            try {
                await scan.visit(updated);
                if (scanner.stopping) break;
                countScanOp(scan);
                updated.errorCount = 0;
                rollback = null;
            } catch (e2) {
                if (scanner.stopping) break;
                if (updated.errorCount) {
                    updated.errorCount++;
                } else {
                    updated.errorCount = 1;
                }
                countScanError(
                    scan,
                    `error (errorCount=${updated.errorCount}) while visiting ${objDesc(repo, updated)}}: ${e2}`,
                );
            } finally {
                if (!scanner.stopping && rollback == null) {
                    updated.status = "finished";
                    updated.finished = timeoutStart = scanner.now();
                    try {
                        await repo.update(updated);
                    } catch (e3) {
                        countScanError(scan, `error updating finished ${objDesc(repo, updated)}: ${e3}`);
                    }
                }
            }
        } catch (e) {
            if (!scanner.stopping) {
                countScanError(scan, `error locking ${objDesc(repo, obj)}: ${e}`);
            }
        } finally {
            if (updated && rollback) {
                try {
                    updated.status = "pending";
                    updated.owner = "";
                    updated.started = undefined;
                    updated.finished = undefined;
                    await repo.update(updated);
                    logger.info(`ormScan rollback_success obj=${objDesc(repo, obj)}`);
                } catch (e) {
                    logger.error(
                        `ormScan scanner=${scanner.name} rollback_error obj=${objDesc(repo, obj)} error='${e}'`,
                    );
                }
            } else {
                logger.info(`ormScan finished obj=${objDesc(repo, obj)}`);
            }
        }
    }
    logger.info(`ormScan scanner=${scanner.name} timeout=${scanTimeout} exceeded returning`);
};
