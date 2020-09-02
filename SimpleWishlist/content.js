(function() {
    // Get all the images from current tab
    let foundImages = document.querySelectorAll("img");
    let message = {"content": "images"};
    let images_list = [];
    if (foundImages.length > 0) {
        // Create message with src attribute of images
        for (let i = 0; i < foundImages.length; i++) {
            // Make sure src attribute exists and element is not already in list !
            // Maek sure height and width are higher than 130 -> prevent fetching most of icons/buttons 
            if (foundImages[i].src && !images_list.includes(foundImages[i].src) && foundImages[i].width > 150 && foundImages[i].height > 150) {
                images_list.push(foundImages[i].src)
            }
        }
        if (images_list.length > 0) {
            message["images_list"] = images_list;
            chrome.runtime.sendMessage(message);
        } else {
            chrome.runtime.sendMessage({"content": "none"});
        }
    } else {
        chrome.runtime.sendMessage({"content": "none"});
    }
})();

