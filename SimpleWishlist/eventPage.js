"use strict";

// Set pre-data
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.get(["global_wishlist_counter", "global_item_counter", "wishlists", "currency_list", "last_currency", "current_wishlist", "show_wishlist"], function(result) {
        // Set counters
        if (!result.global_wishlist_counter || result.global_wishlist_counter !== 0) {
            chrome.storage.local.set({"global_wishlist_counter": 0});
        }
        if (!result.global_item_counter || result.global_item_counter !== 0) {
            chrome.storage.local.set({"global_item_counter": 0}, function() {
                // Create current_item => item that stores inputed values
                chrome.storage.local.get("current_item", function(output) {
                    if (!output.current_item) {
                        chrome.storage.local.set({"current_item": {id: "", name: "", price: "", currency: "", currency_symbol: "", url: "", image: ""}})
                    }
                })
            });
        }
        
        // Set arrays that hold wishlist's and item's data names example: [wishlist1, wishlist2]
        if (!result.wishlists) {
            chrome.storage.local.set({"wishlists": {}});
        }

        // User currency list
        if (!result.currency_list) {
            chrome.storage.local.set({"currency_list": []});
        }

        // Remember currency
        if (!result.last_currency) {
            chrome.storage.local.set({"last_currency": ""});
        }

        // Current wishlist
        if (!result.current_wishlist) {
            chrome.storage.local.set({"current_wishlist": ""});
        }
        
        // Should open wishlist for user ?
        chrome.storage.local.set({"show_wishlist": false});
    });
});
