FROM node:20-alpine

WORKDIR /app

COPY package.json index.mjs httpsUpstream.mjs ./

ENV NODE_ENV=production
ENV NODE_OPTIONS=--dns-result-order=ipv4first
ENV PORT=8080

EXPOSE 8080

CMD ["node", "index.mjs"]
