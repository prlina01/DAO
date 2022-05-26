import {ethers} from 'hardhat';
import {METADATA_URL} from '../constants/nft'

const main = async () => {
	const Whitelist = await ethers.getContractFactory('Whitelist')
	const whitelist = await Whitelist.deploy(10);
	await whitelist.deployed()

	const NFT = await ethers.getContractFactory('CryptoDevsNFT')
	const nft = await NFT.deploy(METADATA_URL, whitelist.address)
	await nft.deployed()


	const CryptoDevsToken = await ethers.getContractFactory('CryptoDevsToken');
	const cryptoDevsToken = await CryptoDevsToken.deploy(nft.address)
	await cryptoDevsToken.deployed()

	console.log('Whitelist: ', whitelist.address, '\nNFT: ', nft.address, '\nToken: ', cryptoDevsToken.address)

	const FakeNFTMarketplace = await ethers.getContractFactory(
		"FakeNFTMarketplace"
	);
	const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
	await fakeNftMarketplace.deployed();

	const Dao = await ethers.getContractFactory("DAO");
	const dao = await Dao.deploy(fakeNftMarketplace.address, nft.address, {value: ethers.utils.parseEther('5')});
	await dao.deployed();

	console.log('FakeNFTMarketplace: ', fakeNftMarketplace.address, '\nDao deployed to: ', dao.address )
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.log(error)
		process.exit(1)
	})
