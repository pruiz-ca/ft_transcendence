FROM node:17-alpine

# Sets default directory for all commands
WORKDIR /ft_transcendence

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy backend folder to container workdir
COPY . .

RUN npm run build

# Expose port
EXPOSE 3000

# Blocking command
CMD [ "node", "dist/main.js" ]
