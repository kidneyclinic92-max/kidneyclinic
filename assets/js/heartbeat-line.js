// ECG/EKG Heartbeat Line Animation
// Creates a continuous heartbeat line moving from left to right

class HeartbeatLine {
  constructor(containerId, color = '#BF94E4', speed = 2) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.color = color;
    this.speed = speed;
    this.width = this.container.offsetWidth || window.innerWidth;
    this.height = 120;
    this.offset = 0;
    this.setupSVG();
    this.animate();
  }

  setupSVG() {
    // Create SVG element
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', this.height);
    this.svg.style.position = 'absolute';
    this.svg.style.top = '50%';
    this.svg.style.left = '0';
    this.svg.style.transform = 'translateY(-50%) translateZ(0)';
    this.svg.style.overflow = 'visible';
    this.svg.style.willChange = 'contents';
    
    // Create SVG filter for neon glow effect
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'neon-glow');
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    
    // Simplified glow for smoother rendering
    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '3');
    blur.setAttribute('result', 'blur');
    
    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    ['blur', 'SourceGraphic'].forEach(input => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      node.setAttribute('in', input);
      merge.appendChild(node);
    });
    
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);
    
    this.svg.appendChild(defs);
    
    // Create the heartbeat path
    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('fill', 'none');
    this.path.setAttribute('stroke', this.color);
    this.path.setAttribute('stroke-width', '2.5');
    this.path.setAttribute('stroke-linecap', 'round');
    this.path.setAttribute('stroke-linejoin', 'round');
    this.path.setAttribute('filter', 'url(#neon-glow)');
    
    // Use CSS for smoother rendering
    this.path.style.willChange = 'auto';
    this.path.style.transform = 'translateZ(0)';
    
    this.svg.appendChild(this.path);
    this.container.appendChild(this.svg);
    
    // Make container position relative if not already
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
  }

  // Generate single ECG heartbeat waveform path with fixed-length drawing window
  generateHeartbeatPath() {
    const centerY = this.height / 2;
    const period = 180; // one heartbeat width
    const segmentLength = 220; // only this many pixels are visible at any moment

    // Visible window: from tail (erasing) to head (drawing)
    const headX = this.offset; // drawing head position
    const tailX = headX - segmentLength; // erasing tail position

    // Helper: piecewise ECG shape for a given phase in [0, period)
    function ecgYOffset(phase) {
      // Baseline by default
      if (phase < 20) return 0; // lead in baseline
      if (phase < 40) {
        // P wave small bump (smooth sine)
        const t = (phase - 20) / 20; // 0..1
        return -8 * Math.sin(Math.PI * t);
      }
      if (phase < 60) return 0; // PR segment baseline
      if (phase < 65) {
        // Q dip
        const t = (phase - 60) / 5; // 0..1
        return 10 * t; // downwards positive
      }
      if (phase < 75) {
        // R spike
        const t = (phase - 65) / 10; // 0..1
        return 10 - 70 * t; // from +10 to -60
      }
      if (phase < 85) {
        // S dip
        const t = (phase - 75) / 10; // 0..1
        return -60 + 75 * t; // to +15
      }
      if (phase < 90) {
        // back to baseline
        const t = (phase - 85) / 5; // 0..1
        return 15 * (1 - t);
      }
      if (phase < 110) return 0; // ST segment baseline
      if (phase < 140) {
        // T wave rounded bump
        const t = (phase - 110) / 30; // 0..1
        return -20 * Math.sin(Math.PI * t);
      }
      return 0; // baseline to end
    }

    // Sample along the visible window and build a polyline path
    const dx = 2; // sampling step in pixels
    let path = `M ${tailX} ${centerY}`;

    for (let x = Math.max(0, tailX); x <= headX; x += dx) {
      const phase = ((x % period) + period) % period; // safe modulo
      const y = centerY + ecgYOffset(phase);
      path += ` L ${x} ${y}`;
    }

    return path;
  }

  animate() {
    // Move from left to right continuously
    this.offset += this.speed;
    
    // Reset smoothly when heartbeat exits the screen
    if (this.offset > this.width + 200) {
      this.offset = -200; // Start from just off-screen left
    }
    
    // Update path - only draws the visible window, automatically "erases" old parts
    this.path.setAttribute('d', this.generateHeartbeatPath());
    
    requestAnimationFrame(() => this.animate());
  }

  // Update on window resize
  resize() {
    this.width = this.container.offsetWidth || window.innerWidth;
    this.path.setAttribute('d', this.generateHeartbeatPath());
  }
}

// Auto-initialize heartbeat lines on page load
document.addEventListener('DOMContentLoaded', () => {
  // Create heartbeat line for hero section if it exists
  const heroHeartbeat = document.getElementById('hero-heartbeat');
  if (heroHeartbeat) {
    const heartbeatLine = new HeartbeatLine('hero-heartbeat', '#BF4E4E', 3);
    
    // Handle window resize
    window.addEventListener('resize', () => heartbeatLine.resize(), { passive: true });
  }
  
  // Create heartbeat lines for any other sections with class 'heartbeat-line'
  document.querySelectorAll('.heartbeat-line-container').forEach((container, index) => {
    const line = new HeartbeatLine(container.id || `heartbeat-${index}`, '#BF4E4E', 2.5);
    window.addEventListener('resize', () => line.resize(), { passive: true });
  });
});

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeartbeatLine;
}

