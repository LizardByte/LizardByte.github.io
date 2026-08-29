/** @jest-environment jsdom */

const { afterEach, beforeEach, describe, expect, test } = require('@jest/globals');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const registryUrl = 'https://raw.githubusercontent.com/LizardByte/.github/master/organizations.json';
const dashboardUrl = 'https://app.lizardbyte.dev/dashboard';

function loadScript() {
    jest.resetModules();
    require('../assets/js/projects.js');
}

function captureDomReady() {
    let callback;
    const addEventListener = jest.spyOn(document, 'addEventListener').mockImplementation((type, listener) => {
        if (type === 'DOMContentLoaded') callback = listener;
    });
    loadScript();
    addEventListener.mockRestore();
    return callback;
}

function setReadyState(value) {
    return jest.spyOn(document, 'readyState', 'get').mockReturnValue(value);
}

async function flushPromises(rounds = 12) {
    for (let index = 0; index < rounds; index += 1) await Promise.resolve();
}

function response(body, ok = true, status = 200) {
    return { json: jest.fn().mockResolvedValue(body), ok, status };
}

function project(name, { organization = 'LizardByte', ...overrides } = {}) {
    const fullName = `${organization}/${name}`;
    return {
        archived: false,
        private: false,
        clone_url: `https://github.com/${fullName}.git`,
        description: 'Project description',
        fork: false,
        forks: 2,
        full_name: fullName,
        html_url: `https://github.com/${fullName}`,
        homepage: null,
        name,
        owner: { login: organization },
        stargazers_count: 20,
        topics: [],
        dashboard_key: fullName,
        dashboard_aliases: [fullName],
        dashboard_paths: { banner_small: `github/openGraphImages/${fullName}_624x312.png` },
        ...overrides,
    };
}

function catalogFetch(repos, organizations, docs = []) {
    return jest.fn(url => {
        if (url === registryUrl) return Promise.resolve(response(organizations));
        if (url.endsWith('/readthedocs/projects.json')) return Promise.resolve(response(docs));
        if (url.endsWith('/github/repos.json')) return Promise.resolve(response(repos));
        if (url.includes('/commitActivity/')) return Promise.resolve(response([{ total: 1 }]));
        if (url.includes('/languages/')) return Promise.resolve(response({}));
        throw new Error(`Unexpected URL: ${url}`);
    });
}

function visibleCards() {
    return [...document.querySelectorAll('#project-container > div')].filter(card => !card.hidden);
}

function change(id, value, event) {
    const element = document.getElementById(id);
    element.value = value;
    element.dispatchEvent(new Event(event));
}

