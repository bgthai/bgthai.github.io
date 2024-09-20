// Function to toggle dark mode and store the setting in localStorage
function toggleDay() {
    var element = document.body;
    var isDarkMode = element.classList.toggle("dark-mode");

    // Update the icon
    var icon = document.getElementById("day");
    icon.classList.toggle("fa-sun-o");
    icon.classList.toggle("fa-moon-o");

    // Toggle dark-mode for buttons (if present)
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    if (left != null) {
        left.classList.toggle("dark-btn");
        right.classList.toggle("dark-btn");
    }

    // Save the dark mode state in localStorage
    localStorage.setItem("darkMode", isDarkMode ? "on" : "off");
}

// Function to apply the saved dark mode setting on page load
function applyDarkMode() {
    var darkMode = localStorage.getItem("darkMode");

    if (darkMode === "on") {
        var element = document.body;
        element.classList.add("dark-mode");

        var icon = document.getElementById("day");
        icon.classList.add("fa-moon-o");
        icon.classList.remove("fa-sun-o");

        var left = document.getElementById("left");
        var right = document.getElementById("right");
        if (left != null) {
            left.classList.add("dark-btn");
            right.classList.add("dark-btn");
        }
    }
}

// Apply the dark mode setting when the page loads
window.onload = function() {
    applyDarkMode();
};
