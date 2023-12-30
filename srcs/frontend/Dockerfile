FROM node:17-alpine AS builder

# Sets default directory for all commands
WORKDIR /ft_transcendence

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend folder to container workdir
COPY . .

RUN npm run build

###############################################################################

FROM nginx:alpine

# Sets default directory for all commands
WORKDIR /usr/share/nginx/html

# Remove default nginx configuration
RUN rm -rf ./*

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy static website
COPY --from=builder /ft_transcendence/dist/frontend .

# Expose port
EXPOSE 80

# Blocking command
ENTRYPOINT ["nginx", "-g", "daemon off;"]
