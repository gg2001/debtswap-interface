import { ethers } from "ethers";
import addresses from "../constants/addresses";
import {
  ChainId,
  Token,
  Fetcher,
  Trade,
  Route,
  TokenAmount,
  TradeType,
  Percent,
  Pair,
  JSBI,
} from "@uniswap/sdk";

const slippageTolerance: Percent = new Percent("1", "100");

async function getUniswapPrice(
  token0: number,
  token1: number,
  network: number,
  amount: string,
  provider: ethers.providers.Web3Provider
): Promise<JSBI> {
  const token0Token = new Token(
    ChainId.MAINNET,
    addresses[network].tokens[token0].address,
    addresses[network].tokens[token0].decimals
  );
  const wethToken = new Token(ChainId.MAINNET, addresses[network].weth, 18);
  const token1Token = new Token(
    ChainId.MAINNET,
    addresses[network].tokens[token1].address,
    addresses[network].tokens[token1].decimals
  );
  let path: [Token, Token][] = [
    [token0Token, wethToken],
    [wethToken, token1Token],
  ];
  if (token0Token.address === wethToken.address) {
    path = [[token0Token, token1Token]];
  } else if (token1Token.address === wethToken.address) {
    path = [[token0Token, token1Token]];
  }
  const routePath: Pair[] = await Promise.all(
    path.map((pair: [Token, Token]) =>
      Fetcher.fetchPairData(pair[0], pair[1], provider)
    )
  );
  const route = new Route(routePath, token0Token);
  const trade: Trade = new Trade(
    route,
    new TokenAmount(
      token1Token,
      amount
    ),
    TradeType.EXACT_OUTPUT
  );
  const amountInMax: JSBI = trade.maximumAmountIn(slippageTolerance).raw;
  const pathInput: string[] = trade.route.path.map(
    (token: Token) => token.address
  );
  return amountInMax;
}

export default getUniswapPrice;