/**
 * Loader component for images.
 *
 * @author Thomas Rudolph <me@holloway-web.de>
 * @since 2016.12.27
 * @returns {{addImage: addImage, getImage: getImage, getLoadedImagesCnt: getLoadedImagesCnt}}
 * @constructor
 */
var ResourceLoader = function () {
    var images = {};
    var loadedImagesCnt = 0;
    var loadedSoundsCnt = 0;
    var soundExtension;
    var sounds = {};
    var totalImagesCnt = 0;
    var totalSoundsCnt = 0;

    init();

    return {
        'addImage': addImage,
        'addSound': addSound,
        'getImage': getImage,
        'getLoadedImagesCnt': getLoadedImagesCnt,
        'getLoadedSoundsCnt': getLoadedSoundsCnt,
        'getTotalImagesCnt': getTotalImagesCnt,
        'getTotalSoundsCnt': getTotalSoundsCnt,
        'isFullyLoaded': isFullyLoaded
    };

    /**
     * Add an image to the loading queue.
     *
     * @param {string} key
     * @param {string} source
     * @returns {Image|null}
     */
    function addImage(key, source) {
        if (images[key]) {
            return null;
        }

        totalImagesCnt++;
        images[key] = new Image();
        images[key].onload = onImageLoaded;
        images[key].src = source;

        return images[key];
    }

    /**
     * Add a sound to the loading queue.
     *
     * @param {string} key
     * @param {string} source
     * @returns {Audio|null}
     */
    function addSound(key, source) {
        if (sounds[key] || !soundExtension) {
            return null;
        }

        totalSoundsCnt++;
        sounds[key] = new Audio();
        //noinspection SpellCheckingInspection
        sounds[key].addEventListener('canplaythrough', onSoundLoaded);
        sounds[key].src = source + soundExtension;

        return sounds[key];
    }

    /**
     * Return the image for the given key.
     *
     * @param {string} key
     * @returns {Image|null}
     */
    function getImage(key) {
        if (images[key]) {
            return images[key];
        }

        return null;
    }

    /**
     * Return number of loaded images.
     *
     * @returns {number}
     */
    function getLoadedImagesCnt() {
        return loadedImagesCnt;
    }

    /**
     * Return number of loaded sounds.
     *
     * @returns {number}
     */
    function getLoadedSoundsCnt() {
        return loadedSoundsCnt;
    }

    /**
     * Return number of all images.
     *
     * @returns {number}
     */
    function getTotalImagesCnt() {
        return totalImagesCnt;
    }

    /**
     * Return number of all sounds.
     *
     * @returns {number}
     */
    function getTotalSoundsCnt() {
        return totalSoundsCnt;
    }

    function init() {
        var audio = document.createElement('audio');
        var mp3Support;
        var oggSupport;

        if (audio.canPlayType) {
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs = "vorbis"');
        } else {
            mp3Support = false;
            oggSupport = false;
        }

        soundExtension = oggSupport ? '.ogg' : (mp3Support ? '.mp3' : undefined);
    }

    /**
     * Return if all resources are loaded.
     *
     * @returns {boolean}
     */
    function isFullyLoaded() {
        return loadedImagesCnt == totalImagesCnt && loadedSoundsCnt == totalSoundsCnt;
    }

    /**
     * Callback when image was loaded.
     */
    function onImageLoaded() {
        loadedImagesCnt++;
    }

    /**
     * Callback when sound was loaded.
     */
    function onSoundLoaded() {
        loadedSoundsCnt++;
    }
};
window.ImageLoader = ResourceLoader;
