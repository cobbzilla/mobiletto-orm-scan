import { after, describe, it } from "mocha";
import { expect } from "chai";
import { sleep } from "zilla-util";
import { mobiletto, registerDriver, shutdownMobiletto } from "mobiletto-base";
import { repositoryFactory, rand, MobilettoOrmTypeDef, MobilettoOrmObject } from "mobiletto-orm";
import { MobilettoScanObjectTypeDefConfig } from "mobiletto-orm-scan-typedef";
import * as os from "os";

import { storageClient as localDriver } from "mobiletto-driver-local";
registerDriver("local", localDriver);

import { MobilettoScanner } from "../src";

type CALLER = MobilettoOrmObject;
const caller: CALLER = {};

const TestObjTypeDef = new MobilettoOrmTypeDef({
    typeName: "testObj",
    fields: {
        value: { primary: true },
        ...MobilettoScanObjectTypeDefConfig.fields,
    },
});

describe("ormScan test", async () => {
    it("should run some jobs", async () => {
        const tmpdir = `${os.tmpdir()}/storageScanTest_${rand(8)}`;
        const tmp = await mobiletto(
            "local",
            tmpdir,
            null,
            {
                createIfNotExist: true,
            },
            // { key: rand(32) },
        );

        const factory = repositoryFactory([tmp]);
        const repo = factory.repository(TestObjTypeDef);

        // make some new jobs
        const numJobs = 3;
        for (let i = 0; i < numJobs; i++) {
            await repo.create(caller, { value: `val_${i}` });
        }

        // expect their status to be pending
        const pending = await repo.safeFindBy(caller, "status", "pending");
        expect(pending.objects?.length).eq(numJobs);

        // create a scanner and a scan
        const scanner = new MobilettoScanner(caller, "testScanner", 50);
        const found: MobilettoOrmObject[] = [];
        const scan = {
            name: "testScan",
            timeout: 10000,
            pollInterval: 2000,
            delay: 10,
            repository: () => repo,
            visit: (obj: MobilettoOrmObject) => {
                // console.log(`visit: found obj: ${JSON.stringify(obj)}`);
                found.push(obj);
            },
        };
        const scanStart = Date.now();
        scanner.addScan(scan);
        scanner.start();
        await sleep(scan.timeout / 2);

        expect(found.length).eq(numJobs);

        // expect nothing is pending
        const pending2 = await repo.safeFindBy(caller, "status", "pending");
        expect(pending2.objects?.length).eq(0);

        // expect everything is finished
        const finished = await repo.safeFindBy(caller, "status", "finished");
        expect(finished.objects?.length).eq(numJobs);

        // expect nothing is started
        const started = await repo.safeFindBy(caller, "status", "started");
        expect(started.objects?.length).eq(0);

        // wait until just before the timeout
        await sleep(Math.max(1, scan.timeout - (Date.now() - scanStart) - 3000));

        // scan should still be active
        expect(scanner.scans.length).eq(1);

        // create another job just within the time limit, it should get processed
        await repo.create(caller, { value: `val_extra` });
        await sleep(scan.timeout + scan.pollInterval + 1000);

        // one more thing finished
        const finished2 = await repo.safeFindBy(caller, "status", "finished");
        expect(finished2.objects?.length).eq(numJobs + 1);

        // new scan is in the future, after original scanScheduled
        expect(scanner.scans.length).eq(0);

        scanner.stop();
    });
});

after((done) => {
    shutdownMobiletto().finally(done);
});
