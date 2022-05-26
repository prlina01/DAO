import Head from "next/head";
import styles from "../../styles/Home.module.css";
import Web3Modal from "web3modal";
import {ethers} from "ethers";
import {useEffect, useRef, useState} from "react";
import {WHITELIST_CONTRACT_ADDRESS} from "../../constants/whitelist";
import Whitelist from '../../artifacts/contracts/Whitelist/Whitelist.sol/Whitelist.json'
import {Button, Card, Col, Container, Grid, Row, Spacer, Text} from "@nextui-org/react";
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

	const isMetamaskRef = useRef(true)

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
		if(!isMetamaskRef.current) return <Button css={{mt: '10vh'}} disabled={true}>No wallet installed in your browser!</Button>
		if (walletConnected) {
			if (joinedWhitelist) {
				return (
					<Text color={'white'} css={{mt: '10vh'}} size={30}>
						Thanks for joining the Whitelist!
					</Text>
				);
			} else if (loading) {
				return <Button css={{mt: '10vh'}} color={'success'}>Loading...</Button>;
			} else {
				return (
					<Button css={{mt: '10vh'}} color={'success'} onClick={addAddressToWhitelist} >
						Join the Whitelist
					</Button>
				);
			}
		} else {
			return (
				<Button css={{mt: '10vh'}} onClick={connectWallet} color={'success'}>
					Connect your wallet
				</Button>
			);
		}
	};
	useEffect(() => {
		if(typeof window.ethereum == "undefined") {
			alert("No wallet installed in the browser! You cant interact with the app")
			isMetamaskRef.current = false
			void getNumberOfWhitelisted()
			return
		} else
		void connectWallet();

	}, []);

	return (
		<div>
			<Head>
				<title>Whitelist Dapp</title>
				<meta name="description" content="Whitelist-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Container md>
				<Row justify="center" align="center">
					<div className={styles.hideOnDesktop}>
						<Button.Group  auto color="default">
							<Link href={'/'}><Button><Text color="black" >DAO</Text></Button></Link>
							<Link href={'/ico'}><Button><Text color="black" >ICO</Text></Button></Link>
							<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
							<Link href={'/whitelist'}><Button><Text color="white" >Start whitelist</Text></Button></Link>
						</Button.Group>
					</div>
					<div className={styles.hideOnMobile}>
						<Button.Group  size={"xl"} color="default">
							<Link href={'/'}><Button><Text color="black" >DAO</Text></Button></Link>
							<Link href={'/ico'}><Button><Text color="black" >ICO</Text></Button></Link>
							<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
							<Link href={'/whitelist'}><Button><Text color="white" >Start whitelist</Text></Button></Link>
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
								WestPunks whitelist</Text>
							<Text  h3 size={25} css={{mb: '10vh'}}>
								Join the whitelist to have lower prices on our NFT presale!
							</Text>
							<Text color={'white'} h3 size={25}>
								<b>{numberOfWhitelisted}</b>
								{numberOfWhitelisted > 2 || numberOfWhitelisted == 0 ? ' people have ' : ' person has ' }
								already joined the Whitelist
							</Text>
							{renderButton()}
						</Grid>
						<Grid className={styles.hideOnMobile}>
							<img src="/nfts/1.svg"  alt="img"/>
						</Grid>
					</Grid.Container>
				</Card>

			</Container>

		</div>
	);
}