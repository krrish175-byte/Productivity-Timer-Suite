// Camera module for webcam access and presence detection
// Supports FaceDetector API with Canvas-based motion detection fallback
// Enhanced for better accuracy with multiple users
// Includes face detection visualization and tracking

let videoStream = null;
let faceDetector = null;
let detectionInterval = null;
let videoElement = null;
let canvasContext = null;
let overlayCanvas = null;
let overlayContext = null;
let previousFrameData = null;
let consecutiveMisses = 0;
let consecutiveDetections = 0;
let isUserPresent = true;
let onPresentCallback = null;
let onMissingCallback = null;
let initialFaceCount = 0;
let detectionHistory = [];
let detectedFaces = [];
let faceTrackingEnabled = true;

const DETECTION_INTERVAL_MS = 300; // Faster detection for better accuracy
const ABSENCE_THRESHOLD_MS = 2000; // 2 seconds
const MISSES_THRESHOLD = Math.ceil(ABSENCE_THRESHOLD_MS / DETECTION_INTERVAL_MS);
const DETECTION_THRESHOLD = 3; // Require 3 consecutive detections to confirm presence
const HISTORY_SIZE = 10; // Keep last 10 detection results for smoothing

/**
 * Starts the webcam and begins video stream
 * @param {HTMLVideoElement} videoEl - The video element to display the stream
 * @returns {Promise<void>}
 */
export async function startCamera(videoEl) {
  try {
    videoElement = videoEl;
    
    // Request webcam access
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    
    // Attach stream to video element
    videoElement.srcObject = videoStream;
    await videoElement.play();
    
    // Wait for video metadata to load
    await new Promise((resolve) => {
      if (videoElement.videoWidth > 0) {
        resolve();
      } else {
        videoElement.addEventListener('loadedmetadata', resolve, { once: true });
      }
    });
    
    // Create overlay canvas for face tracking visualization
    createOverlayCanvas();
    
    // Initialize FaceDetector if available
    if ('FaceDetector' in window) {
      try {
        faceDetector = new window.FaceDetector({ fastMode: true });
        console.log('FaceDetector API initialized');
      } catch (error) {
        console.warn('FaceDetector initialization failed, using fallback:', error);
        faceDetector = null;
      }
    } else {
      console.log('FaceDetector API not available, using Canvas fallback');
    }
    
    // Initialize canvas for fallback detection
    if (!faceDetector) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    }
    
  } catch (error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('Camera access denied. Please grant camera permissions to use presence detection.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera found. Please connect a camera to use presence detection.');
    } else {
      throw new Error(`Camera error: ${error.message}`);
    }
  }
}

/**
 * Creates an overlay canvas for face tracking visualization
 */
function createOverlayCanvas() {
  // Find or create overlay canvas
  overlayCanvas = document.getElementById('face-tracking-overlay');
  
  if (!overlayCanvas) {
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'face-tracking-overlay';
    overlayCanvas.className = 'face-tracking-overlay';
    
    // Insert after video element
    videoElement.parentNode.insertBefore(overlayCanvas, videoElement.nextSibling);
  }
  
  // Set canvas size to match video
  overlayCanvas.width = videoElement.videoWidth;
  overlayCanvas.height = videoElement.videoHeight;
  
  overlayContext = overlayCanvas.getContext('2d');
  
  console.log(`Overlay canvas created: ${overlayCanvas.width}x${overlayCanvas.height}`);
}

/**
 * Stops the webcam and releases resources
 */
export function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  if (videoElement) {
    videoElement.srcObject = null;
  }
  
  // Clear overlay canvas
  if (overlayContext) {
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }
  
  faceDetector = null;
  canvasContext = null;
  overlayCanvas = null;
  overlayContext = null;
  previousFrameData = null;
  videoElement = null;
  detectedFaces = [];
}

/**
 * Detects presence using FaceDetector API
 * Enhanced to track initial face count and detect if user leaves
 * Also stores face data for visualization
 * @returns {Promise<boolean>} - True if expected faces detected
 */
