"use strict";

// Prepare UI
(function() {
    // Prepare panes
    let listOfFoundImages = document.querySelector("#listOfFoundImages");
    let listOfItemsInAWishlist = document.querySelector("#listOfItemsInAWishlist");
    // Containers that hold the arrows
    let displayFoundImages = document.querySelector("#displayFoundImages");
    let displayCurrentListContainer = document.querySelector("#displayCurrentListContainer");
    // Behaviour when user clicks on arrow that is responsible for displaying wishlist items
    displayCurrentListContainer.addEventListener("click", function() {
        if (listOfItemsInAWishlist.style.display === "none") {
            listOfFoundImages.style.display = "none";
            listOfItemsInAWishlist.style.display = "block";
        } else {
            listOfItemsInAWishlist.style.display = "none";
        }
    });
    // Behaviour when user clicks on arrow that is responsible for displaying images found on site
    displayFoundImages.addEventListener("click", function() {
        if (listOfFoundImages.style.display === "none") {
            listOfItemsInAWishlist.style.display = "none"
            listOfFoundImages.style.display = "flex";
            displayFoundImages.classList.add("run-content-script");
        } else {
            listOfFoundImages.style.display = "none";
            displayFoundImages.classList.remove("run-content-script");
            
        }
    });
    
    // "Add to current list" button
    let submitBtnAddToCurrent = document.querySelector("#submitBtnAddToCurrent");
    chrome.storage.local.get("current_wishlist", function(result) {
        // Disabled when there is no current_wishlist
        if (result.current_wishlist) {
            submitBtnAddToCurrent.disabled = !submitBtnAddToCurrent.disabled;
        }
    });
})();


class Item {
    constructor(id, name, url, price, currency, image, symbol) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.currency = currency;
        this.currency_symbol = symbol
        this.url = url;
        this.image = image;
    }
}

class Wishlist {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.items = [];
    }
}

// Item input fields
let itemName = document.querySelector("#name");
let itemPrice = document.querySelector("#price");
let itemUrl = document.querySelector("#itemUrl");
let itemImage = document.querySelector("#imgItemUrl");

// Currency selector
let currencySelector = document.querySelector("#currencySelector");
let currencySymbol = currencySelector.options[currencySelector.selectedIndex];
let symbol = currencySelector.options[currencySelector.selectedIndex].getAttribute("data-symbol");

// Update currency selector with user created currencies
chrome.storage.local.get(["currency_list", "last_currency"], function(result) {
    if (result.currency_list !== []){
        let currency_list = result.currency_list.slice();
        for (let element of currency_list) {
            // Create option
            let newElement = document.createElement('option');
            // Get currency code and set it as value
            let code = element.currencyCode;
            newElement.value = code;
            // Get currency symbol and set it as data-symbol
            let symbol = element.currencySymbol;
            newElement.setAttribute("data-symbol", symbol);
            // Create text that appears as option in selection and append to option element
            let textNode = document.createTextNode(code);
            newElement.appendChild(textNode);
            // Append new element to selector
            currencySelector.insertBefore(newElement, currencySelector.childNodes[0])
            // currencySelector.appendChild(newElement)
        }
    }
    if (result.last_currency) {
        currencySelector.value = result.last_currency.currencyCode;
    }
});

itemName.addEventListener("input", updateItem);
itemPrice.addEventListener("input", function() {
    formatPrice(this.value);
    updateItem();
});

itemImage.addEventListener("input", function() {
    updateImgUrl(this.value);
});

currencySelector.addEventListener("change", function() {
    symbol = currencySelector.options[currencySelector.selectedIndex].getAttribute("data-symbol");
    updateItem();
});

// Get current page url and insert it into URL input field
chrome.tabs.query({active:true, currentWindow:true}, function(tabArray){
    let currentTabURL = tabArray[0].url;
    itemUrl.value = currentTabURL;
});

