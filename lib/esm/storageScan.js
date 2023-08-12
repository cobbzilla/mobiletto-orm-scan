var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { rand } from "mobiletto-base";
import { countScanOp, countScanError } from "./scan.js";
const acquireLock = (scanner, scan) => __awaiter(void 0, void 0, void 0, function* () {
    const lockRepo = scan.lockRepository();
    const lock = {
        lock: scan.source.info().canonicalName(),
        owner: `${scanner.name}_${rand(16)}`,
    };
    const existing = yield lockRepo.safeFindById(lock.lock);
    if (existing != null) {
        return null;
    }
    else {
        const created = yield lockRepo.create(lock);
        const confirmed = yield lockRepo.safeFindById(lock.lock);
        if (!confirmed || created.owner !== confirmed.owner) {
            return null;
        }
        return confirmed;
    }
});
const releaseLock = (scan, lock) => __awaiter(void 0, void 0, void 0, function* () {
    const lockRepo = scan.lockRepository();
    const existing = yield lockRepo.safeFindById(lock.lock);
    if (!existing) {
        throw new Error(`releaseLock: lock disappeared: ${lock.lock}`);
    }
    yield lockRepo.remove(lock);
});
const fileExt = (path) => {
    if (!path)
        return "";
    const lastDot = path.lastIndexOf(".");
    return lastDot === -1 || lastDot === path.length - 1 ? "" : path.substring(lastDot + 1);
};
export const storageScan = (scanner, scan) => __awaiter(void 0, void 0, void 0, function* () {
    if (scanner.stopping)
        return scan;
    let lock = null;
    try {
        lock = yield acquireLock(scanner, scan);
        if (!lock) {
            return;
        }
        const visitor = (meta) => __awaiter(void 0, void 0, void 0, function* () {
            if (scanner.stopping) {
                throw new Error(`${scan.name}: scanner stopping: aborting visit to ${meta.name}`);
            }
            if (!scan.ext || scan.ext.includes(fileExt(meta.name))) {
                try {
                    yield scan.visit(meta);
                    if (!scanner.stopping) {
                        countScanOp(scan);
                    }
                }
                catch (e) {
                    if (!scanner.stopping) {
                        countScanError(scan, `visitor(${meta.name}): error ${e}`);
                    }
                }
            }
        });
        const recursive = scan.recursive !== false;
        yield scan.source.list("", { recursive, visitor });
        return true;
    }
    finally {
        if (lock)
            yield releaseLock(scan, lock);
    }
});
