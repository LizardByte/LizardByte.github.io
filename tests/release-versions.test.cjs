const { afterEach, expect, test } = require('@jest/globals');

require('../assets/js/release-versions.js');

const updateGitHubReleaseVersions = globalThis.updateGitHubReleaseVersions;

afterEach(() => {
    delete globalThis.document;
    delete globalThis.fetch;
});

function createElement() {
    const classes = new Set(['d-none']);
    return {
        classList: {
            add(className) {
                classes.add(className);
            },
            contains(className) {
                return classes.has(className);
            },
            toggle(className, force) {
                if (force) {
                    classes.add(className);
                } else {
                    classes.delete(className);
                }
            },
        },
        href: '',
        textContent: '',
    };
}

function createHarness(releases, { responseOk = true } = {}) {
    const elements = {
        '.stable': createElement(),
        '.stable-version': createElement(),
        '.prerelease': createElement(),
        '.prerelease-version': createElement(),
    };
    const requests = [];
    globalThis.document = {
        querySelector(selector) {
            return elements[selector] ?? null;
        },
    };
    globalThis.fetch = async url => {
        requests.push(url);
        return {
            ok: responseOk,
            status: responseOk ? 200 : 503,
            json: async () => releases,
        };
    };

    return {
        elements,
        requests,
        update: updateGitHubReleaseVersions,
    };
}

const options = {
    repository: 'LizardByte/Sunshine',
    stableButtonSelector: '.stable',
    stableVersionSelector: '.stable-version',
    prereleaseButtonSelector: '.prerelease',
    prereleaseVersionSelector: '.prerelease-version',
};

test('shows the latest stable release and a newer prerelease', async () => {
    const harness = createHarness([
        {
            html_url: 'https://github.com/LizardByte/Sunshine/releases/tag/v2',
            prerelease: true,
            published_at: '2026-02-01T00:00:00Z',
            tag_name: 'v2',
        },
        {
            html_url: 'https://github.com/LizardByte/Sunshine/releases/tag/v1',
            prerelease: false,
            published_at: '2026-01-01T00:00:00Z',
            tag_name: 'v1',
        },
    ]);

    await harness.update(options);

    expect(harness.requests).toEqual(['https://api.github.com/repos/LizardByte/Sunshine/releases']);
    expect(harness.elements['.stable'].classList.contains('d-none')).toBe(false);
    expect(harness.elements['.stable'].href).toBe('https://github.com/LizardByte/Sunshine/releases/tag/v1');
    expect(harness.elements['.stable-version'].textContent).toBe('v1');
    expect(harness.elements['.prerelease'].classList.contains('d-none')).toBe(false);
    expect(harness.elements['.prerelease-version'].textContent).toBe('v2');
});

test('hides a prerelease that is older than the stable release', async () => {
    const harness = createHarness([
        {
            html_url: 'https://github.com/LizardByte/Sunshine/releases/tag/v1',
            prerelease: false,
            published_at: '2026-02-01T00:00:00Z',
            tag_name: 'v1',
        },
        {
            html_url: 'https://github.com/LizardByte/Sunshine/releases/tag/v2-beta',
            prerelease: true,
            published_at: '2026-01-01T00:00:00Z',
            tag_name: 'v2-beta',
        },
    ]);

    await harness.update(options);

    expect(harness.elements['.stable'].classList.contains('d-none')).toBe(false);
    expect(harness.elements['.prerelease'].classList.contains('d-none')).toBe(true);
});

test('hides both links when there is no stable release', async () => {
    const harness = createHarness([]);

    await harness.update(options);

    expect(harness.elements['.stable'].classList.contains('d-none')).toBe(true);
    expect(harness.elements['.prerelease'].classList.contains('d-none')).toBe(true);
});

test('rejects invalid repositories, missing elements, and failed requests', async () => {
    const invalidRepository = createHarness([]);
    await expect(invalidRepository.update({ ...options, repository: '../Sunshine' })).rejects.toThrow(/owner\/name/);
    expect(invalidRepository.requests).toHaveLength(0);

    const missingElement = createHarness([]);
    await expect(missingElement.update({ ...options, stableButtonSelector: '.missing' })).rejects.toThrow(/selectors/);

    const failedRequest = createHarness([], { responseOk: false });
    await expect(failedRequest.update(options)).rejects.toThrow(/status 503/);

    const invalidResponse = createHarness({});
    await expect(invalidResponse.update(options)).rejects.toThrow(/must be an array/);
});
