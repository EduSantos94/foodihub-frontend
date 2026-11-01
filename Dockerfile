# Stage 1: Build Expo web app
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Address of the API baked into the web build (the .env file is not copied into the image).
# In production it is the same address as the site, e.g. https://meuapp.example.com
ARG EXPO_PUBLIC_API_URL=http://localhost:3333
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
