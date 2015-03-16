/*javascript-sound-models - v2.0.0-1 - Mon Mar 16 2015 16:50:15 GMT+0800 (SGT) */ 
console.log("   ____                           __ \n" + "  / _____  ___ ___  ___ ___  ____/ /_\n" + " _\\ \\/ _ \\/ _ / _ \\/ _ / _ \\/ __/ __/\n" + "/___/\\___/_//_\\___/ .__\\___/_/  \\__/ \n" + "                 /_/                 \n" + "Hello Developer!\n" + "Thanks for using Sonoport Dynamic Sound Library v2.0.0-1.");
define("core/Config",[],function(){function e(){}return e.LOG_ERRORS=!0,e.ZERO=parseFloat("1e-37"),e.MAX_VOICES=8,e.NOMINAL_REFRESH_RATE=60,e.WINDOW_LENGTH=512,e.CHUNK_LENGTH=256,e.DEFAULT_SMOOTHING_CONSTANT=.05,e}),define("core/WebAudioDispatch",[],function(){function e(e,t,n){if(!n)return void console.warn("No AudioContext provided");var o=n.currentTime;o>=t||.005>t-o?e():window.setTimeout(function(){e()},1e3*(t-o))}return e}),define("core/AudioContextMonkeyPatch",[],function(){function e(e){e&&(e.setTargetAtTime||(e.setTargetAtTime=e.setTargetValueAtTime))}window.hasOwnProperty("webkitAudioContext")&&!window.hasOwnProperty("AudioContext")&&(window.AudioContext=webkitAudioContext,AudioContext.prototype.hasOwnProperty("createGain")||(AudioContext.prototype.createGain=AudioContext.prototype.createGainNode),AudioContext.prototype.hasOwnProperty("createDelay")||(AudioContext.prototype.createDelay=AudioContext.prototype.createDelayNode),AudioContext.prototype.hasOwnProperty("createScriptProcessor")||(AudioContext.prototype.createScriptProcessor=AudioContext.prototype.createJavaScriptNode),AudioContext.prototype.internal_createGain=AudioContext.prototype.createGain,AudioContext.prototype.createGain=function(){var t=this.internal_createGain();return e(t.gain),t},AudioContext.prototype.internal_createDelay=AudioContext.prototype.createDelay,AudioContext.prototype.createDelay=function(t){var n=t?this.internal_createDelay(t):this.internal_createDelay();return e(n.delayTime),n},AudioContext.prototype.internal_createBufferSource=AudioContext.prototype.createBufferSource,AudioContext.prototype.createBufferSource=function(){var t=this.internal_createBufferSource();return t.start||(t.start=function(e,t,n){t||n?this.noteGrainOn(e,t,n):this.noteOn(e)}),t.stop||(t.stop=t.noteOff),e(t.playbackRate),t},AudioContext.prototype.internal_createDynamicsCompressor=AudioContext.prototype.createDynamicsCompressor,AudioContext.prototype.createDynamicsCompressor=function(){var t=this.internal_createDynamicsCompressor();return e(t.threshold),e(t.knee),e(t.ratio),e(t.reduction),e(t.attack),e(t.release),t},AudioContext.prototype.internal_createBiquadFilter=AudioContext.prototype.createBiquadFilter,AudioContext.prototype.createBiquadFilter=function(){var t=this.internal_createBiquadFilter();return e(t.frequency),e(t.detune),e(t.Q),e(t.gain),t},AudioContext.prototype.hasOwnProperty("createOscillator")&&(AudioContext.prototype.internal_createOscillator=AudioContext.prototype.createOscillator,AudioContext.prototype.createOscillator=function(){var t=this.internal_createOscillator();return t.start||(t.start=t.noteOn),t.stop||(t.stop=t.noteOff),e(t.frequency),e(t.detune),t}))}),define("core/BaseSound",["core/WebAudioDispatch","core/AudioContextMonkeyPatch"],function(e){function t(e){function t(e){function t(){o.start(0),o.stop(e.currentTime+1e-4),window.liveAudioContexts.push(e),window.removeEventListener("touchstart",t)}var n=/(iPad|iPhone|iPod)/g.test(navigator.userAgent);if(n&&(window.liveAudioContexts||(window.liveAudioContexts=[]),window.liveAudioContexts.indexOf(e)<0)){var o=e.createOscillator(),i=e.createGain();i.gain.value=0,o.connect(i),i.connect(e.destination),window.addEventListener("touchstart",t)}}void 0===e||null===e?(console.log("Making a new AudioContext"),this.audioContext=new AudioContext):this.audioContext=e,t(this.audioContext),this.numberOfInputs=0,Object.defineProperty(this,"numberOfOutputs",{enumerable:!0,configurable:!1,get:function(){return this.releaseGainNode.numberOfOutputs}});var n=0;Object.defineProperty(this,"maxSources",{enumerable:!0,configurable:!1,set:function(e){0>e&&(e=0),n=Math.round(e)},get:function(){return n}});var o=0;Object.defineProperty(this,"minSources",{enumerable:!0,configurable:!1,set:function(e){0>e&&(e=0),o=Math.round(e)},get:function(){return o}}),this.releaseGainNode=this.audioContext.createGain(),this.isPlaying=!1,this.isInitialized=!1,this.inputNode=null,this.destinations=[],this.modelName="Model",this.onLoadProgress=null,this.onLoadComplete=null,this.onAudioStart=null,this.onAudioEnd=null,this.parameterList_=[],this.connect(this.audioContext.destination)}return t.prototype.connect=function(e,t,n){e instanceof AudioNode?(this.releaseGainNode.connect(e,t,n),this.destinations.push({destination:e,output:t,input:n})):e.inputNode instanceof AudioNode?(this.releaseGainNode.connect(e.inputNode,t,n),this.destinations.push({destination:e.inputNode,output:t,input:n})):console.error("No Input Connection - Attempts to connect "+typeof t+" to "+typeof this)},t.prototype.disconnect=function(e){this.releaseGainNode.disconnect(e),this.destinations=[]},t.prototype.start=function(t,n,o,i){("undefined"==typeof t||t<this.audioContext.currentTime)&&(t=this.audioContext.currentTime),this.releaseGainNode.gain.cancelScheduledValues(t),"undefined"!=typeof i?(this.releaseGainNode.gain.setValueAtTime(0,t),this.releaseGainNode.gain.linearRampToValueAtTime(1,t+i)):this.releaseGainNode.gain.setValueAtTime(1,t);var r=this;e(function(){r.isPlaying=!0},t,this.audioContext)},t.prototype.stop=function(t){("undefined"==typeof t||t<this.audioContext.currentTime)&&(t=this.audioContext.currentTime);var n=this;e(function(){n.isPlaying=!1},t,this.audioContext),this.releaseGainNode.gain.cancelScheduledValues(t)},t.prototype.release=function(t,n,o){if(this.isPlaying){var i=.5;if(("undefined"==typeof t||t<this.audioContext.currentTime)&&(t=this.audioContext.currentTime),n=n||i,this.releaseGainNode.gain.setValueAtTime(this.releaseGainNode.gain.value,t),this.releaseGainNode.gain.linearRampToValueAtTime(0,t+n),!o){var r=this;e(function(){r.pause()},t+n,this.audioContext)}}},t.prototype.setSources=function(e,t,n){this.isInitialized=!1,"function"==typeof t&&(this.onLoadProgress=t),"function"==typeof n&&(this.onLoadComplete=n)},t.prototype.play=function(){this.start(0)},t.prototype.pause=function(){this.isPlaying=!1},t.prototype.registerParameter=function(e,t){(void 0===t||null===t)&&(t=!1),Object.defineProperty(this,e.name,{enumerable:!0,configurable:t,value:e});var n=this,o=!1;this.parameterList_.forEach(function(t,i){t.name===e.name&&(n.parameterList_.splice(i,1,e),o=!0)}),o||this.parameterList_.push(e)},t.prototype.listParams=function(){return this.parameterList_},t}),define("core/SPAudioParam",["core/WebAudioDispatch","core/Config"],function(e,t){function n(n,o,i,r,a,u,s,c){var l,f=1e-4,d=500,h=0;if(this.defaultValue=null,this.maxValue=0,this.minValue=0,this.name="",Object.defineProperty(this,"value",{enumerable:!0,configurable:!1,set:function(e){if(typeof e!=typeof a)return void console.error("Attempt to set a "+typeof a+" parameter to a "+typeof e+" value");if("number"==typeof e&&(e>r?(console.warn(this.name+" clamping to max"),e=r):i>e&&(console.warn(this.name+" clamping to min"),e=i)),"function"==typeof s&&(e=s(e)),"function"==typeof c&&n.audioContext)c(u,e,n.audioContext);else if(u){if(u instanceof AudioParam){var o=[];o.push(u),u=o}u.forEach(function(o){n.isPlaying?o.setTargetAtTime(e,n.audioContext.currentTime,t.DEFAULT_SMOOTHING_CONSTANT):o.setValueAtTime(e,n.audioContext.currentTime)})}else window.clearInterval(l);h=e},get:function(){return u?u instanceof AudioParam?u.value:u instanceof Array?u[0].value:h:h}}),u&&(u instanceof AudioParam||u instanceof Array)){var p=u[0]||u;this.defaultValue=p.defaultValue,this.minValue=p.minValue,this.maxValue=p.maxValue,this.value=p.defaultValue,this.name=p.name}o&&(this.name=o),"undefined"!=typeof a&&(this.defaultValue=a,this.value=a),"undefined"!=typeof i&&(this.minValue=i),"undefined"!=typeof r&&(this.maxValue=r),this.setValueAtTime=function(t,o){if("function"==typeof s&&(t=s(t)),u)u instanceof AudioParam?u.setValueAtTime(t,o):u instanceof Array&&u.forEach(function(e){e.setValueAtTime(t,o)});else{var i=this;e(function(){i.value=t},o,n.audioContext)}},this.setTargetAtTime=function(e,t,o){if("function"==typeof s&&(e=s(e)),u)u instanceof AudioParam?u.setTargetAtTime(e,t,o):u instanceof Array&&u.forEach(function(n){n.setTargetAtTime(e,t,o)});else{var i=this,r=i.value,a=n.audioContext.currentTime;l=window.setInterval(function(){n.audioContext.currentTime>=t&&(i.value=e+(r-e)*Math.exp(-(n.audioContext.currentTime-a)/o),Math.abs(i.value-e)<f&&window.clearInterval(l))},d)}},this.setValueCurveAtTime=function(e,t,o){if("function"==typeof s)for(var i=0;i<e.length;i++)e[i]=s(e[i]);if(u)u instanceof AudioParam?u.setValueCurveAtTime(e,t,o):u instanceof Array&&u.forEach(function(n){n.setValueCurveAtTime(e,t,o)});else{var r=this,a=n.audioContext.currentTime;l=window.setInterval(function(){if(n.audioContext.currentTime>=t){var i=Math.floor(e.length*(n.audioContext.currentTime-a)/o);i<e.length?r.value=e[i]:window.clearInterval(l)}},d)}},this.exponentialRampToValueAtTime=function(e,t){if("function"==typeof s&&(e=s(e)),u)u instanceof AudioParam?u.exponentialRampToValueAtTime(e,t):u instanceof Array&&u.forEach(function(n){n.exponentialRampToValueAtTime(e,t)});else{var o=this,i=o.value,r=n.audioContext.currentTime;0===i&&(i=.001),l=window.setInterval(function(){var a=(n.audioContext.currentTime-r)/(t-r);o.value=i*Math.pow(e/i,a),n.audioContext.currentTime>=t&&window.clearInterval(l)},d)}},this.linearRampToValueAtTime=function(e,t){if("function"==typeof s&&(e=s(e)),u)u instanceof AudioParam?u.linearRampToValueAtTime(e,t):u instanceof Array&&u.forEach(function(n){n.linearRampToValueAtTime(e,t)});else{var o=this,i=o.value,r=n.audioContext.currentTime;l=window.setInterval(function(){var a=(n.audioContext.currentTime-r)/(t-r);o.value=i+(e-i)*a,n.audioContext.currentTime>=t&&window.clearInterval(l)},d)}},this.cancelScheduledValues=function(e){u?u instanceof AudioParam?u.cancelScheduledValues(e):u instanceof Array&&u.forEach(function(t){t.cancelScheduledValues(e)}):window.clearInterval(l)}}return n.createPsuedoParam=function(e,t,o,i,r){return new n(e,t,o,i,r,null,null,null)},n}),define("core/SPPlaybackRateParam",["core/Config"],function(e){function t(t,n,o){this.defaultValue=n.defaultValue,this.maxValue=n.maxValue,this.minValue=n.minValue,this.name=n.name,this.units=n.units,Object.defineProperty(this,"value",{enumerable:!0,configurable:!1,set:function(i){t.playbackState===t.PLAYING_STATE?(n.setTargetAtTime(i,t.audioContext.currentTime,e.DEFAULT_SMOOTHING_CONSTANT),o.setTargetAtTime(i,t.audioContext.currentTime,e.DEFAULT_SMOOTHING_CONSTANT)):(n.setValueAtTime(i,t.audioContext.currentTime),o.setValueAtTime(i,t.audioContext.currentTime))},get:function(){return n.value}}),n.value=n.value,o.value=n.value,this.linearRampToValueAtTime=function(e,t){n.linearRampToValueAtTime(e,t),o.linearRampToValueAtTime(e,t)},this.exponentialRampToValueAtTime=function(e,t){n.exponentialRampToValueAtTime(e,t),o.exponentialRampToValueAtTime(e,t)},this.setValueCurveAtTime=function(e,t,i){n.setValueCurveAtTime(e,t,i),o.setValueCurveAtTime(e,t,i)},this.setTargetAtTime=function(e,t,i){n.setTargetAtTime(e,t,i),o.setTargetAtTime(e,t,i)},this.setValueAtTime=function(e,t){n.setValueAtTime(e,t),o.setValueAtTime(e,t)},this.cancelScheduledValues=function(e){n.cancelScheduledValues(e),o.cancelScheduledValues(e)}}return t}),define("core/SPAudioBuffer",[],function(){function e(e,t,n,o,i){if(!(e instanceof AudioContext))return void console.error("First argument to SPAudioBuffer must be a valid AudioContext");var r,a,u,s;this.audioContext=e,this.duration=null,Object.defineProperty(this,"numberOfChannels",{get:function(){return this.buffer?this.buffer.numberOfChannels:0}}),Object.defineProperty(this,"sampleRate",{get:function(){return this.buffer?this.buffer.sampleRate:0}}),this.getChannelData=function(e){return this.buffer?this.buffer.getChannelData(e):null},Object.defineProperty(this,"buffer",{set:function(e){if(null===u)this.startPoint=0;else if(u>e.length/e.sampleRate)return void console.error("SPAudioBuffer : startPoint cannot be greater than buffer length");if(null===s)this.endPoint=this.rawBuffer_.length;else if(s>e.length/e.sampleRate)return void console.error("SPAudioBuffer : endPoint cannot be greater than buffer length");a=e,this.updateBuffer()}.bind(this),get:function(){return r}}),this.sourceURL=null,Object.defineProperty(this,"startPoint",{set:function(e){return void 0!==s&&e>=s?void console.error("SPAudioBuffer : startPoint cannot be greater than endPoint"):a&&e*a.sampleRate>=a.length?void console.error("SPAudioBuffer : startPoint cannot be greater than or equal to buffer length"):(u=e,void this.updateBuffer())}.bind(this),get:function(){return u}}),Object.defineProperty(this,"endPoint",{set:function(e){return void 0!==u&&u>=e?void console.error("SPAudioBuffer : endPoint cannot be lesser than startPoint"):a&&e*a.sampleRate>=a.length?void console.error("SPAudioBuffer : endPoint cannot be greater than buffer or equal to length"):(s=e,void this.updateBuffer())}.bind(this),get:function(){return s}}),this.updateBuffer=function(){if(a){if((null===u||void 0===u)&&(u=0),(null===s||void 0===s)&&(s=a.duration),this.duration=s-u,this.length=Math.ceil(a.sampleRate*this.duration)+1,this.length>0){r&&r.length==this.length&&r.numberOfChannels==a.numberOfChannels&&r.sampleRate==a.sampleRate||(r=this.audioContext.createBuffer(a.numberOfChannels,this.length,a.sampleRate));for(var e=Math.floor(u*a.sampleRate),t=Math.ceil(s*a.sampleRate),n=0;n<a.numberOfChannels;n++){var o=new Float32Array(a.getChannelData(n));r.getChannelData(n).set(o.subarray(e,t))}}}else this.duration=0};var c=Object.prototype.toString.call(t),l=Object.prototype.toString.call(n),f=Object.prototype.toString.call(o),d=Object.prototype.toString.call(i);"[object String]"===c||"[object File]"===c?this.sourceURL=t:"[object AudioBuffer]"===c?this.buffer=t:console.warn("Incorrect Parameter Type. url can only be a String, File or an AudioBuffer"),"[object Number]"===l?this.startPoint=parseFloat(n):"[object Undefined]"!==l&&console.warn("Incorrect Parameter Type. startPoint should be a Number"),"[object Number]"===f?this.endPoint=parseFloat(o):"[object Undefined]"!==l&&console.warn("Incorrect Parameter Type. endPoint should be a Number"),"[object AudioBuffer]"!==d||this.buffer||(this.buffer=i)}return e}),define("core/SPAudioBufferSourceNode",["core/SPPlaybackRateParam","core/SPAudioBuffer","core/WebAudioDispatch"],function(e,t,n){function o(o){function i(e){for(var t=new Float32Array(e.length),n=o.createBuffer(1,e.length,44100),i=0;i<e.length;i++)t[i]=i;return n.getChannelData(0).set(t),n}function r(){c.connect(l),s.connect(f),l.connect(f),l.onaudioprocess=a}function a(e){var t=e.inputBuffer.getChannelData(0);d=t[t.length-1]||0}function u(e,t){return function(n){e.playbackState=e.FINISHED_STATE,"function"==typeof t&&t(n)}}var s=o.createBufferSource(),c=o.createBufferSource(),l=o.createScriptProcessor(256,1,1),f=o.createGain(),d=0;this.audioContext=o,this.channelCount=s.channelCount,this.channelCountMode=s.channelCountMode,this.channelInterpretation=s.channelInterpretation,this.numberOfInputs=s.numberOfInputs,this.numberOfOutputs=s.numberOfOutputs,this.playbackState=0,this.UNSCHEDULED_STATE=0,this.SCHEDULED_STATE=1,this.PLAYING_STATE=2,this.FINISHED_STATE=3,this.playbackRate=new e(this,s.playbackRate,c.playbackRate),Object.defineProperty(this,"loopEnd",{enumerable:!0,configurable:!1,set:function(e){s.loopEnd=e,c.loopEnd=e},get:function(){return s.loopEnd}}),Object.defineProperty(this,"loopStart",{enumerable:!0,configurable:!1,set:function(e){s.loopStart=e,c.loopStart=e},get:function(){return s.loopStart}}),Object.defineProperty(this,"onended",{enumerable:!0,configurable:!1,set:function(e){s.onended=u(this,e)},get:function(){return s.onended}}),Object.defineProperty(this,"loop",{enumerable:!0,configurable:!1,set:function(e){s.loop=e,c.loop=e},get:function(){return s.loop}}),Object.defineProperty(this,"playbackPosition",{enumerable:!0,configurable:!1,get:function(){return d}}),Object.defineProperty(this,"buffer",{enumerable:!0,configurable:!1,set:function(e){e instanceof t?(s.buffer=e.buffer,c.buffer=i(e.buffer)):e instanceof AudioBuffer&&(s.buffer=e,c.buffer=i(e))},get:function(){return s.buffer}}),Object.defineProperty(this,"gain",{enumerable:!0,configurable:!1,get:function(){return f.gain}}),this.connect=function(e,t,n){f.connect(e,t,n)},this.disconnect=function(e){f.disconnect(e)},this.start=function(e,t,o){"undefined"==typeof o&&(o=s.buffer.duration),"undefined"==typeof t&&(t=0),this.playbackState===this.UNSCHEDULED_STATE&&(s.start(e,t,o),c.start(e,t,o),this.playbackState=this.SCHEDULED_STATE);var i=this;n(function(){i.playbackState=i.PLAYING_STATE},e,this.audioContext)},this.stop=function(e){(this.playbackState===this.PLAYING_STATE||this.playbackState===this.SCHEDULED_STATE)&&(s.stop(e),c.stop(e))},this.resetBufferSource=function(t,i){var r=this;n(function(){l.disconnect();var t=r.audioContext.createGain();t.gain.value=f.gain.value,f=t;var n=r.audioContext.createBufferSource();n.buffer=s.buffer,n.loopStart=s.loopStart,n.loopEnd=s.loopEnd,n.onended=u(r,s.onended),s.onended=null,c.disconnect();var a=o.createBufferSource();a.buffer=c.buffer,s=n,c=a;var d=r.playbackRate.value;r.playbackRate=new e(r,s.playbackRate,c.playbackRate),r.playbackRate.setValueAtTime(d,0),c.connect(l),s.connect(f),l.connect(f),r.connect(i),r.playbackState=r.UNSCHEDULED_STATE},t,this.audioContext)},r()}return o}),define("core/DetectLoopMarkers",[],function(){function e(e){var t=0,n=0,o=!0,i=5e3,r=44100,a=.5,u=2e4,s=.01,c=1024,l=16,f=[],d=0,h=function(e,t){for(var n=0,o=t+l;t+l+c>o;++o)n+=Math.abs(e[o]);return s>n/c},p=function(e){return function(t,n,o){var i;return i=o%2===0?n[e]>a:n[e]<-a,t&&i}},m=function(o){var a=null,s=null;t=0,n=d;for(var c=0;null===a&&d>c&&u>c;){if(o.reduce(p(c),!0)&&(1!==o.length||h(o[0],c))){a=c;break}c++}for(c=d;null===s&&c>0&&u>d-c;){if(o.reduce(p(c),!0)){s=c;break}c--}var l=Math.round(i/2*e.sampleRate/r);return null!==a&&null!==s&&s>a+l?(t=a+l,n=s-l,!0):!1},y=function(e){return function(t,n){return t&&Math.abs(n[e])<s}},A=function(e){var o=!0;for(t=0;u>t&&d>t&&(o=e.reduce(y(t),!0));)t++;for(n=d;u>d-n&&n>0&&(o=e.reduce(y(n),!0));)n--;t>n&&(t=0)};d=e.length;for(var g=0;g<e.numberOfChannels;g++)f.push(new Float32Array(e.getChannelData(g)));return m(f)||(A(f),o=!1),{marked:o,start:t,end:n}}return e}),define("core/FileLoader",["core/DetectLoopMarkers"],function(e){function t(n,o,i,r){function a(){var e=Object.prototype.toString.call(n),t=/[^.]+$/.exec(n);if("[object String]"===e){var o=new XMLHttpRequest;o.open("GET",n,!0),o.responseType="arraybuffer",o.addEventListener("progress",r,!1),o.onload=function(){u(o.response,t)},o.send()}else if("[object File]"===e||"[object Blob]"===e){var i=new FileReader;i.addEventListener("progress",r,!1),i.onload=function(){u(i.result,t)},i.readAsArrayBuffer(n)}}function u(t,r){o.decodeAudioData(t,function(t){if(f=!0,s=t,c=0,l=s.length,"wav"!==r[0]){var n=e(s);n&&(c=n.start,l=n.end)}i&&"function"==typeof i&&i(!0)},function(){console.warn("Error Decoding "+n),i&&"function"==typeof i&&i(!1)})}if(!(this instanceof t))throw new TypeError("FileLoader constructor cannot be called as a function.");var s,c=0,l=0,f=!1,d=function(e){var t=/^[0-9]+$/;return t.test(e)?!0:!1},h=function(e,t){"undefined"==typeof t&&(t=s.length),d(e)?d(t)||(console.warn("Incorrect parameter Type - FileLoader getBuffer end parameter is not an integer"),t=Number.isNan(t)?0:Math.round(Number(t))):(e=Number.isNan(e)?0:Math.round(Number(e)),console.warn("Incorrect parameter Type - FileLoader getBuffer start parameter is not an integer. Coercing it to an Integer - start")),e>t&&(console.error("Incorrect parameter Type - FileLoader getBuffer start parameter "+e+" should be smaller than end parameter "+t+" . Setting them to the same value "+e),t=e),(e>l||c>e)&&(console.error("Incorrect parameter Type - FileLoader getBuffer start parameter should be within the buffer size : 0-"+s.length+" . Setting start to "+c),e=c),(t>l||c>t)&&(console.error("Incorrect parameter Type - FileLoader getBuffer start parameter should be within the buffer size : 0-"+s.length+" . Setting start to "+l),t=l);var n=t-e;if(!s)return console.error("No Buffer Found - Buffer loading has not completed or has failed."),null;for(var i=o.createBuffer(s.numberOfChannels,n,s.sampleRate),r=0;r<s.numberOfChannels;r++){var a=new Float32Array(s.getChannelData(r));i.getChannelData(r).set(a.subarray(e,t))}return i};this.getBuffer=function(e,t){return"undefined"==typeof e&&(e=0),"undefined"==typeof t&&(t=l-c),h(c+e,c+t)},this.getRawBuffer=function(){return f?s:(console.error("No Buffer Found - Buffer loading has not completed or has failed."),null)},this.isLoaded=function(){return f},a()}return t}),define("core/MultiFileLoader",["core/FileLoader","core/SPAudioBuffer"],function(e,t){function n(n,o,i,r){function a(){if(!n)return console.log("Setting empty source. No sound may be heard"),void r(!1,f);if(!(n instanceof Array)){var e=[];e.push(n),n=e}return n.length<c.minSources||n.length>c.maxSources?(console.error("Unsupported number of Sources. "+c.modelName+" only supports a minimum of "+c.minSources+" and a maximum of "+c.maxSources+" sources. Trying to load "+n.length+"."),void r(!1,f)):(l=n.length,f=new Array(l),void n.forEach(function(e,t){u(e,s(t))}))}function u(n,o){var r,a=Object.prototype.toString.call(n);if("[object AudioBuffer]"===a)r=new t(c.audioContext,n),o(!0,r);else if(n instanceof t&&n.buffer)o(!0,n);else if("[object String]"===a||"[object File]"===a||n instanceof t&&n.sourceURL){var u;n instanceof t&&n.sourceURL?(u=n.sourceURL,r=n):(u=n,r=new t(c.audioContext,u));var s=new e(u,c.audioContext,function(e){e?(r.buffer=s.getBuffer(),o(e,r)):o(e)},function(e){i&&"function"==typeof i&&i(e,r)})}else console.error("Incorrect Parameter Type - Source is not a URL, File or AudioBuffer or doesn't have sourceURL or buffer"),o(!1,{})}function s(e){return function(t,n){if(t&&(f[e]=n),l--,0===l){for(var o=!0,i=0;i<f.length;++i)if(!f[i]){o=!1;break}r(o,f)}}}var c=this;this.audioContext=o;var l=0,f=[];a()}return n}),define("models/Looper",["core/Config","core/BaseSound","core/SPAudioParam","core/SPAudioBufferSourceNode","core/MultiFileLoader","core/WebAudioDispatch"],function(e,t,n,o,i,r){function a(u,s,c,l,f,d,h){function p(e){g=[],y.forEach(function(e){e.disconnect()}),m.multiTrackGain.length=0,i.call(m,e,m.audioContext,m.onLoadProgress,T)}if(!(this instanceof a))throw new TypeError("Looper constructor cannot be called as a function.");t.call(this,u),this.maxSources=e.MAX_VOICES,this.minSources=1,this.modelName="Looper",this.onLoadProgress=c,this.onLoadComplete=l,this.onAudioStart=f,this.onAudioEnd=d;var m=this,y=[],A=[],g=[],T=function(e,t){m.multiTrackGain.length=t.length,t.forEach(function(e,n){A.push(0),b(e,n,t.length)}),g&&g.length>0&&m.registerParameter(new n(m,"playSpeed",0,10,1,g,null,S),!0),e&&(m.isInitialized=!0),"function"==typeof m.onLoadComplete&&m.onLoadComplete(e,t)},b=function(e,t,i){var r;if(r=y[t]instanceof o?y[t]:new o(m.audioContext),r.buffer=e,r.loopEnd=e.duration,r.onended=function(e){v(e,t,r)},i>1){var a=new n(m,"track-"+t+"-gain",0,1,1,r.gain,null,null);m.multiTrackGain.splice(t,1,a)}r.connect(m.releaseGainNode),y.splice(t,1,r),g.push(r.playbackRate)},v=function(e,t,o){var i=m.audioContext.currentTime;if(o.resetBufferSource(i,m.releaseGainNode),m.multiTrackGain.length>1){var r=new n(m,"track-"+t+"-gain"+t,0,1,1,o.gain,null,null);m.multiTrackGain.splice(t,1,r)}"function"==typeof m.onTrackEnd&&h(m,t);var a=y.reduce(function(e,t){return e&&(t.playbackState===t.FINISHED_STATE||t.playbackState===t.UNSCHEDULED_STATE)},!0);a&&m.isPlaying&&(m.isPlaying=!1,"function"==typeof m.onAudioEnd&&m.onAudioEnd())},S=function(e,t,n){if(m.isInitialized){var o=6.90776,i=y[0]?y[0].playbackRate.value:1;m.isPlaying?t>i?y.forEach(function(e){e.playbackRate.cancelScheduledValues(n.currentTime),e.playbackRate.setTargetAtTime(t,n.currentTime,m.easeIn.value/o)}):i>t&&y.forEach(function(e){e.playbackRate.cancelScheduledValues(n.currentTime),e.playbackRate.setTargetAtTime(t,n.currentTime,m.easeOut.value/o)}):y.forEach(function(e){e.playbackRate.cancelScheduledValues(n.currentTime),e.playbackRate.setValueAtTime(t,n.currentTime)})}};this.onTrackEnd=h,this.registerParameter(new n(this,"playSpeed",0,10,1.005,null,null,S),!0),this.registerParameter(n.createPsuedoParam(this,"easeIn",.05,10,.05)),this.registerParameter(n.createPsuedoParam(this,"easeOut",.05,10,.05));var C=[];C.name="multiTrackGain",this.registerParameter(C,!1),this.registerParameter(n.createPsuedoParam(this,"maxLoops",-1,1,-1)),this.setSources=function(e,n,o){t.prototype.setSources.call(this,e,n,o),p(e)},this.play=function(){if(!this.isInitialized)throw new Error(this.modelName,"hasn't finished Initializing yet. Please wait before calling start/play");var e=this.audioContext.currentTime;this.isPlaying||(y.forEach(function(t,n){var o=A&&A[n]?A[n]:t.loopStart;t.loop=1!==m.maxLoops.value,t.start(e,o)}),t.prototype.start.call(this,e),r(function(){"function"==typeof m.onAudioStart&&m.onAudioStart()},e,this.audioContext))},this.start=function(e,n,o,i){return this.isInitialized?void(this.isPlaying||(y.forEach(function(t){n=t.loopStart+parseFloat(n)||0,("undefined"==typeof o||null===o)&&(o=t.buffer.duration),t.loop=1!==m.maxLoops.value,t.start(e,n,o)}),t.prototype.start.call(this,e,n,o,i),r(function(){"function"==typeof m.onAudioStart&&m.onAudioStart()},e,this.audioContext))):void console.error(this.modelName," hasn't finished Initializing yet. Please wait before calling start/play")},this.stop=function(e){m.isPlaying&&(y.forEach(function(t,n){t.stop(e),A[n]=0}),t.prototype.stop.call(this,e),r(function(){"function"==typeof m.onAudioEnd&&m.isPlaying===!1&&m.onAudioEnd()},e,this.audioContext))},this.pause=function(){m.isPlaying&&(y.forEach(function(e,t){e.stop(0),A[t]=e.playbackPosition/e.buffer.sampleRate}),t.prototype.stop.call(this,0),r(function(){"function"==typeof m.onAudioEnd&&m.onAudioEnd()},0,this.audioContext))},this.release=function(e,o,i){("undefined"==typeof e||e<this.audioContext.currentTime)&&(e=this.audioContext.currentTime);var a=.5;o=o||a,t.prototype.release.call(this,e,o,i),i&&(this.releaseGainNode=this.audioContext.createGain(),this.destinations.forEach(function(e){m.releaseGainNode.connect(e.destination,e.output,e.input)}),y.forEach(function(t,i){t.stop(e+o),A[i]=0,t.resetBufferSource(e,m.releaseGainNode);var r=new n(m,"gain-"+i,0,1,1,t.gain,null,null);m.multiTrackGain.splice(i,1,r)}),this.isPlaying=!1,r(function(){"function"==typeof m.onAudioEnd&&m.isPlaying===!1&&m.onAudioEnd()},e+o,this.audioContext))},window.setTimeout(function(){p(s)},0)}return a.prototype=Object.create(t.prototype),a}),define("core/SoundQueue",["core/Config","models/Looper","core/FileLoader","core/WebAudioDispatch"],function(e,t,n,o){function i(n,r,a,u){function s(){m(n.currentTime+1/e.NOMINAL_REFRESH_RATE),window.requestAnimationFrame(s)}function c(){for(var e=0;u>e;e++)b[e]=new t(n,null,null,null,null,null,l),b[e].disconnect(),b[e].maxLoops.value=1,b[e].voiceIndex=e;window.requestAnimationFrame=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame,window.requestAnimationFrame(s)}function l(e){b.push(e),T.splice(T.indexOf(e),1);var t=g.reduce(function(e,t){return e||"QESTART"!==t.type},0===g.length);y.isPlaying&&0===T.length&&t&&(y.isPlaying=!1,"function"==typeof y.onAudioEnd&&y.onAudioEnd())}function f(e){for(A=0;A<T.length;A++)if(T[A].eventID==e)return T[A];return null}function d(e){for(var t=0;t<g.length;t++){var n=g[t];n.eventID===e&&(g.splice(t,1),t--)}}function h(e,t){var o;return b.length<1?(console.warn("No free voices left. Stealing the oldest"),o=T.shift(),d(o.eventID),o.eventID=e,o.release(n.currentTime,t-n.currentTime,!0),T.push(o)):(o=b.shift(),o.eventID=e,T.push(o)),o}function p(e){var t=f(e.eventID);"QESTART"!=e.type&&"QESETPARAM"!=e.type&&"QESETSRC"!=e.type||null!==t||(t=h(e.eventID,e.time)),t&&("QESTART"==e.type?(t.start(e.time,e.offset,null,e.attackDuration),o(function(){y.isPlaying||(y.isPlaying=!0,"function"==typeof y.onAudioStart&&y.onAudioStart())},e.time,n)):"QESETPARAM"==e.type?t[e.paramName]&&t[e.paramName].setValueAtTime(e.paramValue,e.time):"QESETSRC"==e.type?t.setSources(e.sourceBuffer):"QERELEASE"==e.type?t.release(e.time,e.releaseDuration):"QESTOP"==e.type?(t.pause(e.time),o(function(){b.push(t),T.splice(T.indexOf(t),1)},e.time,n)):console.warn("Unknown Event Type : "+e))}function m(e){for(var t=0;t<g.length;t++){var n=g[t];n.time<=e&&(p(n),g.splice(t,1),t--)}}if(!(this instanceof i))throw new TypeError("SoundQueue constructor cannot be called as a function.");"undefined"==typeof u&&(u=e.MAX_VOICES);var y=this;this.onAudioEnd=a,this.onAudioStart=r;var A,g=[],T=[],b=[];this.isPlaying=!1,this.queueStart=function(e,t,n,o){g.push({type:"QESTART",time:e,eventID:t,offset:n,attackDuration:o})},this.queueRelease=function(e,t,n){g.push({type:"QERELEASE",time:e,eventID:t,releaseDuration:n})},this.queueStop=function(e,t){g.push({type:"QESTOP",time:e,eventID:t})},this.queueSetParameter=function(e,t,n,o){g.push({type:"QESETPARAM",time:e,eventID:t,paramName:n,paramValue:o})},this.queueSetSource=function(e,t,n){g.push({type:"QESETSRC",time:e,eventID:t,sourceBuffer:n})},this.queueUpdate=function(e,t,n,o){for(var i=0;i<g.length;i++){var r=g[i];r.type!==e||t&&r.eventID!=t||r.hasOwnProperty(n)&&(r[n]=o)}},this.pause=function(){this.stop(0)},this.stop=function(e){m(e),g=[],T.forEach(function(t){t.release(e)}),b.forEach(function(t){t.stop(e)})},this.connect=function(e,t,n){b.forEach(function(o){o.connect(e,t,n)}),T.forEach(function(o){o.connect(e,t,n)})},this.disconnect=function(e){b.forEach(function(t){t.disconnect(e)}),T.forEach(function(t){t.disconnect(e)})},c()}return i}),define("core/Converter",[],function(){function e(){}return e.semitonesToRatio=function(e){return Math.pow(2,e/12)},e}),define("models/Extender",["core/Config","core/BaseSound","core/SoundQueue","core/SPAudioParam","core/MultiFileLoader","core/Converter","core/WebAudioDispatch"],function(e,t,n,o,i,r,a){function u(s,c,l,f,d,h){function p(e){i.call(b,e,b.audioContext,b.onLoadProgress,w)}function m(){for(var t=b.audioContext.currentTime,n=t+1/e.NOMINAL_REFRESH_RATE,o=b.eventPeriod.value;n>P||n>C+o;){var i=Math.max(t,Math.min(P,C+o)),a=r.semitonesToRatio(b.pitchShift.value),u=b.crossFadeDuration.value,s=g.duration,c=o*u,l=a*(o+c);if(l>x*s){var f=x*s/l;o*=f,c*=f}l=a*(o+c);var d=Math.max(0,s-l)*Math.random();v>0&&T.queueRelease(i,v,E),T.queueSetSource(i,S,g),T.queueSetParameter(i,S,"playSpeed",a),T.queueStart(i,S,d,c),E=c,C=i,P=i+o,v=S,++S}b.isPlaying&&window.requestAnimationFrame(m)}if(!(this instanceof u))throw new TypeError("Extender constructor cannot be called as a function.");t.call(this,s),this.maxSources=1,this.minSources=1,this.modelName="Extender",this.onLoadProgress=l,this.onLoadComplete=f;var y=d,A=h;Object.defineProperty(this,"onAudioStart",{enumerable:!0,configurable:!1,set:function(e){T&&(y=e,T.onAudioStart=e)},get:function(){return y}}),Object.defineProperty(this,"onAudioEnd",{enumerable:!0,configurable:!1,set:function(e){A=e,T&&(T.onAudioEnd=e)},get:function(){return A}});var g,T,b=this,v=0,S=1,C=0,P=0,E=0,x=.9,w=function(e,t){g=t[0],T.connect(b.releaseGainNode),e&&(b.isInitialized=!0),"function"==typeof b.onLoadComplete&&b.onLoadComplete(e,t)};this.registerParameter(o.createPsuedoParam(this,"pitchShift",-60,60,0)),this.registerParameter(o.createPsuedoParam(this,"eventPeriod",.1,10,2)),this.registerParameter(o.createPsuedoParam(this,"crossFadeDuration",.1,.99,.5)),this.setSources=function(e,n,o){t.prototype.setSources.call(this,e,n,o),p(e)},this.start=function(e,n,o,i){return this.isInitialized?(t.prototype.start.call(this,e,n,o,i),void a(m,e,this.audioContext)):void console.error(this.modelName," hasn't finished Initializing yet. Please wait before calling start/play")},this.play=function(){this.start(0)},this.pause=function(){t.prototype.pause.call(this),T.pause()},this.stop=function(e){t.prototype.stop.call(this,e),T.stop(e)},T=new n(this.audioContext,this.onAudioStart,this.onAudioEnd),window.setTimeout(function(){p(c)},0)}return u.prototype=Object.create(t.prototype),u
});