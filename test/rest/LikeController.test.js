import request from "supertest";
import { app, startHttpServer } from "../../src/http/http.js";
import { describe, expect } from "@jest/globals";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";
import { ethers } from "ethers";
import { ERefDataTypes, SchemaUtil } from "debeem-store";
import { TestUtil, TypeUtil } from "debeem-utils";

let server = null;


describe( 'LikeController', () =>
{
	//
	//	create a wallet by mnemonic
	//
	const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	const walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );
	let savedPost;
	let savedLike;

	const postStatisticKeys = SchemaUtil.getPrefixedKeys( `post`, 'statistic' );
	const exceptedKeys = Array.isArray( postStatisticKeys ) ? postStatisticKeys : [];


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
			createdAt : new Date(),
			updatedAt : new Date()
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
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

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
			savedLike = response._body.data;

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by hexId", async () =>
		{
			expect( savedLike ).toBeDefined();
			expect( savedLike ).toHaveProperty( 'hash' );
			expect( savedLike ).toHaveProperty( 'sig' );
			expect( SchemaUtil.isValidKeccak256Hash( savedLike.hash ) ).toBeTruthy();
			expect( Web3Signer.isValidSig( savedLike.sig ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/like/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'hexId', hexId : savedLike._id },
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
			expect( response._body.data ).toHaveProperty( 'wallet' );
			expect( response._body.data ).toHaveProperty( 'hash' );
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.hash ).toBe( savedLike.hash );
			expect( response._body.data.sig ).toBe( savedLike.sig );

			const item = response._body.data;
			expect( item ).toHaveProperty( 'refData' );
			if ( item.refData )
			{
				expect( item.refData ).not.toBeNull();
				expect( item.refData ).toHaveProperty( 'hash' );
				expect( item.refData.hash ).not.toBeNull();
				expect( TypeUtil.isString( item.refData.hash ) ).toBeTruthy();
				expect( item.refData.hash.length ).toBeGreaterThan( 0 );
				expect( item.refData.hash ).toBe( item.refHash );
			}
			else
			{
				//	referred data may be deleted by its author
			}

		}, 60 * 10e3 );

		it( "should return a record by hash", async () =>
		{
			expect( savedLike ).toBeDefined();
			expect( savedLike ).toHaveProperty( 'hash' );
			expect( savedLike ).toHaveProperty( 'sig' );
			expect( SchemaUtil.isValidKeccak256Hash( savedLike.hash ) ).toBeTruthy();
			expect( Web3Signer.isValidSig( savedLike.sig ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/like/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'hash', hash : savedLike.hash },
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
			expect( response._body.data ).toHaveProperty( 'wallet' );
			expect( response._body.data ).toHaveProperty( 'hash' );
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.hash ).toBe( savedLike.hash );
			expect( response._body.data.sig ).toBe( savedLike.sig );

			const item = response._body.data;
			expect( item ).toHaveProperty( 'refData' );
			if ( item.refData )
			{
				expect( item.refData ).not.toBeNull();
				expect( item.refData ).toHaveProperty( 'hash' );
				expect( item.refData.hash ).not.toBeNull();
				expect( TypeUtil.isString( item.refData.hash ) ).toBeTruthy();
				expect( item.refData.hash.length ).toBeGreaterThan( 0 );
				expect( item.refData.hash ).toBe( item.refHash );
			}
			else
			{
				//	referred data may be deleted by its author
			}

		}, 60 * 10e3 );

		it( "should return a record by refType and refHash", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/like/queryOne' )
				.send( {
					wallet : walletObj.address, data : {
						by : 'walletAndRefTypeAndRefHash',
						refType : ERefDataTypes.post,
						refHash : savedPost.hash
					}, sig : ''
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
			expect( response._body.data ).toHaveProperty( 'wallet' );
			expect( response._body.data ).toHaveProperty( 'hash' );
			expect( response._body.data ).toHaveProperty( 'sig' );
			expect( response._body.data.wallet ).toBe( walletObj.address );
			expect( response._body.data.hash ).toBe( savedLike.hash );
			expect( response._body.data.sig ).toBe( savedLike.sig );

			const item = response._body.data;
			expect( item ).toHaveProperty( 'refData' );
			if ( item.refData )
			{
				expect( item.refData ).not.toBeNull();
				expect( item.refData ).toHaveProperty( 'hash' );
				expect( item.refData.hash ).not.toBeNull();
				expect( TypeUtil.isString( item.refData.hash ) ).toBeTruthy();
				expect( item.refData.hash.length ).toBeGreaterThan( 0 );
				expect( item.refData.hash ).toBe( item.refHash );
			}
			else
			{
				//	referred data may be deleted by its author
			}

		}, 60 * 10e3 );
	} );

	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			const response = await request( app )
				.post( '/v1/like/queryList' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'walletAndRefType', refType : ERefDataTypes.post },
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
			// 			_id: '651a4a4429877f02147f7d56',
			// 			timestamp: 1696221764545,
			// 			hash: '0x6d2b4d9c1009d0d6f17eaa2f56040268289c503b3ca20a3f88f9a36c99a81dce',
			// 			version: '1.0.0',
			// 			deleted: '000000000000000000000000',
			// 			wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			// 			sig: '0x84f0e74ef35be24a96a26804212176d6d9ab7d0417ae9af5d856ce158796d8d34ef320ed113705f8dd4eb3b13e88378980c81dfb2f3f0dc733f2b1257fc1ef821b',
			// 			refType: 'post',
			// 			refHash: '0x8bde56e2a1b2dbbeaff60617980815e6a35d72c8af4c50a4f2cee3ad87f6e3f0',
			// 			refBody: '',
			// 			remark: 'no remark',
			// 			createdAt: '2023-10-02T04:42:44.545Z',
			// 			updatedAt: '2023-10-02T04:42:44.545Z',
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

			//console.log( response._body.data.list )
			for ( const item of response._body.data.list )
			{
				expect( item ).toBeDefined();
				expect( item ).toHaveProperty( '_id' );
				expect( item ).toHaveProperty( 'wallet' );

				//	check .refData
				expect( item ).toHaveProperty( 'refType' );
				expect( item ).toHaveProperty( 'refHash' );
				expect( item.refHash ).not.toBeNull();
				expect( TypeUtil.isString( item.refHash ) ).toBeTruthy();
				expect( item.refHash.length ).toBeGreaterThan( 0 );

				expect( item ).toHaveProperty( 'refData' );
				if ( item.refData )
				{
					expect( item.refData ).not.toBeNull();
					expect( item.refData ).toHaveProperty( 'hash' );
					expect( item.refData.hash ).not.toBeNull();
					expect( TypeUtil.isString( item.refData.hash ) ).toBeTruthy();
					expect( item.refData.hash.length ).toBeGreaterThan( 0 );
					expect( item.refData.hash ).toBe( item.refHash );
				}
				else
				{
					//	referred data may be deleted by its author
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
					createdAt : new Date(),
					updatedAt : new Date()
				};
				newPost.sig = await Web3Signer.signObject(
					walletObj.privateKey,
					newPost,
					exceptedKeys
				);
				newPost.hash = await Web3Digester.hashObject( newPost );
				expect( newPost.sig ).toBeDefined();
				expect( typeof newPost.sig ).toBe( 'string' );
				expect( newPost.sig.length ).toBeGreaterThanOrEqual( 0 );

				const responseByPost = await request( app )
					.post( '/v1/post/add' )
					.send( {
						wallet : walletObj.address, data : newPost, sig : newPost.sig
					} );
				expect( responseByPost ).toBeDefined();
				expect( responseByPost ).toHaveProperty( 'statusCode' );
				expect( responseByPost ).toHaveProperty( '_body' );
				if ( 200 !== responseByPost.statusCode )
				{
					console.log( responseByPost );
				}
				expect( responseByPost.statusCode ).toBe( 200 );
				expect( responseByPost._body ).toBeDefined();
				expect( responseByPost._body ).toHaveProperty( 'version' );
				expect( responseByPost._body ).toHaveProperty( 'ts' );
				expect( responseByPost._body ).toHaveProperty( 'tu' );
				expect( responseByPost._body ).toHaveProperty( 'error' );
				expect( responseByPost._body ).toHaveProperty( 'data' );
				expect( responseByPost._body.data ).toBeDefined();
				expect( responseByPost._body.data ).toHaveProperty( 'hash' );
				expect( responseByPost._body.data ).toHaveProperty( 'sig' );
				expect( responseByPost._body.data.hash ).toBe( newPost.hash );
				expect( responseByPost._body.data.sig ).toBe( newPost.sig );

				//	...
				savedPost = responseByPost._body.data;


				//
				//	create a new comment with ether signature
				//
				let like = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					refType : ERefDataTypes.post,
					refHash : savedPost.hash,
					refBody : `ref body ${ NoStr }`,
					sig : ``,
					remark : 'no remark',
					createdAt : new Date(),
					updatedAt : new Date()
				};
				like.sig = await Web3Signer.signObject( walletObj.privateKey, like, exceptedKeys );
				like.hash = await Web3Digester.hashObject( like, exceptedKeys );
				expect( like.sig ).toBeDefined();
				expect( typeof like.sig ).toBe( 'string' );
				expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

				const response = await request( app )
					.post( '/v1/like/add' )
					.send( {
						wallet : walletObj.address, data : like, sig : like.sig
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
				expect( response._body.data.hash ).toBe( like.hash );

				//	...
				savedLike = response._body.data;
			}

			//
			//	....
			//
			for ( let page = 1; page <= 5; page++ )
			{
				const response = await request( app )
					.post( '/v1/like/queryList' )
					.send( {
						wallet : walletObj.address, data : {
							by : 'walletAndRefType',
							refType : ERefDataTypes.post,
							options : { pageNo : page, pageSize : 10 }
						}, sig : ''
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

				for ( const item of response._body.data.list )
				{
					expect( item ).toBeDefined();
					expect( item ).toHaveProperty( '_id' );
					expect( item ).toHaveProperty( 'wallet' );

					//	check .refData
					expect( item ).toHaveProperty( 'refType' );
					expect( item ).toHaveProperty( 'refHash' );
					expect( item.refHash ).not.toBeNull();
					expect( TypeUtil.isString( item.refHash ) ).toBeTruthy();
					expect( item.refHash.length ).toBeGreaterThan( 0 );

					expect( item ).toHaveProperty( 'refData' );
					if ( item.refData )
					{
						expect( item.refData ).not.toBeNull();
						expect( item.refData ).toHaveProperty( 'hash' );
						expect( item.refData.hash ).not.toBeNull();
						expect( TypeUtil.isString( item.refData.hash ) ).toBeTruthy();
						expect( item.refData.hash.length ).toBeGreaterThan( 0 );
						expect( item.refData.hash ).toBe( item.refHash );
					}
					else
					{
						//	referred data may be deleted by its author
					}
				}
			}

			//	wait for a while
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Updating", () =>
	{
		it( "should throw `updating is banned` when we try to update data", async () =>
		{
			let toBeUpdated = {
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				remark : `remark .... ${ new Date().toLocaleString() }`,
			};
			toBeUpdated.sig = await Web3Signer.signObject(
				walletObj.privateKey,
				toBeUpdated,
				exceptedKeys
			);
			expect( toBeUpdated.sig ).toBeDefined();
			expect( typeof toBeUpdated.sig ).toBe( 'string' );
			expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `post` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const updateResponse = await request( app )
				.post( '/v1/like/update' )
				.send( {
					wallet : walletObj.address, data : toBeUpdated, sig : toBeUpdated.sig
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
			await TestUtil.sleep( 5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Deletion", () =>
	{
		it( `should logically delete a record by hash`, async () =>
		{
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
				createdAt : new Date(),
				updatedAt : new Date()
			};
			newPost.sig = await Web3Signer.signObject(
				walletObj.privateKey,
				newPost,
				exceptedKeys
			);
			newPost.hash = await Web3Digester.hashObject( newPost );
			expect( newPost.sig ).toBeDefined();
			expect( typeof newPost.sig ).toBe( 'string' );
			expect( newPost.sig.length ).toBeGreaterThanOrEqual( 0 );

			const responseByPost = await request( app )
				.post( '/v1/post/add' )
				.send( {
					wallet : walletObj.address, data : newPost, sig : newPost.sig
				} );
			expect( responseByPost ).toBeDefined();
			expect( responseByPost ).toHaveProperty( 'statusCode' );
			expect( responseByPost ).toHaveProperty( '_body' );
			if ( 200 !== responseByPost.statusCode )
			{
				console.log( responseByPost );
			}
			expect( responseByPost.statusCode ).toBe( 200 );
			expect( responseByPost._body ).toBeDefined();
			expect( responseByPost._body ).toHaveProperty( 'version' );
			expect( responseByPost._body ).toHaveProperty( 'ts' );
			expect( responseByPost._body ).toHaveProperty( 'tu' );
			expect( responseByPost._body ).toHaveProperty( 'error' );
			expect( responseByPost._body ).toHaveProperty( 'data' );
			expect( responseByPost._body.data ).toBeDefined();
			expect( responseByPost._body.data ).toHaveProperty( 'hash' );
			expect( responseByPost._body.data ).toHaveProperty( 'sig' );
			expect( responseByPost._body.data.hash ).toBe( newPost.hash );
			expect( responseByPost._body.data.sig ).toBe( newPost.sig );

			//	...
			const savedPost = responseByPost._body.data;


			//
			//	like the post
			//
			let like = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : `ref body ...`,
				sig : ``,
				remark : 'no remark',
				createdAt : new Date(),
				updatedAt : new Date()
			};
			like.sig = await Web3Signer.signObject( walletObj.privateKey, like, exceptedKeys );
			like.hash = await Web3Digester.hashObject( like, exceptedKeys );
			expect( like.sig ).toBeDefined();
			expect( typeof like.sig ).toBe( 'string' );
			expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

			const response = await request( app )
				.post( '/v1/like/add' )
				.send( {
					wallet : walletObj.address, data : like, sig : like.sig
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
			expect( response._body.data.hash ).toBe( like.hash );

			//	...
			const savedLike = response._body.data;



			//
			//	try to delete the like
			//
			let toBeDeletedLike = {
				wallet : walletObj.address,
				hash : savedLike.hash,
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
			};
			toBeDeletedLike.sig = await Web3Signer.signObject(
				walletObj.privateKey,
				toBeDeletedLike,
				exceptedKeys
			);
			expect( toBeDeletedLike.sig ).toBeDefined();
			expect( typeof toBeDeletedLike.sig ).toBe( 'string' );
			expect( toBeDeletedLike.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const requiredKeys = SchemaUtil.getRequiredKeys( `post` );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();

			const deleteLikeResponse = await request( app )
				.post( '/v1/like/delete' )
				.send( {
					wallet : walletObj.address, data : toBeDeletedLike, sig : toBeDeletedLike.sig
				} );
			expect( deleteLikeResponse ).toBeDefined();
			expect( deleteLikeResponse ).toHaveProperty( 'statusCode' );
			expect( deleteLikeResponse ).toHaveProperty( '_body' );
			if ( 200 !== deleteLikeResponse.statusCode )
			{
				console.log( deleteLikeResponse );
			}
			expect( deleteLikeResponse.statusCode ).toBe( 200 );
			expect( deleteLikeResponse._body ).toBeDefined();
			expect( deleteLikeResponse._body ).toHaveProperty( 'version' );
			expect( deleteLikeResponse._body ).toHaveProperty( 'ts' );
			expect( deleteLikeResponse._body ).toHaveProperty( 'tu' );
			expect( deleteLikeResponse._body ).toHaveProperty( 'error' );
			expect( deleteLikeResponse._body ).toHaveProperty( 'data' );
			expect( deleteLikeResponse._body.data ).toBeDefined();

			//	...
			const queryOneResponse = await request( app )
				.post( '/v1/like/queryOne' )
				.send( {
					wallet : walletObj.address,
					data : { by : 'hash', hash : savedLike.hash },
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
			//	try to like the post again
			//
			let likeAgain = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : `ref body ...`,
				sig : ``,
				remark : 'no remark',
				createdAt : new Date(),
				updatedAt : new Date()
			};
			likeAgain.sig = await Web3Signer.signObject( walletObj.privateKey, likeAgain, exceptedKeys );
			likeAgain.hash = await Web3Digester.hashObject( likeAgain, exceptedKeys );
			expect( likeAgain.sig ).toBeDefined();
			expect( typeof likeAgain.sig ).toBe( 'string' );
			expect( likeAgain.sig.length ).toBeGreaterThanOrEqual( 0 );

			const likeAgainResponse = await request( app )
				.post( '/v1/like/add' )
				.send( {
					wallet : walletObj.address, data : likeAgain, sig : likeAgain.sig
				} );
			//console.log( response );
			expect( likeAgainResponse ).toBeDefined();
			expect( likeAgainResponse ).toHaveProperty( 'statusCode' );
			expect( likeAgainResponse ).toHaveProperty( '_body' );
			if ( 200 !== likeAgainResponse.statusCode )
			{
				console.log( likeAgainResponse );
			}
			expect( likeAgainResponse.statusCode ).toBe( 200 );
			expect( likeAgainResponse._body ).toBeDefined();
			expect( likeAgainResponse._body ).toHaveProperty( 'version' );
			expect( likeAgainResponse._body ).toHaveProperty( 'ts' );
			expect( likeAgainResponse._body ).toHaveProperty( 'tu' );
			expect( likeAgainResponse._body ).toHaveProperty( 'error' );
			expect( likeAgainResponse._body ).toHaveProperty( 'data' );
			expect( likeAgainResponse._body.data ).toBeDefined();
			expect( likeAgainResponse._body.data ).toHaveProperty( 'hash' );
			expect( likeAgainResponse._body.data.hash ).toBe( likeAgain.hash );


		}, 60 * 10e3 );
	} );
} );
