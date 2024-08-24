var API = null;

(function() {
    var findAPI = function(win) {
        var findAPITries = 0;
        while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAPITries++;
            if (findAPITries > 500) {
                console.error("Error finding API -- too deeply nested.");
                return null;
            }
            win = win.parent;
        }
        return win.API;
    };

    var getAPI = function() {
        if (API == null) {
            API = findAPI(window);
            if ((API == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
                API = findAPI(window.opener);
            }
            if (API == null) {
                console.warn("Unable to find an API adapter");
            }
        }
        return API;
    };

    var ScormAPI = {
        initialize: function() {
            API = getAPI();
            if (API) {
                return API.LMSInitialize("");
            }
            return false;
        },
        terminate: function() {
            if (API) {
                return API.LMSFinish("");
            }
            return false;
        },
        getValue: function(element) {
            if (API) {
                return API.LMSGetValue(element);
            }
            return "";
        },
        setValue: function(element, value) {
            if (API) {
                return API.LMSSetValue(element, value);
            }
            return false;
        },
        commit: function() {
            if (API) {
                return API.LMSCommit("");
            }
            return false;
        },
        getLastError: function() {
            if (API) {
                return API.LMSGetLastError();
            }
            return 0;
        },
        getErrorString: function(errorCode) {
            if (API) {
                return API.LMSGetErrorString(errorCode);
            }
            return "";
        },
        getDiagnostic: function(errorCode) {
            if (API) {
                return API.LMSGetDiagnostic(errorCode);
            }
            return "";
        }
    };

    window.ScormAPI = ScormAPI;
})();