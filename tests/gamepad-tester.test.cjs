/** @jest-environment jsdom */

const { afterEach, expect, test } = require('@jest/globals');

function captureDomReady() {
    let callback;
    const addEventListener = jest.spyOn(document, 'addEventListener').mockImplementation((type, listener) => {
        if (type === 'DOMContentLoaded') {
            callback = listener;
        }
    });
    jest.resetModules();
    require('../assets/js/gamepad-tester.js');
    addEventListener.mockRestore();
    return callback;
}

function gamepadFixture() {
    const infoIds = [
        'gamepad-id',
        'gamepad-index',
        'gamepad-connected',
        'gamepad-mapping',
        'gamepad-buttons-count',
        'gamepad-axes-count',
        'gamepad-type',
        'gamepad-name',
    ];
    document.body.innerHTML = `
        <div id="GamepadTester"></div>
        <div id="gamepad-selector-container"><div id="gamepad-selector"></div></div>
        <div id="gamepad-info"></div>
        <div id="gamepad-status"><span id="gamepad-status-message"></span></div>
        <div id="firefox-switch-warning"></div>
        <div id="controller-visual"></div>
        <div id="buttons-container"></div>
        <div id="axes-container"></div>
        ${infoIds.map(identifier => `<output id="${identifier}"></output>`).join('')}
        <div id="vibration-status"></div>
        <div id="dual-rumble-controls"></div>
        <div id="simple-vibration-controls"></div>
        <div id="vibration-duration-controls"></div>
        <div id="vibration-buttons"></div>
        <div id="vibration-unsupported"></div>
        <input id="vibration-weak" value="0.25"><output id="weak-value"></output>
        <input id="vibration-strong" value="0.75"><output id="strong-value"></output>
        <input id="vibration-magnitude" value="0.5"><output id="magnitude-value"></output>
        <input id="vibration-duration" value="250"><output id="duration-value"></output>
        <button id="vibrate-btn"></button>
        <button id="stop-vibration-btn"></button>
        <div id="left-stick"><span id="left-stick-position"></span></div>
        <div id="right-stick"><span id="right-stick-position"></span></div>
        <pre id="raw-data"></pre>
    `;
    for (const identifier of ['left-stick', 'right-stick']) {
        const parent = document.getElementById(identifier);
        const stick = parent.firstElementChild;
        Object.defineProperty(parent, 'clientWidth', { configurable: true, value: 100 });
        Object.defineProperty(stick, 'clientWidth', { configurable: true, value: 20 });
    }
}

function makeGamepad(index, overrides = {}) {
    return {
        axes: [-0.75, 0, 0.5, -0.5, 0],
        buttons: [
            { pressed: false, value: 0 },
            { pressed: false, value: 0.25 },
            { pressed: false, value: 0.75 },
            { pressed: true, value: 0.05 },
        ],
        connected: true,
        id: `Controller ${index}`,
        index,
        mapping: '',
        ...overrides,
    };
}

function gamepadEvent(type, gamepad) {
    const event = new Event(type);
    Object.defineProperty(event, 'gamepad', { value: gamepad });
    return event;
}

function createHarness({ supported = true } = {}) {
    let capabilities = { supported: false, type: 'none' };
    let compatibilityIssues = [];
    const visualizer = {
        mount: jest.fn(),
        setColorScheme: jest.fn(),
        update: jest.fn(),
    };
    const helper = {
        createVisualizer: jest.fn(() => visualizer),
        detectControllerType: jest.fn(() => 'xbox'),
        getAxisName: jest.fn((type, index) => `${type} axis ${index}`),
        getButtonImagePath: jest.fn((type, index) => index % 2 === 0 ? `/button-${type}-${index}.svg` : null),
        getButtonName: jest.fn((type, index) => `${type} button ${index}`),
        getCompatibilityIssues: jest.fn(() => compatibilityIssues),
        getGamepadInfo: jest.fn(id => ({ name: `Name ${id}`, type: 'Test type' })),
        getVibrationCapabilities: jest.fn(() => capabilities),
        isSupported: jest.fn(() => supported),
        stopVibration: jest.fn().mockResolvedValue(undefined),
        vibrate: jest.fn().mockResolvedValue(undefined),
    };
    globalThis.GamepadHelper = jest.fn(() => helper);
    globalThis.gamepadHelperVersion = '1.2.3';
    return {
        helper,
        setCapabilities(value) {
            capabilities = value;
        },
        setCompatibilityIssues(value) {
            compatibilityIssues = value;
        },
        visualizer,
    };
}

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

