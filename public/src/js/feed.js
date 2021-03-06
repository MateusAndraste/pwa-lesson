var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form')
const titleInput = document.querySelector('#title')
const locationInput = document.querySelector('#location')

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(registrations => {
  //       for (const registration of registrations) {
  //         registration.unregister()
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Save Content on demand
// function onSaveButtonClicked(event) {
//   console.log('click')
//   if ('caches' in window) {
//     caches.open('user-requested')
//       .then(cache => {
//         cache.add('https://httpbin.org/get')
//         cache.add('src/images/sf-boat.jpg')
//       })
//   }
// }

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white'
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // const cardSaveButton = document.createElement('button')
  // cardSaveButton.textContent = 'Save'
  // cardSaveButton.addEventListener('click', onSaveButtonClicked)
  // cardSupportingText.appendChild(cardSaveButton)
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards()
  for (const post of data) {
    createCard(post)
  }
}

const url = 'https://testes-gerais-a5d94-default-rtdb.firebaseio.com/posts.json'
let networkDataReceived = false

// implementation of cache before network
fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true
    console.log('From web', data)
    const dataArray = []
    for (const key in data) {
      dataArray.push(data[key])
    }
    updateUI(dataArray)
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then(data => {
      if (!networkDataReceived) {
        console.log('From indexed Db', data)
        updateUI(data)
      }
    })
}

form.addEventListener('submit', event => {
  event.preventDefault()

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!')
    return
  }

  closeCreatePostModal()

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(sw => {
        let post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        }

        writeData('sync-posts', post)
          .then(() => {
            return sw.sync.register('sync-new-posts')
          })
          .then(() => {
            const snackbarContainer = document.querySelector('#confirmation-toast')
            const data = { message: 'Your post was saved for syncing!' }
            snackbarContainer.MaterialSnackbar.showSnackbar(data)
          })
          .catch(err => {
            console.error(err)
          })
      })
  } else {
    sendData()
  }
})

function sendData() {
  fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://i.pinimg.com/originals/52/05/70/5205708ccde349c427315f625113eb1a.jpg'
    }),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
    .then(res => {
      console.log('Send data', res)
      updateUI()
    })
}
