FROM golang:1.21-bullseye

# Install OpenCV
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN go mod tidy
RUN go build -o worker opencv-worker.go

EXPOSE 8080

CMD ["./worker"]