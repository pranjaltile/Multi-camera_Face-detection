import React from 'react';
import './VideoFeed.css';

interface VideoFeedProps {
  cameraId: string;
  cameraName: string;
  rtspUrl: string;
}

export default function VideoFeed({ cameraId, cameraName, rtspUrl }: VideoFeedProps) {
  // Function to extract base URL from RTSP URL for IP Webcam
  const getIpWebcamUrl = (rtspUrl: string) => {
    try {
      // Example RTSP URL: rtsp://192.168.1.100:8080/h264_ulaw.sdp
      const match = rtspUrl.match(/rtsp:\/\/([\d.]+):(\d+)/);
      if (match) {
        const [, ip, port] = match;
        return `http://${ip}:${port}/video`;
      }
    } catch (error) {
      console.error('Error parsing RTSP URL:', error);
    }
    return rtspUrl;
  };

  return (
    <div className="video-feed">
      <img 
        src={getIpWebcamUrl(rtspUrl)}
        alt={`Feed from ${cameraName}`}
        className="camera-video-element"
      />
      <div className="video-overlay">
        <span className="camera-name">{cameraName}</span>
      </div>
    </div>
  );
}