import "./App.css";

function App() {
  const scanPage = () => {

  }
  return (
    <>
      <h1>Policy Analyzer</h1>
      <p>
        The extension read your page, finds the privacy policy and analyzes it.
      </p>
      <div className="card">
        <button onClick={scanPage}>Scan Page</button>
      </div>
    </>
  );
}

export default App;
