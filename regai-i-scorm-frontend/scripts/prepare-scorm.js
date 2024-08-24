const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const publicDir = path.join(rootDir, 'public');
const scormDir = path.join(rootDir, 'scorm-package');

// Create the scorm-package directory if it doesn't exist
fs.ensureDirSync(scormDir);

// Clean the scorm-package directory
fs.emptyDirSync(scormDir);

// Copy build files to SCORM package directory
fs.copySync(buildDir, scormDir);

// Copy SCORM-specific files from public/scorm to the root of the SCORM package
const publicScormDir = path.join(publicDir, 'scorm');
fs.copySync(publicScormDir, scormDir);

// Ensure scormApiWrapper.js is in the correct location
const scormApiWrapperSrc = path.join(publicScormDir, 'scormApiWrapper.js');
const scormApiWrapperDest = path.join(scormDir, 'scormApiWrapper.js');
fs.copySync(scormApiWrapperSrc, scormApiWrapperDest);

// Update index.html to use relative paths and inject ASSIGNMENT_ID
const indexHtmlPath = path.join(scormDir, 'index.html');
let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
indexHtmlContent = indexHtmlContent.replace(/src="\//g, 'src="');
indexHtmlContent = indexHtmlContent.replace(/href="\//g, 'href="');

// Inject ASSIGNMENT_ID
const assignmentId = process.env.REACT_APP_ASSIGNMENT_ID;
if (!assignmentId) {
  console.error('REACT_APP_ASSIGNMENT_ID is not set. Please set it before running this script.');
  process.exit(1);
}

const scriptToInject = `
  <script>
    window.REACT_APP_ASSIGNMENT_ID = "${assignmentId}";
  </script>
`;

indexHtmlContent = indexHtmlContent.replace('</head>', `${scriptToInject}</head>`);

fs.writeFileSync(indexHtmlPath, indexHtmlContent);

console.log('Contents of scorm-package directory:');
fs.readdirSync(scormDir).forEach(file => {
  console.log(file);
});

console.log('SCORM package prepared successfully in:', scormDir);
console.log('ASSIGNMENT_ID:', assignmentId);