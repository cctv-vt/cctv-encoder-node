FROM node:16-bullseye

WORKDIR /app

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends ffmpeg

COPY . .

RUN mkdir -p /app/video-failed /app/video-input /app/video-output

RUN mkdir -p /data

RUN ln -s /app/video-failed /data/video-failed

RUN ln -s /app/video-input /data/video-input

RUN ln -s /app/video-output /data/video-output

RUN ln -s /app/conf /data/config

RUN npm install

RUN npm run build

CMD ["npm", "start"]

EXPOSE 3000