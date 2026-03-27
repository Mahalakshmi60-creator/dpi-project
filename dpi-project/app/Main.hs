{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE BlockArguments #-}

import Web.Scotty
import Network.Wai.Middleware.Static
import Network.HTTP.Types.Status (status400)
import Data.Aeson
import GHC.Generics
import qualified Data.ByteString.Lazy as B
import System.Directory (doesFileExist)
import Control.Monad.IO.Class (liftIO)

data DPIInput = DPIInput
  { city           :: String
  , infrastructure :: Double
  , healthcare     :: Double
  , emergency      :: Double
  , awareness      :: Double
  , resources      :: Double
  , scenario       :: String
  } deriving (Show, Generic)

instance FromJSON DPIInput
instance ToJSON DPIInput

filePath :: FilePath
filePath = "cities.json"

main :: IO ()
main = scotty 3000 $ do

  middleware $ staticPolicy (addBase "static")

  get "/" $
    file "static/index.html"

  get "/cities" $ do
    exists <- liftIO $ doesFileExist filePath
    if exists
      then do
        content <- liftIO $ B.readFile filePath
        raw content
      else json ([] :: [DPIInput])

  post "/calculate" $ do
    bodyData <- body

    case decode bodyData :: Maybe DPIInput of
      Nothing -> do
        status status400
        json $ object ["error" .= ("Invalid JSON" :: String)]

      Just input -> do

        let (w1,w2,w3,w4,w5) = adjustWeights (scenario input)

        let dpiScore =
              (w1 * infrastructure input) +
              (w2 * healthcare input) +
              (w3 * emergency input) +
              (w4 * awareness input) +
              (w5 * resources input)

        let probability = riskProbability dpiScore

        let category :: String
            category =
              if dpiScore < 40 then "Low Preparedness"
              else if dpiScore < 70 then "Moderate Preparedness"
              else "High Preparedness"

        liftIO $ saveCity input

        json $ object
          [ "dpiScore" .= dpiScore
          , "category" .= category
          , "riskProbability" .= probability
          ]

adjustWeights :: String -> (Double,Double,Double,Double,Double)
adjustWeights "Flood"      = (0.20,0.25,0.20,0.15,0.20)
adjustWeights "Earthquake" = (0.30,0.20,0.25,0.10,0.15)
adjustWeights "Cyclone"    = (0.25,0.20,0.20,0.15,0.20)
adjustWeights _            = (0.25,0.20,0.20,0.15,0.20)

riskProbability :: Double -> Double
riskProbability score = 100 - score

saveCity :: DPIInput -> IO ()
saveCity input = do
  exists <- doesFileExist filePath
  if exists
    then do
      content <- B.readFile filePath
      case decode content of
        Just cities -> B.writeFile filePath (encode (input : cities))
        Nothing     -> B.writeFile filePath (encode [input])
    else B.writeFile filePath (encode [input])