import _ from "lodash";
import { ParamUtils } from "../utils/ParamUtils.js";
import * as debeem_utils from "debeem-utils";
const { TestUtil, HttpUtil, HttpUtilOptions } = debeem_utils;
//import { TestUtil, HttpUtil, HttpUtilOptions } from "debeem-utils"

/**
 *	http copy
 *
 *	@param	http 		{Express}
 *	@param	http.p2pRelay	{MediaP2pRelay}
 */
export function httpCopy( http )
{
	if ( TestUtil.isTestEnv() )
	{
		//	ignore httpCopy in test environment
		return;
	}

	if ( ! http )
	{
		throw Error( `httpCopy :: invalid http` );
	}
	if ( ! http.p2pRelay )
	{
		throw Error( `httpCopy :: invalid http.p2pRelay` );
	}
	if ( ! http.p2pRelay.p2pMediaPackagePool )
	{
		throw Error( `httpCopy :: invalid http.p2pRelay.p2pMediaPackagePool` );
	}

	/**
	 * 	subscribe to broadcasts from the p2p network and
	 * 	resend to the http request locally
	 */
	http.p2pRelay.p2pMediaPackagePool.subscribe( async ( /** @type {string} **/ channel, /** @type {string} **/ message, /** @type {any} **/ options ) =>
	{
		try
		{
			console.log( `%%%%%% received a message from messageRequestPool :`, channel, message, options );
			if ( _.isObject( message ) &&
			     _.isObject( message.body ) )
			{
				/**
				 * 	@type {RpcMessage}
				 */
				await resentHttpRequest( message.body );
			}
			else
			{
				console.log( `%%%%%% message is not an object :`, message );
			}
		}
		catch ( err )
		{
			console.error( `%%%%%% in httpCopy subscribe handler :`, err );
		}
	});
}

/**
 * 	@param	rpcMessage	{RpcMessage}
 * 	@returns {void}
 */
async function resentHttpRequest( rpcMessage )
{
	if ( ! rpcMessage )
	{
		throw new Error( `resentHttpRequest :: null rpcMessage` );
	}

	const httpPort = ParamUtils.getHttpPort();
	const url = `http://127.0.0.1:${ httpPort }${ rpcMessage.httpPath }`;

	/**
	 *	@type { HttpUtilOptions }
	 */
	const httpOptions = {
		url : url,
		method : rpcMessage.httpMethod,
		data : rpcMessage.body,
	};
	console.log( `%%%%%% will resend the http request :`, httpOptions );
	const response = await HttpUtil.request( httpOptions );
	console.log( `%%%%%% resent the http request, response :`, response );
}
