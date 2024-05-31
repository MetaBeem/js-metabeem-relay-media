import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ERefDataTypes, FavoriteService, FollowerService, LikeService, PostService, SchemaUtil } from "debeem-store";
import { TestUtil, TypeUtil } from "debeem-utils";
import _ from "lodash";
import { isAddress } from "ethers";

let server = null;


/**
 *    define test users
 */
export const testUserList = [
	{
		id : 1,
		name : 'Alice',
		mnemonic : 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient',
	},
	{
		id : 2,
		name : 'Bob',
		mnemonic : 'evidence cement snap basket genre fantasy degree ability sunset pistol palace target',
	},
	{
		id : 3,
		name : 'Mary',
		mnemonic : 'electric shoot legal trial crane rib garlic claw armed snow blind advance',
	}
];
export const testUserAlice = 0;
export const testUserBob = 1;
export const testUserMary = 2;


describe( 'PortalController', () =>
{
	let walletObj;
	let savedPost;

	const statisticKeys = SchemaUtil.getPrefixedKeys( `post`, 'statistic' );
	const exceptedKeys = Array.isArray( statisticKeys ) ? statisticKeys : [];


	beforeAll( async () =>
	{
		if ( null === server )
		{
			server = await startHttpServer( {} );
		}

		//
		//	will clear data
		//
		const postService = new PostService();
		await postService.clearAll();

		const favoriteService = new FavoriteService();
		await favoriteService.clearAll();

		const likeService = new LikeService();
		await likeService.clearAll();

		const followerService = new FollowerService();
		await followerService.clearAll();
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


	describe( "Test recommended portal", () =>
	{
		it( "should create some posts, and then favorite and like them", async () =>
		{
			for ( let i = 0; i < 50; i++ )
			{
				//	randomly, choose a user
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ new Date().getTime() % 3 ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

				let post = {
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
					createdAt : new Date(),
					updatedAt : new Date()
				};
				post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
				post.hash = await Web3Digester.hashObject( post );
				expect( post.sig ).toBeDefined();
				expect( typeof post.sig ).toBe( 'string' );
				expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

				let response = await request( app )
					.post( '/v1/post/add' )
					.send( {
						wallet : walletObj.address, data : post, sig : post.sig
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
				expect( response._body.data.hash ).toBe( post.hash );

				//	...
				savedPost = _.cloneDeep( response._body.data );

				//
				//	randomly, choose a user and favorite the post we just created
				//
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ new Date().getTime() % 3 ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

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
					createdAt : new Date(),
					updatedAt : new Date()
				};
				favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite, exceptedKeys );
				favorite.hash = await Web3Digester.hashObject( favorite );
				expect( favorite.sig ).toBeDefined();
				expect( typeof favorite.sig ).toBe( 'string' );
				expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

				response = await request( app )
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
				expect( response._body.data ).toBeDefined();
				expect( response._body.data ).toHaveProperty( '_id' );
				expect( response._body.data ).toHaveProperty( 'hash' );
				expect( response._body.data ).toHaveProperty( 'wallet' );
				expect( response._body.data ).toHaveProperty( 'refHash' );
				expect( response._body.data.hash ).toBe( favorite.hash );
				expect( response._body.data.sig ).toBe( favorite.sig );


				//
				//	randomly, choose a user and like the post we just created
				//
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ new Date().getTime() % 3 ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

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
					createdAt : new Date(),
					updatedAt : new Date()
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
				expect( response._body ).toBeDefined();
				expect( response._body.data ).toBeDefined();
				expect( response._body.data ).toHaveProperty( '_id' );
				expect( response._body.data ).toHaveProperty( 'hash' );
				expect( response._body.data ).toHaveProperty( 'wallet' );
				expect( response._body.data ).toHaveProperty( 'refType' );
				expect( response._body.data ).toHaveProperty( 'refHash' );
				expect( response._body.data.hash ).toBe( like.hash );
				expect( response._body.data.sig ).toBe( like.sig );

				//  ...
				await TestUtil.sleep( new Date().getTime() % 30 );
			}

			//	wait for a while
			await TestUtil.sleep( 3 * 1000 );

		}, 300 * 10e3 );


		it( "should return recommended posts for each person", async () =>
		{
			for ( let i = 0; i < testUserList.length; i++ )
			{
				//	Alice, Bob, Mary
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ i ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

				const response = await request( app )
					.post( '/v1/portal/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'recommendedPostList', options : { pageNo : 1, pageSize : 100, sort : { createdAt : 'desc' } } },
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
					let walletFavorited = 0;
					let walletLiked = 0;
					let recordIndex = 0;
					let previousPost = {};
					for ( const item of response._body.data.list )
					{
						expect( item ).toBeDefined();
						expect( item ).toHaveProperty( '_id' );
						expect( item ).toHaveProperty( 'wallet' );

						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item ).toHaveProperty( '_walletLiked' );

						//	...
						walletFavorited += Number( !! item[ `_walletFavorited` ] );
						walletLiked += Number( !! item[ `_walletLiked` ] );

						/************************************************************
						 *
						 * 	check the sorting of posts
						 *
						 * ************************************************************/
						if ( recordIndex > 0 )
						{
							expect( previousPost ).toBeDefined();
							expect( previousPost.timestamp ).not.toBeNaN();
							expect( previousPost.timestamp ).toBeGreaterThan( 0 );
							expect( previousPost.timestamp ).toBeGreaterThan( item.timestamp );
							expect( previousPost.timestamp ).toBeLessThan( new Date().getTime() );
							expect( item.timestamp - previousPost.timestamp ).toBeLessThanOrEqual( 30 );
						}

						//	save previous post
						previousPost = _.cloneDeep( item );
						recordIndex ++;
					}

					expect( walletFavorited ).toBeGreaterThan( 0 );
					expect( walletLiked ).toBeGreaterThan( 0 );
				}
			}
		}, 120 * 10e3 );
	} );


	describe( "Test followee portal", () =>
	{
		it( "should clear following relationship", async () =>
		{
			const followerService = new FollowerService();
			await followerService.clearAll();

			for ( const testUser of testUserList )
			{
				const userWalletObj = EtherWallet.createWalletFromMnemonic( testUser.mnemonic );
				expect( userWalletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( userWalletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( userWalletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( userWalletObj.address ) ).toBeTruthy();

				const results = await followerService.queryList( userWalletObj.address, { by : 'wallet' } );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.total ).toBe( 0 );
				expect( Array.isArray( results.list ) ).toBeTruthy();
				expect( results.list.length ).toBe( 0 );
			}
		}, 120 * 10e3 );

		it( "should make Bob following Alice", async () =>
		{
			//
			//	create role instances
			//
			const aliceWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( aliceWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( aliceWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( aliceWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( aliceWalletObj.address ) ).toBeTruthy();

			const bobWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserBob ].mnemonic );
			expect( bobWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( bobWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( bobWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( bobWalletObj.address ) ).toBeTruthy();

			//
			//	Make Bob following Alice
			//
			let bobFollowAlice = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : bobWalletObj.address,		//	follower
				address : aliceWalletObj.address,	//	followee
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			bobFollowAlice.sig = await Web3Signer.signObject( bobWalletObj.privateKey, bobFollowAlice );
			bobFollowAlice.hash = await Web3Digester.hashObject( bobFollowAlice );
			expect( bobFollowAlice.sig ).toBeDefined();
			expect( typeof bobFollowAlice.sig ).toBe( 'string' );
			expect( bobFollowAlice.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/follower/add' )
				.send( {
					wallet : bobWalletObj.address, data : bobFollowAlice, sig : bobFollowAlice.sig
				} );
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			if ( 200 !== response.statusCode )
			{
				console.log( response );
			}
			expect( response.statusCode ).toBe( 200 );

		}, 120 * 10e3);

		it( "should make Mary following Alice", async () =>
		{
			//
			//	create role instances
			//
			const aliceWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( aliceWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( aliceWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( aliceWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( aliceWalletObj.address ) ).toBeTruthy();

			const maryWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserMary ].mnemonic );
			expect( maryWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( maryWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( maryWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( maryWalletObj.address ) ).toBeTruthy();

			//
			//	Make Mary follow Alice
			//
			let maryFollowAlice = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : maryWalletObj.address,		//	follower
				address : aliceWalletObj.address,	//	followee
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			maryFollowAlice.sig = await Web3Signer.signObject( maryWalletObj.privateKey, maryFollowAlice );
			maryFollowAlice.hash = await Web3Digester.hashObject( maryFollowAlice );
			expect( maryFollowAlice.sig ).toBeDefined();
			expect( typeof maryFollowAlice.sig ).toBe( 'string' );
			expect( maryFollowAlice.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/follower/add' )
				.send( {
					wallet : maryWalletObj.address, data : maryFollowAlice, sig : maryFollowAlice.sig
				} );
			expect( response ).toBeDefined();
			expect( response ).toHaveProperty( 'statusCode' );
			expect( response ).toHaveProperty( '_body' );
			if ( 200 !== response.statusCode )
			{
				console.log( response );
			}
			expect( response.statusCode ).toBe( 200 );

		}, 120 * 10e3);

		it( "should create some posts in the persona of Alice", async () =>
		{
			//
			//	create many posts
			//
			const postService = new PostService();
			await postService.clearAll();

			walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( walletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

			for ( let i = 0; i < 50; i ++ )
			{
				let post = {
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
					createdAt : new Date(),
					updatedAt : new Date()
				};
				post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
				post.hash = await Web3Digester.hashObject( post );
				expect( post.sig ).toBeDefined();
				expect( typeof post.sig ).toBe( 'string' );
				expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

				let response = await request( app )
					.post( '/v1/post/add' )
					.send( {
						wallet : walletObj.address, data : post, sig : post.sig
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
				expect( response._body.data ).toHaveProperty( 'wallet' );
				expect( response._body.data.hash ).toBe( post.hash );
				expect( response._body.data.wallet ).toBe( post.wallet );

				//	...
				savedPost = _.cloneDeep( response._body.data );

				await TestUtil.sleep(new Date().getTime() % 30 );
			}

			//	wait for a while
			await TestUtil.sleep(3 * 1000 );

		}, 120 * 10e3 );


		it( "should return the followee posts in the persona of Bob and Mary", async () =>
		{
			//
			//	create role instances
			//
			const aliceWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( aliceWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( aliceWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( aliceWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( aliceWalletObj.address ) ).toBeTruthy();

			//	...
			const mnemonicsBobAndMary = [
				testUserList[ testUserBob ].mnemonic,
				testUserList[ testUserMary ].mnemonic,
			];
			for ( const mnemonic of mnemonicsBobAndMary )
			{
				walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

				const response = await request( app )
					.post( '/v1/portal/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'followeePostList', options : { pageNo : 1, pageSize : 100, sort : { createdAt : 'desc' } } },
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
				//console.log( response._body );
				expect( response._body.data.total ).toBeGreaterThanOrEqual( response._body.data.list.length );
				if ( response._body.data.list )
				{
					let recordIndex = 0;
					let previousPost = {};
					for ( const item of response._body.data.list )
					{
						expect( item ).toBeDefined();
						expect( item ).toHaveProperty( '_id' );
						expect( item ).toHaveProperty( 'wallet' );

						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item ).toHaveProperty( '_walletLiked' );

						if ( recordIndex > 0 )
						{
							expect( previousPost ).toBeDefined();
							expect( previousPost.timestamp ).not.toBeNaN();
							expect( previousPost.timestamp ).toBeGreaterThan( 0 );
							expect( previousPost.timestamp ).toBeGreaterThan( item.timestamp );
							expect( previousPost.timestamp ).toBeLessThan( new Date().getTime() );
							expect( item.timestamp - previousPost.timestamp ).toBeLessThanOrEqual( 30 );
						}

						/************************************************************
						 *
						 * 	THE KEY VERIFICATION HERE
						 *
						 * 	check the following relationship
						 *
						 * ************************************************************/
						expect( item ).toHaveProperty( `wallet` );
						expect( isAddress( item.wallet ) ).toBeTruthy();
						expect( TypeUtil.isStringEqualNoCase( item.wallet, aliceWalletObj.address ) ).toBeTruthy();

						//	save previous post
						previousPost = _.cloneDeep( item );
						recordIndex ++;
					}
				}
			}

		}, 120 * 10e3 );
	});
} );
