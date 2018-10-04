
// console.log('hello')
// console.log(indexController)
// // layout type
function getDeviceState(){
    // add the class to the page
	let indicator
    if(!document.querySelector('.state-indicator')){
        indicator = document.createElement('div');
        indicator.className = 'state-indicator';
        document.body.appendChild(indicator);
    } else {
		indicator = document.querySelector('.state-indicator')
    }
    return parseInt(window.getComputedStyle(indicator).getPropertyValue('z-index'), 10);
}
function detectState3(){
    return getDeviceState() === 3 ? true : false
}
