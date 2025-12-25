/**
 * Responsive Fix Script
 * Normalizes inline styles for better responsive behavior
 */
(function() {
  'use strict';
  
  function normalizeInlineStyles() {
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    // Function to parse and normalize padding
    function normalizePadding(element) {
      const style = element.getAttribute('style') || '';
      if (!style) return;
      
      // Match padding patterns
      const paddingMatch = style.match(/padding:\s*(\d+)px(?:\s+(\d+)px)?(?:\s+(\d+)px)?(?:\s+(\d+)px)?/i);
      if (paddingMatch) {
        const values = paddingMatch.slice(1).filter(v => v).map(v => parseInt(v));
        const top = values[0] || 0;
        
        let newPadding;
        if (isSmallMobile) {
          // Reduce padding significantly for small mobile
          if (top >= 140) newPadding = '60px 12px 40px';
          else if (top >= 120) newPadding = '50px 12px';
          else if (top >= 100) newPadding = '40px 12px';
          else if (top >= 90) newPadding = '40px 12px';
          else if (top >= 80) newPadding = '30px 12px';
          else if (top >= 60) newPadding = '30px 12px';
          else if (top >= 40) newPadding = '25px 12px';
          else if (top >= 32) newPadding = '18px 12px';
          else if (top >= 30) newPadding = '18px 12px';
          else newPadding = null;
        } else if (isMobile) {
          // Reduce padding for mobile
          if (top >= 140) newPadding = '80px 15px 60px';
          else if (top >= 120) newPadding = '60px 15px';
          else if (top >= 100) newPadding = '50px 15px';
          else if (top >= 90) newPadding = '50px 15px';
          else if (top >= 80) newPadding = '40px 15px';
          else if (top >= 60) newPadding = '40px 15px';
          else if (top >= 40) newPadding = '25px 15px';
          else if (top >= 32) newPadding = '20px 15px';
          else if (top >= 30) newPadding = '20px 15px';
          else newPadding = null;
        } else if (isTablet) {
          // Slightly reduce for tablet
          if (top >= 80) newPadding = '60px 20px';
          else if (top >= 60) newPadding = '40px 20px';
          else newPadding = null;
        }
        
        if (newPadding) {
          const newStyle = style.replace(/padding:\s*[\d\s]+px[^;]*/i, `padding: ${newPadding}`);
          element.setAttribute('style', newStyle);
        }
      }
    }
    
    // Function to normalize font sizes
    function normalizeFontSize(element) {
      const style = element.getAttribute('style') || '';
      if (!style) return;
      
      const fontSizeMatch = style.match(/font-size:\s*([\d.]+)rem/i);
      if (fontSizeMatch) {
        const size = parseFloat(fontSizeMatch[1]);
        let newSize;
        
        if (isSmallMobile) {
          if (size >= 2.5) newSize = 'clamp(1.3rem, 6vw, 1.8rem)';
          else if (size >= 2.3) newSize = 'clamp(1.3rem, 6vw, 1.7rem)';
          else if (size >= 2.0) newSize = 'clamp(1.2rem, 5vw, 1.5rem)';
          else if (size >= 1.4) newSize = 'clamp(1rem, 4.5vw, 1.2rem)';
          else if (size >= 1.3) newSize = 'clamp(1rem, 4.5vw, 1.15rem)';
          else if (size >= 1.2) newSize = 'clamp(0.95rem, 4vw, 1.05rem)';
          else if (size >= 1.1) newSize = 'clamp(0.9rem, 3.5vw, 1rem)';
          else newSize = null;
        } else if (isMobile) {
          if (size >= 2.5) newSize = 'clamp(1.5rem, 5vw, 2rem)';
          else if (size >= 2.3) newSize = 'clamp(1.5rem, 5vw, 2rem)';
          else if (size >= 2.0) newSize = 'clamp(1.3rem, 4vw, 1.6rem)';
          else if (size >= 1.4) newSize = 'clamp(1.1rem, 4vw, 1.25rem)';
          else if (size >= 1.3) newSize = 'clamp(1.1rem, 4vw, 1.2rem)';
          else if (size >= 1.2) newSize = 'clamp(1rem, 3.5vw, 1.1rem)';
          else if (size >= 1.1) newSize = 'clamp(0.95rem, 3vw, 1.05rem)';
          else newSize = null;
        } else if (isTablet) {
          if (size >= 2.5) newSize = 'clamp(1.75rem, 4vw, 2.2rem)';
          else if (size >= 1.3) newSize = 'clamp(1.1rem, 3vw, 1.2rem)';
          else newSize = null;
        }
        
        if (newSize) {
          const newStyle = style.replace(/font-size:\s*[\d.]+rem[^;]*/i, `font-size: ${newSize}`);
          element.setAttribute('style', newStyle);
        }
      }
    }
    
    // Function to normalize max-width
    function normalizeMaxWidth(element) {
      const style = element.getAttribute('style') || '';
      if (!style) return;
      
      const maxWidthMatch = style.match(/max-width:\s*(\d+)px/i);
      if (maxWidthMatch) {
        const width = parseInt(maxWidthMatch[1]);
        
        if (isMobile || isSmallMobile) {
          if (width >= 800) {
            const newStyle = style.replace(/max-width:\s*\d+px/i, 'max-width: 100%');
            element.setAttribute('style', newStyle + '; padding: 0 15px');
          }
        } else if (isTablet && width >= 1000) {
          const newStyle = style.replace(/max-width:\s*\d+px/i, 'max-width: 95%');
          element.setAttribute('style', newStyle);
        }
      }
    }
    
    // Process all elements with inline styles
    const elementsWithStyles = document.querySelectorAll('[style]');
    elementsWithStyles.forEach(element => {
      normalizePadding(element);
      normalizeFontSize(element);
      normalizeMaxWidth(element);
    });
  }
  
  // Run on load and after content loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(normalizeInlineStyles, 100);
      setTimeout(normalizeInlineStyles, 500);
      setTimeout(normalizeInlineStyles, 1500);
    });
  } else {
    setTimeout(normalizeInlineStyles, 100);
    setTimeout(normalizeInlineStyles, 500);
    setTimeout(normalizeInlineStyles, 1500);
  }
  
  // Run on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(normalizeInlineStyles, 250);
  });
  
  // Expose function globally for manual calls
  window.normalizeInlineStyles = normalizeInlineStyles;
})();


