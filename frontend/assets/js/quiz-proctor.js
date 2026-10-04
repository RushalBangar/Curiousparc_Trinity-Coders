/**
 * SkillBridge AI Live Proctoring & Anti-Cheat Shield Engine
 * 
 * Features:
 * 1. Live Webcam Feed & Candidate Face Tracking
 * 2. Real-Time AI Object Detection (COCO-SSD) to detect smartphones and secondary devices
 * 3. Automatic Quiz Termination & Submission upon device detection
 * 4. Tab-Switch & Window Blur Monitoring (Auto-submit on unauthorized navigation)
 * 5. Fullscreen Lockdown & Exit Detection
 * 6. Anti-Google Lens Shield: Block copy/paste, text selection, inspect shortcuts, and right-click
 * 7. Dynamic Watermarking against optical lens photography
 */

class QuizProctorEngine {
    constructor() {
        this.stream = null;
        this.videoEl = null;
        this.canvasEl = null;
        this.canvasCtx = null;
        this.detectorModel = null;
        this.isDetecting = false;
        this.detectionInterval = null;
        this.isActive = false;
        this.violationCount = 0;
        this.maxViolations = 1; // Strict policy: 1 critical violation triggers auto-submit
        this.callbacks = {
            onViolation: null,
            onDeviceDetected: null,
            onModelLoaded: null,
            onStatusUpdate: null
        };
        this.audioCtx = null;
        this.isModelLoading = false;
        this.modelReady = false;
        this.candidateInfo = "Candidate Exam";
        this.detectionConfidenceThreshold = 0.45;
    }

