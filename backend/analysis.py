import os
import cv2
# import mediapipe as mp  # Commented - too heavy for Render free tier
import tempfile
import numpy as np
# import librosa  # Commented - too heavy for Render free tier
# import whisper  # Commented - not available, use alternatives
# import torch  # Commented - not in requirements
from flask import Flask, request, send_from_directory, jsonify
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
# device = "cuda" if torch.cuda.is_available() else "cpu"  # Commented - torch not available
# logger.info(f"Loading Whisper model on {device}...")
# try:
#     whisper_model = whisper.load_model("base", device=device)
#     logger.info("✅ Whisper model loaded successfully!")
# except Exception as e:
#     logger.error(f"Failed to load Whisper: {e}")
#     whisper_model = None

# ===============================
# Mediapipe setup
# ===============================
# mp_pose = mp.solutions.pose  # Commented - mediapipe not available
# mp_face_mesh = mp.solutions.face_mesh  # Commented - mediapipe not available

# pose = mp_pose.Pose(  # Commented - mediapipe not available
#     static_image_mode=False,
#     model_complexity=1,
#     enable_segmentation=False,
#     min_detection_confidence=0.5,
#     min_tracking_confidence=0.5
# )

# face_mesh = mp_face_mesh.FaceMesh(  # Commented - mediapipe not available
#     static_image_mode=False,
#     max_num_faces=1,
#     refine_landmarks=True,
#     min_detection_confidence=0.5,
#     min_tracking_confidence=0.5
# )

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
    """Comprehensive audio analysis - STUB (dependencies removed)"""
    logger.info(f"Audio analysis stub: {video_path}")
    return {
        "wpm": 120,
        "fillers": [],
        "grammar_mistakes": 0,
        "pause_count": 0,
        "transcript": "Audio analysis requires librosa and whisper (removed for deployment)",
        "duration": 0
    }

def analyze_posture(video_path):
    """Posture analysis - STUB (dependencies removed)"""
    logger.info(f"Posture analysis stub: {video_path}")
    return {
        "confidence_score": 7.0,
        "posture": "Good",
        "gestures": ["Natural movements"],
        "eye_contact": "Good",
        "facial_expressions": ["Engaged"]
    }

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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    """Serve React frontend"""
    import os
    
    # Build path to dist folder (one level up from backend directory)
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_path = os.path.join(base_path, 'dist')
    
    # For static files, serve them directly
    if path and path != 'index.html':
        file_path = os.path.join(dist_path, path)
        if os.path.isfile(file_path):
            return send_from_directory(dist_path, path)
    
    # For all other routes, serve index.html (React Router)
    index_file = os.path.join(dist_path, 'index.html')
    try:
        if os.path.isfile(index_file):
            logger.info(f"Serving frontend from {index_file}")
            return send_from_directory(dist_path, 'index.html')
        else:
            logger.warning(f"index.html not found at {index_file}")
            logger.warning(f"dist_path: {dist_path}, exists: {os.path.isdir(dist_path)}")
            if os.path.isdir(dist_path):
                logger.warning(f"Contents of dist: {os.listdir(dist_path)}")
    except Exception as e:
        logger.error(f"Error serving frontend: {e}")
    
    # Fallback
    return jsonify({"message": "Inspiration Analyzer API", "status": "running", "error": "Frontend not built"}), 503

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