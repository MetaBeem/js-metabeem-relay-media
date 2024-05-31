export function xResponseTime( req, res, next )
{
	const start = Date.now();
	let responseSent = false;

	res.on( 'finish', () =>
	{
		if ( ! responseSent )
		{
			const end = Date.now();
			const responseTime = end - start;
			res.setHeader( 'X-Response-Time', `${ responseTime }ms` );
			responseSent = true;
		}
	} );

	res.on( 'close', () =>
	{
		if ( ! responseSent )
		{
			const end = Date.now();
			const responseTime = end - start;
			res.setHeader( 'X-Response-Time', `${ responseTime }ms` );
			responseSent = true;
		}
	} );

	next();
}
