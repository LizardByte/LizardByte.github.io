/** @jest-environment jsdom */

const { afterEach, describe, expect, test } = require('@jest/globals');

function loadScript() {
    jest.resetModules();
    require('../assets/js/projects.js');
}

function captureDomReady() {
    let callback;
    const addEventListener = jest.spyOn(document, 'addEventListener').mockImplementation((type, listener) => {
        if (type === 'DOMContentLoaded') {
            callback = listener;
        }
    });
    loadScript();
    addEventListener.mockRestore();
    return callback;
}

function setReadyState(value) {
    return jest.spyOn(document, 'readyState', 'get').mockReturnValue(value);
}

async function flushPromises(rounds = 8) {
    for (let index = 0; index < rounds; index += 1) {
        await Promise.resolve();
    }
}

function response(body, ok = true, status = 200) {
    return {
        json: jest.fn().mockResolvedValue(body),
        ok,
        status,
    };
}

afterEach(() => {
    document.body.innerHTML = '';
    delete globalThis.fetch;
    delete globalThis.formatNumber;
    delete globalThis.rankingSorter;
    jest.restoreAllMocks();
});

describe('project cards', () => {
    test('waits for DOM readiness and exits when the project container is absent', () => {
        const readyState = setReadyState('loading');
        globalThis.fetch = jest.fn();
        const onReady = captureDomReady();
        expect(globalThis.fetch).not.toHaveBeenCalled();

        onReady();
        expect(globalThis.fetch).not.toHaveBeenCalled();
        readyState.mockRestore();
    });

    test('filters repositories and builds cards with activity, docs, and language data', async () => {
        setReadyState('complete');
        document.body.innerHTML = '<div id="project-container"></div>';
        globalThis.formatNumber = jest.fn(value => `#${value}`);
        globalThis.rankingSorter = jest.fn(() => (left, right) => right.stargazers_count - left.stargazers_count);
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});

        const normal = {
            archived: false,
            clone_url: 'https://github.com/LizardByte/normal.git',
            description: 'Normal project',
            fork: false,
            forks: 2,
            full_name: 'LizardByte/normal',
            html_url: 'https://github.com/LizardByte/normal',
            name: 'normal',
            stargazers_count: 20,
            topics: [],
        };
        const featured = {
            ...normal,
            clone_url: 'https://github.com/LizardByte/featured.git',
            description: 'Featured fork',
            fork: true,
            full_name: 'LizardByte/featured',
            name: 'featured',
            stargazers_count: 10,
            topics: ['featured-fork'],
        };
        const zero = {
            ...normal,
            clone_url: 'https://github.com/LizardByte/zero.git',
            description: 'Zero activity',
            full_name: 'LizardByte/zero',
            name: 'zero',
            stargazers_count: 5,
        };
        const skipped = [
            { ...normal, archived: true, name: 'archived' },
            { ...normal, description: null, name: 'undocumented' },
            { ...normal, fork: true, name: 'plain-fork', topics: [] },
        ];
        const docs = {
            bad: { repository: { url: featured.clone_url }, urls: { documentation: 'not a URL' } },
            external: { repository: { url: featured.clone_url }, urls: { documentation: 'https://example.com/docs' } },
            good: { repository: { url: normal.clone_url.toUpperCase() }, urls: { documentation: 'https://docs.lizardbyte.dev/projects/normal' } },
            other: { repository: { url: 'https://github.com/Other/project.git' }, urls: { documentation: 'https://docs.lizardbyte.dev/other' } },
        };

        globalThis.fetch = jest.fn(url => {
            if (url.endsWith('/readthedocs/projects.json')) return Promise.resolve(response(docs));
            if (url.endsWith('/github/repos.json')) return Promise.resolve(response([...skipped, zero, featured, normal]));
            if (url.includes('/commitActivity/normal.json')) return Promise.resolve(response([{ total: 0 }, { total: 10 }]));
            if (url.includes('/commitActivity/featured.json')) return Promise.reject(new Error('no activity'));
            if (url.includes('/commitActivity/zero.json')) return Promise.resolve(response([{ total: 0 }]));
            if (url.includes('/languages/normal.json')) return Promise.resolve(response({ 'C++': 90, JavaScript: 10 }));
            if (url.includes('/languages/featured.json')) return Promise.resolve(response(null, false, 404));
            if (url.includes('/languages/zero.json')) return Promise.reject(new Error('no languages'));
            if (url.endsWith('/normal/')) return Promise.resolve(response(null));
            if (url.endsWith('/featured/')) return Promise.resolve(response(null, false, 404));
            if (url.endsWith('/zero/')) return Promise.reject(new Error('site unavailable'));
            throw new Error(`Unexpected URL: ${url}`);
        });

        loadScript();
        await flushPromises(20);

        const cards = document.querySelectorAll('#project-container > div');
        expect(cards).toHaveLength(3);
        expect(document.querySelectorAll('.badge.bg-info')).toHaveLength(1);
        expect(document.querySelector('.readthedocs-icon').closest('a').href).toBe('https://docs.lizardbyte.dev/projects/normal');
        expect(document.querySelectorAll('.language-logo')).toHaveLength(2);
        expect(document.querySelector('.language-logo').src).toContain('C%2B%2B.svg');
        expect(document.querySelectorAll('.commit-bar-active')).toHaveLength(1);
        expect(document.querySelectorAll('.commit-bar-empty')).toHaveLength(2);
        expect(document.querySelector('a[href="https://app.lizardbyte.dev/normal/"]')).not.toBeNull();
        expect(globalThis.formatNumber).toHaveBeenCalled();
        expect(globalThis.fetch.mock.calls.every(([, options]) => options.cache === 'no-store')).toBe(true);
    });

    test('continues without documentation data and reports repository failures', async () => {
        setReadyState('complete');
        document.body.innerHTML = '<div id="project-container"></div>';
        globalThis.formatNumber = value => String(value);
        globalThis.rankingSorter = () => () => 0;
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

        globalThis.fetch = jest.fn(url => {
            if (url.endsWith('/readthedocs/projects.json')) return Promise.resolve(response(null, false, 500));
            return Promise.resolve(response(null, false, 503));
        });
        loadScript();
        await flushPromises();
        expect(consoleLog).toHaveBeenCalledWith('No ReadTheDocs project data available', expect.any(Error));
        expect(consoleError).toHaveBeenCalledWith('Error loading project data:', expect.any(Error));
    });
});
