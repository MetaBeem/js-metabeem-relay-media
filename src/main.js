import assert from 'assert';
import _ from 'lodash';
import agent from 'skywalking-backend-js';
import { startHttpServer } from "./http/http.js";
import { startP2pRelay } from "./relay/relay.js";

import 'deyml/config';


async function asyncMain()
{
	/**
	 * 	install SkyWalking anent
	 */
	// assert.strictEqual( true, _.isString( process.env.SW_AGENT_NAME ) && ! _.isEmpty( process.env.SW_AGENT_NAME ) );
	// assert.strictEqual( true, _.isString( process.env.SW_AGENT_INSTANCE_NAME ) && ! _.isEmpty( process.env.SW_AGENT_INSTANCE_NAME ) );
	// assert.strictEqual( true, _.isString( process.env.SW_AGENT_COLLECTOR_BACKEND_SERVICES ) && ! _.isEmpty( process.env.SW_AGENT_COLLECTOR_BACKEND_SERVICES ) );
	// const agentInstance = agent.hasOwnProperty( 'default' ) ? agent.default : agent;
	// agentInstance.start({
	// 	serviceName: process.env.SW_AGENT_NAME,
	// 	serviceInstance: process.env.SW_AGENT_INSTANCE_NAME,
	// 	collectorAddress: process.env.SW_AGENT_COLLECTOR_BACKEND_SERVICES,
	// 	authorization: ""
	// });

	/**
	 *	start relay
	 */
	const p2pRelay = await startP2pRelay();
	await startHttpServer( p2pRelay );
}

asyncMain().then( res =>{} ).catch( err => { console.error( err ) } );
