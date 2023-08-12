import { MobilettoScan } from "./types.js";
export declare const scanLog: (scan: MobilettoScan, message: string) => void;
export declare const countScanOp: (scan: MobilettoScan) => void;
export declare const countScanError: (scan: MobilettoScan, message: string) => void;
