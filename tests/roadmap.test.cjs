/** @jest-environment jsdom */

const { afterEach, describe, expect, test } = require('@jest/globals');

function loadScript() {
    jest.resetModules();
    require('../assets/js/roadmap.js');
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

async function flushPromises(rounds = 8) {
    for (let index = 0; index < rounds; index += 1) {
        await Promise.resolve();
    }
}

function roadmapFixture() {
    document.body.innerHTML = `
        <div id="issues-container">Loading</div>
        <div id="issueModal"></div>
        <div id="issueModalBody"></div>
        <div id="issueModalLabel"></div>
        <a id="viewOnGithub"></a>
    `;
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
    delete globalThis.bootstrap;
    delete globalThis.fetch;
    delete globalThis.marked;
    jest.restoreAllMocks();
});

describe('roadmap', () => {
    test('renders empty and failed API states', async () => {
        roadmapFixture();
        globalThis.bootstrap = { Modal: jest.fn(() => ({ show: jest.fn() })) };
        globalThis.fetch = jest.fn().mockResolvedValue(response([]));
        captureDomReady()();
        await flushPromises();
        expect(document.getElementById('issues-container').textContent).toBe('No roadmap items found.');

        roadmapFixture();
        globalThis.fetch = jest.fn().mockResolvedValue(response(null, false, 503));
        captureDomReady()();
        await flushPromises();
        expect(document.getElementById('issues-container').textContent).toContain('Network response was not ok');
    });

    test('renders issue cards and modal variants safely', async () => {
        roadmapFixture();
        const modal = { show: jest.fn() };
        globalThis.bootstrap = { Modal: jest.fn(() => modal) };
        globalThis.marked = { parse: jest.fn(body => `<p>${body}</p>`) };
        const issues = [
            {
                body: '**Details**',
                created_at: '2026-01-02T00:00:00Z',
                html_url: 'https://github.com/LizardByte/roadmap/issues/1',
                labels: [
                    { color: 'ffffff', name: 'Alpha' },
                    { color: '000000', name: 'zulu' },
                ],
                number: 1,
                title: 'First issue',
                user: { login: 'octocat' },
            },
            {
                body: '',
                created_at: '2026-01-03T00:00:00Z',
                html_url: 'https://github.com/LizardByte/roadmap/issues/2',
                labels: [],
                number: 2,
                title: 'Second issue',
                user: { login: 'lizard' },
            },
        ];
        globalThis.fetch = jest.fn().mockResolvedValue(response(issues));

        captureDomReady()();
        await flushPromises();

        const cards = document.querySelectorAll('#issues-container .card');
        expect(cards).toHaveLength(2);
        const labelBadges = cards[0].querySelectorAll('.d-flex.flex-wrap .badge');
        expect(Array.from(labelBadges, badge => badge.textContent)).toEqual(['Alpha', 'zulu']);
        expect(labelBadges[0].style.color).toBe('rgb(0, 0, 0)');
        expect(labelBadges[1].style.color).toBe('rgb(255, 255, 255)');

        cards[0].click();
        expect(document.getElementById('issueModalLabel').textContent).toBe('First issue (#1)');
        expect(document.getElementById('viewOnGithub').href).toBe(issues[0].html_url);
        expect(globalThis.marked.parse).toHaveBeenCalledWith('**Details**');
        expect(document.getElementById('issueModalBody').textContent).toContain('octocat');

        cards[1].click();
        expect(document.getElementById('issueModalBody').textContent).toContain('No description provided.');

        const issueWithoutLabels = { ...issues[1], labels: null, title: 'No labels' };
        cards[1].dataset.issue = JSON.stringify(issueWithoutLabels);
        cards[1].click();
        expect(document.getElementById('issueModalBody').textContent).not.toContain('Labels:');
        expect(modal.show).toHaveBeenCalledTimes(3);
    });
});
