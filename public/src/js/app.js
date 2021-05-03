let deferredPromt

if (!window.Promise) {
    window.Promise = Promise
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registered!'))
        .catch(err => console.log(err))
}


window.addEventListener('beforeinstallprompt', event => {
    console.log('beforeinstallprompt fired')
    event.preventDefault()
    deferredPromt = event
    return false
})
