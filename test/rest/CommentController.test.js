import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import { ERefDataTypes, SchemaUtil } from "debeem-store";
import { TestUtil } from "debeem-utils";
import {testWalletObjList} from "../../src/configs/TestConfig.js";

let server = null;


describe( 'CommentController', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const walletObj = testWalletObjList.alice;
	let savedPost;
	let savedComment;

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

		//
		//	create a new post with ether signature
		//
		let newPost = {
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
		newPost.sig = await Web3Signer.signObject( walletObj.privateKey, newPost, exceptedKeys );
		newPost.hash = await Web3Digester.hashObject( newPost );
		expect( newPost.sig ).toBeDefined();
		expect( typeof newPost.sig ).toBe( 'string' );
		expect( newPost.sig.length ).toBeGreaterThanOrEqual( 0 );

		const response = await request( app )
			.post( '/v1/post/add' )
			.send( {
				wallet : walletObj.address, data : newPost, sig : newPost.sig
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
		expect( response._body.data.hash ).toBe( newPost.hash );
		expect( response._body.data.sig ).toBe( newPost.sig );

		//	...
		savedPost = response._body.data;
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
		it( "should create a comment for an existing post", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			//
			//	create a new comment with ether signature
			//
			let newComment = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postHash : savedPost.hash,
				postSnippet : `post name abc`,
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
			newComment.sig = await Web3Signer.signObject( walletObj.privateKey, newComment, exceptedKeys );
			newComment.hash = await Web3Digester.hashObject( newComment, exceptedKeys );
			expect( newComment.sig ).toBeDefined();
			expect( typeof newComment.sig ).toBe( 'string' );
			expect( newComment.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/comment/add' )
				.send( {
					wallet : walletObj.address, data : newComment, sig : newComment.sig
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
			expect( response._body.data.hash ).toBe( newComment.hash );
			expect( response._body.data.sig ).toBe( newComment.sig );

			//	...
			savedComment = response._body.data;

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address from database", async () =>
		{
			expect( savedComment ).toBeDefined();
			expect( savedComment ).toHaveProperty( 'hash' );
			expect( savedComment ).toHaveProperty( 'sig' );
			expect( SchemaUtil.isValidKeccak256Hash( savedComment.hash ) ).toBeTruthy();
			expect( Web3Signer.isValidSig( savedComment.sig ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/comment/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndHash', hash : savedComment.hash },
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
			expect( response._body.data ).toHaveProperty( '_walletFavorited' );
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.hash ).toBe( savedComment.hash );
			expect( response._body.data.sig ).toBe( savedComment.sig );

		}, 60 * 10e3 );
	} );

	describe( "Query one with my favorite", () =>
	{
		it( "should return a record by wallet and hash with key `_walletFavorited`", async () =>
		{
			expect( savedComment ).toBeDefined();
			expect( savedComment ).toHaveProperty( 'hash' );
			expect( savedComment ).toHaveProperty( 'sig' );
			expect( SchemaUtil.isValidKeccak256Hash( savedComment.hash ) ).toBeTruthy();
			expect( Web3Signer.isValidSig( savedComment.sig ) ).toBeTruthy();

			let favorite = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.comment,
				refHash : savedComment.hash,
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
			//	query one
			//
			response = await request( app )
				.post( '/v1/comment/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndHash', hash : savedComment.hash },
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
			//           __v: 0,
			//           _walletFavorited: true
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
			expect( response._body.data ).toHaveProperty( '_walletFavorited' );
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.hash ).toBe( savedComment.hash );
			expect( response._body.data.sig ).toBe( savedComment.sig );
			expect( response._body.data._walletFavorited ).toBeTruthy();
		});
	});

	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/comment/queryList' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'postHash', postHash : savedPost.hash },
					sig : ''
				} );
			//
			//   console.log( response._body );
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
			//                    _id: '651a1629440e3be734bea6df',
			//                    timestamp: 1696208425667,
			//                    hash: '0xeccdb9a81b6265b7ddbb0e1c7729f2e6585687b9b0d523ac3013a26dce3ddb23',
			//                    version: '1.0.0',
			//                    deleted: '000000000000000000000000',
			//                    wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//                    sig: '0x772b7c8d32089e765a0272729ab3a380f642a9e386434a413fa6301a113f3aac411d577fa417d00ad45b19fe604babdcf92427694934ccc7389ab3b924de0d1b1b',
			//                    postHash: '0x09617c47aea6ed7cabcbed5ed269ef248138ae453b0a37d1ec45709f65300525',
			//                    authorName: 'XING',
			//                    authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//                    replyTo: 'HaSeme',
			//                    postSnippet: 'post name abc',
			//                    body: 'Hello 1',
			//                    pictures: [],
			//                    videos: [],
			//                    bitcoinPrice: '25888',
			//                    statisticView: 0,
			//                    statisticRepost: 0,
			//                    statisticQuote: 0,
			//                    statisticLike: 0,
			//                    statisticFavorite: 0,
			//                    statisticReply: 0,
			//                    remark: 'no ...',
			//                    createdAt: '2023-10-02T01:00:25.667Z',
			//                    updatedAt: '2023-10-02T01:00:25.667Z',
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
					expect( item ).toHaveProperty( 'postHash' );
					expect( item ).toHaveProperty( '_walletFavorited' );
					expect( item.wallet ).toBe( walletObj.address );
					expect( item.postHash ).toBe( savedPost.hash );
				}
			}

		}, 60 * 10e3 );
	} );

	describe( "Query list by pagination", () =>
	{
		it( "should return a list of records by pagination", async () =>
		{
			//
			//	create many contacts
			//
			for ( let i = 0; i < 100; i++ )
			{
				const NoStr = Number( i ).toString().padStart( 2, '0' );

				//
				//	create a new comment with ether signature
				//
				let newComment = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					replyTo : 'HaSeme',
					postHash : savedPost.hash,
					postSnippet : `post name abc ${ NoStr }`,
					body : `Hello 1 ${ NoStr }`,
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
				newComment.sig = await Web3Signer.signObject( walletObj.privateKey, newComment, exceptedKeys );
				newComment.hash = await Web3Digester.hashObject( newComment, exceptedKeys );
				expect( newComment.sig ).toBeDefined();
				expect( typeof newComment.sig ).toBe( 'string' );
				expect( newComment.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/comment/add' )
					.send( {
						wallet : walletObj.address,
						data : newComment,
						sig : newComment.sig
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
				expect( response._body.data.hash ).toBe( newComment.hash );

				//	...
				savedComment = response._body.data;
			}

			//
			//	....
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/comment/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'postHash', postHash : savedPost.hash, options : { pageNo : page, pageSize : 10 } },
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
						expect( item ).toHaveProperty( 'postHash' );
						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item.wallet ).toBe( walletObj.address );
						expect( item.postHash ).toBe( savedPost.hash );
					}
				}
			}

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );


	describe( "Query children by pagination", () =>
	{
		it( "should return a list of records by pagination", async () =>
		{
			//
			//	create a parent comment
			//
			let parentComment = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postHash : savedPost.hash,
				postSnippet : `post snippet`,
				body : `Hello, this is the parent comment`,
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
			parentComment.sig = await Web3Signer.signObject( walletObj.privateKey, parentComment, exceptedKeys );
			parentComment.hash = await Web3Digester.hashObject( parentComment, exceptedKeys );
			expect( parentComment.sig ).toBeDefined();
			expect( typeof parentComment.sig ).toBe( 'string' );
			expect( parentComment.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/comment/add' )
				.send( {
					wallet : walletObj.address,
					data : parentComment,
					sig : parentComment.sig
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

			//
			//	create children comments
			//
			for ( let i = 0; i < 100; i++ )
			{
				const NoStr = Number( i ).toString().padStart( 2, '0' );

				//
				//	create a new comment with ether signature
				//
				let newComment = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					parentHash : parentComment.hash,
					replyTo : 'HaSeme',
					postHash : savedPost.hash,
					postSnippet : `post name abc ${ NoStr }`,
					body : `Hello 1 ${ NoStr }`,
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
				newComment.sig = await Web3Signer.signObject( walletObj.privateKey, newComment, exceptedKeys );
				newComment.hash = await Web3Digester.hashObject( newComment, exceptedKeys );
				expect( newComment.sig ).toBeDefined();
				expect( typeof newComment.sig ).toBe( 'string' );
				expect( newComment.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/comment/add' )
					.send( {
						wallet : walletObj.address,
						data : newComment,
						sig : newComment.sig
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
				expect( response._body.data.hash ).toBe( newComment.hash );

				//	...
				savedComment = response._body.data;
			}

			//
			//	Query the normal list by pagination
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/comment/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'postHash', postHash : savedPost.hash, options : { pageNo : page, pageSize : 10 } },
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
						expect( item ).toHaveProperty( 'postHash' );
						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item.wallet ).toBe( walletObj.address );
						expect( item.postHash ).toBe( savedPost.hash );
					}
				}
			}

			//
			//	Query children by pagination
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/comment/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'postHashAndParentHash',
							postHash : savedPost.hash,
							parentHash : parentComment.hash,
							options : { pageNo : page, pageSize : 10 }
						},
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
						expect( item ).toHaveProperty( 'postHash' );
						expect( item.wallet ).toBe( walletObj.address );
						expect( item.postHash ).toBe( savedPost.hash );

						expect( item ).toHaveProperty( `parentHash` );
						expect( item.parentHash ).toBe( parentComment.hash );

						//
						//	wallet : walletObj.address,
						//
						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item._walletFavorited ).toBe( false );
					}
				}
			}


			//
			//	Query children with empty wallet by pagination
			//
			for ( let page = 1; page <= 10; page++ )
			{
				const response = await request( app )
					.post( '/v1/comment/queryList' )
					.send( {
						wallet : ``,
						data : { by : 'postHashAndParentHash',
							postHash : savedPost.hash,
							parentHash : parentComment.hash,
							options : { pageNo : page, pageSize : 10 }
						},
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
						expect( item ).toHaveProperty( 'postHash' );
						expect( item.wallet ).toBe( walletObj.address );
						expect( item.postHash ).toBe( savedPost.hash );

						expect( item ).toHaveProperty( `parentHash` );
						expect( item.parentHash ).toBe( parentComment.hash );

						//
						//	wallet : ``,
						//
						expect( item ).not.toHaveProperty( '_walletFavorited' );
						expect( item._walletFavorited ).toBe( undefined );
					}
				}
			}

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	});


	describe( "Updating", () =>
	{
		it( "should throw `updating is banned` when we try to update data", async () =>
		{
			let toBeUpdated = {
				wallet : walletObj.address,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated, exceptedKeys );
			expect( toBeUpdated.sig ).toBeDefined();
			expect( typeof toBeUpdated.sig ).toBe( 'string' );
			expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `post` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/comment/update' )
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
			expect( savedComment ).toBeDefined();
			expect( SchemaUtil.isValidKeccak256Hash( savedComment.hash ) ).toBeTruthy();

			let toBeDeleted = {
				wallet : walletObj.address,
				hash : savedComment.hash,
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted, exceptedKeys );
			expect( toBeDeleted.sig ).toBeDefined();
			expect( typeof toBeDeleted.sig ).toBe( 'string' );
			expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `post` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/comment/delete' )
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
				.post( '/v1/comment/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndHash', hash : savedComment.hash },
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
