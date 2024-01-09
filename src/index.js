import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { useState, useEffect, useRef } from 'react';
import realStateContractManifest from "./contracts/RealStateContract.json";
import realStateContractCitiesManifest from "./contracts/RealStateContractCities.json";
import { decodeError } from 'ethers-decode-error'

function App() {
  const realStateCities = useRef(null);
  const realState = useRef(null);
  const [realStateArray, setRealStateArray] = useState([]);
  const [newAuthorizedAddress, setNewAuthorizedAddress] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    initContracts();
  }, [])

  let initContracts = async () => {
    await getBlockchain();
    await loadHistory();
  }

  let getBlockchain = async () => {
    let provider = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: 'eth_requestAccounts' });
      const networkId = await provider.request({ method: 'net_version' })

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      realState.current = new Contract(
        realStateContractManifest.networks[networkId].address,
        realStateContractManifest.abi,
        signer
      );

      realStateCities.current = new Contract(
        realStateContractCitiesManifest.networks[networkId].address,
        realStateContractCitiesManifest.abi,
        signer
      );
    }
    return null;
  }

  const addAuthorizedAddress = async () => {
    try {
      await realState.current.addAuthorizedAddress(newAuthorizedAddress);
      // await realStateCities.current.addAuthorizedAddress(newAuthorizedAddress);
      setNewAuthorizedAddress("");
    } catch (error) {
      if (error.data) {
        alert(error.data.message);
      } else {
        console.error("Error adding authorized address:", error);
      }
    }
  };

  const loadHistory = async () => {
    try {
      const currentHistory = await realState.current.getHistory();
      // const currentHistory = await realStateCities.current.getHistory();
      setHistory(currentHistory);
    } catch (error) {
      if (error.data) {
        alert(error.data.message)
      } else {
        console.error(error);
      }
    }
  };

  let onSubmitAddRealState = async (e) => {
    e.preventDefault();

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { timestamp } = await provider.getBlock(await provider.getBlockNumber());
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    // this function use gas
    try {
      const tx = await realState.current.addRealState({
        registration: parseInt(e.target.elements[0].value),
        city: e.target.elements[1].value,
        street: e.target.elements[2].value,
        number: parseInt(e.target.elements[3].value),
        meters: parseInt(e.target.elements[4].value),
        price: parseInt(e.target.elements[5].value),
        owner: e.target.elements[6].value,
        timestamp: timestamp,
        requester: userAddress
      });

      /*
      const tx = await realStateCities.current.addRealState({
        registration: parseInt(e.target.elements[0].value),
        city: e.target.elements[1].value,
        street: e.target.elements[2].value,
        number: parseInt(e.target.elements[3].value),
        meters: parseInt(e.target.elements[4].value),
        price: parseInt(e.target.elements[5].value),
        owner: e.target.elements[6].value,
        timestamp: timestamp,
        requester: userAddress
      });
       */

      await tx.wait();
    } catch (error) {
      console.error(error);
    }

    await loadHistory();
  }

  let onSubmitSearchRealState = async (e) => {
    e.preventDefault();

    let city = e.target.elements[0].value;
    let newProperties = await realState.current.getRealStateByCity(city);
    //let newProperties = await realStateCities.current.getRealStateByCity(city);
    console.log(newProperties);
    setRealStateArray(newProperties)
  }

  let clickOnDeleteRealState = async (registration) => {
    const tx = await realState.current.deleteRealStateByRegistration(registration);

    await tx.wait();
    setRealStateArray([]);
    console.log(realStateArray);
  }

  /*
  let clickOnDeleteRealState = async (realState) => {
    const tx =  await realStateCities.current.deleteRealState(realState);
    
    await tx.wait();
    setRealStateArray([]);
    console.log(realStateArray);
  }
  */

  return (
    <div class="ml-2 mr-2">
      <h1>RealState</h1>
      <h2>Add RealState</h2>
      <form onSubmit={(e) => onSubmitAddRealState(e)} >        
        <input type="number" placeholder="registration" />
        <input type="text" placeholder="city" />
        <input type="text" placeholder="street" />
        <input type="number" placeholder="number" />
        <input type="number" placeholder="meters" />        
        <input type="number" placeholder="price" />
        <input type="text" placeholder="owner name" />
        <button type="submit">Add</button>
      </form>
      <br />
      <h2>Search RealState</h2>
      <form onSubmit={(e) => onSubmitSearchRealState(e)} >
        <input type="text" placeholder="city" />
        <button type="submit">Search</button>
      </form>
      {realStateArray.map((r) =>
      (<p>
        <button onClick={() => { clickOnDeleteRealState(r.registration) }}>Delete</button>
        {/* <button onClick={ () => { clickOnDeleteRealState(r) } }>Delete</button> */}        
        {`Registration: ${r.registration} City: ${r.city}, Street: ${r.street}, Number: ${r.number}, Meters: ${r.meters}, Price: ${r.price}, Owner: ${r.owner}`}
      </p>)
      )}
      <br />
      <h4>Authorized Addresses</h4>
      <div>
        <label htmlFor="newAuthorizedAddress">New authorized address:</label>
        <input
          id="newAuthorizedAddress"
          type="text"
          className="ml-2 w-50"
          placeholder="0x0000000000000000000000000000000000000000"
          value={newAuthorizedAddress}
          onChange={(e) => setNewAuthorizedAddress(e.target.value)}
        />
        <button class="btn btn-secondary ml-2" onClick={addAuthorizedAddress}>Add address</button>
      </div>
      <br />
      <h4>Modification History</h4>
      <ul>
        {history.map((rs, index) => (
          <li key={index}>
            {`Registration: ${rs.registration} City: ${rs.city}, Street: ${rs.street}, Number: ${rs.number}, Meters: ${rs.meters}, Price: ${rs.price}, Owner: ${rs.owner}, Timestamp: ${rs.timestamp}`}
          </li>
        ))}
      </ul>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
