var tokenize = require('./tokenize');
var emojis = require('../build/emoji.json');
var languageProcessor = require('./language-processor');

module.exports = {

    /**
     * Registers the specified language
     *
     * @param {String} languageCode
     *     - Two-digit code for the language to register
     * @param {Object} language
     *     - The language module to register
     */
    registerLanguage: function(languageCode, language) {
        languageProcessor.addLanguage(languageCode, language);
    },

    /**
     * Performs sentiment analysis on the provided input 'phrase'.
     *
     * @param {String} phrase
     *     - Input phrase
     * @param {Object} opts
     *     - Options
     * @param {Object} opts.language
     *     - Input language code (2 digit code), defaults to 'en'
     * @param {Object} opts.extras
     *     - Optional sentiment additions to AFINN (hash k/v pairs)
     * @param {function} callback
     *     - Optional callback
     * @return {Object}
     */
    analyze: function(phrase, opts, callback) {
        // Parse arguments
        if (typeof phrase === 'undefined') phrase = '';
        if (typeof opts === 'function') {
            callback = opts;
            opts = {};
        }
        opts = opts || {};

        var languageCode = opts.language || 'en';
        var labels = languageProcessor.getLabels(languageCode);

        // Add emojis unless explicitly excluded
        if (opts.emojis !== false) {
            Object.assign(labels, emojis);
        }

        // Merge extra labels
        if (typeof opts.extras === 'object') {
            labels = Object.assign(labels, opts.extras);
        }

        // Storage objects
        var tokens      = tokenize(phrase),
            score       = 0,
            words       = [],
            positive    = [],
            negative    = [];

        // Iterate over tokens
        var i = tokens.length;
        while (i--) {
            var obj = tokens[i];
            if (!labels.hasOwnProperty(obj)) continue;

            // Apply scoring strategy
            var tokenScore = labels[obj];
            tokenScore = languageProcessor.applyScoringStrategy(
                languageCode,
                tokens,
                i,
                tokenScore
            );

            words.push(obj);
            if (tokenScore > 0) positive.push(obj);
            if (tokenScore < 0) negative.push(obj);

            score += tokenScore;
        }

        var result = {
            score:          score,
            comparative:    tokens.length > 0 ? score / tokens.length : 0,
            tokens:         tokens,
            words:          words,
            positive:       positive,
            negative:       negative
        };

        // Handle optional async interface
        if (typeof callback === 'function') {
            process.nextTick(function () {
                callback(null, result);
            });
        } else {
            return result;
        }
    }
};
