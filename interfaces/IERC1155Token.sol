//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC1155Token {
    function mint(
        address to,
        uint8 tokenId,
        uint256 amount
    ) external;

    function getBaseTokenUri() external view returns (string memory);

    function setBaseTokenUri(string memory tokenBaseUri) external;

    function getMaxAllowedTokensAmount() external pure returns (uint8);
}
