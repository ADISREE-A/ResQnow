#!/usr/bin/env python3
"""
AI Video Analyzer for Emergency Evidence
Analyzes video files to extract key information for police
"""

import cv2
import os
import sys
import json
import subprocess
from datetime import datetime

# Try to import optional libraries
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import speech_recognition as sr
    HAS_SPEECH = True
except ImportError:
    HAS_SPEECH = False

class VideoAnalyzer:
    def __init__(self, video_path, output_dir="backend/uploads"):
        self.video_path = video_path
        self.output_dir = output_dir
        self.analysis_results = {
            "file_name": os.path.basename(video_path),
            "analysis_timestamp": datetime.now().isoformat(),
            "video_info": {},
            "keyframes": [],
            "audio_transcript": "",
            "detected_objects": [],
            "emergency_indicators": [],
            "situation_summary": "",
            "help_needed": [],
            "confidence_score": 0
        }
    
    def get_video_info(self):
        """Extract basic video information"""
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            return False
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        self.analysis_results["video_info"] = {
            "fps": round(fps, 2),
            "frame_count": frame_count,
            "duration_seconds": round(duration, 2),
            "resolution": f"{width}x{height}",
            "width": width,
            "height": height
        }
        
        cap.release()
        return True
    
    def extract_keyframes(self, num_frames=5):
        """Extract key frames from the video"""
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            return []
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        interval = max(1, total_frames // num_frames)
        
        keyframes = []
        frame_idx = 0
        extracted = 0
        
        while extracted < num_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if ret:
                # Save frame
                frame_filename = f"frame_{extracted}_{frame_idx}.jpg"
                frame_path = os.path.join(self.output_dir, frame_filename)
                cv2.imwrite(frame_path, frame)
                
                keyframes.append({
                    "frame_number": frame_idx,
                    "timestamp_seconds": round(frame_idx / self.analysis_results["video_info"]["fps"], 2),
                    "file": frame_filename,
                    "analysis": self.analyze_frame(frame)
                })
                extracted += 1
            
            frame_idx += interval
            if frame_idx >= total_frames:
                break
        
        cap.release()
        self.analysis_results["keyframes"] = keyframes
        return keyframes
    
    def analyze_frame(self, frame):
        """Analyze a single frame for emergency indicators"""
        if not HAS_NUMPY:
            return {"objects": [], "emergency_signs": [], "scene_type": "unknown"}
        
        # Simple color-based analysis
        h, w, _ = frame.shape
        
        # Convert to different color spaces
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        analysis = {
            "brightness": float(np.mean(gray)),
            "scene_type": "unknown",
            "emergency_signs": []
        }
        
        # Detect red colors (often indicates emergency lights)
        red_lower = np.array([0, 100, 100])
        red_upper = np.array([10, 255, 255])
        red_mask = cv2.inRange(hsv, red_lower, red_upper)
        red_pixels = cv2.countNonZero(red_mask)
        
        if red_pixels > (h * w * 0.05):
            analysis["emergency_signs"].append("red_lights")
            analysis["scene_type"] = "emergency"
        
        # Detect blue colors (police lights)
        blue_lower = np.array([100, 100, 100])
        blue_upper = np.array([130, 255, 255])
        blue_mask = cv2.inRange(hsv, blue_lower, blue_upper)
        blue_pixels = cv2.countNonZero(blue_mask)
        
        if blue_pixels > (h * w * 0.03):
            analysis["emergency_signs"].append("blue_lights")
            analysis["scene_type"] = "police_response"
        
        # Detect fire/orange colors
        orange_lower = np.array([10, 100, 100])
        orange_upper = np.array([25, 255, 255])
        orange_mask = cv2.inRange(hsv, orange_lower, orange_upper)
        orange_pixels = cv2.countNonZero(orange_mask)
        
        if orange_pixels > (h * w * 0.1):
            analysis["emergency_signs"].append("fire_orange")
            analysis["scene_type"] = "fire"
        
        # Detect water/flood colors
        cyan_lower = np.array([80, 100, 100])
        cyan_upper = np.array([100, 255, 255])
        cyan_mask = cv2.inRange(hsv, cyan_lower, cyan_upper)
        cyan_pixels = cv2.countNonZero(cyan_mask)
        
        if cyan_pixels > (h * w * 0.15):
            analysis["emergency_signs"].append("water_flood")
            analysis["scene_type"] = "flood"
        
        # Low light detection
        if analysis["brightness"] < 50:
            analysis["emergency_signs"].append("low_light")
        
        # High contrast (possible distress)
        contrast = float(np.std(gray))
        if contrast > 80:
            analysis["emergency_signs"].append("high_activity")
        
        return analysis
    
    def extract_audio_transcript(self):
        """Extract audio and attempt transcription"""
        if not HAS_SPEECH:
            self.analysis_results["audio_transcript"] = "[Speech recognition not available - install pyaudio]"
            return
        
        try:
            # Extract audio using ffmpeg
            audio_path = self.video_path.replace('.webm', '.wav').replace('.mp4', '.wav')
            
            # Try to extract audio (requires ffmpeg)
            try:
                subprocess.run([
                    'ffmpeg', '-i', self.video_path, 
                    '-vn', '-acodec', 'pcm_s16le', 
                    '-ar', '16000', '-ac', '1', audio_path,
                    '-y'
                ], capture_output=True)
            except:
                pass
            
            if os.path.exists(audio_path):
                recognizer = sr.Recognizer()
                with sr.AudioFile(audio_path) as source:
                    audio = recognizer.record(source)
                
                try:
                    transcript = recognizer.recognize_google(audio)
                    self.analysis_results["audio_transcript"] = transcript
                except sr.UnknownValueError:
                    self.analysis_results["audio_transcript"] = "[Speech not understood]"
                except sr.RequestError:
                    self.analysis_results["audio_transcript"] = "[Speech API unavailable]"
                
                # Clean up
                try:
                    os.remove(audio_path)
                except:
                    pass
            else:
                self.analysis_results["audio_transcript"] = "[Could not extract audio]"
        except Exception as e:
            self.analysis_results["audio_transcript"] = f"[Error: {str(e)}]"
    
    def generate_summary(self):
        """Generate AI summary based on analysis"""
        keyframes = self.analysis_results["keyframes"]
        
        if not keyframes:
            self.analysis_results["situation_summary"] = "Could not analyze video"
            return
        
        # Count emergency signs
        emergency_signs = []
        scene_types = []
        
        for kf in keyframes:
            analysis = kf.get("analysis", {})
            emergency_signs.extend(analysis.get("emergency_signs", []))
            if analysis.get("scene_type") != "unknown":
                scene_types.append(analysis["scene_type"])
        
        # Determine primary emergency type
        scene_type = "unknown"
        if scene_types:
            scene_type = max(set(scene_types), key=scene_types.count)
        
        # Generate summary
        summaries = {
            "fire": "🔥 FIRE EMERGENCY detected. Orange/red tones and fire indicators visible in the video. Immediate fire response needed.",
            "flood": "🌊 FLOOD EMERGENCY detected. Water visible in the video. High water level indicators present.",
            "police_response": "🚔 POLICE RESPONSE in progress. Blue emergency lights detected. Law enforcement activity visible.",
            "emergency": "🚨 GENERAL EMERGENCY detected. Red emergency lights or indicators visible in the video.",
            "unknown": "📹 EMERGENCY VIDEO - No specific emergency type clearly detected. Manual review recommended."
        }
        
        self.analysis_results["situation_summary"] = summaries.get(scene_type, summaries["unknown"])
        
        # Determine help needed
        help_needed = []
        if "fire" in scene_type or "fire_orange" in emergency_signs:
            help_needed.extend(["Fire department", "Emergency medical services"])
        if "flood" in scene_type or "water_flood" in emergency_signs:
            help_needed.extend(["Rescue team", "Emergency shelter"])
        if "police" in scene_type:
            help_needed.append("Additional police units")
        
        if not help_needed:
            help_needed = ["Police patrol", "Medical unit if injuries visible"]
        
        self.analysis_results["help_needed"] = help_needed
        
        # Calculate confidence
        emergency_count = len(set(emergency_signs))
        confidence = min(95, 50 + emergency_count * 15)
        self.analysis_results["confidence_score"] = confidence
    
    def analyze(self):
        """Run full analysis pipeline"""
        print(f"Analyzing video: {self.video_path}")
        
        # Step 1: Get video info
        if not self.get_video_info():
            return {"error": "Could not open video file"}
        
        print("✓ Video info extracted")
        
        # Step 2: Extract and analyze keyframes
        self.extract_keyframes()
        print(f"✓ {len(self.analysis_results['keyframes'])} keyframes extracted")
        
        # Step 3: Extract audio transcript
        self.extract_audio_transcript()
        print("✓ Audio transcript extracted")
        
        # Step 4: Generate summary
        self.generate_summary()
        print("✓ Summary generated")
        
        return self.analysis_results


def main():
    if len(sys.argv) < 2:
        print("Usage: python videoAnalyzer.py <video_file>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"Error: File not found: {video_path}")
        sys.exit(1)
    
    analyzer = VideoAnalyzer(video_path)
    results = analyzer.analyze()
    
    # Output as JSON
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()

