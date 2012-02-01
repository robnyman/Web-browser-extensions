/*
	Developed by Robert Nyman, http://www.robertnyman.com
*/

function addContentToEtherpad () {
    var etherpadFrame = window.frames[1].frames[0];
    if (etherpadFrame && etherpadFrame.document.body.innerHTML.indexOf("Mozilla Hacks Weekly") !== -1) {
        var params = location.search.substr(1).split("&"),
        title = params[0].replace(/\w+=/, ""),
        url = params[1].replace(/\w+=/, "");

        var content = etherpadFrame.document.body.innerHTML + "<p>" + decodeURI(title) + ": " + url + "</p><p></p>"; 
        etherpadFrame.document.body.innerHTML = content;
    }
    else {
        setTimeout(addContentToEtherpad, 1000);
    }
};
addContentToEtherpad();

