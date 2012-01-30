var flickrGalleryPlus = function () {
	var fileNameReplace = /\_s/i,
		startSlideshowText = "Start slideshow",
		stopSlideshowText = "Stop slideshow",
		autorun,
		startAtFirstImage,
		slideTime,
		preloadImages,
		currentImageIndex = 0,
		thumbnails = [],
		imageTextContainer,
		controlSlideshowLink,
		loadingImage,
		primaryPhoto,
		slideshowRunning,
		timer,
		slideTimer,
		slideIncrementTimer;
		
	init = function () {
		chrome.extension.sendRequest({
				item: "autorun"
			}, function (response) {
				
				autorun = (typeof response.autorun !== "undefined")? response.autorun : "true";
				startAtFirstImage = (typeof response.startAtFirstImage !== "undefined")? response.startAtFirstImage : "true";
				slideTime = (typeof response.slideTime !== "undefined")? response.slideTime : 4000;
				preloadImages = (typeof response.preloadImages !== "undefined")? response.preloadImages : "true";
				
				if (autorun === "true") {
					var mainImage = document.getElementById("primary_photo_img");
					applyGallery();
				}
			});
	};
	
	applyGallery = function () {
		var thumbnailContainer = $("#ViewSet .vsThumbnail");
		thumbnailContainer.append('<p id="flickrGalleryPlusImageText"></p>');
		imageTextContainer = $("#flickrGalleryPlusImageText");
		
		thumbnailContainer.append('<p><a id="flickrGalleryPlusControlSlideshow">' + startSlideshowText + '</a></p>');
		controlSlideshowLink = $("#flickrGalleryPlusControlSlideshow");
		controlSlideshowLink.click(controlSlideshow);
		
		var body = $("body");
		body.append('<div id="flickrGalleryPlusLoadingImage"></div>');
		loadingImage = $("#flickrGalleryPlusLoadingImage");
		loadingImage.hide();
		loadingImage.css("left", ((body.width() / 2) - 8) + "px");
		
		primaryPhoto = $("#primary_photo_img");
		if (primaryPhoto[0]) {
			loadingImage.show();
		}
		primaryPhoto.removeAttr("width");
		primaryPhoto.removeAttr("height");
		primaryPhoto.load(function () {
			this.style.visibility = "visible";
			if (slideshowRunning) {
				clearTimeout(slideTimer);
				clearTimeout(slideIncrementTimer);
				primaryPhoto.fadeTo(500, 1);
				slideTimer = setTimeout(function () {
					if(currentImageIndex < (thumbnails.length - 1)) {
						primaryPhoto.fadeTo(500, 0.01);
						slideIncrementTimer = setTimeout(function () {
							imageNavigation(false);
						}, 500);
					}
					else {
						stopSlideshow();
					}
				}, slideTime);
			}
			clearTimeout(timer);
			loadingImage.hide();
		});
		
		var thumbnailElms = $("#setThumbs .pc_img");
		for (var i=0, il=thumbnailElms.length, thumbnail, thumbnailImg, thumbnailTitle, lastBy; i<il; i++) {
			thumbnail = $(thumbnailElms[i]);
			thumbnailImg = thumbnail[0];
			thumbnailTitle = thumbnailImg.alt;
			lastBy = thumbnailTitle.lastIndexOf("by");
			thumbnails.push({
				img : thumbnail,
				src : thumbnailImg.src.replace(fileNameReplace, ""),
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
		
		if (/webkit/i.test(navigator.userAgent)) {
			$(document).keydown(handleKeyPress);
		}
		else {
			$(document).keypress(handleKeyPress);
		}
		
		if (preloadImages === "true") {
			for (var j=0, jl=thumbnails.length, preload; j<jl; j++) {
				preload = document.createElement("img");
				preload.setAttribute("src", thumbnails[j].src);
			}
		}
	};
	
	handleKeyPress = function (evt) {
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
	};
	
	imageNavigation = function (back) {
		if (back && currentImageIndex > 0) {
			setImage(currentImageIndex - 1);
		}
		else if (!back && currentImageIndex < (thumbnails.length - 1)) {
			setImage(currentImageIndex + 1);
		}
	};
	
	setImage = function (index) {
		var thumb = thumbnails[index];
		primaryPhoto[0].src = thumb.src;
		if (index !== currentImageIndex) {
			timer = window.setTimeout(function () {
				loadingImage.show();
			}, 200);
		}
		else if (slideshowRunning) {
			slideTimer = setTimeout(function () {
				if(currentImageIndex < (thumbnails.length - 1)) {
					primaryPhoto.fadeTo(500, 0.01);
					slideIncrementTimer = setTimeout(function () {
						imageNavigation(false);
					}, 500);
				}
				else {
					stopSlideshow();
				}
			}, slideTime);
		}
		primaryPhoto.parent("a").attr("href", thumb.href);
		primaryPhoto[0].title = thumb.title;
		imageTextContainer.html(thumb.title);
		thumbnails[currentImageIndex].img.removeClass("flickrGalleryPlus-selected");
		currentImageIndex = index;
		thumb.img.addClass("flickrGalleryPlus-selected");
	};
	
	goToSingleImagePage = function () {
		location.href = thumbnails[currentImageIndex].href;
	};
	
	controlSlideshow = function () {
		if (slideshowRunning) {
			stopSlideshow();
		}
		else {
			startSlideshow();
		}
	};
	
	startSlideshow = function () {
		slideshowRunning = true;
		controlSlideshowLink.text(stopSlideshowText);
		controlSlideshowLink.addClass("stop-slideshow");
		setImage((startAtFirstImage === "true")? 0 : currentImageIndex);
		return false;
	};
	
	stopSlideshow = function () {
		clearTimeout(slideTimer);
		clearTimeout(slideIncrementTimer);
		slideshowRunning = false;
		if (controlSlideshowLink) {
			controlSlideshowLink.text(startSlideshowText);
			controlSlideshowLink.removeClass("stop-slideshow");
		}
		if (primaryPhoto) {
			primaryPhoto.fadeIn(500);
		}
		return false;
	};
	
	incrementAndFade = function () {
		if (slideTimer) {
			setImage(currentImageIndex + 1);
		}	
	};
	
	return {
		init : init
	};
}();
flickrGalleryPlus.init();