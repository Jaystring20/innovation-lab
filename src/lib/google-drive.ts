/**
 * Google Drive MCP Integration
 * Handles file uploads to Google Drive using the MCP
 */

export interface DriveUploadResult {
  fileId: string;
  fileUrl: string;
  error?: string;
}

/**
 * Upload a file to Google Drive using MCP
 * This function calls the MCP endpoint to upload files
 */
export async function uploadFileToDrive(
  file: File,
  folderPath: string
): Promise<DriveUploadResult> {
  try {
    console.log(`Uploading ${file.name} to Google Drive (${folderPath})`);

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);

    // Call MCP endpoint to upload file
    // The Claude MCP system handles this request and returns the file ID and URL
    const response = await fetch('/.mcp/google-drive/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();

    return {
      fileId: result.fileId,
      fileUrl: result.fileUrl || `https://drive.google.com/file/d/${result.fileId}/view`,
    };
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
}

/**
 * Get or create a folder structure for a team submission
 * Returns the folder ID for: Lab Submissions / Team Name / Stage Name
 */
export async function getOrCreateSubmissionFolder(
  teamName: string,
  stageName: string
): Promise<string> {
  try {
    console.log(`Getting folder for ${teamName} / ${stageName}`);

    const response = await fetch('/.mcp/google-drive/get-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderPath: `Lab Submissions/${teamName}/${stageName}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get folder: ${response.statusText}`);
    }

    const result = await response.json();
    return result.folderId;
  } catch (error) {
    console.error('Error getting submission folder:', error);
    throw error;
  }
}
