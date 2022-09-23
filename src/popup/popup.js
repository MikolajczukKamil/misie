console.log('Misie 1.0.0 popup', new Date())

/**
 * @param request {string}
 * @param data {any}
 * @return {Promise<any>}
 */
const sendMessage = (request, data = null) => chrome.runtime.sendMessage({ request, data })

/**
 * @param selector {string}
 * @return {HTMLElement}
 */
const $ = (selector) => document.querySelector(selector)

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

async function showPages() {
  const list = $('#pages-list')

  const scrollTop = list.scrollTop

  Array.from(list.children).forEach(element => list.removeChild(element))

  const pages = await sendMessage(Actions.getPages)

  for (const page of pages) {
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add('small', 'secondary')
    deleteBtn.addEventListener('click', () => {
      sendMessage(Actions.deletePage, page).then(() => showPages()).then()
    })
    deleteBtn.innerText = 'X'
    deleteBtn.title = 'Usuń'

    const li = document.createElement('li')
    li.appendChild(deleteBtn)
    li.append(' ', page)
    list.appendChild(li);
  }

  list.scroll({ top: scrollTop })
}

async function main() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      if (message.request === Actions.stateChanged) {
        const working = message.data === State.working

        $('#clean-btn').disabled = working
        $('#clean-on').style.display = working ? '' : 'none'
        $('#clean-off').style.display = working ? 'none' : ''

        return sendResponse(null)
      }
    } catch (e) {
      console.error(e)
    }

    return sendResponse(null)
  });

  $('#add-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      $('#add-btn').click()
    }
  });

  $('#clean-btn').addEventListener('click', () => {
    sendMessage(Actions.start).then()
  })

  $('#add-btn').addEventListener('click', () => {
    const input = $('#add-input')
    const value = input.value

    input.value = ''

    sendMessage(Actions.addPage, value).then(() => showPages()).then()
  })

  $('#reset').addEventListener('click', () => {
    sendMessage(Actions.resetFull).then(showPages).then()
  })

  $('#reset-defaults').addEventListener('click', () => {
    sendMessage(Actions.resetDefaults).then(showPages).then()
  })

  $('#reset-user').addEventListener('click', () => {
    sendMessage(Actions.resetUserDeletes).then(showPages).then()
  })

  await sendMessage(Actions.propagateChange)

  await showPages()
}

main().then().catch(console.error)
