import { TestUtil, TypeUtil } from "debeem-utils";
import { RpcMessage, RpcMessageTypes } from "../../models/RpcMessage.js";
import { MessageBody } from "../../models/MessageBody.js";
import { TransferService } from "../../services/TransferService.js";
import _ from "lodash";
import { NetworkUtil } from "../../utils/NetworkUtil.js";


const transferService = new TransferService();


/**
 * 	@class
 */
export class BusinessControllerPromise
{
	static getServiceNames()
	{
		return [ 'comment', 'contact', 'favorite', 'follower', 'like', 'post', 'profile', 'portal', 'search' ];
	}

	static getServiceMethods()
	{
		return [ 'add', 'update', 'updateFor', 'delete', 'queryOne', 'queryList' ];
	}

	static isUpdateMethod( serviceMethod )
	{
		return _.isString( serviceMethod ) &&
		       [ 'add', 'update', 'updateFor', 'delete' ].includes( serviceMethod );
	}

	static process( param, req, _res )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! param )
				{
					return reject( `BusinessControllerPromise:process :: invalid param` );
				}
				if ( ! param.http )
				{
					return reject( `BusinessControllerPromise:process :: invalid param.http` );
				}
				if ( ! TypeUtil.isNotEmptyString( param.serviceName ) )
				{
					return reject( `BusinessControllerPromise:process :: invalid param.serviceName` );
				}
				if ( ! TypeUtil.isNotEmptyString( param.serviceMethod ) )
				{
					return reject( `BusinessControllerPromise:process :: invalid param.serviceMethod` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( req, [ 'body' ] ) )
				{
					return reject( `BusinessControllerPromise:process :: invalid body` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( req.body, [ 'wallet', 'data' ] ) )
				{
					return reject( `BusinessControllerPromise:process :: invalid parameters` );
				}
				// if ( ! EtherWallet.isValidAddress( req.body.wallet ) )
				// {
				// 	return reject( `BusinessControllerPromise:process :: invalid wallet` );
				// }

				const host = NetworkUtil.getRequestHost( req );
				if ( ! TestUtil.isTestEnv() )
				{
					console.log( `))) Http request host :`, host );
				}

				//	...
				const rpcMessage = RpcMessage.builder()
					.setType( RpcMessageTypes.store )
					.setVersion( `1.0.0` )
					.setHttpPath( param.httpPath )
					.setHttpMethod( param.httpMethod )
					.setServiceName( param.serviceName )
					.setServiceMethod( param.serviceMethod )
					.setBody( MessageBody.build( {
						wallet : req.body.wallet,
						data : req.body.data,
						sig : req.body.sig
					} ) )
				;
				const result = await transferService.execute( rpcMessage );

				//
				//	broadcast user requests except for local requests
				//	to others Media-Relay over p2p network,
				//
				const isRequestFromLocalhost = NetworkUtil.isRequestFromLocalhost( req );
				const isUpdateMethod = this.isUpdateMethod( param.serviceMethod );
				const isTestEnv = TestUtil.isTestEnv();
				if ( ! isTestEnv )
				{
					console.log( `))) isRequestFromLocalhost = ${ isRequestFromLocalhost }` );
					console.log( `))) isUpdateMethod = ${ isUpdateMethod }` );
					if ( ! isRequestFromLocalhost && isUpdateMethod )
					{
						console.log( `|||||| will publish rpcMessage to P2P network` );
						await param.http.p2pRelay.publish( rpcMessage );
					}
				}

				//	...
				resolve( result );
			}
			catch ( err )
			{
				if ( ! TestUtil.isTestEnv() )
				{
					console.log( `###### BusinessControllerPromise.process :`, err );
				}
				reject( err );
			}
		});
	}
}
