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
    require('../assets/js/mouse-tester.js');
    addEventListener.mockRestore();
    return callback;
}

function mouseFixture() {
    const buttonElements = [0, 1, 2, 3, 4].map(number => `
        <div class="mouse-button-card" data-mouse-button="${number}"></div>
        <div class="mouse-svg-control" data-mouse-button="${number}"></div>
        <output id="mouse-button-${number}-count"></output>
        <output id="mouse-button-${number}-state"></output>
    `).join('');
    const scrollIndicators = ['left', 'right', 'up', 'down'].map(direction =>
        `<div class="mouse-svg-scroll-indicator" data-scroll-direction="${direction}"></div>`
    ).join('');
    document.body.innerHTML = `
        <section id="mouse-capture-surface" tabindex="-1"><span id="inside"></span></section>
        <div id="mouse-position-indicator"></div>
        <div id="mouse-status"></div>
        <div id="mouse-status-message"></div>
        <output id="mouse-active-buttons"></output>
        <output id="mouse-last-event"></output>
        <output id="mouse-wheel-mode"></output>
        <output id="mouse-browser-support"></output>
        <div id="firefox-mouse-buttons-warning"></div>
        <output id="mouse-movement-x"></output>
        <output id="mouse-movement-y"></output>
        <output id="mouse-position"></output>
        <output id="mouse-distance"></output>
        <output id="mouse-move-events"></output>
        <output id="mouse-double-clicks"></output>
        <output id="mouse-wheel-x"></output>
        <output id="mouse-wheel-y"></output>
        <output id="mouse-wheel-direction"></output>
        <output id="mouse-wheel-events"></output>
        <button id="mouse-reset"></button>
        ${buttonElements}
        ${scrollIndicators}
    `;
}