async function detectWithFaceAPI() {
  try {
    const faces = await faceDetector.detect(videoElement);
    const faceCount = faces.length;
    
    // Store detected faces for visualization
    detectedFaces = faces.map(face => ({
      boundingBox: face.boundingBox,
      landmarks: face.landmarks || []
    }));
    
    // Draw face tracking visualization
    if (faceTrackingEnabled) {
      drawFaceTracking();
    }
    
    // On first detection, store the initial face count
    if (initialFaceCount === 0 && faceCount > 0) {
      initialFaceCount = faceCount;
      console.log(`Initial face count detected: ${faceCount}`);
    }
    
    // If we have an initial count, check if at least one face is still present
    // This allows for some flexibility with multiple people
    if (initialFaceCount > 0) {
      return faceCount > 0;
    }
    
    return faceCount > 0;
  } catch (error) {
    console.error('Face detection error:', error);
    return false;
  }
}

/**
 * Draws face tracking visualization on overlay canvas
 */
function drawFaceTracking() {
  if (!overlayContext || !overlayCanvas) return;
  
  // Clear previous drawings
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
  if (detectedFaces.length === 0) return;
  
  // Draw each detected face
  detectedFaces.forEach((face, index) => {
    const box = face.boundingBox;
    
    // Draw bounding box
    overlayContext.strokeStyle = isUserPresent ? '#10b981' : '#ef4444'; // Green if present, red if absent
    overlayContext.lineWidth = 3;
    overlayContext.shadowColor = isUserPresent ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    overlayContext.shadowBlur = 10;
    
    // Draw rounded rectangle
    const radius = 8;
    overlayContext.beginPath();
    overlayContext.moveTo(box.x + radius, box.y);
    overlayContext.lineTo(box.x + box.width - radius, box.y);
    overlayContext.quadraticCurveTo(box.x + box.width, box.y, box.x + box.width, box.y + radius);
    overlayContext.lineTo(box.x + box.width, box.y + box.height - radius);
    overlayContext.quadraticCurveTo(box.x + box.width, box.y + box.height, box.x + box.width - radius, box.y + box.height);
    overlayContext.lineTo(box.x + radius, box.y + box.height);
    overlayContext.quadraticCurveTo(box.x, box.y + box.height, box.x, box.y + box.height - radius);
    overlayContext.lineTo(box.x, box.y + radius);
    overlayContext.quadraticCurveTo(box.x, box.y, box.x + radius, box.y);
    overlayContext.closePath();
    overlayContext.stroke();
    
    // Draw corner accents
    const cornerLength = 20;
    overlayContext.lineWidth = 4;
    
    // Top-left corner
    overlayContext.beginPath();
    overlayContext.moveTo(box.x, box.y + cornerLength);
    overlayContext.lineTo(box.x, box.y);
    overlayContext.lineTo(box.x + cornerLength, box.y);
    overlayContext.stroke();
    
    // Top-right corner
    overlayContext.beginPath();
    overlayContext.moveTo(box.x + box.width - cornerLength, box.y);
    overlayContext.lineTo(box.x + box.width, box.y);
    overlayContext.lineTo(box.x + box.width, box.y + cornerLength);
    overlayContext.stroke();
    
    // Bottom-left corner
    overlayContext.beginPath();
    overlayContext.moveTo(box.x, box.y + box.height - cornerLength);
    overlayContext.lineTo(box.x, box.y + box.height);
    overlayContext.lineTo(box.x + cornerLength, box.y + box.height);
    overlayContext.stroke();
    
    // Bottom-right corner
    overlayContext.beginPath();
    overlayContext.moveTo(box.x + box.width - cornerLength, box.y + box.height);
    overlayContext.lineTo(box.x + box.width, box.y + box.height);
    overlayContext.lineTo(box.x + box.width, box.y + box.height - cornerLength);
    overlayContext.stroke();
    
    // Draw face label
    overlayContext.shadowBlur = 0;
    overlayContext.fillStyle = isUserPresent ? '#10b981' : '#ef4444';
    overlayContext.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    const label = `Face ${index + 1}`;
    const labelWidth = overlayContext.measureText(label).width;
    const labelPadding = 8;
    const labelHeight = 24;
    
    // Draw label background
    overlayContext.fillStyle = isUserPresent ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    overlayContext.fillRect(
      box.x,
      box.y - labelHeight - 5,
      labelWidth + labelPadding * 2,
      labelHeight
    );
    
    // Draw label text
    overlayContext.fillStyle = '#ffffff';
    overlayContext.fillText(
      label,
      box.x + labelPadding,
      box.y - 10
    );
    
    // Draw landmarks if available
    if (face.landmarks && face.landmarks.length > 0) {
      overlayContext.fillStyle = isUserPresent ? '#10b981' : '#ef4444';
      face.landmarks.forEach(landmark => {
        overlayContext.beginPath();
        overlayContext.arc(landmark.x, landmark.y, 3, 0, 2 * Math.PI);
        overlayContext.fill();
      });
    }
  });
  
  // Draw face count indicator
  if (detectedFaces.length > 0) {
    overlayContext.shadowBlur = 0;
    overlayContext.fillStyle = 'rgba(30, 41, 59, 0.9)';
    overlayContext.fillRect(10, 10, 180, 40);
    
    overlayContext.fillStyle = '#f1f5f9';
    overlayContext.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    overlayContext.fillText(
      `${detectedFaces.length} Face${detectedFaces.length > 1 ? 's' : ''} Detected`,
      20,
      35
    );
  }
}

