FROM node:alpine

ADD * /app/
WORKDIR /app
RUN npm install --only=prod

ENV PORT "8080"
ENV SLACK_TOKEN ""
ENV SLACK_SIGNING_SECRET ""

CMD node .
