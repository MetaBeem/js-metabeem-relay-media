import { NetworkUtil } from "../../utils/NetworkUtil.js";
import { BusinessControllerPromise } from "./BusinessControllerPromise.js";
import { TestUtil } from "debeem-utils";

/**
 * 	@class BusinessControllers
 */
export class BusinessControllers
{
	static async all( param, req, res )
	{
		try
		{
			if ( ! TestUtil.isTestEnv() )
			{
				console.log( `BusinessControllers : [${ param.serviceName }].[${ param.serviceMethod }]` );
			}

			const result = await BusinessControllerPromise.process( param, req, res );
			res.send( NetworkUtil.getResponseObject( result ) );
		}
		catch ( err )
		{
			if ( ! TestUtil.isTestEnv() )
			{
				console.log( `###### BusinessControllers.all :`, err );
			}
			res.status( 400 ).send( NetworkUtil.getResponseObject( null, { error : err } ) );
		}
	}
}
