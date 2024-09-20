// Function to apply dark mode based on message from the parent
function applyDarkModeFromParent(darkMode) {
    var element = document.body;
    if (darkMode) {
        element.classList.add("dark-mode");
    } else {
        element.classList.remove("dark-mode");
    }

    // Update buttons and other elements if necessary
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    if (left != null && right != null) {
        if (darkMode) {
            left.classList.add("dark-btn");
            right.classList.add("dark-btn");
        } else {
            left.classList.remove("dark-btn");
            right.classList.remove("dark-btn");
        }
    }
}

// Listen for messages from the parent window
window.addEventListener('message', function(event) {
    if (event.origin === 'https://ramkhamhaengcenter.iskconbangkok.com') {
        // Apply the dark mode state sent by the parent
        if (event.data.hasOwnProperty('darkMode')) {
            applyDarkModeFromParent(event.data.darkMode);
        }
    }
}, false);

// Ensure dark mode is applied correctly when the page loads
window.onload = function() {
    // If dark mode is stored locally, apply it immediately
    var darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'on') {
        applyDarkModeFromParent(true);
    }
};
