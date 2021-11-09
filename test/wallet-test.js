const {expect} = require("chai");
const { paths } = require("../hardhat.config");

describe("Wallet", function (){

    beforeEach(async function(){
        const [approver1, approver2, approver3] = await hre.ethers.getSigners();
        this.Wallet = await hre.ethers.getContractFactory("Wallet");
        this.wallet = await this.Wallet.deploy([approver1.address, approver2.address, approver3.address], 2);
        await this.wallet.deployed();
        await approver1.sendTransaction({
            to: this.wallet.address,
            value: ethers.utils.parseEther("200.0")
        });
    });

    it("Should have correct amount of approvers", async function(){
        const totalApprovers = await this.wallet.getApprovers();
        expect(totalApprovers.length).to.equal(3);
    });

    it("Should create Transfer", async function(){
        const signers = await hre.ethers.getSigners();
        const amount = 200;
        await this.wallet.createTransfer(amount, signers[1].address);
        const transfersMade = await this.wallet.getTransfers();
        expect(transfersMade.length).to.equal(1);
        expect(transfersMade[0].id).to.equal(0);
        expect(transfersMade[0].amount).to.equal(200);
        expect(transfersMade[0].to).to.equal(signers[1].address);
        expect(transfersMade[0].approvals).to.equal(0);
        expect(transfersMade[0].sent).to.equal(false);
    });

    it("Should not create transfe if sender is not in approvals list", async function(){
        const signers = await hre.ethers.getSigners();
        const amount = 200;
        await expect(this.wallet.connect(signers[3]).createTransfer(amount, signers[1].address)).to.be.revertedWith("only approvers are allowed to access");
    });

    it("Should increment approvals after approving transfer", async function(){
        const signers = await hre.ethers.getSigners();
        const amount = 200;
        await this.wallet.createTransfer(amount, signers[1].address);
        await this.wallet.connect(signers[1]).approveTransfer(0);
        const transfers = await this.wallet.getTransfers();
        expect(transfers[0].approvals).to.be.equal(1);
        expect(transfers[0].sent).to.be.equal(false);
    });

    it("Should send transfer if quorum reached", async function(){
        const signers = await hre.ethers.getSigners();
        const amount = 200;
        await this.wallet.connect(signers[0]).createTransfer(amount, signers[3].address);
        await this.wallet.connect(signers[0]).approveTransfer(0);
        await this.wallet.connect(signers[1]).approveTransfer(0);
        const transfers = await this.wallet.getTransfers();
        expect(transfers[0].approvals).to.be.equal(2);
    });

    it("Should Not approve transfer twice", async function(){
        const signers = await hre.ethers.getSigners();
        const amount = 200;
        await this.wallet.connect(signers[0]).createTransfer(amount, signers[3].address);
        await this.wallet.connect(signers[0]).approveTransfer(0);
        await expect(this.wallet.connect(signers[0]).approveTransfer(0)).to.be.revertedWith("cannot approve transfer twice");
    });

});