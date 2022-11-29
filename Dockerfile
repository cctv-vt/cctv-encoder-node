FROM node:16-bullseye

WORKDIR /app

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends ffmpeg

COPY . .

RUN mkdir -p /app/video-failed /app/video-input /app/video-output

RUN npm install

RUN npm run build

CMD ["npm", "start"]

EXPOSE 3000

EXPOSE 4000