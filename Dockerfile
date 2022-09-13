FROM node:17-alpine3.14 AS base
LABEL authors="Zaid <zaid@beanz.ae>"
RUN apk --update add curl

RUN mkdir /app
WORKDIR /app

COPY ["./package.json", "./"]

FROM base AS dependencies
RUN npm set progress=false && npm config set depth 0
ARG NPM_TOKEN
RUN echo "${NPM_TOKEN}" > ~/.npmrc
RUN npm run instprod
RUN cp -R node_modules /prod_node_modules
RUN npm run inst
COPY [".eslintrc.json", "./"]

COPY src ./src
RUN npm run lint
RUN npm run build

# FROM dependencies AS test
# COPY test ./test
# RUN npm run test

FROM base AS release
COPY --from=dependencies /prod_node_modules ./node_modules
COPY --from=dependencies /app/dist ./dist
EXPOSE 80

CMD ["node", "dist"]