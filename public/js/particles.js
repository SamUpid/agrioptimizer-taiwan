/**
 * Huly-style Particle Effect
 * Add floating particles to hero section
 */

document.addEventListener('DOMContentLoaded', function() {
  const heroSection = document.querySelector('.hero-modern');
  
  if (heroSection) {
    // Create 15 particles
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 10 + 's';
      particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
      heroSection.appendChild(particle);
    }
  }
  
  // Add ripple effect to all buttons
  document.querySelectorAll('.btn').forEach(button => {
    button.classList.add('ripple');
  });
});