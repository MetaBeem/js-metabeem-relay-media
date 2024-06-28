import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import { SchemaUtil } from "debeem-store";
import { TestUtil, TypeUtil } from "debeem-utils";

let server = null;


describe( 'ProfileController', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	const walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );
	let savedProfile;

	const oneProfileKey = `key-m-${ new Date().getTime() }`;


	beforeAll( async () =>
	{
		if ( null === server )
		{
			server = await startHttpServer( {} );
		}

		//	assert ...
		expect( walletObj ).not.toBeNull();
		expect( walletObj.mnemonic ).toBe( mnemonic );
		expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.index ).toBe( 0 );
		expect( walletObj.path ).toBe( ethers.defaultPath );

	} );
	afterAll( async () =>
	{
		//
		//	close http server
		//
		return new Promise( ( resolve ) =>
		{
			server.close( () =>
			{
				//console.log( 'Http Server is closed' );
				resolve();	// Test has been completed
			} );
		} );
	} );

	describe( "Add record", () =>
	{
		it( "it should response the POST method by path /v1/post/add", async () =>
		{
			//
			//	create a new like with ether signature
			//
			let profile = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				key : oneProfileKey,
				value : 'value1',
				remark : 'no remark',
				sig : ``,
				createdAt : new Date(),
				updatedAt : new Date()
			};
			profile.sig = await Web3Signer.signObject( walletObj.privateKey, profile );
			profile.hash = await Web3Digester.hashObject( profile );
			expect( profile.sig ).toBeDefined();
			expect( typeof profile.sig ).toBe( 'string' );
			expect( profile.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/profile/add' )
				.send( {
					wallet : walletObj.address, data : profile, sig : profile.sig
				} );
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			if ( 200 !== response.statusCode )
			{
				console.log( response );
			}
			expect( response.statusCode ).toBe( 200 );
			expect( response._body ).toBeDefined();
			expect( response._body ).toHaveProperty( 'version' );
			expect( response._body ).toHaveProperty( 'ts' );
			expect( response._body ).toHaveProperty( 'tu' );
			expect( response._body ).toHaveProperty( 'error' );
			expect( response._body ).toHaveProperty( 'data' );
			expect( response._body.data ).toBeDefined();
			expect( response._body.data ).toHaveProperty( 'hash' );
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.hash ).toBe( profile.hash );
			expect( response._body.data.sig ).toBe( profile.sig );
			const requiredKeys = SchemaUtil.getRequiredKeys( `profile` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const key of requiredKeys )
				{
					expect( response._body.data ).toHaveProperty( key );
				}
			}

			//	...
			savedProfile = response._body.data;


			const responseDup = await request( app )
				.post( '/v1/profile/add' )
				.send( {
					wallet : walletObj.address, data : profile, sig : profile.sig
				} );
			expect( responseDup ).toBeDefined();
			expect( responseDup ).toHaveProperty( 'statusCode' );
			expect( responseDup ).toHaveProperty( '_body' );
			expect( responseDup.statusCode ).toBe( 400 );
			expect( responseDup._body ).toBeDefined();
			expect( responseDup._body ).toHaveProperty( 'error' );
			expect( responseDup._body.error ).toBe( 'duplicate key error' );

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 10 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address from database", async () =>
		{
			expect( savedProfile ).toBeDefined();
			expect( savedProfile ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedProfile.hash ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/profile/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndKey', key : savedProfile.key },
					sig : ''
				} );
			//
			//    console.log( response );
			//    {
			//         version: 1,
			//         ts: 1695779438193,
			//         tu: 0,
			//         error: null,
			//         data: {
			//           _id: '65138a693387c9c9679538b1',
			//           timestamp: 1695779433060,
			//           hash: '0x0c323308f59321e737018a47ea1fd22ad3571b1c603da27339b3d0ab129ad10c',
			//           version: '1.0.0',
			//           deleted: '000000000000000000000000',
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0xa008a08da893e27d4eb53b4666bed0a77c2fa9fc8a532affa126b592ef5a1e7106714dad2c7df8a93ef902021be28d3f2dabb4b8970253f0aaff872eea483f961b',
			//           name: 'Sam',
			//           address: '0x67A8Eec8cc571D7B7Aa675eD9d649fA2B34D3995',
			//           avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           remark: 'no remark',
			//           createdAt: '2023-09-27T01:50:33.060Z',
			//           updatedAt: '2023-09-27T01:50:33.060Z',
			//           __v: 0
			//    }
			//
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			expect( response.statusCode ).toBe( 200 );
			expect( response._body ).toBeDefined();
			expect( response._body ).toHaveProperty( 'version' );
			expect( response._body ).toHaveProperty( 'ts' );
			expect( response._body ).toHaveProperty( 'tu' );
			expect( response._body ).toHaveProperty( 'error' );
			expect( response._body ).toHaveProperty( 'data' );
			expect( response._body.data ).toBeDefined();
			expect( response._body.data ).toHaveProperty( 'wallet' );
			expect( response._body.data ).toHaveProperty( 'hash' );
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.hash ).toBe( savedProfile.hash );
			expect( response._body.data.sig ).toBe( savedProfile.sig );

		}, 60 * 10e3 );
	} );

	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			const response = await request( app )
				.post( '/v1/profile/queryList' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'wallet' },
					sig : ''
				} );
			//
			//    console.log( response._body );
			//
			//    {
			//        version: 1,
			//        ts: 1695780310490,
			//        tu: 0,
			//        error: null,
			//        data:
			//        {
			//            total: 1,
			//            pageNo: 1,
			//            pageSize: 30,
			//            list:
			//            [
			//                {
			//                    _id: '65138d1481726a73f364dee9',
			//                    timestamp: 1695780116967,
			//                    hash: '0x9f37834abc1111825bfc827de4922a0c2e639385afa921acf3acdaefa786740e',
			//                    version: '1.0.0',
			//                    deleted: '000000000000000000000000',
			//                    wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//                    sig: '0xd9f2de6c40cfe2d54a243dc19daada44faf0caca6cfc25c589f77556d72c8df80c7ac1131fd06ba73969bd6778ec7fbc47daa403c44276d8c421a490a606ae191b',
			//                    name: 'Sam',
			//                    address: '0xFb1ca76cA7d4e158dd3C3eaCe077Dd04Be51b882',
			//                    avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//                    remark: 'no remark',
			//                    createdAt: '2023-09-27T02:01:56.967Z',
			//                    updatedAt: '2023-09-27T02:01:56.967Z',
			//                    __v: 0
			//                }
			//            ]
			//        }
			//    }
			//
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			expect( response.statusCode ).toBe( 200 );
			expect( response._body ).toBeDefined();
			expect( response._body ).toHaveProperty( 'version' );
			expect( response._body ).toHaveProperty( 'ts' );
			expect( response._body ).toHaveProperty( 'tu' );
			expect( response._body ).toHaveProperty( 'error' );
			expect( response._body ).toHaveProperty( 'data' );
			expect( response._body.data ).toBeDefined();
			expect( response._body.data ).toHaveProperty( 'total' );
			expect( response._body.data ).toHaveProperty( 'pageNo' );
			expect( response._body.data ).toHaveProperty( 'pageSize' );
			expect( response._body.data ).toHaveProperty( 'list' );
			expect( Array.isArray( response._body.data.list ) ).toBeTruthy();
			expect( response._body.data.total ).toBeGreaterThan( 0 );
			expect( response._body.data.total ).toBeGreaterThanOrEqual( response._body.data.list.length );
			if ( response._body.data.list )
			{
				for ( const item of response._body.data.list )
				{
					expect( item ).toBeDefined();
					expect( item ).toHaveProperty( '_id' );
					expect( item ).toHaveProperty( 'wallet' );
					expect( item.wallet ).toBe( walletObj.address );
				}
			}

		}, 60 * 10e3 );
	} );

	describe( "Query list by pagination", () =>
	{
		it( "should return a list of records by pagination from database", async () =>
		{
			//
			//	create many contacts
			//
			for ( let i = 0; i < 100; i++ )
			{
				const NoStr = Number( i ).toString().padStart( 2, '0' );
				const newKey = `key${ new Date().getTime() }`;

				//
				//	create a new profile with ether signature
				//
				let profile = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					key : newKey,
					value : `value${ NoStr }`,
					remark : `no remark ${ NoStr }`,
					sig : ``,
					createdAt : new Date(),
					updatedAt : new Date()
				};
				profile.sig = await Web3Signer.signObject( walletObj.privateKey, profile );
				profile.hash = await Web3Digester.hashObject( profile );
				expect( profile.sig ).toBeDefined();
				expect( typeof profile.sig ).toBe( 'string' );
				expect( profile.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/profile/add' )
					.send( {
						wallet : walletObj.address, data : profile, sig : profile.sig
					} );
				//console.log( response );
				expect( response ).toBeDefined();
				expect( response ).toHaveProperty( 'statusCode' );
				expect( response ).toHaveProperty( '_body' );
				expect( response.statusCode ).toBe( 200 );
				expect( response._body ).toBeDefined();
				expect( response._body ).toHaveProperty( 'version' );
				expect( response._body ).toHaveProperty( 'ts' );
				expect( response._body ).toHaveProperty( 'tu' );
				expect( response._body ).toHaveProperty( 'error' );
				expect( response._body ).toHaveProperty( 'data' );
				expect( response._body.data ).toBeDefined();
				expect( response._body.data ).toHaveProperty( 'hash' );
				expect( response._body.data.hash ).toBe( profile.hash );

				//	...
				savedProfile = response._body.data;
			}

			//
			//	....
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/profile/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'wallet', options : { pageNo : page, pageSize : 10 } },
						sig : ''
					} );
				expect( response ).toBeDefined();
				expect( response ).toHaveProperty( 'statusCode' );
				expect( response ).toHaveProperty( '_body' );
				expect( response.statusCode ).toBe( 200 );
				expect( response._body ).toBeDefined();
				expect( response._body ).toHaveProperty( 'version' );
				expect( response._body ).toHaveProperty( 'ts' );
				expect( response._body ).toHaveProperty( 'tu' );
				expect( response._body ).toHaveProperty( 'error' );
				expect( response._body ).toHaveProperty( 'data' );
				expect( response._body.data ).toBeDefined();
				expect( response._body.data ).toHaveProperty( 'total' );
				expect( response._body.data ).toHaveProperty( 'pageNo' );
				expect( response._body.data ).toHaveProperty( 'pageSize' );
				expect( response._body.data ).toHaveProperty( 'list' );
				expect( Array.isArray( response._body.data.list ) ).toBeTruthy();
				expect( response._body.data.total ).toBeGreaterThan( 0 );
				expect( response._body.data.total ).toBeGreaterThanOrEqual( response._body.data.list.length );
			}

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Updating", () =>
	{
		it( "should update a record by wallet and address from database", async () =>
		{
			const requiredKeys = SchemaUtil.getRequiredKeys( `profile` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			//
			//	create a new like with ether signature
			//
			let profile = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				key : oneProfileKey,
				value : 'value1',
				remark : 'no remark',
				sig : ``,
				createdAt : new Date(),
				updatedAt : new Date()
			};
			profile.sig = await Web3Signer.signObject( walletObj.privateKey, profile );
			profile.hash = await Web3Digester.hashObject( profile );
			expect( profile.sig ).toBeDefined();
			expect( typeof profile.sig ).toBe( 'string' );
			expect( profile.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/profile/add' )
				.send( {
					wallet : walletObj.address, data : profile, sig : profile.sig
				} );
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			if ( 200 !== response.statusCode )
			{
				console.log( response );
			}
			expect( response.statusCode ).toBe( 200 );
			expect( response._body ).toBeDefined();
			expect( response._body ).toHaveProperty( 'version' );
			expect( response._body ).toHaveProperty( 'ts' );
			expect( response._body ).toHaveProperty( 'tu' );
			expect( response._body ).toHaveProperty( 'error' );
			expect( response._body ).toHaveProperty( 'data' );
			expect( response._body.data ).toBeDefined();
			expect( response._body.data ).toHaveProperty( 'hash' );
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.hash ).toBe( profile.hash );
			expect( response._body.data.sig ).toBe( profile.sig );
			if ( requiredKeys )
			{
				for ( const key of requiredKeys )
				{
					expect( response._body.data ).toHaveProperty( key );
				}
			}

			//	...
			savedProfile = response._body.data;


			//
			//	update
			//
			expect( savedProfile ).toBeDefined();
			expect( savedProfile ).toHaveProperty( 'key' );
			expect( TypeUtil.isNotEmptyString( savedProfile.key ) ).toBeTruthy();

			let toBeUpdated = {
				wallet : walletObj.address,
				key : savedProfile.key,
				value : `https://avatar-${ new Date().toLocaleString() }`,
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated );
			expect( toBeUpdated.sig ).toBeDefined();
			expect( typeof toBeUpdated.sig ).toBe( 'string' );
			expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			const updateResponse = await request( app )
				.post( '/v1/profile/update' )
				.send( {
					wallet : walletObj.address,
					data : toBeUpdated,
					sig : toBeUpdated.sig
				} );
			//
			//	console.log( updateResponse._body )
			//	{
			// 		version: 1,
			// 		ts: 1696235849516,
			// 		tu: 0,
			// 		error: null,
			// 		data: {
			// 			_id: '651a81442b16d28b1dade91f',
			// 			timestamp: 1696235844364,
			// 			hash: '0x22272d6bfe31a293a54b444683e8f780039ff28ebae174d4c46fe39ed5ea7c9a',
			// 			version: '1.0.0',
			// 			deleted: '000000000000000000000000',
			// 			wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			// 			sig: '0x724b5ad3f725b93229c657ab56c381cd35fb1a181e56509a4db555aebd89dc9642117e2ce82b97b4f0bbd4793afe4f038a3a69b435553fd7518f607bcdfc64cd1c',
			// 			key: 'key1696235844364',
			// 			value: 'https://avatar-10/2/2023, 4:37:29 PM',
			// 			remark: 'remark .... 10/2/2023, 4:37:29 PM',
			// 			createdAt: '2023-10-02T08:37:24.364Z',
			// 			updatedAt: '2023-10-02T08:37:29.507Z',
			// 			__v: 0
			// 		}
			//	}
			//
			expect( updateResponse ).toBeDefined();
			expect( updateResponse ).toHaveProperty( 'statusCode' );
			expect( updateResponse ).toHaveProperty( '_body' );
			expect( updateResponse.statusCode ).toBe( 200 );
			expect( updateResponse._body ).toBeDefined();
			expect( updateResponse._body ).toHaveProperty( 'version' );
			expect( updateResponse._body ).toHaveProperty( 'ts' );
			expect( updateResponse._body ).toHaveProperty( 'tu' );
			expect( updateResponse._body ).toHaveProperty( 'error' );
			expect( updateResponse._body ).toHaveProperty( 'data' );
			expect( updateResponse._body.data ).toBeDefined();
			expect( updateResponse._body.data ).toHaveProperty( 'hash' );
			expect( updateResponse._body.data ).toHaveProperty( 'sig' );
			expect( updateResponse._body.data ).toHaveProperty( 'key' );
			expect( updateResponse._body.data ).toHaveProperty( 'value' );
			expect( updateResponse._body.data.sig ).toBe( toBeUpdated.sig )
			expect( updateResponse._body.data.key ).toBe( toBeUpdated.key )
			expect( updateResponse._body.data.value ).toBe( toBeUpdated.value )

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Deletion", () =>
	{
		it( `should logically delete a record by hash`, async () =>
		{
			expect( savedProfile ).toBeDefined();
			expect( SchemaUtil.isValidKeccak256Hash( savedProfile.hash ) ).toBeTruthy();

			let toBeDeleted = {
				wallet : walletObj.address,
				key : savedProfile.key,
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted );
			expect( toBeDeleted.sig ).toBeDefined();
			expect( typeof toBeDeleted.sig ).toBe( 'string' );
			expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const updateResponse = await request( app )
				.post( '/v1/profile/delete' )
				.send( {
					wallet : walletObj.address,
					data : toBeDeleted,
					sig : toBeDeleted.sig
				} );
			expect( updateResponse ).toBeDefined();
			expect( updateResponse ).toHaveProperty( 'statusCode' );
			expect( updateResponse ).toHaveProperty( '_body' );
			if ( 200 !== updateResponse.statusCode )
			{
				console.log( updateResponse );
			}
			expect( updateResponse.statusCode ).toBe( 200 );
			expect( updateResponse._body ).toBeDefined();
			expect( updateResponse._body ).toHaveProperty( 'version' );
			expect( updateResponse._body ).toHaveProperty( 'ts' );
			expect( updateResponse._body ).toHaveProperty( 'tu' );
			expect( updateResponse._body ).toHaveProperty( 'error' );
			expect( updateResponse._body ).toHaveProperty( 'data' );
			expect( updateResponse._body.data ).toBeDefined();

			//	...
			const queryOneResponse = await request( app )
				.post( '/v1/profile/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndKey', key : savedProfile.key },
					sig : ''
				} );
			expect( queryOneResponse ).toBeDefined();
			expect( queryOneResponse ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse ).toHaveProperty( '_body' );
			expect( queryOneResponse.statusCode ).toBe( 200 );
			expect( queryOneResponse._body ).toBeDefined();
			expect( queryOneResponse._body.data ).toBeDefined();
			expect( queryOneResponse._body.data ).toBe( null );

		}, 60 * 10e3 );
	} );
} );
