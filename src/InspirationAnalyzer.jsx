import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io } from "socket.io-client";

// CSS styles with optimized performance and white text
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
  }
  50% { 
    opacity: 0.8; 
  }
}

@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.9));
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sparkle {
  position: fixed;
  width: 2px;
  height: 2px;
  background: #ffffff;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  animation: sparkle 2s infinite;
  filter: drop-shadow(0 0 3px #ffffff);
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Optimize by reducing animations and using will-change */
.container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  min-height: 100vh;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 1rem;
  background: 
    radial-gradient(circle at 20% 80%, #2d1b69 0%, transparent 50%),
    linear-gradient(135deg, #0f0a1f 0%, #1e0b3e 100%);
  z-index: 1;
  will-change: transform;
}

/* Simplify background effects */
.container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
  background-size: 100px 100px;
  pointer-events: none;
  z-index: 1;
}

.max-w-6xl {
  max-width: 72rem;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 10;
}

.text-center {
  text-align: center;
}

.mb-12 {
  margin-bottom: 2rem;
}

/* HEADINGS - Keep colored */
.header-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #f6f6faff, #ede8f3ff, #eeebf5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
  letter-spacing: 1px;
  animation: glow 3s ease-in-out infinite;
  position: relative;
  display: inline-block;
}

.header-subtitle {
  font-size: 1.1rem;
  max-width: 48rem;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  opacity: 0.9;
  line-height: 1.5;
}

/* ALL OTHER TEXT IN WHITE */
.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

.drop-zone p {
  color: #ffffff;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.drop-zone p[style*="opacity: 0.7"] {
  color: #ffffff;
  opacity: 0.7;
}

.input-text {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  width: 100%;
  font-size: 1rem;
}

.input-text:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3);
}

.input-text::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.video-result-title {
  color: #ffffff;
}

.video-result-channel {
  color: rgba(255, 255, 255, 0.8);
}

.video-preview-title {
  color: #ffffff;
}

.result-content {
  color: #ffffff;
}

.result-content strong {
  color: #ffffff;
  opacity: 1;
}

.result-content br {
  margin-bottom: 0.5rem;
  display: block;
}

.result-list li {
  color: #ffffff;
}

.status-message {
  color: #ffffff;
}

.quick-result-title {
  color: #ffffff;
}

.quick-result-subtext {
  color: rgba(255, 255, 255, 0.8);
}

