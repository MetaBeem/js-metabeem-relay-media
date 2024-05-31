FROM node:18.19.0

# env variables
ENV HTTP_PORT 6612
ENV P2P_PORT 9011


#   create configuration directory
RUN mkdir /etc/debeem/

#   create a working directory inside the container
WORKDIR /usr/src/app

#   install pm2
RUN npm install -g pm2

#   copy the local package.json to the container
COPY package.json ./

#   install project dependencies
RUN npm install

#   copies all files in the current directory into the container (except those specified in .dockerignore)
COPY . .

#   expose the ports used by the application
EXPOSE ${HTTP_PORT}
EXPOSE ${P2P_PORT}

#   run application inside container
#CMD [ "node", "src/main.js" ]
#CMD [ "pm2-docker", "src/main.js" ]
CMD [ "sh", "-c", "pm2-docker start src/main.js && pm2-docker status" ]
