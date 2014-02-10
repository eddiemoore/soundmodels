/**
 * @author Cliburn M. Solano
 * @email cliburn.solano@sonoport.com
 * @name core.filereader.LoadFile
 * @description Load file from a URL
 * @param {String} sLink The URL
 * @return {ArrayBuffer} An ArrayBuffer
 */
define(function() {

    "use strict";

    var _buffer;
    var _bSoundLoaded = false;
    var _context;

    /**
     * Check if a value is an integer
     * @param {Object} value
     * @returns {Boolean} Result of test
     */
    function _isInt(value) {

        var er = /^[0-9]+$/;

        if (er.test(value)) {

            return true;

        }

        return false;

    }

    /**
     * Check if sound is already loaded
     * @returns {Boolean} If sound is loaded
     */
    var _isSoundLoaded = function() {

        return _bSoundLoaded;

    };

    /**
     * Get a buffer from sound loaded
     * @param {type} nStart The start of the buffer to load
     * @param {type} nEnd The end of the buffer to load
     * @returns {AudioBuffer} The trimmed buffer
     */
    var _getBuffer = function(nStart, nEnd) {

        var aChannels = [];
        var nChannels = _buffer.numberOfChannels;
        var nLength = _buffer.length;
        var newBuffer;

        if (!_isInt(nStart)) {

            console.log("getBuffer Start parameter is not an integer");
            return;

        }

        for (var i = 0; i < nChannels; i++) {

            var aData = new Float32Array(_buffer.getChannelData(i));
            aChannels[i] = aData.subarray(nStart);

        }

        if (aChannels.length > 0) {

            nLength = aChannels[0].length;

        }

        newBuffer = _context.createBuffer(_buffer.numberOfChannels, nLength, _buffer.sampleRate);

        for (var j = 0; j < nChannels; j++) {

            newBuffer.getChannelData(j).set(aChannels[j]);

        }

        return newBuffer;

    };

    /**
     * Load a file based on the URI
     * @param {String} sLink The link of the file to load
     * @param {Context} context The Audio context
     */
    var _loadFile = function(sLink, context) {

        var request = new XMLHttpRequest();

        _bSoundLoaded = false;
        _context = context;

        request.open('GET', sLink, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {

            context.decodeAudioData(request.response, function(buffer) {

                console.log("File successfully loaded");

                _bSoundLoaded = true;
                _buffer = buffer;

            }, onError);

        };

        var onError = function() {

            console.log("Error loading URL");

        };

        request.send();

    };

    // Exposed methods
    return {

        load: _loadFile,
        isLoaded: _isSoundLoaded,
        getBuffer: _getBuffer

    };

});
