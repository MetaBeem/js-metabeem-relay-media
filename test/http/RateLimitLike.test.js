import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import { ERefDataTypes, SchemaUtil } from "debeem-store";
import { TestUtil } from "debeem-utils";

let server = null;


describe( 'RateLimit', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	const walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );

	const createdCount = 150;
	let savedPosts = [];

	const postStatisticKeys = SchemaUtil.getPrefixedKeys( `post`, 'statistic' );
	const exceptedKeys = Array.isArray( postStatisticKeys ) ? postStatisticKeys : [];

	const keywords = "should create some posts and then perform a search task".split( " " );


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


		//
		//	create many posts
		//
		for ( let i = 0; i < createdCount; i++ )
		{
			//
			//	create a new post with ether signature
			//
			const NoStr = Number(i).toString().padStart( 2, '0' );
			const keyword = keywords[ i % keywords.length ];
			let newPost = {
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
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.hash ).toBe( newPost.hash );
			expect( response._body.data.sig ).toBe( newPost.sig );

			expect( SchemaUtil.isValidKeccak256Hash( response._body.data.hash ) ).toBeTruthy();

			//	...
			savedPosts.push( response._body.data );

			await TestUtil.sleep( 100 );
		}

	}, 60 * 10e3 );
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

	describe( "RateLimit test", () =>
	{
		const globalLimitPerMinute = 300;
		it( `it should limit ${ globalLimitPerMinute } times liking per minute`, async () =>
		{
			expect( savedPosts ).toBeDefined();
			expect( Array.isArray( savedPosts ) ).toBeTruthy();
			expect( savedPosts.length ).toBeGreaterThanOrEqual( createdCount );

			let savedLikes = [];
			const pfnSendRequestLike = async ( post ) =>
			{
				//
				//	create a new favorite with ether signature
				//
				let like = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					refType : ERefDataTypes.post,
					refHash : post.hash,
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

				const response = await request( app )
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
				expect( response._body ).toHaveProperty( 'version' );
				expect( response._body ).toHaveProperty( 'ts' );
				expect( response._body ).toHaveProperty( 'tu' );
				expect( response._body ).toHaveProperty( 'error' );
				expect( response._body ).toHaveProperty( 'data' );
				expect( response._body.data ).toBeDefined();
				expect( response._body.data ).toHaveProperty( 'hash' );
				expect( response._body.data ).toHaveProperty( 'sig' );
				expect( response._body.data.hash ).toBe( like.hash );
				expect( response._body.data.sig ).toBe( like.sig );

				//	...
				savedLikes.push( response._body.data );

				//	wait for a while
				await TestUtil.sleep( 100 );
			};

			for ( const post of savedPosts )
			{
				await pfnSendRequestLike( post );
			}

			expect( Array.isArray( savedLikes ) ).toBeTruthy();
			expect( savedLikes.length ).toBeGreaterThanOrEqual( createdCount );

			//	send the 301st request
			try
			{
				await pfnSendRequestLike( savedPosts[ 0 ] );
			}
			catch ( err )
			{
				err = JSON.stringify( err );
				expect( err ).toContain( `\\\"status\\\": 429,` );
				expect( err ).toContain( `Too many requests, please try again later!` );
			}

		}, 60 * 10e3 );

	} );
} );
