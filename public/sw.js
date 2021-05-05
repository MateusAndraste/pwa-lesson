importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

const CACHE_STATIC_NAME = 'static-v14'
const CACHE_DYNAMIC_NAME = 'dynamic-v2'
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
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

self.addEventListener('fetch', event => {
  const url = 'https://testes-gerais-a5d94-default-rtdb.firebaseio.com/posts'

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clonedRes = res.clone()
          clearAllData('posts')
            .then(() => {
              return clonedRes.json()
            })
            .then(data => {
              for (const key in data) {
                writeData('posts', data[key])
              }
            })
          return res
        })
    )
  } else if (isInArray(event.request.url, STATIC_FILES)) {
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
                    // trimCache(CACHE_DYNAMIC_NAME, 5)
                    cache.put(event.request.url, res.clone())
                    return res
                  })
              })
              .catch(err => {
                return caches.open(CACHE_STATIC_NAME)
                  .then(cache => {
                    if (event.request.headers.get('accept').includes('text/html'))
                      return cache.match('/offline.html')
                  })
              })
          }
        })
    )
  }
})

self.addEventListener('sync', event => {
  console.log('[Service Worker] Background syncing', event)

  
})

function isInArray (string, array) {
  return array.includes(string)
}

function trimCache (cacheName, maxItems) {
  caches.open(cacheName)
    .then(cache => {
      return cache.keys()
        .then(keys => {
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(trimCache(cacheName, maxItems))
          }
        })
    })
}
