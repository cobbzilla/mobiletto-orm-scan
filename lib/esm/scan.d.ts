import { MobilettoScan } from "mobiletto-orm-scan-typedef";
export declare const scanLog: (scan: MobilettoScan, message: string) => void;
export declare const countScanOp: (scan: MobilettoScan) => void;
export declare const countScanError: (scan: MobilettoScan, message: string) => void;
