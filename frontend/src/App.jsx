import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

function App() {
  const testFirestore = async () => {
    await addDoc(collection(db, "testCollection"), {
      message: "Firebase is working!",
      createdAt: new Date(),
    });
    alert("Data sent to Firestore!");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <div
        style={{
          display: "inline-block",
          padding: "20px 40px",
          border: "2px solid black",
          borderRadius: "10px",
          backgroundColor: "#f5f5f5",
          marginBottom: "20px",
        }}
      >
        <h1>Smart Interview Prep</h1>
      </div>

      <div>
        <button onClick={testFirestore}>Test Firebase</button>
      </div>
    </div>
  );
}

export default App;
