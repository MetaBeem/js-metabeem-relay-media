import chalk from 'chalk';

const usage = `
npm run <command> included in ${ chalk.bold( process.env.npm_package_name ) }:

Usage:

[show help]
npm run ${ chalk.bold( 'help' ) }

[run relay]
npm run ${ chalk.bold( 'start -- --http_port {port} --p2p_port {port} --p2p_peer_id {filename} --p2p_swarm_key {filename}' ) }


examples:
1) run relay using the configuration in .yml
# npm run start

2) run relay on port ${ chalk.bold( 9011 ) } with peerId ${ chalk.bold( `./peers/.relay1.peerId` ) }:
# npm run start -- --http_port 6612 --p2p_port 9011 --p2p_peer_id ./peers/.relay1.peerId
`
console.log( '%s', usage );
