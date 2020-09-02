"use strict";
/* ADD CURRENCY OPTIONS */
// Input fields
let currencyCode = document.querySelector("#currency-code");
let currencySymbol = document.querySelector("#currency-symbol");

// Form
let form = document.querySelector("#currency-form");

// Data to send
let currency = {};

// Add event listeners
currencyCode.addEventListener("change", updateCurrencyObject);
currencyCode.addEventListener("paste", updateCurrencyObject);
currencyCode.addEventListener("keyup", updateCurrencyObject);

currencySymbol.addEventListener("change", updateCurrencyObject);
currencySymbol.addEventListener("paste", updateCurrencyObject);
currencySymbol.addEventListener("keyup", updateCurrencyObject);

// On submit change last_currency and push to currency_list
form.addEventListener("submit", function() {
    chrome.storage.local.get("currency_list", function(result) {
        let new_list = result.currency_list.slice();
        new_list.push(currency);
        chrome.storage.local.set({"last_currency": currency, "currency_list": new_list});
    });
});

function updateCurrencyObject() {
    // Format input
    let currencyCodeFormated = currencyCode.value.replace(/\s/g, '');
    let currencySymbolFormated = currencySymbol.value.replace(/\s/g, '');
    currencyCode.value = currencyCodeFormated.toUpperCase();
    currencySymbol.value = currencySymbolFormated;
    // Update currency object
    currency = {
        currencyCode: currencyCode.value,
        currencySymbol: currencySymbol.value 
    };
}
/* */

/* DELETE CURRENCY OPTIONS */
let selection = document.querySelector("#selection");
// Get user defined codes and show them in selection
chrome.storage.local.get("currency_list", function(result) {
    if (result.currency_list === []){
        ;// Do nothing
    } else {
        for (let element of result.currency_list) {
            // Create option element to store one of currencies
            let newElement = document.createElement('option');
            // Create text that appears as option in selection and append to option element
            let symbol = element.currencySymbol;
            let textNode = document.createTextNode(element.currencyCode + " " + symbol + "");
            newElement.appendChild(textNode);
            newElement.value = element.currencyCode;
            // Append element to seleciton tag
            selection.appendChild(newElement);
        }
    }
});

let currencyFormDelete = document.querySelector("#currency-form-delete");
currencyFormDelete.addEventListener("submit", function() {
    if (!selection.value) {
        return;
    } else {
        chrome.storage.local.get(["currency_list", "last_currency"], function(result) {
            if (result.last_currency.currencyCode === selection.value) {
                chrome.storage.local.set({"last_currency": ""});
            }
            // Copy list
            let new_list = result.currency_list.slice();
            for (let element of new_list) {
                if (element.currencyCode === selection.value) {
                    let elementIndex = new_list.indexOf(element);
                    // Delete element from list
                    new_list.splice(elementIndex, 1);
                    break;
                }
            }
            chrome.storage.local.set({"currency_list": new_list});
        });
    }
});
/* */

// Download user data
// https://stackoverflow.com/questions/23160600/chrome-extension-local-storage-how-to-export
let downloadBtn = document.querySelector("#downloadBtn");
downloadBtn.addEventListener("click", function() {
    chrome.storage.local.get(["currency_list", "global_item_counter", "global_wishlist_counter", "last_currency", "wishlists"], function(items) {
        // Convert object to a string.
        var result = JSON.stringify(items, null, 4);
        
        // Save as file
        // https://stackoverflow.com/questions/23223718/failed-to-execute-btoa-on-window-the-string-to-be-encoded-contains-characte
        var url = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(result)));
        chrome.downloads.download({
            url: url,
            filename: 'simple_wishlist_data.json'
        });
    });
});

// Import data
// https://stackoverflow.com/questions/38833178/using-google-chrome-extensions-to-import-export-json-files
let importOrig = document.querySelector("#importOrig");
importOrig.addEventListener("change", importFun);
let fakeImp = document.querySelector("#fakeImp")
fakeImp.addEventListener("click", function() {
    importOrig.click()
});

function importFun(e) {
    var files = e.target.files, reader = new FileReader();
    reader.onload = _imp;
    reader.readAsText(files[0]);
}
  
function _imp() {
    var _myImportedData = JSON.parse(this.result);
    chrome.storage.local.set({
        "currency_list": _myImportedData["currency_list"],
        "global_item_counter": _myImportedData["global_item_counter"],
        "global_wishlist_counter": _myImportedData["global_wishlist_counter"],
        "last_currency": _myImportedData["last_currency"],
        "wishlists": _myImportedData["wishlists"]       
    }, function() {
        alert("Updated")
    });

    importOrig.value = ''; //make sure to clear input value after every import
}