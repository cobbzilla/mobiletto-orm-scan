import { MobilettoScan, MobilettoScanData } from "mobiletto-orm-scan-typedef";
import { MobilettoScanner } from "./scanner.js";
export declare const finalizeScan: (scanner: MobilettoScanner, scan: MobilettoScan, data: MobilettoScanData) => void;
export declare const scanLoop: (scanner: MobilettoScanner) => () => Promise<void>;
