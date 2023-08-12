import { after, describe, it } from "mocha";
import { expect } from "chai";
import { MobilettoScanner, MobilettoScanLockTypeDef, sleep } from "../lib/esm/index.js";
import { mobiletto, registerDriver, shutdownMobiletto } from "mobiletto-base";
import { repositoryFactory, rand } from "mobiletto-orm";
import * as os from "os";

import { storageClient as localDriver } from "mobiletto-driver-local";
registerDriver("local", localDriver);

describe("storageScan test", async () => {
    it("should scan a home directory and find a .bashrc file", async () => {
        const tmpdir = `${os.tmpdir()}/storageScanTest_${rand(8)}`;
        const tmp = await mobiletto("local", tmpdir, null, {
            createIfNotExist: true,
        });
        const home = await mobiletto("local", os.homedir());

        const factory = repositoryFactory([tmp]);
        const lockRepository = factory.repository(MobilettoScanLockTypeDef);

        const scanner = new MobilettoScanner("testScanner", 50);
        let found = false;
        const scan = {
            name: "testScan",
            source: home,
            ext: ["bashrc"],
            recursive: false,
            lockRepository: () => lockRepository,
            visit: () => {
                found = true;
            },
        };
        scanner.addScan(scan);
        scanner.start();
        await sleep(2000);
        expect(found).is.true;
        const lock = await lockRepository.safeFindById(home.info().canonicalName());
        expect(lock).is.null;
        const removedLock = await lockRepository.safeFindById(home.info().canonicalName(), { removed: true });
        expect(removedLock).is.not.null;
        expect(removedLock.lock).eq(home.info().canonicalName());
        scanner.stop();
    });
    it("should wait to scan until a currently running scan has completed", async () => {
        const tmpdir = `${os.tmpdir()}/storageScanTest_${rand(8)}`;
        const tmp = await mobiletto("local", tmpdir, null, {
            createIfNotExist: true,
        });
        const home = await mobiletto("local", os.homedir());

        const factory = repositoryFactory([tmp]);
        const lockRepository = factory.repository(MobilettoScanLockTypeDef);

        const scanner = new MobilettoScanner("testScanner", 50);
        let found1 = 0;
        let found2 = 0;
        const scan1 = {
            name: "testScan1",
            source: home,
            ext: ["bashrc"],
            recursive: false,
            lockRepository: () => lockRepository,
            visit: async () => {
                await sleep(scanner.scanCheckInterval * 5);
                found1 = Date.now();
            },
        };

        const scan2 = {
            name: "testScan2",
            source: home,
            ext: ["bashrc"],
            interval: 1000,
            recursive: false,
            lockRepository: () => lockRepository,
            visit: () => {
                if (found2 === 0) found2 = Date.now();
            },
        };

        scanner.start();
        scanner.addScan(scan1);
        await sleep(scanner.scanCheckInterval * 2);
        scanner.addScan(scan2);
        await sleep(scanner.scanCheckInterval * 50);
        scanner.stop();
        expect(found1).is.greaterThan(scan1.scan.started);
        expect(found1).is.lessThan(scan1.scan.finished);
        expect(found2).is.greaterThan(found1);
        expect(found2).is.greaterThan(scan1.scan.finished);
        expect(found2).is.greaterThan(scan2.history[0].started);
        expect(found2).is.lessThan(scan2.history[0].finished);
    });
});

after((done) => {
    shutdownMobiletto().finally(done);
});
