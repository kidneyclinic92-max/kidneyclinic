// Background removed - ECG pulse line only

// GSAP 3D Heartbeat Pulse Animations for Cards
function initCardAnimations() {
  if (typeof gsap === 'undefined') return;
  
  // 3D Heartbeat Pulse Animation for Cards
  const cards = gsap.utils.toArray('.card');
  if (cards.length === 0) return; // Exit if no cards found
    
    cards.forEach((card, index) => {
      // Set 3D perspective
      gsap.set(card, { transformPerspective: 1000, transformStyle: "preserve-3d" });
      
      // Create realistic heartbeat timeline (lub-dub pattern)
      const heartbeatTimeline = gsap.timeline({ repeat: -1 });
      
      heartbeatTimeline
        .to(card, { 
          scale: 1.05, 
          rotationX: 2,
          rotationY: 2,
          z: 10,
          duration: 0.15, 
          ease: "power2.out" 
        })
        .to(card, { 
          scale: 0.98, 
          rotationX: 0,
          rotationY: 0,
          z: 0,
          duration: 0.15, 
          ease: "power2.in" 
        })
        .to(card, { 
          scale: 1.03, 
          rotationX: 1,
          rotationY: 1,
          z: 5,
          duration: 0.1, 
          ease: "power2.out" 
        })
        .to(card, { 
          scale: 1, 
          rotationX: 0,
          rotationY: 0,
          z: 0,
          duration: 0.2, 
          ease: "power2.inOut" 
        })
        .to(card, { 
          scale: 1, 
          duration: 0.8,
          ease: "none"
        });
      
      // Offset each card's animation slightly
      heartbeatTimeline.seek(index * 0.2);
      
      // Enhanced 3D pulse on hover with heartbeat acceleration
      card.addEventListener('mouseenter', () => {
        heartbeatTimeline.timeScale(2.5); // Speed up heartbeat
        gsap.to(card, { 
          scale: 1.1,
          z: 30,
          rotationY: 10,
          rotationX: 5,
          boxShadow: "0 20px 60px rgba(191,78,78,0.6)",
          duration: 0.3, 
          ease: "power2.out",
          overwrite: false
        });
      });
      
      card.addEventListener('mouseleave', () => {
        heartbeatTimeline.timeScale(1); // Return to normal heartbeat
        gsap.to(card, { 
          z: 0,
          boxShadow: "0 0 0 rgba(191,78,78,0)",
          duration: 0.5, 
          ease: "power2.out",
          overwrite: false
        });
      });
      
      // 3D mouse tracking effect
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        gsap.to(card, {
          rotationX: rotateX,
          rotationY: rotateY,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    });
    
    // Fade in cards on load with 3D effect (only if cards exist)
    if (cards.length > 0) {
      gsap.from('.card', { 
        opacity: 0, 
        y: 100,
        z: -200,
        rotationX: 90,
        stagger: 0.15, 
        duration: 1,
        ease: "back.out(1.7)",
        delay: 0.3
      });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    // Parallax for sections
    gsap.utils.toArray('.parallax-section').forEach(section => {
      gsap.fromTo(section, 
        { y: 50, opacity: 0.8 }, 
        {
          y: -50,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            scrub: true,
            start: 'top bottom',
            end: 'bottom top'
          }
        }
      );
    });
    
    // Try to initialize card animations immediately
    initCardAnimations();
    
    // Also try after a short delay (for dynamically loaded content)
    setTimeout(initCardAnimations, 500);
    setTimeout(initCardAnimations, 1500);
  }
});

// Make function available globally for content.js to call after loading
if (typeof window !== 'undefined') {
  window.initCardAnimations = initCardAnimations;
}



