import {ethers} from 'hardhat';

const main = async () => {
	const Whitelist = await ethers.getContractFactory('Whitelist')
	const whitelist = await Whitelist.deploy(10);
	await whitelist.deployed()

	const NFT = await ethers.getContractFactory('CryptoDevsNFT')
	const nft = await NFT.deploy('crypto_devs_nfts', whitelist.address)
	await nft.deployed()

	const CryptoDevsToken = await ethers.getContractFactory('CryptoDevsToken');
	const cryptoDevsToken = await CryptoDevsToken.deploy(nft.address)
	await cryptoDevsToken.deployed()

	console.log('Whitelist: ', whitelist.address, '\nNFT: ', nft.address, '\nToken: ', cryptoDevsToken.address)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.log(error)
		process.exit(1)
	})
