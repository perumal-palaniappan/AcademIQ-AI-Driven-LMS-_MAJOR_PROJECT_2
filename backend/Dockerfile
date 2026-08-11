# install node
FROM node:20-alpine

# inside teh container it will create a app folder
WORKDIR /app

# copying the package.json and install once the production based packages
COPY package*.json .
RUN npm ci --omit=dev --verbose && npm cache clean --force

# copy the source files here
COPY . .

# listening to the BE port
EXPOSE 5000

# start command
CMD ["npm", "start"]
