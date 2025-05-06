const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File as buffer
 * @param {string} publicId - Public ID for the resource
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Download URL
 */
const uploadToCloudinary = async (fileBuffer, publicId, contentType) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            public_id: publicId,
            content_type: contentType,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(fileBuffer);
    });

    return result.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

/**
 * Create signed URL for client-side uploads
 * @param {string} publicId - Public ID for the resource
 * @returns {Promise<string>} - Signed URL for upload
 */
const createUploadSignedUrl = async (publicId) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
      },
      cloudinary.config().api_secret
    );

    return {
      signature,
      timestamp,
      cloudName: cloudinary.config().cloud_name,
      apiKey: cloudinary.config().api_key,
      publicId,
    };
  } catch (error) {
    console.error("Error creating signed URL:", error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the resource
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
};

module.exports = {
  uploadToCloudinary,
  createUploadSignedUrl,
  deleteFromCloudinary,
};
