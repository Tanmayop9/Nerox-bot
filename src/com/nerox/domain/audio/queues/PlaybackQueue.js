/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description PlaybackQueue - Queue management for NeroxPlayer
 */

// Configuration constants
const MAX_PREVIOUS_TRACKS = 50;

export class PlaybackQueue extends Array {
    constructor() {
        super();
        this.current = null;
        this.previous = [];
    }

    get size() {
        return this.length;
    }

    get totalDuration() {
        let total = this.current?.duration || 0;
        for (const track of this) {
            total += track.duration || 0;
        }
        return total;
    }

    get isEmpty() {
        return this.length === 0;
    }

    add(track, position = null) {
        if (Array.isArray(track)) {
            if (position !== null && position >= 0) {
                this.splice(position, 0, ...track);
            } else {
                this.push(...track);
            }
            return this.length;
        }

        if (position !== null && position >= 0) {
            this.splice(position, 0, track);
        } else {
            this.push(track);
        }
        return this.length;
    }

    remove(index) {
        if (index < 0 || index >= this.length) return null;
        return this.splice(index, 1)[0];
    }

    clear() {
        this.previous = [];
        this.current = null;
        this.splice(0, this.length);
    }

    shuffle() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
        return this;
    }

    next() {
        if (this.current) {
            this.previous.push(this.current);
            // Keep only last N previous tracks
            if (this.previous.length > MAX_PREVIOUS_TRACKS) {
                this.previous.shift();
            }
        }
        this.current = this.shift() || null;
        return this.current;
    }

    back() {
        if (this.previous.length === 0) return null;
        if (this.current) {
            this.unshift(this.current);
        }
        this.current = this.previous.pop();
        return this.current;
    }
}
