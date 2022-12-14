# Automatic Video Encoder


## Docker Compose:
You need to create the encoder folder, as well as the subfolders
```
mkdir ./encoder && mkdir \
./encoder/video-input \ 
./encoder/video-output \
./encoder/video-failed \
./encoder/conf \
./encoder/logs
```

```
version: '3.9'
services:
  encoder:
    image: ghcr.io/cctv-vt/cctv-encoder-node:main
    ports:
      - "3900:3000"
      - "4900:4000"
    volumes:
      - type: bind
        source: ./encoder/video-input
        target: /app/video-input
      - type: bind
        source: ./encoder/video-output
        target: /app/video-output
      - type: bind
        source: ./encoder/video-failed
        target: /app/video-failed
      - type: bind
        source: ./encoder/conf
        target: /app/conf
      - type: bind
        source: ./encoder/logs
        target: /app/logs
```

the encoder/video-input folder is where you will place video files