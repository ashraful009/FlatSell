const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ─── Configure Cloudinary SDK ─────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer Storage: Property Images ─────────────────────────────────────────
// resource_type: 'image' — handles jpg, jpeg, png, webp
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'flatsell/images',
    resource_type:   'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, crop: 'limit', quality: 'auto' }],
  }),
});

// ─── Multer Storage: Documents (Trade License - PDF) ─────────────────────────
// resource_type: 'raw' (or 'auto') — CRITICAL for PDFs
// Using 'auto' so Cloudinary auto-detects the file type
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'flatsell/documents',
    resource_type:   'auto',   // ← handles PDFs correctly
    allowed_formats: ['pdf'],
    public_id:       `trade_license_${Date.now()}`,
  }),
});

// ─── Multer Upload Instances ──────────────────────────────────────────────────
const uploadImage = multer({
  storage: imageStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

const uploadDocument = multer({
  storage: documentStorage,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB for PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for documents'), false);
    }
  },
});

// ─── Direct Upload Helper (for programmatic uploads) ─────────────────────────
/**
 * Upload a file to Cloudinary directly (when not using multer-storage-cloudinary)
 * @param {string} filePath  - Local file path or remote URL
 * @param {string} folder    - Cloudinary subfolder under 'flatsell/'
 * @param {string} resource_type - 'image' | 'raw' | 'auto' (use 'auto' for PDFs)
 */
const uploadToCloudinary = async (filePath, folder, resource_type = 'auto') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder:        `flatsell/${folder}`,
      resource_type, // 'auto' handles both images and PDFs seamlessly
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadDocument,
  uploadToCloudinary,
};
