// --------------------------------------------------------
// Element References
// --------------------------------------------------------
const body = document.querySelector('body');
let activeFrequencyDisplay = document.querySelector('.info div.active-frequency span.data');
// const activeFrequencyUnitDisplay = document.querySelector('.info div.active-frequency span.unit');

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

// --------------------------------------------------------
// Tone.js Global Variables
// --------------------------------------------------------
Tone.Transport.toggle(); //start the transport
let masterVolume = new Tone.Volume(-12);
let stereoPanner = new Tone.Panner(0.5);
let stereoOsc = new Tone.Oscillator(448, "sine").chain(stereoPanner, masterVolume, Tone.Master);
// --------------------------------------------------------
// Parse Data, Update Audio playback
// --------------------------------------------------------
const updateOscData = (data, osc) => {
    osc.frequency.value = data.freq;
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
    // console.log('Y percent: '+freq.toFixed(2))

    // this yields a curve that expands the high frequencies 
    // freq = (2 - ( -Math.log10(freq) ))/2 ;

    // this yields a curve that favors the low frequencies
    freq = ( Math.pow(freq, 3) ) ;

    // if I can invert this S curve (sigmoid) it would be ideal
    // freq = 1 / (1 + Math.exp(-freq))
    
    // console.log('log10(y): ' +freq.toFixed(2))
    
    freq = Math.floor(freq * 10000);
    // console.log(freq)

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
    }, stereoOsc);

    setDisplayData({
        freq: activeData.freq,
        pan: activeData.pan
    });
}

const setDisplayData = (data) => {
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
// Event Handlers
// --------------------------------------------------------
const createTouchHaptic = (e) => {
    parseTouchData({
        userY: e.touches[0].clientY,
        userX: e.touches[0].clientX
    })

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
        // setTimeout(() => {
        //     killTouchHaptic(touchHapticIndex, touchHapticContainer)
        // }, 1000);
    }

    addHapticEffect.then(addHapticAnim)
    
    touchHapticContainer.style.display = 'block';
    touchHapticContainer.style.left = e.touches[0].clientX + 'px';
    touchHapticContainer.style.top = e.touches[0].clientY + 'px';
}

const handleStart = (e)=> {
   createTouchHaptic(e);

   stereoOsc.start();
}

const handleMove = (e)=> {
    // console.log('move')
    e.preventDefault(); 
    touchHapticArray[touchHapticArray.length-1].style.left = e.touches[0].clientX + 'px';
    touchHapticArray[touchHapticArray.length-1].style.top = e.touches[0].clientY + 'px';

    parseTouchData({
        userY: e.touches[0].clientY,
        userX: e.touches[0].clientX
    })
}

const handleEnd = (e)=> {
    // console.log('end')
    stereoOsc.stop();

    const touchHapticIndex = touchHapticArray.length-1;
    const touchHapticContainer = touchHapticArray[touchHapticArray.length-1];

    killTouchHaptic(touchHapticIndex, touchHapticContainer);
}

const handleCancel = (e)=> {
    // console.log('cancel')
    stereoOsc.stop();

    const touchHapticIndex = touchHapticArray.length-1;
    const touchHapticContainer = touchHapticArray[touchHapticArray.length-1];

    killTouchHaptic(touchHapticIndex, touchHapticContainer);
}

body.addEventListener("touchstart", e => { handleStart(e) }, false);
body.addEventListener("touchend", handleEnd, false);
body.addEventListener("touchcancel", handleCancel, false);
body.addEventListener("touchmove", handleMove, { passive: false });

// body.addEventListener("mousedown", e => { handleStart(e) }, false);
// body.addEventListener("mouseup", handleEnd, false);
// // body.addEventListener("touchcancel", handleCancel, false);
// body.addEventListener("mousemove", handleMove, false);