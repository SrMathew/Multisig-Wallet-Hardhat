const hre = require("hardhat");

async function main() {

    const [approver1, approver2, approver3] = await hre.ethers.getSigners();
    const Wallet = await hre.ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy([approver1.address, approver2.address, approver3.address], 2);

    await wallet.deployed();

    console.log("multisig wallet deployed to: ", wallet.address);

    
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });