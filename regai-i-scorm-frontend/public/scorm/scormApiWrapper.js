// Add this line at the end of the file

var API = null;

(function() {
    console.log('Initializing SCORM API Wrapper');
    
    // Ensure we have access to the API base URL
    if (!window.API_BASE_URL) {
        console.warn('API_BASE_URL not found, defaulting to localhost');
        window.API_BASE_URL = 'http://localhost:8000/api';
    }

    const apiEndpoints = {
        initialize: (assignmentId, submissionId) => 
            fetch(`${window.API_BASE_URL}/scorm-api/LMSInitialize/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignment_id: assignmentId, submission_id: submissionId })
            }).then(res => res.json()),
        
        getValue: (assignmentId, submissionId, element) =>
            fetch(`${window.API_BASE_URL}/scorm-api/LMSGetValue/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignment_id: assignmentId, submission_id: submissionId, element })
            }).then(res => res.json()),

        setValue: (assignmentId, submissionId, element, value) =>
            fetch(`${window.API_BASE_URL}/scorm-api/LMSSetValue/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignment_id: assignmentId, submission_id: submissionId, element, value })
            }).then(res => res.json()),

        commit: (assignmentId, submissionId) =>
            fetch(`${window.API_BASE_URL}/scorm-api/LMSCommit/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignment_id: assignmentId, submission_id: submissionId })
            }).then(res => res.json()),
    };

    var findAPI = function(win) {
        console.log('Finding API in window:', win);
        var findAPITries = 0;
        while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAPITries++;
            if (findAPITries > 500) {
                console.error("Error finding API -- too deeply nested.");
                return null;
            }
            win = win.parent;
        }
        console.log('API found:', win.API ? 'yes' : 'no');
        return win.API;
    };

    var getAPI = function() {
        console.log('Getting API...');
        if (API == null) {
            API = findAPI(window);
            if ((API == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
                console.log('Trying to find API in opener window');
                API = findAPI(window.opener);
            }
            if (API == null) {
                console.error("Unable to find an API adapter");
            }
        }
        console.log('API status:', API ? 'found' : 'not found');
        return API;
    };

    window.ScormAPI = {
        initialize: function() {
            console.log('Initializing SCORM...');
            getAPI();
            if (API) {
                console.log('Calling LMSInitialize');
                const result = API.LMSInitialize("");
                console.log('LMSInitialize result:', result);
                return result === "true";
            }
            return false;
        },
        getValue: function(element) {
            console.log('Getting value for:', element);
            if (API) {
                const value = API.LMSGetValue(element);
                console.log('Value retrieved:', value);
                return value;
            }
            return "";
        },
        setValue: function(element, value) {
            console.log('Setting value:', element, '=', value);
            if (API) {
                const result = API.LMSSetValue(element, value);
                console.log('SetValue result:', result);
                return result === "true";
            }
            return false;
        },
        commit: function() {
            console.log('Committing data...');
            if (API) {
                const result = API.LMSCommit("");
                console.log('Commit result:', result);
                return result === "true";
            }
            return false;
        },
        terminate: function() {
            console.log('Terminating SCORM session...');
            if (API) {
                const result = API.LMSFinish("");
                console.log('Terminate result:', result);
                return result === "true";
            }
            return false;
        }
    };

    console.log('SCORM API Wrapper initialization complete');
})();
