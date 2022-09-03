FROM node:17-alpine3.14
RUN apk --update add curl

LABEL authors="Zaid <zaid@beanz.ae>"

RUN mkdir /app
WORKDIR /app

COPY ["./package.json", "debug.sh", "./"]
# COPY ["./src/tsconfig.json", "./src/tsconfig.json"]
EXPOSE  80
EXPOSE 5858

ARG NPM_TOKEN
RUN echo "${NPM_TOKEN}" > ~/.npmrc

CMD ["sh", "debug.sh"]
