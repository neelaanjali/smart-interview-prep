import { db } from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";
import { API_BASE } from "./api/base";



function App() {
  const testFirestore = async () => {
    await addDoc(collection(db, "testCollection"), {
      message: "Firebase is working!",
      createdAt: new Date(),
    });
    alert("Data sent to Firestore!");
  };

  async function testBackend() {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    console.log(res)
    console.log(data);
  }

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
        <button onClick={testBackend}>Backend</button>
      </div>
    </div>
  );
}

export default App;
