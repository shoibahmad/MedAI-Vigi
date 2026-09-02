const MAX_SNACKBARS = 3;
function initSnackbarContainer() {
    let container = document.getElementById('snackbar-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'snackbar-container';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show a snackbar notification
 * @param {Object} options - Snackbar options
 * @param {string} options.type - Type: 'success', 'error', 'warning', 'info'
 * @param {string} options.title - Snackbar title
 * @param {string} options.message - Snackbar message
 * @param {number} options.duration - Duration in ms (default: 5000, 0 = persistent)
 * @param {string} options.actionText - Optional action button text
 * @param {Function} options.onAction - Optional action button callback
 * @param {boolean} options.showClose - Show close button (default: true)
 */
function showSnackbar(options) {
    const {
        type = 'info',
        title = '',
        message = '',
        duration = 5000,
        actionText = '',
        onAction = null,
        showClose = true
    } = options;

    const container = initSnackbarContainer();

    // Limit the number of visible snackbars
    const existingSnackbars = container.querySelectorAll('.snackbar:not(.removing)');
    if (existingSnackbars.length >= MAX_SNACKBARS) {
        removeSnackbar(existingSnackbars[0]);
    }

    // Create snackbar element
    const snackbar = document.createElement('div');
    snackbar.className = `snackbar ${type}`;
    snackbar.setAttribute('role', 'alert');
    snackbar.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    // Set duration for progress bar
    if (duration > 0) {
        snackbar.style.setProperty('--duration', `${duration}ms`);
    }

    // Icon mapping
    const icons = {
        success: 'fas fa-check',
        error: 'fas fa-times',
        warning: 'fas fa-exclamation',
        info: 'fas fa-info'
    };

    // Build HTML
    let html = `
        <div class="snackbar-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="snackbar-content">
            ${title ? `<div class="snackbar-title">${escapeHtml(title)}</div>` : ''}
            <div class="snackbar-message">${escapeHtml(message)}</div>
        </div>
    `;

    // Add action button if provided
    if (actionText && onAction) {
        html += `<button class="snackbar-action" type="button">${escapeHtml(actionText)}</button>`;
    }

    // Add close button
    if (showClose) {
        html += `
            <button class="snackbar-close" type="button" aria-label="Dismiss notification">
                <i class="fas fa-times"></i>
            </button>
        `;
    }

    // Add progress bar for timed snackbars
    if (duration > 0) {
        html += `<div class="snackbar-progress"></div>`;
    }

    snackbar.innerHTML = html;
    container.appendChild(snackbar);

    // Handle action button click
    if (actionText && onAction) {
        const actionBtn = snackbar.querySelector('.snackbar-action');
        actionBtn.addEventListener('click', () => {
            onAction();
            removeSnackbar(snackbar);
        });
    }

    // Handle close button click
    if (showClose) {
        const closeBtn = snackbar.querySelector('.snackbar-close');
        closeBtn.addEventListener('click', () => {
            removeSnackbar(snackbar);
        });
    }

    // Auto-dismiss after duration
    let timeoutId = null;
    if (duration > 0) {
        timeoutId = setTimeout(() => {
            removeSnackbar(snackbar);
        }, duration);
        snackbar.dataset.timeoutId = timeoutId;
    }

    // Pause on hover (for desktop)
    snackbar.addEventListener('mouseenter', () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            const progress = snackbar.querySelector('.snackbar-progress');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
        }
    });

    snackbar.addEventListener('mouseleave', () => {
        if (duration > 0) {
            const progress = snackbar.querySelector('.snackbar-progress');
            if (progress) {
                const computedStyle = getComputedStyle(progress);
                const currentWidth = parseFloat(computedStyle.width);
                const totalWidth = snackbar.offsetWidth;
                const remainingPercent = (currentWidth / totalWidth) * 100;
                const remainingTime = (remainingPercent / 100) * duration;

                progress.style.animationPlayState = 'running';

                timeoutId = setTimeout(() => {
                    removeSnackbar(snackbar);
                }, remainingTime);
                snackbar.dataset.timeoutId = timeoutId;
            }
        }
    });

    // Allow swipe to dismiss on touch devices
    setupSwipeToDismiss(snackbar);

    return snackbar;
}

/**
 * Remove a snackbar with animation
 * @param {HTMLElement} snackbar - The snackbar element
 */
function removeSnackbar(snackbar) {
    if (!snackbar || snackbar.classList.contains('removing')) return;

    // Clear timeout if exists
    if (snackbar.dataset.timeoutId) {
        clearTimeout(parseInt(snackbar.dataset.timeoutId));
    }

    snackbar.classList.add('removing');
    
    setTimeout(() => {
        if (snackbar.parentNode) {
            snackbar.remove();
        }
    }, 300);
}

/**
 * Setup swipe-to-dismiss for touch devices
 * @param {HTMLElement} snackbar - The snackbar element
 */
function setupSwipeToDismiss(snackbar) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    snackbar.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        snackbar.style.transition = 'none';
    }, { passive: true });

    snackbar.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow swiping down
        if (deltaY > 0) {
            snackbar.style.transform = `translateY(${deltaY}px)`;
            snackbar.style.opacity = Math.max(0, 1 - deltaY / 150);
        }
    }, { passive: true });

    snackbar.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        const deltaY = currentY - startY;
        snackbar.style.transition = '';

        if (deltaY > 80) {
            removeSnackbar(snackbar);
        } else {
            snackbar.style.transform = '';
            snackbar.style.opacity = '';
        }
    });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Clear all snackbars
 */
function clearAllSnackbars() {
    const container = document.getElementById('snackbar-container');
    if (container) {
        const snackbars = container.querySelectorAll('.snackbar');
        snackbars.forEach(snackbar => removeSnackbar(snackbar));
    }
}

// ============================================
// Convenience Functions (backward compatible)
// ============================================

function showToast(type, title, message, duration = 5000) {
    return showSnackbar({ type, title, message, duration });
}

function showSuccess(message, title = 'Success', duration = 4000) {
    return showSnackbar({ type: 'success', title, message, duration });
}

function showError(message, title = 'Error', duration = 6000) {
    return showSnackbar({ type: 'error', title, message, duration });
}

function showWarning(message, title = 'Warning', duration = 5000) {
    return showSnackbar({ type: 'warning', title, message, duration });
}

function showInfo(message, title = 'Info', duration = 4000) {
    return showSnackbar({ type: 'info', title, message, duration });
}

// Legacy closeToast function
function closeToast(button) {
    const snackbar = button.closest('.snackbar') || button.closest('.toast');
    if (snackbar) {
        removeSnackbar(snackbar);
    }
}

// ============================================
// Global Exports
// ============================================

window.showSnackbar = showSnackbar;
window.removeSnackbar = removeSnackbar;
window.clearAllSnackbars = clearAllSnackbars;

// Backward compatible exports
window.showToast = showToast;
window.closeToast = closeToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
