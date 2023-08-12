import { MobilettoClock } from "./types.js";

export const DEFAULT_CLOCK: MobilettoClock = {
    now: () => Date.now(),
};

// adapted from https://stackoverflow.com/a/39914235
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
