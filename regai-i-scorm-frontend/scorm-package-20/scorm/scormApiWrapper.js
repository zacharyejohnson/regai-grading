// Add this line at the end of the file
import apiEndpoints from '../../src/apiService';

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
                console.error("Unable to find an API adapter");
            }
        }
        return API;
    };

    var ScormAPI = {
        initialize: async function() {
            API = getAPI();
            if (API) {
                const result = API.LMSInitialize("");
                if (result === "true") {
                    try {
                        await apiEndpoints.scormAssignment.getScormData();
                    } catch (error) {
                        console.error("Error initializing SCORM data:", error);
                    }
                }
                return result === "true";
            }
            return false;
        },
        terminate: async function() {
            if (API) {
                try {
                    await apiEndpoints.scormAssignment.updateScormData({
                        cmi_core_lesson_status: API.LMSGetValue("cmi.core.lesson_status"),
                        cmi_core_score_raw: API.LMSGetValue("cmi.core.score.raw"),
                        cmi_core_session_time: API.LMSGetValue("cmi.core.session_time"),
                    });
                } catch (error) {
                    console.error("Error updating SCORM data:", error);
                }
                return API.LMSFinish("") === "true";
            }
            return false;
        },
        getValue: function(element) {
            if (API) {
                return API.LMSGetValue(element);
            }
            return "";
        },
        setValue: async function(element, value) {
            if (API) {
                const result = API.LMSSetValue(element, value);
                if (result === "true") {
                    try {
                        await apiEndpoints.scormAssignment.updateScormData({
                            [element]: value
                        });
                    } catch (error) {
                        console.error("Error updating SCORM data:", error);
                    }
                }
                return result === "true";
            }
            return false;
        },
        commit: async function() {
            if (API) {
                const result = API.LMSCommit("");
                if (result === "true") {
                    try {
                        await apiEndpoints.scormAssignment.updateScormData({
                            cmi_core_lesson_status: API.LMSGetValue("cmi.core.lesson_status"),
                            cmi_core_score_raw: API.LMSGetValue("cmi.core.score.raw"),
                            cmi_core_session_time: API.LMSGetValue("cmi.core.session_time"),
                        });
                    } catch (error) {
                        console.error("Error updating SCORM data:", error);
                    }
                }
                return result === "true";
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