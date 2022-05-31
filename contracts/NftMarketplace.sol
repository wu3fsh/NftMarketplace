//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC20Token.sol";
import "../interfaces/IERC721Token.sol";
import "../interfaces/IERC1155Token.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

struct ListingInfo {
    uint256 price;
    address seller;
    address winner;
    uint256 bidsCount;
    uint256 startTimeSec;
}

struct ListingInfo1155 {
    uint256 price;
    address seller;
    uint256 amount;
    address winner;
    uint256 bidsCount;
    uint256 startTimeSec;
}

contract NftMarketplace is ERC1155Holder {
    address private _erc20tokenAddress;
    address private _erc721tokenAddress;
    address private _erc1155tokenAddress;
    mapping(uint8 => ListingInfo) private _listings;
    mapping(uint8 => ListingInfo1155) private _listings1155;
    address private _owner;
    uint256 private _auctionDurationSec;

    modifier isListed(uint8 tokenId) {
        ListingInfo memory info = _listings[tokenId];
        require(
            info.startTimeSec == 0 && info.price > 0,
            "The item is not listed"
        );
        _;
    }

    modifier isListedAcution(uint8 tokenId) {
        ListingInfo memory info = _listings[tokenId];
        require(
            info.startTimeSec != 0 && info.price > 0,
            "The item is not listed"
        );
        _;
    }

    modifier notListed(uint8 tokenId) {
        ListingInfo memory info = _listings[tokenId];
        require(info.price == 0, "The item is listed");
        _;
    }

    modifier isListed1155(uint8 tokenId) {
        ListingInfo1155 memory info = _listings1155[tokenId];
        require(
            info.startTimeSec == 0 && info.price > 0,
            "The item is not listed"
        );
        _;
    }

    modifier isListedAcution1155(uint8 tokenId) {
        ListingInfo1155 memory info = _listings1155[tokenId];
        require(
            info.startTimeSec != 0 && info.price > 0,
            "The item is not listed"
        );
        _;
    }

    modifier notListed1155(uint8 tokenId) {
        ListingInfo1155 memory info = _listings1155[tokenId];
        require(info.price == 0, "The item is listed");
        _;
    }

    constructor(
        address erc20tokenAddress,
        address erc721address,
        address erc1155tokenAddress,
        uint256 auctionDurationSec
    ) {
        _owner = msg.sender;
        _erc20tokenAddress = erc20tokenAddress;
        _erc721tokenAddress = erc721address;
        _erc1155tokenAddress = erc1155tokenAddress;
        _auctionDurationSec = auctionDurationSec;
    }

    function createItem(
        string memory tokenUri,
        address owner,
        uint8 tokenId
    ) external {
        IERC721Token(_erc721tokenAddress).setBaseTokenUri(tokenUri);
        IERC721Token(_erc721tokenAddress).mint(owner, tokenId);
    }

    function createItem1155(
        string memory tokenUri,
        address owner,
        uint8 tokenId,
        uint256 amount
    ) external {
        IERC1155Token(_erc1155tokenAddress).setBaseTokenUri(tokenUri);
        IERC1155Token(_erc1155tokenAddress).mint(owner, tokenId, amount);
    }

    function listItem(uint8 tokenId, uint256 price)
        external
        notListed(tokenId)
    {
        _listings[tokenId] = ListingInfo(price, msg.sender, address(0), 0, 0);
        IERC721(_erc721tokenAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );
    }

    function listItem1155(
        uint8 tokenId,
        uint256 price,
        uint256 amount
    ) external notListed1155(tokenId) {
        _listings1155[tokenId] = ListingInfo1155(
            price,
            msg.sender,
            amount,
            address(0),
            0,
            0
        );
        IERC1155(_erc1155tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );
    }

    function buyItem(uint8 tokenId) external isListed(tokenId) {
        ListingInfo memory info = _listings[tokenId];
        require(
            ERC20Token(_erc20tokenAddress).balanceOf(msg.sender) >= info.price,
            "Not enough money to buy the item"
        );

        IERC721(_erc721tokenAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        ERC20Token(_erc20tokenAddress).transferFrom(
            msg.sender,
            info.seller,
            info.price
        );

        delete (_listings[tokenId]);
    }

    function buyItem1155(uint8 tokenId) external isListed1155(tokenId) {
        ListingInfo1155 memory info = _listings1155[tokenId];
        require(
            ERC20Token(_erc20tokenAddress).balanceOf(msg.sender) >= info.price,
            "Not enough money to buy the item"
        );

        IERC1155(_erc1155tokenAddress).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            info.amount,
            ""
        );
        ERC20Token(_erc20tokenAddress).transferFrom(
            msg.sender,
            info.seller,
            info.price
        );

        delete (_listings1155[tokenId]);
    }

    function cancel(uint8 tokenId) external isListed(tokenId) {
        IERC721(_erc721tokenAddress).transferFrom(
            address(this),
            _listings[tokenId].seller,
            tokenId
        );

        delete (_listings[tokenId]);
    }

    function cancel1155(uint8 tokenId) external isListed1155(tokenId) {
        IERC1155(_erc1155tokenAddress).safeTransferFrom(
            address(this),
            _listings1155[tokenId].seller,
            tokenId,
            _listings1155[tokenId].amount,
            ""
        );

        delete (_listings1155[tokenId]);
    }

    function listItemOnAuction(uint8 tokenId, uint256 minPrice)
        external
        notListed(tokenId)
    {
        _listings[tokenId] = ListingInfo(
            minPrice,
            msg.sender,
            address(0),
            0,
            block.timestamp
        );
        IERC721(_erc721tokenAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );
    }

    function listItemOnAuction1155(
        uint8 tokenId,
        uint256 minPrice,
        uint256 amount
    ) external notListed1155(tokenId) {
        _listings1155[tokenId] = ListingInfo1155(
            minPrice,
            msg.sender,
            amount,
            address(0),
            0,
            block.timestamp
        );
        IERC1155(_erc1155tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            "data"
        );
    }

    function makeBid(uint8 tokenId, uint256 price)
        external
        isListedAcution(tokenId)
    {
        ListingInfo memory info = _listings[tokenId];
        require(
            price > info.price,
            "A bid should be greater than previous one"
        );

        if (info.bidsCount > 0) {
            ERC20Token(_erc20tokenAddress).transfer(info.winner, info.price);
        }

        ERC20Token(_erc20tokenAddress).transferFrom(
            msg.sender,
            address(this),
            price
        );
        _listings[tokenId] = ListingInfo(
            price,
            info.seller,
            msg.sender,
            ++info.bidsCount,
            info.startTimeSec
        );
    }

    function makeBid1155(uint8 tokenId, uint256 price)
        external
        isListedAcution1155(tokenId)
    {
        ListingInfo1155 memory info = _listings1155[tokenId];
        require(
            price > info.price,
            "A bid should be greater than previous one"
        );

        if (info.bidsCount > 0) {
            ERC20Token(_erc20tokenAddress).transfer(info.winner, info.price);
        }

        ERC20Token(_erc20tokenAddress).transferFrom(
            msg.sender,
            address(this),
            price
        );
        _listings1155[tokenId] = ListingInfo1155(
            price,
            info.seller,
            info.amount,
            msg.sender,
            ++info.bidsCount,
            info.startTimeSec
        );
    }

    function finishAuction(uint8 tokenId) external isListedAcution(tokenId) {
        ListingInfo memory info = _listings[tokenId];
        require(
            (info.startTimeSec + _auctionDurationSec) < block.timestamp,
            "The auction hasn't expired yet"
        );

        if (info.bidsCount > 1) {
            ERC20Token(_erc20tokenAddress).transfer(info.seller, info.price);
            IERC721(_erc721tokenAddress).transferFrom(
                address(this),
                info.winner,
                tokenId
            );
        } else {
            if (info.bidsCount == 1) {
                ERC20Token(_erc20tokenAddress).transfer(
                    info.winner,
                    info.price
                );
            }

            IERC721(_erc721tokenAddress).transferFrom(
                address(this),
                info.seller,
                tokenId
            );
        }

        delete (_listings[tokenId]);
    }

    function finishAuction1155(uint8 tokenId)
        external
        isListedAcution1155(tokenId)
    {
        ListingInfo1155 memory info = _listings1155[tokenId];
        require(
            (info.startTimeSec + _auctionDurationSec) < block.timestamp,
            "The auction hasn't expired yet"
        );

        if (info.bidsCount > 1) {
            ERC20Token(_erc20tokenAddress).transfer(info.seller, info.price);
            IERC1155(_erc1155tokenAddress).safeTransferFrom(
                address(this),
                info.winner,
                tokenId,
                info.amount,
                ""
            );
        } else {
            if (info.bidsCount == 1) {
                ERC20Token(_erc20tokenAddress).transfer(
                    info.winner,
                    info.price
                );
            }

            IERC1155(_erc1155tokenAddress).safeTransferFrom(
                address(this),
                info.seller,
                tokenId,
                info.amount,
                ""
            );
        }

        delete (_listings1155[tokenId]);
    }

    function getListings(uint8 tokenId)
        external
        view
        returns (ListingInfo memory)
    {
        return _listings[tokenId];
    }

    function getListings1155(uint8 tokenId)
        external
        view
        returns (ListingInfo1155 memory)
    {
        return _listings1155[tokenId];
    }

    function getErc20Address() external view returns (address) {
        return _erc20tokenAddress;
    }

    function getErc721Address() external view returns (address) {
        return _erc721tokenAddress;
    }

    function getErc1155Address() external view returns (address) {
        return _erc1155tokenAddress;
    }
}
