// scripts/generate-assignment-scorm.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const generateAssignmentScorm = async (assignmentId, assignmentData) => {
  const zip = new JSZip();

  // Add assignment data to the package
  zip.file('assignment.json', JSON.stringify(assignmentData));

  // Add necessary HTML, JS, and CSS files
  // You'll need to adjust these paths based on your project structure
  const htmlContent = await fetch('/index.html').then(res => res.text());
  const modifiedHtmlContent = htmlContent.replace(
    '</head>',
    `<script>
      window.ASSIGNMENT_ID = "${assignmentId}";
      window.ASSIGNMENT_DATA = ${JSON.stringify(assignmentData)};
    </script>
    </head>`
  );
  zip.file('index.html', modifiedHtmlContent);

  // Add other necessary files (CSS, JS, etc.)
  const cssContent = await fetch('/styles.css').then(res => res.text());
  zip.file('styles.css', cssContent);

  const jsContent = await fetch('/main.js').then(res => res.text());
  zip.file('main.js', jsContent);

  // Add SCORM specific files
  const scormWrapperContent = await fetch('/scormApiWrapper.js').then(res => res.text());
  zip.file('scormApiWrapper.js', scormWrapperContent);

  // Generate the zip file
  const content = await zip.generateAsync({ type: 'blob' });

  // Use FileSaver to save the zip file
  saveAs(content, `scorm-package-${assignmentId}.zip`);

  return URL.createObjectURL(content);
};

export default generateAssignmentScorm;