FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8081
COPY --chown=node:node . .
USER node
EXPOSE 8081
CMD ["node", "server.js"]
