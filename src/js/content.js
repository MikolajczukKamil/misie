async function main() {
  if (document.URL.includes('urlblock')) {
    console.info("Jesteśmy na stronie z misiami", document.URL)

    document.querySelector('input[type=submit]').click()

    return
  }
}

main().then().catch(console.error)
