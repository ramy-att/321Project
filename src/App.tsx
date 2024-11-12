import { useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<"error" | "found" | "not found" | "">("");
  const [response, setResponse] = useState("");

  const scanPrivacyPolicy = async (policy: string) => {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VITE_API_KEY}`,
    };

    const body = JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: `Analyze the following privacy policy and give a score to each category the policy mentions, use good formatting: ${policy}`,
        },
      ],
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
      });

      const data = await response.json();
      setState("found");
      setResponse(data.choices[0].message.content);
    } catch (error) {
      setState("error");
    }
  };

  const findPrivacyPolicy = () => {
    const links = Array.from(
      document.querySelectorAll(
        "a, h1, h2, p, [class*='policy'], [id*='policy']"
      )
    ).filter((element) =>
      element.textContent?.toLowerCase().includes("privacy policy")
    );
    if (links.length > 0) {
      const allTextContent = document.body.innerText; // Collects all text on the page
      scanPrivacyPolicy(allTextContent);
    } else {
      setState("not found");
    }
  };

  const scanPage = () => {
    setIsScanning(true);
    findPrivacyPolicy();
  };

  const reset = () => {
    setState("");
    setResponse("");
    setIsScanning(false)
  };

  return (
    <div className="extension">
      {state === "found" && response ? (
        <div>
          <p className="goBack" onClick={reset}>{"<- Go Back"}</p>
          <div className="card">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      ) : state === "not found" ? (
        <p>No privacy policy found on this page.</p>
      ) : (
        <div>
          <h1 className="title">Policy Analyzer</h1>
          <p>
            The extension read your page, finds the privacy policy and analyzes
            it.
          </p>
          <div className="card">
            <button onClick={scanPage}>
              {isScanning ? "Scanning..." : "Scan Page"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
