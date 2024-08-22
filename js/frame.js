function sendHeightToParent() {
   var height = document.body.scrollHeight;
   var extraHeight = 20; // Add some extra heightt for any scroll bars or padding
   window.parent.postMessage(height + extraHeight, 'https://ramkhamhaengcenter.iskconbangkok.com');
}

// Call this function when content loads or changes
window.onload = sendHeightToParent;
window.onresize = sendHeightToParent;
