import { MessageBody } from "./MessageBody.js";
import _ from "lodash";

export const RpcMessageTypes = Object.freeze({
	store: 'store',
});
export const RpcHttpMethods = Object.freeze({
	get: 'get',
	post: 'post',
	put: 'put',
	delete: 'delete',
	patch: 'patch',
	head: 'head',
	options: 'options',
	trace: 'trace',
	connect: 'connect'
});


/**
 * 	@class RpcMessage
 */
export class RpcMessage
{
	/**
	 *	@type {string}
	 */
	type	= undefined;

	/**
	 *	@type {string}
	 */
	version	= undefined;

	/**
	 *	@type {string}
	 */
	httpMethod= undefined;

	/**
	 * 	@type {string}
	 */
	httpPath = undefined;

	/**
	 *	@type {string}
	 */
	serviceName= undefined;

	/**
	 *	@type {string}
	 */
	serviceMethod= undefined;

	/**
	 *	@type {MessageBody}
	 */
	body= undefined;


	constructor()
	{
	}

	static builder()
	{
		return new RpcMessage();
	}

	static buildStore({
			version : version,
			httpPath : httpPath,
			httpMethod : httpMethod,
			serviceName : serviceName,
			serviceMethod : serviceMethod,
			body : body
		   })
	{
		const rpcMessage = new RpcMessage();
		rpcMessage.setType( `store` );
		rpcMessage.setVersion( version );
		rpcMessage.setHttpPath( httpPath );
		rpcMessage.setHttpMethod( httpMethod );
		rpcMessage.setServiceName( serviceName );
		rpcMessage.setServiceMethod( serviceMethod );
		rpcMessage.setBody( body );
		return rpcMessage;
	}

	getType()
	{
		return this.type;
	}
	setType( type )
	{
		if ( ! Object.values( RpcMessageTypes ).includes( type ) )
		{
			return false;
		}

		this.type = type;
		return this;
	}

	getVersion()
	{
		return this.version;
	}
	setVersion( version )
	{
		this.version = version;
		return this;
	}

	getHttpMethod()
	{
		return this.httpMethod;
	}
	setHttpMethod( httpMethod )
	{
		if ( ! this.isValidHttpMethod( httpMethod ) )
		{
			throw new Error( `invalid httpMethod` );
		}

		this.httpMethod = httpMethod;
		return this;
	}
	isValidHttpMethod( httpMethod )
	{
		return _.isString( httpMethod ) && ! _.isEmpty( httpMethod ) && _.has( RpcHttpMethods, httpMethod );
	}

	getHttpPath()
	{
		return this.httpPath;
	}
	setHttpPath( httpPath )
	{
		this.httpPath = httpPath;
		return this;
	}


	getServiceName()
	{
		return this.serviceName;
	}
	setServiceName( serviceName )
	{
		this.serviceName = serviceName;
		return this;
	}

	getServiceMethod()
	{
		return this.serviceMethod;
	}
	setServiceMethod( method )
	{
		this.serviceMethod = method;
		return this;
	}

	getBody()
	{
		return this.body;
	}
	setBody( body )
	{
		if ( ! ( body instanceof MessageBody ) )
		{
			return false;
		}

		this.body = body;
		return this;
	}
}
