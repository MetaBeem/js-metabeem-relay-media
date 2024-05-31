import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import { SchemaUtil } from "debeem-store";
import { TestUtil } from "debeem-utils";

let server = null;


describe( 'ContactController', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	const walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );
	let lastOneAddress;


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

	test( 'it should response the GET method by path /', async () =>
	{
		const response = await request( app ).get( '/' );
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
	} );


	describe( "Add record", () =>
	{
		it( "it should response the POST method by path /v1/contact/add", async () =>
		{
			//	...
			lastOneAddress = EtherWallet.createWalletFromMnemonic().address;

			//
			//	create a new contact with ether signature
			//
			let contact = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : lastOneAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt : new Date(),
				updatedAt : new Date()
			};
			contact.sig = await Web3Signer.signObject( walletObj.privateKey, contact );
			contact.hash = await Web3Digester.hashObject( contact );
			expect( contact.sig ).toBeDefined();
			expect( typeof contact.sig ).toBe( 'string' );
			expect( contact.sig.length ).toBeGreaterThanOrEqual( 0 );

			const postData = {
				wallet : walletObj.address, data : contact, sig : contact.sig
			};
			// console.log( `postData :`, postData );
			// const jsonString = JSON.stringify( postData );
			// console.log( `jsonString :`, jsonString );
			const response = await request( app )
				.post( '/v1/contact/add' )
				.send( postData );
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
			expect( response._body.data.hash ).toBe( contact.hash );

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address from database", async () =>
		{
			const response = await request( app )
				.post( '/v1/contact/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : lastOneAddress },
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
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.address ).toBe( lastOneAddress );

		}, 60 * 10e3 );
	} );

	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			const response = await request( app )
				.post( '/v1/contact/queryList' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : lastOneAddress },
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
					expect( item ).toHaveProperty( 'address' );
					expect( item.wallet ).toBe( walletObj.address );
					expect( item.address ).toBe( lastOneAddress );
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
				lastOneAddress = EtherWallet.createWalletFromMnemonic().address;
				const NoStr = Number( i ).toString().padStart( 2, '0' );

				//
				//	create a new contact with ether signature
				//
				let contact = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					address : lastOneAddress,
					sig : ``,
					name : `Sam`,
					avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					remark : `no remark ${ NoStr }`,
					createdAt : new Date(),
					updatedAt : new Date()
				};
				contact.sig = await Web3Signer.signObject( walletObj.privateKey, contact );
				contact.hash = await Web3Digester.hashObject( contact );
				expect( contact.sig ).toBeDefined();
				expect( typeof contact.sig ).toBe( 'string' );
				expect( contact.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/contact/add' )
					.send( {
						wallet : walletObj.address, data : contact, sig : contact.sig
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
				expect( response._body.data.hash ).toBe( contact.hash );
			}

			//
			//	....
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/contact/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'walletAndAddress', options : { pageNo : page, pageSize : 10 } },
						sig : '',
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
			//	...
			lastOneAddress = EtherWallet.createWalletFromMnemonic().address;

			//
			//	create a new contact with ether signature
			//
			let contact = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : lastOneAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt : new Date(),
				updatedAt : new Date()
			};
			contact.sig = await Web3Signer.signObject( walletObj.privateKey, contact );
			contact.hash = await Web3Digester.hashObject( contact );
			expect( contact.sig ).toBeDefined();
			expect( typeof contact.sig ).toBe( 'string' );
			expect( contact.sig.length ).toBeGreaterThanOrEqual( 0 );

			const postData = {
				wallet : walletObj.address, data : contact, sig : contact.sig
			};
			// console.log( `postData :`, postData );
			// const jsonString = JSON.stringify( postData );
			// console.log( `jsonString :`, jsonString );
			const response = await request( app )
				.post( '/v1/contact/add' )
				.send( postData );
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
			expect( response._body.data.hash ).toBe( contact.hash );


			//
			//	update
			//
			let contactToBeUpdated = {
				wallet : walletObj.address,
				address : lastOneAddress,
				name : `name-${ new Date().toLocaleString() }`,
				avatar : `https://avatar-${ new Date().toLocaleString() }`,
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			contactToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeUpdated );
			expect( contactToBeUpdated.sig ).toBeDefined();
			expect( typeof contactToBeUpdated.sig ).toBe( 'string' );
			expect( contactToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `contact` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/contact/update' )
				.send( {
					wallet : walletObj.address,
					data : contactToBeUpdated,
					sig : contactToBeUpdated.sig
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
			if ( requiredKeys &&
			     updateResponse &&
			     updateResponse._body &&
			     updateResponse._body.data )
			{
				const updatedContact = updateResponse._body.data;
				for ( const key of requiredKeys )
				{
					expect( updatedContact ).toHaveProperty( key );
				}
				expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === updatedContact.deleted ).toBeTruthy();
				expect( updatedContact.sig ).toBe( contactToBeUpdated.sig );
				expect( updatedContact.name ).toBe( contactToBeUpdated.name );
				expect( updatedContact.avatar ).toBe( contactToBeUpdated.avatar );
				expect( updatedContact.remark ).toBe( contactToBeUpdated.remark );
			}

			//	...
			const queryOneResponse = await request( app )
				.post( '/v1/contact/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : lastOneAddress },
					sig : ''
				} );
			expect( queryOneResponse ).toBeDefined();
			expect( queryOneResponse ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse ).toHaveProperty( '_body' );
			expect( queryOneResponse.statusCode ).toBe( 200 );
			expect( queryOneResponse._body ).toBeDefined();
			expect( queryOneResponse._body ).toHaveProperty( 'version' );
			expect( queryOneResponse._body ).toHaveProperty( 'ts' );
			expect( queryOneResponse._body ).toHaveProperty( 'tu' );
			expect( queryOneResponse._body ).toHaveProperty( 'error' );
			expect( queryOneResponse._body ).toHaveProperty( 'data' );
			expect( queryOneResponse._body.data ).toBeDefined();
			expect( queryOneResponse._body.data ).toHaveProperty( 'wallet' );
			expect( queryOneResponse._body.data ).toHaveProperty( 'hash' );
			expect( queryOneResponse._body.data.wallet ).toBe( walletObj.address );
			expect( queryOneResponse._body.data.address ).toBe( lastOneAddress );
			if ( requiredKeys &&
			     queryOneResponse &&
			     queryOneResponse._body &&
			     queryOneResponse._body.data )
			{
				const findContactAgain = queryOneResponse._body.data;
				for ( const key of requiredKeys )
				{
					expect( findContactAgain ).toHaveProperty( key );
				}

				expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === findContactAgain.deleted ).toBeTruthy();
				expect( findContactAgain.sig ).toBe( contactToBeUpdated.sig );
				expect( findContactAgain.name ).toBe( contactToBeUpdated.name );
				expect( findContactAgain.avatar ).toBe( contactToBeUpdated.avatar );
				expect( findContactAgain.remark ).toBe( contactToBeUpdated.remark );
			}

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );

		it( "should only be able to update keys that are allowed to be updated", async () =>
		{
			let contactToBeUpdated = {
				wallet : walletObj.address,
				address : lastOneAddress,
				name : `name-${ new Date().toLocaleString() }`,
				avatar : `https://avatar-${ new Date().toLocaleString() }`,
				remark : `remark .... ${ new Date().toLocaleString() }`,
				//
				//	********
				//	deleted key is not allowed to be updated, will be ignored ...
				//
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			contactToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeUpdated );
			expect( contactToBeUpdated.sig ).toBeDefined();
			expect( typeof contactToBeUpdated.sig ).toBe( 'string' );
			expect( contactToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `contact` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/contact/update' )
				.send( {
					wallet : walletObj.address,
					data : contactToBeUpdated,
					sig : contactToBeUpdated.sig
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
			if ( requiredKeys &&
			     updateResponse &&
			     updateResponse._body &&
			     updateResponse._body.data )
			{
				const updatedContact = updateResponse._body.data;
				for ( const key of requiredKeys )
				{
					expect( updatedContact ).toHaveProperty( key );
				}
				expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === updatedContact.deleted ).toBeTruthy();
				expect( updatedContact.sig ).toBe( contactToBeUpdated.sig );
				expect( updatedContact.name ).toBe( contactToBeUpdated.name );
				expect( updatedContact.avatar ).toBe( contactToBeUpdated.avatar );
				expect( updatedContact.remark ).toBe( contactToBeUpdated.remark );
			}

			//	...
			const queryOneResponse = await request( app )
				.post( '/v1/contact/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : lastOneAddress },
					sig : ''
				} );
			expect( queryOneResponse ).toBeDefined();
			expect( queryOneResponse ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse ).toHaveProperty( '_body' );
			expect( queryOneResponse.statusCode ).toBe( 200 );
			expect( queryOneResponse._body ).toBeDefined();
			expect( queryOneResponse._body ).toHaveProperty( 'version' );
			expect( queryOneResponse._body ).toHaveProperty( 'ts' );
			expect( queryOneResponse._body ).toHaveProperty( 'tu' );
			expect( queryOneResponse._body ).toHaveProperty( 'error' );
			expect( queryOneResponse._body ).toHaveProperty( 'data' );
			expect( queryOneResponse._body.data ).toBeDefined();
			expect( queryOneResponse._body.data ).toHaveProperty( 'wallet' );
			expect( queryOneResponse._body.data ).toHaveProperty( 'hash' );
			expect( queryOneResponse._body.data.wallet ).toBe( walletObj.address );
			expect( queryOneResponse._body.data.address ).toBe( lastOneAddress );
			if ( requiredKeys &&
			     queryOneResponse &&
			     queryOneResponse._body &&
			     queryOneResponse._body.data )
			{
				const findContactAgain = queryOneResponse._body.data;
				for ( const key of requiredKeys )
				{
					expect( findContactAgain ).toHaveProperty( key );
				}

				//
				//	**********
				//	field delete should be 0
				//
				expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === findContactAgain.deleted ).toBeTruthy();
				expect( findContactAgain.sig ).toBe( contactToBeUpdated.sig );
				expect( findContactAgain.name ).toBe( contactToBeUpdated.name );
				expect( findContactAgain.avatar ).toBe( contactToBeUpdated.avatar );
				expect( findContactAgain.remark ).toBe( contactToBeUpdated.remark );
			}

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );

		it( "should throw an `not found` error", async () =>
		{
			let contactToBeUpdated = {
				wallet : walletObj.address,
				address : `0xeBec795c9c8bBD61FFc14A6662944748F299cAcf`,
				name : `name-${ new Date().toLocaleString() }`,
				avatar : `https://avatar-${ new Date().toLocaleString() }`,
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			contactToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeUpdated );
			expect( contactToBeUpdated.sig ).toBeDefined();
			expect( typeof contactToBeUpdated.sig ).toBe( 'string' );
			expect( contactToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `contact` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/contact/update' )
				.send( {
					wallet : walletObj.address,
					data : contactToBeUpdated,
					sig : contactToBeUpdated.sig
				} );
			expect( updateResponse ).toBeDefined();
			expect( updateResponse ).toHaveProperty( 'statusCode' );
			expect( updateResponse ).toHaveProperty( '_body' );
			expect( updateResponse.statusCode ).toBe( 400 );
			expect( updateResponse._body ).toBeDefined();
			expect( updateResponse._body.error ).toBeDefined();
			expect( updateResponse._body.error ).toBe( 'not found' );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Deletion", () =>
	{
		it( "should logically delete a record by wallet and address from database", async () =>
		{
			let contactToBeDeleted = {
				wallet : walletObj.address,
				address : lastOneAddress,
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			contactToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeDeleted );
			expect( contactToBeDeleted.sig ).toBeDefined();
			expect( typeof contactToBeDeleted.sig ).toBe( 'string' );
			expect( contactToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `contact` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/contact/delete' )
				.send( {
					wallet : walletObj.address,
					data : contactToBeDeleted,
					sig : contactToBeDeleted.sig
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
				.post( '/v1/contact/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : lastOneAddress },
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
