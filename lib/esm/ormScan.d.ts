import { MobilettoOrmScan, MobilettoScanObject } from "./types.js";
import { MobilettoScanner } from "./scanner.js";
export declare const DEFAULT_ORM_SCAN_TIMEOUT: number;
export declare const DEFAULT_ORM_SCAN_POLL_INTERVAL: number;
export declare const DEFAULT_ORM_SCAN_MAX_ERRORS = 3;
export declare const ormScan: <T extends MobilettoScanObject>(scanner: MobilettoScanner, scan: MobilettoOrmScan<T>) => Promise<void>;
