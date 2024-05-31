import { NetworkUtil } from "../../utils/NetworkUtil.js";


/**
 * 	@class
 */
export class IndexController
{
	static async index( req, res )
	{
		try
		{
			const result = await IndexControllerPromise.index( req, res );
			res.send( NetworkUtil.getResponseObject( result ) );
		}
		catch ( err )
		{
			res.send( NetworkUtil.getResponseObject( null, { error : err } ) );
		}
	}
}


export class IndexControllerPromise
{
	static index( req, res )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				resolve( { title: 'Your are welcome!' } );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}
