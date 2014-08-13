/*javascript-sound-models - v1.1.2-0 - Wed Aug 13 2014 12:18:08 GMT+0800 (SGT) */ 
console.log("   ____                           __ \n" + "  / _____  ___ ___  ___ ___  ____/ /_\n" + " _\\ \\/ _ \\/ _ / _ \\/ _ / _ \\/ __/ __/\n" + "/___/\\___/_//_\\___/ .__\\___/_/  \\__/ \n" + "                 /_/                 \n" + "Hello Developer!\n" + "Thanks for using Sonoport Dynamic Sound Library v1.1.2-0.");
/**
 * A structure for static configuration options.
 *
 * @module Core
 * @class Config
 */
define( 'core/Config',[],
    function () {
        

        function Config() {}

        /**
         * Define if Errors are logged using errorception.
         *
         * @final
         * @static
         * @property LOG_ERRORS
         * @default true
         *
         */
        Config.LOG_ERRORS = true;

        /**
         * Very small number considered non-zero by WebAudio.
         *
         * @final
         * @static
         * @property ZERO
         * @default 1e-37
         *
         */
        Config.ZERO = parseFloat( "1e-37" );

        /**
         * Maximum number of voices supported
         *
         * @final
         * @static
         * @property MAX_VOICES
         * @default 8
         *
         */
        Config.MAX_VOICES = 8;

        /**
         * Default nominal refresh rate (Hz) for SoundQueue.
         *
         * @final
         * @static
         * @property NOMINAL_REFRESH_RATE
         * @default 60
         *
         */
        Config.NOMINAL_REFRESH_RATE = 60;

        /**
         * Default window length for window and add functionality
         *
         * @final
         * @static
         * @property NOMINAL_REFRESH_RATE
         * @default 512
         *
         */
        Config.WINDOW_LENGTH = 512;

        /**
         * Default Chunk Length for ScriptNodes.
         *
         * @final
         * @static
         * @property CHUNK_LENGTH
         * @default 256
         *
         */
        Config.CHUNK_LENGTH = 256;

        return Config;
    } );

/**
 * @module Core
 *
 * @class WebAudioDispatch
 * @static
 */
define( 'core/WebAudioDispatch',[],
    function () {
        
        /**
         * Helper class to dispatch manual syncronized calls to for WebAudioAPI. This is to be used for API calls which can't don't take in a time argument and hence are inherently Syncronized.
         *
         *
         * @method WebAudioDispatch
         * @param {Function} Function to be called at a specific time in the future.
         * @param {Number} TimeStamp at which the above function is to be called.
         * @param {String} audioContext AudioContext to be used for timing.
         */

        function WebAudioDispatch( functionCall, time, audioContext ) {
            if ( !audioContext ) {
                console.warn( "No AudioContext provided" );
                return;
            }
            var currentTime = audioContext.currentTime;
            // Dispatch anything that's scheduled for anything before current time, current time and the next 5 msecs
            if ( currentTime >= time || time - currentTime < 0.005 ) {
                //console.log( "Dispatching now" );
                functionCall();
            } else {
                //console.log( "Dispatching in ", ( time - currentTime ) * 1000 );
                window.setTimeout( function () {
                    //console.log( "Diff at dispatch ", ( time - audioContext.currentTime ) * 1000 );
                    functionCall();
                }, ( time - currentTime ) * 1000 );
            }
        }

        return WebAudioDispatch;
    }
);

/**
 *
 *
 * @module Core
 *
 */
define(
    'core/AudioContextMonkeyPatch',[],function () {
        

        /*
         *  MonkeyPatch for AudioContext. Normalizes AudioContext across browsers and implementations.
         *
         * @class AudioContextMonkeyPatch
         */

        function fixSetTarget( param ) {
            if ( !param ) { // if NYI, just return
                return;
            }
            if ( !param.setTargetAtTime ) {
                param.setTargetAtTime = param.setTargetValueAtTime;
            }
        }
        if ( window.hasOwnProperty( 'webkitAudioContext' ) && !window.hasOwnProperty( 'AudioContext' ) ) {
            window.AudioContext = webkitAudioContext;
            if ( !AudioContext.prototype.hasOwnProperty( 'createGain' ) ) {
                AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
            }
            if ( !AudioContext.prototype.hasOwnProperty( 'createDelay' ) ) {
                AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
            }
            if ( !AudioContext.prototype.hasOwnProperty( 'createScriptProcessor' ) ) {
                AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
            }
            AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
            AudioContext.prototype.createGain = function () {
                var node = this.internal_createGain();
                fixSetTarget( node.gain );
                return node;
            };
            AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
            AudioContext.prototype.createDelay = function ( maxDelayTime ) {
                var node = maxDelayTime ? this.internal_createDelay( maxDelayTime ) : this.internal_createDelay();
                fixSetTarget( node.delayTime );
                return node;
            };
            AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
            AudioContext.prototype.createBufferSource = function () {
                var node = this.internal_createBufferSource();
                if ( !node.start ) {
                    node.start = function ( when, offset, duration ) {
                        if ( offset || duration ) {
                            this.noteGrainOn( when, offset, duration );
                        } else {
                            this.noteOn( when );
                        }
                    };
                }
                if ( !node.stop ) {
                    node.stop = node.noteOff;
                }
                fixSetTarget( node.playbackRate );
                return node;
            };
            AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
            AudioContext.prototype.createDynamicsCompressor = function () {
                var node = this.internal_createDynamicsCompressor();
                fixSetTarget( node.threshold );
                fixSetTarget( node.knee );
                fixSetTarget( node.ratio );
                fixSetTarget( node.reduction );
                fixSetTarget( node.attack );
                fixSetTarget( node.release );
                return node;
            };
            AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
            AudioContext.prototype.createBiquadFilter = function () {
                var node = this.internal_createBiquadFilter();
                fixSetTarget( node.frequency );
                fixSetTarget( node.detune );
                fixSetTarget( node.Q );
                fixSetTarget( node.gain );
                return node;
            };
            if ( AudioContext.prototype.hasOwnProperty( 'createOscillator' ) ) {
                AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
                AudioContext.prototype.createOscillator = function () {
                    var node = this.internal_createOscillator();
                    if ( !node.start ) {
                        node.start = node.noteOn;
                    }
                    if ( !node.stop ) {
                        node.stop = node.noteOff;
                    }
                    fixSetTarget( node.frequency );
                    fixSetTarget( node.detune );
                    return node;
                };
            }
        }
    } );

/**
 * @module Core
 */
