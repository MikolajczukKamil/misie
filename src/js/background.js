console.log('Misie 1.0.0 background', new Date())

const defaultPages = [
  // FB
  'https://facebook.com',
  'https://edge-chat.facebook.com',
  'https://scontent-waw1-1.xx.fbcdn.net',

  // TT
  'https://twitter.com',
  'https://pic.twitter.com',
  'https://abs.twimg.com',

  // Muzyka
  'https://spotify.com',
  'https://tidal.com',
  'https://music.youtube.com',

  // Google
  'https://drive.google.com',
  'https://docs.google.com',
  'https://keep.google.com',

  // Gify
  'https://giphy.com',
  'https://tenor.com',

  // Video
  'https://youtube.com',
  'https://streamable.com',

  // Instagram
  'https://instagram.com',
]

const State = {
  init: 'init',
  working: 'working',
  done: 'done',
}

const Actions = {
  start: 'start',
  addPage: 'add:page',
  deletePage: 'delete:page',
  getPages: 'get:pages',
  resetFull: 'reset:full',
  resetDefaults: 'reset:defaults',
  resetUserDeletes: 'reset:user',
  propagateChange: 'propagate:change',
  stateChanged: 'state:change',
}

let state = State.init
let userAddedPages = []
let userDeletedPages = []

function setState(value) {
  state = value

  console.info("State", state, new Date())

  chrome.runtime.sendMessage({ request: Actions.stateChanged, data: state }).catch(() => null).then()
}

async function Unlock(url) {
  console.log('Unlock: Start', url)

  const res = await fetch(url)

  if (!res.url.includes('urlblock')) {
    console.log('Unlock: URL ok', url, '->', res.url)

    return false
  }

  console.log('Unlock: Próba zaakceptowania', url, '->', res.url)

  const postRes = await fetch(
      res.url,
      {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'accept-language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded',
          'pragma': 'no-cache',
          'upgrade-insecure-requests': '1'
        },
        referrer: res.url,
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: 'ok=Continue',
        method: 'POST',
        mode: 'cors',
        credentials: 'include'
      });

  if (new URL(postRes.url).toString() === new URL(url).toString()) {
    console.log('Unlock: Full success', url)
  } else {
    console.log('Unlock: Mamy nadzieję że jest ok', res, postRes)
  }

  return true
}

async function save() {
  await chrome.storage?.sync.set({ userAddedPages, userDeletedPages })
}

async function addPage(page) {
  userAddedPages.push(page)
  userDeletedPages = userDeletedPages.filter(url => url !== page)

  await save()
}

async function addDefaults() {
  userDeletedPages = userDeletedPages.filter(url => !defaultPages.includes(url))

  await save()
}

async function deletePage(page) {
  userDeletedPages.push(page)
  userAddedPages = userAddedPages.filter(url => url !== page)

  await save()
}

async function deleteUserPages() {
  userAddedPages = []

  await save()
}

async function resetPages() {
  userAddedPages = []
  userDeletedPages = []

  await save()
}

function getAllPages() {
  return Array.from(
      new Set(
          [...defaultPages, ...userAddedPages]
              .filter(url => !userDeletedPages.includes(url))
              .map(url => url.trim())
      )
  )
}

async function UnlockAll() {
  if (state === State.working) {
    return
  }

  setState(State.working)

  const pages = getAllPages()

  await Promise.all(
      pages.map(
          page => Unlock(page)
              .catch((e) => {
                console.error("Request", e)

                return false
              })
      )
  )

  setState(State.done)
}


async function main() {
  chrome.runtime.onMessage.addListener(
      (message, _sender, sendResponse) => {
        console.log('Message', message)

        try {
          if (message.request === Actions.start) {
            return UnlockAll().then(sendResponse)
          }

          if (message.request === Actions.addPage) {
            addPage(message.data)
                .then(() => setState(State.working))
                .then(() => Unlock(message.data))
                .then(() => setState(State.done))
                .then()

            return sendResponse(getAllPages())
          }

          if (message.request === Actions.resetDefaults) {
            addDefaults()
                .then(() => UnlockAll())
                .then()

            return sendResponse(getAllPages())
          }

          if (message.request === Actions.deletePage) {
            deletePage(message.data)
                .then()

            return sendResponse(getAllPages())
          }

          if (message.request === Actions.resetUserDeletes) {
            deleteUserPages()
                .then()

            return sendResponse(getAllPages())
          }


          if (message.request === Actions.resetFull) {
            resetPages()
                .then(() => UnlockAll())
                .then()

            return sendResponse(getAllPages())
          }

          if (message.request === Actions.getPages) {
            return sendResponse(getAllPages())
          }

          if (message.request === Actions.propagateChange) {
            setState(state)

            return sendResponse(state)
          }

          return sendResponse(null)
        } catch (e) {
          console.error("Przetwarzanie wiadomości", e)
        }
      }
  );

  const store = await chrome.storage?.sync.get(['userAddedPages', 'userDeletedPages'])

  userAddedPages = store?.userAddedPages || []
  userDeletedPages = store?.userDeletedPages || []

  await UnlockAll()
}

main().then().catch(console.error)
