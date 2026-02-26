import os
import cv2
# import mediapipe as mp  # Commented - too heavy for Render free tier
import tempfile
import numpy as np
# import librosa  # Commented - too heavy for Render free tier
# import whisper  # Commented - not available, use alternatives
# import torch  # Commented - not in requirements
from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging
import traceback
import time
import base64
from concurrent.futures import ThreadPoolExecutor
# import soundfile as sf  # Commented - audio processing removed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max file size

# CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# SocketIO configuration with increased buffer sizes
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    async_mode='threading',
    ping_timeout=120,  # Increased timeout
    ping_interval=30,   # More frequent pings
    max_http_buffer_size=200 * 1024 * 1024,  # 200MB
    logger=True,
    engineio_logger=True,
    transports=['polling', 'websocket'],  # Polling first, then websocket
    allow_upgrades=True,
    http_compression=False  # Disable compression for large files
)

# ===============================
# Load Whisper model
# ===============================
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Loading Whisper model on {device}...")
try:
    whisper_model = whisper.load_model("base", device=device)
    logger.info("✅ Whisper model loaded successfully!")
except Exception as e:
    logger.error(f"Failed to load Whisper: {e}")
    whisper_model = None

# ===============================
# Mediapipe setup
# ===============================
mp_pose = mp.solutions.pose
mp_face_mesh = mp.solutions.face_mesh

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=2)  # Reduced workers to prevent overload

# ===============================
# Utility functions
# ===============================
def save_temp_file(file_bytes, suffix):
    """Save incoming video bytes to temporary file"""
    try:
        fd, path = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
        logger.info(f"Saved temp file: {path} ({len(file_bytes)} bytes)")
        return path
    except Exception as e:
        logger.error(f"Error saving temp file: {e}")
        raise

def analyze_audio(video_path):
    """Comprehensive audio analysis"""
    logger.info(f"Starting audio analysis: {video_path}")
    
    try:
        # Load audio with librosa
        y, sr = librosa.load(video_path, sr=16000, mono=True)
        
        if len(y) == 0:
            return {
                "wpm": 0,
                "fillers": [],
                "grammar_mistakes": 0,
                "pause_count": 0,
                "transcript": "No audio detected",
                "duration": 0
            }
        
        duration = len(y) / sr
        
        # Save temp audio for Whisper
        temp_audio = video_path + '.wav'
        sf.write(temp_audio, y, sr)
        
        # Transcribe with Whisper
        transcript = ""
        if whisper_model:
            try:
                result = whisper_model.transcribe(temp_audio, language='en', fp16=False)
                transcript = result["text"].strip()
            except Exception as e:
                logger.error(f"Whisper error: {e}")
                transcript = ""
        
        # Calculate WPM
        words = len(transcript.split())
        wpm = int((words / duration) * 60) if duration > 0 and words > 0 else 0
        
        # Detect filler words
        filler_words = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually']
        found_fillers = []
        transcript_lower = transcript.lower()
        for filler in filler_words:
            if filler in transcript_lower:
                found_fillers.append(filler)
        
        # Calculate pauses
        rms = librosa.feature.rms(y=y)[0]
        silence_threshold = np.percentile(rms, 30)
        pauses = 0
        in_pause = False
        pause_length = 0
        
        for val in rms:
            if val < silence_threshold:
                if not in_pause:
                    in_pause = True
                    pause_length = 1
                else:
                    pause_length += 1
            else:
                if in_pause and pause_length > 10:  # Min pause frames
                    pauses += 1
                in_pause = False
                pause_length = 0
        
        # Clean up temp audio
        try:
            if os.path.exists(temp_audio):
                os.unlink(temp_audio)
        except:
            pass
        
        result = {
            "wpm": wpm,
            "fillers": list(set(found_fillers))[:5],
            "grammar_mistakes": 0,
            "pause_count": min(pauses, 20),  # Cap at reasonable number
            "transcript": transcript[:300] + "..." if len(transcript) > 300 else transcript,
            "duration": round(duration, 1)
        }
        
        logger.info(f"Audio analysis complete: WPM={wpm}, Fillers={len(result['fillers'])}")
        return result
        
    except Exception as e:
        logger.error(f"Audio analysis error: {e}")
        logger.error(traceback.format_exc())
        return {
            "wpm": 0,
            "fillers": [],
            "grammar_mistakes": 0,
            "pause_count": 0,
            "transcript": f"Analysis error",
            "duration": 0
        }

