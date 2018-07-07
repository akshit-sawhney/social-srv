FROM node:8.9.4

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

# Install app dependencies
COPY .npmrc /usr/src/app/
COPY package.json /usr/src/app/
RUN npm cache verify
RUN npm update


EXPOSE 10007
EXPOSE 20007
CMD [ "npm", "start" ]
