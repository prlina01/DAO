import {BigNumber, Contract, providers, utils} from "ethers";
import Head from "next/head";
import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS,} from "../../constants/ico";
import styles from "/styles/Home.module.css";
import {JsonRpcSigner} from "@ethersproject/providers";
import {parseEther} from "ethers/lib/utils";
import {Button, Card, Container, FormElement, Grid, Input, Row, Spacer, Text} from "@nextui-org/react";
import Link from "next/link";
import {useForm} from "react-hook-form";

export default function Home() {
	// Create a BigNumber `0`
	const zero = BigNumber.from(0);
	const [walletConnected, setWalletConnected] = useState(false);
	const [loading, setLoading] = useState(false);
	// tokensToBeClaimed keeps track of the number of tokens that can be claimed
	// based on the WestPunks NFTs held by the user for which they haven't claimed the tokens
	const [tokensToBeClaimed, setTokensToBeClaimed] = useState(0);
	// balanceOfCryptoDevTokens keeps track of number of WestPunks tokens owned by an address
	const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(
		zero
	);
	// amount of the tokens that the user wants to mint
	const [tokenAmount, setTokenAmount] = useState(zero);
	// tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
	const [tokensMinted, setTokensMinted] = useState(zero);
	const web3ModalRef = useRef<Web3Modal>(Web3Modal.prototype);
	const isMetamaskRef = useRef(true)
	const {register, setValue} = useForm()



	/**
	 * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
	 */
	const getTokensToBeClaimed = async () => {
		try {
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(
				NFT_CONTRACT_ADDRESS,
				NFT_CONTRACT_ABI,
				provider
			);
			const tokenContract = new Contract(
				TOKEN_CONTRACT_ADDRESS,
				TOKEN_CONTRACT_ABI,
				provider
			);
			const signer = await getProviderOrSigner(true);
			const address = signer instanceof JsonRpcSigner && await signer.getAddress();
			const balance = await nftContract.balanceOf(address);
			if (balance === zero) {
				setTokensToBeClaimed(0);
			} else {
				// amount keeps track of the number of unclaimed tokens
				let amount = 0;
				// For all the NFTs, check if the tokens have already been claimed
				// Only increase the amount if the tokens have not been claimed
				// for a NFT(for a given tokenId)
				for (let i = 0; i < balance; i++) {
					const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
					const claimed = await tokenContract.tokenIdsClaimed(tokenId);
					if (!claimed) {
						amount++;
					}
				}
				//tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
				// to a big number and then set its value
				setTokensToBeClaimed(amount);
			}
		} catch (err) {
			console.error(err);
			setTokensToBeClaimed(0);
		}
	};

	/**
	 * getBalanceOfCryptoDevTokens: checks the balance of WestPunks Tokens's held by an address
	 */
	const getBalanceOfCryptoDevTokens = async () => {
		try {
			const provider = await getProviderOrSigner();
			const tokenContract = new Contract(
				TOKEN_CONTRACT_ADDRESS,
				TOKEN_CONTRACT_ABI,
				provider
			);
			const signer = await getProviderOrSigner(true);
			const address = signer instanceof JsonRpcSigner && await signer.getAddress();
			const balance = await tokenContract.balanceOf(address);
			setBalanceOfCryptoDevTokens(balance);
		} catch (err) {
			console.error(err);
			setBalanceOfCryptoDevTokens(zero);
		}
	};

	/**
	 * mintCryptoDevToken: mints `amount` number of tokens to a given address
	 */
	const mintCryptoDevToken = async (amount: BigNumber) => {
			const signer = await getProviderOrSigner(true);
			// Create an instance of tokenContract
			const tokenContract = new Contract(
				TOKEN_CONTRACT_ADDRESS,
				TOKEN_CONTRACT_ABI,
				signer
			);
			// Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
			const value = amount.mul(parseEther(0.001.toString()));
			const tx = await tokenContract.mint(amount, {
				// value signifies the cost of one WestPunks token which is "0.001" eth.
				// We are parsing `0.001` string to ether using the utils library from ethers.js
				value: value
			});
			setLoading(true);

			await tx.wait();
			setLoading(false);
			window.alert("Successfully minted WestPunks Tokens");
			await getBalanceOfCryptoDevTokens();
			await getTotalTokensMinted();
			await getTokensToBeClaimed();

	};

	/**
	 * claimCryptoDevTokens: Helps the user claim WestPunks Tokens
	 */
	const claimCryptoDevTokens = async () => {

			const signer = await getProviderOrSigner(true);
			const tokenContract = new Contract(
				TOKEN_CONTRACT_ADDRESS,
				TOKEN_CONTRACT_ABI,
				signer
			);
			const tx = await tokenContract.claim();
			setLoading(true);
			await tx.wait();
			setLoading(false);
			window.alert("Successfully claimed WestPunks Tokens");
			await getBalanceOfCryptoDevTokens();
			await getTotalTokensMinted();
			await getTokensToBeClaimed();

	};

	/**
	 * getTotalTokensMinted: Retrieves how many tokens have been minted till now
	 * out of the total supply
	 */
	const getTotalTokensMinted = async () => {
		try {
			const provider = await getProviderOrSigner();
			const tokenContract = new Contract(
				TOKEN_CONTRACT_ADDRESS,
				TOKEN_CONTRACT_ABI,
				provider
			);
			// Get all the tokens that have been minted
			const _tokensMinted = await tokenContract.totalSupply();
			setTokensMinted(_tokensMinted);
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

	/*
	  connectWallet: Connects the MetaMask wallet
	*/
	const connectWallet = async () => {
		try {
			// When used for the first time, it prompts the user to connect their wallet
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (!walletConnected) {
			if(typeof window.ethereum == "undefined") {
				alert('No wallet installed in the browser! You cant interact with the app!')
				return
			} else
			web3ModalRef.current = new Web3Modal({
				network: "mumbai",
				providerOptions: {},
				disableInjectedProvider: false,
			});
			void connectWallet();
			void getTotalTokensMinted();
			void getBalanceOfCryptoDevTokens();
			void getTokensToBeClaimed();
		}
	}, [walletConnected]);

	/*
	  renderButton: Returns a button based on the state of the dapp
	*/
	const renderButton = () => {
		if(!isMetamaskRef.current)
			return <Button css={{mt: '10vh'}} disabled={true}>No wallet installed in your browser!</Button>

		// If we are currently waiting for something, return a loading button
		if (loading) {
			return (
				<div>
					<Button css={{mt: '10vh'}} color={'success'}>Loading...</Button>
				</div>
			)}
		// If tokens to be claimed are greater than 0, Return a claim button
		if (tokensToBeClaimed > 0) {
			return (
				<div>
					<Text color={'white'} css={{mt: '10vh'}} size={30}>
						<b>{tokensToBeClaimed * 10}</b> Tokens can be claimed!
					</Text>
					<Button css={{mt: '10vh'}} color={'success'} onClick={claimCryptoDevTokens}>
						Claim Tokens
					</Button>
				</div>
		)}
		// If user doesn't have any tokens to claim, show the mint button
		return (
			<div>
				<Grid.Container>
					<Grid xs={12} justify='center'>
						<Input
							{...register('tokenAmount')}
							rounded

							placeholder="Amount of Tokens"
							// BigNumber.from converts the `e.target.value` to a BigNumber
							onChange={(e) => checkInputHandler(e)}
						/>
					</Grid>
					<Grid xs={12} justify='center'>
						<Button auto css={{mt: '2vh'}} color={'success'}
								disabled={!(tokenAmount.gt(zero))}
							// disabled={!(tokenAmount > 0)}
								onClick={() => mintCryptoDevToken(tokenAmount)}
						>
							Mint Tokens
						</Button>
					</Grid>

				</Grid.Container>

			</div>
		);
	};

	const checkInputHandler = (e: ChangeEvent<FormElement>) => {
		const value = e.target.value
		const isValid = value.match(/^[1-9]\d*$/)

		if(value.length === 0)
			setTokenAmount(BigNumber.from(0))

		if(!isValid || Number(value) > 10000) {
			setValue('tokenAmount', value.substring(0,value.length - 1))
		}
		else {
			setTokenAmount(BigNumber.from(e.target.value))
			setValue('tokenAmount', value)
		}
	}

	return (
		<div>
			<Head>
				<title>ICO</title>
				<meta name="description" content="ICO-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Container md>
				<Row justify="center" align="center">
					<div className={styles.hideOnDesktop}>
						<Button.Group  auto color="default">
							<Link href={'/'}><Button><Text color="black" >DAO</Text></Button></Link>
							<Link href={'/ico'}><Button><Text color="white" >ICO</Text></Button></Link>
							<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
							<Link href={'/whitelist'}><Button><Text color="black" >Start whitelist</Text></Button></Link>
						</Button.Group>
					</div>
					<div className={styles.hideOnMobile}>
						<Button.Group  size={"xl"} color="default">
							<Link href={'/'}><Button><Text color="black" >DAO</Text></Button></Link>
							<Link href={'/ico'}><Button><Text color="white" >ICO</Text></Button></Link>
							<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
							<Link href={'/whitelist'}><Button><Text color="black" >Start whitelist</Text></Button></Link>
						</Button.Group>
					</div>
				</Row>
				<Spacer y={2} />
				<Card css={{bgColor: "#079992"}}>
					<Grid.Container gap={2} justify="center">
						<Grid>
							<Text h1
								  size={55}
								  css={{
									  textGradient: "45deg, $blue600 -20%, $purple600 50%",
									  mb: '1vh',
									  textAlign: 'center'
								  }}
								  weight="bold">
								WestPunks ICO</Text>
							<Text  h3 size={20} css={{mb: '10vh'}}>
								Mint tokens or claim <b>10</b> for every purchased WestPunks NFT
							</Text>
							{walletConnected ? (
								<div>
									<Text color={"white"} h3 size={25} css={{mb: '2vh'}}>
										{/* Format Ether helps us in converting a BigNumber to string */}
										You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
										WestPunks Tokens
									</Text>
									<Text color={"white"} h3 size={25} css={{mb: '10vh'}}>
										{/* Format Ether helps us in converting a BigNumber to string */}
										Overall {utils.formatEther(tokensMinted)}/10000 have been
										minted!!!
									</Text>
									{renderButton()}
								</div>
							) : (
								<Button css={{mt: '10vh'}} color={'success'} onClick={connectWallet}>
									Connect your wallet
								</Button>
							)}
						</Grid>
						<Grid className={styles.hideOnMobile}>
							<img src="/nfts/4.svg"  alt="img"/>
						</Grid>
					</Grid.Container>
				</Card>
			</Container>
		</div>
	);
}