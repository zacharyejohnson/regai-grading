import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const generateAssignmentScorm = async (assignmentId, assignmentData) => {
  const zip = new JSZip();

  // Add assignment data to the package
  zip.file('assignment.json', JSON.stringify(assignmentData));

  const regaiIScormFrontendPath = '../regai-i-scorm-frontend/build';

  const addFileToZip = async (filePath, zipPath) => {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let content = await response.text(); // Changed to text() for all files

      if (zipPath === 'index.html') {
        content = content.replace(
          '</head>',
          `<script>
            window.ASSIGNMENT_ID = "${assignmentId}";
            window.ASSIGNMENT_DATA = ${JSON.stringify(assignmentData)};
          </script>
          </head>`
        );
      } else if (zipPath === 'imsmanifest.xml') {
        // Log the content of imsmanifest.xml for debugging
        console.log('imsmanifest.xml content:', content);

        // Ensure the XML is valid
        if (!content.trim().startsWith('<?xml')) {
          throw new Error('Invalid imsmanifest.xml file');
        }
      }

      zip.file(zipPath, content);
    } catch (error) {
      console.error(`Failed to fetch ${filePath}:`, error);
      throw error;
    }
  };

  const filesToFetch = [
    'index.html',
    'asset-manifest.json',
    'favicon.ico',
    'logo192.png',
    'logo512.png',
    'manifest.json',
    'robots.txt',
    'scormApiWrapper.js',
    'adlcp_rootv1p2.xsd',
    'imscp_rootv1p1p2.xsd',
    'imsmanifest.xml',
    'imsmd_rootv1p2p1.xsd'
  ];

  for (const file of filesToFetch) {
    await addFileToZip(`${regaiIScormFrontendPath}/${file}`, file);
  }

  try {
    const assetManifestResponse = await fetch(`${regaiIScormFrontendPath}/asset-manifest.json`);
    if (!assetManifestResponse.ok) {
      throw new Error(`HTTP error! status: ${assetManifestResponse.status}`);
    }
    const assetManifest = await assetManifestResponse.json();

    for (const [key, value] of Object.entries(assetManifest.files)) {
      if (key.endsWith('.js') || key.endsWith('.css')) {
        await addFileToZip(`${regaiIScormFrontendPath}${value}`, value.slice(1));
      }
    }
  } catch (error) {
    console.error('Failed to fetch or parse asset-manifest.json:', error);
  }

  const assetFiles = ['logo-black.png', 'logo-color.png', 'logo-no-background.png', 'logo-white.png'];
  for (const file of assetFiles) {
    await addFileToZip(`${regaiIScormFrontendPath}/assets/${file}`, `assets/${file}`);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `scorm-package-${assignmentId}.zip`);

  return URL.createObjectURL(content);
};

export default generateAssignmentScorm;