const dbName = "ImageCacheDB";
const storeName = "images";

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function getCachedImage(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = (event) => resolve(event.target.result || null);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function cacheImage(id, blob) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(blob, id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((granted) => {
        if (granted) {
            console.log("Persistent storage granted: Data will not be cleared except by user action.");
        } else {
            console.log("Persistent storage not granted: Data may be cleared under low space conditions.");
        }
    });
}


function clearImageCache() {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => console.log("Image cache cleared.");
    request.onerror = (event) => console.error("Error clearing image cache:", event.target.error);
}

async function getBlobFromIndexedDB(google_id) {
    try {
        const result = await getCachedImage(google_id);
        // return result || null;
        return null;
    } catch (error) {
        console.error(`Error retrieving blob for '${google_id}' from IndexedDB:`, error);
        return null;
    }
}




// Display the image
function displayImage(image_id, blob) {
    console.log(`Attempting to display image for ID: ${image_id}`);
    const imgElement = document.querySelector(`#${image_id}`);
    if (!imgElement) {
        console.error(`Image element with ID '${image_id}' not found.`);
        return;
    }

    // Find the parent placeholder div
    const placeholderDiv = imgElement.closest(".image-placeholder");
    if (!placeholderDiv) {
        console.error(`Parent placeholder for image ID '${image_id}' not found.`);
        return;
    }

    const blobURL = URL.createObjectURL(blob);
    console.log(`Blob URL for image ID '${image_id}':`, blobURL);

    // Update the existing image element
    imgElement.src = blobURL;

    // Replace "thumbnail" with "full" in the existing alt attribute
    if (imgElement.alt) {
        imgElement.alt = imgElement.alt.replace("thumbnail", "full");
    } else {
        imgElement.alt = 'Image from Drive - full size';
    }


    // Handle successful image load
    imgElement.onload = function () {
        console.log(`Image successfully displayed from: ${blobURL}`);

        hideLoadingGif(imgElement); // Hide the loading.gif
        imgElement.parentElement.classList.remove("skeleton"); // Remove skeleton class to disable blur/shimmer
        imgElement.classList.add("loaded"); // Add the loaded class to apply final styles

        // Change background color of the placeholder div
        placeholderDiv.style.backgroundColor = "transparent";
        placeholderDiv.style.border = "none";
    };

    // Handle image load errors
    imgElement.onerror = function (error) {
        console.error(`Error loading image: ${blobURL}`);
        console.error(error);
        displayErrorPlaceholder(image_id);
    };

    // Keep blob URL in scope for debugging
    window.debugBlobURLs = window.debugBlobURLs || {};
    window.debugBlobURLs[image_id] = blobURL;
}




// Process and display an image, handling cache and network fetches
async function processAndDisplayImage(image_id, google_id, imageElement, cachedDelay) {
    console.log(`Starting processAndDisplayImage on '${image_id}'`);

    // Attempt to fetch blob from IndexedDB (cached storage)
    try {
        const cachedBlob = await getBlobFromIndexedDB(google_id);
        if (cachedBlob) {
            const isValidImageBlob = cachedBlob.type.startsWith("image/");
            if (isValidImageBlob) {
                console.log(`Blob for ${image_id} - ${google_id} is valid. Attempting display.`);
                displayImage(image_id, cachedBlob);

                // Shorter delay for cached images
                return cachedDelay;
            } else {
                console.warn(`Corrupted or invalid blob detected for ${image_id} - ${google_id}. Type: ${cachedBlob.type}`);
            }
        } else {
            console.log(`No blob found in IndexedDB for ${google_id}.`);
        }
    } catch (error) {
        console.error(`Error accessing IndexedDB for ${image_id} - ${google_id}:`, error);
    }

    // Fetch from Google Drive if no valid cached blob is available
    console.log(`Fetching blob from Google Drive for ID: ${google_id}`);
    try {
        const newBlob = await processGoogleDriveResponse(google_id); // Fetch fresh blob
        if (newBlob) {
            displayImage(image_id, newBlob); // Display the newly fetched blob
            await saveBlobToIndexedDB(image_id, google_id, newBlob); // Cache the blob for future use
            console.log(`Calling saveBlobToIndexedDB for '${image_id}' - '${google_id}'`);
        } else {
            console.error(`Failed to fetch blob for ${google_id}.`);
            displayErrorPlaceholder(image_id);
        }
    } catch (error) {
        console.error(`Error fetching image from Google Drive for ${google_id}:`, error);
        showErrorPlaceholder(image_id);
    }

    // Return default delay for uncached images
    return undefined;
}

function showLoadingGif(imageElement) {
    const placeholder = imageElement.closest(".image-placeholder");
    const loadingGif = placeholder.querySelector(".loading");
    if (loadingGif) {
        loadingGif.style.display = "block";
    }
}
function hideLoadingGif(imageElement) {
    const placeholder = imageElement.closest(".image-placeholder");
    const loadingGif = placeholder.querySelector(".loading");
    if (loadingGif) {
        loadingGif.style.display = "none";
    }
}

// Load multiple images
async function loadImages(googleIds, defaultDelay = 2000, cachedDelay = 200) {
    for (const { google_id, image_id } of googleIds) {
        const imageElement = document.getElementById(image_id);

        if (!imageElement) {
            console.warn(`Image element with ID '${image_id}' not found. Skipping.`);
            continue;
        }
        console.log(`Starting work on '${image_id}' for google_id '${google_id}'`);

        showLoadingGif(imageElement);

        // Determine delay dynamically based on cache state
        const delay = await processAndDisplayImage(image_id, google_id, imageElement, cachedDelay);

        // Delay to prevent overloading the server
        await new Promise((resolve) => setTimeout(resolve, delay ?? defaultDelay));
    }
}


async function processGoogleDriveResponse(googleId) {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbySIsmyaML6hXHYghe7DmsMImeqELQukugqDj7GbHuzCe7eX1KjrF5rCcigS0Z_mAk2Yg/exec?id=${googleId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch image for ID: ${googleId}`);
    }

    // Parse the response as text
    const responseText = await response.text();

    // Create a temporary container to extract the <img> tag
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = responseText;

    // Find the <img> tag
    const imgElement = tempContainer.querySelector('img');
    if (!imgElement || !imgElement.src) {
        throw new Error(`No valid <img> tag found in the response for ID: ${googleId}`);
    }

    // Fetch the actual image blob from the src URL in the <img> tag
    const imageResponse = await fetch(imgElement.src);
    if (!imageResponse.ok) {
        throw new Error(`Failed to load image blob from URL: ${imgElement.src}`);
    }

    // Return the image blob
    return await imageResponse.blob();
}

async function saveBlobToIndexedDB(image_id, google_id, blob) {
    try {
        await cacheImage(google_id, blob);
        console.log(`Saved blob to IndexedDB for '${image_id}' - '${google_id}'`);
    } catch (error) {
        console.error(`Error saving blob for '${google_id}' to IndexedDB:`, error);
    }
}





// Show fallback SVG overlay in case of error
function showErrorPlaceholder(imageId) {
    const imageElement = document.getElementById(imageId);

    // Ensure the image element exists
    if (!imageElement || !imageElement.parentElement) {
        console.error("Cannot show error placeholder: imageElement or its parentElement is null.");
        return;
    }

    // Hide the loading.gif
    hideLoadingGif(imageElement);

    // Remove skeleton class and make the thumbnail fully visible
    imageElement.parentElement.classList.remove("skeleton");
    imageElement.classList.add("loaded");

    // Find the parent placeholder div
    const placeholderDiv = imageElement.closest(".image-placeholder");
    if (!placeholderDiv) {
        console.error(`Parent placeholder for image ID '${imageId}' not found.`);
        return;
    }

    // Change the background color and remove border
    placeholderDiv.style.backgroundColor = "transparent";
    placeholderDiv.style.border = "none";

    // Define the SVG overlay
    const placeholderSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle">
            <circle cx="24" cy="24" r="10"></circle>
            <line x1="24" y1="20" x2="24" y2="24"></line>
            <line x1="24" y1="28" x2="24.01" y2="28"></line>
        </svg>
    `;



// Create a new <div> to hold both the error message and SVG
const errorWrapper = document.createElement("div");
errorWrapper.className = "error-placeholder"; // Add a class for styling purposes

// Create a <p> element for the error message
const errorMessage = document.createElement("p");
errorMessage.textContent = "Full-size image failed to load.";
errorMessage.style.position = "relative"; // Relative to the parent container
errorMessage.style.color = "#721c24"; // Match error text color
errorMessage.style.fontSize = "2rem"; // Adjust font size
errorMessage.style.textAlign = "center";
errorMessage.style.margin = "0";
errorMessage.style.zIndex = "2"; // Ensure it's above the background and SVG

// Create the SVG wrapper for the error icon
const svgWrapper = document.createElement("div");
svgWrapper.innerHTML = placeholderSvg;
svgWrapper.style.position = "relative";
svgWrapper.style.margin = "10px auto 0"; // Add space between the text and SVG
svgWrapper.style.width = "66%"; // Adjust size of the SVG as needed
svgWrapper.style.height = "66%";
svgWrapper.style.zIndex = "1"; // Below the text but above the background
svgWrapper.style.pointerEvents = "none"; // Prevent blocking interactions

errorWrapper.appendChild(errorMessage);
errorWrapper.appendChild(svgWrapper);

// Create the close (X) button
const closeButton = document.createElement("button");
closeButton.innerHTML = "&times;"; // HTML entity for "X"
closeButton.className = "close-error-button"; // Updated class name
closeButton.style.zIndex = "3"; // Ensure it's on top of everything else



// Attach the click event
closeButton.addEventListener("click", function () {
    errorWrapper.style.display = "none"; // Hide the error placeholder
    console.log("Close button clicked, error placeholder hidden.");
});

// Append the elements to the error wrapper
errorWrapper.appendChild(closeButton);


// Append the error wrapper to the placeholderDiv
placeholderDiv.appendChild(errorWrapper);







    console.log(`Error placeholder overlay added for image ID: ${imageId}`);
}




// Function to display full-size image
function showFullSizeImage(src, alt = "") {
    // Create the overlay container
    const overlay = document.createElement("div");
    overlay.className = "image-overlay";
    overlay.onclick = () => document.body.removeChild(overlay);

    // Create the image container
    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";

    // Create the image element
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.style.maxWidth = "90%";
    img.style.maxHeight = "90%";

    // Create the close button
    const closeButton = document.createElement("span");
    closeButton.className = "close-button";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = () => document.body.removeChild(overlay);

    // Append elements
    imgContainer.appendChild(img);
    imgContainer.appendChild(closeButton);
    overlay.appendChild(imgContainer);
    document.body.appendChild(overlay);
}

