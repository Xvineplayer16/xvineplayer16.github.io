/**
 * nav.js — the tab bar.
 *
 * One delegated click listener instead of inline onclick handlers (which
 * relied on the deprecated global `event` and broke in Firefox). Also keeps the
 * URL hash in sync, so #about is linkable and back/forward work.
 */
window.Portfolio = window.Portfolio || {};

Portfolio.nav = (function () {
    'use strict';

    var U = Portfolio.utils;

    var buttons = [];
    var pages = [];
    var navEl = null;

    function pageIds() {
        return pages.map(function (page) { return page.id; });
    }

    function show(id, options) {
        if (pages.length === 0) return;
        if (pageIds().indexOf(id) === -1) id = 'home';

        pages.forEach(function (page) {
            page.classList.toggle('active', page.id === id);
        });

        buttons.forEach(function (button) {
            var isCurrent = button.getAttribute('data-page') === id;
            button.classList.toggle('active', isCurrent);
            if (isCurrent) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });

        if (options && options.updateHash) {
            var hash = '#' + id;
            if (window.location.hash !== hash) {
                window.history.pushState({ page: id }, '', hash);
            }
        }
    }

    function idFromHash() {
        return (window.location.hash || '').replace(/^#\/?/, '').split('/')[0];
    }

    function init() {
        navEl = U.qs('#navbar');
        if (!navEl) return;

        buttons = U.qsa('button[data-page]', navEl);
        pages = U.qsa('.page');

        navEl.addEventListener('click', function (event) {
            var button = event.target.closest('button[data-page]');
            if (!button) return;
            event.preventDefault();
            show(button.getAttribute('data-page'), { updateHash: true });
        });

        window.addEventListener('popstate', function () {
            show(idFromHash() || 'home');
        });

        if (idFromHash()) show(idFromHash());
    }

    return {
        init: init,
        show: show
    };
})();
