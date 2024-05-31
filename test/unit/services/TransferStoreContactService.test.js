import { describe, expect } from '@jest/globals';
import { ethers } from 'ethers';
import { EtherWallet, Web3Signer, Web3Digester } from "debeem-id";
import { MessageBody } from "../../../src/models/MessageBody";
import { RpcMessage } from "../../../src/models/RpcMessage";
import { TransferService } from "../../../src/services/TransferService";
import { SchemaUtil } from "debeem-store";
import { DatabaseConnection } from "debeem-store";
import { TestUtil } from "debeem-utils";


/**
 *	unit test
 */
describe( "TransferStoreContactService", () =>
{
	beforeAll( async () =>
	{
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );
			const walletNewContactObj = EtherWallet.createWalletFromMnemonic();

			//	assert ...
			expect( walletObj ).not.toBeNull();
			expect( walletObj.mnemonic ).toBe( mnemonic );
			expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.index ).toBe( 0 );
			expect( walletObj.path ).toBe( ethers.defaultPath );

			//
			//	create a new contact with ether signature
			//
			let contact = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : walletNewContactObj.address,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			contact.sig = await Web3Signer.signObject( walletObj.privateKey, contact );
			contact.hash = await Web3Digester.hashObject( contact );
			expect( contact.sig ).toBeDefined();
			expect( typeof contact.sig ).toBe( 'string' );
			expect( contact.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const rpcMessage = RpcMessage.buildStore({
				version : `1.0.0`,
				httpMethod : `post`,
				serviceName : `contact`,
				serviceMethod : `add`,
				body : MessageBody.build( {
					wallet : walletObj.address,
					data : contact,
					sig : contact.sig
				})
			});

			const transferService = new TransferService();
			const result = await transferService.execute( rpcMessage );
			expect( result ).toBeDefined();

			//console.log( result );
			//    {
			//       timestamp: 1695202688533,
			//       hash: '0x908c140576ce9e3395f9e586d766770b14b4497b0e06bd38a159a4fa2a6867ba',
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x5183262edb46ea09d74b1a7e9871338e9577b6ba8b539b0bfd02df20c4a53d614e0786be19894d9563ed9c4f61e23bbdafb58a9b1d7d6565edb8566e816a3b891b',
			//       name: 'Sam',
			//       address: '0x91c437eA229Fcc7eEDFc1696E0eFceB2beE1e5E0',
			//       avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       remark: 'no remark',
			//       _id: new ObjectId("650abd808fa82e56edc83911"),
			//       createdAt: 2023-09-20T09:38:08.533Z,
			//       updatedAt: 2023-09-20T09:38:08.533Z,
			//       __v: 0
			//     }

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );
} );
