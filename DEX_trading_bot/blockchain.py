import requests, pandas as pd
from datetime import datetime
# import token_info, FACTORY_ADDRESS, FACTORY_ABI, SWAP_ROUNTER_ADDRESS, SWAP_ROUNTER_ABI, RPC
from config import eth_chain, bsc_chain
from web3 import Web3

def get_ABI(address, chain_scan="eth"):
    url = ''
    if chain_scan == "eth":
        url = f"https://api.etherscan.io/api?module=contract&action=getabi&address={address}&apikey={eth_chain.SCAN_KEY}"
    elif chain_scan == "bsc":
        url = f"https://api.bscscan.com/api?module=contract&action=getabi&address={address}&apikey={bsc_chain.SCAN_KEY}"
    res = requests.get(url).json()['result']
    return res

def to_wei(token_ct, amount:float) -> int:
    decimals = 0
    try:
        decimals = token_ct.functions.decimals().call()
    except:
        decimals = 18
    amount = int(amount * 10**decimals)
    return amount

def from_wei(token_ct, amount:int):
    decimals = 0
    try:
        decimals = token_ct.functions.decimals().call()
    except:
        decimals = 18
    amount = amount / 10**decimals
    return amount

chain_info = {
    "eth": {
        "factory": eth_chain.FACTORY_ADDRESS,
        "router": eth_chain.SWAP_ROUNTER_ADDRESS,
        "token_info": eth_chain.token_info,
        "rpc": eth_chain.RPC,
        'native_token':'WETH'
    },
    "bsc": {
        "factory": bsc_chain.FACTORY_ADDRESS,
        "router": bsc_chain.SWAP_ROUNTER_ADDRESS,
        "token_info": bsc_chain.token_info,
        "rpc": bsc_chain.RPC,
        'native_token':'WBNB'
    },
}
eth_gateway = Web3(Web3.HTTPProvider(eth_chain.RPC))
if not eth_gateway.is_connected():
    print("Failed to connect eth")
bsc_gateway = Web3(Web3.HTTPProvider(bsc_chain.RPC))
if not eth_gateway.is_connected():
    print("Failed to connect bsc")

eth_factory = eth_gateway.eth.contract(eth_chain.FACTORY_ADDRESS,abi=eth_chain.FACTORY_ABI)
eth_router = eth_gateway.eth.contract(eth_chain.SWAP_ROUNTER_ADDRESS,abi=eth_chain.SWAP_ROUNTER_ABI)

bsc_factory = bsc_gateway.eth.contract(bsc_chain.FACTORY_ADDRESS,abi=bsc_chain.FACTORY_ABI)
bsc_router = bsc_gateway.eth.contract(bsc_chain.SWAP_ROUNTER_ADDRESS,abi=bsc_chain.SWAP_ROUNTER_ABI)


def estimate_pices(token_list=[], chain='eth',base_token='USDT'):
    token_info=chain_info[chain]['token_info']
    native_token=chain_info[chain]['native_token']
    web3_gateway = Web3(Web3.HTTPProvider(chain_info[chain]['rpc']))
    if not web3_gateway.is_connected():
        print(f"Failed to connect {chain}")
        return None
    factory_contract=web3_gateway.eth.contract(
        chain_info[chain]['factory'],
        abi=get_ABI(chain_info[chain]['factory'], chain)
    )
    router_contract=web3_gateway.eth.contract(
        chain_info[chain]['router'],
        abi=get_ABI(chain_info[chain]['router'], chain)
    )
    
    symbols = []
    times = []
    prices = []

    base_add = token_info[base_token][0]
    native_add = token_info[native_token][0]

    base_ct = web3_gateway.eth.contract(base_add, abi=get_ABI(base_add, chain))
    native_ct = web3_gateway.eth.contract(native_add, abi=get_ABI(native_add, chain))

    ts = int(datetime.now().timestamp())
    amount_native=None
    print(f"Estimate price {native_token} on {chain}...")
    try:
        amount_native = router_contract.functions.getAmountsOut(
            to_wei(base_ct, 1), 
            [base_add, native_add]
        ).call()[-1]
    except Exception as e:
        return None

    symbols.append(native_token+base_token)
    times.append(ts)
    prices.append(1/from_wei(native_ct, amount_native))
    tl = list((set(token_list)&set(token_info.keys())) - set([base_token, native_token]))
    for token in tl:
        print(f"Estimate price {token} on {chain}...")
        token_add = token_info[token][0]
        token_abi = get_ABI(token_add, chain)
        token_ct = web3_gateway.eth.contract(token_add, abi=token_abi)
        ts=int(datetime.now().timestamp())
        try:
            amount_token = router_contract.functions.getAmountsIn(
                amount_native, 
                [token_add,native_add]
            ).call()[0]
        except Exception as e:
            try:
                amount_token = router_contract.functions.getAmountsOut(
                    amount_native, 
                    [native_add,token_add]
                    ).call()[-1]
            except Exception as e:
                print(e)
                continue
        symbols.append(token+base_token)
        times.append(ts)
        prices.append(1/from_wei(token_ct, amount_token))
    d = {
        "symbol": symbols,
        "open_time": times,
        "open": prices, 
        "high": prices,
        "low": prices, 
        "close": prices,
        }
    return d

def estimate_pices_mchain(tokens=[], base_token='USDT', chains=['eth', 'bsc']):
    data = pd.DataFrame(columns=["symbol","open_time", "open", "high", "low", "close", "volume", "quote_asset", "num_trades", "buy_base", "buy_quote"])
    for chain  in chains:
        df = pd.DataFrame(estimate_pices(token_list=tokens, chain=chain, base_token=base_token))
        data = pd.concat([data,df],ignore_index=True)
    return data.fillna(0)



