/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description MediaTrack - Track representation for NeroxPlayer
 */

export class MediaTrack {
    constructor(data = {}) {
        this.title = data.title || 'Unknown';
        this.author = data.author || 'Unknown';
        this.uri = data.uri || data.url || '';
        this.identifier = data.identifier || this._extractIdentifier(this.uri);
        this.duration = data.duration || data.length || 0;
        this.thumbnail = data.thumbnail || data.artworkUrl || null;
        this.isStream = data.isStream || false;
        this.requester = data.requester || null;
        this.source = data.source || 'youtube';
        this.realUri = data.realUri || this.uri;
    }

    // Alias for duration
    get length() {
        return this.duration;
    }

    _extractIdentifier(uri) {
        if (!uri) return null;
        const ytMatch = uri.match(
            /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        );
        if (ytMatch) return ytMatch[1];
        return uri.split('/').pop()?.split('?')[0] || null;
    }

    toJSON() {
        return {
            title: this.title,
            author: this.author,
            uri: this.uri,
            identifier: this.identifier,
            duration: this.duration,
            thumbnail: this.thumbnail,
            isStream: this.isStream,
            source: this.source,
        };
    }
}
