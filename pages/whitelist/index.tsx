import Head from "next/head";
import styles from "../../styles/Home.module.css";
import Web3Modal from "web3modal";
import {Contract, ethers, providers} from "ethers";
import {useEffect, useRef, useState} from "react";
import {abi, WHITELIST_CONTRACT_ADDRESS} from "../../constants/whitelist";

export default function Home() {
	// walletConnected keep track of whether the user's wallet is connected or not
	const [walletConnected, setWalletConnected] = useState(false);
	// joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
	const [joinedWhitelist, setJoinedWhitelist] = useState(false);
	// loading is set to true when we are waiting for a transaction to get mined
	const [loading, setLoading] = useState(false);
	// numberOfWhitelisted tracks the number of address's whitelisted
	const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
	// Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
	const web3ModalRef = useRef<Web3Modal>();

	/**
	 * Returns a Provider or Signer object representing the Ethereum RPC with or without the
	 * signing capabilities of metamask attached
	 *
	 * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
	 *
	 * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
	 * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
	 * request signatures from the user using Signer functions.
	 *
	 * @param {*} needSigner - True if you need the signer, default false otherwise
	 */
	const getProviderOrSigner = async (needSigner = false) => {
		const provider = new ethers.providers.AlchemyProvider('rinkeby')

		const { chainId } = await provider.getNetwork();
		if (chainId !== 4) {
			window.alert("Change the network to Rinkeby");
			throw new Error("Change network to Rinkeby");
		}

		if (needSigner) {
			const web3Modal = new Web3Modal()
			const connection = await web3Modal.connect()
			const provider = new ethers.providers.Web3Provider(connection)
			return provider.getSigner()
		}
		return provider;
	};

	/**
	 * addAddressToWhitelist: Adds the current connected address to the whitelist
	 */
	const addAddressToWhitelist = async () => {
		try {
			// We need a Signer here since this is a 'write' transaction.
			const signer: any = await getProviderOrSigner(true);
			// Create a new instance of the Contract with a Signer, which allows
			// update methods
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				abi,
				signer
			);
			// call the addAddressToWhitelist from the contract
			console.log(await signer.getAddress())
			const tx = await whitelistContract.addAddressToWhitelist();
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			// get the updated number of addresses in the whitelist
			await getNumberOfWhitelisted();
			setJoinedWhitelist(true);
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * getNumberOfWhitelisted:  gets the number of whitelisted addresses
	 */
	const getNumberOfWhitelisted = async () => {
		try {
			// Get the provider from web3Modal, which in our case is MetaMask
			// No need for the Signer here, as we are only reading state from the blockchain
			const provider = await getProviderOrSigner();
			// We connect to the Contract using a Provider, so we will only
			// have read-only access to the Contract
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				abi,
				provider
			);
			// call the numAddressesWhitelisted from the contract
			const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
			setNumberOfWhitelisted(_numberOfWhitelisted);
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * checkIfAddressInWhitelist: Checks if the address is in whitelist
	 */
	const checkIfAddressInWhitelist = async () => {
		try {
			// We will need the signer later to get the user's address
			// Even though it is a read transaction, since Signers are just special kinds of Providers,
			// We can use it in its place
			const signer = await getProviderOrSigner(true);
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				abi,
				signer
			);
			// Get the address associated to the signer which is connected to  MetaMask
			// @ts-ignore
			const address = await signer.getAddress();
			// call the whitelistedAddresses from the contract
			console.log(await whitelistContract.functions)
			const _joinedWhitelist = await whitelistContract.whitelistedAddresses(address);
			console.log('ae2')
			setJoinedWhitelist(_joinedWhitelist);
		} catch (err) {
			console.error(err);
		}
	};

	/*
	  connectWallet: Connects the MetaMask wallet
	*/
	const connectWallet = async () => {
		try {
			// Get the provider from web3Modal, which in our case is MetaMask
			// When used for the first time, it prompts the user to connect their wallet
			await getProviderOrSigner();
			setWalletConnected(true);

			await checkIfAddressInWhitelist();
			await getNumberOfWhitelisted();
		} catch (err) {
			console.error(err);
		}
	};

	/*
	  renderButton: Returns a button based on the state of the dapp
	*/
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

	// useEffects are used to react to changes in state of the website
	// The array at the end of function call represents what state changes will trigger this effect
	// In this case, whenever the value of `walletConnected` changes - this effect will be called
	useEffect(() => {
		// if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
		if (!walletConnected) {
			// Assign the Web3Modal class to the reference object by setting it's `current` value
			// The `current` value is persisted throughout as long as this page is open
			web3ModalRef.current = new Web3Modal();
			void connectWallet();
		}
	}, [walletConnected]);

	return (
		<div>
			<Head>
				<title>Whitelist Dapp</title>
				<meta name="description" content="Whitelist-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to Crypto Devs!</h1>
					<div className={styles.description}>
						Its an NFT collection for developers in Crypto.
					</div>
					<div className={styles.description}>
						{numberOfWhitelisted} have already joined the Whitelist
					</div>
					{renderButton()}
				</div>
				<div>
					<img className={styles.image} src="/crypto-devs.svg"  alt="img"/>
				</div>
			</div>

			<footer className={styles.footer}>
				Made with &#10084;
			</footer>
		</div>
	);
}