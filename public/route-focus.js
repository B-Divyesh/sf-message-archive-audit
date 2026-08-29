(() => {
  const heading = document.querySelector('h1')
  const announcer = document.querySelector('[data-route-announcer]')
  if (!(heading instanceof HTMLElement) || !(announcer instanceof HTMLElement)) return
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
