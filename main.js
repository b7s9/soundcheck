const body = document.querySelector('body');
let activeFrequencyDisplay = document.querySelector('.info div.active-frequency span.data');
// const activeFrequencyUnitDisplay = document.querySelector('.info div.active-frequency span.unit');

let activePanDisplay = document.querySelector('.info div.active-pan span.data');
let activePanUnitDisplay = document.querySelector('.info div.active-pan span.unit');

let activeData = {
    freq: 0,
    pan: 0
};

let touchHapticArray = [];

const updateData = (data) => {
    let freq = (data.userY / window.screen.height).toFixed(2);
    if(freq > 1) freq = 1;
    if(freq < 0) freq = 0;
    freq = 10000 - Math.floor(freq * 10000);
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



    updateDisplay({
        freq: activeData.freq,
        pan: activeData.pan
    });
}

const updateDisplay = (data) => {
    activeFrequencyDisplay.innerText = data.freq;
    activePanDisplay.innerText = data.pan;

    // pan < 0 ? activePanUnitDisplay.innerText = 'L' : activePanUnitDisplay.innerText = 'R';
}

const killTouchHaptic = (index, haptic) => {
    haptic.classList.remove('anim');
    haptic.style.display = 'none';
    haptic.remove();
    touchHapticArray[index] = undefined;
    // touchHapticArray could become very large.
    // wait until there are no touches then splice the whole arr
    
}

const createTouchHaptic = (e) => {
     // console.log('start')
    // console.log(e);
    // console.log('X: ' + e.touches[0].clientX);
    // console.log('Y: ' + e.touches[0].clientY);

    updateData({
        userY: e.touches[0].clientY,
        userX: e.touches[0].clientX
    })

    const touchHapticContainer = document.createElement('div');
    touchHapticContainer.classList.add('touch-haptic');

    // const touchHapticInner = document.createElement('div');
    // touchHapticInner.classList.add('touch-haptic');
    // touchHapticInner.classList.add('inner');
    // touchHapticContainer.appendChild(touchHapticInner);

    touchHapticArray.push(touchHapticContainer);

    // let touchData = {
    //     container: touchHapticContainer        
    // }
    
    // const touchHapticIndex = touchHapticArray.length-1;


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

    addHapticEffect.then(addHapticAnim).then()
    
    touchHapticContainer.style.display = 'block';
    touchHapticContainer.style.left = e.touches[0].clientX + 'px';
    touchHapticContainer.style.top = e.touches[0].clientY + 'px';
}

const handleStart = (e)=> {
   createTouchHaptic(e);
}

const handleMove = (e)=> {
    // console.log('move')
    e.preventDefault(); 
    touchHapticArray[touchHapticArray.length-1].style.left = e.touches[0].clientX + 'px';
    touchHapticArray[touchHapticArray.length-1].style.top = e.touches[0].clientY + 'px';

    updateData({
        userY: e.touches[0].clientY,
        userX: e.touches[0].clientX
    })
}

const handleEnd = (e)=> {
    // console.log('end')
    const touchHapticIndex = touchHapticArray.length-1;
    const touchHapticContainer = touchHapticArray[touchHapticArray.length-1]

    killTouchHaptic(touchHapticIndex, touchHapticContainer)

}

const handleCancel = (e)=> {
    // console.log('cancel')
    const touchHapticIndex = touchHapticArray.length-1;
    const touchHapticContainer = touchHapticArray[touchHapticArray.length-1]

    killTouchHaptic(touchHapticIndex, touchHapticContainer)
}

body.addEventListener("touchstart", e => { handleStart(e) }, false);
body.addEventListener("touchend", handleEnd, false);
body.addEventListener("touchcancel", handleCancel, false);
body.addEventListener("touchmove", handleMove, { passive: false });

// body.addEventListener("mousedown", e => { handleStart(e) }, false);
// body.addEventListener("mouseup", handleEnd, false);
// // body.addEventListener("touchcancel", handleCancel, false);
// body.addEventListener("mousemove", handleMove, false);