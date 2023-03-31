import { React, useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";



function UnityPlayer() {
  const { unityProvider, sendMessage, addEventListener, removeEventListener } = useUnityContext({
    loaderUrl: "build/react.loader.js",
    dataUrl: "build/react.data",
    frameworkUrl: "build/react.framework.js",
    codeUrl: "build/react.wasm",
  });
  
  const [json, setJson] = useState(null);

 

 // useEffect(() => {
//
//    addEventListener("UploadNFTJson", UploadNFTJson);
//
//    return () => {
//      removeEventListener("UploadNFTJson", UploadNFTJson);
//    };
//  }, [unityProvider]);


  return (
      <Unity unityProvider={unityProvider} 
        style={{ width: '100%' }}
      />
  );
}

export default UnityPlayer;