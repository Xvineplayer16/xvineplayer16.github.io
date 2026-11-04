/**
 * main.js — boot everything, in dependency order.
 */
(function () {
    'use strict';

    var site = window.Portfolio;

    function boot() {
        if (!site || !site.utils || !site.config) {
            console.warn('portfolio: core modules missing — check the script order in index.html');
            return;
        }

        if (site.mobileGuard) site.mobileGuard.init();
        if (site.nav) site.nav.init();
        if (site.stack) site.stack.init();
        if (site.presence) site.presence.start();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
