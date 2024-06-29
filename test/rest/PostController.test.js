import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import {ERefDataTypes, PostService, SchemaUtil} from "debeem-store";
import { TestUtil } from "debeem-utils";
import _ from "lodash";
import {testWalletObjList} from "./PostControllerFavLike.test.js";

let server = null;


describe( 'PostController', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const walletObj = testWalletObjList.alice;
	let lastOneAddress;
	let savedPost;

	const statisticKeys = SchemaUtil.getPrefixedKeys( `post`, 'statistic' );
	const exceptedKeys = Array.isArray( statisticKeys ) ? statisticKeys : [];


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
		return new Promise( ( resolve ) =>
		{
			server.close( () =>
			{
				//console.log( 'Http Server is closed' );
				resolve();	// Test has been completed
			} );
		} );
	} );

	beforeEach( async () =>
	{
		return new Promise( async ( resolve ) =>
		{
			//
			//	will clear data
			//
			const postService = new PostService();
			await postService.clearAll();


			//
			//	create a new post with ether signature
			//
			let newRecord = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : '25888',
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			newRecord.sig = await Web3Signer.signObject( walletObj.privateKey, newRecord, exceptedKeys );
			newRecord.hash = await Web3Digester.hashObject( newRecord );
			expect( newRecord.sig ).toBeDefined();
			expect( typeof newRecord.sig ).toBe( 'string' );
			expect( newRecord.sig.length ).toBeGreaterThanOrEqual( 0 );

			const postData = {
				wallet : walletObj.address, data : newRecord, sig : newRecord.sig
			};
			console.log( `postData :`, JSON.stringify( postData ) );
			const response = await request( app )
				.post( '/v1/post/add' )
				.send( postData );
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
			expect( response._body.data.hash ).toBe( newRecord.hash );
			expect( response._body.data.sig ).toBe( newRecord.sig );

			//	...
			savedPost = response._body.data;

			//	wait for a while
			await TestUtil.sleep( 3 * 1000 );

			//	...
			resolve();	// Test has been completed
		} );
	});



	describe( "Add record", () =>
	{
		it( "it should response the POST method by path /v1/post/add", async () =>
		{
			//
			//	tested in .beforeEach
			//
			expect( true ).toBeTruthy();

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/post/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndHash', hash : savedPost.hash },
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
			expect( response._body.data.hash ).toBe( savedPost.hash );
			expect( response._body.data.sig ).toBe( savedPost.sig );

		}, 60 * 10e3 );
	} );

	describe( "Query one with my favorite and like", () =>
	{
		it( "should return a record with key `_walletFavorited` and `_walletLiked`", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			//
			//	favorite this post
			//
			let favorite = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite, exceptedKeys );
			favorite.hash = await Web3Digester.hashObject( favorite );
			expect( favorite.sig ).toBeDefined();
			expect( typeof favorite.sig ).toBe( 'string' );
			expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

			let response = await request( app )
				.post( '/v1/favorite/add' )
				.send( {
					wallet : walletObj.address, data : favorite, sig : favorite.sig
				} );
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			if ( 200 !== response.statusCode )
			{
				console.log( response );
			}
			expect( response.statusCode ).toBe( 200 );


			//
			//	like this post
			//
			let like = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			like.sig = await Web3Signer.signObject( walletObj.privateKey, like, exceptedKeys );
			like.hash = await Web3Digester.hashObject( like );
			expect( like.sig ).toBeDefined();
			expect( typeof like.sig ).toBe( 'string' );
			expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

			response = await request( app )
				.post( '/v1/like/add' )
				.send( {
					wallet : walletObj.address, data : like, sig : like.sig
				} );
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			if ( 200 !== response.statusCode )
			{
				console.log( response );
			}
			expect( response.statusCode ).toBe( 200 );


			//
			//	query
			//
			response = await request( app )
				.post( '/v1/post/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'hash', hash : savedPost.hash },
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
			//           _walletFavorited: true,
			//           _walletLiked: true,
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
			expect( response._body.data.hash ).toBe( savedPost.hash );
			expect( response._body.data.sig ).toBe( savedPost.sig );

			expect( response._body.data ).toHaveProperty( '_walletFavorited' );
			expect( response._body.data._walletFavorited ).toBeTruthy();

			expect( response._body.data ).toHaveProperty( '_walletLiked' );
			expect( response._body.data._walletLiked ).toBeTruthy();
		});
	});

	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			const response = await request( app )
				.post( '/v1/post/queryList' )
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

					expect( item ).toHaveProperty( '_walletFavorited' );
					expect( item ).toHaveProperty( '_walletLiked' );
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
				//	create a new post with ether signature
				//
				let newRecord = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					body : 'Hello 1',
					pictures : [],
					videos : [],
					bitcoinPrice : '25888',
					statisticView : 0,
					statisticRepost : 0,
					statisticQuote : 0,
					statisticLike : 0,
					statisticFavorite : 0,
					statisticReply : 0,
					remark : 'no ...',
					createdAt: new Date(),
					updatedAt: new Date()
				};
				newRecord.sig = await Web3Signer.signObject( walletObj.privateKey, newRecord, exceptedKeys );
				newRecord.hash = await Web3Digester.hashObject( newRecord );
				expect( newRecord.sig ).toBeDefined();
				expect( typeof newRecord.sig ).toBe( 'string' );
				expect( newRecord.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/post/add' )
					.send( {
						wallet : walletObj.address, data : newRecord, sig : newRecord.sig
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
				expect( response._body.data.hash ).toBe( newRecord.hash );

				//	...
				savedPost = response._body.data;
			}

			//
			//	....
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/post/queryList' )
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
				expect( response._body.data.list.length ).toBeGreaterThan( 0 );
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

						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item ).toHaveProperty( '_walletLiked' );
					}
				}
			}

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 120 * 10e3 );
	} );

	describe( "Updating", () =>
	{
		it( "should update a record by wallet and address from database", async () =>
		{
			let toBeUpdated = {
				wallet : walletObj.address,
				address : lastOneAddress,
				name : `name-${ new Date().toLocaleString() }`,
				avatar : `https://avatar-${ new Date().toLocaleString() }`,
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated );
			expect( toBeUpdated.sig ).toBeDefined();
			expect( typeof toBeUpdated.sig ).toBe( 'string' );
			expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `post` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/post/update' )
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
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Deletion", () =>
	{
		it( `should logically delete a record by hash`, async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			//
			//	queryOne for the first time
			//
			const queryOneResponse1 = await request( app )
				.post( '/v1/post/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'hash', hash : savedPost.hash },
					sig : ''
				} );
			//console.log( `queryOneResponse1._body :`, queryOneResponse1._body );
			expect( queryOneResponse1 ).toBeDefined();
			expect( queryOneResponse1 ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse1 ).toHaveProperty( '_body' );
			expect( queryOneResponse1.statusCode ).toBe( 200 );
			expect( queryOneResponse1._body ).toBeDefined();
			expect( queryOneResponse1._body ).toHaveProperty( 'data' );
			expect( queryOneResponse1._body.data ).toBeDefined();
			expect( queryOneResponse1._body.data ).toHaveProperty( 'wallet' );
			expect( queryOneResponse1._body.data ).toHaveProperty( 'hash' );
			expect( queryOneResponse1._body.data ).toHaveProperty( 'sig' );
			expect( queryOneResponse1._body.data.wallet ).toBe( walletObj.address );
			expect( queryOneResponse1._body.data.hash ).toBe( savedPost.hash );
			expect( queryOneResponse1._body.data.sig ).toBe( savedPost.sig );


			//
			//	delete
			//
			let toBeDeleted = {
				wallet : walletObj.address,
				hash : savedPost.hash,
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted );
			expect( toBeDeleted.sig ).toBeDefined();
			expect( typeof toBeDeleted.sig ).toBe( 'string' );
			expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `post` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updatePostData = {
				wallet : walletObj.address,
				data : toBeDeleted,
				sig : toBeDeleted.sig
			};
			console.log( `updatePostData :`, JSON.stringify( updatePostData ) );
			const updateResponse = await request( app )
				.post( '/v1/post/delete' )
				.send( updatePostData );
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
				.post( '/v1/post/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndHash', hash : savedPost.hash },
					sig : ''
				} );
			expect( queryOneResponse ).toBeDefined();
			expect( queryOneResponse ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse ).toHaveProperty( '_body' );
			expect( queryOneResponse.statusCode ).toBe( 200 );
			expect( queryOneResponse._body ).toBeDefined();
			expect( queryOneResponse._body.data ).toBeDefined();
			expect( queryOneResponse._body.data ).toBe( null );

			//
			const queryListResponse = await request( app )
				.post( '/v1/post/queryList' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'wallet' },
					sig : ''
				} );
			expect( queryListResponse ).toBeDefined();
			expect( queryListResponse ).toHaveProperty( 'statusCode' );
			expect( queryListResponse ).toHaveProperty( '_body' );
			expect( queryListResponse.statusCode ).toBe( 200 );
			expect( queryListResponse._body ).toBeDefined();
			expect( queryListResponse._body ).toHaveProperty( 'version' );
			expect( queryListResponse._body ).toHaveProperty( 'ts' );
			expect( queryListResponse._body ).toHaveProperty( 'tu' );
			expect( queryListResponse._body ).toHaveProperty( 'error' );
			expect( queryListResponse._body ).toHaveProperty( 'data' );
			expect( queryListResponse._body.data ).toBeDefined();
			expect( queryListResponse._body.data ).toHaveProperty( 'total' );
			expect( queryListResponse._body.data ).toHaveProperty( 'pageNo' );
			expect( queryListResponse._body.data ).toHaveProperty( 'pageSize' );
			expect( queryListResponse._body.data ).toHaveProperty( 'list' );
			expect( Array.isArray( queryListResponse._body.data.list ) ).toBeTruthy();
			expect( queryListResponse._body.data.total ).toBe( 0 );
			expect( queryListResponse._body.data.total ).toBeGreaterThanOrEqual( queryListResponse._body.data.list.length );

		}, 60 * 10e3 );
	} );

	describe( "Test statisticView", () =>
	{
		it( "should increase the value of statisticView after calling queryOne", async () =>
		{
			//
			//	create a new post with ether signature
			//
			let newRecord = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : '25888',
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			newRecord.sig = await Web3Signer.signObject( walletObj.privateKey, newRecord, exceptedKeys );
			newRecord.hash = await Web3Digester.hashObject( newRecord );
			expect( newRecord.sig ).toBeDefined();
			expect( typeof newRecord.sig ).toBe( 'string' );
			expect( newRecord.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/post/add' )
				.send( {
					wallet : walletObj.address, data : newRecord, sig : newRecord.sig
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
			expect( response._body.data.hash ).toBe( newRecord.hash );
			expect( response._body.data.sig ).toBe( newRecord.sig );

			//
			//	will increase the value of statisticView after calling queryOne
			//
			const queryOneResponse = await request( app )
				.post( '/v1/post/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'hash', hash : newRecord.hash },
					sig : ''
				} );
			expect( queryOneResponse ).toBeDefined();
			expect( queryOneResponse ).toHaveProperty( 'statusCode' );
			expect( queryOneResponse ).toHaveProperty( '_body' );
			expect( queryOneResponse.statusCode ).toBe( 200 );
			expect( queryOneResponse._body ).toBeDefined();
			expect( queryOneResponse._body.data ).toBeDefined();
			expect( queryOneResponse._body.data ).toBeDefined();
			expect( queryOneResponse._body.data ).toHaveProperty( 'hash' );
			expect( queryOneResponse._body.data ).toHaveProperty( 'sig' );
			expect( queryOneResponse._body.data ).toHaveProperty( 'statisticView' );
			expect( queryOneResponse._body.data.hash ).toBe( newRecord.hash );
			expect( queryOneResponse._body.data.sig ).toBe( newRecord.sig );
			expect( _.isNumber( queryOneResponse._body.data.statisticView ) ).toBeTruthy();
			expect( queryOneResponse._body.data.statisticView ).toBe( 1 );

		});
		it( 'should increase the value of statisticShare', async () =>
		{
			//
			//	create a new post with ether signature
			//
			let newRecord = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : '25888',
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			newRecord.sig = await Web3Signer.signObject( walletObj.privateKey, newRecord, exceptedKeys );
			newRecord.hash = await Web3Digester.hashObject( newRecord );
			expect( newRecord.sig ).toBeDefined();
			expect( typeof newRecord.sig ).toBe( 'string' );
			expect( newRecord.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/post/add' )
				.send( {
					wallet : walletObj.address, data : newRecord, sig : newRecord.sig
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
			expect( response._body.data.hash ).toBe( newRecord.hash );
			expect( response._body.data.sig ).toBe( newRecord.sig );


			//
			//	increase the value of statisticShare
			//
			const updateForResponse1 = await request( app )
				.post( '/v1/post/updateFor' )
				.send( {
					wallet : walletObj.address,
					data : { hash : newRecord.hash, key : `statisticShare`, value : 1 },
					sig : undefined
				} );
			expect( updateForResponse1 ).toBeDefined();
			expect( updateForResponse1 ).toHaveProperty( 'statusCode' );
			expect( updateForResponse1 ).toHaveProperty( '_body' );
			if ( 200 !== updateForResponse1.statusCode )
			{
				console.log( updateForResponse1 );
			}
			expect( updateForResponse1.statusCode ).toBe( 200 );
			expect( updateForResponse1._body ).toBeDefined();
			expect( updateForResponse1._body ).toHaveProperty( 'version' );
			expect( updateForResponse1._body ).toHaveProperty( 'ts' );
			expect( updateForResponse1._body ).toHaveProperty( 'tu' );
			expect( updateForResponse1._body ).toHaveProperty( 'error' );
			expect( updateForResponse1._body ).toHaveProperty( 'data' );
			expect( updateForResponse1._body.data ).toBeDefined();
			expect( updateForResponse1._body.data ).toHaveProperty( 'hash' );
			expect( updateForResponse1._body.data ).toHaveProperty( 'sig' );
			expect( updateForResponse1._body.data ).toHaveProperty( 'statisticShare' );
			expect( updateForResponse1._body.data.hash ).toBe( newRecord.hash );
			expect( updateForResponse1._body.data.sig ).toBe( newRecord.sig );
			expect( updateForResponse1._body.data.statisticShare ).toBe( 1 );


			//
			//	increase the value of statisticShare
			//
			const updateForResponse2 = await request( app )
				.post( '/v1/post/updateFor' )
				.send( {
					wallet : walletObj.address,
					data : { hash : newRecord.hash, key : `statisticShare`, value : 1 },
					sig : undefined
				} );
			expect( updateForResponse2 ).toBeDefined();
			expect( updateForResponse2 ).toHaveProperty( 'statusCode' );
			expect( updateForResponse2 ).toHaveProperty( '_body' );
			if ( 200 !== updateForResponse2.statusCode )
			{
				console.log( updateForResponse2 );
			}
			expect( updateForResponse2.statusCode ).toBe( 200 );
			expect( updateForResponse2._body ).toBeDefined();
			expect( updateForResponse2._body ).toHaveProperty( 'version' );
			expect( updateForResponse2._body ).toHaveProperty( 'ts' );
			expect( updateForResponse2._body ).toHaveProperty( 'tu' );
			expect( updateForResponse2._body ).toHaveProperty( 'error' );
			expect( updateForResponse2._body ).toHaveProperty( 'data' );
			expect( updateForResponse2._body.data ).toBeDefined();
			expect( updateForResponse2._body.data ).toHaveProperty( 'hash' );
			expect( updateForResponse2._body.data ).toHaveProperty( 'sig' );
			expect( updateForResponse2._body.data ).toHaveProperty( 'statisticShare' );
			expect( updateForResponse2._body.data.hash ).toBe( newRecord.hash );
			expect( updateForResponse2._body.data.sig ).toBe( newRecord.sig );
			expect( updateForResponse2._body.data.statisticShare ).toBe( 2 );
		});
	});
} );
