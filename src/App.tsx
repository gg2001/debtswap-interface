import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import { ethers } from "ethers";
import {
  Box,
  Button,
  Heading,
  Center,
  Select,
  Input,
  Flex,
  Badge,
  Switch,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import useWeb3Modal from "./hooks/useWeb3Modal";
import WalletButton from "./components/WalletButton";
import AaveTable from "./components/AaveTable";
import addresses, {
  tokenList,
  checkUnavailableBorrow,
} from "./constants/addresses";
import { ERC20__factory, ERC20 } from "./contracts/types";
import getUniswapPrice from "./utils/getUniswapPrice";

function formatAmount(
  price: string | number = 0,
  decimalPoints: number = 2
): string {
  const typecastedPrice = Number(price);
  return Number(typecastedPrice.toFixed(decimalPoints)).toLocaleString();
}

function App() {
  const [account, setAccount] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<string>();
  const [currentNetwork, setCurrentNetwork] = useState<number>(1);
  const [tokenSelect, setTokenSelect] = useState<string[]>(["DAI", "USDC"]);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  const [token0, setToken0] = useState<number>(0);
  const [token0Input, setToken0Input] = useState<string>("0");
  const [token0IsVariable, setToken0IsVariable] = useState<boolean>(false);
  const [token0IsMax, setToken0IsMax] = useState<boolean>(false);
  const [token0IsValid, setToken0IsValid] = useState<boolean>(true);
  const [token0IsApprove, setToken0IsApproved] = useState<boolean>(true);
  const [token0Balance, setToken0Balance] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(0)
  );

  const [token1, setToken1] = useState<number>(1);
  const [token1Input, setToken1Input] = useState<string>("0");
  const [token1IsVariable, setToken1IsVariable] = useState<boolean>(false);
  const [token1Balance, setToken1Balance] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(0)
  );

  useEffect(() => {
    if (provider) {
      const fetchData = async () => {
        const network: ethers.providers.Network = await provider.getNetwork();
        setCurrentNetwork(network.chainId === 1337 ? 1 : network.chainId);
        setTokenSelect(
          tokenList[network.chainId === 1337 ? 1 : network.chainId]
        );
        const account: string = await provider.getSigner().getAddress();
        const token0ERC20: ERC20 = ERC20__factory.connect(
          addresses[network.chainId === 1337 ? 1 : network.chainId].tokens[
            token0
          ][
            token0IsVariable
              ? "variableDebtTokenAddress"
              : "stableDebtTokenAddress"
          ],
          provider.getSigner()
        );
        const token1ERC20: ERC20 = ERC20__factory.connect(
          addresses[network.chainId === 1337 ? 1 : network.chainId].tokens[
            token1
          ][
            token1IsVariable
              ? "variableDebtTokenAddress"
              : "stableDebtTokenAddress"
          ],
          provider.getSigner()
        );
        const [token0ERC20Balance, token1ERC20Balance] = await Promise.all([
          token0ERC20.balanceOf(account),
          token1ERC20.balanceOf(account),
        ]);
        setToken0Balance(token0ERC20Balance);
        setToken1Balance(token1ERC20Balance);
      };
      fetchData();
    }
  }, [provider]);

  useEffect(() => {
    if (provider) {
      const fetchData = async () => {
        const account: string = await provider.getSigner().getAddress();
        const token0ERC20Balance = await ERC20__factory.connect(
          addresses[currentNetwork].tokens[token0][
            token0IsVariable
              ? "variableDebtTokenAddress"
              : "stableDebtTokenAddress"
          ],
          provider.getSigner()
        ).balanceOf(account);
        if (token0ERC20Balance.toString() !== token0Input) {
          setToken0IsMax(false);
        }
        setToken0Balance(token0ERC20Balance);
      };
      fetchData();
    }
  }, [token0, token0IsVariable]);

  useEffect(() => {
    if (provider) {
      const fetchData = async () => {
        const account: string = await provider.getSigner().getAddress();
        const token1ERC20Balance = await ERC20__factory.connect(
          addresses[currentNetwork].tokens[token1][
            token1IsVariable
              ? "variableDebtTokenAddress"
              : "stableDebtTokenAddress"
          ],
          provider.getSigner()
        ).balanceOf(account);
        setToken1Balance(token1ERC20Balance);
      };
      fetchData();
    }
  }, [token1, token1IsVariable]);

  useEffect(() => {
    if (provider) {
      if (token0IsMax) {
        const fetchData = async () => {
          const account: string = await provider.getSigner().getAddress();
          const token0ERC20Balance = await ERC20__factory.connect(
            addresses[currentNetwork].tokens[token0][
              token0IsVariable
                ? "variableDebtTokenAddress"
                : "stableDebtTokenAddress"
            ],
            provider.getSigner()
          ).balanceOf(account);
          setToken0Balance(token0ERC20Balance);
          setToken0Input(
            ethers.utils.formatUnits(
              token0ERC20Balance.toString(),
              addresses[currentNetwork].tokens[token0].decimals
            )
          );
        };
        fetchData();
      }
    }
  }, [token0IsMax]);

  useEffect(() => {
    if (provider) {
      const fetchData = async () => {
        const uniswapPrice = await getUniswapPrice(
          token1,
          token0,
          currentNetwork,
          ethers.utils
            .parseUnits(
              token0Input,
              addresses[currentNetwork].tokens[token0].decimals
            )
            .toString(),
          provider
        );
        setToken1Input(
          ethers.utils.formatUnits(
            uniswapPrice.toString(),
            addresses[currentNetwork].tokens[token1].decimals
          )
        );
      };
      if (
        !(
          token0Input === "" ||
          token0Input === "0" ||
          token0Input === "." ||
          token0Input === "0." ||
          token0Input === "0.0"
        )
      ) {
        if (
          ethers.utils
            .parseUnits(
              token0Input,
              addresses[currentNetwork].tokens[token0].decimals
            )
            .gt(token0Balance)
        ) {
          setToken0IsValid(false);
        } else {
          setToken0IsValid(true);
        }
        fetchData();
      } else {
        setToken0IsValid(true);
        setToken1Input("0");
      }
    }
  }, [
    token0Input,
    token0,
    token1,
    token0IsMax,
    token0IsVariable,
    token1IsVariable,
  ]);

  function handleToken0Change(newToken: number) {
    if (newToken !== token1) {
      setToken0(newToken);
      if (
        tokenList[currentNetwork][newToken] in
        checkUnavailableBorrow[currentNetwork]
      ) {
        if (
          !token0IsVariable &&
          !checkUnavailableBorrow[currentNetwork][
            tokenList[currentNetwork][newToken]
          ].stable
        ) {
          setToken0IsVariable(!token0IsVariable);
        }
      }
    }
  }

  function handleToken1Change(newToken: number) {
    if (newToken !== token0) {
      setToken1(newToken);
      if (
        tokenList[currentNetwork][newToken] in
        checkUnavailableBorrow[currentNetwork]
      ) {
        if (
          !token1IsVariable &&
          !checkUnavailableBorrow[currentNetwork][
            tokenList[currentNetwork][newToken]
          ].stable
        ) {
          setToken1IsVariable(!token1IsVariable);
        }
      }
    }
  }

  function handleToken0InputChange(newInput: string) {
    setToken0Input(newInput);
  }

  function handleToken0IsVariableChange() {
    if (
      tokenList[currentNetwork][token0] in
      checkUnavailableBorrow[currentNetwork]
    ) {
      if (
        !token0IsVariable &&
        !checkUnavailableBorrow[currentNetwork][
          tokenList[currentNetwork][token0]
        ].stable
      ) {
        setToken0IsVariable(!token0IsVariable);
      }
    } else {
      setToken0IsVariable(!token0IsVariable);
    }
  }

  function handleToken1IsVariableChange() {
    if (
      tokenList[currentNetwork][token1] in
      checkUnavailableBorrow[currentNetwork]
    ) {
      if (
        !token1IsVariable &&
        !checkUnavailableBorrow[currentNetwork][
          tokenList[currentNetwork][token1]
        ].stable
      ) {
        setToken1IsVariable(!token1IsVariable);
      }
    } else {
      setToken1IsVariable(!token1IsVariable);
    }
  }

  return (
    <div>
      <Box position="absolute" top="0" right="0" margin="5">
        <WalletButton
          provider={provider}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
        />
      </Box>
      <Box padding="10">
        <Center>
          <Heading>DebtSwap</Heading>
        </Center>
        <Center>
          <Heading as="h3" size="md" color="purple">
            Swap your Aave debt
          </Heading>
        </Center>
      </Box>
      {provider ? (
        <Box>
          <Center marginBottom="1">
            <Badge colorScheme="gray" marginRight="100">
              Current Debt:{" "}
              {formatAmount(
                ethers.utils.formatUnits(
                  token0Balance.toString(),
                  addresses[currentNetwork].tokens[token0].decimals
                )
              )}
            </Badge>
            <Badge colorScheme="gray" marginLeft="100">
              Current Debt:{" "}
              {formatAmount(
                ethers.utils.formatUnits(
                  token1Balance.toString(),
                  addresses[currentNetwork].tokens[token1].decimals
                )
              )}
            </Badge>
          </Center>
          <Center>
            <Flex maxW="700px">
              <Select
                value={token0}
                onChange={(event) =>
                  handleToken0Change(parseInt(event.target.value))
                }
              >
                {tokenSelect.map((token, index) => (
                  <option key={token} value={index}>
                    {token}
                  </option>
                ))}
              </Select>
              <InputGroup>
                <Input
                  type="number"
                  value={token0Input}
                  onChange={(event) =>
                    handleToken0InputChange(event.target.value)
                  }
                  isInvalid={!token0IsValid}
                  errorBorderColor="crimson"
                  focusBorderColor={token0IsValid ? "blue.500" : "crimson"}
                />
                <InputRightElement width="4rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setToken0IsMax(true)}
                  >
                    max
                  </Button>
                </InputRightElement>
              </InputGroup>
              <ArrowForwardIcon margin="1" marginBottom="5" marginTop="12px" />
              <Select
                value={token1}
                onChange={(event) =>
                  handleToken1Change(parseInt(event.target.value))
                }
              >
                {tokenSelect.map((token, index) => (
                  <option key={token} value={index}>
                    {token}
                  </option>
                ))}
              </Select>
              <Input
                color="gray"
                isReadOnly={true}
                type="number"
                value={token1Input}
              />
            </Flex>
          </Center>
          <Center>
            <Badge colorScheme="gray" marginRight="1">
              {token0IsVariable ? "Variable" : "Stable"}
            </Badge>
            <Switch
              marginRight="100"
              size="md"
              isChecked={token0IsVariable}
              onChange={() => handleToken0IsVariableChange()}
            />
            <Badge colorScheme="gray" marginLeft="100" marginRight="1">
              {token1IsVariable ? "Variable" : "Stable"}
            </Badge>
            <Switch
              size="md"
              isChecked={token1IsVariable}
              onChange={() => handleToken1IsVariableChange()}
            />
          </Center>
          <Center marginTop="2">
            <Button marginRight="1" onClick={() => console.log(token0IsMax)}>
              Approve
            </Button>
            <Button>Swap</Button>
          </Center>
          <Center marginTop="8">
            <Box maxW="500px">
              <AaveTable
                provider={provider}
                network={currentNetwork}
              ></AaveTable>
            </Box>
          </Center>
        </Box>
      ) : (
        <Center>
          <Heading as="h3" size="md" color="purple">
            Please connect a wallet
          </Heading>
        </Center>
      )}
    </div>
  );
}

export default App;