beforeEach(() => {
    setReadyState('complete');
    const index = readFileSync(join(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = index.slice(index.indexOf('<!-- Projects section-->'));
    globalThis.formatNumber = jest.fn(value => `#${value}`);
    globalThis.rankingSorter = jest.fn(() => (left, right) => right.stargazers_count - left.stargazers_count);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    document.body.innerHTML = '';
    delete globalThis.fetch;
    delete globalThis.formatNumber;
    delete globalThis.rankingSorter;
    jest.restoreAllMocks();
});

describe('project cards', () => {
    test('waits for DOM readiness and exits when the project container is absent', () => {
        document.body.innerHTML = '';
        setReadyState('loading');
        globalThis.fetch = jest.fn();
        const onReady = captureDomReady();
        expect(globalThis.fetch).not.toHaveBeenCalled();
        onReady();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    test('filters repositories and uses explicit asset paths, stable keys, and pre-transfer docs aliases', async () => {
        const normal = project('normal', {
            homepage: 'https://sunshine.lizardbyte.dev/',
            dashboard_key: 'former-name',
            dashboard_aliases: ['OldOrg/former-name', 'LizardByte/normal'],
            dashboard_paths: { banner_small: 'github/openGraphImages/former-banner_624x312.png' },
        });
        const featured = project('featured', {
            fork: true, stargazers_count: 10, topics: ['featured-fork'], homepage: 'javascript:alert(1)',
        });
        const zero = project('zero', { stargazers_count: 5 });
        const skipped = [
            project('archived', { archived: true }),
            project('private', { private: true }),
            project('undocumented', { description: null }),
            project('plain-fork', { fork: true }),
            project('unregistered', { organization: 'Unknown' }),
        ];
        const docs = {
            bad: { repository: { url: featured.clone_url }, urls: { documentation: 'not a URL' } },
            external: { repository: { url: featured.clone_url }, urls: { documentation: 'https://example.com/docs' } },
            good: { repository: { url: 'https://github.com/OldOrg/FORMER-NAME.git/' }, urls: { documentation: 'https://docs.lizardbyte.dev/projects/normal' } },
            other: { repository: { url: 'https://github.com/Other/project.git' }, urls: { documentation: 'https://docs.lizardbyte.dev/other' } },
        };
        const baseFetch = catalogFetch([...skipped, zero, featured, normal], ['LizardByte'], docs);
        globalThis.fetch = jest.fn(url => {
            if (url.includes('/commitActivity/former-name.json')) return Promise.resolve(response([{ total: 0 }, { total: 5 }, { total: 10 }]));
            if (url.includes('/commitActivity/LizardByte/featured.json')) return Promise.reject(new Error('no activity'));
            if (url.includes('/commitActivity/LizardByte/zero.json')) return Promise.resolve(response([{ total: 0 }]));
            if (url.includes('/languages/former-name.json')) return Promise.resolve(response({ 'C++': 90, JavaScript: 10 }));
            if (url.includes('/languages/LizardByte/featured.json')) return Promise.resolve(response(null, false, 404));
            if (url.includes('/languages/LizardByte/zero.json')) return Promise.reject(new Error('no languages'));
            return baseFetch(url);
        });

        loadScript();
        await flushPromises(20);
        expect(visibleCards()).toHaveLength(3);
        expect(document.querySelectorAll('.badge.bg-info')).toHaveLength(1);
        expect(document.querySelector('.readthedocs-icon').closest('a').href).toBe('https://docs.lizardbyte.dev/projects/normal');
        expect(document.querySelectorAll('.language-logo')).toHaveLength(2);
        expect(document.querySelector('.language-logo').src).toContain('C%2B%2B.svg');
        const activeBars = document.querySelectorAll('.commit-bar-active');
        expect(activeBars).toHaveLength(2);
        expect(Number(activeBars[0].style.getPropertyValue('--commit-bar-opacity'))).toBeCloseTo(0.65);
        expect(Number(activeBars[1].style.getPropertyValue('--commit-bar-opacity'))).toBe(1);
        expect(document.querySelectorAll('.commit-bar-empty')).toHaveLength(2);
        expect(document.querySelector('.card-img-top').src).toBe(`${dashboardUrl}/github/openGraphImages/former-banner_624x312.png`);
        expect(document.querySelector('.project-card-link').href).toBe(normal.homepage);
        expect(visibleCards()[1].querySelector('.project-card-link').href).toBe(featured.html_url);
        expect(visibleCards()[2].querySelector('.project-card-link').href).toBe(zero.html_url);
        expect(document.getElementById('project-status').textContent).toBe('3 projects');
        expect(globalThis.rankingSorter).toHaveBeenCalledWith('stargazers_count', 'full_name');
        expect(baseFetch.mock.calls.every(([url]) => url === registryUrl || url.startsWith(dashboardUrl))).toBe(true);
    });

    test('distinguishes same-name repos, searches across orgs, and scopes archived search without refetching cards', async () => {
        const first = project('demo', { organization: 'First', dashboard_key: 'original-demo' });
        const second = project('demo', { organization: 'Second' });
        const future = project('audio', { organization: 'FutureOrg', description: 'Movie themes' });
        globalThis.fetch = catalogFetch([first, second, future], ['FutureOrg', 'second', 'First', 'Empty']);
        loadScript();
        await flushPromises();

        const cards = visibleCards();
        expect(cards).toHaveLength(3);
        expect(cards.map(card => card.querySelector('.project-organization').textContent)).toEqual(['First', 'Second', 'FutureOrg']);
        expect(cards[0].querySelector('.card-img-top').src).toContain('/First/demo_624x312.png');
        expect(cards[1].querySelector('.card-img-top').src).toContain('/Second/demo_624x312.png');
        const urls = globalThis.fetch.mock.calls.map(([url]) => url);
        expect(urls).toContain(`${dashboardUrl}/github/commitActivity/original-demo.json`);
        expect(urls).toContain(`${dashboardUrl}/github/languages/Second/demo.json`);
        expect(globalThis.fetch.mock.calls.every(([, options]) => options.cache === 'no-store')).toBe(true);
        expect([...document.getElementById('project-organization').options].map(option => option.value))
            .toEqual(['', 'Empty', 'First', 'FutureOrg', 'second']);
        const requests = globalThis.fetch.mock.calls.length;
        change('project-organization', 'First', 'change');
        expect(visibleCards()).toHaveLength(1);
        expect(document.getElementById('project-status').textContent).toBe('1 project');
        change('project-search', 'SECOND DEMO', 'input');
        expect(visibleCards()).toHaveLength(0);
        expect(document.getElementById('project-status').textContent).toBe('No projects match your search.');
        change('project-organization', '', 'change');
        expect(visibleCards()).toHaveLength(1);
        expect(visibleCards()[0].querySelector('.project-organization').textContent).toBe('Second');
        change('project-search', ' movie THEMES ', 'input');
        expect(visibleCards()).toHaveLength(1);
        expect(visibleCards()[0].querySelector('.card-title').textContent).toBe('audio');
        change('project-organization', 'Empty', 'change');
        expect(visibleCards()).toHaveLength(0);
        const archive = document.getElementById('archived-projects-link');
        expect(new URL(archive.href).searchParams.get('q')).toBe('org:Empty archived:true');
        change('project-organization', '', 'change');
        change('project-search', '', 'input');
        expect(visibleCards()).toHaveLength(3);
        expect(new URL(archive.href).searchParams.get('q')).toBe('org:Empty org:First org:FutureOrg org:second archived:true');
        expect(new URL(archive.href).searchParams.get('type')).toBe('repositories');
        expect(archive.classList.contains('disabled')).toBe(false);
        expect(globalThis.fetch).toHaveBeenCalledTimes(requests);
    });

    test('keeps a transferred and renamed project on the supplied cache paths', async () => {
        const moved = project('renamed', {
            organization: 'SunshineStream', dashboard_key: 'Sunshine',
            dashboard_paths: { banner_small: 'github/openGraphImages/Sunshine_624x312.png' },
        });
        globalThis.fetch = catalogFetch([moved], ['SunshineStream']);
        loadScript();
        await flushPromises();
        expect(document.querySelector('.card-img-top').src).toBe(`${dashboardUrl}/github/openGraphImages/Sunshine_624x312.png`);
        expect(globalThis.fetch).toHaveBeenCalledWith(`${dashboardUrl}/github/commitActivity/Sunshine.json`, expect.any(Object));
        expect(globalThis.fetch).toHaveBeenCalledWith(`${dashboardUrl}/github/languages/Sunshine.json`, expect.any(Object));
    });

    test('normalizes HTTPS and SSH docs identities without matching another org by basename', async () => {
        const moved = project('demo', { organization: 'New', dashboard_aliases: ['Old/demo', 'New/demo'] });
        const other = project('demo', { organization: 'Other' });
        const docs = [
            'git@github.com:Old/demo.git', 'ssh://git@github.com/Old/demo.git', 'https://github.com/New/demo',
            'not a URL', 'https://example.com/Old/demo', 'https://github.com/Old',
        ].map((url, index) => ({ repository: { url }, urls: { documentation: `https://docs.lizardbyte.dev/${index}` } }));
        globalThis.fetch = catalogFetch([moved, other], ['New', 'Other'], docs);
        loadScript();
        await flushPromises();
        expect(visibleCards()[0].querySelectorAll('.readthedocs-icon')).toHaveLength(3);
        expect(visibleCards()[1].querySelectorAll('.readthedocs-icon')).toHaveLength(0);
    });

    test.each(['http://sunshine.lizardbyte.dev/', 'https://koko.lizardbyte.dev/custom/path/'])(
        'uses the configured project homepage %s without probing the umbrella domain', async homepage => {
            globalThis.fetch = catalogFetch([project('demo', { homepage })], ['LizardByte']);
            loadScript();
            await flushPromises();
            expect(document.querySelector('.project-card-link').href).toBe(homepage);
            expect(globalThis.fetch.mock.calls.some(([url]) => url === homepage)).toBe(false);
        },
    );

    test.each([null, [], [''], [42], ['invalid/name']].map(value => [value]))(
        'rejects an invalid registry: %j', async organizations => {
            globalThis.fetch = catalogFetch([], organizations);
            loadScript();
            await flushPromises();
            expect(document.getElementById('project-status').textContent).toContain('could not be loaded');
            expect(document.getElementById('project-organization').disabled).toBe(true);
            expect(document.getElementById('archived-projects-link').hasAttribute('href')).toBe(false);
        },
    );

    test('continues without docs data and reports repository failures', async () => {
        globalThis.fetch = jest.fn(url => {
            if (url === registryUrl) return Promise.resolve(response(['LizardByte']));
            if (url.endsWith('/readthedocs/projects.json')) return Promise.resolve(response(null, false, 500));
            return Promise.resolve(response(null, false, 503));
        });
        loadScript();
        await flushPromises();
        expect(console.log).toHaveBeenCalledWith('No ReadTheDocs project data available', expect.any(Error));
        expect(console.error).toHaveBeenCalledWith('Error loading project data:', expect.any(Error));
        expect(document.getElementById('project-status').textContent).toContain('could not be loaded');
    });

    test('a registry outage does not create an unscoped archive link', async () => {
        const baseFetch = catalogFetch([], ['LizardByte']);
        globalThis.fetch = jest.fn(url => url === registryUrl
            ? Promise.resolve(response(null, false, 503)) : baseFetch(url));
        loadScript();
        await flushPromises();
        expect(document.getElementById('project-search').disabled).toBe(true);
        expect(document.getElementById('archived-projects-link').hasAttribute('href')).toBe(false);
    });
});