/* Rest of the styles with white text updates */
.grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .grid-md-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.card {
  background: rgba(40, 40, 80, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(168, 85, 247, 0.3);
  transition: all 0.2s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.card:hover {
  background: rgba(50, 50, 100, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4);
  border-color: rgba(168, 85, 247, 0.5);
}

.tab-nav {
  display: flex;
  margin-bottom: 1rem;
  background: rgba(50, 50, 100, 0.5);
  border-radius: 1rem;
  padding: 3px;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.tab-button {
  flex: 1;
  padding: 0.5rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.tab-button.active {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.drop-zone {
  border: 2px dashed rgba(168, 85, 247, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(30, 30, 70, 0.3);
}

.drop-zone:hover {
  border-color: rgba(168, 85, 247, 0.6);
  background: rgba(40, 40, 90, 0.4);
}

.drop-zone-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.8;
  color: #a855f7;
}

.drop-zone-button {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #ffffff;
  padding: 0.5rem 1.5rem;
  border-radius: 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.drop-zone-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(139, 92, 246, 0.4);
}

.flex-gap-2 {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.youtube-search-button {
  background: linear-gradient(135deg, #ec4899, #db2777);
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  color: white;
  cursor: pointer;
  white-space: nowrap;
}

.youtube-search-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(236, 72, 153, 0.4);
}

.loading-text {
  text-align: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.search-results {
  max-height: 20rem;
  overflow-y: auto;
}

.video-result {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  background: rgba(40, 40, 80, 0.5);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.video-result:hover {
  background: rgba(50, 50, 100, 0.6);
  transform: translateX(4px);
}

.video-result-thumbnail {
  width: 6rem;
  height: 4rem;
  border-radius: 0.5rem;
  object-fit: cover;
}

.video-result-duration {
  font-size: 0.75rem;
  opacity: 0.75;
  background: rgba(168, 85, 247, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  color: white;
  display: inline-block;
}

.video-preview {
  background: rgba(40, 40, 80, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.video-preview-grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .video-preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.video-preview-player {
  width: 100%;
  max-height: 16rem;
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(168, 85, 247, 0.4);
}

.camera-preview-container {
  position: relative;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 1rem;
  min-height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.camera-preview {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.camera-placeholder {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.camera-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

@media (min-width: 640px) {
  .camera-controls {
    flex-direction: row;
    gap: 0.75rem;
  }
}

.button-base {
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  color: white;
}

.button-start {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.button-stop {
  background: linear-gradient(135deg, #ec4899, #db2777);
}

.button-record {
  background: linear-gradient(135deg, #ec4899, #db2777);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.button-record.recording {
  animation: pulse 1.5s infinite;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.record-timer {
  font-size: 1rem;
  font-weight: bold;
  color: #ffffff;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.analyze-button {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  font-size: 1.1rem;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  font-weight: 600;
}

.analyze-button.enabled:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4);
}

.analyze-button.disabled {
  background: rgba(100, 100, 120, 0.6);
  cursor: not-allowed;
  opacity: 0.7;
}

.results-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.result-card {
  background: rgba(40, 40, 80, 0.8);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.result-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  border-color: rgba(168, 85, 247, 0.5);
}

.result-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #a855f7;
}

.analysis-progress {
  background: rgba(40, 40, 80, 0.8);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1.5rem auto;
  max-width: 500px;
  text-align: center;
  border: 1px solid rgba(168, 85, 247, 0.3);
  animation: fadeInUp 0.3s ease-out;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: rgba(168, 85, 247, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.quick-result-item {
  background: rgba(40, 40, 80, 0.95);
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 0.75rem 0;
  border: 1px solid rgba(168, 85, 247, 0.4);
  animation: fadeInUp 0.2s ease-out;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.quick-result-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #a855f7;
  margin: 0.5rem 0;
}

.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(40, 40, 80, 0.8);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.connection-status.connected {
  background: rgba(21, 128, 61, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.connection-status.disconnected {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(248, 113, 113, 0.4);
  color: #fca5a5;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.retry-button {
  background: rgba(248, 113, 113, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: #fca5a5;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  margin-left: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: rgba(248, 113, 113, 0.3);
  transform: translateY(-1px);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Simplified Sparkles component for better performance
const Sparkles = React.memo(() => {
  const [sparkles] = useState(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2,
    }))
  );

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none', 
      zIndex: 0 
    }}>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
          }}
        />
      ))}
    </div>
  );
});

const ResultsCard = React.memo(({ title, content }) => (
  <div className="result-card">
    <h3 className="result-card-title">{title}</h3>
    <div className="result-content">{content}</div>
  </div>
));

const InspirationAnalyzer = () => {
  // State variables
  const [roleModelTab, setRoleModelTab] = useState('upload');
  const [userTab, setUserTab] = useState('userUpload');
  const [roleModelVideo, setRoleModelVideo] = useState(null);
  const [userVideo, setUserVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [recordTimer, setRecordTimer] = useState('00:00');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState({
    status: '',
    progress: 0,
    stage: ''
  });
  const [quickResults, setQuickResults] = useState([]);

  const roleModelInputRef = useRef(null);
  const userInputRef = useRef(null);
  const previewVideoRef = useRef(null);
  const rolePreviewRef = useRef(null);
  const userPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const socketRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Memoized functions for better performance
  const handleVideoFile = useCallback((file, type) => {
    const url = URL.createObjectURL(file);
    
    if (type === 'roleModel') {
      setRoleModelVideo({ file, url });
      if (rolePreviewRef.current) {
        rolePreviewRef.current.src = url;
      }
    } else if (type === 'user') {
      setUserVideo({ file, url });
      if (userPreviewRef.current) {
        userPreviewRef.current.src = url;
      }
    }
  }, []);

  const handleUpload = useCallback((e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    handleVideoFile(file, type);
  }, [handleVideoFile]);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleVideoFile(file, type);
  }, [handleVideoFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setCameraStream(stream);
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);

  const startTimer = useCallback(() => {
    let seconds = 0;
    recordingTimerRef.current = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setRecordTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      setRecordTimer('00:00');
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      if (!cameraStream) {
        alert('Please start camera first');
        return;
      }

      try {
        const mediaRecorder = new MediaRecorder(cameraStream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setUserVideo({ file: blob, url });
          if (userPreviewRef.current) {
            userPreviewRef.current.src = url;
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        startTimer();
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Could not start recording. Please try again.');
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        stopTimer();
      }
    }
  }, [isRecording, cameraStream, startTimer, stopTimer]);

  const searchYouTube = useCallback(async () => {
    const searchInput = document.getElementById("youtubeSearchInput");
    const query = searchInput?.value;

    if (!query) return;

    setIsSearching(true);

    try {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
          query
        )}&key=AIzaSyB5Ls3LMJDATLgBAC-Mcv7pmyJYaS7P8jg`
      );

      const searchData = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const videoIds = searchData.items.map((item) => item.id.videoId).filter(Boolean);

      let durationMap = {};
      if (videoIds.length > 0) {
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
            ","
          )}&key=AIzaSyB5Ls3LMJDATLgBAC-Mcv7pmyJYaS7P8jg`
        );
        const detailsData = await detailsResponse.json();

        detailsData.items.forEach((item) => {
          durationMap[item.id] = formatDuration(item.contentDetails.duration);
        });
      }

      const results = searchData.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        duration: durationMap[item.id.videoId] || "Unavailable",
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("YouTube API Error:", error);
      setSearchResults([]);
    }

    setIsSearching(false);
  }, []);

  function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  const selectVideo = useCallback((video) => {
    setRoleModelVideo({ 
      url: `https://www.youtube.com/embed/${video.id}`, 
      isYoutube: true,
      title: video.title,
      videoId: video.id
    });
  }, []);

  // Optimized analysis start with immediate results
  const startAnalysis = useCallback(() => {
    if (!roleModelVideo && !userVideo) {
      alert("Please upload at least one video before starting analysis");
      return;
    }
    
    if (!socketConnected) {
      alert("Not connected to server. Please check your connection.");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress({
      status: 'Starting analysis...',
      progress: 10,
      stage: 'initializing'
    });
    setQuickResults([]);
    setAnalysisResult(null);

    // Show immediate quick results for better UX
    setQuickResults([
      {
        title: 'Initializing',
        value: '⚡',
        subtext: 'Preparing analysis...',
        type: 'status'
      }
    ]);

    // Simulate progress for better UX
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev.progress >= 90) {
          return prev;
        }
        return {
          ...prev,
          progress: prev.progress + 5,
          stage: prev.progress < 30 ? 'audio' : 
                 prev.progress < 60 ? 'posture' : 'recommendations'
        };
      });
    }, 1000);

    const readFileAsArrayBuffer = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

    const sendVideos = async () => {
      try {
        // Prepare data to send
        const dataToSend = {};
        
        if (userVideo?.file) {
          dataToSend.user = await readFileAsArrayBuffer(userVideo.file);
        }
        
        if (roleModelVideo?.file) {
          dataToSend.roleModel = await readFileAsArrayBuffer(roleModelVideo.file);
        }

        // For YouTube videos, we need to handle differently
        if (roleModelVideo?.isYoutube && roleModelVideo.videoId) {
          // You might want to fetch the video or handle YouTube URLs differently
          console.log('YouTube video selected:', roleModelVideo.videoId);
          // For now, we'll still send the video ID for reference
          dataToSend.roleModelYoutubeId = roleModelVideo.videoId;
        }

        // Emit to socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("start_analysis", dataToSend);
          
          setQuickResults([
            {
              title: 'Processing',
              value: '📤',
              subtext: 'Videos sent to server',
              type: 'status'
            }
          ]);
        } else {
          throw new Error("Socket not connected");
        }
      } catch (error) {
        console.error("Error processing videos:", error);
        setIsAnalyzing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setAnalysisProgress({ status: '', progress: 0, stage: '' });
        setConnectionError("Error processing videos. Please try again.");
      }
    };

    sendVideos();

    // Fallback timeout
    setTimeout(() => {
      if (isAnalyzing && !analysisResult) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setIsAnalyzing(false);
        setConnectionError("Analysis taking longer than expected. Please check server connection.");
      }
    }, 60000); // 60 second timeout

  }, [roleModelVideo, userVideo, socketConnected, isAnalyzing, analysisResult]);

  // Socket connection effect
  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }

      // Use localhost with explicit port and transports
      const socket = io("http://localhost:5000", {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        withCredentials: false,
        path: '/socket.io/'
      });

      socketRef.current = socket;

      // Connection handlers
      socket.on("connect", () => {
        console.log("✅ Connected to server");
        setSocketConnected(true);
        setConnectionError("");
        setReconnectAttempts(0);
      });
      
      socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from server:", reason);
        setSocketConnected(false);
        
        if (reason === "io server disconnect") {
          // Server disconnected us, try to reconnect manually
          setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Connection error:", error.message);
        setSocketConnected(false);
        setConnectionError(`Cannot connect to server. Make sure the backend is running on port 5000.`);
        setReconnectAttempts(prev => prev + 1);
      });

      socket.on("reconnect_attempt", (attempt) => {
        console.log(`Reconnection attempt ${attempt}`);
      });

      socket.on("reconnect", (attempt) => {
        console.log(`Reconnected after ${attempt} attempts`);
        setSocketConnected(true);
        setConnectionError("");
      });

      socket.on("reconnect_failed", () => {
        console.error("Failed to reconnect");
        setConnectionError("Failed to connect. Please refresh the page.");
      });

      // Analysis event handlers
      socket.on("analysis_progress", (data) => {
        console.log("📊 Analysis progress:", data);
        setAnalysisProgress(prev => ({
          ...prev,
          status: data.status || prev.status,
          progress: data.progress || prev.progress,
          stage: data.stage || prev.stage
        }));
      });

      socket.on("quick_result", (data) => {
        console.log("⚡ Quick result:", data);
        setQuickResults(prev => {
          const newResults = [...prev, data];
          // Keep only last 5 results
          return newResults.slice(-5);
        });
      });

      socket.on("analysis_result", (data) => {
        console.log("📩 Analysis Result received:", data);
        setAnalysisResult(data);
        setIsAnalyzing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setAnalysisProgress({ status: 'Complete!', progress: 100, stage: 'complete' });
        
        // Clear quick results after 8 seconds
        setTimeout(() => {
          setQuickResults([]);
        }, 8000);
      });
      
      socket.on("analysis_error", (error) => {
        console.error("Analysis error:", error);
        setIsAnalyzing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setConnectionError(error.error || "Analysis failed");
      });

      return socket;
    };

    const socket = initializeSocket();

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      stopCamera();
      stopTimer();
      
      // Clean up video URLs
      if (roleModelVideo?.url && roleModelVideo.url.startsWith('blob:')) {
        URL.revokeObjectURL(roleModelVideo.url);
      }
      if (userVideo?.url && userVideo.url.startsWith('blob:')) {
        URL.revokeObjectURL(userVideo.url);
      }
    };
  }, [stopCamera, stopTimer]);

  const canAnalyze = (roleModelVideo || userVideo) && socketConnected;

  const formatTranscript = (transcript) => {
    if (!transcript) return "No transcript available";
    
    const errorKeywords = ["could not transcribe", "unavailable", "failed", "no speech", "too quiet", "empty", "not found"];
    if (errorKeywords.some(keyword => transcript.toLowerCase().includes(keyword))) {
      return transcript;
    }
    
    if (transcript.length > 200) {
      return transcript.substring(0, 200) + "...";
    }
    
    return transcript;
  };

  const handleRetryConnection = useCallback(() => {
    setConnectionError("");
    setReconnectAttempts(0);
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      window.location.reload();
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Sparkles />
      
      <div className="container">
        <div className="max-w-6xl">
          {/* Quick Results Display */}
          {quickResults.length > 0 && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              maxWidth: '280px',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              {quickResults.map((result, index) => (
                <div 
                  key={index}
                  className="quick-result-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="quick-result-title">{result.title}</div>
                  <div className="quick-result-value">{result.value}</div>
                  <div className="quick-result-subtext">{result.subtext}</div>
                </div>
              ))}
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="header-title">
              TalkGenius - Inspiration Analyzer
            </h1>
            <p className="header-subtitle">
              Upload your role model's video/your video/both to get personalized recommendations on how you can be like your role model!
            </p>
            
            {/* Connection Status */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
                <span className="status-dot"></span>
                {socketConnected ? 'Connected to server' : 'Disconnected'}
                {!socketConnected && reconnectAttempts > 0 && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '0.25rem' }}>
                    (Attempt {reconnectAttempts}/5)
                  </span>
                )}
              </div>
            </div>
            
            {/* Error Display */}
            {connectionError && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(220, 38, 38, 0.2)',
                color: '#fca5a5',
                borderRadius: '0.5rem',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <span>⚠️</span>
                <span>{connectionError}</span>
                <button 
                  onClick={handleRetryConnection}
                  className="retry-button"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="grid grid-md-2">
            {/* Role Model Video */}
            <div className="card">
              <h3 className="card-title">Your Role Model's Video</h3>
              
              <div className="tab-nav">
                {['upload', 'url', 'youtube'].map((tab) => (
                  <button
                    key={tab}
                    className={`tab-button ${roleModelTab === tab ? 'active' : ''}`}
                    onClick={() => setRoleModelTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {roleModelTab === 'upload' && (
                <div 
                  className="drop-zone"
                  onDrop={(e) => handleDrop(e, 'roleModel')}
                  onDragOver={handleDragOver}
                >
                  <div className="drop-zone-icon">📁</div>
                  <p>Drag & drop your role model's video here</p>
                  <p style={{ opacity: '0.7' }}>or</p>
                  <input
                    ref={roleModelInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleUpload(e, 'roleModel')}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="drop-zone-button"
                    onClick={() => roleModelInputRef.current?.click()}
                  >
                    Choose File
                  </button>
                </div>
              )}

              {roleModelTab === 'url' && (
                <div>
                  <div className="flex-gap-2">
                    <input
                      id="videoUrlInput"
                      type="url"
                      placeholder="Paste video URL here"
                      className="input-text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!videoUrl) return;
                        if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
                          let videoId = "";
                          if (videoUrl.includes("v=")) {
                            videoId = new URL(videoUrl).searchParams.get("v");
                          } else if (videoUrl.includes("youtu.be/")) {
                            videoId = videoUrl.split("youtu.be/")[1];
                          }
                          setRoleModelVideo({
                            url: `https://www.youtube.com/embed/${videoId}`,
                            isYoutube: true,
                            title: "YouTube Video",
                            videoId: videoId
                          });
                        } else {
                          setRoleModelVideo({
                            url: videoUrl,
                            isYoutube: false,
                            title: "Custom Video"
                          });
                        }
                        setVideoUrl("");
                      }}
                      className="youtube-search-button"
                    >
                      Load
                    </button>
                  </div>
                </div>
              )}

              {roleModelTab === 'youtube' && (
                <div>
                  <div className="flex-gap-2">
                    <input
                      id="youtubeSearchInput"
                      type="search"
                      placeholder="Search YouTube"
                      className="input-text"
                      onKeyPress={(e) => e.key === 'Enter' && searchYouTube()}
                    />
                    <button
                      onClick={searchYouTube}
                      className="youtube-search-button"
                      disabled={isSearching}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  
                  {isSearching && (
                    <div className="loading-text">
                      <span className="loading-spinner"></span>
                      Searching YouTube...
                    </div>
                  )}
                  
                  <div className="search-results">
                    {searchResults.map((video) => (
                      <div
                        key={video.id}
                        className="video-result"
                        onClick={() => selectVideo(video)}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="video-result-thumbnail"
                        />
                        <div style={{ flex: 1 }}>
                          <h4 className="video-result-title" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                            {video.title.length > 40 ? video.title.substring(0, 40) + '...' : video.title}
                          </h4>
                          <p className="video-result-channel" style={{ fontSize: '0.8rem' }}>{video.channel}</p>
                          <span className="video-result-duration">{video.duration}</span>
                        </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && !isSearching && (
                      <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.7 }}>
                        Search for videos to see results
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Video */}
            <div className="card">
              <h3 className="card-title">Your Video</h3>
              
              <div className="tab-nav">
                {['userUpload', 'userRecord'].map((tab, index) => (
                  <button
                    key={tab}
                    className={`tab-button ${userTab === tab ? 'active' : ''}`}
                    onClick={() => setUserTab(tab)}
                  >
                    {index === 0 ? 'Upload' : 'Record'}
                  </button>
                ))}
              </div>

              {userTab === 'userUpload' && (
                <div 
                  className="drop-zone"
                  onDrop={(e) => handleDrop(e, 'user')}
                  onDragOver={handleDragOver}
                >
                  <div className="drop-zone-icon">📹</div>
                  <p>Drag & drop your video here</p>
                  <p style={{ opacity: '0.7' }}>or</p>
                  <input
                    ref={userInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleUpload(e, 'user')}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="drop-zone-button"
                    onClick={() => userInputRef.current?.click()}
                  >
                    Choose File
                  </button>
                </div>
              )}

              {userTab === 'userRecord' && (
                <div>
                  <div className="camera-preview-container">
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="camera-preview"
                    />
                    {!cameraStream && (
                      <div className="camera-placeholder">
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        <p>Camera Preview</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Click Start Camera to begin</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="camera-controls">
                    <button
                      onClick={startCamera}
                      className="button-base button-start"
                      disabled={!!cameraStream}
                    >
                      {cameraStream ? 'Camera On' : 'Start Camera'}
                    </button>
                    
                    <button
                      onClick={stopCamera}
                      className="button-base button-stop"
                      disabled={!cameraStream}
                    >
                      Stop Camera
                    </button>

                    <button
                      onClick={toggleRecording}
                      className={`button-base button-record ${isRecording ? 'recording' : ''}`}
                      disabled={!cameraStream}
                    >
                      <span style={{ fontSize: '1rem' }}>⚫</span>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    
                    <span className="record-timer">
                      {recordTimer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Preview Section */}
          <div className="video-preview">
            <h3 className="card-title">Video Previews</h3>
            <div className="video-preview-grid">
              
              <div>
                <h4 className="video-preview-title">Role Model</h4>
                {roleModelVideo ? (
                  roleModelVideo.isYoutube ? (
                    <iframe
                      src={roleModelVideo.url}
                      className="video-preview-player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Role model video"
                    />
                  ) : (
                    <video
                      ref={rolePreviewRef}
                      src={roleModelVideo.url}
                      controls
                      className="video-preview-player"
                    />
                  )
                ) : (
                  <div style={{
                    width: "100%",
                    height: "16rem",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255, 255, 255, 0.5)",
                    background: "rgba(0, 0, 0, 0.3)"
                  }}>
                    No video uploaded
                  </div>
                )}
              </div>

              <div>
                <h4 className="video-preview-title">Your Video</h4>
                {userVideo ? (
                  <video
                    ref={userPreviewRef}
                    controls
                    className="video-preview-player"
                    src={userVideo.url}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "16rem",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255, 255, 255, 0.5)",
                    background: "rgba(0, 0, 0, 0.3)"
                  }}>
                    No video uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="analysis-progress">
              <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>🔍 Analyzing Videos...</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                {analysisProgress.status || 'Processing your videos...'}
              </p>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${analysisProgress.progress}%` }}
                />
              </div>
              
              <div style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                {analysisProgress.progress}% Complete
              </div>
              
              {analysisProgress.stage && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                  Stage: {analysisProgress.stage}
                </div>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="results-grid">
              <ResultsCard
                title="Your Audio Analysis"
                content={
                  <>
                    <strong>Speaking Pace:</strong> {analysisResult.user_audio?.wpm || 0} WPM<br />
                    <strong>Filler Words:</strong> {analysisResult.user_audio?.fillers?.length > 0 ? analysisResult.user_audio.fillers.join(", ") : "None detected"}<br />
                    <strong>Grammar Issues:</strong> {analysisResult.user_audio?.grammar_mistakes || 0}<br />
                    <strong>Pauses:</strong> {analysisResult.user_audio?.pause_count || 0}<br />
                    <strong>Duration:</strong> {analysisResult.user_audio?.duration?.toFixed(1) || 0}s<br />
                    <strong>Transcript:</strong> {formatTranscript(analysisResult.user_audio?.transcript)}
                  </>
                }
              />

              {analysisResult.role_audio && (
                <ResultsCard
                  title="Role Model Audio Analysis"
                  content={
                    <>
                      <strong>Speaking Pace:</strong> {analysisResult.role_audio?.wpm || 0} WPM<br />
                      <strong>Filler Words:</strong> {analysisResult.role_audio?.fillers?.length > 0 ? analysisResult.role_audio.fillers.join(", ") : "None detected"}<br />
                      <strong>Grammar Issues:</strong> {analysisResult.role_audio?.grammar_mistakes || 0}<br />
                      <strong>Pauses:</strong> {analysisResult.role_audio?.pause_count || 0}<br />
                      <strong>Duration:</strong> {analysisResult.role_audio?.duration?.toFixed(1) || 0}s<br />
                      <strong>Transcript:</strong> {formatTranscript(analysisResult.role_audio?.transcript)}
                    </>
                  }
                />
              )}

              <ResultsCard
                title="Your Body Language Analysis"
                content={
                  <>
                    <strong>Confidence Score:</strong> {analysisResult.user_body?.confidence_score || 0}/10<br />
                    <strong>Posture:</strong> {analysisResult.user_body?.posture || "N/A"}<br />
                    <strong>Gestures:</strong> {analysisResult.user_body?.gestures?.length > 0 ? analysisResult.user_body.gestures.join(", ") : "None detected"}<br />
                    <strong>Eye Contact:</strong> {analysisResult.user_body?.eye_contact || "N/A"}<br />
                    <strong>Facial Expressions:</strong> {analysisResult.user_body?.facial_expressions?.length > 0 ? analysisResult.user_body.facial_expressions.join(", ") : "Neutral"}
                  </>
                }
              />

              {analysisResult.role_body && (
                <ResultsCard
                  title="Role Model Body Language Analysis"
                  content={
                    <>
                      <strong>Confidence Score:</strong> {analysisResult.role_body?.confidence_score || 0}/10<br />
                      <strong>Posture:</strong> {analysisResult.role_body?.posture || "N/A"}<br />
                      <strong>Gestures:</strong> {analysisResult.role_body?.gestures?.length > 0 ? analysisResult.role_body.gestures.join(", ") : "None detected"}<br />
                      <strong>Eye Contact:</strong> {analysisResult.role_body?.eye_contact || "N/A"}<br />
                      <strong>Facial Expressions:</strong> {analysisResult.role_body?.facial_expressions?.length > 0 ? analysisResult.role_body.facial_expressions.join(", ") : "Neutral"}
                    </>
                  }
                />
              )}

              <ResultsCard
                title="Recommendations"
                content={
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                    {analysisResult.recommendations?.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>{rec}</li>
                    )) || "No recommendations available"}
                  </ul>
                }
              />

             

              {analysisResult.action_plan && (
                <ResultsCard
                  title="30-Day Action Plan"
                  content={
                    <ul style={{ listStyleType: 'decimal', paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                      {analysisResult.action_plan?.map((step, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{step}</li>
                      ))}
                    </ul>
                  }
                />
              )}
            </div>
          )}

          {/* Analyze Button */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <button
              onClick={startAnalysis}
              disabled={!canAnalyze || isAnalyzing}
              className={`analyze-button ${canAnalyze && !isAnalyzing ? 'enabled' : 'disabled'}`}
            >
              {isAnalyzing ? (
                <>
                  <span className="loading-spinner"></span>
                  Analyzing...
                </>
              ) : (
                '🚀 Start Analysis'
              )}
            </button>
            {!socketConnected && (
              <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Waiting for server connection...
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InspirationAnalyzer;