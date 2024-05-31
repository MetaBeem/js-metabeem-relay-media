import rateLimit from "express-rate-limit";

/**
 *	http limiter
 *
 *	@param	http 		{Express}
 *	@param	http.p2pRelay	{MediaP2pRelay}
 */
export function httpLimiter( http )
{
	if ( ! http )
	{
		throw Error( `httpLimiter :: invalid http` );
	}

	//
	//	create a limiter that
	//	limits each IP address to 100 visits per minute
	//
	const globalLimiter = rateLimit( {
		windowMs : 60 * 1000,		//	1 min
		limit: 300,			//	Limit each IP to x requests per `window` (here, per 1 minute).
		message : `Too many requests, please try again later!`,
		statusCode : 429,
		legacyHeaders: false,		//	Disable the `X-RateLimit-*` headers.
	} );
	http.use( globalLimiter );

	//	...
	const searchLimiter = rateLimit( {
		windowMs : 60 * 1000,		//	1 min
		limit: 15,			//	Limit each IP to x requests per `window` (here, per 1 minute).
		message : `Too many requests, please try again later!(searching)`,
		statusCode : 429,
		legacyHeaders: false,		//	Disable the `X-RateLimit-*` headers.
	} );
	http.use( '/v1/search/queryList', searchLimiter );
}
