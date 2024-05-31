import { BaseP2pRelay } from "./BaseP2pRelay.js";
import _ from "lodash";

import "deyml/config";


/**
 * 	@class
 */
export class MediaP2pRelay extends BaseP2pRelay
{
	constructor()
	{
		super( `sync-http-media` );
	}

	async start()
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				//
				//	start p2p relay
				//
				await super.start( ( p2pPackage ) =>
				{
					if ( _.isObject( p2pPackage.body ) &&
					     _.has( p2pPackage.body, 'bizPing' ) )
					{
						//	ignore heartbeat
						//console.log( `|||||| p2p : received a business broadcasting bizPing packet ~~~~~~~~` );
						return false;
					}

					//
					//	save broadcast package to pool
					//
					console.log( `|||||| p2p : received a business broadcasting package, try to push it into messageRequestPool` );
					this.p2pMediaPackagePool.push( p2pPackage );
				});

				//	...
				resolve( true );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}
