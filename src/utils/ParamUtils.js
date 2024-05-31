import minimist from "minimist";
import _ from "lodash";
import { ProcessUtil } from "debeem-utils";

const argv = minimist( process.argv.slice( 2 ) );


export class ParamUtils
{
	static getHttpPort()
	{
		let port = ProcessUtil.getParamIntValue( `http_port` );
		if ( ProcessUtil.isValidPortNumber( port ) )
		{
			return port;
		}

		return this.getDefaultHttpPort();
	}

	static getDefaultHttpPort()
	{
		return 8848;
	}

	/**
	 * 	@returns {any}
	 */
	static getRedisOptions()
	{
		return {
			port : ProcessUtil.getParamIntValue( 'REDIS_PORT', 6379 ),
			host : ProcessUtil.getParamStringValue( 'REDIS_HOST', 'host.docker.internal' ),
			username : ProcessUtil.getParamStringValue( 'REDIS_USERNAME', '' ),
			password : ProcessUtil.getParamStringValue( 'REDIS_PASSWORD', '' ),
			db : ProcessUtil.getParamIntValue( 'REDIS_DB', 0 ),
		};
	}


	static getPeers()
	{
		//	http://localhost:1212,http://localhost:1213,http://localhost:1214
		const peerArg = argv.peers || process.env.PEERS;
		if ( ! _.isString( peerArg ) || _.isEmpty( peerArg ) )
		{
			return [];
		}

		//	...
		let peers = [];
		const peerList = peerArg.split( ',' );
		for ( let peer of peerList )
		{
			if ( peer.endsWith( '/' ) )
			{
				peer = peer.slice( 0, -1 );
			}
			peer = peer.trim();
			if ( _.isEmpty( peer ) )
			{
				continue;
			}

			//	...
			peers.push( `${ peer }/gun` );
		}

		return peers;
	}
}