// Check if current itemUrl is equal to the one in storage
chrome.storage.local.get("current_item", function(outputObject) {
    // If it's not, reset all fields else update fields with known data
    if (outputObject.current_item && outputObject.current_item.url !== itemUrl.value) {
        resetFields();
    } else {
        itemName.value = outputObject.current_item.name;
        itemPrice.value = outputObject.current_item.price;
        itemImage.value = outputObject.current_item.image;
        currencySelector.value = outputObject.current_item.currency;
    }
});

// Submit form event
let mainForm = document.querySelector("#main-form");
mainForm.addEventListener("submit", function(event) {
    // Check if valid number
    if (!validatePrice(itemPrice.value)) {
        alert("Invalid price, please use only numbers without special characters.")
        return;
    }
    chrome.storage.local.get(["last_currency", "current_item", "global_item_counter", "current_wishlist"], function(result) {
        let currentItem = result.current_item;
        // Add one to global item counter
        let itemCounter = result.global_item_counter;
        itemCounter++;
        let newLastCurrency = {
            "currencyCode": currentItem.currency, 
            "currencySymbol": currentItem.currency_symbol
        };
        // Clear current item
        let cleanCurrentItem = new Item(itemCounter, "", "", "", "", "", "");
        
        // Add item to list of items inside wishlist
        let currentWishlist = result.current_wishlist;
        currentWishlist.items.push(currentItem); 
        chrome.storage.local.set({
            "last_currency": newLastCurrency,
            "global_item_counter": itemCounter,
            "current_item": cleanCurrentItem,
            "current_wishlist": currentWishlist
        });
    });
});


// When user wants to add new currency, redirect user to options
let openOptions = document.querySelector("#openOptions");
openOptions.addEventListener("click", function() {
    chrome.runtime.openOptionsPage();
});

// When user wants to find new images run content script that tries to find them on current website
let displayFoundImages = document.querySelector("#displayFoundImages");
displayFoundImages.addEventListener("click", function() {
    if (this.classList.contains("run-content-script")) {
        chrome.tabs.executeScript({
            file: 'content.js'
        });
    }
});

// Display images using pagination
let current_page = 1;
chrome.runtime.onMessage.addListener(
    function(request) {
        if (request.content === "images") {
            let images = [];
            current_page = 1;
            images = request.images_list;
            
            let itemsPerPage = 8
            
            let btnWrapper = document.querySelector("#pagination");
            let wrapper = document.querySelector("#images-wrapper");
            
            if (images.length > 0) {
                displayElements(1, itemsPerPage, images, wrapper, "images");
                paginationSetup(images, btnWrapper, itemsPerPage, "images");
            }
        } else if (request.content === "none") {
            let imagesContainer = document.querySelector(".flexbox-images")
            imagesContainer.style.minHeight = "initial";
            let wrapper = document.querySelector("#images-wrapper");
            wrapper.innerHTML = "";
            let infoContainer = document.createElement("div");
            infoContainer.innerText = "Couldn't find any images.";
            wrapper.appendChild(infoContainer);
        }
    }
);

// New Wishlist functionality
let listName = document.querySelector("#listName");
let submitWishlist = document.querySelector("#submitWishlist");
submitWishlist.addEventListener("submit", function() {
    chrome.storage.local.get(["global_wishlist_counter"], function(result) {
        let counterWishlist = result.global_wishlist_counter;
        let newWishlist = new Wishlist(counterWishlist, listName.value);
        chrome.storage.local.set({"current_wishlist": newWishlist});
    });
});

