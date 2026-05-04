import { ethers } from "hardhat";

async function main() {
  console.log("Igniting the engine...");
  console.log("Deploying DarkGrid V5 to Sepolia...");

  // 1. Get the compiled contract factory
  const DarkGrid = await ethers.getContractFactory("DarkGrid");

  // 2. Deploy the contract to the blockchain
  const darkGrid = await DarkGrid.deploy();

  // 3. Wait for the block to be mined and confirmed
  await darkGrid.waitForDeployment();

  // 4. Extract the shiny new address
  const address = await darkGrid.getAddress();

  console.log("=================================================");
  console.log(`✅ SUCCESS! DarkGrid V5 deployed to: ${address}`);
  console.log("=================================================");
  console.log("NEXT STEPS:");
  console.log("1. Copy the address above.");
  console.log("2. Paste it into your ChessBoard.tsx file.");
  console.log("3. Update your abi.ts with the new translation manual.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});