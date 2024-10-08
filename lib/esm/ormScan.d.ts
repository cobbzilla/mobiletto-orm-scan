import { MobilettoOrmObject } from "mobiletto-orm";
import { MobilettoOrmScan, MobilettoScanObject } from "./types.js";
import { MobilettoScanner } from "./scanner.js";
export declare const DEFAULT_ORM_SCAN_TIMEOUT: number;
export declare const DEFAULT_ORM_SCAN_POLL_INTERVAL: number;
export declare const DEFAULT_ORM_SCAN_MAX_ERRORS = 3;
export declare const ormScan: <T extends MobilettoScanObject, CALLER extends MobilettoOrmObject>(scanner: MobilettoScanner<CALLER>, scan: MobilettoOrmScan<T, CALLER>) => Promise<void>;
