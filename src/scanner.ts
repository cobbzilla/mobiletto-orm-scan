import { MobilettoClock, MobilettoScan, DEFAULT_CLOCK } from "mobiletto-orm-scan-typedef";
import { scanLoop } from "./loop.js";

export class MobilettoScanner {
    readonly name: string;
    readonly clock: MobilettoClock;
    readonly scanCheckInterval: number;
    readonly scans: MobilettoScan[] = [];
    timeout: number | object | null = null;
    stopping: boolean = false;
    constructor(name: string, scanCheckInterval?: number, clock?: MobilettoClock) {
        this.name = name;
        this.clock = clock ? clock : DEFAULT_CLOCK;
        this.scanCheckInterval = scanCheckInterval ? scanCheckInterval : 10 * 1000;
    }
    now() {
        return this.clock.now();
    }
    addScan(scan: MobilettoScan) {
        if (!scan.name) {
            throw new Error(
                `addScan(${JSON.stringify(scan)}): required property was missing from MobilettoScan parameter`,
            );
        }
        if (scan.data) {
            throw new Error(
                `addScan(${JSON.stringify(scan)}): data property must be absent on MobilettoScan parameter`,
            );
        }
        const foundIndex = this.scans.findIndex((s) => s.name === scan.name);
        if (foundIndex !== -1) {
            const found = this.scans[foundIndex];
            if (found.data && found.data.started) {
                throw new Error(`addScan(${JSON.stringify(scan)}): scan with same name already started`);
            }
            this.scans.splice(foundIndex, 1);
        }
        scan.data = {
            scheduled: this.now() + (scan.delay ? scan.delay : -1),
        };
        this.scans.push(scan);
    }
    running() {
        return this.timeout != null;
    }
    start(delay?: number) {
        if (this.running()) {
            console.warn("start: already running");
        } else {
            this.stopping = false;
            this.timeout = setTimeout(scanLoop(this), delay ? delay : 10);
        }
    }
    stop() {
        this.stopping = true;
    }
}
