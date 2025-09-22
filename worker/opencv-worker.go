package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"gocv.io/x/gocv"
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
	backendURL       = getEnv("BACKEND_URL", "http://localhost:3001")
	cascPath         = getEnv("CASCADE_PATH", "./haarcascade_frontalface_default.xml")
	videoReadTimeout = 3 * time.Second
	classifier       gocv.CascadeClassifier
)

func main() {
	fmt.Println("🚀 Skylark Worker with Real Face Detection (GoCV) Starting...")

	// Load Haar Cascade Classifier
	classifier = gocv.NewCascadeClassifier()
	if !classifier.Load(cascPath) {
		log.Fatalf("❌ Error loading cascade file: %v", cascPath)
	}
	defer classifier.Close()

	// Example camera (for testing)
	camera := CameraProcessor{
		ID:       "cam1",
		Name:     "IPCam",
		RTSPURL:  "rtsp://192.168.1.50:8554/live.stream", // change this to your RTSP URL
		Enabled:  true,
		Location: "Office Lobby",
	}

	if camera.Enabled {
		processCamera(camera)
	} else {
		log.Println("⚠️ Camera is disabled, skipping...")
	}
}

func processCamera(camera CameraProcessor) {
	webcam, err := gocv.VideoCaptureFile(camera.RTSPURL)
	if err != nil {
		log.Printf("⚠️ Error opening RTSP stream for %s: %v\n", camera.Name, err)
		return
	}
	defer webcam.Close()

	img := gocv.NewMat()
	defer img.Close()

	for {
		if ok := webcam.Read(&img); !ok || img.Empty() {
			log.Printf("⚠️ Cannot read frame from %s\n", camera.Name)
			time.Sleep(videoReadTimeout)
			continue
		}

		// Detect faces
		rects := classifier.DetectMultiScale(img)

		if len(rects) > 0 {
			fmt.Printf("🚨 %d faces detected in %s\n", len(rects), camera.Name)

			// Send alert to backend
			sendAlert(camera.ID, 0.95, len(rects))
		}
	}
}

func sendAlert(cameraID string, confidence float64, faceCount int) {
	alert := Alert{
		CameraID:   cameraID,
		Confidence: confidence,
		FaceCount:  faceCount,
		Timestamp:  time.Now(),
	}

	alertData, err := json.Marshal(alert)
	if err != nil {
		log.Printf("❌ Failed to marshal alert: %v", err)
		return
	}

	resp, err := http.Post(backendURL+"/api/alerts",
		"application/json",
		bytes.NewBuffer(alertData))
	if err != nil {
		log.Printf("❌ Failed to send alert: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		log.Printf("⚠️ Backend responded with status: %s", resp.Status)
		return
	}

	fmt.Printf("✅ Alert sent: Camera=%s, Faces=%d, Confidence=%.2f\n",
		cameraID, faceCount, confidence)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
