//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "../interfaces/IERC721Token.sol";

contract ERC721Token is IERC721Token, ERC721URIStorage {
    uint8 constant _maxTokensAmount = 10;
    uint8 _counter;
    string _tokenBaseUri;

    constructor() ERC721("NftToken", "nft") {
        _counter = 0;
        _tokenBaseUri = "ipfs://QmPLRr5WWHmv6B5gaapAqL9onc1sKSkAny7dE6ng2pHWGA/";
    }

    function mint(address to, uint8 tokenId) external override {
        require(
            tokenId > 0 && tokenId <= _maxTokensAmount,
            "TokenId should be in the range from 1 to 10"
        );
        _safeMint(to, tokenId);
    }

    function setBaseTokenUri(string memory tokenBaseUri) external override {
        _tokenBaseUri = tokenBaseUri;
    }

    function getBaseTokenUri() public view override returns (string memory) {
        return _tokenBaseUri;
    }

    function getMaxAllowedTokensAmount()
        external
        pure
        override
        returns (uint8)
    {
        return _maxTokensAmount;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    getBaseTokenUri(),
                    Strings.toString(tokenId),
                    ".json"
                )
            );
    }
}
