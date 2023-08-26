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
import { sleep } from "zilla-util";
import { scanLog } from "./scan.js";
import { storageScan } from "./storageScan.js";
import { ormScan } from "./ormScan.js";
const shouldRun = (scan, now) => {
    return (typeof scan.data === "object" &&
        typeof scan.data.scheduled === "number" &&
        !scan.data.started &&
        !scan.data.promise &&
        !scan.data.finished &&
        !scan.data.error &&
        now - scan.data.scheduled >= 0);
};
const nextScan = (scanner) => {
    const now = scanner.now();
    const sorted = scanner.scans
        .filter((s) => shouldRun(s, now))
        .sort((s1, s2) => { var _a, _b; return (((_a = s2.data) === null || _a === void 0 ? void 0 : _a.scheduled) || 0) - (((_b = s1.data) === null || _b === void 0 ? void 0 : _b.scheduled) || 0); });
    return sorted.length > 0 ? sorted[0] : null;
};
export const finalizeScan = (scanner, scan, data) => {
    data.finished = scanner.now();
    if (scan.done) {
        try {
            scan.done();
        }
        catch (e) {
            scanLog(scan, `finalizeScan: error in scan.done callback: ${e}`);
        }
    }
    scanner.scans.splice(scanner.scans.findIndex((s) => s.name === scan.name), 1);
};
export const scanLoop = (scanner) => () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        while (!scanner.stopping) {
            const scan = nextScan(scanner);
            if (!scan || !scan.data) {
                yield sleep(scanner.scanCheckInterval);
                continue;
            }
            const data = scan.data;
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
                        if (scan.success) {
                            try {
                                scan.success();
                            }
                            catch (e) {
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
                            }
                            catch (e2) {
                                scanLog(scan, `storageScan error in scan.error callback: ${e2}`);
                            }
                        }
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
                        if (scan.success) {
                            try {
                                scan.success();
                            }
                            catch (e) {
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
                            }
                            catch (e2) {
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
    }
    catch (e) {
        logger.error(`scanner[${scanner.name}]:scanLoop: (error, stopping): ${e} ${JSON.stringify(e)}`);
    }
    finally {
        scanner.timeout = null;
        scanner.stopping = true;
    }
});
