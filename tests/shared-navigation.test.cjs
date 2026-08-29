/** @jest-environment jsdom */

const {readFileSync} = require('node:fs');
const path = require('node:path');
const {expect, test} = require('@jest/globals');
const {Liquid} = require('liquidjs');
const yaml = require('js-yaml');

const root = path.join(__dirname, '..');
const theme = yaml.load(readFileSync(path.join(root, '_config_theme.yml'), 'utf8'), {json: true});

/**
 * Render the real shared includes with the Jekyll URL filters used by local assets.
 *
 * @param {object} site Site configuration.
 * @returns {Liquid} Configured template renderer.
 */
function renderer(site) {
    const engine = new Liquid({
        root: [path.join(root, '_includes'), path.join(__dirname, 'fixtures', 'shared-navigation')],
        jekyllInclude: true,
        strictFilters: true,
    });
    engine.registerFilter('relative_url', value => `${site.baseurl || ''}/${String(value).replace(/^\/+/, '')}`);
    engine.registerFilter('absolute_url', value => `${site.url}${site.baseurl || ''}/${String(value).replace(/^\/+/, '')}`);
    return engine;
}

test.each([
    ['main site', 'https://app.lizardbyte.dev', '', undefined, 'https://app.lizardbyte.dev/'],
    ['same-host project', 'https://app.lizardbyte.dev', '/libvirtualhid', undefined, 'https://app.lizardbyte.dev/'],
    ['migrated project', 'https://themerr.lizardbyte.dev', '/ThemerrDB', undefined, 'https://app.lizardbyte.dev/'],
    ['project preview', 'https://themerr.lizardbyte.dev', '/9926', undefined, 'https://app.lizardbyte.dev/'],
    ['main-site preview', 'https://app.lizardbyte.dev', '/686', '/686/', '/686/'],
    ['configured host', 'https://project.example', '/project', 'https://main.example/site', 'https://main.example/site/'],
])('%s keeps shared navigation separate from local assets', async (_name, url, baseurl, canonical, expectedBase) => {
    const site = {...theme, url, baseurl};
    if (canonical !== undefined) site['url-canonical'] = canonical;
    const engine = renderer(site);
    const context = {site, page: {}};
    const nav = await engine.renderFile('nav.html', context);
    const footer = await engine.renderFile('footer-extra.html', context);
    const support = await engine.renderFile('support.html', context);
    document.body.innerHTML = nav + footer + support;

    expect(document.querySelector('.navbar-brand').getAttribute('href')).toBe(expectedBase);
    const routes = {
        Store: 'store',
        Blog: 'blog',
        Discord: 'discord',
        Support: 'support',
        'Gamepad Tester': 'gamepad-tester',
        'Mouse Tester': 'mouse-tester',
        Roadmap: 'roadmap',
    };
    const links = [...document.querySelectorAll('nav a')];
    for (const [label, route] of Object.entries(routes)) {
        expect(links.find(link => link.textContent === label).getAttribute('href')).toBe(expectedBase + route);
    }
    expect(document.querySelector('a[title="Privacy Policy"]').getAttribute('href')).toBe(expectedBase + 'privacy');
    expect(document.querySelector('a[title="Terms and Conditions"]').getAttribute('href')).toBe(expectedBase + 'terms');
    expect(document.querySelector('a[title="Licenses and Attribution"]').getAttribute('href')).toBe(expectedBase + 'licenses');
    expect(document.querySelector('#Support a').getAttribute('href')).toBe(expectedBase + 'support');
    expect(links.some(link => link.getAttribute('href') === 'https://github.com/sponsors/LizardByte')).toBe(true);
    expect(document.querySelector('.avatar-container a').getAttribute('href')).toBe(baseurl + '/');
    expect(document.querySelector('.avatar-img').getAttribute('src')).toBe(baseurl + '/assets/img/navbar-avatar.png');
});

test.each([
    ['store', 'https://main.example/root/store'],
    ['/blog', 'https://main.example/root/blog'],
    ['/', 'https://main.example/root/'],
    ['', 'https://main.example/root/'],
    ['https://external.example/page?one=1&two=2', 'https://external.example/page?one=1&two=2'],
    ['//cdn.example/file', '//cdn.example/file'],
    ['mailto:hello@example.com', 'mailto:hello@example.com'],
    ['#search', '#search'],
])('resolves %s without changing explicit destinations', async (input, expected) => {
    const site = {...theme, 'url-canonical': 'https://main.example/root/'};
    const output = await renderer(site).renderFile('shared-site-url.html', {site, include: {path: input}});
    document.body.innerHTML = `<a href="${output}">link</a>`;
    expect(document.querySelector('a').getAttribute('href')).toBe(expected);
});
