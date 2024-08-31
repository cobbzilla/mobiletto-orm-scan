import { MobilettoOrmObject } from "mobiletto-orm";
import { MobilettoScan } from "mobiletto-orm-scan-typedef";
export declare const scanLog: <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>, message: string) => void;
export declare const countScanOp: <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>) => void;
export declare const countScanError: <CALLER extends MobilettoOrmObject>(scan: MobilettoScan<CALLER>, message: string) => void;
