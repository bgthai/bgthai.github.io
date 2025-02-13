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
        return result || null;
    } catch (error) {
        console.error(`Error retrieving blob for '${google_id}' from IndexedDB:`, error);
        return null;
    }
}



// Display the image
function displayImage(image_id, blob, alt_text, title_text) {
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

    const newImageElement = document.createElement("img");
    // img.src = imageUrl;
    newImageElement.alt = alt_text || 'Image from Drive';
    newImageElement.title = title_text || 'Image from Drive';
    // newImageElement.style.maxWidth = '100%';
    // newImageElement.style.height = 'auto';
    newImageElement.classList.add("loaded");
    newImageElement.onload = function () {
        console.log(`Image successfully displayed from: ${blobURL}`);
        imgElement.replaceWith(newImageElement);

        // Change background color of the placeholder div
        placeholderDiv.style.backgroundColor = "transparent"; // or "white" if preferred
        placeholderDiv.style.border = "none";
    };

    newImageElement.onerror = function (error) {
        console.error(`Error loading image: ${blobURL}`);
        console.error(error);
        displayErrorPlaceholder(image_id);
    };

    newImageElement.src = blobURL;

    // Keep blob URL in scope (debugging)
    window.debugBlobURLs = window.debugBlobURLs || {};
    window.debugBlobURLs[image_id] = blobURL;
}


// Process and display an image, handling cache and network fetches
async function processAndDisplayImage(image_id, google_id, imageElement, alt_text, title_text, cachedDelay) {
    console.log(`Starting work on '${image_id}'`);

    // Attempt to fetch blob from IndexedDB (cached storage)
    try {
        const cachedBlob = await getBlobFromIndexedDB(google_id);
        if (cachedBlob) {
            const isValidImageBlob = cachedBlob.type.startsWith("image/");
            if (isValidImageBlob) {
                console.log(`Blob for ${image_id} - ${google_id} is valid. Attempting display.`);
                displayImage(image_id, cachedBlob, alt_text, title_text);

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
            displayImage(image_id, newBlob, alt_text, title_text); // Display the newly fetched blob
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



// Load multiple images
async function loadImages(googleIds, defaultDelay = 2000, cachedDelay = 200) {
    for (const { google_id, image_id, alt_text, title_text } of googleIds) {
        const imageElement = document.getElementById(image_id);

        if (!imageElement) {
            console.warn(`Image element with ID '${image_id}' not found. Skipping.`);
            continue;
        }
        console.log(`Starting work on '${image_id}' for google_id '${google_id}'`);

        hideSkeleton(imageElement); // Hide skeleton while loading

        // Determine delay dynamically based on cache state
        const delay = await processAndDisplayImage(image_id, google_id, imageElement, alt_text, title_text, cachedDelay);

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





// Show fallback image in case of error
function showErrorPlaceholder(imageId) {
    imageElement = document.getElementById(imageId)
    // Ensure the image element exists
    if (!imageElement || !imageElement.parentElement) {
        console.log(imageElement)
        console.log('And now its parent')
        console.log(document.getElementById(imageElement).parentElement)
        console.error("Cannot show error placeholder: imageElement or its parentElement is null.");
        return;
    }

    const placeholderSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle">
            <circle cx="24" cy="24" r="10"></circle>
            <line x1="24" y1="20" x2="24" y2="24"></line>
            <line x1="24" y1="28" x2="24.01" y2="28"></line>
        </svg>
    `;


    // Create a new <div> to hold the SVG error placeholder
    const svgWrapper = document.createElement("div");
    svgWrapper.innerHTML = placeholderSvg;
    svgWrapper.className = "error-placeholder"; // Add a class for styling purposes
    svgWrapper.style.display = "block"; // Match the image display for consistency
    svgWrapper.style.width = imageElement.style.width || "100%"; // Match the size of the original image
    svgWrapper.style.height = imageElement.style.height || "auto"; // Match the size of the original image

    // Preserve the `id` and any relevant attributes
    svgWrapper.id = imageElement.id;

    // Replace the image element with the SVG wrapper *in place*
    imageElement.replaceWith(svgWrapper);
    console.log(`Error placeholder displayed for image ID: ${svgWrapper.id}`);
}






// Function to hide the skeleton
function hideSkeleton(imageElement) {
    const placeholder = imageElement.closest('.image-placeholder');

    if (placeholder) {
        const skeleton = placeholder.querySelector('.skeleton');
        if (skeleton) skeleton.style.display = "none";

        imageElement.style.display = "block";
    }
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



async function loadImagesOG(googleIds, delay = 2000) {
    for (let i = 0; i < googleIds.length; i++) {
        const { google_id, image_id, alt_text, title_text } = googleIds[i];

        const googleUrl = "https://script.google.com/macros/s/AKfycbySIsmyaML6hXHYghe7DmsMImeqELQukugqDj7GbHuzCe7eX1KjrF5rCcigS0Z_mAk2Yg/exec?id=" + google_id;

        const imageElement = document.getElementById(image_id);

        // Hide the skeleton and show the loading GIF
        hideSkeleton(imageElement);

        try {
            // Fetch the image data from Google Apps Script
            const response = await fetch(googleUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newImageData = await response.text();

            if (imageElement) {
                const parentElement = imageElement.parentElement;

                // Remove the existing image element
                imageElement.remove();

                // Create a new img element from the returned data
                const newImageElement = document.createElement("div");
                newImageElement.innerHTML = newImageData; // This will contain the <img> tag

                const img = newImageElement.querySelector("img");
                if (img) {
                    img.onload = () => {
                        parentElement.classList.add("loaded"); // Add 'loaded' class to parent container
                    };

                    img.alt = alt_text || "Image from Drive";
                    img.title = title_text || "Image from Drive";

                    img.style.maxWidth = "100%";
                    img.style.height = "auto";

                    // Add onclick handler for full-size view
                    img.onclick = () => showFullSizeImage(img.src, img.alt);

                    parentElement.appendChild(img);
                }
            }
        } catch (error) {
            console.error("Error fetching image:", error);

            if (imageElement) {
                const parentElement = imageElement.parentElement;

                // Remove the loading GIF
                imageElement.remove();

                // Append fallback error image
                const fallbackImg = document.createElement("img");
                fallbackImg.src = "data:image/svg+xml;base64," + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
                    <rect width="600" height="600" fill="#f3f3f3" />
                    <text x="50%" y="50%" fill="#888" font-size="30" font-family="Arial, sans-serif" text-anchor="middle" alignment-baseline="middle">
                        Error Loading Image
                    </text>
                    </svg>
                    `);

                fallbackImg.alt = "Error loading image";
                fallbackImg.title = "Failed to load image";
                fallbackImg.style.maxWidth = "100%";
                fallbackImg.style.height = "auto";

                parentElement.appendChild(fallbackImg);
            }
        }

        // Delay to prevent overloading the server
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
