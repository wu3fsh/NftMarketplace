import { ethers, network } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { expect } from "chai";

describe("NftMarketplace", function () {
  const name: string = "Test Coin";
  const symbol: string = "Test Coin";
  const decimals: number = 2;
  const totalSupply: number = 100;
  const tokenUri1155: string = "ipfs://Qma7yuwFr232axeUyoKEXmTaCetZ4TJ9w8PUyXj8kzEj4B/";
  const auctionDuration: number = 1;
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  let owner: Signer;
  let addresses: Signer[];
  let erc20tokensFactory, erc721tokensFactory, erc1155tokensFactory, nftMarketplaceFactory: ContractFactory;
  let nftMarketplace: Contract;
  let erc20token: Contract;
  let erc721token: Contract;
  let erc1155token: Contract;

  beforeEach(async function () {
    [owner, ...addresses] = await ethers.getSigners();
    erc20tokensFactory = await ethers.getContractFactory('ERC20Token');
    erc20token = await erc20tokensFactory.connect(addresses[1]).deploy(name, symbol, decimals, totalSupply);

    erc721tokensFactory = await ethers.getContractFactory('ERC721Token');
    erc721token = await erc721tokensFactory.connect(addresses[1]).deploy();

    erc1155tokensFactory = await ethers.getContractFactory('ERC1155Token');
    erc1155token = await erc1155tokensFactory.connect(addresses[1]).deploy(tokenUri1155);

    nftMarketplaceFactory = await ethers.getContractFactory('NftMarketplace');
    nftMarketplace = await nftMarketplaceFactory.deploy(erc20token.address, erc721token.address, erc1155token.address, auctionDuration);
  });

  it("should get expected info", async function () {
    expect(await nftMarketplace.getErc20Address()).to.equal(erc20token.address);
    expect(await nftMarketplace.getErc721Address()).to.equal(erc721token.address);
    expect(await nftMarketplace.getErc1155Address()).to.equal(erc1155token.address);
  });

  it("should create a new item", async function () {
    const uri: string = "123";
    const tokenId: number = 1;
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(0);
    await nftMarketplace.createItem(uri, owner.getAddress(), tokenId);
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(1);
    expect(await erc721token.tokenURI(tokenId)).to.equal(uri + tokenId + ".json");
  });

  it("1155: should create a new item", async function () {
    const uri: string = "123";
    const tokenId: number = 1;
    const amount: number = 2;
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(0);
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(amount);
    expect(await erc1155token.getBaseTokenUri()).to.equal(uri);
  });

  it("should list a item", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(0);
    await nftMarketplace.createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.listItem(tokenId, price);
    const listing = await nftMarketplace.getListings(tokenId);
    expect(listing.price).to.equal(price);
  });

  it("Should throw an exception if the item has been already listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(0);
    await nftMarketplace.createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.listItem(tokenId, price);

    try {
      expect(await nftMarketplace.listItem(tokenId, price)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is listed");
    }
  });

  it("1155: should list a item", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(0);
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItem1155(tokenId, price, amount);
    const listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.price).to.equal(price);
  });

  it("1155: should throw an exception if the item has been already listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(0);
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItem1155(tokenId, price, amount);

    try {
      expect(await nftMarketplace.listItem1155(tokenId, price, amount)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is listed");
    }
  });

  it("should buy an item", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItem(tokenId, price);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc721token.balanceOf(addresses[1].getAddress())).to.equal(0);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(1);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, price);
    await nftMarketplace.connect(addresses[1]).buyItem(tokenId);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals) - price);
    expect(await erc721token.balanceOf(addresses[1].getAddress())).to.equal(1);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(0);
  });

  it("should throw an exception if not enough money to buy the item", async function () {
    const tokenId: number = 1;
    const price: number = totalSupply * (10 ** decimals) + 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItem(tokenId, price);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc721token.balanceOf(addresses[1].getAddress())).to.equal(0);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(1);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, price);

    try {
      expect(await nftMarketplace.connect(addresses[1]).buyItem(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("Not enough money to buy the item");
    }
  });

  it("should throw an exception if the item is not listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, price);

    try {
      expect(await nftMarketplace.connect(addresses[1]).buyItem(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("1155: should buy an item", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.connect(owner).createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.connect(owner).listItem1155(tokenId, price, amount);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc1155token.balanceOf(addresses[1].getAddress(), tokenId)).to.equal(0);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(amount);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, price);
    await nftMarketplace.connect(addresses[1]).buyItem1155(tokenId);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals) - price);
    expect(await erc1155token.balanceOf(addresses[1].getAddress(), tokenId)).to.equal(amount);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(0);
  });

  it("1155: should throw an exception if not enough money to buy the item", async function () {
    const tokenId: number = 1;
    const price: number = totalSupply * (10 ** decimals) + 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.connect(owner).createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.connect(owner).listItem1155(tokenId, price, amount);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc1155token.balanceOf(addresses[1].getAddress(), tokenId)).to.equal(0);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(amount);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, price);

    try {
      expect(await nftMarketplace.connect(addresses[1]).buyItem1155(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("Not enough money to buy the item");
    }
  });

  it("1155: should throw an exception if the item is not listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.connect(owner).createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, price);

    try {
      expect(await nftMarketplace.connect(addresses[1]).buyItem1155(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("should cancel a listed item", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItem(tokenId, price);

    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(1);
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(0);

    await nftMarketplace.connect(owner).cancel(tokenId);

    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(0);
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(1);
    const listing = await nftMarketplace.getListings(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
  });

  it("should throw an exception on cancel if the item is not listed", async function () {
    const tokenId: number = 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);

    try {
      expect(await nftMarketplace.connect(owner).cancel(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("1155: should cancel a listed item", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.connect(owner).createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.connect(owner).listItem1155(tokenId, price, amount);

    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(amount);
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(0);

    await nftMarketplace.connect(owner).cancel1155(tokenId);

    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(0);
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(amount);
    const listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
  });

  it("1155: should throw an exception on cancel if the item is not listed", async function () {
    const tokenId: number = 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.connect(owner).createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);

    try {
      expect(await nftMarketplace.connect(owner).cancel1155(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("should list a item for auction", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(0);
    await nftMarketplace.createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.listItemOnAuction(tokenId, price);
    const listing = await nftMarketplace.getListings(tokenId);
    expect(listing.price).to.equal(price);
    expect(listing.startTimeSec).to.not.equal(0);
  });

  it("Should throw an exception on listing for auction if the item has been already listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    expect(await erc721token.balanceOf(owner.getAddress())).to.equal(0);
    await nftMarketplace.createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.listItemOnAuction(tokenId, price);

    try {
      expect(await nftMarketplace.listItemOnAuction(tokenId, price)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is listed");
    }
  });

  it("1155: should list a item for auction", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(0);
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);
    const listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.price).to.equal(price);
    expect(listing.startTimeSec).to.not.equal(0);
  });

  it("1155: should throw an exception on listing for auction if the item has been already listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    expect(await erc1155token.balanceOf(owner.getAddress(), tokenId)).to.equal(0);
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    try {
      expect(await nftMarketplace.listItemOnAuction1155(tokenId, price, amount)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is listed");
    }
  });

  it("should make a bid", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid(tokenId, bidPrice);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals) - bidPrice);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(bidPrice);
    const listing = await nftMarketplace.getListings(tokenId);
    expect(listing.price).to.equal(bidPrice);
    expect(listing.winner).to.equal(await addresses[1].getAddress());
  });

  it("should throw an exception on bidding if a bid equal or less than previous one", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price - 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);

    try {
      expect(await nftMarketplace.connect(addresses[1]).makeBid(tokenId, bidPrice)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("A bid should be greater than previous one");
    }
  });

  it("should make a bid and return money to a previous bidder", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const newBidPrice: number = bidPrice + 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid(tokenId, bidPrice);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals) - bidPrice);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(bidPrice);
    let listing = await nftMarketplace.getListings(tokenId);
    expect(listing.price).to.equal(bidPrice);
    expect(listing.winner).to.equal(await addresses[1].getAddress());

    await erc20token.connect(addresses[1]).mint(owner.getAddress(), newBidPrice);
    await erc20token.connect(owner).approve(nftMarketplace.address, newBidPrice);

    await nftMarketplace.connect(owner).makeBid(tokenId, newBidPrice);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(newBidPrice);
    expect(await erc20token.balanceOf(owner.getAddress())).to.equal(0);
    listing = await nftMarketplace.getListings(tokenId);
    expect(listing.price).to.equal(newBidPrice);
    expect(listing.winner).to.equal(await owner.getAddress());
  });

  it("should throw an exception on bidding if the item is not listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);

    try {
      expect(await nftMarketplace.connect(addresses[1]).makeBid(tokenId, bidPrice)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("1155: should make a bid", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid1155(tokenId, bidPrice);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals) - bidPrice);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(bidPrice);
    const listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.price).to.equal(bidPrice);
    expect(listing.winner).to.equal(await addresses[1].getAddress());
  });

  it("1155: should throw an exception on bidding if a bid equal or less than previous one", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price - 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);

    try {
      expect(await nftMarketplace.connect(addresses[1]).makeBid1155(tokenId, bidPrice)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("A bid should be greater than previous one");
    }
  });

  it("1155: should make a bid and return money to a previous bidder", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const newBidPrice: number = bidPrice + 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid1155(tokenId, bidPrice);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals) - bidPrice);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(bidPrice);
    let listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.price).to.equal(bidPrice);
    expect(listing.winner).to.equal(await addresses[1].getAddress());

    await erc20token.connect(addresses[1]).mint(owner.getAddress(), newBidPrice);
    await erc20token.connect(owner).approve(nftMarketplace.address, newBidPrice);

    await nftMarketplace.connect(owner).makeBid1155(tokenId, newBidPrice);
    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(newBidPrice);
    expect(await erc20token.balanceOf(owner.getAddress())).to.equal(0);
    listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.price).to.equal(newBidPrice);
    expect(listing.winner).to.equal(await owner.getAddress());
  });

  it("1155: should throw an exception on bidding if the item is not listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);

    expect(await erc20token.balanceOf(addresses[1].getAddress())).to.equal(totalSupply * (10 ** decimals));
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);

    try {
      expect(await nftMarketplace.connect(addresses[1]).makeBid1155(tokenId, bidPrice)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("should finish an auction", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const newBidPrice: number = bidPrice + 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    await erc20token.connect(addresses[1]).mint(owner.getAddress(), bidPrice);
    await erc20token.connect(owner).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(owner).makeBid(tokenId, bidPrice);

    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, newBidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid(tokenId, newBidPrice);

    let listing = await nftMarketplace.getListings(tokenId);
    const sellerBalance: number = await erc20token.balanceOf(listing.seller);
    expect(await erc721token.balanceOf(listing.winner)).to.equal(0);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(1);
    await nftMarketplace.connect(addresses[1]).finishAuction(tokenId);
    expect(await erc721token.balanceOf(listing.winner)).to.equal(1);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(0);
    expect(await erc20token.balanceOf(listing.seller)).to.equal(+listing.price + (+sellerBalance));

    listing = await nftMarketplace.getListings(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
    expect(listing.bidsCount).to.equal(0);
  });

  it("should cancel an auction and return money to a winner", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid(tokenId, bidPrice);

    let listing = await nftMarketplace.getListings(tokenId);
    const winnerBalance: number = await erc20token.balanceOf(listing.winner);
    expect(await erc721token.balanceOf(listing.seller)).to.equal(0);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(1);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(+listing.price);
    await nftMarketplace.connect(addresses[1]).finishAuction(tokenId);
    expect(await erc721token.balanceOf(listing.seller)).to.equal(1);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(0);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    expect(await erc20token.balanceOf(listing.winner)).to.equal(+listing.price + (+winnerBalance));

    listing = await nftMarketplace.getListings(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
    expect(listing.bidsCount).to.equal(0);
  });

  it("should cancel an auction and return a nft", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    await network.provider.send("evm_increaseTime", [10]);

    let listing = await nftMarketplace.getListings(tokenId);
    expect(await erc721token.balanceOf(listing.seller)).to.equal(0);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(1);
    await nftMarketplace.connect(addresses[1]).finishAuction(tokenId);
    expect(await erc721token.balanceOf(listing.seller)).to.equal(1);
    expect(await erc721token.balanceOf(nftMarketplace.address)).to.equal(0);

    listing = await nftMarketplace.getListings(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
    expect(listing.bidsCount).to.equal(0);
  });

  it("should throw an exception on finishing if the auction hasn't expired yet", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);
    await nftMarketplace.connect(owner).listItemOnAuction(tokenId, price);

    try {
      expect(await await nftMarketplace.connect(addresses[1]).finishAuction(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The auction hasn't expired yet");
    }
  });

  it("should throw an exception on finishing if the item is not listed", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    await nftMarketplace.connect(owner).createItem(uri, owner.getAddress(), tokenId);
    await erc721token.connect(owner).approve(nftMarketplace.address, tokenId);

    try {
      expect(await await nftMarketplace.connect(addresses[1]).finishAuction(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });

  it("1155: should finish an auction", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const newBidPrice: number = bidPrice + 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    await erc20token.connect(addresses[1]).mint(owner.getAddress(), bidPrice);
    await erc20token.connect(owner).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(owner).makeBid1155(tokenId, bidPrice);

    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, newBidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid1155(tokenId, newBidPrice);

    let listing = await nftMarketplace.getListings1155(tokenId);
    const sellerBalance: number = await erc20token.balanceOf(listing.seller);
    expect(await erc1155token.balanceOf(listing.winner, tokenId)).to.equal(0);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(amount);
    await nftMarketplace.connect(addresses[1]).finishAuction1155(tokenId);
    expect(await erc1155token.balanceOf(listing.winner, tokenId)).to.equal(amount);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(0);
    expect(await erc20token.balanceOf(listing.seller)).to.equal(+listing.price + (+sellerBalance));

    listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
    expect(listing.bidsCount).to.equal(0);
  });

  it("1155: should cancel an auction and return money to a winner", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const bidPrice: number = price + 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    await erc20token.connect(addresses[1]).approve(nftMarketplace.address, bidPrice);
    await nftMarketplace.connect(addresses[1]).makeBid1155(tokenId, bidPrice);

    let listing = await nftMarketplace.getListings1155(tokenId);
    const winnerBalance: number = await erc20token.balanceOf(listing.winner);
    expect(await erc1155token.balanceOf(listing.seller, tokenId)).to.equal(0);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(amount);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(+listing.price);
    await nftMarketplace.connect(addresses[1]).finishAuction1155(tokenId);
    expect(await erc1155token.balanceOf(listing.seller, tokenId)).to.equal(amount);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(0);
    expect(await erc20token.balanceOf(nftMarketplace.address)).to.equal(0);
    expect(await erc20token.balanceOf(listing.winner)).to.equal(+listing.price + (+winnerBalance));

    listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
    expect(listing.bidsCount).to.equal(0);
  });

  it("1155: should cancel an auction and return a nft", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    await network.provider.send("evm_increaseTime", [10]);

    let listing = await nftMarketplace.getListings1155(tokenId);
    expect(await erc1155token.balanceOf(listing.seller, tokenId)).to.equal(0);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(amount);
    await nftMarketplace.connect(addresses[1]).finishAuction1155(tokenId);
    expect(await erc1155token.balanceOf(listing.seller, tokenId)).to.equal(amount);
    expect(await erc1155token.balanceOf(nftMarketplace.address, tokenId)).to.equal(0);

    listing = await nftMarketplace.getListings1155(tokenId);
    expect(listing.seller).to.equal(emptyAddress);
    expect(listing.bidsCount).to.equal(0);
  });

  it("1155: should throw an exception on finishing if the auction hasn't expired yet", async function () {
    const tokenId: number = 1;
    const price: number = 100;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);
    await nftMarketplace.listItemOnAuction1155(tokenId, price, amount);

    try {
      expect(await await nftMarketplace.connect(addresses[1]).finishAuction1155(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The auction hasn't expired yet");
    }
  });

  it("1155: should throw an exception on finishing if the item is not listed", async function () {
    const tokenId: number = 1;
    const uri: string = "123";
    const amount: number = 10;
    await nftMarketplace.createItem1155(uri, owner.getAddress(), tokenId, amount);
    await erc1155token.connect(owner).setApprovalForAll(nftMarketplace.address, true);

    try {
      expect(await await nftMarketplace.connect(addresses[1]).finishAuction1155(tokenId)).to.throw();
    } catch (error: unknown) {
      expect(error instanceof Error ? error.message : "").to.have.string("The item is not listed");
    }
  });
});