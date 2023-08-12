export const DEFAULT_CLOCK = {
    now: () => Date.now(),
};
// adapted from https://stackoverflow.com/a/39914235
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
