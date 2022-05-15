import Head from "next/head";
import styles from "../../styles/Home.module.css";
import Web3Modal from "web3modal";
import {ethers} from "ethers";
import {useEffect, useState} from "react";
import {WHITELIST_CONTRACT_ADDRESS} from "../../constants/whitelist";
import Whitelist from '../../artifacts/contracts/Whitelist/Whitelist.sol/Whitelist.json'
import {Button, Container, Text} from "@nextui-org/react";
import Link from "next/link";


export default function Home() {
	// walletConnected keep track of whether the user's wallet is connected or not
	const [walletConnected, setWalletConnected] = useState(false);
	// joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
	const [joinedWhitelist, setJoinedWhitelist] = useState(false);
	// loading is set to true when we are waiting for a transaction to get mined
	const [loading, setLoading] = useState(false);
	// numberOfWhitelisted tracks the number of address's whitelisted
	const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);


	const addAddressToWhitelist = async () => {
		try {
			const web3Modal = new Web3Modal()
			const connection = await web3Modal.connect()
			const provider = new ethers.providers.Web3Provider(connection)
			const signer = provider.getSigner()
			const whitelistContract = new ethers.Contract(
				WHITELIST_CONTRACT_ADDRESS,
				Whitelist.abi,
				signer
			);
			const tx = await whitelistContract.addAddressToWhitelist();
			setLoading(true);
			await tx.wait();
			setLoading(false);
			await getNumberOfWhitelisted();
			setJoinedWhitelist(true);
		} catch (err) {
			console.error(err);
		}
	}

	const getNumberOfWhitelisted = async () => {
		const provider = new ethers.providers.AlchemyProvider('maticmum')
		const whitelistContract = new ethers.Contract(
			WHITELIST_CONTRACT_ADDRESS,
			Whitelist.abi,
			provider
		);
		const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
		setNumberOfWhitelisted(_numberOfWhitelisted);
	};

	const checkIfAddressInWhitelist = async () => {

		const web3Modal = new Web3Modal()
		const connection = await web3Modal.connect()
		let provider = new ethers.providers.Web3Provider(connection)
		// const { chainId } = await provider.getNetwork();
		// if (chainId !== 4) {
		// 	window.alert("Change the network to Rinkeby");
		// 	// throw new Error("Change network to Rinkeby");
		// 	return
		// }
		let signer = provider.getSigner()

		const whitelistContract = new ethers.Contract(
			WHITELIST_CONTRACT_ADDRESS,
			Whitelist.abi,
			signer
		);

		const address = await signer.getAddress();
		const _joinedWhitelist = await whitelistContract.whitelistedAddresses(address)
		setJoinedWhitelist(_joinedWhitelist);
	};


	const connectWallet = async () => {
		const web3Modal = new Web3Modal()
		await web3Modal.connect()
		setWalletConnected(true);

		await checkIfAddressInWhitelist();
		await getNumberOfWhitelisted();
	};


	const renderButton = () => {
		if (walletConnected) {
			if (joinedWhitelist) {
				return (
					<div className={styles.description}>
						Thanks for joining the Whitelist!
					</div>
				);
			} else if (loading) {
				return <button className={styles.button}>Loading...</button>;
			} else {
				return (
					<button onClick={addAddressToWhitelist} className={styles.button}>
						Join the Whitelist
					</button>
				);
			}
		} else {
			return (
				<button onClick={connectWallet} className={styles.button}>
					Connect your wallet
				</button>
			);
		}
	};
	useEffect(() => {
		void connectWallet();

	}, []);

	return (
		<div>
			<Head>
				<title>Whitelist Dapp</title>
				<meta name="description" content="Whitelist-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Container xs>
				<Button.Group size="xl"  color="default">
					<Link href={'/'}><Button><Text color="black" >DAO</Text></Button></Link>
					<Link href={'/ico'}><Button><Text color="black" >ICO</Text></Button></Link>
					<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
					<Link href={'/whitelist'}><Button><Text color="white" >Start whitelist</Text></Button></Link>
				</Button.Group>
			</Container>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to WestPunks whitelist!</h1>
					<div className={styles.description}>
						Its an NFT collection for developers in Crypto.
					</div>
					<div className={styles.description}>
						{numberOfWhitelisted} have already joined the Whitelist
					</div>
					{renderButton()}
				</div>
				<div>
					<img className={styles.image} src="/nfts/1.svg"  alt="img"/>
				</div>
			</div>

			<footer className={styles.footer}>
				Made with &#10084;
			</footer>
		</div>
	);
}