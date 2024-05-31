import { EtherWallet, Web3Signer } from "debeem-id";

export class MessageBody
{
	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 */
	constructor({
		     wallet : wallet,
		     data : data,
		     sig : sig
	} = undefined )
	{
		this.wallet	= undefined;
		this.data	= undefined;
		this.sig	= undefined;

		this.setWallet( wallet );
		this.setData( data );
		this.setSig( sig );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns {MessageBody}
	 */
	static build({
		     wallet : wallet,
		     data : data,
		     sig : sig
	})
	{
		return new MessageBody({
			wallet : wallet,
			data : data,
			sig : sig
		});
	}

	getWallet()
	{
		return this.wallet;
	}
	setWallet( wallet )
	{
		if ( ! EtherWallet.isValidAddress( wallet ) )
		{
			return false;
		}

		this.wallet = wallet;
		return this;
	}

	getData()
	{
		return this.data;
	}
	setData( data )
	{
		this.data = data;
		return this;
	}

	getSig()
	{
		return this.sig;
	}
	setSig( sig )
	{
		if ( ! Web3Signer.isValidSig( sig ) )
		{
			return false;
		}

		this.sig = sig;
		return this;
	}
}
