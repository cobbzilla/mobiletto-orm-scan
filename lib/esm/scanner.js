import { DEFAULT_CLOCK } from "./constants.js";
import { scanLoop } from "./loop.js";
export class MobilettoScanner {
    constructor(name, scanCheckInterval, clock) {
        this.scans = [];
        this.timeout = null;
        this.stopping = false;
        this.name = name;
        this.clock = clock ? clock : DEFAULT_CLOCK;
        this.scanCheckInterval = scanCheckInterval ? scanCheckInterval : 10 * 1000;
    }
    now() {
        return this.clock.now();
    }
    addScan(scan) {
        if (!scan.name) {
            throw new Error(`addScan(${JSON.stringify(scan)}): required property was missing from MobilettoScan parameter`);
        }
        if (scan.scan) {
            throw new Error(`addScan(${JSON.stringify(scan)}): scan property must be absent on MobilettoScan parameter`);
        }
        const foundIndex = this.scans.findIndex((s) => s.name === scan.name);
        if (foundIndex !== -1) {
            this.scans.splice(foundIndex, 1);
        }
        else {
            scan.scan = {
                scheduled: this.now() + (scan.delay ? scan.delay : scan.interval ? scan.interval : -1),
            };
        }
        this.scans.push(scan);
    }
    running() {
        return this.timeout != null;
    }
    start(delay) {
        if (this.running()) {
            throw new Error(`start: already running`);
        }
        this.stopping = false;
        this.timeout = setTimeout(scanLoop(this), delay ? delay : 10);
    }
    stop() {
        this.stopping = true;
    }
}