afterEach(() => {
    document.body.innerHTML = '';
    delete globalThis.GamepadHelper;
    delete globalThis.gamepadHelperVersion;
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
    jest.restoreAllMocks();
});

test('handles unsupported browsers and complete connected-gamepad interactions', async () => {
    gamepadFixture();
    createHarness({ supported: false });
    captureDomReady()();
    expect(document.getElementById('gamepad-status-message').textContent).toContain('not supported');
    expect(document.getElementById('gamepad-status').classList.contains('alert-danger')).toBe(true);

    gamepadFixture();
    const harness = createHarness();
    let navigatorPads = [];
    Object.defineProperty(navigator, 'getGamepads', {
        configurable: true,
        value: jest.fn(() => navigatorPads),
    });
    const animationCallbacks = new Map();
    let nextAnimationId = 0;
    globalThis.requestAnimationFrame = jest.fn(callback => {
        nextAnimationId += 1;
        animationCallbacks.set(nextAnimationId, callback);
        return nextAnimationId;
    });
    globalThis.cancelAnimationFrame = jest.fn(identifier => animationCallbacks.delete(identifier));
    let mutationCallback;
    globalThis.MutationObserver = jest.fn(callback => {
        mutationCallback = callback;
        return { observe: jest.fn() };
    });
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    captureDomReady()();

    expect(harness.helper.createVisualizer).toHaveBeenCalledWith(document.getElementById('controller-visual'), {
        assetBasePath: 'https://cdn.jsdelivr.net/npm/@lizardbyte/gamepad-helper@1.2.3/assets/img/gamepads/',
        colorScheme: 'Black',
    });
    mutationCallback([
        { attributeName: 'data-bs-theme', type: 'childList' },
        { attributeName: 'class', type: 'attributes' },
        { attributeName: 'data-bs-theme', type: 'attributes' },
    ]);
    document.getElementById('gamepad-selector').click();
    document.getElementById('vibrate-btn').click();
    document.getElementById('stop-vibration-btn').click();

    const ghost = makeGamepad(2, { axes: [], buttons: [] });
    globalThis.dispatchEvent(gamepadEvent('gamepadconnected', ghost));
    expect(harness.visualizer.mount).toHaveBeenCalledWith(undefined);
    globalThis.dispatchEvent(gamepadEvent('gamepaddisconnected', ghost));
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();

    const first = makeGamepad(0);
    navigatorPads = [first];
    harness.setCompatibilityIssues([{ code: 'firefox-switch-gamepad-mapping' }]);
    globalThis.dispatchEvent(gamepadEvent('gamepadconnected', first));

    expect(document.getElementById('GamepadTester').classList.contains('has-gamepad')).toBe(true);
    expect(document.getElementById('firefox-switch-warning').hidden).toBe(false);
    expect(document.querySelectorAll('#buttons-container .circular-button')).toHaveLength(4);
    expect(document.querySelectorAll('#buttons-container img')).toHaveLength(2);
    expect(document.querySelectorAll('#axes-container .gamepad-axis')).toHaveLength(5);
    expect(document.getElementById('gamepad-mapping').textContent).toBe('No mapping');
    expect(document.getElementById('button-2').classList.contains('active')).toBe(true);
    expect(document.getElementById('progress-bar-left-2').style.transform).toBe('rotate(90deg)');
    expect(document.getElementById('axis-progress-0').classList.contains('is-negative')).toBe(true);
    expect(document.getElementById('axis-progress-2').classList.contains('is-positive')).toBe(true);
    expect(document.getElementById('axis-progress-1').classList.contains('is-positive')).toBe(false);
    expect(document.getElementById('raw-data').textContent).toContain('Button 0');
    expect(document.getElementById('vibration-unsupported').classList.contains('d-none')).toBe(false);
    document.getElementById('vibrate-btn').click();

    document.getElementById('button-value-0').remove();
    document.getElementById('axis-value-0').remove();
    animationCallbacks.get(nextAnimationId)();

    document.documentElement.dataset.bsTheme = 'dark';
    mutationCallback([{ attributeName: 'data-bs-theme', type: 'attributes' }]);
    expect(harness.visualizer.setColorScheme).toHaveBeenCalledWith('White');

    for (const [inputId, outputId] of [
        ['vibration-weak', 'weak-value'],
        ['vibration-strong', 'strong-value'],
        ['vibration-magnitude', 'magnitude-value'],
        ['vibration-duration', 'duration-value'],
    ]) {
        const input = document.getElementById(inputId);
        input.value = '0.6';
        input.dispatchEvent(new Event('input'));
        expect(document.getElementById(outputId).textContent).toBe('0.6');
    }

    harness.setCapabilities({ supported: true, type: 'dual-rumble' });
    animationCallbacks.get(nextAnimationId)();
    expect(document.getElementById('dual-rumble-controls').classList.contains('d-none')).toBe(false);
    document.getElementById('vibrate-btn').click();
    await flushPromises();
    expect(harness.helper.vibrate).toHaveBeenCalledWith(first, {
        duration: 0,
        strongMagnitude: 0.6,
        weakMagnitude: 0.6,
    });
    expect(consoleLog).toHaveBeenCalledWith('Vibration started');

    harness.helper.vibrate.mockRejectedValueOnce(new Error('vibration failed'));
    document.getElementById('vibrate-btn').click();
    await flushPromises();
    expect(consoleError).toHaveBeenCalledWith('Vibration error:', expect.any(Error));

    harness.setCapabilities({ supported: true, type: 'simple' });
    animationCallbacks.get(nextAnimationId)();
    document.getElementById('vibrate-btn').click();
    await flushPromises();
    expect(harness.helper.vibrate).toHaveBeenLastCalledWith(first, {
        duration: 0,
        magnitude: 0.6,
        strongMagnitude: 0.6,
        weakMagnitude: 0.6,
    });
    expect(document.getElementById('simple-vibration-controls').classList.contains('d-none')).toBe(false);

    document.getElementById('stop-vibration-btn').click();
    await flushPromises();
    harness.helper.stopVibration.mockRejectedValueOnce(new Error('stop failed'));
    document.getElementById('stop-vibration-btn').click();
    await flushPromises();
    expect(consoleError).toHaveBeenCalledWith('Stop vibration error:', expect.any(Error));

    navigatorPads = [];
    document.getElementById('vibrate-btn').click();
    document.getElementById('stop-vibration-btn').click();
    navigatorPads = [first];

    const second = makeGamepad(1, { mapping: 'standard' });
    navigatorPads = [first, second];
    harness.setCompatibilityIssues([]);
    globalThis.dispatchEvent(gamepadEvent('gamepadconnected', second));
    expect(document.querySelectorAll('.gamepad-selector-card')).toHaveLength(2);
    const firstCardContent = document.querySelector('.gamepad-selector-card[data-index="0"] span');
    firstCardContent.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('.gamepad-selector-card[data-index="0"]').getAttribute('aria-pressed')).toBe('true');
    globalThis.dispatchEvent(gamepadEvent('gamepaddisconnected', second));
    globalThis.dispatchEvent(gamepadEvent('gamepadconnected', second));
    globalThis.dispatchEvent(gamepadEvent('gamepaddisconnected', second));
    expect(document.getElementById('firefox-switch-warning').hidden).toBe(true);
    globalThis.dispatchEvent(gamepadEvent('gamepaddisconnected', first));
    expect(document.getElementById('gamepad-selector-container').style.display).toBe('none');
    expect(document.getElementById('gamepad-status').classList.contains('alert-warning')).toBe(true);

    animationCallbacks.get(nextAnimationId)?.();
});

test('activates gamepads that are already connected at startup', () => {
    gamepadFixture();
    const harness = createHarness();
    const initial = makeGamepad(1, { axes: [], buttons: [{ pressed: false, value: 0 }] });
    Object.defineProperty(navigator, 'getGamepads', {
        configurable: true,
        value: jest.fn(() => [null, initial]),
    });
    globalThis.requestAnimationFrame = jest.fn(() => 42);
    globalThis.cancelAnimationFrame = jest.fn();
    globalThis.MutationObserver = jest.fn(() => ({ observe: jest.fn() }));

    captureDomReady()();

    expect(document.getElementById('gamepad-status-message').textContent).toContain('Controller 1 connected');
    expect(harness.visualizer.mount).toHaveBeenCalledWith(initial);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
});
