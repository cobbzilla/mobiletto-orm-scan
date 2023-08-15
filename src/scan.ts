import { MobilettoScan } from "mobiletto-orm-scan-typedef";

export const scanLog = (scan: MobilettoScan, message: string) => {
    if (scan.data) {
        if (!scan.data.log) {
            scan.data.log = [];
        }
        scan.data.log.push(message);
    } else {
        throw new Error(`log: scan ${scan.name} not running (?) cannot log: ${message}`);
    }
};

export const countScanOp = (scan: MobilettoScan) => {
    if (scan.data) {
        if (scan.data.opCount) {
            scan.data.opCount++;
        } else {
            scan.data.opCount = 1;
        }
    }
};

export const countScanError = (scan: MobilettoScan, message: string) => {
    if (scan.data) {
        if (scan.data.errCount) {
            scan.data.errCount++;
        } else {
            scan.data.errCount = 1;
        }
        scanLog(scan, message);
    }
};
