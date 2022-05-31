//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../interfaces/IERC1155Token.sol";

contract ERC1155Token is ERC1155, IERC1155Token {
    string _tokenBaseUri =
        "ipfs://QmPLRr5WWHmv6B5gaapAqL9onc1sKSkAny7dE6ng2pHWGA/{id}.json";
    uint8 constant _maxTokensAmount = 10;

    constructor(string memory tokenUri)
        ERC1155(bytes(tokenUri).length != 0 ? tokenUri : _tokenBaseUri)
    {
        if (bytes(tokenUri).length != 0) {
            _tokenBaseUri = tokenUri;
        }
    }

    function setBaseTokenUri(string memory tokenBaseUri) external override {
        _tokenBaseUri = tokenBaseUri;
    }

    function mint(
        address to,
        uint8 tokenId,
        uint256 amount
    ) external override {
        require(
            tokenId > 0 && tokenId <= _maxTokensAmount,
            "TokenId should be in the range from 1 to 10"
        );
        _mint(to, tokenId, amount, "");
    }

    function getBaseTokenUri() external view override returns (string memory) {
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
}
