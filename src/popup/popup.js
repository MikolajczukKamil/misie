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
    chrome.runtime.sendMessage({ request: "reset:pages", data: {} }, resolve)
  })
}

async function addPage(page) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ request: "add:page", data: page }, resolve)
  })
}

async function showPages() {
  const list = document.querySelector("#pages-list")

  Array.from(list.children).forEach(element => list.removeChild(element))

  for (const page of await getPages()) {
    const li = document.createElement('li')
    li.textContent = page

    list.appendChild(li);
  }
}

async function main() {
  chrome.runtime.onMessage.addListener(
    (message) => {
      try {
        if (message.request === 'state:change') {
          document.querySelector('#clean-btn').disabled = message.data === 'working'
        }
      } catch (e) {
        console.error(e)
      }
    }
  );

  document.querySelector('#clean-btn').addEventListener('click', startAction)

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

  await showPages()
}


main().then().catch(console.error)
