// --------------------------------------------------------
// Element References
// --------------------------------------------------------
const body = document.querySelector('body');
let activeFrequencyDisplay = document.querySelector('.info div.active-frequency span.data');

let activePanDisplay = document.querySelector('.info div.active-pan span.data');
let activePanUnitDisplay = document.querySelector('.info div.active-pan span.unit');

// --------------------------------------------------------
// Touch Feedback Global Variables
// --------------------------------------------------------
let activeData = {
    freq: 0,
    pan: 0
};

let touchHapticArray = [];
let isMousedown = 0;

// --------------------------------------------------------
// Utility
// --------------------------------------------------------
const seturiHash = (hash) => {
    location.hash = hash;
    return location.hash;
}


// --------------------------------------------------------
// App state constructor
// --------------------------------------------------------
class appState {
    constructor() {
        this.stateName = 'pan';
        this.component = {
            container: document.querySelector('div.info.app'),
            frequency: document.querySelector('div.info.app div.active-frequency'),
            dynamic: [
                    {
                        name: 'pan',
                        selectors: {
                            display: document.querySelector('div.info.app div.active-pan'),
                            navBtn: document.querySelector('nav ul li.pan')
                        }
                    },
                    {
                        name: 'waveshape',
                        selectors: {
                            display: document.querySelector('div.info.app div.active-waveshape'),
                            navBtn: document.querySelector('nav ul li.waveshape')
                        }
                    },
                    {
                        name: 'vocal',
                        selectors: {
                            display: document.querySelector('div.info.app div.active-vocal'),
                            navBtn: document.querySelector('nav ul li.mic')
                        }
                    }
            ]                        
        };
    }

    updateuiComponents(stateName) {
        
        if(stateName === 'vocal'){
            this.component.frequency.classList.add('inactive');
        }else{
            this.component.frequency.classList.remove('inactive');
        }
        
        for (let stateComponent of this.component.dynamic) {
            
            if(stateComponent.name === stateName){
                stateComponent.selectors.display.classList.remove('inactive');
                stateComponent.selectors.navBtn.classList.add('active');
            }else{
                stateComponent.selectors.display.classList.add('inactive');
                stateComponent.selectors.navBtn.classList.remove('active');
            }            
        }
    }

    setState() {
        //remove the octothorpe char from URI hash
        let uriHash = location.hash.toString().slice(1);
        // set state based on URI hash
        switch (uriHash) {
            case 'waveshape':
                this.stateName = 'waveshape';
                break;
            case 'vocal':
                this.stateName = 'vocal';
                break;
            case 'pan':
                this.stateName = 'pan';
                break;
            // there is no err state, only zuul
            default:
                this.stateName = 'pan';
        }
        this.updateuiComponents(this.stateName);
        return this.stateName;
    }
}

let app = new appState();

// --------------------------------------------------------
// Tone.js Global Variables
// --------------------------------------------------------
Tone.Transport.toggle(); //start the transport
let masterVolume = new Tone.Volume(-12);
let stereoPanner = new Tone.Panner(0.5);
let ampEnv = new Tone.AmplitudeEnvelope({
	"attack": 0.08,
	"decay": 0.2, // arbitrary, since sustain is max
	"sustain": 1.0,
	"release": 0.2
})
let stereoOsc = new Tone.Oscillator(448, "sine").chain(stereoPanner, ampEnv, masterVolume, Tone.Master);
// --------------------------------------------------------
// Parse Data, Update Audio playback
// --------------------------------------------------------
const updateOscData = (data, osc, panner) => {
    osc.frequency.value = data.freq;
    panner.pan.value = data.pan;
}

/**
 * receives touch data and converts to frequency and stereo pan
 * updates active tone information and updates user display
 * @param {Object} data touch X/Y coordinates
 */
const parseTouchData = (data) => {
    // touch Y as a percentage 0/100
    let freq = (data.userY / window.screen.height).toFixed(2);
    // invert Y scale
    freq = 1 - freq;
    // limit at edges
    if(freq > 1) freq = 1;
    if(freq < 0) freq = 0;

    // this yields a curve that expands the high frequencies 
    // freq = (2 - ( -Math.log10(freq) ))/2 ;

    // this yields a curve that expands the low frequencies
    freq = ( Math.pow(freq, 3) ) ;

    // if I can invert this S curve (sigmoid) it would be ideal
    // freq = 1 / (1 + Math.exp(-freq))
    
    freq = Math.floor(freq * 10000);

    if(freq > 20000) freq = 20000;
    if(freq < 0) freq = 0;
    
    activeData.freq = freq;

    let pan = (data.userX / window.screen.width).toFixed(2);
    if(pan > 1) pan = 1;
    if(pan < 0) pan = 0;

    if(pan < 0.5){
        // pan = Math.floor(-pan * 64);
        activePanUnitDisplay.innerText = 'L';
    }else if(pan == 0.5){
        activePanUnitDisplay.innerText = 'C';
    }else{
        // pan = Math.floor(pan  * 64);
        activePanUnitDisplay.innerText = 'R';
    }

    activeData.pan = pan;

    updateOscData({
        freq: activeData.freq,
        pan: activeData.pan
    }, stereoOsc, stereoPanner);

    setDisplayData({
        freq: activeData.freq,
        pan: activeData.pan
    });
}