// Click event that controls content of wishlist pane
let displayCurrentListContainer = document.querySelector("#displayCurrentListContainer");
let listOfItemsInAWishlist = document.querySelector("#listOfItemsInAWishlist");
displayCurrentListContainer.addEventListener("click", function() {
    // Run only once (avoid running it when pushing hide button !
    if (listOfItemsInAWishlist.style.display !== "none") { 
        current_page = 1;
        
        // Keep wishlist pane open
        chrome.storage.local.set({"show_wishlist": true});

        chrome.storage.local.get("current_wishlist", function(result) {
            // If current wishlist is empty string
            if (!result.current_wishlist) {
                let currentListContainer = document.querySelector("#currentListContainer");
                currentListContainer.style.display = "none"
                // Create options to select wishlist
                chrome.storage.local.get("wishlists", function(output) {
                    let optionsContainer = document.querySelector("#openSavedSelect");
                    optionsContainer.innerHTML = '<option title="No selection" disabled selected value>-- select an option --</option>';
                    let wishlistsObject = output.wishlists;
                    let wishlistsArray = Object.values(wishlistsObject);
                    for (let i = 0; i < wishlistsArray.length; i++) {
                        let newOption = document.createElement('option');
                        newOption.value = wishlistsArray[i].id;
                        newOption.innerText = formatItemName(wishlistsArray[i].name);
                        optionsContainer.appendChild(newOption);
                    }
                });
            } else {
                // If current wishlist exists (different than empty string) then hide menu used to create new wishlist
                let createNewListContainer = document.querySelector("#createNewListContainer");
                createNewListContainer.style.display = "none";
                // Display list name
                let displayName = document.querySelector("#displayName");
                displayName.innerText = result.current_wishlist.name;
                
                let editWishlistNameSVG = document.querySelector("#editWishlistNameSVG");
                // Ensure the display is correct -> if user doesn't refresh app 
                displayName.style.display = "block";
                editWishlistNameSVG.style.display = "block";
                displayNameEditContainer.style.display = "none";
                // Change displayed name event
                editWishlistNameSVG.addEventListener("click", function() {
                    let displayNameEdit = document.querySelector("#displayNameEdit")
                    displayName.style.display = "none";
                    editWishlistNameSVG.style.display = "none";
                    displayNameEditContainer.style.display = "block";
                    displayNameEdit.value = displayName.innerText;
                });
                let submitNewWishlistNameBtn = document.querySelector("#submitNewWishlistNameBtn");
                submitNewWishlistNameBtn.addEventListener("click", function() {
                    if (displayNameEdit.value) {
                        chrome.storage.local.get("current_wishlist", function(result) {
                            let currentWishlist = result.current_wishlist;
                            currentWishlist.name = displayNameEdit.value;
                            displayName.innerText = currentWishlist.name;
                            chrome.storage.local.set({"current_wishlist": currentWishlist}, function() {
                                // After submit bring back original look
                                displayName.style.display = "block";
                                editWishlistNameSVG.style.display = "block";
                                displayNameEditContainer.style.display = "none";
                            });
                        });
                    }
                });

                // Display items
                let wishlist_items = result.current_wishlist.items;
                if (wishlist_items.length > 0) {    
                    let itemsPerPage = 5;
                    current_page = 1;
                    let btnWrapper = document.querySelector("#wishlistPaginationBtnWrapper");
                    let wrapper = document.querySelector("#listOfItems");

                    displayElements(1, itemsPerPage, wishlist_items, wrapper, "items");
                    paginationSetup(wishlist_items, btnWrapper, itemsPerPage, "items");
                }
            }
        });
    } else {
        // If user wants to hide wishlists pane 
        chrome.storage.local.set({"show_wishlist": false});
    }
});

// Sorting btns events
let ascendingBtn = document.querySelector("#ascendingBtn");
let descendingBtn = document.querySelector("#descendingBtn");
ascendingBtn.addEventListener("click", function() {
    chrome.storage.local.get("current_wishlist", function(result) {
        if (result.current_wishlist.items.length > 0) {
            let items = result.current_wishlist.items;
            let newWishlist = result.current_wishlist;
            bubbleSortWishlistItemsAscending(items);
            newWishlist.items = items;
            chrome.storage.local.set({"current_wishlist": newWishlist}, function() {
                window.location.reload();
            });
        }
    });
});
descendingBtn.addEventListener("click", function() {
    chrome.storage.local.get("current_wishlist", function(result) {
        if (result.current_wishlist.items.length > 0) {
            let items = result.current_wishlist.items;
            let newWishlist = result.current_wishlist;
            bubbleSortWishlistItemsDescending(items);
            newWishlist.items = items;
            chrome.storage.local.set({"current_wishlist": newWishlist}, function() {
                window.location.reload();
            });
        }
    });
});

