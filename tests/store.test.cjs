/** @jest-environment jsdom */

const { afterEach, expect, test } = require('@jest/globals');

afterEach(() => {
    document.body.innerHTML = '';
    delete globalThis.bootstrap;
    jest.resetModules();
    jest.restoreAllMocks();
});

test('selects the requested slide, defaults invalid slides, and focuses the carousel', () => {
    document.body.innerHTML = `
        <div class="store-gallery-modal" id="without-carousel"></div>
        <div class="store-gallery-modal" id="modal">
            <div class="store-gallery-carousel" tabindex="-1"></div>
        </div>
    `;
    const carousel = { to: jest.fn() };
    globalThis.bootstrap = {
        Carousel: { getOrCreateInstance: jest.fn(() => carousel) },
    };
    const modal = document.getElementById('modal');
    const carouselElement = modal.querySelector('.store-gallery-carousel');
    const focus = jest.spyOn(carouselElement, 'focus');

    require('../assets/js/store.js');

    const validEvent = new Event('show.bs.modal');
    Object.defineProperty(validEvent, 'relatedTarget', { value: { dataset: { storeSlide: '3' } } });
    modal.dispatchEvent(validEvent);
    const invalidEvent = new Event('show.bs.modal');
    Object.defineProperty(invalidEvent, 'relatedTarget', { value: { dataset: { storeSlide: 'nope' } } });
    modal.dispatchEvent(invalidEvent);
    const defaultEvent = new Event('show.bs.modal');
    modal.dispatchEvent(defaultEvent);
    modal.dispatchEvent(new Event('shown.bs.modal'));

    expect(globalThis.bootstrap.Carousel.getOrCreateInstance).toHaveBeenCalledWith(carouselElement, {
        interval: false,
        keyboard: true,
        touch: true,
        wrap: true,
    });
    expect(carousel.to.mock.calls).toEqual([[3], [0], [0]]);
    expect(focus).toHaveBeenCalledTimes(1);
});
