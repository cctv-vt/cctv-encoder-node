FROM node:16-alpine

WORKDIR /app

RUN apk update && apk add ffmpeg

COPY . .

RUN mkdir -p /app/video-failed /app/video-input /app/video-output

RUN npm install

RUN npm run build

CMD ["npm", "start"]

EXPOSE 3000

EXPOSE 4000