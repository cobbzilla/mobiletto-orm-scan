import { MobilettoOrmObject } from "mobiletto-orm";
import { MobilettoScan } from "mobiletto-orm-scan-typedef";

export const scanLog = <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>, message: string) => {
    if (scan.data) {
        if (!scan.data.log) {
            scan.data.log = [];
        }
        scan.data.log.push(message);
    } else {
        throw new Error(`log: scan ${scan.name} not running (?) cannot log: ${message}`);
    }
};

export const countScanOp = <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>) => {
    if (scan.data) {
        if (scan.data.opCount) {
            scan.data.opCount++;
        } else {
            scan.data.opCount = 1;
        }
    }
};

export const countScanError = <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>, message: string) => {
    if (scan.data) {
        if (scan.data.errCount) {
            scan.data.errCount++;
        } else {
            scan.data.errCount = 1;
        }
        scanLog(scan, message);
    }
};
