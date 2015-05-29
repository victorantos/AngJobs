'use strict';

/* https://docs.angularjs.org/guide/e2e-testing */

describe('CssTemplatesForFree App', function () {

    it('should contain by default the hashbang /#!', function () {
        browser.get('/');
        browser.getLocationAbsUrl().then(function (url) {
            expect(url.split('#')[1]).toBe('!/');
        });
    });
});