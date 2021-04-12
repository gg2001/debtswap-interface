import { ethers } from "ethers";
import addresses, { checkUnavailableBorrow } from "../constants/addresses";
import { ERC20__factory, ERC20 } from "../contracts/types";

export interface Token {
  symbol: string;
  stable: ethers.BigNumber | undefined;
  variable: ethers.BigNumber | undefined;
}

async function getUserDebts(
  provider: ethers.providers.Web3Provider | undefined
): Promise<Token[]> {
  const tokenList: { symbol: string; type: string }[] = [];
  const callList: Promise<ethers.BigNumber>[] = [];
  let accountBalances: ethers.BigNumber[] = [];
  const symbolToAmounts: {
    [key: string]: { [key: string]: ethers.BigNumber | undefined };
  } = {};
  const tableItems: Token[] = [];
  if (provider === undefined) {
    return tableItems;
  }
  const account: string = await provider.getSigner().getAddress();
  const network: ethers.providers.Network = await provider.getNetwork();
  if (network.chainId === 1 || network.chainId === 137) {
    for (const tokenData of addresses[network.chainId].tokens) {
      if (tokenData.symbol in checkUnavailableBorrow[network.chainId]) {
        if (checkUnavailableBorrow[network.chainId][tokenData.symbol].stable) {
          tokenList.push({ symbol: tokenData.symbol, type: "Stable" });
          callList.push(
            ERC20__factory.connect(
              tokenData.stableDebtTokenAddress,
              provider.getSigner()
            ).balanceOf(account)
          );
        }
        if (
          checkUnavailableBorrow[network.chainId][tokenData.symbol].variable
        ) {
          tokenList.push({ symbol: tokenData.symbol, type: "Variable" });
          callList.push(
            ERC20__factory.connect(
              tokenData.variableDebtTokenAddress,
              provider.getSigner()
            ).balanceOf(account)
          );
        }
      } else {
        tokenList.push({ symbol: tokenData.symbol, type: "Stable" });
        callList.push(
          ERC20__factory.connect(
            tokenData.stableDebtTokenAddress,
            provider.getSigner()
          ).balanceOf(account)
        );
        tokenList.push({ symbol: tokenData.symbol, type: "Variable" });
        callList.push(
          ERC20__factory.connect(
            tokenData.variableDebtTokenAddress,
            provider.getSigner()
          ).balanceOf(account)
        );
      }
    }
    accountBalances = await Promise.all(callList);
  }
  for (let i = 0; i < tokenList.length; i++) {
    if (tokenList[i].type === "Stable") {
      if (tokenList[i].symbol in symbolToAmounts) {
        symbolToAmounts[tokenList[i].symbol].stable = accountBalances[i];
      } else {
        symbolToAmounts[tokenList[i].symbol] = { stable: accountBalances[i] };
      }
    } else if (tokenList[i].type === "Variable") {
      if (tokenList[i].symbol in symbolToAmounts) {
        symbolToAmounts[tokenList[i].symbol].variable = accountBalances[i];
      } else {
        symbolToAmounts[tokenList[i].symbol] = { variable: accountBalances[i] };
      }
    }
  }
  for (const token in symbolToAmounts) {
    tableItems.push({
      symbol: token,
      stable: symbolToAmounts[token].stable,
      variable: symbolToAmounts[token].variable,
    });
  }
  return tableItems;
}

export default getUserDebts;
