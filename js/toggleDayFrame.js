// Function to toggle dark mode and store the setting in localStorage
function toggleDay() {
    var element = document.body;
    var isDarkMode = element.classList.toggle("dark-mode");

    // Update the icon
    var icon = document.getElementById("day");
    if (icon) {
        icon.classList.toggle("fa-sun-o");
        icon.classList.toggle("fa-moon-o");
    }

    // Toggle dark-mode for buttons (if present)
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    if (left != null && right != null) {
        left.classList.toggle("dark-btn");
        right.classList.toggle("dark-btn");
    }

    // Save the dark mode state in localStorage
    localStorage.setItem("darkMode", isDarkMode ? "on" : "off");

    // Notify the parent page (Weebly) about the dark mode state
    window.parent.postMessage({
        darkMode: isDarkMode
    }, "https://ramkhamhaengcenter.iskconbangkok.com");
}

// Function to apply the saved dark mode setting on page load
function applyDarkMode() {
    var darkMode = localStorage.getItem("darkMode");

    if (darkMode === "on") {
        var element = document.body;
        element.classList.add("dark-mode");

        var icon = document.getElementById("day");
        if (icon) {
            icon.classList.add("fa-moon-o");
            icon.classList.remove("fa-sun-o");
        }

        var left = document.getElementById("left");
        var right = document.getElementById("right");
        if (left != null && right != null) {
            left.classList.add("dark-btn");
            right.classList.add("dark-btn");
        }
    }
}

// Function to apply dark mode based on message from parent (Weebly)
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

// Listen for messages from the parent window (Weebly)
window.addEventListener('message', function(event) {
    if (event.origin === 'https://ramkhamhaengcenter.iskconbangkok.com') {
        // Apply the dark mode state sent by the parent
        if (event.data.hasOwnProperty('darkMode')) {
            applyDarkModeFromParent(event.data.darkMode);
        }
    }
}, false);

// Apply dark mode based on localStorage when the iframe page loads
window.onload = function() {
    applyDarkMode();
};
