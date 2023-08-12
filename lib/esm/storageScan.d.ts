import { MobilettoStorageScan } from "./types.js";
import { MobilettoScanner } from "./scanner.js";
export declare const storageScan: (scanner: MobilettoScanner, scan: MobilettoStorageScan) => Promise<true | MobilettoStorageScan | undefined>;
