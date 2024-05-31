import { ERefDataTypes, SchemaUtil } from "debeem-store";
import { EtherWallet, Web3Digester, Web3Signer } from "debeem-id";

//
//	create a wallet by mnemonic
//
const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
const walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );

const postStatisticKeys = SchemaUtil.getPrefixedKeys( `post`, 'statistic' );
const exceptedKeys = Array.isArray( postStatisticKeys ) ? postStatisticKeys : [];

const postHashList = [
	`0xaf4fdc1014ddc3c402fa81dfce43d0765aa8d60d99a5dfee26e501f16fa334ad`,
	`0x44edaf12b82532a7592decf6a000e1b0140b15e4f3b27498d19c1494d6be6108`,
	`0xd7a23df148a598911be4dc4951333cd0a53ed35ae6a4324e0eb04acb560c033f`,
	`0xa0f2d311207de7b0834874de8bf996da971bece186f413a62d2f6b594999eb77`,
]

for ( const postHash of postHashList )
{
	let like = {
		timestamp : new Date().getTime(),
		hash : '',
		version : '1.0.0',
		deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
		wallet : walletObj.address,
		refType : ERefDataTypes.post,
		refHash : postHash,
		refBody : '',
		sig : ``,
		remark : 'no remark',
		createdAt : new Date(),
		updatedAt : new Date()
	};
	like.sig = await Web3Signer.signObject( walletObj.privateKey, like, exceptedKeys );
	like.hash = await Web3Digester.hashObject( like );

	const postData = {
		wallet : walletObj.address, data : like, sig : like.sig
	};
	//console.log( `postData :`, postData );
	console.log( `------------------------------------------------------------` );
	console.log( JSON.stringify( postData ) );
}
