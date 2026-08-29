/** @jest-environment jsdom */

const { afterEach, expect, test } = require('@jest/globals');

afterEach(() => {
    document.body.innerHTML = '';
    delete globalThis.bootstrap;
    jest.resetModules();
});

test('synchronizes matching inactive tabs while ignoring unrelated or incompatible groups', () => {
    document.body.innerHTML = `
        <div class="tabs" id="source"><div role="tablist">
            <button role="tab" data-tab-name="one"></button>
            <button role="tab" data-tab-name="two" id="selected"></button>
        </div></div>
        <div class="tabs" id="matching"><div role="tablist">
            <button role="tab" data-tab-name="one"></button>
            <button role="tab" data-tab-name="two" id="matching-tab"></button>
        </div></div>
        <div class="tabs"><div role="tablist">
            <button role="tab" data-tab-name="different"></button>
            <button role="tab" data-tab-name="two"></button>
        </div></div>
        <div class="tabs"><div role="tablist"><button role="tab" data-tab-name="one"></button></div></div>
        <div class="tabs"><p>No tab list</p></div>
        <div class="tabs"><div role="tablist">
            <button role="tab" data-tab-name="one"></button>
            <button role="tab" data-tab-name="two" class="active"></button>
        </div></div>
    `;
    const show = jest.fn(() => {
        document.getElementById('matching-tab').dispatchEvent(new CustomEvent('shown.bs.tab', { bubbles: true }));
    });
    globalThis.bootstrap = {
        Tab: { getOrCreateInstance: jest.fn(() => ({ show })) },
    };
    require('../assets/js/tabs.js');

    document.body.dispatchEvent(new CustomEvent('shown.bs.tab', { bubbles: true }));
    document.getElementById('selected').dispatchEvent(new CustomEvent('shown.bs.tab', { bubbles: true }));

    expect(globalThis.bootstrap.Tab.getOrCreateInstance).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
});
