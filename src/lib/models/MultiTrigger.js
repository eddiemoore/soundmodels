/**
 * @module Models
 */
define( [ 'core/Config', 'core/BaseSound', 'core/SoundQueue', 'core/SPAudioParam', 'core/MultiFileLoader', 'core/Converter' ],
    function ( Config, BaseSound, SoundQueue, SPAudioParam, multiFileLoader, Converter ) {
        "use strict";

        /**
         * A sound model which triggers a single or multiple sound files with multiple voices (polyphony)
         * repeatedly.
         *
         *
         * @class MultiTrigger
         * @constructor
         * @extends BaseSound
         * @param {Array/String/AudioBuffer/File} sounds Single or Array of either URLs or AudioBuffers or File of sounds.
         * @param {Function} [onLoadCallback] Callback when all sounds have finished loading.
         * @param {AudioContext} context AudioContext to be used.
         */
        function MultiTrigger( sounds, onLoadCallback, context ) {
            if ( !( this instanceof MultiTrigger ) ) {
                throw new TypeError( "MultiTrigger constructor cannot be called as a function." );
            }

            // Call superclass constructor
            BaseSound.call( this, context );

            var self = this;

            /*Support upto 8 seperate voices*/
            this.maxSources = Config.MAX_VOICES;
            this.numberOfInputs = 1;
            this.numberOfOutputs = 1;

            var lastEventTime_ = 0;
            var timeToNextEvent_ = 0;

            // Private Variables
            var sourceBuffers_ = [];
            var soundQueue_;
            var currentEventID_ = 0;
            var currentSourceID_ = 0;

            // Private Functions

            var onAllLoad = function ( status, audioBufferArray ) {
                sourceBuffers_ = audioBufferArray;
                timeToNextEvent_ = updateTimeToNextEvent( self.eventRate.value );
                soundQueue_.connect( self.releaseGainNode );

                this.isInitialized = true;
                if ( typeof onLoadCallback === 'function' ) {
                    onLoadCallback( status );
                }
            };

            function init( sounds ) {
                soundQueue_ = new SoundQueue( context );
                multiFileLoader.call( self, sounds, context, onAllLoad );
            }

            function triggerOnce( eventTime ) {

                // Release Older Sounds

                if ( currentEventID_ >= self.maxSources - 2 ) {
                    var releaseID = currentEventID_ - ( self.maxSources - 2 );
                    var releaseDur = eventTime - lastEventTime_;

                    soundQueue_.queueRelease( eventTime, releaseID, releaseDur );
                }

                var length = sourceBuffers_.length;

                if ( self.eventRand.value ) {
                    if ( length > 2 ) {
                        currentSourceID_ = ( currentSourceID_ + 1 + Math.floor( Math.random() * ( length - 1 ) ) ) % length;
                    } else {
                        currentSourceID_ = Math.floor( Math.random() * ( length - 1 ) );
                    }
                } else {
                    currentSourceID_ = ( currentSourceID_ + 1 ) % length;
                }

                var timeStamp = eventTime;
                var playSpeed = Converter.semitonesToRatio( self.pitchShift.value + Math.random() * self.pitchRand.value );

                soundQueue_.queueSetSource( timeStamp, currentEventID_, sourceBuffers_[ currentSourceID_ ] );
                soundQueue_.queueSetParameter( timeStamp, currentEventID_, "playSpeed", playSpeed );
                soundQueue_.queueStart( timeStamp, currentEventID_ );
                currentEventID_++;

            }

            function multiTiggerCallback() {

                var currentTime = context.currentTime;
                var endTime = currentTime + 1 / Config.NOMINAL_REFRESH_RATE;

                while ( lastEventTime_ + timeToNextEvent_ < endTime ) {
                    var eventTime = Math.max( currentTime, lastEventTime_ + timeToNextEvent_ );
                    triggerOnce( eventTime );
                    lastEventTime_ = eventTime;
                    timeToNextEvent_ = updateTimeToNextEvent( self.eventRate.value );
                }

                // Keep making callback request if sound is still playing.
                if ( self.isPlaying ) {
                    window.requestAnimationFrame( multiTiggerCallback );
                }
            }

            function updateTimeToNextEvent( eventRate ) {
                var period = 1.0 / eventRate;
                var randomness = Math.random() - 0.5;
                var jitterRand = ( 1.0 + 2.0 * self.eventJitter.value * randomness );
                return ( period * jitterRand );
            }

            function eventRateSetter_( aParam, value ) {
                if ( value === 0 ) {
                    if ( self.isPlaying ) {
                        self.pause();
                    }
                } else {
                    if ( !self.isPlaying && self.isInitialized ) {
                        self.play();
                    }

                    if ( self.isInitialized ) {
                        timeToNextEvent_ = updateTimeToNextEvent( value );
                    }
                    //Update releaseDur of sounds being released
                    //var period = 1.0 / value;
                    //releaseDur = Math.max( 0.99 * period * ( 1 - self.eventJitter.value ), 0.01 );
                }

            }

            // Public Properties

            /**
             * Pitch shift of the triggered voices in semitones.
             *
             * @property pitchShift
             * @type SPAudioParam
             * @default 0
             */
            this.pitchShift = SPAudioParam.createPsuedoParam( "pitchShift", -60.0, 60.0, 0, this.audioContext );

            /**
             * Maximum value for random pitch shift of the triggered voices in semitones.
             *
             * @property pitchRand
             * @type SPAudioParam
             * @default 0
             */
            this.pitchRand = SPAudioParam.createPsuedoParam( "pitchRand", 0.0, 24.0, 0, this.audioContext );

            /**
             * Enable randomness in the order of sources which are triggered.
             *
             * @property eventRand
             * @type SPAudioParam
             * @default false
             */
            this.eventRand = SPAudioParam.createPsuedoParam( "eventRand", true, false, false, this.audioContext );

            /**
             * Trigger rate for playing the source in Hz.
             *
             * @property eventRate
             * @type SPAudioParam
             * @default false
             */
            this.eventRate = new SPAudioParam( "eventRate", 0, 60.0, 10.0, null, null, eventRateSetter_, this.audioContext );
            /**
             * Maximum deviance from the regular trigger interval for a random jitter factor in percentage.
             *
             * @property eventJitter
             * @type SPAudioParam
             * @default false
             */
            this.eventJitter = SPAudioParam.createPsuedoParam( "eventJitter", 0, 0.99, 0, this.audioContext );

            // Public Functions

            /**
             * Start repeated triggering.
             *
             * @method play
             * @param {Number} [when] At what time (in seconds) the sound be triggered
             *
             */
            this.play = function ( when ) {
                BaseSound.prototype.start.call( this, 0 );
                multiTiggerCallback();
            };

            init( sounds );
        }

        MultiTrigger.prototype = Object.create( BaseSound.prototype );

        return MultiTrigger;

    } );
