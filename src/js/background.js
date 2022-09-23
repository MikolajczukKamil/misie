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

async function Unlock(url) {
  console.log("Unlock: Start", url)

  const res = await fetch(url)

  if (!res.url.includes('urlblock')) {
    console.log("Unlock: URL ok", url, '->', res.url)

    return false
  }

  console.log("Unlock: Próba zaakceptowania", url, '->', res.url)

  const postRes = await fetch(
    res.url,
    {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        "pragma": "no-cache",
        "upgrade-insecure-requests": "1"
      },
      referrer: res.url,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: "ok=Continue",
      method: "POST",
      mode: "cors",
      credentials: "include"
    });

  if (new URL(postRes.url).toString() === new URL(url).toString()) {
    console.log("Unlock: Full success", url)
  } else {
    console.log("Unlock: Mamy nadzieję że jest ok", res, postRes)
  }

  return true
}

let userAddedPages = []
let userDeletedPages = []

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

let state = 'init'

function setState(value) {
  state = value

  chrome.runtime.sendMessage({ request: "state:change", data: state })
}

async function UnlockAll() {
  if (state === 'working') {
    return
  }

  setState('working')

  const pages = getAllPages()

  await Promise.all(
    pages.map(
      page => Unlock(page)
        .catch((e) => {
          console.error(e)

          return false
        })
    )
  )

  setState('done')
}


async function main() {
  console.log("Misie 0.0.3", new Date())

  chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      console.log("Message", message)

      try {
        if (message.request === 'start') {
          return UnlockAll().then(sendResponse)
        }

        if (message.request === 'add:page') {
          addPage(message.data)
            .then(() => Unlock(message.data))
            .then()

          return sendResponse(getAllPages())
        }

        if (message.request === 'reset:defaults') {
          addDefaults()
            .then(() => UnlockAll())
            .then()

          return sendResponse(getAllPages())
        }

        if (message.request === 'delete:page') {
          deletePage(message.data)
            .then()

          return sendResponse(getAllPages())
        }

        if (message.request === 'reset:user') {
          deleteUserPages(message.data)
            .then()

          return sendResponse(getAllPages())
        }


        if (message.request === 'reset:full') {
          resetPages()
            .then(() => UnlockAll())
            .then()

          return sendResponse(getAllPages())
        }

        if (message.request === 'get:pages') {
          return sendResponse(getAllPages())
        }

        if (message.request === 'get:state') {
          return sendResponse(state)
        }

        if (message.request === 'propagate:change') {
          setState(state)

          return sendResponse(state)
        }

        return sendResponse(null)
      } catch (e) {
        console.error(e)
      }
    }
  );

  userAddedPages = (await chrome.storage?.sync.get('userAddedPages'))?.userAddedPages || []

  await UnlockAll()
}

main().then().catch(console.error)
