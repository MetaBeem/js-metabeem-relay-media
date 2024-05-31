import express from "express";
import { httpRoutes } from './httpRoutes.js';
import { TestUtil } from "debeem-utils";
import { ParamUtils } from "../utils/ParamUtils.js";
import { httpCopy } from "./httpCopy.js";
import { httpLimiter } from "./httpLimiter.js";

//	...
const http = express();


/**
 *	@param p2pRelay		{MediaP2pRelay}
 *	@return {Promise<unknown>}
 */
export function startHttpServer( p2pRelay )
{
	return new Promise( async ( resolve, reject ) =>
	{
		try
		{
			if ( ! p2pRelay )
			{
				return reject( `invalid p2pRelay` );
			}

			if ( ! TestUtil.isTestEnv() )
			{
				console.log( `process.env :`, process.env );
			}

			//	read port
			const port = ParamUtils.getHttpPort();

			/**
			 *	configurations
			 */
			http.disable( 'x-powered-by' );
			http.use( express.static( 'public' ) );	//	static files
			http.use( express.json() );
			http.use( express.urlencoded( { extended : true } ) );
			// http.use( bodyParser.urlencoded( {
			// 	extended : false
			// } ) );
			// http.use( bodyParser.json() );


			//	...
			httpLimiter( http );

			//	...
			http.p2pRelay = p2pRelay;
			httpRoutes( http );
			httpCopy( http );

			//	...
			const listenServer = http.listen( port, () =>
			{
				if ( TestUtil.isTestEnv() )
				{
					return false;
				}
				console.log( `))) Metabeem Http Server listening on port ${ port }!` );
			} );


			//
			//	in case of an error
			//
			http.on( 'error', ( appErr, appCtx ) =>
			{
				console.error( 'app error', appErr.stack );
				console.error( 'on url', appCtx.req.url );
				console.error( 'with headers', appCtx.req.headers );
			} );

			//	...
			resolve( listenServer );
		}
		catch ( err )
		{
			reject( err );
		}
	} );
}

export const app = http;
