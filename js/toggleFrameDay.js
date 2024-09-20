// Function to toggle dark mode and store the setting in localStorage
function toggleDay() {
    var element = document.body;
    var isDarkMode = element.classList.toggle("dark-mode");

    // Update the icon
    var icon = document.getElementById("day");
    icon.classList.toggle("fa-sun-o");
    icon.classList.toggle("fa-moon-o");

    // Save the dark mode state in localStorage
    localStorage.setItem("darkMode", isDarkMode ? "on" : "off");

    // Send a message to the parent (Weebly) page about the dark mode state
    window.parent.postMessage({
        darkMode: isDarkMode
    }, "https://ramkhamhaengcenter.iskconbangkok.com"); // Replace with the correct Weebly domain
}

// Apply the dark mode setting on page load
function applyDarkMode() {
    var darkMode = localStorage.getItem("darkMode");

    if (darkMode === "on") {
        var element = document.body;
        element.classList.add("dark-mode");

        var icon = document.getElementById("day");
        icon.classList.add("fa-moon-o");
        icon.classList.remove("fa-sun-o");
    }
}

// Apply dark mode on page load
window.onload = function() {
    applyDarkMode();
};