// Click event on open saved wishlist button
let openOldBtn = document.querySelector("#openOldBtn")
let openSavedSelect = document.querySelector("#openSavedSelect");
openOldBtn.addEventListener("click", function() {
    let idOfSelectedWishlist = openSavedSelect.options[openSavedSelect.selectedIndex].value;
    if (idOfSelectedWishlist) {
        chrome.storage.local.get("wishlists", function(result) {
            let selectedList = result.wishlists[idOfSelectedWishlist];
            chrome.storage.local.set({"current_wishlist": selectedList}, function() {
                // Refresh
                window.location.reload();
            });
        });
    }
});

// Display wishlist pane until users choose to hide it 
chrome.storage.local.get("show_wishlist", function(result){
    if (result.show_wishlist) {
        displayCurrentListContainer.click()
    }
});

// Delete current wishlist button 
let deleteCurrentWishlist = document.querySelector("#deleteCurrentWishlist");
deleteCurrentWishlist.addEventListener("click", function() {
    chrome.storage.local.get(["current_wishlist", "wishlists"], function(result) {
        let currentWishlist = result.current_wishlist;
        let currentWishlistId = currentWishlist.id;
        let allWishlists = result.wishlists;
        delete allWishlists[currentWishlistId];
        chrome.storage.local.set({"current_wishlist": "", "wishlists": allWishlists}, function() {
            window.location.reload();
        });
    });
});

// Click event for closing current_wishlist and saving it
let closeCurrentBtn = document.querySelector("#closeCurrentBtn");
closeCurrentBtn.addEventListener("click", function() {
    chrome.storage.local.get(["current_wishlist", "global_wishlist_counter", "wishlists"], function(result) {
        let currentWishlistId = result.current_wishlist.id;
        let wishlistToSave = result.current_wishlist;
        let allWishlists = result.wishlists;
        let counter = result.global_wishlist_counter;
        
        // If new
        if (!(currentWishlistId in allWishlists)) {
            counter++;
        }

        allWishlists[wishlistToSave.id] = wishlistToSave;        
        chrome.storage.local.set({"current_wishlist": "", "global_wishlist_counter": counter, "wishlists": allWishlists}, function() {
            window.location.reload();
        });
    
    });
});

function bubbleSortWishlistItemsAscending(itemsArray) {
    let swaps = 1;
    while (swaps !== 0) {
        swaps = 0;
        for (let i = 0; i < itemsArray.length - 1; i++) {
            if (parseFloat(itemsArray[i].price) > parseFloat(itemsArray[i+1].price)){
                let second = itemsArray[i+1];
                itemsArray[i+1] = itemsArray[i];
                itemsArray[i] = second;
                swaps++;
            }
        }
    }
}
function bubbleSortWishlistItemsDescending(itemsArray) {
    let swaps = 1;
    while (swaps !== 0) {
        swaps = 0;
        for (let i = 0; i < itemsArray.length - 1; i++) {
            if (parseFloat(itemsArray[i].price) < parseFloat(itemsArray[i+1].price)){
                let second = itemsArray[i+1];
                itemsArray[i+1] = itemsArray[i];
                itemsArray[i] = second;
                swaps++;
            }
        }
    }
}

/* Pagination functionality */
/* Finished with help from https://www.youtube.com/watch?v=IqYiVHrO2U8 */

