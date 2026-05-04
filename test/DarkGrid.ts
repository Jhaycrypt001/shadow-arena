import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

describe("DarkGrid Fog of War", function () {
  let darkGrid: any;
  let signers: any;

  before(async function () {
    signers = await ethers.getSigners();
    const DarkGrid = await ethers.getContractFactory("DarkGrid");
    darkGrid = await DarkGrid.deploy();
    await darkGrid.waitForDeployment();
  });

  it("Should process the encrypted moves blindfolded", async function () {
    const contractAddress = await darkGrid.getAddress();

    console.log("Encrypting Player 1 (5,5) and Player 2 (6,6)...");
    
    const input = hre.fhevm.createEncryptedInput(contractAddress, signers[0].address);
    input.add8(5); // P1 X
    input.add8(5); // P1 Y
    input.add8(6); // P2 X
    input.add8(6); // P2 Y
    
    const encryptedData = await input.encrypt();

    const handle1 = ethers.hexlify(encryptedData.handles[0]);
    const handle2 = ethers.hexlify(encryptedData.handles[1]);
    const handle3 = ethers.hexlify(encryptedData.handles[2]);
    const handle4 = ethers.hexlify(encryptedData.handles[3]);
    const proof = ethers.hexlify(encryptedData.inputProof);

    // We now fire the payload and the math in a single transaction!
    console.log("Sending handles and running proximity logic in ONE transaction...");
    const tx = await darkGrid.setPositionsAndUpdateVision(handle1, handle2, handle3, handle4, proof);
    await tx.wait();

    console.log("✅ Vision transaction successful! The contract calculated the distance completely in the dark.");
    expect(tx.hash).to.be.a("string");
  });
});