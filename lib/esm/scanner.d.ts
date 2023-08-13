import { MobilettoClock, MobilettoScan } from "mobiletto-orm-scan-typedef";
export declare class MobilettoScanner {
    readonly name: string;
    readonly clock: MobilettoClock;
    readonly scanCheckInterval: number;
    readonly scans: MobilettoScan[];
    timeout: number | object | null;
    stopping: boolean;
    constructor(name: string, scanCheckInterval?: number, clock?: MobilettoClock);
    now(): number;
    addScan(scan: MobilettoScan): void;
    running(): boolean;
    start(delay?: number): void;
    stop(): void;
}
