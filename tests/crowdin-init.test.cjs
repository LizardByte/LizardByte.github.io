/** @jest-environment jsdom */

const { afterEach, expect, test } = require('@jest/globals');

afterEach(() => {
    delete globalThis.initCrowdIn;
    jest.resetModules();
});

test('initializes CrowdIn with the organization name', () => {
    globalThis.initCrowdIn = jest.fn();

    require('../assets/js/crowdin-init.js');

    expect(globalThis.initCrowdIn).toHaveBeenCalledWith('LizardByte', 'jekyll');
});
