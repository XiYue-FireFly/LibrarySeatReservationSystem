<template>
  <canvas ref="canvas" class="dynamic-background"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let ctx = null
let animationId = null

const particles = []
const particleCount = 120
const connectionDistance = 140
const mouse = { x: null, y: null, radius: 320, strength: 0.8 }
const ripple = { x: null, y: null, radius: 0, strength: 0, active: false }

// Nebula Glow Objects
const nebulas = []
const nebulaCount = 5
const nebulaColors = [
  'hsla(260, 80%, 50%, 0.1)',
  'hsla(210, 80%, 50%, 0.08)',
  'hsla(280, 80%, 50%, 0.06)'
]

class Particle {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.reset()
  }

  reset() {
    this.originX = Math.random() * this.width
    this.originY = Math.random() * this.height
    this.x = this.originX
    this.y = this.originY
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.size = Math.random() * 3 + 1
    // Color variety
    const hue = 220 + Math.random() * 40
    this.color = `hsla(${hue}, 80%, 70%, 0.9)`
    
    // Subtle emoji floating as "data"
    this.hasEmoji = Math.random() > 0.96
    this.emoji = ['✨', '💎', '🚀', '⚡', '💻'][Math.floor(Math.random() * 5)]
  }

  update() {
    // Basic drifting
    this.originX += this.vx
    this.originY += this.vy

    // Wrap around
    if (this.originX < 0) this.originX = this.width
    if (this.originX > this.width) this.originX = 0
    if (this.originY < 0) this.originY = this.height
    if (this.originY > this.height) this.originY = 0

    let targetX = this.originX
    let targetY = this.originY

    // Gravitational pull towards mouse
    if (mouse.x != null && mouse.y != null) {
      const dx = mouse.x - this.originX
      const dy = mouse.y - this.originY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius
        targetX += dx * force * mouse.strength
        targetY += dy * force * mouse.strength
      }
    }

    // Ripple distortion
    if (ripple.active) {
      const dx = this.originX - ripple.x
      const dy = this.originY - ripple.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const rippleWidth = 100
      
      if (distance > ripple.radius - rippleWidth && distance < ripple.radius + rippleWidth) {
        const force = (1 - Math.abs(distance - ripple.radius) / rippleWidth) * ripple.strength
        const angle = Math.atan2(dy, dx)
        targetX += Math.cos(angle) * force * 50
        targetY += Math.sin(angle) * force * 50
      }
    }

    // Smooth transition to current position
    this.x += (targetX - this.x) * 0.1
    this.y += (targetY - this.y) * 0.1
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.shadowBlur = 10
    ctx.shadowColor = this.color
    ctx.fill()
    ctx.shadowBlur = 0

    if (this.hasEmoji) {
      ctx.font = '12px serif'
      ctx.globalAlpha = 0.4
      ctx.fillText(this.emoji, this.x + 5, this.y + 5)
      ctx.globalAlpha = 1.0
    }
  }
}

const handleResize = () => {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  init()
}

const handleMouseMove = (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

const handleMouseLeave = () => {
  mouse.x = null
  mouse.y = null
}

const handleClick = (e) => {
  ripple.x = e.clientX
  ripple.y = e.clientY
  ripple.radius = 0
  ripple.strength = 1.0
  ripple.active = true
}

const init = () => {
  particles.length = 0
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(canvas.value.width, canvas.value.height))
  }
  
  // Init nebulas
  nebulas.length = 0
  for (let i = 0; i < nebulaCount; i++) {
    nebulas.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      radius: Math.random() * 400 + 200,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)]
    })
  }
}

const animate = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Update ripple
  if (ripple.active) {
    ripple.radius += 12
    ripple.strength -= 0.015
    if (ripple.strength <= 0) ripple.active = false
  }

  // Draw nebulas (very bottom layer)
  nebulas.forEach(nb => {
    nb.x += nb.vx
    nb.y += nb.vy
    
    // Wrap
    if (nb.x < -nb.radius) nb.x = canvas.value.width + nb.radius
    if (nb.x > canvas.value.width + nb.radius) nb.x = -nb.radius
    if (nb.y < -nb.radius) nb.y = canvas.value.height + nb.radius
    if (nb.y > canvas.value.height + nb.radius) nb.y = -nb.radius

    const grad = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.radius)
    grad.addColorStop(0, nb.color)
    grad.addColorStop(1, 'transparent')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(nb.x, nb.y, nb.radius, 0, Math.PI * 2)
    ctx.fill()
  })

  // Draw lines first (underneath)
  ctx.lineWidth = 1
  for (let i = 0; i < particles.length; i++) {
    particles[i].update()
    
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < connectionDistance) {
        const opacity = (1 - (distance / connectionDistance)) * 0.3
        ctx.beginPath()
        ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  }

  // Draw particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].draw()
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', handleMouseLeave)
  window.addEventListener('mousedown', handleClick)
  animate()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  window.removeEventListener('mousedown', handleClick)
  cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background: radial-gradient(circle at 50% 50%, #171941 0%, #020617 100%);
}
</style>


