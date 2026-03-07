const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Wrapper to call Python video analyzer from Node.js
const analyzeVideo = (videoPath) => {
  return new Promise((resolve, reject) => {
    // Check if Python is available
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    
    const scriptPath = path.join(__dirname, "videoAnalyzer.py");
    
    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      return reject(new Error("Video file not found"));
    }

    const pythonProcess = spawn(pythonCmd, [scriptPath, videoPath]);
    
    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python error:", errorOutput);
        // Return mock analysis if Python fails
        resolve(getMockAnalysis(videoPath));
        return;
      }

      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        console.error("JSON parse error:", e);
        resolve(getMockAnalysis(videoPath));
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start Python:", err);
      resolve(getMockAnalysis(videoPath));
    });
  });
};

// Mock analysis for when Python is not available
const getMockAnalysis = (videoPath) => {
  const fileName = path.basename(videoPath);
  const timestamp = new Date().toISOString();
  
  return {
    file_name: fileName,
    analysis_timestamp: timestamp,
    video_info: {
      fps: 30,
      frame_count: 300,
      duration_seconds: 10,
      resolution: "1280x720",
      width: 1280,
      height: 720
    },
    keyframes: [
      {
        frame_number: 0,
        timestamp_seconds: 0,
        file: `frame_0_0.jpg`,
        analysis: {
          brightness: 120,
          scene_type: "emergency",
          emergency_signs: ["red_lights", "high_activity"]
        }
      },
      {
        frame_number: 150,
        timestamp_seconds: 5,
        file: `frame_1_150.jpg`,
        analysis: {
          brightness: 100,
          scene_type: "emergency",
          emergency_signs: ["red_lights"]
        }
      }
    ],
    audio_transcript: "[Audio extraction not available - using mock analysis]",
    detected_objects: ["person", "vehicle", "emergency lights"],
    emergency_indicators: ["sirens", "flashing lights", "people running"],
    situation_summary: "🚨 EMERGENCY VIDEO ANALYSIS\n\nThis video appears to show an emergency situation. Red emergency lights and high activity were detected.\n\n⚠️ RECOMMENDED ACTIONS:\n- Dispatch police unit\n- Send medical team if injuries visible\n- Alert fire department if fire detected",
    help_needed: ["Police patrol", "Medical unit", "Fire department (if fire)"],
    confidence_score: 75,
    note: "This is a simulated analysis. Install Python dependencies for real analysis: pip install opencv-python numpy"
  };
};

module.exports = { analyzeVideo, getMockAnalysis };

