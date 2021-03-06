const CACHE_STATIC_NAME = 'static-v9'
const CACHE_DYNAMIC_NAME = 'dynamic-v2'
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker...', event)
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function (cache) {
        console.log('[Service Worker] Precaching App Shell')
        cache.addAll(STATIC_FILES)
      })
  )
})

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker...', event)
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache', key)
            return caches.delete(key)
          }
        }))
      })
  )
  return self.clients.claim()
})

// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request)
//       .then(response => {
//         if (response) {
//           return response
//         } else {
//           return fetch(event.request)
//             .then(res => {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(cache => {
//                   cache.put(event.request.url, res.clone())
//                   return res
//                 })
//             })
//             .catch(err => {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(cache => {
//                   return cache.match('/offline.html')
//                 })
//             })
//         }
//       })
//   )
// })

// implementation of cache then network & dynamic cache
self.addEventListener('fetch', event => {
  const url = 'https://httpbin.org/get'

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(cache => {
          return fetch(event.request)
            .then(res => {
              cache.put(event.request, res.clone())
              return res
            })
        })
    )
  } else if (new RegExp('\\b' + STATIC_FILES.join('\\b|\\b') + '\\b')) {
    event.respondWith(caches.match(event.request))
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response
          } else {
            return fetch(event.request)
              .then(res => {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(cache => {
                    cache.put(event.request.url, res.clone())
                    return res
                  })
              })
              .catch(err => {
                return caches.open(CACHE_STATIC_NAME)
                  .then(cache => {
                    if (event.request.url.indexOf('/help'))
                      return cache.match('/offline.html')
                  })
              })
          }
        })
    )
  }

})

// implementatio of network with Cache Fallback
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request)
//       .catch(err => {
//         return caches.match(event.request)
//       })
//   )
// })

// implementatio of network with Cache Fallback with dynamic cache
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request)
//       .then(res => {
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(cache => {
//             cache.put(event.request.url, res.clone())
//             return res
//           })
//       })
//       .catch(err => {
//         return caches.match(event.request)
//       })
//   )
// })

// implementatio of cache only strategy
// self.addEventListener('fetch', event => {
//   event.respondWith(caches.match(event.request))
// })

// implementatio of network only strategy
// self.addEventListener('fetch', event => {
//   fetch(event.request)
// })
