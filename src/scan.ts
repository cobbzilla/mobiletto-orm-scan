import { MobilettoScan } from "./types.js";

export const scanLog = (scan: MobilettoScan, message: string) => {
    if (scan.scan) {
        if (!scan.scan.log) {
            scan.scan.log = [];
        }
        scan.scan.log.push(message);
    } else {
        throw new Error(`log: scan ${scan.name} not running (?) cannot log: ${message}`);
    }
};

export const countScanOp = (scan: MobilettoScan) => {
    if (scan.scan) {
        if (scan.scan.opCount) {
            scan.scan.opCount++;
        } else {
            scan.scan.opCount = 1;
        }
    }
};

export const countScanError = (scan: MobilettoScan, message: string) => {
    if (scan.scan) {
        if (scan.scan.errCount) {
            scan.scan.errCount++;
        } else {
            scan.scan.errCount = 1;
        }
        scanLog(scan, message);
    }
};
