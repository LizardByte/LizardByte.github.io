/** @jest-environment jsdom */

const { afterEach, describe, expect, test } = require('@jest/globals');

function loadScript() {
    jest.resetModules();
    require('../assets/js/changelog-links.js');
}

function setReadyState(value) {
    return jest.spyOn(document, 'readyState', 'get').mockReturnValue(value);
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
});

describe('changelog links', () => {
    test('converts the newest valid changelog URL after DOM readiness', () => {
        setReadyState('loading');
        document.body.innerHTML = `
            <p>Full Changelog: https://github.com/LizardByte/Old/compare/v1…v2 trailing</p>
            <p>Full Changelog: https://github.com/Other/Repo/compare/v1…v2</p>
            <p id="target">Full Changelog: https://github.com/LizardByte/Test/compare/v2…v3</p>
        `;

        loadScript();
        expect(document.querySelector('#target a')).toBeNull();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const link = document.querySelector('#target a');
        expect(link.href).toBe('https://github.com/LizardByte/Test/compare/v2%E2%80%A6v3');
        expect(link.textContent).toContain('v2…v3');
        expect(link.target).toBe('_blank');
        expect(link.rel).toBe('noopener noreferrer');
        expect(document.querySelectorAll('a')).toHaveLength(1);
    });

    test('ignores nonmatching, malformed, and disallowed changelog candidates', () => {
        setReadyState('complete');
        document.body.innerHTML = `
            <p>Ordinary paragraph</p>
            <p>Full Changelog /compare/ v1…v2</p>
            <p>Full Changelog: https://github.com/LizardByte/Test/releases/v1…v2</p>
        `;

        loadScript();

        expect(document.querySelector('a')).toBeNull();
    });

    test('uses innerText and tolerates URL parsing failures and invalid URL components', () => {
        setReadyState('complete');
        const paragraph = document.createElement('p');
        paragraph.innerText = 'Full Changelog: https://github.com/LizardByte/Test/compare/v1…v2';
        document.body.appendChild(paragraph);

        const NativeURL = globalThis.URL;
        globalThis.URL = jest.fn(() => {
            throw new TypeError('bad URL');
        });
        loadScript();
        expect(paragraph.querySelector('a')).toBeNull();

        const candidates = [
            { href: 'http://github.com/LizardByte/Test/compare/v1%E2%80%A6v2', hostname: 'github.com', pathname: '/LizardByte/Test/compare/v1%E2%80%A6v2', protocol: 'http:' },
            { href: 'https://example.com/LizardByte/Test/compare/v1%E2%80%A6v2', hostname: 'example.com', pathname: '/LizardByte/Test/compare/v1%E2%80%A6v2', protocol: 'https:' },
            { href: 'https://github.com/Other/Test/compare/v1%E2%80%A6v2', hostname: 'github.com', pathname: '/Other/Test/compare/v1%E2%80%A6v2', protocol: 'https:' },
        ];
        for (const candidate of candidates) {
            jest.resetModules();
            globalThis.URL = jest.fn(() => candidate);
            loadScript();
        }
        globalThis.URL = NativeURL;

        expect(paragraph.querySelector('a')).toBeNull();
    });
});
