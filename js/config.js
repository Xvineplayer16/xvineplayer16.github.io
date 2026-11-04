/**
 * config.js — the values you might actually want to change.
 * Loaded first; everything else hangs off window.Portfolio.
 */
window.Portfolio = window.Portfolio || {};

Portfolio.config = {
    discord: {
        // your discord user id (Lanyard requires you to be in their server:
        // https://discord.gg/lanyard)
        userId: '1380025909850935361',
        apiBase: 'https://api.lanyard.rest/v1/users',
        pollMs: 15000,
        timeoutMs: 8000
    },
    spotify: {
        tickMs: 1000
    },
    stack: {
        // minimum gap between wheel swaps, in ms
        wheelCooldownMs: 600
    },
    mobileWarning: {
        maxWidth: 1024
    }
};
