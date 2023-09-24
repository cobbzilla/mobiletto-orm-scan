export const scanLog = (scan, message) => {
    if (scan.data) {
        if (!scan.data.log) {
            scan.data.log = [];
        }
        scan.data.log.push(message);
    }
    else {
        throw new Error(`log: scan ${scan.name} not running (?) cannot log: ${message}`);
    }
};
export const countScanOp = (scan) => {
    if (scan.data) {
        if (scan.data.opCount) {
            scan.data.opCount++;
        }
        else {
            scan.data.opCount = 1;
        }
    }
};
export const countScanError = (scan, message) => {
    if (scan.data) {
        if (scan.data.errCount) {
            scan.data.errCount++;
        }
        else {
            scan.data.errCount = 1;
        }
        scanLog(scan, message);
    }
};
//# sourceMappingURL=scan.js.map