//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721Token {
    function mint(address to, uint8 tokenId) external;

    function setBaseTokenUri(string memory tokenBaseUri) external;

    function getBaseTokenUri() external view returns (string memory);

    function getMaxAllowedTokensAmount() external pure returns (uint8);
}
