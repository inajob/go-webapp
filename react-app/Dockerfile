FROM node:12.6-alpine

WORKDIR /usr/src/app

RUN apk update && \
    apk add git && \
    apk add --no-cache curl && \
    curl -o- -L https://yarnpkg.com/install.sh | sh

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --only=production

COPY . .

CMD ["yarn", "run", "start"]
