import { logger } from "mobiletto-base";
import {
    MobilettoOrmScan,
    MobilettoScan,
    MobilettoScanData,
    MobilettoScanObject,
    MobilettoStorageScan,
} from "./types.js";
import { scanLog } from "./scan.js";
import { sleep } from "./constants.js";
import { storageScan } from "./storageScan.js";
import { ormScan } from "./ormScan.js";
import { MobilettoScanner } from "./scanner.js";

const shouldRun = (scan: MobilettoScan, now: number) => {
    return (
        typeof scan.scan === "object" &&
        typeof scan.scan.scheduled === "number" &&
        !scan.scan.started &&
        !scan.scan.promise &&
        !scan.scan.finished &&
        !scan.scan.error &&
        now - scan.scan.scheduled >= 0
    );
};

const nextScan = (scanner: MobilettoScanner) => {
    const now = scanner.now();
    const sorted = scanner.scans
        .filter((s) => shouldRun(s, now))
        .sort((s1, s2) => (s2.scan?.scheduled || 0) - (s1.scan?.scheduled || 0));
    return sorted.length > 0 ? sorted[0] : null;
};

export const finalizeScan = (scanner: MobilettoScanner, scan: MobilettoScan, data: MobilettoScanData) => {
    data.finished = scanner.now();
    if (!scan.history) {
        scan.history = [];
    }
    scan.history.push(data);
    if (!scan.interval) {
        scanner.scans.splice(
            scanner.scans.findIndex((s) => s.name === scan.name),
            1,
        );
    } else {
        const nextScan: MobilettoScanData = {
            scheduled: data.scheduled,
        };
        // todo: check history, if N consecutive failures then backoff more
        while (nextScan.scheduled && nextScan.scheduled < scanner.now()) {
            nextScan.scheduled += scan.interval;
        }
        scan.scan = nextScan;
    }
};

export const scanLoop = (scanner: MobilettoScanner) => async () => {
    try {
        while (!scanner.stopping) {
            const scan = nextScan(scanner);
            if (!scan || !scan.scan) {
                await sleep(scanner.scanCheckInterval);
                continue;
            }
            const data = scan.scan;
            if (data.started || data.promise) {
                await sleep(scanner.scanCheckInterval);
                continue;
            }
            data.started = scanner.now();
            data.promise = new Promise<void>((resolve, reject) => {
                if ((scan as MobilettoStorageScan).source) {
                    storageScan(scanner, scan as MobilettoStorageScan)
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
                } else if ((scan as MobilettoOrmScan<MobilettoScanObject>).repository) {
                    ormScan(scanner, scan as MobilettoOrmScan<MobilettoScanObject>)
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
    } catch (e) {
        logger.error(`scanner[${scanner.name}]:scanLoop: (error, stopping): ${e} ${JSON.stringify(e)}`);
    } finally {
        scanner.timeout = null;
        scanner.stopping = true;
    }
};
