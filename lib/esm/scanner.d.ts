import { ZillaClock } from "zilla-util";
import { MobilettoScan } from "mobiletto-orm-scan-typedef";
export declare class MobilettoScanner {
    readonly name: string;
    readonly clock: ZillaClock;
    readonly scanCheckInterval: number;
    readonly scans: MobilettoScan[];
    timeout: number | object | null;
    stopping: boolean;
    constructor(name: string, scanCheckInterval?: number, clock?: ZillaClock);
    now(): number;
    addScan(scan: MobilettoScan): void;
    running(): boolean;
    start(delay?: number): void;
    stop(): void;
}
