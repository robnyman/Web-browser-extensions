/*
	Developed by Robert Nyman, http://www.robertnyman.com
*/ 
var flickrGalleryPlus = function () {
	var fileNameReplace = /\_s(\.jpg)/i,
		states = [],
		statusBarButton,
		startSlideshowText = "Start slideshow",
		stopSlideshowText = "Stop slideshow",
		slideTime = 3000,
		preloadImages,
		preloadImagesWhenSlideshowIsRun,
		preloadingText,
		preloadingProgressBar,
		prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
		
		init = function () {
			try{
				var autoRun = prefManager.getBoolPref("extensions.flickrgalleryplus.autorun"),
					mainImage;
				statusBarButton = document.getElementById("flickrGalleryPlus-status-bar");
				preloadImages = prefManager.getBoolPref("extensions.flickrgalleryplus.preloadImages");
				preloadImagesWhenSlideshowIsRun = prefManager.getBoolPref("extensions.flickrgalleryplus.preloadImagesWhenSlideShowIsRun");
				preloadingText = document.getElementById("flickrGalleryPlus-status-bar-preloading-text");
				preloadingProgressBar = document.getElementById("flickrGalleryPlus-preloading-progress-bar");
				stopSlideshow();
				preloadingText.className = "";
				preloadingProgressBar.className = "";
				if (autoRun && /flickr\.com\/photos\/[^\/]+\/sets\//i.test(content.location.href)) {
					mainImage = content.document.getElementById("primary_photo_img");
					if (mainImage) {
						mainImage.style.visibility = "hidden";
					}
					run(true);
				}
				else {
					var state = getState();
					if (state) {
						state.hasRun = false;
					}
					setStatusBar(true);
				}
			}
			catch(e){
				alert(e);
			}
		},
	
		run = function (atLoad) {
			var state = getState(),
				autoRun = prefManager.getBoolPref("extensions.flickrgalleryplus.autorun"),
				mainPhoto = content.document.getElementById("primary_photo_img"),
				head = content.document.getElementsByTagName("head")[0],
				script,
				link;
				
			if ((!atLoad || !autoRun) && state && state.hasRun) {
				state.hasRun = false;
				setStatusBar();
				content.location.reload();
			}
			else if (mainPhoto && head) {
				gBrowser.tabContainer.addEventListener("TabSelect", function () {
					stopSlideshow();
				}, false);
			
				link = content.document.createElement("link").wrappedJSObject;
				link.type = "text/css";
				link.rel = "stylesheet";
				link.href = "chrome://flickrgalleryplus/skin/flickrGalleryPlus.css";
				head.appendChild(link);
			
				script = content.document.createElement("script").wrappedJSObject;
				script.src = "chrome://flickrgalleryplus/content/jquery-1.2.6.min.js";
				script.type = "text/javascript";
				head.appendChild(script);
			
				slideTime = parseInt(prefManager.getIntPref("extensions.flickrgalleryplus.slideshowSlideTime"), 10);
			
				script.onload = applyGallery;
			}
		},
	
		getState = function () {
			var tabIndex = getTabIndex(),
				state = states[tabIndex];
			return state;	
		},
	
		getTabIndex = function () {
			var browsers = gBrowser.browsers,
				tabIndex;
			for (var i=0, il=browsers.length, browser; i<il; i++) {
				if(gBrowser.getBrowserAtIndex(i).contentWindow === content) {
					tabIndex = i;
					break;
				}
			}
			return tabIndex;
		},
	
		clearState = function () {
			var state = getState();
			if (state) {
				state.hasRun = false;
				state.thumbnails = [];
				state.currentImageIndex = 0;
				state.primaryPhoto = null;
				state.imageTextContainer = null;
				state.loadingImage = null;
				state.timer = null;
				state.controlSlideshow = null;
				state.slideTimer = null;
				state.slideIncrementTimer = null;
				state.slideshowRunning = false;
				state.preloadingState = {
					items : 0,
					loadedItems : 0
				};
			
				stopSlideshow();
			}
		},
	
		setStatusBar = function (disable) {
			var state = getState(),
				statusIcon = "chrome://flickrgalleryplus/skin/",
				statusText;
			
			if(state && state.hasRun && !disable) {
				statusIcon += "status-bar.png";
				statusText = "Disable Flickr Gallery Plus!";
				prefManager.setBoolPref("extensions.flickrgalleryplus.autorun", true);
			}
			else {
				statusIcon += "status-bar-disabled.png";
				statusText = "Activate Flickr Gallery Plus!";
				if (typeof disable === "undefined") {
					prefManager.setBoolPref("extensions.flickrgalleryplus.autorun", false);
				}
			}
			statusBarButton.setAttribute("src", statusIcon);
			statusBarButton.setAttribute("tooltiptext", statusText);
		},
	
		applyGallery = function () {
			var state = getState(),
				tabIndex = getTabIndex();
			if(!state) {
				state = states[tabIndex] = {
					hasRun : true,
					thumbnails : [],
					currentImageIndex : 0,
					primaryPhoto : null,
					imageTextContainer : null,
					loadingImage : null,
					timer : null,
					controlSlideshow : null,
					slideTimer : null,
					slideIncrementTimer : null,
					slideshowRunning : false,
					preloadingState : {
						items : 0,
						loadedItems : 0
					}
				};
			}
			clearState();
			state.hasRun = true;
		
			$ = content.wrappedJSObject.jQuery;
			var thumbnailContainer = $("#ViewSet .vsThumbnail");
		
			thumbnailContainer.append('<p id="flickrGalleryPlusImageText"></p>');
			state.imageTextContainer = $("#flickrGalleryPlusImageText");
		
			thumbnailContainer.append('<p><a id="flickrGalleryPlusControlSlideshow">' + startSlideshowText + '</a></p>');
			state.controlSlideshow = $("#flickrGalleryPlusControlSlideshow");
			state.controlSlideshow.click(controlSlideshow);
		
			var body = $("body");
			body.append('<div id="flickrGalleryPlusLoadingImage"></div>');
			state.loadingImage = $("#flickrGalleryPlusLoadingImage");
			state.loadingImage.css("left", ((body.width() / 2) - 8) + "px");
		
			state.primaryPhoto = $("#primary_photo_img");
			state.primaryPhoto.removeAttr("width");
			state.primaryPhoto.removeAttr("height");
			state.primaryPhoto.load(function () {
				this.style.visibility = "visible";
				if (state.slideshowRunning) {
					clearTimeout(state.slideTimer);
					clearTimeout(state.slideIncrementTimer);
					state.primaryPhoto.fadeTo(500, 1);
					state.slideTimer = setTimeout(function () {
						if(state.currentImageIndex < (state.thumbnails.length - 1)) {
							state.primaryPhoto.fadeTo(500, 0.01);
							state.slideIncrementTimer = setTimeout(function () {
								imageNavigation(false);
							}, 500);
						}
						else {
							stopSlideshow();
						}
					}, slideTime);
				}
				clearTimeout(state.timer);
				state.loadingImage.hide();
			});
		
			var thumbnailElms = $("#setThumbs .pc_img");
			for (var i=0, il=thumbnailElms.length, thumbnail, thumbnailImg, thumbnailTitle, lastBy; i<il; i++) {
				thumbnail = $(thumbnailElms[i]);
				thumbnailImg = thumbnail[0];
				thumbnailTitle = thumbnailImg.alt;
				lastBy = thumbnailTitle.lastIndexOf("by");
				state.thumbnails.push({
					img : thumbnail,
					src : thumbnailImg.src.replace(fileNameReplace, "$1"),
					title : thumbnailTitle.substring(0, lastBy),
					href : thumbnail.parent("a").attr("href")
				});
				thumbnail.click(function (index) {
					return function (evt) {
						setImage(index);
						return false;
					};
				}(i));
			}
		
			setImage(0);
		
			$(content.document.wrappedJSObject).keypress(function (evt) {
				var keyCode = evt.keyCode,
					altKey = evt.originalEvent.altKey;
				if (!altKey) {
					if (keyCode === 37) {
						imageNavigation(true);
					}
					else if(keyCode === 39) {
						imageNavigation(false);
					}
					if (keyCode === 13) {
						goToSingleImagePage();
					}
				}
			});
		
			setStatusBar();
		
			if (preloadImages) {
				preloadAllImages();
			}
		},
	
		preloadAllImages = function () {
			var state = getState();
			state.preloadingState.items = state.thumbnails.length;
			state.preloadingState.loadedItems = 0;
			preloadingProgressBar.setAttribute("value", 0);
			preloadingText.className = "loading";
			preloadingProgressBar.className = "loading";
			for (var j=0, jl=state.thumbnails.length, preload; j<jl; j++) {
				preload = content.document.createElement("img").wrappedJSObject;
				preload.setAttribute("src", state.thumbnails[j].src);
				preload.onload = preloadImageCount;
			}
		},
	
		preloadImageCount = function () {
			var state = getState(),
				items = state.preloadingState.items;
			state.preloadingState.loadedItems += 1;
			var loadedItems = state.preloadingState.loadedItems;
			if (items === loadedItems) {
				preloadingText.className = "";
				preloadingProgressBar.className = "";
			}
			else {
				preloadingProgressBar.setAttribute("value", parseInt((loadedItems / items) * 100, 10));
			}
		},
	
		imageNavigation = function (back) {
			var state = getState(),
				imageIndex = state.currentImageIndex;
			if (back && imageIndex > 0) {
				setImage(imageIndex - 1);
			}
			else if (!back && imageIndex < (state.thumbnails.length - 1)) {
				setImage(imageIndex + 1);
			}
		},
	
		setImage = function (index) {
			var state = getState(),
				thumb = state.thumbnails[index],
				primary = state.primaryPhoto;
			primary.attr("src", thumb.src);
			state.timer = window.setTimeout(function () {
				state.loadingImage.show();
			}, 300);
			primary.parent("a").attr("href", thumb.href);
			state.imageTextContainer.html(thumb.title);
			state.thumbnails[state.currentImageIndex].img.removeClass("flickrGalleryPlus-selected");
			state.currentImageIndex = index;
			thumb.img.addClass("flickrGalleryPlus-selected");
		},
	
		goToSingleImagePage = function () {
			var state = getState();
			content.location.href = state.thumbnails[state.currentImageIndex].href;
		},
	
		controlSlideshow = function () {
			var state = getState();
			if (state.slideshowRunning) {
				stopSlideshow();
			}
			else {
				startSlideshow();
			}
		},
	
		startSlideshow = function () {
			var state = getState(),
				startAtFirstImage = prefManager.getBoolPref("extensions.flickrgalleryplus.startSlideshowAtFirstImage");
			state.slideshowRunning = true;
			state.controlSlideshow.text(stopSlideshowText);
			state.controlSlideshow.addClass("stop-slideshow");
			setImage((startAtFirstImage)? 0 : state.currentImageIndex);
			if (!preloadImages && preloadImagesWhenSlideshowIsRun) {
				preloadAllImages();
			}
			return false;
		},
	
		stopSlideshow = function () {
			var state = getState();
			if (state) {
				clearTimeout(state.slideTimer);
				clearTimeout(state.slideIncrementTimer);
				state.slideshowRunning = false;
				if (state.controlSlideshow) {
					state.controlSlideshow.text(startSlideshowText);
					state.controlSlideshow.removeClass("stop-slideshow");
				}
				if (state.primaryPhoto) {
					state.primaryPhoto.fadeIn(500);
				}
			}
			return false;
		},
	
		incrementAndFade = function () {
			var state = getState();
			if (state.slideTimer) {
				setImage(state.currentImageIndex + 1);
			}	
		};
	
	return {
		init : init,
		run : run
	};
}();

flickrGalleryPlusWrapper = {
	onStatusbarButtonCommand : function (evt) {
		flickrGalleryPlus.run();
	}
};

window.addEventListener("load", function () {
	gBrowser.addEventListener("DOMContentLoaded", function () {
		flickrGalleryPlus.init();
	}, false);
}, false);