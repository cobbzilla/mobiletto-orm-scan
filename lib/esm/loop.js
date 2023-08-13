var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { logger } from "mobiletto-base";
import { sleep } from "mobiletto-orm-scan-typedef";
import { scanLog } from "./scan.js";
import { storageScan } from "./storageScan.js";
import { ormScan } from "./ormScan.js";
const shouldRun = (scan, now) => {
    return (typeof scan.scan === "object" &&
        typeof scan.scan.scheduled === "number" &&
        !scan.scan.started &&
        !scan.scan.promise &&
        !scan.scan.finished &&
        !scan.scan.error &&
        now - scan.scan.scheduled >= 0);
};
const nextScan = (scanner) => {
    const now = scanner.now();
    const sorted = scanner.scans
        .filter((s) => shouldRun(s, now))
        .sort((s1, s2) => { var _a, _b; return (((_a = s2.scan) === null || _a === void 0 ? void 0 : _a.scheduled) || 0) - (((_b = s1.scan) === null || _b === void 0 ? void 0 : _b.scheduled) || 0); });
    return sorted.length > 0 ? sorted[0] : null;
};
export const finalizeScan = (scanner, scan, data) => {
    data.finished = scanner.now();
    if (!scan.history) {
        scan.history = [];
    }
    scan.history.push(data);
    if (!scan.interval) {
        scanner.scans.splice(scanner.scans.findIndex((s) => s.name === scan.name), 1);
    }
    else {
        const nextScan = {
            scheduled: data.scheduled,
        };
        // todo: check history, if N consecutive failures then backoff more
        while (nextScan.scheduled && nextScan.scheduled < scanner.now()) {
            nextScan.scheduled += scan.interval;
        }
        scan.scan = nextScan;
    }
};
export const scanLoop = (scanner) => () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        while (!scanner.stopping) {
            const scan = nextScan(scanner);
            if (!scan || !scan.scan) {
                yield sleep(scanner.scanCheckInterval);
                continue;
            }
            const data = scan.scan;
            if (data.started || data.promise) {
                yield sleep(scanner.scanCheckInterval);
                continue;
            }
            data.started = scanner.now();
            data.promise = new Promise((resolve, reject) => {
                if (scan.source) {
                    storageScan(scanner, scan)
                        .then(() => {
                        scanLog(scan, "storageScan completed successfully");
                        resolve();
                    })
                        .catch((e) => {
                        data.error = `storageScan error ${e}: ${JSON.stringify(e)}`;
                        scanLog(scan, data.error);
                        reject(e);
                    })
                        .finally(() => {
                        finalizeScan(scanner, scan, data);
                    });
                }
                else if (scan.repository) {
                    ormScan(scanner, scan)
                        .then(() => {
                        scanLog(scan, "ormScan completed successfully");
                        resolve();
                    })
                        .catch((e) => {
                        data.error = `ormScan error ${e}: ${JSON.stringify(e)}`;
                        scanLog(scan, data.error);
                        reject(e);
                    })
                        .finally(() => {
                        finalizeScan(scanner, scan, data);
                    });
                }
            });
        }
    }
    catch (e) {
        logger.error(`scanner[${scanner.name}]:scanLoop: (error, stopping): ${e} ${JSON.stringify(e)}`);
    }
    finally {
        scanner.timeout = null;
        scanner.stopping = true;
    }
});
