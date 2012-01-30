/*global jQuery, $ */
/*
	jQuery.PictureSlides is developed by Robert Nyman, http://www.robertnyman.com
	For more information, please see http://www.robertnyman.com/picture-slides
	Released under a MIT License
*/
jQuery.PictureSlides = function () {
	var useMSFilter = false,
		slideshows = [],
		set = function (settings) {
			slideshows.push(settings);
		},
		
		init = function () {
			var counter = 0;
			$(".picture-slides-container").each(function () {
				var elm = $(this),
					
					// Element references
					settings = slideshows[counter++],
					mainImage = elm.find("." + settings.mainImageClass),
					mainImageFailedToLoad = elm.find("." + settings.mainImageFailedToLoadClass),
					imageLink = elm.find("." + settings.imageLinkClass),
					fadeContainer = elm.find("." + settings.fadeContainerClass),
					imageTextContainer = elm.find("." + settings.imageTextContainerClass),
					previousLink = elm.find("." + settings.previousLinkClass),
					nextLink = elm.find("." + settings.nextLinkClass),
					imageCounter = elm.find("." + settings.imageCounterClass),
					startSlideShowLink = elm.find("." + settings.startSlideShowClass),
					stopSlideShowLink = elm.find("." + settings.stopSlideShowClass),
					thumbnailContainer = elm.find("." + settings.thumbnailContainerClass),
					thumbnailEvent = settings.thumbnailActivationEvent,
					thumbnailLinks,
					dimBackgroundOverlay = $("." + settings.dimBackgroundOverlayClass),
					
					// General image settings
					usePreloading = settings.usePreloading,
					useAltAsTooltip = settings.useAltAsTooltip,
					useTextAsTooltip = settings.useTextAsTooltip,
					images = settings.images,
					startIndex = (settings.startIndex > 0)? (settings.startIndex - 1) : settings.startIndex,
					imageIndex = startIndex,
					currentImageIndex = imageIndex,
					startSlideShowFromBeginning = settings.startSlideShowFromBeginning,
					dimBackgroundAtLoad = settings.dimBackgroundAtLoad,
					
					// General fade settings
					useFadingIn = settings.useFadingIn,
					useFadingOut = settings.useFadingOut,
					useFadeWhenNotSlideshow = settings.useFadeWhenNotSlideshow,
					useFadeForSlideshow = settings.useFadeForSlideshow,
					useDimBackgroundForSlideshow = settings.useDimBackgroundForSlideshow,
					loopSlideshow = settings.loopSlideshow,
					fadeTime = settings.fadeTime,
					timeForSlideInSlideshow = settings.timeForSlideInSlideshow,
					startSlideshowAtLoad = settings.startSlideshowAtLoad,
					slideshowPlaying = false,
					timer,
					
					// Sets main image
					setImage = function () {
						// Set main image values
						var imageItem = images[imageIndex];
						mainImage.attr({
							src : imageItem.image,
							alt : imageItem.alt
						});
						
						// If the alt text should be used as the tooltip
						if (useAltAsTooltip) {
							mainImage.attr("title", imageItem.alt);
						}
						
						// If the image text should be used as the tooltip
						if (useTextAsTooltip) {
							mainImage.attr("title", imageItem.text);
						}
						
						// Set image text
						if (imageTextContainer.length > 0) {
							imageTextContainer.text(imageItem.text);
						}
						
						// Set image link
						if (imageLink.length > 0) {
							var url = imageItem.url;
							if (typeof url !== "undefined" && url.length > 0) {
								imageLink.attr("href", imageItem.url);
							}
							else {
								imageLink.removeAttr("href");
							}	
						}
						
						// Set image counter values
						if (imageCounter.length > 0) {
							imageCounter.text((imageIndex + 1) + "/" + (images.length));
						}
						
						if (!loopSlideshow) {
							// Enabling/disabling previous link
							if (imageIndex === 0) {
								previousLink.addClass("picture-slides-disabled");
							}
							else {
								previousLink.removeClass("picture-slides-disabled");
							}
						
							// Enabling/disabling next link
							if (imageIndex === (images.length - 1)) {
								nextLink.addClass("picture-slides-disabled");
							}
							else {
								nextLink.removeClass("picture-slides-disabled");
							}
						}
						
						// Keeping a reference to the current image index
						currentImageIndex = imageIndex;
						
						// Adding/removing classes from thumbnail
						if (thumbnailContainer[0]) {							
							thumbnailLinks.removeClass("picture-slides-selected-thumbnail");
							$(thumbnailLinks[imageIndex]).addClass("picture-slides-selected-thumbnail");
						}
					},
					
					// Navigate to previous image
					prev = function () {
						if (imageIndex > 0 || loopSlideshow) {
							if (imageIndex === 0) {
								imageIndex = (images.length -1);
							}
							else {
								imageIndex = --imageIndex;
							}
							if (useFadingOut && (useFadeWhenNotSlideshow || slideshowPlaying) && imageIndex !== currentImageIndex) {
								fadeContainer.stop();
								fadeContainer.fadeTo(fadeTime, 0, function () {
									setImage(imageIndex);									
								});	
							}
							else {
								if (useFadingIn && imageIndex !== currentImageIndex) {
									fadeContainer.css("opacity", "0");
								}
								setImage(imageIndex);
							}
						}
					},
					
					// Navigate to next image
					next = function (specifiedIndex) {
						if (imageIndex < (images.length -1) || typeof specifiedIndex !== "undefined" || loopSlideshow) {
							if (typeof specifiedIndex !== "undefined") {
								imageIndex = specifiedIndex;
							}
							else if (imageIndex === (images.length-1)) {
								imageIndex = 0;
							}
							else {
								imageIndex = ++imageIndex;
							}
							if (useFadingOut && (useFadeWhenNotSlideshow || slideshowPlaying) && imageIndex !== currentImageIndex) {
								fadeContainer.stop();
								fadeContainer.fadeTo(fadeTime, 0, function () {
									setImage(imageIndex);									
								});
							}
							else {
								if (useFadingIn && imageIndex !== currentImageIndex) {
									fadeContainer.css("opacity", "0");
								}	
								setImage(imageIndex);
							}
						}
						else {
							stopSlideshow();
						}
					},
					
					// Start slideshow
					startSlideshow = function () {
						slideshowPlaying = true;
						startSlideShowLink.hide();
						stopSlideShowLink.show();
						if (startSlideShowFromBeginning) {
							next(0);
						}
						clearTimeout(timer);
						timer = setTimeout(function () {
							next();
						}, timeForSlideInSlideshow);
						if (useDimBackgroundForSlideshow && dimBackgroundOverlay[0]) {
							elm.addClass("picture-slides-dimmed-background");
							dimBackgroundOverlay.show();
						}
					},
					
					// Stop slideshow
					stopSlideshow = function () {
						clearTimeout(timer);
						slideshowPlaying = false;
						startSlideShowLink.show();
						stopSlideShowLink.hide();
						if (useDimBackgroundForSlideshow && dimBackgroundOverlay[0]) {
							elm.removeClass("picture-slides-dimmed-background");
							dimBackgroundOverlay.hide();
						}
					};

				// Fade in/show image when it has loaded
				mainImage[0].onload = function () {
					if (useFadingIn && (useFadeWhenNotSlideshow || slideshowPlaying)) {
						fadeContainer.fadeTo(fadeTime, 1, function () {
							if (slideshowPlaying) {
								clearTimeout(timer);
								timer = setTimeout(function () {
									next();
								}, timeForSlideInSlideshow);
							}
						});
					}
					else {
						fadeContainer.css("opacity", "1");
						fadeContainer.show();
						if (slideshowPlaying) {
							clearTimeout(timer);
							timer = setTimeout(function () {
								next();
							}, timeForSlideInSlideshow);
						}
					}
					mainImageFailedToLoad.hide();
				};
				
				mainImage[0].onerror = function () {
					fadeContainer.css("opacity", "1");
					mainImageFailedToLoad.show();
					if (slideshowPlaying) {
						clearTimeout(timer);
						timer = setTimeout(function () {
							next();
						}, timeForSlideInSlideshow);
					}
				};
										
				// Previous image click
				previousLink.click(function (evt) {
					prev();
					return false;
				});
				
				// Next image click
				nextLink.click(function (evt) {
					next();
					return false;
				});
				
				// Start slideshow click
				startSlideShowLink.click(function () {
					startSlideshow();
					return false;
				});
				
				// Stop slideshow click
				stopSlideShowLink.click(function () {
					stopSlideshow();
					return false;
				});
				
				// Shows navigation links and image counter
				previousLink.show();
				nextLink.show();
				startSlideShowLink.show();
				imageCounter.show();
				
				// Stop slideshow click
				stopSlideShowLink.click(function () {
					stopSlideshow();
				});
				
				// Thumbnail references
				if (thumbnailContainer[0]) {
					thumbnailLinks = $(thumbnailContainer).find("a");
					$(thumbnailLinks[imageIndex]).addClass("picture-slides-selected-thumbnail");
					for (var i=0, il=thumbnailLinks.length, thumbnailLink; i<il; i++) {
						thumbnailLink = $(thumbnailLinks[i]);
						thumbnailLink.data("linkIndex", i);
						thumbnailLink.bind(thumbnailEvent, function (evt) {
							next($(this).data("linkIndex"));
							this.blur();
							return false;
						});
					}
				}
				
				// Sets initial image
				setImage();
				
				// If play slideshow at load
				if (startSlideshowAtLoad) {
					startSlideshow();
				}
				
				if (dimBackgroundAtLoad) {
					elm.addClass("picture-slides-dimmed-background");
					dimBackgroundOverlay.show();
				}
				
				if (usePreloading) {
					var imagePreLoadingContainer = $("<div />").appendTo(document.body).css("display", "none");
					for (var j=0, jl=images.length, image; j<jl; j++) {
						$('<img src="' + images[j].image + '" alt="" />').appendTo(imagePreLoadingContainer);
					}
				}
			});
		};
	return {
		set : set,
		init : init
	};
}();
$(document).ready(function () {
	jQuery.PictureSlides.init();
});