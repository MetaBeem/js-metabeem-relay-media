import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ERefDataTypes, FavoriteService, FollowerService, LikeService, PostService, SchemaUtil } from "debeem-store";
import { TestUtil } from "debeem-utils";
import _ from "lodash";

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
export const testWalletObjList = {
	alice : EtherWallet.createWalletFromMnemonic( testUserList[ 0 ].mnemonic ),
	bob : EtherWallet.createWalletFromMnemonic( testUserList[ 1 ].mnemonic ),
	mary : EtherWallet.createWalletFromMnemonic( testUserList[ 2 ].mnemonic ),
};



describe( 'PostControllerFavLike', () =>
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


	describe( "Test liked and favorited posts", () =>
	{
		it( "should create some posts by one, and favorite and like them by the other", async () =>
		{
			const limitTotal = 50;
			for ( let i = 0; i < limitTotal; i++ )
			{
				//	choose a user to create post
				walletObj = testWalletObjList.alice;
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
				//	favorite the post we just created by Bob
				//
				walletObj = testWalletObjList.bob;
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
				//	like the post we just created by Bob
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


			//
			//	query the post list of Alice by Bob
			//
			walletObj = testWalletObjList.bob;
			const pageSize = 10;
			for ( let page = 1; page <= Math.ceil( limitTotal / pageSize ); page ++ )
			{
				const response = await request( app )
					.post( '/v1/post/queryList' )
					.send( {
						wallet : walletObj.address,
						data : { by : 'address',
							address : testWalletObjList.alice.address,	//	target user
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
				expect( response._body.data.total ).toBeGreaterThanOrEqual( limitTotal );
				if ( response._body.data.list )
				{
					for ( const item of response._body.data.list )
					{
						expect( item ).toBeDefined();
						expect( item ).toHaveProperty( '_id' );
						expect( item ).toHaveProperty( 'wallet' );
						expect( item.wallet ).toBe( testWalletObjList.alice.address );

						expect( item ).toHaveProperty( '_walletFavorited' );
						expect( item ).toHaveProperty( '_walletLiked' );
						expect( item._walletFavorited ).toBeTruthy();
						expect( item._walletLiked ).toBeTruthy();
					}
				}
			}

		}, 100 * 10e3 );


	} );
} );