function paginationSetup(items, wrapper, itemsPerPage, typeOfElement) {
    // Reset wrapper so elements don't stack
    wrapper.innerHTML = "";
    let pageCount = Math.ceil(items.length/itemsPerPage);
    for (let i = 1; i < pageCount + 1; i++) {
        let btn = createPaginationBtn(items, i, itemsPerPage, typeOfElement);
        wrapper.appendChild(btn);
    }
}
function createPaginationBtn(items, page, itemsPerPage, typeOfElement) {
    let button = document.createElement("button");
    button.innerText = page;
    addClassesToElement(button, ["btn", "btn-dark", "mx-1", "my-1"])
    if (typeOfElement === "images"){
        let wrapper = document.querySelector("#images-wrapper");
    
        if (current_page === page) button.classList.add("active");
        
        button.addEventListener("click", function() {
            current_page = page;
            displayElements(page, itemsPerPage, items, wrapper, "images");
    
            let current_button = document.querySelector("#pagination button.active");
            current_button.classList.remove("active");
    
            this.classList.add("active");
        });
    } else if (typeOfElement === "items") {
        let wrapper = document.querySelector("#listOfItems");
        
        if (current_page === page) button.classList.add("active");

        button.addEventListener("click", function() {
            current_page = page;
            displayElements(page, itemsPerPage, items, wrapper, "items");
    
            let current_button = document.querySelector("#wishlistPaginationBtnWrapper button.active");
            current_button.classList.remove("active");
    
            this.classList.add("active");
        });
    }

    return button;
}
function displayElements(pageNumber, itemsPerPage, items, wrapper, typeOfElement) {
    // Reset wrapper so elements don't stack
    wrapper.innerHTML = "";
    pageNumber--;
    
    // Get the start index
    let start = itemsPerPage * pageNumber;
    // Get the end index -> which is equal to number of items per page after slicing array
    let end = start + itemsPerPage;
    let itemsToDisplay = items.slice(start, end);

    if (typeOfElement === "images"){
        for (let i = 0; i < itemsToDisplay.length; i++) {
            let source = itemsToDisplay[i];
            let fullElement = createImgElement(source);
            wrapper.appendChild(fullElement);
        }
    } else if (typeOfElement === "items") {
        for (let i = 0; i < itemsToDisplay.length; i++) {
            let item = itemsToDisplay[i];
            let fullElement = createItemElement(item);
            wrapper.appendChild(fullElement);
        }
    }
}