define( 'core/BaseSound',[ 'core/WebAudioDispatch', 'core/AudioContextMonkeyPatch' ], function ( webAudioDispatch ) {
    

    /**
     * Pseudo AudioNode class the encapsulates basic functionality of an Audio Node. To be extended by all other Sound Models
     *
     * @class BaseSound
     * @constructor
     * @requires AudioContextMonkeyPatch
     * @param {AudioContext} [context] AudioContext in which this Sound is defined.
     */
    function BaseSound( context ) {
        /**
         * Web Audio API's AudioContext. If the context passed to the constructor is an AudioContext, a new one is created here.
         *
         * @property audioContext
         * @type AudioContext
         */
        if ( context === undefined || context === null ) {
            console.log( "Making a new AudioContext" );
            this.audioContext = new AudioContext();
        } else {
            this.audioContext = context;
        }

        bootAudioContext( this.audioContext );

        /**
         * Number of inputs
         *
         * @property numberOfInputs
         * @type Number
         * @default 0
         */
        this.numberOfInputs = 0;

        /**
         * Number of outputs
         *
         * @property numberOfOutputs
         * @type Number
         * @default 0
         */
        Object.defineProperty( this, 'numberOfOutputs', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.releaseGainNode.numberOfOutputs;
            }
        } );

        /**
         *Maximum number of sources that can be given to this Sound
         *
         * @property maxSources
         * @type Number
         * @default 0
         */
        var maxSources_ = 0;
        Object.defineProperty( this, 'maxSources', {
            enumerable: true,
            configurable: false,
            set: function ( max ) {
                if ( max < 0 ) {
                    max = 0;
                }
                maxSources_ = Math.round( max );
            },
            get: function () {
                return maxSources_;
            }
        } );

        /**
         *Minimum number of sources that can be given to this Sound
         *
         * @property minSources
         * @type Number
         * @default 0
         */
        var minSources_ = 0;
        Object.defineProperty( this, 'minSources', {
            enumerable: true,
            configurable: false,
            set: function ( max ) {
                if ( max < 0 ) {
                    max = 0;
                }
                minSources_ = Math.round( max );
            },
            get: function () {
                return minSources_;
            }
        } );

        /**
         * Release Gain Node
         *
         * @property releaseGainNode
         * @type GainNode
         * @default Internal GainNode
         * @final
         */
        this.releaseGainNode = this.audioContext.createGain();

        /**
         *  If Sound is currently playing.
         *
         * @property isPlaying
         * @type Boolean
         * @default false
         */
        this.isPlaying = false;

        /**
         *  If Sound is currently initialized.
         *
         * @property isInitialized
         * @type Boolean
         * @default false
         */
        this.isInitialized = false;

        /**
         * The input node that the output node will be connected to. <br />
         * Set this value to null if no connection can be made on the input node
         *
         * @property inputNode
         * @type Object
         * @default null
         **/
        this.inputNode = null;

        /**
         * String name of the model.
         *
         * @property modelName
         * @type String
         * @default "Model"
         **/
        this.modelName = "Model";

        /**
         * Callback for handling progress events thrown during loading of audio files.
         *
         * @property onLoadProgress
         * @type Function
         * @default null
         */
        this.onLoadProgress = null;

        /**
         * Callback for when loading of audio files is done and the the model is initalized.
         *
         * @property onLoadComplete
         * @type Function
         * @default null
         */
        this.onLoadComplete = null;

        /**
         * Callback for when the audio is about to start playing.
         *
         * @property onAudioStart
         * @type Function
         * @default null
         */
        this.onAudioStart = null;

        /**
         * Callback for the audio is about to stop playing.
         *
         * @property onAudioEnd
         * @type Function
         * @default null
         */
        this.onAudioEnd = null;

        this.releaseGainNode.connect( this.audioContext.destination );

        function bootAudioContext( context ) {

            var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );

            function createDummyOsc() {
                //console.log( "Booting ", context );
                bootOsc.start( 0 );
                bootOsc.stop( context.currentTime + 0.0001 );
                window.liveAudioContexts.push( context );
                window.removeEventListener( 'touchstart', createDummyOsc );
            }

            if ( iOS ) {
                if ( !window.liveAudioContexts ) {
                    window.liveAudioContexts = [];
                }
                if ( window.liveAudioContexts.indexOf( context ) < 0 ) {
                    var bootOsc = context.createOscillator();
                    var bootGain = context.createGain();
                    bootGain.gain.value = 0;
                    bootOsc.connect( bootGain );
                    bootGain.connect( context.destination );
                    window.addEventListener( 'touchstart', createDummyOsc );
                }
            }
        }
    }

    /**
     * Registers a Parameter to the model. This ensures that the Parameter is unwritable and allows
     * to lock in the configurability of the object.
     *
     * @param  {SPAudioParam} audioParam
     */
    BaseSound.prototype.registerParameter = function ( audioParam, configurable ) {

        if ( configurable === undefined || configurable === null ) {
            configurable = false;
        }

        Object.defineProperty( this, audioParam.name, {
            enumerable: true,
            configurable: configurable,
            value: audioParam
        } );
    };

    /**
     * If the parameter `output` is an AudioNode, it connects to the releaseGainNode.
     * If the output is a BaseSound, it will connect BaseSound's releaseGainNode to the output's inputNode.
     *
     * @method connect
     * @param {AudioNode} destination AudioNode to connect to.
     * @param {Number} [output] Index describing which output of the AudioNode from which to connect.
     * @param {Number} [input] Index describing which input of the destination AudioNode to connect to.
     */
    BaseSound.prototype.connect = function ( destination, output, input ) {
        if ( destination instanceof AudioNode ) {
            this.releaseGainNode.connect( destination, output, input );
        } else if ( destination.inputNode instanceof AudioNode ) {
            this.releaseGainNode.connect( destination.inputNode, output, input );
        } else {
            console.error( "No Input Connection - Attempts to connect " + ( typeof output ) + " to " + ( typeof this ) );
        }
    };

    /**
     * Disconnects the Sound from the AudioNode Chain.
     *
     * @method disconnect
     * @param {Number} [outputIndex] Index describing which output of the AudioNode to disconnect.
     **/
    BaseSound.prototype.disconnect = function ( outputIndex ) {
        this.releaseGainNode.disconnect( outputIndex );
    };

    /**
     * Start the AudioNode. Abstract method. Override this method when a Node is defined.
     *
     * @method start
     * @param {Number} when Time (in seconds) when the sound should start playing.
     * @param {Number} [offset] The starting position of the playhead
     * @param {Number} [duration] Duration of the portion (in seconds) to be played
     * @param {Number} [attackDuration] Duration (in seconds) of attack ramp of the envelope.
     */
    BaseSound.prototype.start = function ( when, offset, duration, attackDuration ) {
        if ( typeof when === "undefined" || when < this.audioContext.currentTime ) {
            when = this.audioContext.currentTime;
        }

        this.releaseGainNode.gain.cancelScheduledValues( when );
        if ( typeof attackDuration !== 'undefined' ) {
            //console.log( "Ramping from " + offset + "  in " + attackDuration );
            this.releaseGainNode.gain.setValueAtTime( 0, when );
            this.releaseGainNode.gain.linearRampToValueAtTime( 1, when + attackDuration );
        } else {
            this.releaseGainNode.gain.setValueAtTime( 1, when );
        }

        var self = this;
        webAudioDispatch( function () {
            self.isPlaying = true;
        }, when, this.audioContext );
    };

    /**
     * Stop the AudioNode. Abstract method. Override this method when a Node is defined.
     *
     * @method stop
     * @param {Number} [when] Time (in seconds) the sound should stop playing
     */
    BaseSound.prototype.stop = function ( when ) {
        if ( typeof when === "undefined" || when < this.audioContext.currentTime ) {
            when = this.audioContext.currentTime;
        }

        var self = this;
        webAudioDispatch( function () {
            self.isPlaying = false;
        }, when, this.audioContext );

        // cancel all scheduled ramps on this releaseGainNode
        this.releaseGainNode.gain.cancelScheduledValues( when );
    };

    /**
     * Linearly ramp down the gain of the audio in time (seconds) to 0.
     *
     * @method release
     * @param {Number} [when] Time (in seconds) at which the Envelope will release.
     * @param {Number} [fadeTime] Amount of time (seconds) it takes for linear ramp down to happen.
     * @param {Boolean} [stopOnRelease] Boolean to define if release stops (resets) the playback or just pauses it.
     */
    BaseSound.prototype.release = function ( when, fadeTime, stopOnRelease ) {

        if ( this.isPlaying ) {
            var FADE_TIME = 0.5;
            var FADE_TIME_PAD = 1 / this.audioContext.sampleRate;

            if ( typeof when === "undefined" || when < this.audioContext.currentTime ) {
                when = this.audioContext.currentTime;
            }

            fadeTime = fadeTime || FADE_TIME;
            // Clamp the current gain value at this point of time to prevent sudden jumps.
            this.releaseGainNode.gain.setValueAtTime( this.releaseGainNode.gain.value, when );

            // Now there won't be any glitch and there is a smooth ramp down.
            this.releaseGainNode.gain.linearRampToValueAtTime( 0, when + fadeTime );

            // Pause the sound after currentTime + fadeTime + FADE_TIME_PAD
            if ( stopOnRelease ) {
                this.stop( when + FADE_TIME + FADE_TIME_PAD );
            } else {
                var self = this;
                webAudioDispatch( function () {
                    self.pause();
                }, when + fadeTime, this.audioContext );
            }
        }
    };

    /**
     * Reinitializes the model and sets it's sources.
     *
     * @method setSources
     * @param {Array/AudioBuffer/String/File} sources Single or Array of either URLs or AudioBuffers or File Objects of the audio sources.
     * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
     * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
     */
    BaseSound.prototype.setSources = function ( sources, onLoadProgress, onLoadComplete ) {
        this.isInitialized = false;

        if ( typeof onLoadProgress === 'function' ) {
            this.onLoadProgress = onLoadProgress;
        }

        if ( typeof onLoadComplete === 'function' ) {
            this.onLoadComplete = onLoadComplete;
        }
    };

    /**
     * Play sound. Abstract method. Override this method when a Node is defined.
     *
     * @method play
     */
    BaseSound.prototype.play = function () {
        this.start( 0 );
    };

    /**
     * Pause sound. Abstract method. Override this method when a Node is defined.
     *
     * @method pause
     */
    BaseSound.prototype.pause = function () {
        this.isPlaying = false;
    };

    /**
     * List all SPAudioParams this Sound exposes
     *
     * @method listParams
     * @param {Array} [paramArray] Array of all the SPAudioParams this Sound exposes.
     */
    BaseSound.prototype.listParams = function () {
        var paramList = [];

        for ( var paramName in this ) {
            if ( this.hasOwnProperty( paramName ) ) {
                var param = this[ paramName ];
                // Get properties that are of SPAudioParam
                if ( param && param.hasOwnProperty( "value" ) && param.hasOwnProperty( "minValue" ) && param.hasOwnProperty( "maxValue" ) ) {
                    paramList.push( param );
                }
            }
        }
        return paramList;
    };

    // Return constructor function
    return BaseSound;
} );

/*
 ** @module Core
 */
