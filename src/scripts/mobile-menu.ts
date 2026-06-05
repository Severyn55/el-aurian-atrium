/**
 * Mobile Menu Controller - v3 (MutationObserver hardened)
 *
 * Architecture:
 * - ONLY two elements: "mobile-menu-button" + "mobile-menu"
 * - NO corner trigger anywhere (completely removed)
 *
 * This version includes aggressive DOM waiting logic because Astro hoisted scripts
 * can execute before the components have inserted their HTML.
 */
console.log('%c[MobileMenu] Module v3 loaded (MutationObserver version)', 'color:#0a0');

const MENU_ID = 'mobile-menu';
const BUTTON_ID = 'mobile-menu-button';

let isOpen = false;
let previouslyFocusedElement: HTMLElement | null = null;

/**
 * Returns only the two elements the mobile menu actually depends on.
 * Never looks for a corner trigger or any other legacy element.
 */
function getElements() {
  const menu = document.getElementById(MENU_ID);
  const button = document.getElementById(BUTTON_ID);
  return { menu, button };
}

function getFocusableElements(menu: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(menu.querySelectorAll<HTMLElement>(selector));
}

function lockBodyScroll() {
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}

function unlockBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
}

function updateAriaAttributes(menu: HTMLElement | null, button: HTMLElement | null, open: boolean) {
  if (button) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');

    // Visual state for the K-Menu trigger
    if (open) {
      button.classList.add('menu-open');
    } else {
      button.classList.remove('menu-open');
    }
  }
  if (menu) {
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
}

function trapFocus(e: KeyboardEvent) {
  const { menu } = getElements();
  if (!menu || !isOpen) return;

  const focusable = getFocusableElements(menu);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

function openMenu() {
  const { menu, button } = getElements();
  if (!menu || !button) return;

  previouslyFocusedElement = document.activeElement as HTMLElement;

  menu.classList.remove('hidden');
  menu.classList.add('menu-entering');

  // Force reflow before starting animation
  void menu.offsetWidth;

  // Trigger the actual open state
  requestAnimationFrame(() => {
    menu.classList.remove('menu-entering');
    menu.classList.add('menu-open');
  });

  lockBodyScroll();
  updateAriaAttributes(menu, button, true);

  // Hide hero texts on mobile when menu is open (premium, calm UX)
  document.body.classList.add('mobile-menu-open');

  isOpen = true;

  // Move focus into menu after animation starts
  setTimeout(() => {
    const focusable = getFocusableElements(menu);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, 120);

  document.addEventListener('keydown', trapFocus);
}

function closeMenu() {
  const { menu, button } = getElements();
  if (!menu || !button) return;

  // Start exit animation
  menu.classList.remove('menu-open');
  menu.classList.add('menu-exiting');

  // Clean up any inline styles that might have been set
  menu.style.backgroundColor = '';
  menu.style.backgroundImage = '';
  menu.style.backdropFilter = '';
  menu.style.webkitBackdropFilter = '';
  menu.style.opacity = '';
  menu.style.zIndex = '';

  document.body.classList.remove('mobile-menu-open');

  // Wait for exit animation to finish before hiding
  setTimeout(() => {
    menu.classList.remove('menu-exiting');
    menu.classList.add('hidden');

    unlockBodyScroll();
    updateAriaAttributes(menu, button, false);
    isOpen = false;

    document.removeEventListener('keydown', trapFocus);

    // Restore focus
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    } else {
      button.focus();
    }
  }, 280); // Match this with CSS exit duration
}

function toggleMenu() {
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen) {
    closeMenu();
  }
}

function handleLinkClick(e: MouseEvent) {
  const link = (e.target as HTMLElement).closest('.mobile-menu-link') as HTMLAnchorElement | null;
  
  if (!link || !isOpen) return;

  const href = link.getAttribute('href');
  if (!href || !href.startsWith('#')) return;

  e.preventDefault();

  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);

  // Immediately unlock scroll (critical for anchor scrolling to work)
  unlockBodyScroll();

  // Start closing animation (but don't wait for the full timeout for scrolling)
  const { menu, button } = getElements();
  if (menu && button) {
    menu.classList.remove('menu-open');
    menu.classList.add('menu-exiting');
  }

  // Restore hero texts immediately when user clicks a link (better perceived speed)
  document.body.classList.remove('mobile-menu-open');

  // Scroll to target after a very short delay (allows exit animation to begin)
  setTimeout(() => {
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      window.location.hash = href;
    }

    // Finish closing the menu after scroll has started
    setTimeout(() => {
      if (menu) {
        menu.classList.remove('menu-exiting');
        menu.classList.add('hidden');
      }
      updateAriaAttributes(menu, button, false);
      isOpen = false;
      document.removeEventListener('keydown', trapFocus);

      // Important: restore hero texts when user clicks a menu link
      document.body.classList.remove('mobile-menu-open');

      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      } else if (button) {
        button.focus();
      }
    }, 200);
  }, 60);
}

/**
 * Robust initialization for the mobile menu.
 * 
 * Because Astro can render components in an order that makes the elements
 * temporarily unavailable when the script first runs, we use a defensive
 * approach:
 * 
 * 1. Try to get the elements immediately.
 * 2. If not present, use a MutationObserver to wait until both required
 *    elements (hamburger button + menu panel) appear in the DOM.
 * 3. Only then attach all event listeners.
 * 
 * This completely removes any dependency on legacy "corner trigger" elements.
 */
export function initMobileMenu() {
  const { menu, button } = getElements();

  if (button && menu) {
    initializeWithElements(button, menu);
    return;
  }

  // Elements not ready yet — use MutationObserver as safety net
  console.log('[MobileMenu] Elements not found immediately, waiting for DOM...');

  const observer = new MutationObserver(() => {
    const { menu: foundMenu, button: foundButton } = getElements();

    if (foundButton && foundMenu) {
      observer.disconnect();
      initializeWithElements(foundButton, foundMenu);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fallback: stop observing after 5 seconds to avoid memory leak
  setTimeout(() => {
    if (observer) {
      observer.disconnect();
      const { menu: stillMissingMenu, button: stillMissingButton } = getElements();
      if (!stillMissingButton || !stillMissingMenu) {
        console.error(
          '[MobileMenu] Required elements not found: "mobile-menu-button" or "mobile-menu". ' +
          'The mobile menu will not be interactive.'
        );
      }
    }
  }, 5000);
}

/**
 * Actually wires up all the event listeners.
 * Called only when both required elements are confirmed to exist.
 */
function initializeWithElements(button: HTMLElement, menu: HTMLElement) {
  // Prevent double initialization
  if ((button as any)._mobileMenuInitialized) {
    return;
  }
  (button as any)._mobileMenuInitialized = true;

  // Initial ARIA state
  updateAriaAttributes(menu, button, false);
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('role', 'dialog');

  // Core event listeners
  button.addEventListener('click', toggleMenu);

  const closeButton = document.getElementById('mobile-menu-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeMenu);
  }

  menu.addEventListener('click', handleLinkClick);

  // Close menu when clicking on the overlay background (outside the content)
  menu.addEventListener('click', (e) => {
    if (e.target === menu) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', handleEscape);

  // Auto-close on desktop resize
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches && isOpen) {
      closeMenu();
    }
  });

  console.log('[MobileMenu] ✓ Initialized successfully. Only hamburger button + menu panel are used.');
}
