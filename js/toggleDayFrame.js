// Function to toggle dark mode and store the setting in localStorage
function toggleDay() {
    var element = document.body;
    var isDarkMode = element.classList.toggle("dark-mode");
    console.log('Toggled dark mode:', isDarkMode);

    // Update the icon
    var icon = document.getElementById("day");
    if (icon) {
        icon.classList.toggle("fa-sun-o");
        icon.classList.toggle("fa-moon-o");
        console.log('Updated dark mode icon.');
    }

    // Save the dark mode state in localStorage
    localStorage.setItem("darkMode", isDarkMode ? "on" : "off");
    console.log('Dark mode saved to localStorage:', localStorage.getItem("darkMode"));

    // Notify the parent page (Weebly) about the dark mode state
    window.parent.postMessage({
        darkMode: isDarkMode
    }, "https://ramkhamhaengcenter.iskconbangkok.com");
    console.log('Sent dark mode state to parent.');
}

// Function to apply the saved dark mode setting on page load
function applyDarkMode() {
    var darkMode = localStorage.getItem("darkMode");
    console.log('Applying dark mode from localStorage:', darkMode);

    if (darkMode === "on") {
        var element = document.body;
        element.classList.add("dark-mode");
        console.log('Dark mode applied.');
    } else {
        console.log('Light mode applied.');
    }
}

// Listen for messages from the parent window (Weebly)
window.addEventListener('message', function(event) {
    console.log('Message received from parent:', event.origin);
    if (event.origin === 'https://ramkhamhaengcenter.iskconbangkok.com') {
        console.log('Valid message from parent:', event.data);
        if (event.data.hasOwnProperty('darkMode')) {
            applyDarkModeFromParent(event.data.darkMode);
        }
    } else {
        console.log('Origin mismatch. Expected "https://ramkhamhaengcenter.iskconbangkok.com", but received:', event.origin);
    }
}, false);

// Apply dark mode based on localStorage when the iframe page loads
window.onload = function() {
    console.log('Iframe loaded.');
    applyDarkMode();

    // Also ensure dark mode state is checked on navigation
    window.addEventListener('load', function() {
        console.log('New iframe page loaded. Checking dark mode.');
        applyDarkMode(); // Reapply dark mode on new page load
    });
};
