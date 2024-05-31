# MetaBeem Media Relay


## ☀︎ Installation
```shell
$ git clone https://github.com/MetaBeem/js-metabeem-relay-media.git
$ cd js-metabeem-relay-media
$ npm i
```


## ❤︎ Help
```shell
$ npm run help
```


## ⌘ Configuration

### 1, Set up environment variables for Docker
#### 1.1, Set up a default env file from the template
```shell
$ cp .env.docker.default .env
```

#### 1.2, Edit env file
```shell
$ vim .env
```

```shell
# HTTP port for Docker
HTTP_PORT=6612

# P2p port for Docker
P2P_PORT=9011
```


### 2, Set up configurations for Relay
#### 2.1, Set up a default configuration file from the template
```shell
$ cp .yml.default .yml
```

#### 2.2, Edit configuration file
```shell
$ vim .yml
```

```shell
# HTTP
HTTP_PORT: 6612


# P2p
P2P_PORT: 9011
P2P_PEER_ID:
P2P_SWARM_KEY:
P2P_BOOTSTRAPPERS:
  - /ip4/20.243.4.95/tcp/8011/p2p/QmcNvfJHwBudvUCrv5Rbrn4k8e9YJ1oXCDJfrGKwbVMaHM
  - /ip4/20.243.4.88/tcp/8011/p2p/Qmf2VkrcytvBcUYKzwuzxa11iAvC8FNDHQR5sMRJQ8x9d9
P2P_ANNOUNCES:
  - /ip4/40.81.205.197/tcp/9911

# store
STORE_DATABASE_URL : mongodb://192.168.1.186:27017/metabeem


# cache
REDIS_PORT: 6379
REDIS_HOST: 192.168.1.186
REDIS_USERNAME:
REDIS_PASSWORD:
REDIS_DB: 0


# settings
# throat checking interval in milliseconds
THROAT_CHECKING_INTERVAL: 0


#   apm
SW_AGENT_NAME: metabeemRelayMedia
SW_AGENT_INSTANCE_NAME: metabeemMedia
SW_AGENT_COLLECTOR_BACKEND_SERVICES: 192.168.1.186:11800

```



## ◉ Run

### 1, run in production mode
```shell
$ npm run start -- --http_port {port} --p2p_port {port} --p2p_peer_id {filename} --p2p_swarm_key {filename}
```
| arg name        | type   | remark                                      |
|-----------------|--------|---------------------------------------------|
| --http_port     | number | The port number of the media relay          |
| --p2p_port      | number | The port number of the p2p service          |
| --p2p_peer_id   | string | Full filename where peerId data is stored   |
| --p2p_swarm_key | string | Full filename where swarmKey data is stored |

> Notice:
> 
> If the value of the parameter is not specified on the command line, it will read the value from the system environment variable with the same name, which you can configure in the .env file.


## ⎈ Docker
### 1, Run in foreground mode
```shell
$ docker-compose build
$ docker-compose up
```

### 2, Run in background daemon mode
```shell
$ docker-compose build
$ docker-compose up -d
```