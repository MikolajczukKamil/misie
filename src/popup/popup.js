console.log("Misie popup", document)

function startAction() {
  chrome.runtime.sendMessage({ request: "start", data: {} })
}

async function getPages() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "get:pages", data: {} }, resolve)
  })
}

async function resetList() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "reset:full", data: {} }, resolve)
  })
}

async function resetDefaultsList() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "reset:defaults", data: {} }, resolve)
  })
}

async function resetUserPagesList() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "reset:user", data: {} }, resolve)
  })
}

async function addPage(page) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "add:page", data: page }, resolve)
  })
}

async function deletePage(page) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "delete:page", data: page }, resolve)
  })
}

async function showPages() {
  const list = document.querySelector("#pages-list")

  const scrollTop = list.scrollTop

  Array.from(list.children).forEach(element => list.removeChild(element))

  const pages = await getPages()

  for (const page of pages) {
    const li = document.createElement('li')
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add("small", "secondary")
    deleteBtn.addEventListener('click', () => {
      deletePage(page).then(() => showPages()).then()
    })
    deleteBtn.innerText = 'X'
    deleteBtn.title = 'Usuń'
    li.appendChild(deleteBtn)

    li.append(" ", page)

    list.appendChild(li);
  }

  list.scroll({ top: scrollTop })
}

async function main() {
  chrome.runtime.onMessage.addListener(
    (message) => {
      try {
        if (message.request === 'state:change') {
          const working = message.data === 'working'
          document.querySelector('#clean-btn').disabled = working
          document.querySelector('#clean-on').style.display = working ? '' : 'none'
          document.querySelector('#clean-off').style.display = working ? 'none' : ''
        }
      } catch (e) {
        console.error(e)
      }
    }
  );

  chrome.runtime.sendMessage({ request: "propagate:change", data: {} })

  document.querySelector('#clean-btn').addEventListener('click', startAction)

  document.querySelector("#add-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      document.querySelector("#add-btn").click()
    }
  });

  document.querySelector("#add-btn").addEventListener('click', () => {
    const input = document.querySelector("#add-input")

    addPage(input.value).then(() => {
      input.value = ''

      return showPages()
    }).then()
  })

  document.querySelector("#reset").addEventListener('click', () => {
    resetList().then(showPages).then()
  })

  document.querySelector("#reset-defaults").addEventListener('click', () => {
    resetDefaultsList().then(showPages).then()
  })

  document.querySelector("#reset-user").addEventListener('click', () => {
    resetUserPagesList().then(showPages).then()
  })

  await showPages()
}


main().then().catch(console.error)
