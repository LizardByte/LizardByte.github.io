/** @jest-environment jsdom */

const { afterEach, expect, test } = require('@jest/globals');

afterEach(() => {
    delete globalThis.lucide;
    jest.resetModules();
});

test('initializes Lucide when it is available and otherwise does nothing', () => {
    require('../assets/js/lucide-init.js');

    const createIcons = jest.fn();
    globalThis.lucide = { createIcons, icons: { circle: {} } };
    jest.resetModules();
    require('../assets/js/lucide-init.js');

    expect(createIcons).toHaveBeenCalledWith({ icons: globalThis.lucide.icons });
});
