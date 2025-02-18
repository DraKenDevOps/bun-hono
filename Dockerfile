FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun add -g pm2
RUN bun install
RUN bun build
COPY . .
EXPOSE 8000
CMD ["bun", "serve"]
