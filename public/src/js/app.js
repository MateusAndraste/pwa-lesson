let deferredPromt

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered!'))
}
if (!window.Promise) {
    window.Promise = Promise
}

window.addEventListener('beforeinstallprompt', event => {
    console.log('beforeinstallprompt fired')
    event.preventDefault()
    
    deferredPromt = event
    return false
})
