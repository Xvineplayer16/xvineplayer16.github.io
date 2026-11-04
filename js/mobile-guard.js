/**
 * mobile-guard.js — the "not mobile friendly" notice.
 * Shown once on a small / touch / portrait viewport, dismissable with the
 * button or Escape, and never re-shown after dismissal.
 */
window.Portfolio = window.Portfolio || {};

Portfolio.mobileGuard = (function () {
    'use strict';

    var U = Portfolio.utils;
    var config = Portfolio.config;

    var overlay = null;
    var button = null;
    var dismissed = false;
    var resizeTimer = null;

    function isMobileDevice() {
        var ua = navigator.userAgent || '';
        var uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS/i.test(ua);
        var smallScreen = window.innerWidth <= config.mobileWarning.maxWidth;
        var portrait = window.innerHeight > window.innerWidth;
        return uaMobile || smallScreen || portrait;
    }

    function show() {
        if (!overlay || dismissed) return;
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        if (button) button.focus({ preventScroll: true });
    }

    function hide() {
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        dismissed = true;
    }

    function init() {
        overlay = U.qs('#mobile-warning');
        button = U.qs('#dismiss-warning');
        if (!overlay) return;

        if (button) button.addEventListener('click', hide);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !dismissed) hide();
        });

        if (isMobileDevice()) show();

        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                if (!dismissed && isMobileDevice()) show();
            }, 150);
        }, { passive: true });
    }

    return {
        init: init,
        hide: hide
    };
})();
