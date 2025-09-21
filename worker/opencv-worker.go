//go:build !aruco
// +build !aruco

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
    isRunning  = true
)

func main() {
    fmt.Println("🚀 ArUco-Free Skylark Worker Starting...")
    fmt.Println("📦 No OpenCV dependencies - 100% Pure Go!")
    
    // Health endpoints
    http.HandleFunc("/health", healthHandler)
    http.HandleFunc("/status", statusHandler)
    http.HandleFunc("/cameras", camerasHandler)
    
    // Start health server
    go func() {
        port := getEnv("PORT", "8080")
        fmt.Printf("🌐 Health server running on port %s\n", port)
        log.Fatal(http.ListenAndServe(":"+port, nil))
    }()
    
    // Start main processing
    startProcessing()
}

func startProcessing() {
    fmt.Println("🎥 Starting face detection simulation...")
    
    // Fetch cameras periodically
    go fetchCamerasLoop()
    
    // Process cameras
    ticker := time.NewTicker(3 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        if isRunning {
            processCameras()
        }
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
    
    if resp.StatusCode != 200 {
        log.Printf("⚠️ Backend returned status: %d", resp.StatusCode)
        return
    }
    
    var cameraList []CameraProcessor
    if err := json.NewDecoder(resp.Body).Decode(&cameraList); err != nil {
        log.Printf("⚠️ Cannot decode cameras: %v", err)
        return
    }
    
    fmt.Printf("📹 Fetched %d cameras from backend\n", len(cameraList))
    
    // Update camera list
    newCameras := make(map[string]*CameraProcessor)
    for _, cam := range cameraList {
        newCameras[cam.ID] = &cam
    }
    cameras = newCameras
    
    // Log active cameras
    activeCount := 0
    for _, cam := range cameras {
        if cam.Enabled {
            activeCount++
        }
    }
    fmt.Printf("📊 Active cameras: %d/%d\n", activeCount, len(cameras))
}

func processCameras() {
    if len(cameras) == 0 {
        // No cameras configured, simulate with demo camera
        simulateDetection("demo-camera", "Demo Camera", "Simulated Location")
        return
    }
    
    for id, camera := range cameras {
        if camera.Enabled {
            go processCamera(id, camera)
        }
    }
}

func processCamera(id string, camera *CameraProcessor) {
    // Simulate realistic face detection processing
    // This simulates:
    // 1. Connecting to RTSP stream 
    // 2. Processing video frames
    // 3. Running face detection algorithms
    // 4. Detecting faces with varying confidence
    
    detectionChance := calculateDetectionChance(camera.RTSPURL)
    
    if shouldDetectFace(detectionChance) {
        faceCount := 1 + (int(time.Now().Unix()) % 3)  // 1-3 faces
        confidence := generateRealisticConfidence()
        
        fmt.Printf("🚨 Face detected: Camera=%s (%s), Faces=%d, Confidence=%.2f\n", 
            camera.Name, camera.Location, faceCount, confidence)
        
        sendAlert(id, confidence, faceCount)
    }
}

func calculateDetectionChance(rtspURL string) float64 {
    // Different detection chances based on camera type
    if rtspURL == "test-camera" || rtspURL == "demo-camera" {
        return 0.6 // 60% chance for demo cameras
    }
    if len(rtspURL) > 0 && rtspURL != "unknown" {
        return 0.3 // 30% chance for real RTSP URLs
    }
    return 0.1 // 10% chance for unknown cameras
}

func shouldDetectFace(chance float64) bool {
    // Use current second and camera-specific factors for "randomness"
    factor := float64(time.Now().Second() % 10) / 10.0
    return factor < chance
}

func generateRealisticConfidence() float64 {
    // Generate realistic confidence values
    baseConfidence := 0.6
    
    // Add time-based variation
    timeVariation := float64(time.Now().Second()%40) / 100.0  // 0.00-0.39
    
    confidence := baseConfidence + timeVariation
    
    // Clamp to realistic range
    if confidence > 0.95 {
        confidence = 0.95
    }
    if confidence < 0.5 {
        confidence = 0.5
    }
    
    return confidence
}

func simulateDetection(cameraID, cameraName, location string) {
    // Simulate detection for demo purposes
    if time.Now().Second() % 8 == 0 { // Every 8 seconds approximately
        confidence := 0.75 + (float64(time.Now().Second()%20))/100.0
        
        fmt.Printf("🚨 Demo detection: %s at %s (Confidence: %.2f)\n", 
            cameraName, location, confidence)
        
        sendAlert(cameraID, confidence, 1)
    }
}

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
    
    if resp.StatusCode == 200 || resp.StatusCode == 201 {
        fmt.Printf("✅ Alert sent: Camera=%s, Faces=%d, Confidence=%.2f\n",
            cameraID, faceCount, confidence)
    } else {
        log.Printf("⚠️ Alert response status: %d", resp.StatusCode)
    }
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    
    status := map[string]interface{}{
        "status":     "healthy",
        "service":    "skylark-worker",
        "type":       "aruco-free",
        "cameras":    len(cameras),
        "timestamp":  time.Now().Format(time.RFC3339),
        "running":    isRunning,
    }
    
    json.NewEncoder(w).Encode(status)
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    activeCameras := 0
    for _, cam := range cameras {
        if cam.Enabled {
            activeCameras++
        }
    }
    
    status := map[string]interface{}{
        "backend_url":      backendURL,
        "total_cameras":    len(cameras),
        "active_cameras":   activeCameras,
        "worker_type":      "pure-go-simulation",
        "no_opencv_deps":   true,
        "aruco_free":       true,
        "uptime":          time.Now().Format(time.RFC3339),
    }
    
    json.NewEncoder(w).Encode(status)
}

func camerasHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(cameras)
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}