// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute('href'))
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  })
})

// Add animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = 'translateY(0)'
    }
  })
}, observerOptions)

// Observe all feature cards and download cards
document.querySelectorAll('.feature-card, .download-card').forEach((card) => {
  card.style.opacity = '0'
  card.style.transform = 'translateY(20px)'
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
  observer.observe(card)
})

// Detect user's OS and highlight the appropriate download button
function detectOS() {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform.toLowerCase()

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac'
  } else if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows'
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux'
  }
  return 'unknown'
}

// Highlight the user's platform
const os = detectOS()
const downloadCards = document.querySelectorAll('.download-card')

downloadCards.forEach((card) => {
  const platform = card.querySelector('h3').textContent.toLowerCase()
  if (platform === os) {
    card.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.5)'
    card.style.transform = 'scale(1.05)'
  }
})
