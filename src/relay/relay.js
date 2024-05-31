import { MediaP2pRelay } from "./pubsub/MediaP2pRelay.js";

import 'deyml/config';

/**
 *	@type {MediaP2pRelay}
 */
const p2pRelay = new MediaP2pRelay();


/**
 *	@returns {Promise<unknown>}
 */
export function startP2pRelay()
{
	return new Promise( async ( resolve, reject ) =>
	{
		try
		{
			await p2pRelay.start();
			console.log( `))) Metabeem Media P2P Relay listening on port ${ p2pRelay.relayOptions.port }` );
			resolve( p2pRelay );
		}
		catch ( err )
		{
			reject( err );
		}
	});
}
