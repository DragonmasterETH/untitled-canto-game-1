import {React, useEffect, useState} from 'react';
import UnityPlayer from './UnityPlayer';
import { ethers, BrowserProvider } from "ethers";
import { getDownloadURL, ref, uploadBytesResumable, listAll } from "@firebase/storage";
import { storage } from './firebase';
import { Unity, useUnityContext} from "react-unity-webgl";
import levelAbi from "./contracts/ugclevel.json";
import erc20Abi from "./contracts/erc20.abi";

//CONTRACT STUFF
const contractAddress = "0x735828528Fc9B91a84e5EA66a87283a875dc4e56";
const cantoChainID = "0x1e15"; //Canto test net (Canto mainnet 0x1e14)

const testNOTEAddr = "0x03F734Bd9847575fDbE9bEaDDf9C166F880B5E5f";


const App = () => {
  const [account, setAccount] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [firstMint, setFirstMint] = useState(true);
  const [NFTJson, setNFTJson] = useState(null);
  const [levelJson, setLevelJson] = useState(null);
  const [levelIMG, setLevelIMG] = useState(null);
  const [levelUrl, setLevelUrl] = useState(null);

  //---METAMASK AND ETHERS STUFF---//

  //set up contract
  let { ethereum } = window;
  let provider = null;
  let levelContract = null;
  let noteContract = null;
  if(ethereum) {
    provider = new ethers.providers.Web3Provider(ethereum);
    levelContract = new ethers.Contract(contractAddress, levelAbi.abi, provider);
    //noteContract = new ethers.Contract(testNOTEAddr, erc20Abi, provider);
  }
  //connect wallet
  const checkWalletConnection = async () => {
    const { ethereum } = window;
    if(!ethereum) {
        console.log("You need to have Metamask installed!");
        return;
    } else {
        console.log("Metamask is installed.");
    }

    const accounts = await ethereum.request({method: "eth_accounts" });

    if(accounts.length > 0) {
        const account = accounts[0];
        setAccount(account);
    }
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: cantoChainID }], // 7701 in hex (Canto Testnet) 
    });
    
    return account;
}

//check to see if the address already created a level
const getNFTs = async () => {
  try{
      let ownedNfts = await levelContract.tokensOfOwner(account);
      console.log(ownedNfts);
      setFirstMint(ownedNfts.length === 0);

    } catch (e) {
      console.log(e);
  }
}


    useEffect(() => {
        let newAccount = checkWalletConnection();
        if(newAccount)
        {
            getNFTs();
        }
    }, [account])

    //mint the level
const mintLevel = async () => {
  try{
      const { ethereum } = window;
  if(ethereum) {
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(contractAddress, levelAbi.abi, signer);
         if(firstMint)
         {
          let nftTxn = await nftContract.mint();
          
          await nftTxn.wait();
          console.log(nftTxn);


          let mintId = await nftContract.highestTokenId(account);
          console.log("Just minted level #" + mintId);
          setTokenId(mintId);
          if(mintId)
          {
            setFirstMint(false);
            //if the mint was a success, upload all the data for the level
           
          }
         }
         else{
          alert("Sorry, pal, I can't give credit. Come back when you're a little, mmm... RICHER!");
          //console.log(balanceInNOTE);
         }
  }

  } catch(e) {
      console.log(e);
  }

}
//---END METAMASK AND ETHERS STUFF---//



//---STORAGE STUFF---//

useEffect(() => {
  if (NFTJson && uploading) {
    handleUpload("json", tokenId, JSON.stringify(NFTJson));
    setUploading(false);

            NFTJson.data = levelUrl;
            console.log(NFTJson.data);
            let uploadsuccess = handleUpload("json", tokenId, JSON.stringify(NFTJson));
  }
}, [NFTJson, uploading]);

useEffect(() => {
  console.log("pog");
  if(levelUrl)
  {
    setUploading(true);
  }
},[levelUrl]);

useEffect(() => {
  console.log("checking...")
  console.log(levelJson);
  console.log(tokenId);
  if(levelJson && tokenId)
  {
    console.log("checked")
    //let imgURL = handleUpload("LevelIMG", tokenId + ".png", levelIMG);
    let url = handleUpload("Level", tokenId + ".json", JSON.stringify(levelJson));
    setLevelUrl(url);
  }
}, [tokenId, levelJson]);

//upload to firebase bucket
const handleUpload = async (folder, fileName, file) => {
  const storageRef = ref(storage, `/${folder}/${fileName}`);

  const blob = new Blob([file], { type: "application/json" });

  const uploadTask = uploadBytesResumable(storageRef, blob);
  console.log(blob);
  uploadTask.on("state_changed", (snapshot) => {
   const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
  }, (err) => console.log(err),
  () => {
   getDownloadURL(uploadTask.snapshot.ref)
   .then(url => {
     console.log("url:  " + url);
     return url;
   })
  }
  )
 }

  const UploadNFTJson = async (jsonString) => {
    const parsedJson = JSON.parse(jsonString);
    setNFTJson(parsedJson);
    console.log(NFTJson);
    //handleUpload("json", tokenId, JSON.stringify(parsedJson));
  };

  const UploadLevelData = async (jsonString) => {
    const parsedJson = JSON.parse(jsonString);
    setLevelJson(parsedJson);
    //handleUpload("Level", tokenId + ".json", JSON.stringify(parsedJson));
  };

  const UploadPNGData = async (levelImage) => {
    const response = await fetch(levelImage);
    const imageBlob = await response.blob();
    setLevelIMG(imageBlob);
    //handleUpload("LevelIMG", tokenId + ".png", imageBlob);
  };

  //get all json files from json folder
  const GetAllLevels = async () => {
    const folderRef = ref(storage, "json");
  
    // array to hold the JSON strings
    const jsonArray = [];
  
    // loop through the files in the folder
    const result = await listAll(folderRef);
  
    // map each item to a promise that returns a JSON string
    const promises = result.items.map(async (itemRef) => {
      const url = await getDownloadURL(ref(storage, "json/" + itemRef.name));
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsText(blob);
      return new Promise((resolve, reject) => {
        reader.onloadend = function () {
          const jsonString = reader.result;
          console.log(JSON.parse(jsonString));
          jsonArray.push(JSON.parse(jsonString));
  
          // check if all JSON files have been processed
          if (jsonArray.length === result.items.length) {
            // resolve the promise with the jsonArray
            resolve(jsonArray);
          }
        };
      });
    });
  
    // wait for all promises to resolve
    const results = await Promise.all(promises);
  
    // combine all JSON strings into a single JSON string
    const combinedJson = results.flat();
  
    // return the combined JSON string
    return JSON.stringify(combinedJson);
  };
  //---END STORAGE STUFF---//


  //window bindings for jslib
  window.GetAllLevels = GetAllLevels;
  window.checkWalletConnection = checkWalletConnection;
  window.mintLevel = mintLevel;
  window.UploadNFTJson = UploadNFTJson;
  window.UploadPNGData = UploadPNGData;
  window.UploadLevelData = UploadLevelData;
  
  return (
    <div>
      <UnityPlayer />
    </div>
  );
};

export default App;