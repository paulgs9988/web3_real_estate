// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  //setting up arbitrary accounts
  const signersAccounts = await ethers.getSigners();
  const buyer = signersAccounts[0];
  const seller = signersAccounts[1];
  const inspector = signersAccounts[2];
  const lender = signersAccounts[3];

  //console.log(buyer.address);

  //Deploying Real Estate Contract
  const RealEstate = await ethers.getContractFactory("RealEstate");
  realEstate = await RealEstate.deploy();
  //wait for it to actually deploy:
  await realEstate.deployed();
  console.log(`Deployed Real Estate Contract at: ${realEstate.address}`);

  //Mint Properties from json 1 to 3:
  console.log("minting properties...");
  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }
  console.log("mint complete");

  //Deploy Escrow Contract:
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed();
  //console.log("Escrow deployed");

  //Approve Properties:
  for (let i = 0; i < 3; i++) {
    let transaction = await realEstate
      .connect(seller)
      .approve(escrow.address, i + 1);
    await transaction.wait();
  }
  //console.log("Properties approved");
  //List properties:
  transaction = await escrow
    .connect(seller)
    .list(1, buyer.address, tokens(20), tokens(10));
  await transaction.wait();

  //console.log("proprty 1 listed");

  transaction = await escrow
    .connect(seller)
    .list(2, buyer.address, tokens(15), tokens(5));
  await transaction.wait();

  //console.log("property 2 listed");

  transaction = await escrow
    .connect(seller)
    .list(3, buyer.address, tokens(10), tokens(5));
  await transaction.wait();

  console.log("Finished");
}

//boilerplate hardhat script setup to use async/await everywhere
//and properly handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