define(
    'core/SPAudioParam',[ 'core/WebAudioDispatch' ],
    function ( webAudioDispatch ) {
        
        /**
         * Mock AudioParam used to create Parameters for Sonoport Sound Models. The SPAudioParam supports either a AudioParam backed parameter, or a completely Javascript mocked up Parameter, which supports a rough version of parameter automation.
         *
         *
         * @class SPAudioParam
         * @constructor
         * @param {String} [name] The name of the parameter.
         * @param {Number} [minValue] The minimum value of the parameter.
         * @param {Number} [maxValue] The maximum value of the parameter.
         * @param {Number} [defaultValue] The default and starting value of the parameter.
         * @param {AudioParam/Array} [aParams] A WebAudio parameter which will be set/get when this parameter is changed.
         * @param {Function} [mappingFunction] A mapping function to map values between the mapped SPAudioParam and the underlying WebAudio AudioParam.
         * @param {Function} [setter] A setter function which can be used to set the underlying audioParam. If this function is undefined, then the parameter is set directly.
         * @param {AudioContext} [audioContext] A WebAudio AudioContext for timing.
         */
        function SPAudioParam( name, minValue, maxValue, defaultValue, aParams, mappingFunction, setter, audioContext ) {
            // Min diff between set and actual
            // values to stop updates.
            var MIN_DIFF = 0.0001;
            var UPDATE_INTERVAL_MS = 500;
            var intervalID_;

            var value_ = 0;

            /**
             * Initial value for the value attribute.
             *
             * @property defaultValue
             * @type Number/Boolean
             * @default 0
             */
            this.defaultValue = null;

            /**
             *  Maximum value which the value attribute can be set to.
             *
             *
             * @property maxValue
             * @type Number/Boolean
             * @default 0
             */
            this.maxValue = 0;

            /**
             * Minimum value which the value attribute can be set to.
             *
             * @property minValue
             * @type Number/Boolean
             * @default 0
             */

            this.minValue = 0;

            /**
             * Name of the Parameter.
             *
             * @property name
             * @type String
             * @default ""
             */

            this.name = "";

            /**
             * The parameter's value. This attribute is initialized to the defaultValue. If value is set during a time when there are any automation events scheduled then it will be ignored and no exception will be thrown.
             *
             *
             * @property value
             * @type Number/Boolean
             * @default 0
             */
            Object.defineProperty( this, 'value', {
                enumerable: true,
                configurable: false,
                set: function ( value ) {
                    // Sanitize the value with min/max
                    // bounds first.
                    if ( typeof value !== typeof defaultValue ) {
                        console.error( "Attempt to set a " + ( typeof defaultValue ) + " parameter to a " + ( typeof value ) + " value" );
                        return;
                    }
                    // Sanitize the value with min/max
                    // bounds first.
                    if ( typeof value === "number" ) {
                        if ( value > maxValue ) {
                            console.warn( this.name + ' clamping to max' );
                            value = maxValue;
                        } else if ( value < minValue ) {
                            console.warn( this.name + ' clamping to min' );
                            value = minValue;
                        }
                    }

                    // Map the value first
                    if ( typeof mappingFunction === 'function' ) {
                        // Map if mappingFunction is defined
                        value = mappingFunction( value );
                    }

                    // If setter exists, use that
                    if ( typeof setter === 'function' && audioContext ) {
                        setter( aParams, value, audioContext );
                    } else if ( aParams ) {
                        // else if param is defined, set directly
                        if ( aParams instanceof AudioParam ) {
                            aParams.value = value;
                        } else if ( aParams instanceof Array ) {
                            aParams.forEach( function ( thisParam ) {
                                thisParam.value = value;
                            } );
                        }
                    } else {
                        // Else if Psuedo param
                        window.clearInterval( intervalID_ );
                    }

                    // Set the value_ anyway.
                    value_ = value;
                },
                get: function () {
                    if ( aParams ) {
                        if ( aParams instanceof AudioParam ) {
                            return aParams.value;
                        } else if ( aParams instanceof Array ) {
                            // use a nominal Parameter to populate
                            return aParams[ 0 ].value;
                        }
                    }
                    return value_;
                }
            } );
            if ( aParams && ( aParams instanceof AudioParam || aParams instanceof Array ) ) {
                // Use a nominal Parameter to populate the values.
                var aParam = aParams[ 0 ] || aParams;
                this.defaultValue = aParam.defaultValue;
                this.minValue = aParam.minValue;
                this.maxValue = aParam.maxValue;
                this.value = aParam.defaultValue;
                this.name = aParam.name;
            }

            if ( name ) {
                this.name = name;
            }

            if ( typeof defaultValue !== 'undefined' ) {
                this.defaultValue = defaultValue;
                this.value = defaultValue;
            }

            if ( typeof minValue !== 'undefined' ) {
                this.minValue = minValue;
            }

            if ( typeof maxValue !== 'undefined' ) {
                this.maxValue = maxValue;
            }

            /**
             * Schedules a parameter value change at the given time.
             *
             * @method setValueAtTime
             * @param {Number} value The value parameter is the value the parameter will change to at the given time.
             * @param {Number} startTime The startTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             */
            this.setValueAtTime = function ( value, startTime ) {
                //console.log( "setting value " + value + " at time " + startTime + " for " + aParams );

                if ( typeof mappingFunction === 'function' ) {
                    value = mappingFunction( value );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.setValueAtTime( value, startTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.setValueAtTime( value, startTime );
                        } );
                    }
                } else {
                    // Horrible hack for the case we don't have access to
                    // a real AudioParam.
                    var self = this;
                    webAudioDispatch( function () {
                        self.value = value;
                    }, startTime, audioContext );
                }
            };

            /**
             * Start exponentially approaching the target value at the given time with a rate having the given time constant.
             *
             * During the time interval: T0 <= t < T1, where T0 is the startTime parameter and T1 represents the time of the event following this event (or infinity if there are no following events):
             *     v(t) = V1 + (V0 - V1) * exp(-(t - T0) / timeConstant)
             *
             * @method setTargetAtTime
             * @param {Number} target The target parameter is the value the parameter will start changing to at the given time.
             * @param {Number} startTime The startTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             * @param {Number} timeConstant The timeConstant parameter is the time-constant value of first-order filter (exponential) approach to the target value. The larger this value is, the slower the transition will be.
             */
            this.setTargetAtTime = function ( target, startTime, timeConstant ) {
                if ( typeof mappingFunction === 'function' ) {
                    target = mappingFunction( target );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.setTargetAtTime( target, startTime, timeConstant );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.setTargetAtTime( target, startTime, timeConstant );
                        } );
                    }
                } else {
                    // Horrible hack for the case we don't have access to
                    // a real AudioParam.
                    var self = this;
                    var initValue_ = self.value;
                    var initTime_ = audioContext.currentTime;
                    intervalID_ = window.setInterval( function () {
                        if ( audioContext.currentTime >= startTime ) {
                            self.value = target + ( initValue_ - target ) * Math.exp( -( audioContext.currentTime - initTime_ ) / timeConstant );
                            if ( Math.abs( self.value - target ) < MIN_DIFF ) {
                                window.clearInterval( intervalID_ );
                            }
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };
            /**
             * Sets an array of arbitrary parameter values starting at the given time for the given duration. The number of values will be scaled to fit into the desired duration.

             * During the time interval: startTime <= t < startTime + duration, values will be calculated:
             *
             *   v(t) = values[N * (t - startTime) / duration], where N is the length of the values array.
             *
             * @method setValueCurveAtTime
             * @param {Float32Array} values The values parameter is a Float32Array representing a parameter value curve. These values will apply starting at the given time and lasting for the given duration.
             * @param {Number} startTime The startTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             * @param {Number} duration The duration parameter is the amount of time in seconds (after the startTime parameter) where values will be calculated according to the values parameter.
             */
            this.setValueCurveAtTime = function ( values, startTime, duration ) {
                if ( typeof mappingFunction === 'function' ) {
                    for ( var index = 0; index < values.length; index++ ) {
                        values[ index ] = mappingFunction( values[ index ] );
                    }
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.setValueCurveAtTime( values, startTime, duration );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.setValueCurveAtTime( values, startTime, duration );
                        } );
                    }
                } else {
                    var self = this;
                    var initTime_ = audioContext.currentTime;
                    intervalID_ = window.setInterval( function () {
                        if ( audioContext.currentTime >= startTime ) {
                            var index = Math.floor( values.length * ( audioContext.currentTime - initTime_ ) / duration );
                            if ( index < values.length ) {
                                self.value = values[ index ];
                            } else {
                                window.clearInterval( intervalID_ );
                            }
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };

            /**
             * Schedules an exponential continuous change in parameter value from the previous scheduled parameter value to the given value.
             *
             * v(t) = V0 * (V1 / V0) ^ ((t - T0) / (T1 - T0))
             *
             * @method exponentialRampToValueAtTime
             * @param {Number} value The value parameter is the value the parameter will exponentially ramp to at the given time.
             * @param {Number} endTime The endTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             */
            this.exponentialRampToValueAtTime = function ( value, endTime ) {
                if ( typeof mappingFunction === 'function' ) {
                    value = mappingFunction( value );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.exponentialRampToValueAtTime( value, endTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.exponentialRampToValueAtTime( value, endTime );
                        } );
                    }
                } else {
                    var self = this;
                    var initValue_ = self.value;
                    var initTime_ = audioContext.currentTime;
                    if ( initValue_ === 0 ) {
                        initValue_ = 0.001;
                    }
                    intervalID_ = window.setInterval( function () {
                        var timeRatio = ( audioContext.currentTime - initTime_ ) / ( endTime - initTime_ );
                        self.value = initValue_ * Math.pow( value / initValue_, timeRatio );
                        if ( audioContext.currentTime >= endTime ) {
                            window.clearInterval( intervalID_ );
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };

            /**
             *Schedules a linear continuous change in parameter value from the previous scheduled parameter value to the given value.
             *
             * @method linearRampToValueAtTime
             * @param {Float32Array} value The value parameter is the value the parameter will exponentially ramp to at the given time.
             * @param {Number} endTime The endTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             */
            this.linearRampToValueAtTime = function ( value, endTime ) {
                if ( typeof mappingFunction === 'function' ) {
                    value = mappingFunction( value );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.linearRampToValueAtTime( value, endTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.linearRampToValueAtTime( value, endTime );
                        } );
                    }
                } else {
                    var self = this;
                    var initValue_ = self.value;
                    var initTime_ = audioContext.currentTime;
                    intervalID_ = window.setInterval( function () {
                        var timeRatio = ( audioContext.currentTime - initTime_ ) / ( endTime - initTime_ );
                        self.value = initValue_ + ( ( value - initValue_ ) * timeRatio );
                        if ( audioContext.currentTime >= endTime ) {
                            window.clearInterval( intervalID_ );
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };

            /**
             * Schedules a linear continuous change in parameter value from the previous scheduled parameter value to the given value.
             *
             * @method cancelScheduledValues
             * @param {Number} startTime The startTime parameter is the starting time at and after which any previously scheduled parameter changes will be cancelled.
             */
            this.cancelScheduledValues = function ( startTime ) {
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.cancelScheduledValues( startTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.cancelScheduledValues( startTime );
                        } );
                    }
                } else {
                    window.clearInterval( intervalID_ );
                }
            };
        }

        /**
         * Static helper method to create Psuedo parameters which are not connected to
        any WebAudio AudioParams.
         *
         * @method createPsuedoParam
         * @static
         * @return  SPAudioParam
         * @param {String} name The name of the parameter..
         * @param {Number} minValue The minimum value of the parameter.
         * @param {Number} maxValue The maximum value of the parameter.
         * @param {Number} defaultValue The default and starting value of the parameter.
         * @param {AudioContext} audioContext An audiocontext in which this model exists.
         */
        SPAudioParam.createPsuedoParam = function ( name, minValue, maxValue, defaultValue, audioContext ) {
            return new SPAudioParam( name, minValue, maxValue, defaultValue, null, null, null, audioContext );
        };

        return SPAudioParam;
    } );

/**
 * @module Core
 */
define( 'core/SPPlaybackRateParam',[],
    function () {
        

        /**
         * Wrapper around AudioParam playbackRate of SPAudioBufferSourceNode to help calculate the playbackPosition of the AudioBufferSourceNode.
         *
         * @class SPPlaybackRateParam
         * @constructor
         * @param {AudioParam} audioParam The playbackRate of a source AudioBufferSourceNode.
         * @param {AudioParam} counterParam The playbackRate of counter AudioBufferSourceNode.
         */
        function SPPlaybackRateParam( audioParam, counterParam ) {
            this.defaultValue = audioParam.defaultValue;
            this.maxValue = audioParam.maxValue;
            this.minValue = audioParam.minValue;
            this.name = audioParam.name;
            this.units = audioParam.units;

            Object.defineProperty( this, 'value', {
                enumerable: true,
                configurable: false,
                set: function ( rate ) {
                    audioParam.value = rate;
                    counterParam.value = rate;
                },
                get: function () {
                    return audioParam.value;
                }
            } );

            this.linearRampToValueAtTime = function ( value, endTime ) {
                audioParam.linearRampToValueAtTime( value, endTime );
                counterParam.linearRampToValueAtTime( value, endTime );
            };

            this.exponentialRampToValueAtTime = function ( value, endTime ) {
                audioParam.exponentialRampToValueAtTime( value, endTime );
                counterParam.exponentialRampToValueAtTime( value, endTime );

            };

            this.setValueCurveAtTime = function ( values, startTime, duration ) {
                audioParam.setValueCurveAtTime( values, startTime, duration );
                counterParam.setValueCurveAtTime( values, startTime, duration );
            };

            this.setTargetAtTime = function ( target, startTime, timeConstant ) {
                audioParam.setTargetAtTime( target, startTime, timeConstant );
                counterParam.setTargetAtTime( target, startTime, timeConstant );

            };

            this.setValueAtTime = function ( value, time ) {
                audioParam.setValueAtTime( value, time );
                counterParam.setValueAtTime( value, time );
            };

            this.cancelScheduledValues = function ( time ) {
                audioParam.cancelScheduledValues( time );
                counterParam.cancelScheduledValues( time );
            };
        }
        return SPPlaybackRateParam;
    } );

/**
 * @module Core
 */
define( 'core/SPAudioBufferSourceNode',[ 'core/SPPlaybackRateParam', 'core/WebAudioDispatch' ],
    function ( SPPlaybackRateParam, webAudioDispatch ) {
        

        /**
         * A wrapper around the AudioBufferSourceNode to be able to track the current playPosition of a AudioBufferSourceNode.
         *
         * @class SPAudioBufferSourceNode
         * @constructor
         * @param {AudioContext} AudioContext to be used in timing the parameter automation events
         */
        function SPAudioBufferSourceNode( audioContext ) {
            var bufferSourceNode = audioContext.createBufferSource();
            var counterNode = audioContext.createBufferSource();

            var scopeNode = audioContext.createScriptProcessor( 256, 1, 1 );
            var lastPos = 0;

            this.audioContext = audioContext;
            this.channelCount = bufferSourceNode.channelCount;
            this.channelCountMode = bufferSourceNode.channelCountMode;
            this.channelInterpretation = bufferSourceNode.channelInterpretation;
            this.numberOfInputs = bufferSourceNode.numberOfInputs;
            this.numberOfOutputs = bufferSourceNode.numberOfOutputs;
            this.playbackState = 0;

            /**
             * Playback States Constant.
             *
             * @property UNSCHEDULED_STATE
             * @type Number
             * @default "Model"
             **/
            this.UNSCHEDULED_STATE = 0;

            /**
             * Playback States Constant.
             *
             * @property SCHEDULED_STATE
             * @type Number
             * @default "1"
             **/
            this.SCHEDULED_STATE = 1;

            /**
             * Playback States Constant.
             *
             * @property PLAYING_STATE
             * @type Number
             * @default "2"
             **/
            this.PLAYING_STATE = 2;

            /**
             * Playback States Constant.
             *
             * @property FINISHED_STATE
             * @type Number
             * @default "3"
             **/
            this.FINISHED_STATE = 3;

            /**
             * The speed at which to render the audio stream. Its default value is 1. This parameter is a-rate.
             *
             * @property playbackRate
             * @type AudioParam
             * @default 1
             *
             */
            this.playbackRate = new SPPlaybackRateParam( bufferSourceNode.playbackRate, counterNode.playbackRate );

            /**
             * An optional value in seconds where looping should end if the loop attribute is true.
             *
             * @property loopEnd
             * @type Number
             * @default 0
             *
             */
            Object.defineProperty( this, 'loopEnd', {
                enumerable: true,
                configurable: false,
                set: function ( loopEnd ) {
                    bufferSourceNode.loopEnd = loopEnd;
                    counterNode.loopEnd = loopEnd;
                },
                get: function () {
                    return bufferSourceNode.loopEnd;
                }
            } );

            /**
             * An optional value in seconds where looping should begin if the loop attribute is true.
             *
             * @property loopStart
             * @type Number
             * @default 0
             *
             */
            Object.defineProperty( this, 'loopStart', {
                enumerable: true,
                configurable: false,
                set: function ( loopStart ) {
                    bufferSourceNode.loopStart = loopStart;
                    counterNode.loopStart = loopStart;
                },
                get: function () {
                    return bufferSourceNode.loopStart;
                }
            } );

            /**
             * A property used to set the EventHandler for the ended event that is dispatched to AudioBufferSourceNode node types
             *
             * @property onended
             * @type Function
             * @default null
             *
             */
            Object.defineProperty( this, 'onended', {
                enumerable: true,
                configurable: false,
                set: function ( onended ) {
                    bufferSourceNode.onended = wrapAroundOnEnded( this, onended );
                },
                get: function () {
                    return bufferSourceNode.onended;
                }
            } );

            /**
             * Indicates if the audio data should play in a loop.
             *
             * @property loop
             * @type Boolean
             * @default false
             *
             */
            Object.defineProperty( this, 'loop', {
                enumerable: true,
                configurable: false,
                set: function ( loop ) {
                    bufferSourceNode.loop = loop;
                    counterNode.loop = loop;
                },
                get: function () {
                    return bufferSourceNode.loop;
                }
            } );

            /**
             * Position (in seconds) of the last frame played back by the AudioContext
             *
             * @property playbackPosition
             * @type Number
             * @default 0
             *
             */
            Object.defineProperty( this, 'playbackPosition', {
                enumerable: true,
                configurable: false,
                get: function () {
                    return lastPos;
                }
            } );

            /**
             * Represents the audio asset to be played.
             *
             * @property buffer
             * @type AudioBuffer
             * @default null
             *
             */
            Object.defineProperty( this, 'buffer', {
                enumerable: true,
                configurable: false,
                set: function ( buffer ) {
                    bufferSourceNode.buffer = buffer;
                    counterNode.buffer = createCounterBuffer( buffer );
                },
                get: function () {
                    return bufferSourceNode.buffer;
                }
            } );

            /**
             * Connects the AudioNode to the input of another AudioNode.
             *
             * @method connect
             * @param {AudioNode} destination AudioNode to connect to.
             * @param {Number} [output] Index describing which output of the AudioNode from which to connect.
             * @param {Number} [input] Index describing which input of the destination AudioNode to connect to.
             *
             */
            this.connect = function ( destination, output, input ) {
                bufferSourceNode.connect( destination, output, input );
                scopeNode.connect( destination, output, input );
            };

            /**
             * Disconnects the AudioNode from the input of another AudioNode.
             *
             * @method disconnect
             * @param {Number} [output] Index describing which output of the AudioNode to disconnect.
             *
             */
            this.disconnect = function ( output ) {
                bufferSourceNode.disconnect( output );
                scopeNode.disconnect( output );
            };

            /**
             * Schedules a sound to playback at an exact time.
             *
             * @method start
             * @param {Number} when Time (in seconds) when the sound should start playing.
             * @param {Number} [offset] Offset time in the buffer (in seconds) where playback will begin
             * @param {Number} [duration] Duration of the portion (in seconds) to be played
             *
             */
            this.start = function ( when, offset, duration ) {
                if ( typeof duration == 'undefined' ) {
                    duration = bufferSourceNode.buffer.duration;
                }

                if ( this.playbackState === this.UNSCHEDULED_STATE ) {
                    bufferSourceNode.start( when, offset, duration );
                    counterNode.start( when, offset, duration );
                    this.playbackState = this.SCHEDULED_STATE;
                }

                var self = this;
                webAudioDispatch( function () {
                    self.playbackState = self.PLAYING_STATE;
                }, when, this.audioContext );
            };

            /**
             * Schedules a sound to stop playback at an exact time.
             *
             * @method stop
             * @param {Number} when Time (in seconds) when the sound should stop playing.
             *
             */
            this.stop = function ( when ) {
                if ( this.playbackState === this.PLAYING_STATE || this.playbackState === this.SCHEDULED_STATE ) {
                    bufferSourceNode.stop( when );
                    counterNode.stop( when );
                }
            };

            /**
             * Resets the SP Buffer Source with a fresh BufferSource.
             *
             * @method resetBufferSource
             * @param {Number} when Time (in seconds) when the Buffer source should be reset.
             * @param {AudioNode} output The output to which the BufferSource is to be connected.
             *
             */
            this.resetBufferSource = function ( when, output ) {

                var self = this;
                webAudioDispatch( function () {
                    self.disconnect( output );
                    var newSource = self.audioContext.createBufferSource();
                    newSource.buffer = bufferSourceNode.buffer;
                    newSource.loopStart = bufferSourceNode.loopStart;
                    newSource.loopEnd = bufferSourceNode.loopEnd;
                    newSource.onended = wrapAroundOnEnded( self, bufferSourceNode.onended );
                    bufferSourceNode = newSource;
                    var newCounterNode = audioContext.createBufferSource();
                    newCounterNode.buffer = counterNode.buffer;
                    newCounterNode.connect( scopeNode );
                    counterNode = newCounterNode;

                    var playBackRateVal = self.playbackRate.value;
                    self.playbackRate = new SPPlaybackRateParam( bufferSourceNode.playbackRate, counterNode.playbackRate );
                    self.playbackRate.setValueAtTime( playBackRateVal, 0 );
                    self.connect( output );
                    self.playbackState = self.UNSCHEDULED_STATE;
                }, when, this.audioContext );
            };

            // Private Methods

            function createCounterBuffer( buffer ) {
                var array = new Float32Array( buffer.length );
                var audioBuf = audioContext.createBuffer( 1, buffer.length, 44100 );

                for ( var index = 0; index < buffer.length; index++ ) {
                    array[ index ] = index;
                }

                audioBuf.getChannelData( 0 )
                    .set( array );
                return audioBuf;
            }

            function init() {
                counterNode.connect( scopeNode );
                scopeNode.onaudioprocess = savePosition;
            }

            function savePosition( processEvent ) {
                var inputBuffer = processEvent.inputBuffer.getChannelData( 0 );
                lastPos = inputBuffer[ inputBuffer.length - 1 ] || 0;
            }

            function wrapAroundOnEnded( node, onended ) {
                return function ( event ) {
                    node.playbackState = node.FINISHED_STATE;
                    if ( typeof onended === 'function' ) {
                        onended( event );
                    }
                };
            }

            init();

        }
        return SPAudioBufferSourceNode;
    } );

/**
 * @module Core
 */
define( 'core/DetectLoopMarkers',[],function () {
    

    /**
     * @class DetectLoopMarkers
     * @static
     */

    /**
    /**
     *Detector for Loop Marker or Silence. This method helps to detect and trim given AudioBuffer based on Sonoport Loop Markers or based on silence detection.
     *
     *
     * @class DetectLoopMarkers
     * @param {AudioBuffer} buffer A buffer to be trimmed to Loop Markers or Silence.
     * @return {Object} An object with `start` and `end` properties containing the index of the detected start and end points.
     */
    function DetectLoopMarkers( buffer ) {

        var nLoopStart_ = 0;
        var nLoopEnd_ = 0;
        var nMarked_ = true;

        /*
         * Length of PRE and POSTFIX Silence used in Loop Marking
         */
        var PREPOSTFIX_LEN = 5000;

        /*
         * Length of PRE and POSTFIX Silence used in Loop Marking
         */
        var DEFAULT_SAMPLING_RATE = 44100;

        /*
         * Threshold for Spike Detection in Loop Marking
         */
        var SPIKE_THRESH = 0.5;

        /*
         * Index bounds for searching for Loop Markers and Silence.
         */
        var MAX_MP3_SILENCE = 20000;

        /*
         * Threshold for Silence Detection
         */
        var SILENCE_THRESH = 0.01;

        /*
         * Length for which the channel has to be empty
         */
        var EMPTY_CHECK_LENGTH = 1024;

        /*
         * Length samples to ignore after the spike
         */
        var IGNORE_LENGTH = 16;

        /*
         * Array of all Channel Data
         */
        var channels_ = [];

        /*
         * Number of samples in the buffer
         */
        var numSamples_ = 0;

        /**
         * A helper method to help find the silence in across multiple channels
         *
         * @private
         * @method silenceCheckGenerator_
         * @param {Number} testIndex The index of the sample which is being checked.
         * @return {Function} A function which can check if the specific sample is beyond the silence threshold
         */
        var isChannelEmptyAfter = function ( channel, position ) {
            //console.log( "checking at " + position );
            var sum = 0;
            for ( var sIndex = position + IGNORE_LENGTH; sIndex < position + IGNORE_LENGTH + EMPTY_CHECK_LENGTH; ++sIndex ) {
                sum += Math.abs( channel[ sIndex ] );
            }

            return ( sum / EMPTY_CHECK_LENGTH ) < SILENCE_THRESH;
        };

        /**
         * A helper method to help find the spikes in across multiple channels
         *
         * @private
         * @method silenceCheckGenerator_
         * @param {Number} testIndex The index of the sample which is being checked.
         * @return {Function} A function which can check if the specific sample is beyond the spike threshold
         */
        var thresholdCheckGenerator_ = function ( testIndex ) {
            return function ( prev, thisChannel, index ) {
                var isSpike;
                if ( index % 2 === 0 ) {
                    isSpike = thisChannel[ testIndex ] > SPIKE_THRESH;
                } else {
                    isSpike = thisChannel[ testIndex ] < -SPIKE_THRESH;
                }
                return prev && isSpike;
            };
        };

        /**
         * A helper method to help find the markers in an Array of Float32Arrays made from an AudioBuffer.
         *
         * @private
         * @method findSilence_
         * @param {Array} channels An array of buffer data in Float32Arrays within which markers needs to be detected.
         * @return {Boolean} If Loop Markers were found.
         */
        var findMarkers_ = function ( channels ) {
            var startSpikePos = null;
            var endSpikePos = null;

            nLoopStart_ = 0;
            nLoopEnd_ = numSamples_;

            // Find marker near start of file
            var pos = 0;

            while ( startSpikePos === null && pos < numSamples_ && pos < MAX_MP3_SILENCE ) {
                if ( channels.reduce( thresholdCheckGenerator_( pos ), true ) &&
                    ( channels.length !== 1 || isChannelEmptyAfter( channels[ 0 ], pos ) ) ) {
                    // Only check for emptiness at the start to ensure that it's indeed marked
                    startSpikePos = pos;
                    break;
                } else {
                    pos++;
                }
            }

            // Find marker near end of file
            pos = numSamples_;

            while ( endSpikePos === null && pos > 0 && numSamples_ - pos < MAX_MP3_SILENCE ) {
                if ( channels.reduce( thresholdCheckGenerator_( pos ), true ) ) {
                    endSpikePos = pos;
                    break;
                } else {
                    pos--;
                }
            }
            // If both markers found
            var correctedPostfixLen = Math.round( ( PREPOSTFIX_LEN / 2 ) * buffer.sampleRate / DEFAULT_SAMPLING_RATE );
            if ( startSpikePos !== null && endSpikePos !== null && endSpikePos > startSpikePos + correctedPostfixLen ) {
                // Compute loop start and length
                nLoopStart_ = startSpikePos + correctedPostfixLen;
                nLoopEnd_ = endSpikePos - correctedPostfixLen;
                //console.log( "Found loop between " + nLoopStart_ + " - " + nLoopEnd_ );
                //console.log( "Spikes at  " + startSpikePos + " - " + endSpikePos );
                return true;
            } else {
                // Spikes not found!
                //console.log( "No loop found" );
                return false;
            }
        };

        /**
         * A helper method to help find the silence in across multiple channels
         *
         * @private
         * @method silenceCheckGenerator_
         * @param {Number} testIndex The index of the sample which is being checked.
         * @return {Function} A function which can check if the specific sample is beyond the silence threshold
         */
        var silenceCheckGenerator_ = function ( testIndex ) {
            return function ( prev, thisChannel ) {
                return prev && ( Math.abs( thisChannel[ testIndex ] ) < SILENCE_THRESH );
            };
        };

        /**
         * A helper method to help find the silence in an AudioBuffer. Used of Loop Markers are not
         * found in the AudioBuffer. Updates nLoopStart_ and nLoopEnd_ directly.
         *
         * @private
         * @method findSilence_
         * @param {Array} channels channel An array of buffer data in Float32Arrays within which silence needs to be detected.
         */
        var findSilence_ = function ( channels ) {

            var allChannelsSilent = true;

            nLoopStart_ = 0;
            while ( nLoopStart_ < MAX_MP3_SILENCE && nLoopStart_ < numSamples_ ) {

                allChannelsSilent = channels.reduce( silenceCheckGenerator_( nLoopStart_ ), true );

                if ( allChannelsSilent ) {
                    nLoopStart_++;
                } else {
                    break;
                }
            }

            nLoopEnd_ = numSamples_;
            while ( numSamples_ - nLoopEnd_ < MAX_MP3_SILENCE &&
                nLoopEnd_ > 0 ) {

                allChannelsSilent = channels.reduce( silenceCheckGenerator_( nLoopEnd_ ), true );

                if ( allChannelsSilent ) {
                    nLoopEnd_--;
                } else {
                    break;
                }
            }

            if ( nLoopEnd_ < nLoopStart_ ) {
                nLoopStart_ = 0;
            }
        };

        numSamples_ = buffer.length;
        for ( var index = 0; index < buffer.numberOfChannels; index++ ) {
            channels_.push( new Float32Array( buffer.getChannelData( index ) ) );
        }

        if ( ( !findMarkers_( channels_ ) ) ) {
            findSilence_( channels_ );
            nMarked_ = false;
        }

        // return the markers which were found
        return {
            marked: nMarked_,
            start: nLoopStart_,
            end: nLoopEnd_
        };
    }

    return DetectLoopMarkers;
} );

/**
 * @module Core
 */
define( 'core/FileLoader',[ 'core/DetectLoopMarkers' ],
    function ( detectLoopMarkers ) {
        

        /**
         * Load a single file from a URL or a File object.
         *
         * @class FileLoader
         * @constructor
         * @param {String/File} URL URL of the file to be Loaded
         * @param {String} context AudioContext to be used in decoding the file
         * @param {Function} [onloadCallback] Callback function to be called when the file loading is
         * @param {Function} [onProgressCallback] Callback function to access the progress of the file loading.
         */
        function FileLoader( URL, context, onloadCallback, onProgressCallback ) {
            if ( !( this instanceof FileLoader ) ) {
                throw new TypeError( "FileLoader constructor cannot be called as a function." );
            }
            var rawBuffer_;
            var loopStart_ = 0;
            var loopEnd_ = 0;

            var isSoundLoaded_ = false;

            // Private functions

            /**
             * Check if a value is an integer.
             * @method isInt_
             * @private
             * @param {Object} value
             * @return {Boolean} Result of test.
             */
            var isInt_ = function ( value ) {
                var er = /^[0-9]+$/;
                if ( er.test( value ) ) {
                    return true;
                }
                return false;
            };

            /**
             * Get a buffer based on the start and end markers.
             * @private
             * @method sliceBuffer
             * @param {Number} start The start of the buffer to load.
             * @param {Number} end The end of the buffer to load.
             * @return {AudioBuffer} The requested sliced buffer.
             */
            var sliceBuffer_ = function ( start, end ) {

                // Set end if it is missing
                if ( typeof end == "undefined" ) {
                    end = rawBuffer_.length;
                }
                // Verify parameters
                if ( !isInt_( start ) ) {
                    start = Number.isNan( start ) ? 0 : Math.round( Number( start ) );
                    console.warn( "Incorrect parameter Type - FileLoader getBuffer start parameter is not an integer. Coercing it to an Integer - start" );
                } else if ( !isInt_( end ) ) {
                    console.warn( "Incorrect parameter Type - FileLoader getBuffer end parameter is not an integer" );
                    end = Number.isNan( end ) ? 0 : Math.round( Number( end ) );
                }
                // Check if start is smaller than end
                if ( start > end ) {
                    console.error( "Incorrect parameter Type - FileLoader getBuffer start parameter " + start + " should be smaller than end parameter " + end + " . Setting them to the same value " + start );
                    end = start;
                }
                // Check if start is within the buffer size
                if ( start > loopEnd_ || start < loopStart_ ) {
                    console.error( "Incorrect parameter Type - FileLoader getBuffer start parameter should be within the buffer size : 0-" + rawBuffer_.length + " . Setting start to " + loopStart_ );
                    start = loopStart_;
                }

                // Check if end is within the buffer size
                if ( end > loopEnd_ || end < loopStart_ ) {
                    console.error( "Incorrect parameter Type - FileLoader getBuffer start parameter should be within the buffer size : 0-" + rawBuffer_.length + " . Setting start to " + loopEnd_ );
                    end = loopEnd_;
                }

                var length = end - start;

                if ( !rawBuffer_ ) {
                    console.error( "No Buffer Found - Buffer loading has not completed or has failed." );
                    return null;
                }

                // Create the new buffer
                var newBuffer = context.createBuffer( rawBuffer_.numberOfChannels, length, rawBuffer_.sampleRate );

                // Start trimming
                for ( var i = 0; i < rawBuffer_.numberOfChannels; i++ ) {
                    var aData = new Float32Array( rawBuffer_.getChannelData( i ) );
                    newBuffer.getChannelData( i )
                        .set( aData.subarray( start, end ) );
                }

                return newBuffer;
            };

            function init() {
                var parameterType = Object.prototype.toString.call( URL );
                var fileExtension = /[^.]+$/.exec( URL );
                if ( parameterType === '[object String]' ) {
                    var request = new XMLHttpRequest();
                    request.open( 'GET', URL, true );
                    request.responseType = 'arraybuffer';
                    request.addEventListener( "progress", onProgressCallback, false );
                    request.onload = function () {
                        decodeAudio( request.response, fileExtension );
                    };
                    request.send();
                } else if ( parameterType === '[object File]' || parameterType === '[object Blob]' ) {
                    var reader = new FileReader();
                    reader.addEventListener( "progress", onProgressCallback, false );
                    reader.onload = function () {
                        decodeAudio( reader.result, fileExtension );
                    };
                    reader.readAsArrayBuffer( URL );
                }

            }

            function decodeAudio( result, fileExt ) {
                context.decodeAudioData( result, function ( buffer ) {
                    isSoundLoaded_ = true;
                    rawBuffer_ = buffer;
                    // Do trimming if it is not a wave file
                    loopStart_ = 0;
                    loopEnd_ = rawBuffer_.length;
                    if ( fileExt[ 0 ] !== "wav" ) {
                        // Trim Buffer based on Markers
                        var markers = detectLoopMarkers( rawBuffer_ );
                        if ( markers ) {
                            loopStart_ = markers.start;
                            loopEnd_ = markers.end;
                        }
                    }
                    if ( onloadCallback && typeof onloadCallback === "function" ) {
                        onloadCallback( true );
                    }
                }, function () {
                    console.warn( "Error Decoding " + URL );
                    if ( onloadCallback && typeof onloadCallback === "function" ) {
                        onloadCallback( false );
                    }
                } );
            }

            // Public functions
            /**
             * Get the current buffer.
             * @method getBuffer
             * @param {Number} start The start index
             * @param {Number} end The end index
             * @return {AudioBuffer} The AudioBuffer that was marked then trimmed if it is not a wav file.
             */
            this.getBuffer = function ( start, end ) {
                // Set start if it is missing
                if ( typeof start == "undefined" ) {
                    start = 0;
                }
                // Set end if it is missing
                if ( typeof end == "undefined" ) {
                    end = loopEnd_ - loopStart_;
                }

                return sliceBuffer_( loopStart_ + start, loopStart_ + end );
            };

            /**
             * Get the original buffer.
             * @method getRawBuffer
             * @return {AudioBuffer} The original AudioBuffer.
             */
            this.getRawBuffer = function () {
                if ( !isSoundLoaded_ ) {
                    console.error( "No Buffer Found - Buffer loading has not completed or has failed." );
                    return null;
                }
                return rawBuffer_;
            };

            /**
             * Check if sound is already loaded.
             * @method isLoaded
             * @return {Boolean} True if file is loaded. Flase if file is not yeat loaded.
             */
            this.isLoaded = function () {
                return isSoundLoaded_;
            };

            // Make a request
            init();
        }

        return FileLoader;
    } );

/**
 * @module Core
 *
 * @class MuliFileLoader
 * @static
 */
define( 'core/MultiFileLoader',[ 'core/FileLoader' ],
    function ( FileLoader ) {
        

        /**
         * Helper class to loader multiple sounds from URL String, File or AudioBuffer Objects.
         *
         *
         * @method MuliFileLoader
         * @param {Array/String/File} sounds Array of or Individual String, AudioBuffer or File Objects which define the sounds to be loaded
         * @param {String} audioContext AudioContext to be used in decoding the file
         * @param {String} [onLoadProgress] Callback function to access the progress of the file loading.
         * @param {String} [onLoadComplete] Callback function to be called when all sounds are loaded
         */
        function MultiFileLoader( sounds, audioContext, onLoadProgress, onLoadComplete ) {

            //Private variables
            var self = this;
            this.audioContext = audioContext;
            var sourcesToLoad_ = 0;
            var loadedAudioBuffers_ = [];

            //Private functions
            function init() {
                var parameterType = Object.prototype.toString.call( sounds );

                if ( parameterType === '[object Array]' ) {
                    if ( sounds.length >= self.minSources && sounds.length <= self.maxSources ) {
                        sourcesToLoad_ = sounds.length;
                        loadedAudioBuffers_ = new Array( sourcesToLoad_ );
                        sounds.forEach( function ( thisSound, index ) {
                            loadSingleSound( thisSound, onSingleLoadAt( index ) );
                        } );
                    } else {
                        console.error( "Unsupported number of Sources. " + self.modelName + " only supports a minimum of " + self.minSources + " and a maximum of " + self.maxSources + " sources. Trying to load " + sounds.length + "." );
                        onLoadComplete( false, loadedAudioBuffers_ );
                    }
                } else if ( sounds ) {
                    sourcesToLoad_ = 1;
                    loadedAudioBuffers_ = new Array( sourcesToLoad_ );
                    loadSingleSound( sounds, onSingleLoadAt( 0 ) );
                } else {
                    console.log( "Setting empty source. No sound may be heard" );
                    onLoadComplete( false, loadedAudioBuffers_ );
                }
            }

            function loadSingleSound( sound, onSingleLoad ) {
                var parameterType = Object.prototype.toString.call( sound );
                if ( parameterType === "[object String]" || parameterType === "[object File]" ) {
                    var fileLoader = new FileLoader( sound, self.audioContext, function ( status ) {
                        if ( status ) {
                            onSingleLoad( status, fileLoader.getBuffer() );
                        } else {
                            onSingleLoad( status );
                        }
                    }, function ( progressEvent ) {
                        if ( onLoadProgress && typeof onLoadProgress === "function" ) {
                            onLoadProgress( progressEvent, sound );
                        }
                    } );
                } else if ( parameterType === "[object AudioBuffer]" ) {
                    onSingleLoad( true, sound );
                } else {
                    console.error( "Incorrect Parameter Type - Source is not a URL, File or AudioBuffer" );
                    onSingleLoad( false, {} );
                }
            }

            function onSingleLoadAt( index ) {
                return function ( status, audioBuffer ) {
                    if ( status ) {
                        loadedAudioBuffers_[ index ] = audioBuffer;
                    }
                    sourcesToLoad_--;
                    if ( sourcesToLoad_ === 0 ) {
                        var allStatus = true;
                        for ( var bIndex = 0; bIndex < loadedAudioBuffers_.length; ++bIndex ) {
                            if ( !loadedAudioBuffers_[ bIndex ] ) {
                                allStatus = false;
                                break;
                            }
                        }
                        onLoadComplete( allStatus, loadedAudioBuffers_ );
                    }
                };
            }
            init();
        }

        return MultiFileLoader;
    } );

/**
 * @module Models
 */
define( 'models/Looper',[ 'core/Config', 'core/BaseSound', 'core/SPAudioParam', "core/SPAudioBufferSourceNode", 'core/MultiFileLoader', 'core/WebAudioDispatch' ],
    function ( Config, BaseSound, SPAudioParam, SPAudioBufferSourceNode, multiFileLoader, webAudioDispatch ) {
        

        /**
         *
         * A model which loads one or more sources and allows them to be looped continuously at variable speed.
         * @class Looper
         * @constructor
         * @extends BaseSound
         * @param {AudioContext} [context] AudioContext to be used.
         * @param {Array/String/AudioBuffer/File} [sources] Single or Array of either URLs or AudioBuffers or File Object of the audio source.
         * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
         * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
         * @param {Function} [onAudioStart] Callback when the audio is about to start playing.
         * @param {Function} [onAudioEnd] Callback when the audio has finished playing.
         * @param {Function} [onTrackEnd] Callback when an individual track has finished playing.
         */
        function Looper( context, sources, onLoadProgress, onLoadComplete, onAudioStart, onAudioEnd, onTrackEnd ) {
            if ( !( this instanceof Looper ) ) {
                throw new TypeError( "Looper constructor cannot be called as a function." );
            }
            // Call superclass constructor
            BaseSound.call( this, context );
            this.maxSources = Config.MAX_VOICES;
            this.minSources = 1;
            this.modelName = "Looper";

            this.onLoadProgress = onLoadProgress;
            this.onLoadComplete = onLoadComplete;
            this.onAudioStart = onAudioStart;
            this.onAudioEnd = onAudioEnd;

            // Private vars
            var self = this;

            var sourceBufferNodes_ = [];
            var multiTrackGainNodes_ = [];
            var lastStopPosition_ = [];
            var rateArray = [];

            var onLoadAll = function ( status, arrayOfBuffers ) {
                arrayOfBuffers.forEach( function ( thisBuffer, trackIndex ) {
                    lastStopPosition_.push( 0 );
                    insertBufferSource( thisBuffer, trackIndex );
                } );

                if ( rateArray && rateArray.length > 0 ) {
                    self.registerParameter( new SPAudioParam( "playSpeed", 0.0, 10, 1, rateArray, null, playSpeedSetter_, self.audioContext ), true );
                }

                if ( status ) {
                    self.isInitialized = true;
                }

                if ( typeof self.onLoadComplete === 'function' ) {
                    self.onLoadComplete( status );
                }
            };

            var onSourceEnd = function ( event, trackIndex, source ) {
                var cTime = self.audioContext.currentTime;
                // Create a new source since SourceNodes can't play again.
                source.resetBufferSource( cTime, multiTrackGainNodes_[ trackIndex ] );

                if ( typeof self.onTrackEnd === 'function' ) {
                    onTrackEnd( self, trackIndex );
                }

                var allSourcesEnded = sourceBufferNodes_.reduce( function ( prevState, thisSource ) {
                    return prevState && ( thisSource.playbackState === thisSource.FINISHED_STATE ||
                        thisSource.playbackState === thisSource.UNSCHEDULED_STATE );
                }, true );

                if ( allSourcesEnded && self.isPlaying ) {
                    self.isPlaying = false;
                    if ( typeof self.onAudioEnd === 'function' ) {
                        self.onAudioEnd();
                    }
                }
            };

            var insertBufferSource = function ( audioBuffer, trackIndex ) {
                var source = new SPAudioBufferSourceNode( self.audioContext );
                source.buffer = audioBuffer;
                source.loopEnd = audioBuffer.duration;
                source.onended = function ( event ) {
                    onSourceEnd( event, trackIndex, source );
                };

                console.log( "inserting ", audioBuffer, " at ", trackIndex );

                var gainNode;
                if ( multiTrackGainNodes_[ trackIndex ] ) {
                    gainNode = multiTrackGainNodes_[ trackIndex ];
                } else {
                    gainNode = self.audioContext.createGain();
                    multiTrackGainNodes_[ trackIndex ] = gainNode;

                    var multiChannelGainParam = new SPAudioParam( "gain", 0.0, 1, 1, gainNode.gain, null, null, self.audioContext );
                    self.multiTrackGain.splice( trackIndex, 1, multiChannelGainParam );
                }

                source.connect( gainNode );
                gainNode.connect( self.releaseGainNode );

                sourceBufferNodes_.push( source );
                rateArray.push( source.playbackRate );
            };

            var playSpeedSetter_ = function ( aParam, value, audioContext ) {
                if ( self.isInitialized ) {
                    /* 0.001 - 60dB Drop
                        e(-n) = 0.001; - Decay Rate of setTargetAtTime.
                        n = 6.90776;
                        */
                    var t60multiplier = 6.90776;

                    var currentSpeed = sourceBufferNodes_[ 0 ] ? sourceBufferNodes_[ 0 ].playbackRate.value : 1;

                    if ( value > currentSpeed ) {
                        sourceBufferNodes_.forEach( function ( thisSource ) {
                            thisSource.playbackRate.cancelScheduledValues( audioContext.currentTime );
                            thisSource.playbackRate.setTargetAtTime( value, audioContext.currentTime, self.riseTime.value / t60multiplier );
                        } );
                    } else if ( value < currentSpeed ) {
                        sourceBufferNodes_.forEach( function ( thisSource ) {
                            thisSource.playbackRate.cancelScheduledValues( audioContext.currentTime );
                            thisSource.playbackRate.setTargetAtTime( value, audioContext.currentTime, self.decayTime.value / t60multiplier );
                        } );
                    }
                }
            };

            var startPointSetter_ = function ( aParam, value ) {
                sourceBufferNodes_.forEach( function ( thisSource ) {
                    thisSource.loopStart = value * thisSource.buffer.duration;
                } );
            };

            function init( sources ) {
                rateArray = [];
                sourceBufferNodes_.forEach( function ( thisSource ) {
                    thisSource.disconnect();
                } );
                sourceBufferNodes_ = [];
                multiFileLoader.call( self, sources, self.audioContext, self.onLoadProgress, onLoadAll );
            }

            // Public Properties

            /**
             * Event Handler or Callback for ending of a individual track.
             *
             * @property onTrackEnd
             * @type Function
             * @default null
             */
            this.onTrackEnd = onTrackEnd;

            /**
             * Speed of playback of the source. Affects both pitch and tempo.
             *
             * @property playSpeed
             * @type SPAudioParam
             * @default 1.0
             * @minvalue 0.0
             * @maxvalue 10.0
             */
            this.registerParameter( new SPAudioParam( "playSpeed", 0.0, 10, 1, null, null, playSpeedSetter_, self.audioContext ), true );

            /**
             * Rate of increase of Play Speed. It is the time-constant value of first-order filter (exponential) which approaches the target speed set by the {{#crossLink "Looper/playSpeed:property"}}{{/crossLink}} property.
             *
             * @property riseTime
             * @type SPAudioParam
             * @default 0.05
             * @minvalue 0.05
             * @maxvalue 10.0
             */

            this.registerParameter( SPAudioParam.createPsuedoParam( "riseTime", 0.05, 10.0, 0.05, this.audioContext ) );

            /**
             * Rate of decrease of Play Speed. It is the time-constant value of first-order filter (exponential) which approaches the target speed set by the {{#crossLink "Looper/playSpeed:property"}}{{/crossLink}} property.
             *
             * @property decayTime
             * @type SPAudioParam
             * @default 0.05
             * @minvalue 0.05
             * @maxvalue 10.0
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( "decayTime", 0.05, 10.0, 0.05, this.audioContext ) );

            /**
             * Start point (as a factor of the length of the entire track) where the Looping should start from.
             *
             * @property startPoint
             * @type SPAudioParam
             * @default 0.0
             * @minvalue 0.0
             * @maxvalue 0.99
             */
            this.registerParameter( new SPAudioParam( "startPoint", 0.0, 0.99, 0.00, null, null, startPointSetter_, this.audioContext ) );

            /**
             * The volume (loudness) for each individual track if multiple sources are used. Works even if a single source is used.
             *
             *
             * @property multiTrackGain
             * @type Array of SPAudioParams
             * @default 1.0
             * @minvalue 0.0
             * @maxvalue 1.0
             */
            Object.defineProperty( this, "multiTrackGain", {
                enumerable: true,
                configurable: false,
                value: []
            } );

            /**
             * The maximum number time the source will be looped before stopping. Currently only supports -1 (loop indefinitely), and 1 (only play the track once, ie. no looping).
             *
             * @property maxLoops
             * @type SPAudioParam
             * @default -1 (Infinite)
             * @minvalue -1 (Infinite)
             * @maxvalue 1
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( "maxLoops", -1, 1, -1, this.audioContext ) );

            /**
             * Reinitializes a Looper and sets it's sources.
             *
             * @method setSources
             * @param {Array/AudioBuffer/String/File} sources Single or Array of either URLs or AudioBuffers of sources.
             * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
             * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
             */
            this.setSources = function ( sources, onLoadProgress, onLoadComplete ) {
                BaseSound.prototype.setSources.call( this, sources, onLoadProgress, onLoadComplete );
                init( sources );
            };

            /**
             * Plays the model immediately. If the model is paused, the model will be played back from the same position as it was paused at.
             *
             * @method play
             *
             */
            this.play = function () {

                if ( !this.isInitialized ) {
                    throw new Error( this.modelName, "hasn't finished Initializing yet. Please wait before calling start/play" );
                }

                var now = this.audioContext.currentTime;

                if ( !this.isPlaying ) {
                    sourceBufferNodes_.forEach( function ( thisSource, index ) {
                        var offset = ( lastStopPosition_ && lastStopPosition_[ index ] ) ? lastStopPosition_[ index ] : self.startPoint.value * thisSource.buffer.duration;
                        thisSource.loop = ( self.maxLoops.value !== 1 );
                        thisSource.start( now, offset );
                    } );
                    BaseSound.prototype.start.call( this, now );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioStart === 'function' ) {
                            self.onAudioStart();
                        }
                    }, now, this.audioContext );
                }
            };

            /**
             * Start playing after specific time and from a specific offset. If offset is not defined,
             * the value of startPoint property is used.
             *
             * @method start
             * @param {Number} when Time (in seconds) when the sound should start playing.
             * @param {Number} [offset] The starting position of the playhead in seconds
             * @param {Number} [duration] Duration of the portion (in seconds) to be played
             * @param {Number} [attackDuration] Duration (in seconds) of attack ramp of the envelope.
             */
            this.start = function ( when, offset, duration, attackDuration ) {
                if ( !this.isInitialized ) {
                    console.error( this.modelName, " hasn't finished Initializing yet. Please wait before calling start/play" );
                    return;
                }

                if ( !this.isPlaying ) {
                    sourceBufferNodes_.forEach( function ( thisSource ) {
                        if ( typeof offset == 'undefined' || offset === null ) {
                            offset = self.startPoint.value * thisSource.buffer.duration;
                        }
                        if ( typeof duration == 'undefined' || duration === null ) {
                            duration = thisSource.buffer.duration;
                        }
                        thisSource.loop = ( self.maxLoops.value !== 1 );
                        thisSource.start( when, offset, duration );
                    } );

                    BaseSound.prototype.start.call( this, when, offset, duration, attackDuration );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioStart === 'function' ) {
                            self.onAudioStart();
                        }
                    }, when, this.audioContext );
                }
            };

            /**
             * Stops the model and resets play head to 0.
             * @method stop
             * @param {Number} when Time offset to stop
             */
            this.stop = function ( when ) {
                if ( self.isPlaying ) {
                    sourceBufferNodes_.forEach( function ( thisSource, index ) {
                        thisSource.stop( when );
                        lastStopPosition_[ index ] = 0;
                    } );

                    BaseSound.prototype.stop.call( this, when );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioEnd === 'function' ) {
                            self.onAudioEnd();
                        }
                    }, when, this.audioContext );
                }
            };

            /**
             * Pause the currently playing model at the current position.
             *
             * @method pause
             */
            this.pause = function () {
                if ( self.isPlaying ) {

                    sourceBufferNodes_.forEach( function ( thisSource, index ) {
                        thisSource.stop( 0 );
                        lastStopPosition_[ index ] = thisSource.playbackPosition / thisSource.buffer.sampleRate;
                    } );

                    BaseSound.prototype.stop.call( this, 0 );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioEnd === 'function' ) {
                            self.onAudioEnd();
                        }
                    }, 0, this.audioContext );
                }
            };

            // Initialize the sources.
            window.setTimeout( function () {
                init( sources );
            }, 0 );
        }

        Looper.prototype = Object.create( BaseSound.prototype );

        return Looper;
    } );

