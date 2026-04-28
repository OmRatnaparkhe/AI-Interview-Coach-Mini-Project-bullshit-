import multer from "multer";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Audio file filter for voice uploads
const audioFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/m4a'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (MP3, WAV, WebM, M4A)'), false);
  }
};

// Document file filter for resume uploads
const documentFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

// Audio upload configuration for voice interviews
export const uploadAudio = multer({ 
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
  }
});

// Document upload configuration for resume uploads
export const uploadDocument = multer({ 
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  }
});

// Legacy export for backward compatibility
export const upload = uploadAudio;