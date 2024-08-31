import { MobilettoOrmObject } from "mobiletto-orm-typedef";
import { MobilettoScan, MobilettoScanData } from "mobiletto-orm-scan-typedef";
import { MobilettoScanner } from "./scanner.js";
export declare const finalizeScan: <CALLER extends MobilettoOrmObject>(scanner: MobilettoScanner<CALLER>, scan: MobilettoScan<CALLER>, data: MobilettoScanData) => void;
export declare const scanLoop: <CALLER extends MobilettoOrmObject>(scanner: MobilettoScanner<CALLER>) => () => Promise<void>;