/**
 * Detects presence using Canvas-based motion detection fallback
 * Enhanced with better sensitivity and noise reduction
 * Also provides visual feedback on overlay
 * @returns {boolean} - True if motion/presence detected
 */
function detectWithCanvas() {
  try {
    if (!canvasContext || !videoElement.videoWidth) {
      return false;
    }
    
    // Update canvas size if needed
    if (canvasContext.canvas.width !== videoElement.videoWidth) {
      canvasContext.canvas.width = videoElement.videoWidth;
      canvasContext.canvas.height = videoElement.videoHeight;
    }
    
    // Draw current frame
    canvasContext.drawImage(videoElement, 0, 0);
    const currentFrameData = canvasContext.getImageData(
      0, 0, 
      canvasContext.canvas.width, 
      canvasContext.canvas.height
    );
    
    // First frame - assume presence
    if (!previousFrameData) {
      previousFrameData = currentFrameData;
      return true;
    }
    
    // Calculate pixel differences with improved algorithm
    let diffCount = 0;
    let significantDiffCount = 0;
    const threshold = 25; // Slightly lower threshold for better sensitivity
    const significantThreshold = 50; // For detecting major changes
    const sampleRate = 3; // Check every 3rd pixel for better accuracy
    
    // Track motion regions for visualization
    const motionRegions = [];
    const gridSize = 40; // Divide frame into grid
    const gridCols = Math.ceil(canvasContext.canvas.width / gridSize);
    const gridRows = Math.ceil(canvasContext.canvas.height / gridSize);
    const motionGrid = Array(gridRows).fill(0).map(() => Array(gridCols).fill(0));
    
    for (let i = 0; i < currentFrameData.data.length; i += sampleRate * 4) {
      const rDiff = Math.abs(currentFrameData.data[i] - previousFrameData.data[i]);
      const gDiff = Math.abs(currentFrameData.data[i + 1] - previousFrameData.data[i + 1]);
      const bDiff = Math.abs(currentFrameData.data[i + 2] - previousFrameData.data[i + 2]);
      
      const totalDiff = rDiff + gDiff + bDiff;
      
      if (totalDiff > threshold) {
        diffCount++;
        if (totalDiff > significantThreshold) {
          significantDiffCount++;
        }
        
        // Track motion in grid
        const pixelIndex = i / 4;
        const x = pixelIndex % canvasContext.canvas.width;
        const y = Math.floor(pixelIndex / canvasContext.canvas.width);
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        if (gridY < gridRows && gridX < gridCols) {
          motionGrid[gridY][gridX]++;
        }
      }
    }
    
    previousFrameData = currentFrameData;
    
    // Calculate motion percentages
    const totalSampledPixels = currentFrameData.data.length / (sampleRate * 4);
    const motionPercentage = diffCount / totalSampledPixels;
    const significantMotionPercentage = significantDiffCount / totalSampledPixels;
    
    // Draw motion visualization
    if (faceTrackingEnabled && overlayContext) {
      drawMotionVisualization(motionGrid, gridSize, motionPercentage);
    }
    
    // Consider presence if there's either:
    // 1. General motion above 0.8% (slightly lower threshold)
    // 2. Significant motion above 0.3%
    return motionPercentage > 0.008 || significantMotionPercentage > 0.003;
  } catch (error) {
    console.error('Canvas detection error:', error);
    return false;
  }
}

/**
 * Draws motion detection visualization on overlay canvas
 */
