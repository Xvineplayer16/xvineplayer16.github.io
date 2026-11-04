/**
 * activity-stack.js — the stacked activity cards.
 *
 * Cards are painted by index (active / next classes) instead of being moved
 * around the DOM, and the wheel + keyboard listeners are attached exactly once
 * to the container. The previous version cloned the container to get a fresh
 * wheel listener, which dropped every other listener with it.
 */
window.Portfolio = window.Portfolio || {};

Portfolio.stack = (function () {
    'use strict';

    var U = Portfolio.utils;
    var config = Portfolio.config;

    var stackEl = null;
    var container = null;
    var cards = [];
    var index = 0;
    var lastCycle = 0;

    function paint() {
        cards.forEach(function (card, i) {
            card.classList.toggle('active', i === index);
            card.classList.toggle('next', i === (index + 1) % cards.length);
        });
    }

    function cycle(direction) {
        if (cards.length < 2) return;
        index = (index + direction + cards.length) % cards.length;
        paint();
    }

    /** call after the cards are (re)rendered */
    function sync() {
        if (!container) return;
        cards = U.qsa('.activity-card', container);
        index = 0;
        paint();
    }

    function onWheel(event) {
        if (cards.length < 2) return;
        event.preventDefault();

        var now = Date.now();
        if (now - lastCycle < config.stack.wheelCooldownMs) return;
        lastCycle = now;

        cycle(event.deltaY > 0 ? 1 : -1);
    }

    function onKeydown(event) {
        var key = event.key;
        if (key === 'ArrowDown' || key === 'ArrowRight') {
            event.preventDefault();
            cycle(1);
        } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
            event.preventDefault();
            cycle(-1);
        }
    }

    function init() {
        stackEl = U.qs('#activity-stack');
        container = U.qs('#cards-container');
        if (!stackEl || !container) return;

        // passive:false because swapping cards takes over the wheel on purpose
        stackEl.addEventListener('wheel', onWheel, { passive: false });
        stackEl.addEventListener('keydown', onKeydown);
    }

    return {
        init: init,
        sync: sync
    };
})();
