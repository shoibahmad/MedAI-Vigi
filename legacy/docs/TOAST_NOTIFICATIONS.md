# 🔔 Toast Notification System - MedAI-VIGI

Beautiful, animated toast notifications for the MedAI-VIGI application.

## Features

✨ **Beautiful Design** - Modern, glassmorphic design with smooth animations
🎨 **Multiple Types** - Success, Error, Warning, and Info notifications
⚡ **Lightweight** - Pure JavaScript, no dependencies required
📱 **Responsive** - Works perfectly on all screen sizes
🎯 **Easy to Use** - Simple API with convenience functions
⏱️ **Auto-dismiss** - Configurable duration with progress indicator
❌ **Manual Close** - Users can dismiss notifications manually

## Installation

### 1. Include CSS

Add the toast CSS file to your HTML `<head>`:

```html
<link href="{{ url_for('static', filename='css/toast.css') }}" rel="stylesheet">
```

### 2. Include JavaScript

Add the toast JavaScript file before your closing `</body>` tag:

```html
<script src="{{ url_for('static', filename='js/toast.js') }}"></script>
```

## Usage

### Basic Usage

```javascript
// Show a success notification
showSuccess('Patient data saved successfully!');

// Show an error notification
showError('Failed to process patient data.');

// Show a warning notification
showWarning('High risk detected! Enhanced monitoring recommended.');

// Show an info notification
showInfo('New drug interaction data available.');
```

### Advanced Usage

```javascript
// Custom title and duration
showSuccess('Operation completed', 'Success!', 3000);

// Using the main showToast function
showToast('success', 'Custom Title', 'Custom message', 5000);
```

### Available Functions

#### `showSuccess(message, title, duration)`
Shows a success toast notification (green).
- **message**: The notification message
- **title**: Optional title (default: "Success!")
- **duration**: Optional duration in ms (default: 5000)

#### `showError(message, title, duration)`
Shows an error toast notification (red).
- **message**: The notification message
- **title**: Optional title (default: "Error")
- **duration**: Optional duration in ms (default: 7000)

#### `showWarning(message, title, duration)`
Shows a warning toast notification (orange).
- **message**: The notification message
- **title**: Optional title (default: "Warning")
- **duration**: Optional duration in ms (default: 6000)

#### `showInfo(message, title, duration)`
Shows an info toast notification (blue).
- **message**: The notification message
- **title**: Optional title (default: "Information")
- **duration**: Optional duration in ms (default: 5000)

#### `showToast(type, title, message, duration)`
Main function to show any type of toast.
- **type**: 'success', 'error', 'warning', or 'info'
- **title**: The notification title
- **message**: The notification message
- **duration**: Duration in milliseconds

## Examples

### Form Submission Success
```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await submitForm();
        showSuccess('Form submitted successfully!', 'Success');
    } catch (error) {
        showError('Failed to submit form. Please try again.', 'Submission Failed');
    }
});
```

### API Request
```javascript
async function fetchData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Request failed');
        const data = await response.json();
        showSuccess('Data loaded successfully!');
        return data;
    } catch (error) {
        showError('Failed to load data. Please check your connection.');
    }
}
```

### Validation Warning
```javascript
function validateInput(value) {
    if (value < 0) {
        showWarning('Value cannot be negative. Please enter a valid number.', 'Invalid Input');
        return false;
    }
    return true;
}
```

### Information Message
```javascript
function showWelcomeMessage() {
    showInfo('Welcome to MedAI-VIGI! Start by entering patient details.', 'Welcome', 8000);
}
```

## Customization

### Modifying Colors

Edit `static/css/toast.css` to change colors:

```css
/* Success - Green */
.toast.success {
    border-left-color: #10b981;
}

/* Error - Red */
.toast.error {
    border-left-color: #ef4444;
}

/* Warning - Orange */
.toast.warning {
    border-left-color: #f59e0b;
}

/* Info - Blue */
.toast.info {
    border-left-color: #3b82f6;
}
```

### Modifying Position

Change the position in `static/css/toast.css`:

```css
#toast-container {
    position: fixed;
    top: 100px;      /* Change vertical position */
    right: 20px;     /* Change horizontal position */
    /* For left side: left: 20px; right: auto; */
    /* For bottom: top: auto; bottom: 20px; */
}
```

### Modifying Animation Duration

Edit the animation timing in `static/css/toast.css`:

```css
.toast {
    animation: toastSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-progress {
    animation: toastProgress 5s linear forwards; /* Change duration */
}
```

## Integration with Existing Code

### Replace Alert Dialogs

**Before:**
```javascript
alert('Data saved successfully!');
```

**After:**
```javascript
showSuccess('Data saved successfully!');
```

### Replace Console Logs

**Before:**
```javascript
console.log('Processing complete');
```

**After:**
```javascript
showInfo('Processing complete');
```

### Error Handling

**Before:**
```javascript
catch (error) {
    console.error('Error:', error);
}
```

**After:**
```javascript
catch (error) {
    showError(`Failed to process: ${error.message}`);
}
```

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## Demo

Visit `/toast_demo` to see all toast notification types in action.

## Files

- `static/css/toast.css` - Toast notification styles
- `static/js/toast.js` - Toast notification JavaScript
- `templates/toast_demo.html` - Demo page

## Best Practices

1. **Use appropriate types**: Match the notification type to the message context
2. **Keep messages concise**: Short, clear messages work best
3. **Don't overuse**: Too many notifications can be annoying
4. **Provide context**: Include relevant details in the message
5. **Test on mobile**: Ensure notifications work well on small screens

## Troubleshooting

### Toasts not appearing
- Check that both CSS and JS files are included
- Verify the files are loaded (check browser console)
- Ensure no JavaScript errors are blocking execution

### Styling issues
- Check for CSS conflicts with existing styles
- Verify z-index is high enough (default: 10000)
- Clear browser cache

### Animation problems
- Check browser compatibility
- Verify CSS animations are enabled
- Test in different browsers

## License

Part of the MedAI-VIGI project.

## Credits

Developed by the MedAI-VIGI team at Integral University.