function pointerEvent(type, values = {}) {
    const event = new MouseEvent(type, {
        bubbles: true,
        button: values.button ?? 0,
        buttons: values.buttons ?? 0,
        cancelable: true,
        clientX: values.clientX ?? 0,
        clientY: values.clientY ?? 0,
    });
    Object.defineProperties(event, {
        movementX: { value: values.movementX ?? 0 },
        movementY: { value: values.movementY ?? 0 },
    });
    return event;
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('reports unsupported browsers and exercises mouse buttons, motion, wheel, and reset behavior', () => {
    const NativeMouseEvent = globalThis.MouseEvent;
    const NativeWheelEvent = globalThis.WheelEvent;
    mouseFixture();
    Object.defineProperty(globalThis, 'MouseEvent', { configurable: true, value: undefined, writable: true });
    Object.defineProperty(globalThis, 'WheelEvent', { configurable: true, value: undefined, writable: true });
    captureDomReady()();
    expect(document.getElementById('mouse-browser-support').textContent).toBe('Not supported');
    expect(document.getElementById('mouse-capture-surface').hasAttribute('tabindex')).toBe(false);

    Object.defineProperty(globalThis, 'MouseEvent', { configurable: true, value: NativeMouseEvent, writable: true });
    Object.defineProperty(globalThis, 'WheelEvent', { configurable: true, value: NativeWheelEvent, writable: true });
    mouseFixture();
    jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla Firefox/140');
    jest.useFakeTimers();
    const animationCallbacks = new Map();
    let nextAnimationId = 0;
    globalThis.requestAnimationFrame = jest.fn(callback => {
        nextAnimationId += 1;
        animationCallbacks.set(nextAnimationId, callback);
        return nextAnimationId;
    });
    globalThis.cancelAnimationFrame = jest.fn(identifier => animationCallbacks.delete(identifier));
    const captureSurface = document.getElementById('mouse-capture-surface');
    captureSurface.getBoundingClientRect = () => ({ height: 80, left: 10, top: 20, width: 100 });
    const focus = jest.spyOn(captureSurface, 'focus').mockImplementation(() => {});
    const nativeAddEventListener = globalThis.addEventListener.bind(globalThis);
    let mouseUpHandler;
    jest.spyOn(globalThis, 'addEventListener').mockImplementation((type, listener, options) => {
        if (type === 'mouseup') {
            mouseUpHandler = listener;
        }
        return nativeAddEventListener(type, listener, options);
    });

    captureDomReady()();

    expect(document.getElementById('mouse-browser-support').textContent).toBe('Supported');
    expect(document.getElementById('firefox-mouse-buttons-warning').hidden).toBe(false);
    expect(document.getElementById('mouse-active-buttons').textContent).toBe('0 (none)');

    const primaryDown = pointerEvent('mousedown', { button: 0, buttons: 1 });
    captureSurface.dispatchEvent(primaryDown);
    captureSurface.dispatchEvent(pointerEvent('mousedown', { button: 0, buttons: 1 }));
    expect(primaryDown.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.getElementById('mouse-button-0-count').textContent).toBe('1');
    expect(document.getElementById('mouse-button-0-state').textContent).toBe('Pressed');
    expect(document.getElementById('mouse-status').classList.contains('alert-success')).toBe(true);

    const ordinaryPointer = pointerEvent('pointerdown', { button: 0, buttons: 1 });
    captureSurface.dispatchEvent(ordinaryPointer);
    expect(ordinaryPointer.defaultPrevented).toBe(false);
    const sideDown = pointerEvent('pointerdown', { button: 3, buttons: 8 });
    captureSurface.dispatchEvent(sideDown);
    expect(sideDown.defaultPrevented).toBe(true);
    const unrelatedPointerUp = pointerEvent('pointerup', { button: 2, buttons: 8 });
    globalThis.dispatchEvent(unrelatedPointerUp);
    const unsuppressedPointerUp = pointerEvent('pointerup', { button: 4, buttons: 8 });
    globalThis.dispatchEvent(unsuppressedPointerUp);
    const sideUp = pointerEvent('pointerup', { button: 3, buttons: 0 });
    globalThis.dispatchEvent(sideUp);
    expect(sideUp.defaultPrevented).toBe(true);

    const firstMove = pointerEvent('mousemove', {
        buttons: 5,
        clientX: 200,
        clientY: 10,
        movementX: 3,
        movementY: 4,
    });
    captureSurface.dispatchEvent(firstMove);
    captureSurface.dispatchEvent(pointerEvent('mousemove', {
        buttons: 0,
        clientX: 60,
        clientY: 60,
        movementX: -2,
        movementY: -5,
    }));
    expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1);
    animationCallbacks.get(1)();
    expect(document.getElementById('mouse-movement-x').textContent).toBe('-2');
    expect(document.getElementById('mouse-movement-y').textContent).toBe('-5');
    expect(document.getElementById('mouse-position').textContent).toBe('50, 40');
    expect(document.getElementById('mouse-distance').textContent).toBe('10');

    const wheelCases = [
        { deltaMode: WheelEvent.DOM_DELTA_PIXEL, deltaX: 0, deltaY: 4, direction: '↓ Down', mode: 'Pixels' },
        { deltaMode: WheelEvent.DOM_DELTA_LINE, deltaX: 0, deltaY: -2, direction: '↑ Up', mode: 'Lines' },
        { deltaMode: WheelEvent.DOM_DELTA_PAGE, deltaX: -3, deltaY: 0, direction: '← Left', mode: 'Pages' },
        { deltaMode: WheelEvent.DOM_DELTA_PIXEL, deltaX: 5, deltaY: 0, direction: '→ Right', mode: 'Pixels' },
        { deltaMode: WheelEvent.DOM_DELTA_PIXEL, deltaX: 0, deltaY: 0, direction: 'Idle', mode: 'Pixels' },
    ];
    for (const wheelCase of wheelCases) {
        const wheel = new WheelEvent('wheel', { ...wheelCase, bubbles: true, cancelable: true });
        captureSurface.dispatchEvent(wheel);
        expect(wheel.defaultPrevented).toBe(true);
        expect(document.getElementById('mouse-wheel-direction').textContent).toBe(wheelCase.direction);
        expect(document.getElementById('mouse-wheel-mode').textContent).toBe(wheelCase.mode);
    }
    expect(document.getElementById('mouse-wheel-events').textContent).toBe('5');
    jest.runOnlyPendingTimers();
    expect(document.querySelectorAll('.mouse-svg-scroll-indicator.is-active')).toHaveLength(0);

    const contextMenu = pointerEvent('contextmenu');
    captureSurface.dispatchEvent(contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);
    const ordinaryClick = pointerEvent('click', { button: 0 });
    captureSurface.dispatchEvent(ordinaryClick);
    expect(ordinaryClick.defaultPrevented).toBe(false);
    const sideClick = pointerEvent('click', { button: 3 });
    captureSurface.dispatchEvent(sideClick);
    expect(sideClick.defaultPrevented).toBe(true);
    const sideAuxClick = pointerEvent('auxclick', { button: 4 });
    captureSurface.dispatchEvent(sideAuxClick);
    expect(sideAuxClick.defaultPrevented).toBe(true);

    const doubleClick = pointerEvent('dblclick');
    captureSurface.dispatchEvent(doubleClick);
    expect(document.getElementById('mouse-double-clicks').textContent).toBe('1');
    const insideMouseUp = pointerEvent('mouseup', { button: 0, buttons: 0 });
    document.getElementById('inside').dispatchEvent(insideMouseUp);
    expect(insideMouseUp.defaultPrevented).toBe(true);
    document.body.dispatchEvent(pointerEvent('mouseup', { button: 0, buttons: 0 }));
    mouseUpHandler();

    globalThis.dispatchEvent(new Event('pointercancel'));
    globalThis.dispatchEvent(new Event('blur'));
    const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));

    captureSurface.dispatchEvent(pointerEvent('mousemove', { clientX: 30, clientY: 40, movementX: 1, movementY: 1 }));
    captureSurface.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 1 }));
    document.getElementById('mouse-reset').click();
    document.getElementById('mouse-reset').click();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    expect(document.getElementById('mouse-status-message').textContent).toContain('begin');
    expect(document.getElementById('mouse-position-indicator').hidden).toBe(true);
});
