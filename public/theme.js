(() => {
  const button = document.querySelector('[data-theme-toggle]')
  if (!(button instanceof HTMLButtonElement)) return
  const apply = (dark) => {
    document.documentElement.dataset.theme = dark ? 'dark' : ''
    button.setAttribute('aria-pressed', String(dark))
    button.setAttribute('aria-label', dark ? 'Use light color theme' : 'Use dark color theme')
  }
  apply(localStorage.getItem('archive-audit-theme') === 'dark')
  button.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark'
    localStorage.setItem('archive-audit-theme', dark ? 'dark' : 'light')
    apply(dark)
  })
})()
