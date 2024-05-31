import _ from "lodash";
import { AbstractP2pPackagePool } from "debeem-p2p-relay";
import { TypeUtil } from "debeem-utils";

/**
 * 	@class
 */
export class P2pMediaPackagePool extends AbstractP2pPackagePool
{
	constructor()
	{
		super();
		this.setPoolName( this.constructor.name );
	}

	/**
	 * 	push http request to redis pool
	 *	@param p2pPackage	{ any }
	 *	@returns {Promise<boolean>}
	 */
	push( p2pPackage )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! this.isInitialized() )
				{
					return reject( `${ this.constructor.name }.push :: not initialized` );
				}
				const errorP2pPackage = this.verifyP2pPackage( p2pPackage );
				if ( null !== errorP2pPackage )
				{
					return reject( `${ this.constructor.name }.push :: ${ errorP2pPackage }` );
				}

				console.log( `|||||| p2p : received a business broadcasting package, it has been verified. 
						topic : ${ p2pPackage.topic }, 
						from : ${ p2pPackage.from.toString() },
						sequenceNumber: ${ p2pPackage.sequenceNumber.toString() }` );
				const item = {
					topic : p2pPackage.topic,
					msgId : p2pPackage.msgId,
					from : p2pPackage.from.toString(),
					sequenceNumber : p2pPackage.sequenceNumber.toString(),
					body : p2pPackage.body,
				};
				const result = await this.chPub.publish( this.poolName, item );
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	verifyP2pPackage( p2pPackage )
	{
		if ( ! _.isObject( p2pPackage ) )
		{
			return `invalid p2pPackage`;
		}
		if ( ! _.every(
			[ 'type', 'topic', 'msgId', 'from', 'sequenceNumber', 'body' ],
			key => _.has( p2pPackage, key ) ) )
		{
			return `invalid p2pPackage[ keys ]`;
		}
		if ( ! _.isString( p2pPackage.type ) || _.isEmpty( p2pPackage.type ) )
		{
			return `invalid p2pPackage.type`;
		}
		if ( ! _.isString( p2pPackage.topic ) || _.isEmpty( p2pPackage.topic ) )
		{
			return `invalid p2pPackage.topic`;
		}
		if ( ! _.isString( p2pPackage.msgId ) || _.isEmpty( p2pPackage.msgId ) )
		{
			return `invalid p2pPackage.msgId`;
		}
		if ( ! _.isObject( p2pPackage.from ) )
		{
			return `invalid p2pPackage.from`;
		}
		if ( ! TypeUtil.isBigint( p2pPackage.sequenceNumber ) )
		{
			return `invalid p2pPackage.sequenceNumber`;
		}
		if ( ! _.isObject( p2pPackage.body ) &&
		     _.isString( p2pPackage.body.serverId ) &&
		     ! _.isEmpty( p2pPackage.body.serverId ) &&
		     _.isObject( p2pPackage.body.data ) )
		{
			return `invalid p2pPackage.body`;
		}

		return null;
	}
}
