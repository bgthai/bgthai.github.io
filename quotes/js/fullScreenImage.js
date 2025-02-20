function showFullSizeImage(pictureElement) {
    // Find the image inside the <picture> element
    const imgElement = pictureElement.querySelector("img");

    if (!imgElement) return;

    // Get the actual displayed image source
    const currentSrc = imgElement.currentSrc || imgElement.src;
    // console.log(`FullScreenJS is applied to: ${currentSrc}`);

    if(currentSrc.endsWith("avif")){

        const altText = imgElement.alt;

        // Create the overlay container
        const overlay = document.createElement("div");
        overlay.className = "image-overlay";

        // Function to remove the overlay
        function closeOverlay() {
            document.body.removeChild(overlay);
            document.removeEventListener("keydown", handleEscKey);
        }

        // Create the image container
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container";

        // Create the image element
        const img = document.createElement("img");
        img.src = currentSrc;
        img.alt = altText;
        img.style.maxWidth = "90vw";
        img.style.maxHeight = "90vh";

        // Create the close button
        const closeButton = document.createElement("span");
        closeButton.className = "close-button";
        closeButton.innerHTML = "&times;";
        closeButton.onclick = closeOverlay;

        // Function to handle "Escape" key press
        function handleEscKey(event) {
            if (event.key === "Escape") {
                closeOverlay();
            }
        }

        // Listen for the Escape key
        document.addEventListener("keydown", handleEscKey);

        // Close overlay on click outside the image
        overlay.onclick = closeOverlay;

        // Prevent closing when clicking the image itself
        imgContainer.onclick = (event) => event.stopPropagation();

        // Append elements
        imgContainer.appendChild(img);
        imgContainer.appendChild(closeButton);
        overlay.appendChild(imgContainer);
        document.body.appendChild(overlay);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("picture").forEach(picture => {
        const img = picture.querySelector("img");
        const avifSource = picture.querySelector("source[type='image/avif']");

        // Create Google Drive URL
        const googleId = img.getAttribute("data-google-id");
        const googleDriveLink = `https://drive.google.com/file/d/${googleId}/view`;

        // Check if AVIF is supported (loaded successfully)
        const testImg = new Image();
        testImg.src = avifSource.getAttribute("srcset");
        testImg.onload = function () {
            // AVIF loaded, no changes needed
        };
        testImg.onerror = function () {
            // AVIF failed, meaning JPG is used → Wrap in <a>
            const link = document.createElement("a");
            link.classList.add("galleryImage")
            link.href = googleDriveLink;
            link.target = "_blank";  // Open in a new tab
            link.appendChild(img.cloneNode(true)); // Clone the image inside the link

            picture.innerHTML = ""; // Clear <picture> content
            picture.appendChild(link); // Insert wrapped image
        };
    });
});

