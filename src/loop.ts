import { logger } from "mobiletto-base";
import { sleep } from "zilla-util";
import { MobilettoOrmObject } from "mobiletto-orm-typedef";
import { MobilettoScan, MobilettoScanData } from "mobiletto-orm-scan-typedef";
import { MobilettoOrmScan, MobilettoScanObject, MobilettoStorageScan } from "./types.js";
import { scanLog } from "./scan.js";
import { storageScan } from "./storageScan.js";
import { ormScan } from "./ormScan.js";
import { MobilettoScanner } from "./scanner.js";

const shouldRun = <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>, now: number) => {
    return (
        typeof scan.data === "object" &&
        typeof scan.data.scheduled === "number" &&
        !scan.data.started &&
        !scan.data.promise &&
        !scan.data.finished &&
        !scan.data.error &&
        now - scan.data.scheduled >= 0
    );
};

const nextScan = <CALLER extends MobilettoOrmObject>(scanner: MobilettoScanner<CALLER>) => {
    const now = scanner.now();
    const sorted = scanner.scans
        .filter((s) => shouldRun(s, now))
        .sort((s1, s2) => (s2.data?.scheduled || 0) - (s1.data?.scheduled || 0));
    return sorted.length > 0 ? sorted[0] : null;
};

export const finalizeScan = <CALLER extends MobilettoOrmObject>(
    scanner: MobilettoScanner<CALLER>,
    scan: MobilettoScan<CALLER>,
    data: MobilettoScanData,
) => {
    data.finished = scanner.now();
    if (scan.done) {
        try {
            scan.done();
        } catch (e) {
            scanLog(scan, `finalizeScan: error in scan.done callback: ${e}`);
        }
    }
    scanner.scans.splice(
        scanner.scans.findIndex((s) => s.name === scan.name),
        1,
    );
};

export const scanLoop =
    <CALLER extends MobilettoOrmObject>(scanner: MobilettoScanner<CALLER>) =>
    async () => {
        try {
            while (!scanner.stopping) {
                const scan = nextScan(scanner);
                if (!scan || !scan.data) {
                    await sleep(scanner.scanCheckInterval);
                    continue;
                }
                const data = scan.data;
                if (data.started || data.promise) {
                    await sleep(scanner.scanCheckInterval);
                    continue;
                }
                data.started = scanner.now();
                data.promise = new Promise<void>((resolve, reject) => {
                    if ((scan as MobilettoStorageScan<CALLER>).source) {
                        storageScan(scanner, scan as MobilettoStorageScan<CALLER>)
                            .then(() => {
                                scanLog(scan, "storageScan completed successfully");
                                if (scan.success) {
                                    try {
                                        scan.success();
                                    } catch (e) {
                                        scanLog(scan, `storageScan error in scan.success callback: ${e}`);
                                    }
                                }
                                resolve();
                            })
                            .catch((e) => {
                                data.error = `storageScan error ${e}: ${JSON.stringify(e)}`;
                                scanLog(scan, data.error);
                                if (scan.error) {
                                    try {
                                        scan.error(e);
                                    } catch (e2) {
                                        scanLog(scan, `storageScan error in scan.error callback: ${e2}`);
                                    }
                                }
                                reject(e);
                            })
                            .finally(() => {
                                finalizeScan(scanner, scan, data);
                            });
                    } else if ((scan as MobilettoOrmScan<MobilettoScanObject, CALLER>).repository) {
                        ormScan(scanner, scan as MobilettoOrmScan<MobilettoScanObject, CALLER>)
                            .then(() => {
                                scanLog(scan, "ormScan completed successfully");
                                if (scan.success) {
                                    try {
                                        scan.success();
                                    } catch (e) {
                                        scanLog(scan, `ormScan error in scan.success callback: ${e}`);
                                    }
                                }
                                resolve();
                            })
                            .catch((e) => {
                                data.error = `ormScan error ${e}: ${JSON.stringify(e)}`;
                                scanLog(scan, data.error);
                                if (scan.error) {
                                    try {
                                        scan.error(e);
                                    } catch (e2) {
                                        scanLog(scan, `ormScan error in scan.error callback: ${e2}`);
                                    }
                                }
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
