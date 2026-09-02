/**
 * Signature Pad Capture & Validation Module
 * Handles HTML5 canvas drawing for patient and counsellor acknowledgement signatures.
 */

import { CounsellingState } from './session.js';

export function initializeSignaturePad(canvasId, clearBtnId, role = 'patient') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    function startDraw(e) {
        isDrawing = true;
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.moveTo(x, y);
    }

    function draw(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function endDraw() {
        if (isDrawing) {
            isDrawing = false;
            CounsellingState.signatures[role] = canvas.toDataURL();
        }
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);

    // Touch support for mobile tablets
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    const clearBtn = document.getElementById(clearBtnId);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            CounsellingState.signatures[role] = null;
        });
    }
}
