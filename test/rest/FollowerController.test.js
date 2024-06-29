import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import { SchemaUtil } from "debeem-store";
import { TestUtil } from "debeem-utils";
import {testWalletObjList} from "../../src/configs/TestConfig.js";

let server = null;


describe( 'FollowerController', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const walletObj = testWalletObjList.alice;
	let oneFollowerAddress = EtherWallet.createWalletFromMnemonic().address;
	let savedFollower;


	beforeAll( async () =>
	{
		if ( null === server )
		{
			server = await startHttpServer( {} );
		}

		//	assert ...
		expect( walletObj ).not.toBeNull();
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
		await server.close();
		// return new Promise( ( resolve ) =>
		// {
		// 	server.close( () =>
		// 	{
		// 		//console.log( 'Http Server is closed' );
		// 		resolve();	// Test has been completed
		// 	} );
		// } );
	} );



	describe( "Add record", () =>
	{
		it( "should create a follow relationship", async () =>
		{
			//
			//	create a new follower with ether signature
			//
			oneFollowerAddress = EtherWallet.createWalletFromMnemonic().address;
			let follower = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : oneFollowerAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
			follower.hash = await Web3Digester.hashObject( follower );
			expect( follower.sig ).toBeDefined();
			expect( typeof follower.sig ).toBe( 'string' );
			expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/follower/add' )
				.send( {
					wallet : walletObj.address, data : follower, sig : follower.sig
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
			expect( response._body.data.hash ).toBe( follower.hash );
			expect( response._body.data.sig ).toBe( follower.sig );

			//	...
			savedFollower = response._body.data;

			//	wait for a while
			await TestUtil.sleep( 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "it should create a follow relationship", async () =>
		{
			//
			//	create a new follower with ether signature
			//
			oneFollowerAddress = EtherWallet.createWalletFromMnemonic().address;
			let follower = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : oneFollowerAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
			follower.hash = await Web3Digester.hashObject( follower );
			expect( follower.sig ).toBeDefined();
			expect( typeof follower.sig ).toBe( 'string' );
			expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/follower/add' )
				.send( {
					wallet : walletObj.address, data : follower, sig : follower.sig
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
			expect( response._body.data.hash ).toBe( follower.hash );
			expect( response._body.data.sig ).toBe( follower.sig );

			//	...
			savedFollower = response._body.data;

			//	wait for a while
			await TestUtil.sleep( 1000 );

		}, 60 * 10e3 );

		it( "should return a record by wallet and address from database", async () =>
		{
			expect( savedFollower ).toBeDefined();
			expect( savedFollower ).toHaveProperty( 'hash' );
			expect( savedFollower ).toHaveProperty( 'sig' );
			expect( savedFollower ).toHaveProperty( 'address' );
			expect( SchemaUtil.isValidKeccak256Hash( savedFollower.hash ) ).toBeTruthy();
			expect( Web3Signer.isValidSig( savedFollower.sig ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/follower/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : savedFollower.address },
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
			expect( response._body.data.hash ).toBe( savedFollower.hash );
			expect( response._body.data.sig ).toBe( savedFollower.sig );
			expect( response._body.data.address ).toBe( savedFollower.address );

		}, 60 * 10e3 );
	} );

	describe( "Query list", () =>
	{
		it( "it should create a follow relationship", async () =>
		{
			//
			//	create a new follower with ether signature
			//
			oneFollowerAddress = EtherWallet.createWalletFromMnemonic().address;
			let follower = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : oneFollowerAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
			follower.hash = await Web3Digester.hashObject( follower );
			expect( follower.sig ).toBeDefined();
			expect( typeof follower.sig ).toBe( 'string' );
			expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/follower/add' )
				.send( {
					wallet : walletObj.address, data : follower, sig : follower.sig
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
			expect( response._body.data.hash ).toBe( follower.hash );
			expect( response._body.data.sig ).toBe( follower.sig );

			//	...
			savedFollower = response._body.data;

			//	wait for a while
			await TestUtil.sleep( 1000 );

		}, 60 * 10e3 );

		it( "should return a list of records", async () =>
		{
			expect( savedFollower ).toBeDefined();
			expect( savedFollower ).toHaveProperty( 'hash' );
			expect( savedFollower ).toHaveProperty( 'address' );
			expect( SchemaUtil.isValidKeccak256Hash( savedFollower.hash ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( savedFollower.address ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/follower/queryList' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : savedFollower.address },
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
			// 			_id: '651a71c16aa893b53a608d06',
			// 			timestamp: 1696231873274,
			// 			hash: '0x58e4baefbfc8e475b228dc945f0d073a2be61d9079ec6d2895d9b292a271413c',
			// 			version: '1.0.0',
			// 			deleted: '000000000000000000000000',
			// 			wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			// 			sig: '0xb29a3f70a1ca9e35e0a601d02abf2486107c566d75665066e7725651ea60f57a66e5875782e7fb7737279eaf96d70f142074be926cd59f99720736ba3a5c1e5c1c',
			// 			address: '0xB804e92d2EA4580432AB1720460CE29B3E61450b',
			// 			name: 'Sam',
			// 			avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			// 			remark: 'no remark',
			// 			createdAt: '2023-10-02T07:31:13.274Z',
			// 			updatedAt: '2023-10-02T07:31:13.274Z',
			// 			__v: 0
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
			for ( let i = 0; i < 50; i++ )
			{
				const NoStr = Number( i ).toString().padStart( 2, '0' );

				//
				//	create a new comment with ether signature
				//
				oneFollowerAddress = EtherWallet.createWalletFromMnemonic().address;
				let follower = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					address : oneFollowerAddress,
					sig : ``,
					name : `Sam ${ NoStr }`,
					avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					remark : `no remark ${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
				follower.hash = await Web3Digester.hashObject( follower );
				expect( follower.sig ).toBeDefined();
				expect( typeof follower.sig ).toBe( 'string' );
				expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/follower/add' )
					.send( {
						wallet : walletObj.address,
						data : follower,
						sig : follower.sig
					} );
				//console.log( response );
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
				expect( response._body.data.hash ).toBe( follower.hash );

				//	...
				savedFollower = response._body.data;
			}

			//
			//	....
			//
			for ( let page = 1; page <= 5; page++ )
			{
				const response = await request( app )
					.post( '/v1/follower/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'walletAndAddress', address : undefined, options : { pageNo : page, pageSize : 10 } },
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
			await TestUtil.sleep( 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Updating", () =>
	{
		it( "should throw `updating is banned` when we try to update data", async () =>
		{
			let toBeUpdated = {
				wallet : walletObj.address,
				address : oneFollowerAddress,
				name : `Sam ${ new Date().toLocaleString() }`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated );
			expect( toBeUpdated.sig ).toBeDefined();
			expect( typeof toBeUpdated.sig ).toBe( 'string' );
			expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			const updateResponse = await request( app )
				.post( '/v1/follower/update' )
				.send( {
					wallet : walletObj.address,
					data : toBeUpdated,
					sig : toBeUpdated.sig
				} );
			expect( updateResponse ).toBeDefined();
			expect( updateResponse ).toHaveProperty( 'statusCode' );
			expect( updateResponse ).toHaveProperty( '_body' );
			expect( updateResponse.statusCode ).toBe( 400 );
			expect( updateResponse._body ).toBeDefined();
			expect( updateResponse._body ).toHaveProperty( 'version' );
			expect( updateResponse._body ).toHaveProperty( 'ts' );
			expect( updateResponse._body ).toHaveProperty( 'tu' );
			expect( updateResponse._body ).toHaveProperty( 'error' );
			expect( updateResponse._body ).toHaveProperty( 'data' );
			expect( updateResponse._body.error ).toBeDefined();
			expect( updateResponse._body.error ).toBe( 'updating is banned' );

			//	wait for a while
			await TestUtil.sleep(1000 );

		}, 60 * 10e3 );
	} );

	describe( "Deletion", () =>
	{
		it( `should logically delete a record by hash`, async () =>
		{
			const walletObj = testWalletObjList.alice;

			//
			//	create a new follower with ether signature
			//
			const newFollowerAddress = EtherWallet.createWalletFromMnemonic().address;
			let follower = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : newFollowerAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
			follower.hash = await Web3Digester.hashObject( follower );
			expect( follower.sig ).toBeDefined();
			expect( typeof follower.sig ).toBe( 'string' );
			expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

			const addResponse = await request( app )
				.post( '/v1/follower/add' )
				.send( {
					wallet : walletObj.address, data : follower, sig : follower.sig
				} );
			expect( addResponse ).toBeDefined();
			expect( addResponse ).toHaveProperty( 'statusCode' );
			expect( addResponse ).toHaveProperty( '_body' );
			if ( 200 !== addResponse.statusCode )
			{
				console.log( addResponse );
			}
			expect( addResponse.statusCode ).toBe( 200 );
			expect( addResponse._body ).toBeDefined();
			expect( addResponse._body ).toHaveProperty( 'version' );
			expect( addResponse._body ).toHaveProperty( 'ts' );
			expect( addResponse._body ).toHaveProperty( 'tu' );
			expect( addResponse._body ).toHaveProperty( 'error' );
			expect( addResponse._body ).toHaveProperty( 'data' );
			expect( addResponse._body.data ).toBeDefined();
			expect( addResponse._body.data ).toHaveProperty( 'hash' );
			expect( addResponse._body.data ).toHaveProperty( 'sig' );
			expect( addResponse._body.data ).toHaveProperty( 'wallet' );
			expect( addResponse._body.data ).toHaveProperty( 'address' );
			expect( addResponse._body.data.hash ).toBe( follower.hash );
			expect( addResponse._body.data.sig ).toBe( follower.sig );
			expect( addResponse._body.data.wallet ).toBe( walletObj.address );
			expect( addResponse._body.data.address ).toBe( newFollowerAddress );

			//	...
			const addedFollower = addResponse._body.data;
			//console.log( `addedFollower :`, addedFollower );

			//	wait for a while
			await TestUtil.sleep( 1000 );

			//	...
			const queryOnePostData = {
				wallet : walletObj.address,
				data : { by : 'walletAndAddress', address : addedFollower.address },
				sig : ''
			};
			//console.log( `queryOnePostData :`, JSON.stringify( queryOnePostData ) );
			//	should output:
			//	queryOnePostData : {"wallet":"0xc8f60eaf5988ac37a2963ac5fabe97f709d6b357","data":{"by":"walletAndAddress","address":"0xbbbda6fff1633a7c50e24949a87afc451b909bc3"},"sig":""}
			const queryOneResponse1 = await request( app )
				.post( '/v1/follower/queryOne' )
				.send( queryOnePostData );
			expect( queryOneResponse1 ).toBeDefined();
			expect( queryOneResponse1 ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse1 ).toHaveProperty( '_body' );
			expect( queryOneResponse1.statusCode ).toBe( 200 );
			expect( queryOneResponse1._body ).toBeDefined();
			//console.log( `queryOneResponse1._body.data :`, queryOneResponse1._body.data );

			expect( queryOneResponse1._body.data ).toBeDefined();
			expect( queryOneResponse1._body.data ).toHaveProperty( `hash` );
			expect( queryOneResponse1._body.data ).toHaveProperty( `wallet` );
			expect( queryOneResponse1._body.data ).toHaveProperty( `address` );
			expect( queryOneResponse1._body.data ).toHaveProperty( `sig` );
			expect( queryOneResponse1._body.data.wallet ).toBe( walletObj.address );
			expect( queryOneResponse1._body.data.address ).toBe( newFollowerAddress );


			//	wait for a while
			await TestUtil.sleep( 1000 );

			//	delete
			let toBeDeleted = {
				wallet : walletObj.address,
				address : addedFollower.address,
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted );
			expect( toBeDeleted.sig ).toBeDefined();
			expect( typeof toBeDeleted.sig ).toBe( 'string' );
			expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const deletePostData = {
				wallet : walletObj.address,
				data : toBeDeleted,
				sig : toBeDeleted.sig
			};
			//console.log( `deletePostData :`, JSON.stringify( deletePostData ) );
			const deleteResponse = await request( app )
				.post( '/v1/follower/delete' )
				.send( deletePostData );
			expect( deleteResponse ).toBeDefined();
			expect( deleteResponse ).toHaveProperty( 'statusCode' );
			expect( deleteResponse ).toHaveProperty( '_body' );
			if ( 200 !== deleteResponse.statusCode )
			{
				console.log( deleteResponse );
			}
			expect( deleteResponse.statusCode ).toBe( 200 );
			expect( deleteResponse._body ).toBeDefined();
			expect( deleteResponse._body ).toHaveProperty( 'version' );
			expect( deleteResponse._body ).toHaveProperty( 'ts' );
			expect( deleteResponse._body ).toHaveProperty( 'tu' );
			expect( deleteResponse._body ).toHaveProperty( 'error' );
			expect( deleteResponse._body ).toHaveProperty( 'data' );
			expect( deleteResponse._body.data ).toBeDefined();
			expect( deleteResponse._body.data ).toBeGreaterThanOrEqual( 1 );
			//console.log( `deleteResponse._body.data :`, deleteResponse._body.data );

			//	wait for a while
			await TestUtil.sleep( 1000 );

			//	...
			const queryOneResponse2 = await request( app )
				.post( '/v1/follower/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndAddress', address : addedFollower.address },
					sig : ''
				} );
			expect( queryOneResponse2 ).toBeDefined();
			expect( queryOneResponse2 ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse2 ).toHaveProperty( '_body' );
			expect( queryOneResponse2.statusCode ).toBe( 200 );
			expect( queryOneResponse2._body ).toBeDefined();
			//console.log( `queryOneResponse2._body.data :`, queryOneResponse2._body.data );
			expect( queryOneResponse2._body.data ).toBeDefined();
			expect( queryOneResponse2._body.data ).toBe( null );


		}, 60 * 10e3 );
	} );
} );
