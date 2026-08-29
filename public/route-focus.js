(() => {
  const main = document.querySelector('main')
  const heading = document.querySelector('h1')
  const announcer = document.querySelector('[data-route-announcer]')
  if (!(main instanceof HTMLElement) || !(heading instanceof HTMLElement) || !(announcer instanceof HTMLElement)) return
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a.skip[href="#main"]') : null
    if (!(link instanceof HTMLAnchorElement)) return
    event.preventDefault()
    history.pushState(null, '', '#main')
    main.focus({ preventScroll: true })
    main.scrollIntoView({ block: 'start' })
  })
  const focusRoute = () => {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
    announcer.textContent = document.title
  }
  const navigation = performance.getEntriesByType('navigation')[0]
  const fromThisSite = document.referrer !== '' && new URL(document.referrer).origin === location.origin
  if (fromThisSite || navigation?.type === 'back_forward') focusRoute()
  else window.addEventListener('pageshow', event => { if (event.persisted) focusRoute() }, { once: true })
})()
