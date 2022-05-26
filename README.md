![Screenshot from 2022-05-16 21-09-08](https://user-images.githubusercontent.com/36077702/168664830-ecd725cb-dd3f-41ab-bf73-387b4f08b2f8.png)

## Features
* **Whitelist** allows the users to join it, so that they can later pay less for WestPunks NFTs.
* **WestPunks NFTs** can be minted by whitelisted users on a presale for a reduced price until the presale runs out, and after that, they can be minted for the regular price.
* **Initial coin offering(ICO)** allows the user to claim 10 tokens for every purchased WestPunks NFT, and mint tokens. Maximum of 1000 tokens are allowed to be minted and claimed.
* **Decentralized Autonomous Organization(DAO)** allows the smart contract owner to create a proposal that the users that have WestPunks NFTs can vote on.



![Screenshot from 2022-05-26 12-34-40](https://user-images.githubusercontent.com/36077702/170471377-266479cd-77cf-471f-acd2-b8f850795914.png)

### You can access the application here: https://westpunks.vercel.app/
*To interact with the app you will need a wallet connected to the **mumbai** testnet.




# Steps to set up the project on your local machine
**We are going to work with _mumbai_ testnet network while connecting to _Alchemy_.**

Mumbai is an Ethereum test network that allows for blockchain development testing without paying gas fees with real money like on the mainnet.

Alchemy is a node provider. It helps your app communicate with contracts on the blockchain like a bridge.
### Setup
- install `npm` and `npx` on your machine
- run `npm install` to set up all the dependencies (hardhat, ethers, etc.)
- set up a [Metamask](https://metamask.io/download.html) wallet
- get free matic on mumbai testnet [here](https://mumbaifaucet.com/)
- set up an Alchemy account [here](https://alchemy.com/?a=641a319005)
- create`.env` file and then fill in the following environment variables with your own info
```shell
  ETHERSCAN_API_KEY=
  MUMBAI_URL=
  PRIVATE_KEY=
```


### Commands:
- run `npx hardhat compile` if you want to compile your smart contracts
- run `npx hardhat run scripts/deploy.js --network mumbai` to deploy the contract to the Mumbai testnet
- modify `.config.ts` file with addresses from the previous command
- run `npm run dev` to start the local server; you should be able to access the app on `localhost:3000`
- run `npx hardhat test` to run unit tests
- run `npx hardhat verify --network mumbai <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMS> ` to verify your contrac