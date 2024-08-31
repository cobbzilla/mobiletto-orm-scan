import { ZillaClock } from "zilla-util";
import { MobilettoOrmObject } from "mobiletto-orm-typedef";
import { MobilettoScan } from "mobiletto-orm-scan-typedef";
export declare class MobilettoScanner<CALLER extends MobilettoOrmObject> {
    readonly caller: CALLER;
    readonly name: string;
    readonly clock: ZillaClock;
    readonly scanCheckInterval: number;
    readonly scans: MobilettoScan<CALLER>[];
    timeout: number | object | null;
    stopping: boolean;
    constructor(caller: CALLER, name: string, scanCheckInterval?: number, clock?: ZillaClock);
    now(): number;
    addScan(scan: MobilettoScan<CALLER>): void;
    running(): boolean;
    start(delay?: number): void;
    stop(): void;
}