function createItemElement(item) {
    // Create <li class="list-group-item wishlistItem px-2 py-2 border border-dark">
    let listElement = document.createElement('li');
    addClassesToElement(listElement, ["list-group-item", "wishlistItem", "px-2", "py-2", "border", "border-dark"]);
    
    // Create <div class="imageAndNameContainer">
    let imageAndNameContainer = document.createElement('div');
    imageAndNameContainer.classList.add("imageAndNameContainer"); 

    // Create <img src="...." class="imageOfWishlistItem">
    let imageOfWishlistItem = document.createElement('img');
    imageOfWishlistItem.src = item.image;
    imageOfWishlistItem.classList.add("imageOfWishlistItem");
    imageOfWishlistItem.addEventListener("mouseover", function() {
        imageOfWishlistItem.style.maxWidth = "200px";
        imageOfWishlistItem.style.maxHeight = "200px";
        // Reset after some delay
    });
    imageOfWishlistItem.addEventListener("mouseout", function() {
        imageOfWishlistItem.style.maxWidth = "100px";
        imageOfWishlistItem.style.maxHeight = "100px";
        // Reset after some delay
    });
    imageAndNameContainer.appendChild(imageOfWishlistItem);

    // Create <span class="item-name">
    let spanItemName = document.createElement('span');
    addClassesToElement(spanItemName, ["item-name", "ml-2"])
    spanItemName.innerText = formatItemName(item.name);
    spanItemName.title = item.name;
    imageAndNameContainer.appendChild(spanItemName);
    listElement.appendChild(imageAndNameContainer);
    
    // Create <hr class="w-100 my-1 mx-0">
    let hr = document.createElement("hr");
    addClassesToElement(hr, ["w-100", "my-1", "mx-0"]);
    listElement.appendChild(hr);
    
    // Create <div class="item-data"> AND append all rest components inside it
    let itemDataDiv = document.createElement('div');
    itemDataDiv.classList.add("item-data");
    
    // Create <div class="itemPrice"><span class="currencySymbol"></span></div>
    let itemPriceDiv = document.createElement('div');
    itemPriceDiv.classList.add("itemPrice");
    itemPriceDiv.innerText = item.price;
    let currencySymbolSpan = document.createElement('span');
    currencySymbolSpan.classList.add("currencySymbol");
    currencySymbolSpan.innerText = " " + item.currency_symbol + " " + item.currency; 
    itemPriceDiv.appendChild(currencySymbolSpan);
    
    itemDataDiv.appendChild(itemPriceDiv);
    
    // Create <button class="btn btn-outline-danger deleteBtn my-0 py-0">
    let deleteBtn = document.createElement('button');
    addClassesToElement(deleteBtn, ["btn", "btn-outline-danger", "deleteBtn", "my-0", "py-0"]);
    // Create <svg> trash icon -> BOOTSTRAP ICONS
    let svgString = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>\
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>\
                    </svg>';
    // https://stackoverflow.com/questions/24107288/how-to-create-a-svg-dom-element-from-a-string
    let parser = new DOMParser();
    let doc = parser.parseFromString(svgString, "image/svg+xml");
    deleteBtn.appendChild(doc.documentElement);
    // Add 'click' event that allows to delete item from wishlist by clicking button
    deleteBtn.addEventListener("click", function() {
        chrome.storage.local.get("current_wishlist", function(result) {
            let currentItemsWishlist = result.current_wishlist.items;
            let newItemsWishlist = [];
            let alreadyDeleted = false;
            for (let i = 0; i < currentItemsWishlist.length; i++) {
                if (currentItemsWishlist[i].id !== item.id) {
                    newItemsWishlist.push(currentItemsWishlist[i]);
                }
            }
            let newList = result.current_wishlist;
            newList.items = newItemsWishlist;
            chrome.storage.local.set({"current_wishlist": newList}, function() {
                // Update page !
                let itemsPerPage = 5;
                let btnWrapper = document.querySelector("#wishlistPaginationBtnWrapper");
                let wrapper = document.querySelector("#listOfItems");
                displayElements(current_page, itemsPerPage, newList.items, wrapper, "items");
                paginationSetup(newList.items, btnWrapper, itemsPerPage, "items");
            });
        })
    });
    
    itemDataDiv.appendChild(deleteBtn);
    
    // Create <div class="linkToItem"><a href="<IMAGE URL>" target="_blank">Go to</a></div>
    let linkToItemDiv = document.createElement('div');
    linkToItemDiv.classList.add("linkToItem");
    let openInNewTab = document.createElement('a');
    openInNewTab.href = item.url;
    openInNewTab.target = "_blank"
    openInNewTab.innerText = "Go to";
    linkToItemDiv.appendChild(openInNewTab);
    
    itemDataDiv.appendChild(linkToItemDiv)
    listElement.appendChild(itemDataDiv);
    
    return listElement;
}

function formatItemName(name) {
    if (name.length > 47) {
        name = name.substr(0, 47) + "...";
    }
    return name;
}

function addClassesToElement(element, classes) {
    for (let i = 0; i < classes.length; i++) {
        element.classList.add(classes[i])
    }
    return element;
}

