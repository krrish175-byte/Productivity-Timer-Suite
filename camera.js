/**
 * Camera Module - Webcam access and intelligent presence detection system
 * Supports FaceDetector API with Canvas-based motion detection fallback
 * Enhanced for better accuracy with multiple users and visual feedback
 * Effects on webpage: Enables automatic pause when user leaves during pomodoro sessions
 * Used by: Pomodoro timer for productivity monitoring and automatic session management
 * Removal impact: No presence detection, users could game the system by leaving during work
 */

// MediaStream object from getUserMedia API for webcam access
// Effects: Provides live video feed for presence detection and user monitoring
// Removal impact: No camera access, presence detection would be impossible
let videoStream = null;

// FaceDetector API instance for advanced face detection (Chrome/Edge only)
// Effects: Enables accurate face detection with bounding boxes and landmarks
// Removal impact: Falls back to motion detection, less accurate presence monitoring
let faceDetector = null;

// setInterval ID for continuous presence detection loop
// Effects: Stores reference to detection timer for cleanup and control
// Removal impact: Detection loop could not be stopped, wasting resources
let detectionInterval = null;

// HTML video element that displays the live camera feed
// Effects: Shows camera preview to user and provides source for detection algorithms
// Removal impact: No video source for detection, no visual feedback to user
let videoElement = null;

// Canvas 2D context for motion detection fallback when FaceDetector unavailable
// Effects: Enables frame-by-frame analysis for motion-based presence detection
// Removal impact: No fallback detection method, system would fail on unsupported browsers
let canvasContext = null;

// Canvas element for drawing face tracking overlays and visual feedback
// Effects: Provides visual indication of detected faces and system status
// Removal impact: No visual feedback about detection status, user wouldn't know if system is working
let overlayCanvas = null;

// 2D context for drawing face tracking rectangles and status indicators
// Effects: Enables drawing of face bounding boxes and detection visualization
// Removal impact: No visual overlay, user couldn't see what system is detecting
let overlayContext = null;

// ImageData from previous video frame for motion detection comparison
// Effects: Stores reference frame for detecting changes between video frames
// Removal impact: Motion detection would fail, no way to detect movement
let previousFrameData = null;

// Counter for consecutive detection misses to prevent false absence alerts
// Effects: Prevents brief detection failures from triggering absence notifications
// Removal impact: System would be too sensitive, pausing for momentary detection glitches
let consecutiveMisses = 0;

// Counter for consecutive successful detections to confirm presence return
// Effects: Prevents brief detections from triggering false presence notifications
// Removal impact: System would be too sensitive to noise and false positives
let consecutiveDetections = 0;

// Boolean flag tracking current user presence state
// Effects: Maintains system state to trigger appropriate callbacks on state changes
// Removal impact: No state tracking, callbacks would fire constantly
let isUserPresent = true;

// Callback function to call when user presence is detected after absence
// Effects: Notifies pomodoro timer when user returns to resume session
// Removal impact: Timer wouldn't know when user returns, no automatic resume capability
let onPresentCallback = null;

// Callback function to call when user absence is detected
// Effects: Notifies pomodoro timer to pause when user leaves workspace
// Removal impact: Timer wouldn't pause when user leaves, defeating productivity monitoring
let onMissingCallback = null;

// Number of faces detected when monitoring started for multi-user scenarios
// Effects: Establishes baseline for detecting when original user(s) leave
// Removal impact: System couldn't distinguish between different users or group changes
let initialFaceCount = 0;

// Array storing recent detection results for smoothing and noise reduction
// Effects: Reduces false positives by analyzing detection patterns over time
// Removal impact: System would be noisy, triggering on brief detection failures
let detectionHistory = [];

// Array of currently detected face objects with bounding boxes and landmarks
// Effects: Stores face data for visualization and multi-face tracking
// Removal impact: No face visualization, no data for drawing overlays
let detectedFaces = [];

// Boolean flag to enable/disable face tracking visualization overlay
// Effects: Controls whether face detection boxes and status are shown to user
// Removal impact: Always show visualization, no way to disable for privacy/performance
let faceTrackingEnabled = true;

// Time interval between presence detection checks in milliseconds
// Effects: Controls how frequently the system checks for user presence
// Removal impact: No detection timing, system couldn't monitor presence
const DETECTION_INTERVAL_MS = 300;

// Time threshold for considering user absent in milliseconds (2 seconds)
// Effects: Determines how long user can be away before triggering absence alert
// Removal impact: No absence threshold, system would trigger immediately or never
const ABSENCE_THRESHOLD_MS = 2000;

// Number of consecutive detection misses needed to trigger absence notification
// Effects: Prevents false absence alerts from brief detection failures
// Removal impact: System would be too sensitive, triggering on single missed detections
const MISSES_THRESHOLD = Math.ceil(ABSENCE_THRESHOLD_MS / DETECTION_INTERVAL_MS);

// Number of consecutive successful detections needed to confirm user has returned
// Effects: Prevents false presence alerts from brief detection successes
// Removal impact: System would be too sensitive, triggering on single detections
const DETECTION_THRESHOLD = 3;

