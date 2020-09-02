![Imgur](https://i.imgur.com/7cce2o4.png)

 # SimpleWishlist
SimpleWishlist is a chrome extension used for storing user's favorite items in a separate lists that user can edit and delete. This extension uses only local storage (5MB), user can't share data by using sync storage. I choose local storage over sync simply because of available size and needs of extension. This extension doesn't require to have any accounts from other applications. Extensions is entirely made with JavaScript and uses [Bootstrap](https://getbootstrap.com/) for styling, every icon used in interface is a [Bootstrap](https://getbootstrap.com/) icon, extension icon is made by me using [Inkscape](https://inkscape.org/).

### Main Menu
The main menu displays all information about item user needs to input. Currency is optional and user can add their own if it's not in a list (go to extension's options). User can choose preview image for their item, but it's not mandatory. The URL is fetched automatically from the active tab.

### Show Wishlist Menu
In this menu user can create a new wishlist or open one of saved lists.
![Imgur](https://i.imgur.com/AhFp7V1.png)

If a user opens saved wishlist they get all items inside it. The user can sort items based on their price by using arrows. Also inside this menu user can find "Save and close" button which will save changes and "Delete" button which will delete the whole wishlist.

![Imgur](https://i.imgur.com/sQu5oKf.png)

### Find Images
This menu runs a content script on active tab and looks for images that user can pick for item preview.
![Imgur](https://i.imgur.com/0J07Dso.png)

### Extension's Options
Users can add theirs own currencies if they are not provided in main list of currencies
![Imgur](https://i.imgur.com/eFFgm4p.png)

User can download wishlist data and then upload it. It might be useful in following situations:
- User wants to upload data on other devices
- User wants to reinstall application

![Imgur](https://i.imgur.com/asMbtXJ.png)

### Extension Permissions
1. Downloads - required for user to download wishlist data in a json file format (located in the extension's options).
2. Storage - required to store user defined wishlists and other variables that are needed for proper running of extension. An example of such variable is "show_wishlist" that takes false/true based on user actions. If its true then part of the menu change display to "block" else if it's false the same part of the menu change display to "none".
3. ActiveTab - required to run content.js script that gets images from a website. Images are used as preview for items stored in a wishlist. Also get activeTab URL so users don't have to do it manually every time they open extension.
