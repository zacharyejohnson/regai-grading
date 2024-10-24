import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const generateAssignmentScorm = async (assignmentId, assignmentData) => {
  console.log('Starting SCORM package generation for assignment:', assignmentId);
  const zip = new JSZip();

  // Add assignment data and API configuration to the package
  const configData = {
    assignmentId,
    assignmentData,
    apiConfig: {
      baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
    }
  };
  
  console.log('Adding configuration data:', configData);
  zip.file('config.js', `
    window.SCORM_CONFIG = ${JSON.stringify(configData, null, 2)};
    console.log('SCORM configuration loaded:', window.SCORM_CONFIG);
  `);

  const addFileToZip = async (filePath, zipPath) => {
    try {
      console.log(`Fetching file: ${filePath}`);
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.error(`Failed to fetch ${filePath}, status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let content = await response.text();
      
      // Modify content based on file type
      if (zipPath === 'index.html') {
        console.log('Modifying index.html content');
        content = content
          .replace('</head>',
            `
            <script src="config.js"></script>
            <script>
              console.log('SCORM package initializing...');
              window.API_BASE_URL = 'http://localhost:8000/api';
              window.ASSIGNMENT_ID = "${assignmentId}";
              window.ASSIGNMENT_DATA = ${JSON.stringify(assignmentData)};
            </script>
            </head>`
          )
          // Ensure paths are relative
          .replace(/src="\//g, 'src="')
          .replace(/href="\//g, 'href="');
      }

      // Modify scormApiWrapper.js to include API base URL
      if (zipPath === 'scormApiWrapper.js') {
        console.log('Modifying scormApiWrapper.js content');
        content = `
          console.log('Loading SCORM API Wrapper...');
          window.API_BASE_URL = 'http://localhost:8000/api';
          ${content}
        `;
      }

      console.log(`Adding to zip: ${zipPath}`);
      zip.file(zipPath, content);
    } catch (error) {
      console.error(`Failed to process ${filePath}:`, error);
      throw error;
    }
  };

  // Add SCORM-specific files
  const scormFiles = [
    '/scorm/imsmanifest.xml',
    '/scorm/adlcp_rootv1p2.xsd',
    '/scorm/imscp_rootv1p1p2.xsd',
    '/scorm/imsmd_rootv1p2p1.xsd',
    '/scorm/scormApiWrapper.js'
  ];

  console.log('Processing SCORM files...');
  for (const file of scormFiles) {
    await addFileToZip(file, file.replace('/scorm/', ''));
  }

  // Add build files
  try {
    console.log('Processing build files...');
    const assetManifestResponse = await fetch('/asset-manifest.json');
    if (!assetManifestResponse.ok) {
      throw new Error(`HTTP error! status: ${assetManifestResponse.status}`);
    }
    const assetManifest = await assetManifestResponse.json();
    console.log('Asset manifest loaded:', assetManifest);

    // Add main files
    const mainFiles = [
      '/index.html',
      '/favicon.ico',
      '/logo192.png',
      '/logo512.png',
      '/manifest.json',
      '/robots.txt'
    ];

    for (const file of mainFiles) {
      await addFileToZip(file, file.slice(1));
    }

    // Add all assets from the manifest
    for (const [key, value] of Object.entries(assetManifest.files)) {
      if (key.endsWith('.js') || key.endsWith('.css')) {
        await addFileToZip(value, value.slice(1));
      }
    }
  } catch (error) {
    console.error('Failed to process build files:', error);
    throw error;
  }

  console.log('Generating final ZIP file...');
  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `scorm-package-${assignmentId}.zip`;
  console.log(`Saving as ${filename}`);
  saveAs(content, filename);

  return URL.createObjectURL(content);
};

export default generateAssignmentScorm;
