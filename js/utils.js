/**
 * utils.js — tiny helpers shared by every module.
 * Everything returns real DOM nodes, so nothing from the API is ever parsed
 * as HTML.
 */
window.Portfolio = window.Portfolio || {};

Portfolio.utils = (function () {
    'use strict';

    function qs(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function qsa(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function clear(node) {
        if (!node) return node;
        while (node.firstChild) node.removeChild(node.firstChild);
        return node;
    }

    /**
     * el('div', { class: 'x', text: 'hi' }, [childNode, 'text'])
     * Values are set as attributes / textContent, never as innerHTML.
     */
    function el(tag, props, children) {
        var node = document.createElement(tag);

        if (props) {
            Object.keys(props).forEach(function (key) {
                var value = props[key];
                if (value === null || value === undefined || value === false) return;
                if (key === 'class') node.className = value;
                else if (key === 'text') node.textContent = String(value);
                else node.setAttribute(key, String(value));
            });
        }

        (children || []).forEach(function (child) {
            if (child === null || child === undefined || child === false) return;
            node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });

        return node;
    }

    /** seconds -> "m:ss" */
    function formatDuration(totalSeconds) {
        var seconds = Math.floor(Number(totalSeconds));
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        var minutes = Math.floor(seconds / 60);
        var rest = seconds % 60;
        return minutes + ':' + (rest < 10 ? '0' : '') + rest;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    return {
        qs: qs,
        qsa: qsa,
        clear: clear,
        el: el,
        formatDuration: formatDuration,
        clamp: clamp,
        prefersReducedMotion: prefersReducedMotion
    };
})();
