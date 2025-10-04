FROM node:20-alpine AS build
WORKDIR /ExoHunter
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /ExoHunter/dist/ExoHunter/browser /usr/share/nginx/html
EXPOSE 80
