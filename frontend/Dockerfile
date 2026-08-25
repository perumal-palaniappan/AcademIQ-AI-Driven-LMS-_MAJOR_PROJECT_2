# Stage 1 - Build

FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2 - Nginx

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173
#start the nginx and apply the daemon OFF
CMD ["nginx", "-g", "daemon off;"]