function createImgElement(src) {    
    // Create <div class="image-container"></div>
    let imageContainer = document.createElement('div');
    imageContainer.classList.add("image-container");
    // Create <img src=SRC alt="Item Image" class="item-image">
    let itemImageElement = document.createElement('img');
    itemImageElement.src = src;
    itemImageElement.alt = "Item Image";
    itemImageElement.classList.add("item-image");
    // Create <div class="svg-check"> and and "click" event
    let svgCheckContainer = document.createElement('div');
    svgCheckContainer.classList.add("svg-check");
    svgCheckContainer.style.display = "none";
    // Add "click" event on div
    imageContainer.addEventListener("click", function() {
        let currentSelectedImg = document.querySelector(".active-image");
        let currentSelectedSVG = document.querySelector(".active-image div.svg-check");
        if (currentSelectedImg) {
            currentSelectedImg.classList.remove("active-image");
            currentSelectedSVG.style.display = "none";
        }
        this.classList.add("active-image");
        let newSelectedSVG = document.querySelector(".active-image div.svg-check");
        newSelectedSVG.style.display = "flex";
        let selectedImgUrl = document.querySelector(".active-image img").src;
        // Make visual change ("blink") so user is not confused wether change occurred
        itemImage.classList.add("blink");
        setTimeout(function() {
            itemImage.classList.remove("blink");            
        }, 100);
        updateImgUrl(selectedImgUrl);
    });

    // Create <svg> that overlays element when user clicks it --> BOOTSTRAP ICONS
    let svgString = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-bookmark-check" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\
                    <path fill-rule="evenodd" d="M4.5 2a.5.5 0 0 0-.5.5v11.066l4-2.667 4 2.667V8.5a.5.5 0 0 1 1 0v6.934l-5-3.333-5 3.333V2.5A1.5 1.5 0 0 1 4.5 1h4a.5.5 0 0 1 0 1h-4z"/>\
                    <path fill-rule="evenodd" d="M15.854 2.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 4.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>\
                    </svg>';
    // https://stackoverflow.com/questions/24107288/how-to-create-a-svg-dom-element-from-a-string
    let parser = new DOMParser();
    let doc = parser.parseFromString(svgString, "image/svg+xml");

    svgCheckContainer.appendChild(doc.documentElement);

    imageContainer.appendChild(itemImageElement);
    imageContainer.appendChild(svgCheckContainer);
    
    // Add active-image class to images that is stored in current items
    chrome.storage.local.get("current_item", function(result) {
        if (result.current_item) {
            let storedUrl = result.current_item.image;
            if (storedUrl === src) {
                imageContainer.classList.add("active-image");
                svgCheckContainer.style.display = "flex";
            }
        }
    });
    
    return imageContainer;

}
/* End of pagination functions */

function formatPrice(price) {
    // Handle comma and period decimal separators 
    itemPrice.value = itemPrice.value.replace(/,/g, '.');
    // Replace space
    itemPrice.value = itemPrice.value.replace(/\s/g, '');
}

function validatePrice(price) {
    // SOURCE: https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    return isNumeric(price)
}

function updateImgUrl(url) {
    chrome.storage.local.get("current_item", function(result) {
        let copy = result.current_item;
        copy["image"] = url;
        itemImage.value = url;
        chrome.storage.local.set({"current_item": copy}, function() {
            updateItem();
        });
    });
}

function updateItem() {
    // When user edits a field save it for later use --> for example when extension closes and user wants to add more information about product
    chrome.storage.local.get(["global_item_counter", "current_item"], function(result) {
        symbol = currencySelector.options[currencySelector.selectedIndex].getAttribute("data-symbol");
        let new_item = new Item(result.global_item_counter, itemName.value, itemUrl.value, 
                        itemPrice.value, currencySelector.value, itemImage.value, symbol);
        chrome.storage.local.set({"current_item": new_item});
    });
}

function resetFields() {
    // When item in memory has different url than currently open tab set fields to empty string
    itemName.value = "";
    itemPrice.value = "";
    itemImage.value = "";
}

chrome.storage.local.get(null, function(result) {
    console.log(result);
});