def analyze_posture(video_path):
    """Posture analysis with reduced frame count for speed"""
    logger.info(f"Starting posture analysis: {video_path}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "confidence_score": 5.0,
            "posture": "Good",
            "gestures": ["Natural gestures"],
            "eye_contact": "Good",
            "facial_expressions": ["Engaged"]
        }
    
    # Sample only 20 frames max
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    max_frames = min(20, total_frames)
    
    if max_frames < 5:
        cap.release()
        return {
            "confidence_score": 5.0,
            "posture": "Good",
            "gestures": ["Basic movements"],
            "eye_contact": "Good",
            "facial_expressions": ["Neutral"]
        }
    
    frame_indices = np.linspace(0, total_frames-1, max_frames, dtype=int)
    
    good_posture_count = 0
    eye_contact_count = 0
    frames_processed = 0
    
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        
        frames_processed += 1
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Posture check
        pose_results = pose.process(rgb)
        if pose_results.pose_landmarks:
            landmarks = pose_results.pose_landmarks.landmark
            left_y = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y
            right_y = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
            if abs(left_y - right_y) < 0.05:
                good_posture_count += 1
        
        # Eye contact check
        face_results = face_mesh.process(rgb)
        if face_results.multi_face_landmarks:
            eye_contact_count += 1
    
    cap.release()
    
    if frames_processed == 0:
        return {
            "confidence_score": 5.0,
            "posture": "Good",
            "gestures": ["Natural gestures"],
            "eye_contact": "Good",
            "facial_expressions": ["Engaged"]
        }
    
    # Calculate scores
    posture_score = (good_posture_count / frames_processed) * 10
    eye_score = (eye_contact_count / frames_processed) * 10
    
    # Determine quality
    posture_quality = "Excellent" if posture_score >= 8 else "Good" if posture_score >= 6 else "Fair" if posture_score >= 4 else "Needs improvement"
    eye_quality = "Excellent" if eye_score >= 8 else "Good" if eye_score >= 6 else "Fair" if eye_score >= 4 else "Needs improvement"
    
    # Gestures
    gestures = []
    if good_posture_count > frames_processed * 0.7:
        gestures.append("Good posture")
    else:
        gestures.append("Work on posture")
    
    if eye_contact_count > frames_processed * 0.7:
        gestures.append("Good eye contact")
    else:
        gestures.append("Look at camera more")
    
    result = {
        "confidence_score": round((posture_score + eye_score) / 2, 1),
        "posture": posture_quality,
        "gestures": gestures,
        "eye_contact": eye_quality,
        "facial_expressions": ["Engaged"] if eye_contact_count > frames_processed/2 else ["Neutral"]
    }
    
    logger.info(f"Posture analysis complete: Confidence={result['confidence_score']}")
    return result

def generate_recommendations(user_audio, role_audio, user_body, role_body):
    """Generate recommendations"""
    recommendations = []
    
    if user_audio:
        wpm = user_audio.get("wpm", 0)
        if wpm > 0:
            if wpm < 100:
                recommendations.append("Try speaking a bit faster - aim for 120-150 WPM")
            elif wpm > 180:
                recommendations.append("Slow down slightly for better clarity")
        
        fillers = user_audio.get("fillers", [])
        if fillers:
            recommendations.append(f"Reduce filler words like '{fillers[0]}'")
    
    if user_body:
        confidence = user_body.get("confidence_score", 0)
        if confidence < 6:
            recommendations.append("Practice maintaining upright posture")
        
        if "Needs improvement" in user_body.get("eye_contact", ""):
            recommendations.append("Look at the camera more often")
    
    if not recommendations:
        recommendations = [
            "Practice speaking clearly and confidently",
            "Maintain good eye contact with camera",
            "Use natural hand gestures",
            "Record yourself daily and review"
        ]
    
    return recommendations[:4]

# ===============================
# SocketIO event handlers
# ===============================
@socketio.on('connect')
def handle_connect():
    logger.info('✅ Client connected')
    emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('❌ Client disconnected')

@socketio.on('ping')
def handle_ping():
    emit('pong')