// Maximum number of recent detection results to keep for smoothing analysis
// Effects: Provides data for confidence calculations and noise reduction
// Removal impact: No historical data for smoothing, system would be noisy
const HISTORY_SIZE = 10;

/**
 * Starts the webcam and initializes video stream for presence detection
 * Effects on webpage: Activates camera preview and enables presence monitoring
 * Called by: Pomodoro timer start, camera initialization in app.js
 * Removal impact: No camera access, presence detection system would be non-functional
 * @param {HTMLVideoElement} videoEl - The video element to display the camera stream
 * @returns {Promise<void>} Promise that resolves when camera is ready for detection
 */
export async function startCamera(videoEl) {
  try {
    // Store reference to video element for use throughout the module
    // Effects: Provides access to video element for detection algorithms
    // Removal impact: No video source for detection, system would fail
    videoElement = videoEl;
    
    // Request webcam access with specific resolution for optimal performance
    // Effects: Activates user's camera and requests permission if not granted
    // Removal impact: No camera stream, entire presence detection system fails
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }  // Balanced resolution for performance vs quality
    });
    
    // Attach camera stream to video element for display and processing
    // Effects: Shows live camera feed to user and provides source for detection
    // Removal impact: No video display or detection source
    videoElement.srcObject = videoStream;
    
    // Start video playback to begin streaming
    // Effects: Begins live video display and makes frames available for detection
    // Removal impact: Video would be loaded but not playing, no detection possible
    await videoElement.play();
    
    // Wait for video metadata to load to ensure dimensions are available
    // Effects: Ensures video dimensions are known before creating detection canvas
    // Removal impact: Canvas sizing would fail, detection algorithms would break
    await new Promise((resolve) => {
      if (videoElement.videoWidth > 0) {
        // Video metadata already loaded, proceed immediately
        resolve();
      } else {
        // Wait for metadata load event to get video dimensions
        videoElement.addEventListener('loadedmetadata', resolve, { once: true });
      }
    });
    
    // Create overlay canvas for face tracking visualization
    // Effects: Sets up visual feedback system for detected faces
    // Removal impact: No visual indication of what system is detecting
    createOverlayCanvas();
    
    // Initialize FaceDetector API if available (Chrome/Edge browsers)
    // Effects: Enables advanced face detection with bounding boxes and landmarks
    // Removal impact: Falls back to motion detection, less accurate monitoring
    if ('FaceDetector' in window) {
      try {
        // Create FaceDetector instance with fast mode for real-time performance
        // Effects: Enables accurate face detection for presence monitoring
        // Removal impact: No face detection, system relies on motion detection only
        faceDetector = new window.FaceDetector({ fastMode: true });
        console.log('FaceDetector API initialized');
      } catch (error) {
        // Handle FaceDetector initialization failure gracefully
        // Effects: Provides fallback when FaceDetector fails to initialize
        // Removal impact: System would crash instead of falling back to motion detection
        console.warn('FaceDetector initialization failed, using fallback:', error);
        faceDetector = null;
      }
    } else {
      // FaceDetector not available, will use motion detection fallback
      // Effects: Informs user that advanced face detection is not available
      // Removal impact: No indication of detection method being used
      console.log('FaceDetector API not available, using Canvas fallback');
    }
    
    // Debug log to show which detection method is being used
    // Effects: Helps developers understand which detection algorithm is active
    // Removal impact: No debugging information about detection method
    console.log(faceDetector);
    
    // Initialize canvas for motion detection fallback if FaceDetector unavailable
    // Effects: Sets up alternative detection method for broader browser compatibility
    // Removal impact: No fallback detection, system would fail on unsupported browsers
    if (!faceDetector) {
      // Create hidden canvas for frame analysis
      const canvas = document.createElement('canvas');
      // Set canvas size to match video dimensions
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      // Get 2D context with optimization for frequent pixel reading
      canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    }
    
  } catch (error) {
    // Handle specific camera access errors with user-friendly messages
    // Effects: Provides clear error messages for different failure scenarios
    // Removal impact: Generic error messages, harder for users to understand issues
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
 * Stops the webcam and releases all camera resources
 * Effects on webpage: Turns off camera, hides preview, stops presence detection
 * Called by: Timer reset, tab switching, app cleanup, presence loss
 * Removal impact: Camera would stay on indefinitely, wasting battery and privacy concerns
 */
export function stopCamera() {
  // Stop all video tracks to release camera hardware
  // Effects: Turns off camera LED, releases camera for other applications
  // Removal impact: Camera would remain active, draining battery and privacy issues
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  // Clear video element source to stop video display
  // Effects: Removes camera feed from video element, hides preview
  // Removal impact: Video element would show last frame indefinitely
  if (videoElement) {
    videoElement.srcObject = null;
  }
  
  // Clear overlay canvas to remove face tracking visualization
  // Effects: Removes face detection boxes and status indicators
  // Removal impact: Stale detection visualization would remain visible
  if (overlayContext) {
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }
  
  // Reset all module variables to clean state
  // Effects: Ensures clean state for next camera initialization
  // Removal impact: Stale references could cause errors on restart
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
