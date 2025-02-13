// languageToggle.js
// Function to toggle between languages
function toggleLanguage(lang) {
    // Save selected language to localStorage
    localStorage.setItem("lang", lang);

    // Redirect to the same path but with the new language
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/\/(en|th)\//, `/${lang}/`);
    window.location.href = newPath;
}
