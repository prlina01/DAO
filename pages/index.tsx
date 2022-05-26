import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import React, {ChangeEvent, useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
	DAO_ABI,
	DAO_CONTRACT_ADDRESS,
	NFT_ABI,
	NFT_CONTRACT_ADDRESS,
} from "../constants/dao";
import styles from "/styles/Home.module.css";
import {JsonRpcSigner} from "@ethersproject/providers";
import Link from "next/link";

import {
	Button,
	Container,
	Text,
	Card,
	Grid,
	Input,
	FormElement,
	Modal,
	useModal, Row, Spacer,
} from "@nextui-org/react";
import {useForm} from "react-hook-form";


type Proposal = {
	proposalId: number,
	nftTokenId: string,
	deadline: Date,
	yayVotes: string,
	nayVotes: string,
	executed: boolean,
}

export default function Home() {
	const [treasuryBalance, setTreasuryBalance] = useState("0");
	const [numProposals, setNumProposals] = useState("0");
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [nftBalance, setNftBalance] = useState(0);
	// Fake NFT Token ID to purchase. Used when creating a proposal.
	const [fakeNftTokenId, setFakeNftTokenId] = useState("");
	// One of "Create Proposal" or "View Proposals"
	const [selectedTab, setSelectedTab] = useState("");
	// True if waiting for a transaction to be mined, false otherwise.
	const [loading, setLoading] = useState(false);
	// True if user has connected their wallet, false otherwise
	const [walletConnected, setWalletConnected] = useState(false);
	const web3ModalRef = useRef<Web3Modal>(Web3Modal.prototype);
	const isMetamaskRef = useRef(true)
	const {register, setValue} = useForm()


	const connectWallet = async () => {
		try {
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (error) {
			console.error(error);
		}
	};

	// Reads the ETH balance of the DAO contract and sets the `treasuryBalance` state variable
	const getDAOTreasuryBalance = async () => {
		try {
			const provider = await getProviderOrSigner();
			const balance = await provider.getBalance(
				DAO_CONTRACT_ADDRESS
			);
			setTreasuryBalance(balance.toString());
		} catch (error) {
			console.error(error);
		}
	};

	// Reads the number of proposals in the DAO contract and sets the `numProposals` state variable
	const getNumProposalsInDAO = async () => {
		try {
			const provider = await getProviderOrSigner();
			const contract = getDaoContractInstance(provider);
			const daoNumProposals = await contract.numProposals();
			setNumProposals(daoNumProposals.toString());
		} catch (error) {
			console.error(error);
		}
	};

	// Reads the balance of the user's WestPunks NFTs and sets the `nftBalance` state variable
	const getUserNFTBalance = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const nftContract = getCryptodevsNFTContractInstance(signer);
			const address = signer instanceof JsonRpcSigner && await signer.getAddress();
			const balance = await nftContract.balanceOf(address);
			setNftBalance(parseInt(balance.toString()));
		} catch (error) {
			console.error(error);
		}
	};

	// Calls the `createProposal` function in the contract, using the tokenId from `fakeNftTokenId`
	const createProposal = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.createProposal(fakeNftTokenId);
			setLoading(true);
			await txn.wait();
			await getNumProposalsInDAO();
			setLoading(false);
		} catch (error: any) {
			console.error(error);
			window.alert(error.data.message);
		}
	};

	// Helper function to fetch and parse one proposal from the DAO contract
	// Given the Proposal ID
	// and converts the returned data into a Javascript object with values we can use
	const fetchProposalById = async (id: number) => {
		try {
			const provider = await getProviderOrSigner();
			const daoContract = getDaoContractInstance(provider);
			const proposal = await daoContract.proposals(id);
			const parsedProposal: Proposal = {
				proposalId: id,
				nftTokenId: proposal.nftTokenId.toString(),
				deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
				yayVotes: proposal.yayVotes.toString(),
				nayVotes: proposal.nayVotes.toString(),
				executed: proposal.executed,
			};
			return parsedProposal;
		} catch (error) {
			console.error(error);
		}
	};

	// Runs a loop `numProposals` times to fetch all proposals in the DAO
	// and sets the `proposals` state variable
	const fetchAllProposals = async () => {
		try {
			const proposals: Proposal[] = [];
			for (let i = 0; i < Number(numProposals); i++) {
				let proposal = await fetchProposalById(i);
				typeof(proposal) == 'object' && proposals.push(proposal);
			}
			setProposals(proposals);
			return proposals;
		} catch (error) {
			console.error(error);
		}
	};

	// Calls the `voteOnProposal` function in the contract, using the passed
	// proposal ID and Vote
	const voteOnProposal = async (proposalId: number, _vote: string) => {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);

			let vote = _vote === "YAY" ? 0 : 1;
			const txn = await daoContract.voteOnProposal(proposalId, vote);
			setLoading(true);
			await txn.wait();
			setLoading(false);
			await fetchAllProposals();
		} catch (error: any) {
			console.error(error);
			window.alert(error.data.message);
		}
	};

	// Calls the `executeProposal` function in the contract, using
	// the passed proposal ID
	const executeProposal = async (proposalId: number) => {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.executeProposal(proposalId);
			setLoading(true);
			await txn.wait();
			setLoading(false);
			await fetchAllProposals();
		} catch (error: any) {
			console.error(error);
			window.alert(error.data.message);
		}
	};

	// Helper function to fetch a Provider/Signer instance from Metamask
	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);

		// const { chainId } = await web3Provider.getNetwork();
		// if (chainId !== 4) {
		// 	window.alert("Please switch to the Rinkeby network!");
		// 	throw new Error("Please switch to the Rinkeby network");
		// }

		if (needSigner) {
			return web3Provider.getSigner();
		}
		return web3Provider;
	};

	// Helper function to return a DAO Contract instance
	// given a Provider/Signer
	const getDaoContractInstance = (providerOrSigner: any) => {
		return new Contract(
			DAO_CONTRACT_ADDRESS,
			DAO_ABI,
			providerOrSigner
		);
	};

	// Helper function to return a WestPunks NFT Contract instance
	// given a Provider/Signer
	const getCryptodevsNFTContractInstance = (providerOrSigner: any) => {
		return new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, providerOrSigner);
	};

	// piece of code that runs everytime the value of `walletConnected` changes
	// so when a wallet connects or disconnects
	// Prompts user to connect wallet if not connected
	// and then calls helper functions to fetch the
	// DAO Treasury Balance, User NFT Balance, and Number of Proposals in the DAO
	useEffect(() => {
		if (!walletConnected) {
			if(typeof window.ethereum == "undefined") {
				alert('No wallet installed in the browser! You cant interact with the app!')
				return
			} else
			web3ModalRef.current = new Web3Modal({
				network: "rinkeby",
				providerOptions: {},
				disableInjectedProvider: false,
			});


				void getDAOTreasuryBalance();
				void getUserNFTBalance();
				void getNumProposalsInDAO();

		}
	}, [walletConnected]);

	// Piece of code that runs everytime the value of `selectedTab` changes
	// Used to re-fetch all proposals in the DAO when user switches
	// to the 'View Proposals' tab
	useEffect(() => {
		if (selectedTab === "View Proposals") {
			void fetchAllProposals();
		}
	}, [selectedTab]);

	// Render the contents of the appropriate tab based on `selectedTab`
	function renderTabs() {
		if (selectedTab === "Create Proposal") {
			return renderCreateProposalTab();
		} else if (selectedTab === "View Proposals") {
			return renderViewProposalsTab();
		}
		return null;
	}

	const checkInputHandler = (e: ChangeEvent<FormElement>) => {
		const value = e.target.value
		const isValid = value.match(/^[1-9]\d*$/)
		if(!isValid || value.length > 8) setValue('ethAmount', value.substring(0,value.length - 1))
		else {
			setFakeNftTokenId(e.target.value)
			setValue('ethAmount', value)
		}
	}

	// Renders the 'Create Proposal' tab content
	function renderCreateProposalTab() {
		if (loading) {
			return (
				<div className={styles.description}>
					Loading... Waiting for transaction...
				</div>
			);
		} else if (nftBalance === 0) {
			return (
				<div className={styles.description}>
					You do not own any CryptoDevs NFTs. <br />
					<b>You cannot create or vote on proposals</b>
				</div>
			);
		} else {
			return (
				<div className={styles.container}>
					{/*<label>Fake NFT Token ID to Purchase: </label>*/}
					<Input
						{...register('ethAmount')}
						rounded
						labelPlaceholder={'Enter NFT ID to Purchase'}
						status={'secondary'}
						onChange={(e) => checkInputHandler(e)}
					/>
					<button className={styles.button2} style={{marginLeft: '20px'}} onClick={createProposal}>
						Create
					</button>
				</div>
			);
		}
	}

	// Renders the 'View Proposals' tab content
	function renderViewProposalsTab() {
		if(!isMetamaskRef.current) return <Button css={{mt: '10vh'}} disabled={true}>No wallet installed in your browser!</Button>
		if (loading) {
			return (
				<Text css={{mt: '10vh'}} size={30}>
					Loading... Waiting for transaction...
				</Text>
			);
		} else if (proposals.length === 0) {
			return (
				<Text css={{mt: '3vh'}} size={25}>No proposals have been created</Text>
			);
		} else {
			return (
				<div>
					{proposals.map((p, index) => (
						<div key={index} className={styles.proposalCard}>
							<Text color={'white'} css={{textAlign: 'center'}}>Proposal ID: {p.proposalId}</Text>
							<Text color={'white'} css={{textAlign: 'center'}}>Fake NFT to Purchase: {p.nftTokenId}</Text>
							<Text color={'white'} css={{textAlign: 'center'}}>Deadline: {p.deadline.toLocaleString()}</Text>
							<Text color={'white'} css={{textAlign: 'center'}}>Yay Votes: {p.yayVotes}</Text>
							<Text color={'white'} css={{textAlign: 'center'}}>Nay Votes: {p.nayVotes}</Text>
							<Text color={'white'} css={{textAlign: 'center'}}>Executed?: {p.executed.toString()}</Text>
							{p.deadline.getTime() > Date.now() && !p.executed ? (
								<div className={styles.flex}>
									<button style={{marginLeft: '35px'}}
										className={styles.button2}
										onClick={() => voteOnProposal(p.proposalId, "YAY")}
									>
										Vote YAY
									</button>
									<button
										className={styles.button2}
										onClick={() => voteOnProposal(p.proposalId, "NAY")}
									>
										Vote NAY
									</button>
								</div>
							) : p.deadline.getTime() < Date.now() && !p.executed ? (
								<div className={styles.flex}>
									<button style={{marginLeft: '35px'}}
										className={styles.button2}
										onClick={() => executeProposal(p.proposalId)}
									>
										Execute Proposal{" "}
										{p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
									</button>
								</div>
							) : (
								<Text weight={'bold'} css={{textAlign: 'center'}} color={'black'}>Proposal Executed</Text>
							)}
						</div>
					))}
				</div>
			);
		}
	}

	return (
		<div>
			<Head>
				<title>WestPunks DAO</title>
				<meta name="description" content="WestPunks DAO" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Container md>
				<Row justify="center" align="center">
					<div className={styles.hideOnDesktop}>
						<Button.Group  auto color="default">
							<Link href={'/'}><Button><Text color="white" >DAO</Text></Button></Link>
							<Link href={'/ico'}><Button><Text color="black" >ICO</Text></Button></Link>
							<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
							<Link href={'/whitelist'}><Button><Text color="black" >Start whitelist</Text></Button></Link>
						</Button.Group>
					</div>
					<div className={styles.hideOnMobile}>
						<Button.Group size={"xl"} color="default">
							<Link href={'/'}><Button><Text color="white" >DAO</Text></Button></Link>
							<Link href={'/ico'}><Button><Text color="black" >ICO</Text></Button></Link>
							<Link href={'/NFT'}><Button><Text color="black" >Mint NFTs</Text></Button></Link>
							<Link href={'/whitelist'}><Button><Text color="black" >Start whitelist</Text></Button></Link>
						</Button.Group>
					</div>
				</Row>
				<Spacer y={2} />
				<Card css={{bgColor: "#079992"}}>
					<Grid.Container gap={2} justify="center" >
						<Grid>
						<Text h1
							  size={55}
							  css={{
								  textGradient: "45deg, $blue600 -20%, $purple600 50%",
								  mb: '4vh',
								  textAlign: 'center'

							  }}
							  weight="bold">WestPunks DAO</Text>
						<Text color={'white'}  h3 size={25} css={{mb: '10vh'}}>
							Your WestPunks NFT Balance: {nftBalance}
							<br />
							Treasury Balance: {formatEther(treasuryBalance)} ETH
							<br />
							Total Number of Proposals: {numProposals}
						</Text>
						<div>
							<div className={styles.hideOnMobile}>
								<Button.Group size="xl" color="success">
									<Button onClick={() => setSelectedTab("Create Proposal")}>
										<Text color="white" >Create Proposal</Text>
									</Button>
									<Button onClick={() => setSelectedTab("View Proposals")}>
										<Text color="white" >View Proposals</Text>
									</Button>
								</Button.Group>
							</div>

							<div className={styles.hideOnDesktop} >
								<Button.Group auto color="success">
									<Button onClick={() => setSelectedTab("Create Proposal")}>
										<Text color="white" >Create Proposal</Text>
									</Button>
									<Button onClick={() => setSelectedTab("View Proposals")}>
										<Text color="white" >View Proposals</Text>
									</Button>
								</Button.Group>
							</div>

							{/*<button*/}
							{/*	className={styles.button}*/}
							{/*	onClick={() => setSelectedTab("Create Proposal")}*/}
							{/*>*/}
							{/*	Create Proposal*/}
							{/*</button>*/}
							{/*<button*/}
							{/*	className={styles.button}*/}
							{/*	onClick={() => setSelectedTab("View Proposals")}*/}
							{/*>*/}
							{/*	View Proposals*/}
							{/*</button>*/}
						</div>

							{renderTabs()}

						</Grid>

						<Grid xs={6} className={styles.hideOnMobile}>
							<img src="/nfts/4.svg" />
						</Grid>
					</Grid.Container>
				</Card>

			</Container>
		</div>
	)
}