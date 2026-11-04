/**
 * presence.js — live discord presence via Lanyard.
 *
 * Rendering is built from DOM nodes (see utils.el), so activity names, song
 * titles and custom statuses from the API can never inject markup.
 * Polling pauses while the tab is hidden and resumes immediately on return.
 */
window.Portfolio = window.Portfolio || {};

Portfolio.presence = (function () {
    'use strict';

    var U = Portfolio.utils;
    var config = Portfolio.config;

    var els = {};
    var pollTimer = null;
    var spotifyTimer = null;
    var request = null;
    var hasData = false;
    var started = false;

    var STATUS_CLASSES = {
        online: 'status-online',
        idle: 'status-idle',
        dnd: 'status-dnd'
    };

    function cacheElements() {
        els.headerName = U.qs('#header-name');
        els.displayName = U.qs('#profile-display-name');
        els.username = U.qs('#profile-username');
        els.avatar = U.qs('#profile-avatar');
        els.status = U.qs('#profile-status');
        els.bio = U.qs('#profile-bio');
        els.cards = U.qs('#cards-container');
        els.stack = U.qs('#activity-stack');
        els.stackLabel = U.qs('#stack-label');
        els.grid = U.qs('#home-grid');
    }

    /* ---------- avatar helpers ---------- */

    function avatarUrl(user) {
        var ext = (user.avatar || '').indexOf('a_') === 0 ? 'gif' : 'png';
        return 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.' + ext + '?size=128';
    }

    function setAvatar(user, name) {
        if (!els.avatar) return;
        if (user && user.id && user.avatar) {
            els.avatar.src = avatarUrl(user);
            els.avatar.alt = name + ' avatar';
            els.avatar.style.display = 'block';
        } else {
            els.avatar.removeAttribute('src');
            els.avatar.alt = '';
            els.avatar.style.display = 'none';
        }
    }

    /* ---------- profile ---------- */

    function renderProfile(data) {
        var user = data.discord_user || {};
        var name = user.display_name || user.username || '4';

        if (els.headerName) els.headerName.textContent = name;
        if (els.displayName) els.displayName.textContent = name;
        if (els.username) els.username.textContent = user.username ? '@' + user.username : '';

        setAvatar(user, name);

        if (els.status) {
            els.status.className = 'status-indicator';
            var statusClass = STATUS_CLASSES[data.discord_status];
            if (statusClass) els.status.classList.add(statusClass);
            els.status.title = 'discord status: ' + (data.discord_status || 'offline');
        }

        renderCustomStatus(data);
    }

    function renderCustomStatus(data) {
        if (!els.bio) return;
        U.clear(els.bio);

        var activities = Array.isArray(data.activities) ? data.activities : [];
        var custom = activities.filter(function (activity) { return activity.type === 4; })[0];
        if (!custom) return; // empty custom status keeps the panel clean

        if (custom.emoji) {
            if (custom.emoji.id) {
                els.bio.appendChild(U.el('img', {
                    class: 'emoji',
                    src: 'https://cdn.discordapp.com/emojis/' + custom.emoji.id + '.png',
                    alt: custom.emoji.name || 'emoji',
                    loading: 'lazy',
                    decoding: 'async'
                }));
            } else if (custom.emoji.name) {
                els.bio.appendChild(U.el('span', {
                    text: custom.emoji.name,
                    style: 'margin-right: 0.4rem;'
                }));
            }
        }

        if (custom.state) els.bio.appendChild(U.el('span', { text: custom.state }));
    }

    /* ---------- activity cards ---------- */

    function activityIcon(activity) {
        var assets = activity.assets;
        if (!assets || !assets.large_image) return null;

        var image = assets.large_image;
        var src;

        if (image.indexOf('mp:') === 0) {
            src = 'https://media.discordapp.net/' + image.slice(3);
        } else if (image.indexOf('http') === 0) {
            src = image;
        } else {
            src = 'https://cdn.discordapp.com/app-assets/' + activity.application_id + '/' + image + '.png';
        }

        return U.el('img', {
            class: 'activity-icon',
            src: src,
            alt: '',
            loading: 'lazy',
            decoding: 'async'
        });
    }

    function activityCard(label, name, lines, icon) {
        var details = U.el('div', { class: 'activity-details' }, [
            U.el('h3', { text: name })
        ]);

        lines.forEach(function (line, i) {
            if (!line) return;
            details.appendChild(U.el('p', {
                class: i === 0 ? 'activity-line' : 'activity-line sub',
                text: line
            }));
        });

        return U.el('article', { class: 'activity-card' }, [
            U.el('div', { class: 'activity-type', text: label }),
            U.el('div', { class: 'activity-content' }, [icon, details])
        ]);
    }

    function spotifyCard(spotify) {
        var fill = U.el('div', { class: 'spotify-progress-fill' });
        var current = U.el('span', { text: '0:00' });
        var total = U.el('span', { text: '0:00' });

        var details = U.el('div', { class: 'activity-details' }, [
            U.el('h3', { text: spotify.song || 'listening on spotify' }),
            U.el('p', { class: 'activity-line', text: spotify.artist || '' }),
            U.el('div', { class: 'spotify-progress-container' }, [
                current,
                U.el('div', { class: 'spotify-progress-bar' }, [fill]),
                total
            ])
        ]);

        var card = U.el('article', { class: 'activity-card' }, [
            U.el('div', { class: 'activity-type', text: 'Listening to Spotify' }),
            U.el('div', { class: 'activity-content' }, [
                U.el('img', {
                    class: 'activity-icon',
                    src: spotify.album_art_url || '',
                    alt: '',
                    loading: 'lazy',
                    decoding: 'async'
                }),
                details
            ]),
            U.el('div', { class: 'spotify-lyrics' }, [
                U.el('p', { text: 'let me know, let me know, let me know' }),
                U.el('p', { class: 'highlight', text: 'let me know if you comfortable, ooh' }),
                U.el('p', { text: 'let me know, let me know, let me know' })
            ])
        ]);

        startSpotifyTimer(card, spotify.timestamps);
        return card;
    }

    function startSpotifyTimer(root, timestamps) {
        stopSpotifyTimer();

        var fill = U.qs('.spotify-progress-fill', root);
        var current = U.qs('.spotify-progress-container span', root);
        var total = U.qs('.spotify-progress-container span:last-child', root);

        var start = Number(timestamps && timestamps.start);
        var end = Number(timestamps && timestamps.end);
        var length = end - start;
        if (!isFinite(length) || length <= 0) return;

        var render = function () {
            var elapsed = U.clamp(Date.now() - start, 0, length);
            if (fill) fill.style.width = (elapsed / length) * 100 + '%';
            if (current) current.textContent = U.formatDuration(elapsed / 1000);
            if (total) total.textContent = U.formatDuration(length / 1000);
        };

        render();
        spotifyTimer = window.setInterval(render, config.spotify.tickMs);
    }

    function stopSpotifyTimer() {
        if (spotifyTimer) {
            window.clearInterval(spotifyTimer);
            spotifyTimer = null;
        }
    }

    function renderActivities(data) {
        if (!els.cards) return;

        stopSpotifyTimer();
        U.clear(els.cards);

        var activities = Array.isArray(data.activities) ? data.activities : [];
        var cards = [];

        if (data.listening_to_spotify && data.spotify) {
            cards.push(spotifyCard(data.spotify));
        }

        activities.forEach(function (activity) {
            if (activity.type === 2 || activity.type === 4) return; // spotify / custom status

            var label = activity.type === 0 ? 'Playing' : activity.type === 3 ? 'Watching' : 'Activity';
            cards.push(activityCard(label, activity.name || 'Activity', [activity.details, activity.state], activityIcon(activity)));
        });

        if (cards.length === 0) {
            if (els.stack) els.stack.style.display = 'none';
            if (els.grid) els.grid.classList.add('centered');
            return;
        }

        cards.forEach(function (card) { els.cards.appendChild(card); });

        if (els.stack) els.stack.style.display = 'block';
        if (els.grid) els.grid.classList.remove('centered');
        if (els.stackLabel) {
            els.stackLabel.textContent = cards.length > 1 ? 'Scroll to swap activities' : 'Current Activity';
        }

        Portfolio.stack.sync();
    }

    /* ---------- polling ---------- */

    function schedule() {
        window.clearTimeout(pollTimer);
        if (document.visibilityState === 'hidden') return;
        pollTimer = window.setTimeout(poll, config.discord.pollMs);
    }

    function markUnavailable() {
        if (hasData) return; // keep the last good presence on screen
        if (els.stackLabel) els.stackLabel.textContent = 'live presence unavailable';
    }

    function apply(payload) {
        hasData = true;
        renderProfile(payload);
        renderActivities(payload);
    }

    function poll() {
        if (request) return; // a request is already in flight

        var controller = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = window.setTimeout(function () {
            if (controller) controller.abort();
        }, config.discord.timeoutMs);

        request = fetch(config.discord.apiBase + '/' + config.discord.userId, {
            cache: 'no-store',
            signal: controller ? controller.signal : undefined
        });

        request
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (json) {
                if (!json || json.success !== true || !json.data) throw new Error('unexpected payload');
                apply(json.data);
            })
            .catch(function (error) {
                if (error && error.name === 'AbortError') return;
                markUnavailable();
            })
            .then(function () {
                window.clearTimeout(timer);
                request = null;
                schedule();
            });
    }

    function start() {
        if (started) return;
        started = true;

        cacheElements();
        poll();

        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                poll();
            } else {
                window.clearTimeout(pollTimer);
                stopSpotifyTimer();
            }
        });
    }

    return {
        start: start,
        refresh: poll
    };
})();
