import fs from "fs";
import path from "path";

const storeFilePath = path.resolve("server/src/data/store.json");

// Helper function to read data from the store file
function readStoreFile() {
  try {
    const rawdata = fs.readFileSync(storeFilePath, "utf-8");
    const data = JSON.parse(rawdata);
    return data; // Parse the data into an object
  } catch (error) {
    console.error("Error reading the store file:", error);
    console.log("Error reading the store file:", error);
    // return { orders: [], outbox: [], telemetry: [], pushSubscription: null }; // Return default structure if file doesn't exist
    return { orders: [] }; // Return default structure if file doesn't exist
  }
}

// Helper function to write data to the store file
function writeStoreFile(data) {
  try {
    fs.writeFileSync(storeFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to the store file:", error);
    console.log("Error writing to the store file:", error);
  }
}

// Initialize store by reading from file
let store = readStoreFile();

// Function to update store after any changes
function updateStore(newData) {
  store = newData;
  writeStoreFile(store); // Write the updated store to the file
}

// Export store and updateStore function
export { store, updateStore };
