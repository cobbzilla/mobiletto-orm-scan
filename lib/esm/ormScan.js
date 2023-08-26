var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { sleep } from "zilla-util";
import { logger, rand } from "mobiletto-base";
import { countScanOp, countScanError } from "./scan.js";
export const DEFAULT_ORM_SCAN_TIMEOUT = 60 * 1000;
export const DEFAULT_ORM_SCAN_POLL_INTERVAL = 10 * 1000;
export const DEFAULT_ORM_SCAN_MAX_ERRORS = 3;
const nextOrmObject = (repo, scan) => {
    const maxErrors = scan.maxErrors ? scan.maxErrors : DEFAULT_ORM_SCAN_MAX_ERRORS;
    return repo.safeFindFirstBy("status", "pending", {
        predicate: (s) => typeof s.errorCount === "undefined" || s.errorCount == null || s.errorCount < maxErrors,
    });
};
const objDesc = (repo, obj) => `${repo.typeDef.typeName}:${repo.typeDef.id(obj)}`;
export const ormScan = (scanner, scan) => __awaiter(void 0, void 0, void 0, function* () {
    if (scanner.stopping) {
        logger.info(`ormScan scanner=${scanner.name} scanner.stopping=${scanner.stopping} returning`);
        return;
    }
    const repo = scan.repository();
    const scanTimeout = scan.timeout ? scan.timeout : DEFAULT_ORM_SCAN_TIMEOUT;
    const pollInterval = scan.pollInterval ? scan.pollInterval : DEFAULT_ORM_SCAN_POLL_INTERVAL;
    let timeoutStart = scanner.now();
    let rollback = null;
    let updated = null;
    while (scanner.now() - timeoutStart < scanTimeout) {
        if (scanner.stopping)
            break;
        const obj = yield nextOrmObject(repo, scan);
        // console.log(`ormScan: nextOrmObject returned: ${obj ? objDesc(repo, obj) : "null"}`);
        if (scanner.stopping)
            break;
        if (!obj) {
            yield sleep(pollInterval);
            continue;
        }
        obj.status = "started";
        obj.started = scanner.now();
        obj.owner = `${scanner.name}_${rand(16)}`;
        try {
            rollback = obj;
            updated = yield repo.update(obj);
            if (updated.owner !== obj.owner) {
                if (scanner.stopping)
                    break;
                countScanError(scan, `error locking ${objDesc(repo, obj)}: found other owner: ${updated.owner}`);
                continue;
            }
            try {
                yield scan.visit(updated);
                if (scanner.stopping)
                    break;
                countScanOp(scan);
                updated.errorCount = 0;
                rollback = null;
            }
            catch (e2) {
                if (scanner.stopping)
                    break;
                if (updated.errorCount) {
                    updated.errorCount++;
                }
                else {
                    updated.errorCount = 1;
                }
                countScanError(scan, `error (errorCount=${updated.errorCount}) while visiting ${objDesc(repo, updated)}}: ${e2}`);
            }
            finally {
                if (!scanner.stopping && rollback == null) {
                    updated.status = "finished";
                    updated.finished = timeoutStart = scanner.now();
                    try {
                        yield repo.update(updated);
                    }
                    catch (e3) {
                        countScanError(scan, `error updating finished ${objDesc(repo, updated)}: ${e3}`);
                    }
                }
            }
        }
        catch (e) {
            if (!scanner.stopping) {
                countScanError(scan, `error locking ${objDesc(repo, obj)}: ${e}`);
            }
        }
        finally {
            if (updated && rollback) {
                try {
                    updated.status = "pending";
                    updated.owner = "";
                    updated.started = undefined;
                    updated.finished = undefined;
                    yield repo.update(updated);
                    logger.info(`ormScan rollback_success obj=${objDesc(repo, obj)}`);
                }
                catch (e) {
                    logger.error(`ormScan scanner=${scanner.name} rollback_error obj=${objDesc(repo, obj)} error='${e}'`);
                }
            }
            else {
                logger.info(`ormScan finished obj=${objDesc(repo, obj)}`);
            }
        }
    }
    logger.info(`ormScan scanner=${scanner.name} timeout=${scanTimeout} exceeded returning`);
});
