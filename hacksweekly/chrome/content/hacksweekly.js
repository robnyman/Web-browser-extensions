/*
    Developed by Robert Nyman, http://www.robertnyman.com
*/
var hacksweekly = function () {
    var statusBarButton;

    init = function () {
        var head = content.document.getElementsByTagName("head")[0],
            script = content.document.getElementById("hacksweekly");

        if (!script) {
            script = content.document.createElement("script").wrappedJSObject;
            script.id = "hacksweekly";
            script.src = "chrome://hacksweekly/content/hacksweekly-in-page.js";
            script.type = "text/javascript";
            head.appendChild(script);
            // script.onload = addLinkToEtherpad;
        }
    },

    addLink = function () {
        gBrowser.selectedTab = gBrowser.addTab("https://etherpad.mozilla.org/hacksweekly?title=" + encodeURI(content.document.title) + "&url=" + encodeURI(content.location.href));
    };

    return {
        init : init,
        addLink : addLink
    };
}();

hacksweeklyWrapper = {
    onStatusbarButtonCommand : function (evt) {
        hacksweekly.addLink();
    }
};

window.addEventListener("load", function () {
    gBrowser.addEventListener("DOMContentLoaded", function () {
        if (content.location.href.indexOf("etherpad.mozilla.org/hacksweekly?title") != -1) {
            hacksweekly.init();
        }
    }, false);
}, false);
