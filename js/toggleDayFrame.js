// Function to toggle dark mode and store the setting in localStorage
function toggleDay() {
    var element = document.body;
    var isDarkMode = element.classList.toggle("dark-mode");

    // Update the icon to always toggle regardless of dark mode state
    var icon = document.getElementById("day");
    if (icon) {
        // Always toggle the icon class
        icon.classList.toggle("fa-sun-o");
        icon.classList.toggle("fa-moon-o");
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
    if (element) { // Check if the body exists
        element.classList.toggle("dark-mode", darkMode);

        // Update the icon based on current mode
        var icon = document.getElementById("day");
            if (icon) {
                // Update the icon based on the darkMode state
                if (darkMode) {
                    icon.classList.remove("fa-moon-o");
                    icon.classList.add("fa-sun-o");
                } else {
                    icon.classList.remove("fa-sun-o");
                    icon.classList.add("fa-moon-o");
                }
        }

        // Apply dark mode to buttons (if present)
        var left = document.getElementById("left");
        var right = document.getElementById("right");
        if (left && right) {
            left.classList.toggle("dark-btn", darkMode);
            right.classList.toggle("dark-btn", darkMode);
        }
    } else {
        console.error("Body element not found.");
    }
}

// Listen for DOMContentLoaded event and apply dark mode when ready
document.addEventListener('DOMContentLoaded', function() {
    applyDarkMode(); // Call this after the DOM is loaded
});



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