const setDisplayData = (data) => {
    if(data.freq >= 1000){
        // round out the number so it looks prettier
        data.freq = String( Math.round( (data.freq / 100).toFixed(1) ) / 10 ) + 'k';
    }

    activeFrequencyDisplay.innerText = data.freq;
    activePanDisplay.innerText = data.pan;
}

const killTouchHaptic = (index, haptic) => {
    haptic.classList.remove('anim');
    haptic.style.display = 'none';
    haptic.remove();
    touchHapticArray[index] = undefined;
    // touchHapticArray could become very large.
    // wait until there are no touches then splice the whole arr    
}
// --------------------------------------------------------
// View Updaters
// --------------------------------------------------------
const createTouchHaptic = (e, isTouchEvent) => {
    
    if(isTouchEvent){
        parseTouchData({
            userY: e.touches[0].clientY,
            userX: e.touches[0].clientX
        })
    }else{
        parseTouchData({
            userY: e.clientY,
            userX: e.clientX
        })
    }    

    const touchHapticContainer = document.createElement('div');
    touchHapticContainer.classList.add('touch-haptic');

    touchHapticArray.push(touchHapticContainer);

    const addHapticEffect = new Promise ((resolve, reject) => {
        e.target.appendChild(touchHapticContainer);
        setTimeout(() => {
            resolve('done');  
        }, 50);
    });

    const addHapticAnim = () => {
        touchHapticContainer.classList.add('anim')
    }

    addHapticEffect.then(addHapticAnim)
    
    touchHapticContainer.style.display = 'block';

    if(isTouchEvent){
        touchHapticContainer.style.left = e.touches[0].clientX + 'px';
        touchHapticContainer.style.top = e.touches[0].clientY + 'px';
    }else{
        touchHapticContainer.style.left = e.clientX + 'px';
        touchHapticContainer.style.top = e.clientY + 'px';
    }
}

const updateBGC = (touchCoordinates) => {
    let userY = (touchCoordinates.userY / window.screen.height).toFixed(2);
    userY = String(userY * 100) + '%';
    body.style.backgroundPositionY = userY;
}

// --------------------------------------------------------
// Event Handlers
// --------------------------------------------------------

const handleStart = (e, isTouchEvent)=> {    
    createTouchHaptic(e, isTouchEvent);

    if(isTouchEvent){

        updateBGC({
            userY: e.touches[0].clientY,
            userX: e.touches[0].clientX
        });

    }else{
        updateBGC({
            userY: e.clientY,
            userX: e.clientX
        });        
    }

    stereoOsc.start();
    ampEnv.triggerAttack();
}

const handleMove = (e, isTouchEvent)=> {
    // console.log('move')
    e.preventDefault(); 
    if(isTouchEvent){

        parseTouchData({
            userY: e.touches[0].clientY,
            userX: e.touches[0].clientX
        });
        if(typeof touchHapticArray[touchHapticArray.length-1] !== "undefined"){        
            touchHapticArray[touchHapticArray.length-1].style.left = e.touches[0].clientX + 'px';
            touchHapticArray[touchHapticArray.length-1].style.top = e.touches[0].clientY + 'px';
        }

        updateBGC({
            userY: e.touches[0].clientY,
            userX: e.touches[0].clientX
        });

    }else{
        parseTouchData({
            userY: e.clientY,
            userX: e.clientX
        });
        if(typeof touchHapticArray[touchHapticArray.length-1] !== "undefined"){
            touchHapticArray[touchHapticArray.length-1].style.left = e.clientX + 'px';
            touchHapticArray[touchHapticArray.length-1].style.top = e.clientY + 'px';
        }

        updateBGC({
            userY: e.clientY,
            userX: e.clientX
        });        
    }
}

const handleEnd = (e, isTouchEvent)=> {
    // console.log('end')
    ampEnv.triggerRelease();
    
    // if(isTouchEvent){

        const touchHapticIndex = touchHapticArray.length-1;
        const touchHapticContainer = touchHapticArray[touchHapticArray.length-1];
    
        killTouchHaptic(touchHapticIndex, touchHapticContainer);
    // }
}

const handleCancel = (e, isTouchEvent)=> {
    // console.log('cancel')
    ampEnv.triggerRelease();
    
    // if(isTouchEvent){
        const touchHapticIndex = touchHapticArray.length-1;
        const touchHapticContainer = touchHapticArray[touchHapticArray.length-1];
    
        killTouchHaptic(touchHapticIndex, touchHapticContainer);
    // }
}
// --------------------------------------------------------
// Register Event Handlers
// --------------------------------------------------------
// touch events
body.addEventListener("touchstart", e => { handleStart(e, true) }, false);
body.addEventListener("touchend", e => {handleEnd(e, true)}, false);
body.addEventListener("touchmove", e => {handleMove(e, true)}, { passive: false });
body.addEventListener("touchcancel", e => {handleCancel(e, true)}, false);
// mouse events
body.addEventListener("mousedown", e => { handleStart(e, false) }, false);
body.addEventListener("mouseup", e => {handleEnd(e, false)}, false);
body.addEventListener("mousemove", e => {handleMove(e, false)}, { passive: false });
// window events
window.addEventListener("hashchange", e => {
    // console.log(app.setState());
    app.setState();
});
window.addEventListener("load", e => {
    // console.log(app.setState());
    app.setState();
});