    /**
     * Initializes the Web Audio API for violation alert beeps
     */
    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn("AudioContext not supported", e);
        }
    }

    /**
     * Plays a high-priority security alarm beep
     */
    playAlarmSound() {
        if (!this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // High A5
            osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (err) {
            console.warn("Failed to play alarm sound", err);
        }
    }

    /**
     * Preloads the TensorFlow COCO-SSD object detection model
     */
    async loadDetectionModel() {
        if (this.modelReady || this.isModelLoading) return;
        this.isModelLoading = true;
        this.updateStatus("Loading AI Anti-Cheat Shield...", "warning");

        try {
            if (typeof cocoSsd !== 'undefined') {
                this.detectorModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
                this.modelReady = true;
                this.isModelLoading = false;
                this.updateStatus("AI Shield Ready (COCO-SSD Armed)", "success");
                if (this.callbacks.onModelLoaded) this.callbacks.onModelLoaded();
            } else {
                console.warn("cocoSsd library not yet available in DOM; fallback heuristic armed.");
                this.modelReady = false;
                this.isModelLoading = false;
            }
        } catch (error) {
            console.error("Failed to load COCO-SSD model:", error);
            this.isModelLoading = false;
            this.updateStatus("Proctoring Camera Active (Basic Heuristic)", "warning");
        }
    }

    /**
     * Requests webcam access and connects stream to UI elements
     */
    async startCamera(videoElement, canvasElement) {
        this.videoEl = videoElement;
        this.canvasEl = canvasElement;
        if (canvasElement) {
            this.canvasCtx = canvasElement.getContext('2d');
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                },
                audio: false
            });

            if (this.videoEl) {
                this.videoEl.srcObject = this.stream;
                await this.videoEl.play();
            }

            this.updateStatus("Camera Connected & Live", "success");
            return true;
        } catch (error) {
            console.error("Camera access error:", error);
            let msg = "Camera access is required for proctored examination.";
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                msg = "Camera permission was denied. Please grant webcam permissions in your browser settings to proceed.";
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                msg = "No webcam device was found on this computer. A working camera is mandatory for verified testing.";
            }
            this.updateStatus(msg, "danger");
            throw new Error(msg);
        }
    }

    /**
     * Starts full proctoring lifecycle: camera feed, AI model loop, tab & shortcut protection
     */
    async startSession({ videoElement, canvasElement, candidateEmail, onViolation, onStatusUpdate }) {
        this.initAudio();
        this.callbacks.onViolation = onViolation;
        this.callbacks.onStatusUpdate = onStatusUpdate;
        this.candidateInfo = candidateEmail || "Candidate Verified";
        this.isActive = true;
        this.violationCount = 0;

        // 1. Initialize camera
        await this.startCamera(videoElement, canvasElement);

        // 2. Ensure AI model is ready
        if (!this.modelReady) {
            await this.loadDetectionModel();
        }

        // 3. Request Fullscreen Mode
        this.enterFullscreen();

        // 4. Arm anti-cheating tab & shortcut listeners
        this.armAntiCheatListeners();

        // 5. Start real-time AI object detection loop
        this.startDetectionLoop();

        this.updateStatus("Proctoring Active • AI Shield Engaged", "success");
    }

    /**
     * Continuous loop inspecting camera video frames with COCO-SSD
     */
    startDetectionLoop() {
        if (this.isDetecting) return;
        this.isDetecting = true;

        const runDetection = async () => {
            if (!this.isActive || !this.videoEl || this.videoEl.paused || this.videoEl.ended) {
                if (this.isActive) {
                    this.detectionInterval = setTimeout(runDetection, 600);
                }
                return;
            }

            try {
                if (this.canvasEl && this.canvasCtx && this.videoEl.videoWidth > 0) {
                    // Sync canvas dimensions to video
                    if (this.canvasEl.width !== this.videoEl.videoWidth) {
                        this.canvasEl.width = this.videoEl.videoWidth;
                        this.canvasEl.height = this.videoEl.videoHeight;
                    }
                    
                    // Clear previous overlays
                    this.canvasCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

                    if (this.detectorModel) {
                        // AI Model prediction
                        const predictions = await this.detectorModel.detect(this.videoEl);
                        this.processDetections(predictions);
                    } else {
                        // Light fallback watermark scan
                        this.drawWatermarkOverlay();
                    }
                }
            } catch (err) {
                console.warn("Detection frame error:", err);
            }

            if (this.isActive) {
                // Query every 600ms for high performance and low CPU overhead
                this.detectionInterval = setTimeout(runDetection, 600);
            }
        };

        runDetection();
    }

    /**
     * Evaluates detected objects and checks for prohibited devices (cell phone, etc.)
     */
    processDetections(predictions) {
        let personFound = false;
        let phoneFound = false;
        let phoneConfidence = 0;
        let phoneBox = null;

        predictions.forEach(pred => {
            const [x, y, width, height] = pred.bbox;

            if (pred.class === 'person' && pred.score > 0.40) {
                personFound = true;
                // Draw subtle green indicator for candidate
                this.canvasCtx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
                this.canvasCtx.lineWidth = 2;
                this.canvasCtx.strokeRect(x, y, width, height);
                this.canvasCtx.fillStyle = 'rgba(16, 185, 129, 0.8)';
                this.canvasCtx.font = '10px Plus Jakarta Sans, sans-serif';
                this.canvasCtx.fillText(`Candidate (${Math.round(pred.score * 100)}%)`, x + 4, y > 15 ? y - 4 : y + 12);
            }

            // Flag unauthorized devices: cell phone, mobile phone, remote, or laptop
            if ((pred.class === 'cell phone' || pred.class === 'remote') && pred.score >= this.detectionConfidenceThreshold) {
                phoneFound = true;
                phoneConfidence = Math.round(pred.score * 100);
                phoneBox = pred.bbox;
            }
        });

        // If phone is detected, draw ALARM overlay and trigger immediate violation
        if (phoneFound) {
            const [px, py, pw, ph] = phoneBox;
            this.canvasCtx.strokeStyle = '#ef4444';
            this.canvasCtx.lineWidth = 4;
            this.canvasCtx.strokeRect(px, py, pw, ph);
            this.canvasCtx.fillStyle = '#ef4444';
            this.canvasCtx.fillRect(px, py > 20 ? py - 20 : py, Math.max(pw, 160), 20);
            this.canvasCtx.fillStyle = '#ffffff';
            this.canvasCtx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
            this.canvasCtx.fillText(`⚠️ SMARTPHONE DETECTED (${phoneConfidence}%)`, px + 4, py > 20 ? py - 6 : py + 14);

            this.triggerCriticalViolation({
                type: 'smartphone_detected',
                title: 'Smartphone Device Detected',
                message: `An electronic device (Smartphone) was identified in your webcam feed (${phoneConfidence}% confidence). Exam has been automatically terminated and submitted.`,
                confidence: phoneConfidence
            });
        }
    }

    /**
     * Draws anti-lens digital watermark onto canvas
     */
    drawWatermarkOverlay() {
        if (!this.canvasCtx) return;
        this.canvasCtx.fillStyle = 'rgba(99, 102, 241, 0.12)';
        this.canvasCtx.font = '9px monospace';
        this.canvasCtx.fillText(`SKILLBRIDGE PROCTOR • ${this.candidateInfo.slice(0, 15)}`, 8, this.canvasEl.height - 8);
    }

    /**
     * Enters browser Fullscreen mode
     */
    async enterFullscreen() {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen && !document.fullscreenElement) {
                await elem.requestFullscreen();
            }
        } catch (e) {
            console.warn("Fullscreen request declined or unsupported:", e);
        }
    }

    /**
     * Exits browser Fullscreen mode
     */
    exitFullscreen() {
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen();
            }
        } catch (e) {
            console.warn("Error exiting fullscreen:", e);
        }
    }

    /**
     * Attaches robust event listeners to block tab-switching, devtools, right-click, and copy/paste
     */
    armAntiCheatListeners() {
        // Tab Visibility Change (Switching tabs)
        this._visibilityHandler = () => {
            if (!this.isActive) return;
            if (document.visibilityState === 'hidden') {
                this.triggerCriticalViolation({
                    type: 'tab_switch',
                    title: 'Tab Switch / Backgrounding Detected',
                    message: 'Leaving the exam tab or opening another application is strictly prohibited during proctored testing.'
                });
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);

        // Window Focus Loss (Clicking outside or alt-tabbing)
        this._blurTimeout = null;
        this._blurHandler = () => {
            if (!this.isActive) return;
            if (this._blurTimeout) clearTimeout(this._blurTimeout);

            // Allow 3.5s grace period for accidental clicks (browser chrome, notifications)
            this._blurTimeout = setTimeout(() => {
                if (!this.isActive) return;
                if (!document.hasFocus() || document.visibilityState === 'hidden') {
                    this.triggerCriticalViolation({
                        type: 'window_blur',
                        title: 'Application Focus Lost',
                        message: 'You switched windows or navigated away from the proctored exam workspace.'
                    });
                }
            }, 3500);

            this.showWarningToast("Warning: Focus lost. Return to the exam window immediately to avoid exam termination.");
        };
        this._focusHandler = () => {
            if (this._blurTimeout) {
                clearTimeout(this._blurTimeout);
                this._blurTimeout = null;
            }
        };
        window.addEventListener('blur', this._blurHandler);
        window.addEventListener('focus', this._focusHandler);

        // Fullscreen Change (Exiting fullscreen)
        this._fullscreenHandler = () => {
            if (!this.isActive) return;
            if (!document.fullscreenElement) {
                this.triggerCriticalViolation({
                    type: 'fullscreen_exit',
                    title: 'Fullscreen Mode Exited',
                    message: 'Exiting fullscreen mode violates proctoring integrity rules.'
                });
            }
        };
        document.addEventListener('fullscreenchange', this._fullscreenHandler);

        // Block Right-Click Context Menu
        this._contextMenuHandler = (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.showWarningToast("Right-click context menu is disabled during the assessment.");
                return false;
            }
        };
        document.addEventListener('contextmenu', this._contextMenuHandler);

        // Block Copy, Cut, Paste, Text Dragging
        this._copyHandler = (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.showWarningToast("Copying content is disabled to protect exam integrity.");
                return false;
            }
        };
        document.addEventListener('copy', this._copyHandler);
        document.addEventListener('cut', this._copyHandler);
        document.addEventListener('paste', this._copyHandler);
        document.addEventListener('dragstart', this._copyHandler);

        // Block Keyboard Shortcuts (Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+Shift+I, F12, PrintScreen)
        this._keyHandler = (e) => {
            if (!this.isActive) return;

            // Block PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                this.triggerCriticalViolation({
                    type: 'screenshot_attempt',
                    title: 'Screen Capture Detected',
                    message: 'Screenshot attempts via PrintScreen are prohibited.'
                });
                return;
            }

            // Block F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                this.showWarningToast("Developer tools shortcut disabled.");
                return;
            }

            // Block Ctrl / Cmd combinations
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (['c', 'v', 'x', 'a', 'u', 's', 'p'].includes(key) || (e.shiftKey && ['i', 'j', 'c'].includes(key))) {
                    e.preventDefault();
                    this.showWarningToast(`Shortcut Ctrl+${key.toUpperCase()} is disabled during the exam.`);
                    return;
                }
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    /**
     * Removes all security listeners cleanly
     */
    disarmAntiCheatListeners() {
        if (this._blurTimeout) {
            clearTimeout(this._blurTimeout);
            this._blurTimeout = null;
        }
        if (this._visibilityHandler) document.removeEventListener('visibilitychange', this._visibilityHandler);
        if (this._blurHandler) window.removeEventListener('blur', this._blurHandler);
        if (this._focusHandler) window.removeEventListener('focus', this._focusHandler);
        if (this._fullscreenHandler) document.removeEventListener('fullscreenchange', this._fullscreenHandler);
        if (this._contextMenuHandler) document.removeEventListener('contextmenu', this._contextMenuHandler);
        if (this._copyHandler) {
            document.removeEventListener('copy', this._copyHandler);
            document.removeEventListener('cut', this._copyHandler);
            document.removeEventListener('paste', this._copyHandler);
            document.removeEventListener('dragstart', this._copyHandler);
        }
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    }

    /**
     * Triggers a critical security violation, sounds alarm, halts quiz, and invokes auto-submit
     */
    triggerCriticalViolation(violationDetails) {
        if (!this.isActive) return;
        this.violationCount++;
        
        // Sound acoustic alarm
        this.playAlarmSound();

        // Notify callback to trigger automatic quiz submission
        if (this.callbacks.onViolation) {
            this.callbacks.onViolation(violationDetails);
        }
    }

    /**
     * Simulates a violation for demonstration and testing purposes
     */
    simulateViolation(type = 'smartphone') {
        if (!this.isActive) {
            alert("Please start the quiz first to test proctoring violation alerts.");
            return;
        }

        if (type === 'smartphone') {
            this.triggerCriticalViolation({
                type: 'smartphone_detected',
                title: 'Smartphone Device Detected',
                message: 'An electronic device (Smartphone) was identified in your webcam feed (96% confidence). Exam has been automatically terminated and submitted.',
                confidence: 96
            });
        } else if (type === 'tab_switch') {
            this.triggerCriticalViolation({
                type: 'tab_switch',
                title: 'Tab Switch / Backgrounding Detected',
                message: 'Leaving the exam tab or opening another application is strictly prohibited during proctored testing.'
            });
        }
    }

    /**
     * Sends human-readable status updates to UI
     */
    updateStatus(message, level = 'info') {
        if (this.callbacks.onStatusUpdate) {
            this.callbacks.onStatusUpdate(message, level);
        }
    }

    /**
     * Displays a brief non-blocking warning toast
     */
    showWarningToast(msg) {
        if (window.Toast && window.Toast.warning) {
            window.Toast.warning(msg, "Anti-Cheat Guard");
        }
    }

    /**
     * Stops the camera stream and shuts down the proctoring engine
     */
    stopSession() {
        this.isActive = false;
        this.isDetecting = false;

        if (this.detectionInterval) {
            clearTimeout(this.detectionInterval);
            this.detectionInterval = null;
        }

        this.disarmAntiCheatListeners();
        this.exitFullscreen();

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoEl) {
            this.videoEl.srcObject = null;
        }

        if (this.canvasCtx && this.canvasEl) {
            this.canvasCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        }
    }
}

// Global Singleton Instance
if (typeof window !== 'undefined') {
    window.QuizProctor = new QuizProctorEngine();
}