function drawMotionVisualization(motionGrid, gridSize, motionPercentage) {
  if (!overlayContext || !overlayCanvas) return;
  
  // Clear previous drawings
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
  // Draw motion grid
  const maxMotion = Math.max(...motionGrid.flat());
  if (maxMotion > 0) {
    motionGrid.forEach((row, y) => {
      row.forEach((motion, x) => {
        if (motion > 0) {
          const intensity = motion / maxMotion;
          const alpha = intensity * 0.5;
          overlayContext.fillStyle = isUserPresent 
            ? `rgba(16, 185, 129, ${alpha})` 
            : `rgba(239, 68, 68, ${alpha})`;
          overlayContext.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
      });
    });
  }
  
  // Draw motion indicator
  overlayContext.shadowBlur = 0;
  overlayContext.fillStyle = 'rgba(30, 41, 59, 0.9)';
  overlayContext.fillRect(10, 10, 200, 60);
  
  overlayContext.fillStyle = '#f1f5f9';
  overlayContext.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  overlayContext.fillText('Motion Detection', 20, 30);
  
  overlayContext.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  overlayContext.fillStyle = isUserPresent ? '#10b981' : '#ef4444';
  overlayContext.fillText(
    `Activity: ${(motionPercentage * 100).toFixed(1)}%`,
    20,
    50
  );
}

/**
 * Toggle face tracking visualization
 * @param {boolean} enabled - Whether to enable face tracking
 */
export function setFaceTracking(enabled) {
  faceTrackingEnabled = enabled;
  
  if (!enabled && overlayContext) {
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }
  
  console.log(`Face tracking ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Performs presence detection check
 * @returns {Promise<boolean>} - True if user is present
 */
async function checkPresence() {
  if (!videoElement || !videoStream) {
    return false;
  }
  
  let detected = false;
  
  if (faceDetector) {
    detected = await detectWithFaceAPI();
  } else {
    detected = detectWithCanvas();
  }
  
  return detected;
}

/**
 * Starts presence detection with callbacks
 * Enhanced with detection smoothing to reduce false positives
 * @param {Function} onPresent - Called when user presence is detected after absence
 * @param {Function} onMissing - Called when user is absent for 2 seconds
 */
export function startPresenceDetection(onPresent, onMissing) {
  onPresentCallback = onPresent;
  onMissingCallback = onMissing;
  consecutiveMisses = 0;
  consecutiveDetections = 0;
  isUserPresent = true;
  initialFaceCount = 0;
  detectionHistory = [];
  
  detectionInterval = setInterval(async () => {
    try {
      const detected = await checkPresence();
      
      // Add to detection history for smoothing
      detectionHistory.push(detected);
      if (detectionHistory.length > HISTORY_SIZE) {
        detectionHistory.shift();
      }
      
      // Calculate detection confidence (percentage of recent detections)
      const recentDetections = detectionHistory.filter(d => d).length;
      const detectionConfidence = recentDetections / detectionHistory.length;
      
      if (detected) {
        consecutiveDetections++;
        consecutiveMisses = 0;
        
        // User is present with high confidence
        if (!isUserPresent && consecutiveDetections >= DETECTION_THRESHOLD) {
          // User returned after being absent
          isUserPresent = true;
          consecutiveDetections = 0;
          if (onPresentCallback) {
            onPresentCallback();
          }
          console.log('User presence confirmed');
        }
      } else {
        consecutiveMisses++;
        consecutiveDetections = 0;
        
        // User is absent with high confidence
        if (consecutiveMisses >= MISSES_THRESHOLD && isUserPresent) {
          // User has been absent for threshold duration
          isUserPresent = false;
          if (onMissingCallback) {
            onMissingCallback();
          }
          console.log('User absence confirmed');
        }
      }
      
      // Log detection confidence periodically
      if (detectionHistory.length === HISTORY_SIZE) {
        console.log(`Detection confidence: ${(detectionConfidence * 100).toFixed(1)}%`);
      }
    } catch (error) {
      console.error('Presence detection error:', error);
    }
  }, DETECTION_INTERVAL_MS);
}

/**
 * Stops presence detection and cleans up
 */
export function stopPresenceDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  
  onPresentCallback = null;
  onMissingCallback = null;
  consecutiveMisses = 0;
  consecutiveDetections = 0;
  isUserPresent = true;
  initialFaceCount = 0;
  previousFrameData = null;
  detectionHistory = [];
}