/**
 * @module Models
 */
define( 'models/Activity',[ 'core/Config', 'core/BaseSound', 'models/Looper', 'core/SPAudioParam' ],
    function ( Config, BaseSound, Looper, SPAudioParam ) {
        

        /**
         * A model plays back the source at various speeds based on the movement of the activity parameter.
         *
         *
         * @class Activity
         * @constructor
         * @extends BaseSound
         * @param {AudioContext} [context] AudioContext to be used.
         * @param {Array/String/AudioBuffer/File} [source] Single or Array of either URLs or AudioBuffers or File Object of the audio source.
         * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
         * @param {Function} [onLoadComplete] Callback when the source has finished loading.
         * @param {Function} [onAudioStart] Callback when the audio is about to start playing.
         * @param {Function} [onAudioEnd] Callback when the audio has finished playing.
         */
        function Activity( context, source, onLoadProgress, onLoadComplete, onAudioStart, onAudioEnd ) {
            if ( !( this instanceof Activity ) ) {
                throw new TypeError( "Activity constructor cannot be called as a function." );
            }

            BaseSound.call( this, context );
            /*Support upto 8 seperate voices*/
            this.maxSources = Config.MAX_VOICES;
            this.minSources = 1;
            this.modelName = "Activity";

            this.onLoadProgress = onLoadProgress;
            this.onLoadComplete = onLoadComplete;
            this.onAudioStart = onAudioStart;
            this.onAudioEnd = onAudioEnd;

            // Private vars
            var self = this;

            // Private Variables
            var internalLooper_;
            var lastPosition_ = 0;
            var lastUpdateTime_;
            var smoothDeltaTime_;
            var timeoutID, endEventTimeout;
            var audioPlaying = false;

            // Constants

            var MIN_SENSITIVITY = 0.1;
            var MAX_SENSITIVITY = 100.0;
            var MAX_OVERSHOOT = 1.2;
            var MAX_TIME_OUT = 0.1;
            var MIN_DIFF = 0.001;

            // Private Functions

            function onLoadAll( status ) {
                internalLooper_.playSpeed.setValueAtTime( Config.ZERO, self.audioContext.currentTime );
                if ( status ) {
                    self.isInitialized = true;
                }
                lastPosition_ = 0;
                lastUpdateTime_ = 0;
                smoothDeltaTime_ = 0;

                if ( typeof self.onLoadComplete === 'function' ) {
                    self.onLoadComplete( status );
                }
            }

            function init( source ) {
                internalLooper_ = new Looper( self.audioContext, source, self.onLoadProgress, onLoadAll, self.onAudioStart, self.onAudioEnd );
                internalLooper_.riseTime.value = self.riseTime.value;
                internalLooper_.decayTime.value = self.decayTime.value;
            }

            function actionSetter_( aParam, value, audioContext ) {
                if ( self.isInitialized ) {

                    var newPosition = value;
                    var time = audioContext.currentTime;

                    var deltaPos = Math.abs( newPosition - lastPosition_ );
                    var deltaTime = ( time - lastUpdateTime_ );

                    //console.log( deltaTime );

                    if ( deltaTime > 0 ) {

                        // The target level is dependent on the rate of motion and the sensitivity.

                        // The sensitivity slider is mapped logarithmically to a very wide range of sensitivities [0.1 100.0].
                        var logMinSens = Math.log( MIN_SENSITIVITY );
                        var logMaxSens = Math.log( MAX_SENSITIVITY );
                        var sensitivityLg = Math.exp( logMinSens + self.sensitivity.value * ( logMaxSens - logMinSens ) );

                        // Sometimes updates to the position get "bunched up", resulting in misleadingly
                        // small deltaTime values. This bit of code applies a low-pass filter to delta time.
                        // The general idea is that if you move the mouse at constant speed, the position update
                        // should come in at regular time *and* position intervals, and deltaPos/deltaTime should be
                        // fairly stable. In reality, however, deltaPos is pretty stable, but deltaTime is highly
                        // irregular. Applying a low-pass filter to to the time intervals fixes things.
                        if ( smoothDeltaTime_ > MIN_DIFF ) {
                            smoothDeltaTime_ = ( 0.5 * smoothDeltaTime_ + 0.5 * deltaTime );
                        } else {
                            smoothDeltaTime_ = deltaTime;
                        }

                        var maxRate = self.maxSpeed.value;

                        //var sensivityScaling:Number = Math.pow( 10, getParamVal(SENSITIVITY) );
                        var targetPlaySpeed_ = maxRate * sensitivityLg * deltaPos / smoothDeltaTime_;

                        // Target level is always positive (hence abs).  We clamp it at some maximum to avoid generating ridiculously large levels when deltaTime is small (which happens if the mouse events get delayed and clumped up).
                        // The maximum is slightly *higher* than the max rate, i.e. we allow some overshoot in the target value.
                        //This is so that if you're shaking the "Action" slider vigorously, the rate will get pinned at the maximum, and not momentarily drop below the maximum during those very brief instants when the target rate drops well below the max.

                        targetPlaySpeed_ = Math.min( Math.abs( targetPlaySpeed_ ), MAX_OVERSHOOT * maxRate );

                        internalLooper_.playSpeed.value = targetPlaySpeed_;

                        if ( targetPlaySpeed_ > 0 && !audioPlaying ) {
                            audioPlaying = true;
                            self.play();
                        }

                        // We use a timeout to prevent the target level from staying at a non-zero value
                        // forever when motion stops.  For best response, we adapt the timeout based on
                        // how frequently we've been getting position updates.
                        if ( timeoutID ) {
                            window.clearTimeout( timeoutID );
                        }
                        timeoutID = window.setTimeout( function () {
                            internalLooper_.playSpeed.value = 0;
                        }, 1000 * Math.min( 10 * deltaTime, MAX_TIME_OUT ) );

                        if ( endEventTimeout ) {
                            window.clearTimeout( endEventTimeout );
                        }
                        endEventTimeout = window.setTimeout( function () {
                            if ( audioPlaying ) {
                                audioPlaying = false;
                                self.release();
                            }
                        }, 1000 * internalLooper_.decayTime.value );
                    }

                    lastPosition_ = newPosition;
                    lastUpdateTime_ = time;
                }
            }

            function riseTimeSetter_( aParam, value ) {
                if ( self.isInitialized ) {
                    internalLooper_.riseTime.value = value;
                }
            }

            function decayTimeSetter_( aParam, value ) {
                if ( self.isInitialized ) {
                    internalLooper_.decayTime.value = value;
                }
            }

            function startPointSetter_( aParam, value ) {
                if ( self.isInitialized ) {
                    internalLooper_.startPoint.value = value;
                }
            }

            // Public Properties

            /**
             *  Maximum value at which the playback speed of the source will be capped to.
             *
             * @property maxSpeed
             * @type SPAudioParam
             * @default 1
             * @minvalue 0.05
             * @maxvalue 8.0
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( "maxSpeed", 0.05, 8.0, 1, this.audioContext ) );

            /**
             * Controls the playback of the source. The more this parameter is moved, the higher the speed of playback.
             *
             * @property action
             * @type SPAudioParam
             * @default 0
             * @minvalue 0.0
             * @maxvalue 1.0
             */
            this.registerParameter( new SPAudioParam( "action", 0, 1.0, 0.0, null, null, actionSetter_, this.audioContext ) );

            /**
             * Maximum value for random pitch shift of the triggered voices in semitones.
             *
             * @property sensitivity
             * @type SPAudioParam
             * @default 0.5
             * @minvalue 0.0
             * @maxvalue 1.0
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( "sensitivity", 0.0, 1.0, 0.5, this.audioContext ) );

            /**
             * Rate of increase of Play Speed. It is the time-constant value of first-order filter (exponential) which approaches the target speed set by the {{#crossLink "Looper/playSpeed:property"}}{{/crossLink}} property.
             *
             * @property riseTime
             * @type SPAudioParam
             * @default 1
             * @minvalue 0.05
             * @maxvalue 10.0
             */
            this.registerParameter( new SPAudioParam( "riseTime", 0.05, 10.0, 1, null, null, riseTimeSetter_, this.audioContext ) );

            /**
             *  Rate of decrease of Play Speed. It is the time-constant value of first-order filter (exponential) which approaches the target speed set by the {{#crossLink "Looper/playSpeed:property"}}{{/crossLink}} property.
             *
             * @property decayTime
             * @type SPAudioParam
             * @default 1
             * @minvalue 0.05
             * @maxvalue 10.0
             */
            this.registerParameter( new SPAudioParam( "decayTime", 0.05, 10.0, 1, null, null, decayTimeSetter_, this.audioContext ) );

            /**
             * Start point (as a factor of the length of the entire track) where the Looping should start from.
             *
             * @property startPoint
             * @type SPAudioParam
             * @default 0.0
             * @minvalue 0.0
             * @maxvalue 0.99
             */
            this.registerParameter( new SPAudioParam( "startPoint", 0.0, 0.99, 0.00, null, null, startPointSetter_, this.audioContext ) );

            // Public Functions

            /**
             * Reinitializes a Activity and sets it's sources.
             *
             * @method setSources
             * @param {Array/AudioBuffer/String/File} source Single or Array of either URLs or AudioBuffers of audio sources.
             * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
             * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
             */
            this.setSources = function ( source, onLoadProgress, onLoadComplete ) {
                BaseSound.prototype.setSources.call( this, source, onLoadProgress, onLoadComplete );
                internalLooper_.setSources( source, onLoadProgress, onLoadComplete );
            };

            /**
             * Enable playback.
             *
             * @method play
             * @param {Number} [when] At what time (in seconds) the source be triggered
             *
             */
            this.play = function ( when ) {
                if ( !this.isInitialized ) {
                    console.error( this.modelName, " hasn't finished Initializing yet. Please wait before calling start/play" );
                    return;
                }
                internalLooper_.play( when );
                BaseSound.prototype.play.call( this, when );
            };

            /**
             * Start playing after specific time and from a specific offset. If offset is not defined,
             * the value of startPoint property is used.
             *
             * @method start
             * @param {Number} when The delay in seconds before playing the model
             * @param {Number} [offset] The starting position of the playhead
             * @param {Number} [duration] Duration of the portion (in seconds) to be played
             * @param {Number} [attackDuration] Duration (in seconds) of attack ramp of the envelope.
             */
            this.start = function ( when, offset, duration, attackDuration ) {
                if ( !this.isInitialized ) {
                    console.error( this.modelName, " hasn't finished Initializing yet. Please wait before calling start/play" );
                    return;
                }
                internalLooper_.start( when, offset, duration );
                BaseSound.prototype.start.call( this, when, offset, duration, attackDuration );
            };

            /**
             * Stops the source and resets play head to 0.
             * @method stop
             * @param {Number} when Time offset to stop
             */
            this.stop = function ( when ) {
                internalLooper_.stop( when );
                BaseSound.prototype.stop.call( this, when );
            };

            /**
             * Pause the currently playing source at the current position.
             *
             * @method pause
             */
            this.pause = function () {
                internalLooper_.pause();
                BaseSound.prototype.pause.call( this );
            };

            /**
             * Linearly ramp down the gain of the audio in time (seconds) to 0.
             *
             * @method release
             * @param {Number} [when] Time (in seconds) at which the Envelope will release.
             * @param {Number} [fadeTime] Amount of time (seconds) it takes for linear ramp down to happen.
             */
            this.release = function ( when, fadeTime ) {
                internalLooper_.release( when, fadeTime );
                //BaseSound.prototype.release.call( this, when, fadeTime );
            };

            /**
             * Disconnects the Sound from the AudioNode Chain.
             *
             * @method disconnect
             * @param {Number} [outputIndex] Index describing which output of the AudioNode to disconnect.
             **/
            this.disconnect = function ( outputIndex ) {
                internalLooper_.disconnect( outputIndex );
            };

            /**
             * If the parameter `output` is an AudioNode, it connects to the releaseGainNode.
             * If the output is a BaseSound, it will connect BaseSound's releaseGainNode to the output's inputNode.
             *
             * @method connect
             * @param {AudioNode} destination AudioNode to connect to.
             * @param {Number} [output] Index describing which output of the AudioNode from which to connect.
             * @param {Number} [input] Index describing which input of the destination AudioNode to connect to.
             */
            this.connect = function ( destination, output, input ) {
                internalLooper_.connect( destination, output, input );
            };

            // Initialize the sources.
            window.setTimeout( function () {
                init( source );
            }, 0 );

        }

        Activity.prototype = Object.create( BaseSound.prototype );
        return Activity;

    } );

