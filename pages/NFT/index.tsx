import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {NFT_CONTRACT_ADDRESS, ABI } from "../../constants/nft";

import styles from "/styles/Home.module.css";
import {JsonRpcSigner} from "@ethersproject/providers";
import {Button, Container, Text} from "@nextui-org/react";
import Link from "next/link";

export default function Home() {
	const [walletConnected, setWalletConnected] = useState(false);
	const [presaleStarted, setPresaleStarted] = useState(false);
	const [presaleEnded, setPresaleEnded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
	const web3ModalRef = useRef<Web3Modal>(Web3Modal.prototype);

	/**
	 * presaleMint: Mint an NFT during the presale
	 */
	const presaleMint = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, signer);
			// call the presaleMint from the contract, only whitelisted addresses would be able to mint
			const tx = await nftContract.presaleMint({
				value: utils.parseEther("0.01"),
			});
			setLoading(true);
			await tx.wait();
			setLoading(false);
			window.alert("You successfully minted a Crypto Dev!");
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * publicMint: Mint an NFT after the presale
	 */
	const publicMint = async () => {
		try {
			const signer = await getProviderOrSigner(true);

			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, signer);
			const tx = await nftContract.mint({
				value: utils.parseEther("0.01"),
			});
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			window.alert("You successfully minted a Crypto Dev!");
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
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * startPresale: starts the presale for the NFT Collection
	 */
	const startPresale = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, signer);
			const tx = await nftContract.startPresale();
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			// set the presale started to true
			await checkIfPresaleStarted();
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * checkIfPresaleStarted: checks if the presale has started by quering the `presaleStarted`
	 * variable in the contract
	 */
	const checkIfPresaleStarted = async () => {

			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, provider);
			// call the presaleStarted from the contract
			const _presaleStarted = await nftContract.presaleStarted();
			console.log(_presaleStarted)
			if (!_presaleStarted) {
				await getOwner();
			}
			setPresaleStarted(_presaleStarted);
			return _presaleStarted;

	};

	/**
	 * checkIfPresaleEnded: checks if the presale has ended by quering the `presaleEnded`
	 * variable in the contract
	 */
	const checkIfPresaleEnded = async () => {

			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, provider);
			const _presaleEnded = await nftContract.presaleEnded();
			// Date.now()/1000 returns the current time in seconds
			// We compare if the _presaleEnded timestamp is less than the current time
			// which means presale has ended
			const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
			if (hasEnded) {
				setPresaleEnded(true);
			} else {
				setPresaleEnded(false);
			}
			return hasEnded;

	};

	/**
	 * getOwner: calls the contract to retrieve the owner
	 */
	const getOwner = async () => {

			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, provider);
			const _owner = await nftContract.owner();
			const signer = await getProviderOrSigner(true);
			const address = signer instanceof JsonRpcSigner && await signer.getAddress();
			if (typeof address == "string" && address.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}



	};

	/**
	 * getTokenIdsMinted: gets the number of tokenIds that have been minted
	 */
	const getTokenIdsMinted = async () => {
		try {
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, ABI, provider);
			const _tokenIds = await nftContract.tokenIds();
			setTokenIdsMinted(_tokenIds.toString());
		} catch (err) {
			console.error(err);
		}
	};


	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);

		// const { chainId } = await web3Provider.getNetwork();
		// if (chainId !== 4) {
		// 	window.alert("Change the network to Rinkeby");
		// 	throw new Error("Change network to Rinkeby");
		// }

		if (needSigner) {
			return web3Provider.getSigner();
		}
		return web3Provider;
	};

	useEffect(() => {

		const _checkIfPresaleStarted = async () => {
			const _presaleStarted = await checkIfPresaleStarted();
			if (_presaleStarted) {
				await checkIfPresaleEnded();
			}
		}

		if (!walletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "mumbai",
				providerOptions: {},
				disableInjectedProvider: false,
			});
			void connectWallet();

			// Check if presale has started and ended

			void _checkIfPresaleStarted()

			void getTokenIdsMinted();

			// Set an interval which gets called every 5 seconds to check presale has ended
			const presaleEndedInterval = setInterval(async function () {
				const _presaleStarted = await checkIfPresaleStarted();
				if (_presaleStarted) {
					const _presaleEnded = await checkIfPresaleEnded();
					if (_presaleEnded) {
						clearInterval(presaleEndedInterval);
					}
				}
			}, 5 * 1000);

			// set an interval to get the number of token Ids minted every 5 seconds
			setInterval(async function () {
				await getTokenIdsMinted();
			}, 5 * 1000);
		}
	}, [walletConnected]);

	const renderButton = () => {
		if (!walletConnected) {
			return (
				<button onClick={connectWallet} className={styles.button}>
				Connect your wallet
			</button>
		)}

		// If we are currently waiting for something, return a loading button
		if (loading) {
			return <button className={styles.button}>Loading...</button>;
		}

		// If connected user is the owner, and presale hasnt started yet, allow them to start the presale
		if (isOwner && !presaleStarted) {
			return (
				<button className={styles.button} onClick={startPresale}>
				Start Presale!
			</button>
		);
		}

		// If connected user is not the owner but presale hasn't started yet, tell them that
		if (!presaleStarted) {
			return (
				<div>
					<div className={styles.description}>Presale hasn't started!</div>
				</div>
			);
		}

		// If presale started, but hasn't ended yet, allow for minting during the presale period
		if (presaleStarted && !presaleEnded) {
			return (
				<div>
					<div className={styles.description}>
						Presale has started!!! If your address is whitelisted, Mint a Crypto
						Dev 🥳
          			</div>
		  			<button className={styles.button} onClick={presaleMint}>
						Presale Mint 🚀
          			</button>
		  		</div>
				)}

		// If presale started and has ended, its time for public minting
		if (presaleStarted && presaleEnded) {
			return (
				<button className={styles.button} onClick={publicMint}>
				Public Mint 🚀
        </button>
		);
		}
	};

	return (
		<div>
			<Head>
				<title>Crypto Devs</title>
				<meta name="description" content="NFT" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Container xs>
				<Button.Group size="xl"  color="default">
					<Link href={'/'}><Button><Text color="black" >DAO</Text></Button></Link>
					<Link href={'/ico'}><Button><Text color="black" >ICO</Text></Button></Link>
					<Link href={'/NFT'}><Button><Text color="white" >Mint NFTs</Text></Button></Link>
					<Link href={'/whitelist'}><Button><Text color="black" >Start whitelist</Text></Button></Link>
				</Button.Group>
			</Container>
		<div className={styles.main}>
			<div>
				<h1 className={styles.title}>Welcome to WestPunks NFT minting!</h1>
				<div className={styles.description}>
					Its an NFT collection for developers in Crypto.
				</div>
				<div className={styles.description}>
					{tokenIdsMinted}/20 have been minted
				</div>
				{renderButton()}
			</div>
			<div>
				<img className={styles.image} src="/nfts/0.svg" />
			</div>
		</div>

		<footer className={styles.footer}>
			Made with &#10084;
		</footer>
	</div>
);
}