import { after, describe, it } from "mocha";
import { expect } from "chai";
import { MobilettoScanLockTypeDef, sleep } from "mobiletto-orm-scan-typedef";
import { MobilettoScanner } from "../lib/esm/index.js";
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
        const callbacksReceived = [];
        const scan = {
            name: "testScan",
            source: home,
            ext: ["bashrc"],
            recursive: false,
            lockRepository: () => lockRepository,
            visit: () => {
                found = true;
            },
            success: () => callbacksReceived.push("success"),
            error: () => callbacksReceived.push("error"),
            done: () => callbacksReceived.push("done"),
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
        expect(callbacksReceived.length).eq(2);
        expect(callbacksReceived[0]).eq("success");
        expect(callbacksReceived[1]).eq("done");
        scanner.stop();
    });
    it("second scan does not run when an existing scan is already running", async () => {
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
        const callbacksReceived = [];
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
            success: () => callbacksReceived.push("success"),
            error: () => callbacksReceived.push("error"),
            done: () => callbacksReceived.push("done"),
        };

        const callbacksReceived2 = [];
        const scan2 = {
            name: "testScan2",
            source: home,
            ext: ["bashrc"],
            recursive: false,
            lockRepository: () => lockRepository,
            visit: () => {
                if (found2 === 0) found2 = Date.now();
            },
            success: () => callbacksReceived2.push("success"),
            error: () => callbacksReceived2.push("error"),
            done: () => callbacksReceived2.push("done"),
        };

        scanner.start();
        scanner.addScan(scan1);
        await sleep(scanner.scanCheckInterval * 2);
        scanner.addScan(scan2);
        await sleep(scanner.scanCheckInterval * 50);
        scanner.stop();
        expect(found1).is.greaterThan(scan1.data.started);
        expect(found1).is.lessThan(scan1.data.finished);
        expect(found2).eq(0);

        expect(callbacksReceived.length).eq(2);
        expect(callbacksReceived[0]).eq("success");
        expect(callbacksReceived[1]).eq("done");
        expect(callbacksReceived2.length).eq(2);
        expect(callbacksReceived2[0]).eq("success");
        expect(callbacksReceived2[1]).eq("done");
    });
});

after((done) => {
    shutdownMobiletto().finally(done);
});
