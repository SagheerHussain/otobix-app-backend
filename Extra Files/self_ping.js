// SelfPing.js
const axios = require('axios');

class SelfPing {
    constructor(url, intervalMinutes = 1) {
        this.url = url;
        this.interval = intervalMinutes * 60 * 1000; // convert to ms
        this.timer = null;
    }

    start() {
        if (!this.url) {
            console.error('[SelfPing] URL not provided');
            return;
        }

        this.timer = setInterval(async () => {
            try {
                const response = await axios.get(this.url);
                console.log(`[SelfPing] Ping successful at ${new Date().toISOString()}`);
            } catch (err) {
                console.error('[SelfPing] Ping failed:', err.message);
            }
        }, this.interval);

        console.log(`[SelfPing] Started pinging every ${this.interval / 60000} minutes`);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            console.log('[SelfPing] Stopped');
        }
    }
}

module.exports = SelfPing;
