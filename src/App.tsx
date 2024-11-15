import { useEffect, useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<"error" | "found" | "not found" | "">("");
  const [response, setResponse] = useState("");
  const [link, setLink] = useState("");

  const scanPrivacyPolicy = async (url: string) => {
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VITE_API_KEY}`,
    };

    const body = JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: `Detect if this page is a privacy policy page: ${url}. If there is no privacy policy on the page just say: "No privacy policy detected.",
          do not try to summerize anything else.
          If it is a privacy policy page, analyze the privacy police and give a score to each category the policy mentions,
          use markdown formatting. Name the url being accessed at the top, then show each category and it's score clearly
          and a description underneath eacth category explanining more.`,
        },
      ],
    });

    try {
      const response = await fetch(apiUrl, {
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

  const findPrivacyPolicy = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabUrl = tab?.url as string;

    if (activeTabUrl && tab.id) {
      let found = false;
      let relevantTexts: HTMLElement[] = [];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [activeTabUrl],
        func: (activeTabUrl) => {
          const privacyKeywords = [
            "privacy policy",
            "data policy",
            "data protection policy",
            "privacy statement",
            "policy agreement",
            "privacy agreement",
            "data privacy",
            "data protection",
            "personal information",
          ];

          relevantTexts = Array.from(
            document.querySelectorAll("a, h1, h2, span")
          ) as HTMLElement[];

          found = relevantTexts.some((t) =>
            privacyKeywords.some((keyword) =>
              t.innerText?.toLowerCase().includes(keyword)
            )
          );
          chrome.runtime.sendMessage({ found, activeTabUrl });
        },
      });
    }
  };

  const scanPage = () => {
    setIsScanning(true);
    findPrivacyPolicy();
  };

  const submitLink = () => {
    scanPrivacyPolicy(link);
  };

  const reset = () => {
    setState("");
    setResponse("");
    setIsScanning(false);
    setLink("");
  };

  const onChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLink(event.target.value);
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.found) {
        setState("found");
        scanPrivacyPolicy(message.activeTabUrl);
      } else {
        setState("not found");
      }
    });
  }, []);

  return (
    <div className="extension">
      {state === "found" && response ? (
        <div>
          <p className="goBack" onClick={reset}>
            {"<- Go Back"}
          </p>
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      ) : state === "not found" ? (
        <p>No privacy policy found on this page.</p>
      ) : (
        <div>
          <div>
            <h1 className="title">Policy Analyzer</h1>
            <p>
              Let the extension scan the page and analyze the privacy policy if
              there is any.
            </p>
            <div className="card">
              <button onClick={scanPage}>
                {isScanning ? "Scanning..." : "Scan Page"}
              </button>
            </div>
          </div>
          <div className="seperator-container">
            <hr className="seperator" />
            <span>Or</span>
            <hr className="seperator" />
          </div>
          <div className="second-card">
            <p>Provide a link to any privacy policy:</p>
            <div className="card">
              <textarea
                value={link}
                rows={2}
                onChange={onChangeHandler}
                className="text-area"
                placeholder="Provide a link to any privacy polic"
              />
              <button onClick={submitLink}>Analyze</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