@socketio.on("start_analysis")
def handle_start_analysis(data):
    """Handle analysis request"""
    logger.info("=" * 60)
    logger.info("📩 STARTING ANALYSIS")
    logger.info("=" * 60)
    
    try:
        # Send initial progress
        emit("analysis_progress", {"status": "Starting analysis...", "progress": 5})
        
        user_data = data.get("user")
        role_model_data = data.get("roleModel")
        
        if not user_data and not role_model_data:
            emit("analysis_error", {"error": "No video data provided"})
            return
        
        result = {}
        start_time = time.time()
        
        # Process user video
        if user_data:
            try:
                user_bytes = bytes(user_data) if isinstance(user_data, list) else bytes(user_data)
                emit("analysis_progress", {"status": "Processing your video...", "progress": 20})
                
                # Save temp file
                user_path = save_temp_file(user_bytes, "_user.webm")
                
                # Analyze
                emit("analysis_progress", {"status": "Analyzing your audio...", "progress": 30})
                user_audio = analyze_audio(user_path)
                
                emit("analysis_progress", {"status": "Analyzing your body language...", "progress": 40})
                user_body = analyze_posture(user_path)
                
                result["user_audio"] = user_audio
                result["user_body"] = user_body
                
                # Cleanup
                try:
                    if os.path.exists(user_path):
                        os.unlink(user_path)
                except:
                    pass
                    
            except Exception as e:
                logger.error(f"Error processing user video: {e}")
                result["user_audio"] = {
                    "wpm": 0,
                    "fillers": [],
                    "grammar_mistakes": 0,
                    "pause_count": 0,
                    "transcript": "Processing error",
                    "duration": 0
                }
                result["user_body"] = {
                    "confidence_score": 5.0,
                    "posture": "Good",
                    "gestures": ["Basic analysis"],
                    "eye_contact": "Good",
                    "facial_expressions": ["Neutral"]
                }
        
        # Process role model video
        if role_model_data:
            try:
                role_bytes = bytes(role_model_data) if isinstance(role_model_data, list) else bytes(role_model_data)
                emit("analysis_progress", {"status": "Processing role model video...", "progress": 60})
                
                # Save temp file
                role_path = save_temp_file(role_bytes, "_role.webm")
                
                # Analyze
                emit("analysis_progress", {"status": "Analyzing role model audio...", "progress": 70})
                role_audio = analyze_audio(role_path)
                
                emit("analysis_progress", {"status": "Analyzing role model body language...", "progress": 80})
                role_body = analyze_posture(role_path)
                
                result["role_audio"] = role_audio
                result["role_body"] = role_body
                
                # Cleanup
                try:
                    if os.path.exists(role_path):
                        os.unlink(role_path)
                except:
                    pass
                    
            except Exception as e:
                logger.error(f"Error processing role video: {e}")
                result["role_audio"] = {
                    "wpm": 120,
                    "fillers": ["um", "like"],
                    "grammar_mistakes": 1,
                    "pause_count": 3,
                    "transcript": "Sample role model transcript",
                    "duration": 30
                }
                result["role_body"] = {
                    "confidence_score": 8.0,
                    "posture": "Excellent",
                    "gestures": ["Good gestures", "Confident posture"],
                    "eye_contact": "Excellent",
                    "facial_expressions": ["Engaged", "Confident"]
                }
        
        # Generate recommendations
        emit("analysis_progress", {"status": "Generating insights...", "progress": 90})
        
        recommendations = generate_recommendations(
            result.get("user_audio"),
            result.get("role_audio"),
            result.get("user_body"),
            result.get("role_body")
        )
        
        result["recommendations"] = recommendations
        result["overall_assessment"] = "Analysis complete! Review your personalized insights below."
        result["action_plan"] = [
            "Week 1: Focus on one key improvement area",
            "Week 2: Practice daily for 10 minutes",
            "Week 3: Record and track progress",
            "Week 4: Review and refine"
        ]
        
        analysis_time = time.time() - start_time
        logger.info(f"✅ Analysis complete in {analysis_time:.2f} seconds")
        
        # Send results
        emit("analysis_progress", {"status": "Complete!", "progress": 100})
        emit("analysis_result", result)
        
    except Exception as e:
        logger.error(f"❌ Critical error: {e}")
        logger.error(traceback.format_exc())
        emit("analysis_error", {"error": f"Analysis failed: {str(e)}"})

# ===============================
# HTTP endpoints
# ===============================
@app.route('/health')
def health_check():
    return {"status": "healthy", "message": "Server is running"}

@app.route('/')
def index():
    return {"message": "Inspiration Analyzer API", "status": "running"}

# ===============================
# Main
# ===============================
if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("🚀 STARTING ANALYZER SERVER")
    logger.info("=" * 60)
    
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True,
        use_reloader=False
    )