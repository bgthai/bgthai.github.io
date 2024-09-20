// Function to toggle dark mode and store the setting in localStorage
function toggleDay() {
    var element = document.body;
    var isDarkMode = element.classList.toggle("dark-mode");

    // Update the icon
    var icon = document.getElementById("day");
    if (icon) {
        icon.classList.toggle("fa-sun-o", !isDarkMode);
        icon.classList.toggle("fa-moon-o", isDarkMode);
    }

    // Toggle dark-mode for buttons (if present)
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    if (left && right) {
        left.classList.toggle("dark-btn", isDarkMode);
        right.classList.toggle("dark-btn", isDarkMode);
    }

    // Save the dark mode state in localStorage
    localStorage.setItem("darkMode", isDarkMode ? "on" : "off");
    // Notify the parent about the dark mode state
    window.parent.postMessage({ darkMode: isDarkMode }, "https://ramkhamhaengcenter.iskconbangkok.com");
}

// Function to apply dark mode based on localStorage
function applyDarkMode() {
    var darkMode = localStorage.getItem("darkMode") === "on";
    console.log('Applying dark mode. darkMode from localStorage:', darkMode);
    var element = document.body;
    element.classList.toggle("dark-mode", darkMode);

    // Update the icon based on current mode
    var icon = document.getElementById("day");
    if (icon) {
        icon.classList.toggle("fa-sun-o", !darkMode);
        icon.classList.toggle("fa-moon-o", darkMode);
    }

    // Apply dark mode to buttons (if present)
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    if (left && right) {
        left.classList.toggle("dark-btn", darkMode);
        right.classList.toggle("dark-btn", darkMode);
    }
}

// Listen for messages from the parent window (Weebly)
window.addEventListener('message', function(event) {
    if (event.origin === 'https://ramkhamhaengcenter.iskconbangkok.com') {
        if (event.data.hasOwnProperty('darkMode')) {
            var darkMode = event.data.darkMode;
            toggleDay(); // Directly toggle if needed
            if (darkMode) {
                applyDarkMode();
            }
        }
    }
}, false);

// Immediately apply dark mode from localStorage
applyDarkMode(); // Call this right away
