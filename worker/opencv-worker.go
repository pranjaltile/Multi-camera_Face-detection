package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type Alert struct {
	CameraID   string    `json:"cameraId"`
	Confidence float64   `json:"confidence"`
	FaceCount  int       `json:"faceCount"`
	Timestamp  time.Time `json:"timestamp"`
}

type CameraProcessor struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	RTSPURL  string `json:"rtspUrl"`
	Enabled  bool   `json:"isEnabled"`
	Location string `json:"location"`
}

var (
	backendURL = getEnv("BACKEND_URL", "http://localhost:3001")
	cameras    = make(map[string]*CameraProcessor)
)

func main() {
	fmt.Println("🚀 Skylark Worker Starting...")
	fmt.Println("✅ Running in Go (no OpenCV deps)")

	// Health + Status endpoints
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/status", statusHandler)

	// Start HTTP server in background
	go func() {
		port := getEnv("PORT", "8080")
		fmt.Printf("🌐 Worker server running on port %s\n", port)
		log.Fatal(http.ListenAndServe(":"+port, nil))
	}()

	// Start camera / alert processing loop
	startProcessing()
}

// -----------------------------------------------------------------------------
// Processing Loop
// -----------------------------------------------------------------------------

func startProcessing() {
	fmt.Println("🎥 Starting face detection simulation...")

	// Fetch cameras periodically
	go fetchCamerasLoop()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		processCameras()
	}
}

func fetchCamerasLoop() {
	// Initial fetch
	fetchCameras()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		fetchCameras()
	}
}

func fetchCameras() {
	resp, err := http.Get(backendURL + "/api/cameras")
	if err != nil {
		log.Printf("⚠️ Cannot fetch cameras: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️ Failed to fetch cameras. Status code: %d", resp.StatusCode)
		return
	}

	var cameraList []CameraProcessor
	if err := json.NewDecoder(resp.Body).Decode(&cameraList); err != nil {
		log.Printf("⚠️ Failed to decode cameras: %v", err)
		return
	}

	fmt.Printf("📹 Found %d cameras from backend\n", len(cameraList))

	newCameras := make(map[string]*CameraProcessor)
	for _, cam := range cameraList {
		newCameras[cam.ID] = &cam
	}
	cameras = newCameras
}

func processCameras() {
	if len(cameras) == 0 {
		// Demo mode
		simulateDetection("demo-camera", "Demo Camera", "Test Location")
		return
	}

	for id, camera := range cameras {
		if camera.Enabled {
			go processCamera(id, camera)
		}
	}
}

func processCamera(id string, camera *CameraProcessor) {
	// Fire a detection about every 8 seconds
	if time.Now().Second()%8 == 0 {
		faceCount := 1
		confidence := 0.75 + (float64(time.Now().Second()%20))/100.0

		fmt.Printf("🚨 Face detected: Camera=%s (%s), Faces=%d, Confidence=%.2f\n",
			camera.Name, camera.Location, faceCount, confidence)

		sendAlert(id, confidence, faceCount)
	} else {
		// Debugging: show that camera is alive even when no detection
		fmt.Printf("ℹ️ Checked camera %s - no face detected this cycle\n", camera.Name)
	}
}

func simulateDetection(cameraID, cameraName, _ string) {
	if time.Now().Second()%10 == 0 {
		fmt.Printf("🚨 Demo detection: %s\n", cameraName)
		sendAlert(cameraID, 0.85, 1)
	} else {
		fmt.Println("ℹ️ Demo mode: no detection this cycle")
	}
}

// -----------------------------------------------------------------------------
// Alerts
// -----------------------------------------------------------------------------

func sendAlert(cameraID string, confidence float64, faceCount int) {
	alert := Alert{
		CameraID:   cameraID,
		Confidence: confidence,
		FaceCount:  faceCount,
		Timestamp:  time.Now(),
	}

	alertData, _ := json.Marshal(alert)

	resp, err := http.Post(backendURL+"/api/alerts",
		"application/json",
		bytes.NewBuffer(alertData))

	if err != nil {
		log.Printf("❌ Failed to send alert: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		log.Printf("⚠️ Backend returned non-OK status: %d", resp.StatusCode)
	} else {
		fmt.Printf("✅ Alert sent to backend: Camera=%s, Faces=%d, Confidence=%.2f\n",
			cameraID, faceCount, confidence)
	}
}

// -----------------------------------------------------------------------------
// Health/Status APIs
// -----------------------------------------------------------------------------

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	status := map[string]interface{}{
		"status":    "healthy",
		"service":   "skylark-worker",
		"cameras":   len(cameras),
		"timestamp": time.Now().Format(time.RFC3339),
	}
	json.NewEncoder(w).Encode(status)
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cameras)
}

// -----------------------------------------------------------------------------
// Environment Helper
// -----------------------------------------------------------------------------

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}