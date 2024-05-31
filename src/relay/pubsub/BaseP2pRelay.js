//import chalk from "chalk";
import _ from "lodash";
import { RelayService } from "debeem-p2p-relay";
import { CreateRelayOptionsBuilder } from "debeem-p2p-relay";
import { ProcessUtil } from "debeem-utils";
import { P2pMediaPackagePool } from "../pool/P2pMediaPackagePool.js";

//import { enable, logger } from "@libp2p/logger";
//enable( 'debeem:RelayService' );

import "deyml/config";


/**
 * 	@class
 */
export class BaseP2pRelay
{
	/**
	 *	@type {string}
	 */
	subTopic = 'sync-topic';

	/**
	 *	@type {RelayService}
	 */
	relayService = new RelayService();

	/**
	 * 	@typedef { import('debeem-p2p-relay/CreateRelayOptionsBuilder').CreateRelayOptions } CreateRelayOptions
	 * 	@type {CreateRelayOptions}
	 */
	relayOptions = {};

	/**
	 *	@type {P2pMediaPackagePool}
	 */
	p2pMediaPackagePool = new P2pMediaPackagePool();


	constructor( topic )
	{
		if ( ! _.isString( topic ) || _.isEmpty( topic ) )
		{
			throw new Error( `${ this.constructor.name }.constructor :: invalid topic` );
		}

		this.subTopic = topic;
	}

	async start( callbackBroadcast )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				//
				//	create http request pool
				//
				this.p2pMediaPackagePool.init();

				//
				//	create p2p relay
				//
				const p2p_bootstrappers = process.env.P2P_BOOTSTRAPPERS;
				if ( ! Array.isArray( p2p_bootstrappers ) || 0 === p2p_bootstrappers.length )
				{
					return reject( `invalid p2p bootstrappers` );
				}

				const p2p_announces = process.env.P2P_ANNOUNCES;

				const p2p_port = ProcessUtil.getParamIntValue( `p2p_port` );
				const peerIdFilename = ProcessUtil.getParamStringValue( `p2p_peer_id` );
				const swarmKeyFilename = ProcessUtil.getParamStringValue( `p2p_swarm_key` );
				this.relayOptions = CreateRelayOptionsBuilder.builder()
					.setPeerIdFilename( peerIdFilename )
					.setSwarmKeyFilename( swarmKeyFilename )
					.setPort( p2p_port )
					.setAnnounceAddresses( Array.isArray( p2p_announces ) ? p2p_announces : [] )
					.setBootstrapperAddresses( p2p_bootstrappers )
					.setPubsubPeerDiscoveryTopics( [] )
					.build();
				await this.relayService.createRelay( this.relayOptions );
				await this.relayService.subscribe( this.subTopic, ( data ) =>
				{
					console.log( `|||||| received a subscribed message @${ this.constructor.name }` );
					if ( _.isFunction( callbackBroadcast ) )
					{
						callbackBroadcast( data );
					}
				} );

				this.printNetworkInfo();

				// //	...
				// setTimeout( () =>
				// {
				// 	//console.log( `${ chalk.cyan( 'Waiting for network connection to be ready' ) } ` );
				// 	console.log( `Waiting for network connection to be ready` );
				//
				// 	// await TimerUtil.waitUntilCondition( () =>
				// 	// {
				// 	// 	const report = this.relayService.checkHealth( this.subTopic );
				// 	// 	if ( null !== report.errors )
				// 	// 	{
				// 	// 		console.log( `[${ new Date().toLocaleString() }] ${ chalk.bgYellow( 'WAITING : ' ) }`, report );
				// 	// 		return false;
				// 	// 	}
				// 	//
				// 	// 	return true;
				// 	// }, 1000 );
				// 	//console.log( `${ chalk.cyan( 'Network connection is ready :)' ) } ` );
				// 	console.log( `Network connection is ready :)` );
				// 	this.printNetworkInfo();
				//
				// }, 1000 );
				//await TimerUtil.waitForDelay( 1000 );

				//	...
				resolve();
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param rpcMessage	{RpcMessage}
	 *	@return {Promise< any | undefined >}
	 */
	async publish( rpcMessage )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! rpcMessage )
				{
					return reject( `${ this.constructor.name }.publish :: invalid data` );
				}

				//	return publishResult or undefined
				const publishResult = await this.relayService.publish( this.subTopic, rpcMessage );
				console.log( `|||||| p2p network publish result: `, publishResult );
				resolve( publishResult );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}


	printNetworkInfo()
	{
		setInterval( () =>
		{
			const allPeers = this.relayService.getPeers();
			const allSubscribers = this.relayService.getSubscribers( this.subTopic );
			const allTopics = this.relayService.getTopics();

			if ( this.compareNetworkChanging( allPeers, allSubscribers, allTopics ) )
			{
				this.lastAllPeers = _.cloneDeep( allPeers );
				this.lastAllSubscribers = _.cloneDeep( allSubscribers );
				this.lastAllTopics = _.cloneDeep( allTopics );

				console.log( `))) ` );
				console.log( `))) allPeers :`, allPeers );
				console.log( `))) allSubscribers :`, allSubscribers );
				console.log( `))) allTopics :`, allTopics );
			}

		}, 1000 );
	}

	compareNetworkChanging( allPeers, allSubscribers, allTopics )
	{
		if ( ! this.lastAllPeers || ! this.lastAllSubscribers || ! this.lastAllTopics )
		{
			//	changed
			return true;
		}
		if ( ! _.isEqualWith( this.lastAllPeers, allPeers, ( a, b ) =>
		{
			return a.toString().trim().toLowerCase() === b.toString().trim().toLowerCase();
		}) )
		{
			return true;
		}
		if ( ! _.isEqualWith( this.lastAllSubscribers, allSubscribers, ( a, b ) =>
		{
			return a.toString().trim().toLowerCase() === b.toString().trim().toLowerCase();
		}) )
			if ( ! _.isEqual( this.lastAllTopics, allTopics ) )
			{
				return true;
			}

		return false;
	}
}
