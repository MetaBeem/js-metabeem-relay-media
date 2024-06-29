import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { PostService, SchemaUtil } from "debeem-store";
import { TestUtil } from "debeem-utils";
import _ from "lodash";
import {testUserList, testWalletObjList} from "../../src/configs/TestConfig.js";

let server = null;




describe( 'PortalController', () =>
{
	let walletObj;
	let savedPost;

	const statisticKeys = SchemaUtil.getPrefixedKeys( `post`, 'statistic' );
	const exceptedKeys = Array.isArray( statisticKeys ) ? statisticKeys : [];

	const createdPostCount = 100;
	const keywords = "should create some posts and then perform a search task".split( " " );

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


	describe( "Test searching", () =>
	{
		it( "should create some posts", async () =>
		{
			for ( let i = 0; i < createdPostCount; i++ )
			{
				//	randomly, choose a user
				walletObj = testUserList[ new Date().getTime() % 3 ].walletObj;
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

				const NoStr = Number(i).toString().padStart( 2, '0' );
				const keyword = keywords[ i % keywords.length ];
				let post = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					body : `Hello, '${ keyword }', I am a good ${ NoStr }`,
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

				//  ...
				await TestUtil.sleep( new Date().getTime() % 30 );
			}

			//	wait for a while
			await TestUtil.sleep( 3 * 1000 );

		}, 300 * 10e3 );


		it( "should perform a search task", async () =>
		{
			//	Alice, Bob, Mary
			walletObj = testWalletObjList.alice;
			expect( walletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

			const keyword = keywords[ new Date().getTime() % keywords.length ].toUpperCase();
			//console.log( `keyword :`, keyword );
			const queryData = {
				by : 'all',
				options : { pageNo : 1, pageSize : 100 },
				query : `Hello \"${ keyword }\"`,
			};
			const response = await request( app )
				.post( '/v1/search/queryList' )
				.send( {
					wallet : walletObj.address,
					data : queryData,
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
			expect( response._body.data ).toHaveProperty( 'postList' );
			expect( response._body.data.postList ).toBeDefined();
			expect( response._body.data.postList ).toHaveProperty( 'total' );
			expect( response._body.data.postList ).toHaveProperty( 'pageNo' );
			expect( response._body.data.postList ).toHaveProperty( 'pageSize' );
			expect( response._body.data.postList ).toHaveProperty( 'list' );
			expect( Array.isArray( response._body.data.postList.list ) ).toBeTruthy();
			expect( response._body.data.postList.list.length ).toBeGreaterThan( 0 );
			expect( response._body.data.postList.total ).toBeGreaterThan( 0 );
			expect( response._body.data.postList.total ).toBeGreaterThanOrEqual( response._body.data.postList.list.length );
			if ( response._body.data.postList.list )
			{
				for ( const item of response._body.data.postList.list )
				{
					expect( item ).toBeDefined();
					expect( item ).toHaveProperty( '_id' );
					expect( item ).toHaveProperty( 'wallet' );
					expect( item ).toHaveProperty( 'body' );

					//	contain the keyword
					expect( _.isString( item.body ) ).toBeTruthy();
					if ( _.isString( item.body ) && ! _.isEmpty( item.body ) )
					{
						expect( item.body.trim().toLowerCase() ).toContain( keyword.trim().toLowerCase() );
					}
				}
			}

		}, 120 * 10e3 );
	} );

} );
