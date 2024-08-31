import { MobilettoOrmObject } from "mobiletto-orm";
import { MobilettoStorageScan } from "./types.js";
import { MobilettoScanner } from "./scanner.js";
export declare const storageScan: <CALLER extends MobilettoOrmObject>(scanner: MobilettoScanner<CALLER>, scan: MobilettoStorageScan<CALLER>) => Promise<true | MobilettoStorageScan<CALLER> | undefined>;
